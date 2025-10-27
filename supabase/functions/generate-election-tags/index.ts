import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
});

const PREDEFINED_TAGS = [
  "governance",
  "environment", 
  "economy",
  "social",
  "technology",
  "community",
  "justice",
  "sports",
  "others"
] as const;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    const validationResult = requestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request parameters",
          details: validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { title, description } = validationResult.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured", tags: ["others"] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a tag generation assistant for elections. Analyze the title and description, then select 3-5 most relevant tags from these categories:

${PREDEFINED_TAGS.join(", ")}

Rules:
- Only use "others" if the content truly doesn't fit any other category
- Prefer specific categories over "others"
- For sports-related content (athletics, competitions, tournaments, teams, fitness), always use "sports"
- Return 3-5 tags maximum
- Only return tags from the predefined list

You must use tool calling to return the tags.`;

    const userPrompt = `Election Title: ${title}
${description ? `\nDescription: ${description}` : ''}

Select 3-5 most relevant tags for this election.`;

    console.log("Calling Lovable AI to generate tags...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_election_tags",
              description: "Return 3-5 relevant tags for the election",
              parameters: {
                type: "object",
                properties: {
                  tags: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: PREDEFINED_TAGS
                    },
                    minItems: 3,
                    maxItems: 5
                  }
                },
                required: ["tags"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_election_tags" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ tags: ["others"] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ tags: ["others"] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ tags: ["others"] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse));

    // Extract tags from tool call
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    let tags = ["others"];

    if (toolCall?.function?.arguments) {
      try {
        const parsedArgs = typeof toolCall.function.arguments === 'string' 
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
        
        if (parsedArgs.tags && Array.isArray(parsedArgs.tags) && parsedArgs.tags.length > 0) {
          // Validate all tags are from predefined list
          const validTags = parsedArgs.tags.filter((tag: string) => 
            PREDEFINED_TAGS.includes(tag as any)
          );
          
          if (validTags.length > 0) {
            tags = validTags.slice(0, 5); // Max 5 tags
          }
        }
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    console.log("Generated tags:", tags);

    return new Response(
      JSON.stringify({ tags }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-election-tags function:", error);
    return new Response(
      JSON.stringify({ tags: ["others"] }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
