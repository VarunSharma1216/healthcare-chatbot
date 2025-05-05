// Enable Supabase Runtime types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { OpenAI } from "https://esm.sh/openai@4.20.1";

console.log("📡 handle-chat function loaded");

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse the incoming JSON
    const { messageText } = await req.json();

    // Get OpenAI API key from environment variables
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!apiKey) {
      console.error("OPENAI_API_KEY not found in environment variables");
      return new Response(
        JSON.stringify({ 
          error: "API key not configured",
          reply: "The chatbot is not properly configured. Please check the OPENAI_API_KEY environment variable."
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Initialize the OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Call the OpenAI API
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // You can change this to gpt-4 if needed
      messages: [
        {
          role: "system",
          content: "You are a helpful healthcare scheduling assistant. You help users find appropriate therapists based on their needs, preferences, and insurance. Be friendly, professional, and helpful. Ask follow-up questions to better understand their needs."
        },
        {
          role: "user",
          content: messageText
        }
      ],
      temperature: 0.7,
    });

    // Extract the response
    const reply = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request.";

    // Return the response
    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing request:", error);
    
    // Properly type the error
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        reply: "I'm sorry, there was an error processing your request. Please try again later."
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});