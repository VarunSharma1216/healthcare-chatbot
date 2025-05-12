// Enable Supabase Runtime types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

console.log("🚀 handle-oauth function starting...");

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Google OAuth configuration
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const REDIRECT_URI = 'https://rhbbgmrqrnooljgperdd.supabase.co/functions/v1/handle-oauth';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly'
].join(' ');

// Initialize Supabase client with service role key for the callback
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate the Google OAuth URL
function generateOAuthUrl(therapistId: string): string {
  const state = btoa(JSON.stringify({ therapistId })); // Encode therapistId in state
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(code: string) {
  console.log('🔑 Exchanging code for tokens...');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Error exchanging code:', error);
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json();
  console.log('✅ Tokens obtained successfully');
  return data;
}

// Update therapist's refresh token
async function updateTherapistRefreshToken(therapistId: string, refreshToken: string) {
  console.log('💾 Updating therapist refresh token...');
  const { error } = await supabase
    .from('therapists')
    .update({ google_refresh_token: refreshToken })
    .eq('id', therapistId);

  if (error) {
    console.error('❌ Error updating therapist:', error);
    throw new Error(`Failed to update therapist: ${error.message}`);
  }
  console.log('✅ Therapist updated successfully');
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const state = url.searchParams.get('state');

    // If we have an error from Google OAuth
    if (error) {
      console.log('❌ OAuth error:', error);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `/admin/therapists?calendar_error=${error}`
        }
      });
    }

    // If we have a code, this is the callback from Google (no auth required)
    if (code) {
      if (!state) {
        throw new Error('State parameter is missing');
      }

      // Decode the state to get the therapist ID
      const { therapistId } = JSON.parse(atob(state));
      if (!therapistId) {
        throw new Error('Therapist ID not found in state');
      }

      // Exchange the code for tokens
      const tokens = await exchangeCodeForTokens(code);
      
      // Update the therapist's refresh token
      await updateTherapistRefreshToken(therapistId, tokens.refresh_token);

      // Redirect back to the admin interface
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': '/admin/therapists?calendar_connected=true'
        }
      });
    }

    // For the initial request to get the OAuth URL, we need authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the JWT token
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the therapist ID from the request body
    const { therapistId } = await req.json();
    if (!therapistId) {
      throw new Error('Therapist ID is required');
    }

    const oauthUrl = generateOAuthUrl(therapistId);
    return new Response(
      JSON.stringify({ oauthUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('❌ Error in handler:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
}); 