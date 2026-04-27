import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getToken } from "next-auth/jwt";
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
} from "@/lib/auth/device-approval";
import {
  buildEmailVerificationIdentifier,
  buildVerificationEmailBody,
  buildVerificationEmailSubject,
  EMAIL_NOT_VERIFIED_CODE,
  EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
  EMAIL_VERIFICATION_TTL_MS,
  generateEmailVerificationCode,
  hashEmailVerificationCode,
  requiresEmailVerification,
} from "@/lib/auth/email-verification";
import {
  clearPendingDeviceApprovalsForUser,
  expirePendingDeviceApprovalsForUser,
} from "@/lib/auth/device-approval-lifecycle";
import { sendDeviceApprovalRequestPushNotifications } from "@/lib/auth/device-approval-push";
import {
  TWO_FACTOR_INVALID_CODE,
  TWO_FACTOR_REQUIRED_CODE,
  verifyTwoFactorToken,
} from "@/lib/auth/2fa";
import {
  SESSION_LOCK_ERROR_CODE,
  SESSION_LOCK_TTL_MS,
} from "@/lib/auth/session-lock";
import {
  shouldRefreshSession,
  isSessionInactive,
} from "@/lib/auth/session-security";
import { resolveAuthSecret } from "@/lib/auth/env";
import { processEmailJob } from "@/lib/jobs/email.job";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  approvalToken: z.string().optional(),
  twoFactorToken: z.string().optional(),
});

function normalizeOptionalCredential(value: string | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized === String(undefined) || normalized === String(null)) {
    return null;
  }
  return normalized;
}

function resolveTwoFactorError(input: {
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  providedToken: string | null;
}) {
  if (!input.twoFactorEnabled || !input.twoFactorSecret) {
    return null;
  }

  if (!input.providedToken) {
    return TWO_FACTOR_REQUIRED_CODE;
  }

  const isValid = verifyTwoFactorToken({
    token: input.providedToken,
    secret: input.twoFactorSecret,
  });

  return isValid ? null : TWO_FACTOR_INVALID_CODE;
}

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
        twoFactorToken: { label: "Two Factor Token", type: "text" },
      },
      async authorize(credentials, req) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const approvalToken = normalizeOptionalCredential(
          parsed.data.approvalToken,
        );
        const twoFactorToken = normalizeOptionalCredential(
          parsed.data.twoFactorToken,
        );

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
            twoFactorSecret: true,
            twoFactorEnabled: true,
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

        if (
          requiresEmailVerification({
            role: user.role,
            emailVerifiedAt: user.emailVerifiedAt,
            passwordHash: user.passwordHash,
          })
        ) {
          const identifier = buildEmailVerificationIdentifier(user.id);
          const latestToken = await prisma.verificationToken.findFirst({
            where: { identifier },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          });

          const ageMs = latestToken
            ? Date.now() - latestToken.createdAt.getTime()
            : Number.POSITIVE_INFINITY;

          if (ageMs >= EMAIL_VERIFICATION_RESEND_COOLDOWN_MS) {
            const verificationCode = generateEmailVerificationCode();
            const verificationTokenHash =
              await hashEmailVerificationCode(verificationCode);
            const verificationExpiresAt = new Date(
              Date.now() + EMAIL_VERIFICATION_TTL_MS,
            );

            await prisma.verificationToken.create({
              data: {
                identifier,
                token: verificationTokenHash,
                expires: verificationExpiresAt,
              },
            });

            try {
              const school = user.schoolId
                ? await prisma.tenant.findFirst({
                    where: { id: user.schoolId },
                    select: { name: true },
                  })
                : null;

              await processEmailJob({
                to: user.email,
                subject: buildVerificationEmailSubject(),
                body: buildVerificationEmailBody({
                  userName: user.name ?? "User",
                  schoolName: school?.name ?? null,
                  code: verificationCode,
                }),
              });

              await prisma.verificationToken.deleteMany({
                where: {
                  identifier,
                  token: { not: verificationTokenHash },
                },
              });
            } catch (error) {
              console.error("authorize processEmailJob failed", {
                email: user.email,
                error,
              });
            }
          }

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

        if (user.role !== "SUPER_ADMIN" && approvalToken) {
          const approvalRequest = await prisma.loginApprovalRequest.findUnique({
            where: { publicToken: approvalToken },
            select: {
              id: true,
              publicToken: true,
              userId: true,
              status: true,
              currentSessionId: true,
              requestedSessionId: true,
            },
          });

          if (!approvalRequest || approvalRequest.userId !== user.id) {
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

          const twoFactorError = resolveTwoFactorError({
            twoFactorEnabled: user.twoFactorEnabled,
            twoFactorSecret: user.twoFactorSecret,
            providedToken: twoFactorToken,
          });
          if (twoFactorError) {
            throw new Error(twoFactorError);
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
          const twoFactorError = resolveTwoFactorError({
            twoFactorEnabled: user.twoFactorEnabled,
            twoFactorSecret: user.twoFactorSecret,
            providedToken: twoFactorToken,
          });
          if (twoFactorError) {
            throw new Error(twoFactorError);
          }

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

          const twoFactorError = resolveTwoFactorError({
            twoFactorEnabled: user.twoFactorEnabled,
            twoFactorSecret: user.twoFactorSecret,
            providedToken: twoFactorToken,
          });
          if (twoFactorError) {
            throw new Error(twoFactorError);
          }

          return {
            ...user,
            sessionId,
          };
        }

        const existingSessionToken = await getToken({
          req: req as Parameters<typeof getToken>[0]["req"],
          secret: resolveAuthSecret(),
        });
        const existingSessionId =
          typeof existingSessionToken?.sessionId === "string"
            ? existingSessionToken.sessionId
            : null;
        const isSameBrowserSessionReclaim =
          Boolean(existingSessionId) &&
          Boolean(user.activeSessionId) &&
          existingSessionId === user.activeSessionId;

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

          const twoFactorError = resolveTwoFactorError({
            twoFactorEnabled: user.twoFactorEnabled,
            twoFactorSecret: user.twoFactorSecret,
            providedToken: twoFactorToken,
          });
          if (twoFactorError) {
            throw new Error(twoFactorError);
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
          },
          orderBy: { createdAt: "desc" },
          select: { publicToken: true },
        });

        if (existingPending) {
          throw new Error(
            buildDeviceApprovalError(existingPending.publicToken),
          );
        }

        const publicToken = randomUUID();

        const approvalRequest = await prisma.loginApprovalRequest.create({
          data: {
            userId: user.id,
            publicToken,
            requestedSessionId: sessionId,
            currentSessionId: user.activeSessionId,
            status: "PENDING",
            expiresAt: now,
            requestedIp,
            requestedUserAgent,
          },
          select: {
            id: true,
          },
        });

        try {
          await sendDeviceApprovalRequestPushNotifications(prisma, {
            requestId: approvalRequest.id,
            requestedByUserId: user.id,
            requestedByUserRole: user.role,
            requestedBySchoolId: user.schoolId ?? null,
          });
        } catch (error) {
          // Do not block device-approval flow if push delivery fails.
          console.error(
            "Failed to dispatch device-approval push notification",
            {
              requestId: approvalRequest.id,
              userId: user.id,
              error,
            },
          );
        }

        throw new Error(buildDeviceApprovalError(publicToken));
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
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
        token.lastActivity = new Date().toISOString();
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
          activeSessionUserAgent: true,
          activeSessionIp: true,
        },
      })) as SessionLockState | null;

      const now = new Date();
      const lastActivity = token.lastActivity
        ? new Date(String(token.lastActivity))
        : now;

      // Check for inactivity timeout
      if (isSessionInactive(lastActivity, now)) {
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
        delete token.lastActivity;
        return token;
      }

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
        delete token.lastActivity;
        return token;
      }

      // Implement sliding session expiration
      if (
        shouldRefreshSession(dbUser.activeSessionExpiresAt!, lastActivity, now)
      ) {
        const newExpiresAt = new Date(now.getTime() + SESSION_LOCK_TTL_MS);

        await (
          prisma.user as unknown as {
            updateMany: (args: unknown) => Promise<{ count: number }>;
          }
        ).updateMany({
          where: { id: tokenUserId, activeSessionId: tokenSessionId },
          data: {
            activeSessionExpiresAt: newExpiresAt,
          },
        });
      }

      // Update last activity on every token refresh (user interaction)
      if (trigger === "update" || session) {
        token.lastActivity = now.toISOString();
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
