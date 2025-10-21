/**
 * Utility functions for email notifications
 */

import type { EmailLog } from './types';

/**
 * Format email log for display
 */
export function formatEmailLog(log: EmailLog): string {
  const date = new Date(log.created_at).toLocaleString();
  const status = log.status === 'sent' ? '✓' : '✗';
  return `${status} ${date} - ${log.subject} → ${log.recipient}`;
}

/**
 * Check if an email address is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Calculate remaining emails for rate limits
 */
export function calculateRemainingEmails(stats: {
  sentToday: number;
  sentThisHour: number;
}, limits: { maxEmailsPerHour: number; maxEmailsPerDay: number }): {
  remainingThisHour: number;
  remainingToday: number;
  canSend: boolean;
} {
  const remainingThisHour = limits.maxEmailsPerHour - stats.sentThisHour;
  const remainingToday = limits.maxEmailsPerDay - stats.sentToday;

  return {
    remainingThisHour: Math.max(0, remainingThisHour),
    remainingToday: Math.max(0, remainingToday),
    canSend: remainingThisHour > 0 && remainingToday > 0,
  };
}

/**
 * Get rate limit message
 */
export function getRateLimitMessage(stats: {
  sentToday: number;
  sentThisHour: number;
}, limits: { maxEmailsPerHour: number; maxEmailsPerDay: number }): string | null {
  const { remainingThisHour, remainingToday } = calculateRemainingEmails(stats, limits);

  if (remainingThisHour === 0) {
    return 'Hourly email limit reached. Please try again later.';
  }

  if (remainingToday === 0) {
    return 'Daily email limit reached. Please try again tomorrow.';
  }

  return null;
}

/**
 * Sanitize email data to prevent injection
 */
export function sanitizeEmailData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Basic HTML entity encoding for template data
      sanitized[key] = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Group email logs by status
 */
export function groupLogsByStatus(logs: EmailLog[]): {
  sent: EmailLog[];
  failed: EmailLog[];
} {
  return logs.reduce(
    (acc, log) => {
      if (log.status === 'sent') {
        acc.sent.push(log);
      } else {
        acc.failed.push(log);
      }
      return acc;
    },
    { sent: [] as EmailLog[], failed: [] as EmailLog[] }
  );
}

/**
 * Get email logs from a specific date range
 */
export function filterLogsByDateRange(
  logs: EmailLog[],
  startDate: Date,
  endDate: Date
): EmailLog[] {
  return logs.filter((log) => {
    const logDate = new Date(log.created_at);
    return logDate >= startDate && logDate <= endDate;
  });
}

/**
 * Calculate email success rate
 */
export function calculateSuccessRate(logs: EmailLog[]): number {
  if (logs.length === 0) return 0;

  const sentCount = logs.filter((log) => log.status === 'sent').length;
  return (sentCount / logs.length) * 100;
}
