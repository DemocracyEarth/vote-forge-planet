import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { electionId } = await req.json();
    
    if (!electionId) {
      console.error('Election ID is required');
      return new Response(
        JSON.stringify({ error: 'Election ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authentication header provided');
      return new Response(
        JSON.stringify({ 
          canVote: false, 
          reason: 'Authentication required' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Call the database function to check eligibility
    console.log(`Checking eligibility for election: ${electionId}`);
    const { data, error } = await supabase.rpc('can_user_vote_in_election', {
      p_election_id: electionId
    });

    if (error) {
      console.error('Error checking eligibility:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to check eligibility' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Eligibility result: ${data}`);
    
    return new Response(
      JSON.stringify({ 
        canVote: data === true,
        reason: data ? 'You are eligible to vote' : 'You are not authorized to vote in this election'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
