import { initializeApp } from "firebase/app";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAzoZuy1dSwlIbEKg-EoFxdibu-iihYuYU",
  authDomain: "money-manager-aa0ca.firebaseapp.com",
  projectId: "money-manager-aa0ca",
  storageBucket: "money-manager-aa0ca.firebasestorage.app",
  messagingSenderId: "703699447099",
  appId: "1:703699447099:web:32975f6c649a0e99ff5b1e",
  measurementId: "G-L5ZQ57VRQY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);

export const registerWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await sendEmailVerification(userCredential.user);
    await signOut(auth);
    return userCredential.user;
  } catch (error) {
    console.error("Error registering with email", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in with email", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
