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
  ShieldAlert,
  UserCheck
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

  const setDemoAccount = async (u: string, p: string) => {
    setIdentifier(u);
    setPassword(p);
    setErrorMessage(null);
    
    // Auto submit for convenience
    setIsLoading(true);
    try {
      const res = await authenticateUser(u, p);
      setIsLoading(false);
      if (res.success && res.user) {
        setSuccessMessage(`Log masuk pantas sebagai ${res.user.name}!`);
        onLoginSuccess(res.user);
        onClose();
      }
    } catch {
      setIsLoading(false);
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
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-purple-100/40 overflow-hidden relative my-auto p-6 sm:p-8 md:p-10 flex flex-col justify-between min-h-[580px]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors z-20"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. CARD TOP NAVIGATION / BRANDING HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
          <div className="flex items-center gap-3">
            <SystemLogo size={36} />
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">TASKORA</span>
              <span className="text-xl font-black text-indigo-600 tracking-tight">WORKSPACE</span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide ml-1">
                DAERAH HULU LANGAT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pr-8 sm:pr-0">
            {/* Mode Switcher Pill Button */}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs font-semibold px-5 py-2 rounded-full border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all shadow-2xs"
            >
              {mode === 'login' ? 'Register / Daftar' : 'Log Masuk'}
            </button>
          </div>
        </div>

        {/* 2. CARD MAIN BODY (2-COLUMN LAYOUT) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-6">
          
          {/* LEFT COLUMN: FORM SECTION (5 to 6 cols) */}
          <div className="md:col-span-6 lg:col-span-5 space-y-5">
            
            {/* Title Row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {mode === 'login' ? 'Login to your account' : 'Daftar Akaun Baharu'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {mode === 'login' ? 'Sila masukkan butiran log masuk rasmi anda' : 'Lengkapkan profil anda'}
                </p>
              </div>
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
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <input
                    type="text"
                    required
                    disabled={isLockedOut}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Your Email / Username"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLockedOut}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200/80 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Extra Row: Forgot password & Log in pill button */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setErrorMessage('Sila hubungi Pentadbir Sistem untuk bantuan kata laluan.')}
                    className="text-[11px] text-slate-400 hover:text-indigo-600 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || isLockedOut}
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span>Memproses...</span>
                    ) : isLockedOut ? (
                      <span>Disekat ({lockoutTimer}s)</span>
                    ) : (
                      <span>Log in</span>
                    )}
                  </button>
                </div>

                {/* Encryption Status Tag */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Kata laluan dienkripsi SHA-256 Web Crypto</span>
                  </div>
                  {onOpenSupabaseModal && (
                    <button
                      type="button"
                      onClick={onOpenSupabaseModal}
                      className="text-indigo-600 hover:underline font-bold"
                    >
                      Realtime Sync
                    </button>
                  )}
                </div>

              </form>
            ) : (
              /* MODE 2: REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Nama Penuh (Contoh: Ahmad Razak)"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="E-mel"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
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
                  className="w-full py-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? <span>Daftar Akaun...</span> : <span>Cipta Akaun Baharu</span>}
                </button>
              </form>
            )}

          </div>

          {/* RIGHT COLUMN: ISOMETRIC WORKSPACE & CALENDAR ARTWORK (6 to 7 cols) */}
          <div className="hidden md:flex md:col-span-6 lg:col-span-7 justify-center items-center p-2 relative">
            
            {/* SVG Vector Graphic recreating the exact artwork style from image */}
            <div className="w-full max-w-md relative aspect-[4/3] flex items-center justify-center">
              
              <svg viewBox="0 0 500 400" className="w-full h-full drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  {/* Isometric Laptop Gradient */}
                  <linearGradient id="laptopBody" x1="200" y1="200" x2="400" y2="350" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#E2E8F0" />
                    <stop offset="100%" stopColor="#CBD5E1" />
                  </linearGradient>

                  <linearGradient id="screenGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#0284C7" />
                  </linearGradient>

                  <linearGradient id="calendarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#F1F5F9" />
                  </linearGradient>

                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="100%" stopColor="#4F46E5" />
                  </linearGradient>
                </defs>

                {/* Scattered Cyan Isometric Floor Tiles */}
                <path d="M 300 280 L 320 270 L 330 275 L 310 285 Z" fill="#22D3EE" opacity="0.8" />
                <path d="M 340 260 L 350 255 L 358 259 L 348 264 Z" fill="#22D3EE" opacity="0.6" />
                <path d="M 280 295 L 295 287 L 305 292 L 290 300 Z" fill="#38BDF8" opacity="0.7" />
                <path d="M 330 290 L 345 282 L 352 286 L 337 294 Z" fill="#22D3EE" opacity="0.9" />

                {/* 1. ISOMETRIC LAPTOP BASE & KEYBOARD */}
                {/* Laptop shadow */}
                <ellipse cx="320" cy="270" rx="90" ry="30" fill="#0F172A" opacity="0.08" />

                {/* Laptop Body Top Plane */}
                <path d="M 240 220 L 330 175 L 420 220 L 330 265 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="2" />
                {/* Laptop Body Front Edge */}
                <path d="M 240 220 L 240 228 L 330 273 L 330 265 Z" fill="#94A3B8" />
                <path d="M 330 265 L 330 273 L 420 228 L 420 220 Z" fill="#64748B" />

                {/* Laptop Screen Standing Up */}
                <path d="M 240 220 L 240 130 L 330 85 L 330 175 Z" fill="#1E293B" />
                <path d="M 245 215 L 245 135 L 325 95 L 325 170 Z" fill="url(#screenGrad)" />
                {/* Screen UI Lines */}
                <line x1="255" y1="145" x2="310" y2="118" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
                <line x1="255" y1="160" x2="295" y2="140" stroke="#E0F2FE" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                <circle cx="310" cy="150" r="8" fill="#F43F5E" />

                {/* Laptop Keyboard Keys Grid */}
                <g opacity="0.85">
                  <path d="M 270 205 L 330 175 L 385 202 L 325 232 Z" fill="#0F172A" />
                  {/* Keyboard Key Rows */}
                  {Array.from({ length: 5 }).map((_, row) => (
                    <line key={row} x1={280 + row * 8} y1={202 + row * 4} x2={335 + row * 8} y2={175 + row * 4} stroke="#38BDF8" strokeWidth="1.5" opacity="0.6" />
                  ))}
                </g>

                {/* Cable Connecting Laptop to Standing Calendar */}
                <path d="M 310 215 C 280 230, 270 200, 260 210" fill="none" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
                <path d="M 380 195 C 400 180, 390 140, 370 150" fill="none" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />

                {/* 2. GIANT DESKTOP STANDING CALENDAR */}
                {/* Calendar Back Shadow */}
                <polygon points="340,110 440,60 440,210 340,260" fill="#0284C7" opacity="0.3" />

                {/* Calendar Main Board Face */}
                <polygon points="340,100 430,55 430,200 340,245" fill="url(#calendarGrad)" stroke="#38BDF8" strokeWidth="3" />
                
                {/* Calendar Blue Header */}
                <polygon points="340,100 430,55 430,85 340,130" fill="#0284C7" />

                {/* Ring Binder Loops Top (CO CO CO CO CO CO) */}
                {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                  const x = 348 + idx * 11;
                  const y = 96 - idx * 5.5;
                  return (
                    <g key={idx}>
                      <ellipse cx={x} cy={y} rx="3" ry="7" fill="none" stroke="#475569" strokeWidth="2" />
                      <ellipse cx={x} cy={y - 2} rx="2" ry="5" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
                    </g>
                  );
                })}

                {/* Calendar Date Grid Dots & Squares */}
                {[0, 1, 2, 3].map((r) => (
                  <g key={r}>
                    {[0, 1, 2, 3, 4].map((c) => {
                      const gx = 352 + c * 14 - r * 2;
                      const gy = 142 + r * 16 - c * 2;
                      const isHighlighted = r === 1 && c === 2;
                      return (
                        <rect
                          key={c}
                          x={gx}
                          y={gy}
                          width="8"
                          height="8"
                          rx="1.5"
                          fill={isHighlighted ? '#F43F5E' : '#38BDF8'}
                          opacity={isHighlighted ? 1 : 0.7}
                        />
                      );
                    })}
                  </g>
                ))}

                {/* Circle around highlighted date */}
                <ellipse cx="384" cy="154" rx="12" ry="8" fill="none" stroke="#F43F5E" strokeWidth="2.5" />
                {/* Checkmark inside circle */}
                <path d="M 380 154 L 383 157 L 388 150" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />

                {/* Notification Badge Floating Top of Calendar ("5") */}
                <g>
                  <circle cx="408" cy="55" r="13" fill="#06B6D4" />
                  <text x="408" y="59" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold" fontFamily="sans-serif">5</text>
                  {/* Speech bubble tail */}
                  <polygon points="412,66 422,72 418,63" fill="#06B6D4" />
                </g>

                {/* 3. USER CHARACTER SITTING ON STOOL WORKING ON LAPTOP */}
                <g>
                  {/* Stool Base */}
                  <ellipse cx="230" cy="190" rx="14" ry="6" fill="#64748B" />
                  <line x1="230" y1="190" x2="230" y2="230" stroke="#475569" strokeWidth="3" />
                  <ellipse cx="230" cy="230" rx="18" ry="6" fill="#334155" />

                  {/* Character Torso (Blue Shirt) */}
                  <path d="M 220 150 C 220 135, 240 135, 240 150 L 242 175 L 218 175 Z" fill="#2563EB" />

                  {/* Character Head */}
                  <circle cx="230" cy="126" r="10" fill="#FDBA74" />
                  {/* Hair */}
                  <path d="M 222 122 C 220 115, 235 110, 238 120 Z" fill="#1E293B" />

                  {/* Character Legs (Light Gray Pants) */}
                  <path d="M 220 175 L 210 200 L 215 220" fill="none" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 238 175 L 245 200 L 240 220" fill="none" stroke="#64748B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Small Laptop on User's Lap */}
                  <polygon points="212,158 238,152 245,165 218,172" fill="#38BDF8" />
                  <polygon points="212,158 212,145 238,139 238,152" fill="#0284C7" />
                </g>

                {/* Floating Chat Message Bubble */}
                <g>
                  <rect x="180" y="215" width="32" height="18" rx="6" fill="#4F46E5" />
                  <polygon points="195,233 200,238 202,233" fill="#4F46E5" />
                  <circle cx="190" cy="224" r="2" fill="#FFFFFF" />
                  <circle cx="196" cy="224" r="2" fill="#FFFFFF" />
                  <circle cx="202" cy="224" r="2" fill="#FFFFFF" />
                </g>

              </svg>

            </div>

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
