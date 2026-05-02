import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5, Entypo, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ReportsScreen = () => {
  const navigation = useNavigation();

  const reports = [
    {
      title: 'Sales Report',
      icon: <Ionicons name="calculator-outline" size={24} color="white" />,
      screen: 'SalesReportScreen', // Add navigation screen
    },
    {
      title: 'Winnings Report',
      icon: <FontAwesome5 name="shopping-bag" size={20} color="white" />,
      screen: 'WinningReportScreen', // You can add screens like this later
    },
    {
      title: 'Number Wise Report',
      icon: <Entypo name="list" size={22} color="white" />,
      screen: 'NumberWiseReportScreen',
    },
    {
      title: 'Net Pay',
      icon: <MaterialIcons name="money" size={24} color="white" />,
      screen: 'NetPayScreen',
    },
    {
      title: 'Account Summary',
      icon: <MaterialIcons name="account-balance" size={24} color="white" />,
      screen: 'AccountSummary',
    },
    {
      title: 'Overflow Report',
      icon: <Ionicons name="document-text-outline" size={24} color="white" />,
      screen: 'OverflowReportScreen',
    },
  ];

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

      {/* Report Cards */}
      <View style={styles.body}>
        {reports.map((report, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => {
              if (report.screen) {
                navigation.navigate(report.screen);
              }
            }}
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
    marginTop: 30,
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
