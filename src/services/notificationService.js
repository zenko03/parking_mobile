import api from '../config/api';

//  enregistrer FCM dans le abckend
export const registerDeviceToken = async (userId, token, platform = 'android') => {
  try {
    const response = await api.post('/device-tokens', {
      userId,
      token,
      platform,
    });
    return response.data;
  } catch (error) {
    console.error('[Notification] Register token error:', error.message);
    throw error;
  }
};


export const getNotifications = async (userId, limit = 50) => {
  try {
    const response = await api.get(`/notifications/user/${userId}`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('[Notification] Fetch error:', error.message);
    throw error;
  }
};


export const markAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('[Notification] Mark read error:', error.message);
    throw error;
  }
};


export const markAllAsRead = async (userId) => {
  try {
    const response = await api.put(`/notifications/user/${userId}/read-all`);
    return response.data;
  } catch (error) {
    console.error('[Notification] Mark all read error:', error.message);
    throw error;
  }
};


export const deleteNotification = async (notificationId) => {
  try {
    await api.delete(`/notifications/${notificationId}`);
  } catch (error) {
    console.error('[Notification] Delete error:', error.message);
    throw error;
  }
};


export const getUnreadCount = async (userId) => {
  try {
    const response = await api.get(`/notifications/user/${userId}/unread-count`);
    return response.data.count;
  } catch (error) {
    console.error('[Notification] Count error:', error.message);
    throw error;
  }
};

// desactive FCM durant la deconnexion
export const deactivateDeviceToken = async (token, userId = null) => {
  try {
    const response = await api.delete('/device-tokens/deactivate', {
      data: { token, userId },
    });
    return response.data;
  } catch (error) {
    console.error('[Notification] Deactivate token error:', error.message);
    // Ne pas throw pour ne pas bloquer le logout
  }
};

export default {
  registerDeviceToken,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  deactivateDeviceToken,
};
