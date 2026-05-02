import React from 'react';
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

const TicketWiseReportResult = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { data, filters } = route.params;

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
      <Text style={styles.cell}>{item.ticketName || item.ticket || '-'}</Text>
      <Text style={styles.cell}>{item.count || 0}</Text>
      <Text style={styles.cell}>{item.total || 0}</Text>
      <Text style={styles.cell}>{item.amount || 0}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Ticket Report Results</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filters}>
        {filters?.date && <Text style={styles.filterText}>📅 Date: {filters.date}</Text>}
        {filters?.time && filters.time !== 'ALL' && <Text style={styles.filterText}>🕒 Draw Time: {filters.time}</Text>}
        {filters?.agent && <Text style={styles.filterText}>👤 Agent: {filters.agent}</Text>}
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.cell, styles.headerCell]}>Ticket</Text>
        <Text style={[styles.cell, styles.headerCell]}>Count</Text>
        <Text style={[styles.cell, styles.headerCell]}>Total</Text>
        <Text style={[styles.cell, styles.headerCell]}>Amount</Text>
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

export default TicketWiseReportResult;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', marginTop: 30 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f2f2f2',
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
    flexDirection: 'row',
    backgroundColor: '#007aff',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  evenRow: { backgroundColor: '#f9f9f9' },
  oddRow: { backgroundColor: '#fff' },
  cell: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
});
