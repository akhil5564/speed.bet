import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { Domain as API_URL } from "./NetPayScreen";

// const API_URL = "https://manu-netflix.onrender.com"; // ✅ API
const draws = ["LSK3", "DEAR1", "DEAR6", "DEAR8"];
const types: ("admin" | "master" | "sub")[] = ["admin", "master", "sub"];

const TimeSetScreen = ({ navigation }: any) => {
  const [selectedDraw, setSelectedDraw] = useState("LSK3");

  // Admin / Master / Sub times
  const [drawTimes, setDrawTimes] = useState(
    draws.reduce((acc, draw) => {
      acc[draw] = {
        admin: { start: new Date(), end: new Date() },
        master: { start: new Date(), end: new Date() },
        sub: { start: new Date(), end: new Date() },
      };
      return acc;
    }, {} as Record<
      string,
      {
        admin: { start: Date; end: Date };
        master: { start: Date; end: Date };
        sub: { start: Date; end: Date };
      }
    >)
  );

  const [editingFor, setEditingFor] = useState<"admin" | "master" | "sub">("admin");
  const [showPicker, setShowPicker] = useState<{
    draw: string;
    type: "start" | "end";
  } | null>(null);

  // Load current block times for selected draw + role
  useEffect(() => {
    const loadCurrent = async () => {
      try {
        let url = `${API_URL}/blockTime/${encodeURIComponent(selectedDraw)}/${encodeURIComponent(editingFor)}`
        console.log('URL:==============', url);
        const res = await axios.get(
          url
        );
        const data = res.data;
        if (data?.blockTime && data?.unblockTime) {
          const toDate = (hhmm: string) => {
            const [h, m] = hhmm.split(":").map(Number);
            const d = new Date();
            d.setHours(h || 0, m || 0, 0, 0);
            return d;
          };
          setDrawTimes((prev) => ({
            ...prev,
            [selectedDraw]: {
              ...prev[selectedDraw],
              [editingFor]: {
                start: toDate(data.blockTime),
                end: toDate(data.unblockTime),
              },
            },
          }));
        }
      } catch (e) {
        // If not found, keep defaults
      }
    };
    loadCurrent();
  }, [selectedDraw, editingFor]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const onChange = (_event: any, selectedTime?: Date) => {
    if (showPicker && selectedTime) {
      setDrawTimes((prev) => ({
        ...prev,
        [showPicker.draw]: {
          ...prev[showPicker.draw],
          [editingFor]: {
            ...prev[showPicker.draw][editingFor],
            [showPicker.type]: selectedTime,
          },
        },
      }));
    }
    setShowPicker(null);
  };

  const handleSave = async () => {
    try {
      // Convert to 24-hour HH:mm format
      const format24 = (date: Date) =>
        `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;

      const blockToSend = [
        {
          drawLabel: selectedDraw, // backend expects drawLabel
          type: editingFor, // admin / master / sub
          blockTime: format24(drawTimes[selectedDraw][editingFor].start),
          unblockTime: format24(drawTimes[selectedDraw][editingFor].end),
        },
      ];

      const response = await axios.post(`${API_URL}/setBlockTime`, {
        blocks: blockToSend,
      });

      if (response.status === 200) {
        Alert.alert(
          "✅ Success",
          `${selectedDraw} ${editingFor.toUpperCase()} block time updated`
        );
        navigation.goBack();
      } else {
        Alert.alert("Error", response.data?.message || "Save failed");
      }
    } catch (err: any) {
      console.error("❌ Save error:", err.response?.data || err.message);
      Alert.alert(
        "Error",
        err.response?.data?.message || err.message || "Failed to save block time"
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Draw tabs */}
      <View style={styles.tabRow}>
        {draws.map((draw) => (
          <TouchableOpacity
            key={draw}
            style={[styles.tabButton, selectedDraw === draw && styles.activeTab]}
            onPress={() => setSelectedDraw(draw)}
          >
            <Text
              style={[styles.tabText, selectedDraw === draw && styles.activeTabText]}
            >
              {draw}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Admin/Master/Sub toggle */}
      <View style={styles.toggleRow}>
        {types.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.toggleButton, editingFor === t && styles.activeToggle]}
            onPress={() => setEditingFor(t)}
          >
            <Text
              style={[styles.toggleText, editingFor === t && styles.activeToggleText]}
            >
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Time table */}
      <ScrollView style={styles.card}>
        <Text style={styles.header}>
          {selectedDraw} ({editingFor.toUpperCase()})
        </Text>

        <View style={styles.row}>
          <Text style={[styles.cell, styles.headerCell]}>Block Start</Text>
          <Text style={[styles.cell, styles.headerCell]}>Block End</Text>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.cell, styles.timeCell]}
            onPress={() => setShowPicker({ draw: selectedDraw, type: "start" })}
          >
            <Text>{formatTime(drawTimes[selectedDraw][editingFor].start)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cell, styles.timeCell]}
            onPress={() => setShowPicker({ draw: selectedDraw, type: "end" })}
          >
            <Text>{formatTime(drawTimes[selectedDraw][editingFor].end)}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>SAVE</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={drawTimes[showPicker.draw][editingFor][showPicker.type]}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}
    </View>
  );
};

export default TimeSetScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 100 },
  tabRow: { flexDirection: "row", margin: 10 },
  tabButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#eee",
    alignItems: "center",
    marginHorizontal: 5,
  },
  activeTab: { backgroundColor: "#9be7a1" },
  tabText: { fontSize: 14, color: "#333" },
  activeTabText: { fontWeight: "bold", color: "#000" },

  toggleRow: { flexDirection: "row", marginHorizontal: 10, marginBottom: 10 },
  toggleButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#eee",
    alignItems: "center",
    marginHorizontal: 5,
  },
  activeToggle: { backgroundColor: "#9be7a1" },
  toggleText: { color: "#333", fontWeight: "normal" },
  activeToggleText: { fontWeight: "bold", color: "#000" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 10,
    padding: 10,
    elevation: 2,
  },
  header: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  row: { flexDirection: "row", marginBottom: 8 },
  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 8,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCell: { fontWeight: "bold", backgroundColor: "#f5f5f5" },
  timeCell: { backgroundColor: "#fafafa" },
  saveButton: {
    backgroundColor: "#211e1f",
    padding: 14,
    borderRadius: 8,
    margin: 10,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
