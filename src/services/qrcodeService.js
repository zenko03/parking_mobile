import api from '../config/api';

const BASE_PATH = '/reservations';

const qrcodeService = {


  getQRToken: async (reservationId) => {
    try {
      const response = await api.get(`${BASE_PATH}/${reservationId}/qr-token`);
      return response.data;
    } catch (error) {
      console.error('[QR] Token fetch error:', error.message);
      throw error;
    }
  },



  getQRImage: async (reservationId) => {
    try {
      const response = await api.get(`${BASE_PATH}/${reservationId}/qr-image`, {
        responseType: 'blob', // Important pour recevoir l'image
      });
      return response.data;
    } catch (error) {
      console.error('[QR] Image fetch error:', error.message);
      throw error;
    }
  },



  validateQR: async (qrToken) => {
    try {
      const response = await api.post(`${BASE_PATH}/validate-qr`, { qrToken });
      return response.data;
    } catch (error) {
      console.error('[QR] Validation error:', error.message);

      // Extraire le message d'erreur du backend
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Impossible de valider le QR Code');
      }
    }
  },



  checkQRStatus: async (qrToken) => {
    try {
      const response = await api.get(`${BASE_PATH}/check-qr/${qrToken}`);
      return response.data;
    } catch (error) {
      console.error('[QR] Status check error:', error.message);
      throw error;
    }
  },

};

export default qrcodeService;
