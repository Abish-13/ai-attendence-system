import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAv5OW_H-qYdMm4g1_jEvoIW_lt-TA0b-w",
  authDomain: "identity-management-website.firebaseapp.com",
  projectId: "identity-management-website",
  storageBucket: "identity-management-website.firebasestorage.app",
  messagingSenderId: "376324457918",
  appId: "1:376324457918:web:8821fc0185d1d1172d65ef",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);