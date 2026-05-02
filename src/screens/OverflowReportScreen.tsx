import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Domain } from './NetPayScreen';
import { formatDateIST } from '../utils/dateUtils';
import { useLoading } from '../context/LoadingContext';

const OverflowReportScreen = () => {
  const navigation = useNavigation<any>();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [groupWithoutName, setGroupWithoutName] = useState(false);
  const [selectedTime, setSelectedTime] = useState('ALL');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [rawUsers, setRawUsers] = useState<any[]>([]);
  const [loggedInUser, setLoggedInUser] = useState('');
  const { showLoading, hideLoading } = useLoading();
  const [loading, setLoading] = useState(false);

  // New states for Group and Ticket dropdowns
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedTicketType, setSelectedTicketType] = useState('All');
  const [ticketTypeOptions, setTicketTypeOptions] = useState<string[]>(['All']);

  /* 🔁 Group → Ticket mapping */
  useEffect(() => {
    let options: string[] = ['All'];
    if (selectedGroup === '1') {
      options = ['All', 'A', 'B', 'C'];
    } else if (selectedGroup === '2') {
      options = ['All', 'AB', 'BC', 'AC'];
    } else if (selectedGroup === '3') {
      options = ['All', 'SUPER', 'BOX'];
    }
    setTicketTypeOptions(options);
    setSelectedTicketType('All');
  }, [selectedGroup]);

  useEffect(() => {
    const loadUserAndUsers = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('username');
        if (storedUser) {
          setLoggedInUser(storedUser);
          setSelectedAgent(storedUser);

          // 🛡️ Fix: Use axios for auth headers
          const response = await axios.get(`${Domain}/users`);
          const data = response.data;

          if (Array.isArray(data)) {
            setRawUsers(data);
            const filteredUsers = data
              .filter((u: any) => u.createdBy === storedUser)
              .map((u: any) => u.username)
              .filter((username: any) => typeof username === 'string' && username.trim() !== '');

            setAllUsers([storedUser, ...filteredUsers]);
          }
        }
      } catch (err) {
        console.error('❌ Error loading users:', err);
      }
    };
    loadUserAndUsers();
  }, []);

  const handleGenerateReport = async () => {
    try {
      showLoading();
      setLoading(true);
      const formattedDate = formatDateIST(date);

      const queryParams: any = {
        fromDate: formattedDate,
        toDate: formattedDate,
        createdBy: selectedAgent || loggedInUser,
        timeLabel: (selectedTime && selectedTime.toLowerCase() !== 'all') ? selectedTime : 'all',
        loggedInUser: loggedInUser,
        view: "detailed", // Force detailed to get all child entries for overflow calculation
      };

      if (ticketNumber.trim()) queryParams.number = ticketNumber.trim();
      if (selectedGroup !== 'All') queryParams.ticket = selectedGroup;
      if (selectedTicketType !== 'All') queryParams.type = selectedTicketType;

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `${Domain}/report/salesReport?${queryString}`;

      console.log("Fetching Overflow Detailed Data for Hierarchy:", url);

      const response = await axios.get(url);
      const resData = response.data;

      if (resData && (resData.entries || resData.byAgent)) {
        navigation.navigate('OverflowReportSummary', {
          report: {
            ...resData,
            fromDate: formattedDate,
            toDate: formattedDate,
            time: selectedTime,
            agent: selectedAgent || loggedInUser,
            filters: {
              selectedGroup,
              selectedTicketType,
              groupWithoutName,
              ticketNumber
            }
          },
          loggedInUser,
          allUsersData: rawUsers
        });
      } else {
        alert(resData.message || 'No data found');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to fetch report');
    } finally {
      hideLoading();
      setLoading(false);
    }
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const formatDateLabel = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Overflow Report</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Ionicons name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>Draw Time</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={selectedTime} onValueChange={setSelectedTime} style={styles.picker}>
            <Picker.Item label="ALL" value="ALL" color="#000000" />
            <Picker.Item label="DEAR 1PM" value="DEAR 1 PM" color="#000000" />
            <Picker.Item label="KERALA 3PM" value="LSK 3 PM" color="#000000" />
            <Picker.Item label="DEAR 6PM" value="DEAR 6 PM" color="#000000" />
            <Picker.Item label="DEAR 8PM" value="DEAR 8 PM" color="#000000" />
          </Picker>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Group</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedGroup}
                onValueChange={setSelectedGroup}
                style={styles.picker}
              >
                <Picker.Item label="All" value="All" color="#000000" />
                <Picker.Item label="Group 1" value="1" color="#000000" />
                <Picker.Item label="Group 2" value="2" color="#000000" />
                <Picker.Item label="Group 3" value="3" color="#000000" />
              </Picker>
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.label}>Ticket</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedTicketType}
                onValueChange={setSelectedTicketType}
                style={styles.picker}
              >
                {ticketTypeOptions.map((opt) => (
                  <Picker.Item key={opt} label={opt} value={opt} color="#000000" />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
              <Text style={styles.boldText}>{formatDateLabel(date)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.column}>
            <Text style={styles.label}>Ticket Number</Text>
            <TextInput
              placeholder="Ticket Number"
              placeholderTextColor="#00000081"
              style={styles.input}
              value={ticketNumber}
              onChangeText={setTicketNumber}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.label}>Agent</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={selectedAgent} onValueChange={setSelectedAgent} style={styles.picker}>
            {allUsers.map((user, i) => (
              <Picker.Item key={i} label={user} value={user} color="#000000" />
            ))}
          </Picker>
        </View>

        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setGroupWithoutName(!groupWithoutName)}
          >
            <Ionicons
              name={groupWithoutName ? 'checkbox' : 'square-outline'}
              size={20}
              color="#0f0e0eff"
            />
            <Text style={styles.checkboxLabel}>Group without ticket name</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleGenerateReport} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Generate Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
};

export default OverflowReportScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', marginTop: 30 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#000000' },
  body: {
    padding: 20, backgroundColor: '#fff', margin: 10, borderRadius: 8,
  },
  label: { fontSize: 14, marginBottom: 4, color: '#0a0808ff', fontWeight: 'bold' },
  input: {
    backgroundColor: '#f2f2f2', borderRadius: 6, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#ddd', color: '#0a0a0aff', fontWeight: 'bold',
  },
  boldText: { fontWeight: 'bold', color: '#000000ff' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  column: { flex: 1, marginRight: 8 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  checkbox: { flexDirection: 'row', alignItems: 'center' },
  checkboxLabel: { marginLeft: 8, color: '#000000', fontWeight: 'bold' },
  button: {
    backgroundColor: '#211e1f', padding: 16, borderRadius: 8, alignItems: 'center', elevation: 2,
  },
  buttonText: { color: '#f8ededff', fontWeight: 'bold', fontSize: 16 },
  pickerWrapper: {
    backgroundColor: '#f2f2f2', borderRadius: 6, marginBottom: 16,
    borderWidth: 1, borderColor: '#ddd',
  },
  picker: { height: 50, width: '100%', color: '#000' },
});
