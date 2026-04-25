import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push/web-push";

export async function GET() {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({ publicKey });
}
