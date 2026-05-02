import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Domain } from './NetPayScreen';

interface ListUsersRouteParams {
  refresh?: boolean;
}

interface User {
  _id: string;
  username: string;
  usertype: string;
  scheme?: string;
  partner?: string;
  stockist?: string;
  subStockist?: string;
  createdBy: string;
}

const ListUsersScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { refresh } = (route.params as ListUsersRouteParams) || {};

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const storedUser = await AsyncStorage.getItem('username');
      const usertype = await AsyncStorage.getItem('usertype');

      if (!storedUser) {
        console.error('No logged-in user found');
        return;
      }

      const response = await axios.get(`${Domain}/users`);
      const data = response.data;

      // If admin, show all users. Otherwise, filter by createdBy.
      const filteredUsers = (data || []).filter(
        (user: any) => usertype === 'admin' || user.createdBy === storedUser
      );

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (refresh) fetchUsers();
  }, [refresh]);

  // Filter users by username for search
  const filteredUsers = users.filter((user: any) =>
    user.username?.toLowerCase().includes(search.toLowerCase())
  );

  const renderUserCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BlockUser', { user_id: item._id })}
    >
      <View style={styles.cardRow}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.label}>Type</Text>
        <Text style={styles.label}>Scheme</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.value}>{item.username}</Text>
        <Text style={styles.value}>{item.usertype}</Text>
        <Text style={styles.value}>{item.scheme || '-'}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Partner</Text>
        <Text style={styles.label}>Stockist</Text>
        <Text style={styles.label}>Sub Stockist</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.value}>{item.partner || '-'}</Text>
        <Text style={styles.value}>{item.stockist || '-'}</Text>
        <Text style={styles.value}>{item.subStockist || '-'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Users</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          placeholder="Search by name..."
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Loader */}
      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

export default ListUsersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 16,
    paddingTop: 20,
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 16,
    elevation: 2,
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
});
