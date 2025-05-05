# Frontend Authentication Setup

This guide explains how to set up the frontend part of Supabase authentication for the Healthcare Chatbot application.

## Prerequisites

1. Supabase project set up (see backend/README_AUTH.md)
2. Supabase URL and Anon Key from your project

## Frontend Configuration

### 1. Environment Variables

Create a `.env` file in the frontend directory with the following content:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Replace the placeholders with your actual Supabase URL and Anon Key from your project dashboard.

### 2. Authentication Flow

The authentication system works as follows:

1. User clicks the "Admin Login" button in the Navbar
2. Login dialog appears, requesting email and password
3. Credentials are verified against Supabase Auth
4. If valid and the user has admin role, they are redirected to the Admin Dashboard
5. Protected routes check both authenticated status and admin role before allowing access
6. JWT tokens are stored in browser localStorage for session persistence

### 3. Development Testing

For development and testing purposes:

1. Make sure you've run the setup script in the backend to create an admin user
2. Or use the Supabase dashboard to create a user and manually set their role to 'admin' in the profiles table
3. If you're developing locally, make sure your Supabase project has localhost URLs allowed in the auth settings

### 4. Additional Authentication Types

If you want to add additional authentication methods:

1. Enable them in the Supabase Auth dashboard
2. Update the AuthContext.tsx file to include the new authentication methods
3. Add UI components for the new auth methods

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify your environment variables are correctly set up
3. Ensure the user has the 'admin' role in the profiles table
4. Try clearing localStorage and refreshing the page
5. Check if you can log in to the Supabase dashboard with the same credentials 