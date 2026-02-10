import React, { useState } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, Alert, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../../services/authService';
import { socialLoginButtonsStyles as styles } from './SocialLoginButtons.styles';
import { getFCMToken } from '../../../config/firebase';
import { registerDeviceToken } from '../../../services/notificationService';

const SocialLoginButtons = ({ navigation, onSuccess, onError }) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);

  /**
   * Gérer la réponse Google sur le web
   */
  const handleCredentialResponse = async (response) => {
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
  };

  // Initialisation Google sur le Web
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const checkGoogleSDK = () => {
        if (window.google && window.google.accounts) {
          window.google.accounts.id.initialize({
            client_id: "3320401216-bud1buvdpj398gpnkir9uoa18atejfdd.apps.googleusercontent.com",
            callback: handleCredentialResponse,
            cancel_on_tap_outside: false,
          });

          // Rendre le bouton physique
          const btnDiv = document.getElementById("google-signin-button");
          if (btnDiv) {
            window.google.accounts.id.renderButton(btnDiv, {
              theme: "filled_blue",
              size: "large",
              width: btnDiv.offsetWidth || 300,
              text: "continue_with",
              shape: "pill"
            });
          }

          console.log('✅ Google SDK Initialized and Button Rendered');
        } else {
          setTimeout(checkGoogleSDK, 500); // Réessayer si le script n'est pas encore chargé
        }
      };
      checkGoogleSDK();
    }
  }, []);

  /**
   * Gérer la connexion Google
   */
  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web') {
      if (window.google) {
        window.google.accounts.id.prompt(); // Affiche la petite fenêtre de connexion en haut à droite (One Tap)
      } else {
        Alert.alert('Erreur', 'SDK Google non chargé');
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
        Alert.alert('Erreur', errorMessage);
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
        Alert.alert('Erreur', errorMessage);
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
          id="google-signin-button"
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 15
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
    </View>
  );
};

export default SocialLoginButtons;
