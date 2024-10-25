// utils/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration (replace this with your own)
const firebaseConfig = {
  apiKey: "AIzaSyA0eVKUNo3wTL5ERai_KZt8026d-tnrruc",
  authDomain: "nft-certificate-6690c.firebaseapp.com",
  projectId: "nft-certificate-6690c",
  storageBucket: "nft-certificate-6690c.appspot.com",
  messagingSenderId: "226085931351",
  appId: "1:226085931351:web:0a597a08d0f00854d49612",
  measurementId: "G-E95T1SHQDZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth services
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
