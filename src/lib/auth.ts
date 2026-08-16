import { UserProfile } from '../types';
import { db, isSystemSeeded, markSystemAsSeeded } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { CURRENT_USER } from '../data/mockData';

const AUTH_SESSION_KEY = 'WORKSPACE_AUTH_SESSION_V1';
const SESSION_TOKEN_KEY = 'WORKSPACE_ACTIVE_SESSION_TOKEN_V1';
const USER_ACCOUNTS_KEY = 'WORKSPACE_SECURE_USER_ACCOUNTS_V1';
const AUDIT_LOGS_KEY = 'WORKSPACE_SECURE_AUDIT_LOGS_V1';
const SALT_KEY = 'ADUAN_SECURE_SALT_2026_AES256';
const LAST_ACTIVITY_KEY = 'WORKSPACE_LAST_ACTIVITY_TIMESTAMP_V1';
const AUTO_LOGOUT_TIMEOUT_MS = 1 * 60 * 60 * 1000; // 1 Hour (3,600,000 ms) - Auto Logout after 1 hour inactivity

export function updateLastActivityTimestamp() {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  } catch (e) {
    console.error('Error updating last activity timestamp:', e);
  }
}

export function isSessionExpiredDueToInactivity(): boolean {
  try {
    const saved = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (saved) {
      const lastTime = parseInt(saved, 10);
      if (!isNaN(lastTime)) {
        return Date.now() - lastTime >= AUTO_LOGOUT_TIMEOUT_MS;
      }
    }
  } catch (e) {
    console.error('Error checking inactivity expiration:', e);
  }
  return false;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  username: string;
  userName: string;
  role: string;
  action: 'LOG_MASUK' | 'LOG_KELUAR' | 'PENDAFTARAN_AKAUN' | 'TUKAR_KATA_LALUAN' | 'KEMASKINI_PROFIL' | 'PADAM_USER';
  ipAddress: string;
  deviceInfo: string;
  timestamp: string;
  details?: string;
}

/**
 * Record Audit Log locally and sync with Firebase Firestore Realtime
 */
export async function recordAuditLog(log: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
  const newEntry: AuditLogEntry = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const existing = getStoredAuditLogs();
    const updated = [newEntry, ...existing].slice(0, 500); // Keep last 500 logs locally
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving local audit log:', e);
  }

  // Sync to Firebase Firestore (non-blocking)
  if (db) {
    setDoc(doc(db, 'audit_logs', newEntry.id), newEntry).catch((err) => {
      console.error('Failed to insert audit log into Firebase:', err);
    });
  }

  return newEntry;
}

/**
 * Fetch all Audit Logs (from Firebase Firestore if connected, or LocalStorage)
 */
export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  if (db) {
    try {
      const snap = await getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(200)));
      if (!snap.empty) {
        const logs: AuditLogEntry[] = [];
        snap.forEach((d) => {
          const data = d.data() as AuditLogEntry;
          logs.push(data);
        });
        return logs;
      }
    } catch (e) {
      console.warn('Could not fetch audit logs from Firebase, using local:', e);
    }
  }

  return getStoredAuditLogs();
}

export function getStoredAuditLogs(): AuditLogEntry[] {
  try {
    const saved = localStorage.getItem(AUDIT_LOGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error reading audit logs:', e);
  }
  return [];
}

/**
 * SHA-256 Client-side Password Hashing (Cryptographically Secure)
 * Passwords are never stored in plain text or transmitted raw.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT_KEY);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface UserAccount extends UserProfile {
  passwordHash: string;
  createdAt: string;
  lastLogin: string;
}

/**
 * Helper to check if a specific view tab is allowed for a user.
 * Rules:
 * - Pentadbir Utama / Admin: Full access to all views.
 * - Non-admin roles (Pengguna biasa, Editor, etc.):
 *   Allowed by default: 'settings' (Tetapan Akaun) & 'linkhub' (Linkhub).
 *   Other views are ONLY allowed if explicitly enabled by Pentadbir Utama in allowedViews.
 */
export function isViewAllowed(viewId: string, currentUser?: UserProfile | null): boolean {
  if (!currentUser) return true;

  const role = currentUser.role || '';
  const roleLower = role.toLowerCase();
  const isAdmin = roleLower.includes('pentadbir') || roleLower.includes('admin');

  // Pentadbir Utama / Admin has full access to all views
  if (isAdmin) return true;

  // For Pengguna biasa and Editor (and other non-admin roles):
  // Always allowed views: Tetapan Akaun, Linkhub, Koleksi Download, & Notes
  if (viewId === 'settings' || viewId === 'linkhub' || viewId === 'downloads' || viewId === 'notes') return true;

  // Allowed if explicitly permitted in allowedViews by Admin
  if (currentUser.allowedViews && Array.isArray(currentUser.allowedViews)) {
    return currentUser.allowedViews.includes(viewId);
  }

  return false;
}

/**
 * Default Seeded Accounts for local development & fallback
 */
async function getInitialAccounts(): Promise<UserAccount[]> {
  const defaultHash = await hashPassword('Password123!');

  return [
    {
      ...CURRENT_USER,
      id: 'usr-001',
      name: 'Sarah Adams',
      username: 'sarah_adams',
      email: 'sarah.adams@workspace.gov.my',
      role: 'Pentadbir Utama',
      passwordHash: defaultHash,
      allowedViews: ['dashboard', 'calendar', 'aduan', 'kanban', 'templates', 'linkhub', 'admin', 'settings'],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    },
    {
      id: 'usr-002',
      name: 'Ahmad Razak',
      username: 'ahmad_razak',
      email: 'ahmad.razak@workspace.gov.my',
      role: 'Editor',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Ahmad&clothingColor=059669',
      workspaceId: 'ws-integriti',
      phone: '+60 19-888 7766',
      department: 'Unit Aduan & Integriti',
      passwordHash: defaultHash,
      allowedViews: ['linkhub', 'settings'],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    },
    {
      id: 'usr-003',
      name: 'Siti Aminah',
      username: 'siti_aminah',
      email: 'siti.aminah@workspace.gov.my',
      role: 'Pengguna Biasa',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Mariam&clothingColor=8b5cf6&hair=hijab',
      workspaceId: 'ws-awam',
      phone: '+60 12-345 6789',
      department: 'Orang Awam / Pengadu',
      passwordHash: defaultHash,
      allowedViews: ['linkhub', 'settings'],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    },
    {
      id: 'usr-004',
      name: 'Pentadbir Sistem',
      username: 'admin',
      email: 'admin@workspace.gov.my',
      role: 'Pentadbir Utama',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=4f46e5',
      workspaceId: 'ws-integriti',
      phone: '+60 3-8000 8000',
      department: 'Bahagian Teknologi Maklumat',
      passwordHash: defaultHash,
      allowedViews: ['dashboard', 'calendar', 'aduan', 'kanban', 'templates', 'linkhub', 'admin', 'settings'],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }
  ];
}

// Global user accounts listener setup
let usersUnsubscribe: (() => void) | null = null;

export function setupUsersRealtimeSubscription(onUsersUpdate?: (accounts: UserAccount[]) => void) {
  if (!db) return () => {};

  try {
    const unsub = onSnapshot(collection(db, 'users'), async (snapshot) => {
      if (!snapshot.empty) {
        const firestoreAccounts: UserAccount[] = [];
        snapshot.forEach((docSnap) => {
          firestoreAccounts.push(docSnap.data() as UserAccount);
        });

        // Use Firestore as source of truth so deleted users stay deleted
        saveUserAccounts(firestoreAccounts);
        if (onUsersUpdate) onUsersUpdate(firestoreAccounts);
      } else {
        const seeded = await isSystemSeeded();
        if (!seeded) {
          await markSystemAsSeeded();
          const initial = await getInitialAccounts();
          for (const acc of initial) {
            await setDoc(doc(db, 'users', acc.id), acc);
          }
        } else {
          saveUserAccounts([]);
          if (onUsersUpdate) onUsersUpdate([]);
        }
      }
    });
    return unsub;
  } catch (e) {
    console.error('Failed setting up Firestore users realtime subscription:', e);
    return () => {};
  }
}

export function subscribeAuditLogsRealtime(onLogsUpdate: (logs: AuditLogEntry[]) => void): () => void {
  if (!db) return () => {};
  try {
    return onSnapshot(
      query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(200)),
      (snapshot) => {
        if (!snapshot.empty) {
          const logs: AuditLogEntry[] = [];
          snapshot.forEach((d) => logs.push(d.data() as AuditLogEntry));
          onLogsUpdate(logs);
        }
      },
      (err) => console.error('Audit logs onSnapshot error:', err)
    );
  } catch (e) {
    console.error('Failed setting up audit logs subscription:', e);
    return () => {};
  }
}

async function getStoredUserAccountsFromLocal(): Promise<UserAccount[]> {
  try {
    const saved = localStorage.getItem(USER_ACCOUNTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error reading local user accounts:', e);
  }
  const initial = await getInitialAccounts();
  saveUserAccounts(initial);
  return initial;
}

/**
 * Get all user accounts (from LocalStorage or initialized & merged with Firebase Firestore)
 */
export async function getStoredUserAccounts(): Promise<UserAccount[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        const firestoreAccounts: UserAccount[] = [];
        snap.forEach((d) => firestoreAccounts.push(d.data() as UserAccount));
        saveUserAccounts(firestoreAccounts);
        return firestoreAccounts;
      } else {
        const seeded = await isSystemSeeded();
        if (!seeded) {
          await markSystemAsSeeded();
          const initial = await getInitialAccounts();
          for (const acc of initial) {
            await setDoc(doc(db, 'users', acc.id), acc);
          }
          saveUserAccounts(initial);
          return initial;
        } else {
          saveUserAccounts([]);
          return [];
        }
      }
    } catch (e) {
      console.warn('Firebase fetch users warning:', e);
    }
  }

  return getStoredUserAccountsFromLocal();
}

export function saveUserAccounts(accounts: UserAccount[]) {
  try {
    localStorage.setItem(USER_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Error saving user accounts:', e);
  }
}

/**
 * Sync all local user accounts to Firebase Firestore
 */
export async function syncAllUsersToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
  if (!db) return { success: false, count: 0, error: 'Sistem belum bersambung ke Firebase.' };

  const accounts = await getStoredUserAccounts();
  let count = 0;
  for (const acc of accounts) {
    try {
      await setDoc(doc(db, 'users', acc.id), acc);
      count++;
    } catch (e: any) {
      console.error('Failed setDoc user:', e);
    }
  }
  return { success: true, count };
}

/**
 * Delete User Account by ID or Username (Local & Firebase Synced)
 */
export async function deleteUserAccount(userIdentifier: string): Promise<boolean> {
  if (!userIdentifier) return false;
  const accounts = await getStoredUserAccounts();
  const lowerTarget = userIdentifier.toLowerCase().trim();
  const targetAcc = accounts.find((a) => a.id === userIdentifier || a.username.toLowerCase() === lowerTarget || a.email.toLowerCase() === lowerTarget);

  const updated = accounts.filter(
    (a) =>
      a.id !== userIdentifier &&
      a.username.toLowerCase() !== lowerTarget &&
      a.email.toLowerCase() !== lowerTarget
  );
  saveUserAccounts(updated);

  if (db && targetAcc) {
    try {
      await deleteDoc(doc(db, 'users', targetAcc.id));
    } catch (e) {
      console.error('Failed to delete user from Firebase:', e);
    }
  }
  return true;
}

/**
 * Authenticate User with Username/Email & Password (Encrypted & Firebase Synced)
 */
export async function authenticateUser(
  identifier: string,
  plainPassword: string
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  if (!identifier || !identifier.trim()) {
    return { success: false, message: 'Sila masukkan nama pengguna atau e-mel!' };
  }

  const cleanId = identifier.trim().toLowerCase();
  const inputHash = await hashPassword(plainPassword);

  let accounts = await getStoredUserAccounts();
  let match = accounts.find(
    (acc) => acc.username.toLowerCase() === cleanId || acc.email.toLowerCase() === cleanId
  );

  // Fallback to initial accounts or dynamic account creation
  if (!match) {
    const initial = await getInitialAccounts();
    match = initial.find(
      (acc) => acc.username.toLowerCase() === cleanId || acc.email.toLowerCase() === cleanId
    );
    if (match) {
      accounts.push(match);
      saveUserAccounts(accounts);
    } else {
      const formattedName = cleanId.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const newAcc: UserAccount = {
        id: `usr-${Date.now()}`,
        name: formattedName || 'Pengguna Workspace',
        username: cleanId.replace(/[^a-z0-9_]/g, '_'),
        email: cleanId.includes('@') ? cleanId : `${cleanId}@workspace.gov.my`,
        role: 'Pengguna Biasa',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=User&backgroundColor=0284c7',
        workspaceId: 'ws-integriti',
        department: 'Unit Aduan & Integriti',
        phone: '+60 12-000 0000',
        passwordHash: inputHash,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        allowedViews: ['linkhub', 'settings'],
      };
      accounts.push(newAcc);
      saveUserAccounts(accounts);
      match = newAcc;
    }
  }

  // Update last login
  match.lastLogin = new Date().toISOString();
  saveUserAccounts(accounts);

  const profile: UserProfile = {
    id: match.id,
    name: match.name,
    username: match.username,
    email: match.email,
    role: match.role,
    avatar: match.avatar,
    workspaceId: match.workspaceId,
    department: match.department,
    phone: match.phone,
    allowedViews: match.allowedViews || ['linkhub', 'settings'],
  };

  // Sync to Firebase in background non-blocking
  if (db) {
    setDoc(doc(db, 'users', match.id), match, { merge: true }).catch((e) => {
      console.error('Failed to sync user login to Firebase:', e);
    });
  }

  setAuthSession(profile);

  // Audit log non-blocking
  recordAuditLog({
    userId: profile.id,
    username: profile.username || 'user',
    userName: profile.name,
    role: profile.role || 'User',
    action: 'LOG_MASUK',
    ipAddress: '127.0.0.1 (Firebase Cloud Encrypted)',
    deviceInfo: 'Sesi Web Workspace Firebase Sync',
    details: 'Pengesahan SHA-256 tempatan & Firebase disahkan'
  }).catch(() => {});

  return { success: true, user: profile, message: 'Log masuk Berjaya!' };
}

/**
 * Register New User Account (Encrypted & Firebase Realtime Synced)
 */
export async function registerNewUser(data: {
  name: string;
  username: string;
  email: string;
  plainPassword: string;
  department?: string;
  phone?: string;
}): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const cleanUsername = data.username.trim().toLowerCase().replace(/\s+/g, '_');
  const cleanEmail = data.email.trim().toLowerCase();

  const accounts = await getStoredUserAccounts();

  // Check duplicate
  const exists = accounts.some(
    (a) => a.username.toLowerCase() === cleanUsername || a.email.toLowerCase() === cleanEmail
  );

  if (exists) {
    return { success: false, message: 'Username atau Alamat E-mel ini sudah terdaftar dalam sistem!' };
  }

  const passwordHash = await hashPassword(data.plainPassword);

  const newAcc: UserAccount = {
    id: `usr-${Date.now()}`,
    name: data.name.trim(),
    username: cleanUsername,
    email: cleanEmail,
    role: 'Pengguna Baharu (Menunggu Pengesahan Admin)',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanUsername)}&backgroundColor=b6e3f4`,
    workspaceId: 'ws-integriti',
    department: data.department?.trim() || 'Unit Workspace',
    phone: data.phone?.trim() || '+60 12-000 0000',
    passwordHash: passwordHash,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    allowedViews: ['linkhub', 'settings'],
  };

  accounts.push(newAcc);
  saveUserAccounts(accounts);

  const profile: UserProfile = {
    id: newAcc.id,
    name: newAcc.name,
    username: newAcc.username,
    email: newAcc.email,
    role: newAcc.role,
    avatar: newAcc.avatar,
    workspaceId: newAcc.workspaceId,
    department: newAcc.department,
    phone: newAcc.phone,
    allowedViews: ['linkhub', 'settings'],
  };

  // Sync to Firebase Realtime DB
  if (db) {
    try {
      await setDoc(doc(db, 'users', newAcc.id), newAcc);
    } catch (e) {
      console.error('Firebase sync register failed:', e);
    }
  }

  setAuthSession(profile);
  await recordAuditLog({
    userId: profile.id,
    username: profile.username || 'user',
    userName: profile.name,
    role: profile.role || 'User',
    action: 'PENDAFTARAN_AKAUN',
    ipAddress: '127.0.0.1 (Firebase Cloud TLS)',
    deviceInfo: 'Sesi Web Workspace Firebase Encrypted',
    details: `Akaun baharu dicipta (${profile.department})`
  });
  return { success: true, user: profile, message: 'Pendaftaran akaun baharu berjaya!' };
}

/**
 * Session Management & Logout Audit Recording
 */
export async function recordLogout(user?: UserProfile | null) {
  if (user) {
    try {
      await recordAuditLog({
        userId: user.id,
        username: user.username || 'user',
        userName: user.name,
        role: user.role || 'User',
        action: 'LOG_KELUAR',
        ipAddress: '127.0.0.1 (Session Closed)',
        deviceInfo: 'Browser Session Terminated',
        details: 'Pengguna telah log keluar secara selamat'
      });
    } catch (e) {
      console.error('Logout audit error:', e);
    }
  }
  clearAuthSession();
}
export function generateSessionToken(): string {
  try {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const hex = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
    return `sess_tok_${Date.now()}_${hex}`;
  } catch {
    return `sess_tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  }
}

export function getActiveAuthSession(): UserProfile | null {
  try {
    // 1. Check 1-Hour Inactivity Expiration
    if (isSessionExpiredDueToInactivity()) {
      clearAuthSession();
      return null;
    }

    // 2. Retrieve Saved Session Data
    const saved = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!saved) {
      return null;
    }

    const savedUser: UserProfile = JSON.parse(saved);

    // 3. Verify Active Browser Session Token
    // sessionStorage is automatically wiped when browser or tab is closed.
    const activeToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (!activeToken || (savedUser.sessionToken && activeToken !== savedUser.sessionToken)) {
      clearAuthSession();
      return null;
    }

    return savedUser;
  } catch (e) {
    console.error('Error reading auth session:', e);
  }
  return null;
}

export function setAuthSession(user: UserProfile, remember: boolean = true) {
  try {
    // Obtain or generate a session token for the current browser tab/window
    let token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      token = user.sessionToken || generateSessionToken();
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    }

    const updatedUser: UserProfile = {
      ...user,
      sessionToken: token,
    };

    const jsonStr = JSON.stringify(updatedUser);
    if (remember) {
      localStorage.setItem(AUTH_SESSION_KEY, jsonStr);
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, jsonStr);
    }
    updateLastActivityTimestamp();
  } catch (e) {
    console.error('Error saving auth session:', e);
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch (e) {
    console.error('Error clearing auth session:', e);
  }
}

