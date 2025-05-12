# Healthcare Patient Scheduling Chatbot

A modern healthcare scheduling system that uses AI to match patients with therapists and manage appointments through Google Calendar integration.

## Features

- 🤖 AI-powered patient intake and scheduling
- 🏥 Therapist matching based on specialties and insurance
- 📅 Google Calendar integration for appointment management
- 🔒 Secure admin dashboard for managing inquiries and appointments
- 💬 Natural language chat interface for patients

## Tech Stack

- **Frontend**: React + TypeScript + Material-UI
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: OpenAI GPT/Claude/Gemini API
- **Authentication**: Supabase Auth
- **Calendar Integration**: Google Calendar API

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Google Cloud Platform account
- AI API key (OpenAI/Claude/Gemini)

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (Supabase Secrets)
```
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Database Schema

### Therapists
- id (uuid, primary key)
- name (text)
- specialties (text[])
- accepted_insurance (text[])
- google_calendar_id (text)
- google_refresh_token (text)
- created_at (timestamp)

### Inquiries
- id (uuid, primary key)
- patient_identifier (text)
- problem_description (text)
- requested_schedule (text)
- insurance_info (text)
- extracted_specialty (text)
- matched_therapist_id (uuid)
- status (text)
- created_at (timestamp)

### Appointments
- id (uuid, primary key)
- inquiry_id (uuid)
- therapist_id (uuid)
- patient_identifier (text)
- start_time (timestamp)
- end_time (timestamp)
- google_calendar_event_id (text)
- status (text)
- created_at (timestamp)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/healthcare-chatbot.git
   cd healthcare-chatbot
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install Supabase CLI
   npm install -g supabase
   ```

3. **Set up Supabase**
   ```bash
   # Initialize Supabase
   supabase init

   # Link to your project
   supabase link --project-ref your-project-ref

   # Deploy database schema
   supabase db push
   ```

4. **Configure Google Calendar API**
   - Go to Google Cloud Console
   - Create a new project
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs

5. **Deploy Edge Functions**
   ```bash
   supabase functions deploy handle-chat
   supabase functions deploy handle-calendar
   supabase functions deploy handle-oauth
   ```

6. **Start the development server**
   ```bash
   cd frontend
   npm run dev
   ```

## Project Structure

```
healthcare-chatbot/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── supabaseClient.ts
│   └── package.json
├── backend/
│   └── supabase/
│       ├── functions/
│       │   ├── handle-chat/
│       │   ├── handle-calendar/
│       │   └── handle-oauth/
│       └── migrations/
└── README.md
```

## Usage

1. **Patient Chat Interface**
   - Visit the chat interface
   - Describe your problem and schedule preferences
   - The AI will match you with a suitable therapist
   - Confirm appointment details

2. **Admin Dashboard**
   - Log in to the admin interface
   - View and manage patient inquiries
   - Monitor scheduled appointments
   - Connect therapist Google Calendars

## Security Considerations

- All sensitive data is encrypted at rest
- Row Level Security (RLS) policies protect database access
- OAuth 2.0 for Google Calendar integration
- Secure storage of refresh tokens
- HIPAA compliance considerations implemented

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI/Anthropic/Google for AI APIs
- Supabase for backend infrastructure
- Material-UI for frontend components
