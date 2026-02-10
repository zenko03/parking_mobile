import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { myParkingsStyles as styles } from './MyParkings.styles';
import ownerService from '../../../services/ownerService';
import SupabaseImage from '../../../components/ui/SupabaseImage';
import { convertToProxyUrl } from '../../../utils/imageUtils';
import { formatHourlyRate } from '../../../config/constants';

const MyParkings = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUserAndParkings();
  }, []);

  const loadUserAndParkings = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserId(user.Id_Users);
        await loadParkings(user.Id_Users);
      }
    } catch (error) {
      console.error('[User] Load error:', error.message);
      setLoading(false);
    }
  };

  const loadParkings = async (uid) => {
    try {
      setLoading(true);
      const data = await ownerService.getMyParkings();
      setParkings(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger vos parkings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (userId) {
      setRefreshing(true);
      loadParkings(userId);
    }
  };

  const handleAddParking = () => {
    navigation.navigate('AddEditParking');
  };

  const handleEditParking = (parking) => {
    navigation.navigate('AddEditParking', { parkingId: parking.Id_Parking });
  };

  const handleDeleteParking = (parking) => {
    Alert.alert(
      'Confirmation',
      `Voulez-vous vraiment supprimer "${parking.label}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await ownerService.deleteParking(parking.Id_Parking);
              Alert.alert('Succès', 'Parking supprimé avec succès');
              loadParkings(userId);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le parking');
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (parking) => {
    navigation.navigate('MyParkingDetails', { parkingId: parking.Id_Parking });
  };

  const extractAddress = (parking) => {
    // Utiliser le champ address dédié ou fallback sur description
    if (parking.address) {
      return parking.address;
    }
    // Fallback: extraire les 2 premières lignes de la description
    const lines = parking.description?.split('\n') || [];
    return lines.slice(0, 2).join('\n') || 'Adresse non spécifiée';
  };

  const renderParkingCard = (parking) => {
    const isActive = parking.isActive !== false;
    const statusBadge = isActive ? 'DISPONIBLE' : 'INACTIF';
    const statusColor = isActive ? '#dcfce7' : '#f3f4f6';
    const statusTextColor = isActive ? '#16a34a' : '#6b7280';

    // Récupérer l'image principale du parking (via proxy)
    const parkingImage = parking.primaryImageUrl
      ? convertToProxyUrl(parking.primaryImageUrl)
      : null;

    return (
      <View key={parking.Id_Parking} style={styles.card}>
        {/* Card Body */}
        <View style={styles.cardBody}>
          {/* Image Placeholder */}
          <View style={styles.imageContainer}>
            {parkingImage ? (
              <SupabaseImage
                uri={parkingImage}
                style={styles.parkingImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="car" size={32} color="#9ca3af" />
              </View>
            )}
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={[styles.statusText, { color: statusTextColor }]}>
                {statusBadge}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {parking.label}
            </Text>
            <Text style={styles.cardAddress} numberOfLines={2}>
              {extractAddress(parking)}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>
                {formatHourlyRate(parking.hourlyRate)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => handleViewDetails(parking)}
            >
              <Text style={styles.detailsButtonText}>Voir les détails</Text>
              <Ionicons name="arrow-forward" size={16} color="#13ec13" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditParking(parking)}
          >
            <Ionicons name="create-outline" size={18} color="#6b7280" />
            <Text style={styles.actionText}>Modifier</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteParking(parking)}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text style={[styles.actionText, { color: '#ef4444' }]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="car-outline" size={80} color="#d1d5db" />
      <Text style={styles.emptyTitle}>Aucun parking</Text>
      <Text style={styles.emptySubtitle}>
        Vous n'avez pas encore ajouté de parking.{'\n'}
        Commencez par ajouter votre première place !
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#13ec13" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Parkings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#13ec13']}
          />
        }
      >
        {/* Add Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddParking}>
            <Ionicons name="add-circle" size={24} color="#102210" />
            <Text style={styles.addButtonText}>Ajouter un nouveau parking</Text>
          </TouchableOpacity>
        </View>

        {/* Parking List or Empty State */}
        {parkings.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.parkingList}>
            {parkings.map((parking) => renderParkingCard(parking))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

export default MyParkings;
