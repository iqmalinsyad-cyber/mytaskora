import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData?.apiKey || "";
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData?.authDomain || "";
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData?.projectId || "";
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData?.storageBucket || "";
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData?.messagingSenderId || "";
const appId = import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData?.appId || "";
const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData?.firestoreDatabaseId || "";

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
  if (localStorage.getItem('SYSTEM_SEEDED_V2') === 'true') {
    return true;
  }
  if (!db) return true;
  try {
    const snap = await getDoc(doc(db, '_system', 'seed_status'));
    if (snap.exists() && snap.data()?.seeded === true) {
      localStorage.setItem('SYSTEM_SEEDED_V2', 'true');
      return true;
    }
    return false;
  } catch (e: any) {
    if (e?.message?.includes('offline') || e?.code === 'unavailable') {
      console.warn('isSystemSeeded offline check fallback:', e?.message || e);
    } else {
      console.warn('isSystemSeeded note:', e?.message || e);
    }
    return true; // Fail-safe: do not auto-seed if error/offline occurs
  }
}

export async function markSystemAsSeeded(): Promise<void> {
  localStorage.setItem('SYSTEM_SEEDED_V2', 'true');
  if (!db) return;
  try {
    await setDoc(doc(db, '_system', 'seed_status'), {
      seeded: true,
      seededAt: new Date().toISOString(),
      version: 'v2',
    }, { merge: true });
  } catch (e) {
    console.warn('Error marking system as seeded in Firestore:', e);
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



