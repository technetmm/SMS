import { Prisma } from "@/app/generated/prisma/client";

export type NotificationClient = {
  notification: {
    upsert: (args: {
      where: { sourceKey: string };
      update: Record<string, never>;
      create: {
        userId: string;
        type: string;
        title: string;
        message: string;
        sourceKey: string;
        metadata?: Prisma.InputJsonValue;
      };
    }) => Promise<unknown>;
  };
};

export async function createNotification(
  db: NotificationClient,
  input: {
    userId: string;
    type: string;
    title: string;
    message: string;
    sourceKey: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  await db.notification.upsert({
    where: { sourceKey: input.sourceKey },
    update: {},
    create: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      sourceKey: input.sourceKey,
      metadata: input.metadata,
    },
  });
}
