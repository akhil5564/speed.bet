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
import Icon from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDateIST } from "../utils/dateUtils";
import { useLoading } from "../context/LoadingContext";

const payouts = {
  SUPER: { 1: 5000, 2: 500, 3: 250, 4: 100, 5: 50, other: 20 },
  BOX: {
    normal: { perfect: 3000, permutation: 800 },
    double: { perfect: 3800, permutation: 1600 },
  },
  AB_BC_AC: 700,
  A_B_C: 100,
};

function isDoubleNumber(numStr: string) {
  return new Set(numStr.split("")).size === 2;
}

export function extractBetType(typeStr: string) {
  if (!typeStr) return "";
  const parts = typeStr.split("-");
  return parts[parts.length - 1];
}
// export const Domain = "https://bajaj-app-backend.onrender.com";

// export const Domain = "https://www.muralibajaj.site";
//export const Domain = "http://192.168.29.67:5000";
export const Domain = "https://api.bitfixtechnologies.com";
// export const Domain = "http://192.168.1.9:5000";
// export const  Domain ='http://10.168.141.85:5000';
// export const Domain = "https://th7m39hx-5000.inc1.devtunnels.ms/";
// export const Domain = "http://localhost:5000";
// export const Domain = "https://manu-netflix.onrender.com";



// Function to fetch result separately with proper time mapping
const fetchResultForTimeLabel = async (timeLabel: string, date: string) => {
  const timeMap: { [key: string]: string } = {
    "LSK 3 PM": "KERALA 3PM",
    "DEAR 1 PM": "DEAR 1PM",
    "DEAR 6 PM": "DEAR 6PM",
    "DEAR 8 PM": "DEAR 8PM"
  };

  const resultTimeFormat = timeMap[timeLabel] || timeLabel;

  try {
    const response = await axios.get(`${Domain}/getresult`, {
      params: {
        time: resultTimeFormat,
        date: date
      }
    });
    const data = response.data;
    return data?.data?.[0] || null; // Return the first result object
  } catch (error) {
    console.error(`Error fetching result for ${timeLabel}:`, error);
    return null;
  }
};

export default function NetPayMultiDayScreen() {
  const navigation = useNavigation<any>();

  const [userRatesByDraw, setUserRatesByDraw] = useState<{ [draw: string]: number | null }>({});
  const [userRate, setUserRate] = useState<number | null>(null);

  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [selectedTime, setSelectedTime] = useState("All");
  const { showLoading, hideLoading } = useLoading();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [loggedInUser, setLoggedInUser] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");

  const [loggedInUserObj, setLoggedInUserObj] = useState<any>(null);

  // 🔹 Load logged-in user + their subusers
  useEffect(() => {
    const loadUserAndUsers = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("username");
        if (storedUser) {
          setLoggedInUser(storedUser);
          setSelectedAgent(storedUser);

          // 🛡️ Fix: Use axios for auth headers
          const response = await axios.get(`${Domain}/users`);
          const data = response.data;

          if (Array.isArray(data)) {
            const currentFullUser = data.find(u => u.username === storedUser);
            if (currentFullUser) setLoggedInUserObj(currentFullUser);

            const usernames = data
              .filter((u) => u.createdBy === storedUser)
              .map((u) => u.username)
              .filter((u) => typeof u === "string" && u.trim() !== "");

            setAllUsers([storedUser, ...usernames]);
          }
        }
      } catch (err) {
        console.error("❌ Error loading users:", err);
      }
    };

    loadUserAndUsers();
  }, []);

  // 🔹 Fetch rate after loggedInUser is ready
  useEffect(() => {
    if (!loggedInUser) return;


    const fetchRates = async () => {
      try {
        showLoading();
        const draws = [
          "DEAR 1 PM",
          "LSK 3 PM",
          "DEAR 6 PM",
          "DEAR 8 PM",
        ];
        const rates: { [draw: string]: number | null } = {};

        for (const draw of draws) {
          try {
            const url = `${Domain}/ratemaster?user=${encodeURIComponent(
              loggedInUser
            )}&draw=${encodeURIComponent(draw)}`;
            
            // 🛡️ Fix: Use axios for auth headers
            const response = await axios.get(url);
            const data = response.data;
            console.log(`[RATE-API] draw='${draw}' user='${loggedInUser}' raw=`, data);

            // Extract the 'SUPER' rate from array/object response
            let superRate: number | null = null;
            if (Array.isArray(data)) {
              const found = data.find((r: any) => r.label === "SUPER");
              if (found && found.rate !== undefined) superRate = Number(found.rate);
            } else if (Array.isArray(data?.rates)) {
              const found = data.rates.find((r: any) => r.label === "SUPER");
              if (found && found.rate !== undefined) superRate = Number(found.rate);
            } else if (Array.isArray(data?.data)) {
              const found = data.data.find((r: any) => r.label === "SUPER");
              if (found && found.rate !== undefined) superRate = Number(found.rate);
            } else if (data?.rate && data?.label === "SUPER") {
              superRate = Number(data.rate);
            }
            if (superRate === null || isNaN(superRate)) {
              console.warn(`[RATE-API] SUPER rate not found for draw='${draw}' user='${loggedInUser}'. Data:`, data);
              rates[draw] = null;
            } else {
              rates[draw] = superRate;
            }
          } catch (err) {
            console.error(`⚠️ Error fetching rate for ${draw}:`, err);
            rates[draw] = null;
          }
        }

        setUserRatesByDraw(rates);

        // For single draw UI
        if (selectedTime && selectedTime !== "All") {
          setUserRate(rates[selectedTime] ?? null);
        } else {
          setUserRate(null);
        }
      } finally {
        hideLoading();
      }
    };

    fetchRates();
  }, [loggedInUser, selectedTime]);

  // 🔹 Map frontend time labels to backend result formats
  const mapTimeForBackend = (timeLabel: string) => {
    const timeMap: { [key: string]: string } = {
      "LSK 3 PM": "KERALA 3PM",
      "DEAR 1 PM": "DEAR 1PM",
      "DEAR 6 PM": "DEAR 6PM",
      "DEAR 8 PM": "DEAR 8PM"
    };
    return timeMap[timeLabel] || timeLabel;
  };

  // 🔹 Fetch entries + navigate to detailed
  const fetchDataAndNavigate = async () => {
    // Log the logged-in user's SUPER rate for each draw and show sales calculation
    const draws = ["DEAR 1 PM", "LSK 3 PM", "DEAR 6 PM", "DEAR 8 PM"];
    // Example: Suppose you have sales count for each draw (simulate for demo)
    // In real app, replace with actual sales count per draw from your data
    const salesCounts: { [draw: string]: number } = {
      "DEAR 1 PM": 10, // Example: 10 tickets for DEAR 1 PM
      "LSK 3 PM": 5,
      "DEAR 6 PM": 8,
      "DEAR 8 PM": 0,
    };
    if (typeof userRatesByDraw === 'object') {
      draws.forEach(draw => {
        const rate = userRatesByDraw[draw];
        const count = salesCounts[draw] || 0;
        if (rate !== null && count > 0) {
          const sales = count * rate;
          console.log(`Draw: ${draw}, SUPER rate for ${loggedInUser}: ${rate}, Sales count: ${count}, Sales: ${count}*${rate}=${sales}`);
        } else {
          console.log(`Draw: ${draw}, SUPER rate for ${loggedInUser}: ${rate ?? '-'}, Sales count: ${count}`);
        }
      });
    }
    showLoading();
    setLoading(true);
    setError("");

    try {
      const timeToSend =
        selectedTime === "All"
          ? ["DEAR 1 PM", "LSK 3 PM", "DEAR 6 PM", "DEAR 8 PM", "KERALA 3 PM"]
          : selectedTime;

      const response = await axios.post(`${Domain}/report/netpay-multiday`, {
        fromDate: formatDateIST(fromDate),
        toDate: formatDateIST(toDate),
        time: timeToSend,
        agent: selectedAgent,
        loggedInUser: loggedInUser,
      });

      if (response.data.entries.length === 0) {
        setError("No entries found for the selected date range and agent.");
        return;
      }

      navigation.navigate("netdetailed", {
        fromDate: formatDateIST(fromDate),
        toDate: formatDateIST(toDate),
        time: selectedTime,
        agent: selectedAgent || "All Agents",
        matchedEntries: response.data.entries,
        userRates: response.data.userRates,
        usersList: response.data.usersList || [],
        loggedInUser: loggedInUserObj,
      });
    } catch (err) {
      setError("Failed to fetch data: " + (err as any).message);
    } finally {
      hideLoading();
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Net Pay Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        {userRate !== null && (
          <Text style={{ fontWeight: "bold", color: "#333", marginBottom: 8 }}>
            Rate: ₹{userRate}
          </Text>
        )}

        <Text style={styles.sectionTitle}>Time Slot</Text>
        <Picker
          selectedValue={selectedTime}
          onValueChange={setSelectedTime}
          style={styles.picker}
        >
          <Picker.Item label="ALL" value="All" color="#000000" />
          <Picker.Item label="DEAR 1 PM" value="DEAR 1 PM" color="#000000" />
          <Picker.Item label="LSK 3 PM" value="LSK 3 PM" color="#000000" />
          <Picker.Item label="DEAR 6 PM" value="DEAR 6 PM" color="#000000" />
          <Picker.Item label="DEAR 8 PM" value="DEAR 8 PM" color="#000000" />
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

        <Text style={styles.sectionTitle}>Select Agent</Text>
        <Picker
          selectedValue={selectedAgent}
          onValueChange={setSelectedAgent}
          style={styles.picker}
        >
          {allUsers.map((username, i) => (
            <Picker.Item key={i} label={username} value={username} color="#000000" />
          ))}
        </Picker>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={fetchDataAndNavigate}
        >
          <Text style={styles.generateButtonText}>
            Generate Net Pay Report
          </Text>
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
  container: { flex: 1, backgroundColor: "#f5f5f5", marginTop: 30 },
  header: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  headerText: { fontSize: 18, fontWeight: "bold", color: "#000000" },
  form: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
    marginTop: 12,
  },
  picker: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#553737ff",
    color: "#000000",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  dateInput: { flex: 1 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#000000" },
  dateText: {
    padding: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 14,
    color: "#000000",
    fontWeight: "bold",
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
  equalText: { color: "#f5e6e6ff", fontSize: 18, fontWeight: "bold" },
  generateButton: {
    backgroundColor: "#211e1f",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  generateButtonText: {
    color: "#f8ebebff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  loadingContainer: { alignItems: "center", padding: 20 },
  loadingText: { marginTop: 10, color: "#666", fontSize: 14 },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: "#ffebee",
    borderRadius: 8,
  },
  errorText: { color: "#c01c1cff", fontSize: 14, fontWeight: "500" },
});
