import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function WebFonts() {
    useEffect(() => {
        if (Platform.OS === 'web') {
            // Charger les polices locales directement
            // (pas besoin de Google Fonts, on utilise les fichiers .ttf du projet)

            // Add Leaflet CSS for maps
            const leafletLink = document.createElement('link');
            leafletLink.rel = 'stylesheet';
            leafletLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(leafletLink);

            // Inject global CSS styles directly
            const style = document.createElement('style');
            style.textContent = `
                /* Charger la police variable Figtree depuis les assets locaux */
                @font-face {
                  font-family: 'Figtree';
                  src: url(${require('../assets/fonts/Figtree-VariableFont_wght.ttf')}) format('truetype-variations');
                  font-weight: 300 800;
                  font-style: normal;
                }

                /* Alias pour tous les variants Figtree utilises dans le code React Native */
                @font-face {
                  font-family: 'Figtree-Light';
                  src: url(${require('../assets/fonts/Figtree-VariableFont_wght.ttf')}) format('truetype');
                  font-weight: 300;
                }
                @font-face {
                  font-family: 'Figtree-Regular';
                  src: url(${require('../assets/fonts/Figtree-VariableFont_wght.ttf')}) format('truetype');
                  font-weight: 400;
                }
                @font-face {
                  font-family: 'Figtree-Medium';
                  src: url(${require('../assets/fonts/Figtree-VariableFont_wght.ttf')}) format('truetype');
                  font-weight: 500;
                }
                @font-face {
                  font-family: 'Figtree-SemiBold';
                  src: url(${require('../assets/fonts/Figtree-VariableFont_wght.ttf')}) format('truetype');
                  font-weight: 600;
                }
                @font-face {
                  font-family: 'Figtree-Bold';
                  src: url(${require('../assets/fonts/Figtree-VariableFont_wght.ttf')}) format('truetype');
                  font-weight: 700;
                }
                @font-face {
                  font-family: 'Figtree-ExtraBold';
                  src: url(${require('../assets/fonts/Figtree-VariableFont_wght.ttf')}) format('truetype');
                  font-weight: 800;
                }

                /* Alias Poppins vers Figtree pour compatibilite */
                @font-face {
                  font-family: 'Poppins-Light';
                  src: url(${require('../assets/fonts/Figtree-VariableFont_wght.ttf')}) format('truetype');
                  font-weight: 300;
                }
                @font-face {
                  font-family: 'Poppins-Regular';
                  src: url(${require('../assets/fonts/Figtree-VariableFont_wght.ttf')}) format('truetype');
                  font-weight: 400;
                }
                @font-face {
                  font-family: 'Poppins-Medium';
                  src: url(${require('../assets/fonts/Figtree-VariableFont_wght.ttf')}) format('truetype');
                  font-weight: 500;
                }
                @font-face {
                  font-family: 'Poppins-SemiBold';
                  src: url(${require('../assets/fonts/Figtree-VariableFont_wght.ttf')}) format('truetype');
                  font-weight: 600;
                }
                @font-face {
                  font-family: 'Poppins-Bold';
                  src: url(${require('../assets/fonts/Figtree-VariableFont_wght.ttf')}) format('truetype');
                  font-weight: 700;
                }

                /* Police Figtree par defaut sur body */
                body {
                  font-family: 'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                }

                /* Force Figtree sur tous les elements texte */
                * {
                  font-family: 'Figtree', sans-serif;
                }

                /* Preserve les polices d'icones */
                [class*="MaterialCommunityIcons"],
                [class*="MaterialIcons"],
                [class*="FontAwesome"],
                [class*="Ionicons"],
                [class*="Feather"],
                [class*="Entypo"],
                [style*="MaterialCommunityIcons"],
                [style*="MaterialIcons"],
                i {
                  font-family: inherit !important;
                }

                /* Styles des inputs - garder les bordures React Native */
                input, textarea, select {
                  font-family: 'Figtree', sans-serif !important;
                  outline: none !important;
                  box-shadow: none !important;
                  /* border-width herite de React Native styles */
                }

                input:focus, textarea:focus, select:focus {
                  outline: none !important;
                  box-shadow: none !important;
                }

                /* Suppression du highlight bleu sur mobile web */
                * {
                  -webkit-tap-highlight-color: transparent;
                }
            `;
            document.head.appendChild(style);

            // Note: Google SDK charge via google-signin.web.js dans index.js

            // Add Favicon
            const favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.type = 'image/png';
            favicon.href = require('../assets/logo.png');
            document.head.appendChild(favicon);

            console.log('Web styles, fonts, logo and Google SDK loaded');
        }
    }, []);

    return null;
}
