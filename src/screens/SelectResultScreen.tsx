import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Share,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Domain } from './NetPayScreen';
import { formatDateIST } from '../utils/dateUtils';

const timeOptions = ['DEAR 1PM', 'KERALA 3PM', 'DEAR 6PM', 'DEAR 8PM'];

const ResultScreen = () => {
  const [selectedTime, setSelectedTime] = useState(timeOptions[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [prizes, setPrizes] = useState<string[]>([]);
  const [entries, setEntries] = useState<string[]>([]);

  useEffect(() => {
    handleGenerate();
  }, [selectedDate, selectedTime]);


  const formatDate = (date: Date) => formatDateIST(date);

  const handleGenerate = async () => {
    try {
      const formattedDate = formatDate(selectedDate);
      const resultRes = await axios.get(`${Domain}/getResult`, {
        params: { date: formattedDate, time: selectedTime },
      });
      const res = resultRes;

      if (res.data.status === 0) {
        setPrizes([]);
        setEntries([]);
        Alert.alert('No results found for the selected date and time');
        return;
      }

      const responseData =
        res.data.status === 1 ? res.data.data && res.data.data[0] : {};
      if (!responseData) throw new Error('No data found in response');

      const foundPrizes = [
        responseData['1'],
        responseData['2'],
        responseData['3'],
        responseData['4'],
        responseData['5'],
      ].filter(Boolean);

      let others = responseData.others || [];

      const parsed = others
        .map((entry: string) => entry.toString().trim())
        .filter((entry: string) => entry !== '')
        .map((entry: string) => parseInt(entry))
        .filter((num: number) => !isNaN(num))
        .sort((a: number, b: number) => a - b)
        .map((num: number) => num.toString().padStart(3, '0'));

      const first30 = parsed.slice(0, 30);

      setPrizes(foundPrizes);
      setEntries(first30);
    } catch (err) {
      console.error(err);
      setPrizes([]);
      setEntries([]);
      Alert.alert('Error', 'Failed to fetch results');
    }
  };

  const buildResultText = () => {
    const resultLines = [
      `📄 ${selectedTime} Result (${selectedDate.toLocaleDateString('en-GB')})`,
      '',
      ...prizes.map((p, i) => `${i + 1}: ${p}`),
      '',
      'Compliments:',
      '',
    ];

    const numRows = Math.ceil(entries.length / 3);
    for (let row = 0; row < numRows; row++) {
      const rowEntries: string[] = [];

      if (row * 3 < entries.length) rowEntries.push(entries[row * 3]);
      if (row * 3 + 1 < entries.length) rowEntries.push(entries[row * 3 + 1]);
      if (row * 3 + 2 < entries.length)
        rowEntries.push(entries[row * 3 + 2]);

      while (rowEntries.length < 3) rowEntries.push('   ');

      resultLines.push(rowEntries.join('    '));
    }

    return resultLines.join('\n');
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(buildResultText());
    Alert.alert('Copied!', 'Result copied to clipboard.');
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: buildResultText() });
    } catch {
      Alert.alert('Error', 'Failed to share result');
    }
  };

  const renderEntriesGrid = () => {
    const paddedEntries = [...entries];
    while (paddedEntries.length < 30) paddedEntries.push('');
    const numRows = 10;
    const rows = [];

    for (let row = 0; row < numRows; row++) {
      const rowEntries = [
        paddedEntries[row * 3] || '',
        paddedEntries[row * 3 + 1] || '',
        paddedEntries[row * 3 + 2] || '',
      ];

      rows.push(
        <View key={row} style={styles.gridRow}>
          {rowEntries.map((entry, index) => {
            // green for col 0, 2, ... and blue for col 1, 3, ... is one way,
            // but the image shows rows having different colors or maybe cells.
            // Looking at the image, it's horizontal rows or alternating pattern.
            // Actually it looks like row 0 is green, row 1 is blue, etc.
            const isBlue = row % 2 !== 0;
            return (
              <View
                key={`${row}-${index}`}
                style={[
                  styles.cell,
                  isBlue ? styles.cellBlue : styles.cellGreen,
                ]}
              >
                <Text style={styles.cellText}>{entry}</Text>
              </View>
            );
          })}
        </View>
      );
    }
    return rows;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.btn, styles.copy]}
          onPress={handleCopy}
        >
          <Ionicons name="copy-outline" size={20} color="#fff" />
          {/* <Text style={styles.btnText}>Copy</Text> */}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.btn, styles.share]}
          onPress={handleShare}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          {/* <Text style={styles.btnText}>Share</Text> */}
        </TouchableOpacity>
      </View>

      {/* Date & Time Picker Row */}
      <View style={styles.selectorColumn}>
        <View style={styles.pickerCard}>
          <Picker
            selectedValue={selectedTime}
            onValueChange={(itemValue) => setSelectedTime(itemValue)}
            style={styles.picker}
          >
            {timeOptions.map((t) => (
              <Picker.Item key={t} label={t} value={t} color="#000" />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
        >
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('en-GB')}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
          textColor="#000"
        />
      )}

      {/* Prizes */}
      {prizes.length > 0 && (
        <View style={styles.card}>
          {prizes.map((prize, i) => (
            <View key={i} style={[styles.fullWidthPrizeRow, i % 2 !== 0 ? styles.cellBlue : styles.cellGreen]}>
              <Text style={styles.prizeText}>{`${i + 1} : ${prize}`}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Compliments */}
      {entries.length > 0 && (
        <View style={styles.card}>
          <View style={styles.grid}>{renderEntriesGrid()}</View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#eef3fb',
    padding: 10,
    flexGrow: 1,
    marginTop: 30,
    marginBottom: 20,
    paddingBottom: 30,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 10,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  primary: { backgroundColor: '#2563eb' },
  share: { backgroundColor: '#16a34a' },
  copy: { backgroundColor: '#f59e0b' },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 6,
  },
  selectorColumn: {
    gap: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pickerCard: {
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
  },
  picker: { height: 50 },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 15,
    height: 50,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    elevation: 2,
  },
  fullWidthPrizeRow: {
    width: '100%',
    paddingVertical: 12,
    marginBottom: 2,
    alignItems: 'center',
  },
  prizeText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  grid: { width: '100%', marginTop: 1, paddingBottom: 20 },
  gridRow: { flexDirection: 'row', marginBottom: 3 },
  cell: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  cellGreen: {
    backgroundColor: '#A7F3D0',
  },
  cellBlue: {
    backgroundColor: '#BAE6FD',
  },
  cellText: { fontSize: 16, fontWeight: '500', color: '#000' },
});

export default ResultScreen;
