import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLoading } from '../context/LoadingContext';

import logo from '../assets/speedracer.png';
import { Domain } from './NetPayScreen';

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { showLoading, hideLoading } = useLoading();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const uname = username.trim().toLowerCase();
    const pwd = password.trim();

    if (!uname || !pwd) {
      Alert.alert('Validation', 'Please enter username and password');
      return;
    }

    try {
      showLoading();

      const response = await axios.post(`${Domain}/login`, {
        username: uname,
        password: pwd,
      });

      const data = response?.data;

      if (!data?.user) {
        Alert.alert('Login Failed', data?.message || 'Invalid response');
        return;
      }

      const user = data.user;

      if (user.isLoginBlocked) {
        Alert.alert('⛔ Login Blocked', 'Your login has been blocked by admin.');
        return;
      }

      // Save session
      await AsyncStorage.multiSet([
        ['token', data.token || ''],
        ['username', user.username || ''],
        ['usertype', user.userType || ''],
        ['scheme', user.scheme || ''],
        ['salesBlocked', String(user.salesBlocked ?? false)],
      ]);

      console.log('✅ Login Success:', user);

      navigation.replace('Main' as never);
    } catch (error: any) {
      console.error('❌ Login error:', error?.response?.data || error.message);
      Alert.alert(
        'Login Error',
        error?.response?.data?.message || 'Server error'
      );
    } finally {
      hideLoading();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image source={logo} style={styles.centerImage} />

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#666"
          value={username}
          autoCapitalize="none"
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[
            styles.loginButton,
            (!username || !password) && { opacity: 0.5 },
          ]}
          onPress={handleLogin}
          disabled={!username || !password}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, styles.closeButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#130a33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width * 0.85,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
  },
  centerImage: {
    width: 160,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    borderColor: '#999',
    marginBottom: 20,
    fontSize: 16,
    color: '#000',
    paddingVertical: 8,
  },
  loginButton: {
    backgroundColor: '#007aff',
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#ff3b30',
  },
});