/**
 * Utilitaire pour gérer les URLs d'images Supabase
 * Supporte deux modes:
 * 1. Direct: Utilise les URLs Supabase publiques (bucket public)
 * 2. Proxy: Passe par le backend pour éviter problèmes SSL Android
 */

import { getApiBaseUrl, isImageProxyEnabled, getSupabaseUrl, log } from '../config/environment';

const BACKEND_URL = getApiBaseUrl();
const USE_PROXY = isImageProxyEnabled();
const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/parking-images/`;


/**
 * Convertit une URL Supabase en URL utilisable
 * Selon USE_PROXY: soit URL proxy backend, soit URL Supabase directe
 * @param {string} supabaseUrl - URL complète Supabase
 * @returns {string} URL finale (proxy ou directe)
 */
export const convertToProxyUrl = (supabaseUrl) => {
  if (!supabaseUrl) return null;

  // Si ce n'est pas une URL Supabase, retourner telle quelle
  if (!supabaseUrl.includes('supabase.co')) {
    return supabaseUrl;
  }

  // MODE DIRECT: Utiliser Supabase directement (bucket public)
  if (!USE_PROXY) {
    return supabaseUrl;
  }

  // MODE PROXY: Passer par le backend
  // Extraire le chemin après "parking-images/"
  const path = supabaseUrl.replace(SUPABASE_STORAGE_URL, '');

  // Construire l'URL proxy
  const proxyUrl = `${BACKEND_URL}/api/images/proxy?path=${encodeURIComponent(path)}`;

  return proxyUrl;
};

/**
 * Convertit un tableau d'images avec URLs Supabase en URLs proxy
 * @param {Array} images - Tableau d'objets images avec fileUrl
 * @returns {Array} Tableau d'images avec URLs proxy
 */
export const convertImagesToProxy = (images) => {
  if (!images || !Array.isArray(images)) return [];

  return images.map(img => ({
    ...img,
    fileUrl: convertToProxyUrl(img.fileUrl),
  }));
};

export default {
  convertToProxyUrl,
  convertImagesToProxy,
};
