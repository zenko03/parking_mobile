// Web-specific configuration for react-native-vector-icons
if (typeof document !== 'undefined') {
    // Register icon fonts
    const iconFontStyles = `
    @font-face {
      font-family: 'Ionicons';
      src: url('https://unpkg.com/ionicons@4.6.3/dist/fonts/ionicons.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }

    @font-face {
      font-family: 'MaterialIcons';
      src: url('https://fonts.gstatic.com/s/materialicons/v139/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2') format('woff2');
      font-weight: normal;
      font-style: normal;
    }

    @font-face {
      font-family: 'MaterialCommunityIcons';
      src: url('https://cdn.jsdelivr.net/npm/@mdi/font@6.5.95/fonts/materialdesignicons-webfont.woff2') format('woff2');
      font-weight: normal;
      font-style: normal;
    }
  `;

    const style = document.createElement('style');
    style.textContent = iconFontStyles;
    document.head.appendChild(style);
}
