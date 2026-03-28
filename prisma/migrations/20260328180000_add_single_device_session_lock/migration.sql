-- Add server-tracked single-device session lock fields.
ALTER TABLE "User"
ADD COLUMN "activeSessionId" TEXT,
ADD COLUMN "activeSessionExpiresAt" TIMESTAMP(3);
