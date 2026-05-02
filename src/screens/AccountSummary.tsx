import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Domain } from "./NetPayScreen";
import { formatDateIST } from "../utils/dateUtils";

function addDays(date: Date | string | number, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: any) {
  return formatDateIST(date);
}

// Extract bet type from the type field (e.g., "D-1-SUPER" -> "SUPER")
export function extractBetType(typeStr: string) {
  if (!typeStr) return "";
  const parts = typeStr.split("-");
  return parts[parts.length - 1]; // Get the last part (SUPER, BOX, etc.)
}

export default function AccountSummary() {
  const navigation = useNavigation();
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [selectedTime, setSelectedTime] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [loggedInUser, setLoggedInUser] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");

  useEffect(() => {
    const loadUserAndUsers = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("username");

        if (storedUser) {
          setSelectedAgent(storedUser);
          setLoggedInUser(storedUser);

          // 🛡️ Fix: Use axios for auth headers
          const response = await axios.get(`${Domain}/users`);
          const data = response.data;

          if (Array.isArray(data)) {
            const usernames = data
              .filter((u) => u.createdBy === storedUser)
              .map((u) => u.username)
              .filter(
                (username) =>
                  typeof username === "string" && username.trim() !== ""
              );

            // Include the logged-in user at the top
            setAllUsers([storedUser, ...usernames]);
          } else {
            console.error("Invalid data format from API");
          }
        }
      } catch (err) {
        console.error("❌ Error loading users:", err);
      }
    };

    loadUserAndUsers();
  }, []);





  // Get all descendants recursively using createdBy field
  const getAllDescendants = (username: string, usersList: any[]): string[] => {
    const children = usersList
      .filter((u: any) => u.createdBy === username) // ✅ use createdBy, not parent
      .map((u: any) => u.username);

    let all: string[] = [...children];
    children.forEach((child) => {
      all = all.concat(getAllDescendants(child, usersList));
    });
    return all;
  };


  const fetchDataAndNavigate = async () => {
    setLoading(true);
    setError("");

    try {
      const url = `${Domain}/report/netpay-multiday`;
      const response = await axios.post(url, {
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
        time: selectedTime,
        agent: selectedAgent,
        fromAccountSummary: true,   // ✅ important
        loggedInUser,              // ✅ so backend knows whose rates to use
      });

      const allEntries = response.data.entries || [];
      if (allEntries.length === 0) {
        setError("No entries found for the selected date range and agent.");
        setLoading(false);
        return;
      }

      navigation.navigate("netdetailed", {
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
        time: selectedTime,
        agent: selectedAgent || "All Agents",
        matchedEntries: allEntries,
        usersList: response.data.usersList || [],
        userRates: response.data.userRates || {}, // ✅ backend already gives
        fromAccountSummary: true,
        loggedInUser,
      });
    } catch (err: any) {
      setError("Failed to fetch data: " + err.message);
    } finally {
      setLoading(false);
    }
  };




  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Account Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Time Slot</Text>
        <Picker
          selectedValue={selectedTime}
          onValueChange={setSelectedTime}
          style={styles.picker}
        >
          <Picker.Item label="All" value="All" />
          <Picker.Item label="DEAR 1 PM" value="DEAR 1 PM" />
          <Picker.Item label="LSK 3 PM" value="LSK 3 PM" />
          <Picker.Item label="DEAR 6 PM" value="DEAR 6 PM" />
          <Picker.Item label="DEAR 8 PM" value="DEAR 8 PM" />
        </Picker>

        <View style={styles.row}>
          <View style={styles.dateInput}>
            <Text style={styles.label}>From Date</Text>
            <TouchableOpacity onPress={() => setShowFrom(true)}>
              <Text style={styles.dateText}>
                {fromDate.toLocaleDateString()}
              </Text>
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
            <Text style={styles.equalText}>→</Text>
          </View>

          <View style={styles.dateInput}>
            <Text style={styles.label}>To Date</Text>
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

        <Text style={styles.pickerWrapper}>Select Agent</Text>
        <Picker
          selectedValue={selectedAgent}
          onValueChange={setSelectedAgent}
          style={styles.picker}
        >
          <Picker.Item label="All Agents" value="" />
          {allUsers.map((username, i) => (
            <Picker.Item key={i} label={username} value={username} />
          ))}
        </Picker>


        <TouchableOpacity style={styles.generateButton} onPress={fetchDataAndNavigate}>
          <Text style={styles.generateButtonText}>Generate Account Summary</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff2e63" />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      )}

      {!!error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  header: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333"
  },
  form: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  picker: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#553737ff",
    color: '#000', // Black text for Android

  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  dateInput: {
    flex: 1
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#666"
  },
  dateText: {
    padding: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 14,
  },
  equalBox: {
    width: 40,
    height: 40,
    backgroundColor: "#211e1f",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 20,
  },
  equalText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold"
  },
  generateButton: {
    backgroundColor: "#211e1f",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  generateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    borderLeft: 4,
    borderLeftColor: "#211e1f",
  },

  errorText: {
    color: "#d32f2f",
    fontSize: 14,
    fontWeight: "500"
  },
});