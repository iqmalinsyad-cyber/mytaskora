import { AduanCase, AduanNote, AduanStatus, Workspace, FilterOptions, ActivityLog, SumberAduan, TindakanAduan, SyorBantuan } from '../types';
import { INITIAL_ADUAN_CASES, INITIAL_WORKSPACES } from '../data/mockData';
import { db, isSystemSeeded, markSystemAsSeeded } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { syncAllUsersToSupabase } from '../lib/auth';

const ADUAN_STORAGE_KEY = 'aduan_workspace_cases_v3';
const WORKSPACE_STORAGE_KEY = 'aduan_workspace_list_v2';
const LOGS_STORAGE_KEY = 'aduan_workspace_logs_v2';

type RealtimeListener = (cases: AduanCase[]) => void;
type ActivityListener = (logs: ActivityLog[]) => void;
export type DiagnosticLog = { id: string; timestamp: string; level: 'info' | 'success' | 'warn' | 'error'; message: string };
type DiagnosticListener = (logs: DiagnosticLog[]) => void;

export function sanitizeAduanCase(raw: any): AduanCase {
  const normalizedStatus: AduanStatus = 
    raw.status === 'Belum Disahkan' ? 'Belum Selesai' :
    raw.status === 'Perlu Maklumat' ? 'Perlu Maklumat (KIV)' :
    (raw.status || 'Belum Selesai');

  const validSumber: SumberAduan[] = ['CMU', 'Aduan Awam', 'Parlimen', 'Adun', 'HQ', 'MAIS', 'JAIS'];
  const normalizedSumber: SumberAduan = validSumber.includes(raw.sumberAduan) ? raw.sumberAduan : 'Aduan Awam';

  const validTindakan: TindakanAduan[] = ['Telah Diproses', 'KIV', 'Belum Di Proses'];
  const normalizedTindakan: TindakanAduan = validTindakan.includes(raw.tindakan) ? raw.tindakan : 'Belum Di Proses';

  const validSyor: SyorBantuan[] = ['Ada', 'Tiada'];
  const normalizedSyor: SyorBantuan = validSyor.includes(raw.syorBantuan) ? raw.syorBantuan : 'Tiada';

  return {
    id: raw.id || `adn-${Date.now()}`,
    noRujukan: raw.noRujukan || 'ADV-2026-001',
    namaPengadu: raw.namaPengadu || raw.tajuk || 'Pengadu',
    telefonPengadu: raw.telefonPengadu || raw.phone || '012-3456789',
    alamat: raw.alamat || raw.lokasi || 'Tiada Maklumat Alamat',
    sumberAduan: normalizedSumber,
    catatanKes: raw.catatanKes ?? raw.penerangan ?? '',
    status: normalizedStatus,
    gambarSiasatan: Array.isArray(raw.gambarSiasatan) ? raw.gambarSiasatan : [],
    tindakan: normalizedTindakan,
    syorBantuan: normalizedSyor,
    workspaceId: raw.workspaceId || 'ws-integriti',
    tajuk: raw.tajuk || raw.namaPengadu || 'Kes Aduan',
    penerangan: raw.penerangan || raw.catatanKes || '',
    kategori: raw.kategori || 'Infrastruktur & Bangunan',
    prioriti: raw.prioriti || 'Sederhana',
    emailPengadu: raw.emailPengadu || 'pengadu@awam.gov.my',
    lokasi: raw.lokasi || raw.alamat || '',
    assignee: raw.assignee || 'Sarah Adams',
    assigneeRole: raw.assigneeRole || 'Pegawai Aduan',
    assigneeAvatar: raw.assigneeAvatar || 'https://api.dicebear.com/7.x/personas/svg?seed=Aisha&clothingColor=3b82f6&hair=hijab',
    tarikhAduan: raw.tarikhAduan || new Date().toISOString(),
    sasaranSLA: raw.sasaranSLA,
    tarikhSelesai: raw.tarikhSelesai,
    csatRating: raw.csatRating,
    catatan: Array.isArray(raw.catatan) ? raw.catatan : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

class AduanService {
  private cases: AduanCase[] = [];
  private workspaces: Workspace[] = [];
  private activityLogs: ActivityLog[] = [];
  private diagnosticLogs: DiagnosticLog[] = [];
  private listeners: Set<RealtimeListener> = new Set();
  private activityListeners: Set<ActivityListener> = new Set();
  private diagnosticListeners: Set<DiagnosticListener> = new Set();
  private isFirebaseSubscribed = false;

  constructor() {
    this.initData();
    this.setupFirebaseSubscription();
  }

  private initData() {
    try {
      const savedCases = localStorage.getItem(ADUAN_STORAGE_KEY) || localStorage.getItem('aduan_workspace_cases_v2');
      if (savedCases) {
        const parsed = JSON.parse(savedCases);
        this.cases = Array.isArray(parsed) ? parsed.map(sanitizeAduanCase) : INITIAL_ADUAN_CASES;
      } else {
        this.cases = INITIAL_ADUAN_CASES.map(sanitizeAduanCase);
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
      this.cases = INITIAL_ADUAN_CASES.map(sanitizeAduanCase);
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

  public subscribeDiagnosticLogs(listener: DiagnosticListener): () => void {
    this.diagnosticListeners.add(listener);
    listener(this.getDiagnosticLogs());
    return () => this.diagnosticListeners.delete(listener);
  }

  public getDiagnosticLogs(): DiagnosticLog[] {
    return [...this.diagnosticLogs];
  }

  public getIsFirebaseSubscribed(): boolean {
    return this.isFirebaseSubscribed;
  }

  public addDiagnosticLog(level: DiagnosticLog['level'], message: string) {
    const log: DiagnosticLog = {
      id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('ms-MY', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level,
      message,
    };
    this.diagnosticLogs = [log, ...this.diagnosticLogs].slice(0, 50);
    this.diagnosticListeners.forEach((fn) => fn(this.diagnosticLogs));
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

    if (db) {
      setDoc(doc(db, 'activity_logs', newLog.id), newLog).catch(err => console.error('Failed sync log to Firestore:', err));
    }
  }

  public setupSupabaseSubscription() {
    this.setupFirebaseSubscription();
  }

  public setupFirebaseSubscription() {
    if (!db) {
      this.addDiagnosticLog('error', 'Firestore instance (db) is null. Re-check firebase-applet-config.json');
      return;
    }
    if (this.isFirebaseSubscribed) return;
    this.isFirebaseSubscribed = true;

    this.addDiagnosticLog('info', 'Subscribing to Firestore onSnapshot realtime listeners...');

    try {
      // 1. Aduan collection snapshot listener
      onSnapshot(
        collection(db, 'aduan'),
        async (snapshot) => {
          const fromCache = snapshot.metadata.hasPendingWrites;
          if (!snapshot.empty) {
            const loadedCases: AduanCase[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              loadedCases.push(sanitizeAduanCase(data));
            });

            // Maintain order by updatedAt descending
            loadedCases.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

            this.cases = loadedCases;
            this.notify();
            this.addDiagnosticLog('success', `onSnapshot('aduan'): Received ${loadedCases.length} documents (pendingWrites: ${fromCache})`);
          } else {
            const seeded = await isSystemSeeded();
            if (!seeded) {
              await markSystemAsSeeded();
              this.addDiagnosticLog('warn', "onSnapshot('aduan'): Firestore DB unseeded. First-time seeding...");
              await this.seedAllLocalToFirebase();
            } else {
              this.cases = [];
              this.notify();
              this.addDiagnosticLog('info', "onSnapshot('aduan'): Collection is empty (documents deleted).");
            }
          }
        },
        (error) => {
          console.error('🔥 Error listening to Firestore aduan collection:', error);
          this.addDiagnosticLog('error', `onSnapshot('aduan') error: ${error.message}`);
          this.isFirebaseSubscribed = false;
        }
      );

      // 2. Workspaces collection listener
      onSnapshot(
        collection(db, 'workspaces'),
        (snapshot) => {
          if (!snapshot.empty) {
            const loadedWs: Workspace[] = [];
            snapshot.forEach((docSnap) => {
              loadedWs.push(docSnap.data() as Workspace);
            });
            this.workspaces = loadedWs;
            this.saveWorkspacesToLocal();
            this.addDiagnosticLog('success', `onSnapshot('workspaces'): Received ${loadedWs.length} workspaces`);
          }
        },
        (error) => {
          console.error('🔥 Error listening to Firestore workspaces collection:', error);
          this.addDiagnosticLog('error', `onSnapshot('workspaces') error: ${error.message}`);
        }
      );

      // 3. Activity logs collection listener
      onSnapshot(
        collection(db, 'activity_logs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const loadedLogs: ActivityLog[] = [];
            snapshot.forEach((docSnap) => {
              loadedLogs.push(docSnap.data() as ActivityLog);
            });
            loadedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            this.activityLogs = loadedLogs;
            this.notifyLogs();
            this.addDiagnosticLog('success', `onSnapshot('activity_logs'): Received ${loadedLogs.length} activity logs`);
          }
        },
        (error) => {
          console.error('🔥 Error listening to Firestore activity_logs collection:', error);
          this.addDiagnosticLog('error', `onSnapshot('activity_logs') error: ${error.message}`);
        }
      );

      console.log('🔥 Firebase Realtime Cloud Listeners Active!');
    } catch (e: any) {
      console.error('Firebase setup subscription error:', e);
      this.addDiagnosticLog('error', `setupFirebaseSubscription exception: ${e?.message || e}`);
    }
  }

  public async seedAllLocalToFirebase(): Promise<void> {
    if (!db) return;
    try {
      await markSystemAsSeeded();
      // Seed Cases
      for (const c of this.cases) {
        await setDoc(doc(db, 'aduan', c.id), c);
      }
      // Seed Workspaces
      for (const w of this.workspaces) {
        await setDoc(doc(db, 'workspaces', w.id), w);
      }
      // Seed Logs
      for (const l of this.activityLogs) {
        await setDoc(doc(db, 'activity_logs', l.id), l);
      }
      // Seed Users
      await syncAllUsersToSupabase();
    } catch (e) {
      console.error('Failed seeding to Firebase:', e);
    }
  }

  public async syncAllLocalToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
    if (!db) return { success: false, count: 0, error: 'Firebase Firestore tidak tersedia.' };
    try {
      await this.seedAllLocalToFirebase();
      return { success: true, count: this.cases.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e?.message || 'Ralat muat naik ke Firebase.' };
    }
  }

  public async fetchFromSupabase(): Promise<boolean> {
    if (!db) return false;
    try {
      const snap = await getDocs(collection(db, 'aduan'));
      if (!snap.empty) {
        const loadedCases: AduanCase[] = [];
        snap.forEach(d => loadedCases.push(sanitizeAduanCase(d.data())));
        loadedCases.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        this.cases = loadedCases;
        this.notify();
        return true;
      }
    } catch (e) {
      console.error('Failed fetchFromSupabase:', e);
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
        result = result.filter(c => c.status === 'Belum Selesai' || c.status === 'Belum Disahkan');
      } else if (filters.status === 'Perlu Maklumat (KIV)') {
        result = result.filter(c => c.status === 'Perlu Maklumat (KIV)' || c.status === 'Perlu Maklumat');
      } else {
        result = result.filter(c => c.status === filters.status);
      }
    }

    if (filters.sumberAduan && filters.sumberAduan !== 'all') {
      result = result.filter(c => c.sumberAduan === filters.sumberAduan);
    }

    if (filters.tindakan && filters.tindakan !== 'all') {
      result = result.filter(c => c.tindakan === filters.tindakan);
    }

    if (filters.syorBantuan && filters.syorBantuan !== 'all') {
      result = result.filter(c => c.syorBantuan === filters.syorBantuan);
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
        (c.noRujukan && c.noRujukan.toLowerCase().includes(q)) ||
        (c.namaPengadu && c.namaPengadu.toLowerCase().includes(q)) ||
        (c.telefonPengadu && c.telefonPengadu.toLowerCase().includes(q)) ||
        (c.alamat && c.alamat.toLowerCase().includes(q)) ||
        (c.catatanKes && c.catatanKes.toLowerCase().includes(q)) ||
        (c.sumberAduan && c.sumberAduan.toLowerCase().includes(q)) ||
        (c.tajuk && c.tajuk.toLowerCase().includes(q))
      );
    }

    if (filters.onlyOverdue) {
      result = result.filter(c => c.status !== 'Selesai' && c.status !== 'Ditolak');
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

  public async addCase(newCase: Omit<AduanCase, 'id' | 'catatan' | 'updatedAt'> & { id?: string; noRujukan?: string }): Promise<AduanCase> {
    const count = this.cases.length + 101;
    const generatedNoRujukan = newCase.noRujukan?.trim() || `ADV-2026-${String(count).padStart(3, '0')}`;
    
    const created: AduanCase = sanitizeAduanCase({
      ...newCase,
      id: newCase.id || `adn-${Date.now()}`,
      noRujukan: generatedNoRujukan,
      catatan: [],
      updatedAt: new Date().toISOString(),
    });

    this.cases = [created, ...this.cases];
    this.addLog(created.id, created.noRujukan, `Kes aduan baharu didaftarkan: "${created.namaPengadu}" [${created.sumberAduan}]`, 'Sarah Adams', 'aduan_created');
    this.notify();

    if (db) {
      try {
        await setDoc(doc(db, 'aduan', created.id), created);
      } catch (e) {
        console.error('Failed to sync new case to Firebase:', e);
      }
    }

    return created;
  }

  public async updateCase(updatedData: Partial<AduanCase> & { id: string }, authorName: string = 'Sarah Adams'): Promise<AduanCase> {
    const caseIndex = this.cases.findIndex(c => c.id === updatedData.id);
    if (caseIndex === -1) throw new Error('Kes aduan tidak dijumpai');

    const oldCase = this.cases[caseIndex];
    const now = new Date().toISOString();
    
    const merged = sanitizeAduanCase({
      ...oldCase,
      ...updatedData,
      updatedAt: now,
      tarikhSelesai: updatedData.status === 'Selesai' ? (oldCase.tarikhSelesai || now) : (updatedData.status === 'Ditolak' ? (oldCase.tarikhSelesai || now) : undefined),
    });

    this.cases[caseIndex] = merged;
    this.addLog(merged.id, merged.noRujukan, `Maklumat kes aduan telah dikemaskini oleh ${authorName}`, authorName, 'status_change');
    this.notify();

    if (db) {
      try {
        await setDoc(doc(db, 'aduan', merged.id), merged, { merge: true });
      } catch (e) {
        console.error('Failed to sync updated case to Firebase:', e);
      }
    }

    return merged;
  }

  public async updateCaseStatus(id: string, newStatus: AduanStatus, authorName: string = 'Sarah Adams'): Promise<void> {
    const caseIndex = this.cases.findIndex(c => c.id === id);
    if (caseIndex === -1) return;

    const oldStatus = this.cases[caseIndex].status;
    if (oldStatus === newStatus) return;

    const now = new Date().toISOString();
    const updatedCase: AduanCase = {
      ...this.cases[caseIndex],
      status: newStatus,
      updatedAt: now,
      tarikhSelesai: (newStatus === 'Selesai' || newStatus === 'Ditolak') ? now : undefined,
    };

    this.cases[caseIndex] = updatedCase;
    this.addLog(id, updatedCase.noRujukan, `Status ditukar daripada "${oldStatus}" kepada "${newStatus}"`, authorName, 'status_change');
    this.notify();

    if (db) {
      try {
        await setDoc(doc(db, 'aduan', id), updatedCase, { merge: true });
      } catch (e) {
        console.error('Failed to sync status update to Firebase:', e);
      }
    }
  }

  public async deleteCase(id: string, authorName: string = 'Sarah Adams'): Promise<void> {
    const targetCase = this.cases.find(c => c.id === id);
    if (!targetCase) return;

    this.cases = this.cases.filter(c => c.id !== id);
    this.addLog(id, targetCase.noRujukan, `Kes aduan [${targetCase.noRujukan}] telah dipadamkan secara kekal.`, authorName, 'status_change');
    this.notify();

    if (db) {
      try {
        await deleteDoc(doc(db, 'aduan', id));
      } catch (e) {
        console.error('Failed to delete case from Firebase:', e);
      }
    }
  }

  public async addNoteToCase(aduanId: string, noteData: Omit<AduanNote, 'id' | 'aduanId' | 'createdAt'>): Promise<AduanNote> {
    const caseIndex = this.cases.findIndex(c => c.id === aduanId);
    if (caseIndex === -1) throw new Error('Kes aduan tidak dijumpai');

    const newNote: AduanNote = {
      ...noteData,
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      aduanId,
      createdAt: new Date().toISOString(),
    };

    const targetCase = this.cases[caseIndex];
    const existingNotes = (targetCase.catatan || []).filter(n => n.id !== newNote.id);
    const updatedCase: AduanCase = {
      ...targetCase,
      catatan: [newNote, ...existingNotes],
      updatedAt: new Date().toISOString(),
    };

    this.cases[caseIndex] = updatedCase;
    this.addLog(aduanId, targetCase.noRujukan, `Catatan baharu ditambah: "${newNote.title}"`, newNote.authorName, 'note_added');
    this.notify();

    if (db) {
      try {
        await setDoc(doc(db, 'aduan', aduanId), updatedCase, { merge: true });
      } catch (e) {
        console.error('Failed to sync note to Firebase:', e);
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

    if (db) {
      try {
        await setDoc(doc(db, 'workspaces', newWs.id), newWs);
      } catch (e) {
        console.error('Failed to create workspace in Firebase:', e);
      }
    }

    return newWs;
  }

  // Simulate a live incoming aduan event for testing real-time capabilities
  public simulateRealtimeIncoming(): AduanCase {
    const sampleNames = [
      'Mohd Faizul bin Ramli',
      'Puan Noraini Zakaria',
      'Encik Sivakumar a/l Ramasamy',
      'Cik Nurul Izzati Mansor',
    ];
    const sampleSumber: SumberAduan[] = ['Aduan Awam', 'CMU', 'Parlimen', 'Adun', 'HQ'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomSumber = sampleSumber[Math.floor(Math.random() * sampleSumber.length)];
    
    const count = this.cases.length + 105;
    const now = new Date();

    const simulated: AduanCase = sanitizeAduanCase({
      id: `adn-sim-${Date.now()}`,
      noRujukan: `ADV-2026-${String(count).padStart(3, '0')}`,
      workspaceId: 'ws-integriti',
      namaPengadu: randomName,
      telefonPengadu: '012-9988776',
      alamat: 'No. 22, Jalan Gemilang 4, Presint 9, Putrajaya',
      sumberAduan: randomSumber,
      catatanKes: 'Aduan ini diterima secara automatik melalui Saluran Awam Realtime Workspace.',
      status: 'Belum Selesai',
      gambarSiasatan: [],
      tindakan: 'Belum Di Proses',
      syorBantuan: 'Ada',
      tarikhAduan: now.toISOString(),
      updatedAt: now.toISOString(),
      catatan: [],
    });

    this.cases = [simulated, ...this.cases];
    this.addLog(simulated.id, simulated.noRujukan, `(REALTIME) Aduan baharu diterima daripada ${simulated.sumberAduan}`, 'Sistem Realtime', 'aduan_created');
    this.notify();

    if (db) {
      setDoc(doc(db, 'aduan', simulated.id), simulated).catch(err => console.error('Simulate Firestore sync failed:', err));
    }

    return simulated;
  }
}

export const aduanService = new AduanService();
