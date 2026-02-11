import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from "react-native";
import DatePicker from "../../../components/ui/AppDatePicker/AppDatePicker";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reservationService, vehicleService, parkingService, authService, reservationRequestService } from "../../../services";
import Header from "../../../components/ui/Header/Header";
import { useAlert } from "../../../hooks/useAlert";

export default function ReservationScreen({ route, navigation }) {
  const { parkingId, title, price, announcementId, mode = 'reservation' } = route.params;
  // mode: 'reservation' (paiement immédiat) ou 'request' (demande sans paiement)

  const { AlertComponent, showAlert } = useAlert();
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [availabilities, setAvailabilities] = useState({});
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600000)); // +1 heure
  const [openPicker, setOpenPicker] = useState(false);
  const [pickerType, setPickerType] = useState('start');
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  // Charger les types de véhicules disponibles
  useEffect(() => {
    loadVehicleTypes();
  }, []);

  // Charger les disponibilités quand les dates changent
  useEffect(() => {
    if (parkingId) {
      loadParkingAvailability();
    }
  }, [startDate, endDate, parkingId]);

  // Recalculer le prix quand les dates ou véhicules changent
  useEffect(() => {
    if (selectedTypes.length > 0 && parkingId) {
      calculatePrice();
    }
  }, [startDate, endDate, selectedTypes]);

  const loadVehicleTypes = async () => {
    try {
      const vehicles = await vehicleService.getAllVehicles();
      setVehicleTypes(vehicles);
    } catch (error) {
      console.error('[Vehicles] Load error:', error.message);
      // Utiliser les types par défaut si l'API échoue
      setVehicleTypes([
        { Id_Vehicles: 1, types: "Voiture", icon: "car-sport" },
        { Id_Vehicles: 2, types: "Moto", icon: "bicycle" },
        { Id_Vehicles: 3, types: "Utilitaire", icon: "bus" },
        { Id_Vehicles: 4, types: "Camion", icon: "trail-sign" }
      ]);
    }
  };

  const loadParkingAvailability = async () => {
    try {
      setLoadingAvailability(true);
      const startDateTime = startDate.toISOString();
      const endDateTime = endDate.toISOString();

      const data = await parkingService.getParkingAvailability(parkingId, startDateTime, endDateTime);

      const availabilityMap = {};
      availabilityMap.schedule = data.availabilitySchedule;
      data.vehicleAvailabilities.forEach(vehicle => {
        availabilityMap[vehicle.vehicleTypeId] = vehicle;
      });

      setAvailabilities(availabilityMap);
    } catch (error) {
      console.error('[Availability] Load error:', error.message);
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Formatter la date pour le backend (en UTC - format ISO 8601)
  const formatDateForBackend = (date) => {
    return date.toISOString();
  };

  // Formatter la date pour l'affichage (format 24h)
  // Formatter la date pour l'affichage (format 24h)
  const formatDateForDisplay = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  };

  // Vérifier si les horaires de réservation sont dans les plages d'ouverture
  const validateReservationHours = () => {
    // Si on a les horaires de disponibilité
    if (availabilities.schedule) {
      const schedule = availabilities.schedule;

      // Extraire les horaires d'ouverture (format: "Du lundi au vendredi à 08:00-18:00")
      const timeMatch = schedule.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);

      if (timeMatch) {
        const [_, openTime, closeTime] = timeMatch;
        const [openHour, openMin] = openTime.split(':').map(Number);
        const [closeHour, closeMin] = closeTime.split(':').map(Number);

        const startHour = startDate.getHours();
        const startMin = startDate.getMinutes();
        const endHour = endDate.getHours();
        const endMin = endDate.getMinutes();

        const startTimeInMinutes = startHour * 60 + startMin;
        const endTimeInMinutes = endHour * 60 + endMin;
        const openTimeInMinutes = openHour * 60 + openMin;
        const closeTimeInMinutes = closeHour * 60 + closeMin;

        if (startTimeInMinutes < openTimeInMinutes || endTimeInMinutes > closeTimeInMinutes) {
          return {
            valid: false,
            message: `Le parking est ouvert ${schedule}. Veuillez choisir des horaires dans cette plage.`
          };
        }
      }
    }

    return { valid: true };
  };

  const calculatePrice = async () => {
    try {
      setLoadingPrice(true);

      // Vérifier le token avant l'appel
      const token = await AsyncStorage.getItem('jwt_token');

      if (!token) {
        showAlert({
          title: 'Erreur',
          message: 'Vous devez être connecté pour calculer le prix',
          type: 'error'
        });
        navigation.navigate('Login');
        return;
      }

      // Formater les véhicules sélectionnés selon le format attendu par le backend
      const selectedVehicles = selectedTypes.map(vehicleId => ({
        vehicleTypeId: vehicleId,
        quantity: 1
      }));

      const formattedStartDate = formatDateForBackend(startDate);
      const formattedEndDate = formatDateForBackend(endDate);

      const priceData = await reservationService.calculatePrice({
        parkingId: parkingId,
        startDateTime: formattedStartDate,
        endDateTime: formattedEndDate,
        selectedVehicles: selectedVehicles
      });

      setCalculatedPrice(priceData.totalPrice || priceData);
    } catch (error) {
      console.error('[Price] Calculation error:', error.message);
      // Calculer un prix estimé en cas d'erreur
      const hours = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
      const hourlyRate = parseFloat(price) || 2.5;
      setCalculatedPrice(hours * hourlyRate * selectedTypes.length);
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleConfirmReservation = async () => {
    // Validation
    if (selectedTypes.length === 0) {
      showAlert({
        title: 'Erreur',
        message: 'Veuillez sélectionner au moins un type de véhicule',
        type: 'error'
      });
      return;
    }

    if (startDate >= endDate) {
      showAlert({
        title: 'Erreur',
        message: 'La date de fin doit être après la date de début',
        type: 'error'
      });
      return;
    }

    // Vérifier les horaires de disponibilité
    const hoursValidation = validateReservationHours();
    if (!hoursValidation.valid) {
      showAlert({
        title: 'Horaires non valides',
        message: hoursValidation.message,
        type: 'error'
      });
      return;
    }

    // En mode 'request', pas besoin de paiement
    if (mode === 'reservation' && (!cardNumber || !expiryDate || !cvv)) {
      showAlert({
        title: 'Erreur',
        message: 'Veuillez remplir tous les champs de paiement',
        type: 'error'
      });
      return;
    }

    try {
      setLoading(true);

      // Vérifier la disponibilité une dernière fois avant de réserver
      await loadParkingAvailability();

      // Re-vérifier les horaires après rechargement
      const hoursCheck = validateReservationHours();
      if (!hoursCheck.valid) {
        showAlert({
          title: 'Horaires non valides',
          message: hoursCheck.message,
          type: 'error'
        });
        setLoading(false);
        return;
      }

      // Vérifier que tous les véhicules sélectionnés sont toujours disponibles
      for (const vehicleId of selectedTypes) {
        const availability = availabilities[vehicleId];
        if (!availability || !availability.isAvailable || availability.availableCapacity < 1) {
          showAlert({
            title: 'Plus disponible',
            message: `Le véhicule n'est plus disponible pour cette période. Veuillez en sélectionner un autre.`,
            type: 'error',
            buttons: [
              { text: 'OK', onPress: () => setLoading(false) }
            ]
          });
          return;
        }
      }

      // Récupérer l'utilisateur connecté
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user || !user.Id_Users) {
        showAlert({
          title: 'Erreur',
          message: 'Utilisateur non connecté',
          type: 'error'
        });
        navigation.navigate('Login');
        return;
      }

      // Créer la réservation OU la demande selon le mode
      const selectedVehicles = selectedTypes.map(vehicleId => ({
        vehicleTypeId: vehicleId,
        quantity: 1
      }));

      const formattedStartDate = formatDateForBackend(startDate);

      const formattedEndDate = formatDateForBackend(endDate);

      if (mode === 'request') {
        const requestData = {
          requesterId: user.Id_Users,
          announcementId: announcementId || parkingId,
          startDateTime: formattedStartDate,
          endDateTime: formattedEndDate,
          selectedVehicles: selectedVehicles,
          totalGain: calculatedPrice
        };


        const reservationRequest = await reservationRequestService.createReservationRequest(requestData);

        showAlert({
          title: 'Demande envoyée !',
          message: 'Votre demande a été envoyée au propriétaire. Vous serez notifié de sa réponse.',
          type: 'success',
          buttons: [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Mes Demandes')
            }
          ]
        });
      } else {
        // MODE RÉSERVATION DIRECTE - Avec paiement immédiat
        const reservationData = {
          userId: user.Id_Users,
          parkingId: parkingId,
          startDateTime: formattedStartDate,
          endDateTime: formattedEndDate,
          selectedVehicles: selectedVehicles,
          paymentMethod: 'CARTE_BANCAIRE',
          totalPrice: calculatedPrice
        };

        const reservation = await reservationService.createReservation(reservationData);

        showAlert({
          title: 'Succès',
          message: 'Réservation confirmée !',
          type: 'success',
          buttons: [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Confirmation de la réservation', {
                reservation: reservation,
                parkingTitle: title,
                totalPrice: calculatedPrice,
                startDate: formattedStartDate,
                endDate: formattedEndDate
              })
            }
          ]
        });
      }

    } catch (error) {
      console.error('[Reservation] Save error:', error.message);
      showAlert({
        title: 'Erreur',
        message: error.message || 'Impossible de créer la réservation',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggle = (vehicleId) => {
    // Vérifier la disponibilité avant de sélectionner
    const availability = availabilities[vehicleId];

    if (availability && !availability.isAvailable) {
      showAlert({
        title: 'Non disponible',
        message: `${availability.vehicleType} n'est pas disponible pour ce parking ou cette période.`,
        type: 'error'
      });
      return;
    }

    setSelectedTypes(prev =>
      prev.includes(vehicleId) ? prev.filter(t => t !== vehicleId) : [...prev, vehicleId]
    );
  };

  const openDateTimePicker = (type) => {
    setPickerType(type);
    setOpenPicker(true);
  };

  const handleDateConfirm = (date) => {
    if (pickerType === 'start') {
      // Vérifier que la date de début n'est pas dans le passé
      if (date < new Date()) {
        showAlert({
          title: 'Date invalide',
          message: 'La date de début ne peut pas être dans le passé',
          type: 'error'
        });
        return;
      }
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    setOpenPicker(false);
  };

  const vehicles = vehicleTypes.length > 0 ? vehicleTypes : [
    { Id_Vehicle: 1, type: "Moto", icon: "bicycle" },
    { Id_Vehicle: 2, type: "Voiture", icon: "car-sport" },
    { Id_Vehicle: 3, type: "Bus", icon: "bus" },
    { Id_Vehicle: 4, type: "Camion", icon: "trail-sign" }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: 10 }}>
      {/* HEADER */}
      <View style={{ paddingHorizontal: 20 }}>
        <Header navigation={navigation} />
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Modal Menu */}
        <Modal
          visible={showMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          >
            <View style={{
              position: 'absolute',
              top: 100,
              left: 20,
              backgroundColor: 'white',
              borderRadius: 10,
              padding: 10,
              width: 250,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                onPress={async () => {
                  setShowMenu(false);
                  const token = await AsyncStorage.getItem('jwt_token');
                  const userJson = await AsyncStorage.getItem('user');
                  const user = userJson ? JSON.parse(userJson) : null;
                  showAlert({
                    title: 'Connexion',
                    message: `Token: ${token ? 'Present' : 'Aucun'}\nUtilisateur ID: ${user?.Id_Users || 'N/A'}`,
                    type: 'default'
                  });
                }}
              >
                <Ionicons name="information-circle-outline" size={22} color="#666" />
                <Text style={{ marginLeft: 10, fontSize: 16 }}>Infos connexion</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15 }}
                onPress={async () => {
                  try {
                    setShowMenu(false);
                    await authService.logout();
                    showAlert({
                      title: 'Déconnecté',
                      message: 'Vous avez été déconnecté avec succès',
                      type: 'success',
                      buttons: [
                        {
                          text: 'OK', 
                          onPress: () => navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                          })
                        }
                      ]
                    });
                  } catch (error) {
                    console.error('[Auth] Logout error:', error.message);
                    await AsyncStorage.clear();
                    navigation.navigate('Login');
                  }
                }}
              >
                <Ionicons name="log-out-outline" size={22} color="#ff4444" />
                <Text style={{ marginLeft: 10, fontSize: 16, color: '#ff4444' }}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 18 }}>
          {mode === 'request' ? 'Demande de réservation' : 'Réservation'} - {title}
        </Text>

        {mode === 'request' && (
          <View style={{
            backgroundColor: '#E3F2FD',
            padding: 12,
            borderRadius: 8,
            marginBottom: 15,
            borderLeftWidth: 4,
            borderLeftColor: '#2196F3'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="information-circle" size={20} color="#2196F3" />
              <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#1976D2' }}>
                Mode demande
              </Text>
            </View>
            <Text style={{ marginTop: 5, fontSize: 13, color: '#555' }}>
              Votre demande sera envoyée au propriétaire. Le paiement sera demandé après son acceptation.
            </Text>
          </View>
        )}

        {/* DATES */}
        <Text style={{ fontWeight: "600" }}>Date et heure de début</Text>
        <TouchableOpacity
          onPress={() => openDateTimePicker('start')}
          style={input}
        >
          <Text style={{ color: '#333' }}>{formatDateForDisplay(startDate)}</Text>
        </TouchableOpacity>

        <Text style={{ fontWeight: "600", marginTop: 14 }}>Date et heure de fin</Text>
        <TouchableOpacity
          onPress={() => openDateTimePicker('end')}
          style={input}
        >
          <Text style={{ color: '#333' }}>{formatDateForDisplay(endDate)}</Text>
        </TouchableOpacity>

        {/* HORAIRES D'OUVERTURE */}
        {availabilities.schedule && (
          <View style={{
            backgroundColor: '#F0F8FF',
            padding: 12,
            borderRadius: 8,
            marginTop: 15,
            borderLeftWidth: 4,
            borderLeftColor: '#6BBF47'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={20} color="#6BBF47" />
              <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#333' }}>
                Horaires d'ouverture
              </Text>
            </View>
            <Text style={{ marginTop: 5, fontSize: 13, color: '#555' }}>
              {availabilities.schedule}
            </Text>
          </View>
        )}

        {/* VEHICLE SELECTION */}
        <Text style={{ fontWeight: "600", marginTop: 20, marginBottom: 5 }}>
          Places disponibles {loadingAvailability && <ActivityIndicator size="small" color="#A4E66E" />}
        </Text>
        <Text style={{ fontSize: 12, color: "#666", marginBottom: 10, fontStyle: "italic" }}>
          Disponibilités pour la période sélectionnée
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {vehicles.map((v, index) => {
            const vehicleId = v.Id_Vehicles || v.Id_Vehicle || index;
            const availability = availabilities[vehicleId];
            const isAvailable = availability ? availability.isAvailable : true;
            const availableCapacity = availability ? availability.availableCapacity : 0;

            // Mapper les icônes du backend vers les icônes Ionicons
            const iconMap = {
              'car-icon': 'car-sport',
              'suv-icon': 'car-sport',
              'motorcycle-icon': 'bicycle',
              'ebike-icon': 'bicycle',
              'van-icon': 'bus',
              'truck-icon': 'car',
              'city-car-icon': 'car-outline',
              'scooter-icon': 'bicycle-outline'
            };

            const iconName = iconMap[v.icon] || v.icon || "car";

            return (
              <TouchableOpacity
                key={`vehicle-${vehicleId}-${index}`}
                onPress={() => toggle(vehicleId)}
                disabled={!isAvailable || loadingAvailability}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 10,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: !isAvailable
                    ? "#E0E0E0"
                    : selectedTypes.includes(vehicleId)
                      ? "#A4E66E"
                      : "#FFD6D6",
                  opacity: !isAvailable ? 0.5 : 1,
                  borderWidth: 2,
                  borderColor: !isAvailable ? "#999" : selectedTypes.includes(vehicleId) ? "#7AC142" : "#FFB6B6"
                }}
              >
                <Ionicons
                  name={iconName}
                  size={28}
                  color={!isAvailable ? "#666" : selectedTypes.includes(vehicleId) ? "#2C5F2D" : "#8B0000"}
                />
                <Text style={{
                  fontSize: 10,
                  marginTop: 4,
                  fontWeight: '600',
                  color: !isAvailable ? "#666" : "#333"
                }}>
                  {v.types || v.type}
                </Text>
                {availability && (
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: !isAvailable ? "#666" : isAvailable ? "#2C5F2D" : "#555"
                  }}>
                    {isAvailable ? `${availableCapacity} dispo` : 'Complet'}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedTypes.length > 0 && (
          <Text style={{ marginTop: 10, color: '#666' }}>
            {selectedTypes.length} véhicule(s) sélectionné(s)
          </Text>
        )}

        {/* PAYMENT - Seulement en mode 'reservation' */}
        {mode === 'reservation' && (
          <>
            <Text style={{ fontWeight: "600", marginTop: 25 }}>Mode de paiement</Text>

            <TextInput
              placeholder="Numéro de carte bancaire (16 chiffres)"
              placeholderTextColor="#999"
              style={input}
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="numeric"
              maxLength={19}
            />
            <TextInput
              placeholder="Date d'expiration (MM/AA)"
              placeholderTextColor="#999"
              style={input}
              value={expiryDate}
              onChangeText={setExpiryDate}
              keyboardType="numeric"
              maxLength={5}
            />
            <TextInput
              placeholder="Code de sécurité CVV (3 chiffres)"
              placeholderTextColor="#999"
              style={input}
              value={cvv}
              onChangeText={setCvv}
              keyboardType="numeric"
              maxLength={3}
              secureTextEntry
            />
          </>
        )}

        {/* PRICE DISPLAY */}
        <Text style={{ textAlign: "center", fontSize: 18, marginTop: 18 }}>Total du montant</Text>
        {loadingPrice ? (
          <ActivityIndicator size="small" color="#A019FF" style={{ marginVertical: 10 }} />
        ) : (
          <Text style={{ textAlign: "center", fontSize: 28, fontWeight: "800", color: "#A019FF" }}>
            {calculatedPrice ? `${calculatedPrice.toFixed(2)}$` : price}
          </Text>
        )}

        {/* CONFIRM BUTTON */}
        <TouchableOpacity
          style={{
            backgroundColor: loading ? "#DCDCDC" : mode === 'request' ? "#2196F3" : "#A4E66E",
            paddingVertical: 14,
            borderRadius: 10,
            marginTop: 25,
            marginBottom: 60,
            alignItems: "center"
          }}
          onPress={handleConfirmReservation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ fontWeight: "600", color: mode === 'request' ? "#fff" : "#444" }}>
              {mode === 'request' ? 'Envoyer la demande' : 'Confirmer la réservation'}
            </Text>
          )}
        </TouchableOpacity>

        {/* DATE PICKER MODAL */}
        <DatePicker
          modal
          open={openPicker}
          date={pickerType === 'start' ? startDate : endDate}
          mode="datetime"
          onConfirm={handleDateConfirm}
          onCancel={() => setOpenPicker(false)}
          minimumDate={pickerType === 'start' ? new Date() : startDate}
          locale="fr"
          title={pickerType === 'start' ? 'Sélectionner la date de début' : 'Sélectionner la date de fin'}
          timeZoneOffsetInMinutes={new Date().getTimezoneOffset() * -1}
        />

        {/* ALERT DIALOG */}
        {AlertComponent}
      </ScrollView>
    </View>
  );
}

const input = {
  borderWidth: 1,
  borderRadius: 10,
  padding: 12,
  marginTop: 6
};
