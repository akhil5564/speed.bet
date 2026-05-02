import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal, Text } from 'react-native';
import { useLoading } from '../context/LoadingContext';

const Throbber = () => {
    const { loading } = useLoading();

    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={loading}
            onRequestClose={() => { }}
        >
            <View style={styles.container}>
                <View style={styles.loaderBox}>
                    <ActivityIndicator size="large" color="#1e1e1eff" />
                    {/* <Text style={styles.loadingText}>Loading...</Text> */}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    loaderBox: {
        backgroundColor: '#fff',
        padding: 25,
        borderRadius: 15,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
});

export default Throbber;
