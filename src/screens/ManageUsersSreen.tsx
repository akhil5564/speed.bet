import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App'; // update path if needed

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManageUsers'>;

const ManageUsersScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Users</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <MaterialCommunityIcons name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CreateUser')}
      >
        <Text style={styles.cardText}>Create User</Text>
        <MaterialCommunityIcons name="account-plus-outline" size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ListUsers')}
      >
        <Text style={styles.cardText}>List User</Text>
        <MaterialCommunityIcons name="account-multiple-outline" size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RateMaster')}
      >
        <Text style={styles.cardText}>Rate Master</Text>
        <MaterialCommunityIcons name="cash-multiple" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default ManageUsersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  header: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FF2D55',
    padding: 20,
    marginBottom: 16,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  cardText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
