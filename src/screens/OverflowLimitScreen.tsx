import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/apiClient'; // Assuming we'll use this for integration

const INITIAL_ROWS = [
  { key: 'SUPER', value: '70' },
  { key: 'BOX', value: '70' },
  { key: 'AB', value: '170' },
  { key: 'BC', value: '170' },
  { key: 'AC', value: '170' },
  { key: 'A', value: '1500' },
  { key: 'B', value: '1500' },
  { key: 'C', value: '1500' },
];

export default function OverflowLimitScreen() {
  const navigation = useNavigation();
  const [time, setTime] = useState('DEAR 1 PM');
  const [data, setData] = useState(INITIAL_ROWS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch data when time changes
  useEffect(() => {
    fetchOverflowLimits();
  }, [time]);

  const fetchOverflowLimits = async () => {
    setLoading(true);
    try {
      console.log(`Fetching limits for: ${time}`);
      const response = await apiClient.get(`/overflow-limit/by-drawtime?drawTime=${time}`);

      if (response.data && response.data.limits) {
        // Map back-end object to front-end array
        const fetchedLimits = response.data.limits;
        const updatedData = INITIAL_ROWS.map(row => ({
          ...row,
          value: fetchedLimits[row.key] ? String(fetchedLimits[row.key]) : row.value
        }));
        setData(updatedData);
      } else {
        setData([...INITIAL_ROWS]);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log('No limits found, using defaults.');
        setData([...INITIAL_ROWS]);
      } else {
        console.error('Error fetching limits:', error);
        Alert.alert('Error', 'Failed to fetch overflow limits');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Map front-end array to back-end flat object
      const limitsObject: Record<string, string> = {};
      data.forEach(item => {
        limitsObject[item.key] = item.value;
      });

      console.log('Saving limits:', { drawTime: time, limits: limitsObject });

      const response = await apiClient.post('/overflow-limit', {
        drawTime: time,
        limits: limitsObject
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Overflow limits updated successfully');
      }
    } catch (error) {
      console.error('Error saving limits:', error);
      Alert.alert('Error', 'Failed to save overflow limits');
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (index: number, text: string) => {
    const updated = [...data];
    updated[index].value = text;
    setData(updated);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Overflow Limit</Text>

        <TouchableOpacity onPress={handleSave} disabled={saving || loading}>
          {saving ? (
            <ActivityIndicator size="small" color="#1e88e5" />
          ) : (
            <Text style={[styles.save, (saving || loading) && styles.disabledText]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView stickyHeaderIndices={[0]}>
        {/* Dropdown Section */}
        <View style={styles.dropdownSection}>
          <View style={styles.dropdownWrapper}>
            <Picker
              selectedValue={time}
              onValueChange={setTime}
              style={styles.picker}
              enabled={!loading && !saving}
            >
              <Picker.Item label="DEAR 1 PM" value="DEAR 1 PM" />
              <Picker.Item label="KERALA 3 PM" value="KERALA 3 PM" />
              <Picker.Item label="DEAR 6 PM" value="DEAR 6 PM" />
              <Picker.Item label="DEAR 8 PM" value="DEAR 8 PM" />
            </Picker>
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#f36" />
            <Text style={styles.loaderText}>Loading limits...</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {data.map((item, index) => (
              <View
                key={item.key}
                style={[
                  styles.row,
                  index % 2 === 0 && styles.altRow,
                ]}
              >
                <Text style={styles.label}>{item.key}</Text>

                <TextInput
                  value={item.value}
                  onChangeText={(t) => updateValue(index, t)}
                  keyboardType="numeric"
                  style={styles.input}
                  editable={!saving}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 30,
  },

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  save: {
    fontSize: 16,
    color: '#1e88e5',
    fontWeight: 'bold',
  },

  disabledText: {
    color: '#ccc',
  },

  dropdownSection: {
    backgroundColor: '#F5F5F5',
    paddingBottom: 8,
  },

  dropdownWrapper: {
    margin: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 1,
  },

  picker: {
    height: 55,
  },

  listContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    marginBottom: 20,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },

  altRow: {
    backgroundColor: '#fafafa',
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },

  input: {
    width: 100,
    textAlign: 'right',
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: '#1e88e5',
    paddingVertical: 4,
  },

  loaderContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loaderText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
});
