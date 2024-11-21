
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDMFC7HJdIWH0OUITw-iRH6yiOZgiet_6k",
  authDomain: "dlvr-test.firebaseapp.com",
  projectId: "dlvr-test",
  storageBucket: "dlvr-test.firebasestorage.app",
  messagingSenderId: "571994842295",
  appId: "1:571994842295:web:4272fd7e0974062f301932",
  measurementId: "G-YKGPJ7HMP9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db };