/**
 * Email Notification API
 *
 * This module provides a client for sending email notifications with:
 * - Template support (task reminders, assignments, completions, welcome, password reset)
 * - Rate limiting (10 emails/hour, 50 emails/day)
 * - Email logging and statistics
 *
 * @example
 * ```typescript
 * import { EmailNotificationClient } from '@/api/notifications';
 *
 * // Send a task reminder
 * await EmailNotificationClient.sendTaskReminder({
 *   to: 'user@example.com',
 *   taskName: 'Complete project proposal',
 *   dueDate: '2025-10-25',
 *   description: 'Draft the Q4 project proposal',
 *   url: 'https://app.example.com/tasks/123'
 * });
 *
 * // Send a custom email
 * await EmailNotificationClient.send({
 *   to: 'user@example.com',
 *   subject: 'Custom Notification',
 *   html: '<h1>Hello</h1><p>This is a custom email</p>',
 *   text: 'Hello\n\nThis is a custom email'
 * });
 *
 * // Get email statistics
 * const stats = await EmailNotificationClient.getStats();
 * console.log(`Sent today: ${stats.sentToday}/${EmailNotificationClient.RATE_LIMITS.maxEmailsPerDay}`);
 * ```
 */

export { EmailNotificationClient } from './client';
export type {
  EmailTemplate,
  EmailRequest,
  TemplateEmailRequest,
  CustomEmailRequest,
  EmailResponse,
  EmailErrorResponse,
  EmailLog,
  RateLimitInfo,
} from './types';
