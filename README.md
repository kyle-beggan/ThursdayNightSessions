# Sleepy Hollows Studios - Thursday Night Sessions

Band rehearsal scheduling and communication application for Sleepy Hollows Studios.

## Features

- 🎵 **Session Management**: View and manage Thursday Night Sessions on a monthly calendar
- 👥 **RSVP System**: Commit to sessions and see who else is attending
- 🎸 **Capability Tracking**: Track player capabilities (instruments, roles)
- 📱 **Mobile Responsive**: Works seamlessly on desktop and mobile devices
- 🔐 **OAuth Authentication**: Sign in with Google or Facebook
- 📧 **Notifications**: Send SMS and email notifications to players
- 👑 **Admin Panel**: Manage users, sessions, and capabilities

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with OAuth
- **SMS**: Twilio
- **Email**: Resend

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account
- Google/Facebook OAuth credentials
- Twilio account (for SMS)
- Resend account (for email)

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd /Users/kylebeggan/dev/sleepyhollows
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory (see `ENV_SETUP.md` for details):
   ```bash
   cp ENV_SETUP.md .env.local
   # Edit .env.local with your actual credentials
   ```

4. **Set up Supabase**:
   - Create a new Supabase project at https://supabase.com
   - Run the SQL schema from `supabase-schema.sql` in the Supabase SQL Editor
   - Copy your project URL and anon key to `.env.local`

5. **Configure OAuth**:
   - **Google**: https://console.cloud.google.com
   - **Facebook**: https://developers.facebook.com
   - Add authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://yourdomain.com/api/auth/callback/google`

6. **Run the development server**:
   ```bash
   npm run dev
   ```

7. **Open the application**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup

The complete database schema is in `supabase-schema.sql`. It includes:

- Users table with approval workflow
- Sessions and session songs
- Capabilities and user capabilities
- Session commitments (RSVPs)
- Notifications audit log
- Row Level Security (RLS) policies

Run this SQL in your Supabase project's SQL Editor to set up all tables, indexes, and security policies.

## First-Time Setup

1. **Create your admin account**:
   - Sign in with Google/Facebook
   - Your account will be created with "pending" status
   - Manually update your status in Supabase:
     ```sql
     UPDATE users 
     SET status = 'approved', user_type = 'admin' 
     WHERE email = 'your-email@example.com';
     ```

2. **Add phone number** (required for SMS):
   ```sql
   UPDATE users 
   SET phone = '+1234567890' 
   WHERE email = 'your-email@example.com';
   ```

3. **Create your first session** (via admin panel once logged in)

## Project Structure

```
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── pending/
│   ├── (dashboard)/         # Main application
│   │   ├── admin/           # Admin-only pages
│   │   └── page.tsx         # Home page with calendar
│   ├── api/                 # API routes
│   │   ├── auth/
│   │   ├── sessions/
│   │   └── commitments/
│   └── layout.tsx           # Root layout
├── components/
│   ├── calendar/            # Calendar components
│   ├── ui/                  # Reusable UI components
│   └── layout/              # Layout components
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── types.ts             # TypeScript types
│   └── utils.ts             # Utility functions
└── public/
    └── logo.png             # Sleepy Hollows logo
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Make sure to set all variables from `ENV_SETUP.md` in your production environment:
- Supabase credentials
- NextAuth secret and URL
- OAuth client IDs and secrets
- Twilio credentials
- Resend API key

## Features Roadmap

### Current (Beta)
- ✅ Monthly calendar view
- ✅ Session RSVP system
- ✅ User management
- ✅ OAuth authentication
- ✅ Mobile responsive design

### Planned
- 📧 Email/SMS notifications
- 👥 Admin panel for user approval
- 🎵 Session management (admin)
- 📊 Attendance analytics
- 🎸 Capability management
- 📝 Session notes and recordings

## Support

For questions or issues, contact the development team or create an issue in the repository.

## License

Private project for Sleepy Hollows Studios.
