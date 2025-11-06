// Import the functions you need from the SDKs you need
// src/firebase.js
import { initializeApp } from "firebase/app";
// YOU MUST HAVE THIS LINE BELOW:
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyBVpCqb_KDd-rC9j65LVyKcgfSCfZrYkOI",
  authDomain: "gen-lang-client-0400760132.firebaseapp.com",
  projectId: "gen-lang-client-0400760132",
  storageBucket: "gen-lang-client-0400760132.firebasestorage.app",
  messagingSenderId: "1059959734323",
  appId: "1:1059959734323:web:2c1b6143f1ac563fbaa346",
  measurementId: "G-JDY1NZLEMN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);