import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/apiClient';
import { ActivityIndicator, Alert } from 'react-native';
import { clearSchemeCache } from '../utils/schemeUtils';
import { useLoading } from '../context/LoadingContext';

/* ================= DATA ================= */

// ONLY CHANGE: initialSchemeData (rest same as your code)

const initialSchemeData: { group: string; rows: any[] }[] = [
  {
    group: 'Group 1',
    rows: [
      { scheme: 'A', pos: 1, count: 1, amount: 100, super: 0 },
      { scheme: 'B', pos: 1, count: 1, amount: 100, super: 0 },
      { scheme: 'C', pos: 1, count: 1, amount: 100, super: 0 },
    ],
  },
  {
    group: 'Group 2',
    rows: [
      { scheme: 'AB', pos: 1, count: 1, amount: 700, super: 30 },
      { scheme: 'BC', pos: 1, count: 1, amount: 700, super: 30 },
      { scheme: 'AC', pos: 1, count: 1, amount: 700, super: 30 },
    ],
  },

  // 🔥 GROUP 3 SUPER
  {
    group: 'Group 3-SUPER',
    rows: [
      { scheme: 'SUPER', pos: 1, count: 1, amount: 5000, super: 500 },
      { scheme: 'SUPER', pos: 2, count: 1, amount: 500, super: 50 },
      { scheme: 'SUPER', pos: 3, count: 1, amount: 250, super: 20 },
      { scheme: 'SUPER', pos: 4, count: 1, amount: 100, super: 20 },
      { scheme: 'SUPER', pos: 5, count: 1, amount: 50, super: 20 },
      { scheme: 'SUPER', pos: 6, count: 1, amount: 20, super: 10 },
    ],
  },

  // 🔥 NORMAL BOX
  {
    group: 'Group 3-BOX',
    rows: [
      { scheme: 'BOX', pos: 1, count: 1, amount: 3000, super: 300 },
      { scheme: 'BOX', pos: 2, count: 1, amount: 800, super: 30 },
      { scheme: 'BOX', pos: 3, count: 1, amount: 800, super: 30 },
      { scheme: 'BOX', pos: 4, count: 1, amount: 800, super: 30 },
      { scheme: 'BOX', pos: 5, count: 1, amount: 800, super: 30 },
      { scheme: 'BOX', pos: 6, count: 1, amount: 800, super: 30 },
    ],
  },

  // 🔥 NEW: DOUBLE NUMBER BOX (like 112, 121, 211)
  {
    group: 'Group 3-DOUBLE-BOX',
    rows: [
      { scheme: 'DBOX', pos: 1, count: 1, amount: 3800, super: 330 },
      { scheme: 'DBOX', pos: 2, count: 1, amount: 1600, super: 60 },
      { scheme: 'DBOX', pos: 3, count: 1, amount: 1600, super: 60 },
      { scheme: 'DBOX', pos: 4, count: 1, amount: 1600, super: 60 },
      { scheme: 'DBOX', pos: 5, count: 1, amount: 1600, super: 60 },
      { scheme: 'DBOX', pos: 6, count: 1, amount: 1600, super: 60 },
    ],
  },

  // 🔥 NEW: TRIPLE SAME NUMBER (111, 222)
  {
    group: 'Group 3-TRIPLE-BOX',
    rows: [
      { scheme: 'TRIPLE', pos: 1, count: 1, amount: 7000, super: 450 },
    ],
  },
];
const OFFICIAL_DRAWS = ['DEAR 1 PM', 'LSK 3 PM', 'DEAR 6 PM', 'DEAR 8 PM'];

/* ================= SCREEN ================= */

export default function SchemeScreen() {
  const [activeTab, setActiveTab] = useState(1);
  const [draw, setDraw] = useState('DEAR 1 PM');
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [schemeData, setSchemeData] = useState(initialSchemeData);
  const [tabs, setTabs] = useState([1, 2, 3, 4, 5]);
  const { showLoading, hideLoading } = useLoading();


  // Helper to transform flat backend data to grouped frontend data
  const regroupData = (inputData: any) => {
    // 1. Validation & Extraction
    if (!inputData) return null;

    // Support various wrappers like { data: [...] } or { draw: { schemes: [...] } }
    let rawList =
      Array.isArray(inputData) ? inputData :
        (inputData.draw?.schemes || inputData.schemes || inputData.data?.draw?.schemes || inputData.data?.schemes || inputData.data || null);

    if (!rawList || !Array.isArray(rawList)) {
      return null;
    }

    // 2. Flatten if input is already grouped (to handle inconsistent backend formats)
    let flatData: any[] = [];
    rawList.forEach(item => {
      if (item && item.rows && Array.isArray(item.rows)) {
        // It's a group object like { group: '...', rows: [...] }
        item.rows.forEach((r: any) => {
          flatData.push({ ...r, group: item.group || r.group });
        });
      } else if (item && typeof item === 'object') {
        // It's already flat
        flatData.push(item);
      }
    });

    if (flatData.length === 0) return null;

    // 3. Regroup into the standard UI structure (Additive)
    const grouped = JSON.parse(JSON.stringify(initialSchemeData)); // Deep copy defaults

    flatData.forEach(item => {
      let groupIndex = grouped.findIndex((g: any) => g.group === item.group);

      if (groupIndex === -1 && item.group) {
        groupIndex = grouped.findIndex((g: any) =>
          item.group.toLowerCase().includes(g.group.toLowerCase()) ||
          g.group.toLowerCase().includes(item.group.toLowerCase())
        );
      }

if (item.scheme === 'BOX') groupIndex = 3;
if (item.scheme === 'DBOX') groupIndex = 4;
if (item.scheme === 'TRIPLE') groupIndex = 5;
      if (groupIndex !== -1) {
        const { group, ...row } = item;

        // 🔑 THE FIX: Update existing row if POS and SCHEME match, otherwise push new
        const existingRowIndex = grouped[groupIndex].rows.findIndex((r: any) => r.pos === row.pos && r.scheme === row.scheme);
        if (existingRowIndex !== -1) {
          grouped[groupIndex].rows[existingRowIndex] = {
            ...grouped[groupIndex].rows[existingRowIndex],
            ...row
          };
        } else if (row.scheme || row.pos) {
          grouped[groupIndex].rows.push(row);
        }
      }
    });

    // 4. Sort and Cleanup
    grouped.forEach((g: any) => {
      g.rows.sort((a: any, b: any) => (a.pos || 0) - (b.pos || 0));
    });

    // 4. Cleanup: If a group is empty, use defaults. If rows have no super, ensure 0
    return grouped.map((g, i) => {
      if (g.rows.length === 0) return initialSchemeData[i];
      return {
        ...g,
        rows: g.rows.map((r: any) => ({
          ...r,
          super: r.super !== undefined ? r.super : 0 // Ensure super is never undefined
        }))
      };
    });
  };


  const fetchScheme = async () => {
    showLoading();
    try {
      console.log(`Fetching scheme for activeTab: ${activeTab}, drawName: ${draw}`);
      const response = await apiClient.get(`/draw-scheme`, {
        params: { activeTab: activeTab, drawName: draw }
      });

      console.log('API Response Data:', response.data);
      const data = regroupData(response.data);
      if (data) {
        setSchemeData(data);
      } else {
        console.warn('RE-GROUP DATA FAILED: No schemes found in server response. Full Response:', JSON.stringify(response.data, null, 2));
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log('No scheme found for this tab/time, using defaults.');
        setSchemeData(initialSchemeData);
      } else {
        const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
        console.error('Error fetching scheme:', error);
        Alert.alert('Fetch Error', `Status: ${error.response?.status}\nMessage: ${errorMsg}`);
      }
    } finally {
      hideLoading();
    }
  };

  const fetchAvailableTabs = async () => {
    showLoading();
    try {
      const discoveredTabs = new Set<number>();

      // Check for tabs across ALL official draws simultaneously to unify them
      const probeTasks = OFFICIAL_DRAWS.flatMap(drawName =>
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(async (num) => {
          try {
            const res = await apiClient.get('/draw-scheme', {
              params: { activeTab: num, drawName }
            });
            if (res.data) return num;
          } catch (e) { }
          return null;
        })
      );

      const results = await Promise.all(probeTasks);
      results.forEach(r => {
        if (r !== null) discoveredTabs.add(r);
      });

      if (discoveredTabs.size > 0) {
        setTabs(Array.from(discoveredTabs).sort((a, b) => a - b));
      } else {
        setTabs([1, 2, 3, 4, 5]); // Default fallback
      }
    } catch (error) {
      console.error('Error discovering tabs:', error);
      setTabs([1, 2, 3, 4, 5]);
    } finally {
      hideLoading();
    }
  };

  React.useEffect(() => {
    const init = async () => {
      await fetchAvailableTabs();
      await fetchScheme();
    };
    init();
  }, [draw]);

  React.useEffect(() => {
    fetchScheme();
  }, [activeTab]);

  const saveScheme = async () => {
    showLoading();
    try {
      console.log('Saving grouped data:', schemeData);
      const response = await apiClient.post('/draw-scheme', {
        activeTab: activeTab,
        drawName: draw,
        schemes: schemeData, // Send grouped data directly
      });

      console.log('Save Response:', response.data);

      // Update local state with the returned data
      const savedData = response.data?.draw?.schemes || response.data?.data?.draw?.schemes || schemeData;
      const data = regroupData(savedData);
      if (data) {
        setSchemeData(data);
      }

      Alert.alert('Success', 'Scheme updated successfully');
      clearSchemeCache();
      setIsEdit(false);
    } catch (error: any) {
      console.error('Error saving scheme:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      Alert.alert('Save Error', `Status: ${error.response?.status}\nMessage: ${errorMsg}`);
    } finally {
      hideLoading();
    }
  };

  const updateSuperForDraw = async (gi: number, ri: number, value: number) => {
    // Optimistic update
    const copy = [...schemeData];
    copy[gi].rows[ri].super = value;
    setSchemeData(copy);

    try {
      const row = copy[gi].rows[ri] as any;
      const groupName = copy[gi].group;

      const payload = {
        activeTab,
        drawName: draw,
        updates: [{
          _id: row._id, // Send the database ID if it exists
          group: groupName,
          scheme: row.scheme,
          pos: row.pos,
          super: value,
        }]
      };

      console.log('PUTting super value. Payload:', JSON.stringify(payload, null, 2));
      const response = await apiClient.put('/draw-scheme/super', payload);
      console.log('Super update response:', response.status, response.data);
      clearSchemeCache();
    } catch (error: any) {
      console.error('Error updating super value:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      const status = error.response?.status;

      console.log(`Failed to update super. Status: ${status}, Message: ${errorMsg}`);

      Alert.alert(
        'Update Failed',
        `Backend returned error.\nStatus: ${status}\nMessage: ${errorMsg}\nCheck backend console logs.`
      );
    }
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [newGroup, setNewGroup] = useState(initialSchemeData[0].group);
  const [newRow, setNewRow] = useState({
    scheme: '',
    pos: '',
    count: '',
    amount: '',
    super: '',
  });

  const cloneSchemeWithZeroSuper = (data: typeof initialSchemeData) => {
    return data.map(group => ({
      ...group,
      rows: group.rows.map(row => ({
        ...row,
        super: 0,
        _id: undefined, // IMPORTANT: prevent DB overwrite
      })),
    }));
  };


  /* ================= HANDLERS ================= */

  const handleAddNewTab = async () => {
    const newTab = Math.max(...tabs) + 1;

    // Use initialSchemeData but reset IDs to ensure they are new entries
    const freshData = initialSchemeData.map(group => ({
      ...group,
      rows: group.rows.map(row => ({
        ...row,
        super: 0,
        _id: undefined,
      })),
    }));

    // Optimistically update UI
    setTabs(prev => [...prev, newTab]);
    setActiveTab(newTab);
    setSchemeData(freshData);
    setIsEdit(true);

    try {
      showLoading();
      // 🔥 Automatically save this new tab for ALL draws SEQUENTIALLY to avoid race conditions
      for (const drawName of OFFICIAL_DRAWS) {
        await apiClient.post('/draw-scheme', {
          activeTab: newTab,
          drawName,
          schemes: freshData,
        });
      }

      Alert.alert('Success', `New Scheme (Tab ${newTab}) initialized for all draw times.`);
    } catch (error) {
      console.error('Failed to create new tab for all draws', error);
      Alert.alert('Error', 'Failed to fully initialize new scheme across all draws. Please check backend logs.');
    } finally {
      hideLoading();
    }
  };


  const updateCell = (gi: number, ri: number, key: string, value: string) => {
    const copy = [...schemeData];
    if (key === 'super') {
      // Allow entering decimal but keep it as string/number safely
      (copy[gi].rows[ri] as any)[key] = value;
      setSchemeData(copy);

      if (!isEdit && value !== '' && !value.endsWith('.')) {
        updateSuperForDraw(gi, ri, Number(value));
      }
    } else {
      const numericValue = Number(value);
      (copy[gi].rows[ri] as any)[key] = key === 'scheme' ? value : numericValue;
      setSchemeData(copy);
    }
  };

  const addSchemeRow = () => {
    const copy = [...schemeData];
    const groupIndex = copy.findIndex(g => g.group === newGroup);

    if (groupIndex !== -1) {
      copy[groupIndex].rows.unshift({
        scheme: newRow.scheme,
        pos: Number(newRow.pos),
        count: Number(newRow.count),
        amount: Number(newRow.amount),
        super: Number(newRow.super),
      });
      setSchemeData(copy);
    }

    setModalVisible(false);
    setIsEdit(true); // auto enable edit
    setNewRow({ scheme: '', pos: '', count: '', amount: '', super: '' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>

        {/* HEADER */}
        <View style={styles.header}>
          <Ionicons name="arrow-back" size={22} />
          <Text style={styles.headerTitle}>Scheme</Text>
          <TouchableOpacity
            onPress={fetchScheme}
            style={{ marginLeft: 'auto', paddingHorizontal: 10 }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#e91e63" />
            ) : (
              <Ionicons name="refresh" size={22} color="#e91e63" />
            )}
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={styles.tabs}>
          {tabs.map(num => (
            <TouchableOpacity key={num} onPress={() => setActiveTab(num)}>
              <Text style={[styles.tabText, activeTab === num && styles.activeTabText]}>
                {num}
              </Text>
              {activeTab === num && <View style={styles.activeLine} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* DRAW + EDIT */}
        <View style={styles.topRow}>
          <View style={styles.pickerBox}>
            <Picker selectedValue={draw} onValueChange={setDraw} dropdownIconColor="#000" style={{ color: '#000' }}>
              {OFFICIAL_DRAWS.map(d => (
                <Picker.Item key={d} label={d} value={d} color="#000" />
              ))}
            </Picker>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              if (isEdit) {
                saveScheme();
              } else {
                setIsEdit(true);
              }
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.editText}>{isEdit ? 'Save' : 'Edit'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ADD SCHEME */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleAddNewTab}
        >
          <Text style={styles.addText}>+ Add Scheme</Text>
        </TouchableOpacity>

        {/* TABLE */}
        {loading && !isEdit ? (
          <ActivityIndicator size="large" color="#211e1f" style={{ marginTop: 20 }} />
        ) : (
          schemeData.map((group, gi) => (
            <View key={gi} style={styles.groupContainer}>
              <Text style={styles.groupTitle}>{group.group}</Text>

              <View style={styles.tableHeader}>
                <Text style={styles.th}>Scheme</Text>
                <Text style={styles.th}>Pos</Text>
                <Text style={styles.th}>Count</Text>
                <Text style={styles.th}>Amount</Text>
                <Text style={styles.th}>Super</Text>
              </View>

              {group.rows.map((row, ri) => (
                <View key={ri} style={styles.tableRow}>
                  {['scheme', 'pos', 'count', 'amount', 'super'].map(key => (
                    <View key={key} style={{ flex: 1 }}>
                      {key === 'super' ? (
                        <TextInput
                          style={styles.inputCell}
                          value={
                            row[key] === null || row[key] === undefined || isNaN(row[key])
                              ? ''
                              : String(row[key])
                          }
                          onChangeText={v => updateCell(gi, ri, key, v)}
                          keyboardType="numeric"
                          editable={true}
                        />
                      ) : (
                        <Text style={styles.td}>{row[key]}</Text>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* ADD MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Scheme</Text>

            <Picker selectedValue={newGroup} onValueChange={setNewGroup}>
              {schemeData.map(g => (
                <Picker.Item key={g.group} label={g.group} value={g.group} />
              ))}
            </Picker>

            {(['scheme', 'pos', 'count', 'amount', 'super'] as const).map(k => (
              <TextInput
                key={k}
                placeholder={k.toUpperCase()}
                style={styles.modalInput}
                keyboardType={k === 'scheme' ? 'default' : 'numeric'}
                value={newRow[k]}
                onChangeText={v => setNewRow({ ...newRow, [k]: v })}
              />
            ))}

            <TouchableOpacity style={styles.saveBtn} onPress={addSchemeRow}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  header: { flexDirection: 'row', padding: 16, paddingTop: 50 },
  headerTitle: { fontSize: 18, fontWeight: '600', marginLeft: 12 },

  tabs: { flexDirection: 'row', justifyContent: 'space-around' },
  tabText: { color: '#888', fontSize: 20 },
  activeTabText: { color: '#e91e63', fontWeight: '600' },
  activeLine: { height: 3, backgroundColor: '#e91e63', marginTop: 4 },

  topRow: { flexDirection: 'row', padding: 16 },
  pickerBox: { flex: 1, borderWidth: 1, borderColor: '#ddd' },
  editBtn: { backgroundColor: '#e91e63', padding: 15, marginLeft: 10 },
  editText: { color: '#fff', fontWeight: '600' },

  addBtn: {
    marginHorizontal: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e91e63',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addText: { color: '#e91e63', fontWeight: '600' },

  groupContainer: { margin: 16 },
  groupTitle: { fontWeight: '600', marginBottom: 6 },

  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f3f3' },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#ddd' },

  th: { flex: 1, textAlign: 'center', fontWeight: '600', padding: 6 },
  td: { textAlign: 'center', padding: 6 },

  inputCell: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 4,
    textAlign: 'center',
    color: '#000', // 🔥 Fix for Dark Mode
  },

  modalBg: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBox: { backgroundColor: '#fff', margin: 20, padding: 16, borderRadius: 8 },
  modalCloseBtn: { position: 'absolute', top: 10, right: 10, zIndex: 1 },
  modalTitle: { fontWeight: '600', marginBottom: 10, fontSize: 16 },
  modalInput: { borderWidth: 1, marginVertical: 5, padding: 8, borderColor: '#ddd', borderRadius: 4, color: '#000' },
  saveBtn: { backgroundColor: '#e91e63', padding: 12, marginTop: 10, alignItems: 'center', borderRadius: 4 },
});
