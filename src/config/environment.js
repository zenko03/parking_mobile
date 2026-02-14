import { Platform } from 'react-native';

// Détection de l'environnement
const isDevelopment = __DEV__;

const ENV = {
  development: {
    API_URL: Platform.select({
      android: 'http://10.0.2.2:8080',      
      ios: 'http://localhost:8080',         
      default: 'http://localhost:8080',
    }),
    
    USE_IMAGE_PROXY: true,  
    SUPABASE_URL: 'https://fbpefbjoxzkxombdcqif.supabase.co',
    
    ENABLE_LOGS: true,
    TIMEOUT: 10000, 
  },
  
  production: {
    API_URL: 'https://uparkbackfinal.onrender.com',
    
    USE_IMAGE_PROXY: false,  
    SUPABASE_URL: 'https://fbpefbjoxzkxombdcqif.supabase.co',
    
    ENABLE_LOGS: false,
    TIMEOUT: 15000, 
  },
  
  staging: {
    API_URL: 'https://uparkback-staging.onrender.com',
    USE_IMAGE_PROXY: true,
    SUPABASE_URL: 'https://fbpefbjoxzkxombdcqif.supabase.co',
    ENABLE_LOGS: true,
    TIMEOUT: 15000,
  },
};

const PHYSICAL_DEVICE_CONFIG = {
  API_URL: 'http://192.168.88.9:8080',  
  USE_IMAGE_PROXY: false,
  SUPABASE_URL: 'https://fbpefbjoxzkxombdcqif.supabase.co',
  ENABLE_LOGS: true,
  TIMEOUT: 10000,
};

const FORCE_ENV = null; 

export const getConfig = () => {
  if (FORCE_ENV === 'physical_device') {
    return PHYSICAL_DEVICE_CONFIG;
  }
  if (FORCE_ENV && ENV[FORCE_ENV]) {
    return ENV[FORCE_ENV];
  }
  
  // Sinon, utiliser dev ou prod selon __DEV__
  return isDevelopment ? ENV.development : ENV.production;
};


export const getApiBaseUrl = () => {
  const config = getConfig();
  return config.API_URL;
};

//recup url complet api
export const getApiUrl = () => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api/v1`;
};

//verifie si proxy image active
export const isImageProxyEnabled = () => {
  const config = getConfig();
  return config.USE_IMAGE_PROXY;
};

export const getSupabaseUrl = () => {
  const config = getConfig();
  return config.SUPABASE_URL;
};


export const isLoggingEnabled = () => {
  const config = getConfig();
  return config.ENABLE_LOGS;
};


export const getApiTimeout = () => {
  const config = getConfig();
  return config.TIMEOUT;
};


export const log = {
  info: (...args) => {
    if (isLoggingEnabled()) {
      console.log(...args);
    }
  },
  error: (...args) => {
    // Toujours afficher les erreurs, meme en production
    console.error(...args);
  },
  warn: (...args) => {
    if (isLoggingEnabled()) {
      console.warn(...args);
    }
  },
};

// Export de la configuration complète
export default {
  getConfig,
  getApiBaseUrl,
  getApiUrl,
  isImageProxyEnabled,
  getSupabaseUrl,
  isLoggingEnabled,
  getApiTimeout,
  log,
  isDevelopment,
};
