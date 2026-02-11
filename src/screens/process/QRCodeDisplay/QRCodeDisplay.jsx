import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../../../components/ui/Header/Header';
import Footer from '../../../components/ui/Footer/Footer';
import { useAlert } from '../../../hooks/useAlert';
import { qrcodeDisplayStyles as styles } from './QRCodeDisplay.styles';
import { colors } from '../../../theme';
import { qrcodeService, reservationService } from '../../../services';

/**
 * 📱 Écran d'affichage du QR Code d'une réservation
 * Permet au client de présenter son QR à l'entrée du parking
 */
export default function QRCodeDisplay() {
  const { AlertComponent, showAlert } = useAlert();
  const navigation = useNavigation();
  const route = useRoute();

  // Paramètres reçus de ReservationList
  const { reservation } = route.params || {};

  // États
  const [qrToken, setQrToken] = useState(null);
  const [isValidated, setIsValidated] = useState(false);
  const [validatedAt, setValidatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullReservation, setFullReservation] = useState(null);

  // Formater la date pour l'affichage
  const formatDateTime = (dateString) => {
    if (!dateString) return "Date non disponible";
    const date = new Date(dateString);
    return `Le ${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatDateRange = () => {
    // Utiliser fullReservation en priorité (données rechargées de l'API)
    const startDateTime = fullReservation?.startDateTime || reservation?.startDateTime;
    const endDateTime = fullReservation?.endDateTime || reservation?.endDateTime;

    if (!startDateTime || !endDateTime) {
      return "Date non disponible";
    }
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    return `Le ${start.toLocaleDateString('fr-FR')} ${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}-${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Charger le QR Code token ET les données complètes de la réservation
  useEffect(() => {
    const loadQRToken = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!reservation?.id) {
          throw new Error('Aucune réservation sélectionnée');
        }

        console.log(' Chargement du QR Code pour la réservation:', reservation.id);

        // Charger les données complètes de la réservation via l'API (utilise la vue SQL)
        const fullResData = await reservationService.getReservationById(reservation.id);
        setFullReservation(fullResData);
        console.log(' Réservation complète chargée:', fullResData);

        // Charger le QR token
        const qrData = await qrcodeService.getQRToken(reservation.id);
        setQrToken(qrData.qrToken);
        setIsValidated(qrData.isValidated || false);
        setValidatedAt(qrData.validatedAt);

        console.log(' QR Code chargé:', qrData);
      } catch (err) {
        console.error('Erreur: Erreur chargement QR Code:', err);
        setError(err.message || 'Impossible de charger le QR Code');
        showAlert({
          title: 'Erreur',
          message: 'Impossible de charger le QR Code. Veuillez réessayer.',
          type: 'error',
          buttons: [{ text: 'OK' }]
        });
      } finally {
        setLoading(false);
      }
    };

    loadQRToken();
  }, [reservation]);

  // Rafraîchir le statut de validation
  const refreshValidationStatus = async () => {
    try {
      if (!qrToken) return;

      const statusData = await qrcodeService.checkQRStatus(qrToken);
      setIsValidated(statusData.isValidated || false);
      setValidatedAt(statusData.validatedAt);

      if (statusData.isValidated) {
        showAlert({
          title: 'QR Code validé ',
          message: `Validé le ${formatDateTime(statusData.validatedAt)}`,
          type: 'success',
          buttons: [{ text: 'OK' }]
        });
      }
    } catch (err) {
      console.error('Erreur: Erreur vérification statut:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Header navigation={navigation} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.green} />
          <Text style={styles.loadingText}>Chargement du QR Code...</Text>
        </View>
        <Footer navigation={navigation} activeRoute="QR Code" />
      </View>
    );
  }

  if (error || !qrToken) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Header navigation={navigation} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur:</Text>
          <Text style={styles.errorMessage}>{error || 'QR Code non disponible'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
        <Footer navigation={navigation} activeRoute="QR Code" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Header navigation={navigation} />
      </View>

      {/* Contenu scrollable */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Titre avec statut de validation */}
        <View style={styles.confirmationHeader}>
          <Text style={styles.confirmationText}>
            {isValidated ? 'Réservation validée' : 'Réservation confirmée'}
          </Text>
          <Ionicons
            name={isValidated ? "checkmark-circle" : "checkmark-circle-outline"}
            size={32}
            color={isValidated ? colors.status.success : colors.primary.green}
          />
        </View>

        {/* Informations de la réservation */}
        <View style={styles.detailsCard}>
          <Text style={styles.parkingName}>
            {fullReservation?.parkingName || reservation?.parking?.name || reservation?.name || 'Parking'}
          </Text>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.text.gray} />
            <Text style={styles.detailItem}>
              {fullReservation?.parkingAddress || reservation?.parking?.address || reservation?.location || 'Adresse non disponible'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={colors.text.gray} />
            <Text style={styles.detailItem}>
              {formatDateRange()}
            </Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.qrCodeContainer}>
          <QRCode
            value={qrToken}
            size={250}
            color={colors.text.charcoal}
            backgroundColor={colors.background.white}
            logoSize={30}
            logoMargin={2}
            logoBorderRadius={15}
          />
        </View>

        {/* Badge de validation si validé */}
        {isValidated && validatedAt && (
          <View style={styles.validatedBadge}>
            <Ionicons name="checkmark-circle" size={18} color={colors.text.white} />
            <Text style={styles.validatedText}>
              Validé le {formatDateTime(validatedAt)}
            </Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionsTitleRow}>
            <Ionicons
              name={isValidated ? "shield-checkmark" : "qr-code-outline"}
              size={20}
              color={isValidated ? colors.status.success : colors.primary.green}
            />
            <Text style={styles.instructionsTitle}>
              {isValidated ? 'Accès autorisé' : 'Présentez ce QR code à l\'entrée'}
            </Text>
          </View>
          <Text style={styles.instructionsText}>
            {isValidated
              ? 'Votre QR code a été scanné et validé. Vous pouvez maintenant accéder au parking.'
              : 'Le propriétaire du parking scannera ce code pour valider votre entrée.'}
          </Text>
        </View>

        {/* Boutons */}
        <View style={styles.buttonsContainer}>
          {!isValidated && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refreshValidationStatus}
            >
              <Ionicons name="refresh" size={18} color={colors.text.white} />
              <Text style={styles.refreshButtonText}>Vérifier la validation</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text.charcoal} />
            <Text style={styles.backButtonText}>Retour aux réservations</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <Footer navigation={navigation} activeRoute="QR Code" />
      {AlertComponent}
    </View>
  );
}
