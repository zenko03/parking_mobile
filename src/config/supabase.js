// Version Web/iOS - Supabase fonctionne correctement
// Sur Android, Metro utilisera automatiquement supabase.android.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fbpefbjoxzkxombdcqif.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZicGVmYmpveHpreG9tYmRjcWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NDY4NTUsImV4cCI6MjA3OTAyMjg1NX0.R3m5_xHHkh-OH_GNY-DnV6RF5oRGNn6ED7pr5LeIFO0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        detectSessionInUrl: false,
        persistSession: false,
        autoRefreshToken: false,
    },
});

console.log('[SUPABASE] Client initialise (Web/iOS)');
