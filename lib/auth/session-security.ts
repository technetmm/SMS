export const SESSION_INACTIVITY_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days of inactivity
export const SESSION_SECURITY_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // Daily security checks
export const MAX_CONCURRENT_SESSIONS = 3; // Allow multiple devices like Facebook/Teams

export interface SessionSecurityContext {
  lastActivityAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  securityFlags: string[];
}

export function shouldRefreshSession(
  sessionExpiresAt: Date,
  lastActivityAt: Date,
  now: Date = new Date()
): boolean {
  const timeUntilExpiry = sessionExpiresAt.getTime() - now.getTime();
  const inactivityDuration = now.getTime() - lastActivityAt.getTime();
  
  // Refresh if session expires within 7 days OR if user has been active
  return timeUntilExpiry <= 7 * 24 * 60 * 60 * 1000 || inactivityDuration < 24 * 60 * 60 * 1000;
}

export function isSessionInactive(
  lastActivityAt: Date,
  now: Date = new Date()
): boolean {
  return (now.getTime() - lastActivityAt.getTime()) > SESSION_INACTIVITY_TIMEOUT_MS;
}

export function detectSuspiciousActivity(
  currentContext: SessionSecurityContext,
  previousContext: SessionSecurityContext | null
): string[] {
  const flags: string[] = [];
  
  if (!previousContext) return flags;
  
  // IP address change detection
  if (currentContext.ipAddress && previousContext.ipAddress) {
    if (currentContext.ipAddress !== previousContext.ipAddress) {
      flags.push('IP_ADDRESS_CHANGED');
    }
  }
  
  // User-Agent change detection
  if (currentContext.userAgent && previousContext.userAgent) {
    if (currentContext.userAgent !== previousContext.userAgent) {
      flags.push('USER_AGENT_CHANGED');
    }
  }
  
  // Rapid activity patterns (potential automation)
  const activityGap = currentContext.lastActivityAt.getTime() - previousContext.lastActivityAt.getTime();
  if (activityGap < 1000 && activityGap > 0) { // Less than 1 second between activities
    flags.push('RAPID_ACTIVITY');
  }
  
  return flags;
}
