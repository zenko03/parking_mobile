// Configuration mobile-first pour React Native Web
// Injecte les meta tags et configurations optimales pour H5/PWA

if (typeof document !== 'undefined') {
  // 1. Meta viewport mobile-first (si absent)
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(viewport);
  }

  // 2. Meta tags PWA
  const metaTags = [
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'theme-color', content: '#FFFFFF' }, // Blanc pour eviter fond vert sur Safari iOS
    { name: 'format-detection', content: 'telephone=no' }, // Desactive detection auto tel
  ];

  metaTags.forEach(tag => {
    if (!document.querySelector(`meta[name="${tag.name}"]`)) {
      const meta = document.createElement('meta');
      meta.name = tag.name;
      meta.content = tag.content;
      document.head.appendChild(meta);
    }
  });

  // 3. Title optimise mobile
  if (!document.title || document.title === 'React App') {
    document.title = 'UPark - Parking Mobile';
  }

  // 4. Styles mobile-first additionnels
  const mobileStyles = `
    /* Prevent zoom on input focus (iOS) */
    input, textarea, select {
      font-size: 16px !important;
    }

    /* Improve touch targets (min 44x44px) */
    button, a, [role="button"] {
      min-height: 44px;
      min-width: 44px;
    }

    /* html et body prennent toute la hauteur sans deborder */
    html, body {
      height: 100%;
      overflow: hidden;
      margin: 0;
      padding: 0;
    }

    /* Prevent horizontal scroll */
    body {
      overflow-x: hidden;
      max-width: 100vw;
    }

    /* 
     * Le root React Native Web prend toute la hauteur visible.
     * 100dvh = dynamic viewport height = exclut les toolbars mobiles (Chrome/Safari).
     * Seul padding-top est ici: le notch en haut.
     * Le bas est gere par le composant Footer directement.
     */
    #root {
      height: 100vh;   /* fallback: navigateurs sans support dvh */
      height: 100dvh;  /* dynamic viewport: exclut les toolbars mobiles */
      box-sizing: border-box;
      padding-top: env(safe-area-inset-top, 0px);
      padding-left: env(safe-area-inset-left, 0px);
      padding-right: env(safe-area-inset-right, 0px);
      display: flex;
      flex-direction: column;
    }

    /* Smooth scrolling mobile */
    html {
      -webkit-overflow-scrolling: touch;
      scroll-behavior: smooth;
    }
  `;

  const style = document.createElement('style');
  style.textContent = mobileStyles;
  document.head.appendChild(style);
}
