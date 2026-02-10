/**
 * Configuration des constantes de l'application
 * Fichier centralisé pour les valeurs globales
 */

/**
 * Configuration de la devise
 * Modifier ici pour changer la devise dans toute l'app
 */
export const CURRENCY = {
    symbol: '€',           // Symbole affiché
    code: 'EUR',           // Code ISO
    name: 'Euro',          // Nom complet
    position: 'after',     // 'before' = $10, 'after' = 10€
};

/**
 * Formater un montant avec la devise
 * @param {number} amount - Montant à formater
 * @param {boolean} showDecimals - Afficher les décimales (défaut: true)
 * @returns {string} Montant formaté avec devise
 */
export const formatPrice = (amount, showDecimals = true) => {
    // Parser en nombre si c'est une string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const safeAmount = isNaN(numAmount) ? 0 : numAmount;
    
    const formattedAmount = showDecimals
        ? safeAmount.toFixed(2)
        : Math.round(safeAmount).toString();

    if (CURRENCY.position === 'before') {
        return `${CURRENCY.symbol}${formattedAmount}`;
    }
    return `${formattedAmount}${CURRENCY.symbol}`;
};

/**
 * Formater un prix horaire
 * @param {number} rate - Tarif horaire
 * @returns {string} Prix formaté avec "/h"
 */
export const formatHourlyRate = (rate) => {
    return `${formatPrice(rate, true)}/h`;
};

export default {
    CURRENCY,
    formatPrice,
    formatHourlyRate,
};
