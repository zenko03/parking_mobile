import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../../services/authService';
import { socialLoginButtonsStyles as styles } from './SocialLoginButtons.styles';
import { getFCMToken } from '../../../config/firebase';
import { registerDeviceToken } from '../../../services/notificationService';
import { useAlert } from '../../../hooks/useAlert';

// Stocker le callback actif globalement pour le SDK Google
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.__googleSignInCallbacks = window.__googleSignInCallbacks || {};
}

const SocialLoginButtons = ({ navigation, onSuccess, onError }) => {
  const { AlertComponent, showAlert } = useAlert();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);
  const [googleButtonReady, setGoogleButtonReady] = useState(false);
  const buttonRef = useRef(null);
  const instanceId = useRef(`${Math.random().toString(36).substr(2, 9)}`).current;

  /**
   * Gérer la réponse Google sur le web
   */
  const handleCredentialResponse = useCallback(async (response) => {
    setLoadingGoogle(true);
    try {
      const idToken = response.credential;
      const authResponse = await authService.loginWithGoogle(idToken);

      console.log(' Connexion Google Web réussie:', authResponse);

      if (onSuccess) {
        onSuccess(authResponse);
      } else {
        navigation.replace('Liste des parkings');
      }
    } catch (error) {
      console.error('Erreur connexion Google Web:', error);
      onError && onError(error.message || 'Erreur lors de la connexion Google');
    } finally {
      setLoadingGoogle(false);
    }
  }, [onSuccess, onError, navigation]);

  // Enregistrer le callback pour cette instance
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.__googleSignInCallbacks[instanceId] = handleCredentialResponse;
      return () => {
        delete window.__googleSignInCallbacks[instanceId];
      };
    }
  }, [handleCredentialResponse, instanceId]);

  // Initialisation et rendu du bouton Google sur le Web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 20;
    
    const renderGoogleButton = () => {
      if (!mounted) return;
      
      const btnDiv = buttonRef.current;
      if (!btnDiv) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(renderGoogleButton, 200);
        }
        return;
      }
      
      if (!window.google || !window.google.accounts) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(renderGoogleButton, 300);
        } else {
          console.error('Google SDK not loaded after max retries');
        }
        return;
      }
      
      try {
        // Callback wrapper qui appelle le callback enregistr\u00e9 pour cette instance
        const callbackWrapper = (response) => {
          const cb = window.__googleSignInCallbacks[instanceId];
          if (cb) {
            cb(response);
          }
        };
        
        // Initialiser le SDK (safe to call multiple times)
        window.google.accounts.id.initialize({
          client_id: "3320401216-bud1buvdpj398gpnkir9uoa18atejfdd.apps.googleusercontent.com",
          callback: callbackWrapper,
          cancel_on_tap_outside: false,
        });
        
        // Rendre le bouton
        window.google.accounts.id.renderButton(btnDiv, {
          theme: "filled_blue",
          size: "large",
          width: btnDiv.offsetWidth || 300,
          text: "continue_with",
          shape: "pill",
          locale: "fr"
        });
        
        setGoogleButtonReady(true);
        console.log('Google button rendered for instance:', instanceId);
      } catch (error) {
        console.error('Error rendering Google button:', error);
      }
    };
    
    // Petit d\u00e9lai pour s'assurer que le DOM est pr\u00eat
    const timeoutId = setTimeout(renderGoogleButton, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [instanceId]);

  /**
   * Gérer la connexion Google
   */
  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web') {
      if (window.google) {
        window.google.accounts.id.prompt(); // Affiche la petite fenêtre de connexion en haut à droite (One Tap)
      } else {
        showAlert({ title: 'Erreur', message: 'SDK Google non chargé', type: 'error' });
      }
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
        <div
          ref={buttonRef}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 15,
            minHeight: 44
          }}
        />
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
