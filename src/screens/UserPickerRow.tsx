// UserPickerRow.tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Domain } from "./NetPayScreen";

interface UserPickerRowProps {
  onUserChange?: (selectedUser: string | null) => void;
}

export default function UserPickerRow({ onUserChange }: UserPickerRowProps) {
  const [loggedInUser, setLoggedInUser] = useState<string>("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedUser1, setSelectedUser1] = useState<string>("");
  const [selectedUser2, setSelectedUser2] = useState<string>("");
  const [selectedUser3, setSelectedUser3] = useState<string>("");

  const [usersLevel1, setUsersLevel1] = useState<any[]>([]);
  const [usersLevel2, setUsersLevel2] = useState<any[]>([]);
  const [usersLevel3, setUsersLevel3] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("username");
        if (!storedUser) return;

        setLoggedInUser(storedUser);
        setSelectedUser1(storedUser); // ✅ set as initial value

        // 🛡️ Fix: Use axios for auth headers
        const res = await axios.get(`${Domain}/users`);
        const data = res.data;
        setAllUsers(data);

        setUsersLevel1(data.filter((u) => u.createdBy === storedUser));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);


  useEffect(() => {
    if (selectedUser1) {
      setUsersLevel2(allUsers.filter((u) => u.createdBy === selectedUser1));
      setSelectedUser2("");
      setUsersLevel3([]);
      setSelectedUser3("");
    } else {
      setUsersLevel2([]);
      setSelectedUser2("");
      setUsersLevel3([]);
      setSelectedUser3("");
    }
  }, [selectedUser1, allUsers]);

  useEffect(() => {
    if (selectedUser2) {
      setUsersLevel3(allUsers.filter((u) => u.createdBy === selectedUser2));
      setSelectedUser3("");
    } else {
      setUsersLevel3([]);
      setSelectedUser3("");
    }
  }, [selectedUser2, allUsers]);

  // Compute final selected user by priority: level 3 > level 2 > level 1
  const selectedUserFinal =
    selectedUser3 || selectedUser2 || selectedUser1 || null;

  useEffect(() => {
    onUserChange?.(selectedUserFinal);
  }, [selectedUserFinal, onUserChange]);

  if (loading)
    return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Level 1 Picker */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedUser1}
            onValueChange={(value) => setSelectedUser1(value)}
            style={styles.picker}
            dropdownIconColor="#000"
          >
            {usersLevel1.map((user) => (
              <Picker.Item
                key={user._id}
                label={user.username}
                value={user.username}
                color="#000"
              />
            ))}
          </Picker>
        </View>

        {/* Level 2 Picker */}
        <View style={styles.pickerContainer}>
          <Picker
            enabled={usersLevel2.length > 0}
            selectedValue={selectedUser2}
            onValueChange={(value) => setSelectedUser2(value)}
            style={styles.picker}
            dropdownIconColor="#000"
          >
            {usersLevel2.length === 0 && (
               <Picker.Item label="-" value="" color="#666" />
            )}
            {usersLevel2.map((user) => (
              <Picker.Item
                key={user._id}
                label={user.username}
                value={user.username}
                color="#000"
              />
            ))}
          </Picker>
        </View>

        {/* Level 3 Picker */}
        <View style={styles.pickerContainer}>
          <Picker
            enabled={usersLevel3.length > 0}
            selectedValue={selectedUser3}
            onValueChange={(value) => setSelectedUser3(value)}
            style={styles.picker}
            dropdownIconColor="#000"
          >
            {usersLevel3.length === 0 && (
               <Picker.Item label="-" value="" color="#666" />
            )}
            {usersLevel3.map((user) => (
              <Picker.Item
                key={user._id}
                label={user.username}
                value={user.username}
                color="#000"
              />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 10 },
  row: { flexDirection: "row" },
  pickerContainer: {
    flex: 1,
    marginHorizontal: 2,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    height: 50, // ⬆️ Increased from 38
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 50, // ⬆️ Increased from 40
    color: '#000', 
  },
});
