import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { fetchSchemeData, calculateDynamicSuperAmount, SchemeGroup, extractDrawName, getSchemeCacheKey } from '../utils/schemeUtils';
import { Ionicons, AntDesign, FontAwesome } from "@expo/vector-icons";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import { Domain } from './NetPayScreen';

const { width } = Dimensions.get("window");

interface WinEntry {
  number: string;
  type: string;
  winType?: string;
  count: number;
  winAmount: number;
  name?: string;
  billNo?: string;
  drawName?: string;
  path?: string[];
  superAmount?: number;
  total?: number;
  createdBy?: string;
}

interface Bill {
  billNo: string;
  createdBy: string;
  scheme: string;
  drawName?: string;
  path?: string[];
  winnings?: WinEntry[];
}

const COLORS = {
  teal: "#0e7062",
  white: "#ffffff",
  black: "#000000",
  lightGray: "#f1f1f1",
  rowTeal: "#0e7062",
  rowWhite: "#ffffff",
};

const WinningDetailedScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { report } = (route.params as any) || {};

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemesCache, setSchemesCache] = useState<Record<string, SchemeGroup[]>>({});
  const [loadingSchemes, setLoadingSchemes] = useState(false);

  const fetchDetailedReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${Domain}/report/winningReport`, {
        fromDate: report.fromDate,
        toDate: report.toDate,
        time: report.time || 'ALL',
        agent: report.agent,
        loggedInUser: report.loggedInUser, // Send viewer's ID to backend
      });

      if (res.data && res.data.bills) {
        setBills(res.data.bills);
      }
    } catch (err) {
      console.error("❌ Error fetching detailed winnings:", err);
    } finally {
      setLoading(false);
    }
  }, [report.fromDate, report.toDate, report.time, report.agent]);

  useEffect(() => {
    fetchDetailedReport();
  }, [fetchDetailedReport]);

  useEffect(() => {
    const loadAllSchemes = async () => {
      if (bills.length === 0) return;
      setLoadingSchemes(true);
      const uniqueSchemes = new Set<string>();

      bills.forEach((bill: any) => {
        const drawName = extractDrawName(bill, report.time || 'ALL');
        const schemeId = bill.scheme || 'N/A';
        if (drawName && schemeId) {
          const key = getSchemeCacheKey(drawName, schemeId);
          uniqueSchemes.add(key);
        }
      });

      const nextCache: Record<string, SchemeGroup[]> = {};
      const fetchers = Array.from(uniqueSchemes).map(async (key) => {
        const [dName, sId] = key.split('|');
        const data = await fetchSchemeData(dName, sId);
        if (data) {
          nextCache[key] = data;
        }
      });

      await Promise.all(fetchers);
      setSchemesCache(nextCache);
      setLoadingSchemes(false);
    };

    loadAllSchemes();
  }, [bills, report.time]);

  const calcSuperAmount = (win: WinEntry, scheme: string, billNo: string) => {
    const bill = bills.find((b: any) => b.billNo === billNo);
    const drawName = extractDrawName(bill, report.time || 'ALL');
    const schemeId = scheme || 'N/A';
    const cacheKey = getSchemeCacheKey(drawName, schemeId);
    const schemeGroups = schemesCache[cacheKey];

    if (!schemeGroups) return 0;
    return calculateDynamicSuperAmount(win, schemeGroups, drawName);
  };

  const allEntries = bills.flatMap((bill: Bill) =>
    (bill.winnings || []).map((win) => {
      const superAmount = calcSuperAmount(win, bill.scheme, bill.billNo);
      const total = superAmount + win.winAmount;
      return {
        ...win,
        billNo: bill.billNo,
        scheme: bill.scheme,
        drawName: bill.drawName || (win as any).drawName || report.time,
        path: bill.path || [],
        createdBy: bill.createdBy,
        superAmount,
        total,
      };
    })
  );

  const maxPathLen = bills.reduce((max, b) => Math.max(max, (b as any).path?.length || 0), 0);
  const totalWin = allEntries.reduce((sum, e) => sum + (e.winAmount || 0), 0);
  const totalSuperVal = allEntries.reduce((sum, e) => sum + (e.superAmount || 0), 0);
  const totalTotal = allEntries.reduce((sum, e) => sum + (e.total || 0), 0);

  const handleDownloadPDF = async () => {
    // 📌 Dynamic Hierarchy Headers
    const hierarchyHeaders = [];
    for (let i = 0; i < maxPathLen; i++) {
      hierarchyHeaders.push(`<th>U${i + 1}</th>`);
    }

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; }
            h1 { text-align: center; color: #0e7062; }
            .summary { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background-color: #0e7062; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>Winnings Report</h1>
          <div class="summary">
            <div>Ticket: ${report.time || 'ALL'} | Agent: ${report.agent}</div>
            <div>Date: ${report.fromDate} to ${report.toDate}</div>
            <div style="margin-top: 10px; font-weight: bold;">
              Total Amount: ₹${totalWin.toLocaleString()} | Total Super: ₹${totalSuperVal.toLocaleString()} | Grand Total: ₹${totalTotal.toLocaleString()}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Bill No</th>
                <th>Name</th>
                <th>Draw Time</th>
                ${hierarchyHeaders.join('')}
                <th>W</th>
                <th>Number</th>
                <th>Type</th>
                <th>Count</th>
                <th>Amount</th>
                <th>Super</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${allEntries.map(entry => {
      const pathHtml = [];
      for (let i = 0; i < maxPathLen; i++) {
        pathHtml.push(`<td>${entry.path?.[i] || '-'}</td>`);
      }
      return `
                <tr>
                  <td>${entry.billNo}</td>
                  <td>${entry.name || '-'}</td>
                  <td>${entry.drawName || '-'}</td>
                  ${pathHtml.join('')}
                  <td>${entry.createdBy || '-'}</td>
                  <td>${entry.number}</td>
                  <td>${entry.type}</td>
                  <td>${entry.count}</td>
                  <td>${entry.winAmount}</td>
                  <td>${(entry.superAmount || 0).toFixed(2)}</td>
                  <td>${(entry.total || 0).toFixed(2)}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error("PDF Export Error:", error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.teal} />
        <Text style={{ marginTop: 10 }}>Loading details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detailed Winnings</Text>
        <TouchableOpacity onPress={handleDownloadPDF} style={styles.headerIcon}>
          <Ionicons name="download-outline" size={24} color={COLORS.teal} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Agent</Text>
            <Text style={styles.summaryColon}>: </Text>
            <Text style={styles.summaryValue}>{report.agent}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryColon}>: </Text>
            <Text style={styles.summaryValue}>{totalWin.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Super</Text>
            <Text style={styles.summaryColon}>: </Text>
            <Text style={styles.summaryValue}>{totalSuperVal.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <Text style={[styles.summaryLabel, styles.boldText]}>Grand Total</Text>
            <Text style={[styles.summaryColon, styles.boldText]}>: </Text>
            <Text style={[styles.summaryValue, styles.boldText]}>{totalTotal.toLocaleString()}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 900 + (maxPathLen * 100) }}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.headerRow]}>
              <View style={styles.cell}><Text style={styles.headerText}>Bill</Text></View>
              <View style={styles.cell}><Text style={styles.headerText}>Name</Text></View>
              <View style={styles.cell}><Text style={styles.headerText}>Draw Time</Text></View>
              {Array.from({ length: maxPathLen }).map((_, i) => (
                <View key={`u${i}`} style={styles.cell}>
                  <Text style={styles.headerText}>U{i + 1}</Text>
                </View>
              ))}
              <View style={styles.cell}><Text style={styles.headerText}>W</Text></View>
              <View style={styles.cell}><Text style={styles.headerText}>Number</Text></View>
              <View style={styles.cell}><Text style={styles.headerText}>Type</Text></View>
              <View style={styles.cell}><Text style={styles.headerText}>Count</Text></View>
              <View style={styles.cell}><Text style={styles.headerText}>Win Amount</Text></View>
              <View style={styles.cell}><Text style={styles.headerText}>Super</Text></View>
              <View style={[styles.cell, styles.lastCell]}><Text style={styles.headerText}>Total</Text></View>
            </View>

            {/* Data Rows */}
            {allEntries.map((entry, idx) => {
              const isTealRow = idx % 2 !== 0;
              const textColor = isTealRow ? COLORS.white : COLORS.black;
              const bgColor = isTealRow ? COLORS.rowTeal : COLORS.rowWhite;

              return (
                <View key={idx} style={[styles.tableRow, { backgroundColor: bgColor }]}>
                  <View style={styles.cell}><Text style={[styles.cellText, { color: textColor }]}>{entry.billNo}</Text></View>
                  <View style={styles.cell}><Text style={[styles.cellText, { color: textColor }]}>{entry.name || '-'}</Text></View>
                  <View style={styles.cell}><Text style={[styles.cellText, { color: textColor }]}>{entry.drawName || '-'}</Text></View>
                  {Array.from({ length: maxPathLen }).map((_, i) => (
                    <View key={`u-row-${i}`} style={styles.cell}>
                      <Text style={[styles.cellText, { color: textColor }]}>{entry.path?.[i] || '-'}</Text>
                    </View>
                  ))}
                  <View style={styles.cell}><Text style={[styles.cellText, { color: textColor }]}>{entry.createdBy || '-'}</Text></View>
                  <View style={styles.cell}><Text style={[styles.cellText, { color: textColor }]}>{entry.number}</Text></View>
                  <View style={styles.cell}><Text style={[styles.cellText, { color: textColor }]}>{entry.type}</Text></View>
                  <View style={styles.cell}><Text style={[styles.cellText, { color: textColor }]}>{entry.count}</Text></View>
                  <View style={styles.cell}><Text style={[styles.cellText, { color: textColor }]}>{entry.winAmount}</Text></View>
                  <View style={styles.cell}><Text style={[styles.cellText, { color: textColor }]}>₹{entry.superAmount?.toFixed(2)}</Text></View>
                  <View style={[styles.cell, styles.lastCell]}><Text style={[styles.cellText, { color: textColor, fontWeight: 'bold' }]}>₹{entry.total?.toFixed(2)}</Text></View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WinningDetailedScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eeeeee", marginTop: 30,
  },
  headerIcon: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "600", color: COLORS.black },
  scrollContainer: { flex: 1, backgroundColor: "#f5f5f5" },
  summaryCard: {
    backgroundColor: COLORS.white, margin: 8, padding: 16, borderRadius: 4,
    borderWidth: 1, borderColor: "#dddddd", elevation: 1,
  },
  summaryRow: { flexDirection: "row", marginBottom: 4 },
  summaryLabel: { flex: 1.5, fontSize: 16, color: COLORS.black },
  summaryColon: { width: 15, fontSize: 16, color: COLORS.black },
  summaryValue: { flex: 1, fontSize: 16, color: COLORS.black, fontWeight: "500" },
  boldText: { fontWeight: "bold" },
  tableRow: { flexDirection: "row", alignItems: "center", height: 45 },
  headerRow: { backgroundColor: COLORS.teal },
  headerText: { color: COLORS.white, fontWeight: "bold", fontSize: 14 },
  cell: {
    width: 100, paddingHorizontal: 8, justifyContent: "center", height: "100%",
    borderRightWidth: 0.5, borderRightColor: "rgba(0,0,0,0.05)",
  },
  lastCell: { borderRightWidth: 0 },
  cellText: { fontSize: 13, fontWeight: "500" },
});
