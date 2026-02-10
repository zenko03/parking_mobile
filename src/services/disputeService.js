
import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_PATH = '/disputes';
const PROOFS_PATH = '/dispute-proofs';

// Types de motifs disponibles
export const DISPUTE_MOTIFS = [
  { value: 'occupied', label: 'Place occupée par un autre véhicule' },
  { value: 'non_compliant', label: 'Parking non conforme à la description' },
  { value: 'access', label: "Problème d'accès / Code invalide" },
  { value: 'damage', label: 'Véhicule endommagé' },
  { value: 'other', label: 'Autre problème' },
];

const disputeService = {
  createDispute: async (disputeData) => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user || !user.Id_Users) {
        throw new Error('Utilisateur non connecté');
      }

      const payload = {
        motif: disputeData.motif,
        description: disputeData.description || '',
        reservation: {
          id_Reservation: disputeData.reservationId,
        },
      };

      const response = await api.post(BASE_PATH, payload);

      return {
        success: true,
        message: 'Litige signalé avec succès',
        data: response.data,
      };
    } catch (error) {
      console.error('[Dispute] Create error:', error.message);
      throw error;
    }
  },


  getUserDisputes: async (userId) => {
    try {
      const response = await api.get(`${BASE_PATH}/user/${userId}`);

      // Mapper les données backend vers le format frontend
      const disputes = response.data.map((dispute) => ({
        id: dispute.id,
        motif: dispute.motif,
        description: dispute.description,
        createdAt: dispute.createdAt,
        reservation: dispute.reservation
          ? {
            id: dispute.reservation.Id_Reservation,
            parkingName: dispute.reservation.parking?.label || 'Parking',
            parkingAddress: dispute.reservation.parking?.description || '',
            startDateTime: dispute.reservation.startDatetime,
            endDateTime: dispute.reservation.endDatetime,
            totalPrice: dispute.reservation.totalPrice,
          }
          : null,
      }));

      return disputes;
    } catch (error) {
      console.error('[Dispute] User fetch error:', error.message);
      throw error;
    }
  },


  getDisputesByReservation: async (reservationId) => {
    try {
      const response = await api.get(`${BASE_PATH}/reservation/${reservationId}`);
      return response.data;
    } catch (error) {
      console.error('[Dispute] Reservation fetch error:', error.message);
      throw error;
    }
  },


  getDisputeById: async (disputeId) => {
    try {
      const response = await api.get(`${BASE_PATH}/${disputeId}`);
      return response.data;
    } catch (error) {
      console.error('[Dispute] Fetch by id error:', error.message);
      throw error;
    }
  },


  updateDispute: async (disputeId, disputeData) => {
    try {
      const payload = {
        motif: disputeData.motif,
        description: disputeData.description,
      };

      const response = await api.put(`${BASE_PATH}/${disputeId}`, payload);

      return {
        success: true,
        message: 'Litige mis à jour',
        data: response.data,
      };
    } catch (error) {
      console.error('[Dispute] Update error:', error.message);
      throw error;
    }
  },


  deleteDispute: async (disputeId) => {
    try {
      await api.delete(`${BASE_PATH}/${disputeId}`);
      return {
        success: true,
        message: 'Litige supprimé',
      };
    } catch (error) {
      console.error('[Dispute] Delete error:', error.message);
      throw error;
    }
  },


  addProof: async (disputeId, proofUrl) => {
    try {
      const payload = {
        proofUrl: proofUrl,
        dispute: {
          id: disputeId,
        },
      };

      const response = await api.post(PROOFS_PATH, payload);

      return {
        success: true,
        message: 'Preuve ajoutée',
        data: response.data,
      };
    } catch (error) {
      console.error('[Dispute] Add proof error:', error.message);
      throw error;
    }
  },


  getProofsByDispute: async (disputeId) => {
    try {
      const response = await api.get(`${PROOFS_PATH}/dispute/${disputeId}`);
      return response.data;
    } catch (error) {
      console.error('[Dispute] Fetch proofs error:', error.message);
      throw error;
    }
  },


  deleteProof: async (proofId) => {
    try {
      await api.delete(`${PROOFS_PATH}/${proofId}`);
      return {
        success: true,
        message: 'Preuve supprimée',
      };
    } catch (error) {
      console.error('[Dispute] Delete proof error:', error.message);
      throw error;
    }
  },


  hasDispute: async (reservationId) => {
    try {
      const disputes = await disputeService.getDisputesByReservation(reservationId);
      return disputes && disputes.length > 0;
    } catch (error) {
      return false;
    }
  },
};

export default disputeService;
