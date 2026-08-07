import { AduanCase, AduanNote, AduanStatus, Workspace, FilterOptions, ActivityLog } from '../types';
import { INITIAL_ADUAN_CASES, INITIAL_WORKSPACES } from '../data/mockData';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { syncAllUsersToSupabase } from '../lib/auth';

const ADUAN_STORAGE_KEY = 'aduan_workspace_cases_v2';
const WORKSPACE_STORAGE_KEY = 'aduan_workspace_list_v2';
const LOGS_STORAGE_KEY = 'aduan_workspace_logs_v2';

type RealtimeListener = (cases: AduanCase[]) => void;
type ActivityListener = (logs: ActivityLog[]) => void;
export type DiagnosticLog = { id: string; timestamp: string; level: 'info' | 'success' | 'warn' | 'error'; message: string };
type DiagnosticListener = (logs: DiagnosticLog[]) => void;

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

  public subscribeDiagnosticLogs(listener: DiagnosticListener): () => void {
    this.diagnosticListeners.add(listener);
    listener(this.getDiagnosticLogs());
    return () => this.diagnosticListeners.delete(listener);
  }

  public getDiagnosticLogs(): DiagnosticLog[] {
    return [...this.diagnosticLogs];
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
        (snapshot) => {
          const fromCache = snapshot.metadata.hasPendingWrites;
          if (!snapshot.empty) {
            const loadedCases: AduanCase[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as AduanCase;
              loadedCases.push(data);
            });

            // Maintain order by updatedAt descending
            loadedCases.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

            this.cases = loadedCases;
            this.notify();
            this.addDiagnosticLog('success', `onSnapshot('aduan'): Received ${loadedCases.length} documents (pendingWrites: ${fromCache})`);
          } else {
            this.addDiagnosticLog('warn', "onSnapshot('aduan'): Firestore collection empty. Auto-seeding initial cases...");
            // If Firestore is empty, seed initial cases
            this.seedAllLocalToFirebase();
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
        snap.forEach(d => loadedCases.push(d.data() as AduanCase));
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

    if (db) {
      try {
        await setDoc(doc(db, 'aduan', created.id), created);
      } catch (e) {
        console.error('Failed to sync new case to Firebase:', e);
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
      id: `note-${Date.now()}`,
      aduanId,
      createdAt: new Date().toISOString(),
    };

    const targetCase = this.cases[caseIndex];
    targetCase.catatan = [newNote, ...(targetCase.catatan || [])];
    targetCase.updatedAt = new Date().toISOString();

    this.addLog(aduanId, targetCase.noRujukan, `Catatan baharu ditambah: "${newNote.title}"`, newNote.authorName, 'note_added');
    this.notify();

    if (db) {
      try {
        await setDoc(doc(db, 'aduan', aduanId), targetCase, { merge: true });
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

    if (db) {
      setDoc(doc(db, 'aduan', simulated.id), simulated).catch(err => console.error('Simulate Firestore sync failed:', err));
    }

    return simulated;
  }
}

export const aduanService = new AduanService();
