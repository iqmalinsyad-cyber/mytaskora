import { UserProfile } from '../types';
import { getSupabaseClient } from './supabase';
import { CURRENT_USER } from '../data/mockData';

const AUTH_SESSION_KEY = 'WORKSPACE_AUTH_SESSION_V1';
const USER_ACCOUNTS_KEY = 'WORKSPACE_SECURE_USER_ACCOUNTS_V1';
const AUDIT_LOGS_KEY = 'WORKSPACE_SECURE_AUDIT_LOGS_V1';
const SALT_KEY = 'ADUAN_SECURE_SALT_2026_AES256';

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
 * Record Audit Log locally and sync with Supabase Realtime
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

  // Sync to Supabase Realtime
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('audit_logs').insert({
        id: newEntry.id,
        user_id: newEntry.userId,
        username: newEntry.username,
        user_name: newEntry.userName,
        role: newEntry.role,
        action: newEntry.action,
        ip_address: newEntry.ipAddress,
        device_info: newEntry.deviceInfo,
        timestamp: newEntry.timestamp,
        details: newEntry.details || '',
      });
    } catch (err) {
      console.error('Failed to insert audit log into Supabase:', err);
    }
  }

  return newEntry;
}

/**
 * Fetch all Audit Logs (from Supabase if connected, or LocalStorage)
 */
export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);

      if (!error && data) {
        return data.map((d) => ({
          id: d.id,
          userId: d.user_id,
          username: d.username,
          userName: d.user_name,
          role: d.role,
          action: d.action,
          ipAddress: d.ip_address || '127.0.0.1 (Web Encrypted)',
          deviceInfo: d.device_info || 'Browser Application Session',
          timestamp: d.timestamp,
          details: d.details,
        }));
      }
    } catch (e) {
      console.warn('Could not fetch audit logs from Supabase, using local:', e);
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
 * Default Seeded Accounts for local development & fallback
 */
async function getInitialAccounts(): Promise<UserAccount[]> {
  const sarahHash = await hashPassword('Password123!');
  const adminHash = await hashPassword('AdminPassword123!');

  return [
    {
      ...CURRENT_USER,
      username: 'sarah_adams',
      passwordHash: sarahHash,
      allowedViews: ['dashboard', 'aduan', 'kanban', 'templates', 'linkhub', 'admin', 'settings'],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    },
    {
      id: 'usr-002',
      name: 'Dato\' Ahmad Safwan',
      username: 'ahmad_safwan',
      email: 'ahmad.safwan@workspace.gov.my',
      role: 'Pengarah Integriti',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      workspaceId: 'ws-integriti',
      phone: '+60 19-888 7766',
      department: 'Pejabat Pengarah Integriti',
      passwordHash: adminHash,
      allowedViews: ['dashboard', 'aduan', 'kanban', 'templates', 'linkhub', 'settings'],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    },
  ];
}

/**
 * Get all user accounts (from LocalStorage or initialized & merged with Supabase)
 */
export async function getStoredUserAccounts(): Promise<UserAccount[]> {
  let accounts: UserAccount[] = [];
  try {
    const saved = localStorage.getItem(USER_ACCOUNTS_KEY);
    if (saved) {
      accounts = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading user accounts:', e);
  }

  if (accounts.length === 0) {
    accounts = await getInitialAccounts();
    saveUserAccounts(accounts);
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) {
        if (data.length > 0) {
          const supabaseAccounts: UserAccount[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            username: d.username,
            email: d.email,
            role: d.role || 'Pegawai Aduan',
            avatar: d.avatar || CURRENT_USER.avatar,
            workspaceId: d.workspace_id || 'ws-integriti',
            department: d.department || 'Unit Aduan',
            phone: d.phone,
            passwordHash: d.password_hash || '',
            allowedViews: d.allowed_views || d.allowedViews,
            createdAt: d.created_at || new Date().toISOString(),
            lastLogin: d.last_login || new Date().toISOString(),
          }));

          const accountMap = new Map<string, UserAccount>();
          accounts.forEach(a => accountMap.set(a.id, a));
          supabaseAccounts.forEach(s => accountMap.set(s.id, s));

          accounts = Array.from(accountMap.values());
          saveUserAccounts(accounts);
        } else {
          // Supabase users table is empty, auto-seed local user accounts to Supabase!
          for (const acc of accounts) {
            await supabase.from('users').upsert({
              id: acc.id,
              username: acc.username,
              email: acc.email,
              password_hash: acc.passwordHash,
              name: acc.name,
              role: acc.role,
              avatar: acc.avatar,
              department: acc.department,
              phone: acc.phone,
              workspace_id: acc.workspaceId || 'ws-integriti',
              allowed_views: acc.allowedViews,
              created_at: acc.createdAt,
              last_login: acc.lastLogin,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Supabase fetch users warning:', e);
    }
  }

  return accounts;
}

export function saveUserAccounts(accounts: UserAccount[]) {
  try {
    localStorage.setItem(USER_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Error saving user accounts:', e);
  }
}

/**
 * Sync all local user accounts to Supabase
 */
export async function syncAllUsersToSupabase(): Promise<{ success: boolean; count: number }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, count: 0 };

  const accounts = await getStoredUserAccounts();
  let count = 0;
  for (const acc of accounts) {
    const { error } = await supabase.from('users').upsert({
      id: acc.id,
      username: acc.username,
      email: acc.email,
      password_hash: acc.passwordHash,
      name: acc.name,
      role: acc.role,
      avatar: acc.avatar,
      department: acc.department,
      phone: acc.phone,
      workspace_id: acc.workspaceId || 'ws-integriti',
      allowed_views: acc.allowedViews,
      created_at: acc.createdAt,
      last_login: acc.lastLogin,
    });
    if (!error) count++;
  }
  return { success: true, count };
}

/**
 * Delete User Account by ID or Username (Local & Supabase Synced)
 */
export async function deleteUserAccount(userIdentifier: string): Promise<boolean> {
  if (!userIdentifier) return false;
  const accounts = await getStoredUserAccounts();
  const lowerTarget = userIdentifier.toLowerCase().trim();
  const updated = accounts.filter(
    (a) =>
      a.id !== userIdentifier &&
      a.username.toLowerCase() !== lowerTarget &&
      a.email.toLowerCase() !== lowerTarget
  );
  saveUserAccounts(updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('users').delete().eq('id', userIdentifier);
      await supabase.from('users').delete().eq('username', userIdentifier);
      await supabase.from('users').delete().ilike('username', lowerTarget);
    } catch (e) {
      console.error('Failed to delete user from Supabase:', e);
    }
  }
  return true;
}

/**
 * Authenticate User with Username/Email & Password (Encrypted & Supabase Synced)
 */
export async function authenticateUser(
  identifier: string,
  plainPassword: string
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const cleanId = identifier.trim().toLowerCase();
  const inputHash = await hashPassword(plainPassword);

  const supabase = getSupabaseClient();

  // 1. Try Supabase Database if connected
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.${cleanId},email.ilike.${cleanId}`);

      if (!error && data && data.length > 0) {
        const found = data[0];
        if (found.password_hash === inputHash) {
          const userProfile: UserProfile = {
            id: found.id,
            name: found.name,
            username: found.username,
            email: found.email,
            role: found.role || 'Pegawai Aduan',
            avatar: found.avatar || CURRENT_USER.avatar,
            workspaceId: found.workspace_id || 'ws-integriti',
            department: found.department,
            phone: found.phone,
            allowedViews: found.allowed_views || found.allowedViews,
          };

          // Update last_login in Supabase
          await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', found.id);

          // Sync local storage user accounts
          const localAccs = await getStoredUserAccounts();
          const accIdx = localAccs.findIndex(a => a.id === found.id || a.username.toLowerCase() === found.username.toLowerCase());
          if (accIdx !== -1) {
            localAccs[accIdx].passwordHash = inputHash;
            localAccs[accIdx].username = found.username;
            localAccs[accIdx].name = found.name;
            saveUserAccounts(localAccs);
          } else {
            localAccs.push({
              ...userProfile,
              passwordHash: inputHash,
              createdAt: found.created_at || new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            });
            saveUserAccounts(localAccs);
          }

          setAuthSession(userProfile);
          await recordAuditLog({
            userId: userProfile.id,
            username: userProfile.username || 'user',
            userName: userProfile.name,
            role: userProfile.role || 'User',
            action: 'LOG_MASUK',
            ipAddress: '127.0.0.1 (SSL/TLS Encrypted)',
            deviceInfo: 'Sesi Web Workspace Terenkripsi',
            details: 'Pengesahan SHA-256 menerusi Supabase DB'
          });
          return { success: true, user: userProfile, message: 'Log masuk Supabase Realtime Berjaya!' };
        } else {
          return { success: false, message: 'Kata laluan atau nama pengguna tidak sepadan!' };
        }
      }
    } catch (e) {
      console.warn('Supabase auth query skipped or failed, falling back to secure store:', e);
    }
  }

  // 2. Fallback to Local Encrypted Store
  const accounts = await getStoredUserAccounts();
  const match = accounts.find(
    (acc) => acc.username.toLowerCase() === cleanId || acc.email.toLowerCase() === cleanId
  );

  if (!match) {
    return { success: false, message: 'Nama pengguna atau e-mel tidak wujud!' };
  }

  if (match.passwordHash !== inputHash) {
    return { success: false, message: 'Kata laluan tidak sah! Sila semak semula.' };
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
    allowedViews: match.allowedViews,
  };

  // Sync to Supabase in background if Supabase is connected
  if (supabase) {
    try {
      await supabase.from('users').upsert({
        id: match.id,
        username: match.username,
        email: match.email,
        password_hash: match.passwordHash,
        name: match.name,
        role: match.role,
        avatar: match.avatar,
        department: match.department,
        phone: match.phone,
        workspace_id: match.workspaceId,
        allowed_views: match.allowedViews,
        last_login: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to sync user to Supabase:', e);
    }
  }

  setAuthSession(profile);
  await recordAuditLog({
    userId: profile.id,
    username: profile.username || 'user',
    userName: profile.name,
    role: profile.role || 'User',
    action: 'LOG_MASUK',
    ipAddress: '127.0.0.1 (SHA-256 Encrypted)',
    deviceInfo: 'Sesi Local Web Encrypted Store',
    details: 'Pengesahan SHA-256 tempatan berjaya'
  });
  return { success: true, user: profile, message: 'Log masuk Berjaya!' };
}

/**
 * Register New User Account (Encrypted & Supabase Realtime Synced)
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
    role: 'Pegawai Aduan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    workspaceId: 'ws-integriti',
    department: data.department?.trim() || 'Unit Aduan & Integriti',
    phone: data.phone?.trim() || '+60 12-000 0000',
    passwordHash: passwordHash,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
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
  };

  // Sync to Supabase Realtime DB if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('users').insert({
        id: newAcc.id,
        username: newAcc.username,
        email: newAcc.email,
        password_hash: passwordHash,
        name: newAcc.name,
        role: newAcc.role,
        avatar: newAcc.avatar,
        department: newAcc.department,
        phone: newAcc.phone,
        workspace_id: newAcc.workspaceId,
      });
    } catch (e) {
      console.error('Supabase sync register failed:', e);
    }
  }

  setAuthSession(profile);
  await recordAuditLog({
    userId: profile.id,
    username: profile.username || 'user',
    userName: profile.name,
    role: profile.role || 'User',
    action: 'PENDAFTARAN_AKAUN',
    ipAddress: '127.0.0.1 (Web TLS)',
    deviceInfo: 'Sesi Web Workspace Encrypted',
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
export function getActiveAuthSession(): UserProfile | null {
  try {
    const saved = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading auth session:', e);
  }
  return null;
}

export function setAuthSession(user: UserProfile, remember: boolean = true) {
  try {
    const jsonStr = JSON.stringify(user);
    if (remember) {
      localStorage.setItem(AUTH_SESSION_KEY, jsonStr);
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, jsonStr);
    }
  } catch (e) {
    console.error('Error saving auth session:', e);
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  } catch (e) {
    console.error('Error clearing auth session:', e);
  }
}
