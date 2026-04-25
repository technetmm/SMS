import { sendWebPushNotification } from "@/lib/push/web-push";

export type PushNotificationPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  type?: string;
  metadata?: Record<string, unknown>;
};

export type PushSubscriptionTarget = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PushDeliveryClient = {
  pushSubscription: {
    deleteMany: (args: { where: { endpoint: string } }) => Promise<{ count: number }>;
  };
};

function getPushErrorStatusCode(error: unknown) {
  if (
    typeof error === "object" &&
    error != null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
  ) {
    return (error as { statusCode: number }).statusCode;
  }

  return null;
}

export async function deliverPushPayloadToSubscriptions(
  db: PushDeliveryClient,
  input: {
    subscriptions: PushSubscriptionTarget[];
    payload: PushNotificationPayload;
  },
) {
  let sentCount = 0;
  let removedCount = 0;
  let failedCount = 0;

  for (const subscription of input.subscriptions) {
    try {
      await sendWebPushNotification(subscription, {
        title: input.payload.title,
        body: input.payload.body,
        url: input.payload.url,
        tag: input.payload.tag,
        type: input.payload.type,
        metadata: input.payload.metadata,
      });
      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      const statusCode = getPushErrorStatusCode(error);
      if (statusCode === 404 || statusCode === 410) {
        const deleted = await db.pushSubscription.deleteMany({
          where: { endpoint: subscription.endpoint },
        });
        removedCount += deleted.count;
      }
    }
  }

  return {
    sentCount,
    removedCount,
    failedCount,
  };
}
