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

  // Cloudflare Turnstile state
  const turnstileSiteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || '';
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileWidgetId, setTurnstileWidgetId] = useState<string | null>(null);
  const turnstileContainerRef = React.useRef<HTMLDivElement>(null);

  const isSupabaseConnected = !!getSupabaseClient();

  // Initialize Turnstile widget if site key is present
  useEffect(() => {
    if (!isOpen || !turnstileSiteKey) return;

    let checkInterval: any;
    const renderWidget = () => {
      const turnstile = (window as any).turnstile;
      if (turnstile && turnstileContainerRef.current) {
        try {
          if (turnstileWidgetId) {
            turnstile.reset(turnstileWidgetId);
          } else {
            const widgetId = turnstile.render(turnstileContainerRef.current, {
              sitekey: turnstileSiteKey,
              callback: (token: string) => {
                setTurnstileToken(token);
                setErrorMessage(null);
              },
              'error-callback': () => {
                setTurnstileToken(null);
              },
              'expired-callback': () => {
                setTurnstileToken(null);
              },
              theme: 'light',
              size: 'normal'
            });
            setTurnstileWidgetId(widgetId);
          }
          if (checkInterval) clearInterval(checkInterval);
        } catch (e) {
          console.warn('Turnstile render note:', e);
        }
      }
    };

    // Poll until turnstile API is loaded from CDN
    if ((window as any).turnstile) {
      renderWidget();
    } else {
      checkInterval = setInterval(() => {
        if ((window as any).turnstile) {
          renderWidget();
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isOpen, turnstileSiteKey, mode]);

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

    if (turnstileSiteKey && !turnstileToken) {
      setErrorMessage('Sila lengkapkan pengesahan keselamatan ("Verify you are human") sebelum log masuk.');
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
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl border border-purple-100/40 relative my-auto p-4 sm:p-7 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors z-20"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. CARD TOP NAVIGATION / BRANDING HEADER */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between pb-5 border-b border-slate-100 gap-3 text-center sm:text-left pr-8 sm:pr-0">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            <SystemLogo size={120} className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 drop-shadow-xs" />
            <div className="flex flex-col items-center sm:items-start gap-1">
              <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">ROAMDESK</span>
                <span className="text-xl sm:text-2xl font-black text-indigo-600 tracking-tight">WORKSPACE</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
                  VERSI 1.8.1
                </span>
              </div>
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">WORK . ACCESS . ANYWHERE</p>
            </div>
          </div>
        </div>

        {/* 2. CARD MAIN BODY (LOGIN & REGISTER FORM ONLY) */}
        <div className="py-4 sm:py-6">
          
          <div className="space-y-4 sm:space-y-5">
            
            {/* Segmented Tab Switcher - Premium Two-Tone Tab Styling */}
            <div className="flex bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70 gap-1.5 font-semibold text-xs shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  mode === 'login' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 font-bold scale-[1.01]' 
                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/60 font-medium'
                }`}
              >
                <div className={`p-1 rounded-lg ${mode === 'login' ? 'bg-white/20' : 'bg-slate-200/60'}`}>
                  <LogIn className="w-3.5 h-3.5" />
                </div>
                <span>Log Masuk</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  mode === 'register' 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25 font-bold scale-[1.01]' 
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60 font-medium'
                }`}
              >
                <div className={`p-1 rounded-lg ${mode === 'register' ? 'bg-white/20' : 'bg-slate-200/60'}`}>
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <span>Daftar Akaun</span>
              </button>
            </div>

            {/* Title Row with Mode-specific Badge */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {mode === 'login' ? 'Log Masuk Akaun Anda' : 'Pendaftaran Pengguna Baharu'}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    mode === 'login'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {mode === 'login' ? 'Portal' : 'Akaun Baharu'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {mode === 'login' ? 'Sila masukkan butiran ID dan kata laluan anda' : 'Sila lengkapkan profil maklumat di bawah untuk pendaftaran rasmi'}
                </p>
              </div>
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* MODE 1: LOG MASUK FORM (BLUE THEME) */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Username / E-mel <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] font-normal text-slate-400">ID / Akaun</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      disabled={isLockedOut}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Contoh: hafiz.fitri atau email@domain.com.my"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-xs shadow-2xs"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <User className="w-4 h-4 text-blue-500/70" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Kata Laluan <span className="text-rose-500">*</span></span>
                    <button
                      type="button"
                      onClick={() => setErrorMessage('Sila hubungi Admin untuk reset kata laluan.')}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                      Lupa kata laluan?
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={isLockedOut}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata laluan"
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50/80 border border-slate-200 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-xs shadow-2xs"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4 text-blue-500/70" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Cloudflare Turnstile Container (Verify You Are Human) */}
                {turnstileSiteKey && (
                  <div className="pt-2 pb-1 flex flex-col items-center justify-center">
                    <div ref={turnstileContainerRef} className="min-h-[65px] flex items-center justify-center"></div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Dilindungi oleh Cloudflare Turnstile</span>
                    </div>
                  </div>
                )}

                {/* Action Row: Blue Submit button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isLoading || isLockedOut}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-blue-600/30 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span>Memproses Pengesahan...</span>
                    ) : isLockedOut ? (
                      <span>Akses Disekat ({lockoutTimer}s)</span>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Log Masuk ke Sistem</span>
                        <ArrowRight className="w-4 h-4 ml-0.5" />
                      </>
                    )}
                  </button>
                </div>

                {/* REGISTER CALL-TO-ACTION (GREEN THEME) */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-emerald-50/90 p-3.5 rounded-2xl border border-emerald-200/80 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Belum mempunyai akaun pengguna?</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-sm shadow-emerald-600/25 hover:shadow-md hover:shadow-emerald-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Daftar Akaun Baharu Sekarang</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-80" />
                    </button>
                  </div>
                </div>

              </form>
            ) : (
              /* MODE 2: REGISTER FORM (GREEN THEME) */
              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Nama <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] font-normal text-slate-400">Nama Anda</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Contoh: Ahmad Razak"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs transition-all shadow-2xs"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <User className="w-4 h-4 text-emerald-500/70" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="username"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs transition-all shadow-2xs"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <AtSign className="w-3.5 h-3.5 text-emerald-500/70" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      E-mel <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="nama@domain.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs transition-all shadow-2xs"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Mail className="w-3.5 h-3.5 text-emerald-500/70" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Kata Laluan <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] font-normal text-slate-400">Min 6 aksara</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Cipta kata laluan keselamatan"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs transition-all shadow-2xs"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Key className="w-4 h-4 text-emerald-500/70" />
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span>Mendaftar Akaun...</span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Cipta Akaun Baharu Sekarang</span>
                        <ArrowRight className="w-4 h-4 ml-0.5" />
                      </>
                    )}
                  </button>
                </div>

                {/* LOGIN TOGGLE BUTTON BELOW REGISTER FORM */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex flex-col items-center justify-center gap-2 bg-blue-50/70 p-3 rounded-xl border border-blue-200/70 text-center">
                    <p className="text-xs text-blue-900 font-medium">
                      Sudah mempunyai akaun berdaftar?
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 font-bold text-xs shadow-2xs hover:shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5 text-blue-600" />
                      <span>Kembali ke Log Masuk</span>
                    </button>
                  </div>
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
            <button type="button" onClick={() => alert('Sistem ROAMDESK WORKSPACE - Terma & Syarat Penggunaan Hak Cipta 2026.')} className="hover:text-indigo-600 transition-colors">
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
