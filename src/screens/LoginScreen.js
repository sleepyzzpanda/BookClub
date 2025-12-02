/*
Component: LoginScreen
Description: Handles user login and registration.
*/

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useState } from "react";
import { firebase_auth, db } from "../utils/firebase-config"; // add firebase_db (Firestore)
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { doc, setDoc } from "firebase/firestore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // SIGN UP
  const handleSignUp = async () => {
    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        firebase_auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      // Create Firestore user document with reading lists
      await setDoc(doc(db, "users", user.uid), {
        username: email.split("@")[0],
        booksRead: 0,
        bookshelves: 0,
        bookClub: null,
        recommended: 0,

        // Auto-generated reading lists
        readingLists: {
          read: [],
          wantToRead: [],
          currentlyReading: [],
          favorites: [],
        },
      });

      Alert.alert("User registered successfully!");
    } catch (e) {
      console.error("Sign up error:", e);
      Alert.alert("Error registering user:", e.message);
    } finally {
      setLoading(false);
    }
  };

  // SIGN IN
  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(firebase_auth, email.trim(), password);
      Alert.alert("User signed in successfully!");
    } catch (e) {
      console.error("Sign in error:", e);
      Alert.alert("Error signing in user:", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BOOK CLUB</Text>
      <Text style={styles.subtitle}>~READ YAP REPEAT~</Text>

      <TextInput
        placeholder="EMAIL"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="PASSWORD"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={handleSignIn}
          disabled={loading}
          style={styles.button}
        >
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSignUp}
          disabled={loading}
          style={styles.button}
        >
          <Text style={styles.buttonText}>SIGN UP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontStyle: "italic",
    color: "gray",
    marginBottom: 40,
  },
  input: {
    width: 220,
    height: 35,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    backgroundColor: "#d3d3d3",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  buttonText: {
    fontWeight: "700",
  },
});
