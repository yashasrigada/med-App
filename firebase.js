import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA1ZejmwI9qz2007NrocPamJhxRt3R1pCI",
  authDomain: "med-app-ab0b8.firebaseapp.com",
  projectId: "med-app-ab0b8",
  storageBucket: "med-app-ab0b8.firebasestorage.app",
  messagingSenderId: "471371803337",
  appId: "1:471371803337:web:a543adc46c4ee218273b18",
  measurementId: "G-QW08RMK2BK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);