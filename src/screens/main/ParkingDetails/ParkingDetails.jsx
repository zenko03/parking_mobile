import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, ImageBackground, Dimensions } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { parkingService, imageService, ratingService } from "../../../services";
import Footer from "../../../components/ui/Footer/Footer";
import exempleImage from '../../../assets/image.png';
import SupabaseImage from '../../../components/ui/SupabaseImage';
import { convertImagesToProxy } from '../../../utils/imageUtils';
import { parkingDetailsStyles as styles } from './ParkingDetails.styles';
import { formatHourlyRate, CURRENCY } from '../../../config/constants';

const { width } = Dimensions.get('window');

// Mapping des icônes de véhicules
const getVehicleIcon = (iconName) => {
  const iconMap = {
    'car-icon': 'car',
    'bike-icon': 'bicycle',
    'motorcycle-icon': 'bicycle', // ou 'motorcycle' si disponible
    'van-icon': 'bus',
    'truck-icon': 'car-sport',
    'scooter-icon': 'bicycle',
  };
  return iconMap[iconName] || 'car'; // Icône par défaut
};

export default function ParkingDetails({ route, navigation }) {
  const { parkingId, title: initialTitle, address: initialAddress, price: initialPrice, rating: initialRating, image } = route.params;



  const [parking, setParking] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [averageRating, setAverageRating] = useState(null);

  useEffect(() => {
    loadParkingDetails();
  }, [parkingId]);

  const loadParkingDetails = async () => {
    try {
      setLoading(true);

      if (!parkingId) {
        console.warn(' parkingId est undefined, utilisation des données initiales');
        setParking({
          label: initialTitle,
          description: initialAddress,
          hourlyRate: parseFloat(initialPrice) || 0,
        });
        return;
      }

      const data = await parkingService.getParkingById(parkingId);
      setParking(data);

      // Charger les images du parking
      try {
        const parkingImages = await imageService.getParkingImages(parkingId);
        // Convertir les URLs Supabase en URLs proxy
        const imagesWithProxy = convertImagesToProxy(parkingImages);
        setImages(imagesWithProxy);
      } catch (imgError) {
        console.error('[Images] Load error:', imgError.message);
        // Ne pas bloquer si les images ne peuvent pas être chargées
      }

      // Charger la disponibilité du parking
      try {
        const availabilityData = await parkingService.getParkingAvailability(parkingId);
        setAvailability(availabilityData);
      } catch (availError) {
        console.error('[Availability] Load error:', availError.message);
        // Ne pas bloquer si la disponibilité n'est pas disponible
      }

      // Charger la note moyenne du parking
      try {
        const ratingData = await ratingService.getParkingAverageRating(parkingId);
        setAverageRating(ratingData.average);
      } catch (ratingError) {
        console.error('[Rating] Load error:', ratingError.message);
        // Ne pas bloquer si la note n'est pas disponible
      }
    } catch (error) {
      console.error('[ParkingDetails] Load error:', error.message);
      // Ne pas afficher d'alerte, utiliser les données initiales
      setParking({
        label: initialTitle,
        description: initialAddress,
        hourlyRate: parseFloat(initialPrice) || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveImageIndex(index);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6BBF47" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const title = parking?.label || initialTitle;
  const address = parking?.address || parking?.description || initialAddress;
  const priceValue = parking?.hourlyRate || (initialPrice ? parseFloat(initialPrice.replace(`${CURRENCY.symbol}/h`, '').replace('$/heure', '')) : 0);
  const price = formatHourlyRate(priceValue);
  const rating = averageRating !== null ? Math.round(averageRating) : (initialRating || 0);
  const userName = parking?.user ? `${parking.user.name || ''} ${parking.user.first_name || ''}`.trim() : 'Propriétaire';

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Carrousel d'images */}
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.imageCarousel}
            >
              {images.map((img) => (
                <SupabaseImage
                  key={img.idParkingImage}
                  uri={img.fileUrl}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {/* Indicateurs de pagination */}
            <View style={styles.paginationContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <ImageBackground
            source={exempleImage}
            style={styles.imageHeader}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          </ImageBackground>
        )}

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location" color="#6BBF47" size={18} />
            <Text style={styles.infoText}>{address}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.ownerContainer}>
            <View>
              <Text style={styles.ownerLabel}>Proposé par</Text>
              <Text style={styles.ownerName}>{userName}</Text>
            </View>
          </View>

          <View style={styles.separator} />


          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Note</Text>
            <View style={styles.starsContainer}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name="star"
                  color={i < rating ? "#FFD700" : "#E0E0E0"}
                  size={18}
                />
              ))}
              <Text style={styles.ratingText}>
                {averageRating !== null
                  ? `${averageRating.toFixed(1)} / 5`
                  : 'Pas encore de notes'}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>
            {parking?.description || 'Ce parking est sécurisé et accessible. Vous pouvez réserver rapidement et garantir votre place à l\'avance.'}
          </Text>

          {/* DISPONIBILITÉS HORAIRES */}
          {availability && availability.availabilitySchedule && (
            <View style={styles.scheduleSection}>
              <Text style={styles.scheduleTitle}>Disponibilités</Text>
              <View style={styles.scheduleContent}>
                <Ionicons name="time-outline" size={20} color="#6BBF47" style={styles.scheduleIcon} />
                <Text style={styles.scheduleText}>{availability.availabilitySchedule}</Text>
              </View>
            </View>
          )}

          {/* PLACES DISPONIBLES PAR TYPE DE VÉHICULE */}
          {availability && availability.vehicleAvailabilities && availability.vehicleAvailabilities.length > 0 && (
            <View style={styles.availabilitySection}>
              <Text style={styles.availabilityTitle}>Places disponibles</Text>
              {availability.vehicleAvailabilities
                .filter(va => va.totalCapacity > 0) // Afficher seulement les types acceptés
                .map((vehicleAvail, index) => (
                  <View key={index} style={styles.vehicleAvailRow}>
                    <View style={styles.vehicleInfo}>
                      <Ionicons
                        name={getVehicleIcon(vehicleAvail.vehicleIcon)}
                        size={24}
                        color="#6BBF47"
                        style={styles.vehicleIconStyle}
                      />
                      <Text style={styles.vehicleType}>{vehicleAvail.vehicleType}</Text>
                    </View>
                    <View style={styles.capacityInfo}>
                      <Text style={[
                        styles.capacityText,
                        vehicleAvail.availableCapacity === 0 && styles.capacityTextUnavailable
                      ]}>
                        {vehicleAvail.availableCapacity} / {vehicleAvail.totalCapacity} places
                      </Text>
                      {vehicleAvail.availableCapacity === 0 && (
                        <Text style={styles.unavailableLabel}>Complet</Text>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.price}>{price}</Text>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Réservation", {
                  parkingId,
                  title,
                  price: priceValue.toString(),
                  announcementId: parking?.Id_Announcements || parking?.id_Announcements,
                  mode: 'request' // Toujours en mode demande pour validation propriétaire
                });
              }}
              style={styles.reserveButton}>
              <Text style={styles.reserveButtonText}>Faire une demande</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* FOOTER */}
      <Footer navigation={navigation} activeRoute="Détails du parking" />
    </View>
  );
}
