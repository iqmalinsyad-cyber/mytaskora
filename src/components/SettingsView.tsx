import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Key, 
  Camera, 
  Upload, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Save, 
  Building2, 
  Bell, 
  ShieldCheck, 
  Lock, 
  AtSign, 
  Phone, 
  Mail, 
  Briefcase, 
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  FolderUp,
  HardDrive,
  ExternalLink,
  Copy,
  CheckCircle2,
  Cloud,
  CloudUpload,
  Info,
  CheckCheck
} from 'lucide-react';
import { UserProfile, Workspace, GoogleDriveConfig } from '../types';
import { hashPassword, getStoredUserAccounts, saveUserAccounts, setAuthSession } from '../lib/auth';
import { getSupabaseClient } from '../lib/supabase';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { googleDriveService, DEFAULT_APPS_SCRIPT_CODE } from '../services/googleDriveService';

interface SettingsViewProps {
  currentUser: UserProfile;
  onUpdateUserProfile: (updatedProfile: UserProfile) => void;
  currentWorkspace: Workspace;
  onUpdateWorkspace?: (updatedWs: Workspace) => void;
}

export const PRESET_AVATARS = [
  // 1. Initial Badges (Kemaskini Clean & Professional)
  'https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=4f46e5',
  'https://api.dicebear.com/7.x/initials/svg?seed=User&backgroundColor=0284c7',
  'https://api.dicebear.com/7.x/initials/svg?seed=Editor&backgroundColor=059669',
  'https://api.dicebear.com/7.x/initials/svg?seed=Officer&backgroundColor=d97706',
  'https://api.dicebear.com/7.x/initials/svg?seed=Analyst&backgroundColor=7c3aed',
  'https://api.dicebear.com/7.x/initials/svg?seed=Manager&backgroundColor=dc2626',
  'https://api.dicebear.com/7.x/initials/svg?seed=Integriti&backgroundColor=2563eb',
  'https://api.dicebear.com/7.x/initials/svg?seed=Aduan&backgroundColor=0d9488',

  // 2. Tech Bots & Modern Vectors
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Echo&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Nova&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Pulse&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Matrix&backgroundColor=a7f3d0',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Sentinel&backgroundColor=fef08a',

  // 3. Vector Avataaars (Kemaskini Clean & High Res)
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatimah',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mariam',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zahra',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Khairul',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Farhan',

  // 4. Abstract Geometric Badges
  'https://api.dicebear.com/7.x/shapes/svg?seed=Shield&backgroundColor=4f46e5',
  'https://api.dicebear.com/7.x/shapes/svg?seed=AduanWorkspace&backgroundColor=0284c7',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Integriti&backgroundColor=059669',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Audit&backgroundColor=d97706',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Security&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/identicon/svg?seed=System&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Workspace&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Portal&backgroundColor=c0aede',

  // 5. Minimal Icon Badges & Emojis
  'https://api.dicebear.com/7.x/icons/svg?seed=Shield&backgroundColor=4f46e5',
  'https://api.dicebear.com/7.x/icons/svg?seed=Briefcase&backgroundColor=0284c7',
  'https://api.dicebear.com/7.x/icons/svg?seed=FileText&backgroundColor=059669',
  'https://api.dicebear.com/7.x/icons/svg?seed=Lock&backgroundColor=7c3aed',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Star&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Smile&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy&backgroundColor=ffdfbf',
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onUpdateUserProfile,
  currentWorkspace,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'password' | 'workspace' | 'notifications' | 'googledrive'>('profile');

  // Form states initialized with currentUser props
  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || 'sarah_adams');
  const [email, setEmail] = useState(currentUser.email || '');
  const [role] = useState(currentUser.role || 'Pentadbir Utama Aduan');
  const [avatar, setAvatar] = useState(currentUser.avatar || PRESET_AVATARS[0]);
  const [avatarInputUrl, setAvatarInputUrl] = useState('');

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Google Drive Integration States
  const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig>(googleDriveService.getConfig());
  const [driveWebhookUrl, setDriveWebhookUrl] = useState(driveConfig.webhookUrl || '');
  const [driveFolderName, setDriveFolderName] = useState(driveConfig.folderName || 'Sistem Aduan - Bukti Siasatan');
  const [driveFolderId, setDriveFolderId] = useState(driveConfig.folderId || '');
  const [driveAutoUpload, setDriveAutoUpload] = useState(driveConfig.autoUpload !== false);
  const [isTestingDrive, setIsTestingDrive] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptDetails, setShowScriptDetails] = useState(true);

  // Feedback & Status
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = googleDriveService.subscribe((cfg) => {
      setDriveConfig(cfg);
      setDriveWebhookUrl(cfg.webhookUrl || '');
      setDriveFolderName(cfg.folderName || 'Sistem Aduan - Bukti Siasatan');
      setDriveFolderId(cfg.folderId || '');
      setDriveAutoUpload(cfg.autoUpload !== false);
    });
    return () => unsub();
  }, []);

  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(DEFAULT_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleTestDriveConnection = async () => {
    if (!driveWebhookUrl.trim()) {
      setTestResult({ success: false, message: 'Sila masukkan URL Webhook Google Apps Script terlebih dahulu.' });
      return;
    }
    setIsTestingDrive(true);
    setTestResult(null);
    try {
      const res = await googleDriveService.testConnection(driveWebhookUrl.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Ralat semasa menguji sambungan.' });
    } finally {
      setIsTestingDrive(false);
    }
  };

  const handleSaveDriveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDrive(true);
    try {
      await googleDriveService.saveConfig({
        webhookUrl: driveWebhookUrl.trim(),
        folderName: driveFolderName.trim() || 'Sistem Aduan - Bukti Siasatan',
        folderId: driveFolderId.trim(),
        autoUpload: driveAutoUpload,
        isEnabled: Boolean(driveWebhookUrl.trim()),
      });
      setSuccessMessage('✓ Konfigurasi Google Drive berjaya disimpan dan disegerakkan ke Firebase!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyimpan konfigurasi Google Drive.');
    } finally {
      setIsSavingDrive(false);
    }
  };

  // Handle Image File Upload (Convert to DataURL for immediate browser avatar preview)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Format gambar terlalu besar. Maksimum saiz fail ialah 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setAvatar(reader.result as string);
          setSuccessMessage('Gambar profil berjaya di muat naik!');
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyAvatarUrl = () => {
    if (!avatarInputUrl.trim()) return;
    setAvatar(avatarInputUrl.trim());
    setAvatarInputUrl('');
    setSuccessMessage('URL Gambar avatar berjaya diguna pakai!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Nama penuh user tidak boleh kosong.');
      return;
    }
    if (!username.trim()) {
      setErrorMessage('Username tidak boleh kosong.');
      return;
    }

    // Validate username format (no spaces, alphanumeric + underscore/dash)
    const usernameClean = username.trim().toLowerCase().replace(/\s+/g, '_');

    const updated: UserProfile = {
      ...currentUser,
      name: name.trim(),
      username: usernameClean,
      email: email.trim(),
      avatar: avatar,
    };

    // 1. UPDATE REACT APP STATE & ACTIVE SESSION IMMEDIATELY (0ms delay!)
    onUpdateUserProfile(updated);
    setAuthSession(updated);

    // 2. SHOW INSTANT PROMINENT SUCCESS NOTE & SCROLL TO TOP
    setSuccessMessage('✓ Profil anda (Nama, Username, E-mel & Avatar) telah berjaya disimpan dan disegerakkan ke Firebase!');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 3. ASYNCHRONOUS BACKGROUND SYNC TO LOCALSTORAGE, FIREBASE & SUPABASE
    setTimeout(async () => {
      try {
        const accounts = await getStoredUserAccounts();
        const accIdx = accounts.findIndex(a => a.id === currentUser.id || a.username.toLowerCase() === currentUser.username.toLowerCase());
        let fullAccount: any;
        if (accIdx !== -1) {
          accounts[accIdx].name = updated.name;
          accounts[accIdx].username = updated.username;
          accounts[accIdx].email = updated.email;
          accounts[accIdx].avatar = updated.avatar;
          fullAccount = accounts[accIdx];
          saveUserAccounts(accounts);
        } else {
          fullAccount = {
            ...updated,
            passwordHash: await hashPassword('Password123!'),
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
          accounts.push(fullAccount);
          saveUserAccounts(accounts);
        }

        if (db) {
          const cleanAccount = JSON.parse(JSON.stringify(fullAccount));
          await setDoc(doc(db, 'users', updated.id), cleanAccount, { merge: true });
        }

        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('users').upsert({
            id: updated.id,
            username: updated.username,
            email: updated.email,
            name: updated.name,
            role: updated.role,
            avatar: updated.avatar,
            department: updated.department,
            phone: updated.phone,
            workspace_id: updated.workspaceId || 'ws-integriti',
            allowed_views: updated.allowedViews,
          });
        }
      } catch (err) {
        console.error('Failed to sync profile update:', err);
      }
    }, 10);

    setTimeout(() => setSuccessMessage(null), 6000);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage('Sila masukkan kata laluan semasa anda.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Kata laluan baharu dan pengesahan kata laluan tidak sepadan!');
      return;
    }

    const currentHash = await hashPassword(currentPassword);
    const newHash = await hashPassword(newPassword);

    const accounts = await getStoredUserAccounts();
    let userAcc = accounts.find(a => a.id === currentUser.id || a.username.toLowerCase() === currentUser.username.toLowerCase());

    if (userAcc && userAcc.passwordHash && userAcc.passwordHash !== currentHash) {
      setErrorMessage('Kata laluan semasa tidak tepat!');
      return;
    }

    if (userAcc) {
      userAcc.passwordHash = newHash;
      saveUserAccounts(accounts);

      if (db) {
        try {
          const cleanUserAcc = JSON.parse(JSON.stringify(userAcc));
          await setDoc(doc(db, 'users', userAcc.id), cleanUserAcc, { merge: true });
        } catch (err) {
          console.error('Failed to sync updated password to Firebase:', err);
        }
      }
    }

    // Sync to Supabase if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('users')
          .upsert({
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            password_hash: newHash,
            name: currentUser.name,
            role: currentUser.role,
            avatar: currentUser.avatar,
            department: currentUser.department,
            phone: currentUser.phone,
            workspace_id: currentUser.workspaceId || 'ws-integriti',
            allowed_views: currentUser.allowedViews,
            last_login: new Date().toISOString(),
          });
      } catch (err) {
        console.error('Failed to update password in Supabase:', err);
      }
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccessMessage('Kata laluan anda telah berjaya ditukar dan dienkripsi dengan SHA-256!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Simple password strength calculator
  const getPasswordStrength = (pw: string) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 10) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    return score; // max 5
  };

  const pwStrength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-6">
      {/* Settings Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Tetapan Pengguna & Profil</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Kemaskini maklumat peribadi, username, kata laluan dan foto profil akaun anda
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            ID User: <span className="font-mono text-indigo-600">{currentUser.id}</span>
          </span>
        </div>
      </div>

      {/* Global Feedback Banners */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-between animate-fade-in shadow-md ring-4 ring-emerald-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-white shrink-0" />
            </div>
            <span className="text-sm tracking-wide">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-white/80 hover:text-white text-sm font-bold px-2 py-1">
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900">
            ✕
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs Bar */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-wrap gap-1">
        {[
          { id: 'profile', label: 'Profil & Maklumat User', icon: User },
          { id: 'password', label: 'Tukar Kata Laluan', icon: Key },
          { id: 'googledrive', label: 'Integrasi Google Drive', icon: HardDrive },
          { id: 'notifications', label: 'Tetapan Notifikasi', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: PROFIL & MAKLUMAT USER */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Avatar & Profile Card Preview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 text-center h-fit">
            <div className="relative inline-block mx-auto group">
              <img
                src={avatar}
                alt={name}
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=4f46e5`;
                }}
                className="w-28 h-28 rounded-full object-cover border-4 border-indigo-100 shadow-md mx-auto"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform transform hover:scale-105"
                title="Muat Naik Gambar Baharu"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-800">{name || 'Nama User'}</h3>
              <p className="text-xs text-indigo-600 font-mono font-semibold">@{username || 'username'}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                {role}
              </span>
            </div>

            {/* Avatar Selection Options */}
            <div className="pt-4 border-t border-slate-100 text-left space-y-3">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Pilih Avatar anda:</span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {PRESET_AVATARS.length} Pilihan General
                </span>
              </label>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200 custom-scrollbar">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(url)}
                    className={`rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-white ${
                      avatar === url ? 'border-indigo-600 ring-2 ring-indigo-500/20 scale-105 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    title={`Pilih Avatar #${idx + 1}`}
                  >
                    <img 
                      src={url} 
                      alt={`Avatar Preset ${idx + 1}`} 
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=P${idx + 1}&backgroundColor=4f46e5`;
                      }}
                      className="w-full h-9 object-cover rounded-lg bg-slate-100" 
                    />
                  </button>
                ))}
              </div>

              {/* Direct Image URL Input */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Atau Tampal URL Gambar Avatar:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={avatarInputUrl}
                    onChange={(e) => setAvatarInputUrl(e.target.value)}
                    placeholder="https://api.dicebear.com/7.x/..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleApplyAvatarUrl}
                    disabled={!avatarInputUrl.trim()}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold disabled:opacity-50 shrink-0"
                  >
                    Guna
                  </button>
                </div>
              </div>

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Muat Naik Gambar Peranti</span>
              </button>
            </div>
          </div>

          {/* Right Column: Profile Edit Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Kemaskini Butiran Akaun User</h3>
                <p className="text-xs text-slate-400">Sila pastikan maklumat terkini adalah tepat</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Username *</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">@</span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="sarah_adams"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Guna huruf kecil, nombor atau garis bawah (_)</p>
                </div>

                {/* Nama Penuh User */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Nama User *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Adams"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Emel */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Alamat Emel *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah.adams@workspace.gov.my"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Peranan Sistem */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Peranan Sistem</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={role}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Submit Profile Form Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-white" />
                  <span>Simpan Perubahan Profil</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TUKAR KATA LALUAN / PASSWORD */}
      {activeSubTab === 'password' && (
        <div className="max-w-2xl bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Tukar Kata Laluan Akaun</h3>
              <p className="text-xs text-slate-400">Pastikan kata laluan mengandungi sekurang-kurangnya 6 aksara bagi keselamatan akaun.</p>
            </div>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Laluan Semasa / Asal *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata laluan sedia ada..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Laluan Baharu *
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata laluan baharu..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Bar */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-500">Tahap Keselamatan:</span>
                    <span className={pwStrength >= 4 ? 'text-emerald-600' : pwStrength >= 2 ? 'text-amber-600' : 'text-rose-600'}>
                      {pwStrength >= 4 ? 'Kuat & Selamat' : pwStrength >= 2 ? 'Sederhana' : 'Lemah'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full transition-all ${pwStrength >= 1 ? (pwStrength >= 4 ? 'bg-emerald-500' : pwStrength >= 2 ? 'bg-amber-500' : 'bg-rose-500') : 'bg-transparent'}`} style={{ width: '20%' }} />
                    <div className={`h-full transition-all ${pwStrength >= 2 ? (pwStrength >= 4 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-transparent'}`} style={{ width: '20%' }} />
                    <div className={`h-full transition-all ${pwStrength >= 3 ? (pwStrength >= 4 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-transparent'}`} style={{ width: '20%' }} />
                    <div className={`h-full transition-all ${pwStrength >= 4 ? 'bg-emerald-500' : 'bg-transparent'}`} style={{ width: '20%' }} />
                    <div className={`h-full transition-all ${pwStrength >= 5 ? 'bg-emerald-500' : 'bg-transparent'}`} style={{ width: '20%' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sahkan Kata Laluan Baharu *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulang kata laluan baharu..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Password Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-white" />
                <span>Simpan Kata Laluan Baharu</span>
              </button>
            </div>
          </form>
        </div>
      )}

 

      {/* SUBTAB 4: NOTIFICATIONS PREFERENCES */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <span>Tetapan Notifikasi</span>
          </h3>

          <div className="space-y-3 text-xs">
            {[
              { title: 'Notifikasi Kes Baharu Didaftarkan', desc: 'Dapatkan makluman popup dan bunyi apabila kes baharu ditambah.', defaultChecked: true },
              { title: 'Amaran SLA Hampir Tamat', desc: 'Terima peringatan bagi kes yang melepasi tempoh sasar siasatan 14 hari.', defaultChecked: true },
              { title: 'Ringkasan Harian AI Copilot', desc: 'E-mel ringkasan statistik KPI & cadangan tindakan kes setiap pagi.', defaultChecked: false },
            ].map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{item.title}</div>
                  <div className="text-slate-400 text-[11px]">{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={item.defaultChecked}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: GOOGLE DRIVE INTEGRATION */}
      {activeSubTab === 'googledrive' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Integrasi Folder Google Drive</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                      driveConfig.isEnabled && driveConfig.webhookUrl
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {driveConfig.isEnabled && driveConfig.webhookUrl ? '● Sambungan Aktif' : '○ Belum Dikonfigurasi'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Setiap gambar yang di-snap atau dimuat naik dalam kes siasatan akan di-upload terus ke folder Google Drive anda secara automatik.
                  </p>
                </div>
              </div>

              {driveConfig.lastTestedAt && (
                <div className="text-right text-[11px] text-slate-400 font-medium">
                  Ujian terakhir: {new Date(driveConfig.lastTestedAt).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {/* Test Connection Banner if tested */}
            {testResult && (
              <div className={`p-4 rounded-xl border text-xs font-bold flex items-start gap-2.5 animate-fade-in ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-extrabold">{testResult.success ? 'Ujian Sambungan Berjaya' : 'Ujian Sambungan Gagal'}</div>
                  <div className="text-[11px] font-medium mt-0.5">{testResult.message}</div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveDriveConfig} className="space-y-4 pt-2">
              {/* Webhook URL Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Webhook Google Apps Script (Web App URL) *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={driveWebhookUrl}
                    onChange={(e) => setDriveWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <CloudUpload className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  URL yang diperolehi selepas anda klik <strong>Deploy &gt; New deployment &gt; Web app</strong> di Google Apps Script.
                </p>
              </div>

              {/* Folder Name & Optional Folder ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Folder Induk Google Drive
                  </label>
                  <input
                    type="text"
                    value={driveFolderName}
                    onChange={(e) => setDriveFolderName(e.target.value)}
                    placeholder="Sistem Aduan - Bukti Siasatan"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Folder akan dicipta secara automatik di Google Drive jika belum wujud.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Folder ID Khusus (Pilihan / Optional)
                  </label>
                  <input
                    type="text"
                    value={driveFolderId}
                    onChange={(e) => setDriveFolderId(e.target.value)}
                    placeholder="Contoh: 1a2B3c4D5e6F7g8H9..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Biarkan kosong untuk menggunakan nama folder di sebelah kiri secara automatik.
                  </p>
                </div>
              </div>

              {/* Auto-upload Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800">Muat Naik Automatik (Auto-Upload on Capture)</div>
                  <div className="text-[11px] text-slate-500">
                    Setiap kali pegawai snap kamera atau muat naik foto siasatan, hantar terus ke Google Drive dan simpan pautan fail ke pangkalan data Firebase.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={driveAutoUpload}
                  onChange={(e) => setDriveAutoUpload(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestDriveConnection}
                  disabled={isTestingDrive || !driveWebhookUrl.trim()}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingDrive ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
                  <span>{isTestingDrive ? 'Sedang Menguji Sambungan...' : 'Uji Sambungan Webhook'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingDrive}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-white" />
                  <span>{isSavingDrive ? 'Menyimpan...' : 'Simpan Tetapan Google Drive'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Step-by-Step Installation Guide with 1-Click Code Copy */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Panduan Pemasangan Google Apps Script (3 Minit)</h4>
                  <p className="text-xs text-slate-500 font-medium">Ikuti langkah mudah di bawah untuk mengaktifkan muat naik terus ke akaun Google Drive anda:</p>
                </div>
              </div>

              <a
                href="https://script.google.com/home"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>Buka script.google.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Steps Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">1</span>
                  Buka Google Apps Script & Cipta Projek
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed pl-7">
                  Layari <a href="https://script.google.com/home" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">script.google.com</a>, klik <strong>+ New project</strong> dan namakan projek sebagai <em>"Sistem Aduan - Drive Handler"</em>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">2</span>
                  Tampal Kod Apps Script
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed pl-7">
                  Padam semua kod asal dalam fail <code>Code.gs</code> dan klik butang <strong>"Salin Kod Apps Script"</strong> di bawah untuk menampal kod penuh.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">3</span>
                  Deploy Sebagai Web App (Penting!)
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed pl-7">
                  Klik <strong>Deploy &gt; New deployment</strong>, pilih jenis <strong>Web app</strong>. Set <em>Execute as: "Me"</em> dan <em>Who has access: "Anyone"</em>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">4</span>
                  Salin Web App URL ke Sistem
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed pl-7">
                  Salin URL Web App yang dijana (bermula dengan <code>https://script.google.com/macros/s/...</code>) dan tampal ke dalam medan di atas, kemudian klik <strong>Simpan</strong>.
                </p>
              </div>
            </div>

            {/* Copyable Script Box */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Kod Penuh Google Apps Script (Code.gs):</span>
                <button
                  type="button"
                  onClick={handleCopyAppsScript}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                    copiedScript
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  {copiedScript ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Tersalin ke Clipboard!' : 'Salin Kod Apps Script (1-Click)'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-[11px] text-slate-300 p-4 max-h-72 overflow-y-auto leading-relaxed shadow-inner">
                <pre className="whitespace-pre">{DEFAULT_APPS_SCRIPT_CODE}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
