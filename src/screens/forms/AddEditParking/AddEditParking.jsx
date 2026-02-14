import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  PermissionsAndroid,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Conditional import for Geolocation (native only)
let Geolocation = null;
if (Platform.OS !== 'web') {
  Geolocation = require('@react-native-community/geolocation');
}
import ownerService from '../../../services/ownerService';
import vehicleService from '../../../services/vehicleService';
import imageService from '../../../services/imageService';
import ParkingMapPicker from '../../../components/maps/ParkingMapPicker/ParkingMapPicker';
import SupabaseImage from '../../../components/ui/SupabaseImage';
import { convertImagesToProxy } from '../../../utils/imageUtils';
import { useAlert } from '../../../hooks/useAlert';
import { addEditParkingStyles as styles } from './AddEditParking.styles';

const AddEditParking = ({ navigation, route }) => {
  const { AlertComponent, showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const parkingId = route?.params?.parkingId;
  const isEditMode = !!parkingId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);

  // Form fields
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState([]); // Array of { vehicleId, count }
  const [availableVehicles, setAvailableVehicles] = useState([]);

  // Photos state
  const [existingPhotos, setExistingPhotos] = useState([]); // Photos déjà en DB
  const [selectedPhotos, setSelectedPhotos] = useState([]); // Nouvelles photos à uploader
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Localisation states
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    loadUserData();
    loadVehicles();
    if (isEditMode) {
      loadParkingData();
    }
  }, []);

  const loadUserData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserId(user.Id_Users);
      }
    } catch (error) {
      console.error('[User] Load error:', error.message);
    }
  };

  const loadVehicles = async () => {
    try {
      const vehicles = await vehicleService.getAllVehicles();
      setAvailableVehicles(vehicles);
    } catch (error) {
      console.error('[Vehicles] Load error:', error.message);
    }
  };

  const loadParkingData = async () => {
    try {
      setLoading(true);
      const parking = await ownerService.getParkingById(parkingId);

      setLabel(parking.label || '');
      setHourlyRate(parking.hourlyRate?.toString() || '');
      setAddress(parking.address || '');
      setDescription(parking.description || '');

      try {
        const parkingVehicles = await ownerService.getParkingVehicles(parkingId);
        const vehiclesData = parkingVehicles.map((pv) => ({
          vehicleId: pv.vehicle?.id_Vehicles || pv.vehicle?.Id_Vehicles || 0,
          count: pv.numbers || 1,
        }));
        setSelectedVehicles(vehiclesData);
      } catch (error) {
        console.error('[Parking] Erreur chargement vehicules:', error);
      }

      try {
        const images = await imageService.getParkingImages(parkingId);
        const imagesWithProxy = convertImagesToProxy(images);
        setExistingPhotos(imagesWithProxy);
      } catch (error) {
        console.error('[Parking] Photos load error:', error.message);
      }
    } catch (error) {
      showAlert({ title: 'Erreur', message: 'Impossible de charger les données du parking', type: 'error' });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };



  const toggleVehicle = (vehicleId) => {
    setSelectedVehicles((prev) => {
      const exists = prev.find((v) => v.vehicleId === vehicleId);
      if (exists) {
        // Retirer
        return prev.filter((v) => v.vehicleId !== vehicleId);
      } else {
        // Ajouter avec champ vide
        return [...prev, { vehicleId, count: '' }];
      }
    });
  };

  const updateVehicleCount = (vehicleId, count) => {
    const parsed = parseInt(count);
    setSelectedVehicles((prev) =>
      prev.map((v) => (v.vehicleId === vehicleId ? { ...v, count: count === '' ? '' : (parsed || 0) } : v))
    );
  };

  // Fonction pour demander la permission de localisation (Android)
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permission de localisation',
            message: 'UPark a besoin d\'accéder à votre position pour localiser le parking',
            buttonNeutral: 'Demander plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS gère automatiquement via Info.plist
  };

  // Fonction pour obtenir la position GPS actuelle
  const getCurrentLocation = async () => {
    setLoadingLocation(true);

    // Sur Web, utiliser l'API navigator.geolocation
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        setLoadingLocation(false);
        showAlert('Erreur', 'La geolocalisation n\'est pas supportee par ce navigateur.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLoadingLocation(false);
          showAlert({ title: 'Succès', message: 'Position GPS obtenue !', type: 'success' });
        },
        (error) => {
          setLoadingLocation(false);
          console.error('[GPS] Web Error:', error.message);
          showAlert({
            title: 'Erreur GPS',
            message: 'Impossible d\'obtenir votre position. Vérifiez les permissions.',
            type: 'error'
          });
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
      return;
    }

    // Sur mobile, utiliser react-native-community/geolocation
    if (!Geolocation) {
      setLoadingLocation(false);
      showAlert({ title: 'Erreur', message: 'Geolocalisation non disponible', type: 'error' });
      return;
    }

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setLoadingLocation(false);
      showAlert({ title: 'Permission refusée', message: 'Impossible d\'accéder à votre position.', type: 'error' });
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLoadingLocation(false);
        showAlert({ title: 'Succès', message: 'Position GPS obtenue !', type: 'success' });
      },
      (error) => {
        setLoadingLocation(false);
        console.error('[GPS] Mobile Error:', error);
        showAlert({ title: 'Erreur GPS', message: 'Impossible d\'obtenir votre position.', type: 'error' });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Callback quand l'utilisateur change la position sur la carte
  const handleMapLocationChange = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  // Confirmer la sélection de la carte
  const confirmMapLocation = () => {
    if (latitude && longitude) {
      setShowMapModal(false);
      showAlert({ title: 'Position confirmée', message: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`, type: 'success' });
    } else {
      showAlert({ title: 'Attention', message: 'Veuillez sélectionner une position sur la carte', type: 'warning' });
    }
  };

  // Gestion des photos
  const handleAddPhotos = async (source = 'gallery') => {
    const totalPhotos = existingPhotos.length + selectedPhotos.length;
    if (totalPhotos >= 5) {
      showAlert({ title: 'Limite atteinte', message: 'Maximum 5 photos au total', type: 'warning' });
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
        const totalPhotos = existingPhotos.length + selectedPhotos.length;
        const remainingSlots = 5 - totalPhotos;
        const newPhotos = result.images.slice(0, remainingSlots).map(img => ({
          uri: img.uri,
          fileName: img.fileName,
          fileSize: img.fileSize,
          type: img.type,
        }));

        setSelectedPhotos([...selectedPhotos, ...newPhotos]);
      }
    } catch (error) {
      console.error('Erreur selection photo:', error);
      showAlert({ title: 'Erreur', message: 'Impossible de selectionner la photo', type: 'error' });
    }
  };

  const handleRemovePhoto = (index) => {
    const message = 'Etes-vous sur de vouloir supprimer cette photo ?';
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        const newPhotos = [...selectedPhotos];
        newPhotos.splice(index, 1);
        setSelectedPhotos(newPhotos);
      }
    } else {
      showAlert({
        title: 'Supprimer la photo',
        message,
        type: 'warning',
        buttons: [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              const newPhotos = [...selectedPhotos];
              newPhotos.splice(index, 1);
              setSelectedPhotos(newPhotos);
            },
          },
        ]
      });
    }
  };

  const handleDeleteExistingPhoto = async (photo) => {
    const message = 'Voulez-vous vraiment supprimer cette photo ?';
    
    const deleteAction = async () => {
      try {
        await imageService.deleteParkingImage(parkingId, photo.filePath);
        setExistingPhotos(prev => prev.filter(p => p.idParkingImage !== photo.idParkingImage));
        showAlert({ title: 'Succès', message: 'Photo supprimée', type: 'success' });
      } catch (error) {
        console.error('[Photo] Delete error:', error.message);
        showAlert({ title: 'Erreur', message: 'Impossible de supprimer la photo', type: 'error' });
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) deleteAction();
    } else {
      showAlert({
        title: 'Supprimer la photo',
        message,
        type: 'warning',
        buttons: [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: deleteAction },
        ]
      });
    }
  };

  const uploadPhotos = async (parkingIdToUse) => {
    try {
      setUploadingPhotos(true);
      const hasPrimaryPhoto = existingPhotos.some(p => p.isPrimary);

      for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        const isPrimary = !hasPrimaryPhoto && i === 0;
        await imageService.uploadParkingImage(photo, parkingIdToUse, userId, isPrimary);
      }
    } catch (error) {
      console.error('[Upload] Photo upload error:', error.message);
      showAlert({ title: 'Attention', message: 'Certaines photos n\'ont pas pu être uploadées.', type: 'warning' });
    } finally {
      setUploadingPhotos(false);
    }
  };


  const validateForm = () => {
    if (!label.trim()) {
      showAlert({ title: 'Erreur', message: 'Veuillez saisir un nom pour le parking', type: 'error' });
      return false;
    }
    if (!address.trim()) {
      showAlert({ title: 'Erreur', message: 'Veuillez saisir une adresse', type: 'error' });
      return false;
    }
    if (!hourlyRate || parseFloat(hourlyRate) <= 0) {
      showAlert({ title: 'Erreur', message: 'Veuillez saisir un tarif horaire valide', type: 'error' });
      return false;
    }
    if (!latitude || !longitude) {
      showAlert({ title: 'Erreur', message: 'Veuillez définir la localisation du parking', type: 'error' });
      return false;
    }
    if (selectedVehicles.length === 0) {
      showAlert({ title: 'Erreur', message: 'Veuillez sélectionner au moins un type de véhicule', type: 'error' });
      return false;
    }
    const invalidVehicle = selectedVehicles.find(v => !v.count || v.count <= 0);
    if (invalidVehicle) {
      showAlert({ title: 'Erreur', message: 'Veuillez saisir un nombre de places valide pour tous les véhicules', type: 'error' });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!userId) {
      showAlert({ title: 'Erreur', message: 'Utilisateur non identifié', type: 'error' });
      return;
    }

    try {
      setSaving(true);

      const locationString = `SRID=4326;POINT(${longitude} ${latitude})`;
      const vehicles = selectedVehicles.map((v) => ({
        vehicleId: v.vehicleId,
        count: v.count || 1,
      }));

      const parkingData = {
        label: label.trim(),
        address: address.trim(),
        description: description.trim(),
        hourlyRate: parseFloat(hourlyRate),
        localisation: locationString,
        isActive: true,
        vehicles: vehicles,
      };

      let savedParking;
      if (isEditMode) {
        savedParking = await ownerService.updateParking(parkingId, parkingData);
        if (selectedPhotos.length > 0) {
          await uploadPhotos(parkingId);
        }
        showAlert({ title: 'Succès', message: 'Parking modifié avec succès', type: 'success' });
      } else {
        parkingData.userId = userId;
        savedParking = await ownerService.createParking(parkingData);
        if (selectedPhotos.length > 0) {
          const id = savedParking?.Id_Parking || savedParking?.id_parking || savedParking?.idParking;
          if (id) {
            await uploadPhotos(id);
          } else {
            console.error('[Parking] ID missing');
            showAlert({ title: 'Attention', message: 'Les photos n\'ont pas pu être uploadées', type: 'warning' });
          }
        }
        showAlert({ title: 'Succès', message: 'Parking créé avec succès', type: 'success' });
      }

      navigation.goBack();
    } catch (error) {
      console.error('[Parking] Save error:', error.message);
      showAlert({ title: 'Erreur', message: 'Impossible de sauvegarder le parking', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getVehicleIcon = (vehicleIconOrType) => {
    // Si l'icône est déjà fournie par le backend, la mapper vers Ionicons
    const iconMap = {
      'car-icon': 'car-sport',
      'car-sport': 'car-sport',
      'car': 'car',
      'car-outline': 'car-outline',
      'city-car-icon': 'car-outline',
      'motorcycle-icon': 'bicycle',
      'bicycle': 'bicycle',
      'bicycle-outline': 'bicycle-outline',
      'scooter-icon': 'bicycle-outline',
      'van-icon': 'bus',
      'bus': 'bus',
      'bus-outline': 'bus-outline',
      'truck-icon': 'car',
      'trail-sign': 'trail-sign',
      'airplane': 'airplane',
      'boat': 'boat',
    };

    // Vérifier si c'est une icône connue
    if (iconMap[vehicleIconOrType]) {
      return iconMap[vehicleIconOrType];
    }

    // Sinon, utiliser le fallback basé sur le nom du type
    const name = (vehicleIconOrType || '').toLowerCase();
    if (name.includes('moto') || name.includes('scooter') || name.includes('vélo')) {
      return 'bicycle';
    }
    if (name.includes('voiture') || name.includes('citadine') || name.includes('car')) {
      return 'car-sport';
    }
    if (name.includes('bus') || name.includes('van') || name.includes('utilitaire')) {
      return 'bus';
    }
    if (name.includes('camion') || name.includes('truck')) {
      return 'trail-sign';
    }

    // Défaut
    return 'car';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#13ec13" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.pageTitle}>
          {isEditMode ? 'Modifier le Parking' : 'Nouvelle Annonce'}
        </Text>

        {/* Photos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.photoCount}>{existingPhotos.length + selectedPhotos.length}/5</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            {/* Photos existantes (depuis DB) */}
            {existingPhotos.map((photo) => (
              <View key={`existing-${photo.idParkingImage}`} style={styles.photoContainer}>
                <SupabaseImage uri={photo.fileUrl} style={styles.photoPreview} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.photoRemoveButton}
                  onPress={() => handleDeleteExistingPhoto(photo)}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
                {photo.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Principal</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Nouvelles photos (pas encore uploadées) */}
            {selectedPhotos.map((photo, index) => (
              <View key={`new-${index}`} style={styles.photoContainer}>
                <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.photoRemoveButton}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
                {!existingPhotos.some(p => p.isPrimary) && index === 0 && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Principal</Text>
                  </View>
                )}
              </View>
            ))}

            {existingPhotos.length + selectedPhotos.length < 5 && (
              Platform.OS === 'web' ? (
                // Sur web: deux boutons separes (fix iOS Safari)
                <>
                  <TouchableOpacity 
                    style={[styles.addPhotoButton, { marginRight: 8 }]} 
                    onPress={() => handleAddPhotos('gallery')}
                  >
                    <View style={styles.addPhotoIcon}>
                      <Ionicons name="images" size={24} color="#16a34a" />
                    </View>
                    <Text style={styles.addPhotoText}>Galerie</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.addPhotoButton} 
                    onPress={() => handleAddPhotos('camera')}
                  >
                    <View style={styles.addPhotoIcon}>
                      <Ionicons name="camera" size={24} color="#16a34a" />
                    </View>
                    <Text style={styles.addPhotoText}>Camera</Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Sur native: bouton unique avec Alert.alert
                <TouchableOpacity style={styles.addPhotoButton} onPress={() => handleAddPhotos()}>
                  <View style={styles.addPhotoIcon}>
                    <Ionicons name="camera" size={24} color="#16a34a" />
                  </View>
                  <Text style={styles.addPhotoText}>Ajouter</Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
          <Text style={styles.photoHint}>Ajoutez au moins 3 photos pour plus de visibilité.</Text>
        </View>

        {/* Localisation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localisation</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NOM DU PARKING</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Garage Centre Ville"
                value={label}
                onChangeText={setLabel}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ADRESSE</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="12 Rue de la Paix, Paris"
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>
          </View>

          {/* GPS Location Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>POSITION GPS</Text>

            {latitude && longitude ? (
              <View style={styles.locationDisplay}>
                <View style={styles.locationInfo}>
                  <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                  <View style={styles.locationCoords}>
                    <Text style={styles.locationText}>
                      Lat: {latitude.toFixed(6)}
                    </Text>
                    <Text style={styles.locationText}>
                      Lng: {longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.modifyButton}
                  onPress={() => setShowMapModal(true)}
                >
                  <Ionicons name="pencil" size={16} color="#007AFF" />
                  <Text style={styles.modifyButtonText}>Modifier</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.locationButtons}>
                <TouchableOpacity
                  style={[styles.locationButton, styles.gpsButton]}
                  onPress={getCurrentLocation}
                  disabled={loadingLocation}
                >
                  {loadingLocation ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="navigate" size={20} color="#fff" />
                      <Text style={styles.locationButtonText}>Ma position GPS</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.locationButton, styles.mapButton]}
                  onPress={() => setShowMapModal(true)}
                >
                  <Ionicons name="map-outline" size={20} color="#007AFF" />
                  <Text style={styles.mapButtonText}>Choisir sur la carte</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez votre place (accès, sécurité, etc.)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Types de Véhicules Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Types de véhicules acceptés</Text>
          <View style={styles.vehicleList}>
            {availableVehicles.map((vehicle) => {
              const selectedVehicle = selectedVehicles.find((v) => v.vehicleId === vehicle.Id_Vehicles);
              const isSelected = !!selectedVehicle;

              return (
                <View key={vehicle.Id_Vehicles} style={styles.vehicleItem}>
                  <TouchableOpacity
                    style={[styles.vehicleChip, isSelected && styles.vehicleChipActive]}
                    onPress={() => toggleVehicle(vehicle.Id_Vehicles)}
                  >
                    <Ionicons
                      name={vehicle.icon || getVehicleIcon(vehicle.types)}
                      size={20}
                      color={isSelected ? '#102210' : '#6b7280'}
                    />
                    <Text style={[styles.vehicleChipText, isSelected && styles.vehicleChipTextActive]}>
                      {vehicle.types}
                    </Text>
                  </TouchableOpacity>

                  {isSelected && selectedVehicle && (
                    <View style={styles.vehicleCountContainer}>
                      <Text style={styles.vehicleCountLabel}>Places:</Text>
                      <TextInput
                        style={styles.vehicleCountInput}
                        value={selectedVehicle.count ? selectedVehicle.count.toString() : ''}
                        onChangeText={(text) => updateVehicleCount(vehicle.Id_Vehicles, text)}
                        keyboardType="number-pad"
                        maxLength={3}
                        placeholder="0"
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Tarif Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarif</Text>
          <View style={styles.priceRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>TARIF HORAIRE</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  placeholder="2.50"
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  keyboardType="decimal-pad"
                />
                <Ionicons name="logo-euro" size={18} color="#9ca3af" style={styles.inputIconRight} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal pour sélection sur carte */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowMapModal(false)}
            >
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sélectionner la position</Text>
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={confirmMapLocation}
            >
              <Ionicons name="checkmark" size={24} color="#16a34a" />
            </TouchableOpacity>
          </View>

          <ParkingMapPicker
            latitude={latitude}
            longitude={longitude}
            onLocationChange={handleMapLocationChange}
          />
        </View>
      </Modal>
      {AlertComponent}
    </KeyboardAvoidingView>
  );
};

export default AddEditParking;
