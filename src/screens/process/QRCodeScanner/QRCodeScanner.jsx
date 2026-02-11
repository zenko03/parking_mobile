import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Vibration } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import Header from '../../../components/ui/Header/Header';
import Footer from '../../../components/ui/Footer/Footer';
import { useAlert } from '../../../hooks/useAlert';
import { qrcodeScannerStyles as styles } from './QRCodeScanner.styles';
import { colors } from '../../../theme';
import { qrcodeService } from '../../../services';

/**
 * 📷 Écran de scan de QR Code pour les propriétaires de parking
 * Permet de valider l'entrée des clients
 */
export default function QRCodeScanner() {
  const { AlertComponent, showAlert } = useAlert();
  const navigation = useNavigation();

  // États
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [validating, setValidating] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);

  // Configuration de la caméra - Vision Camera v4 API
  const device = useCameraDevice('back');

  // Configuration du scanner de codes-barres - Vision Camera v4 intégré
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && !validating && isActive) {
        const qrCode = codes[0];
        handleQRCodeScanned(qrCode.value);
      }
    },
  });

  // Demander les permissions caméra
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        const permission = await Camera.requestCameraPermission();
        setHasPermission(permission === 'authorized');

        if (permission === 'denied') {
          showAlert({
            title: 'Permission refusée',
            message: 'L\'accès à la caméra est nécessaire pour scanner les QR codes.',
            type: 'error',
            buttons: [
              { text: 'Annuler', onPress: () => navigation.goBack() },
              { text: 'Réessayer', onPress: requestCameraPermission },
            ]
          });
        }
      } catch (error) {
        console.error('Erreur: Erreur permission caméra:', error);
        showAlert({ title: 'Erreur', message: 'Impossible d\'accéder à la caméra', type: 'error' });
      }
    };

    requestCameraPermission();

    return () => {
      setIsActive(false);
    };
  }, []);

  // Valider le QR Code scanné
  const handleQRCodeScanned = useCallback(async (qrToken) => {
    if (!qrToken || validating) return;

    try {
      setValidating(true);
      setIsActive(false); // Pause le scanner pendant la validation

      console.log('🔍 QR Code scanné:', qrToken);

      // Vibration pour feedback
      Vibration.vibrate(100);

      // Vérifier le format du token
      if (!qrToken.startsWith('RES-')) {
        throw new Error('QR Code invalide. Format attendu: RES-XXX-...');
      }

      // Valider le QR Code via l'API
      const result = await qrcodeService.validateQR(qrToken);

      // Succès - Vibration de confirmation
      Vibration.vibrate([0, 200, 100, 200]);

      showAlert({
        title: ' QR Code validé',
        message: `Réservation validée avec succès!\n\nParking: ${result.reservation?.parking?.name || 'N/A'}\nClient: ${result.reservation?.user?.firstName || 'N/A'} ${result.reservation?.user?.lastName || ''}`,
        type: 'success',
        buttons: [
          {
            text: 'OK',
            onPress: () => {
              setValidating(false);
              setIsActive(true); // Réactiver le scanner
            },
          },
          {
            text: 'Retour',
            onPress: () => navigation.goBack(),
          },
        ]
      });
    } catch (error) {
      console.error('Erreur: Erreur validation QR:', error);

      // Vibration d'erreur
      Vibration.vibrate([0, 500]);

      showAlert({
        title: 'Erreur: Erreur de validation',
        message: error.message || 'Impossible de valider ce QR Code',
        type: 'error',
        buttons: [
          {
            text: 'Réessayer',
            onPress: () => {
              setValidating(false);
              setIsActive(true); // Réactiver le scanner
            },
          },
          {
            text: 'Annuler',
            onPress: () => navigation.goBack(),
          },
        ]
      });
    }
  }, [validating]);

  // Saisie manuelle du code
  const handleManualEntry = () => {
    Alert.prompt(
      'Saisie manuelle',
      'Entrez le code QR manuellement:',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: (qrToken) => {
            if (qrToken && qrToken.trim()) {
              handleQRCodeScanned(qrToken.trim());
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Toggle flash
  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  // Afficher le loader pendant le chargement de la caméra
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Header navigation={navigation} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.green} />
          <Text style={styles.loadingText}>Chargement de la caméra...</Text>
        </View>
        <Footer navigation={navigation} activeRoute="Scanner" />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Header navigation={navigation} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur:</Text>
          <Text style={styles.errorMessage}>Caméra non disponible</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
        <Footer navigation={navigation} activeRoute="Scanner" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Bouton fermer en haut à gauche */}
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      {/* Titre */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Scanner</Text>
      </View>

      {/* Caméra */}
      <View style={styles.cameraContainer}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive && !validating}
          codeScanner={codeScanner}
          torch={flashEnabled ? 'on' : 'off'}
        />

        {/* Overlay de scan */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanFrame}>
              {/* Coins du cadre */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />

              {/* Ligne de scan animée */}
              {isActive && !validating && (
                <View style={styles.scanLine} />
              )}
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom} />
        </View>

        {/* Indicateur de validation */}
        {validating && (
          <View style={styles.validatingOverlay}>
            <ActivityIndicator size="large" color={colors.text.white} />
            <Text style={styles.validatingText}>Validation en cours...</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>Scannez le QR code du client</Text>
      </View>

      {/* Bouton Flash */}
      <TouchableOpacity
        style={styles.flashButton}
        onPress={toggleFlash}
      >
        <Text style={styles.flashButtonText}>⚡</Text>
      </TouchableOpacity>

      {/* Bouton saisie manuelle */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.manualEntryButton}
          onPress={handleManualEntry}
        >
          <Text style={styles.manualEntryIcon}>⌨️</Text>
          <Text style={styles.manualEntryText}>Enter code manually</Text>
        </TouchableOpacity>
      </View>

      {/* Footer navigation */}
      <View style={styles.footerNavContainer}>
        <TouchableOpacity style={styles.footerNavButton}>
          <Text style={styles.footerNavIcon}>🏠</Text>
          <Text style={styles.footerNavText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerNavButton}>
          <Text style={styles.footerNavIcon}>👤</Text>
          <Text style={styles.footerNavText}>Profile</Text>
        </TouchableOpacity>
      </View>
      {AlertComponent}
    </View>
  );
}
