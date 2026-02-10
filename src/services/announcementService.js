import api from '../config/api';

const announcementService = {
  getPublishedAnnouncements: async () => {
    try {
      const response = await api.get('/announcements/published');
      return response.data;
    } catch (error) {
      console.error('[Announcement] Fetch published error:', error.message);
      throw error;
    }
  },


  searchAnnouncements: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.searchText) {
        params.append('searchText', filters.searchText);
      }
      if (filters.vehicleTypeId) {
        params.append('vehicleTypeId', filters.vehicleTypeId);
      }
      if (filters.minPlaces) {
        params.append('minPlaces', filters.minPlaces);
      }

      const queryString = params.toString();
      const url = queryString ? `/announcements/search?${queryString}` : '/announcements/search';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('[Announcement] Search error:', error.message);
      throw error;
    }
  },


  getMyAnnouncements: async (userId) => {
    try {
      const response = await api.get(`/announcements/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('[Announcement] Fetch my error:', error.message);
      throw error;
    }
  },


  getAnnouncementsByParkingId: async (parkingId) => {
    try {
      const response = await api.get(`/announcements/parking/${parkingId}`);
      return response.data;
    } catch (error) {
      console.error('[Announcement] Fetch by parking error:', error.message);
      throw error;
    }
  },


  getAnnouncementById: async (id) => {
    try {
      const response = await api.get(`/announcements/${id}`);
      return response.data;
    } catch (error) {
      console.error(`[Announcement] Fetch ${id} error:`, error.message);
      throw error;
    }
  },


  createCompleteAnnouncement: async (announcementData) => {
    try {
      const response = await api.post('/announcements/complete', announcementData);
      return response.data;
    } catch (error) {
      console.error('[Announcement] Create error:', error.message);
      throw error;
    }
  },


  updateAnnouncement: async (id, announcementData) => {
    try {
      const response = await api.put(`/announcements/${id}`, announcementData);
      return response.data;
    } catch (error) {
      console.error(`[Announcement] Update ${id} error:`, error.message);
      throw error;
    }
  },


  togglePublished: async (id) => {
    try {
      const response = await api.put(`/announcements/${id}/toggle-published`);
      return response.data;
    } catch (error) {
      console.error(`[Announcement] Toggle publish ${id} error:`, error.message);
      throw error;
    }
  },


  deleteAnnouncement: async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      return { success: true };
    } catch (error) {
      console.error(`[Announcement] Delete ${id} error:`, error.message);
      throw error;
    }
  },
};

export default announcementService;
