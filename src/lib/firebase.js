import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyCi0nu0_-hkqkH98gFnQYv_2gntQKo1Ojc",
    authDomain: "gate-pulse-e381f.firebaseapp.com",
    projectId: "gate-pulse-e381f",
    storageBucket: "gate-pulse-e381f.firebasestorage.app",
    messagingSenderId: "777759648005",
    appId: "1:777759648005:web:c91e8f8376f5377c4eaf6c",
    measurementId: "G-84KBDCRXK6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
