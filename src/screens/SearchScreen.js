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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setResults(data.items || []);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
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

                {/* Book Info Card */}
                <TouchableOpacity style={styles.infoButton}>
                  <Text style={styles.infoButtonText}>
                    SEE FULL BOOK INFORMATION →
                  </Text>
                </TouchableOpacity>

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

                <View style={styles.addSection}>
                  <Text style={styles.addLabel}>ADD TO LIST:</Text>
                  <TouchableOpacity style={styles.dropdown}>
                    <Text style={styles.dropdownText}>WANT TO READ ▼</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingTop: 50,
  },
  header: {
    fontSize: 18,
    color: "#444",
    fontWeight: "600",
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6e6e6",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000",
  },
  iconButton: {
    padding: 6,
  },
  resultCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  infoButton: {
    backgroundColor: "#b8c8c0",
    borderRadius: 5,
    padding: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  infoButtonText: {
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  bookContainer: {
    flexDirection: "row",
    backgroundColor: "#e0e5ff",
    borderRadius: 10,
    padding: 10,
  },
  bookImage: {
    width: 90,
    height: 130,
    borderRadius: 5,
    marginRight: 10,
  },
  bookDetails: {
    flex: 1,
  },
  bookTitle: {
    fontWeight: "bold",
    marginBottom: 6,
  },
  bookDesc: {
    fontSize: 12,
    color: "#333",
  },
  addSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 10,
  },
  addLabel: {
    fontWeight: "bold",
    fontSize: 13,
  },
  dropdown: {
    backgroundColor: "#b8c8c0",
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  dropdownText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
