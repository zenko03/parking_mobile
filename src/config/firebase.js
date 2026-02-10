import { Platform, PermissionsAndroid } from 'react-native';

// Import conditionnel de Firebase messaging (seulement sur mobile)
let messaging = null;
if (Platform.OS !== 'web') {
  messaging = require('@react-native-firebase/messaging').default;
}

// Fonctions stub pour le web
const createWebStub = (name) => {
  return async (...args) => {
    return null;
  };
};

export const requestUserPermission = async () => {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }
    }

    // Demander la permission Firebase
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('[FCM] Permission error:', error.message);
    return false;
  }
};

export const getFCMToken = async () => {
  if (Platform.OS === 'web') return null;

  try {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      return fcmToken;
    } else {
      return null;
    }
  } catch (error) {
    console.error('[FCM] Token error:', error.message);
    return null;
  }
};

export const onTokenRefresh = (callback) => {
  if (Platform.OS === 'web') return () => { };

  return messaging().onTokenRefresh((token) => {
    callback(token);
  });
};

export const onForegroundMessage = (callback) => {
  if (Platform.OS === 'web') return () => { };

  return messaging().onMessage(async (remoteMessage) => {
    callback(remoteMessage);
  });
};

export const setBackgroundMessageHandler = () => {
  if (Platform.OS === 'web') return;

  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  });
};

export const onNotificationOpenedApp = (callback) => {
  if (Platform.OS === 'web') return;

  messaging().onNotificationOpenedApp((remoteMessage) => {
    callback(remoteMessage);
  });
};

export const getInitialNotification = async (callback) => {
  if (Platform.OS === 'web') return;

  const remoteMessage = await messaging().getInitialNotification();
  if (remoteMessage) {
    callback(remoteMessage);
  }
};
