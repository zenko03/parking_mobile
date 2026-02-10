//interface
import * as React from 'react';
import { Platform, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

//navigation
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

// Firebase & Notifications (compatible web via imports conditionnels internes)
import {
  requestUserPermission,
  getFCMToken,
  onTokenRefresh,
  onForegroundMessage,
  setBackgroundMessageHandler,
  onNotificationOpenedApp,
  getInitialNotification,
} from './src/config/firebase';
import { registerDeviceToken } from './src/services/notificationService';
import { navigationRef, navigateFromNotification } from './src/services/navigationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

//screens
import Login from './src/screens/auth/Login/Login'; // relative path
import Home from './src/screens/main/Home/Home'; // relative path
import Registration from './src/screens/auth/Registration/Registration'; // relative path
import ForgotPassword from './src/screens/auth/ForgotPassword/ForgotPassword';
import VerifyResetCode from './src/screens/auth/VerifyResetCode/VerifyResetCode';
import ResetPassword from './src/screens/auth/ResetPassword/ResetPassword';
import ParkingList from './src/screens/main/ParkingList/ParkingList'; // relative path
import ParkingDetails from "./src/screens/main/ParkingDetails/ParkingDetails";
import MyParkingDetails from "./src/screens/main/ParkingDetails/MyParkingDetails";
import Reservation from "./src/screens/forms/Reservation/Reservation";
import ReservationConfirmation from "./src/screens/process/ReservationConfirmation/ReservationConfirmation";
import ReservationList from "./src/screens/lists/ReservationList/ReservationList";
import MyParkings from "./src/screens/profile/MyParkings/MyParkings";
import AddEditParking from "./src/screens/forms/AddEditParking/AddEditParking";
import MyAnnouncements from "./src/screens/profile/MyAnnouncements/MyAnnouncements";
import CreateAnnouncement from "./src/screens/forms/CreateAnnouncement/CreateAnnouncement";
import ReservationRequests from "./src/screens/lists/ReservationRequests/ReservationRequests";
import PaymentFinalization from "./src/screens/process/PaymentFinalization/PaymentFinalization";
import Notifications from "./src/screens/lists/Notifications/Notifications";
import QRCodeDisplay from "./src/screens/process/QRCodeDisplay/QRCodeDisplay";
import QRCodeScanner from "./src/screens/process/QRCodeScanner/QRCodeScanner";
import ReportIssue from "./src/screens/forms/ReportIssue/ReportIssue";
import MyDisputes from "./src/screens/lists/MyDisputes/MyDisputes";
import Dashboard from "./src/screens/main/Dashboard/Dashboard";
import SplashScreen from "./src/screens/auth/SplashScreen/SplashScreen";
import WebFonts from "./src/components/WebFonts";


const Stack = createNativeStackNavigator();

export default function App() {


  // Initialiser FCM au démarrage de l'app
  React.useEffect(() => {
    const initializeFCM = async () => {
      try {
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          // Récupérer l'ID utilisateur depuis AsyncStorage (après login)
          const userJson = await AsyncStorage.getItem('user');
          if (userJson) {
            const userData = JSON.parse(userJson);
            const userId = userData.Id_Users || userData.id;

            if (userId) {
              // Enregistrer le token dans le backend
              await registerDeviceToken(userId, fcmToken, Platform.OS);
            }
          }
        }

        // 3. Écouter les rafraîchissements de token
        const unsubscribeTokenRefresh = onTokenRefresh(async (newToken: string) => {
          const userJson = await AsyncStorage.getItem('user');
          if (userJson) {
            const userData = JSON.parse(userJson);
            const userId = userData.Id_Users || userData.id;
            if (userId) {
              await registerDeviceToken(userId, newToken, Platform.OS);
            }
          }
        });

        // 4. Écouter les notifications en foreground (app ouverte)
        const unsubscribeForeground = onForegroundMessage((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {


          // Afficher une alerte avec option de navigation
          const title = remoteMessage.notification?.title || 'Nouvelle notification';
          const body = remoteMessage.notification?.body || '';
          const data = remoteMessage.data || {};

          Alert.alert(
            title,
            body,
            [
              { text: 'Ignorer', style: 'cancel' },
              {
                text: 'Voir',
                onPress: () => {
                  // Naviguer vers l'écran approprié selon le type
                  navigateFromNotification(data);
                }
              },
            ],
            { cancelable: true }
          );
        });

        // 5. Handler pour les notifications en background
        setBackgroundMessageHandler();

        // 6. Écouter les clics sur notifications (app en background)
        onNotificationOpenedApp((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {

          // Naviguer vers l'écran approprié
          navigateFromNotification(remoteMessage.data || {});
        });

        // 7. Vérifier si l'app a été ouverte via une notification (app fermée)
        getInitialNotification((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {

          // Attendre un peu que la navigation soit prête puis naviguer
          setTimeout(() => {
            navigateFromNotification(remoteMessage.data || {});
          }, 1000);
        });

        // Cleanup
        return () => {
          unsubscribeTokenRefresh();
          unsubscribeForeground();
        };
      } catch (error: any) {
        console.error('[FCM] Initialization error:', error.message);
      }
    };

    initializeFCM();
  }, []);


  return (
    <SafeAreaProvider>
      <WebFonts />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider>
          <NavigationContainer ref={navigationRef}>

            <Stack.Navigator
              initialRouteName="SplashScreen"
              screenOptions={{
                headerShown: false
              }}
            >
              <Stack.Screen name="SplashScreen" component={SplashScreen} />
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Registration" component={Registration} />
              <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
              <Stack.Screen name="VerifyResetCode" component={VerifyResetCode} />
              <Stack.Screen name="ResetPassword" component={ResetPassword} />
              <Stack.Screen name="Liste des parkings" component={ParkingList} />
              <Stack.Screen name="Détails du parking" component={ParkingDetails} />
              <Stack.Screen name="MyParkingDetails" component={MyParkingDetails} />
              <Stack.Screen name="Réservation" component={Reservation} />
              <Stack.Screen name="Confirmation de la réservation" component={ReservationConfirmation} />
              <Stack.Screen name="Mes réservations" component={ReservationList} />
              <Stack.Screen name="Mes Parkings" component={MyParkings} />
              <Stack.Screen name="AddEditParking" component={AddEditParking} />
              <Stack.Screen name="MyAnnouncements" component={MyAnnouncements} />
              <Stack.Screen name="CreateAnnouncement" component={CreateAnnouncement} />
              <Stack.Screen name="ReservationRequests" component={ReservationRequests} />
              <Stack.Screen name="Mes Demandes" component={ReservationRequests} />
              <Stack.Screen name="PaymentFinalization" component={PaymentFinalization} />
              <Stack.Screen name="Notifications" component={Notifications} />
              <Stack.Screen name="QRCodeDisplay" component={QRCodeDisplay} />
              <Stack.Screen name="QRCodeScanner" component={QRCodeScanner} />
              <Stack.Screen name="ReportIssue" component={ReportIssue} />
              <Stack.Screen name="MyDisputes" component={MyDisputes} />
              <Stack.Screen name="Dashboard" component={Dashboard} />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
