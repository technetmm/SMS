import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession } from "next-auth/next";
import { randomUUID } from "crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/client";
import { SESSION_LOCK_ERROR_CODE, SESSION_LOCK_TTL_MS } from "@/lib/auth/session-lock";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type SessionLockState = {
  activeSessionId: string | null;
  activeSessionExpiresAt: Date | null;
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            schoolId: true,
            isSchoolOwner: true,
            passwordHash: true,
          },
        });

        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );

        if (!isValid) return null;

        const now = new Date();
        const sessionId = randomUUID();
        const activeSessionExpiresAt = new Date(now.getTime() + SESSION_LOCK_TTL_MS);

        const locked = await (prisma.user as unknown as {
          updateMany: (args: unknown) => Promise<{ count: number }>;
        }).updateMany({
          where: {
            id: user.id,
            OR: [
              { activeSessionId: null },
              { activeSessionExpiresAt: null },
              { activeSessionExpiresAt: { lte: now } },
            ],
          },
          data: {
            activeSessionId: sessionId,
            activeSessionExpiresAt,
          },
        });

        if (locked.count === 0) {
          throw new Error(SESSION_LOCK_ERROR_CODE);
        }

        return {
          ...user,
          sessionId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.schoolId = user.schoolId ?? null;
        token.isSchoolOwner =
          (user as typeof user & { isSchoolOwner?: boolean }).isSchoolOwner ?? false;
        token.sessionId = (user as typeof user & { sessionId?: string }).sessionId;
        return token;
      }

      const tokenUserId = typeof token.id === "string" ? token.id : null;
      const tokenSessionId = typeof token.sessionId === "string" ? token.sessionId : null;

      if (!tokenUserId || !tokenSessionId) {
        return token;
      }

      const dbUser = (await (prisma.user as unknown as {
        findUnique: (args: unknown) => Promise<SessionLockState | null>;
      }).findUnique({
        where: { id: tokenUserId },
        select: {
          activeSessionId: true,
          activeSessionExpiresAt: true,
        },
      })) as SessionLockState | null;

      const now = new Date();
      const isExpired =
        !dbUser?.activeSessionExpiresAt || dbUser.activeSessionExpiresAt.getTime() <= now.getTime();
      const isMismatch = !dbUser?.activeSessionId || dbUser.activeSessionId !== tokenSessionId;

      if (isExpired || isMismatch) {
        if (dbUser?.activeSessionId === tokenSessionId) {
          await (prisma.user as unknown as {
            updateMany: (args: unknown) => Promise<{ count: number }>;
          }).updateMany({
            where: { id: tokenUserId, activeSessionId: tokenSessionId },
            data: {
              activeSessionId: null,
              activeSessionExpiresAt: null,
            },
          });
        }

        delete token.id;
        delete token.role;
        delete token.schoolId;
        delete token.isSchoolOwner;
        delete token.sessionId;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = token.role as typeof session.user.role;
        session.user.schoolId = token.schoolId as string | null;
        session.user.isSchoolOwner = Boolean(token.isSchoolOwner);
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      const tokenUserId = typeof token?.id === "string" ? token.id : null;
      if (!tokenUserId) return;

      const tokenSessionId = typeof token.sessionId === "string" ? token.sessionId : null;

      if (tokenSessionId) {
        await (prisma.user as unknown as {
          updateMany: (args: unknown) => Promise<{ count: number }>;
        }).updateMany({
          where: { id: tokenUserId, activeSessionId: tokenSessionId },
          data: {
            activeSessionId: null,
            activeSessionExpiresAt: null,
          },
        });
        return;
      }

      await (prisma.user as unknown as {
        updateMany: (args: unknown) => Promise<{ count: number }>;
      }).updateMany({
        where: { id: tokenUserId },
        data: {
          activeSessionId: null,
          activeSessionExpiresAt: null,
        },
      });
    },
  },
};

export async function getServerAuth() {
  return getServerSession(authOptions);
}

const handler = NextAuth(authOptions);
export { handler };
