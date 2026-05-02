import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { formatDateIST } from '../utils/dateUtils';
import axios from 'axios';
import { Domain } from './NetPayScreen';

const ResultEntryScreen: React.FC = () => {
  const [time, setTime] = useState<string>('DEAR 1PM');
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [prizes, setPrizes] = useState<string[]>(['', '', '', '', '']);
  const [numbers, setNumbers] = useState<string[]>(Array(30).fill(''));

  const prizeRefs = useRef<(TextInput | null)[]>([]);
  const numberRefs = useRef<(TextInput | null)[]>([]);

  const handleNumberChange = (index: number, value: string) => {
    const updated = [...numbers];
    updated[index] = value;
    setNumbers(updated);
  };

  const handlePrizeChange = (index: number, value: string) => {
    const updated = [...prizes];
    updated[index] = value;
    setPrizes(updated);
  };

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const getShortCode = (t: string) => {
    if (t === 'KERALA 3PM') return 'LSK';
    if (t === 'DEAR 1 PM') return 'D-1';
    if (t === 'DEAR 6 PM') return 'D-6';
    if (t === 'DEAR 8 PM') return 'D-8';
    return 'CODE';
  };

  const handleSave = async () => {
    const formattedDate = formatDateIST(date);
    const shortCode = getShortCode(time);

    const prizeEntries = prizes.filter(p => /^\d{3}$/.test(p));
    const resultEntries = numbers
      .map((num, index) => ({
        ticket: (index + 1).toString(),
        result: num.trim(),
      }))
      .filter(entry => /^\d{3}$/.test(entry.result));

    if (resultEntries.length === 0 && prizeEntries.length === 0) {
      Alert.alert('Missing Data', 'Enter at least one result or prize.');
      return;
    }

    try {
      // ✅ No need to fetch existing — we are overwriting
      const payload = {
        results: {
          [formattedDate]: [
            {
              [time]: {
                prizes: prizeEntries,
                entries: resultEntries
              }
            }
          ]
        }
      };

      console.log('📤 Sending REPLACEMENT payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(`${Domain}/addResult`, payload);

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Result replaced successfully.');
      } else {
        console.error('❌ Server error:', response.data);
        Alert.alert('Error', response.data.message || 'Failed to save.');
      }
    } catch (err) {
      console.error('⚠️ Request error:', err);
      Alert.alert('Error', 'Network or server error.');
    }
  };



  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      // handleImageRecognition(result.assets[0].uri)
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Gallery access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      // handleImageRecognition(result.assets[0].uri)
    }
  };
  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);

      let parsedTime = 'DEAR 1 PM';
      let parsedDate = new Date();

      // Try to detect draw & date
      const matchFormat1 = text.match(/(DEAR\s*1|DEAR\s*6|DEAR\s*8|KERALA\s*3)\s*(?:PM)?/i);
      if (matchFormat1) {
        const game = matchFormat1[1].replace(/\s+/g, ' ').toUpperCase();
        if (game.includes('KERALA 3')) parsedTime = 'KERALA 3PM';
        else if (game.includes('DEAR 1')) parsedTime = 'DEAR 1PM';
        else if (game.includes('DEAR 6')) parsedTime = 'DEAR 6PM';
        else if (game.includes('DEAR 8')) parsedTime = 'DEAR 8PM';
      }

      const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
      if (dateMatch) parsedDate = new Date(dateMatch[0]);

      // Extract ALL 3-digit numbers
      const allNumbers = text.match(/\b\d{3}\b/g) || [];

      if (allNumbers.length < 1) {
        Alert.alert('Invalid format', 'No 3-digit numbers found.');
        return;
      }

      // First 5 → prizes
      const parsedPrizes = allNumbers.slice(0, 5);
      const parsedNumbers = allNumbers.slice(5, 35); // up to 30 normal entries

      const filledPrizes = [...parsedPrizes, ...Array(5 - parsedPrizes.length).fill('')];
      const filledNumbers = [...parsedNumbers, ...Array(30 - parsedNumbers.length).fill('')];

      setTime(parsedTime);
      setDate(parsedDate);
      setPrizes(filledPrizes);
      setNumbers(filledNumbers);

      console.log('📋 Paste Results:', { parsedTime, parsedDate, filledPrizes, filledNumbers });
      Alert.alert('Success', 'Results pasted successfully.');
    } catch (error) {
      console.error('Paste error:', error);
      Alert.alert('Error', 'Failed to paste data.');
    }
  };


  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="black" />
        <Text style={styles.title}>Results</Text>
        <View style={styles.iconRow}>
          <TouchableOpacity onPress={handlePaste} style={styles.iconButton}>
            <Ionicons name="clipboard-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openCamera} style={styles.iconButton}>
            <Ionicons name="camera-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openGallery} style={styles.iconButton}>
            <Ionicons name="image-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ Show selected draw */}
      <View style={styles.row}>
        <Text style={styles.selectedDrawText}>
          Selected Draw: {time}
        </Text>
      </View>

      <View style={styles.row}>
        <Picker style={styles.picker} selectedValue={time} onValueChange={setTime}>
          <Picker.Item label="DEAR 1PM" value="DEAR 1PM" />
          <Picker.Item label="KERALA 3PM" value="KERALA 3PM" />
          <Picker.Item label="DEAR 6PM" value="DEAR 6PM" />
          <Picker.Item label="DEAR 8PM" value="DEAR 8PM" />
        </Picker>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
          <Text>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {prizes.map((val, idx) => (
        <View
          key={idx}
          style={[styles.prizeRow, { backgroundColor: idx % 2 === 0 ? '#C2F0E1' : '#B6D8F2' }]}
        >
          <Text style={styles.prizeLabel}>{idx + 1} :</Text>
          <TextInput
            ref={(ref) => { prizeRefs.current[idx] = ref; }}
            style={styles.prizeInput}
            value={val}
            onChangeText={(text) => {
              handlePrizeChange(idx, text);
              if (text.length === 3 && idx < prizes.length - 1) {
                prizeRefs.current[idx + 1]?.focus();
              }
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && val.length === 0 && idx > 0) {
                prizeRefs.current[idx - 1]?.focus();
              }
            }}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>
      ))}

      <View style={styles.gridContainer}>
        {numbers.map((num, idx) => (
          <TextInput
            key={idx}
            ref={(ref) => { numberRefs.current[idx] = ref; }}
            style={[styles.gridItem, { backgroundColor: idx % 2 === 0 ? '#C2F0E1' : '#B6D8F2' }]}
            value={num}
            onChangeText={(text) => {
              handleNumberChange(idx, text);
              if (text.length === 3 && idx < numbers.length - 1) {
                numberRefs.current[idx + 1]?.focus();
              }
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && num.length === 0 && idx > 0) {
                numberRefs.current[idx - 1]?.focus();
              }
            }}
            keyboardType="number-pad"
            maxLength={3}
            returnKeyType="next"
          />
        ))}
      </View>

      <Text style={styles.codeDisplay}>
        Code: {getShortCode(time)}
      </Text>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Result</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ResultEntryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3bbbbff', marginTop: 30, marginBottom: 60 },
  scrollContent: { padding: 8, flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: 'bold' },
  iconRow: { flexDirection: 'row' },
  iconButton: { marginLeft: 6 },
  row: { flexDirection: 'row', marginBottom: 6 },
  selectedDrawText: { fontSize: 16, fontWeight: 'bold', color: '#333' }, // ✅ new
  picker: { flex: 1, backgroundColor: '#f1f1f1', height: 36 },
  dateInput: { flex: 1, paddingVertical: 6, paddingHorizontal: 6, backgroundColor: '#f1f1f1', justifyContent: 'center', borderRadius: 3 },
  prizeRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 10, marginBottom: 1, alignItems: 'center' },
  prizeLabel: { fontSize: 14, fontWeight: 'bold', width: 25 },
  prizeInput: { borderBottomWidth: 1, flex: 1, fontSize: 14, paddingVertical: 2 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  gridItem: { width: '30%', margin: '1.5%', textAlign: 'center', paddingVertical: 6, fontSize: 14, borderRadius: 4 },
  saveButton: { backgroundColor: '#211e1f', padding: 10, marginTop: 10, borderRadius: 4, alignItems: 'center' },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  codeDisplay: { textAlign: 'center', marginTop: 6, fontSize: 14, fontWeight: '600', color: '#555' },
});