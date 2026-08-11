import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  ChevronDown, 
  PlusCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Building2,
  Database,
  Radio,
  User,
  Key,
  Settings,
  AtSign,
  LogOut,
  LogIn,
  PanelLeft,
  Activity,
  SlidersHorizontal
} from 'lucide-react';
import { Workspace, UserProfile } from '../types';

interface HeaderProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  onSelectWorkspace: (ws: Workspace) => void;
  currentUser: UserProfile;
  onOpenQuickAction?: () => void;
  onOpenAiCopilot: () => void;
  onOpenGlobalSearch: () => void;
  onOpenSupabaseModal: () => void;
  onOpenDiagnostics?: () => void;
  onOpenSettings?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  unreadCount?: number;
  onSimulateRealtime?: () => void;
  isReorderMode?: boolean;
  onToggleReorderMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  currentWorkspace,
  workspaces,
  onSelectWorkspace,
  currentUser,
  onOpenQuickAction,
  onOpenAiCopilot,
  onOpenGlobalSearch,
  onOpenSupabaseModal,
  onOpenDiagnostics,
  onOpenSettings,
  onOpenLogin,
  onLogout,
  unreadCount = 0,
  onSimulateRealtime,
  isReorderMode = false,
  onToggleReorderMode,
}) => {
  const [isWsDropdownOpen, setIsWsDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const isAdmin = currentUser?.role === 'Pentadbir Utama Aduan' || 
                  currentUser?.role?.toLowerCase().includes('pentadbir') || 
                  currentUser?.role?.toLowerCase().includes('admin');

  React.useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
  }, []);

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-5 lg:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs transition-colors">
      {/* Left Area: Sidebar Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center border border-slate-200/80 bg-slate-50/50 shadow-2xs"
            title={isSidebarOpen ? "Sembunyikan Panel Sisi" : "Tunjukkan Panel Sisi"}
          >
            <PanelLeft className="w-4.5 h-4.5 text-slate-700" />
          </button>
        )}
      </div>

      {/* Middle Area: Global Search Input */}
      <div className="flex-1 max-w-xl mx-2 sm:mx-4 md:mx-6 hidden sm:block">
        <button
          onClick={onOpenGlobalSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-100/50 transition-all text-xs"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">Cari no. rujukan aduan, nama pengadu, tajuk...</span>
          </div>
          <div className="hidden md:flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] font-semibold text-slate-500 shadow-2xs">
            <span>⌘</span>
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right Area: Controls & User Profile */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Mobile Search Icon Button */}
        <button
          onClick={onOpenGlobalSearch}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 sm:hidden transition-colors"
          title="Cari Aduan"
        >
          <Search className="w-4.5 h-4.5 text-slate-600" />
        </button>

        {/* Ask AI Copilot Button */}
        <button
          onClick={onOpenAiCopilot}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all text-xs font-semibold shrink-0"
          title="Ask AI Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>

        {/* Special Icon Button: Susun Panel (Admin) */}
        {isAdmin && onToggleReorderMode && (
          <button
            onClick={onToggleReorderMode}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border transition-all text-xs font-bold shrink-0 cursor-pointer ${
              isReorderMode
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300 animate-pulse'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
            }`}
            title="Susun Kedudukan Panel Menu Belah Kiri (Admin)"
          >
            <SlidersHorizontal className={`w-3.5 h-3.5 shrink-0 ${isReorderMode ? 'text-white' : 'text-amber-600'}`} />
            <span className="hidden md:inline">Susun Panel</span>
            {isReorderMode ? (
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-white/30 font-mono text-white font-extrabold">
                ON
              </span>
            ) : (
              <span className="hidden sm:inline text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-200/60 text-amber-950 font-mono font-bold">
                Admin
              </span>
            )}
          </button>
        )}

        {/* Firebase Cloud Live Sync Badge & Diagnostics Button */}
        <div className="hidden xl:flex items-center gap-1.5 shrink-0">
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold cursor-pointer transition-colors" 
            onClick={onOpenSupabaseModal} 
            title="Awan Firebase Google Aktif - Data Diselaraskan Secara Real-time di Semua Peranti"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Firebase Sync</span>
          </div>

          {onOpenDiagnostics && (
            <button
              onClick={onOpenDiagnostics}
              className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs"
              title="Buka Panel Diagnostik Realtime Firestore"
            >
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Diagnostik</span>
            </button>
          )}
        </div>

        {/* User Profile Avatar with Dropdown Menu */}
        <div className="relative border-l border-slate-200 pl-1.5 sm:pl-2 shrink-0">
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition-all text-left group"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name || 'User')}&backgroundColor=4f46e5`;
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-300 ring-2 ring-transparent group-hover:ring-indigo-500/20 transition-all bg-slate-100"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                <span className="truncate max-w-[100px]">{currentUser.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 shrink-0" />
              </div>
              <div className="text-[10px] text-indigo-600 font-mono font-medium truncate max-w-[100px]">@{currentUser.username || 'sarah_adams'}</div>
            </div>
          </button>

          {/* Profile Dropdown */}
          {isProfileDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 sm:w-72 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-fade-in space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  onError={(e) => {
                    e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name || 'User')}&backgroundColor=4f46e5`;
                  }}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100"
                />
                <div className="overflow-hidden">
                  <div className="font-extrabold text-xs text-slate-900 truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-indigo-600 font-mono font-semibold truncate">@{currentUser.username}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{currentUser.email}</div>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    if (onOpenSettings) onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Kemaskini Profil & Username</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    if (onOpenSettings) onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  <Key className="w-4 h-4 text-indigo-600" />
                  <span>Tukar Kata Laluan</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    if (onOpenSettings) onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Tetapan Akaun</span>
                </button>

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      if (onOpenLogin) onOpenLogin();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 transition-colors"
                  >
                    <LogIn className="w-4 h-4 text-indigo-600" />
                    <span>Log Masuk / Tukar Akaun</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Log Keluar (Sign Out)</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
                Peranan: <span className="font-bold text-slate-700">{currentUser.role}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
