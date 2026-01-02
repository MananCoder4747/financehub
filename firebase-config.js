// ========================================
// Firebase Configuration
// ========================================
// IMPORTANT: Replace these with your own Firebase project credentials
// Go to: https://console.firebase.google.com
// 1. Create a new project
// 2. Enable Authentication > Google Sign-In
// 3. Enable Firestore Database
// 4. Copy your config from Project Settings > Your Apps > Web App

const firebaseConfig = {
  apiKey: "AIzaSyBmgZMiAa5xe8xPHIMzGiGrzGPu-GTiotY",
  authDomain: "financehub-9c785.firebaseapp.com",
  projectId: "financehub-9c785",
  storageBucket: "financehub-9c785.firebasestorage.app",
  messagingSenderId: "647989462746",
  appId: "1:647989462746:web:552325d8afc3766edbc7e3",
  measurementId: "G-SKHF6SW8VB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});
