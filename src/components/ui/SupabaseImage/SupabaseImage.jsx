import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Image, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabaseImageStyles as styles } from './SupabaseImage.styles';
import { colors } from '../../../theme';

// Use FastImage on native platforms, standard Image on web
let FastImage = null;
if (Platform.OS !== 'web') {
  FastImage = require('react-native-fast-image');
}

// Web-compatible image component wrapper
const ImageComponent = Platform.OS === 'web' ? Image : FastImage;

/**
 * Composant Image optimisé pour Supabase Storage
 * Utilise FastImage pour une meilleure gestion des certificats SSL et du cache
 */
const SupabaseImage = ({ uri, style, resizeMode = 'cover', placeholder, ...props }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(false);
  }, []);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  const handleError = useCallback((e) => {
    console.error('Erreur SupabaseImage:', uri, e);
    setLoading(false);
    setError(true);
  }, [uri]);

  if (error) {
    return (
      <View style={[styles.errorContainer, style]}>
        <Ionicons name="image-outline" size={40} color={colors.text.gray.slate.medium} />
        <Text style={styles.errorText}>Image non disponible</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {Platform.OS === 'web' ? (
        // Standard Image for web
        <Image
          {...props}
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        // FastImage for native platforms
        <FastImage
          {...props}
          source={{
            uri: uri,
            priority: FastImage.priority.normal,
            cache: FastImage.cacheControl.immutable,
          }}
          style={StyleSheet.absoluteFill}
          resizeMode={FastImage.resizeMode[resizeMode] || FastImage.resizeMode.cover}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary.forest} />
        </View>
      )}
    </View>
  );
};

export default SupabaseImage;
