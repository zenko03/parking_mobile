// Version Android - Supabase desactive (probleme polyfills TextDecoder avec Hermes)
// Metro utilisera automatiquement ce fichier sur Android au lieu de supabase.js

console.log('[SUPABASE] Android - Client desactive (utiliser API REST directe)');

// Export null - les composants doivent gerer ce cas
export const supabase = null;
