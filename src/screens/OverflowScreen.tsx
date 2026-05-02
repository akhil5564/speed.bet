import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CheckBox from "expo-checkbox";

type RowType = {
  sn: number;
  ticket: string;
  number: string;
  total: number;
  over: number;
  selected: boolean;
};

const INITIAL_DATA: RowType[] = [
  { sn: 1, ticket: "DEAR1", number: "047", total: 111, over: 5, selected: false },
  { sn: 2, ticket: "DEAR1", number: "000", total: 68, over: 0, selected: false },
  { sn: 3, ticket: "DEAR1", number: "001", total: 35, over: 0, selected: false },
  { sn: 4, ticket: "DEAR1", number: "002", total: 5, over: 0, selected: false },
  { sn: 5, ticket: "DEAR1", number: "003", total: 17, over: 0, selected: false },
  { sn: 6, ticket: "DEAR1", number: "004", total: 1, over: 0, selected: false },
  { sn: 7, ticket: "DEAR1", number: "005", total: 6, over: 0, selected: false },
  { sn: 8, ticket: "DEAR1", number: "006", total: 8, over: 0, selected: false },
];

export default function OverflowReportScreen() {
  const [data, setData] = useState<RowType[]>(INITIAL_DATA);

  const anySelected = data.some((i) => i.selected);
  const allSelected = data.every((i) => i.selected);

  const toggleRow = (sn: number) => {
    setData((prev) =>
      prev.map((row) =>
        row.sn === sn ? { ...row, selected: !row.selected } : row
      )
    );
  };

  const toggleAll = () => {
    setData((prev) =>
      prev.map((row) => ({ ...row, selected: !allSelected }))
    );
  };

  const onSave = () => {
    const selectedRows = data.filter((i) => i.selected);
    Alert.alert("Saved", `Selected rows: ${selectedRows.length}`);
  };

  const renderItem = ({ item }: { item: RowType }) => (
    <View style={styles.row}>
      <Text style={styles.sn}>{item.sn}.</Text>
      <Text style={styles.ticket}>{item.ticket}</Text>
      <Text style={styles.number}>{item.number}</Text>
      <Text style={styles.total}>{item.total}</Text>

      <View style={styles.overBox}>
        <Text style={styles.overText}>{item.over}</Text>
      </View>

      <CheckBox
        value={item.selected}
        onValueChange={() => toggleRow(item.sn)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Overflow Report</Text>

        <TouchableOpacity
          style={[styles.saveBtn, !anySelected && styles.saveDisabled]}
          disabled={!anySelected}
          onPress={onSave}
        >
          <Text style={[styles.saveText, !anySelected && { color: "#aaa" }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      {/* TABLE HEADER */}
      <View style={styles.tableHeader}>
        <Text style={styles.hSn}>Sn</Text>
        <Text style={styles.hTicket}>Ticket</Text>
        <Text style={styles.hNumber}>Number</Text>
        <Text style={styles.hTotal}>Total</Text>
        <Text style={styles.hOver}>Over</Text>

        <TouchableOpacity onPress={toggleAll}>
          <Text style={styles.hSelect}>
            {allSelected ? "✓" : "Select"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.sn.toString()}
        renderItem={renderItem}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  saveBtn: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 6,
  },

  saveDisabled: {
    backgroundColor: "#f3f4f6",
  },

  saveText: {
    fontWeight: "600",
    color: "#444",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f766e",
    paddingVertical: 10,
    alignItems: "center",
  },

  hSn: { width: 40, color: "#fff", textAlign: "center", fontWeight: "600" },
  hTicket: { width: 80, color: "#fff", textAlign: "center", fontWeight: "600" },
  hNumber: { width: 80, color: "#fff", textAlign: "center", fontWeight: "600" },
  hTotal: { width: 80, color: "#fff", textAlign: "center", fontWeight: "600" },
  hOver: { width: 60, color: "#fff", textAlign: "center", fontWeight: "600" },
  hSelect: { width: 70, color: "#fff", textAlign: "center", fontWeight: "600" },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 10,
    alignItems: "center",
  },

  sn: { width: 40, textAlign: "center", fontWeight: "500" },
  ticket: { width: 80, textAlign: "center" },
  number: { width: 80, textAlign: "center", fontWeight: "500" },
  total: { width: 80, textAlign: "center" },

  overBox: {
    width: 60,
    alignItems: "center",
    paddingVertical: 4,
    backgroundColor: "#fecaca",
    borderRadius: 4,
  },

  overText: {
    fontWeight: "600",
    color: "#991b1b",
  },
});