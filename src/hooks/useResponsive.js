import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

/**
 * Hook responsive pour React Native Web
 * Fix le probleme de Dimensions.get('window') qui ne reagit pas au resize sur web
 * 
 * Usage:
 * const { width, height, isMobile, isTablet, isDesktop } = useResponsive();
 */
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    // Sur web, ecouter les changements de taille
    if (Platform.OS === 'web') {
      const handleResize = () => {
        setDimensions(Dimensions.get('window'));
      };

      window.addEventListener('resize', handleResize);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    // Sur mobile, ecouter aussi mais moins important
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  // Breakpoints mobiles standards
  const isMobile = dimensions.width < 768;
  const isTablet = dimensions.width >= 768 && dimensions.width < 1024;
  const isDesktop = dimensions.width >= 1024;

  // Breakpoints specifiques
  const isSmallPhone = dimensions.width < 375; // iPhone SE
  const isPhone = dimensions.width < 480;
  const isLargePhone = dimensions.width >= 480 && dimensions.width < 768; // iPhone Pro Max

  return {
    width: dimensions.width,
    height: dimensions.height,
    isMobile,
    isTablet,
    isDesktop,
    isSmallPhone,
    isPhone,
    isLargePhone,
    
    // Padding responsive
    padding: isMobile ? 16 : isTablet ? 24 : 32,
    paddingHorizontal: isMobile ? 16 : isTablet ? 24 : 32,
    
    // Font sizes responsive
    fontSize: {
      xs: isMobile ? 10 : 12,
      sm: isMobile ? 12 : 14,
      md: isMobile ? 14 : 16,
      lg: isMobile ? 16 : 18,
      xl: isMobile ? 18 : 20,
      xxl: isMobile ? 24 : 32,
    },
    
    // Grid columns
    columns: isMobile ? 1 : isTablet ? 2 : 3,
  };
};

/**
 * Hook pour detecter si on est sur mobile (usecase simple)
 */
export const useIsMobile = () => {
  const { isMobile } = useResponsive();
  return isMobile;
};

/**
 * Fonction utilitaire pour styles conditionnels
 * Usage: style={responsive(mobileStyle, tabletStyle, desktopStyle)}
 */
export const responsive = (mobileValue, tabletValue, desktopValue) => {
  const { isMobile, isTablet } = useResponsive();
  
  if (isMobile) return mobileValue;
  if (isTablet) return tabletValue ?? mobileValue;
  return desktopValue ?? tabletValue ?? mobileValue;
};
