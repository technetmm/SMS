import { randomUUID } from "crypto";
import { Plan, SubscriptionStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { logAction } from "@/lib/audit-log";

export async function createOrUpdateSubscription({
  schoolId,
  plan,
  status = SubscriptionStatus.ACTIVE,
  currentPeriodEnd,
}: {
  schoolId: string;
  plan: Plan;
  status?: SubscriptionStatus;
  currentPeriodEnd?: Date;
}) {
  await prisma.subscription.updateMany({
    where: { schoolId, isActive: true },
    data: {
      isActive: false,
      status: SubscriptionStatus.CANCELED,
    },
  });

  const subscription = await prisma.subscription.create({
    data: {
      schoolId,
      stripeCustomerId: `cus_${randomUUID().replace(/-/g, "").slice(0, 18)}`,
      stripeSubscriptionId: `sub_${randomUUID().replace(/-/g, "").slice(0, 18)}`,
      plan,
      status,
      isActive: status === SubscriptionStatus.ACTIVE,
      currentPeriodEnd:
        currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await logAction({
    action: "UPDATE",
    entity: "Subscription",
    entityId: subscription.id,
    schoolId,
    metadata: { plan, status, isActive: subscription.isActive },
  });

  return subscription;
}
