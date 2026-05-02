// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   SafeAreaView,
//   TouchableOpacity,
// } from 'react-native';
// import { Ionicons, AntDesign } from '@expo/vector-icons';
// import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { Domain } from './NetPayScreen';

// type RootStackParamList = {
//   Edit: { billNo: string; loggedInUser?: string };
//   Main: undefined;
//   SalesReportDetailedAll: {
//     fromDate: string;
//     toDate: string;
//     name: string;
//     createdBy?: string;
//     timeLabel?: string;
//     entries?: EntryItem[];
//     showOnlyDirect?: boolean;
//     loggedInUser?: string;
//   };
// };

// type SalesReportRouteProp = RouteProp<RootStackParamList, 'SalesReportDetailedAll'>;

// interface EntryItem {
//   _id: string;
//   billNo?: string | number;
//   billNumber?: string | number;
//   bill_no?: string | number;
//   game?: string;
//   timeLabel?: string;
//   number: string;
//   count: number;
//   name: string;
//   rate?: number; // Add rate field
//   type?: string; // Add type field
//   createdAt?: string;
//   createdBy?: string;
//   time?: string;
// }

// interface GroupedEntry {
//   name?: string;
//   billNo: string;
//   createdAt?: string;
//   createdBy?: string;
//   timeLabel?: string;
//   items: EntryItem[];
// }

// const SalesReportDetailedAll = () => {
//   const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
//   const route = useRoute<SalesReportRouteProp>();
//   const { fromDate, toDate, createdBy, timeLabel, entries, loggedInUser, showOnlyDirect } = route.params || {};
//   console.log("entries==========", entries);
//   console.log("entries==========", loggedInUser);
//   // console.log("entries==========",route.params);

//   const [groupedEntries, setGroupedEntries] = useState<GroupedEntry[]>([]);
//   const [loading, setLoading] = useState(true);


//   useEffect(() => {
//     const fetchFilteredEntries = async () => {
//       try {
//         if (entries && Array.isArray(entries)) {
//           groupAndSet(entries);
//           setLoading(false);
//           return;
//         }

//         const queryParams = new URLSearchParams({
//           fromDate: String(fromDate || ''),
//           toDate: String(toDate || ''),
//           createdBy: String(createdBy || ''),
//           timeLabel: String(timeLabel || 'all'),
//           loggedInUser: String(loggedInUser || ''),
//         }).toString();

//         const response = await fetch(`${Domain}/report/salesReport?${queryParams}`);
//         const result = await response.json();

//         console.log('📦 Query URL:', `${Domain}/report/salesReport?${queryParams}`);

//         if (result && result.entries) {
//           let data = result.entries;
//           if (showOnlyDirect && createdBy) {
//             data = data.filter((e: any) => e.createdBy === createdBy);
//           }
//           groupAndSet(data);
//         } else {
//           setGroupedEntries([]);
//         }
//       } catch (err) {
//         console.error('❗ Fetch error:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     const groupAndSet = (data: EntryItem[]) => {
//       const grouped: { [key: string]: GroupedEntry } = {};
//       data.forEach((entry) => {
//         const key = String(entry.billNo || entry.billNumber || entry.bill_no || entry._id);
//         if (!grouped[key]) {
//           grouped[key] = {
//             billNo: key,
//             createdAt: entry.createdAt,
//             createdBy: entry.createdBy,
//             timeLabel: entry.timeLabel,
//             name: entry.name, // ✅ SET NAME HERE
//             items: [],
//           };
//         }
//         grouped[key].items.push(entry);
//       });
//       setGroupedEntries(Object.values(grouped));
//     };

//     fetchFilteredEntries();
//   }, [fromDate, toDate, createdBy, timeLabel, entries]);

//   const renderGroupedEntry = ({ item }: { item: GroupedEntry }) => {
//     let totalCount = 0;
//     let totalAmount = 0;

//     item.items.forEach((entry) => {
//       const count = Number(entry.count) || 0;
//       const rate = Number(entry.rate) || 0; // Use rate from entry
//       totalCount += count;
//       totalAmount += rate; // rate already contains count * rate
//     });

//     return (
//       <View style={styles.billContainer}>
//         <TouchableOpacity
//           onLongPress={() => navigation.navigate('Edit', { billNo: item.billNo, loggedInUser })}
//           style={styles.billHeader}
//         >
//           <View style={styles.billRowTop}>
//             <Text style={styles.billText}>
//               Bill <Text style={styles.boldText}>{item.billNo}</Text>,
//             </Text>
//             <Text style={styles.boldText}>{item.timeLabel}</Text>
//             <Text style={styles.boldText}>
//               {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : ''}
//             </Text>
//             <Text style={styles.boldText}>
//               {item.createdAt
//                 ? new Date(item.createdAt).toLocaleTimeString('en-IN', {
//                   hour: '2-digit',
//                   minute: '2-digit',
//                   hour12: true,
//                 })
//                 : ''}
//             </Text>
//           </View>
//           <View style={styles.billRowBottom}>
//             <Text style={styles.billText}>
//               Count: <Text style={styles.boldText}>{totalCount}</Text>
//             </Text>
//             <Text style={styles.billText}>
//               Price: <Text style={styles.boldText}>{totalAmount.toFixed(2)}</Text>
//             </Text>

//           </View>
//           <Text style={styles.billText}>
//             A: <Text style={styles.boldText}>{item.createdBy}</Text>
//           </Text>
//           <Text style={styles.billText}>
//             Name: <Text style={styles.boldText}>{item.name}</Text>
//           </Text>

//         </TouchableOpacity>
//         <View style={[styles.itemRow, { backgroundColor: '#eee' }]}>
//           <Text style={[styles.itemCell, { fontWeight: 'bold' }]}>Type</Text>
//           <Text style={[styles.itemCell, { fontWeight: 'bold' }]}>Number</Text>
//           <Text style={[styles.itemCell, { fontWeight: 'bold' }]}>Count</Text>
//           <Text style={[styles.itemCell, { fontWeight: 'bold' }]}>Amount</Text>
//         </View>
//         {/* Sort numbers in bill by created time */}
//         {item.items
//           .slice()
//           .sort((a, b) => {
//             if (!a.createdAt || !b.createdAt) return 0;
//             return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
//           })
//           .map((entry, idx) => {
//             const rate = Number(entry.rate) || 0; // Use rate from entry
//             return (
//               <View style={styles.itemRow} key={entry._id + idx}>
//                 <Text style={styles.itemCell}>{entry.type}</Text>
//                 <Text style={styles.itemCell}>{entry.number}</Text>

//                 <Text style={styles.itemCell}>{entry.count}</Text>
//                 <Text style={styles.itemCell}>{rate.toFixed(2)}</Text>
//               </View>
//             );
//           })}

//       </View>
//     );
//   };


//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color="black" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Filtered Sales Report</Text>
//         <TouchableOpacity onPress={() => navigation.navigate('Main')}>
//           <AntDesign name="home" size={24} color="red" />
//         </TouchableOpacity>
//       </View>

//       {loading ? (
//         <Text style={styles.loadingText}>Loading entries...</Text>
//       ) : groupedEntries.length === 0 ? (
//         <Text style={styles.loadingText}>No entries found.</Text>
//       ) : (
//         <FlatList
//           data={groupedEntries}
//           keyExtractor={(item) => item.billNo}
//           renderItem={renderGroupedEntry}
//           contentContainerStyle={{ paddingBottom: 20 }}
//         />
//       )}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#eeeeee',
//     padding: 10,
//     marginTop: 30,
//   },
//   loadingText: {
//     textAlign: 'center',
//     marginTop: 30,
//     fontSize: 16,
//     color: '#555',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingBottom: 10,
//     borderBottomWidth: 0.8,
//     borderColor: '#ccc',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   billContainer: {
//     marginBottom: 20,
//     backgroundColor: '#fff',
//     borderRadius: 6,
//     overflow: 'hidden',
//   },
//   billHeader: {
//     backgroundColor: '#f02b61',
//     padding: 10,
//   },
//   billRowTop: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   billRowBottom: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 5,
//   },
//   billText: {
//     color: '#fff',
//     fontSize: 13,
//   },
//   boldText: {
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   itemRow: {
//     flexDirection: 'row',
//     borderTopWidth: 1,
//     borderColor: '#ddd',
//     paddingVertical: 8,
//     paddingHorizontal: 10,
//     backgroundColor: '#fff',
//   },
//   itemCell: {
//     flex: 1,
//     fontSize: 14,
//     textAlign: 'center',
//   },
// });

// export default SalesReportDetailedAll;




import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Domain } from './NetPayScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLoading } from '../context/LoadingContext';

type RootStackParamList = {
  Edit: { billNo: string; loggedInUser?: string };
  Main: undefined;
  SalesReportDetailedAll: {
    fromDate: string;
    toDate: string;
    name: string;
    createdBy?: string;
    timeLabel?: string;
    entries?: EntryItem[];
    showOnlyDirect?: boolean;
    loggedInUser?: string;
  };
};

type SalesReportRouteProp = RouteProp<RootStackParamList, 'SalesReportDetailedAll'>;

interface EntryItem {
  _id: string;
  billNo?: string | number;
  billNumber?: string | number;
  bill_no?: string | number;
  game?: string;
  timeLabel?: string;
  number: string;
  count: number;
  name: string;
  rate?: number; // Add rate field
  type?: string; // Add type field
  createdAt?: string;
  createdBy?: string;
  time?: string;
}

interface GroupedEntry {
  name?: string;
  billNo: string;
  createdAt?: string;
  createdBy?: string;
  timeLabel?: string;
  items: EntryItem[];
}

const SalesReportDetailedAll = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<SalesReportRouteProp>();
  const { fromDate, toDate, createdBy, timeLabel, entries, loggedInUser, showOnlyDirect } = route.params || {};
  console.log("entries==========", entries);
  console.log("entries==========", loggedInUser);
  // console.log("entries==========",route.params);

  const [groupedEntries, setGroupedEntries] = useState<GroupedEntry[]>([]);
  const [entriesList, setEntriesList] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showLoading, hideLoading } = useLoading();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Grouping and Sorting logic
  const groupAndSet = useCallback((data: EntryItem[]) => {
    const grouped: { [key: string]: GroupedEntry } = {};
    data.forEach((entry) => {
      const key = String(entry.billNo || entry.billNumber || entry.bill_no || entry._id);
      if (!grouped[key]) {
        grouped[key] = {
          billNo: key,
          createdAt: entry.createdAt,
          createdBy: entry.createdBy,
          timeLabel: entry.timeLabel,
          name: entry.name,
          items: [],
        };
      }
      grouped[key].items.push(entry);
    });

    // Sort grouped entries by creation date of the most recent item in each group
    const result = Object.values(grouped).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Newest first
    });

    // Also sort items within each group
    result.forEach(group => {
      group.items.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Newest first
      });
    });

    setGroupedEntries(result);
  }, []);

  const fetchFilteredEntries = useCallback(async (isInitial = true) => {
    if (!isInitial && (!hasMore || isFetchingMore)) return;

    try {
      if (isInitial && !isRefreshing) showLoading();
      else if (!isInitial) setIsFetchingMore(true);

      // Normalize timeLabel: Backend usually expects "" for all draw times
      const cleanTimeLabel = (timeLabel && timeLabel.toLowerCase() !== 'all') ? timeLabel : '';

      const queryParams: any = {
        fromDate: String(fromDate || ''),
        toDate: String(toDate || ''),
        createdBy: String(createdBy || ''),
        timeLabel: cleanTimeLabel,
        loggedInUser: String(loggedInUser || ''),
        limit: '50',
        sort: '-1', // Encourage newest-first
        order: 'desc',
        view: 'detailed',
      };

      // Determine which endpoint to use:
      // - Direct Entries (for specific agents) use the /entries endpoint (supports pagination)
      // - Branch Reports (for Admin/Master) use the /report/salesReport endpoint (handles hierarchy)
      const endpoint = `${Domain}/report/salesReport`;

      // Only attach usertype for the direct entries endpoint to match summary behavior
      if (showOnlyDirect) {
        const storedUsertype = await AsyncStorage.getItem('usertype');
        queryParams.usertype = String(storedUsertype || '');
      }

      if (!isInitial && lastTimestamp) {
        queryParams.after = lastTimestamp;
      }

      const queryString = new URLSearchParams(queryParams).toString();
      // 🛡️ Fix: Use axios for auth headers
      const response = await axios.get(`${endpoint}?${queryString}`);
      const result = response.data;

      console.log('📦 Fetching entries:', { isInitial, url: `${endpoint}?${queryString}` });

      // Handle both result.data (from /entries) and result.entries (from /report/salesReport)
      // and support raw arrays or object formats
      let newData: EntryItem[] = [];
      if (Array.isArray(result)) {
        newData = result;
      } else if (result && typeof result === 'object') {
        newData = result.data || result.entries || [];
      }

      if (Array.isArray(newData)) {
        let filteredData = newData;
        if (showOnlyDirect && createdBy) {
          filteredData = newData.filter((e: any) => e.createdBy?.toLowerCase() === createdBy?.toLowerCase());
        }

        setEntriesList(prev => {
          const updatedList = isInitial ? filteredData : [...prev, ...filteredData];
          groupAndSet(updatedList);
          return updatedList;
        });

        setLastTimestamp(result.lastTimestamp || (newData.length > 0 ? newData[newData.length - 1].createdAt : null));

        // If we are using the report endpoint, it might not support cursor pagination, so we set hasMore to false
        // unless it's the direct entries endpoint which we know supports it.
        if (showOnlyDirect) {
          setHasMore(newData.length === 50);
        } else {
          setHasMore(false); // Hierarchy report usually returns everything at once
        }
      } else {
        if (isInitial) {
          setEntriesList([]);
          setGroupedEntries([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error('❗ Fetch error:', err);
    } finally {
      hideLoading();
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  }, [fromDate, toDate, createdBy, timeLabel, loggedInUser, showOnlyDirect, hasMore, isFetchingMore, isRefreshing, lastTimestamp, groupAndSet]);

  useEffect(() => {
    if (entries && Array.isArray(entries) && entries.length > 0) {
      setEntriesList(entries);
      groupAndSet(entries);
      setLoading(false);
      setHasMore(false);
    }
  }, [entries, groupAndSet]);

  useFocusEffect(
    useCallback(() => {
      fetchFilteredEntries(true);
    }, [fetchFilteredEntries])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    // Optional: setEntriesList([]); // Uncomment if you want to clear the list during refresh
    fetchFilteredEntries(true);
  };

  const loadMore = () => {
    if (hasMore && !isFetchingMore && !loading) {
      fetchFilteredEntries(false);
    }
  };

  const renderGroupedEntry = ({ item }: { item: GroupedEntry }) => {
    let totalCount = 0;
    let totalAmount = 0;

    item.items.forEach((entry) => {
      const count = Number(entry.count) || 0;
      const rate = Number(entry.rate) || 0; // Use rate from entry
      totalCount += count;
      totalAmount += rate; // rate already contains count * rate
    });

    return (
      <View style={styles.billContainer}>
        <TouchableOpacity
          onLongPress={() => navigation.navigate('Edit', { billNo: item.billNo, loggedInUser })}
          style={styles.billHeader}
        >
          <View style={styles.billRowTop}>
            <Text style={styles.billText}>
              Bill <Text style={styles.boldText}>{item.billNo}</Text>,
            </Text>
            <Text style={styles.boldText}>{item.timeLabel}</Text>
            <Text style={styles.boldText}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : ''}
            </Text>
            <Text style={styles.boldText}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
                : ''}
            </Text>
          </View>
          <View style={styles.billRowBottom}>
            <Text style={styles.billText}>
              Count: <Text style={styles.boldText}>{totalCount}</Text>
            </Text>
            <Text style={styles.billText}>
              Price: <Text style={styles.boldText}>{totalAmount.toFixed(2)}</Text>
            </Text>

          </View>
          <Text style={styles.billText}>
            A: <Text style={styles.boldText}>{item.createdBy}</Text>
          </Text>
          <Text style={styles.billText}>
            Name: <Text style={styles.boldText}>{item.name}</Text>
          </Text>

        </TouchableOpacity>
        <View style={[styles.itemRow, { backgroundColor: '#eee' }]}>
          <Text style={[styles.itemCell, { fontWeight: 'bold' }]}>Type</Text>
          <Text style={[styles.itemCell, { fontWeight: 'bold' }]}>Number</Text>
          <Text style={[styles.itemCell, { fontWeight: 'bold' }]}>Count</Text>
          <Text style={[styles.itemCell, { fontWeight: 'bold' }]}>Amount</Text>
        </View>
        {/* Sort numbers in bill by created time */}
        {item.items
          .slice()
          .sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          })
          .map((entry, idx) => {
            const rate = Number(entry.rate) || 0; // Use rate from entry
            return (
              <View style={styles.itemRow} key={entry._id + idx}>
                <Text style={styles.itemCell}>{entry.type}</Text>
                <Text style={styles.itemCell}>{entry.number}</Text>

                <Text style={styles.itemCell}>{entry.count}</Text>
                <Text style={styles.itemCell}>{rate.toFixed(2)}</Text>
              </View>
            );
          })}

      </View>
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filtered Sales Report</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <AntDesign name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      {loading && groupedEntries.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#E91E63" />
        </View>
      ) : groupedEntries.length === 0 ? (
        <Text style={styles.loadingText}>No entries found.</Text>
      ) : (
        <FlatList
          data={groupedEntries}
          keyExtractor={(item) => item.billNo}
          renderItem={renderGroupedEntry}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            isFetchingMore ? (
              <ActivityIndicator size="small" color="#E91E63" style={{ marginVertical: 20 }} />
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eeeeee',
    padding: 10,
    marginTop: 30,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#555',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 0.8,
    borderColor: '#ccc',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  billContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
  },
  billHeader: {
    backgroundColor: '#f02b61',
    padding: 10,
  },
  billRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  billText: {
    color: '#fff',
    fontSize: 13,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  itemRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  itemCell: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default SalesReportDetailedAll;