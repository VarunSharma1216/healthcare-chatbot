// Enable Supabase Runtime types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

console.log("🚀 handle-calendar function starting...");

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Use environment variables for credentials
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

console.log("🔑 Environment variables check:");
console.log("- GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID ? `Present (length: ${GOOGLE_CLIENT_ID.length})` : "Missing");
console.log("- GOOGLE_CLIENT_SECRET:", GOOGLE_CLIENT_SECRET ? `Present (length: ${GOOGLE_CLIENT_SECRET.length})` : "Missing");

const EVENT_NAME = 'Therapy Session';
const EVENT_START_TIME = '2025-05-15T16:00:00-07:00';
const EVENT_DURATION_MINUTES = 60;

async function getTherapistRefreshToken(therapistId: string) {
  console.log('🔍 Getting therapist refresh token for ID:', therapistId);
  
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Get therapist's refresh token
  const { data: therapist, error } = await supabase
    .from('therapists')
    .select('google_refresh_token')
    .eq('id', therapistId)
    .single();

  if (error) {
    console.error('❌ Error getting therapist refresh token:', error);
    throw new Error(`Failed to get therapist refresh token: ${error.message}`);
  }

  if (!therapist?.google_refresh_token) {
    console.error('❌ No refresh token found for therapist');
    throw new Error('Therapist has no Google refresh token configured');
  }

  console.log('✅ Found therapist refresh token');
  return therapist.google_refresh_token;
}

async function getAccessToken(refreshToken: string) {
  console.log('🔑 Getting access token...');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Error getting access token:', error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  console.log('✅ Access token obtained');
  return data.access_token;
}

async function addEvent(therapistId: string) {
  console.log('📅 Starting addEvent function...');
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('❌ Missing required environment variables');
    throw new Error('Missing Google OAuth credentials in environment variables');
  }

  try {
    // Get the therapist's refresh token
    const refreshToken = await getTherapistRefreshToken(therapistId);
    const accessToken = await getAccessToken(refreshToken);
    
    console.log('⏰ Creating event object...');
    const startTime = new Date(EVENT_START_TIME);
    const endTime = new Date(startTime.getTime() + EVENT_DURATION_MINUTES * 60000);
    
    const event = {
      summary: EVENT_NAME,
      description: 'Therapy appointment scheduled via healthcare chatbot',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/New_York',
      },
    };

    console.log('📝 Event details:', JSON.stringify(event, null, 2));

    console.log('📤 Inserting event into calendar...');
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error creating calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error}`);
    }

    const responseData = await response.json();
    console.log('✅ Event inserted successfully:', responseData.id);
    
    return {
      success: true,
      eventId: responseData.id,
      eventDetails: {
        summary: responseData.summary,
        start: responseData.start?.dateTime,
        end: responseData.end?.dateTime
      }
    };
  } catch (error) {
    console.error('❌ Error in addEvent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Our Edge Function
Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  console.log("📥 Received request:", req.method, req.url);
  try {
    // Get therapist ID from request body
    const { therapistId } = await req.json();
    
    if (!therapistId) {
      throw new Error('Therapist ID is required');
    }

    const result = await addEvent(therapistId);
    console.log("📤 Sending response:", JSON.stringify(result, null, 2));
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ Error in handler:", err);
    const payload = { success: false, error: err.message || String(err) };
    return new Response(JSON.stringify(payload), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});