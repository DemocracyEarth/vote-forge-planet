import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description } = await req.json();

    if (!title && !description) {
      return new Response(
        JSON.stringify({ error: "Title or description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert at making proposal text neutral, objective, and unbiased. Your task is to polish the language while preserving the core meaning and intent. Follow these rules:

1. Remove emotional or charged language
2. Replace biased terms with neutral alternatives
3. Make statements more objective and factual
4. Avoid hyperbole and exaggeration
5. Keep the same length and structure
6. Preserve all factual information
7. Maintain professional tone
8. Return only the polished text, no explanations`;

    const userPrompt = title && description
      ? `Polish this proposal:\n\nTitle: ${title}\n\nDescription: ${description}\n\nReturn the result as JSON with "title" and "description" fields.`
      : title
      ? `Polish this proposal title: ${title}\n\nReturn only the polished title text.`
      : `Polish this proposal description: ${description}\n\nReturn only the polished description text.`;

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Try to parse as JSON if both title and description were provided
    if (title && description) {
      try {
        const parsed = JSON.parse(content);
        return new Response(
          JSON.stringify({ polishedTitle: parsed.title, polishedDescription: parsed.description }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        // If JSON parsing fails, return the raw content
        return new Response(
          JSON.stringify({ polishedTitle: title, polishedDescription: content }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Return single field result
    if (title) {
      return new Response(
        JSON.stringify({ polishedTitle: content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ polishedDescription: content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in polish-proposal function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
