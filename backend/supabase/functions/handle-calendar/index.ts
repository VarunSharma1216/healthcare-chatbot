// supabase/functions/handle-calendar/index.ts

// 1) Bring in the Supabase runtime types for autocomplete/etc.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// 2) CORS headers (optional but recommended)
const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// 3) Your helper to talk to Google Calendar
const API_KEY = Deno.env.get('GOOGLE_CALENDAR_API_KEY');
const CALENDAR_ID = 'bob12xhelalk@gmail.com';

if (!API_KEY) {
  throw new Error('GOOGLE_CALENDAR_API_KEY environment variable is not set.');
}

async function fetchEvents() {
  const now = new Date().toISOString();
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`
  );
  url.searchParams.set('key', API_KEY!);
  url.searchParams.set('timeMin', now);
  url.searchParams.set('maxResults', '10');
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');

  console.log("🔍 Fetching events from Google Calendar...");
  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const { items = [] } = await res.json();

    console.log("🔍 Events fetched successfully:", items.length);
    return items.map((evt: any) => {
      const start = evt.start?.dateTime || evt.start?.date;
      const end = evt.end?.dateTime || evt.end?.date;
      return { start, end };
    });
  } catch (err) {
    console.error("❌ Error fetching calendar events:", err);
    throw err;
  }
}

// 4) Export the edge function
Deno.serve(async (req) => {
  console.log("🔍 handle-calendar function called");
  // handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const events = await fetchEvents();
    console.log("🔍 Calendar events:", events);
    return new Response(
      JSON.stringify({ data: events }), 
      { status: 200,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        }
      }
    );
  } catch (err: any) {
    console.error("❌ Error in handle-calendar:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        }
      }
    );
  }
});