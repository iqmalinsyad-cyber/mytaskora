import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

try {
  const firebaseConfig = {
    apiKey: firebaseConfigData.apiKey,
    authDomain: firebaseConfigData.authDomain,
    projectId: firebaseConfigData.projectId,
    storageBucket: firebaseConfigData.storageBucket,
    messagingSenderId: firebaseConfigData.messagingSenderId,
    appId: firebaseConfigData.appId,
  };

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  const databaseId = firebaseConfigData.firestoreDatabaseId;
  if (databaseId && databaseId !== '(default)') {
    db = getFirestore(app, databaseId);
  } else {
    db = getFirestore(app);
  }
  console.log('Firebase Firestore initialized successfully with database ID:', databaseId);
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export { app, db };

export function isFirebaseConnected(): boolean {
  return Boolean(db);
}
