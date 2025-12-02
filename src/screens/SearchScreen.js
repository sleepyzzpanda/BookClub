import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../utils/firebase-config";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          query
        )}`
      );
      const data = await response.json();
      setResults(data.items || []);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add book to Firestore list
  const addToList = async (book, listName) => {
    try {
      const userRef = doc(db, "users", user.uid);

      const cleanedBook = {
        id: book.id,
        title: book.volumeInfo.title || "Untitled",
        authors: book.volumeInfo.authors || [],
        thumbnail:
          book.volumeInfo.imageLinks?.thumbnail ||
          "https://via.placeholder.com/120x160?text=No+Image",
      };

      await updateDoc(userRef, {
        [`readingLists.${listName}`]: arrayUnion(cleanedBook),
      });

      Alert.alert("Added!", `Book added to "${listName}"`);
    } catch (e) {
      console.error("Error adding to list:", e);
      Alert.alert("Error", "Could not add book to list.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Search</Text>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Enter a title/author/ISBN"
          placeholderTextColor="#777"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.iconButton} onPress={handleSearch}>
          <Ionicons name="search" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const info = item.volumeInfo;
            return (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                  RESULTS FOR “{query.toUpperCase()}”
                </Text>

                {/* Book Info */}
                <View style={styles.bookContainer}>
                  <Image
                    source={{
                      uri:
                        info.imageLinks?.thumbnail ||
                        "https://via.placeholder.com/120x160?text=No+Image",
                    }}
                    style={styles.bookImage}
                  />
                  <View style={styles.bookDetails}>
                    <Text style={styles.bookTitle}>
                      “{info.title?.toUpperCase() || "UNTITLED"}”
                    </Text>
                    <Text style={styles.bookDesc}>
                      {info.description
                        ? info.description.slice(0, 150) + "…"
                        : "No description available."}
                    </Text>
                  </View>
                </View>

                {/* ADD TO LIST */}
                <View style={styles.addSection}>
                  <Text style={styles.addLabel}>ADD TO LIST:</Text>

                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() =>
                      setOpenDropdown(openDropdown === item.id ? null : item.id)
                    }
                  >
                    <Text style={styles.dropdownText}>SELECT LIST ▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Dropdown Menu */}
                {openDropdown === item.id && (
                  <View style={styles.dropdownMenu}>

                    <TouchableOpacity
                      onPress={() => {
                        addToList(item, "favorites");
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownOption}>Favorites</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        addToList(item, "wantToRead");
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownOption}>Want to Read</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        addToList(item, "currentlyReading");
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownOption}>Currently Reading</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        addToList(item, "read");
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownOption}>Read</Text>
                    </TouchableOpacity>

                  </View>
                )}

              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15, paddingTop: 50 },
  header: { fontSize: 18, fontWeight: "600", marginBottom: 10, color: "#444" },
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#e6e6e6",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  input: { flex: 1, paddingVertical: 10, fontSize: 14, color: "#000" },
  iconButton: { padding: 6 },
  resultCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    marginBottom: 25,
    elevation: 3,
  },
  resultTitle: { fontWeight: "600", textAlign: "center", marginBottom: 10 },
  bookContainer: {
    flexDirection: "row",
    backgroundColor: "#e0e5ff",
    padding: 10,
    borderRadius: 10,
  },
  bookImage: { width: 90, height: 130, borderRadius: 5, marginRight: 10 },
  bookDetails: { flex: 1 },
  bookTitle: { fontWeight: "bold", marginBottom: 6 },
  bookDesc: { fontSize: 12, color: "#333" },
  addSection: { marginTop: 10, flexDirection: "row", alignItems: "center" },
  addLabel: { fontWeight: "bold", fontSize: 13 },
  dropdown: {
    marginLeft: 10,
    backgroundColor: "#b8c8c0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
  },
  dropdownText: { color: "#fff", fontWeight: "bold" },
  dropdownMenu: {
    backgroundColor: "#ddd",
    marginTop: 8,
    borderRadius: 6,
    padding: 8,
  },
  dropdownOption: {
    paddingVertical: 6,
    fontWeight: "600",
    color: "#333",
  },
});
