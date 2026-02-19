import React, { useState } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../../services/authService';
import { socialLoginButtonsStyles as styles } from './SocialLoginButtons.styles';
import { getFCMToken } from '../../../config/firebase';
import { registerDeviceToken } from '../../../services/notificationService';
import { useAlert } from '../../../hooks/useAlert';

// Client ID Google OAuth
const GOOGLE_CLIENT_ID = '3320401216-bud1buvdpj398gpnkir9uoa18atejfdd.apps.googleusercontent.com';

const SocialLoginButtons = ({ navigation, onSuccess, onError }) => {
  const { AlertComponent, showAlert } = useAlert();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);

  /**
   * Connexion Google sur le web via OAuth2 redirect (cross-browser)
   * Evite le probleme window.opener sur Opera mobile (gsi/transform bloque)
   */
  const handleGoogleLoginWeb = () => {
    // Nonce pour securiser le token (evite les replay attacks)
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('google_oauth_nonce', nonce);

    // Redirect URI = origin sans slash final (doit correspondre exactement a Google Cloud Console)
    const redirectUri = window.location.origin;

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      response_type: 'id_token',
      scope: 'openid email profile',
      redirect_uri: redirectUri,
      nonce: nonce,
    });

    // Redirection pleine page - pas de popup, pas de window.opener, cross-browser
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  /**
   * Gérer la connexion Google
   */
  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web') {
      handleGoogleLoginWeb();
      return;
    }

    setLoadingGoogle(true);
    try {
      console.log(' Tentative de connexion Google...');
      const response = await authService.loginWithGoogle();

      console.log(' Connexion Google réussie:', response);

      // Enregistrer le token FCM après connexion réussie
      try {
        const fcmToken = await getFCMToken();
        if (fcmToken && response.userId) {
          await registerDeviceToken(response.userId, fcmToken, Platform.OS);
          console.log(' Token FCM enregistré après login Google');
        }
      } catch (fcmError) {
        console.warn(' Erreur enregistrement FCM (non bloquant):', fcmError);
      }

      if (onSuccess) {
        onSuccess(response);
      } else {
        // Navigation par défaut si aucun callback fourni
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Erreur: Erreur Google login:', error);

      const errorMessage = error.message || 'Erreur lors de la connexion avec Google';

      if (onError) {
        onError(errorMessage);
      } else {
        showAlert({ title: 'Erreur', message: errorMessage, type: 'error' });
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  /**
   * Gérer la connexion Facebook
   */
  const handleFacebookLogin = async () => {
    setLoadingFacebook(true);
    try {
      console.log(' Tentative de connexion Facebook...');
      const response = await authService.loginWithFacebook();

      console.log(' Connexion Facebook réussie:', response);

      if (onSuccess) {
        onSuccess(response);
      } else {
        // Navigation par défaut si aucun callback fourni
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Erreur: Erreur Facebook login:', error);

      const errorMessage = error.message || 'Erreur lors de la connexion avec Facebook';

      if (onError) {
        onError(errorMessage);
      } else {
        showAlert({ title: 'Erreur', message: errorMessage, type: 'error' });
      }
    } finally {
      setLoadingFacebook(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Séparateur OU */}
      <View style={styles.separatorContainer}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>OU</Text>
        <View style={styles.separatorLine} />
      </View>

      {/* Bouton Google */}
      {Platform.OS === 'web' ? (
        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={loadingGoogle}
        >
          {loadingGoogle ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-google" size={24} color="#fff" style={styles.icon} />
              <Text style={styles.buttonText}>Continuer avec Google</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={loadingGoogle || loadingFacebook}
        >
          {loadingGoogle ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-google" size={24} color="#fff" style={styles.icon} />
              <Text style={styles.buttonText}>Continuer avec Google</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Bouton Facebook */}
      {/* <TouchableOpacity
        style={[styles.socialButton, styles.facebookButton]}
        onPress={handleFacebookLogin}
        disabled={loadingGoogle || loadingFacebook}
      >
        {loadingFacebook ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="logo-facebook" size={24} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Continuer avec Facebook</Text>
          </>
        )}
      </TouchableOpacity> */}
      
      {AlertComponent}
    </View>
  );
};

export default SocialLoginButtons;
