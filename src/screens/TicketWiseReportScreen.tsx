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

const TicketWiseReportScreen = () => {
  const navigation = useNavigation<any>();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState('ALL');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeOptions, setTimeOptions] = useState<string[]>([]);

  useEffect(() => {
    const loadUserAndUsers = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('username');
        if (storedUser) {
          setLoggedInUser(storedUser);

          // 🛡️ Fix: Use axios for auth headers
          const response = await axios.get(`${Domain}/users`);
          const data = response.data;

          if (Array.isArray(data)) {
            const filteredUsers = data
              .filter((u: any) => u.createdBy === storedUser)
              .map((u: any) => u.username)
              .filter((username: any) => typeof username === 'string' && username.trim() !== '');

            setAllUsers([storedUser, ...filteredUsers]);
          } else {
            console.error('Invalid data format from API');
          }
        }
      } catch (err) {
        console.error('❌ Error loading users:', err);
      }
    };

    loadUserAndUsers();
  }, []);

  useEffect(() => {
    const fetchTimeOptions = async () => {
      try {
        // 🛡️ Fix: Use axios for auth headers
        const response = await axios.get(`${Domain}/draws`);
        const data = response.data;

        if (Array.isArray(data)) {
          const times = data.map((draw: any) => draw.drawTime || draw.time).filter(Boolean);
          setTimeOptions(times);
        }
      } catch (err) {
        console.error('❌ Error fetching draws:', err);
      }
    };

    fetchTimeOptions();
  }, []);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const formattedDate = formatDateIST(date);
      let url = `${Domain}/report/ticket?date=${formattedDate}`;

      if (selectedTime !== 'ALL') url += `&time=${encodeURIComponent(selectedTime)}`;
      if (selectedAgent.trim()) url += `&agent=${selectedAgent.trim()}`;

      console.log('Fetching report from:', url);

      const response = await axios.get(url);
      const data = response.data;

      if (Array.isArray(data)) {
        navigation.navigate('TicketWiseReportResult', {
          data,
          filters: {
            date: formattedDate,
            time: selectedTime,
            agent: selectedAgent,
          },
        });
      } else {
        console.error('Invalid response format');
      }
    } catch (err) {
      console.error('❌ Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket Wise Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#666" />
            <Text style={styles.dateText}>{date.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* Time Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Draw Time</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedTime}
              onValueChange={(itemValue) => setSelectedTime(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="ALL" value="ALL" />
              {timeOptions.map((time) => (
                <Picker.Item key={time} label={time} value={time} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Agent Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Agent (Optional)</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedAgent}
              onValueChange={(itemValue) => setSelectedAgent(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="All Agents" value="" />
              {allUsers.map((user) => (
                <Picker.Item key={user} label={user} value={user} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
          onPress={handleGenerateReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateBtnText}>Generate Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TicketWiseReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 14,
    marginLeft: 12,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  generateBtn: {
    backgroundColor: '#007aff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  generateBtnDisabled: {
    backgroundColor: '#ccc',
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
