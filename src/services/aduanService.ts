import { AduanCase, AduanNote, AduanStatus, Workspace, SupabaseConfig, FilterOptions, ActivityLog } from '../types';
import { INITIAL_ADUAN_CASES, INITIAL_WORKSPACES } from '../data/mockData';
import { getSupabaseClient, getSavedSupabaseConfig } from '../lib/supabase';
import { syncAllUsersToSupabase } from '../lib/auth';

const ADUAN_STORAGE_KEY = 'aduan_workspace_cases_v2';
const WORKSPACE_STORAGE_KEY = 'aduan_workspace_list_v2';
const LOGS_STORAGE_KEY = 'aduan_workspace_logs_v2';

type RealtimeListener = (cases: AduanCase[]) => void;
type ActivityListener = (logs: ActivityLog[]) => void;

class AduanService {
  private cases: AduanCase[] = [];
  private workspaces: Workspace[] = [];
  private activityLogs: ActivityLog[] = [];
  private listeners: Set<RealtimeListener> = new Set();
  private activityListeners: Set<ActivityListener> = new Set();
  private supabaseSubscription: any = null;

  constructor() {
    this.initData();
    this.setupSupabaseSubscription();
  }

  private initData() {
    try {
      const savedCases = localStorage.getItem(ADUAN_STORAGE_KEY);
      if (savedCases) {
        this.cases = JSON.parse(savedCases);
      } else {
        this.cases = INITIAL_ADUAN_CASES;
        this.saveCasesToLocal();
      }

      const savedWorkspaces = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (savedWorkspaces) {
        this.workspaces = JSON.parse(savedWorkspaces);
      } else {
        this.workspaces = INITIAL_WORKSPACES;
        this.saveWorkspacesToLocal();
      }

      const savedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
      if (savedLogs) {
        this.activityLogs = JSON.parse(savedLogs);
      } else {
        this.activityLogs = [
          {
            id: 'log-1',
            aduanId: 'adn-101',
            aduanRujukan: 'ADV-2026-089',
            action: 'Status ditukar kepada Dalam Siasatan',
            userName: 'Ahmad Khairul',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            type: 'status_change',
          },
          {
            id: 'log-2',
            aduanId: 'adn-104',
            aduanRujukan: 'ADV-2026-095',
            action: 'Aduan baharu didaftarkan dalam sistem',
            userName: 'Puan Halimah Abdullah',
            timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
            type: 'aduan_created',
          }
        ];
        this.saveLogsToLocal();
      }
    } catch (e) {
      console.error('Error initializing data in AduanService:', e);
      this.cases = INITIAL_ADUAN_CASES;
      this.workspaces = INITIAL_WORKSPACES;
    }
  }

  private saveCasesToLocal() {
    try {
      localStorage.setItem(ADUAN_STORAGE_KEY, JSON.stringify(this.cases));
    } catch (e) {
      console.error('Error saving cases:', e);
    }
  }

  private saveWorkspacesToLocal() {
    try {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(this.workspaces));
    } catch (e) {
      console.error('Error saving workspaces:', e);
    }
  }

  private saveLogsToLocal() {
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(this.activityLogs.slice(0, 50)));
    } catch (e) {
      console.error('Error saving activity logs:', e);
    }
  }

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    listener(this.getCases());
    return () => this.listeners.delete(listener);
  }

  public subscribeLogs(listener: ActivityListener): () => void {
    this.activityListeners.add(listener);
    listener(this.activityLogs);
    return () => this.activityListeners.delete(listener);
  }

  private notify() {
    this.saveCasesToLocal();
    const currentCases = this.getCases();
    this.listeners.forEach((fn) => fn(currentCases));
  }

  private notifyLogs() {
    this.saveLogsToLocal();
    this.activityListeners.forEach((fn) => fn(this.activityLogs));
  }

  private addLog(aduanId: string | undefined, aduanRujukan: string | undefined, action: string, userName: string, type: ActivityLog['type']) {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      aduanId,
      aduanRujukan,
      action,
      userName,
      timestamp: new Date().toISOString(),
      type,
    };
    this.activityLogs = [newLog, ...this.activityLogs];
    this.notifyLogs();
  }

  private pollingTimer: any = null;

  public setupSupabaseSubscription() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (this.supabaseSubscription) {
      try {
        supabase.removeChannel(this.supabaseSubscription);
      } catch (e) {
        console.warn('Error removing old Supabase channel:', e);
      }
    }

    try {
      const channelName = `aduan_realtime_channel_${Date.now().toString(36)}`;
      this.supabaseSubscription = supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'aduan' }, (payload) => {
          console.log('⚡ [Realtime] Supabase Aduan event:', payload.eventType, payload);
          this.fetchFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'catatan_aduan' }, (payload) => {
          console.log('⚡ [Realtime] Supabase Catatan event:', payload.eventType, payload);
          this.fetchFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces' }, (payload) => {
          console.log('⚡ [Realtime] Supabase Workspaces event:', payload.eventType, payload);
          this.fetchFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
          console.log('⚡ [Realtime] Supabase Users event:', payload.eventType, payload);
          this.fetchFromSupabase();
        })
        .subscribe((status, err) => {
          console.log(`🔌 [Supabase Realtime] Status for ${channelName}:`, status, err || '');
          if (status === 'SUBSCRIBED') {
            this.fetchFromSupabase();
          }
        });
      
      // Immediate initial fetch
      this.fetchFromSupabase();

      // 10-second polling fallback to guarantee state synchronization across all sessions
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
      }
      this.pollingTimer = setInterval(() => {
        this.fetchFromSupabase();
      }, 10000);
    } catch (e) {
      console.error('Supabase subscription error:', e);
    }
  }

  public async syncAllLocalToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, count: 0, error: 'Sistem belum bersambung ke Supabase.' };

    try {
      // 0. Sync Users
      await syncAllUsersToSupabase();

      // 1. Sync Workspaces
      for (const ws of this.workspaces) {
        await supabase.from('workspaces').upsert({
          id: ws.id,
          name: ws.name,
          code: ws.code,
          description: ws.description,
          members_count: ws.membersCount || 1,
          role: ws.role || 'Admin',
        });
      }

      // 2. Sync Cases
      let insertedCount = 0;
      for (const c of this.cases) {
        const { error: aduanErr } = await supabase.from('aduan').upsert({
          id: c.id,
          no_rujukan: c.noRujukan,
          workspace_id: c.workspaceId,
          tajuk: c.tajuk,
          penerangan: c.penerangan,
          kategori: c.kategori,
          prioriti: c.prioriti,
          status: c.status,
          nama_pengadu: c.namaPengadu,
          email_pengadu: c.emailPengadu,
          telefon_pengadu: c.telefonPengadu,
          lokasi: c.lokasi,
          assignee: c.assignee,
          tarikh_aduan: c.tarikhAduan,
          sasaran_sla: c.sasaranSLA,
          tarikh_selesai: c.tarikhSelesai,
          csat_rating: c.csatRating,
          tags: c.tags,
          updated_at: c.updatedAt,
        });

        if (!aduanErr) insertedCount++;

        // Sync Notes for this case
        if (c.catatan && c.catatan.length > 0) {
          for (const note of c.catatan) {
            await supabase.from('catatan_aduan').upsert({
              id: note.id,
              aduan_id: c.id,
              author_name: note.authorName,
              author_role: note.authorRole,
              author_avatar: note.authorAvatar,
              format_type: note.formatType,
              title: note.title,
              content: note.content,
              is_internal: note.isInternal,
              created_at: note.createdAt,
            });
          }
        }
      }

      return { success: true, count: insertedCount };
    } catch (e: any) {
      console.error('Failed syncAllLocalToSupabase:', e);
      return { success: false, count: 0, error: e.message || 'Ralat muat naik ke Supabase.' };
    }
  }

  public async fetchFromSupabase(): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      // 1. Fetch Workspaces to ensure workspace sync
      const { data: wsData, error: wsErr } = await supabase.from('workspaces').select('*');
      if (!wsErr && wsData && wsData.length > 0) {
        this.workspaces = wsData.map((w: any) => ({
          id: w.id,
          name: w.name,
          code: w.code,
          description: w.description || '',
          membersCount: w.members_count || 1,
          role: w.role || 'Admin',
        }));
        this.saveWorkspacesToLocal();
      }

      // 2. Fetch Aduan List
      const { data: aduanList, error: aduanErr } = await supabase
        .from('aduan')
        .select('*')
        .order('updated_at', { ascending: false });

      if (aduanErr) {
        console.warn('Could not fetch from Supabase table aduan:', aduanErr.message);
        return false;
      }

      if (!aduanList) return false;

      if (aduanList.length === 0) {
        // Supabase aduan table is connected but empty. Auto-seed local cases to Supabase!
        console.log('Supabase aduan table is empty. Auto-seeding local cases to Supabase...');
        await this.syncAllLocalToSupabase();
        return true;
      }

      // 3. Fetch Catatan Aduan
      const { data: catatanList } = await supabase
        .from('catatan_aduan')
        .select('*')
        .order('created_at', { ascending: false });

      const notesMap = new Map<string, AduanNote[]>();
      if (catatanList && Array.isArray(catatanList)) {
        catatanList.forEach((c: any) => {
          const aduanId = c.aduan_id || c.aduanId;
          if (!aduanId) return;
          const noteObj: AduanNote = {
            id: c.id,
            aduanId,
            authorName: c.author_name || c.authorName,
            authorRole: c.author_role || c.authorRole,
            authorAvatar: c.author_avatar || c.authorAvatar,
            formatType: c.format_type || c.formatType,
            title: c.title,
            content: c.content,
            isInternal: c.is_internal ?? true,
            createdAt: c.created_at || c.createdAt,
          };
          if (!notesMap.has(aduanId)) {
            notesMap.set(aduanId, []);
          }
          notesMap.get(aduanId)!.push(noteObj);
        });
      }

      this.cases = aduanList.map((item: any) => ({
        id: item.id,
        noRujukan: item.no_rujukan || item.noRujukan,
        workspaceId: item.workspace_id || item.workspaceId || 'ws-integriti',
        tajuk: item.tajuk,
        penerangan: item.penerangan,
        kategori: item.kategori,
        prioriti: item.prioriti,
        status: item.status,
        namaPengadu: item.nama_pengadu || item.namaPengadu,
        emailPengadu: item.email_pengadu || item.emailPengadu,
        telefonPengadu: item.telefon_pengadu || item.telefonPengadu,
        lokasi: item.lokasi,
        assignee: item.assignee,
        tarikhAduan: item.tarikh_aduan || item.tarikhAduan,
        sasaranSLA: item.sasaran_sla || item.sasaranSLA,
        tarikhSelesai: item.tarikh_selesai || item.tarikhSelesai,
        csatRating: item.csat_rating || item.csatRating,
        tags: item.tags || [],
        updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
        catatan: notesMap.get(item.id) || [],
      }));

      this.notify();
      return true;
    } catch (e) {
      console.error('Error fetching from Supabase:', e);
    }
    return false;
  }

  public getCases(filters?: FilterOptions): AduanCase[] {
    let result = [...this.cases];

    if (!filters) return result;

    if (filters.workspaceId && filters.workspaceId !== 'all') {
      result = result.filter(c => c.workspaceId === filters.workspaceId);
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'Belum Selesai') {
        result = result.filter(c => c.status !== 'Selesai' && c.status !== 'Ditolak');
      } else {
        result = result.filter(c => c.status === filters.status);
      }
    }

    if (filters.priority && filters.priority !== 'all') {
      result = result.filter(c => c.prioriti === filters.priority);
    }

    if (filters.category && filters.category !== 'all') {
      result = result.filter(c => c.kategori === filters.category);
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        c.noRujukan.toLowerCase().includes(q) ||
        c.tajuk.toLowerCase().includes(q) ||
        c.namaPengadu.toLowerCase().includes(q) ||
        c.penerangan.toLowerCase().includes(q) ||
        c.assignee.toLowerCase().includes(q)
      );
    }

    if (filters.onlyOverdue) {
      const now = new Date();
      result = result.filter(c => c.status !== 'Selesai' && c.status !== 'Ditolak' && new Date(c.sasaranSLA) < now);
    }

    return result;
  }

  public getCaseById(id: string): AduanCase | undefined {
    return this.cases.find(c => c.id === id);
  }

  public getWorkspaces(): Workspace[] {
    return this.workspaces;
  }

  public getActivityLogs(): ActivityLog[] {
    return this.activityLogs;
  }

  public async addCase(newCase: Omit<AduanCase, 'id' | 'noRujukan' | 'catatan' | 'updatedAt'>): Promise<AduanCase> {
    const count = this.cases.length + 101;
    const created: AduanCase = {
      ...newCase,
      id: `adn-${Date.now()}`,
      noRujukan: `ADV-2026-${String(count).padStart(3, '0')}`,
      catatan: [],
      updatedAt: new Date().toISOString(),
    };

    this.cases = [created, ...this.cases];
    this.addLog(created.id, created.noRujukan, `Kes aduan baharu dicipta: "${created.tajuk}"`, 'Sarah Adams', 'aduan_created');
    this.notify();

    // Sync to Supabase if client active
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('aduan').insert({
          id: created.id,
          no_rujukan: created.noRujukan,
          workspace_id: created.workspaceId,
          tajuk: created.tajuk,
          penerangan: created.penerangan,
          kategori: created.kategori,
          prioriti: created.prioriti,
          status: created.status,
          nama_pengadu: created.namaPengadu,
          email_pengadu: created.emailPengadu,
          telefon_pengadu: created.telefonPengadu,
          lokasi: created.lokasi,
          assignee: created.assignee,
          tarikh_aduan: created.tarikhAduan,
          sasaran_sla: created.sasaranSLA,
          tags: created.tags,
          updated_at: created.updatedAt,
        });

        if (error) {
          console.error('Supabase insert aduan error:', error.message);
          await supabase.from('aduan').upsert({
            id: created.id,
            no_rujukan: created.noRujukan,
            workspace_id: created.workspaceId,
            tajuk: created.tajuk,
            penerangan: created.penerangan,
            kategori: created.kategori,
            prioriti: created.prioriti,
            status: created.status,
            nama_pengadu: created.namaPengadu,
            email_pengadu: created.emailPengadu,
            telefon_pengadu: created.telefonPengadu,
            lokasi: created.lokasi,
            assignee: created.assignee,
            tarikh_aduan: created.tarikhAduan,
            sasaran_sla: created.sasaranSLA,
            tags: created.tags,
            updated_at: created.updatedAt,
          });
        }
      } catch (e) {
        console.error('Failed to sync new case to Supabase:', e);
      }
    }

    return created;
  }

  public async updateCaseStatus(id: string, newStatus: AduanStatus, authorName: string = 'Sarah Adams'): Promise<void> {
    const caseIndex = this.cases.findIndex(c => c.id === id);
    if (caseIndex === -1) return;

    const oldStatus = this.cases[caseIndex].status;
    if (oldStatus === newStatus) return;

    const now = new Date().toISOString();
    const updatedCase = {
      ...this.cases[caseIndex],
      status: newStatus,
      updatedAt: now,
      tarikhSelesai: newStatus === 'Selesai' ? now : this.cases[caseIndex].tarikhSelesai,
    };

    this.cases[caseIndex] = updatedCase;
    this.addLog(id, updatedCase.noRujukan, `Status ditukar daripada "${oldStatus}" kepada "${newStatus}"`, authorName, 'status_change');
    this.notify();

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('aduan').update({
          status: newStatus,
          updated_at: now,
          tarikh_selesai: updatedCase.tarikhSelesai,
        }).eq('id', id);

        if (error) {
          console.error('Supabase update status error:', error.message);
        }
      } catch (e) {
        console.error('Failed to sync status update to Supabase:', e);
      }
    }
  }

  public async deleteCase(id: string, authorName: string = 'Sarah Adams'): Promise<void> {
    const targetCase = this.cases.find(c => c.id === id);
    if (!targetCase) return;

    this.cases = this.cases.filter(c => c.id !== id);
    this.addLog(id, targetCase.noRujukan, `Kes aduan [${targetCase.noRujukan}] telah dipadamkan secara kekal.`, authorName, 'status_change');
    this.notify();

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error: noteErr } = await supabase.from('catatan_aduan').delete().eq('aduan_id', id);
        if (noteErr) console.error('Supabase delete notes error:', noteErr.message);

        const { error: aduanErr } = await supabase.from('aduan').delete().eq('id', id);
        if (aduanErr) console.error('Supabase delete aduan error:', aduanErr.message);
      } catch (e) {
        console.error('Failed to delete case from Supabase:', e);
      }
    }
  }

  public async addNoteToCase(aduanId: string, noteData: Omit<AduanNote, 'id' | 'aduanId' | 'createdAt'>): Promise<AduanNote> {
    const caseIndex = this.cases.findIndex(c => c.id === aduanId);
    if (caseIndex === -1) throw new Error('Kes aduan tidak dijumpai');

    const newNote: AduanNote = {
      ...noteData,
      id: `note-${Date.now()}`,
      aduanId,
      createdAt: new Date().toISOString(),
    };

    const targetCase = this.cases[caseIndex];
    targetCase.catatan = [newNote, ...(targetCase.catatan || [])];
    targetCase.updatedAt = new Date().toISOString();

    this.addLog(aduanId, targetCase.noRujukan, `Catatan baharu ditambah: "${newNote.title}"`, newNote.authorName, 'note_added');
    this.notify();

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('catatan_aduan').insert({
          id: newNote.id,
          aduan_id: aduanId,
          author_name: newNote.authorName,
          author_role: newNote.authorRole,
          author_avatar: newNote.authorAvatar,
          format_type: newNote.formatType,
          title: newNote.title,
          content: newNote.content,
          is_internal: newNote.isInternal,
          created_at: newNote.createdAt,
        });

        if (error) {
          console.error('Supabase insert note error:', error.message);
        }

        await supabase.from('aduan').update({ updated_at: targetCase.updatedAt }).eq('id', aduanId);
      } catch (e) {
        console.error('Failed to sync note to Supabase:', e);
      }
    }

    return newNote;
  }

  public async createWorkspace(name: string, code: string, description: string): Promise<Workspace> {
    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name,
      code,
      description,
      membersCount: 1,
      role: 'Admin',
    };
    this.workspaces.push(newWs);
    this.saveWorkspacesToLocal();

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('workspaces').insert({
          id: newWs.id,
          name: newWs.name,
          code: newWs.code,
          description: newWs.description,
          members_count: newWs.membersCount,
          role: newWs.role,
        });
      } catch (e) {
        console.error('Failed to create workspace in Supabase:', e);
      }
    }

    return newWs;
  }

  // Simulate a live incoming aduan event for testing real-time capabilities
  public simulateRealtimeIncoming(): AduanCase {
    const sampleTitles = [
      'Lampu Jalan Utama Terpadam di Presint 8',
      'Masalah Bau Longkang Awam Tepi Pasar',
      'Isu Salur Air Paip Bocor di Foyer Utama',
      'Penyampaian Kad Pengenalan Terlalu Lambat',
    ];
    const sampleCategories = [
      'Infrastruktur & Bangunan',
      'Perkhidmatan & Layanan',
      'IT & Sistem',
    ] as const;

    const randomTitle = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
    const randomCat = sampleCategories[Math.floor(Math.random() * sampleCategories.length)];
    
    const count = this.cases.length + 105;
    const now = new Date();
    const slaTarget = new Date(now.getTime() + 86400000 * 3);

    const simulated: AduanCase = {
      id: `adn-sim-${Date.now()}`,
      noRujukan: `ADV-2026-${String(count).padStart(3, '0')}`,
      workspaceId: 'ws-integriti',
      tajuk: randomTitle,
      penerangan: 'Aduan ini diterima secara automatik melalui Saluran Awam Realtime Workspace.',
      kategori: randomCat,
      prioriti: 'Sederhana',
      status: 'Belum Disahkan',
      namaPengadu: 'Pengadu Awam Realtime',
      emailPengadu: 'pengadu.realtime@awam.gov.my',
      telefonPengadu: '012-9988776',
      assignee: 'Sarah Adams',
      tarikhAduan: now.toISOString(),
      sasaranSLA: slaTarget.toISOString(),
      tags: ['Realtime', 'Simulasi'],
      updatedAt: now.toISOString(),
      catatan: [],
    };

    this.cases = [simulated, ...this.cases];
    this.addLog(simulated.id, simulated.noRujukan, `(REALTIME) Aduan baharu diterima daripada sistem luar`, 'Sistem Realtime', 'aduan_created');
    this.notify();
    return simulated;
  }
}

export const aduanService = new AduanService();
