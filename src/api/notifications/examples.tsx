/**
 * Example usage of the Email Notification System
 *
 * This file demonstrates how to integrate email notifications in your React components
 */

import React, { useState } from 'react';
import { useEmailNotifications } from '@/hooks/use-email-notifications';
import { EmailNotificationClient } from '@/api/notifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

/**
 * Example 1: Using the hook for sending emails
 */
export function TaskReminderExample() {
  const [email, setEmail] = useState('');
  const { sendTaskReminder, sending } = useEmailNotifications({
    showToast: true,
    onSuccess: () => console.log('Email sent successfully!'),
    onError: (error) => console.error('Failed to send email:', error),
  });

  const handleSendReminder = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    await sendTaskReminder({
      to: email,
      taskName: 'Complete quarterly review',
      dueDate: '2025-10-30',
      description: 'Review and submit Q3 performance metrics',
      url: 'https://app.example.com/tasks/123',
    });
  };

  return (
    <div className="space-y-4">
      <h2>Send Task Reminder</h2>
      <Input
        type="email"
        placeholder="recipient@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button onClick={handleSendReminder} disabled={sending}>
        {sending ? 'Sending...' : 'Send Reminder'}
      </Button>
    </div>
  );
}

/**
 * Example 2: Direct client usage without hook
 */
export async function sendWelcomeEmailDirectly(userEmail: string, userName: string) {
  try {
    const response = await EmailNotificationClient.sendWelcome({
      to: userEmail,
      userName: userName,
      loginUrl: 'https://app.example.com/login',
    });

    console.log('Welcome email sent:', response);
    return response;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}

/**
 * Example 3: Getting email statistics
 */
export function EmailStatsExample() {
  const [stats, setStats] = useState<{
    sentToday: number;
    sentThisHour: number;
    failedToday: number;
    totalSent: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const emailStats = await EmailNotificationClient.getStats();
      setStats(emailStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2>Email Statistics</h2>
      <Button onClick={loadStats} disabled={loading}>
        {loading ? 'Loading...' : 'Load Statistics'}
      </Button>

      {stats && (
        <div className="space-y-2">
          <p>Sent this hour: {stats.sentThisHour} / {EmailNotificationClient.RATE_LIMITS.maxEmailsPerHour}</p>
          <p>Sent today: {stats.sentToday} / {EmailNotificationClient.RATE_LIMITS.maxEmailsPerDay}</p>
          <p>Failed today: {stats.failedToday}</p>
          <p>Total sent: {stats.totalSent}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Task assignment notification
 */
export async function notifyTaskAssignment(
  recipientEmail: string,
  taskName: string,
  assignedByName: string,
  taskUrl: string
) {
  try {
    await EmailNotificationClient.sendTaskAssigned({
      to: recipientEmail,
      taskName: taskName,
      assignedBy: assignedByName,
      description: 'Please review and complete this task',
      url: taskUrl,
    });

    toast({
      title: 'Notification sent',
      description: `${recipientEmail} has been notified about the new task`,
    });
  } catch (error) {
    console.error('Failed to send task assignment notification:', error);

    toast({
      title: 'Failed to send notification',
      description: error instanceof Error ? error.message : 'Unknown error',
      variant: 'destructive',
    });
  }
}

/**
 * Example 5: Sending custom HTML email
 */
export async function sendCustomEmail(to: string, subject: string, htmlContent: string) {
  try {
    const response = await EmailNotificationClient.send({
      to,
      subject,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    });

    return response;
  } catch (error) {
    console.error('Failed to send custom email:', error);
    throw error;
  }
}

/**
 * Example 6: Checking rate limits before sending
 */
export async function sendWithRateLimitCheck(recipientEmail: string) {
  try {
    // Get current stats
    const stats = await EmailNotificationClient.getStats();
    const limits = EmailNotificationClient.RATE_LIMITS;

    // Check if we can send
    if (stats.sentThisHour >= limits.maxEmailsPerHour) {
      toast({
        title: 'Rate limit reached',
        description: 'You have reached your hourly email limit. Please try again later.',
        variant: 'destructive',
      });
      return;
    }

    if (stats.sentToday >= limits.maxEmailsPerDay) {
      toast({
        title: 'Rate limit reached',
        description: 'You have reached your daily email limit. Please try again tomorrow.',
        variant: 'destructive',
      });
      return;
    }

    // Send the email
    await EmailNotificationClient.sendTaskReminder({
      to: recipientEmail,
      taskName: 'Example task',
    });

    // Show remaining quota
    toast({
      title: 'Email sent',
      description: `Remaining today: ${limits.maxEmailsPerDay - stats.sentToday - 1}`,
    });
  } catch (error) {
    console.error('Error:', error);
  }
}
