import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Domain, extractBetType } from "./NetPayScreen";
import { fetchSchemeData, calculateDynamicSuperAmount, SchemeGroup, extractDrawName, getSchemeCacheKey } from '../utils/schemeUtils';

const { width, height } = Dimensions.get("window");
const emojiOptions = ["🎉", "🎊", "✨", "💥", "🧨"];

// Recursively get all sub-users
const getAllSubUsers = (username: string, usersList: any[]): string[] => {
  const children = usersList
    .filter((u: any) => u.parent === username)
    .map((u: any) => u.username);
  let all = [...children];
  children.forEach((child) => {
    all = all.concat(getAllSubUsers(child, usersList));
  });
  return all;
};

// Fixed theme (light)
const colors = {
  background: "#f5f5f5",
  card: "#fff",
  text: "#000",
  header: "#fa8686dc",
  border: "#aaa",
  altRow: "#f9f9f9",
  winningBorder: "#4caf50",
  footer: "#ddd",
  positive: "#4caf50",
  negative: "#f44336",
  faded: "#999",
};

export default function WinningDetailed({ route }: any) {
  const {
    fromDate,
    toDate,
    matchedEntries = [],
    usersList = [],
    loggedInUser, // must include loggedInUser.id or loggedInUser.username
    selectedTime = "KERALA 3 PM", // optional default draw name
    time,
    fromAccountSummary,
    userRates = {},
  } = route.params || {};
  console.log("paramssssss", route.params);

  const [selectedUser, setSelectedUser] = useState("All");
  const [schemesCache, setSchemesCache] = useState<Record<string, SchemeGroup[]>>({});
  const [loadingSchemes, setLoadingSchemes] = useState(true);

  // Fetch unique schemes for all bills in the report
  useEffect(() => {
    const loadAllSchemes = async () => {
      setLoadingSchemes(true);
      const uniqueSchemeKeys = new Set<string>();

      matchedEntries.forEach((entry: any) => {
        const drawName = extractDrawName(entry, time);
        if (!drawName) return;

        // If Account Summary, use the creator's scheme. Else use viewer's scheme.
        const schemeId = fromAccountSummary
          ? (entry.scheme || 'Scheme 1')
          : (loggedInUser?.scheme || 'Scheme 1');

        uniqueSchemeKeys.add(getSchemeCacheKey(drawName, schemeId));
      });

      const nextCache: Record<string, SchemeGroup[]> = {};
      const fetchers = Array.from(uniqueSchemeKeys).map(async (key) => {
        const [dName, sId] = key.split('|');
        const data = await fetchSchemeData(dName, sId);
        if (data) nextCache[key] = data;
      });

      await Promise.all(fetchers);
      setSchemesCache(nextCache);
      setLoadingSchemes(false);
    };

    if (matchedEntries.length > 0) {
      loadAllSchemes();
    } else {
      setLoadingSchemes(false);
    }
  }, [matchedEntries, time, loggedInUser, fromAccountSummary]);

  const filteredByDateRange = matchedEntries.filter((entry: any) => {
    const entryDate = entry.date
      ? entry.date.split("T")[0]
      : entry.date;
    return entryDate >= fromDate && entryDate <= toDate;
  });
  const usernames = Array.from(
    new Set(filteredByDateRange.map((e: any) => e.username || e.createdBy))
  );

  const selectedHierarchyUsers =
    selectedUser === "All"
      ? usernames
      : [selectedUser, ...getAllSubUsers(selectedUser, usersList)];

  // Filter entries for selected user + sub-users
  const filteredUsers = filteredByDateRange.filter((entry: any) =>
    selectedHierarchyUsers.includes(entry.username || entry.createdBy)
  );

  // Aggregate totals per user
  const userSummary = selectedHierarchyUsers.map((user) => {
    const entries = filteredUsers.filter(
      (e: any) => (e.username || e.createdBy) === user
    );

    const normalizeBetType = (typeStr: string): string => {
      if (!typeStr) return "";
      const extracted = extractBetType(typeStr);
      if (typeStr.includes("-")) return extracted;
      const drawPrefixes = ["LSK3", "DEAR1", "DEAR6", "DEAR8"];
      for (const prefix of drawPrefixes) {
        if (extracted.startsWith(prefix)) return extracted.substring(prefix.length);
      }
      return extracted;
    };

    const totalSales = entries.reduce((sum: number, entry: any) => {
      const betType = normalizeBetType(entry.type);
      const drawLabelMap: Record<string, string> = {
        "LSK 3 PM": "KERALA 3 PM",
        "DEAR 1 PM": "DEAR 1 PM",
        "DEAR 6 PM": "DEAR 6 PM",
        "DEAR 8 PM": "DEAR 8 PM",
      };
      const mappedLabel = drawLabelMap[entry.timeLabel] || entry.timeLabel;
      const normalizedLabel = mappedLabel.replace(/\s+(PM|AM)$/gi, '$1');
      const entryUser = entry.createdBy || entry.username;
      const rate = userRates[entryUser]?.[normalizedLabel]?.[betType] ?? 10;
      return sum + (entry.count || 0) * rate;
    }, 0);

    const calcSuperAmount = (win: any, bill: any) => {
      const drawName = extractDrawName(bill, time);
      const schemeId = fromAccountSummary
        ? (bill.scheme || 'Scheme 1')
        : (loggedInUser?.scheme || 'Scheme 1');
      const cacheKey = getSchemeCacheKey(drawName, schemeId);
      const schemeGroups = schemesCache[cacheKey];
      if (!schemeGroups) return 0;
      return calculateDynamicSuperAmount(win, schemeGroups, drawName);
    };

    // Use backend-calculated winning and super if available, else fallback to calculation
    const billsMap: Record<string, any> = {};
    entries.forEach((entry: any) => {
      // Check for winning (either prize or super prize from backend)
      const hasWinning = (entry.winAmount && entry.winAmount > 0) || (entry.superAmount && entry.superAmount > 0);
      if (!entry.billNo || !hasWinning) return;

      if (!billsMap[entry.billNo]) {
        billsMap[entry.billNo] = {
          billNo: entry.billNo,
          scheme: entry.scheme,
          drawName: entry.drawName || entry.timeLabel,
          winnings: []
        };
      }
      billsMap[entry.billNo].winnings.push({
        type: normalizeBetType(entry.type),
        winType: entry.winType,
        winAmount: entry.winAmount || 0,
        superAmount: entry.superAmount || 0, // Store backend super if provided
        count: entry.count || 1
      });
    });

    let totalWinning = 0;
    Object.values(billsMap).forEach((bill: any) => {
      bill.winnings.forEach((win: any) => {
        // If backend provided superAmount, use it. Otherwise calculate.
        const superAmt = (win.superAmount !== undefined && win.superAmount !== null)
          ? win.superAmount
          : calcSuperAmount(win, bill);
        totalWinning += win.winAmount + superAmt;
      });
    });

    // console.log("🧾 Total Bills:", Object.keys(billsMap).length);
    // console.log("🎯 FINAL totalWinning:", totalWinning);

    // Calculate and log totals like WinningReportSummary
    let totalPrizeAll = 0;
    let totalSuperAll = 0;
    // console.log("📋 BILL BREAKDOWN:");
    Object.values(billsMap).forEach((bill: any) => {
      let billPrize = 0;
      let billSuper = 0;
      bill.winnings.forEach((win: any) => {
        const superAmt = calcSuperAmount(win, bill);
        billPrize += win.winAmount;
        billSuper += superAmt;
      });
      totalPrizeAll += billPrize;
      totalSuperAll += billSuper;
    });
    // console.log("📊 SUMMARY - Total Prize:", totalPrizeAll, "| Total Super:", totalSuperAll, "| Grand Total:", totalPrizeAll + totalSuperAll);

    // Check for any bills that might have zero winnings
    const zeroWinBills = Object.values(billsMap).filter(bill => bill.winnings.length === 0);
    if (zeroWinBills.length > 0) {
      // console.log("⚠️ Bills with no winnings:", zeroWinBills.map(b => b.billNo));
    }



    // const totalAmount = totalPrize + totalSuper;

    // const totalWinning = entries.reduce((sum, e) => sum + (e.winAmount || 0), 0);

    return {
      user,
      totalEntries: entries.length,
      totalSales,
      totalWinning,
      netPay: totalSales - totalWinning,
    };
  });

  // Footer totals
  const footerTotals = {
    entries: userSummary.reduce((sum: number, u: any) => sum + (u.totalEntries || 0), 0),
    sales: userSummary.reduce((sum: number, u: any) => sum + (u.totalSales || 0), 0),
    winning: userSummary.reduce((sum: number, u: any) => sum + (u.totalWinning || 0), 0),
    netPay: userSummary.reduce((sum: number, u: any) => sum + (u.netPay || 0), 0),
  };

  // Total winning for confetti
  const totalWinningAmount = userSummary.reduce(
    (sum: number, u: any) => sum + (u.totalWinning || 0),
    0
  );

  const confettis = Array.from({ length: 15 }).map(() => ({
    top: useRef(new Animated.Value(-50)).current as Animated.Value,
    left: Math.random() * width,
    emoji: emojiOptions[Math.floor(Math.random() * emojiOptions.length)] as string,
  }));

  useEffect(() => {
    if (totalWinningAmount > 0) {
      confettis.forEach(({ top }, index) => {
        setTimeout(() => {
          Animated.timing(top, {
            toValue: height + 100,
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: false,
          }).start();
        }, index * 200);
      });
    }
  }, [totalWinningAmount]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {fromAccountSummary ? "Account" : "User-wise"} Summary
      </Text>

      {/* User Filter */}
      {usernames.length > 1 && (
        <View style={[styles.filterBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>
            Filter by User:
          </Text>
          <Picker
            selectedValue={selectedUser}
            onValueChange={(value) => setSelectedUser(value)}
            style={styles.picker}
            dropdownIconColor={colors.text}
          >
            <Picker.Item label="All Users" value="All" color={colors.text} />
            {usernames.map((name: any) => (
              <Picker.Item
                key={name}
                label={name}
                value={name}
                color={colors.text}
              />
            ))}
          </Picker>
        </View>
      )}

      {/* Table */}
      <View>
        {/* Header */}
        <View style={styles.tableRow}>
          <View style={styles.cell}>
            <Text style={styles.cellText}>User</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellText}>Total Sales</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellText}>Winning</Text>
          </View>
          <View style={[styles.cell, styles.lastCell]}>
            <Text style={styles.cellText}>Net Pay</Text>
          </View>
        </View>

        {/* Rows */}
        {userSummary.map((user: any, index: number) => (
          <View
            key={index}
            style={[
              styles.tableRow,
              {
                backgroundColor:
                  index % 2 === 0 ? colors.card : colors.altRow,
                borderLeftColor:
                  user.totalWinning > 0
                    ? colors.winningBorder
                    : "transparent",
              },
            ]}
          >
            <View style={styles.cell}>
              <Text style={{ color: colors.text }}>{user.user}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={{ color: colors.text }}>{user.totalSales}</Text>
            </View>
            <View style={styles.cell}>
              <Text
                style={{
                  color:
                    user.totalWinning > 0
                      ? colors.positive
                      : colors.faded,
                }}
              >
                {user.totalWinning}
              </Text>
            </View>
            <View style={[styles.cell, styles.lastCell]}>
              <Text
                style={{
                  color:
                    user.netPay >= 0 ? colors.positive : colors.negative,
                }}
              >
                {user.netPay}
              </Text>
            </View>
          </View>
        ))}

        {/* Footer */}
        <View
          style={[
            styles.tableRow,
            {
              backgroundColor: colors.footer,
              borderTopWidth: 2,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={styles.cell}>
            <Text style={{ color: colors.text }}>Total</Text>
          </View>
          <View style={styles.cell}>
            <Text style={{ color: colors.text }}>₹{footerTotals.sales}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={{ color: colors.text }}>₹{footerTotals.winning}</Text>
          </View>
          <View style={[styles.cell, styles.lastCell]}>
            <Text
              style={{
                color:
                  footerTotals.netPay >= 0
                    ? colors.positive
                    : colors.negative,
              }}
            >
              {footerTotals.netPay}
            </Text>
          </View>
        </View>
      </View>

      {/* Confetti */}
      {totalWinningAmount > 0 &&
        confettis.map((item, index) => (
          <Animated.Text
            key={index}
            style={[styles.confetti, { top: item.top, left: item.left }]}
          >
            {item.emoji}
          </Animated.Text>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 0,
  },
  filterBox: {
    marginHorizontal: 0,
    marginBottom: 0,
    padding: 2,
    borderRadius: 4,
  },
  filterLabel: {
    fontWeight: "600",
    marginBottom: 0,
    fontSize: 12,
  },
  picker: {
    height: 34,
    width: 120,
    margin: 0,
    padding: 0,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "black",
    backgroundColor: 'green'
  },
  cell: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
    padding: 9,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  cellText: {
    fontWeight: "500",
    fontSize: 14,
    textAlign: "center",
  },
  confetti: {
    position: "absolute",
    fontSize: 16,
    zIndex: 1000,
  },
});