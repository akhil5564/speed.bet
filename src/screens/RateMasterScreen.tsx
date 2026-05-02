import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Checkbox from 'expo-checkbox';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { Domain } from './NetPayScreen';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialData = [
  { name: 'SUPER', rate: '0', assignRate: '0' },
  { name: 'BOX', rate: '0', assignRate: '0' },
  { name: 'AB', rate: '0', assignRate: '0' },
  { name: 'BC', rate: '0', assignRate: '0' },
  { name: 'AC', rate: '0', assignRate: '0' },
  { name: 'A', rate: '0', assignRate: '0' },
  { name: 'B', rate: '0', assignRate: '0' },
  { name: 'C', rate: '0', assignRate: '0' },
];

const RateMasterScreen = () => {
  const navigation = useNavigation();
  const [selectedDraw, setSelectedDraw] = useState('DEAR 1 PM');
  const [editAll, setEditAll] = useState(false);
  const [ticketData, setTicketData] = useState(initialData);
  const [checkedItems, setCheckedItems] = useState(initialData.map(() => true));
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  const [userList, setUserList] = useState<any[]>([]);
  const [directUsers, setDirectUsers] = useState<any[]>([]);
  const [selectedUser1, setSelectedUser1] = useState('');
  const [selectedUser2, setSelectedUser2] = useState('');
  const [selectedUser3, setSelectedUser3] = useState('');
  const [selectedUser4, setSelectedUser4] = useState('');

  const [filteredUsers2, setFilteredUsers2] = useState<any[]>([]);
  const [filteredUsers3, setFilteredUsers3] = useState<any[]>([]);
  const [filteredUsers4, setFilteredUsers4] = useState<any[]>([]);

  const [loggedInUser, setLoggedInUser] = useState<string>('');
  const [loggedInUserRates, setLoggedInUserRates] = useState<any[]>([]);

  useEffect(() => {
    // Get logged-in user from AsyncStorage
    const getLoggedInUser = async () => {
      const username = await AsyncStorage.getItem('username');
      if (username) setLoggedInUser(username);
    };
    getLoggedInUser();

    // Fetch all users
    const fetchUsers = async () => {
      try {
        // 🛡️ Fix: Use axios for auth headers
        const res = await axios.get(`${Domain}/users`);
        const data = res.data;
        setUserList(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Filter only direct users under loggedInUser
  useEffect(() => {
    if (!loggedInUser || userList.length === 0) {
      setDirectUsers([]);
      return;
    }
    const direct = userList.filter((u: any) => u.createdBy === loggedInUser);
    setDirectUsers(direct);
  }, [loggedInUser, userList]);

  // Cascade filters
  useEffect(() => {
    if (selectedUser1) setFilteredUsers2(userList.filter((u) => u.createdBy === selectedUser1));
    else setFilteredUsers2([]);
    setSelectedUser2(''); setSelectedUser3(''); setSelectedUser4('');
  }, [selectedUser1]);

  useEffect(() => {
    if (selectedUser2) setFilteredUsers3(userList.filter((u) => u.createdBy === selectedUser2));
    else setFilteredUsers3([]);
    setSelectedUser3(''); setSelectedUser4('');
  }, [selectedUser2]);

  useEffect(() => {
    if (selectedUser3) setFilteredUsers4(userList.filter((u) => u.createdBy === selectedUser3));
    else setFilteredUsers4([]);
    setSelectedUser4('');
  }, [selectedUser3]);

  const effectiveUser = selectedUser4 || selectedUser3 || selectedUser2 || selectedUser1;

  const handleCheckboxChange = (index: number) => {
    const updated = [...checkedItems];
    updated[index] = !updated[index];
    setCheckedItems(updated);
  };

  const handleAssignRateChange = (text: string, index: number) => {
    const updated = [...ticketData];
    updated[index].assignRate = text;
    // updated[index].rate = text; // Keep parent rate unchanged
    setTicketData(updated);
  };

  // Fetch rates for selected user and its parent
  const fetchExistingRates = async (user: string, draw: string) => {
    try {
      if (!user || !draw) return;
      setIsLoadingRates(true);

      // Determine parent
      let parentUser = loggedInUser;
      if (selectedUser4) parentUser = selectedUser3;
      else if (selectedUser3) parentUser = selectedUser2;
      else if (selectedUser2) parentUser = selectedUser1;
      else if (selectedUser1) parentUser = loggedInUser;

      console.log(`🔍 Fetching rates for Child: ${user}, Parent: ${parentUser}`);

      // Fetch both sets of rates
      const [childRes, parentRes] = await Promise.all([
        axios.get(`${Domain}/rateMaster?user=${encodeURIComponent(user)}&draw=${encodeURIComponent(draw)}`),
        axios.get(`${Domain}/rateMaster?user=${encodeURIComponent(parentUser)}&draw=${encodeURIComponent(draw)}`)
      ]);

      const childData = childRes.data;
      const parentData = parentRes.data;

      // Ensure rates are arrays even if the API returns a message or non-array object
      const childRates = Array.isArray(childData.rates) ? childData.rates : (Array.isArray(childData) ? childData : []);
      const parentRates = Array.isArray(parentData.rates) ? parentData.rates : (Array.isArray(parentData) ? parentData : []);

      console.log(`📦 [RateMasterScreen] Fetch Success - User: ${user}, Draw: ${draw}`);
      console.log(`📊 Child matches:`, childRates.length, `Parent matches:`, parentRates.length);

      const updatedTicketData = initialData.map((item) => {
        const childMatch = childRates.find((r: any) => (r.label || r.name || "").toLowerCase() === item.name.toLowerCase());
        const parentMatch = parentRates.find((r: any) => (r.label || r.name || "").toLowerCase() === item.name.toLowerCase());

        const getStandardDefault = (name: string) => {
          const n = name.toUpperCase();
          return (n === 'A' || n === 'B' || n === 'C') ? '12' : '10';
        };

        const rateVal = parentMatch ? (parentMatch.assignRate || parentMatch.rate || getStandardDefault(item.name)) : getStandardDefault(item.name);
        const assignRateVal = childMatch ? (childMatch.assignRate || childMatch.rate || getStandardDefault(item.name)) : getStandardDefault(item.name);

        return {
          ...item,
          rate: rateVal.toString(),
          assignRate: assignRateVal.toString(),
        };
      });

      console.log('✨ [RateMasterScreen] Update Ticket Data:', JSON.stringify(updatedTicketData, null, 2));
      setTicketData(updatedTicketData);
    } catch (error) {
      console.error('❌ Error fetching rates:', error);
      setTicketData(initialData);
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Fetch logged-in user rates and log them
  const fetchLoggedInUserRates = async (draw: string) => {
    try {
      if (!loggedInUser || !draw) return;
      const url = `${Domain}/rateMaster?user=${encodeURIComponent(loggedInUser)}&draw=${encodeURIComponent(draw)}`;
      const response = await axios.get(url);
      const data = response.data;

      if (!data || data.message === 'No rate found') {
        setLoggedInUserRates([]);
        console.log('Logged-in user:', loggedInUser, 'Rates: None');
        return;
      }

      const ratesArray = Array.isArray(data.rates) ? data.rates : (Array.isArray(data) ? data : []);
      setLoggedInUserRates(ratesArray);
      console.log('Logged-in user:', loggedInUser);
      console.log('Logged-in user rates:', ratesArray);
    } catch (error) {
      console.error('❌ Error fetching logged-in user rates:', error);
      setLoggedInUserRates([]);
    }
  };

  useEffect(() => {
    if (effectiveUser && selectedDraw && selectedDraw !== 'All') {
      // Don't reset ticket data here, wait for fetch result to update it
      // This prevents the screen from flickering back to defaults while loading
      fetchExistingRates(effectiveUser, selectedDraw);
    } else if (selectedDraw === 'All') {
      setTicketData(initialData.map((item) => ({ ...item })));
    }

    if (loggedInUser && selectedDraw) {
      fetchLoggedInUserRates(selectedDraw);
    }
  }, [effectiveUser, selectedDraw, loggedInUser]);

  const handleSave = async () => {
    try {
      if (!effectiveUser) {
        alert('⚠️ Please select a user');
        return;
      }

      const modifiedRates = ticketData.map((item) => ({
        label: item.name.toUpperCase(),
        rate: Number(item.assignRate || item.rate), // Save the edited value as the child's buying rate
        assignRate: Number(item.assignRate || item.rate), // Also keep it in assignRate for consistency
      }));

      if (selectedDraw === 'All') {
        const allDraws = ['DEAR 1 PM', 'KERALA 3 PM', 'DEAR 6 PM', 'DEAR 8 PM'];
        await Promise.all(
          allDraws.map((draw) =>
            saveRateData({ user: effectiveUser, draw, rates: modifiedRates })
          )
        );
        alert('✅ Rate data saved to all draws');
      } else {
        await saveRateData({ user: effectiveUser, draw: selectedDraw, rates: modifiedRates });
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert('❌ Error saving rate data');
    }
  };

  const saveRateData = async (payload: any) => {
    try {
      const response = await axios.post(`${Domain}/ratemaster`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.data;
      if (data.status === 200) alert('✅ Rate data saved successfully');
      else alert('❌ Failed to save rate data');
    } catch (error) {
      console.error('❌ Error saving rate data:', error);
      alert('❌ An error occurred while saving');
    }
  };

  const renderRow = ({ item, index }: any) => (
    <View style={styles.row}>
      <View style={styles.cellWithBorder}>
        <Checkbox
          value={checkedItems[index]}
          onValueChange={() => handleCheckboxChange(index)}
          color={checkedItems[index] ? '#10b981' : undefined}
        />
      </View>
      <View style={styles.cellWithBorder}>
        <Text style={styles.cellText}>{item.name}</Text>
      </View>
      <View style={styles.cellWithBorder}>
        <Text style={styles.cellText}>{item.rate}</Text>
      </View>
      <View style={styles.lastCell}>
        <TextInput
          value={item.assignRate}
          onChangeText={(text) => handleAssignRateChange(text, index)}
          style={styles.input}
          keyboardType="decimal-pad"
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Master</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>SAVE</Text>
        </TouchableOpacity>
      </View>

      {/* Filter card */}
      <View style={styles.card}>
        <View style={styles.pickerBox}>
          <Picker selectedValue={selectedDraw} onValueChange={setSelectedDraw}>
            <Picker.Item label="DEAR 1 PM" value="DEAR 1 PM" />
            <Picker.Item label="KERALA 3 PM" value="KERALA 3 PM" />
            <Picker.Item label="DEAR 6 PM" value="DEAR 6 PM" />
            <Picker.Item label="DEAR 8 PM" value="DEAR 8 PM" />
            <Picker.Item label="All" value="All" />
          </Picker>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={[styles.pickerBox, { flex: 0.48 }]}>
            <Picker selectedValue={selectedUser1} onValueChange={setSelectedUser1}>
              <Picker.Item label="-- Select Creator --" value="" />
              {directUsers.map((u) => (
                <Picker.Item key={u.username} label={u.username} value={u.username} />
              ))}
            </Picker>
          </View>
          <View style={[styles.pickerBox, { flex: 0.48 }]}>
            <Picker selectedValue={selectedUser2} onValueChange={setSelectedUser2} enabled={filteredUsers2.length > 0}>
              <Picker.Item label="-- Select Child --" value="" />
              {filteredUsers2.map((u) => (
                <Picker.Item key={u.username} label={u.username} value={u.username} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <View style={[styles.pickerBox, { flex: 0.48 }]}>
            <Picker selectedValue={selectedUser3} onValueChange={setSelectedUser3} enabled={filteredUsers3.length > 0}>
              <Picker.Item label="-- Select Sub Child --" value="" />
              {filteredUsers3.map((u) => (
                <Picker.Item key={u.username} label={u.username} value={u.username} />
              ))}
            </Picker>
          </View>
          <View style={[styles.pickerBox, { flex: 0.48 }]}>
            <Picker selectedValue={selectedUser4} onValueChange={setSelectedUser4} enabled={filteredUsers4.length > 0}>
              <Picker.Item label="-- Select Sub Sub Child --" value="" />
              {filteredUsers4.map((u) => (
                <Picker.Item key={u.username} label={u.username} value={u.username} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.editAllRow}>
          <Checkbox value={editAll} onValueChange={setEditAll} />
          <Text style={styles.editAllText}>Edit all Dear tickets</Text>
        </View>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <View style={styles.cellWithBorder}></View>
        <View style={styles.cellWithBorder}>
          <Text style={styles.headerText}>Ticket Name</Text>
        </View>
        <View style={styles.cellWithBorder}>
          <Text style={styles.headerText}>Rate</Text>
        </View>
        <View style={styles.lastCell}>
          <Text style={styles.headerText}>Assign Rate</Text>
        </View>
      </View>

      {isLoadingRates && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Loading rates for {effectiveUser} - {selectedDraw}...
          </Text>
        </View>
      )}

      <FlatList
        data={ticketData}
        renderItem={renderRow}
        keyExtractor={(_, index) => index.toString()}
      />
    </View>
  );
};

export default RateMasterScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', paddingTop: 60 },
  header: { flexDirection: 'row', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  saveButton: { backgroundColor: '#facc15', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
  saveText: { fontWeight: 'bold' },
  card: { backgroundColor: 'white', margin: 8, borderRadius: 6, padding: 8, elevation: 2 },
  pickerBox: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, marginBottom: 6 },
  picker: { height: 50 },
  editAllRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1d5c9', padding: 8, borderRadius: 4 },
  editAllText: { marginLeft: 6, fontWeight: 'bold', color: '#333' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f7254e', alignItems: 'center' },
  headerText: { color: 'white', fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  row: { flexDirection: 'row', backgroundColor: 'white', alignItems: 'center', borderBottomColor: '#e5e7eb', borderBottomWidth: 1 },
  cellWithBorder: { flex: 1, borderRightWidth: 1, borderColor: '#e5e7eb', paddingVertical: 8, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center' },
  lastCell: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center' },
  cellText: { fontSize: 14, color: '#000' },
  input: { fontSize: 14, paddingVertical: 4, paddingHorizontal: 6, textAlign: 'center', color: '#000', backgroundColor: 'transparent' },
  loadingContainer: { backgroundColor: '#fef3c7', padding: 10, marginHorizontal: 8, borderRadius: 6, alignItems: 'center' },
  loadingText: { color: '#92400e', fontWeight: 'bold', fontSize: 14 },
});
