"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { requireSuperAdminAccess } from "@/lib/rbac";
import { formDataToObject } from "@/lib/form-utils";
import { logAction } from "@/lib/audit-log";
import { createOrUpdateSubscription } from "@/lib/subscription";
import { Plan, SubscriptionStatus, UserRole } from "@/app/generated/prisma/enums";
import { getPaginatedPendingDeviceApprovalRows } from "@/lib/auth/device-approval-queue";
import { paginateQuery } from "@/lib/pagination";
import { containsInsensitive } from "@/lib/table-filters";

export type PlatformActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const tenantSchema = z.object({
  name: z.string().min(2, "Tenant name is required"),
  slug: z.string().min(2, "Slug is required"),
});

const tenantUpdateSchema = tenantSchema.extend({
  id: z.string().min(1, "Tenant id is required"),
  isActive: z.coerce.boolean().optional(),
});

const subscriptionSchema = z.object({
  schoolId: z.string().min(1, "Tenant is required"),
  plan: z.nativeEnum(Plan),
  status: z.nativeEnum(SubscriptionStatus),
  currentPeriodEnd: z.string().optional(),
});

const subscriptionUpdateSchema = z.object({
  id: z.string().min(1, "Subscription id is required"),
  plan: z.nativeEnum(Plan),
  status: z.nativeEnum(SubscriptionStatus),
  currentPeriodEnd: z.string().optional(),
});

export async function createTenant(
  _prevState: PlatformActionState,
  formData: FormData,
): Promise<PlatformActionState> {
  await requireSuperAdminAccess();

  const raw = formDataToObject(formData);
  const parsed = tenantSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const slug = parsed.data.slug.toLowerCase().replace(/\s+/g, "-");

  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) {
    return { status: "error", message: "Tenant slug already exists." };
  }

  await prisma.tenant.create({
    data: {
      name: parsed.data.name,
      slug,
    },
  });

  await logAction({
    action: "CREATE",
    entity: "Tenant",
    metadata: { name: parsed.data.name, slug },
  });

  revalidatePath("/platform/tenants");
  return { status: "success", message: "Tenant created." };
}

export async function updateTenant(
  _prevState: PlatformActionState,
  formData: FormData,
): Promise<PlatformActionState> {
  await requireSuperAdminAccess();

  const raw = formDataToObject(formData);
  const parsed = tenantUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const slug = parsed.data.slug.toLowerCase().replace(/\s+/g, "-");
  const existing = await prisma.tenant.findFirst({
    where: { slug, NOT: { id: parsed.data.id } },
    select: { id: true },
  });
  if (existing) {
    return { status: "error", message: "Tenant slug already exists." };
  }

  await prisma.tenant.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      slug,
      isActive: parsed.data.isActive ?? true,
    },
  });

  await logAction({
    action: "UPDATE",
    entity: "Tenant",
    entityId: parsed.data.id,
    metadata: { name: parsed.data.name, slug, isActive: parsed.data.isActive },
  });

  revalidatePath("/platform/tenants");
  revalidatePath("/platform/dashboard");
  return { status: "success", message: "Tenant updated." };
}

export async function toggleTenantStatus(formData: FormData) {
  await requireSuperAdminAccess();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Tenant id is required");
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id },
    select: { id: true, isActive: true },
  });

  if (!tenant) throw new Error("Tenant not found");

  await prisma.tenant.update({
    where: { id },
    data: { isActive: !tenant.isActive },
  });

  await logAction({
    action: "UPDATE",
    entity: "Tenant",
    entityId: id,
    metadata: { isActive: !tenant.isActive },
  });

  revalidatePath("/platform/tenants");
  revalidatePath("/platform/dashboard");
}

export async function deleteTenant(formData: FormData) {
  await requireSuperAdminAccess();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Tenant id is required");
  }

  await prisma.tenant.delete({ where: { id } });

  await logAction({
    action: "DELETE",
    entity: "Tenant",
    entityId: id,
  });

  revalidatePath("/platform/tenants");
}

export async function restoreTenant(formData: FormData) {
  await requireSuperAdminAccess();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Tenant id is required");
  }

  await prisma.tenant.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
  });

  await logAction({
    action: "RESTORE",
    entity: "Tenant",
    entityId: id,
  });

  revalidatePath("/platform/tenants");
}

export async function createSubscription(
  _prevState: PlatformActionState,
  formData: FormData,
): Promise<PlatformActionState> {
  await requireSuperAdminAccess();

  const raw = formDataToObject(formData);
  const parsed = subscriptionSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  await createOrUpdateSubscription({
    schoolId: parsed.data.schoolId,
    plan: parsed.data.plan,
    status: parsed.data.status,
    currentPeriodEnd: parsed.data.currentPeriodEnd
      ? new Date(parsed.data.currentPeriodEnd)
      : undefined,
  });

  await logAction({
    action: "CREATE",
    entity: "Subscription",
    metadata: {
      schoolId: parsed.data.schoolId,
      plan: parsed.data.plan,
      status: parsed.data.status,
    },
  });

  revalidatePath("/platform/subscriptions");
  revalidatePath("/platform/dashboard");
  return { status: "success", message: "Subscription created." };
}

export async function updateSubscription(
  _prevState: PlatformActionState,
  formData: FormData,
): Promise<PlatformActionState> {
  await requireSuperAdminAccess();

  const raw = formDataToObject(formData);
  const parsed = subscriptionUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const current = await prisma.subscription.findFirst({
    where: { id: parsed.data.id },
    select: { schoolId: true },
  });
  if (!current) {
    return { status: "error", message: "Subscription not found." };
  }

  if (parsed.data.status === SubscriptionStatus.ACTIVE) {
    await prisma.subscription.updateMany({
      where: {
        schoolId: current.schoolId,
        id: { not: parsed.data.id },
        isActive: true,
      },
      data: { isActive: false, status: SubscriptionStatus.CANCELED },
    });
  }

  await prisma.subscription.update({
    where: { id: parsed.data.id },
    data: {
      plan: parsed.data.plan,
      status: parsed.data.status,
      isActive: parsed.data.status === SubscriptionStatus.ACTIVE,
      currentPeriodEnd: parsed.data.currentPeriodEnd
        ? new Date(parsed.data.currentPeriodEnd)
        : undefined,
    },
  });

  await logAction({
    action: "UPDATE",
    entity: "Subscription",
    entityId: parsed.data.id,
    metadata: {
      plan: parsed.data.plan,
      status: parsed.data.status,
      currentPeriodEnd: parsed.data.currentPeriodEnd,
    },
  });

  revalidatePath("/platform/subscriptions");
  revalidatePath("/platform/dashboard");
  return { status: "success", message: "Subscription updated." };
}

export async function cancelSubscription(formData: FormData) {
  await requireSuperAdminAccess();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Subscription id is required");
  }

  await prisma.subscription.update({
    where: { id },
    data: { status: SubscriptionStatus.CANCELED, isActive: false },
  });

  await logAction({
    action: "UPDATE",
    entity: "Subscription",
    entityId: id,
    metadata: { status: SubscriptionStatus.CANCELED },
  });

  revalidatePath("/platform/subscriptions");
  revalidatePath("/platform/dashboard");
}

export async function getTenants() {
  await requireSuperAdminAccess();
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, students: true, staff: true } },
    },
  });
}

export type TenantTableFilters = {
  q?: string;
  plan?: Plan;
  isActive?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
};

export async function getPaginatedTenants({
  page,
  filters,
}: {
  page: number;
  filters?: TenantTableFilters;
}) {
  await requireSuperAdminAccess();
  const where: Record<string, unknown> = {};

  if (filters?.plan) where.plan = filters.plan;
  if (filters?.isActive != null) where.isActive = filters.isActive;
  if (filters?.createdFrom || filters?.createdTo) {
    where.createdAt = {
      ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
      ...(filters.createdTo ? { lte: filters.createdTo } : {}),
    };
  }
  if (filters?.q) {
    where.OR = [
      { name: containsInsensitive(filters.q) },
      { slug: containsInsensitive(filters.q) },
    ];
  }

  return paginateQuery({
    page,
    count: () => prisma.tenant.count({ where }),
    query: ({ skip, take }) =>
      prisma.tenant.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          _count: { select: { users: true, students: true, staff: true } },
        },
      }),
  });
}

export async function getSubscriptions() {
  await requireSuperAdminAccess();
  return prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { tenant: true },
  });
}

export type SubscriptionTableFilters = {
  q?: string;
  plan?: Plan;
  status?: SubscriptionStatus;
  isActive?: boolean;
  periodFrom?: Date;
  periodTo?: Date;
};

export async function getPaginatedSubscriptions({
  page,
  filters,
}: {
  page: number;
  filters?: SubscriptionTableFilters;
}) {
  await requireSuperAdminAccess();
  const where: Record<string, unknown> = {};

  if (filters?.plan) where.plan = filters.plan;
  if (filters?.status) where.status = filters.status;
  if (filters?.isActive != null) where.isActive = filters.isActive;
  if (filters?.periodFrom || filters?.periodTo) {
    where.currentPeriodEnd = {
      ...(filters.periodFrom ? { gte: filters.periodFrom } : {}),
      ...(filters.periodTo ? { lte: filters.periodTo } : {}),
    };
  }
  if (filters?.q) {
    where.OR = [{ tenant: { name: containsInsensitive(filters.q) } }];
  }

  return paginateQuery({
    page,
    count: () => prisma.subscription.count({ where }),
    query: ({ skip, take }) =>
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { tenant: true },
      }),
  });
}

export async function getActivityLogs() {
  await requireSuperAdminAccess();
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      user: { select: { id: true, name: true, email: true } },
      tenant: { select: { id: true, name: true } },
    },
  });
}

export async function getPlatformDashboardData({
  schoolsPage,
  subscriptionsPage,
  devicePage,
}: {
  schoolsPage: number;
  subscriptionsPage: number;
  devicePage: number;
}) {
  await requireSuperAdminAccess();
  const [
    tenants,
    subscriptions,
    deviceApprovalRequests,
    totalSchools,
    activeSubscriptions,
    activePlans,
  ] = await Promise.all([
    paginateQuery({
      page: schoolsPage,
      count: () => prisma.tenant.count(),
      query: ({ skip, take }) =>
        prisma.tenant.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take,
          include: {
            _count: { select: { users: true } },
          },
        }),
    }),
    paginateQuery({
      page: subscriptionsPage,
      count: () => prisma.subscription.count(),
      query: ({ skip, take }) =>
        prisma.subscription.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take,
          include: { tenant: true },
        }),
    }),
    getPaginatedPendingDeviceApprovalRows(
      { role: UserRole.SUPER_ADMIN },
      { page: devicePage },
    ),
    prisma.tenant.count(),
    prisma.subscription.count({
      where: { isActive: true },
    }),
    prisma.subscription.findMany({
      where: { isActive: true },
      select: { plan: true },
    }),
  ]);

  const monthlyRevenue = activePlans
    .reduce((sum, sub) => {
      const price =
        sub.plan === "FREE"
          ? 0
          : sub.plan === "BASIC"
            ? 49
            : sub.plan === "PREMIUM"
              ? 149
              : 0;
      return sum + price;
    }, 0);

  return {
    totalSchools,
    activeSubscriptions,
    monthlyRevenue,
    tenants,
    subscriptions,
    deviceApprovalRequests,
  };
}
