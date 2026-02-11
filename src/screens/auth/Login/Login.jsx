import React, { useState } from "react";
import { View, Text, TextInput, Image, ActivityIndicator, Platform } from "react-native";
import { Button } from 'react-native-paper';
import { ScrollView } from "react-native-gesture-handler";
import { authService } from "../../../services";
import SocialLoginButtons from "../../../components/forms/SocialLoginButtons";
import { loginStyles as styles } from './Login.styles';
import { getFCMToken } from "../../../config/firebase";
import { registerDeviceToken } from "../../../services/notificationService";
import { useAlert } from "../../../hooks/useAlert";

export default function Login({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { AlertComponent, showAlert } = useAlert();

  const handleSubmit = async () => {
    // Validation des champs
    if (!username.trim() || !password.trim()) {
      showAlert({ 
        title: 'Erreur', 
        message: 'Veuillez remplir tous les champs',
        type: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      // Appel au service d'authentification
      const response = await authService.login(username.trim(), password);

      console.log('Connexion réussie:', response);

      // Enregistrer le token FCM après connexion réussie
      try {
        const fcmToken = await getFCMToken();
        if (fcmToken && response.userId) {
          await registerDeviceToken(response.userId, fcmToken, Platform.OS);
          console.log(' Token FCM enregistré après login');
        }
      } catch (fcmError) {
        console.warn(' Erreur enregistrement FCM (non bloquant):', fcmError);
      }

      // Navigation directe vers la liste des parkings
      navigation.navigate("Liste des parkings");
    } catch (error) {
      console.error('Erreur de connexion:', error);

      // Gestion des différents types d'erreurs
      if (error.response) {
        // Le serveur a répondu avec une erreur
        if (error.response.status === 401 || error.response.status === 403) {
          showAlert({ 
            title: 'Erreur', 
            message: 'Nom d\'utilisateur ou mot de passe incorrect',
            type: 'error'
          });
        } else {
          showAlert({ 
            title: 'Erreur', 
            message: `Erreur serveur: ${error.response.status}`,
            type: 'error'
          });
        }
      } else if (error.request) {
        // Pas de réponse du serveur
        showAlert({ 
          title: 'Erreur de connexion',
          message: 'Impossible de contacter le serveur.\nVérifiez que le backend est démarré.',
          type: 'error'
        });
      } else {
        // Autre erreur
        showAlert({ 
          title: 'Erreur', 
          message: 'Une erreur inattendue s\'est produite',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require("../../../assets/logo.png")} style={styles.logo} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Se connecter</Text>
        <Text style={styles.description}>Veuillez entrer vos données de connexion</Text>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Nom d'utilisateur"
            style={styles.input}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            editable={!loading}
          />
          <TextInput
            placeholder="Entrez votre mot de passe"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
        </View>
        <Button
          mode="contained"
          style={styles.submit}
          contentStyle={styles.submitContent}
          labelStyle={{ fontSize: 17, fontFamily: 'Figtree-Regular', fontWeight: "500" }}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator size="large" color="#fff" /> : 'Valider'}
        </Button>
        <View style={styles.linkContainer}>
          <Text
            style={styles.forgot}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            Mot de passe oublié?
          </Text>
          <Text
            style={styles.register}
            onPress={() => navigation.navigate("Registration")}
          >
            Créer un compte
          </Text>
        </View>

        {/* Boutons de connexion sociale */}
        <SocialLoginButtons
          navigation={navigation}
          onSuccess={(response) => {
            console.log(' Connexion sociale réussie:', response);
            navigation.replace('Liste des parkings');
          }}
          onError={(error) => {
            showAlert({ title: 'Erreur', message: error, type: 'error' });
          }}
        />
      </View>
      {AlertComponent}
    </ScrollView>
  );
}
