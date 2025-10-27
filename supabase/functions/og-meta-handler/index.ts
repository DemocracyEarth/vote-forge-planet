import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Social media crawlers user agents
const CRAWLER_USER_AGENTS = [
  'Twitterbot',
  'facebookexternalhit',
  'LinkedInBot',
  'Slackbot',
  'WhatsApp',
  'TelegramBot',
  'Discordbot',
  'redditbot',
];

function isCrawler(userAgent: string): boolean {
  return CRAWLER_USER_AGENTS.some(bot => userAgent.includes(bot));
}

function extractElectionId(pathname: string): string | null {
  const match = pathname.match(/\/vote\/([a-f0-9-]{36})/);
  return match ? match[1] : null;
}

async function getElectionData(electionId: string) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  const { data, error } = await supabase
    .from('elections')
    .select('id, title, description, bill_config')
    .eq('id', electionId)
    .eq('is_public', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

function generateMetaHTML(election: any, url: string): string {
  const domain = 'https://ai.democracy.earth';
  const pageUrl = `${domain}/vote/${election.id}`;
  const title = election.title || 'Vote on Democracy Earth';
  const description = election.description?.substring(0, 200) || 'Participate in this democratic vote on Democracy Earth';
  const imageUrl = election.bill_config?.illustrationUrl || `${domain}/placeholder.svg`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Primary Meta Tags -->
    <title>${title}</title>
    <meta name="title" content="${title}" />
    <meta name="description" content="${description}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="Democracy Earth" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${pageUrl}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    <!-- Redirect for crawlers to ensure they see the content -->
    <meta http-equiv="refresh" content="0;url=${pageUrl}">
  </head>
  <body>
    <h1>${title}</h1>
    <p>${description}</p>
    <a href="${pageUrl}">View Election</a>
  </body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userAgent = req.headers.get('user-agent') || '';
    
    console.log('User-Agent:', userAgent);
    console.log('URL:', url.pathname);

    // Check if this is a crawler accessing a vote page
    if (isCrawler(userAgent)) {
      const electionId = extractElectionId(url.pathname);
      
      if (electionId) {
        console.log('Crawler detected for election:', electionId);
        
        const election = await getElectionData(electionId);
        
        if (election) {
          console.log('Serving meta tags for election:', election.title);
          const html = generateMetaHTML(election, req.url);
          
          return new Response(html, {
            status: 200,
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      }
    }

    // For non-crawlers or non-vote pages, return empty response
    // The actual app will be served by the static hosting
    return new Response(JSON.stringify({ status: 'not a crawler or no election ID' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in og-meta-handler:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
