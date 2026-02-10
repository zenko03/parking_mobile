import api from '../config/api';

const BASE_PATH = '/reservation-requests';

const reservationRequestService = {


  createReservationRequest: async (requestData) => {
    try {
      const response = await api.post(BASE_PATH, {
        requesterId: requestData.requesterId,
        announcementId: requestData.announcementId,
        startDateTime: requestData.startDateTime,
        endDateTime: requestData.endDateTime,
        totalGain: requestData.totalGain,
        selectedVehicles: requestData.selectedVehicles
      });

      return response.data;
    } catch (error) {
      console.error('[Request] Create error:', error.message);

      if (error.response?.status === 401) {
        throw new Error('Session expirée. Reconnectez-vous.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Données invalides');
      }

      throw error;
    }
  },


  getRequestsByOwner: async (ownerId) => {
    try {
      // Si ownerId n'est pas fourni, récupérer l'utilisateur connecté
      if (!ownerId) {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        ownerId = user?.Id_Users;

        if (!ownerId) {
          return [];
        }
      }

      const response = await api.get(`${BASE_PATH}/owner/${ownerId}`);
      return response.data;
    } catch (error) {
      console.error('[Request] Owner fetch error:', error.message);
      throw error;
    }
  },


  getRequestsByRequester: async (requesterId) => {
    try {
      if (!requesterId) {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        requesterId = user?.Id_Users;

        if (!requesterId) {
          return [];
        }
      }

      const response = await api.get(`${BASE_PATH}/requester/${requesterId}`);
      return response.data;
    } catch (error) {
      console.error('[Request] Requester fetch error:', error.message);
      throw error;
    }
  },


  getRequestsByState: async (state) => {
    try {
      const response = await api.get(`${BASE_PATH}/status/${state}`);
      return response.data;
    } catch (error) {
      console.error('[Request] Status fetch error:', error.message);
      throw error;
    }
  },


  acceptRequest: async (requestId) => {
    try {
      const response = await api.put(`${BASE_PATH}/${requestId}/accept`);
      return response.data;
    } catch (error) {
      console.error('[Request] Accept error:', error.message);
      throw new Error('Impossible d\'accepter la demande');
    }
  },


  rejectRequest: async (requestId) => {
    try {
      const response = await api.put(`${BASE_PATH}/${requestId}/reject`);
      return response.data;
    } catch (error) {
      console.error('[Request] Reject error:', error.message);
      throw new Error('Impossible de refuser la demande');
    }
  },


  finalizeReservation: async (requestId, paymentMethod = 'CARTE_BANCAIRE') => {
    try {
      const response = await api.post(
        `${BASE_PATH}/${requestId}/finalize?paymentMethod=${paymentMethod}`
      );
      return response.data;
    } catch (error) {
      console.error('[Request] Finalize error:', error.message);

      if (error.response?.data?.includes('expiré')) {
        throw new Error('Le délai de paiement est expiré (24h)');
      }

      throw new Error('Impossible de finaliser le paiement');
    }
  },


  cancelRequest: async (requestId) => {
    try {
      await api.delete(`${BASE_PATH}/${requestId}`);
    } catch (error) {
      console.error('[Request] Cancel error:', error.message);
      throw new Error('Impossible d\'annuler la demande');
    }
  },


  getRequestById: async (requestId) => {
    try {
      const response = await api.get(`${BASE_PATH}/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('[Request] Fetch error:', error.message);
      throw error;
    }
  }
};

export default reservationRequestService;
