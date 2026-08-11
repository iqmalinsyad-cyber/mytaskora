import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DailyBriefBanner } from './components/DailyBriefBanner';
import { KpiCards } from './components/KpiCards';
import { AduanCharts } from './components/AduanCharts';
import { AduanList } from './components/AduanList';
import { AduanKanban } from './components/AduanKanban';
import { CatatanFormatView } from './components/CatatanFormatView';
import { LaporanView } from './components/LaporanView';
import { SupabaseModal } from './components/SupabaseModal';
import { FirebaseDiagnostics } from './components/FirebaseDiagnostics';
import { AduanDetailModal } from './components/AduanDetailModal';
import { NewAduanModal } from './components/NewAduanModal';
import { AiCopilotDrawer } from './components/AiCopilotDrawer';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { QuickActionModal } from './components/QuickActionModal';

import { AduanCase, AduanStatus, FilterOptions, Workspace, UserProfile } from './types';
import { aduanService } from './services/aduanService';
import { CURRENT_USER } from './data/mockData';
import { SettingsView } from './components/SettingsView';
import { LoginModal } from './components/LoginModal';
import { AdminManagementView } from './components/AdminManagementView';
import { LinkHubView } from './components/LinkHubView';
import { DownloadCenterView } from './components/DownloadCenterView';
import { CalendarView } from './components/CalendarView';
import { LaporanAduanView } from './components/LaporanAduanView';
import { DashboardCalendarWidget } from './components/DashboardCalendarWidget';
import { getActiveAuthSession, setAuthSession, clearAuthSession, recordLogout, setupUsersRealtimeSubscription, isViewAllowed } from './lib/auth';
import { BookOpen, Users, Settings, ShieldAlert, Sparkles, Building2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [cases, setCases] = useState<AduanCase[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(() => {
    const list = aduanService.getWorkspaces();
    return list[0];
  });

  // Authentication & Session State (Mandatory Login Gate)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!getActiveAuthSession();
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const session = getActiveAuthSession();
    if (session) return session;
    try {
      const saved = localStorage.getItem('WORKSPACE_CURRENT_USER');
      return saved ? JSON.parse(saved) : CURRENT_USER;
    } catch {
      return CURRENT_USER;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('WORKSPACE_CURRENT_USER', JSON.stringify(currentUser));
    } catch (e) {
      console.error(e);
    }
    if (!isViewAllowed(activeTab, currentUser)) {
      if (isViewAllowed('linkhub', currentUser)) {
        setActiveTab('linkhub');
      } else {
        setActiveTab('settings');
      }
    }
  }, [currentUser]);

  const handleUpdateUserProfile = (updatedProfile: UserProfile) => {
    setCurrentUser(updatedProfile);
  };

  const handleLogout = async () => {
    await recordLogout(currentUser);
    setIsAuthenticated(false);
    setRealtimeToast('🔒 Anda telah log keluar secara selamat. Sesi terenkripsi ditamatkan.');
    setTimeout(() => setRealtimeToast(null), 4000);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsLoginModalOpen(false);
    if (isViewAllowed('dashboard', user)) {
      setActiveTab('dashboard');
    } else if (isViewAllowed('linkhub', user)) {
      setActiveTab('linkhub');
    } else {
      setActiveTab('settings');
    }
    setRealtimeToast(`🔓 Log Masuk Berjaya! Selamat kembali, ${user.name}`);
    setTimeout(() => setRealtimeToast(null), 4000);
  };

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
    category: 'all',
    searchQuery: '',
    dateRange: '30d',
    workspaceId: currentWorkspace?.id || 'ws-integriti',
  });

  // Modal Visibility States
  const [selectedCase, setSelectedCase] = useState<AduanCase | null>(null);
  const [isNewAduanOpen, setIsNewAduanOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [isFirebaseDiagnosticsOpen, setIsFirebaseDiagnosticsOpen] = useState(false);
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [realtimeToast, setRealtimeToast] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);

  // Subscribe to Realtime Service Updates
  useEffect(() => {
    aduanService.setupFirebaseSubscription();
    const unsubscribeUsers = setupUsersRealtimeSubscription((updatedAccounts) => {
      const activeSession = getActiveAuthSession();
      if (activeSession) {
        const freshUser = updatedAccounts.find((a) => a.id === activeSession.id);
        if (freshUser) {
          const updatedProfile: UserProfile = {
            id: freshUser.id,
            name: freshUser.name,
            username: freshUser.username,
            email: freshUser.email,
            role: freshUser.role,
            avatar: freshUser.avatar,
            workspaceId: freshUser.workspaceId,
            department: freshUser.department,
            phone: freshUser.phone,
            allowedViews: freshUser.allowedViews || ['linkhub'],
          };
          setCurrentUser(updatedProfile);
          setAuthSession(updatedProfile);
        }
      }
    });

    const unsubscribeCases = aduanService.subscribe((updatedCases) => {
      setCases(updatedCases);
      setWorkspaces(aduanService.getWorkspaces());
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        aduanService.fetchFromSupabase();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      unsubscribeCases();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Filter cases for current workspace
  const workspaceCases = cases.filter(c => c.workspaceId === currentWorkspace.id || currentWorkspace.id === 'all');

  const handleSelectWorkspace = (ws: Workspace) => {
    setCurrentWorkspace(ws);
    setFilters(prev => ({ ...prev, workspaceId: ws.id }));
  };

  const handleUpdateStatus = async (id: string, newStatus: AduanStatus) => {
    await aduanService.updateCaseStatus(id, newStatus, CURRENT_USER.name);
    if (selectedCase && selectedCase.id === id) {
      setSelectedCase(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleDeleteCase = async (id: string) => {
    try {
      await aduanService.deleteCase(id, currentUser.name || CURRENT_USER.name);
      if (selectedCase && selectedCase.id === id) {
        setSelectedCase(null);
      }
      setRealtimeToast('Rekod kes aduan telah dipadamkan secara kekal.');
      setTimeout(() => setRealtimeToast(null), 3000);
    } catch (e) {
      console.error('Failed to delete case:', e);
    }
  };

  const handleAddNote = async (aduanId: string, noteData: any) => {
    const newNote = await aduanService.addNoteToCase(aduanId, noteData);
    if (selectedCase && selectedCase.id === aduanId) {
      setSelectedCase(prev => prev ? { ...prev, catatan: [newNote, ...(prev.catatan || [])] } : null);
    }
  };

  const handleAddCase = async (newCaseData: any) => {
    const created = await aduanService.addCase(newCaseData);
    setRealtimeToast(`Kes baharu [${created.noRujukan}] berjaya didaftarkan!`);
    setTimeout(() => setRealtimeToast(null), 4000);
    return created;
  };

  const handleSimulateRealtime = () => {
    const sim = aduanService.simulateRealtimeIncoming();
    setRealtimeToast(`⚡ [REALTIME] Kes Baharu Diterima: "${sim.tajuk.substring(0, 30)}..."`);
    setTimeout(() => setRealtimeToast(null), 4000);
  };

  const handleGenerateAiDraftResponse = async (aduan: AduanCase) => {
    try {
      const res = await fetch('/api/ai/draft-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aduanCase: aduan, formatType: 'surat maklum balas rasmi' }),
      });
      const data = await res.json();
      return data.draft || 'Gagal menjana draf AI.';
    } catch (e) {
      console.error('Error generating AI draft:', e);
      return 'Ralat perkhidmatan AI.';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans antialiased relative overflow-hidden">
        {/* Background Ambient Spheres */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Realtime Event Notification Toast */}
        {realtimeToast && (
          <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-fade-in">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{realtimeToast}</span>
          </div>
        )}

        <LoginModal
          isOpen={true}
          onClose={() => {}}
          onLoginSuccess={handleLoginSuccess}
          onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
        />

        <SupabaseModal
          isOpen={isSupabaseOpen}
          onClose={() => setIsSupabaseOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900 transition-colors">
      {/* Realtime Event Notification Toast */}
      {realtimeToast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-bounce">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{realtimeToast}</span>
        </div>
      )}

      {/* Mobile Overlay Backdrop for Sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity animate-fade-in"
        />
      )}

      {/* Left Sidebar matching Clean Minimalism design */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
          }
        }}
        currentWorkspace={currentWorkspace}
        currentUser={currentUser}
        onOpenWorkspaceModal={() => {}}
        onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        isReorderMode={isReorderMode}
        setIsReorderMode={setIsReorderMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navigation Bar */}
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentWorkspace={currentWorkspace}
          workspaces={workspaces}
          onSelectWorkspace={handleSelectWorkspace}
          currentUser={currentUser}
          onOpenQuickAction={() => setIsQuickActionOpen(true)}
          onOpenAiCopilot={() => setIsAiCopilotOpen(true)}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
          onOpenDiagnostics={() => setIsFirebaseDiagnosticsOpen(true)}
          onOpenSettings={() => setActiveTab('settings')}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onSimulateRealtime={handleSimulateRealtime}
          isReorderMode={isReorderMode}
          onToggleReorderMode={() => {
            const nextMode = !isReorderMode;
            setIsReorderMode(nextMode);
            if (nextMode && !isSidebarOpen) {
              setIsSidebarOpen(true);
            }
          }}
        />

        {/* Dynamic Body Content */}
        <main className="p-3 sm:p-5 lg:p-6 flex-1 overflow-y-auto w-full space-y-4 lg:space-y-5">
          {activeTab === 'dashboard' && (
            <>
              {/* Featured Daily Brief Banner */}
              <DailyBriefBanner
                currentUser={currentUser}
                dateRange={dateRange}
                setDateRange={setDateRange}
                onOpenAiCopilot={() => setIsAiCopilotOpen(true)}
                onOpenLaporanView={() => setActiveTab('laporan')}
                onViewBriefSummary={() => setActiveTab('aduan')}
              />

              {/* KPI Cards */}
              <KpiCards cases={workspaceCases} />

              {/* Upcoming Programs Calendar Widget */}
              <DashboardCalendarWidget onOpenCalendar={() => setActiveTab('calendar')} />

              {/* Charts Section */}
              <AduanCharts />

              {/* Quick Table View for Active Complaints */}
              <AduanList
                cases={aduanService.getCases({ ...filters, workspaceId: currentWorkspace.id })}
                filters={filters}
                setFilters={setFilters}
                onSelectCase={(c) => setSelectedCase(c)}
                onUpdateStatus={handleUpdateStatus}
                onOpenNewAduanModal={() => setIsNewAduanOpen(true)}
                onOpenNoteModal={(c) => setSelectedCase(c)}
                onDeleteCase={handleDeleteCase}
              />
            </>
          )}

          {activeTab === 'aduan' && (
            <AduanList
              cases={aduanService.getCases({ ...filters, workspaceId: currentWorkspace.id })}
              filters={filters}
              setFilters={setFilters}
              onSelectCase={(c) => setSelectedCase(c)}
              onUpdateStatus={handleUpdateStatus}
              onOpenNewAduanModal={() => setIsNewAduanOpen(true)}
              onOpenNoteModal={(c) => setSelectedCase(c)}
              onDeleteCase={handleDeleteCase}
            />
          )}

          {activeTab === 'laporan_aduan' && (
            <LaporanAduanView currentUser={currentUser} cases={workspaceCases} />
          )}

          {activeTab === 'kanban' && (
            <AduanKanban
              cases={workspaceCases}
              onSelectCase={(c) => setSelectedCase(c)}
              onUpdateStatus={handleUpdateStatus}
              onOpenNewAduanModal={() => setIsNewAduanOpen(true)}
            />
          )}

          {(activeTab === 'catatan' || activeTab === 'templates') && (
            <CatatanFormatView
              cases={workspaceCases}
              onAddNote={handleAddNote}
              preselectedCaseId={selectedCase?.id}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'linkhub' && (
            <LinkHubView currentUser={currentUser} />
          )}

          {activeTab === 'downloads' && (
            <DownloadCenterView currentUser={currentUser} />
          )}

          {activeTab === 'calendar' && (
            <CalendarView currentUser={currentUser} />
          )}

          {/* Access Control Guard Notice */}
          {!isViewAllowed(activeTab, currentUser) && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-4 my-12">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">Akses Paparan Dihadkan</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Akaun anda ({currentUser?.role || 'Pengguna'}) secara lalai hanya dibenarkan mengakses <strong>Tetapan Akaun</strong> dan <strong>Linkhub</strong>. Sila hubungi Pentadbir Utama jika anda memerlukan akses fungsi tambahan.
              </p>
              <button
                onClick={() => {
                  if (isViewAllowed('linkhub', currentUser)) {
                    setActiveTab('linkhub');
                  } else {
                    setActiveTab('settings');
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Ke Paparan Linkhub
              </button>
            </div>
          )}

          {activeTab === 'admin' && (
            <AdminManagementView
              currentUser={currentUser}
              onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
              onUpdateUserProfile={handleUpdateUserProfile}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onUpdateUserProfile={handleUpdateUserProfile}
              currentWorkspace={currentWorkspace}
            />
          )}
        </main>
      </div>

      {/* Modals & Sliding Drawers */}
      <AduanDetailModal
        aduan={selectedCase}
        onClose={() => setSelectedCase(null)}
        onUpdateStatus={handleUpdateStatus}
        onAddNote={handleAddNote}
        onGenerateAiDraftResponse={handleGenerateAiDraftResponse}
        onDeleteCase={handleDeleteCase}
      />

      <NewAduanModal
        isOpen={isNewAduanOpen}
        onClose={() => setIsNewAduanOpen(false)}
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspace.id}
        onAddCase={handleAddCase}
      />

      <SupabaseModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        onSimulateRealtime={handleSimulateRealtime}
        onOpenDiagnostics={() => {
          setIsSupabaseOpen(false);
          setIsFirebaseDiagnosticsOpen(true);
        }}
      />

      <FirebaseDiagnostics
        isOpen={isFirebaseDiagnosticsOpen}
        onClose={() => setIsFirebaseDiagnosticsOpen(false)}
      />

      <AiCopilotDrawer
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
        cases={cases}
      />

      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        cases={workspaceCases}
        onSelectCase={(c) => setSelectedCase(c)}
      />

      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onOpenNewAduan={() => setIsNewAduanOpen(true)}
        onOpenCatatanFormat={() => setActiveTab('templates')}
        onOpenSupabase={() => setIsSupabaseOpen(true)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
      />
    </div>
  );
}
