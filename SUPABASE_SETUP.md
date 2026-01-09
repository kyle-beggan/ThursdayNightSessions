# Supabase Setup Guide - Quick Start

## Step 1: Create Supabase Project (5 minutes)

1. **Go to Supabase**: https://supabase.com
2. **Sign in** with your GitHub or Google account
3. **Create a new project**:
   - Click "New Project"
   - Organization: Select or create one
   - Name: `sleepy-hollows-studios`
   - Database Password: Generate a strong password (save it!)
   - Region: Choose closest to you (e.g., `East US`)
   - Click "Create new project"
4. **Wait** for the project to be created (~2 minutes)

## Step 2: Get Your Credentials

Once the project is ready:

1. **Go to Project Settings** (gear icon in sidebar)
2. **Click "API"** in the settings menu
3. **Copy these values**:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`
   - **service_role key**: Click "Reveal" and copy (different from anon key)

## Step 3: Update Your `.env.local`

Replace the placeholder values in your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2OD...
```

## Step 4: Run the Database Schema

1. **In Supabase Dashboard**, click **"SQL Editor"** in the left sidebar
2. **Click "New query"**
3. **Copy the entire contents** of the file `supabase-schema.sql` from your project
4. **Paste it** into the SQL editor
5. **Click "Run"** (or press Cmd/Ctrl + Enter)
6. **Wait** for it to complete - you should see "Success. No rows returned"

This creates all the tables, indexes, and security policies.

## Step 5: Add Test Data

After the schema is created, run this SQL to add test sessions:

```sql
-- Insert test capabilities (already done by schema, but just in case)
INSERT INTO capabilities (name) VALUES
  ('vocalist'),
  ('drums'),
  ('bass guitar'),
  ('keyboards'),
  ('lead guitar')
ON CONFLICT (name) DO NOTHING;

-- Insert a test user (you can use your own email)
INSERT INTO users (id, email, name, phone, user_type, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@sleepyhollows.com',
  'Test User',
  '+15551234567',
  'admin',
  'approved'
) ON CONFLICT (id) DO NOTHING;

-- Insert test sessions for January 2026
INSERT INTO sessions (date, start_time, end_time, created_by) VALUES
  ('2026-01-09', '19:30:00', '23:30:00', '00000000-0000-0000-0000-000000000001'),
  ('2026-01-16', '19:30:00', '23:30:00', '00000000-0000-0000-0000-000000000001'),
  ('2026-01-23', '19:30:00', '23:30:00', '00000000-0000-0000-0000-000000000001'),
  ('2026-01-30', '19:30:00', '23:30:00', '00000000-0000-0000-0000-000000000001');

-- Get the session IDs (you'll see them in the results)
-- Then add songs to the first session
INSERT INTO session_songs (session_id, song_name, song_url, "order")
SELECT id, 'Superstition', 'https://www.youtube.com/watch?v=0CFuCYNx-1g', 0
FROM sessions WHERE date = '2026-01-09'
UNION ALL
SELECT id, 'September', 'https://www.youtube.com/watch?v=Gs069dndIYk', 1
FROM sessions WHERE date = '2026-01-09';

-- Add songs to second session
INSERT INTO session_songs (session_id, song_name, song_url, "order")
SELECT id, 'Brick House', 'https://www.youtube.com/watch?v=rrBx6mAWYPU', 0
FROM sessions WHERE date = '2026-01-16';

-- Add songs to third session
INSERT INTO session_songs (session_id, song_name, song_url, "order")
SELECT id, 'Pick Up The Pieces', 'https://www.youtube.com/watch?v=FnH_zwVmiuE', 0
FROM sessions WHERE date = '2026-01-23'
UNION ALL
SELECT id, 'What Is Hip', 'https://www.youtube.com/watch?v=oAatPPEaZDA', 1
FROM sessions WHERE date = '2026-01-23';
```

## Step 6: Restart Your Dev Server

1. **Stop the dev server** (Ctrl+C in terminal)
2. **Run**: `npm run dev`
3. **Visit**: http://localhost:3000

## Step 7: See Your Calendar! 🎉

You should now see:
- ✅ Sleepy Hollows logo and header
- ✅ Monthly calendar for January 2026
- ✅ Four sessions displayed on the calendar (Jan 9, 16, 23, 30)
- ✅ Click on a session to see details and songs

## Troubleshooting

### "Error fetching sessions"
- Check that your Supabase credentials are correct in `.env.local`
- Make sure you restarted the dev server after updating `.env.local`
- Check the browser console for detailed errors

### Calendar is empty
- Make sure the test data SQL ran successfully
- Check that today's date is in January 2026 (or adjust the test dates)
- Try navigating to January 2026 using the calendar arrows

### Database errors
- Make sure the schema SQL completed without errors
- Check the Supabase dashboard → Database → Tables to see if tables were created
- Look for error messages in the SQL editor

## Next Steps

Once you see the calendar working:
1. **Click on a session** to see the modal with songs
2. **Try the commit button** (it won't work yet without proper auth, but you can see the UI)
3. **Hover over a session** to see the tooltip (currently empty until you add commitments)
4. **Navigate between months** using the prev/next buttons

Then you can:
- Set up Google OAuth to enable real login
- Add more test sessions
- Start building admin features
- Add user capabilities and commitments

---

**Need help?** If you get stuck at any step, let me know which step and what error you're seeing!
