import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeUserAdmin(email: string) {
    console.log(`Updating user ${email} to admin...`);

    const { data, error } = await supabase
        .from('users')
        .update({ user_type: 'admin', status: 'approved' })
        .eq('email', email)
        .select();

    if (error) {
        console.error('Error updating user:', error);
        process.exit(1);
    }

    console.log('User updated successfully:', data);
    process.exit(0);
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.error('Please provide an email address as an argument');
    console.error('Usage: npx tsx scripts/make-admin.ts user@example.com');
    process.exit(1);
}

makeUserAdmin(email);
