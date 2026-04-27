// Session Management Configuration
// These settings balance user convenience with security

export const SESSION_CONFIG = {
  // Main session timeout (30 days like Facebook/Teams)
  SESSION_LOCK_TTL_MS: 30 * 24 * 60 * 60 * 1000,
  
  // Inactivity timeout (7 days of no activity)
  INACTIVITY_TIMEOUT_MS: 7 * 24 * 60 * 60 * 1000,
  
  // Sliding window refresh threshold (refresh if expiring within 7 days)
  SLIDING_REFRESH_THRESHOLD_MS: 7 * 24 * 60 * 60 * 1000,
  
  // Activity tracking update interval (5 minutes)
  ACTIVITY_UPDATE_INTERVAL_MS: 5 * 60 * 1000,
  
  // Security check intervals
  SECURITY_CHECK_INTERVAL_MS: 24 * 60 * 60 * 1000, // Daily
  
  // Maximum concurrent sessions per user (like Facebook/Teams)
  MAX_CONCURRENT_SESSIONS: 3,
  
  // Suspicious activity detection thresholds
  RAPID_ACTIVITY_THRESHOLD_MS: 1000, // Less than 1 second between actions
} as const;

// Security levels for different user roles
export const SECURITY_LEVELS = {
  SUPER_ADMIN: {
    maxConcurrentSessions: 2,
    inactivityTimeoutMs: 3 * 24 * 60 * 60 * 1000, // 3 days for super admins
    requireDeviceApproval: true,
  },
  SCHOOL_SUPER_ADMIN: {
    maxConcurrentSessions: 3,
    inactivityTimeoutMs: 7 * 24 * 60 * 60 * 1000, // 7 days for school admins
    requireDeviceApproval: true,
  },
  TEACHER: {
    maxConcurrentSessions: 3,
    inactivityTimeoutMs: 14 * 24 * 60 * 60 * 1000, // 14 days for teachers
    requireDeviceApproval: false,
  },
  STUDENT: {
    maxConcurrentSessions: 2,
    inactivityTimeoutMs: 30 * 24 * 60 * 60 * 1000, // 30 days for students
    requireDeviceApproval: false,
  },
} as const;

export type UserRole = keyof typeof SECURITY_LEVELS;
