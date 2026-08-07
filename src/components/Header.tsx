import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Moon, 
  Sun, 
  Bell, 
  ChevronDown, 
  Plus, 
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
  PanelLeft
} from 'lucide-react';
import { Workspace, UserProfile } from '../types';

interface HeaderProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  onSelectWorkspace: (ws: Workspace) => void;
  currentUser: UserProfile;
  onOpenQuickAction: () => void;
  onOpenAiCopilot: () => void;
  onOpenGlobalSearch: () => void;
  onOpenSupabaseModal: () => void;
  onOpenSettings?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  unreadCount?: number;
  onSimulateRealtime?: () => void;
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
  onOpenSettings,
  onOpenLogin,
  onLogout,
  unreadCount = 5,
  onSimulateRealtime
}) => {
  const [isWsDropdownOpen, setIsWsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
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
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Mobile Search Icon Button */}
        <button
          onClick={onOpenGlobalSearch}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 sm:hidden"
          title="Cari"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Ask AI Copilot Button */}
        <button
          onClick={onOpenAiCopilot}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all text-xs font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Ask AI</span>
        </button>

        {/* Firebase Cloud Live Sync Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold cursor-pointer" onClick={onOpenSupabaseModal} title="Awan Firebase Google Aktif - Data Diselaraskan Secara Real-time di Semua Peranti">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Firebase Cloud Active</span>
        </div>

        {/* Theme Dark/Light Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          title="Tukar Mod Paparan"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-extrabold flex items-center justify-center border border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-30">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-900">Notifikasi Realtime</span>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {unreadCount} Baharu
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-600 max-h-64 overflow-y-auto">
                <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                  <div className="font-semibold text-slate-900">ADV-2026-095 Didaftarkan</div>
                  <div className="text-[11px] text-slate-500">Kes aduan kritikal baharu dimasukkan dalam workspace.</div>
                  <div className="text-[9px] text-slate-400 mt-1">2 minit lalu</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="font-semibold text-slate-900">SLA Hampir Tamat</div>
                  <div className="text-[11px] text-slate-500">Kes ADV-2026-089 berbaki 12 jam sasaran penyelesaian.</div>
                  <div className="text-[9px] text-slate-400 mt-1">1 jam lalu</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar with Dropdown Menu */}
        <div className="relative border-l border-slate-200 pl-2">
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-all text-left group"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-300 ring-2 ring-transparent group-hover:ring-indigo-500/20 transition-all"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                <span>{currentUser.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
              </div>
              <div className="text-[10px] text-indigo-600 font-mono font-medium">@{currentUser.username || 'sarah_adams'}</div>
            </div>
          </button>

          {/* Profile Dropdown */}
          {isProfileDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-40 animate-fade-in space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
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

        {/* Quick Action Button matching Clean Minimalism */}
        <button
          onClick={onOpenQuickAction}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Shortcuts</span>
        </button>
      </div>
    </header>
  );
};
