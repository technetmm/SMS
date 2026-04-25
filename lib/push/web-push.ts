import webpush from "web-push";

let isConfigured = false;

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export type StoredPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function configureWebPush() {
  if (isConfigured) return;

  const publicKey = requireEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  const privateKey = requireEnv("VAPID_PRIVATE_KEY");
  const contactEmail = process.env.VAPID_CONTACT_EMAIL?.trim() || "mailto:support@example.com";

  webpush.setVapidDetails(contactEmail, publicKey, privateKey);
  isConfigured = true;
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
}

export async function sendWebPushNotification(
  subscription: StoredPushSubscription,
  payload: Record<string, unknown>,
) {
  configureWebPush();

  return webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    JSON.stringify(payload),
    { TTL: 120 },
  );
}
