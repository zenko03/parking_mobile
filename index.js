/**
 * @format
 */

import 'react-native-get-random-values';
import { AppRegistry, Platform } from 'react-native';
import React from 'react';
import App from './App';
import ErrorBoundary from './src/components/ErrorBoundary';
import appConfig from './app.json';

// Load mobile-first config for web (meta viewport, PWA, etc.)
if (Platform.OS === 'web') {
    require('./web-mobile-config.web.js');
}

// Load Google Sign-In SDK for web
if (Platform.OS === 'web') {
    require('./google-signin.web.js');
}

// Load icon fonts for web
if (Platform.OS === 'web') {
    require('./icon-fonts.web.js');
}

const RootComponent = () => (
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);

const appName = appConfig.expo.name || 'UPark';
AppRegistry.registerComponent(appName, () => RootComponent);

if (Platform.OS === 'web') {
    const rootTag = document.getElementById('root') || document.getElementById('main');
    if (rootTag) {
        AppRegistry.runApplication(appName, { rootTag });
    } else {
        console.error('[Web] Root element not found');
    }
}
