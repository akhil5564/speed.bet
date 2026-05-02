// NumberWiseReportResult.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const NumberWiseReportResult = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { data, filters } = route.params;

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
      <Text style={styles.cell}>{item.number}</Text>
      {!filters.noGroupName &&<Text style={styles.cell}>{item.ticketName || '-'}</Text>}
      <Text style={styles.cell}>{item.count}</Text>
      <Text style={styles.cell}>{item.total}</Text>
    </View>
  );

  useEffect(() => {
    //add codes so that only parent or the logged in user can see the report
    
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Report Results</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filters}>
        {filters?.date && <Text style={styles.filterText}>📅 Date: {filters.date}</Text>}
        {filters?.time && filters.time !== 'ALL' && <Text style={styles.filterText}>🕒 Draw Time: {filters.time}</Text>}
        {filters?.agent && <Text style={styles.filterText}>👤 Agent: {filters.agent}</Text>}
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.cell, styles.headerCell]}>Number</Text>
        {!filters.noGroupName &&<Text style={[styles.cell, styles.headerCell]}>Ticket</Text>}
        <Text style={[styles.cell, styles.headerCell]}>Qty</Text>
        <Text style={[styles.cell, styles.headerCell]}>Total</Text>
      </View>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

export default NumberWiseReportResult;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', marginTop: 30 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, backgroundColor: '#f2f2f2',
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  filters: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  filterText: {
    fontSize: 14,
    marginTop: 4,
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#007aff',
    paddingVertical: 10, paddingHorizontal: 8,
  },
  headerCell: {
    color: '#fff', fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8,
  },
  evenRow: { backgroundColor: '#f9f9f9' },
  oddRow: { backgroundColor: '#fff' },
  cell: {
    flex: 1, textAlign: 'center',
  },
});
