import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ReservationCard } from "../../../components/cards/ReservationCard/ReservationCard";
import Header from "../../../components/ui/Header/Header";
import Footer from "../../../components/ui/Footer/Footer";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { reservationService, ratingService } from '../../../services';
import RatingModal from '../../../components/modals/RatingModal';
import { reservationListStyles as styles } from './ReservationList.styles';

export default function ReservationList() {
  const navigation = useNavigation();
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Onglet actif: 'client' = mes réservations, 'owner' = réservations sur mes parkings
  const [activeTab, setActiveTab] = useState('client');

  // Filtres
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Tous');
  const [selectedDateFilter, setSelectedDateFilter] = useState('Tous');

  // États pour les dropdowns
  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);
  const [periodDropdownVisible, setPeriodDropdownVisible] = useState(false);

  // État pour le modal de notation
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [ratedReservations, setRatedReservations] = useState(new Set()); // IDs des réservations déjà notées

  // Fonction pour déterminer le statut et la couleur selon le cahier des charges
  const getReservationStatus = (reservation) => {
    // Utiliser le statut du backend s'il existe
    const backendStatus = reservation.status;

    // Mapping des statuts backend (labels exacts de la DB) vers l'affichage
    // Backend labels: "à venir" (value=10), "En cours" (value=15), "Terminée" (value=20), "Annulée" (value=25)
    const statusMapping = {
      'à venir': { status: 'À venir', color: 'green', value: 10 },      //  Vert selon CDC
      'En cours': { status: 'En cours', color: 'blue', value: 15 },     //  Bleu selon CDC
      'Terminée': { status: 'Terminée', color: 'gray', value: 20 },     //  Gris selon CDC
      'Annulée': { status: 'Annulée', color: 'red', value: 25 },        //  Rouge selon CDC
    };

    // Si le statut backend existe, l'utiliser
    if (backendStatus && statusMapping[backendStatus]) {
      return statusMapping[backendStatus];
    }

    // Sinon, calculer en fonction des dates (fallback)
    const now = new Date();
    const startDateValue = reservation.startDateTime || reservation.start_datetime;
    const endDateValue = reservation.endDateTime || reservation.end_datetime;

    const startDate = startDateValue ? new Date(startDateValue) : null;
    const endDate = endDateValue ? new Date(endDateValue) : null;

    // Si les dates sont invalides, retourner un statut par défaut
    if (!startDate || isNaN(startDate.getTime()) || !endDate || isNaN(endDate.getTime())) {
      return { status: 'Erreur', color: 'red' };
    }

    if (now < startDate) {
      return { status: 'À venir', color: 'green' };    //  Vert
    } else if (now >= startDate && now <= endDate) {
      return { status: 'En cours', color: 'blue' };    //  Bleu
    } else {
      return { status: 'Terminé', color: 'gray' };     //  Gris
    }
  };

  // Formater les données de l'API pour le composant
  const formatReservation = (reservation, index) => {
    try {
      const { status, color } = getReservationStatus(reservation);

      // Formater la date - supporter différents formats de noms de champs
      const startDateValue = reservation.startDateTime || reservation.start_datetime;
      const endDateValue = reservation.endDateTime || reservation.end_datetime;

      // Vérifier que les dates sont valides
      const startDate = startDateValue ? new Date(startDateValue) : null;
      const endDate = endDateValue ? new Date(endDateValue) : null;

      let dateStr = 'Date non disponible';
      if (startDate && !isNaN(startDate.getTime()) && endDate && !isNaN(endDate.getTime())) {
        dateStr = `Le ${startDate.toLocaleDateString('fr-FR')} ${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}-${endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      }

      // Supporter les deux formats de données (parking.name ou parkingName)
      const parkingName = reservation.parking?.name || reservation.parkingName || 'Parking non disponible';
      const parkingAddress = reservation.parking?.address || reservation.parkingAddress || 'Adresse non disponible';
      const parkingId = reservation.parking?.id || reservation.parkingId;

      return {
        id: reservation.id ? reservation.id.toString() : `temp-${index}`,
        parkingId: parkingId,
        name: parkingName,
        location: parkingAddress,
        dateTime: dateStr,
        status: status,
        color: color,
        totalPrice: reservation.totalPrice || 0,
        paymentMethod: reservation.paymentMethod || 'Non défini',
        // Infos client (pour le propriétaire)
        clientId: reservation.clientId,
        clientName: reservation.clientName,
      };
    } catch (error) {
      console.error('[Reservation] Format error:', error.message);
      // Retourner une réservation par défaut en cas d'erreur
      return {
        id: `error-${index}`,
        parkingId: null,
        name: 'Erreur de chargement',
        location: 'Données incomplètes',
        dateTime: 'Date non disponible',
        status: 'Erreur',
        color: 'red',
        totalPrice: 0,
        paymentMethod: 'N/A',
      };
    }
  };

  // Charger les réservations selon l'onglet actif
  const loadReservations = async () => {
    try {
      setError(null);
      setLoading(true);
      const userJson = await AsyncStorage.getItem('user');

      if (!userJson) {
        setError('Utilisateur non connecté');
        navigation.navigate('Login');
        return;
      }

      const user = JSON.parse(userJson);
      const userId = user.Id_Users;

      let data;
      if (activeTab === 'client') {
        data = await reservationService.getUserReservations(userId);
      } else {
        data = await reservationService.getOwnerParkingReservations(userId);
      }

      // Vérifier que data est un tableau
      if (!Array.isArray(data)) {
        console.warn('[Reservation] Received data is not an array');
        setReservations([]);
        return;
      }

      // Formater les données pour l'affichage
      const formattedData = data.map((reservation, index) => formatReservation(reservation, index));

      // Trier par date (plus récentes en premier)
      formattedData.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

      setReservations(formattedData);
      setFilteredReservations(formattedData);
    } catch (error) {
      console.error('[Reservation] Load error:', error.message);
      setError('Impossible de charger les réservations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Ouvrir le modal de notation
  const handleOpenRatingModal = (reservation) => {
    setSelectedReservation(reservation);
    setRatingModalVisible(true);
  };

  // Fermer le modal de notation
  const handleCloseRatingModal = () => {
    setRatingModalVisible(false);
    setSelectedReservation(null);
  };

  // Soumettre une notation
  const handleSubmitRating = async (ratingData) => {
    try {
      // Récupérer l'utilisateur connecté
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      const fullRatingData = {
        ...ratingData,
        idUser: user?.Id_Users,
        idParking: selectedReservation?.parkingId,
        reservationId: selectedReservation?.id,
      };


      await ratingService.submitRating(fullRatingData);
      setRatedReservations(prev => new Set([...prev, selectedReservation?.id]));
    } catch (error) {
      console.error('[Rating] Submit error:', error.message);
      throw error; // Propager l'erreur pour que le modal l'affiche
    }
  };

  // Charger au montage et quand l'onglet change
  useEffect(() => {
    loadReservations();
  }, [activeTab]);

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    applyFilters();
  }, [selectedStatusFilter, selectedDateFilter, reservations]);

  // Fonction pour appliquer les filtres
  const applyFilters = () => {
    let filtered = [...reservations];

    // Filtre par statut
    if (selectedStatusFilter !== 'Tous') {
      filtered = filtered.filter(r => r.status === selectedStatusFilter);
    }

    // Filtre par date
    if (selectedDateFilter !== 'Tous') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(r => {
        const resDate = new Date(r.dateTime.split(' ')[1]); // Extraire la date

        switch (selectedDateFilter) {
          case 'Aujourd\'hui':
            return resDate.toDateString() === today.toDateString();

          case 'Cette semaine':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return resDate >= weekStart && resDate <= weekEnd;

          case 'Ce mois':
            return resDate.getMonth() === now.getMonth() &&
              resDate.getFullYear() === now.getFullYear();

          case 'Historique':
            // Afficher les réservations terminées et annulées (labels exacts de la DB)
            return r.status === 'Terminée' || r.status === 'Annulée';

          default:
            return true;
        }
      });
    }

    setFilteredReservations(filtered);
  };

  // Fonction refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadReservations();
  };

  // Composant FilterDropdown
  const FilterDropdown = ({ visible, onClose, options, selectedValue, onSelect, label }) => {
    const [scaleValue] = useState(new Animated.Value(0));

    useEffect(() => {
      if (visible) {
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 50,
        }).start();
      } else {
        scaleValue.setValue(0);
      }
    }, [visible]);

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          onPress={onClose}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              styles.dropdownContainer,
              {
                transform: [{ scale: scaleValue }],
                opacity: scaleValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }
            ]}
          >
            <Text style={styles.dropdownLabel}>{label}</Text>
            {options.map((option) => (
              <TouchableOpacity
                key={typeof option === 'string' ? option : option.label}
                style={[
                  styles.dropdownItem,
                  (typeof option === 'string' ? selectedValue === option : selectedValue === option.label) && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  onSelect(typeof option === 'string' ? option : option.label);
                  onClose();
                }}
              >
                {typeof option === 'string' ? (
                  <Text style={[
                    styles.dropdownItemText,
                    (typeof option === 'string' ? selectedValue === option : selectedValue === option.label) && styles.dropdownItemTextSelected
                  ]}>
                    {option}
                  </Text>
                ) : (
                  <View style={styles.dropdownItemWithIndicator}>
                    <View style={[styles.dropdownItemIndicator, { backgroundColor: option.color }]} />
                    <Text style={[
                      styles.dropdownItemText,
                      selectedValue === option.label && styles.dropdownItemTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Données pour les filtres
  const statuses = [
    { label: 'Tous', color: '#333' },
    { label: 'À venir', color: '#4CAF50' },
    { label: 'En cours', color: '#2196F3' },
    { label: 'Terminée', color: '#9E9E9E' },
    { label: 'Annulée', color: '#F44336' },
  ];

  const periods = ['Tous', 'Aujourd\'hui', 'Cette semaine', 'Ce mois'];

  // Affichage du chargement
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#A4E66E" />
          <Text style={styles.loadingText}>Chargement des réservations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Erreur: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadReservations}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Affichage liste vide
  if (reservations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} />
        <Text style={styles.title}>Mes réservations</Text>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}> Aucune réservation</Text>
          <Text style={styles.emptySubText}>Vos réservations apparaîtront ici</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.navigate('Liste des parkings')}
          >
            <Text style={styles.retryButtonText}>Rechercher un parking</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header navigation={navigation} />

      {/* Onglets principaux : Mes réservations / Sur mes parkings */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'client' && styles.tabButtonActive]}
          onPress={() => setActiveTab('client')}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={activeTab === 'client' ? '#6BBF47' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'client' && styles.tabTextActive]}>
            Mes réservations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'owner' && styles.tabButtonActive]}
          onPress={() => setActiveTab('owner')}
        >
          <Ionicons
            name="business-outline"
            size={18}
            color={activeTab === 'owner' ? '#6BBF47' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'owner' && styles.tabTextActive]}>
            Sur mes parkings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Title avec Badge */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          {activeTab === 'client' ? 'Mes réservations' : 'Réservations reçues'}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filteredReservations.length}</Text>
        </View>
      </View>

      {/* Bouton Scanner QR - uniquement pour le propriétaire */}
      {activeTab === 'owner' && (
        <TouchableOpacity
          style={styles.scannerButton}
          onPress={() => navigation.navigate('QRCodeScanner')}
        >
          <Ionicons name="qr-code-outline" size={24} color="#fff" />
          <Text style={styles.scannerButtonText}>Scanner un client</Text>
        </TouchableOpacity>
      )}

      {/* ➡️ Filtres en Dropdown */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setStatusDropdownVisible(true)}
          >
            <Text style={styles.filterButtonText} numberOfLines={1} ellipsizeMode="tail">
              Statut: {selectedStatusFilter}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, styles.filterButtonSecondary]}
            onPress={() => setPeriodDropdownVisible(true)}
          >
            <Text style={styles.filterButtonText} numberOfLines={1} ellipsizeMode="tail">
              Période: {selectedDateFilter}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, styles.historyButton]}
            onPress={() => {
              setSelectedDateFilter('Historique');
            }}
          >
            <Text style={styles.historyButtonText} numberOfLines={1}>Historique</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Modals */}
      <FilterDropdown
        visible={statusDropdownVisible}
        onClose={() => setStatusDropdownVisible(false)}
        options={statuses}
        selectedValue={selectedStatusFilter}
        onSelect={setSelectedStatusFilter}
        label="Filtrer par statut"
      />

      <FilterDropdown
        visible={periodDropdownVisible}
        onClose={() => setPeriodDropdownVisible(false)}
        options={periods}
        selectedValue={selectedDateFilter}
        onSelect={setSelectedDateFilter}
        label="Filtrer par période"
      />

      {/* ➡️ Message si aucune réservation après filtrage */}
      {filteredReservations.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Aucune réservation trouvée</Text>
          <Text style={styles.emptySubText}>Essayez de modifier les filtres</Text>
        </View>
      ) : (
        /* ➡️ Reservations List */
        <FlatList
          data={filteredReservations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReservationCard
              reservation={item}
              styles={styles}
              onRate={handleOpenRatingModal}
              hasRated={ratedReservations.has(item.id)}
              isOwnerView={activeTab === 'owner'}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#A4E66E']}
            />
          }
        />
      )}

      {/* Modal de notation */}
      <RatingModal
        visible={ratingModalVisible}
        onClose={handleCloseRatingModal}
        onSubmit={handleSubmitRating}
        reservation={selectedReservation}
      />

      {/* FOOTER */}
      <Footer navigation={navigation} activeRoute="Mes réservations" />
    </SafeAreaView>
  );
};