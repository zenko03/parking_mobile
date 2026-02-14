import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AVAILABLE_CURRENCIES, getCurrency, setCurrency } from '../../config/constants';
import { useAlert } from '../../hooks/useAlert';
import { colors } from '../../theme';

/**
 * Composant pour sélectionner la devise de l'application
 * Intégré dans l'écran Mon Compte
 */
const CurrencySelector = () => {
  const { AlertComponent, showAlert } = useAlert();
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');

  useEffect(() => {
    // Charger la devise actuelle
    const current = getCurrency();
    setSelectedCurrency(current.code);
  }, []);

  const handleCurrencyChange = async (currencyCode) => {
    try {
      await setCurrency(currencyCode);
      setSelectedCurrency(currencyCode);
      
      const selectedCurrencyData = AVAILABLE_CURRENCIES.find(c => c.code === currencyCode);
      
      showAlert({
        title: 'Devise modifiée',
        message: `Votre devise préférée est maintenant : ${selectedCurrencyData?.name} (${currencyCode})`,
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Erreur',
        message: 'Impossible de modifier la devise',
        type: 'error',
      });
    }
  };

  return (
    <View style={styles.container}>
      {AVAILABLE_CURRENCIES.map((currency) => {
        const isSelected = selectedCurrency === currency.code;
        
        return (
          <TouchableOpacity
            key={currency.code}
            style={[
              styles.currencyOption,
              isSelected && styles.selectedOption,
            ]}
            onPress={() => handleCurrencyChange(currency.code)}
            activeOpacity={0.7}
          >
            <View style={styles.currencyInfo}>
              <View style={[
                styles.symbolContainer,
                isSelected && styles.symbolContainerSelected,
              ]}>
                <Text style={[
                  styles.currencySymbol,
                  isSelected && styles.currencySymbolSelected,
                ]}>
                  {currency.symbol}
                </Text>
              </View>
              
              <View style={styles.currencyDetails}>
                <Text style={styles.currencyName}>{currency.name}</Text>
                <Text style={styles.currencyCode}>{currency.code}</Text>
              </View>
            </View>
            
            {isSelected && (
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark" size={20} color={colors.text.darkGreen} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {AlertComponent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Pas de padding car déjà dans MyAccount
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedOption: {
    borderColor: colors.primary.bright,
    borderWidth: 2,
    backgroundColor: colors.primary.pale,
    shadowColor: colors.primary.bright,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  symbolContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  symbolContainerSelected: {
    backgroundColor: colors.primary.bright,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary.bright,
  },
  currencySymbolSelected: {
    color: colors.text.darkGreen,
  },
  currencyDetails: {
    flex: 1,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.gray.slate.darker,
    marginBottom: 4,
  },
  currencyCode: {
    fontSize: 13,
    color: colors.text.gray.slate.medium,
  },
  checkmarkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.bright,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.bright,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default CurrencySelector;
