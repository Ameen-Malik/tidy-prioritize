export interface TemplateData {
  [key: string]: any;
}

export interface RenderedTemplate {
  html: string;
  text: string;
}

/**
 * Renders an email template with the provided data
 */
export function renderTemplate(templateName: string, data: TemplateData): RenderedTemplate {
  const templates: Record<string, (data: TemplateData) => RenderedTemplate> = {
    'task-reminder': taskReminderTemplate,
    'task-assigned': taskAssignedTemplate,
    'task-completed': taskCompletedTemplate,
    'welcome': welcomeTemplate,
    'password-reset': passwordResetTemplate,
  };

  const template = templates[templateName];
  if (!template) {
    throw new Error(`Template '${templateName}' not found`);
  }

  return template(data);
}

/**
 * Task Reminder Template
 */
function taskReminderTemplate(data: TemplateData): RenderedTemplate {
  const { taskName, dueDate, description, url } = data;

  return {
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; border-radius: 8px; }
    .task-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
    .due-date { color: #dc2626; font-weight: bold; }
    .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Task Reminder</h1>
    </div>
    <div class="content">
      <div class="task-name">${taskName}</div>
      ${description ? `<p>${description}</p>` : ''}
      ${dueDate ? `<p>Due Date: <span class="due-date">${dueDate}</span></p>` : ''}
      ${url ? `<a href="${url}" class="button">View Task</a>` : ''}
    </div>
    <div class="footer">
      <p>This is an automated reminder from Tidy Prioritize</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Task Reminder

${taskName}
${description ? `\n${description}\n` : ''}
${dueDate ? `Due Date: ${dueDate}\n` : ''}
${url ? `\nView Task: ${url}` : ''}

---
This is an automated reminder from Tidy Prioritize
    `,
  };
}

/**
 * Task Assigned Template
 */
function taskAssignedTemplate(data: TemplateData): RenderedTemplate {
  const { taskName, assignedBy, description, dueDate, url } = data;

  return {
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; border-radius: 8px; }
    .task-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
    .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Task Assigned</h1>
    </div>
    <div class="content">
      <p>${assignedBy} has assigned you a new task:</p>
      <div class="task-name">${taskName}</div>
      ${description ? `<p>${description}</p>` : ''}
      ${dueDate ? `<p>Due Date: ${dueDate}</p>` : ''}
      ${url ? `<a href="${url}" class="button">View Task</a>` : ''}
    </div>
    <div class="footer">
      <p>Tidy Prioritize - Keep your tasks organized</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
New Task Assigned

${assignedBy} has assigned you a new task:

${taskName}
${description ? `\n${description}\n` : ''}
${dueDate ? `Due Date: ${dueDate}\n` : ''}
${url ? `\nView Task: ${url}` : ''}

---
Tidy Prioritize - Keep your tasks organized
    `,
  };
}

/**
 * Task Completed Template
 */
function taskCompletedTemplate(data: TemplateData): RenderedTemplate {
  const { taskName, completedBy, completedAt } = data;

  return {
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; border-radius: 8px; }
    .task-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; color: #059669; }
    .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Task Completed</h1>
    </div>
    <div class="content">
      <div class="task-name">${taskName}</div>
      <p>Completed by: ${completedBy}</p>
      ${completedAt ? `<p>Completed at: ${completedAt}</p>` : ''}
    </div>
    <div class="footer">
      <p>Tidy Prioritize - Keep your tasks organized</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
✓ Task Completed

${taskName}

Completed by: ${completedBy}
${completedAt ? `Completed at: ${completedAt}` : ''}

---
Tidy Prioritize - Keep your tasks organized
    `,
  };
}

/**
 * Welcome Template
 */
function welcomeTemplate(data: TemplateData): RenderedTemplate {
  const { userName, loginUrl } = data;

  return {
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px 20px; }
    .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Tidy Prioritize!</h1>
    </div>
    <div class="content">
      <p>Hi ${userName || 'there'},</p>
      <p>Welcome to Tidy Prioritize! We're excited to help you organize and prioritize your tasks effectively.</p>
      <p>Get started by creating your first task and let our AI help you prioritize what matters most.</p>
      ${loginUrl ? `<a href="${loginUrl}" class="button">Get Started</a>` : ''}
    </div>
    <div class="footer">
      <p>Tidy Prioritize - Keep your tasks organized</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Welcome to Tidy Prioritize!

Hi ${userName || 'there'},

Welcome to Tidy Prioritize! We're excited to help you organize and prioritize your tasks effectively.

Get started by creating your first task and let our AI help you prioritize what matters most.

${loginUrl ? `Get Started: ${loginUrl}\n` : ''}

---
Tidy Prioritize - Keep your tasks organized
    `,
  };
}

/**
 * Password Reset Template
 */
function passwordResetTemplate(data: TemplateData): RenderedTemplate {
  const { resetUrl, expiresIn } = data;

  return {
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .warning { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0; }
    .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>You requested to reset your password. Click the button below to proceed:</p>
      ${resetUrl ? `<a href="${resetUrl}" class="button">Reset Password</a>` : ''}
      <div class="warning">
        <strong>Security Notice:</strong> This link will expire in ${expiresIn || '1 hour'}. If you didn't request this reset, please ignore this email.
      </div>
    </div>
    <div class="footer">
      <p>Tidy Prioritize - Keep your tasks organized</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Password Reset Request

You requested to reset your password. Click the link below to proceed:

${resetUrl || 'No reset URL provided'}

SECURITY NOTICE: This link will expire in ${expiresIn || '1 hour'}. If you didn't request this reset, please ignore this email.

---
Tidy Prioritize - Keep your tasks organized
    `,
  };
}
