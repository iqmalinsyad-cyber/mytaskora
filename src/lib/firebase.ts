import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
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
  console.log('Firebase Firestore initialized successfully with database ID:', firestoreDatabaseId);

  // Connection probe test
  if (db) {
    getDocFromServer(doc(db, '_diagnostics', 'boot_probe'))
      .then(() => {
        console.log('🔥 Firebase server connection test succeeded.');
      })
      .catch((error) => {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn('Firebase client is offline. Local cache will be used.');
        } else {
          console.log('Firebase server probe note:', error?.message || error);
        }
      });
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export { app, db };

export async function isSystemSeeded(): Promise<boolean> {
  if (!db) return true;
  try {
    const snap = await getDoc(doc(db, '_system', 'seed_status'));
    return snap.exists() && snap.data()?.seeded === true;
  } catch (e) {
    console.error('Error checking isSystemSeeded:', e);
    return true; // Fail-safe: do not auto-seed if error occurs
  }
}

export async function markSystemAsSeeded(): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, '_system', 'seed_status'), {
      seeded: true,
      seededAt: new Date().toISOString(),
      version: 'v2',
    }, { merge: true });
  } catch (e) {
    console.error('Error marking system as seeded:', e);
  }
}

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



