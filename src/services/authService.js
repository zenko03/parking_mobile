import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { Platform } from 'react-native';
import { deactivateDeviceToken } from './notificationService';

// Imports conditionnels des modules natifs (uniquement sur mobile)
let GoogleSignin = null;
let LoginManager = null;
let AccessToken = null;
let messaging = null;

if (Platform.OS !== 'web') {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  const fbSdk = require('react-native-fbsdk-next');
  LoginManager = fbSdk.LoginManager;
  AccessToken = fbSdk.AccessToken;
  messaging = require('@react-native-firebase/messaging').default;
}

// Base path pour l'API d'authentification
const BASE_PATH = '/auth';


const authService = {

  login: async (user_name, password) => {
    try {
      const response = await api.post(`${BASE_PATH}/authenticate`, {
        user_name,
        password,
      });

      const { token, userId, userName, email } = response.data;

      if (token) {
        await AsyncStorage.setItem('jwt_token', token);

        const userData = {
          Id_Users: userId,
          user_name: userName,
          email: email,
        };

        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('username', userName);
      }

      return response.data;
    } catch (error) {
      console.error('[Auth] Login error:', error.message);
      throw error;
    }
  },


  register: async (userData) => {
    try {
      const response = await api.post(`${BASE_PATH}/register`, {
        name: userData.name,
        first_name: userData.first_name,
        user_name: userData.user_name,
        email: userData.email,
        password: userData.password,
        phone_number: userData.phone_number,
        role: 'USER',
      });

      const { token, userId, userName, email } = response.data;

      if (token) {
        await AsyncStorage.setItem('jwt_token', token);

        const userInfo = {
          Id_Users: userId,
          user_name: userName,
          email: email,
        };

        await AsyncStorage.setItem('user', JSON.stringify(userInfo));
        await AsyncStorage.setItem('username', userName);
      }

      return response.data;
    } catch (error) {
      console.error('[Auth] Register error:', error.message);
      throw error;
    }
  },


  logout: async () => {
    try {
      // Désactiver token FCM (seulement sur mobile)
      if (Platform.OS !== 'web') {
        try {
          const fcmToken = await messaging().getToken();
          const userJson = await AsyncStorage.getItem('user');
          const userId = userJson ? JSON.parse(userJson).Id_Users : null;

          if (fcmToken) {
            await deactivateDeviceToken(fcmToken, userId);
          }
        } catch (fcmError) {
          // Erreur silencieuse
        }
      }

      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('username');

      // Déconnexion Google (seulement sur mobile)
      if (Platform.OS !== 'web') {
        try {
          const isGoogleSignedIn = await GoogleSignin.isSignedIn();
          if (isGoogleSignedIn) {
            await GoogleSignin.signOut();
          }
        } catch (googleError) {
          // Erreur silencieuse
        }
      }

      // Déconnexion Facebook (seulement sur mobile)
      if (Platform.OS !== 'web') {
        try {
          const fbToken = await AccessToken.getCurrentAccessToken();
          if (fbToken) {
            await LoginManager.logOut();
          }
        } catch (facebookError) {
          // Erreur silencieuse
        }
      }
    } catch (error) {
      console.error('[Auth] Logout error:', error.message);
    }
  },


  clearStorage: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('[Storage] Clear error:', error.message);
    }
  },


  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      return !!token;
    } catch (error) {
      return false;
    }
  },

  getToken: async () => {
    try {
      return await AsyncStorage.getItem('jwt_token');
    } catch (error) {
      return null;
    }
  },


  isTokenExpired: async () => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) return true;

      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000; // Convertir en secondes

      return decoded.exp < (currentTime + 60);
    } catch (error) {
      console.error('[Auth] Token check error:', error.message);
      return true; // En cas d'erreur, considérer comme expiré
    }
  },

  //recup connected user data
  getCurrentUser: async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('[User] Get current error:', error.message);
      return null;
    }
  },

  //connex google
  loginWithGoogle: async (webToken = null) => {
    if (Platform.OS === 'web') {
      if (!webToken) {
        throw new Error('Un token est requis pour la connexion Google sur le web');
      }

      try {
        const response = await api.post(`${BASE_PATH}/oauth/google`, {
          token: webToken,
          provider: 'google',
        });

        const { token, userId, userName, email } = response.data;

        if (token) {
          await AsyncStorage.setItem('jwt_token', token);
          const userData = {
            Id_Users: userId,
            user_name: userName,
            email: email,
            oauth_provider: 'google',
          };
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          await AsyncStorage.setItem('username', userName);
        }

        return response.data;
      } catch (error) {
        console.error('[Auth] Google Web OAuth error:', error.message);
        throw error;
      }
    }

    try {
      await GoogleSignin.configure({
        webClientId: '918409349260-uqfla9m7seh995bjgojo6t7mt7e9smj6.apps.googleusercontent.com',
        offlineAccess: false,
      });


      await GoogleSignin.hasPlayServices();

      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        // Ignorer
      }


      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;


      const response = await api.post(`${BASE_PATH}/oauth/google`, {
        token: idToken,
        provider: 'google',
      });

      const { token, userId, userName, email } = response.data;


      if (token) {
        await AsyncStorage.setItem('jwt_token', token);

        const userData = {
          Id_Users: userId,
          user_name: userName,
          email: email,
          oauth_provider: 'google',
        };

        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('username', userName);
      }

      return response.data;
    } catch (error) {
      console.error('[Auth] Google OAuth error:', error.message);

      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Connexion annulée');
      } else if (error.code === 'IN_PROGRESS') {
        throw new Error('Connexion en cours');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services non disponible');
      }

      throw error;
    }
  },

  //connex facebook
  loginWithFacebook: async () => {
    if (Platform.OS === 'web') {
      throw new Error('Connexion Facebook non disponible sur le web');
    }

    try {
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        throw new Error('Connexion Facebook annulée');
      }


      const data = await AccessToken.getCurrentAccessToken();

      if (!data) {
        throw new Error('Impossible de récupérer le token Facebook');
      }

      const accessToken = data.accessToken;


      const response = await api.post(`${BASE_PATH}/oauth/facebook`, {
        token: accessToken,
        provider: 'facebook',
      });

      const { token, userId, userName, email } = response.data;


      if (token) {
        await AsyncStorage.setItem('jwt_token', token);

        const userData = {
          Id_Users: userId,
          user_name: userName,
          email: email,
          oauth_provider: 'facebook',
        };

        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('username', userName);
      }

      return response.data;
    } catch (error) {
      console.error('[Auth] Facebook OAuth error:', error.message);
      throw error;
    }
  },


  forgotPassword: async (email) => {
    try {
      const response = await api.post(`${BASE_PATH}/forgot-password`, { email });
      return response.data;
    } catch (error) {
      console.error('[Auth] Forgot password error:', error.message);
      throw error;
    }
  },


  verifyResetCode: async (email, code) => {
    try {
      const response = await api.post(`${BASE_PATH}/verify-reset-code`, { email, code });
      return response.data;
    } catch (error) {
      console.error('[Auth] Verify reset code error:', error.message);
      throw error;
    }
  },


  resetPassword: async (email, code, newPassword) => {
    try {
      const response = await api.post(`${BASE_PATH}/reset-password`, {
        email,
        code,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('[Auth] Reset password error:', error.message);
      throw error;
    }
  },
};

export default authService;
