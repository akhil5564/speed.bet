import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import apiClient from '../api/apiClient';
import { overflowState } from '../utils/overflowState';

const OverflowReportResult = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { data, filters } = route.params;
  const DEFAULT_LIMITS: Record<string, number> = {
    'SUPER': 70,
    'BOX': 70,
    'AB': 170,
    'BC': 170,
    'AC': 170,
    'A': 1500,
    'B': 1500,
    'C': 1500,
  };

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [limitsMap, setLimitsMap] = useState<Record<string, Record<string, number>>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [sessionNonce, setSessionNonce] = useState(0); // Used to force re-render on local state changes

  useEffect(() => {
    fetchLimits();
  }, [filters.time]);

  const normalizeDrawTime = (time: string) => {
    if (!time) return 'DEAR 1 PM';
    const upper = time.toUpperCase().trim();
    if (upper.includes('LSK 3 PM') || upper.includes('KERALA 3 PM') || upper.includes('LSK3') || upper.includes('KERALA3')) {
      return 'KERALA 3 PM';
    }
    if (upper.includes('DEAR 1') || upper.includes('DEAR1')) return 'DEAR 1 PM';
    if (upper.includes('DEAR 6') || upper.includes('DEAR6')) return 'DEAR 6 PM';
    if (upper.includes('DEAR 8') || upper.includes('DEAR8')) return 'DEAR 8 PM';
    return time;
  };

  const fetchLimits = async () => {
    try {
      setRefreshing(true);
      const slots = ['DEAR 1 PM', 'KERALA 3 PM', 'DEAR 6 PM', 'DEAR 8 PM'];
      const results = await Promise.all(
        slots.map(slot => apiClient.get(`/overflow-limit/by-drawtime?drawTime=${slot}`).catch(err => {
          return { data: { limits: {} } };
        }))
      );

      const newMap: Record<string, Record<string, number>> = {};
      slots.forEach((slot, index) => {
        newMap[slot] = { ...DEFAULT_LIMITS, ...(results[index]?.data?.limits || {}) };
      });
      setLimitsMap(newMap);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching limits:', error);
        Alert.alert('Limit Error', `Could not fetch limits from server: ${error.message}`);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const extractBetType = (typeStr: string) => {
    if (!typeStr) return "";
    const parts = typeStr.split(/[-_]/);
    const base = parts[parts.length - 1].toUpperCase().trim();
    // Common types: SUPER, BOX, AB, BC, AC, A, B, C
    return base;
  };

  const getTicketDisplay = (item: any) => {
    // If "Group without ticket name" is checked, always show dash
    if (filters.noGroupName) return '-';

    const drawMap: Record<string, string> = {
      'DEAR 1 PM': 'DEAR1',
      'KERALA 3 PM': 'KERALA3',
      'LSK 3 PM': 'KERALA3',
      'DEAR 6 PM': 'DEAR6',
      'DEAR 8 PM': 'DEAR8',
    };

    const rawTicket = item.ticketName || item.ticket || item.type || '';
    const baseType = extractBetType(rawTicket);

    // 1. Try to get draw from filters
    let drawPrefix = drawMap[filters.time] || '';

    // 2. Try to get draw from item fields (common in 'ALL' reports)
    const itemDraw = item.timeLabel || item.time || item.drawTime || item.draw || '';
    if (itemDraw) {
      drawPrefix = drawMap[itemDraw] || itemDraw.replace(/\s/g, '').toUpperCase();
    }

    // 3. Try to extract from raw ticket string (e.g. D-1-SUPER)
    if (!drawPrefix) {
      if (rawTicket.includes('D-1-')) drawPrefix = 'DEAR1';
      else if (rawTicket.includes('LSK3')) drawPrefix = 'KERALA3';
      else if (rawTicket.includes('D-6-')) drawPrefix = 'DEAR6';
      else if (rawTicket.includes('D-8-')) drawPrefix = 'DEAR8';
    }

    // Combine Draw + Type for full context
    // If a specific time is filtered, show only the type for a cleaner view.
    if (filters.time && filters.time.toLowerCase() !== 'all') {
      return baseType || rawTicket || '-';
    }

    if (drawPrefix && baseType && drawPrefix !== baseType) {
      return `${drawPrefix} ${baseType}`;
    }
    return drawPrefix || baseType || rawTicket || '-';
  };

  const calculateOver = (item: any) => {
    const rawTicket = item.ticketName || item.ticket || item.type || '';
    const ticketKey = extractBetType(rawTicket);

    // SLOT-AWARE LIMITS
    const entryDraw = normalizeDrawTime(item.timeLabel || item.drawTime || filters.time);
    const slotLimits = limitsMap[entryDraw] || limitsMap['DEAR 1 PM'] || DEFAULT_LIMITS;

    const limit = slotLimits[ticketKey] || slotLimits[rawTicket] || 0;
    // Quantity is often in 'count', 'total' might be amount
    const qty = item.count || item.total || 0;
    const rawOver = Math.max(0, qty - limit);

    // Subtract amount already "copied" in this session
    const ticketDisplay = getTicketDisplay(item);
    const storageKey = `${filters.date}_${filters.time}_${item.number || item.num || ''}_${ticketDisplay}`;
    const hidden = overflowState.getHiddenAmount(storageKey);

    return Math.max(0, rawOver - hidden);
  };

  const toggleSelect = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const handleCopy = async () => {
    if (selectedRows.size === 0) {
      Alert.alert('No Selection', 'Please select at least one row to copy.');
      return;
    }

    const selectedData = data.filter((_: any, index: number) => selectedRows.has(index));
    const textToCopy = selectedData.map((item: any) => {
      const over = calculateOver(item);
      const qty = item.count || item.total || 0;
      const ticketDisplay = getTicketDisplay(item);
      const numDisplay = item.number || item.num || '';
      if (ticketDisplay == 'SUPER') {
        return `\t${numDisplay}\t= \t${over}`;
      }
      if (ticketDisplay == 'BOX') {
        return `\t${numDisplay}\t= \t${over}\t${ticketDisplay}`;
      }
      if (ticketDisplay == 'A') {
        return `\t${ticketDisplay}\t= \t${numDisplay}\t= \t${over}`;
      }
      if (ticketDisplay == 'B') {
        return `\t${ticketDisplay}\t= \t${numDisplay}\t= \t${over}`;
      }
      if (ticketDisplay == 'C') {
        return `\t${ticketDisplay}\t= \t${numDisplay}\t= \t${over}`;
      }
      if (ticketDisplay == 'AB') {
        return `\t${ticketDisplay}\t= \t${numDisplay}\t= \t${over}`;
      }
      if (ticketDisplay == 'BC') {
        return `\t${ticketDisplay}\t= \t${numDisplay}\t= \t${over}`;
      }
      if (ticketDisplay == 'AC') {
        return `\t${ticketDisplay}\t= \t${numDisplay}\t= \t${over}`;
      }
      return `${ticketDisplay} \t${numDisplay}\t= \t${over}`;
    }).join('\n');

    await Clipboard.setStringAsync(textToCopy);

    // After copying, mark these as "hidden" locally
    selectedData.forEach((item: any) => {
      const over = calculateOver(item);
      const ticketDisplay = getTicketDisplay(item);
      const storageKey = `${filters.date}_${filters.time}_${item.number || item.num || ''}_${ticketDisplay}`;
      overflowState.addHiddenAmount(storageKey, over);
    });

    setSessionNonce(prev => prev + 1); // Trigger UI update
    setSelectedRows(new Set()); // Clear selection
    Alert.alert('Copied', 'Selected rows copied to clipboard and hidden from view.');
  };

  const handleRefresh = () => {
    overflowState.clear();
    setSessionNonce(prev => prev + 1);
    fetchLimits();
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const over = calculateOver(item);
    const isSelected = selectedRows.has(index);
    const qty = item.count || item.total || 0;
    const ticketDisplay = getTicketDisplay(item);
    const numDisplay = item.number || item.num || '';

    return (
      <View style={[styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
        <Text style={[styles.cell, { flex: 0.5 }]}>{index + 1}.</Text>
        <Text style={styles.cell}>{ticketDisplay}</Text>
        <Text style={styles.cell}>{numDisplay}</Text>
        <Text style={styles.cell}>{qty}</Text>
        <Text style={[styles.cell, styles.overText]}>{over}</Text>
        <TouchableOpacity style={[styles.cell, { flex: 0.5 }]} onPress={() => toggleSelect(index)}>
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={24}
            color={isSelected ? '#008080' : '#ccc'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const filteredData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    const groupMapping: Record<string, string[]> = {
      '1': ['A', 'B', 'C'],
      '2': ['AB', 'BC', 'AC'],
      '3': ['SUPER', 'BOX'],
    };

    return data.filter((item: any) => {
      // If "Group without ticket name" is checked, we bypass specific ticket filters
      // because the backend returns aggregated data.
      if (filters.noGroupName) return true;

      const ticketName = item.ticketName || item.ticket || item.type || '';
      const betType = extractBetType(ticketName);

      // Filter by Group (e.g. "1", "2", "3")
      if (filters.group && filters.group !== 'All') {
        const validTypes = groupMapping[filters.group] || [];
        if (!validTypes.includes(betType)) {
          return false;
        }
      }

      // Filter by Ticket Type (e.g. "A", "AB", "SUPER")
      if (filters.ticketType && filters.ticketType !== 'All') {
        const upperType = filters.ticketType.toUpperCase();
        if (betType !== upperType) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);

  // Auto-select rows with overflow by default
  useEffect(() => {
    if (filteredData.length > 0) {
      const initialSelected = new Set<number>();
      filteredData.forEach((item, index) => {
        if (calculateOver(item) > 0) {
          initialSelected.add(index);
        }
      });
      setSelectedRows(initialSelected);
    } else {
      setSelectedRows(new Set());
    }
  }, [filteredData, limitsMap]);


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <ActivityIndicator size="small" color="#008080" />
          ) : (
            <Ionicons name="refresh" size={24} color="#000" />
          )}
        </TouchableOpacity>
        <Text style={styles.title}>Overflow Report</Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
          <Text style={styles.copyButtonText}>Copy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.cell, styles.headerCell, { flex: 0.5 }]}>Sn</Text>
        <Text style={[styles.cell, styles.headerCell]}>Ticket</Text>
        <Text style={[styles.cell, styles.headerCell]}>Number</Text>
        <Text style={[styles.cell, styles.headerCell]}>Total</Text>
        <Text style={[styles.cell, styles.headerCell, { color: '#ff4d4d' }]}>Over</Text>
        <Text style={[styles.cell, styles.headerCell, { flex: 0.5 }]}>Select</Text>
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No data found for the selected filters.</Text>
            <Text style={styles.debugText}>
              Filtered: {filteredData.length}/{data.length} | Filters: {JSON.stringify(filters)}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default OverflowReportResult;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', marginTop: 30 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  copyButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  copyButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#008080',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    color: '#ffffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  evenRow: { backgroundColor: '#f9f9f9' },
  oddRow: { backgroundColor: '#fff' },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#333',
  },
  overText: {
    color: '#ff0000',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
  },
});
