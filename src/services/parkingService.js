import api from '../config/api';

const BASE_PATH = '/parkings';


const parkingService = {

  getAllParkings: async () => {
    try {
      const response = await api.get(BASE_PATH);
      return response.data;
    } catch (error) {
      console.error('[Parking] Fetch all error:', error.message);
      throw error;
    }
  },


  getParkingById: async (id) => {
    try {
      const response = await api.get(`${BASE_PATH}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`[Parking] Fetch ${id} error:`, error.message);
      throw error;
    }
  },


  searchParkings: async (filters = {}) => {
    try {
      const params = {};

      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.vehicleType) params.vehicleType = filters.vehicleType;
      if (filters.numberOfVehicles) params.numberOfVehicles = filters.numberOfVehicles;
      if (filters.sortBy) params.sortBy = filters.sortBy;

      const response = await api.get(`${BASE_PATH}/search`, { params });
      return response.data;
    } catch (error) {
      console.error('[Parking] Search error:', error.message);
      throw error;
    }
  },


  createParking: async (parkingData) => {
    try {
      const response = await api.post(BASE_PATH, parkingData);
      return response.data;
    } catch (error) {
      console.error('[Parking] Create error:', error.message);
      throw error;
    }
  },


  updateParking: async (id, parkingData) => {
    try {
      const response = await api.put(`/parkings/${id}`, parkingData);
      return response.data;
    } catch (error) {
      console.error(`[Parking] Update ${id} error:`, error.message);
      throw error;
    }
  },

  deleteParking: async (id) => {
    try {
      await api.delete(`/parkings/${id}`);
    } catch (error) {
      console.error(`[Parking] Delete ${id} error:`, error.message);
      throw error;
    }
  },


  getParkingVehicles: async (parkingId) => {
    try {
      // Tenter le premier endpoint
      try {
        const response = await api.get(`/parking-vehicles/by-parking/${parkingId}`);
        return response.data;
      } catch (e) {
        // Fallback vers le second endpoint probable
        const response = await api.get(`${BASE_PATH}/${parkingId}/vehicles`);
        return response.data;
      }
    } catch (error) {
      console.error(`[Parking] Vehicles load error (${parkingId}):`, error.message);
      throw error;
    }
  },

  getParkingAvailability: async (parkingId, startDateTime, endDateTime) => {
    try {
      const params = {};
      if (startDateTime) params.startDateTime = startDateTime;
      if (endDateTime) params.endDateTime = endDateTime;

      const response = await api.get(`/parkings/${parkingId}/availability`, { params });
      return response.data;
    } catch (error) {
      console.error(`[Parking] Availability load error (${parkingId}):`, error.message);
      throw error;
    }
  },
};

export default parkingService;
