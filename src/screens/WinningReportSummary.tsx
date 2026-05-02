import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import axios from 'axios';
import { Domain } from './NetPayScreen';
import { fetchSchemeData, calculateDynamicSuperAmount, SchemeGroup, extractDrawName, getSchemeCacheKey } from '../utils/schemeUtils';
import { useLoading } from '../context/LoadingContext';

const WinningReportSummary = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { report, loggedInUser, allUsersData, currentLevelUser } = (route.params as any) || {};
  const [reportData, setReportData] = useState(report || {});
  const { showLoading, hideLoading } = useLoading();
  const [loading, setLoading] = useState(false);

  const {
    totalBills = 0,
    totalBillAmount = 0,
    totalWinningAmount = 0,
    superTotalAmount = 0,
    fromDate = '',
    toDate = '',
    time = 'ALL',
    agent = '',
    byAgent = [],
  } = reportData;

  const fetchReportData = useCallback(async () => {
    try {
      showLoading();
      setLoading(true);
      const params = {
        fromDate: reportData.fromDate || fromDate,
        toDate: reportData.toDate || toDate,
        agent: currentLevelUser || agent || "",
        time: time || "ALL",
        loggedInUser,
      };

      const res = await axios.post(`${Domain}/winning/summary`, params);
      if (res.data) {
        setReportData(res.data);
      }
    } catch (err: any) {
      console.error("❌ Error auto-refreshing winning summary:", err);
    } finally {
      hideLoading();
      setLoading(false);
    }
  }, [fromDate, toDate, agent, time, loggedInUser, currentLevelUser, reportData.fromDate, reportData.toDate]);

  useFocusEffect(
    useCallback(() => {
      fetchReportData();
    }, [fetchReportData])
  );

  // Hierarchy Logic
  const effectiveParent = currentLevelUser || agent || loggedInUser;

  // Split byAgent into Self and Children
  const selfRow = byAgent.find((a: any) => a.isSelf || a.agent === effectiveParent);
  const childRows = byAgent.filter((a: any) => !a.isSelf && a.agent !== effectiveParent);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Winning Summary</Text>
          {effectiveParent !== loggedInUser && (
            <Text style={{ fontSize: 12, color: '#666' }}>{effectiveParent}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => (navigation as any).navigate('Main')}>
          <AntDesign name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {loading && !reportData.agent && (
          <View style={{ padding: 20 }}>
            <ActivityIndicator size="small" color="#f02b61" />
          </View>
        )}

        {/* Global Summary Card */}
        <View style={styles.card}>
          <Text style={styles.dateText}>
            {fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`}
          </Text>
          {time && time !== 'ALL' && <Text style={styles.timeText}>{time}</Text>}

          <View style={styles.row}>
            <Text style={styles.label}>Total Bills :</Text>
            <Text style={styles.value}>{totalBills}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Prize :</Text>
            <Text style={styles.value}>₹{totalWinningAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Super :</Text>
            <Text style={styles.value}>₹{(superTotalAmount - totalWinningAmount).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Amount :</Text>
            <Text style={styles.value}>₹{superTotalAmount.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => (navigation as any).navigate('winningdetailed', {
              report: {
                fromDate,
                toDate,
                time,
                agent: effectiveParent,
                grandTotal: totalWinningAmount,
                loggedInUser: loggedInUser // Pass viewer's ID
              }
            })}
          >
            <Text style={styles.buttonText}>View All Detailed</Text>
          </TouchableOpacity>
        </View>

        {/* Breakdown Section */}
        <View>
          <Text style={[styles.headerTitle, { textAlign: 'center', marginVertical: 15, color: '#f02b61' }]}>
            Breakdown for {effectiveParent}
          </Text>

          {/* Self Row */}
          {selfRow && (
            <View style={[styles.card, styles.agentCard, { backgroundColor: '#fff9f9' }]}>
              <View style={styles.agentHeader}>
                <Ionicons name="person-circle" size={20} color="#333" />
                <Text style={[styles.agentName, { color: '#333' }]}>{'(Direct Winnings)'}</Text>
                <Text style={styles.userTypeBadge}>SELF</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Bills :</Text>
                <Text style={styles.value}>{selfRow.totalBills}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Prize :</Text>
                <Text style={styles.value}>₹{selfRow.totalWinningAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Super :</Text>
                <Text style={styles.value}>₹{(selfRow.superTotalAmount - selfRow.totalWinningAmount).toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Amount :</Text>
                <Text style={styles.value}>₹{selfRow.superTotalAmount.toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#666' }]}
                onPress={() => (navigation as any).navigate('winningdetailed', {
                  report: {
                    fromDate,
                    toDate,
                    time,
                    agent: selfRow.agent,
                    grandTotal: selfRow.totalWinningAmount,
                    showOnlyDirect: true,
                    loggedInUser: loggedInUser // Pass viewer's ID
                  }
                })}
              >
                <Text style={styles.buttonText}>View Direct Entries</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Child Rows */}
          {childRows.map((agentData: any, index: number) => (
            <View key={`${agentData.agent}-${index}`} style={[styles.card, styles.agentCard]}>
              <View style={styles.agentHeader}>
                <Ionicons name="person-circle" size={20} color="#f02b61" />
                <Text style={styles.agentName}>{agentData.agent}</Text>
                <Text style={styles.userTypeBadge}>{agentData.usertype?.toUpperCase()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Bills :</Text>
                <Text style={styles.value}>{agentData.totalBills}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Prize :</Text>
                <Text style={styles.value}>₹{agentData.totalWinningAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Super :</Text>
                <Text style={styles.value}>₹{(agentData.superTotalAmount - agentData.totalWinningAmount).toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Amount :</Text>
                <Text style={styles.value}>₹{agentData.superTotalAmount.toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.button, agentData.usertype === 'master' ? {} : styles.agentButton]}
                onPress={() => {
                  if (agentData.usertype === 'master') {
                    (navigation as any).push('winningreportsummary', {
                      report: {
                        ...agentData,
                        fromDate,
                        toDate,
                        time
                      },
                      loggedInUser,
                      allUsersData,
                      currentLevelUser: agentData.agent
                    });
                  } else {
                    (navigation as any).navigate('winningdetailed', {
                      report: {
                        fromDate,
                        toDate,
                        time,
                        agent: agentData.agent,
                        grandTotal: agentData.totalWinningAmount,
                        loggedInUser: loggedInUser // Pass viewer's ID
                      }
                    });
                  }
                }}
              >
                <Text style={styles.buttonText}>
                  {agentData.usertype === 'master' ? 'View Children' : 'View Detailed'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView >
  );
};

export default WinningReportSummary;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f1f1', padding: 10, marginTop: 30 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ccc',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  card: {
    backgroundColor: '#fff', borderRadius: 6, padding: 15,
    marginTop: 15, shadowColor: '#000', elevation: 2,
  },
  agentCard: { borderLeftWidth: 3, borderLeftColor: '#f02b61' },
  agentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  agentName: { fontSize: 18, fontWeight: 'bold', color: '#f02b61', marginLeft: 8 },
  row: { flexDirection: 'row', marginTop: 10, alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 16, color: '#333' },
  value: { fontSize: 16, fontWeight: 'bold' },
  dateText: { fontSize: 16, color: '#f02b61', textAlign: 'center', fontWeight: 'bold' },
  timeText: { fontSize: 14, color: '#666', textAlign: 'center', fontStyle: 'italic', marginTop: 4 },
  button: { backgroundColor: '#211e1f', paddingVertical: 12, borderRadius: 5, marginTop: 20 },
  agentButton: { backgroundColor: '#211e1f' },
  buttonText: { textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userTypeBadge: {
    fontSize: 10,
    backgroundColor: '#eee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#666',
    fontWeight: 'bold',
  },
});