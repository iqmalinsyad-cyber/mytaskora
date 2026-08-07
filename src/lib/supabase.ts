import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY = 'aduan_workspace_supabase_config';

let supabaseInstance: SupabaseClient | null = null;

export async function fetchServerSupabaseConfig(): Promise<SupabaseConfig | null> {
  try {
    const response = await fetch('/api/supabase-config');
    if (response.ok) {
      const data = await response.json();
      if (data.url && data.anonKey) {
        const config: SupabaseConfig = {
          url: data.url,
          anonKey: data.anonKey,
          isConnected: true,
          lastConnectedAt: new Date().toISOString(),
        };
        saveSupabaseConfig(config, false); // save locally without loops
        return config;
      }
    }
  } catch (e) {
    console.warn('Could not fetch Supabase config from server:', e);
  }
  return null;
}

export function getSavedSupabaseConfig(): SupabaseConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading Supabase config from localStorage:', e);
  }

  // Fallback to Vite environment variables if available
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (envUrl && envKey) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConnected: true,
      lastConnectedAt: new Date().toISOString(),
    };
  }

  return {
    url: '',
    anonKey: '',
    isConnected: false,
  };
}

export function saveSupabaseConfig(config: SupabaseConfig, syncToServer = true): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    supabaseInstance = null; // Reset cached client instance so next call uses updated credentials

    if (syncToServer) {
      fetch('/api/supabase-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: config.url, anonKey: config.anonKey }),
      }).catch((err) => console.error('Failed to sync Supabase config to server:', err));
    }
  } catch (e) {
    console.error('Error saving Supabase config:', e);
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }
  
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  
  return supabaseInstance;
}

export function testSupabaseConnection(url: string, anonKey: string): Promise<boolean> {
  return new Promise(async (resolve) => {
    try {
      if (!url.startsWith('https://') || !anonKey) {
        resolve(false);
        return;
      }
      const testClient = createClient(url, anonKey);
      const { error } = await testClient.from('aduan').select('count', { count: 'exact', head: true });
      // If error status is 404/PGRST204 table missing or success, connection works!
      if (!error || error.code === 'PGRST204' || error.message.includes('relation "public.aduan" does not exist')) {
        resolve(true);
      } else {
        console.warn('Supabase test connection response error:', error);
        // If error is invalid API key or bad URL
        if (error.message.includes('Invalid API key') || error.message.includes('FetchError')) {
          resolve(false);
        } else {
          // Connected to DB even if table not created yet
          resolve(true);
        }
      }
    } catch (e) {
      console.error('Supabase test connection threw error:', e);
      resolve(false);
    }
  });
}

export const SUPABASE_SQL_SCHEMA = `-- ===================================================
-- SKRIP SUMBER DATABASE SUPABASE UNTUK ADUAN WORKSPACE
-- Salin dan tampal di SQL Editor projek Supabase anda.
-- ===================================================

-- 1. Cipta Jadual Workspace
CREATE TABLE IF NOT EXISTS public.workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  members_count INT DEFAULT 1,
  role TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Cipta Jadual Aduan Cases
CREATE TABLE IF NOT EXISTS public.aduan (
  id TEXT PRIMARY KEY,
  no_rujukan TEXT UNIQUE NOT NULL,
  workspace_id TEXT NOT NULL,
  tajuk TEXT NOT NULL,
  penerangan TEXT NOT NULL,
  kategori TEXT NOT NULL,
  prioriti TEXT NOT NULL,
  status TEXT NOT NULL,
  nama_pengadu TEXT NOT NULL,
  email_pengadu TEXT NOT NULL,
  telefon_pengadu TEXT,
  lokasi TEXT,
  assignee TEXT NOT NULL,
  tarikh_aduan TIMESTAMPTZ DEFAULT NOW(),
  sasaran_sla TIMESTAMPTZ,
  tarikh_selesai TIMESTAMPTZ,
  csat_rating INT,
  tags TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Cipta Jadual Catatan & Minit Aduan
CREATE TABLE IF NOT EXISTS public.catatan_aduan (
  id TEXT PRIMARY KEY,
  aduan_id TEXT REFERENCES public.aduan(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  author_avatar TEXT,
  format_type TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Cipta Jadual Users & Pengesahan Log Masuk
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Pegawai Aduan',
  avatar TEXT,
  department TEXT,
  phone TEXT,
  workspace_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Cipta Jadual Audit Logs (Rekod Log Masuk/Keluar)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  user_name TEXT NOT NULL,
  role TEXT,
  action TEXT NOT NULL,
  ip_address TEXT,
  device_info TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details TEXT
);

-- 6. Cipta Jadual Linkhub (Simpan Rekod Pautan & Rujukan)
CREATE TABLE IF NOT EXISTS public.link_hub (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT 'Sistem Kerajaan',
  description TEXT,
  icon TEXT DEFAULT 'Globe',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  click_count INT DEFAULT 0
);

-- 7. Aktifkan Realtime pada jadual aduan, catatan, users, audit_logs & link_hub
ALTER PUBLICATION supabase_realtime ADD TABLE public.aduan;
ALTER PUBLICATION supabase_realtime ADD TABLE public.catatan_aduan;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.link_hub;

-- Enable Row Level Security (RLS)
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aduan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catatan_aduan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_hub ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.workspaces FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update access" ON public.workspaces FOR ALL USING (true);

CREATE POLICY "Allow public read access" ON public.aduan FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update access" ON public.aduan FOR ALL USING (true);

CREATE POLICY "Allow public read access" ON public.catatan_aduan FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update access" ON public.catatan_aduan FOR ALL USING (true);

CREATE POLICY "Allow public read access" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update access" ON public.users FOR ALL USING (true);

CREATE POLICY "Allow public read access" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update access" ON public.audit_logs FOR ALL USING (true);

CREATE POLICY "Allow public read access" ON public.link_hub FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update access" ON public.link_hub FOR ALL USING (true);
`;
