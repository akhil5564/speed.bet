import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import { Domain } from './NetPayScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Entry = {
  _id: string;
  number: string;
  count: number;
  type: string;
  timeOver?: number;
};

type BillMeta = {
  createdBy: string;
  billNo: number;
  timeLabel: string;
  timeCode: string;
  createdAt: string;
};

const ViewBillScreen = () => {
  const route = useRoute<any>();
  const billId = route.params?.billId;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [billMeta, setBillMeta] = useState<BillMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCount, setEditingCount] = useState<string>('');
  const [storedUsertype, setStoredUsertype] = useState<string | null>(null);
  useEffect(() => {
    const storedUsertype = async () => {
      const storedUsertype = await AsyncStorage.getItem('usertype');
      setStoredUsertype(storedUsertype);
    }
    storedUsertype();
  }, []);

  const sortEntries = (entries: Entry[]) => {
    return [...entries].sort((a, b) => {
      if (a.type.toLowerCase() < b.type.toLowerCase()) return -1;
      if (a.type.toLowerCase() > b.type.toLowerCase()) return 1;
      if (a.count > b.count) return -1;
      if (a.count < b.count) return 1;
      if (a.number < b.number) return -1;
      if (a.number > b.number) return 1;
      return 0;
    });
  };

  const fetchBill = async () => {
    try {
      const storedUsertype = await AsyncStorage.getItem('usertype');
      const response = await axios.get(`${Domain}/get-entries-with-timeblock`, {
        params: {
          billNo: billId,
          usertype: storedUsertype || ''
        }
      });

      const data = response.data;

      if (!Array.isArray(data) || data.length === 0) {
        alert('⚠️ No data found for this bill number.');
        return;
      }

      const parsedEntries = data.map((entry: any) => ({
        _id: entry._id || String(Math.random()),
        number: entry.num || entry.number || '',
        count: entry.cnt || entry.count || 0,
        type: entry.type || '',
      }));

      setEntries(sortEntries(parsedEntries));

      setBillMeta({
        createdBy: data[0].createdBy || '',
        billNo: data[0].billNo || '',
        timeLabel: data[0].timeLabel || '',
        timeCode: data[0].timeCode || '',
        createdAt: data[0].createdAt || '',
      });
    } catch (error: any) {
      console.error('❌ Network Error:', error);
      alert('❌ Failed to fetch bill data. ' + (error.response?.data?.message || 'Try again later.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBill();
  }, []);

  const startEditing = (id: string, currentCount: number) => {
    setEditingId(id);
    setEditingCount(String(currentCount));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingCount('');
  };

  const saveCountEdit = async (id: string) => {
    const newCount = parseInt(editingCount);
    if (isNaN(newCount) || newCount < 0) {
      alert('Please enter a valid count');
      return;
    }

    try {
      const res = await axios.put(`${Domain}/updateEntryCount/${id}`, {
        count: newCount,
        userType: storedUsertype
      });

      if (res.status === 200) {
        setEntries((prev) =>
          sortEntries(
            prev.map((entry) =>
              entry._id === id ? { ...entry, count: newCount } : entry
            )
          )
        );
        cancelEditing();
        alert('Count updated successfully');
      } else {
        alert(res.data.message || 'Failed to update count');
      }
    } catch (error: any) {
      console.error('❌ Error updating count:', error);
      alert(error.response?.data?.message || 'Error saving changes');
    }
  };

  const confirmDeleteEntry = (id: string) => {
    Alert.alert('Confirm Delete', 'Delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteEntryById(id),
      },
    ]);
  };

  const deleteEntryById = async (id: string) => {
    try {
      const res = await axios.delete(`${Domain}/deleteEntryById/${id}/${storedUsertype}`);

      if (res.status === 200) {
        setEntries((prev) => prev.filter((entry) => entry._id !== id));
        alert('Deleted entry successfully');
      } else {
        alert(res.data.message || 'Failed to delete entry');
      }
    } catch (error: any) {
      console.error('❌ Delete entry error:', error);
      alert(error.response?.data?.message || 'Error deleting entry');
    }
  };

  const renderItem = ({ item }: { item: Entry }) => {
    const isEditing = editingId === item._id;

    let bgColor = '#fff';
    if (item.type.toLowerCase() === 'super') bgColor = '#fdebd0';
    else if (item.type.toLowerCase() === 'box') bgColor = '#d1f2eb';
    else if (item.type.toLowerCase() === 'single') bgColor = '#f9e79f';
    else if (item.type.toLowerCase() === 'double') bgColor = '#fadbd8';

    return (
      <View style={[styles.entryRow, { backgroundColor: bgColor }]}>
        <Text style={[styles.cell, styles.typeCell]}>{item.type}</Text>
        <Text style={[styles.cell, styles.numberCell]}>{item.number}</Text>

        {isEditing ? (
          <TextInput
            style={[styles.cell, styles.editInput, styles.countCell]}
            value={editingCount}
            onChangeText={setEditingCount}
            keyboardType="numeric"
          />
        ) : (
          <Text style={[styles.cell, styles.countCell]}>{item.count}</Text>
        )}

        <View style={[styles.actionButtons, styles.actionsCell]}>
          {isEditing ? (
            <>
              <TouchableOpacity onPress={() => saveCountEdit(item._id)} style={styles.iconBtn}>
                <Ionicons name="checkmark" size={24} color="green" />
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelEditing} style={styles.iconBtn}>
                <Ionicons name="close" size={24} color="red" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => startEditing(item._id, item.count)} style={styles.iconBtn}>
                <Ionicons name="pencil" size={22} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDeleteEntry(item._id)} style={styles.iconBtn}>
                <Ionicons name="trash" size={22} color="red" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f85a8f" />
        <Text style={{ marginTop: 10 }}>Loading Bill #{billId}...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {billMeta && (
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>🧾 Bill No: {billMeta.billNo}</Text>
          <Text style={styles.metaText}>Created By: {billMeta.createdBy}</Text>
          <Text style={styles.metaText}>Time: {billMeta.timeLabel}</Text>
        </View>
      )}

      <View style={styles.tableHeader}>
        <Text style={[styles.cell, styles.header, styles.typeCell]}>Type</Text>
        <Text style={[styles.cell, styles.header, styles.numberCell]}>Number</Text>
        <Text style={[styles.cell, styles.header, styles.countCell]}>Count</Text>
        <Text style={[styles.cell, styles.header, styles.actionsCell]}>Actions</Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    marginTop: 40,
  },
  metaContainer: {
    marginBottom: 16,
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f85a8f',
  },
  metaText: {
    fontSize: 15,
    marginBottom: 4,
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 6,
    borderBottomWidth: 2,
    paddingBottom: 8,
    borderColor: '#f85a8f',
    backgroundColor: '#fef0f3',
    borderRadius: 6,
  },
  entryRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    alignItems: 'center',
    borderRadius: 6,
    marginVertical: 2,
    elevation: 1,
  },
  cell: {
    textAlign: 'center',
    fontSize: 15,
    color: '#000',
    paddingHorizontal: 8,
  },
  header: {
    fontWeight: 'bold',
    color: '#d6336c',
  },
  editInput: {
    borderBottomWidth: 2,
    borderColor: '#d6336c',
    color: '#000',
    paddingVertical: 0,
    paddingHorizontal: 6,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  iconBtn: {
    marginHorizontal: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeCell: {
    flex: 2,
    fontWeight: 'bold',
  },
  numberCell: {
    flex: 1.7,
    fontWeight: 'bold',
  },
  countCell: {
    flex: 1.3,
    fontWeight: 'bold',
  },
  actionsCell: {
    flex: 1.7,
  },
});

export default ViewBillScreen;