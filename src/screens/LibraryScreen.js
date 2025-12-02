import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase-config";
import { getAuth } from "firebase/auth";

export default function LibraryScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const [lists, setLists] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadLists = async () => {
    try {
      setLoading(true);
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setLists(snap.data().readingLists || {});
      }
    } catch (e) {
      console.log("Error fetching lists:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [user.uid])
  );

  const renderBook = ({ item }) => (
    <View style={styles.bookItem}>
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <Text style={styles.bookTitle}>{item.title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Your Library</Text>

      {/* FAVORITES */}
      <View style={styles.shelfCard}>
        <Text style={styles.sectionTitle}>Favorites</Text>
        <FlatList
          data={lists.favorites}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          ListEmptyComponent={<Text style={styles.empty}>No favorites yet.</Text>}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 5 }}
        />
      </View>

      {/* CURRENTLY READING */}
      <View style={styles.shelfCard}>
        <Text style={styles.sectionTitle}>Currently Reading</Text>
        <FlatList
          data={lists.currentlyReading}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          ListEmptyComponent={<Text style={styles.empty}>No books here yet.</Text>}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 5 }}
        />
      </View>

      {/* WANT TO READ */}
      <View style={styles.shelfCard}>
        <Text style={styles.sectionTitle}>Want to Read</Text>
        <FlatList
          data={lists.wantToRead}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          ListEmptyComponent={<Text style={styles.empty}>No books here yet.</Text>}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 5 }}
        />
      </View>

      {/* READ */}
      <View style={styles.shelfCard}>
        <Text style={styles.sectionTitle}>Read</Text>
        <FlatList
          data={lists.read}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          ListEmptyComponent={<Text style={styles.empty}>No books here yet.</Text>}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 5 }}
        />
      </View>
      {/*this is janky asf pls dont judge this ok but this is basically here so the scrolling can go all the way down </3 */}
      <View style={{height: 50}}></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 15,
    backgroundColor: "#f0f0f0",
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  shelfCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3, // for Android shadow
  },
  bookItem: {
    marginRight: 10,
    alignItems: "center",
  },
  thumbnail: {
    width: 80,
    height: 120,
    borderRadius: 6,
    backgroundColor: "#ddd",
  },
  bookTitle: {
    fontSize: 12,
    width: 80,
    textAlign: "center",
    marginTop: 5,
  },
  empty: {
    color: "#777",
    fontStyle: "italic",
    paddingVertical: 10,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});