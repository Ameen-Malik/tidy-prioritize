import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId, description } = await req.json();
    
    if (!taskId || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing taskId or description' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing task:', description);

    // Call Lovable AI to prioritize the task
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a task prioritization assistant. Analyze task descriptions and assign priorities.'
          },
          {
            role: 'user',
            content: `Analyze this task description and determine its priority level: "${description}"\n\nLook for urgency indicators like: ASAP, urgent, today, deadline, emergency, critical, important, soon, immediate.\n\nReturn the priority (low, medium, or high) and a brief explanation.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'set_priority',
            description: 'Set the priority level for a task',
            parameters: {
              type: 'object',
              properties: {
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: 'The priority level'
                },
                reasoning: {
                  type: 'string',
                  description: 'Brief explanation for the priority level (1-2 sentences)'
                }
              },
              required: ['priority', 'reasoning'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'set_priority' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error('AI gateway error');
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const args = JSON.parse(toolCall.function.arguments);
    const { priority, reasoning } = args;

    console.log('Extracted priority:', priority, 'Reasoning:', reasoning);

    // Update the task with the priority
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ 
        priority,
        priority_reasoning: reasoning
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('Error updating task:', updateError);
      throw updateError;
    }

    console.log('Task updated successfully');

    return new Response(
      JSON.stringify({ priority, reasoning }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in prioritize-task:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
