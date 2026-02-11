import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { PermissionsAndroid, Platform } from 'react-native';
import api from '../config/api';
import { supabase } from '../config/supabase';

const imageService = {

  requestCameraPermission: async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Permission Caméra',
            message: "L'application a besoin d'accéder à la caméra pour prendre des photos",
            buttonNeutral: 'Plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'Autoriser',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('[Camera] Permission error:', err.message);
        return false;
      }
    }
    return true;
  },


  pickFromGallery: async (maxPhotos = 5) => {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = maxPhotos > 1;

        input.onchange = async (e) => {
          const files = e.target.files;
          if (!files || files.length === 0) {
            resolve(null);
            return;
          }

          const assets = Array.from(files).slice(0, maxPhotos).map(file => ({
            uri: URL.createObjectURL(file),
            fileName: file.name,
            fileSize: file.size,
            type: file.type,
            file: file // Garder le fichier original pour l'upload web si besoin
          }));

          resolve(assets);
        };

        input.oncancel = () => resolve(null);
        input.click();
      });
    }

    return new Promise((resolve, reject) => {
      launchImageLibrary(
        {
          mediaType: 'photo',
          quality: 0.8,
          maxWidth: 1920,
          maxHeight: 1920,
          selectionLimit: maxPhotos,
        },
        (response) => {
          if (response.didCancel) {
            resolve(null);
          } else if (response.errorCode) {
            console.error('[Gallery] Erreur:', response.errorMessage);
            reject(new Error(response.errorMessage));
          } else if (response.assets && response.assets.length > 0) {
            resolve(response.assets);
          } else {
            resolve(null);
          }
        }
      );
    });
  },


  takePhoto: async () => {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Demande la caméra arrière sur mobile web

        input.onchange = (e) => {
          const file = e.target.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }

          resolve({
            uri: URL.createObjectURL(file),
            fileName: file.name,
            fileSize: file.size,
            type: file.type,
            file: file
          });
        };

        input.oncancel = () => resolve(null);
        input.click();
      });
    }

    const hasPermission = await imageService.requestCameraPermission();
    if (!hasPermission) {
      // Permission refusee - l'erreur sera geree par le composant appelant
      throw new Error('Permission caméra refusée');
    }

    return new Promise((resolve, reject) => {
      launchCamera(
        {
          mediaType: 'photo',
          quality: 0.8,
          maxWidth: 1920,
          maxHeight: 1920,
          saveToPhotos: true,
          cameraType: 'back',
        },
        (response) => {
          if (response.didCancel) {
            resolve(null);
          } else if (response.errorCode) {
            console.error('[Camera] Error:', response.errorMessage);
            reject(new Error(response.errorMessage));
          } else if (response.assets && response.assets.length > 0) {
            resolve(response.assets[0]);
          } else {
            resolve(null);
          }
        }
      );
    });
  },


  uploadParkingImage: async (imageAsset, parkingId, userId, isPrimary = false) => {
    try {
      const fileName = imageAsset.fileName || `image_${Date.now()}.jpg`;

      let blob;
      if (imageAsset.file) {
        blob = imageAsset.file;
      } else {
        const response = await fetch(imageAsset.uri);
        blob = await response.blob();
      }

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const uploadResponse = await api.post(`/parking-images/${parkingId}/upload`, {
        imageBase64: base64,
        fileName: fileName,
        userId: userId,
        isPrimary: isPrimary
      });

      return {
        filePath: uploadResponse.data.filePath,
        fileUrl: uploadResponse.data.fileUrl,
        fileSize: uploadResponse.data.fileSize,
      };
    } catch (error) {
      console.error('[Upload] Error:', error.response?.data || error.message);
      throw error;
    }
  },


  saveParkingImageMetadata: async (parkingId, imageData, isPrimary = false) => {
    try {
      const response = await api.post(`/parking-images/${parkingId}`, {
        filePath: imageData.filePath,
        fileUrl: imageData.fileUrl,
        fileSize: imageData.fileSize,
        isPrimary: isPrimary,
      });
      return response.data;
    } catch (error) {
      console.error('[Metadata] Error:', error.message);
      throw error;
    }
  },


  getParkingImages: async (parkingId) => {
    try {
      const response = await api.get(`/parking-images/${parkingId}`);
      return response.data;
    } catch (error) {
      console.error('[Images] Load error:', error.message);
      throw error;
    }
  },


  deleteParkingImage: async (parkingId, filePath) => {
    try {
      // Supprimer de Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('parking-images')
        .remove([filePath]);

      if (storageError) {
        console.error('[Storage] Error:', storageError);
        throw storageError;
      }

      // Supprimer metadata de PostgreSQL
      await api.delete(`/parking-images/${parkingId}/file?filePath=${encodeURIComponent(filePath)}`);

      return { success: true };
    } catch (error) {
      console.error('[Storage] Error:', error.message);
      throw error;
    }
  },


  // TODO MIGRATION: Cette fonction utilise encore Alert.alert sur mobile.
  // Pour une migration complete, creer un composant ImagePickerDialog qui utilise AlertDialog
  // et deplacer cette logique dans les composants appelants (ReportIssue, AddEditParking)
  showImagePickerOptions: () => {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        // Sur Web, on ouvre directement la galerie par défaut ou on demande via confirm
        const choice = window.confirm("Voulez-vous ouvrir la galerie ? (Annuler pour utiliser la caméra)");
        if (choice) {
          imageService.pickFromGallery(5).then(images => resolve({ source: 'gallery', images }));
        } else {
          imageService.takePhoto().then(image => resolve({ source: 'camera', images: image ? [image] : null }));
        }
      });
    }

    // NOTE: Import Alert temporairement pour cette fonction uniquement
    // Cette partie necessite une refonte plus importante pour utiliser AlertDialog
    const { Alert } = require('react-native');
    return new Promise((resolve) => {
      Alert.alert(
        'Ajouter une photo',
        'Choisissez une source',
        [
          {
            text: 'Galerie',
            onPress: async () => {
              try {
                const images = await imageService.pickFromGallery(5);
                resolve({ source: 'gallery', images });
              } catch (error) {
                resolve({ source: 'gallery', images: null, error });
              }
            },
          },
          {
            text: 'Caméra',
            onPress: async () => {
              try {
                const image = await imageService.takePhoto();
                resolve({ source: 'camera', images: image ? [image] : null });
              } catch (error) {
                resolve({ source: 'camera', images: null, error });
              }
            },
          },
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => resolve({ source: null, images: null }),
          },
        ],
        { cancelable: true }
      );
    });
  },


  uploadDisputeProofImage: async (imageUri, disputeId, userId) => {
    try {
      const fileName = `proof_${Date.now()}.jpg`;

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const uploadResponse = await api.post(`/dispute-proofs/${disputeId}/upload`, {
        imageBase64: base64,
        fileName: fileName,
        userId: userId,
        disputeId: disputeId
      });

      return {
        success: true,
        imageUrl: uploadResponse.data.proofUrl,
        data: uploadResponse.data
      };
    } catch (error) {
      console.error('[Dispute] Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },
};

export default imageService;
