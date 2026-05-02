import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Domain } from './NetPayScreen';
import axios from 'axios';

const TicketLimitScreen = () => {
  const [group1, setGroup1] = useState<{ A: string; B: string; C: string }>({
    A: '',
    B: '',
    C: '',
  });
  const [group2, setGroup2] = useState<{ AB: string; BC: string; AC: string }>({
    AB: '',
    BC: '',
    AC: '',
  });
  const [group3, setGroup3] = useState<{ SUPER: string; BOX: string }>({
    SUPER: '',
    BOX: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentLimits, setCurrentLimits] = useState<{
    group1?: { A?: string; B?: string; C?: string };
    group2?: { AB?: string; BC?: string; AC?: string };
    group3?: { SUPER?: string; BOX?: string };
  }>({});

  useEffect(() => {
    const fetchCurrentLimits = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await axios.get(`${Domain}/getticketLimit`);
        const result = response.data;
        if (response.status === 200 && result) {
          // Initialize state with existing values
          setGroup1({
            A: String(result.group1?.A ?? ''),
            B: String(result.group1?.B ?? ''),
            C: String(result.group1?.C ?? ''),
          });
          setGroup2({
            AB: String(result.group2?.AB ?? ''),
            BC: String(result.group2?.BC ?? ''),
            AC: String(result.group2?.AC ?? ''),
          });
          setGroup3({
            SUPER: String(result.group3?.SUPER ?? ''),
            BOX: String(result.group3?.BOX ?? ''),
          });
        } else {
          setLoadError(result?.message || 'Failed to load ticket limits');
        }
      } catch (error) {
        console.error('Load error:', error);
        setLoadError('Error loading ticket limits');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentLimits();
  }, []);



  const handleSave = async () => {
    const payload = {
      group1,
      group2,
      group3,
      createdBy: 'admin', // or fetch from AsyncStorage if needed
    };

    try {
      const response = await axios.post(`${Domain}/ticket-limit`, payload);
      const result = response.data;
      if (response.status === 200 || response.status === 201) {
        alert('Ticket limits saved successfully!');
      } else {
        alert(result.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving data');
    }
  };


  const renderInputRow = <T extends Record<string, string>>(
    groupLabel: string,
    fields: (keyof T)[],
    values: T,
    setValues: React.Dispatch<React.SetStateAction<T>>
  ) => (
    <View style={styles.group}>
      <Text style={styles.label}>{groupLabel}</Text>
      <View style={styles.inputRow}>
        {fields.map((field) => (
          <TextInput
            key={field as string}
            style={styles.input}
            placeholder={field as string}
            keyboardType="numeric"
            value={values[field]}
            onChangeText={(text) =>
              setValues((prev) => ({ ...prev, [field]: text }))
            }
          />
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ticket Limit</Text>
      {isLoading ? (
        <Text style={styles.subtleText}>Loading current limits...</Text>
      ) : loadError ? (
        <Text style={[styles.subtleText, { color: '#b00020' }]}>{loadError}</Text>
      ) : (
        // <View style={styles.currentSection}>
        //   <Text style={styles.currentTitle}>Current Limits</Text>
        //   <View style={styles.currentRow}>
        //     <Text style={styles.currentItem}>A: {currentLimits.group1?.A || '-'}</Text>
        //     <Text style={styles.currentItem}>B: {currentLimits.group1?.B || '-'}</Text>
        //     <Text style={styles.currentItem}>C: {currentLimits.group1?.C || '-'}
        //     </Text>
        //   </View>
        //   <View style={styles.currentRow}>
        //     <Text style={styles.currentItem}>AB: {currentLimits.group2?.AB || '-'}</Text>
        //     <Text style={styles.currentItem}>BC: {currentLimits.group2?.BC || '-'}</Text>
        //     <Text style={styles.currentItem}>AC: {currentLimits.group2?.AC || '-'}</Text>
        //   </View>
        //   <View style={styles.currentRow}>
        //     <Text style={styles.currentItem}>SUPER: {currentLimits.group3?.SUPER || '-'}</Text>
        //     <Text style={styles.currentItem}>BOX: {currentLimits.group3?.BOX || '-'}</Text>
        //   </View>
        // </View>

        <>

          {renderInputRow('Group 1', ['A', 'B', 'C'], group1, setGroup1)}
          {renderInputRow('Group 2', ['AB', 'BC', 'AC'], group2, setGroup2)}
          {renderInputRow('Group 3', ['SUPER', 'BOX'], group3, setGroup3)}
        </>
      )}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default TicketLimitScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#f4f4f4',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtleText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
  },
  currentSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  currentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  currentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  currentItem: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  group: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#1a1b1d',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});