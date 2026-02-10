import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Vibration } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../components/ui/Header/Header';
import Footer from '../../../components/ui/Footer/Footer';
import { colors } from '../../../theme';
import { Html5Qrcode } from 'html5-qrcode';
import { qrcodeService } from '../../../services';

// Web component for QR Scanner using html5-qrcode
export default function QRCodeScanner() {
    const navigation = useNavigation();
    const [scannerLoading, setScannerLoading] = useState(true);
    const [validating, setValidating] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    // Valider le QR Code scanné (logique identique au mobile)
    const handleQRCodeScanned = useCallback(async (qrToken) => {
        if (!qrToken || validating) return;

        try {
            setValidating(true);

            // Arrêter le scanner pendant la validation
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                await html5QrCodeRef.current.stop();
            }

            console.log('[QR Web] Scanned:', qrToken);

            // Vérifier le format du token
            if (!qrToken.startsWith('RES-')) {
                throw new Error('QR Code invalide. Format attendu: RES-XXX-...');
            }

            // Valider le QR Code via l'API
            const result = await qrcodeService.validateQR(qrToken);

            alert(`QR Code validé !\n\nRéservation validée avec succès.\nParking: ${result.reservation?.parking?.name || 'N/A'}\nClient: ${result.reservation?.user?.firstName || 'N/A'}`);

            setValidating(false);
            // Relancer le scanner si l'utilisateur veut scanner à nouveau
            startScanner();

        } catch (error) {
            console.error('[QR Web] Validation error:', error);
            alert(`Erreur de validation: ${error.message || 'Impossible de valider ce QR Code'}`);
            setValidating(false);
            startScanner();
        }
    }, [validating]);

    const startScanner = async () => {
        try {
            if (!html5QrCodeRef.current) {
                html5QrCodeRef.current = new Html5Qrcode("reader");
            }

            const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };

            await html5QrCodeRef.current.start(
                { facingMode: "environment" },
                qrConfig,
                (decodedText) => {
                    handleQRCodeScanned(decodedText);
                },
                (errorMessage) => {
                    // Ignorer les erreurs de scan (quand aucun code n'est trouvé dans le flux)
                }
            );

            setHasPermission(true);
            setScannerLoading(false);
        } catch (err) {
            console.error("[QR Web] Start error:", err);
            setHasPermission(false);
            setScannerLoading(false);
        }
    };

    useEffect(() => {
        // Un délai court pour s'assurer que le DOM est prêt
        const timer = setTimeout(() => {
            startScanner();
        }, 500);

        return () => {
            clearTimeout(timer);
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(err => console.error("[QR Web] Stop error:", err));
            }
        };
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Header navigation={navigation} />
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Scanner QR Code</Text>

                <View style={styles.scannerWrapper}>
                    <View nativeID="reader" style={styles.readerElement} />

                    {scannerLoading && (
                        <View style={styles.overlay}>
                            <ActivityIndicator size="large" color={colors.primary.green} />
                            <Text style={styles.overlayText}>Initialisation caméra...</Text>
                        </View>
                    )}

                    {validating && (
                        <View style={styles.overlay}>
                            <ActivityIndicator size="large" color={colors.primary.green} />
                            <Text style={styles.overlayText}>Validation en cours...</Text>
                        </View>
                    )}

                    {hasPermission === false && (
                        <View style={styles.overlay}>
                            <Text style={styles.errorText}>Accès caméra refusé ou non supporté</Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={startScanner}
                            >
                                <Text style={styles.retryText}>Réessayer</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.instructions}>
                    <Text style={styles.instructionText}>Placez le QR Code dans le cadre pour le scanner</Text>
                </View>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>

            <Footer navigation={navigation} activeRoute="Scanner" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.white,
    },
    headerContainer: {
        zIndex: 10,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f9fa'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.black,
        marginBottom: 20,
    },
    scannerWrapper: {
        width: '100%',
        maxWidth: 500,
        aspectRatio: 1,
        backgroundColor: '#000',
        borderRadius: 15,
        overflow: 'hidden',
        position: 'relative',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    readerElement: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    overlayText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16
    },
    errorText: {
        color: '#ff4d4d',
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 20
    },
    retryButton: {
        backgroundColor: colors.primary.green,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    instructions: {
        marginTop: 30,
        padding: 15,
        backgroundColor: '#e9ecef',
        borderRadius: 10,
        width: '100%',
        maxWidth: 500
    },
    instructionText: {
        textAlign: 'center',
        color: '#495057',
        fontSize: 14
    },
    backButton: {
        marginTop: 30,
        paddingHorizontal: 40,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dee2e6'
    },
    backButtonText: {
        color: '#495057',
        fontSize: 16,
        fontWeight: '600',
    },
});
