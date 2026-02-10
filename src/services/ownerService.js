import api from '../config/api';

// Service pour la gestion des parkings du propriétaire
const ownerService = {

  getMyParkings: async () => {
    try {
      const response = await api.get('/parkings/my-parkings');
      return response.data;
    } catch (error) {
      console.error('[Owner] Fetch my parkings error:', error.message);
      throw error;
    }
  },


  createParking: async (parkingData) => {
    try {
      const response = await api.post('/parkings', parkingData);
      return response.data;
    } catch (error) {
      console.error('[Owner] Create parking error:', error.message);
      throw error;
    }
  },


  updateParking: async (id, parkingData) => {
    try {
      const response = await api.put(`/parkings/${id}`, parkingData);
      return response.data;
    } catch (error) {
      console.error(`[Owner] Update parking ${id} error:`, error.message);
      throw error;
    }
  },


  deleteParking: async (id) => {
    try {
      await api.delete(`/parkings/${id}`);
      return { success: true };
    } catch (error) {
      console.error(`[Owner] Delete parking ${id} error:`, error.message);
      throw error;
    }
  },


  toggleParkingActive: async (id) => {
    try {
      const response = await api.put(`/parkings/${id}/toggle-active`);
      return response.data;
    } catch (error) {
      console.error(`[Owner] Toggle parking ${id} error:`, error.message);
      throw error;
    }
  },


  getParkingById: async (id) => {
    try {
      const response = await api.get(`/parkings/${id}`);
      return response.data;
    } catch (error) {
      console.error(`[Owner] Fetch parking ${id} error:`, error.message);
      throw error;
    }
  },


  getParkingVehicles: async (id) => {
    try {
      const response = await api.get(`/parkings/${id}/vehicles`);
      return response.data;
    } catch (error) {
      console.error(`[Owner] Fetch vehicles error (${id}):`, error.message);
      throw error;
    }
  },
};

export default ownerService;
