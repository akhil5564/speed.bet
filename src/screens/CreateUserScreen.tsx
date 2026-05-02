import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Domain } from './NetPayScreen';

const CreateUserScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedScheme, setSelectedScheme] = useState('Scheme 1');
  const [isMaster, setIsMaster] = useState(false);
  const [schemes, setSchemes] = useState<string[]>(['Scheme 1', 'Scheme 2', 'Scheme 3', 'Scheme 4', 'Scheme 5']);

  React.useEffect(() => {
    const discoverSchemes = async () => {
      try {
        const foundSchemes: Set<string> = new Set(['Scheme 1', 'Scheme 2', 'Scheme 3', 'Scheme 4', 'Scheme 5']);
        const draws = ['DEAR 1 PM', 'LSK 3 PM', 'DEAR 6 PM', 'DEAR 8 PM'];

        const probes = draws.flatMap(drawName =>
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(async (tabNum) => {
            try {
              const url = `${Domain}/draw-scheme`;
              const res = await axios.get(url, {
                params: {
                  activeTab: tabNum,
                  drawName: drawName
                }
              });
              if (res.status === 200) {
                return `Scheme ${tabNum}`;
              }
            } catch (e) { }
            return null;
          })
        );

        const results = await Promise.all(probes);
        results.forEach(s => { if (s) foundSchemes.add(s); });

        const sortedSchemes = Array.from(foundSchemes).sort((a, b) => {
          const numA = parseInt(a.replace('Scheme ', ''));
          const numB = parseInt(b.replace('Scheme ', ''));
          return numA - numB;
        });

        setSchemes(sortedSchemes);
      } catch (error) {
        console.error('Error discovering schemes:', error);
      }
    };
    discoverSchemes();
  }, []);

  const handleSave = async () => {
    if (!username || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const createdBy = await AsyncStorage.getItem('username');
    const payload = {
      username,
      password,
      scheme: selectedScheme,
      createdBy: createdBy || 'Unknown',
      usertype: isMaster ? 'master' : 'sub',
    };

    try {
      const response = await axios.post(`${Domain}/newuser`, payload);

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'User created successfully');
        navigation.goBack();
      } else {
        Alert.alert('Failed', response.data.message || 'Something went wrong');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Create Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.roleLabel}>AGENT</Text>

      <TextInput
        placeholder="User Name"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        placeholderTextColor="#888"
      />

      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedScheme}
          onValueChange={(itemValue) => setSelectedScheme(itemValue)}
          style={styles.picker}
          dropdownIconColor="#000"
        >
          {schemes.map((s) => (
            <Picker.Item key={s} label={s} value={s} color="#000" />
          ))}
        </Picker>
      </View>

      <TouchableOpacity
        style={styles.customCheckboxContainer}
        onPress={() => setIsMaster(!isMaster)}
        activeOpacity={0.8}
      >
        <View style={[styles.customCheckbox, isMaster && styles.customCheckboxChecked]}>
          {isMaster && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Allow to create user</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CreateUserScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginTop: Platform.OS === 'ios' ? 50 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  roleLabel: {
    alignSelf: 'center',
    color: '#F7B801',
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    fontSize: 16,
    paddingVertical: 10,
    marginBottom: 20,
    color: '#000', // 🔥 Fix for Dark Mode
  },
  pickerWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    marginBottom: 30,
  },
  picker: {
    width: '100%',
    color: '#000', // 🔥 Fix for Dark Mode
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#f7254e',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  customCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  customCheckbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#999',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  customCheckboxChecked: {
    backgroundColor: '#f7254e',
    borderColor: '#f7254e',
  },

  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
