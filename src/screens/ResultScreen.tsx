import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ReportsScreen = () => {
  const navigation = useNavigation();
  const [usertype, setUsertype] = useState<string | null>(null);

  useEffect(() => {
    const loadUserType = async () => {
      const storedUsertype = await AsyncStorage.getItem('usertype');
      setUsertype(storedUsertype);
    };
    loadUserType();
  }, []);

  const reports = [
    {
      title: 'View Result',
      icon: <Ionicons name="document-text-outline" size={24} color="white" />,
      screen: 'SelectResultScreen',
    },
  ];

  // ✅ Add Result Entry ONLY for admin
  if (usertype === 'admin') {
    reports.push({
      title: 'Result Entry',
      icon: <Ionicons name="create-outline" size={24} color="white" />,
      screen: 'ResultEntry',
    });
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <Text style={styles.title}>Reports</Text>

        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Ionicons name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {reports.map((report, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => navigation.navigate(report.screen as never)}
          >
            <Text style={styles.cardText}>{report.title}</Text>
            {report.icon}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ReportsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 40,
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
