import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import ownerService from '../../../services/ownerService';
import parkingService from '../../../services/parkingService';
import announcementService from '../../../services/announcementService';
import { createAnnouncementStyles as styles } from './CreateAnnouncement.styles';
import { colors } from '../../../theme';
import { useAlert } from '../../../hooks/useAlert';

const CreateAnnouncement = ({ route, navigation }) => {
  const { AlertComponent, showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const { parkingId: initialParkingId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);

  // Données du formulaire
  const [selectedParkingId, setSelectedParkingId] = useState(initialParkingId || null);
  const [myParkings, setMyParkings] = useState([]);
  const [parkingVehicles, setParkingVehicles] = useState([]);
  const [description, setDescription] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState([]); // [{parkingVehicleId, numbers}]

  // Type de disponibilité
  const [availabilityType, setAvailabilityType] = useState('recurring'); // 'recurring' ou 'calendar'

  // Disponibilités récurrentes
  const [weekdayEnabled, setWeekdayEnabled] = useState(false);
  const [weekdayHours, setWeekdayHours] = useState({ start: '08:00', end: '19:00' });
  const [weekendEnabled, setWeekendEnabled] = useState(false);
  const [weekendHours, setWeekendHours] = useState({ start: '00:00', end: '23:59' });

  // Disponibilités par calendrier
  const [calendarDates, setCalendarDates] = useState([]); // [{startDate, endDate, startHour, endHour}]
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedRange, setSelectedRange] = useState({ startDate: null, endDate: null });
  const [rangeHours, setRangeHours] = useState({ start: '08:00', end: '19:00' });
  const [markedDates, setMarkedDates] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedParkingId) {
      loadParkingVehicles(selectedParkingId);
    }
  }, [selectedParkingId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserId(user.Id_Users);

        // Charger les parkings de l'utilisateur
        const parkings = await ownerService.getMyParkings();
        setMyParkings(parkings);

        // Si un parking est pré-sélectionné
        if (initialParkingId) {
          setSelectedParkingId(initialParkingId);
        }
      }
    } catch (error) {
      console.error('Erreur chargement données initiales:', error);
      showAlert({ title: 'Erreur', message: 'Impossible de charger les données', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadParkingVehicles = async (parkingId) => {
    try {
      console.log('📡 Chargement véhicules du parking ID:', parkingId);
      // Charger les véhicules via l'endpoint spécifique
      const vehicles = await parkingService.getParkingVehicles(parkingId);
      console.log(' Véhicules reçus:', vehicles);

      if (vehicles && vehicles.length > 0) {
        setParkingVehicles(vehicles);
        // Réinitialiser la sélection
        setSelectedVehicles([]);
      } else {
        console.warn(' Aucun véhicule trouvé pour ce parking');
        setParkingVehicles([]);
      }
    } catch (error) {
      console.error('Erreur: Erreur chargement véhicules:', error);
      setParkingVehicles([]);
    }
  };

  const toggleVehicle = (parkingVehicle) => {
    const vehicleId = parkingVehicle.id_Parking_vehicles || parkingVehicle.Id_Parking_Vehicles;
    const exists = selectedVehicles.find(
      v => v.parkingVehicleId === vehicleId
    );

    if (exists) {
      setSelectedVehicles(selectedVehicles.filter(
        v => v.parkingVehicleId !== vehicleId
      ));
    } else {
      setSelectedVehicles([
        ...selectedVehicles,
        {
          parkingVehicleId: vehicleId,
          numbers: '', // Champ vide par défaut
        }
      ]);
    }
  };

  const updateVehicleCount = (parkingVehicleId, count) => {
    const parsed = parseInt(count);
    const parkingVehicle = parkingVehicles.find(
      pv => (pv.id_Parking_vehicles || pv.Id_Parking_Vehicles) === parkingVehicleId
    );
    const maxPlaces = parkingVehicle?.numbers || parkingVehicle?.number_Of_Places || 999;

    // Permettre champ vide, sinon limiter au nombre de places disponibles
    const validCount = count === '' ? '' : Math.min(parsed || 0, maxPlaces);

    setSelectedVehicles(selectedVehicles.map(v =>
      v.parkingVehicleId === parkingVehicleId
        ? { ...v, numbers: validCount }
        : v
    ));
  };

  const buildAvailabilitiesFrequence = () => {
    const availabilities = [];

    if (weekdayEnabled) {
      // Lundi (1) à Vendredi (5)
      for (let day = 1; day <= 5; day++) {
        availabilities.push({
          dayOfWeekId: day,
          startHour: weekdayHours.start,
          endHour: weekdayHours.end,
        });
      }
    }

    if (weekendEnabled) {
      // Samedi (6) et Dimanche (7)
      [6, 7].forEach(day => {
        availabilities.push({
          dayOfWeekId: day,
          startHour: weekendHours.start,
          endHour: weekendHours.end,
        });
      });
    }

    return availabilities;
  };

  // Générer les dates marquées pour le calendrier
  const generateMarkedDates = (start, end) => {
    const marked = {};
    if (!start) return marked;

    const startDate = new Date(start);
    const endDate = end ? new Date(end) : startDate;

    // Marquer la plage sélectionnée
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isStart = dateStr === start;
      const isEnd = dateStr === (end || start);

      marked[dateStr] = {
        color: colors.primary.bright,
        textColor: 'white',
        startingDay: isStart,
        endingDay: isEnd,
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Ajouter les plages déjà enregistrées (en gris)
    calendarDates.forEach(range => {
      let current = new Date(range.startDate);
      const rangeEnd = new Date(range.endDate);
      while (current <= rangeEnd) {
        const dateStr = current.toISOString().split('T')[0];
        if (!marked[dateStr]) {
          marked[dateStr] = {
            color: '#9ca3af',
            textColor: 'white',
            startingDay: dateStr === range.startDate,
            endingDay: dateStr === range.endDate,
          };
        }
        current.setDate(current.getDate() + 1);
      }
    });

    return marked;
  };

  // Gérer la sélection d'une date sur le calendrier
  const handleDayPress = (day) => {
    const dateStr = day.dateString;

    if (!selectedRange.startDate || (selectedRange.startDate && selectedRange.endDate)) {
      // Début d'une nouvelle sélection
      setSelectedRange({ startDate: dateStr, endDate: null });
      setMarkedDates(generateMarkedDates(dateStr, null));
    } else {
      // Fin de la sélection
      const start = selectedRange.startDate;
      const end = dateStr;

      // S'assurer que start < end
      if (new Date(start) <= new Date(end)) {
        setSelectedRange({ startDate: start, endDate: end });
        setMarkedDates(generateMarkedDates(start, end));
      } else {
        setSelectedRange({ startDate: end, endDate: start });
        setMarkedDates(generateMarkedDates(end, start));
      }
    }
  };

  // Ajouter une plage de dates
  const addDateRange = () => {
    if (!selectedRange.startDate) {
      showAlert({ title: 'Erreur', message: 'Veuillez sélectionner une plage de dates', type: 'error' });
      return;
    }

    const newRange = {
      startDate: selectedRange.startDate,
      endDate: selectedRange.endDate || selectedRange.startDate,
      startHour: rangeHours.start,
      endHour: rangeHours.end,
    };

    setCalendarDates([...calendarDates, newRange]);
    setSelectedRange({ startDate: null, endDate: null });
    setRangeHours({ start: '08:00', end: '19:00' });
    setShowDatePicker(false);
    setMarkedDates(generateMarkedDates(null, null));
  };

  // Supprimer une plage de dates
  const removeDateRange = (index) => {
    const updated = calendarDates.filter((_, i) => i !== index);
    setCalendarDates(updated);
  };

  // Formater une date pour l'affichage
  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };


  const handleSubmit = async (isPublished) => {
    // Validation
    if (!selectedParkingId) {
      showAlert({ title: 'Erreur', message: 'Veuillez sélectionner un parking', type: 'error' });
      return;
    }

    if (selectedVehicles.length === 0) {
      showAlert({ title: 'Erreur', message: 'Veuillez sélectionner au moins un type de véhicule', type: 'error' });
      return;
    }

    // Vérifier que tous les véhicules ont un nombre de places valide
    const invalidVehicle = selectedVehicles.find(v => !v.numbers || v.numbers <= 0);
    if (invalidVehicle) {
      showAlert({ title: 'Erreur', message: 'Veuillez saisir un nombre de places valide pour tous les véhicules', type: 'error' });
      return;
    }

    if (availabilityType === 'recurring' && !weekdayEnabled && !weekendEnabled) {
      showAlert({ title: 'Erreur', message: 'Veuillez définir au moins une plage horaire', type: 'error' });
      return;
    }

    if (availabilityType === 'calendar' && calendarDates.length === 0) {
      showAlert({ title: 'Erreur', message: 'Veuillez ajouter au moins une plage de dates', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);

      const announcementData = {
        description: description.trim() || 'Disponible à la location',
        parkingId: selectedParkingId,
        published: true, // Toujours publié directement
        vehicles: selectedVehicles,
        availabilitiesDates: availabilityType === 'calendar'
          ? calendarDates.map(range => ({
            startDate: range.startDate,
            endDate: range.endDate,
            startHour: range.startHour,
            endHour: range.endHour,
          }))
          : [],
        availabilitiesFrequence: availabilityType === 'recurring'
          ? buildAvailabilitiesFrequence()
          : [],
      };

      console.log('📤 Envoi données annonce:', announcementData);

      await announcementService.createCompleteAnnouncement(announcementData);

      showAlert({
        title: 'Succès',
        message: 'Annonce publiée avec succès !',
        type: 'success',
        buttons: [
          {
            text: 'OK',
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Liste des parkings' }],
            }),
          },
        ]
      });
    } catch (error) {
      console.error('Erreur création annonce:', error);
      showAlert({ title: 'Erreur', message: 'Impossible de créer l\'annonce. Vérifiez vos données.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6BBF47" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const selectedParking = myParkings.find(p => p.Id_Parking === selectedParkingId);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle Annonce</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* Sélection du parking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parking</Text>
          {myParkings.length === 0 ? (
            <View style={styles.emptyParkings}>
              <Ionicons name="car-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Aucun parking disponible</Text>
              <Text style={styles.emptySubtext}>Créez d'abord un parking avant de publier une annonce</Text>
            </View>
          ) : (
            <View style={styles.parkingList}>
              {myParkings.map(parking => (
                <TouchableOpacity
                  key={parking.Id_Parking}
                  onPress={() => setSelectedParkingId(parking.Id_Parking)}
                  style={[
                    styles.parkingOption,
                    selectedParkingId === parking.Id_Parking && styles.parkingOptionSelected
                  ]}
                >
                  <Ionicons
                    name={selectedParkingId === parking.Id_Parking ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={selectedParkingId === parking.Id_Parking ? '#6BBF47' : '#9ca3af'}
                  />
                  <Text style={[
                    styles.parkingOptionText,
                    selectedParkingId === parking.Id_Parking && styles.parkingOptionTextSelected
                  ]}>
                    {parking.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionSubtitle}>Décrivez votre place (accès, sécurité, etc.)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Parking sécurisé, accès facile, proche du métro..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Véhicules acceptés */}
        {selectedParkingId && parkingVehicles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Véhicules acceptés</Text>
            <Text style={styles.sectionSubtitle}>Sélectionnez les types et le nombre de places</Text>
            <View style={styles.vehiclesGrid}>
              {parkingVehicles.map((pv) => {
                const vehicleId = pv.id_Parking_vehicles || pv.Id_Parking_Vehicles;
                const isSelected = selectedVehicles.find(
                  v => v.parkingVehicleId === vehicleId
                );
                const selectedVehicle = selectedVehicles.find(
                  v => v.parkingVehicleId === vehicleId
                );

                // Mapper l'icône du véhicule
                const getVehicleIcon = (iconName) => {
                  const iconMap = {
                    'car-icon': 'car',
                    'bike-icon': 'bicycle',
                    'motorcycle-icon': 'bicycle',
                    'van-icon': 'bus',
                    'truck-icon': 'car-sport',
                    'scooter-icon': 'bicycle',
                  };
                  return iconMap[iconName] || 'car';
                };

                return (
                  <View key={vehicleId} style={styles.vehicleCard}>
                    <TouchableOpacity
                      onPress={() => toggleVehicle(pv)}
                      style={[
                        styles.vehicleButton,
                        isSelected && styles.vehicleButtonSelected
                      ]}
                    >
                      <Ionicons
                        name={getVehicleIcon(pv.vehicle?.icon)}
                        size={24}
                        color={isSelected ? '#fff' : '#6BBF47'}
                      />
                      <Text style={[
                        styles.vehicleButtonText,
                        isSelected && styles.vehicleButtonTextSelected
                      ]}>
                        {pv.vehicle?.types || 'Véhicule'}
                      </Text>
                    </TouchableOpacity>

                    {isSelected && (
                      <View style={styles.vehicleCountContainer}>
                        <Text style={styles.vehicleCountLabel}>Places :</Text>
                        <TextInput
                          style={styles.vehicleCountInput}
                          keyboardType="numeric"
                          value={selectedVehicle?.numbers ? String(selectedVehicle.numbers) : ''}
                          onChangeText={(text) => updateVehicleCount(vehicleId, text)}
                          placeholder="0"
                        />
                        <Text style={styles.vehicleCountMax}>/ {pv.numbers}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Type de disponibilité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilités</Text>
          <View style={styles.availabilityTypeToggle}>
            <TouchableOpacity
              onPress={() => setAvailabilityType('recurring')}
              style={[
                styles.typeButton,
                availabilityType === 'recurring' && styles.typeButtonActive
              ]}
            >
              <Ionicons
                name="repeat"
                size={20}
                color={availabilityType === 'recurring' ? '#fff' : '#6BBF47'}
              />
              <Text style={[
                styles.typeButtonText,
                availabilityType === 'recurring' && styles.typeButtonTextActive
              ]}>
                Récurrent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAvailabilityType('calendar')}
              style={[
                styles.typeButton,
                availabilityType === 'calendar' && styles.typeButtonActive
              ]}
            >
              <Ionicons
                name="calendar"
                size={20}
                color={availabilityType === 'calendar' ? '#fff' : '#6BBF47'}
              />
              <Text style={[
                styles.typeButtonText,
                availabilityType === 'calendar' && styles.typeButtonTextActive
              ]}>
                Calendrier
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Disponibilités récurrentes */}
        {availabilityType === 'recurring' && (
          <View style={styles.section}>
            {/* Lundi - Vendredi */}
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleLabel}>Lundi - Vendredi</Text>
                <Switch
                  value={weekdayEnabled}
                  onValueChange={setWeekdayEnabled}
                  trackColor={{ false: '#d1d5db', true: '#86efac' }}
                  thumbColor={weekdayEnabled ? '#16a34a' : '#f3f4f6'}
                />
              </View>
              {weekdayEnabled && (
                <View style={styles.hoursContainer}>
                  <TextInput
                    style={styles.hourInput}
                    value={weekdayHours.start}
                    onChangeText={(text) => setWeekdayHours({ ...weekdayHours, start: text })}
                    placeholder="08:00"
                  />
                  <Text style={styles.hourSeparator}>-</Text>
                  <TextInput
                    style={styles.hourInput}
                    value={weekdayHours.end}
                    onChangeText={(text) => setWeekdayHours({ ...weekdayHours, end: text })}
                    placeholder="19:00"
                  />
                </View>
              )}
            </View>

            {/* Week-end */}
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleLabel}>Week-end</Text>
                <Switch
                  value={weekendEnabled}
                  onValueChange={setWeekendEnabled}
                  trackColor={{ false: '#d1d5db', true: '#86efac' }}
                  thumbColor={weekendEnabled ? '#16a34a' : '#f3f4f6'}
                />
              </View>
              {weekendEnabled && (
                <View style={styles.hoursContainer}>
                  <TextInput
                    style={styles.hourInput}
                    value={weekendHours.start}
                    onChangeText={(text) => setWeekendHours({ ...weekendHours, start: text })}
                    placeholder="00:00"
                  />
                  <Text style={styles.hourSeparator}>-</Text>
                  <TextInput
                    style={styles.hourInput}
                    value={weekendHours.end}
                    onChangeText={(text) => setWeekendHours({ ...weekendHours, end: text })}
                    placeholder="23:59"
                  />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Disponibilités par calendrier */}
        {availabilityType === 'calendar' && (
          <View style={styles.section}>
            {/* Liste des plages de dates ajoutées */}
            {calendarDates.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.sectionSubtitle}>Plages de dates sélectionnées</Text>
                {calendarDates.map((range, index) => (
                  <View key={index} style={styles.dateRangeCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dateRangeText}>
                        {formatDateDisplay(range.startDate)} → {formatDateDisplay(range.endDate)}
                      </Text>
                      <Text style={styles.dateRangeHours}>
                        {range.startHour} - {range.endHour}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeDateRange(index)}
                      style={styles.dateRangeRemove}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Bouton pour ajouter une plage */}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.addDateButton}
            >
              <Ionicons name="add-circle-outline" size={24} color="#6BBF47" />
              <Text style={styles.addDateButtonText}>Ajouter une plage de dates</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Espace en bas pour les boutons */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer fixe - Boutons d'action */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => handleSubmit(true)}
          style={[styles.footerButton, styles.publishButton]}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.publishButtonText}>Publier l'annonce</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal Calendrier */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une plage</Text>
              <TouchableOpacity onPress={() => {
                setShowDatePicker(false);
                setSelectedRange({ startDate: null, endDate: null });
                setMarkedDates({});
              }}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <Calendar
              onDayPress={handleDayPress}
              markingType="period"
              markedDates={markedDates}
              minDate={new Date().toISOString().split('T')[0]}
              theme={{
                todayTextColor: '#6BBF47',
                arrowColor: '#6BBF47',
                selectedDayBackgroundColor: '#6BBF47',
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '500',
              }}
            />

            {selectedRange.startDate && (
              <View style={styles.selectedRangeInfo}>
                <Text style={styles.selectedRangeLabel}>Plage sélectionnée :</Text>
                <Text style={styles.selectedRangeValue}>
                  {formatDateDisplay(selectedRange.startDate)}
                  {selectedRange.endDate && selectedRange.endDate !== selectedRange.startDate
                    ? ` → ${formatDateDisplay(selectedRange.endDate)}`
                    : ' (1 jour)'}
                </Text>
              </View>
            )}

            {/* Horaires */}
            <View style={styles.modalHoursSection}>
              <Text style={styles.modalHoursLabel}>Horaires :</Text>
              <View style={styles.hoursContainer}>
                <TextInput
                  style={styles.hourInput}
                  value={rangeHours.start}
                  onChangeText={(text) => setRangeHours({ ...rangeHours, start: text })}
                  placeholder="08:00"
                  keyboardType="numbers-and-punctuation"
                />
                <Text style={styles.hourSeparator}>-</Text>
                <TextInput
                  style={styles.hourInput}
                  value={rangeHours.end}
                  onChangeText={(text) => setRangeHours({ ...rangeHours, end: text })}
                  placeholder="19:00"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {/* Bouton Ajouter */}
            <TouchableOpacity
              onPress={addDateRange}
              style={[styles.footerButton, styles.publishButton, { marginTop: 16 }]}
              disabled={!selectedRange.startDate}
            >
              <Text style={styles.publishButtonText}>Ajouter cette plage</Text>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {AlertComponent}
    </View>
  );
};

export default CreateAnnouncement;
