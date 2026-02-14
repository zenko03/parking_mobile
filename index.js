/**
 * @format
 */

// Polyfills pour compatibilite Web
require('react-native-get-random-values');
global.Buffer = require('buffer').Buffer;

// --- CHARGEMENT DE L'APP ---
const { AppRegistry, Platform } = require('react-native');
const React = require('react');
const App = require('./App').default;
const ErrorBoundary = require('./src/components/ErrorBoundary').default;
const appConfig = require('./app.json');

if (Platform.OS === 'web') {
    require('./web-mobile-config.web.js');
    require('./google-signin.web.js');
    require('./icon-fonts.web.js');
}

const RootComponent = () => {
    // On s'assure que App est correctement résolu
    const ActualApp = App || require('./App').default;
    return (
        <ErrorBoundary>
            <ActualApp />
        </ErrorBoundary>
    );
};

const appName = appConfig.name || 'UPark';
AppRegistry.registerComponent(appName, () => RootComponent);

if (Platform.OS === 'web') {
    const rootTag = document.getElementById('root') || document.getElementById('main');
    if (rootTag) {
        AppRegistry.runApplication(appName, { rootTag });
    }
}
