import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App'; // adjust if path differs

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UsersScreen'>;

const UsersScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Users</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CreateUser')}>
        <Text style={styles.buttonText}>Create User</Text>
        <Ionicons name="person-add" size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ListUsers')}>
        <Text style={styles.buttonText}>List Users</Text>
        <Ionicons name="people" size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('RateMaster')}>
        <Text style={styles.buttonText}>Rate Master</Text>
        <FontAwesome5 name="money-bill-wave" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default UsersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 20,
    marginTop: 30,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#211e1f',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
});
