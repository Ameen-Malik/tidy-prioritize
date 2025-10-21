import { supabase } from '@/integrations/supabase/client';
import type {
  EmailRequest,
  EmailResponse,
  EmailErrorResponse,
  EmailLog,
  RateLimitInfo,
} from './types';

/**
 * Email Notification Client
 * Provides methods to send email notifications with template support and rate limiting
 */
export class EmailNotificationClient {
  private static readonly FUNCTION_NAME = 'send-email-notification';

  /**
   * Rate limit configuration
   */
  static readonly RATE_LIMITS: RateLimitInfo = {
    maxEmailsPerHour: 10,
    maxEmailsPerDay: 50,
  };

  /**
   * Send an email notification
   * @param emailRequest - Email configuration
   * @returns Promise with the response
   * @throws Error if sending fails
   */
  static async send(emailRequest: EmailRequest): Promise<EmailResponse> {
    try {
      const { data, error } = await supabase.functions.invoke<EmailResponse>(
        this.FUNCTION_NAME,
        {
          body: emailRequest,
        }
      );

      if (error) {
        throw new Error(error.message || 'Failed to send email');
      }

      if (!data) {
        throw new Error('No response from email service');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        // Check for rate limit error
        if (error.message.includes('rate limit')) {
          throw new Error(`Rate limit exceeded. You can send up to ${this.RATE_LIMITS.maxEmailsPerHour} emails per hour and ${this.RATE_LIMITS.maxEmailsPerDay} emails per day.`);
        }
        throw error;
      }
      throw new Error('Unknown error occurred while sending email');
    }
  }

  /**
   * Send a task reminder email
   */
  static async sendTaskReminder(params: {
    to: string;
    taskName: string;
    dueDate?: string;
    description?: string;
    url?: string;
  }): Promise<EmailResponse> {
    return this.send({
      to: params.to,
      subject: `Task Reminder: ${params.taskName}`,
      template: 'task-reminder',
      data: {
        taskName: params.taskName,
        dueDate: params.dueDate,
        description: params.description,
        url: params.url,
      },
    });
  }

  /**
   * Send a task assigned email
   */
  static async sendTaskAssigned(params: {
    to: string;
    taskName: string;
    assignedBy: string;
    description?: string;
    dueDate?: string;
    url?: string;
  }): Promise<EmailResponse> {
    return this.send({
      to: params.to,
      subject: `New Task Assigned: ${params.taskName}`,
      template: 'task-assigned',
      data: {
        taskName: params.taskName,
        assignedBy: params.assignedBy,
        description: params.description,
        dueDate: params.dueDate,
        url: params.url,
      },
    });
  }

  /**
   * Send a task completed email
   */
  static async sendTaskCompleted(params: {
    to: string;
    taskName: string;
    completedBy: string;
    completedAt?: string;
  }): Promise<EmailResponse> {
    return this.send({
      to: params.to,
      subject: `Task Completed: ${params.taskName}`,
      template: 'task-completed',
      data: {
        taskName: params.taskName,
        completedBy: params.completedBy,
        completedAt: params.completedAt,
      },
    });
  }

  /**
   * Send a welcome email
   */
  static async sendWelcome(params: {
    to: string;
    userName?: string;
    loginUrl?: string;
  }): Promise<EmailResponse> {
    return this.send({
      to: params.to,
      subject: 'Welcome to Tidy Prioritize!',
      template: 'welcome',
      data: {
        userName: params.userName,
        loginUrl: params.loginUrl,
      },
    });
  }

  /**
   * Send a password reset email
   */
  static async sendPasswordReset(params: {
    to: string;
    resetUrl: string;
    expiresIn?: string;
  }): Promise<EmailResponse> {
    return this.send({
      to: params.to,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: {
        resetUrl: params.resetUrl,
        expiresIn: params.expiresIn || '1 hour',
      },
    });
  }

  /**
   * Get email logs for the current user
   * @param limit - Maximum number of logs to retrieve
   * @returns Promise with email logs
   */
  static async getLogs(limit = 50): Promise<EmailLog[]> {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch email logs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get email statistics for the current user
   */
  static async getStats(): Promise<{
    sentToday: number;
    sentThisHour: number;
    failedToday: number;
    totalSent: number;
  }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [sentTodayResult, sentThisHourResult, failedTodayResult, totalSentResult] =
      await Promise.all([
        supabase
          .from('email_logs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'sent')
          .gte('created_at', today.toISOString()),
        supabase
          .from('email_logs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'sent')
          .gte('created_at', oneHourAgo.toISOString()),
        supabase
          .from('email_logs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'failed')
          .gte('created_at', today.toISOString()),
        supabase
          .from('email_logs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'sent'),
      ]);

    return {
      sentToday: sentTodayResult.count || 0,
      sentThisHour: sentThisHourResult.count || 0,
      failedToday: failedTodayResult.count || 0,
      totalSent: totalSentResult.count || 0,
    };
  }
}
