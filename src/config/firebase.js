import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCRB3d_g15HFLj2zqy8LJa4aAyJ6t3SFEA",
  authDomain: "vasshotel.firebaseapp.com",
  projectId: "vasshotel",
  storageBucket: "vasshotel.firebasestorage.app",
  messagingSenderId: "800466983436",
  appId: "1:800466983436:web:250c2dad1899a27b8c2c29"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
