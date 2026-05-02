import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Modal,
    TextInput,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Domain } from './NetPayScreen';

const { width } = Dimensions.get('window');

interface LimitRecord {
    _id: string;
    toUser: string;
    fromUser: string;
    amount: number;
    drawTime: string;
    date: string;
}

function CreditLimitScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = (route.params as any) || {};

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState('DEAR 1 PM');
    const [limit, setLimit] = useState('');
    const [limits, setLimits] = useState<LimitRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState('');

    const ticketOptions = [
        'All',
        'DEAR 1 PM',
        'KERALA 3 PM',
        'DEAR 6 PM',
        'DEAR 8 PM',
    ];

    useEffect(() => {
        const loadUser = async () => {
            const username = await AsyncStorage.getItem('username');
            if (username) setLoggedInUser(username);
        };
        loadUser();
    }, []);

    const fetchLimits = useCallback(async () => {
        if (!user?.username) return;
        setLoading(true);
        try {
            const resp = await axios.get(`${Domain}/get-amount`, {
                params: { toUser: user.username }
            });
            if (resp.data && resp.data.data) {
                setLimits(resp.data.data);
            }
        } catch (error) {
            console.error('Fetch limits error:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.username]);

    useEffect(() => {
        fetchLimits();
    }, [fetchLimits]);

    const handleSave = async () => {
        if (!limit || isNaN(Number(limit))) {
            Alert.alert('Error', 'Please enter a valid numeric limit');
            return;
        }

        setIsSaving(true);
        try {
            const response = await axios.post(`${Domain}/add-amount`, {
                fromUser: loggedInUser,
                toUser: user.username,
                amount: Number(limit),
                drawTime: selectedTicket
            });

            if (response.status === 200 || response.status === 201) {
                Alert.alert('Success', 'Credit limit set successfully');
                setModalVisible(false);
                setLimit('');
                fetchLimits();
            } else {
                Alert.alert('Error', response.data.message || 'Failed to save limit');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Network error');
            console.error('Save limit error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this credit limit?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const resp = await axios.delete(`${Domain}/user-amount/${id}`);
                            if (resp.status === 200) {
                                fetchLimits();
                            } else {
                                Alert.alert('Error', 'Failed to delete limit');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Network error');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (item: LimitRecord) => {
        setSelectedTicket(item.drawTime);
        setLimit(item.amount.toString());
        setModalVisible(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Credit Limit - {user?.username}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Add New Section */}
                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.addNewButton}
                        onPress={() => {
                            setLimit('');
                            setModalVisible(true);
                        }}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#fff" />
                        <Text style={styles.addNewText}>Add New Limit</Text>
                    </TouchableOpacity>
                </View>

                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <View style={[styles.headerCell, { flex: 0.8 }]}>
                        <Text style={styles.headerText}>#</Text>
                    </View>
                    <View style={[styles.headerCell, { flex: 2, borderLeftWidth: 1, borderLeftColor: '#fff', borderRightWidth: 1, borderRightColor: '#fff' }]}>
                        <Text style={styles.headerText}>TICKET</Text>
                    </View>
                    <View style={[styles.headerCell, { flex: 1.5 }]}>
                        <Text style={styles.headerText}>LIMIT</Text>
                    </View>
                    <View style={[styles.headerCell, { flex: 1.2 }]}>
                        <Text style={styles.headerText}>ACTION</Text>
                    </View>
                </View>

                {/* Limits List */}
                {loading ? (
                    <ActivityIndicator size="large" color="#0a6358" style={{ marginTop: 20 }} />
                ) : limits.length > 0 ? (
                    limits.map((item, index) => (
                        <View key={item._id} style={styles.tableRow}>
                            <View style={[styles.cell, { flex: 0.8 }]}>
                                <Text style={styles.cellText}>{index + 1}</Text>
                            </View>
                            <View style={[styles.cell, { flex: 2, borderLeftWidth: 1, borderLeftColor: '#eee', borderRightWidth: 1, borderRightColor: '#eee' }]}>
                                <Text style={styles.cellText}>{item.drawTime}</Text>
                            </View>
                            <View style={[styles.cell, { flex: 1.5 }]}>
                                <Text style={[styles.cellText, { fontWeight: 'bold' }]}>{item.amount}</Text>
                            </View>
                            <View style={[styles.cell, { flex: 1.2, flexDirection: 'row', justifyContent: 'space-around' }]}>
                                <TouchableOpacity onPress={() => handleEdit(item)}>
                                    <Ionicons name="create-outline" size={20} color="#0a6358" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item._id)}>
                                    <Ionicons name="trash-outline" size={20} color="#d81223" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No limits set for this user</Text>
                    </View>
                )}
            </ScrollView>

            {/* Add New Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Set Credit Limit</Text>
                                </View>

                                <View style={styles.modalBody}>
                                    <Text style={styles.inputLabel}>Ticket / Time</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectedTicket}
                                            onValueChange={(itemValue) => setSelectedTicket(itemValue)}
                                            style={styles.picker}
                                            dropdownIconColor="#666"
                                        >
                                            {ticketOptions.map((ticket) => (
                                                <Picker.Item key={ticket} label={ticket} value={ticket} />
                                            ))}
                                        </Picker>
                                    </View>

                                    <Text style={styles.inputLabel}>Amount Limit</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={limit}
                                        onChangeText={setLimit}
                                        keyboardType="numeric"
                                        placeholder="Enter amount"
                                        placeholderTextColor="#ccc"
                                        autoFocus
                                    />
                                    <View style={styles.inputUnderline} />
                                </View>

                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        style={[styles.footerButton, styles.saveButton, isSaving && { opacity: 0.7 }]}
                                        onPress={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.footerButtonText}>Save</Text>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.footerButton, styles.cancelButton]}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={styles.footerButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        marginTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        elevation: 2,
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        flex: 1,
        textAlign: 'center',
    },
    scrollContent: {
        paddingVertical: 10,
        paddingLeft: 10,
        paddingRight: 10,
    },
    card: {
        backgroundColor: '#fff',
        margin: 10,
        padding: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    addNewButton: {
        backgroundColor: '#0a6358',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 5,
    },
    addNewText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#d81223',
        marginTop: 10,
        paddingVertical: 12,
    },
    tableRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 10,
    },
    headerCell: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cellText: {
        fontSize: 14,
        color: '#333',
    },
    emptyContainer: {
        marginTop: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.9,
        backgroundColor: '#fff',
        borderRadius: 4,
        overflow: 'hidden',
    },
    modalHeader: {
        backgroundColor: '#0a6358',
        paddingVertical: 15,
        alignItems: 'center',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 20,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        marginBottom: 20,
        height: 50,
        justifyContent: 'center',
    },
    picker: {
        width: '100%',
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        fontSize: 18,
        color: '#000',
        paddingVertical: 5,
    },
    inputUnderline: {
        height: 1,
        backgroundColor: '#666',
        marginTop: 2,
    },
    modalFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    footerButton: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    saveButton: {
        backgroundColor: '#0a6358',
    },
    cancelButton: {
        backgroundColor: '#999',
        borderLeftWidth: 1,
        borderLeftColor: '#fff',
    },
});

export default CreditLimitScreen;
