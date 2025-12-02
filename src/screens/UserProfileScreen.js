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
  FlatList
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar } from "react-native-paper";
import { db } from "../utils/firebase-config";
import { doc, getDoc, setDoc, updateDoc, addDoc, getDocs, collection, arrayUnion, arrayRemove } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";


export default function UserProfileScreen() {
    const auth = getAuth();
    const user = auth.currentUser;
    const userID = user ? user.uid : null;

    const [userInfo, setUserInfo] = useState(null);
    const [tempUsername, setTempUsername] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClubName, setNewClubName] = useState("");
    const [newClubDesc, setNewClubDesc] = useState("");

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
                bookClub: null,
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

    // fetch all book clubs from firestore
    useEffect(() => {
        const fetchBookClubs = async () => {
            try {
                const snapshot = await getDocs(collection(db, "bookclubs"));
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setClubs(data);
            } catch (error) {
                console.error("Error fetching book clubs: ", error);
            }
        };
        fetchBookClubs();
    }, []);

    // join a club
    const handleJoinClub = async (clubID, clubName) => {
        try {
            const userRef = doc(db, "users", user.uid);
            const clubRef = doc(db, "bookclubs", clubID);

            await updateDoc(userRef, { bookClub: clubName });
            await updateDoc(clubRef, { members: arrayUnion(user.uid) });

            setUserInfo(prev => ({ ...prev, bookClub: clubName }));
            alert(`Joined ${clubName}!`);
        } catch (error) {
            console.error("Error joining club:", error);
        }
    }

    // leave a club
    const handleLeaveClub = async (clubName) => {
        try {
            const clubSnap = await getDocs(collection(db, "bookclubs"));
            const clubDoc = clubSnap.docs.find(doc => doc.data().name === clubName);
            if (!clubDoc) return;

            const userRef = doc(db, "users", user.uid);
            const clubRef = doc(db, "bookclubs", clubDoc.id);

            await updateDoc(userRef, { bookClub: null });
            await updateDoc(clubRef, { members: arrayRemove(user.uid) });

            setUserInfo(prev => ({ ...prev, bookClub: null }));
            alert(`You left ${clubName}.`);
        } catch (error) {
            console.error("Error leaving club:", error);
        }
    }

    // create a new book club
    const handleCreateClub = async () => {
        if (!newClubName.trim()) {
            alert("Please enter a club name!");
            return;
        }

        try {
            const newClub = {
                name: newClubName,
                description: newClubDesc || "A new book club",
                members: [user.uid],
                createdBy: user.uid,
            };
            const docRef = await addDoc(collection(db, "bookclubs"), newClub);

            // Update user info
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { bookClub: newClubName });

            setUserInfo((prev) => ({ ...prev, bookClub: newClubName }));
            setClubs((prev) => [...prev, { id: docRef.id, ...newClub }]);

            setShowCreateModal(false);
            setNewClubName("");
            setNewClubDesc("");
            alert(`Created and joined ${newClubName}!`);
        } catch (error) {
            console.error("Error creating club:", error);
        }
    };

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

    // profile pic stuff ----------------------------------
    const pickImageAndUpload = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                alert("Permission required to choose a profile picture.");
                return;
            }

                // Pick image with Base64 encoding enabled
                const result = await ImagePicker.launchImageLibraryAsync({
                base64: true,
                allowsEditing: true,
                quality: 0.4,  // compress to avoid >1MB
            });

            if (result.canceled) return;

            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;

            // Save directly to Firestore
            const userRef = doc(db, "users", userID);
            await updateDoc(userRef, {
            profilePicture: base64Image,
            });

            // Update UI state
            setUserInfo((prev) => ({ ...prev, profilePicture: base64Image }));
        } catch (error) {
            console.error("Error uploading Base64 image:", error);
        }
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
                    uri: userInfo?.profilePicture ||
                    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
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

        <View style = {styles.buttonContainer}> 
            {/* EDIT USERNAME BUTTON */}
            <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Edit Username</Text>
            </TouchableOpacity>

            {/* CHANGE PROFILE PICTURE BUTTON */}
            <TouchableOpacity style={styles.editButton} onPress={pickImageAndUpload}>
                <Ionicons name = "image-outline" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Change Profile Picture</Text>
            </TouchableOpacity>
        </View>


        {/* JOIN / CREATE CLUB CARD */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Book Club</Text>
            <View style={styles.cardContent}>
            {userInfo.bookClub ? (
                <>
                <View style={styles.cardCotainer}>
                    <Text style={styles.clubText}>You are in: {userInfo.bookClub}</Text>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: "#ff6961" }]}
                        onPress={() => handleLeaveClub(userInfo.bookClub)}
                    >
                        <Text style={styles.buttonText}>Leave Club</Text>
                    </TouchableOpacity>
                </View>
                </>
            ) : (
                <>
                <Text style={styles.clubText}>Join or create a club below:</Text>
                <FlatList
                    data={clubs}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.clubCard}
                        onPress={() => handleJoinClub(item.id, item.name)}
                    >
                        <Text style={styles.clubName}>{item.name}</Text>
                        <Text style={styles.clubDesc}>{item.description}</Text>
                    </TouchableOpacity>
                    )}
                />
                <TouchableOpacity
                    style={[styles.button, { marginTop: 10 }]}
                    onPress={() => setShowCreateModal(true)}
                >
                    <Text style={styles.buttonText}>+ Create New Club</Text>
                </TouchableOpacity>
                </>
            )}
            </View>
        </View>

        {/* CREATE CLUB MODAL */}
        <Modal visible={showCreateModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Create a New Club</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Club name"
                    value={newClubName}
                    onChangeText={setNewClubName}
                />
                <TextInput
                    style={[styles.input, { height: 80 }]}
                    placeholder="Club description"
                    multiline
                    value={newClubDesc}
                    onChangeText={setNewClubDesc}
                />
                <View style={styles.modalButtons}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: "#00A676" }]}
                    onPress={handleCreateClub}
                >
                    <Text style={styles.buttonText}>Create</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: "#999" }]}
                    onPress={() => setShowCreateModal(false)}
                >
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                </View>
            </View>
            </View>
        </Modal>

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

        <FlatList
            data={userInfo.readingLists.favorites} 
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
            <View style={styles.bookItem}>
                <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                <Text style={styles.bookTitle}>{item.title}</Text>
            </View>
            )}
            ListEmptyComponent={
            <Text style={styles.empty}>No favorite books yet.</Text>
            }
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 5 }}
        />
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "90%",
    marginBottom: 15,
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0", // light gray background to make cards pop
    paddingTop: 40,
    alignItems: "center",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    width: "90%",
  },
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

  // Card style for shelves
  card: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 10,
  },
  cardContent: {
    paddingVertical: 5,
  },

  // Horizontal book item
  bookItem: {
    marginRight: 10,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 5,
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

  clubCard: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  clubName: { fontWeight: "700", fontSize: 14 },
  clubDesc: { fontSize: 12, color: "#555" },
  clubText: { marginBottom: 10, fontSize: 13, color: "#333" },

  button: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: "#00A676",
  },
  buttonText: { color: "#fff", fontWeight: "600" },

  progressBar: { height: 10, borderRadius: 5, marginBottom: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { backgroundColor: "#fff", width: "85%", borderRadius: 10, padding: 20, elevation: 5 },
  modalBox: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 15, textAlign: "center" },
  input: { borderBottomWidth: 1, borderColor: "#ccc", marginBottom: 10, fontSize: 14, paddingVertical: 4 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  saveButton: { backgroundColor: "#00A676", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 6 },
  cancelButton: { backgroundColor: "#ccc", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 6 },
  saveText: { color: "#fff", fontWeight: "600" },
  cancelText: { color: "#333", fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});

