import React, { useState, useRef } from 'react';
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
  Image as ImageIcon
} from 'lucide-react';
import { UserProfile, Workspace } from '../types';
import { hashPassword, getStoredUserAccounts, saveUserAccounts } from '../lib/auth';
import { getSupabaseClient } from '../lib/supabase';

interface SettingsViewProps {
  currentUser: UserProfile;
  onUpdateUserProfile: (updatedProfile: UserProfile) => void;
  currentWorkspace: Workspace;
  onUpdateWorkspace?: (updatedWs: Workspace) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onUpdateUserProfile,
  currentWorkspace,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'password' | 'workspace' | 'notifications'>('profile');

  // Form states initialized with currentUser props
  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || 'sarah_adams');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '+60 12-345 6789');
  const [department, setDepartment] = useState(currentUser.department || 'Jabatan Integriti & Tatatertib');
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

  // Feedback & Status
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSaveProfile = (e: React.FormEvent) => {
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
      phone: phone.trim(),
      department: department.trim(),
      avatar: avatar,
    };

    onUpdateUserProfile(updated);
    setSuccessMessage('Maklumat profil pengguna (Nama, Username & Avatar) berjaya dikemaskini!');
    setTimeout(() => setSuccessMessage(null), 4000);
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
    const userAcc = accounts.find(a => a.id === currentUser.id || a.username === currentUser.username);

    if (userAcc && userAcc.passwordHash !== currentHash) {
      setErrorMessage('Kata laluan semasa tidak tepat!');
      return;
    }

    if (userAcc) {
      userAcc.passwordHash = newHash;
      saveUserAccounts(accounts);
    }

    // Sync to Supabase if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('users')
          .update({ password_hash: newHash })
          .eq('id', currentUser.id);
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
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
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
          { id: 'notifications', label: 'Preferensi Notifikasi', icon: Bell },
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
                <span>Pilih Avatar Preset:</span>
                <span className="text-[10px] text-slate-400">8 Pilihan</span>
              </label>

              <div className="grid grid-cols-4 gap-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(url)}
                    className={`rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                      avatar === url ? 'border-indigo-600 ring-2 ring-indigo-500/20 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx}`} className="w-full h-10 object-cover rounded-lg" />
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
                    placeholder="https://images.unsplash.com/..."
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
                <p className="text-xs text-slate-400">Sila pastikan maklumat terkini tepat untuk rekod siasatan kes</p>
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
                    <span>Nama Penuh User *</span>
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
                    <span>Alamat Emel Rasmi *</span>
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

                {/* Telefon */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Nombor Telefon</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+60 12-345 6789"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Jabatan / Unit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Bahagian / Jabatan</span>
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Jabatan Integriti & Tatatertib"
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
            <span>Preferensi Notifikasi Aduan</span>
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
    </div>
  );
};
