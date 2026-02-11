import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { colors } from '../../theme';

/**
 * AlertDialog - Composant d'alerte universel compatible mobile ET web
 * Remplace Alert.alert() qui ne fonctionne pas sur React Native Web
 */
const AlertDialog = ({ 
  isVisible, 
  onClose, 
  title, 
  message, 
  buttons = [],
  type = 'default' // 'default', 'success', 'error', 'warning'
}) => {
  // Icone selon le type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  // Couleur selon le type
  const getColor = () => {
    switch (type) {
      case 'success':
        return '#10B981'; // Vert
      case 'error':
        return '#EF4444'; // Rouge
      case 'warning':
        return '#F59E0B'; // Orange
      default:
        return colors.primary.main; // Bleu
    }
  };

  // Si pas de boutons, ajouter un bouton OK par defaut
  const finalButtons = buttons.length > 0 ? buttons : [
    { text: 'OK', onPress: onClose, style: 'default' }
  ];

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="zoomIn"
      animationOut="zoomOut"
      backdropOpacity={0.5}
      useNativeDriver
      hideModalContentWhileAnimating
    >
      <View style={styles.container}>
        {/* Icone */}
        <View style={[styles.iconContainer, { backgroundColor: getColor() + '20' }]}>
          <Text style={[styles.icon, { color: getColor() }]}>{getIcon()}</Text>
        </View>

        {/* Titre */}
        {title && <Text style={styles.title}>{title}</Text>}

        {/* Message */}
        {message && <Text style={styles.message}>{message}</Text>}

        {/* Boutons */}
        <View style={styles.buttonsContainer}>
          {finalButtons.map((button, index) => {
            const isCancel = button.style === 'cancel';
            const isDestructive = button.style === 'destructive';

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  finalButtons.length === 1 && styles.buttonSingle,
                  isCancel && styles.buttonCancel,
                  isDestructive && styles.buttonDestructive,
                ]}
                onPress={() => {
                  if (button.onPress) {
                    button.onPress();
                  }
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    isCancel && styles.buttonTextCancel,
                    isDestructive && styles.buttonTextDestructive,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSingle: {
    minWidth: 120,
  },
  buttonCancel: {
    backgroundColor: '#F3F4F6',
  },
  buttonDestructive: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextCancel: {
    color: '#6B7280',
  },
  buttonTextDestructive: {
    color: '#fff',
  },
});

export default AlertDialog;
