import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar } from "react-native-paper";

export default function UserProfileScreen() {
  return (
    <View style={styles.container}>
      {/* USER INFO */}
      <View style={styles.profileSection}>
        <Image
          source={{ uri: "https://i.imgur.com/8Km9tLL.png" }} // Placeholder profile image
          style={styles.profileImage}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>SLEEPYPANDA</Text>
          <Text style={styles.statsText}>1864 BOOKS READ</Text>
          <Text style={styles.statsText}>4 BOOKSHELVES</Text>
          <Text style={styles.statsText}>127 FRIENDS</Text>
          <Text style={styles.statsText}>23 BOOKS RECOMMENDED</Text>
        </View>
      </View>

      {/* READING STATS CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>READING STATS</Text>
        <View style={styles.cardContent}>
          <ProgressBar progress={0.8} color="#00A676" style={styles.progressBar} />
        </View>
      </View>

      {/* TOP GENRES CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>TOP GENRES</Text>
        <View style={styles.cardContent}>
          <ProgressBar progress={1.0} color="#00A676" style={styles.progressBar} />
          <Text style={styles.genreText}>33% FANTASY · 33% SCIENCE FICTION · 34% ROMANCE</Text>
        </View>
      </View>

      {/* FAVORITE BOOKS CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>FAVORITE BOOKS</Text>
        <View style={styles.cardContent}></View>
      </View>

      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
    alignItems: "center",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    width: "90%",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  userInfo: {
    flexShrink: 1,
  },
  username: {
    fontWeight: "700",
    fontSize: 16,
  },
  statsText: {
    fontSize: 12,
    color: "#333",
  },
  card: {
    backgroundColor: "#e0e0e0",
    width: "90%",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: "700",
    marginBottom: 6,
  },
  cardContent: {
    backgroundColor: "#c8cbf7",
    borderRadius: 6,
    padding: 10,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  genreText: {
    fontSize: 12,
    textAlign: "center",
    color: "#333",
  },
  navBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 55,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
});
