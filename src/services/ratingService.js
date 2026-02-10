import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_PATH = '/user-notes';

const ratingService = {

  submitRating: async (ratingData) => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user || !user.Id_Users) {
        throw new Error('Utilisateur non connecté');
      }

      const payload = {
        note: ratingData.note,
        cleanliness: ratingData.cleanliness,
        precision: ratingData.precision,
        communication: ratingData.communication,
        security: ratingData.security,
        description: ratingData.description || '',
        parking: {
          Id_Parking: ratingData.parkingId
        },
        user: {
          Id_Users: user.Id_Users
        }
      };

      const response = await api.post(BASE_PATH, payload);

      return {
        success: true,
        message: 'Avis enregistré avec succès',
        data: response.data,
      };
    } catch (error) {
      console.error('[Rating] Submit error:', error.message);
      throw error;
    }
  },


  getRatingsByParking: async (parkingId) => {
    try {
      const response = await api.get(`${BASE_PATH}/parking/${parkingId}`);

      const ratings = response.data.map(rating => ({
        id: rating.id,
        idUser: rating.user?.Id_Users,
        userName: rating.user?.name || rating.user?.user_name || 'Utilisateur',
        idParking: rating.parking?.Id_Parking,
        note: rating.note,
        cleanliness: rating.cleanliness,
        precision: rating.precision,
        communication: rating.communication,
        security: rating.security,
        description: rating.description,
        createdAt: rating.createdAt,
      }));

      return ratings;
    } catch (error) {
      console.error('[Rating] Fetch by parking error:', error.message);
      return [];
    }
  },


  getParkingAverageRating: async (parkingId) => {
    try {
      const response = await api.get(`${BASE_PATH}/statistics/parking/${parkingId}`);

      // Calculer le total des avis séparément
      let total = 0;
      try {
        const ratings = await api.get(`${BASE_PATH}/parking/${parkingId}`);
        total = ratings.data?.length || 0;
      } catch (e) {
        // Ignorer l'erreur
      }

      return {
        average: response.data.average || 0,
        total: total,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return { average: null, total: 0 };
      }

      console.error('[Rating] Average fetch error:', error.message);
      return { average: null, total: 0 };
    }
  },

  //note moyenne proprio via ses parkings
  getUserAverageRating: async (userId) => {
    try {
      const response = await api.get(`${BASE_PATH}/statistics/user/${userId}`);

      return {
        average: response.data.average || 0,
        total: 0,
      };
    } catch (error) {
      console.error('[Rating] User average fetch error:', error.message);
      return { average: 0, total: 0 };
    }
  },


  hasRatedReservation: async (reservationId) => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user || !user.Id_Users) {
        return false;
      }

      const userRatings = await ratingService.getRatingsByUser(user.Id_Users);
      const hasRated = userRatings.some(r => r.reservationId === reservationId);

      return hasRated;
    } catch (error) {
      console.error('[Rating] Check rated error:', error.message);
      return false;
    }
  },

  //avis par user
  getRatingsByUser: async (userId) => {
    try {
      const response = await api.get(`${BASE_PATH}/user/${userId}`);

      const ratings = response.data.map(rating => ({
        id: rating.id,
        idUser: rating.user?.Id_Users,
        userName: rating.user?.name || rating.user?.user_name || 'Utilisateur',
        idParking: rating.parking?.Id_Parking,
        parkingName: rating.parking?.label || 'Parking',
        note: rating.note,
        cleanliness: rating.cleanliness,
        precision: rating.precision,
        communication: rating.communication,
        security: rating.security,
        description: rating.description,
        createdAt: rating.createdAt,
      }));

      return ratings;
    } catch (error) {
      console.error('[Rating] Fetch user error:', error.message);
      return [];
    }
  },


  deleteRating: async (ratingId) => {
    try {
      await api.delete(`${BASE_PATH}/${ratingId}`);
      return true;
    } catch (error) {
      console.error('[Rating] Delete error:', error.message);
      return false;
    }
  },
};

export default ratingService;
