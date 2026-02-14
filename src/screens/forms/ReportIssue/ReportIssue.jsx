/**
 *  REPORT ISSUE SCREEN
 * Écran pour signaler un litige sur une réservation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import disputeService, { DISPUTE_MOTIFS } from '../../../services/disputeService';
import { reservationService, imageService } from '../../../services';
import { useAlert } from '../../../hooks/useAlert';
import { reportIssueStyles as styles } from './ReportIssue.styles';

export default function ReportIssue({ route, navigation }) {
  const { AlertComponent, showAlert } = useAlert();
  const { reservationId, reservationData } = route.params || {};

  // États du formulaire
  const [selectedMotif, setSelectedMotif] = useState(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);

  // États UI
  const [loading, setLoading] = useState(false);
  const [loadingReservation, setLoadingReservation] = useState(false);
  const [reservation, setReservation] = useState(reservationData || null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Charger les détails de la réservation si pas fournis
  useEffect(() => {
    if (!reservation && reservationId) {
      loadReservationDetails();
    }
  }, [reservationId]);

  const loadReservationDetails = async () => {
    try {
      setLoadingReservation(true);
      // On utilise les données passées en paramètre ou on les récupère
      // Dans ce cas, reservationData devrait contenir les infos nécessaires
      if (__DEV__) {
        console.log('📥 Chargement détails réservation:', reservationId);
      }
    } catch (error) {
      console.error('Erreur: Erreur chargement réservation:', error);
      showAlert({ title: 'Erreur', message: 'Impossible de charger les détails de la réservation', type: 'error' });
    } finally {
      setLoadingReservation(false);
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const month = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} • ${hours}:${minutes}`;
  };

  // Sélectionner une photo (galerie ou caméra)
  const handleAddPhoto = async (source = 'gallery') => {
    if (photos.length >= 5) {
      showAlert({ title: 'Limite atteinte', message: 'Vous pouvez ajouter maximum 5 photos', type: 'warning' });
      return;
    }

    try {
      let result;
      if (Platform.OS === 'web') {
        // Appel direct pour eviter window.confirm() qui bloque iOS Safari
        result = source === 'camera'
          ? await imageService.showCameraPicker()
          : await imageService.showGalleryPicker(5);
      } else {
        // React Native natif: utilise Alert.alert
        result = await imageService.showImagePickerOptions();
      }

      if (result.images && result.images.length > 0) {
        // Limiter le nombre de photos ajoutees
        const remainingSlots = 5 - photos.length;
        const newPhotos = result.images.slice(0, remainingSlots);
        setPhotos([...photos, ...newPhotos]);
      }
    } catch (error) {
      console.error('Erreur selection photo:', error);
      showAlert({ title: 'Erreur', message: 'Impossible de selectionner la photo', type: 'error' });
    }
  };

  // Supprimer une photo
  const handleRemovePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  // Valider le formulaire
  const isFormValid = () => {
    return selectedMotif !== null && description.trim().length >= 10;
  };

  // Soumettre le litige
  const handleSubmit = async () => {
    if (!isFormValid()) {
      showAlert({ title: 'Formulaire incomplet', message: 'Veuillez sélectionner un motif et décrire le problème (minimum 10 caractères)', type: 'warning' });
      return;
    }

    showAlert({
      title: 'Confirmer le signalement',
      message: 'Êtes-vous sûr de vouloir soumettre ce litige ? Notre équipe examinera votre demande dans les plus brefs délais.',
      type: 'warning',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Soumettre',
          onPress: submitDispute,
        },
      ]
    });
  };

  const submitDispute = async () => {
    try {
      setSubmitting(true);

      // Récupérer l'ID utilisateur
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const userId = user?.Id_Users;

      if (!userId) {
        showAlert({ title: 'Erreur', message: 'Impossible de récupérer vos informations utilisateur', type: 'error' });
        return;
      }

      // Créer le litige
      const disputeData = {
        reservationId: parseInt(reservationId),
        motif: DISPUTE_MOTIFS.find(m => m.value === selectedMotif)?.label || selectedMotif,
        description: description.trim(),
      };

      const result = await disputeService.createDispute(disputeData);

      if (result.success && result.data) {
        const disputeId = result.data.id;

        // Si des photos ont été ajoutées, les uploader comme preuves
        if (photos.length > 0) {
          if (__DEV__) {
            console.log(' Upload de', photos.length, 'photos pour le litige', disputeId);
          }

          for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            try {
              // Upload de l'image vers Supabase via le backend
              const uploadResult = await imageService.uploadDisputeProofImage(
                photo.uri,
                disputeId,
                userId
              );

              if (uploadResult.success && uploadResult.imageUrl) {
                if (__DEV__) {
                  console.log(` Photo ${i + 1} uploadée:`, uploadResult.imageUrl);
                }
              } else {
                console.warn(` Échec upload photo ${i + 1}:`, uploadResult.error);
              }
            } catch (photoError) {
              console.error(`Erreur: Erreur upload photo ${i + 1}:`, photoError);
              // Continue avec les autres photos même si une échoue
            }
          }
        }

        showAlert({
          title: 'Litige signalé',
          message: 'Votre signalement a été enregistré. Notre équipe vous contactera rapidement.',
          type: 'success',
          buttons: [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        });
      }
    } catch (error) {
      console.error('Erreur: Erreur soumission litige:', error);
      showAlert({ title: 'Erreur', message: 'Impossible de soumettre le litige. Veuillez réessayer.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Affichage chargement
  if (loadingReservation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6BBF47" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111811" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signaler un litige</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Carte Réservation */}
        <Text style={styles.sectionLabel}>Réservation concernée</Text>
        <View style={styles.reservationCard}>
          <View style={styles.reservationInfo}>
            <Text style={styles.reservationTitle}>
              {reservation?.name || reservation?.parkingName || 'Réservation'}
            </Text>
            <View style={styles.reservationDateRow}>
              <Ionicons name="calendar" size={16} color="#6BBF47" />
              <Text style={styles.reservationDate}>
                {reservation?.dateTime || formatDate(reservation?.startDateTime)}
              </Text>
            </View>
            <View style={styles.reservationLocationRow}>
              <Ionicons name="location" size={14} color="#9CA3AF" />
              <Text style={styles.reservationLocation} numberOfLines={1}>
                {reservation?.location || reservation?.parkingAddress || 'Adresse non disponible'}
              </Text>
            </View>
          </View>
        </View>

        {/* Dropdown Motif */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Type de litige</Text>
          <TouchableOpacity
            style={[styles.dropdown, dropdownVisible && styles.dropdownFocused]}
            onPress={() => setDropdownVisible(true)}
          >
            {selectedMotif ? (
              <Text style={styles.dropdownText}>
                {DISPUTE_MOTIFS.find(m => m.value === selectedMotif)?.label}
              </Text>
            ) : (
              <Text style={styles.dropdownPlaceholder}>Sélectionnez le motif</Text>
            )}
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Modal Dropdown */}
        <Modal
          visible={dropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.dropdownModal}>
              <Text style={styles.dropdownModalTitle}>Type de litige</Text>
              {DISPUTE_MOTIFS.map((motif) => (
                <TouchableOpacity
                  key={motif.value}
                  style={[
                    styles.dropdownOption,
                    selectedMotif === motif.value && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedMotif(motif.value);
                    setDropdownVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      selectedMotif === motif.value && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {motif.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Textarea Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Description du problème</Text>
          <TextInput
            style={[styles.textarea, descriptionFocused && styles.textareaFocused]}
            placeholder="Expliquez la situation en détail (ex: La barrière ne s'ouvre pas, la place numéro 42 est prise...)"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
            onFocus={() => setDescriptionFocused(true)}
            onBlur={() => setDescriptionFocused(false)}
          />
          {description.length > 0 && description.length < 10 && (
            <Text style={styles.errorText}>Minimum 10 caractères requis</Text>
          )}
        </View>

        {/* Section Photos */}
        <View style={styles.fieldContainer}>
          <View style={styles.photosHeader}>
            <Text style={styles.fieldLabel}>Preuves (Photos)</Text>
            <Text style={styles.optionalBadge}>Optionnel</Text>
          </View>
          <View style={styles.photosGrid}>
            {/* Photos existantes */}
            {photos.map((photo, index) => (
              <TouchableOpacity
                key={index}
                style={styles.photoItem}
                onPress={() => handleRemovePhoto(index)}
              >
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                <View style={styles.photoDeleteOverlay}>
                  <Ionicons name="trash" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            ))}

            {/* Bouton ajouter photo */}
            {photos.length < 5 && (
              Platform.OS === 'web' ? (
                // Sur web: deux boutons separes (fix iOS Safari)
                <>
                  <TouchableOpacity 
                    style={[styles.addPhotoButton, { marginRight: 8 }]} 
                    onPress={() => handleAddPhoto('gallery')}
                  >
                    <View style={styles.addPhotoIcon}>
                      <Ionicons name="images" size={20} color="#6BBF47" />
                    </View>
                    <Text style={styles.addPhotoText}>Galerie</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.addPhotoButton} 
                    onPress={() => handleAddPhoto('camera')}
                  >
                    <View style={styles.addPhotoIcon}>
                      <Ionicons name="camera" size={20} color="#6BBF47" />
                    </View>
                    <Text style={styles.addPhotoText}>Camera</Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Sur native: bouton unique avec Alert.alert
                <TouchableOpacity style={styles.addPhotoButton} onPress={() => handleAddPhoto()}>
                  <View style={styles.addPhotoIcon}>
                    <Ionicons name="camera" size={20} color="#6BBF47" />
                  </View>
                  <Text style={styles.addPhotoText}>Ajouter</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={[styles.submitButton, (!isFormValid() || submitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#102210" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Soumettre le litige</Text>
              <Ionicons name="send" size={20} color="#102210" />
            </>
          )}
        </TouchableOpacity>
      </View>
      {AlertComponent}
    </KeyboardAvoidingView>
  );
}
