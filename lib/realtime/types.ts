import { DayOfWeek, UserRole } from "@/app/generated/prisma/enums";

export type RealtimeReminderSlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  section: {
    name: string;
    class: { name: string };
  };
};

export type RealtimePendingDeviceApprovalRequest = {
  id: string;
  createdAt: string;
  expiresAt: string;
  requestedIp: string | null;
  requestedUserAgent: string | null;
  status: "PENDING";
  requester: {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    schoolName: string | null;
  } | null;
};

export type RealtimeSnapshot = {
  unreadCount: number;
  reminderSlots: RealtimeReminderSlot[];
  pendingDeviceApprovals: RealtimePendingDeviceApprovalRequest[];
  generatedAt: string;
};
