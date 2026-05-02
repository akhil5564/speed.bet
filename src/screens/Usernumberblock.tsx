import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const BlockNumbersScreen = () => {
  const [blockType, setBlockType] = useState<'single' | 'series' | 'group'>('single');
  const [singleNumber, setSingleNumber] = useState('');
  const [seriesStart, setSeriesStart] = useState('');
  const [seriesEnd, setSeriesEnd] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Group 1');
  const [selectedTime, setSelectedTime] = useState('DEAR 1 PM');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Block Numbers</Text>

        {/* Block Type Selection */}
        <View style={styles.blockTypeRow}>
          <TouchableOpacity
            style={[styles.blockTypeBtn, blockType === 'single' && styles.activeBtn]}
            onPress={() => setBlockType('single')}
          >
            <Text style={styles.blockTypeText}>Single Number</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.blockTypeBtn, blockType === 'series' && styles.activeBtn]}
            onPress={() => setBlockType('series')}
          >
            <Text style={styles.blockTypeText}>Block Series</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.blockTypeBtn, blockType === 'group' && styles.activeBtn]}
            onPress={() => setBlockType('group')}
          >
            <Text style={styles.blockTypeText}>Whole Group</Text>
          </TouchableOpacity>
        </View>

        {/* Input Fields based on block type */}
        {blockType === 'single' && (
          <TextInput
            style={styles.input}
            placeholder="Enter single number"
            value={singleNumber}
            onChangeText={setSingleNumber}
            keyboardType="numeric"
          />
        )}

        {blockType === 'series' && (
          <View style={styles.seriesRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 5 }]}
              placeholder="Start"
              value={seriesStart}
              onChangeText={setSeriesStart}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { flex: 1, marginLeft: 5 }]}
              placeholder="End"
              value={seriesEnd}
              onChangeText={setSeriesEnd}
              keyboardType="numeric"
            />
          </View>
        )}

        {blockType === 'group' && (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedGroup}
              onValueChange={setSelectedGroup}
              style={styles.picker}
            >
              <Picker.Item label="Group 1" value="Group 1" />
              <Picker.Item label="Group 2" value="Group 2" />
              <Picker.Item label="Group 3" value="Group 3" />
            </Picker>
          </View>
        )}

        {/* Draw Time Selection */}
        <Text style={styles.label}>Select Draw Time</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedTime}
            onValueChange={setSelectedTime}
            style={styles.picker}
          >
            <Picker.Item label="DEAR 1 PM" value="DEAR 1 PM" />
            <Picker.Item label="KERALA 3 PM" value="KERALA 3 PM" />
            <Picker.Item label="DEAR 6 PM" value="DEAR 6 PM" />
            <Picker.Item label="DEAR 8 PM" value="DEAR 8 PM" />
          </Picker>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Block Number(s)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BlockNumbersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', marginTop: 30 },
  body: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  blockTypeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  blockTypeBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeBtn: { backgroundColor: '#f92659' },
  blockTypeText: { color: '#000', fontWeight: 'bold' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 16,
  },
  seriesRow: { flexDirection: 'row' },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 16,
  },
  picker: { height: 50, width: '100%' },
  label: { fontSize: 14, marginBottom: 4 },
  button: {
    backgroundColor: '#f92659',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
