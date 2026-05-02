import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - icon types provided by Expo runtime
import { Ionicons, AntDesign } from '@expo/vector-icons';
import axios from 'axios';
import { Domain } from './NetPayScreen';
import { useLoading } from '../context/LoadingContext';

const SalesReportSummary = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { report, loggedInUser, allUsersData, currentLevelUser } = (route.params as any) || {};
  const [reportData, setReportData] = useState(report || {});
  const { showLoading, hideLoading } = useLoading();

  const {
    count = 0,
    amount = 0,
    date = '',
    fromDate,
    toDate,
    createdBy,
    timeLabel,
    entries = [],
    byAgent = [],
  } = reportData;

  const fetchReportData = useCallback(async () => {
    try {
      showLoading();
      const params = {
        fromDate,
        toDate,
        createdBy: currentLevelUser || createdBy || "",
        timeLabel: timeLabel || "all",
        loggedInUser,
        view: "summary",
      };

      const res = await axios.get(`${Domain}/report/salesReport`, { params });
      if (res.data) {
        setReportData(res.data);
      }
    } catch (err: any) {
      console.error("❌ Error auto-refreshing sales summary:", err);
    } finally {
      hideLoading();
    }
  }, [fromDate, toDate, createdBy, timeLabel, loggedInUser, currentLevelUser]);

  useFocusEffect(
    useCallback(() => {
      fetchReportData();
    }, [fetchReportData])
  );

  // Hierarchy Logic
  const effectiveParent = currentLevelUser || createdBy || loggedInUser;

  // Helper to find all descendants of a user
  const getAllDescendants = (parent: string, users: any[]): string[] => {
    let descendants: string[] = [];
    const children = users.filter((u) => u.createdBy?.toLowerCase() === parent?.toLowerCase());
    children.forEach((child) => {
      descendants.push(child.username);
      descendants = [...descendants, ...getAllDescendants(child.username, users)];
    });
    return descendants;
  };

  // Helper to calculate total for a branch (user + all descendants)
  const getBranchTotals = (agentName: string) => {
    if (!allUsersData) return null;
    const descendants = getAllDescendants(agentName, allUsersData);
    const branchUsernames = [agentName, ...descendants];

    let branchAmount = 0;
    let branchCount = 0;

    branchUsernames.forEach((uname) => {
      const agentRow = byAgent.find((r: any) => r.agent?.toLowerCase() === uname?.toLowerCase());
      if (agentRow) {
        branchAmount += Number(agentRow.amount) || 0;
        branchCount += Number(agentRow.count) || 0;
      }
    });

    return { amount: branchAmount, count: branchCount };
  };

  // Get totals for the top card (the current level's branch totals)
  const currentLevelTotals = currentLevelUser ? getBranchTotals(currentLevelUser) : { amount, count };
  const displayAmount = currentLevelTotals?.amount ?? amount;
  const displayCount = currentLevelTotals?.count ?? count;

  // Get direct sales for the effective parent (the current level's user themselves)
  const parentRow = byAgent.find((r: any) => r.agent?.toLowerCase() === effectiveParent?.toLowerCase());
  const selfSales = parentRow ? {
    agent: '(Direct Sales)',
    amount: Number(parentRow.amount) || 0,
    count: Number(parentRow.count) || 0,
    usertype: 'self',
    originalAgent: effectiveParent
  } : null;

  // Filter currentLevel agents (direct children of effectiveParent)
  const displayedAgents = (allUsersData || [])
    .filter((u: any) => u.createdBy?.toLowerCase() === effectiveParent?.toLowerCase())
    .map((u: any) => {
      const totals = getBranchTotals(u.username);
      if (totals && (totals.amount > 0 || totals.count > 0)) {
        return {
          agent: u.username,
          amount: totals.amount,
          count: totals.count,
          usertype: u.usertype,
        };
      }
      return null;
    })
    .filter((a: any) => a !== null);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Sales Report Summary</Text>
          {effectiveParent?.toLowerCase() !== loggedInUser?.toLowerCase() && (
            <Text style={{ fontSize: 12, color: '#666' }}>{effectiveParent}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => (navigation as any).navigate('Main')}>
          <AntDesign name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* Date Report Card */}
        <View style={styles.card}>
          <Text style={styles.dateText}>{date}</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Sales Amount :</Text>
            <Text style={styles.value}>{Number(displayAmount).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Count :</Text>
            <Text style={styles.value}>{displayCount}</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              (navigation as any).navigate('SalesReportDetailed', {
                fromDate,
                toDate,
                createdBy,
                timeLabel,
                loggedInUser,
              })
            }
          >
            <Text style={styles.buttonText}>View Detailed</Text>
          </TouchableOpacity>
        </View>

        {/* By Agent Breakdown */}
        {(Array.isArray(displayedAgents) && displayedAgents.length > 0 || (selfSales && (selfSales.amount > 0 || selfSales.count > 0))) && (
          <View>
            <Text style={[styles.headerTitle, { textAlign: 'center', marginVertical: 10 }]}>
              Breakdown for {effectiveParent}
            </Text>

            {/* Show parent's direct sales first if they exist */}
            {selfSales && (selfSales.amount > 0 || selfSales.count > 0) && (
              <View style={[styles.card, { backgroundColor: '#fff9f9' }]}>
                <View style={styles.agentHeader}>
                  <Text style={[styles.dateText, { color: '#333' }]}>{selfSales.agent}</Text>
                  <Text style={styles.userTypeBadge}>SELF</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Sales Amount :</Text>
                  <Text style={styles.value}>{selfSales.amount.toFixed(2)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Total Count :</Text>
                  <Text style={styles.value}>{selfSales.count}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#666' }]}
                  onPress={() =>
                    (navigation as any).navigate('SalesReportDetailed', {
                      fromDate,
                      toDate,
                      createdBy: selfSales.originalAgent,
                      timeLabel,
                      loggedInUser,
                      showOnlyDirect: true,
                      entries: [], // Force fetch for details
                    })
                  }
                >
                  <Text style={styles.buttonText}>View Direct Entries</Text>
                </TouchableOpacity>
              </View>
            )}

            {displayedAgents.map((row: any) => (
              <View key={row.agent} style={styles.card}>
                <View style={styles.agentHeader}>
                  <Text style={styles.dateText}>{row.agent}</Text>
                  <Text style={styles.userTypeBadge}>{row.usertype?.toUpperCase()}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Sales Amount :</Text>
                  <Text style={styles.value}>{Number(row.amount).toFixed(2)}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Total Count :</Text>
                  <Text style={styles.value}>{row.count}</Text>
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    if (row.usertype === 'master') {
                      (navigation as any).push('SalesReportSummery', {
                        report,
                        loggedInUser,
                        allUsersData,
                        currentLevelUser: row.agent,
                      });
                    } else {
                      (navigation as any).navigate('SalesReportDetailed', {
                        fromDate,
                        toDate,
                        createdBy: row.agent,
                        timeLabel,
                        loggedInUser,
                        showOnlyDirect: true,
                        entries: [], // Force fetch for details
                      });
                    }
                  }}
                >
                  <Text style={styles.buttonText}>
                    {row.usertype === 'master' ? 'View Children' : 'View Detailed'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SalesReportSummary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    padding: 10,
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 15,
    marginTop: 15,
    shadowColor: '#000',
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  dateText: {
    fontSize: 16,
    color: '#f02b61',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#211e1f',
    paddingVertical: 12,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
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







// import React, { useState, useCallback } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
// import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
// // @ts-ignore - icon types provided by Expo runtime
// import { Ionicons, AntDesign } from '@expo/vector-icons';
// import axios from 'axios';
// import { Domain } from './NetPayScreen';

// const SalesReportSummary = () => {
//   const navigation = useNavigation();
//   const route = useRoute();

//   const { report, loggedInUser, allUsersData, currentLevelUser } = (route.params as any) || {};
//   const [reportData, setReportData] = useState(report || {});

//   const {
//     count = 0,
//     amount = 0,
//     date = '',
//     fromDate,
//     toDate,
//     createdBy,
//     timeLabel,
//     entries = [],
//     byAgent = [],
//   } = reportData;

//   const fetchReportData = useCallback(async () => {
//     try {
//       const params = {
//         fromDate,
//         toDate,
//         createdBy: createdBy || "",
//         timeLabel: timeLabel || "all",
//         loggedInUser,
//       };

//       const res = await axios.get(`${Domain}/report/salesReport`, { params });
//       if (res.data) {
//         setReportData(res.data);
//       }
//     } catch (err: any) {
//       console.error("❌ Error auto-refreshing sales summary:", err);
//     }
//   }, [fromDate, toDate, createdBy, timeLabel, loggedInUser]);

//   useFocusEffect(
//     useCallback(() => {
//       fetchReportData();
//     }, [fetchReportData])
//   );

//   // Hierarchy Logic
//   const effectiveParent = currentLevelUser || createdBy || loggedInUser;

//   // Helper to find all descendants of a user
//   const getAllDescendants = (parent: string, users: any[]): string[] => {
//     let descendants: string[] = [];
//     const children = users.filter((u) => u.createdBy === parent);
//     children.forEach((child) => {
//       descendants.push(child.username);
//       descendants = [...descendants, ...getAllDescendants(child.username, users)];
//     });
//     return descendants;
//   };

//   // Helper to calculate total for a branch (user + all descendants)
//   const getBranchTotals = (agentName: string) => {
//     if (!allUsersData) return null;
//     const descendants = getAllDescendants(agentName, allUsersData);
//     const branchUsernames = [agentName, ...descendants];

//     let branchAmount = 0;
//     let branchCount = 0;

//     branchUsernames.forEach((uname) => {
//       const agentRow = byAgent.find((r: any) => r.agent === uname);
//       if (agentRow) {
//         branchAmount += Number(agentRow.amount) || 0;
//         branchCount += Number(agentRow.count) || 0;
//       }
//     });

//     return { amount: branchAmount, count: branchCount };
//   };

//   // Get totals for the top card (the current level's branch totals)
//   const currentLevelTotals = currentLevelUser ? getBranchTotals(currentLevelUser) : { amount, count };
//   const displayAmount = currentLevelTotals?.amount ?? amount;
//   const displayCount = currentLevelTotals?.count ?? count;

//   // Get direct sales for the effective parent (the current level's user themselves)
//   const parentRow = byAgent.find((r: any) => r.agent === effectiveParent);
//   const selfSales = parentRow ? {
//     agent: '(Direct Sales)',
//     amount: Number(parentRow.amount) || 0,
//     count: Number(parentRow.count) || 0,
//     usertype: 'self',
//     originalAgent: effectiveParent
//   } : null;

//   // Filter currentLevel agents (direct children of effectiveParent)
//   const displayedAgents = (allUsersData || [])
//     .filter((u: any) => u.createdBy === effectiveParent)
//     .map((u: any) => {
//       const totals = getBranchTotals(u.username);
//       if (totals && (totals.amount > 0 || totals.count > 0)) {
//         return {
//           agent: u.username,
//           amount: totals.amount,
//           count: totals.count,
//           usertype: u.usertype,
//         };
//       }
//       return null;
//     })
//     .filter((a: any) => a !== null);

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color="black" />
//         </TouchableOpacity>
//         <View style={{ flex: 1, alignItems: 'center' }}>
//           <Text style={styles.headerTitle}>Sales Report Summary</Text>
//           {effectiveParent !== loggedInUser && (
//             <Text style={{ fontSize: 12, color: '#666' }}>{effectiveParent}</Text>
//           )}
//         </View>
//         <TouchableOpacity onPress={() => (navigation as any).navigate('Main')}>
//           <AntDesign name="home" size={24} color="red" />
//         </TouchableOpacity>
//       </View>

//       <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
//         {/* Date Report Card */}
//         <View style={styles.card}>
//           <Text style={styles.dateText}>{date}</Text>

//           <View style={styles.row}>
//             <Text style={styles.label}>Sales Amount :</Text>
//             <Text style={styles.value}>{Number(displayAmount).toFixed(2)}</Text>
//           </View>
//           <View style={styles.row}>
//             <Text style={styles.label}>Total Count :</Text>
//             <Text style={styles.value}>{displayCount}</Text>
//           </View>

//           <TouchableOpacity
//             style={styles.button}
//             onPress={() =>
//               (navigation as any).navigate('SalesReportDetailed', {
//                 fromDate,
//                 toDate,
//                 createdBy,
//                 timeLabel,
//                 entries,
//                 loggedInUser,
//               })
//             }
//           >
//             <Text style={styles.buttonText}>View Detailed</Text>
//           </TouchableOpacity>
//         </View>

//         {/* By Agent Breakdown */}
//         {(Array.isArray(displayedAgents) && displayedAgents.length > 0 || (selfSales && (selfSales.amount > 0 || selfSales.count > 0))) && (
//           <View>
//             <Text style={[styles.headerTitle, { textAlign: 'center', marginVertical: 10 }]}>
//               Breakdown for {effectiveParent}
//             </Text>

//             {/* Show parent's direct sales first if they exist */}
//             {selfSales && (selfSales.amount > 0 || selfSales.count > 0) && (
//               <View style={[styles.card, { backgroundColor: '#fff9f9' }]}>
//                 <View style={styles.agentHeader}>
//                   <Text style={[styles.dateText, { color: '#333' }]}>{selfSales.agent}</Text>
//                   <Text style={styles.userTypeBadge}>SELF</Text>
//                 </View>
//                 <View style={styles.row}>
//                   <Text style={styles.label}>Sales Amount :</Text>
//                   <Text style={styles.value}>{selfSales.amount.toFixed(2)}</Text>
//                 </View>
//                 <View style={styles.row}>
//                   <Text style={styles.label}>Total Count :</Text>
//                   <Text style={styles.value}>{selfSales.count}</Text>
//                 </View>
//                 <TouchableOpacity
//                   style={[styles.button, { backgroundColor: '#666' }]}
//                   onPress={() =>
//                     (navigation as any).navigate('SalesReportDetailed', {
//                       fromDate,
//                       toDate,
//                       createdBy: selfSales.originalAgent,
//                       timeLabel,
//                       loggedInUser,
//                       showOnlyDirect: true,
//                       entries: entries.filter((e: any) => e.createdBy === selfSales.originalAgent),
//                     })
//                   }
//                 >
//                   <Text style={styles.buttonText}>View Direct Entries</Text>
//                 </TouchableOpacity>
//               </View>
//             )}

//             {displayedAgents.map((row: any) => (
//               <View key={row.agent} style={styles.card}>
//                 <View style={styles.agentHeader}>
//                   <Text style={styles.dateText}>{row.agent}</Text>
//                   <Text style={styles.userTypeBadge}>{row.usertype?.toUpperCase()}</Text>
//                 </View>

//                 <View style={styles.row}>
//                   <Text style={styles.label}>Sales Amount :</Text>
//                   <Text style={styles.value}>{Number(row.amount).toFixed(2)}</Text>
//                 </View>

//                 <View style={styles.row}>
//                   <Text style={styles.label}>Total Count :</Text>
//                   <Text style={styles.value}>{row.count}</Text>
//                 </View>

//                 <TouchableOpacity
//                   style={styles.button}
//                   onPress={() => {
//                     if (row.usertype === 'master') {
//                       (navigation as any).push('SalesReportSummery', {
//                         report,
//                         loggedInUser,
//                         allUsersData,
//                         currentLevelUser: row.agent,
//                       });
//                     } else {
//                       (navigation as any).navigate('SalesReportDetailed', {
//                         fromDate,
//                         toDate,
//                         createdBy: row.agent,
//                         timeLabel,
//                         loggedInUser,
//                         showOnlyDirect: true,
//                         entries: entries.filter((e: any) => e.createdBy === row.agent),
//                       });
//                     }
//                   }}
//                 >
//                   <Text style={styles.buttonText}>
//                     {row.usertype === 'master' ? 'View Children' : 'View Detailed'}
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             ))}
//           </View>
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// export default SalesReportSummary;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f1f1f1',
//     padding: 10,
//     marginTop: 30,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingBottom: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 6,
//     padding: 15,
//     marginTop: 15,
//     shadowColor: '#000',
//     elevation: 2,
//   },
//   row: {
//     flexDirection: 'row',
//     marginTop: 10,
//     alignItems: 'center',
//   },
//   label: {
//     fontSize: 16,
//     color: '#333',
//   },
//   value: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginLeft: 5,
//   },
//   dateText: {
//     fontSize: 16,
//     color: '#f02b61',
//     textAlign: 'center',
//     fontWeight: 'bold',
//   },
//   button: {
//     backgroundColor: '#f02b61',
//     paddingVertical: 12,
//     borderRadius: 5,
//     marginTop: 20,
//   },
//   buttonText: {
//     textAlign: 'center',
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   agentHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 5,
//   },
//   userTypeBadge: {
//     fontSize: 10,
//     backgroundColor: '#eee',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//     color: '#666',
//     fontWeight: 'bold',
//   },
// });
