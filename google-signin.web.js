// Chargement du SDK Google Identity Services pour H5
// Necesssaire pour Google Sign-In sur React Native Web

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  // Verifier si le script n'est pas deja charge
  if (!document.getElementById('google-gsi-script')) {
    console.log(' Loading Google Identity Services SDK...');

    // Charger le SDK Google Identity Services (GIS)
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log(' Google Identity Services SDK loaded');
      // Le SDK est maintenant disponible via window.google.accounts.id
    };

    script.onerror = (error) => {
      console.error('Failed to load Google Identity Services SDK:', error);
    };

    document.head.appendChild(script);
  }
}
