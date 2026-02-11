import { useState, useCallback } from 'react';

/**
 * Hook useAlert - Facilite l'utilisation d'AlertDialog
 * 
 * Usage:
 * const { AlertComponent, showAlert } = useAlert();
 * 
 * showAlert({
 *   title: 'Erreur',
 *   message: 'Message d\'erreur',
 *   type: 'error',
 *   buttons: [
 *     { text: 'Annuler', style: 'cancel' },
 *     { text: 'OK', onPress: () => console.log('OK') }
 *   ]
 * });
 * 
 * return (
 *   <View>
 *     {AlertComponent}
 *   </View>
 * );
 */
export const useAlert = () => {
  const [alertConfig, setAlertConfig] = useState({
    isVisible: false,
    title: '',
    message: '',
    type: 'default',
    buttons: [],
  });

  const showAlert = useCallback((config) => {
    setAlertConfig({
      isVisible: true,
      title: config.title || '',
      message: config.message || '',
      type: config.type || 'default',
      buttons: config.buttons || [],
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  // Import dynamique pour eviter les problemes de dependance circulaire
  const AlertDialog = require('../components/ui/AlertDialog').default;

  const AlertComponent = (
    <AlertDialog
      isVisible={alertConfig.isVisible}
      onClose={hideAlert}
      title={alertConfig.title}
      message={alertConfig.message}
      type={alertConfig.type}
      buttons={alertConfig.buttons}
    />
  );

  return {
    AlertComponent,
    showAlert,
    hideAlert,
  };
};

export default useAlert;
