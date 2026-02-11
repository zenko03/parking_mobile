import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAlert } from '../../../hooks/useAlert';
import { ratingModalStyles as styles } from './RatingModal.styles';
import { colors } from '../../../theme';

/**
 * Modal de notation d'un parking après une réservation terminée
 * @param {boolean} visible - Visibilité du modal
 * @param {function} onClose - Callback de fermeture
 * @param {function} onSubmit - Callback de soumission (reçoit les données de notation)
 * @param {object} reservation - Données de la réservation (nom parking, date, etc.)
 */
export default function RatingModal({ visible, onClose, onSubmit, reservation }) {
  const { AlertComponent, showAlert } = useAlert();
  const [rating, setRating] = useState(0);
  const [criteria, setCriteria] = useState({
    cleanliness: false,
    precision: false,
    communication: false,
    security: false,
  });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Labels des critères
  const criteriaLabels = {
    cleanliness: { label: 'Propreté', icon: 'sparkles-outline' },
    precision: { label: 'Précision', icon: 'map-outline' },
    communication: { label: 'Communication', icon: 'chatbubble-outline' },
    security: { label: 'Sécurité', icon: 'shield-checkmark-outline' },
  };

  // Reset du formulaire
  const resetForm = () => {
    setRating(0);
    setCriteria({
      cleanliness: false,
      precision: false,
      communication: false,
      security: false,
    });
    setComment('');
  };

  // Fermeture du modal
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Toggle d'un critère
  const toggleCriteria = (key) => {
    setCriteria(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Soumission de l'avis
  const handleSubmit = async () => {
    if (rating === 0) {
      showAlert({ title: 'Note requise', message: 'Veuillez sélectionner une note de 1 à 5 étoiles.', type: 'warning' });
      return;
    }

    setSubmitting(true);

    try {
      const ratingData = {
        note: rating,
        cleanliness: criteria.cleanliness,
        precision: criteria.precision,
        communication: criteria.communication,
        security: criteria.security,
        description: comment.trim(),
        reservationId: reservation?.id,
        parkingId: reservation?.parkingId,
      };

      await onSubmit(ratingData);
      
      showAlert({
        title: 'Merci !',
        message: 'Votre avis a été enregistré avec succès.',
        type: 'success',
        buttons: [{ text: 'OK', onPress: handleClose }]
      });
    } catch (error) {
      console.error('Erreur soumission avis:', error);
      showAlert({ title: 'Erreur', message: 'Impossible d\'envoyer votre avis. Veuillez réessayer.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Rendu des étoiles
  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={42}
              color={star <= rating ? colors.primary.bright : colors.border.medium}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Rendu des critères
  const renderCriteria = () => {
    return (
      <View style={styles.criteriaContainer}>
        <Text style={styles.criteriaTitle}>Qu'est-ce qui était bien ?</Text>
        <View style={styles.criteriaButtons}>
          {Object.entries(criteriaLabels).map(([key, { label, icon }]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.criteriaButton,
                criteria[key] && styles.criteriaButtonActive,
              ]}
              onPress={() => toggleCriteria(key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={icon}
                size={16}
                color={criteria[key] ? colors.text.darkGreen : colors.text.gray.slate.dark}
                style={styles.criteriaIcon}
              />
              <Text
                style={[
                  styles.criteriaLabel,
                  criteria[key] && styles.criteriaLabelActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.dark} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Laisser un avis</Text>
            <View style={styles.closeButton} />
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Info Parking */}
            <View style={styles.parkingInfo}>
              <View style={styles.parkingImageContainer}>
                <View style={styles.parkingImagePlaceholder}>
                  <Ionicons name="car" size={32} color={colors.primary.bright} />
                </View>
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={12} color={colors.text.darkGreen} />
                </View>
              </View>
              <Text style={styles.parkingName}>{reservation?.name || 'Parking'}</Text>
              <View style={styles.reservationDateBadge}>
                <Text style={styles.reservationDateText}>
                  {reservation?.dateTime || 'Réservation terminée'}
                </Text>
              </View>
            </View>

            {/* Rating Section */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingTitle}>
                Comment évaluez-vous votre expérience ?
              </Text>
              {renderStars()}
              {rating > 0 && (
                <Text style={styles.ratingText}>
                  {rating === 1 && 'Très mauvais'}
                  {rating === 2 && 'Mauvais'}
                  {rating === 3 && 'Moyen'}
                  {rating === 4 && 'Bien'}
                  {rating === 5 && 'Excellent'}
                </Text>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Criteria Section */}
            {renderCriteria()}

            {/* Comment Section */}
            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>Commentaire</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Dites-nous en plus sur votre expérience..."
                  placeholderTextColor={colors.text.gray.slate.medium}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={comment}
                  onChangeText={setComment}
                  maxLength={500}
                />
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={colors.border.medium}
                  style={styles.textAreaIcon}
                />
              </View>
              <Text style={styles.charCount}>{comment.length}/500</Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color={colors.text.darkGreen} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Soumettre l'avis</Text>
                  <Ionicons name="send" size={20} color={colors.text.darkGreen} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {AlertComponent}
    </Modal>
  );
}

