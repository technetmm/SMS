import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession } from "next-auth/next";
import { randomUUID } from "crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/client";
import {
  buildDeviceApprovalError,
  DEVICE_APPROVAL_DENIED_CODE,
  DEVICE_APPROVAL_EXPIRED_CODE,
  DEVICE_APPROVAL_TTL_MS,
} from "@/lib/auth/device-approval";
import { EMAIL_NOT_VERIFIED_CODE } from "@/lib/auth/email-verification";
import {
  clearPendingDeviceApprovalsForUser,
  expirePendingDeviceApprovalsForUser,
  finalizeDeviceApprovalRequest,
} from "@/lib/auth/device-approval-lifecycle";
import {
  SESSION_LOCK_ERROR_CODE,
  SESSION_LOCK_TTL_MS,
} from "@/lib/auth/session-lock";
import { resolveAuthSecret } from "@/lib/auth/env";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  approvalToken: z.string().optional(),
});

type SessionLockState = {
  activeSessionId: string | null;
  activeSessionExpiresAt: Date | null;
};

function getHeaderValue(req: unknown, headerName: string) {
  const request = req as
    | { headers?: Headers | Record<string, string | string[] | undefined> }
    | undefined;
  if (!request?.headers) return null;
  if (request.headers instanceof Headers) {
    return request.headers.get(headerName);
  }
  const key = headerName.toLowerCase();
  const value = request.headers[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === "string" ? value : null;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: resolveAuthSecret(),
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        approvalToken: { label: "Approval Token", type: "text" },
      },
      async authorize(credentials, req) {
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
            emailVerifiedAt: true,
            passwordHash: true,
            activeSessionId: true,
            activeSessionExpiresAt: true,
            activeSessionUserAgent: true,
            activeSessionIp: true,
          },
        });

        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );

        if (!isValid) return null;

        if (user.role === "SCHOOL_ADMIN" && !user.emailVerifiedAt) {
          throw new Error(EMAIL_NOT_VERIFIED_CODE);
        }

        const now = new Date();
        const xForwardedFor = getHeaderValue(req, "x-forwarded-for");
        const requestedIp = xForwardedFor?.split(",")[0]?.trim() ?? null;
        const requestedUserAgent = getHeaderValue(req, "user-agent");
        const hasActiveSession =
          Boolean(user.activeSessionId) &&
          Boolean(user.activeSessionExpiresAt) &&
          user.activeSessionExpiresAt &&
          user.activeSessionExpiresAt.getTime() > now.getTime();

        if (
          user.role !== "SUPER_ADMIN" &&
          parsed.data.approvalToken &&
          parsed.data.approvalToken !== String(undefined) &&
          parsed.data.approvalToken !== String(null)
        ) {
          const approvalRequest = await prisma.loginApprovalRequest.findUnique({
            where: { publicToken: parsed.data.approvalToken },
            select: {
              id: true,
              publicToken: true,
              userId: true,
              status: true,
              currentSessionId: true,
              requestedSessionId: true,
              expiresAt: true,
            },
          });

          if (!approvalRequest || approvalRequest.userId !== user.id) {
            throw new Error(DEVICE_APPROVAL_EXPIRED_CODE);
          }

          if (approvalRequest.expiresAt.getTime() <= now.getTime()) {
            await finalizeDeviceApprovalRequest(prisma, {
              requestId: approvalRequest.id,
              userId: user.id,
              outcome: "EXPIRED",
              now,
            });
            throw new Error(DEVICE_APPROVAL_EXPIRED_CODE);
          }

          if (approvalRequest.status === "DENIED") {
            throw new Error(DEVICE_APPROVAL_DENIED_CODE);
          }

          if (
            approvalRequest.status === "EXPIRED" ||
            approvalRequest.status === "CONSUMED"
          ) {
            throw new Error(DEVICE_APPROVAL_EXPIRED_CODE);
          }

          if (approvalRequest.status !== "APPROVED") {
            throw new Error(
              buildDeviceApprovalError(approvalRequest.publicToken),
            );
          }

          if (
            user.activeSessionId !== approvalRequest.requestedSessionId ||
            !user.activeSessionExpiresAt ||
            user.activeSessionExpiresAt.getTime() <= now.getTime()
          ) {
            throw new Error(DEVICE_APPROVAL_EXPIRED_CODE);
          }

          const consumed = await prisma.loginApprovalRequest.updateMany({
            where: { id: approvalRequest.id, status: "APPROVED" },
            data: {
              status: "CONSUMED",
            },
          });

          if (consumed.count === 0) {
            throw new Error(DEVICE_APPROVAL_EXPIRED_CODE);
          }

          return {
            ...user,
            sessionId: approvalRequest.requestedSessionId,
          };
        }

        const sessionId = randomUUID();
        const activeSessionExpiresAt = new Date(
          now.getTime() + SESSION_LOCK_TTL_MS,
        );

        const locked = await (
          prisma.user as unknown as {
            updateMany: (args: unknown) => Promise<{ count: number }>;
          }
        ).updateMany({
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
            activeSessionUserAgent: requestedUserAgent,
            activeSessionIp: requestedIp,
          },
        });

        if (locked.count > 0) {
          return {
            ...user,
            sessionId,
          };
        }

        if (!hasActiveSession || !user.activeSessionId) {
          throw new Error(SESSION_LOCK_ERROR_CODE);
        }

        if (user.role === "SUPER_ADMIN") {
          await clearPendingDeviceApprovalsForUser(user.id, { now });

          const transferred = await (
            prisma.user as unknown as {
              updateMany: (args: unknown) => Promise<{ count: number }>;
            }
          ).updateMany({
            where: {
              id: user.id,
              activeSessionId: user.activeSessionId,
            },
            data: {
              activeSessionId: sessionId,
              activeSessionExpiresAt,
              activeSessionUserAgent: requestedUserAgent,
              activeSessionIp: requestedIp,
            },
          });

          if (transferred.count === 0) {
            throw new Error(SESSION_LOCK_ERROR_CODE);
          }

          return {
            ...user,
            sessionId,
          };
        }

        const isSameBrowserSessionReclaim =
          Boolean(requestedUserAgent) &&
          Boolean(user.activeSessionUserAgent) &&
          requestedUserAgent === user.activeSessionUserAgent;

        if (isSameBrowserSessionReclaim) {
          await expirePendingDeviceApprovalsForUser(user.id, {
            currentSessionId: user.activeSessionId,
            now,
          });

          const transferred = await (
            prisma.user as unknown as {
              updateMany: (args: unknown) => Promise<{ count: number }>;
            }
          ).updateMany({
            where: {
              id: user.id,
              activeSessionId: user.activeSessionId,
            },
            data: {
              activeSessionId: sessionId,
              activeSessionExpiresAt,
              activeSessionUserAgent: requestedUserAgent,
              activeSessionIp: requestedIp,
            },
          });

          if (transferred.count === 0) {
            throw new Error(SESSION_LOCK_ERROR_CODE);
          }

          return {
            ...user,
            sessionId,
          };
        }

        await expirePendingDeviceApprovalsForUser(user.id, {
          currentSessionId: user.activeSessionId,
          now,
        });

        const existingPending = await prisma.loginApprovalRequest.findFirst({
          where: {
            userId: user.id,
            currentSessionId: user.activeSessionId,
            status: "PENDING",
            expiresAt: { gt: now },
          },
          orderBy: { createdAt: "desc" },
          select: { publicToken: true },
        });

        if (existingPending) {
          throw new Error(
            buildDeviceApprovalError(existingPending.publicToken),
          );
        }

        const approvalExpiresAt = new Date(
          now.getTime() + DEVICE_APPROVAL_TTL_MS,
        );
        const publicToken = randomUUID();

        await prisma.loginApprovalRequest.create({
          data: {
            userId: user.id,
            publicToken,
            requestedSessionId: sessionId,
            currentSessionId: user.activeSessionId,
            status: "PENDING",
            expiresAt: approvalExpiresAt,
            requestedIp,
            requestedUserAgent,
          },
        });

        throw new Error(buildDeviceApprovalError(publicToken));
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
          (user as typeof user & { isSchoolOwner?: boolean }).isSchoolOwner ??
          false;
        token.sessionId = (
          user as typeof user & { sessionId?: string }
        ).sessionId;
        return token;
      }

      const tokenUserId = typeof token.id === "string" ? token.id : null;
      const tokenSessionId =
        typeof token.sessionId === "string" ? token.sessionId : null;

      if (!tokenUserId || !tokenSessionId) {
        return token;
      }

      const dbUser = (await (
        prisma.user as unknown as {
          findUnique: (args: unknown) => Promise<SessionLockState | null>;
        }
      ).findUnique({
        where: { id: tokenUserId },
        select: {
          activeSessionId: true,
          activeSessionExpiresAt: true,
        },
      })) as SessionLockState | null;

      const now = new Date();
      const isExpired =
        !dbUser?.activeSessionExpiresAt ||
        dbUser.activeSessionExpiresAt.getTime() <= now.getTime();
      const isMismatch =
        !dbUser?.activeSessionId || dbUser.activeSessionId !== tokenSessionId;

      if (isExpired || isMismatch) {
        if (dbUser?.activeSessionId === tokenSessionId) {
          await (
            prisma.user as unknown as {
              updateMany: (args: unknown) => Promise<{ count: number }>;
            }
          ).updateMany({
            where: { id: tokenUserId, activeSessionId: tokenSessionId },
            data: {
              activeSessionId: null,
              activeSessionExpiresAt: null,
              activeSessionUserAgent: null,
              activeSessionIp: null,
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

      const tokenSessionId =
        typeof token.sessionId === "string" ? token.sessionId : null;

      if (tokenSessionId) {
        await (
          prisma.user as unknown as {
            updateMany: (args: unknown) => Promise<{ count: number }>;
          }
        ).updateMany({
          where: { id: tokenUserId, activeSessionId: tokenSessionId },
          data: {
            activeSessionId: null,
            activeSessionExpiresAt: null,
            activeSessionUserAgent: null,
            activeSessionIp: null,
          },
        });
        return;
      }

      await (
        prisma.user as unknown as {
          updateMany: (args: unknown) => Promise<{ count: number }>;
        }
      ).updateMany({
        where: { id: tokenUserId },
        data: {
          activeSessionId: null,
          activeSessionExpiresAt: null,
          activeSessionUserAgent: null,
          activeSessionIp: null,
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
