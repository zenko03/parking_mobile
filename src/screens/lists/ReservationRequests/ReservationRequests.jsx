import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reservationRequestService } from '../../../services';
import Header from '../../../components/ui/Header/Header';
import Footer from '../../../components/ui/Footer/Footer';
import { reservationRequestsStyles as styles } from './ReservationRequests.styles';
import { formatPrice } from '../../../config/constants';
import { useAlert } from '../../../hooks/useAlert';

export default function ReservationRequests({ navigation }) {
  const { AlertComponent, showAlert } = useAlert();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, pending, accepted, rejected
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('received'); // 'received' = reçues (propriétaire), 'sent' = envoyées (client)
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [activeTab]); // Recharger quand l'onglet change

  useEffect(() => {
    applyFilter();
  }, [selectedFilter, requests]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem('user');

      if (!userJson) {
        navigation.navigate('Login');
        return;
      }

      const user = JSON.parse(userJson);
      const currentUserId = user.Id_Users;
      setUserId(currentUserId);

      let data;
      if (activeTab === 'received') {
        // Demandes reçues (en tant que propriétaire)
        data = await reservationRequestService.getRequestsByOwner(currentUserId);
        console.log('📥 Demandes reçues:', data.length);
      } else {
        // Demandes envoyées (en tant que client)
        data = await reservationRequestService.getRequestsByRequester(currentUserId);
        console.log('📤 Demandes envoyées:', data.length);
      }

      // Trier par date (plus récentes en premier)
      const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setRequests(sorted);
    } catch (error) {
      console.error('Erreur: Erreur chargement demandes:', error);
      showAlert({
        title: 'Erreur',
        message: 'Impossible de charger les demandes',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilter = () => {
    let filtered = requests;

    if (selectedFilter === 'pending') {
      filtered = requests.filter(r => r.state === 10);
    } else if (selectedFilter === 'accepted') {
      filtered = requests.filter(r => r.state === 20);
    } else if (selectedFilter === 'rejected') {
      filtered = requests.filter(r => r.state === 25);
    }

    setFilteredRequests(filtered);
  };

  const handleAccept = async (requestId) => {
    showAlert({
      title: 'Accepter la demande',
      message: 'Le client aura 24h pour effectuer le paiement',
      type: 'default',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            try {
              setProcessingId(requestId);
              await reservationRequestService.acceptRequest(requestId);
              showAlert({
                title: 'Succès',
                message: 'Demande acceptée ! Le client a été notifié.',
                type: 'success'
              });
              loadRequests();
            } catch (error) {
              console.error('Erreur: Erreur acceptation:', error);
              showAlert({
                title: 'Erreur',
                message: error.message || 'Impossible d\'accepter la demande',
                type: 'error'
              });
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    });
  };

  const handleReject = async (requestId) => {
    showAlert({
      title: 'Refuser la demande',
      message: 'Êtes-vous sûr de vouloir refuser cette demande ?',
      type: 'default',
      buttons: [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(requestId);
              await reservationRequestService.rejectRequest(requestId);
              showAlert({
                title: 'Demande refusée',
                message: 'Le client a été notifié.',
                type: 'warning'
              });
              loadRequests();
            } catch (error) {
              console.error('Erreur: Erreur refus:', error);
              showAlert({
                title: 'Erreur',
                message: error.message || 'Impossible de refuser la demande',
                type: 'error'
              });
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    });
  };

  // Annuler une demande (client)
  const handleCancelRequest = async (requestId) => {
    showAlert({
      title: 'Annuler la demande',
      message: 'Êtes-vous sûr de vouloir annuler cette demande ?',
      type: 'default',
      buttons: [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(requestId);
              await reservationRequestService.cancelRequest(requestId);
              showAlert({
                title: 'Succès',
                message: 'Demande annulée',
                type: 'success'
              });
              loadRequests();
            } catch (error) {
              console.error('Erreur: Erreur annulation:', error);
              showAlert({
                title: 'Erreur',
                message: error.message || 'Impossible d\'annuler la demande',
                type: 'error'
              });
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    });
  };

  // Payer une demande acceptée (client)
  const handlePayment = (request) => {
    navigation.navigate('PaymentFinalization', {
      requestId: request.id,
      requestData: request,
    });
  };

  const getStatusInfo = (state) => {
    switch (state) {
      case 10:
        return { label: 'En attente', color: '#FFA500', bgColor: '#FFF3E0' };
      case 20:
        return { label: 'Acceptée', color: '#4CAF50', bgColor: '#E8F5E9' };
      case 25:
        return { label: 'Refusée', color: '#F44336', bgColor: '#FFEBEE' };
      case 35:
        return { label: 'Expirée', color: '#9E9E9E', bgColor: '#F5F5F5' };
      case 40:
        return { label: 'Finalisée', color: '#2196F3', bgColor: '#E3F2FD' };
      default:
        return { label: 'Inconnu', color: '#9E9E9E', bgColor: '#F5F5F5' };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('fr-FR', { month: 'short' });
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month}, ${hours}:${minutes}`;
  };

  const renderRequestCard = ({ item }) => {
    const statusInfo = getStatusInfo(item.state);
    const isProcessing = processingId === item.id;
    const isPending = item.state === 10;

    // Extraire infos de l'annonce et du requester
    const requesterName = item.requester?.user_name || item.requester?.name || 'Client';
    const parkingName = item.announcement?.parking?.label || 'Parking';
    const startDate = item.startDateTime ? formatDate(item.startDateTime) : 'N/A';
    const endDate = item.endDateTime ? formatDate(item.endDateTime) : 'N/A';
    const totalGain = formatPrice(item.totalGain);

    return (
      <View style={styles.card}>
        {/* Header: User + Status */}
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {requesterName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{requesterName}</Text>
              <Text style={styles.parkingName}>{parkingName}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{startDate} → {endDate}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.detailLabel}>Gain total</Text>
            <Text style={styles.detailValueGreen}>{formatPrice(item.totalGain)}</Text>
          </View>
        </View>

        {/* Actions selon l'onglet */}
        {activeTab === 'received' ? (
          // Actions pour demandes REÇUES (propriétaire) : Accepter / Refuser
          isPending && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonReject]}
                onPress={() => handleReject(item.id)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#666" />
                ) : (
                  <Text style={styles.buttonTextReject}>Refuser</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonAccept]}
                onPress={() => handleAccept(item.id)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonTextAccept}>Accepter</Text>
                )}
              </TouchableOpacity>
            </View>
          )
        ) : (
          // Actions pour demandes ENVOYÉES (client)
          <View style={styles.actionsRow}>
            {isPending && (
              <TouchableOpacity
                style={[styles.button, styles.buttonReject]}
                onPress={() => handleCancelRequest(item.id)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#666" />
                ) : (
                  <Text style={styles.buttonTextReject}>Annuler</Text>
                )}
              </TouchableOpacity>
            )}
            {item.state === 20 && (
              <TouchableOpacity
                style={[styles.button, styles.buttonAccept]}
                onPress={() => handlePayment(item)}
                disabled={isProcessing}
              >
                <Text style={styles.buttonTextAccept}>Payer</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const pendingCount = requests.filter(r => r.state === 10).length;

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 20 }}>
        <Header navigation={navigation} />
      </View>

      {/* Onglets principaux : Reçues / Envoyées */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'received' && styles.tabButtonActive]}
          onPress={() => setActiveTab('received')}
        >
          <Ionicons
            name="download-outline"
            size={18}
            color={activeTab === 'received' ? '#6BBF47' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
            Reçues
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'sent' && styles.tabButtonActive]}
          onPress={() => setActiveTab('sent')}
        >
          <Ionicons
            name="send-outline"
            size={18}
            color={activeTab === 'sent' ? '#6BBF47' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
            Envoyées
          </Text>
        </TouchableOpacity>
      </View>

      {/* Title + Filter */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {activeTab === 'received' ? 'Demandes reçues' : 'Demandes envoyées'}
        </Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
              Tout ({requests.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('pending')}
          >
            <Text style={[styles.filterText, selectedFilter === 'pending' && styles.filterTextActive]}>
              En attente ({pendingCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6BBF47" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="mail-open-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Aucune demande</Text>
          <Text style={styles.emptySubtext}>
            {selectedFilter === 'pending'
              ? 'Aucune demande en attente'
              : 'Vous n\'avez reçu aucune demande'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={renderRequestCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRequests(); }} />
          }
        />
      )}

      {/* ALERT DIALOG */}
      {AlertComponent}

      <Footer navigation={navigation} activeRoute="Mes Demandes" />
    </View>
  );
}
