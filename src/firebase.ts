/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";
import { 
  initializeFirestore,
  getFirestore,
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject
} from "firebase/storage";

// VibeStream Firebase Configuration Object
const firebaseConfig = {
  apiKey: "AIzaSyArLaTIGsYtwEoHy0w-J5Yuu4qsIA8LuLw",
  authDomain: "certain-depth-7n56p.firebaseapp.com",
  projectId: "certain-depth-7n56p",
  storageBucket: "certain-depth-7n56p.firebasestorage.app",
  messagingSenderId: "755533267208",
  appId: "1:755533267208:web:89c03a5d04fba9fc51ecbd"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore (handling custom database ID if applicable)
const databaseId = "ai-studio-a69e6290-c820-499a-accd-3ed5d5b927c5";
export const db = initializeFirestore(app, {}, databaseId);

// Initialize Firebase Storage
export const storage = getStorage(app);

export {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
};
