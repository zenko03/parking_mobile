import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../../../services/notificationService';
import { footerStyles as styles } from './Footer.styles';
import { colors } from '../../../theme';

const Footer = ({ navigation, activeRoute }) => {
  const { width } = useWindowDimensions();
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger le compteur de notifications non lues
  const loadUnreadCount = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      if (user?.Id_Users) {
        const count = await notificationService.getUnreadCount(user.Id_Users);
        setUnreadCount(count || 0);
      }
    } catch (error) {
      // Silencieux en cas d'erreur pour ne pas polluer la console
      console.log('️ Impossible de charger le compteur de notifs');
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Recharger quand l'écran reprend le focus
  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [loadUnreadCount])
  );

  const navigateTo = (routeName) => {
    if (navigation) {
      navigation.navigate(routeName);
    }
  };

  const isActive = (routeName) => activeRoute === routeName;

  // Calculer la largeur des boutons en fonction de l'écran
  const buttonWidth = width / 5.5;
  const showLabels = width > 360;

  return (
    <SafeAreaView edges={['bottom']} style={[styles.footerContainer, {
      paddingHorizontal: width < 380 ? 2 : 5
    }]}>
      <TouchableOpacity
        style={[styles.footerButton, { width: buttonWidth }]}
        onPress={() => navigateTo('Liste des parkings')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isActive('Liste des parkings') ? 'home' : 'home-outline'}
          size={width < 380 ? 22 : 24}
          color={isActive('Liste des parkings') ? colors.primary.dark : colors.text.gray.medium}
        />
        {showLabels && (
          <Text style={[styles.footerText, isActive('Liste des parkings') && styles.footerTextActive]}>
            Accueil
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.footerButton, { width: buttonWidth }]}
        onPress={() => navigateTo('Mes réservations')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isActive('Mes réservations') ? 'calendar' : 'calendar-outline'}
          size={width < 380 ? 22 : 24}
          color={isActive('Mes réservations') ? colors.primary.dark : colors.text.gray.medium}
        />
        {showLabels && (
          <Text style={[styles.footerText, isActive('Mes réservations') && styles.footerTextActive]}>
            Réservations
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.footerButton, { width: buttonWidth }]}
        onPress={() => navigateTo('MyAnnouncements')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isActive('MyAnnouncements') || isActive('Mes Annonces') ? 'megaphone' : 'megaphone-outline'}
          size={width < 380 ? 22 : 24}
          color={isActive('MyAnnouncements') || isActive('Mes Annonces') ? colors.primary.dark : colors.text.gray.medium}
        />
        {showLabels && (
          <Text style={[styles.footerText, (isActive('MyAnnouncements') || isActive('Mes Annonces')) && styles.footerTextActive]}>
            Publier
          </Text>
        )}
      </TouchableOpacity>

      {/* Bouton Notifications avec Badge */}
      <TouchableOpacity
        style={[styles.footerButton, { width: buttonWidth }]}
        onPress={() => navigateTo('Notifications')}
        activeOpacity={0.7}
      >
        <View style={{ position: 'relative' }}>
          <Ionicons
            name={isActive('Notifications') ? 'notifications' : 'notifications-outline'}
            size={width < 380 ? 22 : 24}
            color={isActive('Notifications') ? colors.primary.dark : colors.text.gray.medium}
          />
          {/* Badge de notification */}
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        {showLabels && (
          <Text style={[styles.footerText, isActive('Notifications') && styles.footerTextActive]}>
            Notifications
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.footerButton, { width: buttonWidth }]}
        onPress={() => {
          // Naviguer vers le profil ou afficher le menu
          console.log('Mon compte - à implémenter');
        }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isActive('Mon compte') ? 'person' : 'person-outline'}
          size={width < 380 ? 22 : 24}
          color={isActive('Mon compte') ? colors.primary.dark : colors.text.gray.medium}
        />
        {showLabels && (
          <Text style={[styles.footerText, isActive('Mon compte') && styles.footerTextActive]}>
            Mon compte
          </Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Footer;
