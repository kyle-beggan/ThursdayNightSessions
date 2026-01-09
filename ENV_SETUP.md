# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

FACEBOOK_CLIENT_ID=your_facebook_client_id_here
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret_here

TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@sleepyhollows.com
```

## Setup Instructions

1. **Supabase**: Create a project at https://supabase.com
2. **NextAuth**: Generate a secret with `openssl rand -base64 32`
3. **Google OAuth**: Set up at https://console.cloud.google.com
4. **Facebook OAuth**: Set up at https://developers.facebook.com
5. **Twilio**: Create account at https://www.twilio.com
6. **Resend**: Create account at https://resend.com
