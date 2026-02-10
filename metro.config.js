const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ajout des polyfills pour le web (crypto et stream)
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    crypto: require.resolve('react-native-get-random-values'),
    stream: require.resolve('readable-stream'),
};

// Gestion dynamique selon la plateforme
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Correction spécifique pour react-async-hook dans country-picker
    if (moduleName === 'react-async-hook') {
        const nestedPath = path.resolve(
            __dirname,
            'node_modules/react-native-country-picker-modal/node_modules/react-async-hook'
        );
        try {
            if (require('fs').existsSync(nestedPath)) {
                return {
                    filePath: path.join(nestedPath, 'dist/react-async-hook.esm.js'),
                    type: 'sourceFile',
                };
            }
        } catch (e) { }
    }

    // Utiliser le resolver par défaut pour le reste
    return context.resolveRequest(context, moduleName, platform);
};

// Configuration des mainFields : inclure 'react-native' pour les plateformes natives
config.resolver.resolverMainFields = ['react-native', 'browser', 'module', 'main'];

// Désactiver unstable_enablePackageExports si nécessaire pour le web
config.resolver.unstable_enablePackageExports = false;

// Supprimer les extensions manuelles 'web.js' car Metro gère les suffixes plateforme automatiquement
// On garde la config par défaut des extensions

module.exports = config;
