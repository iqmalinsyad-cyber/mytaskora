import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  BarChart3, 
  Workflow, 
  BookOpen, 
  FileText, 
  Users, 
  Settings, 
  Database, 
  ShieldAlert, 
  Kanban,
  Sparkles,
  ChevronRight,
  FolderGit2,
  Lock,
  LogIn,
  ShieldCheck,
  PanelLeftClose,
  X
} from 'lucide-react';
import { Workspace, UserProfile } from '../types';
import { SystemLogo } from './SystemLogo';

interface SidebarProps {
  isOpen: boolean;
  onToggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentWorkspace: Workspace;
  currentUser?: UserProfile;
  onOpenWorkspaceModal: () => void;
  onOpenSupabaseModal: () => void;
  onOpenLogin?: () => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggleSidebar,
  activeTab,
  setActiveTab,
  currentWorkspace,
  currentUser,
  onOpenWorkspaceModal,
  onOpenSupabaseModal,
  onOpenLogin,
}) => {
  const isAllowed = (viewId: string) => {
    if (!currentUser) return true;
    if (!currentUser.allowedViews || currentUser.allowedViews.length === 0) return true;
    return currentUser.allowedViews.includes(viewId);
  };

  const overviewNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'aduan', label: 'Kes Aduan', icon: ShieldAlert, badge: 'Utama' },
    { id: 'kanban', label: 'Paparan Aduan', icon: Kanban },
    { id: 'templates', label: 'Format / Template Catatan', icon: FileText },
  ].filter(item => isAllowed(item.id));

  const workspaceNav = [
    { id: 'linkhub', label: 'Linkhub Pautan Rujukan', icon: FolderGit2, badge: 'Baharu' },
  ].filter(item => isAllowed(item.id));

  const systemNav = [
    { id: 'admin', label: 'Pentadbiran & Audit User', icon: ShieldCheck },
    { id: 'supabase', label: 'Integrasi Supabase', icon: Database, action: onOpenSupabaseModal },
    { id: 'login', label: 'Log Masuk (Encrypted)', icon: Lock, action: onOpenLogin },
    { id: 'settings', label: 'Tetapan Akaun', icon: Settings },
  ].filter(item => item.id === 'login' || isAllowed(item.id));

  return (
    <aside 
      className={`bg-white border-r border-slate-200 flex flex-col justify-between h-screen fixed lg:sticky top-0 left-0 z-50 lg:z-20 transition-all duration-300 ease-in-out select-none ${
        isOpen 
          ? 'w-64 translate-x-0 opacity-100' 
          : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:pointer-events-none'
      }`}
    >
      {/* Top Header & Brand Logo with Hide Icon Button */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SystemLogo size={32} />
          <div>
            <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-none">TASKORA</h1>
            <span className="text-[10px] text-slate-400 font-medium">Your Smart Workspace</span>
          </div>
        </div>

        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Sembunyikan Panel Sisi"
        >
          <PanelLeftClose className="w-4 h-4 hidden lg:block" />
          <X className="w-4 h-4 lg:hidden" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {/* Overview Section */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-2">
            Utama
          </div>
          <nav className="space-y-1">
            {overviewNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Workspace Section */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-2">
            Pautan & Rujukan
          </div>
          <nav className="space-y-1">
            {workspaceNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Section */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-2">
            Sistem & Database
          </div>
          <nav className="space-y-1">
            {systemNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) item.action();
                    else setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'supabase' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
};
