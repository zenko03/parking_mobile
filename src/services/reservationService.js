import api from '../config/api';

// Base path pour l'API des réservations
const BASE_PATH = '/reservations';

const reservationService = {

  getAllReservations: async () => {
    try {
      const response = await api.get(BASE_PATH);
      return response.data;
    } catch (error) {
      console.error('[Reservation] Fetch all error:', error.message);
      throw error;
    }
  },


  getReservationById: async (id) => {
    try {
      const response = await api.get(`${BASE_PATH}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`[Reservation] Fetch ${id} error:`, error.message);
      throw error;
    }
  },


  getUserReservations: async (userId) => {
    try {
      const response = await api.get(`${BASE_PATH}/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`[Reservation] User fetch error (${userId}):`, error.message);
      throw error;
    }
  },


  getOwnerParkingReservations: async (ownerId) => {
    try {
      const response = await api.get(`${BASE_PATH}/owner/${ownerId}`);
      return response.data;
    } catch (error) {
      console.error(`[Reservation] Owner fetch error (${ownerId}):`, error.message);
      throw error;
    }
  },


  createReservation: async (reservationData) => {
    try {
      const startDateUTC = new Date(reservationData.startDateTime).toISOString();
      const endDateUTC = new Date(reservationData.endDateTime).toISOString();

      const response = await api.post(BASE_PATH, {
        parkingId: reservationData.parkingId,
        userId: reservationData.userId,
        startDateTime: startDateUTC,
        endDateTime: endDateUTC,
        paymentMethod: reservationData.paymentMethod || 'CARTE_BANCAIRE',
        selectedVehicles: reservationData.selectedVehicles || [],
      });

      return response.data;
    } catch (error) {
      console.error('[Reservation] Create error:', error.message);

      if (error.response) {

        let errorMessage = 'Données de réservation invalides';

        if (typeof error.response.data === 'string' && error.response.data) {
          errorMessage = error.response.data;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }

        if (error.response.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        } else if (error.response.status === 400) {
          throw new Error(`Erreur de validation: ${errorMessage}`);
        } else if (error.response.status === 403) {
          throw new Error('Accès refusé. Vérifiez vos permissions.');
        } else if (error.response.status === 404) {
          throw new Error('Parking ou utilisateur non trouvé.');
        }
      }

      throw error;
    }
  },


  calculatePrice: async (priceData) => {
    try {
      const startDateUTC = new Date(priceData.startDateTime).toISOString();
      const endDateUTC = new Date(priceData.endDateTime).toISOString();

      const response = await api.post(`${BASE_PATH}/calculate-price`, {
        parkingId: priceData.parkingId,
        startDateTime: startDateUTC,
        endDateTime: endDateUTC,
        selectedVehicles: priceData.selectedVehicles || [],
      });
      return response.data;
    } catch (error) {
      console.error('[Reservation] Price calculation error:', error.message);
      throw error;
    }
  },


  checkAvailability: async (availabilityData) => {
    try {
      const startDateUTC = new Date(availabilityData.startDateTime).toISOString();
      const endDateUTC = new Date(availabilityData.endDateTime).toISOString();

      const response = await api.post(`${BASE_PATH}/check-availability`, {
        parkingId: availabilityData.parkingId,
        startDateTime: startDateUTC,
        endDateTime: endDateUTC,
        selectedVehicles: availabilityData.selectedVehicles || [],
      });
      return response.data;
    } catch (error) {
      console.error('[Reservation] Availability check error:', error.message);
      throw error;
    }
  },


  filterReservations: async (filters = {}) => {
    try {
      const params = {};

      if (filters.statusId) params.statusId = filters.statusId;
      if (filters.userId) params.userId = filters.userId;
      if (filters.parkingId) params.parkingId = filters.parkingId;
      if (filters.startDate) params.startDate = new Date(filters.startDate).toISOString();
      if (filters.endDate) params.endDate = new Date(filters.endDate).toISOString();

      const response = await api.get(`${BASE_PATH}/filter`, { params });
      return response.data;
    } catch (error) {
      console.error('[Reservation] Filter error:', error.message);
      throw error;
    }
  },

  testPublicEndpoint: async () => {
    try {
      const response = await api.get(`${BASE_PATH}/test-public`);
      return response.data;
    } catch (error) {
      console.error('[Reservation] Test error:', error.message);
      throw error;
    }
  },
};

export default reservationService;
