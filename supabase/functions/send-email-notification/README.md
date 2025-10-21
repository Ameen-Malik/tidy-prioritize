# Email Notification System

A comprehensive email notification system with template support and rate limiting for Tidy Prioritize.

## Features

- **Template Support**: Pre-built templates for common email types
- **Rate Limiting**: Prevents abuse with configurable limits (10/hour, 50/day)
- **Email Logging**: Tracks all sent emails for auditing and analytics
- **Type Safety**: Full TypeScript support on both backend and frontend

## Architecture

### Backend (Supabase Edge Function)

The backend is implemented as a Supabase Edge Function using Deno runtime:

- **Location**: `/supabase/functions/send-email-notification/`
- **Runtime**: Deno
- **Email Service**: Resend API (configurable)

### Frontend (Client API)

The frontend client provides a clean TypeScript API:

- **Location**: `/src/api/notifications/`
- **Framework**: React + TypeScript
- **Supabase Client**: Used for authentication and database access

## Setup

### 1. Environment Variables

Add the following to your Supabase project settings or `.env` file:

```bash
# Required: Resend API key for sending emails
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Optional: Custom "from" email address
EMAIL_FROM=noreply@yourdomain.com
```

### 2. Database Migration

Run the migration to create the `email_logs` table:

```bash
supabase db push
```

Or apply the migration manually:
```sql
-- See: /supabase/migrations/20251021000000_create_email_logs.sql
```

### 3. Deploy Edge Function

```bash
supabase functions deploy send-email-notification
```

## Usage

### Basic Email

```typescript
import { EmailNotificationClient } from '@/api/notifications';

// Send a custom email
await EmailNotificationClient.send({
  to: 'user@example.com',
  subject: 'Hello!',
  html: '<h1>Hello World</h1>',
  text: 'Hello World'
});
```

### Template-based Emails

#### Task Reminder

```typescript
await EmailNotificationClient.sendTaskReminder({
  to: 'user@example.com',
  taskName: 'Complete project proposal',
  dueDate: '2025-10-25',
  description: 'Draft the Q4 project proposal',
  url: 'https://app.example.com/tasks/123'
});
```

#### Task Assignment

```typescript
await EmailNotificationClient.sendTaskAssigned({
  to: 'user@example.com',
  taskName: 'Review pull request',
  assignedBy: 'John Doe',
  description: 'Please review PR #456',
  dueDate: '2025-10-23',
  url: 'https://github.com/org/repo/pull/456'
});
```

#### Task Completed

```typescript
await EmailNotificationClient.sendTaskCompleted({
  to: 'manager@example.com',
  taskName: 'Quarterly report',
  completedBy: 'Jane Smith',
  completedAt: '2025-10-21 14:30'
});
```

#### Welcome Email

```typescript
await EmailNotificationClient.sendWelcome({
  to: 'newuser@example.com',
  userName: 'Alice',
  loginUrl: 'https://app.example.com/login'
});
```

#### Password Reset

```typescript
await EmailNotificationClient.sendPasswordReset({
  to: 'user@example.com',
  resetUrl: 'https://app.example.com/reset?token=abc123',
  expiresIn: '1 hour'
});
```

### Email Statistics

```typescript
// Get email usage stats
const stats = await EmailNotificationClient.getStats();
console.log(stats);
// {
//   sentToday: 5,
//   sentThisHour: 2,
//   failedToday: 0,
//   totalSent: 47
// }

// Check rate limits
console.log(EmailNotificationClient.RATE_LIMITS);
// {
//   maxEmailsPerHour: 10,
//   maxEmailsPerDay: 50
// }
```

### Email Logs

```typescript
// Get recent email logs
const logs = await EmailNotificationClient.getLogs(20);
logs.forEach(log => {
  console.log(`${log.created_at}: ${log.subject} to ${log.recipient} - ${log.status}`);
});
```

## Available Templates

1. **task-reminder** - Reminds users about upcoming tasks
2. **task-assigned** - Notifies users when assigned a new task
3. **task-completed** - Notifies relevant parties when a task is completed
4. **welcome** - Welcomes new users to the platform
5. **password-reset** - Provides password reset instructions

## Rate Limiting

Rate limits are enforced per user:

- **Hourly Limit**: 10 emails per hour
- **Daily Limit**: 50 emails per day

When a rate limit is exceeded, the API returns a 429 error with a descriptive message.

## Customization

### Adding New Templates

1. Add template function to `/supabase/functions/send-email-notification/templates/index.ts`
2. Register template in the `templates` map
3. Update TypeScript types in `/src/api/notifications/types.ts`

Example:

```typescript
function myCustomTemplate(data: TemplateData): RenderedTemplate {
  return {
    html: `<html>...</html>`,
    text: `Plain text version...`
  };
}

// Register in templates map
const templates = {
  // ... existing templates
  'my-custom': myCustomTemplate,
};
```

### Adjusting Rate Limits

Edit the `rateLimitConfig` in `/supabase/functions/send-email-notification/index.ts`:

```typescript
const rateLimitConfig: RateLimitConfig = {
  maxEmailsPerHour: 20,  // Increase to 20
  maxEmailsPerDay: 100,  // Increase to 100
};
```

### Using Different Email Service

The system uses Resend by default. To use a different service (SendGrid, Mailgun, etc.):

1. Update the `sendEmail` function in `index.ts`
2. Replace the API endpoint and authentication
3. Update environment variables accordingly

## Error Handling

```typescript
try {
  await EmailNotificationClient.sendTaskReminder({...});
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Handle rate limit error
    console.error('Rate limit exceeded');
  } else {
    // Handle other errors
    console.error('Failed to send email:', error);
  }
}
```

## Security

- All endpoints require authentication via Supabase Auth
- Row Level Security (RLS) ensures users can only access their own email logs
- Rate limiting prevents abuse
- Email addresses are validated before sending

## Testing

Test the Edge Function locally:

```bash
# Start Supabase local development
supabase start

# Test the function
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-email-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"to":"test@example.com","subject":"Test","template":"welcome","data":{"userName":"Test User"}}'
```

## License

Part of the Tidy Prioritize project.
