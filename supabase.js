// Supabase client — requires config.js (gitignored) and the Supabase CDN script.
// Falls back gracefully if either is missing.

var supabaseClient = null;

try {
    if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined' &&
        typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized');
    } else {
        console.warn('Supabase not available — running offline');
    }
} catch (e) {
    console.error('Supabase init error:', e);
}

function getSupabase() {
    return supabaseClient;
}
