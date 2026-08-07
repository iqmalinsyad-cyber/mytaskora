import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Key, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  AtSign, 
  Database,
  ArrowRight,
  ShieldAlert,
  UserPlus,
  LogIn,
  Check,
  Briefcase
} from 'lucide-react';
import { authenticateUser, registerNewUser } from '../lib/auth';
import { UserProfile } from '../types';
import { getSupabaseClient } from '../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  onOpenSupabaseModal?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenSupabaseModal,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Security & Throttling
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isSupabaseConnected = !!getSupabaseClient();

  useEffect(() => {
    let timer: any;
    if (isLockedOut && lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setIsLockedOut(false);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLockedOut, lockoutTimer]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isLockedOut) {
      setErrorMessage(`Akses disekat sementara demi keselamatan. Sila tunggu ${lockoutTimer} saat.`);
      return;
    }

    if (!identifier.trim() || !password) {
      setErrorMessage('Sila masukkan Username/E-mel dan Kata Laluan anda.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authenticateUser(identifier, password);
      setIsLoading(false);

      if (res.success && res.user) {
        setSuccessMessage('Log masuk berjaya! Menghubungkan sesi terenkripsi...');
        setFailedAttempts(0);
        setTimeout(() => {
          onLoginSuccess(res.user!);
          onClose();
        }, 800);
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (newAttempts >= 5) {
          setIsLockedOut(true);
          setLockoutTimer(30);
          setErrorMessage('Terlalu banyak cubaan gagal. Sistem keselamatan telah menyekat borang selama 30 saat.');
        } else {
          setErrorMessage(res.message || 'Log masuk gagal. Sila semak nama pengguna dan kata laluan anda.');
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage('Ralat sistem log masuk. Sila cuba lagi.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('Sila lengkapkan semua medan bertanda *');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Kata laluan mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await registerNewUser({
        name: regName,
        username: regUsername,
        email: regEmail,
        plainPassword: regPassword,
      });

      setIsLoading(false);

      if (res.success && res.user) {
        setSuccessMessage('Pendaftaran akaun baharu berjaya dikunci dengan SHA-256 Encryption!');
        setTimeout(() => {
          onLoginSuccess(res.user!);
          onClose();
        }, 1000);
      } else {
        setErrorMessage(res.message || 'Pendaftaran akaun gagal.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Ralat semasa mendaftar akaun.');
    }
  };

  const setDemoAccount = (u: string, p: string) => {
    setIdentifier(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 flex flex-col relative">
        
        {/* Security Shield Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600/90 text-white flex items-center justify-center font-bold shadow-lg ring-4 ring-indigo-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight">Log Masuk Selamat (SHA-256)</h3>
                <p className="text-[11px] text-indigo-200 font-medium flex items-center gap-1 mt-0.5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Password Encrypted & Protected</span>
                </p>
              </div>
            </div>

            {/* Supabase Status Tag */}
            <button
              onClick={onOpenSupabaseModal}
              title="Status Supabase Realtime"
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                isSupabaseConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{isSupabaseConnected ? 'Supabase Realtime' : 'Local Sandbox'}</span>
            </button>
          </div>

          {/* High Security Guarantee Tag */}
          <div className="mt-4 p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Kata laluan dienkripsi menggunakan Web Crypto API. Tiada kata laluan teks biasa terdedah.</span>
          </div>
        </div>

        {/* Tab Toggle: Log Masuk vs Daftar */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Log Masuk Akaun</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Daftar Akaun Baharu</span>
          </button>
        </div>

        {/* Messages */}
        <div className="p-6 pb-2 space-y-3">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* FORM 1: LOG MASUK */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="p-6 pt-2 space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <AtSign className="w-3.5 h-3.5 text-indigo-600" />
                <span>Username atau Alamat E-mel *</span>
              </label>
              <input
                type="text"
                required
                disabled={isLockedOut}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Contoh: sarah_adams atau email@domain.gov.my"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Kata Laluan *</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  🔒 Encrypted SHA-256
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLockedOut}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata laluan..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span>Kekalkan Sesi Terenkripsi</span>
              </label>

              <span className="text-[11px] text-slate-400 font-semibold">
                Cubaan Gagal: <span className={failedAttempts > 0 ? 'text-rose-600 font-bold' : ''}>{failedAttempts}/5</span>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isLockedOut}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>Menyalurkan Akses Terenkripsi...</span>
              ) : isLockedOut ? (
                <span>Disekat ({lockoutTimer}s)</span>
              ) : (
                <>
                  <span>Log Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* FORM 2: DAFTAR AKAUN BAHARU */
          <form onSubmit={handleRegisterSubmit} className="p-6 pt-2 space-y-3.5 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama *</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Contoh: Ahmad Razak"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="ahmad_razak"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat E-mel *</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ahmad@gov.my"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kata Laluan *</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Sekurang-kurangnya 6 aksara..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>Mencipta Akaun Terenkripsi...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Akaun Baharu</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
          Aplikasi Aduan Workspace &copy; 2026. Hak Cipta Terpelihara. Encrypted Security Protocol v2.4
        </div>
      </div>
    </div>
  );
};
