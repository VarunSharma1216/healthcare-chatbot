// Enable Supabase Runtime types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { OpenAI } from "https://esm.sh/openai@4.20.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

console.log("📡 handle-chat function loaded");

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Interface for OpenAI message
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

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
    const { messageText, conversationHistory = [] } = await req.json();
    console.log("📩 Received message:", messageText.substring(0, 50) + (messageText.length > 50 ? "..." : ""));
    console.log("📜 Conversation history length:", conversationHistory.length);

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

    // Extract all assistant responses from conversation history
    const assistantResponses = conversationHistory
      .filter((msg: ChatMessage) => msg.role === 'assistant')
      .map((msg: ChatMessage) => msg.content);
    
    console.log(`📚 Found ${assistantResponses.length} previous assistant responses`);

    // Prepare messages array with system prompt and conversation history
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are a helpful healthcare scheduling assistant. Your task is to collect the following information from the user to help find appropriate therapists:

1. problem_description: What health issue or condition they need help with
2. requested_schedule: Their availability or preferred times for appointments
3. insurance_info: Their insurance provider details
4. extracted_specialty: Based on their problem, the type of specialist they need (you determine this)
5. contact_info: Their email address or phone number for appointment confirmations

After collecting ALL of this information, provide a summary in this format:
"Here's the information I've collected:
- Problem: [problem_description]
- Schedule: [requested_schedule]
- Insurance: [insurance_info]
- Specialist Needed: [extracted_specialty]
- Contact: [contact_info]

Is this information correct? If so, I'll proceed with finding the right therapist for you. If not, please let me know what needs to be corrected."

Be friendly, professional, and conversational. Ask follow-up questions until you have all the required information. Do not provide the summary until you have collected all the required information.

Make sure to collect their contact information (email or phone) so they can be reached about their appointment.

Remember the information the user has shared previously in the conversation.`
      },
      ...conversationHistory,
      {
        role: "user",
        content: messageText
      }
    ];

    console.log("🤖 Calling OpenAI API...");
    // Call the OpenAI API
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // You can change this to gpt-4 if needed
      messages: messages,
      temperature: 0.7,
    });
    console.log("✅ OpenAI API call successful");

    // Extract the response
    const assistantMessage = chatCompletion.choices[0]?.message;
    const reply = assistantMessage?.content || "I'm sorry, I couldn't process your request.";
    console.log("🤖 AI Response:", reply.substring(0, 50) + (reply.length > 50 ? "..." : ""));

    // Add current reply to the list of responses
    assistantResponses.push(reply);

    // Initialize Supabase client with provided credentials
    const supabaseUrl = "https://rhbbgmrqrnooljgperdd.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYmJnbXJxcm5vb2xqZ3BlcmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMjY2NDIsImV4cCI6MjA2MTkwMjY0Mn0.ac7tAFgZs13esVqTcFZzRtIFioVv22KbjIrID1VJhlw";
    
    console.log("🔌 Initializing Supabase client...");
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Variable to track if data was saved
    let dataSaved = false;
    let savedData = null;

    // Check if this message is a confirmation like "yes" or "correct"
    const isConfirmation = ['yes', 'yees', 'correct', 'that is correct', 'yes that is correct', 'right', 'that\'s right', 'ok'].includes(messageText.toLowerCase().trim());
    console.log(`🔍 Message is confirmation: ${isConfirmation}`);

    // Find the most recent response with a summary
    let summaryResponse = '';
    if (isConfirmation) {
      // If user says "yes", look for the most recent summary in previous responses
      // Start from the end (most recent) and go backwards
      for (let i = assistantResponses.length - 2; i >= 0; i--) {
        if (assistantResponses[i].includes("Here's the information I've collected:")) {
          summaryResponse = assistantResponses[i];
          console.log(`✅ Found summary in assistant response #${i+1}`);
          break;
        }
      }
    } else {
      // For non-confirmation messages, check if current reply has summary
      if (reply.includes("Here's the information I've collected:")) {
        summaryResponse = reply;
        console.log("✅ Found summary in current response");
      }
    }

    // If we found a summary, try to parse it and save to database
    if (summaryResponse) {
      console.log("📋 Summary detected - attempting to parse and save to database");
      console.log("🔍 Summary content:", summaryResponse);
      
      // Only proceed with saving if this is a confirmation message
      if (isConfirmation) {
        try {
          // Extract information from the summary - updated regex patterns to match actual format
          const problemMatch = summaryResponse.match(/Problem: (.*?)(?:\r?\n|\r|$)/);
          const scheduleMatch = summaryResponse.match(/Schedule: (.*?)(?:\r?\n|\r|$)/);
          const insuranceMatch = summaryResponse.match(/Insurance: (.*?)(?:\r?\n|\r|$)/);
          const specialtyMatch = summaryResponse.match(/Specialist Needed: (.*?)(?:\r?\n|\r|$)/);
          const contactMatch = summaryResponse.match(/Contact: (.*?)(?:\r?\n|\r|$)/);
          
          console.log("🔍 Parsing results:");
          console.log("- Problem found:", !!problemMatch, problemMatch ? problemMatch[1] : "");
          console.log("- Schedule found:", !!scheduleMatch, scheduleMatch ? scheduleMatch[1] : "");
          console.log("- Insurance found:", !!insuranceMatch, insuranceMatch ? insuranceMatch[1] : "");
          console.log("- Specialty found:", !!specialtyMatch, specialtyMatch ? specialtyMatch[1] : "");
          console.log("- Contact found:", !!contactMatch, contactMatch ? contactMatch[1] : "");
          
          if (problemMatch && scheduleMatch && insuranceMatch && specialtyMatch) {
            const problemDescription = problemMatch[1];
            const requestedSchedule = scheduleMatch[1];
            const insuranceInfo = insuranceMatch[1];
            const extractedSpecialty = specialtyMatch[1];
            // Use contact info as patient_identifier if available, otherwise generate a unique ID
            const patientIdentifier = contactMatch ? contactMatch[1] : `patient-${Date.now()}`;
            
            console.log("✅ All fields parsed successfully");
            console.log("📝 Patient Information:");
            console.log("- Problem:", problemDescription);
            console.log("- Schedule:", requestedSchedule);
            console.log("- Insurance:", insuranceInfo);
            console.log("- Specialty:", extractedSpecialty);
            console.log("- Contact:", patientIdentifier);
            
            console.log("💾 Uploading to Supabase inquiries table...");
            // Insert the information into the inquiries table
            const { data, error: insertError } = await supabase
              .from('inquiries')
              .insert([
                {
                  patient_identifier: patientIdentifier,
                  problem_description: problemDescription,
                  requested_schedule: requestedSchedule,
                  insurance_info: insuranceInfo,
                  extracted_specialty: extractedSpecialty,
                  status: 'pending'
                }
              ])
              .select();
            
            if (insertError) {
              console.error("❌ Error inserting inquiry:", insertError);
              console.error("❌ Error details:", JSON.stringify(insertError));
            } else {
              console.log("✅ SUCCESS: Patient information uploaded to Supabase inquiries table");
              console.log("📊 New record ID:", data && data[0] ? data[0].id : "unknown");
              dataSaved = true;
              savedData = data && data[0] ? data[0] : null;
            }
          } else {
            console.error("❌ Some fields couldn't be parsed from the summary");
          }
        } catch (error) {
          console.error("❌ Error parsing or saving inquiry:", error);
          console.error("❌ Error details:", JSON.stringify(error));
        }
      } else {
        console.log("ℹ️ Summary found but waiting for user confirmation before saving");
      }
    } else {
      console.log("ℹ️ No summary found in any messages - still collecting information");
    }

    // Add the assistant's message to the conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: "user", content: messageText },
      { role: "assistant", content: reply }
    ];

    // Return the response with updated conversation history and data saved status
    return new Response(
      JSON.stringify({ 
        reply,
        conversationHistory: updatedHistory,
        dataSaved,
        savedData
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("❌ Error processing request:", error);
    console.error("❌ Error details:", JSON.stringify(error));
    
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