import React, { useState } from "react";
import { View, Text, TextInput, Image, ActivityIndicator } from "react-native";
import { Button } from 'react-native-paper';
import { ScrollView } from "react-native-gesture-handler";
import PhoneNumberInput from "../../../components/forms/PhoneNumberInput/PhoneNumberInput";
import { authService } from "../../../services";
import SocialLoginButtons from "../../../components/forms/SocialLoginButtons";
import { registrationStyles as styles } from './Registration.styles';
import { useAlert } from "../../../hooks/useAlert";

export default function Registration({ navigation }) {
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { AlertComponent, showAlert } = useAlert();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    // Debug: Afficher toutes les valeurs
    console.log('=== VALIDATION REGISTRATION ===');
    console.log('Nom:', name);
    console.log('Prénom:', firstName);
    console.log('Email:', email);
    console.log('Username:', username);
    console.log('Password:', password ? '***' : 'vide');
    console.log('Confirm Password:', confirmPassword ? '***' : 'vide');
    console.log('Phone Number (formatted):', phoneNumber);
    console.log('Phone Number length:', phoneNumber ? phoneNumber.length : 0);
    
    // Validation des champs
    if (!name.trim() || !firstName.trim() || !email.trim() || 
        !username.trim() || !password.trim() || !confirmPassword.trim()) {
      showAlert({ title: 'Erreur', message: 'Veuillez remplir tous les champs', type: 'error' });
      return;
    }

    // Validation du numéro de téléphone (doit commencer par + et avoir au moins 10 caractères)
    if (!phoneNumber || !phoneNumber.startsWith('+') || phoneNumber.length < 10) {
      showAlert({ title: 'Erreur', message: 'Veuillez entrer un numéro de téléphone valide avec l\'indicatif pays', type: 'error' });
      return;
    }

    // Validation email
    if (!validateEmail(email)) {
      showAlert({ title: 'Erreur', message: 'Veuillez entrer une adresse email valide', type: 'error' });
      return;
    }

    // Validation mot de passe
    if (password.length < 6) {
      showAlert({ title: 'Erreur', message: 'Le mot de passe doit contenir au moins 6 caractères', type: 'error' });
      return;
    }

    // Vérification confirmation mot de passe
    if (password !== confirmPassword) {
      showAlert({ title: 'Erreur', message: 'Les mots de passe ne correspondent pas', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: name.trim(),
        first_name: firstName.trim(),
        user_name: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        phone_number: phoneNumber, // Déjà formaté avec indicatif pays (+261, +33, +1, etc.)
      };

      console.log('Données envoyées au backend:', userData);

      const response = await authService.register(userData);
      
      console.log('Inscription réussie:', response);
      
      // Afficher un message de succès
      showAlert({
        title: 'Succès',
        message: 'Votre compte a été créé avec succès !',
        type: 'success',
        buttons: [
          {
            text: 'OK',
            onPress: () => navigation.navigate("Liste des parkings")
          }
        ]
      });
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      
      // Gestion des différents types d'erreurs
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 409) {
          // Conflit - utilisateur existe déjà
          showAlert({ title: 'Erreur', message: 'Ce nom d\'utilisateur ou email existe déjà', type: 'error' });
        } else if (status === 400) {
          // Données invalides
          showAlert({ title: 'Erreur', message: data.message || 'Données invalides', type: 'error' });
        } else {
          showAlert({ title: 'Erreur', message: `Erreur serveur: ${status}`, type: 'error' });
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
        showAlert({ title: 'Erreur', message: 'Une erreur inattendue s\'est produite', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };
 

  return (
        <ScrollView 
          
         contentContainerStyle={{
          flexGrow: 1,
          padding: 40,
          backgroundColor: "white"
          }}
          keyboardShouldPersistTaps="handled"
        >
            <View style={styles.logoContainer}>
                <Image source={require("../../../assets/logo.png")} style={styles.logo} />
            </View>
            <View style={styles.body}>
                <Text style={styles.title}>Inscrivez {'\n'}vous ici</Text>
                <Text style={styles.description}>Pour avoir plus d'opportunité de réserver, louer et contribuer à évacuer la circulation</Text>
                <View style={styles.inputContainer}>
                    <TextInput  
                        placeholder="Nom"
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        editable={!loading}
                    />
                    <TextInput
                        placeholder="Prénom"
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        editable={!loading}
                    />
                    <TextInput
                        placeholder="E-mail"
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                    />
                    <TextInput
                        placeholder="Nom d'utilisateur"
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        editable={!loading}
                    />
                    <TextInput
                        placeholder="Mot de passe"
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        editable={!loading}
                    />
                    <TextInput
                        placeholder="Confirmation du mot de passe"
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        editable={!loading}
                    />
                    <PhoneNumberInput 
                      height={60}
                      marginTop={10}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      editable={!loading}
                    />
                </View> 
                
                <Button 
                  mode="contained" 
                  style={styles.submit} 
                  contentStyle={styles.submitContent}  
                  labelStyle={{ fontSize: 17 }}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator size="large" color="#fff" /> : 'Créer le compte'}
                </Button>

                {/* Boutons de connexion sociale */}
                <SocialLoginButtons 
                  navigation={navigation}
                  onSuccess={(response) => {
                    console.log(' Inscription sociale réussie:', response);
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
