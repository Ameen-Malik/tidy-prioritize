/**
 * Email notification types and interfaces
 */

export type EmailTemplate =
  | 'task-reminder'
  | 'task-assigned'
  | 'task-completed'
  | 'welcome'
  | 'password-reset';

export interface BaseEmailRequest {
  to: string;
  subject: string;
}

export interface TemplateEmailRequest extends BaseEmailRequest {
  template: EmailTemplate;
  data: Record<string, any>;
}

export interface CustomEmailRequest extends BaseEmailRequest {
  html?: string;
  text?: string;
}

export type EmailRequest = TemplateEmailRequest | CustomEmailRequest;

export interface EmailResponse {
  success: boolean;
  message: string;
}

export interface EmailErrorResponse {
  error: string;
}

export interface RateLimitInfo {
  maxEmailsPerHour: number;
  maxEmailsPerDay: number;
}

export interface EmailLog {
  id: string;
  user_id: string;
  recipient: string;
  subject: string;
  template: string | null;
  status: 'sent' | 'failed';
  error_message: string | null;
  created_at: string;
}
