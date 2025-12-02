// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4qiBBXSoQteuvlWg8AlM5BU1XZvZn7Y0",
  authDomain: "bookclub-1a96d.firebaseapp.com",
  projectId: "bookclub-1a96d",
  storageBucket: "bookclub-1a96d.firebasestorage.app",
  messagingSenderId: "983851507341",
  appId: "1:983851507341:web:092d05e325d18a66f80cc4"
};

// Initialize Firebase
export const firebase_app = initializeApp(firebaseConfig);
export const db = getFirestore(firebase_app); 
export const firebase_storage = getStorage(firebase_app);
export const firebase_auth = initializeAuth(firebase_app, {
  persistence: getReactNativePersistence(AsyncStorage),
});