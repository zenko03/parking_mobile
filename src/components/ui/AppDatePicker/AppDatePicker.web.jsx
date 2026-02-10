import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { colors } from '../../../theme';

const AppDatePicker = ({ open, date, onConfirm, onCancel, title, minimumDate }) => {
    const [internalDate, setInternalDate] = useState('');

    // Formatter la date pour l'input datetime-local (YYYY-MM-DDThh:mm)
    useEffect(() => {
        if (date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            setInternalDate(`${year}-${month}-${day}T${hours}:${minutes}`);
        }
    }, [date, open]);

    const handleConfirm = () => {
        if (internalDate) {
            onConfirm(new Date(internalDate));
        } else {
            onCancel();
        }
    };

    const minDateStr = minimumDate ? (() => {
        const d = minimumDate;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    })() : '';

    if (!open) return null;

    return (
        <Modal
            transparent={true}
            visible={open}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>{title || 'Sélectionner une date'}</Text>

                    <input
                        type="datetime-local"
                        value={internalDate}
                        min={minDateStr}
                        onChange={(e) => setInternalDate(e.target.value)}
                        style={{
                            padding: '12px',
                            fontSize: '16px',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            width: '100%',
                            marginBottom: '20px',
                            fontFamily: 'Poppins, sans-serif',
                            outline: 'none'
                        }}
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity onPress={onCancel} style={[styles.button, styles.cancelButton]}>
                            <Text style={styles.cancelText}>Annuler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleConfirm} style={[styles.button, styles.confirmButton]}>
                            <Text style={styles.confirmText}>Confirmer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
        fontFamily: 'Poppins',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    confirmButton: {
        backgroundColor: '#A4E66E',
    },
    cancelText: {
        color: '#666',
        fontWeight: '600',
    },
    confirmText: {
        color: '#2C5F2D',
        fontWeight: '600',
    },
});

export default AppDatePicker;
