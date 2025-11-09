import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar } from "react-native-paper";
import { db } from "../utils/firebase-config";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function UserProfileScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const userID = user ? user.uid : null;

  const [userInfo, setUserInfo] = useState(null);
  const [tempUsername, setTempUsername] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // fetch user info from firestore when screen loads
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userID) return;
        const docRef = doc(db, "users", userID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserInfo(docSnap.data());
        } else {
          const defaultData = {
            username: "malicious-duck",
            booksRead: "0",
            bookshelves: "0",
            bookClub: "NONE",
            recommended: "0",
          };
          await setDoc(docRef, defaultData);
          setUserInfo(defaultData);
        }
      } catch (error) {
        console.error("Error loading user: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userID]);

  const openEditModal = () => {
    if (userInfo) {
      setTempUsername(userInfo.username);
      setIsModalVisible(true);
    }
  };

  const handleSave = async () => {
    try {
      const updatedData = { ...userInfo, username: tempUsername };
      await updateDoc(doc(db, "users", userID), { username: tempUsername });
      setUserInfo(updatedData);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error saving username:", error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A676" />
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Error loading profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* USER INFO */}
      <View style={styles.profileSection}>
        <Image
          source={{
            uri: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
          }}
          style={styles.profileImage}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{userInfo.username}</Text>
          <Text style={styles.statsText}>Books Read: {userInfo.booksRead}</Text>
          <Text style={styles.statsText}>Book Shelves: {userInfo.bookshelves}</Text>
          <Text style={styles.statsText}>Book Club: {userInfo.bookClub}</Text>
          <Text style={styles.statsText}>Books Recommended: {userInfo.recommended}</Text>
        </View>
      </View>

      {/* EDIT BUTTON */}
      <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
        <Ionicons name="create-outline" size={20} color="#fff" />
        <Text style={styles.editButtonText}>Edit Username</Text>
      </TouchableOpacity>

      {/* READING STATS CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>READING STATS</Text>
        <View style={styles.cardContent}>
          <ProgressBar progress={0.8} color="#00A676" style={styles.progressBar} />
        </View>
      </View>

      {/* FAVORITE BOOKS CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>FAVORITE BOOKS</Text>
        <View style={styles.cardContent}></View>
      </View>

      {/* EDIT USERNAME MODAL */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Username</Text>

            <TextInput
              style={styles.input}
              value={tempUsername}
              onChangeText={setTempUsername}
              placeholder="Enter new username"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 40, alignItems: "center" },
  profileSection: { flexDirection: "row", alignItems: "center", marginBottom: 20, width: "90%" },
  profileImage: { width: 80, height: 80, borderRadius: 10, marginRight: 15 },
  userInfo: { flexShrink: 1 },
  username: { fontWeight: "700", fontSize: 16 },
  statsText: { fontSize: 12, color: "#333" },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00A676",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginBottom: 15,
  },
  editButtonText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
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
  cardTitle: { fontWeight: "700", marginBottom: 6 },
  cardContent: { backgroundColor: "#c8cbf7", borderRadius: 6, padding: 10 },
  progressBar: { height: 10, borderRadius: 5, marginBottom: 5 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", width: "85%", borderRadius: 10, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 15, textAlign: "center" },
  input: { borderBottomWidth: 1, borderColor: "#ccc", marginBottom: 10, fontSize: 14, paddingVertical: 4 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  saveButton: { backgroundColor: "#00A676", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 6 },
  cancelButton: { backgroundColor: "#ccc", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 6 },
  saveText: { color: "#fff", fontWeight: "600" },
  cancelText: { color: "#333", fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
