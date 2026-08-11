import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar,
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
  X,
  ClipboardList,
  ArrowUp,
  ArrowDown,
  GripVertical,
  SlidersHorizontal,
  RotateCcw,
  Download
} from 'lucide-react';
import { Workspace, UserProfile } from '../types';
import { SystemLogo } from './SystemLogo';
import { isViewAllowed } from '../lib/auth';
import { 
  sidebarConfigService, 
  SidebarConfig, 
  DEFAULT_OVERVIEW_NAV, 
  DEFAULT_WORKSPACE_NAV, 
  DEFAULT_SYSTEM_NAV 
} from '../services/sidebarConfigService';

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
  isReorderMode?: boolean;
  setIsReorderMode?: (val: boolean) => void;
}

interface NavItemDef {
  id: string;
  label: string;
  icon: React.FC<any>;
  badge?: string;
  action?: () => void;
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
  isReorderMode: isReorderModeProp,
  setIsReorderMode: setIsReorderModeProp,
}) => {
  const [config, setConfig] = useState<SidebarConfig>(() => sidebarConfigService.getConfig());
  const [internalReorderMode, setInternalReorderMode] = useState<boolean>(false);

  const isReorderMode = isReorderModeProp !== undefined ? isReorderModeProp : internalReorderMode;
  const setIsReorderMode = setIsReorderModeProp || setInternalReorderMode;

  useEffect(() => {
    const unsubscribe = sidebarConfigService.subscribe((updatedConfig) => {
      setConfig(updatedConfig);
    });
    return () => unsubscribe();
  }, []);

  const roleLower = (currentUser?.role || '').toLowerCase();
  const isAdmin = roleLower.includes('pentadbir') || roleLower.includes('admin');

  useEffect(() => {
    if (!isAdmin) {
      setIsReorderMode(false);
    }
  }, [isAdmin]);

  const isAllowed = (viewId: string) => {
    return isViewAllowed(viewId, currentUser);
  };

  const navMap: Record<string, NavItemDef> = {
    dashboard: { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    calendar: { id: 'calendar', label: 'Kalendar', icon: Calendar },
    aduan: { id: 'aduan', label: 'Kes Aduan', icon: ShieldAlert },
    laporan_aduan: { id: 'laporan_aduan', label: 'Laporan Aduan', icon: ClipboardList },
    kanban: { id: 'kanban', label: 'Paparan Aduan', icon: Kanban },
    templates: { id: 'templates', label: 'Format / Template Catatan', icon: FileText },
    linkhub: { id: 'linkhub', label: 'Linkhub', icon: FolderGit2, badge: 'Baharu' },
    downloads: { id: 'downloads', label: 'Koleksi Download', icon: Download, badge: 'Baharu' },
    admin: { id: 'admin', label: 'Pentadbiran & Audit User', icon: ShieldCheck },
    login: { id: 'login', label: 'Log Masuk (Encrypted)', icon: Lock, action: onOpenLogin },
    settings: { id: 'settings', label: 'Tetapan Akaun', icon: Settings },
  };

  // Ensure all configured overview ids exist in navMap
  const overviewNav = (config.overviewNavIds || DEFAULT_OVERVIEW_NAV)
    .map(id => navMap[id])
    .filter(Boolean)
    .filter(item => isAllowed(item.id));

  // Ensure all configured workspace ids exist
  const workspaceNav = (config.workspaceNavIds || DEFAULT_WORKSPACE_NAV)
    .map(id => navMap[id])
    .filter(Boolean)
    .filter(item => isAllowed(item.id));

  // System nav
  const systemNav = (config.systemNavIds || DEFAULT_SYSTEM_NAV)
    .map(id => navMap[id])
    .filter(Boolean)
    .filter(item => item.id === 'login' || isAllowed(item.id));

  // Handle reordering within overviewNav (Ruang Kerja)
  const handleMoveOverviewItem = async (index: number, direction: 'up' | 'down') => {
    const currentIds = [...config.overviewNavIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentIds.length) return;

    const temp = currentIds[index];
    currentIds[index] = currentIds[targetIndex];
    currentIds[targetIndex] = temp;

    await sidebarConfigService.saveConfig({
      ...config,
      overviewNavIds: currentIds,
    });
  };

  // Handle reordering within workspaceNav (Pautan & Rujukan)
  const handleMoveWorkspaceItem = async (index: number, direction: 'up' | 'down') => {
    const currentIds = [...config.workspaceNavIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentIds.length) return;

    const temp = currentIds[index];
    currentIds[index] = currentIds[targetIndex];
    currentIds[targetIndex] = temp;

    await sidebarConfigService.saveConfig({
      ...config,
      workspaceNavIds: currentIds,
    });
  };

  // Transfer item between Ruang Kerja and Pautan & Rujukan
  const handleTransferToWorkspace = async (id: string) => {
    const newOverview = config.overviewNavIds.filter(itemId => itemId !== id);
    const newWorkspace = [...config.workspaceNavIds, id];
    await sidebarConfigService.saveConfig({
      ...config,
      overviewNavIds: newOverview,
      workspaceNavIds: newWorkspace,
    });
  };

  const handleTransferToOverview = async (id: string) => {
    const newWorkspace = config.workspaceNavIds.filter(itemId => itemId !== id);
    const newOverview = [...config.overviewNavIds, id];
    await sidebarConfigService.saveConfig({
      ...config,
      overviewNavIds: newOverview,
      workspaceNavIds: newWorkspace,
    });
  };

  // Reset to default
  const handleResetSidebarConfig = async () => {
    await sidebarConfigService.resetConfig();
  };

  return (
    <aside 
      className={`bg-white border-r border-slate-200 flex flex-col justify-between h-screen fixed lg:sticky top-0 left-0 z-50 lg:z-20 transition-all duration-300 ease-in-out select-none ${
        isOpen 
          ? 'w-64 translate-x-0 opacity-100' 
          : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:pointer-events-none'
      }`}
    >
      {/* Top Header & Brand Logo with Hide Icon Button */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
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
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">

        {/* REORDER MODE ADMIN BANNER */}
        {isReorderMode && (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/90 text-amber-950 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[11px] text-amber-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Mod Susunan Panel Active</span>
              </span>
              <button
                onClick={handleResetSidebarConfig}
                className="p-1 rounded-md bg-white hover:bg-amber-100 text-slate-700 border border-amber-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Sifat semula susunan panel"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
            <p className="text-[10px] text-amber-800 leading-tight">
              Gunakan butang [▲] dan [▼] pada setiap panel di bawah untuk menukar kedudukan. Semua perubahan disinkronkan automatik ke Firebase.
            </p>
          </div>
        )}

        {/* Overview Section (RUANG KERJA) */}
        <div>
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              RUANG KERJA
            </div>
            {isReorderMode && (
              <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                {overviewNav.length} Panel
              </span>
            )}
          </div>

          <nav className="space-y-1.5">
            {overviewNav.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isFirst = idx === 0;
              const isLast = idx === overviewNav.length - 1;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-1 rounded-xl transition-all ${
                    isReorderMode ? 'p-1 bg-amber-50/50 border border-amber-200/60' : ''
                  }`}
                >
                  {isReorderMode && (
                    <div className="flex flex-col gap-0.5 shrink-0 bg-white p-1 rounded-lg border border-amber-200">
                      <button
                        type="button"
                        onClick={() => handleMoveOverviewItem(idx, 'up')}
                        disabled={isFirst}
                        className="p-0.5 rounded text-slate-700 hover:bg-amber-100 disabled:opacity-20 transition-all cursor-pointer"
                        title="Alih ke atas"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOverviewItem(idx, 'down')}
                        disabled={isLast}
                        className="p-0.5 rounded text-slate-700 hover:bg-amber-100 disabled:opacity-20 transition-all cursor-pointer"
                        title="Alih ke bawah"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {isReorderMode && (
                    <button
                      type="button"
                      onClick={() => handleTransferToWorkspace(item.id)}
                      className="p-1 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 text-[9px] font-bold transition-all shrink-0 cursor-pointer"
                      title="Pindah ke Pautan & Rujukan"
                    >
                      ↓
                    </button>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Workspace Section (Pautan & Rujukan) */}
        <div>
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Pautan & Rujukan
            </div>
            {isReorderMode && (
              <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                {workspaceNav.length} Panel
              </span>
            )}
          </div>

          <nav className="space-y-1.5">
            {workspaceNav.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isFirst = idx === 0;
              const isLast = idx === workspaceNav.length - 1;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-1 rounded-xl transition-all ${
                    isReorderMode ? 'p-1 bg-amber-50/50 border border-amber-200/60' : ''
                  }`}
                >
                  {isReorderMode && (
                    <div className="flex flex-col gap-0.5 shrink-0 bg-white p-1 rounded-lg border border-amber-200">
                      <button
                        type="button"
                        onClick={() => handleMoveWorkspaceItem(idx, 'up')}
                        disabled={isFirst}
                        className="p-0.5 rounded text-slate-700 hover:bg-amber-100 disabled:opacity-20 transition-all cursor-pointer"
                        title="Alih ke atas"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveWorkspaceItem(idx, 'down')}
                        disabled={isLast}
                        className="p-0.5 rounded text-slate-700 hover:bg-amber-100 disabled:opacity-20 transition-all cursor-pointer"
                        title="Alih ke bawah"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </button>

                  {isReorderMode && (
                    <button
                      type="button"
                      onClick={() => handleTransferToOverview(item.id)}
                      className="p-1 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 text-[9px] font-bold transition-all shrink-0 cursor-pointer"
                      title="Pindah ke Ruang Kerja"
                    >
                      ↑
                    </button>
                  )}
                </div>
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
                </button>
              );
            })}
          </nav>
        </div>

      </div>
    </aside>
  );
};
