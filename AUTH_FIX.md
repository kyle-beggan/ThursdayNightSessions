# OAuth-Only Authentication Setup

## The Change
The Sleepy Hollows Studios application now uses **OAuth-only authentication**. Username/password login has been removed for improved security and user experience.

## Required Setup

### Step 1: Add NextAuth Secret
Add this to your `.env.local` file:

```bash
NEXTAUTH_SECRET=v74XuEz5yigSWQ/27WVjXRC+mFQp887H9M6nSgdJkOg=
```

### Step 2: Configure OAuth Credentials
You **must** set up Google OAuth credentials. Facebook OAuth is optional.

**Required:**
```bash
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
```

**Optional:**
```bash
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
```

### Step 3: Your Complete `.env.local` Should Look Like:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=v74XuEz5yigSWQ/27WVjXRC+mFQp887H9M6nSgdJkOg=

# OAuth (Required for Google, Optional for Facebook)
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id (optional)
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret (optional)

# Twilio (Optional - for later)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Resend (Optional - for later)
RESEND_API_KEY=
FROM_EMAIL=noreply@sleepyhollows.com
```

### Step 4: Restart Dev Server
After saving `.env.local`, restart your dev server:
1. Stop the current server (Ctrl+C)
2. Run `npm run dev`
3. Visit http://localhost:3000

## What to Expect
- ✅ You'll see the Sleepy Hollows login page with OAuth buttons
- ✅ Click "Sign in with Google" to authenticate
- ✅ New users will be created with "pending" status
- ✅ Admins can approve users in Supabase

## Setting Up Google OAuth
See `GOOGLE_OAUTH_SETUP.md` for detailed instructions on creating Google OAuth credentials.

## How It Works
1. Users sign in with Google (or Facebook)
2. On first sign-in, a user record is created in Supabase with `status: 'pending'`
3. Users see the "Account Under Review" page
4. Admins approve users in Supabase by changing status to `'approved'`
5. Approved users can access the full application
