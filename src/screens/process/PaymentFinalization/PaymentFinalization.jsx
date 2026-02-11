import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { paymentFinalizationStyles as styles } from './PaymentFinalization.styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reservationRequestService } from '../../../services';
import { formatPrice } from '../../../config/constants';
import { useAlert } from '../../../hooks/useAlert';

export default function PaymentFinalization({ route, navigation }) {
  const { AlertComponent, showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const { requestId, requestData: initialRequestData } = route.params || {};

  const [paymentMethod, setPaymentMethod] = useState('card'); // card or paypal
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!initialRequestData); // True si on doit charger les données
  const [requestData, setRequestData] = useState(initialRequestData || null);

  // Charger les données de la demande si non fournies
  useEffect(() => {
    if (!initialRequestData && requestId) {
      loadRequestData();
    }
  }, [requestId, initialRequestData]);

  const loadRequestData = async () => {
    try {
      setLoadingData(true);
      console.log('📥 Chargement des données de la demande', requestId);
      const data = await reservationRequestService.getRequestById(requestId);
      console.log(' Données chargées:', data);
      setRequestData(data);
    } catch (error) {
      console.error(' Erreur chargement données demande:', error);
      showAlert({ title: 'Erreur', message: 'Impossible de charger les détails de la demande', type: 'error' });
    } finally {
      setLoadingData(false);
    }
  };

  // Infos de la demande à payer
  const parkingName = requestData?.announcement?.parking?.label || 'Parking';
  const startDateTime = requestData?.startDateTime ? new Date(requestData.startDateTime) : null;
  const endDateTime = requestData?.endDateTime ? new Date(requestData.endDateTime) : null;
  const totalGain = requestData?.totalGain || 0;
  const expiresAt = requestData?.expiresAt ? new Date(requestData.expiresAt) : null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month} à ${hours}:${minutes}`;
  };

  const formatCardNumber = (text) => {
    // Format: XXXX XXXX XXXX XXXX
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiry = (text) => {
    // Format: MM/YY
    const cleaned = text.replace(/\//g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const validatePayment = () => {
    if (paymentMethod === 'card') {
      if (!cardholderName.trim()) {
        showAlert({ title: 'Erreur', message: 'Veuillez entrer le nom du titulaire', type: 'error' });
        return false;
      }
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        showAlert({ title: 'Erreur', message: 'Numéro de carte invalide (16 chiffres requis)', type: 'error' });
        return false;
      }
      if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
        showAlert({ title: 'Erreur', message: 'Date d\'expiration invalide (format MM/YY)', type: 'error' });
        return false;
      }
      if (cvv.length !== 3) {
        showAlert({ title: 'Erreur', message: 'CVV invalide (3 chiffres requis)', type: 'error' });
        return false;
      }
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validatePayment()) return;

    // Vérifier si pas expiré
    if (expiresAt && new Date() > expiresAt) {
      showAlert({ title: 'Délai expiré', message: 'Le délai de paiement de 24h est dépassé.', type: 'warning' });
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);

      const method = paymentMethod === 'card' ? 'CARTE_BANCAIRE' : 'PAYPAL';

      const reservation = await reservationRequestService.finalizeReservation(requestId, method);

      console.log(' Paiement finalisé, réservation créée:', reservation);

      // Navigation directe vers l'écran QR Code avec les données de la réservation
      navigation.replace('QRCodeDisplay', {
        reservation: {
          id: reservation.id_Reservation,
          name: parkingName,
          location: reservation.parking?.address || requestData?.announcement?.parking?.address,
          startDateTime: reservation.startDateTime,
          endDateTime: reservation.endDateTime,
          parking: reservation.parking,
          status: reservation.status || 'À venir',
          totalPrice: totalGain
        }
      });
    } catch (error) {
      console.error('Erreur: Erreur paiement:', error);
      showAlert({ title: 'Erreur', message: error.message || 'Impossible de finaliser le paiement', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTime = () => {
    if (!expiresAt) return null;
    const now = new Date();
    const diff = expiresAt - now;

    if (diff <= 0) return 'Expiré';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}min restantes`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finaliser le paiement</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Loading indicator si données en cours de chargement */}
      {loadingData ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6BBF47" />
          <Text style={{ marginTop: 16, color: '#666' }}>Chargement des détails...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Deadline Warning */}
          {expiresAt && (
            <View style={styles.warningBox}>
              <Ionicons name="time-outline" size={20} color="#FF9800" />
              <Text style={styles.warningText}>{getRemainingTime()}</Text>
            </View>
          )}

          {/* Récapitulatif */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Récapitulatif</Text>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Parking</Text>
                <Text style={styles.summaryValue}>{parkingName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Début</Text>
                <Text style={styles.summaryValue}>{formatDate(startDateTime)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fin</Text>
                <Text style={styles.summaryValue}>{formatDate(endDateTime)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelBold}>Montant total</Text>
                <Text style={styles.summaryValueBold}>{formatPrice(totalGain)}</Text>
              </View>
            </View>
          </View>

          {/* Payment Method Tabs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Méthode de paiement</Text>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, paymentMethod === 'card' && styles.tabActive]}
                onPress={() => setPaymentMethod('card')}
              >
                <Text style={[styles.tabText, paymentMethod === 'card' && styles.tabTextActive]}>
                  Carte bancaire
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, paymentMethod === 'paypal' && styles.tabActive]}
                onPress={() => setPaymentMethod('paypal')}
              >
                <Text style={[styles.tabText, paymentMethod === 'paypal' && styles.tabTextActive]}>
                  PayPal
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card Payment Form */}
          {paymentMethod === 'card' && (
            <View style={styles.section}>
              {/* Card Logos */}
              <Text style={styles.acceptedCardsLabel}>CARTES ACCEPTÉES</Text>
              <View style={styles.cardLogos}>
                <View style={[styles.cardLogo, { backgroundColor: '#1A1F71' }]}>
                  <Text style={styles.cardLogoText}>Visa</Text>
                </View>
                <View style={[styles.cardLogo, { backgroundColor: '#EB001B' }]}>
                  <Text style={styles.cardLogoText}>MC</Text>
                </View>
                <View style={[styles.cardLogo, { backgroundColor: '#006FCF' }]}>
                  <Text style={styles.cardLogoText}>AMEX</Text>
                </View>
              </View>

              {/* Cardholder Name */}
              <Text style={styles.inputLabel}>Nom du titulaire</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#999"
                value={cardholderName}
                onChangeText={setCardholderName}
                autoCapitalize="words"
              />

              {/* Card Number */}
              <Text style={styles.inputLabel}>Numéro de carte</Text>
              <TextInput
                style={styles.input}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor="#999"
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="numeric"
                maxLength={19}
              />

              {/* Expiry & CVV */}
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>Date d'expiration</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#999"
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiry(text))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor="#999"
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>
          )}

          {/* PayPal */}
          {paymentMethod === 'paypal' && (
            <View style={styles.section}>
              <TouchableOpacity style={styles.paypalButton}>
                <Text style={styles.paypalButtonText}>Se connecter avec PayPal</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Payer {formatPrice(totalGain)}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Security Badge */}
          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#666" />
            <Text style={styles.securityText}>Paiement sécurisé</Text>
          </View>
        </ScrollView>
      )}
      {AlertComponent}
    </View>
  );
}
