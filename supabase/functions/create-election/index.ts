import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const identityConfigSchema = z.object({
  authenticationType: z.string().min(1).max(100),
  requireLogin: z.boolean().optional(),
}).passthrough(); // Allow additional fields but validate core ones

const votingLogicConfigSchema = z.object({
  model: z.string().min(1).max(100),
  useAI: z.boolean().optional(),
  aiPrompt: z.string().max(5000).optional(),
}).passthrough();

const billConfigSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  startDate: z.union([z.string().datetime(), z.literal("")]).optional(),
  endDate: z.union([z.string().datetime(), z.literal("")]).optional(),
  isOngoing: z.boolean().optional(),
  isPublic: z.boolean().optional(),
}).passthrough().refine((data) => {
  // If not ongoing and both dates are provided, validate end date is after start date
  if (!data.isOngoing && data.startDate && data.endDate && data.startDate !== "" && data.endDate !== "") {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

const requestSchema = z.object({
  identityConfig: identityConfigSchema,
  votingLogicConfig: votingLogicConfigSchema,
  billConfig: billConfigSchema,
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawBody = await req.json();
    
    // Validate input
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

    const { identityConfig, votingLogicConfig, billConfig } = validationResult.data;
    const verifiedUserId = user.id; // Use authenticated user's ID
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Create a comprehensive prompt for the LLM
    const systemPrompt = `You are an election configuration generator. Based on the provided election parameters, generate a JSON configuration that defines how the voting page should be rendered.

The JSON should include:
- Display configuration (colors, layout, theme)
- Voting interface components (buttons, forms, validation rules)
- Identity verification requirements
- Vote counting logic
- Result display format
- All necessary UI elements and their properties

Return ONLY valid JSON, no additional text.`;

    const userPrompt = `Generate a voting page configuration for an election with these specifications:

IDENTITY VERIFICATION:
${JSON.stringify(identityConfig, null, 2)}

VOTING LOGIC:
${JSON.stringify(votingLogicConfig, null, 2)}

BILL/ELECTION DETAILS:
${JSON.stringify(billConfig, null, 2)}

Create a comprehensive JSON configuration that captures all these rules and defines exactly how to render the voting interface.`;

    console.log("Calling Lovable AI to generate voting page configuration...");

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
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate voting page configuration");
    }

    const aiResponse = await response.json();
    let raw = aiResponse.choices?.[0]?.message?.content;

    console.log("Generated config (raw):", raw);

    // Try to coerce the response into valid JSON
    let votingPageConfig: any = null;

    // 1) If it's already an object, use it
    if (raw && typeof raw === 'object') {
      votingPageConfig = raw;
    }

    if (!votingPageConfig && typeof raw === 'string') {
      let s = raw.trim();

      // 2) If wrapped in markdown code fences, extract inner
      const fenceMatch = s.match(/^```(?:json)?\n([\s\S]*?)\n```$/i);
      if (fenceMatch) {
        s = fenceMatch[1];
      } else {
        // 3) Try to extract the first JSON object by braces
        const firstBrace = s.indexOf('{');
        const lastBrace = s.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          s = s.slice(firstBrace, lastBrace + 1);
        }
      }

      // 4) Parse
      try {
        votingPageConfig = JSON.parse(s);
      } catch (e) {
        console.error("Failed to parse AI response as JSON:", s);
        return new Response(
          JSON.stringify({ error: "Invalid JSON configuration generated" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!votingPageConfig) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON configuration generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize dates
    const startDate = billConfig?.startDate ? new Date(billConfig.startDate).toISOString() : null;
    const endDate = billConfig?.isOngoing ? null : (billConfig?.endDate ? new Date(billConfig.endDate).toISOString() : null);

    const { data: election, error: dbError } = await supabase
      .from('elections')
      .insert({
        title: (billConfig?.title && String(billConfig.title).trim()) || 'Untitled Election',
        description: billConfig?.description || null,
        identity_config: identityConfig,
        voting_logic_config: votingLogicConfig,
        bill_config: billConfig,
        voting_page_config: votingPageConfig,
        start_date: startDate,
        end_date: endDate,
        is_ongoing: !!billConfig?.isOngoing,
        is_public: billConfig?.isPublic ?? true, // Default to public
        created_by: verifiedUserId,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save election to database");
    }

    console.log("Election created successfully:", election.id);

    return new Response(
      JSON.stringify({ 
        electionId: election.id,
        config: votingPageConfig 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in create-election function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});