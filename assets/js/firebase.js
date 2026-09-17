import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD36Kls8EAxX_eFxsexuo4pWR9AdyqiZo0",
  authDomain: "smartdeals-e942e.firebaseapp.com",
  projectId: "smartdeals-e942e",
  storageBucket: "smartdeals-e942e.firebasestorage.app",
  messagingSenderId: "665247132557",
  appId: "1:665247132557:web:769285990fa0f3fad56bc4"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };