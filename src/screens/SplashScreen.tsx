import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import SpeedRacerIcon from "../assets/speedracer.png";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const navigation = useNavigation(); // 👈 get navigation
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoAnim, {
          toValue: -height * 0.02,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePress = () => {
    // Example: navigate to Splash again
    navigation.navigate("Splash");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Navbar */}
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>Car Racing 3D</Text>
        <TouchableOpacity
          onLongPress={() => navigation.navigate("Login")} // long press navigate
          delayLongPress={800}
        >
          <Text style={styles.navButton}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Animated Logo */}
      <Animated.Image
        source={SpeedRacerIcon}
        style={[styles.logo, { transform: [{ translateY: logoAnim }] }]}
        resizeMode="contain"
      />

      {/* Main Buttons */}
      <View style={styles.buttonsContainer}>
        {["Start Game", "Multiplayer", "Leaderboard", "Settings", "About"].map(
          (btn, idx) => (
            <TouchableOpacity key={idx} style={styles.button} onPress={handlePress}>
              <Text style={styles.buttonText}>{btn}</Text>
            </TouchableOpacity>
          )
        )}

        {/* Exit Button */}
        <TouchableOpacity
          style={[styles.button, styles.exitButton]}
          onPress={handlePress}
          onLongPress={() => navigation.navigate("Login")}
          delayLongPress={800}
        >
          <Text style={styles.buttonText}>Exit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0b0c10",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  navbar: {
    width: "100%",
    height: height * 0.08,
    backgroundColor: "#1f1f1f",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.05,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    marginBottom: 10,
  },
  navTitle: {
    color: "#ffd700",
    fontSize: width * 0.05,
    fontWeight: "bold",
  },
  navButton: {
    color: "#ffd700",
    fontSize: width * 0.07,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginVertical: height * 0.02,
  },
  buttonsContainer: {
    width: "80%",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#ff0000",
    paddingVertical: height * 0.018,
    borderRadius: 12,
    marginVertical: height * 0.01,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
  },
  exitButton: {
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#ffd700",
  },
  buttonText: {
    color: "#fff",
    fontSize: width * 0.05,
    fontWeight: "bold",
  },
});