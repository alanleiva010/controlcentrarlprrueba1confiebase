import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import type { FirebaseConfig } from '../types/firebase';

const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyDZPXxZHr1oqvnwJ_7Y5IVd5bEfv9g9Xtk",
  authDomain: "menlei-system.firebaseapp.com",
  databaseURL: "https://menlei-system-default-rtdb.firebaseio.com",
  projectId: "menlei-system",
  storageBucket: "menlei-system.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef0123456789abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const database = getDatabase(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;