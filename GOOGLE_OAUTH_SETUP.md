# Setting Up Google OAuth - Required for Authentication

**IMPORTANT**: OAuth authentication is now **required** for the Sleepy Hollows Studios application. Username/password authentication has been removed. You must set up Google OAuth credentials to use the application.

## Quick Setup (5 minutes)

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com
2. Sign in with your Google account

### Step 2: Create a Project
1. Click the project dropdown at the top (next to "Google Cloud")
2. Click "New Project"
3. Name it: "Sleepy Hollows Studios"
4. Click "Create"
5. Wait for the project to be created, then select it

### Step 3: Enable Google+ API
1. In the left sidebar, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### Step 4: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" at the top
3. Select "OAuth client ID"
4. If prompted to configure consent screen:
   - Click "Configure Consent Screen"
   - Choose "External" (unless you have a Google Workspace)
   - Click "Create"
   - Fill in:
     - App name: "Sleepy Hollows Studios"
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue"
   - Skip "Scopes" (click "Save and Continue")
   - Skip "Test users" (click "Save and Continue")
   - Click "Back to Dashboard"

5. Go back to "Credentials" → "+ CREATE CREDENTIALS" → "OAuth client ID"
6. Application type: "Web application"
7. Name: "Sleepy Hollows Studios Web"
8. Under "Authorized redirect URIs", click "+ ADD URI" and add:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
9. Click "Create"

### Step 5: Copy Your Credentials
You'll see a popup with:
- **Client ID** (starts with something like `123456789-abc...apps.googleusercontent.com`)
- **Client Secret** (a random string)

**Copy both of these!**

### Step 6: Update Your `.env.local`
Replace the placeholder values:

```bash
GOOGLE_CLIENT_ID=your-actual-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
```

### Step 7: Restart Dev Server
1. Stop the server (Ctrl+C in terminal)
2. Run `npm run dev`
3. Visit http://localhost:3000
4. Click "Sign in with Google"
5. It should work now! ✅

---

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure you added the exact redirect URI: `http://localhost:3000/api/auth/callback/google`
- Make sure there are no extra spaces or typos

### Still getting 500 error
- Double-check your Client ID and Secret are copied correctly
- Make sure you restarted the dev server after updating `.env.local`
- Check the terminal for error messages

### "This app isn't verified"
- This is normal for development
- Click "Advanced" → "Go to Sleepy Hollows Studios (unsafe)"
- This warning won't appear once you deploy to production and verify the app

---

## What Happens After Setup

Once Google OAuth is working:
1. Click "Sign in with Google"
2. Choose your Google account
3. Grant permissions
4. You'll be created as a user with "pending" status
5. You'll see the "Account Under Review" page
6. You'll need to manually approve yourself in Supabase (see walkthrough.md)
7. After approval, you'll see the calendar!

---

## Need Help?

If you get stuck at any step, let me know which step and what error you're seeing!


### "Access blocked: This app's request is invalid"
- Make sure you added the exact redirect URI: `http://localhost:3000/api/auth/callback/google`
- Make sure there are no extra spaces or typos

### Still getting 500 error
- Double-check your Client ID and Secret are copied correctly
- Make sure you restarted the dev server after updating `.env.local`
- Check the terminal for error messages

### "This app isn't verified"
- This is normal for development
- Click "Advanced" → "Go to Sleepy Hollows Studios (unsafe)"
- This warning won't appear once you deploy to production and verify the app

---

## What Happens After Setup

Once Google OAuth is working:
1. Click "Sign in with Google"
2. Choose your Google account
3. Grant permissions
4. You'll be created as a user with "pending" status
5. You'll see the "Account Under Review" page
6. You'll need to manually approve yourself in Supabase (see walkthrough.md)
7. After approval, you'll see the calendar!

---

## Need Help?

If you get stuck at any step, let me know which step and what error you're seeing!
