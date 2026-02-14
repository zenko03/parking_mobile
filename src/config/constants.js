/**
 * Configuration des constantes de l'application
 * Fichier centralisé pour les valeurs globales
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Configuration par défaut de la devise
 * Peut être modifiée dynamiquement via setCurrency()
 */
let CURRENCY_CONFIG = {
    code: 'EUR',           // Code ISO (EUR, USD, MGA, etc.)
    locale: 'fr-FR',       // Locale pour le formatage (fr-FR, en-US, etc.)
};

/**
 * Devises disponibles
 */
export const AVAILABLE_CURRENCIES = [
    { code: 'EUR', name: 'Euro', symbol: '€', locale: 'fr-FR' },
    { code: 'USD', name: 'Dollar américain', symbol: '$', locale: 'en-US' },
    { code: 'MGA', name: 'Ariary malgache', symbol: 'Ar', locale: 'fr-MG' },
    { code: 'GBP', name: 'Livre sterling', symbol: '£', locale: 'en-GB' },
];

/**
 * Obtenir la configuration actuelle de la devise
 */
export const getCurrency = () => CURRENCY_CONFIG;

/**
 * Définir la devise de l'application
 * @param {string} currencyCode - Code ISO de la devise (EUR, USD, MGA, etc.)
 */
export const setCurrency = async (currencyCode) => {
    const currency = AVAILABLE_CURRENCIES.find(c => c.code === currencyCode);
    if (currency) {
        CURRENCY_CONFIG = {
            code: currency.code,
            locale: currency.locale,
        };
        // Sauvegarder dans AsyncStorage pour persistance
        await AsyncStorage.setItem('user_currency', currencyCode);
    }
};

/**
 * Charger la devise depuis AsyncStorage au démarrage
 */
export const loadCurrency = async () => {
    try {
        const savedCurrency = await AsyncStorage.getItem('user_currency');
        if (savedCurrency) {
            await setCurrency(savedCurrency);
        }
    } catch (error) {
        console.warn('Impossible de charger la devise:', error);
    }
};

/**
 * Formater un montant avec la devise
 * Utilise Intl.NumberFormat pour un formatage international correct
 * @param {number} amount - Montant à formater
 * @param {boolean} showDecimals - Afficher les décimales (défaut: true)
 * @returns {string} Montant formaté avec devise
 */
export const formatPrice = (amount, showDecimals = true) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const safeAmount = isNaN(numAmount) ? 0 : numAmount;
    
    try {
        return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
            style: 'currency',
            currency: CURRENCY_CONFIG.code,
            minimumFractionDigits: showDecimals ? 2 : 0,
            maximumFractionDigits: showDecimals ? 2 : 0,
        }).format(safeAmount);
    } catch (error) {
        // Fallback si Intl.NumberFormat n'est pas disponible
        console.warn('Intl.NumberFormat error:', error);
        const formatted = showDecimals ? safeAmount.toFixed(2) : Math.round(safeAmount);
        const currency = AVAILABLE_CURRENCIES.find(c => c.code === CURRENCY_CONFIG.code);
        return `${formatted}${currency?.symbol || '€'}`;
    }
};

/**
 * Formater un prix horaire
 * @param {number} rate - Tarif horaire
 * @returns {string} Prix formaté avec "/h"
 */
export const formatHourlyRate = (rate) => {
    return `${formatPrice(rate, true)}/h`;
};

// Compatibilité avec l'ancien code
export const CURRENCY = {
    get symbol() {
        const currency = AVAILABLE_CURRENCIES.find(c => c.code === CURRENCY_CONFIG.code);
        return currency?.symbol || '€';
    },
    get code() { return CURRENCY_CONFIG.code; },
    get name() {
        const currency = AVAILABLE_CURRENCIES.find(c => c.code === CURRENCY_CONFIG.code);
        return currency?.name || 'Euro';
    },
};

export default {
    CURRENCY,
    AVAILABLE_CURRENCIES,
    getCurrency,
    setCurrency,
    loadCurrency,
    formatPrice,
    formatHourlyRate,
};
