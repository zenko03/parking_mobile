import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, getApiTimeout, log } from './environment';

// ========================================
// CONFIGURATION API - CENTRALISÉE
// ========================================

// Recuperation de la configuration depuis environment.js
const BASE_URL = getApiUrl();
const TIMEOUT = getApiTimeout();

// Creation de l'instance axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: TIMEOUT,
});

api.interceptors.request.use(
  async (config) => {
    try {
      // Endpoints publics qui ne nécessitent PAS d'authentification
      const publicEndpoints = [
        '/auth/authenticate',
        '/auth/register',
        '/auth/oauth/google',         // OAuth Google
        '/auth/oauth/facebook',       // OAuth Facebook
        '/auth/forgot-password',      // Reset password
        '/auth/verify-reset-code',    // Verify reset code
        '/auth/reset-password',       // Reset password
        '/v1/auth/authenticate',      // Avec préfixe v1
        '/v1/auth/register',          // Avec préfixe v1
        '/v1/auth/oauth/google',      // OAuth Google avec v1
        '/v1/auth/oauth/facebook',    // OAuth Facebook avec v1
        '/v1/auth/forgot-password',   // Reset password avec v1
        '/v1/auth/verify-reset-code', // Verify reset code avec v1
        '/v1/auth/reset-password',    // Reset password avec v1
        '/vehicles',                    // Liste des types de véhicules
        '/v1/vehicles',                 // Avec préfixe v1
        '/reservations/calculate-price',  // Calcul du prix
        '/v1/reservations/calculate-price', // Avec préfixe v1
        '/reservations/check-availability', // Vérification disponibilité
        '/v1/reservations/check-availability', // Avec préfixe v1
        '/reservations/test-public',    // Test endpoint public
        '/v1/reservations/test-public', // Avec préfixe v1
      ];

      // Endpoints protégés qui NÉCESSITENT l'authentification (même s'ils commencent par /parkings)
      const protectedEndpoints = [
        '/parkings/my-parkings',
        '/v1/parkings/my-parkings',
        '/parkings/user/',
        '/v1/parkings/user/',
        '/user-notes',              // Endpoints de notation
        '/v1/user-notes',
      ];

      // Endpoints parkings publics (pour la recherche)
      const publicParkingEndpoints = [
        '/parkings/search',             // Recherche de parkings
        '/v1/parkings/search',          // Avec préfixe v1
        '/parkings/search/address',     // Recherche par adresse
        '/v1/parkings/search/address',  // Avec préfixe v1
        '/parkings/search/location',    // Recherche par localisation
        '/v1/parkings/search/location', // Avec préfixe v1
        '/parkings/search/combined',    // Recherche combinée
        '/v1/parkings/search/combined', // Avec préfixe v1
        '/parkings/*/availability',     // Disponibilité des parkings
        '/v1/parkings/*/availability',  // Avec préfixe v1
      ];

      // Vérifier d'abord si c'est un endpoint PROTÉGÉ (prioritaire)
      const isProtectedEndpoint = protectedEndpoints.some(endpoint => {
        if (!config.url) return false;
        return config.url === endpoint || config.url.startsWith(endpoint);
      });

      // Si c'est protege, on ne verifie pas les publics
      if (isProtectedEndpoint) {
        const token = await AsyncStorage.getItem('jwt_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.warn('Endpoint protege mais pas de token pour:', config.url);
        }
        return config;
      }

      // Vérifier si l'URL correspond à un endpoint public (parkings)
      const isPublicParkingEndpoint = publicParkingEndpoints.some(endpoint => {
        if (!config.url) return false;

        // Gérer les wildcards (*)
        if (endpoint.includes('*')) {
          const regexPattern = endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '[^/]*');
          const regex = new RegExp('^' + regexPattern + '(/.*)?$');
          return regex.test(config.url);
        }

        return config.url === endpoint || config.url.startsWith(endpoint + '?') || config.url.startsWith(endpoint + '/');
      });

      // Vérifier les autres endpoints publics
      const isPublicEndpoint = publicEndpoints.some(endpoint => {
        if (!config.url) return false;
        return config.url === endpoint || config.url.startsWith(endpoint + '?') || config.url.startsWith(endpoint + '/');
      });

      // Vérifier si c'est un GET simple sur /parkings (liste publique) ou /parkings/{id}
      const isParkingListOrDetail = config.method === 'get' && (
        config.url === '/parkings' ||
        config.url === '/v1/parkings' ||
        /^\/v?1?\/parkings\/\d+$/.test(config.url) || // Match /parkings/123 ou /v1/parkings/123
        /^\/v?1?\/parkings\/\d+\/vehicles$/.test(config.url) // Match /parkings/123/vehicles
      );

      const isTrulyPublic = isPublicEndpoint || isPublicParkingEndpoint || isParkingListOrDetail;

      if (!isTrulyPublic) {
        const token = await AsyncStorage.getItem('jwt_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.warn('Pas de token pour:', config.url);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      const { status, data } = error.response;

      console.error(`Erreur ${status} pour ${error.config?.url}`);
      log.info('Details erreur:', { status, data, dataType: typeof data });

      if (status === 401) {
        // Token expiré ou invalide - déconnecter l'utilisateur proprement
        console.warn('Token invalide ou expire, deconnexion automatique...');

        // Suppression complète des données d'authentification
        await AsyncStorage.removeItem('jwt_token');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('username');

        // Note: La navigation vers Login doit être gérée dans les composants
      } else if (status === 403) {
        console.error('Acces refuse (403) - Verifiez les permissions');
      } else if (status === 400) {
        console.error('Requete invalide (400)');
        log.info('Donnees de la requete:', error.config?.data);
      }
    } else if (error.request) {
      // La requête a été faite mais pas de réponse
      console.error('Pas de reponse du serveur.');
      log.info('Details requete:', error.request);
    } else {
      // Erreur lors de la configuration de la requête
      console.error('Erreur configuration requete:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
