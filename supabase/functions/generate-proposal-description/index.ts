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
    const { title } = await req.json();

    if (!title || title.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a neutral policy analyst. Write proposal descriptions in the SAME LANGUAGE as the input title.

REQUIREMENTS:
- Write ONLY the proposal content, no meta-commentary
- Use the EXACT SAME LANGUAGE as the proposal title (if title is in Spanish, write in Spanish; if French, write in French, etc.)
- Be neutral and objective
- Include: brief summary, key arguments in favor, key arguments against, alternative approaches
- Keep it SHORT and CONCISE (maximum 300 words, around 2000-3000 characters)
- Use simple, clear language
- Format with markdown for readability

Also suggest 3-5 ballot options that voters can choose from, based on the proposal. These should be short labels (2-4 words each).

Return your response as JSON with this structure:
{
  "description": "the proposal description in markdown",
  "ballotOptions": ["Option 1", "Option 2", "Option 3"]
}

Do NOT include phrases like "Here's the description". Just provide the JSON directly.`;

    const userPrompt = `Proposal title: ${title}

Generate:
1. A short, neutral description (max 300 words) covering arguments for, against, and alternatives
2. Suggest 3-5 short ballot option labels

Use the same language as the title. Return as JSON.`;

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

    // Parse the JSON response from the AI
    let parsedContent;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedContent = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      // Fallback: treat entire content as description
      parsedContent = {
        description: content,
        ballotOptions: ["YES", "NO", "ABSTENTION"]
      };
    }

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-proposal-description function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
