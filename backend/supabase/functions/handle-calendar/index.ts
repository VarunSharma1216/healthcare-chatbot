// Enable Supabase Runtime types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.log("🚀 handle-calendar function starting...");

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Pull in your Google OAuth secrets
const GOOGLE_CLIENT_ID     = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
const GOOGLE_REFRESH_TOKEN = Deno.env.get("GOOGLE_REFRESH_TOKEN");

console.log("🔑 Environment variables check:");
console.log(
  "- GOOGLE_CLIENT_ID:     ",
  GOOGLE_CLIENT_ID     ? `Present (len=${GOOGLE_CLIENT_ID.length})`     : "❌ Missing"
);
console.log(
  "- GOOGLE_CLIENT_SECRET: ",
  GOOGLE_CLIENT_SECRET ? `Present (len=${GOOGLE_CLIENT_SECRET.length})` : "❌ Missing"
);
console.log(
  "- GOOGLE_REFRESH_TOKEN: ",
  GOOGLE_REFRESH_TOKEN ? `Present (len=${GOOGLE_REFRESH_TOKEN.length})` : "❌ Missing"
);

const EVENT_NAME            = "Therapy Session";
const EVENT_START_ISO       = "2025-05-15T16:00:00-07:00";   // Z or offset assumed in toISOString
const EVENT_DURATION_MIN    = 60;                    // minutes

async function getAccessToken() {
  console.log("🔑 Exchanging refresh token for access token…");
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID     || "",
      client_secret: GOOGLE_CLIENT_SECRET || "",
      refresh_token: GOOGLE_REFRESH_TOKEN || "",
      grant_type:    "refresh_token",
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    console.error("❌ Token endpoint error:", txt);
    throw new Error(`Token exchange failed: ${txt}`);
  }
  const { access_token } = await resp.json();
  console.log("✅ Got access token");
  return access_token;
}

async function addEvent() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error("Missing one or more Google OAuth environment variables");
  }

  const token = await getAccessToken();

  // build our event
  const start = new Date(EVENT_START_ISO);
  const end   = new Date(start.getTime() + EVENT_DURATION_MIN * 60_000);
  const event = {
    summary:     EVENT_NAME,
    description: "Therapy appointment scheduled via healthcare chatbot",
    start:  { dateTime: start.toISOString(), timeZone: "America/Los_Angeles" },
    end:    { dateTime: end.toISOString(),   timeZone: "America/Los_Angeles" },
  };
  console.log("📝 Event payload:", JSON.stringify(event, null, 2));

  const resp = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!resp.ok) {
    const errTxt = await resp.text();
    console.error("❌ Calendar API error:", errTxt);
    throw new Error(`Calendar insert failed: ${errTxt}`);
  }

  const data: any = await resp.json();
  console.log("✅ Event created, ID =", data.id);
  return {
    success:      true,
    eventId:      data.id,
    eventDetails: { summary: data.summary, start: data.start?.dateTime, end: data.end?.dateTime },
  };
}

// Our Edge Function
Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  console.log("📥 Received request:", req.method, req.url);
  try {
    const result = await addEvent();
    console.log("📤 Sending response:", JSON.stringify(result, null, 2));
    return new Response(JSON.stringify(result), {
      status: 200,
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