const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function checkPolicies() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: policies, error } = await supabase
        .rpc('run_sql', { sql_query: "SELECT * FROM pg_policies WHERE tablename = 'capabilities'" });

    if (error) {
        // If run_sql rpc is not available, we may need another way.
        // Let's try to just select from a view if possible.
        console.error('Error (maybe RPC not exists):', error);
        
        // Alternative: try to use a scratch script with a direct pg connection if I had one.
        // Since I don't, I'll try to use the supabase client to query something that might reveal policies.
        return;
    }

    console.log('Policies:', JSON.stringify(policies, null, 2));
}

checkPolicies();
