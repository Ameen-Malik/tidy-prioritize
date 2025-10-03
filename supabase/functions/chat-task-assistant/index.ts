import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const systemPrompt = `You are a helpful task assistant. Your job is to help users create tasks through natural conversation.

When the user wants to add a task, extract:
- Task name (required)
- Description (optional)
- Due date (optional, in YYYY-MM-DD format)

Once you have the task name, create the task. If the user provides additional details, incorporate them.

Be conversational and friendly. Ask clarifying questions if needed, but don't be too formal.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_task',
              description: 'Create a new task for the user',
              parameters: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'The name/title of the task'
                  },
                  description: {
                    type: 'string',
                    description: 'Optional description of the task'
                  },
                  due_date: {
                    type: 'string',
                    description: 'Optional due date in YYYY-MM-DD format'
                  }
                },
                required: ['name']
              }
            }
          }
        ],
        tool_choice: 'auto'
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required for AI usage.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices[0].message;

    // Check if AI wants to create a task
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      if (toolCall.function.name === 'create_task') {
        const taskData = JSON.parse(toolCall.function.arguments);
        
        // Create the task in Supabase
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            name: taskData.name,
            description: taskData.description || null,
            due_date: taskData.due_date || null
          })
          .select()
          .single();

        if (taskError) {
          console.error('Error creating task:', taskError);
          throw taskError;
        }

        console.log('Task created successfully:', task);

        return new Response(
          JSON.stringify({
            message: {
              role: 'assistant',
              content: `Great! I've created the task "${taskData.name}"${taskData.due_date ? ` for ${taskData.due_date}` : ''}.`
            },
            task_created: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat-task-assistant:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
