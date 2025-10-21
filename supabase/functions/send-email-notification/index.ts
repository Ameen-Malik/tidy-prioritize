import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { renderTemplate } from './templates/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  template?: string;
  data?: Record<string, any>;
  html?: string;
  text?: string;
}

interface RateLimitConfig {
  maxEmailsPerHour: number;
  maxEmailsPerDay: number;
}

const rateLimitConfig: RateLimitConfig = {
  maxEmailsPerHour: 10,
  maxEmailsPerDay: 50,
};

async function checkRateLimit(
  supabase: any,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Check hourly limit
  const { count: hourlyCount, error: hourlyError } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo.toISOString());

  if (hourlyError) {
    console.error('Error checking hourly rate limit:', hourlyError);
    throw hourlyError;
  }

  if ((hourlyCount || 0) >= rateLimitConfig.maxEmailsPerHour) {
    return {
      allowed: false,
      reason: `Hourly rate limit exceeded. Maximum ${rateLimitConfig.maxEmailsPerHour} emails per hour.`,
    };
  }

  // Check daily limit
  const { count: dailyCount, error: dailyError } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneDayAgo.toISOString());

  if (dailyError) {
    console.error('Error checking daily rate limit:', dailyError);
    throw dailyError;
  }

  if ((dailyCount || 0) >= rateLimitConfig.maxEmailsPerDay) {
    return {
      allowed: false,
      reason: `Daily rate limit exceeded. Maximum ${rateLimitConfig.maxEmailsPerDay} emails per day.`,
    };
  }

  return { allowed: true };
}

async function logEmail(
  supabase: any,
  userId: string,
  emailData: EmailRequest,
  status: 'sent' | 'failed',
  error?: string
) {
  const { error: logError } = await supabase
    .from('email_logs')
    .insert({
      user_id: userId,
      recipient: emailData.to,
      subject: emailData.subject,
      template: emailData.template || null,
      status,
      error_message: error || null,
    });

  if (logError) {
    console.error('Error logging email:', logError);
  }
}

async function sendEmail(emailData: EmailRequest): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  let htmlContent = emailData.html;
  let textContent = emailData.text;

  // If template is specified, render it
  if (emailData.template) {
    const rendered = renderTemplate(emailData.template, emailData.data || {});
    htmlContent = rendered.html;
    textContent = rendered.text;
  }

  if (!htmlContent && !textContent) {
    throw new Error('Either html, text, or template must be provided');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('EMAIL_FROM') || 'noreply@tidy-prioritize.app',
      to: emailData.to,
      subject: emailData.subject,
      html: htmlContent,
      text: textContent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Email service error: ${response.status} - ${errorData}`);
  }

  const result = await response.json();
  console.log('Email sent successfully:', result);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailData: EmailRequest = await req.json();

    // Validate request
    if (!emailData.to || !emailData.subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(supabase, user.id);
    if (!rateLimitCheck.allowed) {
      await logEmail(supabase, user.id, emailData, 'failed', rateLimitCheck.reason);
      return new Response(
        JSON.stringify({ error: rateLimitCheck.reason }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email
    try {
      await sendEmail(emailData);
      await logEmail(supabase, user.id, emailData, 'sent');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logEmail(supabase, user.id, emailData, 'failed', errorMessage);
      throw error;
    }
  } catch (error) {
    console.error('Error in send-email-notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
