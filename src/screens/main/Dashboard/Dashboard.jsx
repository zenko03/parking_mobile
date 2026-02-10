import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dashboardService } from '../../../services/dashboardService';
import Header from '../../../components/ui/Header/Header';
import Footer from '../../../components/ui/Footer/Footer';
import KPICard from '../../../components/cards/KPICard/KPICard';
import WeeklyChart from '../../../components/cards/WeeklyChart/WeeklyChart';
import NotificationItem from '../../../components/cards/NotificationItem/NotificationItem';
import { dashboardStyles as styles } from './Dashboard.styles';
import { colors } from '../../../theme';
import { formatPrice } from '../../../config/constants';

const { width } = Dimensions.get('window');

const Dashboard = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setError(null);
            const userJson = await AsyncStorage.getItem('user');
            if (!userJson) {
                navigation.navigate('Login');
                return;
            }

            const user = JSON.parse(userJson);
            const userId = user.Id_Users || user.id;

            console.log('📊 Chargement dashboard pour user:', userId);
            const data = await dashboardService.getOwnerDashboard(userId);
            console.log(' Dashboard chargé:', data);

            setDashboardData(data);
        } catch (err) {
            console.error(' Erreur chargement dashboard:', err);
            setError(err.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.bright} />
                <Text style={styles.loadingText}>Chargement du tableau de bord...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Header navigation={navigation} />
                <View style={styles.errorContent}>
                    <Ionicons name="alert-circle-outline" size={64} color={colors.status.errorBright} />
                    <Text style={styles.errorTitle}>Erreur</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
                        <Text style={styles.retryButtonText}>Réessayer</Text>
                    </TouchableOpacity>
                </View>
                <Footer navigation={navigation} />
            </View>
        );
    }

    const { summary, weeklyRevenue, recentNotifications } = dashboardData || {};

    return (
        <View style={styles.container}>
            <Header navigation={navigation} />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary.bright]} />
                }
            >
                {/* Section KPI Cards */}
                <View style={styles.kpiSection}>
                    <View style={styles.kpiRow}>
                        <KPICard
                            icon="account-balance-wallet"
                            iconColor={colors.primary.bright}
                            iconBgColor={`${colors.primary.bright}20`}
                            title="Revenus du mois"
                            value={formatPrice(summary?.revenusMoisCourant)}
                            evolution={parseFloat(summary?.evolutionRevenus) || 0}
                            style={styles.kpiCardHalf}
                        />
                        <KPICard
                            icon="directions-car"
                            iconColor={colors.info.main}
                            iconBgColor={`${colors.info.main}20`}
                            title="Réservations"
                            value={summary?.reservationsMoisCourant || 0}
                            evolution={parseFloat(summary?.evolutionReservations) || 0}
                            style={styles.kpiCardHalf}
                        />
                    </View>

                    <KPICard
                        icon="local-parking"
                        iconColor={colors.primary.bright}
                        iconBgColor={`${colors.primary.bright}10`}
                        title="Parkings disponibles"
                        value={`${summary?.placesDisponibles || 0}/${summary?.capaciteTotale || 0}`}
                        subtitle="Capacité totale"
                        occupationRate={parseFloat(summary?.tauxOccupation) || 0}
                        style={styles.kpiCardFull}
                    />
                </View>

                {/* Section Graphique Hebdomadaire */}
                <View style={styles.chartSection}>
                    <WeeklyChart
                        data={weeklyRevenue || []}
                        title="Aperçu de la semaine"
                        totalRevenue={parseFloat(weeklyRevenue?.[0]?.revenusSemaine) || 0}
                        evolution={calculateWeeklyEvolution(weeklyRevenue)}
                    />
                </View>

                {/* Section Notifications Récentes */}
                <View style={styles.notificationsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Notifications récentes</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                            <Text style={styles.seeAllButton}>Voir tout</Text>
                        </TouchableOpacity>
                    </View>

                    {recentNotifications && recentNotifications.length > 0 ? (
                        recentNotifications.slice(0, 3).map((notification, index) => (
                            <NotificationItem
                                key={notification.idNotification || index}
                                notification={notification}
                                onPress={() => handleNotificationPress(notification)}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyNotifications}>
                            <Ionicons name="notifications-off-outline" size={48} color={colors.text.gray.slate.light} />
                            <Text style={styles.emptyText}>Aucune notification récente</Text>
                        </View>
                    )}
                </View>

                {/* Spacer pour le footer */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            <Footer navigation={navigation} />
        </View>
    );
};

// Helper function pour calculer l'evolution hebdomadaire
const calculateWeeklyEvolution = (weeklyData) => {
    if (!weeklyData || weeklyData.length === 0) return 0;

    const currentWeek = parseFloat(weeklyData[0]?.revenusSemaine) || 0;
    const previousWeek = parseFloat(weeklyData[0]?.revenusSemainePrecedente) || 0;

    if (previousWeek === 0) return 0;

    return parseFloat(((currentWeek - previousWeek) / previousWeek * 100).toFixed(1));
};

// Helper function pour gérer le clic sur une notification
const handleNotificationPress = (notification) => {
    console.log('Notification cliquée:', notification);
    // TODO: Navigation vers le détail selon le type
};

export default Dashboard;
