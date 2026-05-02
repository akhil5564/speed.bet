import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Domain } from './NetPayScreen';

const EditUserScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const selectedUser = (route.params as any)?.user as any;
  console.log("selectedUser", selectedUser);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [percentage, setPercentage] = useState('');
  const [scheme, setScheme] = useState('Scheme 1');
  const [allowSubStockist, setAllowSubStockist] = useState(false);
  // const [allowAgents, setAllowAgents] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState<string[]>(['Scheme 1', 'Scheme 2', 'Scheme 3', 'Scheme 4', 'Scheme 5']);

  useEffect(() => {
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

  useEffect(() => {
    if (selectedUser) {
      setUsername(selectedUser.username || '');
      setPassword(''); // 👈 Keep empty by default for security
      setPercentage(selectedUser.percentage?.toString() || '0');
      setScheme(selectedUser.scheme || 'Scheme 1');
      setAllowSubStockist(selectedUser.usertype === 'master' ? true : false);
      // setAllowAgents(selectedUser.allowAgents || false);
      setBlocked(selectedUser.blocked || false);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (blocked) {
      console.log(`🔒 User ${username} has been blocked.`);
    } else {
      console.log(`✅ User ${username} is unblocked.`);
    }
  }, [blocked]);

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const updateData: any = {
        username: username,
        percentage: parseFloat(percentage) || 0,
        scheme: scheme,
        allowSubStockist: allowSubStockist,
        // allowAgents: allowAgents,
        blocked: blocked,
        salesBlocked: blocked, // Assuming salesBlocked is the same as blocked
      };

      // Only send password if it's not empty
      if (password && password.trim() !== '') {
        updateData.password = password;
      }

      console.log('Updating user with data:', updateData);

      // Make API call to update user
      const response = await axios.put(`${Domain}/users/update/${selectedUser._id}`, updateData);

      const result = response.data;

      if ((response.status === 200 || response.status === 201) && result.success) {
        console.log('User updated successfully:', result.message);
        setLoading(false);
        // Pass updated user data back to refresh the previous screen
        navigation.navigate('BlockUser', {
          user_id: selectedUser._id,
          refresh: true,
          // updatedUser: result.user 
        });
      } else {
        console.error('Failed to update user:', result.message);
        setLoading(false);
        // You could add an alert or toast notification here
        alert(`Failed to update user: ${result.message}`);
      }

    } catch (error) {
      console.error('Error updating user:', error);
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Users</Text>
      </View>

      <View style={[styles.card, blocked && styles.blockedCard]}>
        <View style={styles.topBar}>
          <Text style={styles.topBarText}>Edit User</Text>
        </View>

        <Text style={styles.label}>User Name</Text>
        <TextInput style={styles.input} value={username} editable={false} />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} />

        <Text style={styles.label}>Percentage</Text>
        <TextInput
          style={styles.input}
          value={percentage}
          onChangeText={setPercentage}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Scheme</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={scheme} onValueChange={setScheme} style={styles.picker} dropdownIconColor="#000">
            {schemes.map((s) => (
              <Picker.Item key={s} label={s} value={s} color="#000" />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Permissions</Text>
        <View style={styles.checkboxRow}>
          <Switch value={allowSubStockist} onValueChange={setAllowSubStockist} />
          <Text style={styles.checkboxLabel}>Allow create sub stockists</Text>
        </View>
        {/* <View style={styles.checkboxRow}>
          <Switch value={allowAgents} onValueChange={setAllowAgents} />
          <Text style={styles.checkboxLabel}>Allow create agents</Text>
        </View> */}

        <View style={styles.checkboxRow}>
          <Switch value={blocked} onValueChange={setBlocked} />
          <Text style={styles.checkboxLabel}>Block this user</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              blocked ? styles.blockedButton : styles.saveButton,
              loading && styles.disabledButton
            ]}
            onPress={handleUpdateUser}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Updating...' : (blocked ? 'SalesBlock' : 'Save')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#f1f1f1',
    flexGrow: 1,
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    marginLeft: 15,
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    paddingBottom: 20,
  },
  blockedCard: {
    backgroundColor: '#ffe5e5', // light red tint when blocked
  },
  topBar: {
    backgroundColor: '#f36',
    padding: 12,
  },
  topBarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 15,
    marginLeft: 15,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#aaa',
    marginHorizontal: 15,
    paddingVertical: 6,
    fontSize: 16,
    color: '#000', // 🔥 Fix for Dark Mode
  },
  pickerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#aaa',
    marginHorizontal: 15,
  },
  picker: {
    fontSize: 16,
    color: '#000', // 🔥 Fix for Dark Mode
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
    marginTop: 10,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 4,
  },
  saveButton: {
    backgroundColor: '#f36',
  },
  blockedButton: {
    backgroundColor: '#d00', // dark red for SalesBlock
  },
  cancelButton: {
    backgroundColor: '#888',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EditUserScreen;
