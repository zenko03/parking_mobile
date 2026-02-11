import React, { useState } from "react";
import { View, Text, TextInput, Image, ActivityIndicator, TouchableOpacity } from "react-native";
import { Button } from 'react-native-paper';
import { ScrollView } from "react-native-gesture-handler";
import { authService } from "../../../services";
import { useAlert } from '../../../hooks/useAlert';
import { forgotPasswordStyles as styles } from './ForgotPassword.styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ForgotPassword({ navigation }) {
    const { AlertComponent, showAlert } = useAlert();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            showAlert({ title: 'Erreur', message: 'Veuillez entrer votre adresse email', type: 'error' });
            return;
        }
        if (!emailRegex.test(email.trim())) {
            showAlert({ title: 'Erreur', message: 'Veuillez entrer une adresse email valide', type: 'error' });
            return;
        }

        setLoading(true);

        try {
            const response = await authService.forgotPassword(email.trim());

            console.log('Réponse forgot-password:', response);

            // Naviguer vers l'écran de vérification du code
            showAlert({
                title: 'Email envoyé',
                message: 'Si cette adresse est associée à un compte, vous recevrez un code de vérification.',
                type: 'success',
                buttons: [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('VerifyResetCode', { email: email.trim() })
                    }
                ]
            });
        } catch (error) {
            console.error('Erreur:', error);

            if (error.response?.status === 500) {
                showAlert({ title: 'Erreur', message: 'Une erreur est survenue lors de l\'envoi de l\'email. Veuillez réessayer.', type: 'error' });
            } else {
                showAlert({ title: 'Erreur', message: 'Une erreur est survenue. Veuillez réessayer.', type: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header avec bouton retour */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <View style={styles.logoContainer}>
                <Image source={require("../../../assets/logo.png")} style={styles.logo} />
            </View>

            <View style={styles.body}>
                <Text style={styles.title}>Mot de passe oublié</Text>
                <Text style={styles.description}>
                    Entrez votre adresse email pour recevoir un code de vérification
                </Text>

                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <Icon name="email-outline" size={22} color="#666" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Adresse email"
                            style={styles.input}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            editable={!loading}
                        />
                    </View>
                </View>

                <Button
                    mode="contained"
                    style={styles.submit}
                    contentStyle={styles.submitContent}
                    labelStyle={{ fontSize: 17, fontFamily: 'Figtree-Regular', fontWeight: "500" }}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : 'Envoyer le code'}
                </Button>

                <TouchableOpacity
                    style={styles.backToLogin}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backToLoginText}>Retour à la connexion</Text>
                </TouchableOpacity>
            </View>
            {AlertComponent}
        </ScrollView>
    );
}
