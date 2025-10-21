import { useState, useCallback } from 'react';
import { EmailNotificationClient } from '@/api/notifications';
import type { EmailRequest, EmailResponse } from '@/api/notifications';
import { toast } from '@/hooks/use-toast';

interface UseEmailNotificationsOptions {
  onSuccess?: (response: EmailResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

interface UseEmailNotificationsReturn {
  sending: boolean;
  error: Error | null;
  sendEmail: (request: EmailRequest) => Promise<EmailResponse | null>;
  sendTaskReminder: (params: {
    to: string;
    taskName: string;
    dueDate?: string;
    description?: string;
    url?: string;
  }) => Promise<EmailResponse | null>;
  sendTaskAssigned: (params: {
    to: string;
    taskName: string;
    assignedBy: string;
    description?: string;
    dueDate?: string;
    url?: string;
  }) => Promise<EmailResponse | null>;
  sendTaskCompleted: (params: {
    to: string;
    taskName: string;
    completedBy: string;
    completedAt?: string;
  }) => Promise<EmailResponse | null>;
}

/**
 * React hook for sending email notifications
 *
 * @example
 * ```tsx
 * function TaskComponent() {
 *   const { sendTaskReminder, sending } = useEmailNotifications({
 *     showToast: true
 *   });
 *
 *   const handleRemind = async () => {
 *     await sendTaskReminder({
 *       to: 'user@example.com',
 *       taskName: 'Complete project',
 *       dueDate: '2025-10-25'
 *     });
 *   };
 *
 *   return (
 *     <button onClick={handleRemind} disabled={sending}>
 *       Send Reminder
 *     </button>
 *   );
 * }
 * ```
 */
export function useEmailNotifications(
  options: UseEmailNotificationsOptions = {}
): UseEmailNotificationsReturn {
  const { onSuccess, onError, showToast = true } = options;
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSend = useCallback(
    async <T extends any[]>(
      fn: (...args: T) => Promise<EmailResponse>,
      ...args: T
    ): Promise<EmailResponse | null> => {
      setSending(true);
      setError(null);

      try {
        const response = await fn(...args);

        if (showToast) {
          toast({
            title: 'Email sent',
            description: response.message || 'Email notification sent successfully',
          });
        }

        onSuccess?.(response);
        return response;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);

        if (showToast) {
          toast({
            title: 'Failed to send email',
            description: errorObj.message,
            variant: 'destructive',
          });
        }

        onError?.(errorObj);
        return null;
      } finally {
        setSending(false);
      }
    },
    [onSuccess, onError, showToast]
  );

  const sendEmail = useCallback(
    (request: EmailRequest) => handleSend(EmailNotificationClient.send, request),
    [handleSend]
  );

  const sendTaskReminder = useCallback(
    (params: Parameters<typeof EmailNotificationClient.sendTaskReminder>[0]) =>
      handleSend(EmailNotificationClient.sendTaskReminder, params),
    [handleSend]
  );

  const sendTaskAssigned = useCallback(
    (params: Parameters<typeof EmailNotificationClient.sendTaskAssigned>[0]) =>
      handleSend(EmailNotificationClient.sendTaskAssigned, params),
    [handleSend]
  );

  const sendTaskCompleted = useCallback(
    (params: Parameters<typeof EmailNotificationClient.sendTaskCompleted>[0]) =>
      handleSend(EmailNotificationClient.sendTaskCompleted, params),
    [handleSend]
  );

  return {
    sending,
    error,
    sendEmail,
    sendTaskReminder,
    sendTaskAssigned,
    sendTaskCompleted,
  };
}
