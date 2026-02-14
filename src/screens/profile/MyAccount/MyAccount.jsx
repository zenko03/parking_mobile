import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../../components/ui/Header/Header';
import Footer from '../../../components/ui/Footer/Footer';
import CurrencySelector from '../../../components/settings/CurrencySelector';
import { myAccountStyles as styles } from './MyAccount.styles';
import { colors } from '../../../theme';

const MyAccount = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
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

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Section Profil */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle" size={24} color={colors.primary.bright} />
            <Text style={styles.sectionTitle}>Informations Personnelles</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.userDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={20} color={colors.text.gray.slate.dark} />
                <Text style={styles.detailLabel}>Nom</Text>
                <Text style={styles.detailValue}>{userName}</Text>
              </View>

              <View style={styles.separator} />

              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={20} color={colors.text.gray.slate.dark} />
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{userEmail}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section Devise */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={24} color={colors.primary.bright} />
            <Text style={styles.sectionTitle}>Préférences de Devise</Text>
          </View>
          
          <CurrencySelector />
        </View>

        {/* Section Notifications (optionnel pour plus tard) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={24} color={colors.primary.bright} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Notifications Push</Text>
                <Text style={styles.settingDescription}>
                  Recevoir des notifications sur vos réservations
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E0E0E0', true: colors.primary.bright }}
                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Ionicons name="lock-closed-outline" size={22} color={colors.primary.bright} />
            <Text style={styles.actionButtonText}>Modifier mon mot de passe</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.gray.slate.medium} />
          </TouchableOpacity>
        </View>

        {/* Espace en bas */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Footer navigation={navigation} />
    </View>
  );
};

export default MyAccount;
