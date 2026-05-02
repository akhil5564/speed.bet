import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Domain } from './NetPayScreen';
import axios from 'axios';
import { formatDateIST } from '../utils/dateUtils';
import { useLoading } from '../context/LoadingContext';

export default function SalesReportScreen() {
  const navigation = useNavigation();
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [rawUsers, setRawUsers] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');
  const [selectedTime, setSelectedTime] = useState('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { showLoading, hideLoading } = useLoading();

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return formatDateIST(date);
  };


  useEffect(() => {
    const loadUserAndUsers = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('username');
        console.log("ddddddddddddddddddddd", `${Domain}/users`);
        console.log("ddddddddddddddddddddd", storedUser);
        if (storedUser) {
          setLoggedInUser(storedUser);

          // 🛡️ Fix: Use axios (which has the auth interceptor) instead of fetch
          const response = await axios.get(`${Domain}/users`);
          const data = response.data;

          if (Array.isArray(data)) {
            const filteredUsers = data.filter(
              (u: any) => u.createdBy?.toLowerCase() === storedUser?.toLowerCase()
            );

            const usernames = filteredUsers
              .map((u: any) => u.username)
              .filter((username: any) => typeof username === 'string' && username.trim() !== '');


            setAllUsers(usernames);
            setRawUsers(data);
          } else {
            console.error('Invalid data format from API');
          }
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
             setErrorMsg("Session expired. Please log in again.");
        }
        console.error('❌ Error loading users:', err);
      }
    };

    loadUserAndUsers();
  }, []);



  async function handleGenerateReport() {
    if (toDate < fromDate) {
      setErrorMsg("To date must be after or equal to From date");
      return;
    }

    showLoading();
    setErrorMsg(null);

    try {
      const params = {
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
        createdBy: selectedAgent || "",
        timeLabel: selectedTime || "all",
        loggedInUser,
        view: "summary",
      };

      console.log("📤 Requesting Sales Report with params:", params);

      const res = await axios.get(`${Domain}/report/salesReport`, { params });

      if (!res.data) {
        setErrorMsg("No report data returned.");
        return;
      }

      console.log("✅ Sales Report (backend):", res.data);

      // Navigate to SalesReportSummery with backend response
      (navigation as any).navigate("SalesReportSummery", {
        report: res.data,
        loggedInUser,
        allUsersData: rawUsers
      });

    } catch (err: any) {
      console.error("❌ Fetch error (sales report frontend):", err);
      setErrorMsg("Failed to fetch sales report: " + err.message);
    } finally {
      hideLoading();
    }
  }





  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Sales Report</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('Main')}>
          <Ionicons name="home" size={24} color="red" />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>


        <Picker
          selectedValue={selectedTime}
          onValueChange={(value) => setSelectedTime(value)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="ALL" value="all" color="#000000" />
          <Picker.Item label="DEAR 1 PM" value="DEAR 1 PM" color="#000000" />
          <Picker.Item label="LSK 3 PM" value="LSK 3 PM" color="#000000" />
          <Picker.Item label="DEAR 6 PM" value="DEAR 6 PM" color="#000000" />
          <Picker.Item label="DEAR 8 PM" value="DEAR 8 PM" color="#000000" />
        </Picker>

        <View style={styles.row}>
          <View style={styles.dateInput}>
            <Text style={styles.label}>From</Text>
            <TouchableOpacity onPress={() => setShowFrom(true)}>
              <Text style={styles.dateText}>{fromDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showFrom && (
              <DateTimePicker
                value={fromDate}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowFrom(false);
                  if (date) setFromDate(date);
                }}
              />
            )}
          </View>

          <View style={styles.equalBox}>
            <Text style={styles.equalText}>=</Text>
          </View>

          <View style={styles.dateInput}>
            <Text style={styles.label}>To</Text>
            <TouchableOpacity onPress={() => setShowTo(true)}>
              <Text style={styles.dateText}>{toDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showTo && (
              <DateTimePicker
                value={toDate}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowTo(false);
                  if (date) setToDate(date);
                }}
              />
            )}
          </View>
        </View>

        <TextInput
          placeholder="Ticket Number"
          placeholderTextColor="#000000"
          style={styles.input}
        />

        <View style={styles.row}>
          <Picker style={styles.halfPicker}>
            <Picker.Item label="Select" value="" color="#000000" />
            <Picker.Item label="1" value="1" color="#000000" />
            <Picker.Item label="2" value="2" color="#000000" />
            <Picker.Item label="3" value="3" color="#000000" />
          </Picker>
          <Picker style={styles.halfPicker}>
            <Picker.Item label="Mode" value="" color="#000000" />
          </Picker>
        </View>

        <Picker
          selectedValue={selectedAgent}
          onValueChange={(value) => setSelectedAgent(value)}
          style={styles.picker}
        >
          <Picker.Item label={`Logged in: ${loggedInUser}`} value="" enabled={false} color="#000000" />
          {allUsers.map((username, index) => (
            <Picker.Item key={index} label={username} value={username} color="#000000" />
          ))}
        </Picker>

        <TouchableOpacity style={styles.generateButton} onPress={handleGenerateReport}>
          <Text style={styles.generateButtonText}>Generate Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  form: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },
  picker: {
    backgroundColor: '#f4f4f4',
    borderRadius: 5,
    marginBottom: 10,
    color: '#000000', // 🔥 Fix for Dark Mode
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 5,
    marginBottom: 10,
    color: '#000000',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  dateInput: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    color: '#000000',
    fontWeight: 'bold',
  },
  dateText: {
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    color: '#000000',
    fontWeight: 'bold',
  },
  equalBox: {
    width: 40,
    height: 40,
    backgroundColor: '#211e1f',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 16,
  },
  equalText: {
    color: '#f3e9e9ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  halfPicker: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    borderRadius: 5,
    color: '#000000', // 🔥 Fix for Dark Mode
  },
  generateButton: {
    backgroundColor: '#211e1f',
    padding: 14,
    borderRadius: 5,
    marginTop: 20,
  },
  generateButtonText: {
    color: '#f7ededff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pickerItem: {
    height: 44,
  },
});









// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
// } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Domain } from './NetPayScreen';
// import axios from 'axios';
// import { formatDateIST } from '../utils/dateUtils';

// export default function SalesReportScreen() {
//   const navigation = useNavigation();
//   const [fromDate, setFromDate] = useState(new Date());
//   const [toDate, setToDate] = useState(new Date());
//   const [showFrom, setShowFrom] = useState(false);
//   const [showTo, setShowTo] = useState(false);
//   const [allUsers, setAllUsers] = useState<string[]>([]);
//   const [rawUsers, setRawUsers] = useState<any[]>([]);
//   const [selectedAgent, setSelectedAgent] = useState('');
//   const [loggedInUser, setLoggedInUser] = useState('');
//   const [selectedTime, setSelectedTime] = useState('all');
//   const [errorMsg, setErrorMsg] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);

//   const formatDate = (date: Date | undefined) => {
//     if (!date) return '';
//     return formatDateIST(date);
//   };


//   useEffect(() => {
//     const loadUserAndUsers = async () => {
//       try {
//         const storedUser = await AsyncStorage.getItem('username');
//         console.log("ddddddddddddddddddddd", `${Domain}/users`);
//         console.log("ddddddddddddddddddddd", storedUser);
//         if (storedUser) {
//           setLoggedInUser(storedUser);

//           const response = await fetch(`${Domain}/users`);
//           console.log("ddddddddddddddddddddd", response);

//           const data = await response.json();

//           if (response.ok && Array.isArray(data)) {
//             const filteredUsers = data.filter(
//               (u: any) => u.createdBy === storedUser
//             );

//             const usernames = filteredUsers
//               .map((u: any) => u.username)
//               .filter((username: any) => typeof username === 'string' && username.trim() !== '');


//             setAllUsers(usernames);
//             setRawUsers(data);
//           } else {
//             console.error('Invalid data format from API');
//           }
//         }
//       } catch (err) {
//         console.error('❌ Error loading users:', err);
//       }
//     };

//     loadUserAndUsers();
//   }, []);



//   async function handleGenerateReport() {
//     if (toDate < fromDate) {
//       setErrorMsg("To date must be after or equal to From date");
//       return;
//     }

//     setLoading(true);
//     setErrorMsg(null);

//     try {
//       const params = {
//         fromDate: formatDate(fromDate),
//         toDate: formatDate(toDate),
//         createdBy: selectedAgent || "",   // backend handles loggedInUser if empty
//         timeLabel: selectedTime || "all"
//       };

//       console.log("📤 Requesting Sales Report with params:", params);

//       const res = await axios.get(`${Domain}/report/salesReport`, { params });

//       if (!res.data) {
//         setErrorMsg("No report data returned.");
//         setLoading(false);
//         return;
//       }

//       console.log("✅ Sales Report (backend):", res.data);

//       // Navigate to SalesReportSummery with backend response
//       (navigation as any).navigate("SalesReportSummery", {
//         report: res.data,
//         loggedInUser,
//         allUsersData: rawUsers
//       });

//     } catch (err: any) {
//       console.error("❌ Fetch error (sales report frontend):", err);
//       setErrorMsg("Failed to fetch sales report: " + err.message);
//     } finally {
//       setLoading(false);
//     }
//   }





//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color="#000" />
//         </TouchableOpacity>
//         <Text style={styles.headerText}>Sales Report</Text>
//         <TouchableOpacity onPress={() => (navigation as any).navigate('Main')}>
//           <Ionicons name="home" size={24} color="red" />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.form}>


//         <Picker
//           selectedValue={selectedTime}
//           onValueChange={(value) => setSelectedTime(value)}
//           style={styles.picker}
//           itemStyle={styles.pickerItem}
//         >
//           <Picker.Item label="ALL" value="all" color="#000000" />
//           <Picker.Item label="DEAR 1 PM" value="DEAR 1 PM" color="#000000" />
//           <Picker.Item label="LSK 3 PM" value="LSK 3 PM" color="#000000" />
//           <Picker.Item label="DEAR 6 PM" value="DEAR 6 PM" color="#000000" />
//           <Picker.Item label="DEAR 8 PM" value="DEAR 8 PM" color="#000000" />
//         </Picker>

//         <View style={styles.row}>
//           <View style={styles.dateInput}>
//             <Text style={styles.label}>From</Text>
//             <TouchableOpacity onPress={() => setShowFrom(true)}>
//               <Text style={styles.dateText}>{fromDate.toLocaleDateString()}</Text>
//             </TouchableOpacity>
//             {showFrom && (
//               <DateTimePicker
//                 value={fromDate}
//                 mode="date"
//                 display="default"
//                 onChange={(e, date) => {
//                   setShowFrom(false);
//                   if (date) setFromDate(date);
//                 }}
//               />
//             )}
//           </View>

//           <View style={styles.equalBox}>
//             <Text style={styles.equalText}>=</Text>
//           </View>

//           <View style={styles.dateInput}>
//             <Text style={styles.label}>To</Text>
//             <TouchableOpacity onPress={() => setShowTo(true)}>
//               <Text style={styles.dateText}>{toDate.toLocaleDateString()}</Text>
//             </TouchableOpacity>
//             {showTo && (
//               <DateTimePicker
//                 value={toDate}
//                 mode="date"
//                 display="default"
//                 onChange={(e, date) => {
//                   setShowTo(false);
//                   if (date) setToDate(date);
//                 }}
//               />
//             )}
//           </View>
//         </View>

//         <TextInput
//           placeholder="Ticket Number"
//           placeholderTextColor="#000000"
//           style={styles.input}
//         />

//         <View style={styles.row}>
//           <Picker style={styles.halfPicker}>
//             <Picker.Item label="Select" value="" color="#000000" />
//             <Picker.Item label="1" value="1" color="#000000" />
//             <Picker.Item label="2" value="2" color="#000000" />
//             <Picker.Item label="3" value="3" color="#000000" />
//           </Picker>
//           <Picker style={styles.halfPicker}>
//             <Picker.Item label="Mode" value="" color="#000000" />
//           </Picker>
//         </View>

//         <Picker
//           selectedValue={selectedAgent}
//           onValueChange={(value) => setSelectedAgent(value)}
//           style={styles.picker}
//         >
//           <Picker.Item label={`Logged in: ${loggedInUser}`} value="" enabled={false} color="#000000" />
//           {allUsers.map((username, index) => (
//             <Picker.Item key={index} label={username} value={username} color="#000000" />
//           ))}
//         </Picker>

//         <TouchableOpacity style={styles.generateButton} onPress={handleGenerateReport}>
//           <Text style={styles.generateButtonText}>Generate Report</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f2f2f2',
//     marginTop: 30,
//   },
//   header: {
//     flexDirection: 'row',
//     padding: 16,
//     backgroundColor: '#fff',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     elevation: 3,
//   },
//   headerText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#000000',
//   },
//   form: {
//     backgroundColor: '#fff',
//     margin: 16,
//     padding: 16,
//     borderRadius: 10,
//     elevation: 2,
//   },
//   picker: {
//     backgroundColor: '#f4f4f4',
//     borderRadius: 5,
//     marginBottom: 10,
//   },
//   input: {
//     backgroundColor: '#fff',
//     borderWidth: 1,
//     borderColor: '#ddd',
//     padding: 12,
//     borderRadius: 5,
//     marginBottom: 10,
//     color: '#000000',
//     fontWeight: 'bold',
//   },
//   row: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: 10,
//     marginBottom: 10,
//   },
//   dateInput: {
//     flex: 1,
//   },
//   label: {
//     fontSize: 12,
//     marginBottom: 4,
//     color: '#000000',
//     fontWeight: 'bold',
//   },
//   dateText: {
//     padding: 12,
//     backgroundColor: '#fff',
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 5,
//     color: '#000000',
//     fontWeight: 'bold',
//   },
//   equalBox: {
//     width: 40,
//     height: 40,
//     backgroundColor: '#211e1f',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 5,
//     marginTop: 16,
//   },
//   equalText: {
//     color: '#f3e9e9ff',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   halfPicker: {
//     flex: 1,
//     backgroundColor: '#f4f4f4',
//     borderRadius: 5,
//   },
//   generateButton: {
//     backgroundColor: '#211e1f',
//     padding: 14,
//     borderRadius: 5,
//     marginTop: 20,
//   },
//   generateButtonText: {
//     color: '#f7ededff',
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
//   pickerItem: {
//     height: 44,
//   },
// });