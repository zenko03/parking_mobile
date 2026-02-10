import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../../theme';

// Fix icones (identique à ParkingMap.web.jsx)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
});

// Icône personnalisée bleue pour le parking
const customIcon = L.divIcon({
    className: 'custom-web-marker-picker',
    html: `<div style="background-color: #007AFF; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});

// Composant pour gérer les clics sur la carte
const LocationPickerHandler = ({ onLocationChange, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationChange(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const ParkingMapPicker = ({ latitude, longitude, onLocationChange }) => {
    const initialPos = {
        lat: latitude || -18.9137,
        lng: longitude || 47.506
    };

    const [position, setPosition] = useState(initialPos);

    const eventHandlers = useMemo(
        () => ({
            dragend(e) {
                const marker = e.target;
                if (marker != null) {
                    const latLng = marker.getLatLng();
                    setPosition(latLng);
                    onLocationChange(latLng.lat, latLng.lng);
                }
            },
        }),
        [onLocationChange],
    );

    return (
        <View style={styles.container}>
            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>📍 Déplacez le marqueur</Text>
                <Text style={styles.infoCoords}>
                    Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
                </Text>
            </View>

            <MapContainer
                center={[position.lat, position.lng]}
                zoom={15}
                style={{ width: '100%', height: '100%', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker
                    draggable={true}
                    eventHandlers={eventHandlers}
                    position={[position.lat, position.lng]}
                    icon={customIcon}
                >
                    <Popup>Position du parking</Popup>
                </Marker>

                <LocationPickerHandler onLocationChange={onLocationChange} setPosition={setPosition} />
            </MapContainer>

            <View style={styles.helpBox}>
                <Ionicons name="information-circle-outline" size={20} color={colors.info.main} />
                <Text style={styles.helpText}>
                    Déplacez le marqueur ou cliquez sur la carte pour choisir la position
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 350,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: '#eee',
    },
    infoBox: {
        position: 'absolute',
        top: 10,
        left: '50%',
        transform: [{ translateX: -100 }], // Largeur approximative / 2
        zIndex: 1000,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        width: 200,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    infoCoords: {
        fontSize: 12,
        color: '#666',
    },
    helpBox: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 10,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1000,
    },
    helpText: {
        fontSize: 12,
        color: '#555',
        marginLeft: 8,
        flex: 1,
    }
});

export default ParkingMapPicker;
