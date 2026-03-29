-- Add login approval workflow for new-device sign-in confirmation.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LoginApprovalStatus') THEN
    CREATE TYPE "LoginApprovalStatus" AS ENUM (
      'PENDING',
      'APPROVED',
      'DENIED',
      'EXPIRED',
      'CONSUMED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "LoginApprovalRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "publicToken" TEXT NOT NULL,
  "requestedSessionId" TEXT NOT NULL,
  "currentSessionId" TEXT NOT NULL,
  "status" "LoginApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "approvedAt" TIMESTAMP(3),
  "deniedAt" TIMESTAMP(3),
  "requestedIp" TEXT,
  "requestedUserAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LoginApprovalRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LoginApprovalRequest_publicToken_key"
  ON "LoginApprovalRequest"("publicToken");

CREATE INDEX IF NOT EXISTS "LoginApprovalRequest_userId_status_expiresAt_idx"
  ON "LoginApprovalRequest"("userId", "status", "expiresAt");

CREATE INDEX IF NOT EXISTS "LoginApprovalRequest_userId_currentSessionId_status_idx"
  ON "LoginApprovalRequest"("userId", "currentSessionId", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'LoginApprovalRequest_userId_fkey'
      AND table_name = 'LoginApprovalRequest'
  ) THEN
    ALTER TABLE "LoginApprovalRequest"
    ADD CONSTRAINT "LoginApprovalRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
