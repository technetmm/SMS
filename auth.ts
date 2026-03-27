import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/client";
import { UserRole } from "@/app/generated/prisma/enums";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

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
          where: { email: parsed.data.email },
        });

        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );

        if (!isValid) return null;

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.schoolId = user.schoolId ?? null;
      }

      if (token.id && token.role) {
        if (
          token.role === UserRole.SUPER_ADMIN ||
          token.role === UserRole.SCHOOL_ADMIN
        ) {
          token.permissions = ["*"];
        } else {
          const roleAssignments = await prisma.userRoleAssignment.findMany({
            where: {
              userId: String(token.id),
            },
            select: {
              role: {
                select: {
                  permissions: {
                    select: {
                      permission: {
                        select: { key: true },
                      },
                    },
                  },
                },
              },
            },
          });

          token.permissions = Array.from(
            new Set([
              ...roleAssignments.flatMap((assignment) =>
                assignment.role.permissions.map((item) => item.permission.key),
              ),
            ]),
          );
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = token.role as typeof session.user.role;
        session.user.schoolId = token.schoolId as string | null;
        session.user.permissions = (token.permissions as string[]) ?? [];
      }
      return session;
    },
  },
};

export async function getServerAuth() {
  return getServerSession(authOptions);
}

const handler = NextAuth(authOptions);
export { handler };
