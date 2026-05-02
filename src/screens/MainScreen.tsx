import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type MainScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Main'
>;

const MainScreen = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const [username, setUsername] = useState<string>('Guest');
  const [usertype, setUsertype] = useState<string | null>(null);
  const [salesBlocked, setSalesBlocked] = useState<boolean>(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        const storedUsertype = await AsyncStorage.getItem('usertype');
        const storedSalesBlocked = await AsyncStorage.getItem('salesBlocked');

        if (storedUsername) setUsername(storedUsername);
        if (storedUsertype) setUsertype(storedUsertype);
        if (storedSalesBlocked) {
          setSalesBlocked(storedSalesBlocked === 'true');
        }
      } catch (error) {
        console.log('Error loading user data:', error);
        setUsername('Guest');
        setUsertype(null);
        setSalesBlocked(false);
      }
    };

    loadUserData();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="account-circle" size={30} />
        <Text style={styles.headerText}>Hello, {username}</Text>
      </View>

      {!salesBlocked && (
        <MenuButton
          label="Add"
          icon="plus-circle-outline"
          onPress={() => navigation.navigate('Add')}
        />
      )}

      <MenuButton
        label="Edit / Delete"
        icon="pencil-outline"
        onPress={() => navigation.navigate('Edit')}
      />

      <MenuButton
        label="Reports"
        icon="file-document-outline"
        onPress={() => navigation.navigate('Reports')}
      />

      <MenuButton
        label="Manage Sales"
        icon="percent-outline"
        onPress={() => navigation.navigate('ManageSales')}
      />

      {usertype !== 'sub' && (
        <MenuButton
          label="Manage Users"
          icon="account-group-outline"
          onPress={() => navigation.navigate('UsersScreen')}
        />
      )}

      <MenuButton
        label="Results"
        icon="bell-outline"
        onPress={() => navigation.navigate('Result')}
      />

      {usertype === 'admin' && (
        <MenuButton
          label="More"
          icon="dots-horizontal"
          onPress={() => navigation.navigate('MORE')}
        />
      )}

      <MenuButton
        label="Log Out"
        icon="exit-to-app"
        red
        onPress={async () => {
          await AsyncStorage.clear();
          navigation.replace('Login');
        }}
      />

      <Text style={styles.versionText}>Version 1.0</Text>
    </ScrollView>
  );
};

const MenuButton = ({
  icon,
  label,
  red = false,
  onPress,
}: {
  icon: any;
  label: string;
  red?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={[styles.button, red ? styles.redButton : styles.pinkButton]}
    onPress={onPress}
  >
    <View style={styles.buttonContent}>
      {/* LEFT TEXT */}
      <Text style={styles.buttonText}>{label}</Text>

      {/* RIGHT ICON */}
      <MaterialCommunityIcons name={icon} size={26} color="#fff" />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
    marginBottom: 160,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
    elevation: 3,
  },
  pinkButton: {
    backgroundColor: '#211e1f',
  },
  redButton: {
    backgroundColor: '#010101',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#aaa',
  },
});

export default MainScreen;
