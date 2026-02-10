import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, ImageBackground, Dimensions } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { parkingService, ownerService, imageService } from "../../../services";
import Footer from "../../../components/ui/Footer/Footer";
import exempleImage from '../../../assets/image.png';
import SupabaseImage from '../../../components/ui/SupabaseImage';
import { convertImagesToProxy } from '../../../utils/imageUtils';
import { myParkingDetailsStyles as styles } from './MyParkingDetails.styles';

const { width } = Dimensions.get('window');

// Mapping des icônes de véhicules
const getVehicleIcon = (iconName) => {
  const iconMap = {
    'car-icon': 'car',
    'bike-icon': 'bicycle',
    'motorcycle-icon': 'bicycle',
    'van-icon': 'bus',
    'truck-icon': 'car-sport',
    'scooter-icon': 'bicycle',
    'car': 'car',
    'bicycle': 'bicycle',
    'bus': 'bus',
    'car-sport': 'car-sport',
  };
  return iconMap[iconName] || 'car';
};

export default function MyParkingDetails({ route, navigation }) {
  const { parkingId } = route.params;



  const [parking, setParking] = useState(null);
  const [parkingVehicles, setParkingVehicles] = useState([]);
  const [images, setImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParkingDetails();
  }, [parkingId]);

  const loadParkingDetails = async () => {
    try {
      setLoading(true);
      const data = await parkingService.getParkingById(parkingId);

      setParking(data);

      // Récupérer les véhicules du parking (appel séparé)
      try {
        const parkingVehicles = await ownerService.getParkingVehicles(parkingId);

        if (parkingVehicles && parkingVehicles.length > 0) {
          setParkingVehicles(parkingVehicles);
        }
      } catch (vehicleError) {
        console.error('[Vehicles] Load error:', vehicleError.message);
        // Ne pas bloquer si les véhicules ne peuvent pas être chargés
      }

      // Charger les images du parking
      try {
        const parkingImages = await imageService.getParkingImages(parkingId);
        // Convertir les URLs Supabase en URLs proxy
        const imagesWithProxy = convertImagesToProxy(parkingImages);
        setImages(imagesWithProxy);
      } catch (imgError) {
        console.error(' Erreur chargement images:', imgError);
        // Ne pas bloquer si les images ne peuvent pas être chargées
      }
    } catch (error) {
      console.error('[ParkingDetails] Load error:', error.message);
      Alert.alert('Erreur', 'Impossible de charger les détails du parking');
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

  if (!parking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Parking introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const title = parking.label || 'Mon Parking';
  const address = parking.address || parking.description || 'Adresse non spécifiée';
  const priceValue = parking.hourlyRate || 0;
  const price = `${priceValue}$/heure`;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
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

          {/* Badge propriétaire */}
          <View style={styles.ownerBadgeContainer}>
            <Ionicons name="shield-checkmark" size={20} color="#6BBF47" />
            <Text style={styles.ownerBadgeText}>Votre parking</Text>
          </View>

          <View style={styles.separator} />

          {/* Prix */}
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Tarif horaire</Text>
            <Text style={styles.priceValue}>{price}</Text>
          </View>

          {/* VÉHICULES ACCEPTÉS */}
          {parkingVehicles.length > 0 ? (
            <View style={styles.availabilitySection}>
              <Text style={styles.availabilityTitle}>Types de véhicules acceptés</Text>
              {parkingVehicles.map((pv, index) => (
                <View key={index} style={styles.vehicleAvailRow}>
                  <View style={styles.vehicleInfo}>
                    <Ionicons
                      name={getVehicleIcon(pv.vehicle?.icon)}
                      size={24}
                      color="#6BBF47"
                      style={styles.vehicleIconStyle}
                    />
                    <Text style={styles.vehicleType}>{pv.vehicle?.types || 'Véhicule'}</Text>
                  </View>
                  <View style={styles.capacityInfo}>
                    <Text style={styles.capacityText}>
                      {pv.numbers} {pv.numbers > 1 ? 'places' : 'place'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="car-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Aucun type de véhicule configuré</Text>
            </View>
          )}

          {/* Informations supplémentaires */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color="#6BBF47" />
              <Text style={styles.infoCardText}>
                Pour rendre ce parking disponible à la location, créez une annonce avec les dates et horaires souhaités.
              </Text>
            </View>
          </View>

          {/* Footer avec bouton Publier une annonce */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('CreateAnnouncement', { parkingId: parkingId });
              }}
              style={styles.announceButton}
            >
              <Ionicons name="megaphone" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.announceButtonText}>Publier une annonce</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* FOOTER */}
      <Footer navigation={navigation} activeRoute="Mes Parkings" />
    </View>
  );
}
