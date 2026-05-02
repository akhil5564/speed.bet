import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ManageSalesScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Sales</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Ionicons name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      
      <View style={styles.body}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Schemes')}
        >
          <Text style={styles.cardText}>Scheme</Text>
          <Ionicons name="calculator-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ManageSalesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 40,
    marginTop :30,
  },
  header: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  body: {
    padding: 16,
  },
  card: {
    backgroundColor: '#211e1f',
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
