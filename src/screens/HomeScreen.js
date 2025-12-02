/*
Component: HomeScreen
Description: Displays the home feed for the user's book club, allowing posting and viewing posts.
*/

import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { db } from "../utils/firebase-config";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";

export default function HomeScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const [posts, setPosts] = useState([]);
  const [userClub, setUserClub] = useState(null);
  const [newPostText, setNewPostText] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userName, setUsername] = useState("");

  // fetch user info to get their book club
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserClub(userDoc.data().bookClub);
          setUsername(userDoc.data().username);
        }
      } catch (e) {
        console.error("Error fetching user info:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // listen for posts in user's book club
  useFocusEffect(
    useCallback(() => {
      if (!userClub) return;

      const q = query(
        collection(db, "posts"),
        where("clubId", "==", userClub),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });

      // Cleanup when screen is unfocused
      return () => unsubscribe();
    }, [userClub])
  );

  // pick image from gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // take photo with camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Camera access is needed to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6, // reduce quality for faster upload
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // upload post to Firestore (with optional Base64 image)
  const handlePost = async () => {
    if (!newPostText.trim() && !image) {
      Alert.alert("Please write something or add an image");
      return;
    }

    try {
      setUploading(true);
      let imageBase64 = null;

      if (image) {
        // Convert local image to Base64 string
        const response = await fetch(image);
        const blob = await response.blob();

        const reader = new FileReader();
        // Create a promise to handle async reading
        const base64Promise = new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
        });
        reader.readAsDataURL(blob); // Read blob as Base64
        imageBase64 = await base64Promise; // Wait for Base64 string
      }

      // Save post directly to Firestore
      await addDoc(collection(db, "posts"), {
        clubId: userClub,
        userId: user.uid,
        username: userName || "Anonymous",
        text: newPostText.trim(),
        imageBase64, // store Base64 string
        createdAt: serverTimestamp(),
      });

      setNewPostText("");
      setImage(null);
    } catch (error) {
      console.error("Error posting:", error);
      Alert.alert("Error posting", error.message);
    } finally {
      setUploading(false);
    }
  };

  // Loading state (spinning wheel of death)
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00A676" />
      </View>
    );
  }

  // check if user is in a book club
  if (!userClub) {
    return (
      <View style={styles.center}>
        <Text style={{ textAlign: "center" }}>
          Join a book club to see posts!
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Post Input */}
        <View style={styles.postBox}>
          <TextInput
            placeholder="Share something with your club..."
            value={newPostText}
            onChangeText={setNewPostText}
            style={styles.input}
            multiline
          />
          {image && <Image source={{ uri: image }} style={styles.preview} />}
          <View style={styles.postButtons}>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text>🖼️</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Text>📸</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.postButton}
              onPress={handlePost}
              disabled={uploading}
            >
              <Text style={styles.postText}>
                {uploading ? "Posting..." : "Post"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feed */}
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.postContent}>{item.text}</Text>

              {/* Render Base64 image if exists */}
              {item.imageBase64 && (
                <Image
                  source={{ uri: item.imageBase64 }}
                  style={styles.postImage}
                />
              )}

              <Text style={styles.timestamp}>
                {item.createdAt?.toDate
                  ? new Date(item.createdAt.toDate()).toLocaleString()
                  : ""}
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  postBox: {
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  input: { minHeight: 50, fontSize: 14 },
  preview: { width: "100%", height: 180, borderRadius: 8, marginVertical: 8 },
  postButtons: { flexDirection: "row", justifyContent: "space-between" },
  imageButton: {
    padding: 8,
    backgroundColor: "#ccc",
    borderRadius: 5,
  },
  postButton: {
    backgroundColor: "#00A676",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 5,
  },
  postText: { color: "#fff", fontWeight: "700" },
  postCard: {
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  username: { fontWeight: "700", marginBottom: 5 },
  postContent: { fontSize: 14, marginBottom: 5 },
  postImage: { width: "100%", height: 200, borderRadius: 8, marginTop: 5 },
  timestamp: { fontSize: 10, color: "#777", textAlign: "right", marginTop: 5 },
});
