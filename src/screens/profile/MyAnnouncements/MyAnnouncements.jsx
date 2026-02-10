import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import announcementService from '../../../services/announcementService';
import { myAnnouncementsStyles as styles } from './MyAnnouncements.styles';
import Footer from '../../../components/ui/Footer/Footer';

const MyAnnouncements = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUserAndAnnouncements();
  }, []);

  const loadUserAndAnnouncements = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserId(user.Id_Users);
        await loadAnnouncements(user.Id_Users);
      }
    } catch (error) {
      console.error('[User] Load error:', error.message);
      setLoading(false);
    }
  };

  const loadAnnouncements = async (uid) => {
    try {
      setLoading(true);
      const data = await announcementService.getMyAnnouncements(uid);
      setAnnouncements(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger vos annonces');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (userId) {
      setRefreshing(true);
      loadAnnouncements(userId);
    }
  };

  const handleCreateAnnouncement = () => {
    navigation.navigate('CreateAnnouncement');
  };

  const handleDeleteAnnouncement = (announcement) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment supprimer cette annonce ? Vous pourrez la restaurer plus tard.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await announcementService.deleteAnnouncement(announcement.Id_Announcements);
              Alert.alert('Succès', 'Annonce supprimée avec succès');
              loadAnnouncements(userId);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'annonce');
            }
          },
        },
      ]
    );
  };

  const handleTogglePublish = async (announcement) => {
    const announcementId = announcement.Id_Announcements || announcement.id_Announcements;


    if (!announcementId) {
      Alert.alert('Erreur', 'ID d\'annonce invalide');
      return;
    }

    try {
      const updatedAnnouncement = await announcementService.togglePublished(announcementId);
      const newStatus = updatedAnnouncement.published || updatedAnnouncement.isPublished || updatedAnnouncement.is_published ? 'publiée' : 'dépubliée';
      Alert.alert('Succès', `Annonce ${newStatus} avec succès`);
      loadAnnouncements(userId);
    } catch (error) {
      console.error('[Announcement] Toggle publish error:', error.message);
      Alert.alert('Erreur', 'Impossible de modifier le statut de publication');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderAnnouncementCard = (announcement) => {
    const parkingLabel = announcement.parking?.label || 'Parking non spécifié';
    const creationDate = formatDate(announcement.creationDate);

    return (
      <View key={announcement.id_Announcements || announcement.Id_Announcements} style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="megaphone" size={20} color="#6BBF47" />
            <Text style={styles.cardTitle} numberOfLines={1}>
              {parkingLabel}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>Créée le {creationDate}</Text>
          </View>

          {announcement.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText} numberOfLines={2}>
                {announcement.description}
              </Text>
            </View>
          )}

          {/* Véhicules acceptés */}
          {announcement.announcementsVehicles && announcement.announcementsVehicles.length > 0 && (
            <View style={styles.vehiclesContainer}>
              <Text style={styles.vehiclesLabel}>Véhicules:</Text>
              <View style={styles.vehiclesList}>
                {announcement.announcementsVehicles.map((av, index) => (
                  <View key={index} style={styles.vehicleChip}>
                    <Text style={styles.vehicleChipText}>
                      {av.parkingVehicles?.vehicles?.types || 'Véhicule'} ({av.numbers})
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Card Footer - Actions */}
        <View style={styles.cardFooter}>
          {(() => {
            // Vérifier explicitement chaque format possible (le || ne fonctionne pas avec false)
            const isPublished = announcement.published !== undefined ? announcement.published
              : announcement.isPublished !== undefined ? announcement.isPublished
                : announcement.is_published;
            return (
              <TouchableOpacity
                onPress={() => handleTogglePublish(announcement)}
                style={[styles.actionButton, isPublished ? styles.unpublishButton : styles.publishButton]}
              >
                <Ionicons
                  name={isPublished ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={isPublished ? "#f59e0b" : "#10b981"}
                />
                <Text style={[styles.actionButtonText, isPublished ? styles.unpublishButtonText : styles.publishButtonText]}>
                  {isPublished ? 'Dépublier' : 'Publier'}
                </Text>
              </TouchableOpacity>
            );
          })()}

          <TouchableOpacity
            onPress={() => handleDeleteAnnouncement(announcement)}
            style={[styles.actionButton, styles.deleteButton]}
          >
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Supprimer
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6BBF47" />
        <Text style={styles.loadingText}>Chargement de vos annonces...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Annonces</Text>
        <TouchableOpacity onPress={handleCreateAnnouncement} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#6BBF47" />
        </TouchableOpacity>
      </View>

      {/* Liste des annonces */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6BBF47']} />
        }
      >
        {announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="megaphone-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Aucune annonce</Text>
            <Text style={styles.emptyText}>
              Créez votre première annonce pour rendre vos parkings disponibles à la location
            </Text>
            <TouchableOpacity onPress={handleCreateAnnouncement} style={styles.emptyButton}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Créer une annonce</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {announcements.map(renderAnnouncementCard)}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <Footer navigation={navigation} activeRoute="Mes Annonces" />
    </View>
  );
};

export default MyAnnouncements;
