import api from '../config/api';


export const dashboardService = {

    async getOwnerDashboard(ownerId) {
        try {
            const response = await api.get(`/owner-dashboard/${ownerId}`);
            return response.data;
        } catch (error) {
            console.error('[Dashboard] Get owner error:', error.message);
            throw new Error(error.response?.data?.message || 'Erreur lors du chargement du dashboard');
        }
    },


    async getCommissionStatistics(startDate, endDate) {
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.get('/dashboard/commissions', { params });
            return response.data;
        } catch (error) {
            console.error('[Dashboard] Commissions error:', error.message);
            throw new Error(error.response?.data?.message || 'Erreur lors du chargement des commissions');
        }
    },


    async getReservationsByStatus(startDate, endDate) {
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.get('/dashboard/reservations/status', { params });
            return response.data;
        } catch (error) {
            console.error('[Dashboard] Reservations by status error:', error.message);
            throw new Error(error.response?.data?.message || 'Erreur lors du chargement des réservations');
        }
    },


    async getTopParkingsByReservations(limit = 10) {
        try {
            const response = await api.get('/dashboard/parkings/top-reservations', {
                params: { limit },
            });
            return response.data;
        } catch (error) {
            console.error('[Dashboard] Top parkings error:', error.message);
            throw new Error(error.response?.data?.message || 'Erreur lors du chargement du top parkings');
        }
    },


    async getActiveUsersStatistics(startDate, endDate) {
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.get('/dashboard/users/active', { params });
            return response.data;
        } catch (error) {
            console.error('[Dashboard] Active users error:', error.message);
            throw new Error(error.response?.data?.message || 'Erreur lors du chargement des utilisateurs actifs');
        }
    },
};
