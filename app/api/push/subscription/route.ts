import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma/client";

type PushSubscriptionBody = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

function parseBody(value: unknown): PushSubscriptionBody {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as PushSubscriptionBody;
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });
  const userId = typeof token?.id === "string" ? token.id : null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = parseBody(await request.json().catch(() => null));
  const endpoint = payload.endpoint?.trim();
  const p256dh = payload.keys?.p256dh?.trim();
  const auth = payload.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId,
      p256dh,
      auth,
      userAgent: request.headers.get("user-agent"),
    },
    create: {
      userId,
      endpoint,
      p256dh,
      auth,
      userAgent: request.headers.get("user-agent"),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const token = await getToken({ req: request });
  const userId = typeof token?.id === "string" ? token.id : null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = parseBody(await request.json().catch(() => null));
  const endpoint = payload.endpoint?.trim();

  if (endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  } else {
    await prisma.pushSubscription.deleteMany({
      where: { userId },
    });
  }

  return NextResponse.json({ success: true });
}
