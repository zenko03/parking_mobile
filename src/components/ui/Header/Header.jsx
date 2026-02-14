import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Image, ScrollView, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../../services';
import { headerStyles as styles } from './Header.styles';
import { colors } from '../../../theme';

const Header = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-320)).current; // Démarrer hors écran à gauche

  // Charger le nom de l'utilisateur au montage
  useEffect(() => {
    const loadUserName = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          setUserName(user.user_name || 'Utilisateur');
          setUserEmail(user.email || '');
        }
      } catch (error) {
        console.error('Erreur chargement user:', error);
      }
    };
    loadUserName();
  }, []);

  const handleMenuPress = () => {
    console.log('Menu hamburger cliqué');
    setMenuVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleMenuClose = () => {
    Animated.timing(slideAnim, {
      toValue: -320,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };

  const handleNavigate = (screenName) => {
    setMenuVisible(false);
    if (navigation) {
      navigation.navigate(screenName);
    }
  };

  const handleLogout = async () => {
    try {
      setMenuVisible(false);
      
      // Utiliser le service d'authentification pour déconnecter
      await authService.logout();
      
      console.log(' Déconnexion réussie - Token supprimé');
      
      if (navigation) {
        // Réinitialiser la navigation pour empêcher le retour arrière
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      console.error('Erreur: Erreur lors de la déconnexion:', error);
      // En cas d'erreur, forcer la suppression et rediriger quand même
      await AsyncStorage.clear();
      if (navigation) {
        navigation.navigate('Login');
      }
    }
  };

  const handleLogoPress = () => {
    console.log('Logo L cliqué');
    if (navigation) {
      navigation.navigate('Liste des parkings');
    }
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity 
        onPress={handleMenuPress}
        style={styles.menuButton}
        activeOpacity={0.7}
      >
        <Ionicons name="menu" size={28} color={colors.black} />
      </TouchableOpacity>
      
      
      
      <TouchableOpacity 
        style={styles.logoButton}
        onPress={handleLogoPress}
        activeOpacity={0.7}
      >
        <Image 
          source={require('../../../assets/logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Menu Modal - Drawer Style */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleMenuClose}
      >
        <View style={styles.modalOverlay}>
          {/* Drawer Menu (gauche) */}
          <Animated.View style={[
            styles.drawerContainer,
            {
              transform: [{ translateX: slideAnim }]
            }
          ]}>
            {/* Header: User Profile */}
            <View style={styles.drawerHeader}>
              <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userName}</Text>
                </View>
              </View>
            </View>

            {/* Menu Content */}
            <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
              {/* Section GÉNÉRAL */}
              <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>GÉNÉRAL</Text>
                
                <TouchableOpacity 
                  style={[styles.menuItem, styles.activeMenuItem]}
                  onPress={() => handleNavigate('Liste des parkings')}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="home" size={22} color={colors.primary.bright} />
                  </View>
                  <Text style={[styles.menuItemText, styles.activeMenuText]}>Accueil</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigate('Mes réservations')}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="calendar-outline" size={22} color={colors.text.gray.slate.dark} />
                  </View>
                  <Text style={styles.menuItemText}>Mes Réservations</Text>
                </TouchableOpacity>
              </View>

              {/* Section PROPRIÉTAIRE */}
              <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>PROPRIÉTAIRE</Text>
                
                <TouchableOpacity 
                  style={[styles.menuItem, styles.highlightedItem]}
                  disabled={true}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="add-circle" size={22} color={colors.primary.bright} />
                  </View>
                  <Text style={[styles.menuItemText, styles.highlightedText]}>Publier un Parking</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigate('Mes Parkings')}
                >
                  <View style={styles.menuIconContainer}>
                    <Text style={styles.parkingIcon}>P</Text>
                  </View>
                  <Text style={styles.menuItemText}>Mes Parkings</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigate('MyAnnouncements')}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="megaphone-outline" size={22} color={colors.text.gray.slate.dark} />
                  </View>
                  <Text style={styles.menuItemText}>Mes Annonces</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigate('ReservationRequests')}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="mail-outline" size={22} color={colors.text.gray.slate.dark} />
                  </View>
                  <Text style={styles.menuItemText}>Mes Demandes</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigate('Notifications')}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="notifications-outline" size={22} color={colors.text.gray.slate.dark} />
                  </View>
                  <Text style={styles.menuItemText}>Notifications</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigate('Dashboard')}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="stats-chart-outline" size={22} color={colors.text.gray.slate.dark} />
                  </View>
                  <Text style={styles.menuItemText}>Tableau de Bord</Text>
                </TouchableOpacity>
              </View>

              {/* Section COMPTE & SUPPORT */}
              <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>COMPTE & SUPPORT</Text>
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleNavigate('MyAccount')}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="person-circle-outline" size={22} color={colors.text.gray.slate.dark} />
                  </View>
                  <Text style={styles.menuItemText}>Mon Compte</Text>
                </TouchableOpacity>
              </View>

              {/* Déconnexion */}
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.status.errorBright} />
                <Text style={styles.logoutText}>Déconnexion</Text>
              </TouchableOpacity>

              {/* Version */}
              <Text style={styles.versionText}>Upark</Text>
            </ScrollView>
          </Animated.View>

          {/* Backdrop (droite) - ferme le menu au clic */}
          <TouchableOpacity 
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleMenuClose}
          />
        </View>
      </Modal>
    </View>
  );
};

export default Header;
