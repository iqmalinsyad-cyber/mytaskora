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
  AtSign, 
  ArrowRight, 
  UserPlus, 
  LogIn, 
  X, 
  HelpCircle, 
  Globe,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { authenticateUser, registerNewUser } from '../lib/auth';
import { UserProfile } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { SystemLogo } from './SystemLogo';

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
        setSuccessMessage('Log masuk berjaya!');
        setFailedAttempts(0);
        // Instant response - no artificial delay
        onLoginSuccess(res.user);
        onClose();
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
        setSuccessMessage('Pendaftaran akaun baharu berjaya!');
        onLoginSuccess(res.user);
        onClose();
      } else {
        setErrorMessage(res.message || 'Pendaftaran akaun gagal.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Ralat semasa mendaftar akaun.');
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-[100] bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-950 flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-y-auto animate-fade-in">
      
      {/* Decorative Geometric Shapes matching the image */}
      {/* Top Left Floating Cyan Triangle */}
      <div className="absolute top-8 left-8 w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[32px] border-b-cyan-400 rotate-12 opacity-90 hidden sm:block"></div>
      
      {/* Top Left Dotted Matrix */}
      <div className="absolute top-12 left-12 grid grid-cols-6 gap-2 opacity-30 pointer-events-none hidden md:grid">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white"></div>
        ))}
      </div>

      {/* Top Right Glowing White Circle */}
      <div className="absolute top-16 right-24 w-12 h-12 rounded-full bg-white/20 blur-sm pointer-events-none"></div>

      {/* Bottom Left Huge Translucent Purple Circle Glow */}
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none"></div>

      {/* Bottom Center Dotted Rotated Square */}
      <div className="absolute bottom-12 left-1/3 w-10 h-10 border-2 border-dashed border-cyan-300/60 rotate-45 pointer-events-none hidden sm:block"></div>

      {/* Bottom Right Glowing White Spot */}
      <div className="absolute bottom-8 right-8 w-8 h-8 rounded-full bg-white pointer-events-none"></div>

      {/* Bottom Right Dotted Matrix */}
      <div className="absolute bottom-12 right-12 grid grid-cols-8 gap-2 opacity-25 pointer-events-none hidden md:grid">
        {Array.from({ length: 32 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white"></div>
        ))}
      </div>

      {/* MAIN WHITE CARD CONTAINER */}
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl border border-purple-100/40 overflow-hidden relative my-auto p-5 sm:p-8 flex flex-col justify-between max-h-[92vh] sm:max-h-none overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors z-20"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. CARD TOP NAVIGATION / BRANDING HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 pr-10 sm:pr-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <SystemLogo size={32} />
            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 font-sans">TASKORA</span>
                <span className="text-base sm:text-xl font-black text-indigo-600 tracking-tight">WORKSPACE</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide w-max">
                Versi 1.0
              </span>
            </div>
          </div>
        </div>

        {/* 2. CARD MAIN BODY (LOGIN & REGISTER FORM ONLY) */}
        <div className="py-4 sm:py-6">
          
          <div className="space-y-4 sm:space-y-5">
            
            {/* Segmented Tab Switcher - ALWAYS VISIBLE ON ALL SCREENS */}
            <div className="flex bg-slate-100 p-1 rounded-xl font-semibold text-xs text-slate-600">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'login' 
                    ? 'bg-white text-indigo-600 shadow-xs font-bold' 
                    : 'hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Log Masuk</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'register' 
                    ? 'bg-white text-indigo-600 shadow-xs font-bold' 
                    : 'hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Daftar Akaun</span>
              </button>
            </div>

            {/* Title Row */}
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                {mode === 'login' ? 'Log Masuk Akaun Anda' : 'Daftar Akaun Baharu'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {mode === 'login' ? 'Sila masukkan butiran log masuk anda' : 'Lengkapkan profil maklumat anda di bawah'}
              </p>
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* MODE 1: LOG MASUK FORM */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Username / E-mel <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isLockedOut}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Contoh: admin.hulu atau email@domain.gov.my"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                  />
                </div>

                <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kata Laluan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={isLockedOut}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata laluan"
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Extra Row: Forgot password & Log in button */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setErrorMessage('Sila hubungi Pentadbir Sistem untuk bantuan kata laluan.')}
                    className="text-[11px] text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                  >
                    Lupa kata laluan?
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || isLockedOut}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span>Memproses...</span>
                    ) : isLockedOut ? (
                      <span>Disekat ({lockoutTimer}s)</span>
                    ) : (
                      <>
                        <span>Log Masuk</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* REGISTER TOGGLE BUTTON BELOW LOGIN FORM */}
                <div className="pt-3 border-t border-slate-100 flex flex-col items-center justify-center gap-2 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/80">
                  <span className="text-xs text-slate-600 font-medium">
                    Belum mempunyai akaun pengguna?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="w-full py-2.5 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    <span>Daftar Akaun Baharu Sekarang</span>
                  </button>
                </div>

                {/* Encryption Status Tag */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Enkripsi SHA-256 Terjamin</span>
                  </div>
                  {onOpenSupabaseModal && (
                    <button
                      type="button"
                      onClick={onOpenSupabaseModal}
                      className="text-indigo-600 hover:underline font-bold"
                    >
                      Firebase Sync
                    </button>
                  )}
                </div>

              </form>
            ) : (
              /* MODE 2: REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Penuh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Ahmad Razak"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="username"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      E-mel <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nama@domain.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kata Laluan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Kata Laluan (min 6 aksara)"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? <span>Daftar Akaun...</span> : <span>Cipta Akaun Baharu</span>}
                </button>

                {/* LOGIN TOGGLE BUTTON BELOW REGISTER FORM */}
                <div className="pt-3 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-600 font-medium">
                    Sudah mempunyai akaun?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="font-bold text-indigo-600 hover:text-indigo-800 underline ml-1 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Log Masuk Sekarang
                    </button>
                  </p>
                </div>
              </form>
            )}

          </div>

        </div>

        {/* 3. CARD BOTTOM FOOTER */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            &copy; 2026 Aidee Creatives. Hak Cipta Terpelihara.
          </div>

          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <button type="button" onClick={() => alert('Sistem TASKORA WORKSPACE - Terma & Syarat Penggunaan Hak Cipta 2026.')} className="hover:text-indigo-600 transition-colors">
              Term & Condition
            </button>
            <button type="button" onClick={() => alert('Dasar Privasi - Data dienkripsi SHA-256.')} className="hover:text-indigo-600 transition-colors">
              Privacy Policy
            </button>
            <button type="button" onClick={() => alert('Pusat Bantuan - Sila hubungi urusetia jika perlukan bantuan akses.')} className="hover:text-indigo-600 transition-colors">
              Help
            </button>
          </div>

          {/* Indicator Dots matching the reference bottom right corner */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
          </div>
        </div>

      </div>
    </div>
  );
};
