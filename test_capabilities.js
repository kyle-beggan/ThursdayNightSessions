const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function test() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: capabilities, error } = await supabase
        .from('capabilities')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Capabilities:', JSON.stringify(capabilities, null, 2));
}

test();
