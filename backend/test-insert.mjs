import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://rhbbgmrqrnooljgperdd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYmJnbXJxcm5vb2xqZ3BlcmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMjY2NDIsImV4cCI6MjA2MTkwMjY0Mn0.ac7tAFgZs13esVqTcFZzRtIFioVv22KbjIrID1VJhlw';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Starting test insert to Supabase inquiries table...');

const testData = {
  patient_identifier: 'test-user-123',
  problem_description: 'Test depression case',
  requested_schedule: 'Weekdays at 4pm',
  insurance_info: 'Anthem Blue Cross PPO',
  extracted_specialty: 'Depression Specialist',
  status: 'pending'
};

async function runTest() {
  try {
    console.log('Attempting to insert:', testData);
    
    const { data, error } = await supabase
      .from('inquiries')
      .insert([testData])
      .select();
      
    if (error) {
      console.error('ERROR:', error);
    } else {
      console.log('SUCCESS! Data inserted:', data);
    }
  } catch (e) {
    console.error('EXCEPTION:', e);
  }
}

runTest();