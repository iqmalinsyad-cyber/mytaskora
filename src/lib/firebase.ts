import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData?.apiKey || "AIzaSyAmH6eAqzrzhqGaZKAclr7TLqKpospYmR8";
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData?.authDomain || "pioneering-shade-g9v0l.firebaseapp.com";
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData?.projectId || "pioneering-shade-g9v0l";
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData?.storageBucket || "pioneering-shade-g9v0l.firebasestorage.app";
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData?.messagingSenderId || "889080513840";
const appId = import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData?.appId || "1:889080513840:web:6cb88570c550d1fc2234f5";
const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData?.firestoreDatabaseId || "ai-studio-aduanworkspacesy-e535aaf3-0057-4e2c-a3a0-497d3cc2caf2";

try {
  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  if (firestoreDatabaseId && firestoreDatabaseId !== '(default)') {
    db = getFirestore(app, firestoreDatabaseId);
  } else {
    db = getFirestore(app);
  }
  console.log('Firebase Firestore initialized successfully for Cloudflare Pages / AI Studio with database ID:', firestoreDatabaseId);
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export { app, db };

export function isFirebaseConnected(): boolean {
  return Boolean(db);
}

export function getFirebaseConfigInfo() {
  return {
    projectId,
    firestoreDatabaseId,
    isConnected: Boolean(db),
  };
}

