import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { parkingMapStyles as styles } from './ParkingMap.styles';
import { colors } from '../../../theme';

// Fix pour les icones Leaflet par défaut sur le web
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
});

// Créer une icône personnalisée pour Parking (identique à celle du mobile)
const customParkingIcon = L.divIcon({
    className: 'custom-web-marker',
    html: `<div style="background-color: #007AFF; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});

// Composant pour ajuster la vue de la carte
const MapViewHandler = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
};

const ParkingMap = ({ parkings, onMarkerPress, scrollEnabled }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Parse les coordonnées POINT
    const parseCoordinates = (pointString) => {
        if (!pointString) return null;
        const match = pointString.match(/POINT\(([0-9.-]+)\s+([0-9.-]+)\)/);
        if (match) {
            return {
                latitude: parseFloat(match[2]),
                longitude: parseFloat(match[1])
            };
        }
        return null;
    };

    const parkingsData = (parkings || []).map((parking, index) => {
        let coords;
        if (parking.latitude && parking.longitude) {
            coords = { latitude: parking.latitude, longitude: parking.longitude };
        } else {
            coords = parseCoordinates(parking.localisation);
        }

        if (!coords) return null;

        const parkingId = parking.id_Parking || parking.Id_Parking || parking.id_parking || parking.id || parking.parkingId;

        return {
            id: parkingId || index,
            label: parking.label || 'Parking',
            description: parking.description || '',
            price: parking.hourlyRate || parking.hourly_rate || 0,
            latitude: coords.latitude,
            longitude: coords.longitude,
            original: parking
        };
    }).filter(p => p !== null);

    if (parkingsData.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="map-outline" size={50} color={colors.border.light} />
                <Text style={styles.emptyText}>Aucun parking à afficher</Text>
            </View>
        );
    }

    // Calculer le centre initial
    const latitudes = parkingsData.map(p => p.latitude);
    const longitudes = parkingsData.map(p => p.longitude);
    const centerLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
    const centerLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
    const bounds = parkingsData.map(p => [p.latitude, p.longitude]);

    if (!isClient) return <ActivityIndicator size="large" color={colors.primary.main} />;

    return (
        <View style={styles.container}>
            <MapContainer
                center={[centerLat, centerLng]}
                zoom={13}
                scrollWheelZoom={true}
                style={{ width: '100%', height: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {parkingsData.map((parking) => (
                    <Marker
                        key={parking.id}
                        position={[parking.latitude, parking.longitude]}
                        icon={customParkingIcon}
                        eventHandlers={{
                            click: () => {
                                if (onMarkerPress) onMarkerPress(parking.original);
                            },
                        }}
                    >
                        <Popup>
                            <div style={{ fontFamily: 'Poppins, sans-serif' }}>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{parking.label}</h3>
                                <p style={{ margin: '3px 0', fontSize: '13px', color: '#666' }}>{parking.description}</p>
                                <p style={{ margin: '3px 0', fontSize: '14px', fontWeight: 'bold', color: '#6BBF47' }}>
                                    {parking.price}Ar/heure
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <MapViewHandler bounds={bounds} />
            </MapContainer>
        </View>
    );
};

export default ParkingMap;
