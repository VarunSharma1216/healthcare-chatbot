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
    // Initialize Supabase client with provided credentials
    const supabaseUrl = "https://rhbbgmrqrnooljgperdd.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYmJnbXJxcm5vb2xqZ3BlcmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMjY2NDIsImV4cCI6MjA2MTkwMjY0Mn0.ac7tAFgZs13esVqTcFZzRtIFioVv22KbjIrID1VJhlw";
    
    console.log("🔌 Initializing Supabase client...");
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    // Fetch all therapists for matching
    console.log("🔍 Fetching therapists for matching...");
    const { data: therapists, error: therapistError } = await supabase
      .from('therapists')
      .select('*');

    if (therapistError) {
      console.error("❌ Error fetching therapists:", therapistError);
    }

    // Format therapists data for the prompt
    const therapistsInfo = therapists ? therapists.map(t => ({
      id: t.id,
      name: t.name,
      specialties: t.specialties,
      accepted_insurance: t.accepted_insurance,
      email: t.email
    })) : [];

    console.log("📋 Available therapists:", JSON.stringify(therapistsInfo, null, 2));

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

Available therapists:
${JSON.stringify(therapistsInfo, null, 2)}

After collecting ALL of this information, analyze the patient's needs and match them with the most appropriate therapist from the available list. Consider:
- The patient's specific problem and required specialty
- The therapist's specialties and expertise
- Insurance compatibility

IMPORTANT: You MUST select a therapist from the available list above. Do not make up or suggest therapists that are not in the list.
If no therapist matches perfectly, choose the closest match based on specialty and insurance.

Provide a summary in this format:
"Here's the information I've collected:
- Problem: [problem_description]
- Schedule: [requested_schedule]
- Insurance: [insurance_info]
- Specialist Needed: [extracted_specialty]
- Contact: [contact_info]
- Matched Therapist: [therapist_name] (MUST be one of the therapists listed above)

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
    let reply = assistantMessage?.content || "I'm sorry, I couldn't process your request.";
    console.log("🤖 AI Response:", reply.substring(0, 50) + (reply.length > 50 ? "..." : ""));

    // Add current reply to the list of responses
    assistantResponses.push(reply);

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
          const therapistMatch = summaryResponse.match(/Matched Therapist: (.*?)(?:\r?\n|\r|$)/);
          
          console.log("🔍 Parsing results:");
          console.log("- Problem found:", !!problemMatch, problemMatch ? problemMatch[1] : "");
          console.log("- Schedule found:", !!scheduleMatch, scheduleMatch ? scheduleMatch[1] : "");
          console.log("- Insurance found:", !!insuranceMatch, insuranceMatch ? insuranceMatch[1] : "");
          console.log("- Specialty found:", !!specialtyMatch, specialtyMatch ? specialtyMatch[1] : "");
          console.log("- Contact found:", !!contactMatch, contactMatch ? contactMatch[1] : "");
          console.log("- Therapist found:", !!therapistMatch, therapistMatch ? therapistMatch[1] : "");
          
          if (problemMatch && scheduleMatch && insuranceMatch && specialtyMatch) {
            const problemDescription = problemMatch[1];
            const requestedSchedule = scheduleMatch[1];
            const insuranceInfo = insuranceMatch[1];
            const extractedSpecialty = specialtyMatch[1];
            // Use contact info as patient_identifier if available, otherwise generate a unique ID
            const patientIdentifier = contactMatch ? contactMatch[1] : `patient-${Date.now()}`;
            
            // Find the matched therapist's name if a match was found
            let matchedTherapistId: string | null = null;
            let matchedTherapistName: string | null = null;
            if (therapistMatch) {
              const therapistName = therapistMatch[1].trim();
              console.log("🔍 Looking for therapist:", therapistName);
              
              // Find the therapist in our database
              const matchedTherapist = therapists?.find(t => t.name.toLowerCase() === therapistName.toLowerCase());
              console.log("🔍 Found therapist in database:", matchedTherapist);
              
              if (matchedTherapist) {
                matchedTherapistId = matchedTherapist.id;
                matchedTherapistName = matchedTherapist.name;
                console.log("✅ Matched therapist ID:", matchedTherapistId);
              } else {
                console.log("⚠️ Warning: Matched therapist not found in database");
                // Try to find a therapist with matching specialty and insurance
                const alternativeMatch = therapists?.find(t => 
                  t.specialties?.toLowerCase().includes(extractedSpecialty.toLowerCase()) &&
                  t.accepted_insurance?.toLowerCase().includes(insuranceInfo.toLowerCase())
                );
                
                if (alternativeMatch) {
                  matchedTherapistId = alternativeMatch.id;
                  matchedTherapistName = alternativeMatch.name;
                  console.log("✅ Found alternative match:", alternativeMatch.name);
                  // Update the reply to reflect the alternative match
                  reply = reply.replace(therapistName, alternativeMatch.name);
                }
              }
            } else {
              console.log("ℹ️ No therapist match found in summary");
              // Try to find a therapist with matching specialty and insurance
              const alternativeMatch = therapists?.find(t => 
                t.specialties?.toLowerCase().includes(extractedSpecialty.toLowerCase()) &&
                t.accepted_insurance?.toLowerCase().includes(insuranceInfo.toLowerCase())
              );
              
              if (alternativeMatch) {
                matchedTherapistId = alternativeMatch.id;
                matchedTherapistName = alternativeMatch.name;
                console.log("✅ Found alternative match:", alternativeMatch.name);
                // Update the reply to include the matched therapist
                reply += `\n\nI've matched you with ${alternativeMatch.name} based on your needs and insurance.`;
              }
            }
            
            console.log("✅ All fields parsed successfully");
            console.log("📝 Patient Information:");
            console.log("- Problem:", problemDescription);
            console.log("- Schedule:", requestedSchedule);
            console.log("- Insurance:", insuranceInfo);
            console.log("- Specialty:", extractedSpecialty);
            console.log("- Contact:", patientIdentifier);
            console.log("- Matched Therapist:", matchedTherapistId);
            
            console.log("💾 Uploading to Supabase inquiries table...");
            // Insert the information into the inquiries table with matched therapist
            const { data, error: insertError } = await supabase
              .from('inquiries')
              .insert([
                {
                  patient_identifier: patientIdentifier,
                  problem_description: problemDescription,
                  requested_schedule: requestedSchedule,
                  insurance_info: insuranceInfo,
                  extracted_specialty: extractedSpecialty,
                  matched_therapist_id: matchedTherapistId,
                  status: matchedTherapistId ? 'matched' : 'pending'
                }
              ])
              .select();
            
            if (insertError) {
              console.error("❌ Error inserting inquiry:", insertError);
              console.error("❌ Error details:", JSON.stringify(insertError));
            } else {
              console.log("✅ SUCCESS: Patient information uploaded to Supabase inquiries table");
              console.log("📊 New record ID:", data && data[0] ? data[0].id : "unknown");
              console.log("📊 Matched Therapist ID in saved data:", data && data[0] ? data[0].matched_therapist_id : "none");
              dataSaved = true;
              savedData = data && data[0] ? data[0] : null;

              // If we have a matched therapist, try to book the calendar event
              if (matchedTherapistId) {
                try {
                  console.log("📅 Attempting to book calendar event...");
                  console.log("📅 Calling handle-calendar function...");
                  
                  // Call the handle-calendar function
                  const calendarResponse = await fetch('https://rhbbgmrqrnooljgperdd.supabase.co/functions/v1/handle-calendar', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
                    },
                    body: JSON.stringify({})
                  });

                  console.log("📅 Calendar response status:", calendarResponse.status);
                  const responseText = await calendarResponse.text();
                  console.log("📅 Calendar response text:", responseText);
                  
                  let calendarResult;
                  try {
                    calendarResult = JSON.parse(responseText);
                  } catch (e) {
                    console.error("❌ Error parsing calendar response:", e);
                    throw new Error("Invalid response from calendar function");
                  }

                  console.log("📅 Calendar booking result:", calendarResult);

                  if (calendarResult.success) {
                    // Update the reply to include calendar confirmation
                    reply += `\n\nI've scheduled your appointment with ${matchedTherapistName} for May 15, 2025 at 4:00 PM. You'll receive a calendar invitation shortly.`;
                  } else {
                    console.error("❌ Error booking calendar:", calendarResult.error);
                    reply += `\n\nI've matched you with ${matchedTherapistName}, but there was an issue scheduling the calendar event. Please contact the office directly to confirm your appointment time.`;
                  }
                } catch (error) {
                  console.error("❌ Error in calendar booking process:", error);
                  reply += `\n\nI've matched you with ${matchedTherapistName}, but there was an issue scheduling the calendar event. Please contact the office directly to confirm your appointment time.`;
                }
              }
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