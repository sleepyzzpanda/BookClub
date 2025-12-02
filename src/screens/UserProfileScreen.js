/*
Component: UserProfileScreen
Description: Displays and manages the user's profile, including username, profile picture, book clubs, and reading stats.
raf if youre seeing this im so sorry this one is soooo long
i really tried to make it shorter
it didnt work 
*/

// IMPORTS ------------------------------------------------
import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../utils/firebase-config";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  getDocs,
  collection,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { generateUserStats } from "../modules/generateUserStats";

// MAIN COMPONENT ----------------------------------------
export default function UserProfileScreen() {
  // set up auth and user info
  const auth = getAuth();
  const user = auth.currentUser;
  const userID = user ? user.uid : null;

  // state variables
  const [userInfo, setUserInfo] = useState(null);
  const [tempUsername, setTempUsername] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubDesc, setNewClubDesc] = useState("");
  const [stats, setStats] = useState(null);

  // function to update books read and bookshelves counts
  const updateUserStats = async (data) => {
    if (!userID || !data?.readingLists) return;

    const booksReadCount = data.readingLists.read?.length || 0;
    const bookshelvesCount = Object.keys(data.readingLists).length;

    // Only update Firestore if values changed
    if (
      data.booksRead !== booksReadCount ||
      data.bookshelves !== bookshelvesCount
    ) {
      try {
        const userRef = doc(db, "users", userID);
        await updateDoc(userRef, {
          booksRead: booksReadCount,
          bookshelves: bookshelvesCount,
        });

        // update UI
        setUserInfo((prev) => ({
          ...prev,
          booksRead: booksReadCount,
          bookshelves: bookshelvesCount,
        }));
      } catch (e) {
        console.error("Error updating stats:", e);
      }
    }
  };

  // fetch user info from firestore when screen loads
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userID) return;
        const docRef = doc(db, "users", userID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserInfo(data);

          // Update booksRead + bookshelves
          updateUserStats(data);
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
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClubs(data);
      } catch (error) {
        console.error("Error fetching book clubs: ", error);
      }
    };
    fetchBookClubs();
  }, []);

  // generate reading stats whenever userInfo loads or updates
  useEffect(() => {
    const loadStats = async () => {
      if (!userInfo || !userInfo.readingLists) return;

      const stats = await generateUserStats(userInfo.readingLists.read || []);
      // console.log("Generated stats:", stats); // debug line
      setStats(stats);
    };

    loadStats();
  }, [userInfo]);

  // join a club
  const handleJoinClub = async (clubID, clubName) => {
    try {
      // find the club document
      const userRef = doc(db, "users", user.uid);
      const clubRef = doc(db, "bookclubs", clubID);
      // update both user and club documents
      await updateDoc(userRef, { bookClub: clubName });
      await updateDoc(clubRef, { members: arrayUnion(user.uid) });
      // update UI state
      setUserInfo((prev) => ({ ...prev, bookClub: clubName }));
      alert(`Joined ${clubName}!`);
    } catch (error) {
      console.error("Error joining club:", error);
    }
  };

  // leave a club
  const handleLeaveClub = async (clubName) => {
    try {
      // find the club document
      const clubSnap = await getDocs(collection(db, "bookclubs"));
      const clubDoc = clubSnap.docs.find((doc) => doc.data().name === clubName);
      if (!clubDoc) return;
      // update both user and club documents
      const userRef = doc(db, "users", user.uid);
      const clubRef = doc(db, "bookclubs", clubDoc.id);
      // update both user and club documents
      await updateDoc(userRef, { bookClub: null });
      await updateDoc(clubRef, { members: arrayRemove(user.uid) });
      // update UI state
      setUserInfo((prev) => ({ ...prev, bookClub: null }));
      alert(`You left ${clubName}.`);
    } catch (error) {
      console.error("Error leaving club:", error);
    }
  };

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
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert("Permission required to choose a profile picture.");
        return;
      }

      // Pick image with Base64 encoding enabled
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        allowsEditing: true,
        quality: 0.4, // compress to avoid >1MB
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

  // check loading state (wheel of death)
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A676" />
      </View>
    );
  }

  // check userInfo state
  if (!userInfo) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Error loading profile</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* USER INFO */}
        <View style={styles.profileSection}>
          <Image
            source={{
              uri:
                userInfo?.profilePicture ||
                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
            }}
            style={styles.profileImage}
          />

          <View style={styles.userInfo}>
            <Text style={styles.username}>{userInfo.username}</Text>
            <Text style={styles.statsText}>
              Books Read: {userInfo.booksRead}
            </Text>
            <Text style={styles.statsText}>
              Book Shelves: {userInfo.bookshelves}
            </Text>
            <Text style={styles.statsText}>Book Club: {userInfo.bookClub}</Text>
            <Text style={styles.statsText}>
              Books Recommended: {userInfo.recommended}
            </Text>
          </View>
        </View>

            {/* EDIT BUTTONS */}
        <View style={styles.buttonContainer}>
          {/* EDIT USERNAME BUTTON */}
          <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Edit Username</Text>
          </TouchableOpacity>

          {/* CHANGE PROFILE PICTURE BUTTON */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={pickImageAndUpload}
          >
            <Ionicons name="image-outline" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Change Profile Picture</Text>
          </TouchableOpacity>
        </View>

        {/* JOIN / CREATE CLUB CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Book Club</Text>
          <View style={styles.cardContent}>
            {userInfo.bookClub ? (
              <>
                <View style={styles.cardContainer}>
                  <Text style={styles.clubText}>
                    You are in: {userInfo.bookClub}
                  </Text>
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
                <Text style={styles.clubText}>
                  Join or create a club below:
                </Text>
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
            {stats ? (
              <View>
                {/* TOTAL BOOKS */}
                <Text style={styles.statText}>
                  Total Books Read:{" "}
                  <Text style={styles.statValue}>{stats.totalBooksRead}</Text>
                </Text>

                {/* TOTAL PAGES */}
                <Text style={styles.statText}>
                  Total Pages Read:{" "}
                  <Text style={styles.statValue}>{stats.totalPagesRead}</Text>
                </Text>

                {/* AVG LENGTH */}
                <Text style={styles.statText}>
                  Average Book Length:{" "}
                  <Text style={styles.statValue}>
                    {stats.averageBookLength} pages
                  </Text>
                </Text>

                {/* TOP GENRES */}
                <Text style={[styles.statText, { marginTop: 10 }]}>
                  Top Genres:
                </Text>

                {stats.topGenres.length > 0 ? (
                  stats.topGenres.slice(0, 3).map((genre, index) => (
                    <Text key={index} style={styles.genreItem}>
                      {index + 1}. {genre}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.genreItem}>No genres found</Text>
                )}
              </View>
            ) : (
              <Text style={styles.statText}>Loading stats...</Text>
            )}
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
                <Image
                  source={{ uri: item.thumbnail }}
                  style={styles.thumbnail}
                />
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
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
        >
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
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 15,
  },
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
    backgroundColor: "#f0f0f0",
    paddingTop: 15,
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
    elevation: 3,
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
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
    fontSize: 14,
    paddingVertical: 4,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  saveButton: {
    backgroundColor: "#00A676",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: "#ccc",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  saveText: { color: "#fff", fontWeight: "600" },
  cancelText: { color: "#333", fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  safeArea: { flex: 1, backgroundColor: "#fff" },
  statText: {
    fontSize: 13,
    marginBottom: 4,
    color: "#333",
  },
  statValue: {
    fontWeight: "700",
    color: "#00A676",
  },
  genreItem: {
    fontSize: 12,
    marginLeft: 10,
    color: "#444",
  },
});
