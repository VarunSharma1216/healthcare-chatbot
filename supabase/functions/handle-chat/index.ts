// Enable Supabase Runtime types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.log("📡 handle-chat function loaded");

Deno.serve(async (req) => {
  // parse out the incoming JSON
  const { messageText } = await req.json();

  // build a simple echo response
  const data = {
    reply: `You said: "${messageText}"`,
  };

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});