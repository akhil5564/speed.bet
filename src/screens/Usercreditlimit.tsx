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
  const [selectedGroup, setSelectedGroup] = useState<'group1' | 'group2' | 'group3' | null>(null);
  const [selectedTime, setSelectedTime] = useState('DEAR 1 PM');

  // Inputs for groups
  const [groupInputs, setGroupInputs] = useState({
    A: '',
    B: '',
    C: '',
    AB: '',
    BC: '',
    AC: '',
    SUPER: '',
    BOX: '',
  });

  const handleInputChange = (field: string, value: string, maxLen: number) => {
    if (value.length <= maxLen) {
      setGroupInputs((prev) => ({ ...prev, [field]: value }));
    }
  };

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

        {/* Single Number */}
        {blockType === 'single' && (
          <TextInput
            style={styles.input}
            placeholder="Enter single number"
            value={singleNumber}
            onChangeText={setSingleNumber}
            keyboardType="numeric"
          />
        )}

        {/* Series */}
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

        {/* Radio Buttons for Group Selection (only for single/series) */}
        {(blockType === 'single' || blockType === 'series') && (
          <View style={styles.groupWrapper}>
            {['group1', 'group2', 'group3'].map((grp) => (
              <TouchableOpacity
                key={grp}
                style={styles.radioRow}
                onPress={() => setSelectedGroup(grp as any)}
              >
                <View style={[styles.radioCircle, selectedGroup === grp && styles.radioSelected]} />
                <Text style={styles.radioText}>{grp.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Inputs for selected group */}
        {selectedGroup === 'group1' && (
          <View>
            <TextInput
              style={styles.input}
              placeholder="A"
              value={groupInputs.A}
              onChangeText={(val) => handleInputChange('A', val, 1)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="B"
              value={groupInputs.B}
              onChangeText={(val) => handleInputChange('B', val, 1)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="C"
              value={groupInputs.C}
              onChangeText={(val) => handleInputChange('C', val, 1)}
              keyboardType="numeric"
            />
          </View>
        )}

        {selectedGroup === 'group2' && (
          <View>
            <TextInput
              style={styles.input}
              placeholder="AB"
              value={groupInputs.AB}
              onChangeText={(val) => handleInputChange('AB', val, 2)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="BC"
              value={groupInputs.BC}
              onChangeText={(val) => handleInputChange('BC', val, 2)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="AC"
              value={groupInputs.AC}
              onChangeText={(val) => handleInputChange('AC', val, 2)}
              keyboardType="numeric"
            />
          </View>
        )}

        {selectedGroup === 'group3' && (
          <View>
            <TextInput
              style={styles.input}
              placeholder="SUPER"
              value={groupInputs.SUPER}
              onChangeText={(val) => handleInputChange('SUPER', val, 3)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="BOX"
              value={groupInputs.BOX}
              onChangeText={(val) => handleInputChange('BOX', val, 3)}
              keyboardType="numeric"
            />
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
    marginBottom: 12,
  },
  seriesRow: { flexDirection: 'row', marginBottom: 16 },
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
  groupWrapper: { marginBottom: 16 },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#f92659',
    marginRight: 8,
  },
  radioSelected: { backgroundColor: '#f92659' },
  radioText: { fontSize: 14, fontWeight: '600' },
});
