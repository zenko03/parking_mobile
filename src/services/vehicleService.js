import api from '../config/api';

const BASE_PATH = '/vehicles';


const vehicleService = {

  getAllVehicles: async () => {
    try {
      const response = await api.get(BASE_PATH);
      return response.data;
    } catch (error) {
      console.error('[Vehicle] Fetch all error:', error.message);
      throw error;
    }
  },


  getVehicleById: async (id) => {
    try {
      const response = await api.get(`${BASE_PATH}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`[Vehicle] Fetch ${id} error:`, error.message);
      throw error;
    }
  },
};

export default vehicleService;
