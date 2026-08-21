import { db, isSystemSeeded, markSystemAsSeeded } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { TaskItem, TaskStatus, TaskDurationChoice, TaskDurationPeriod } from '../types';

const TASKS_STORAGE_KEY = 'WORKSPACE_TASKS_ITEMS_V1';
const DELETED_TASKS_KEY = 'WORKSPACE_DELETED_TASKS_IDS_V1';

/**
 * Strips all undefined fields and ensures safe JSON-serializable structure for Firestore setDoc.
 */
export function cleanForFirestore<T>(data: T): any {
  if (data === null || data === undefined) {
    return null;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item));
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(data as any)) {
      const val = (data as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }
    }
    return cleaned;
  }
  return data;
}

export const DURATION_OPTIONS: TaskDurationPeriod[] = [
  '1 Hari',
  '2 Hari',
  '3 Hari',
  '4 Hari',
  '5 Hari',
  '1 Minggu',
  '2 Minggu',
  '3 Minggu',
  '1 Bulan',
  '2 Bulan',
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-001',
    namaTask: 'Siasatan Lapangan Aduan Awam (Seksyen 7)',
    adaTempoh: 'Ada',
    tempoh: '3 Hari',
    status: 'Dalam Proses',
    keterangan: 'Lakukan lawatan tapak bersama pegawai teknikal untuk menyemak isu kerosakan lampu jalan dan perparitan.',
    catatan: 'Perlu dapatkan surat kebenaran siasatan sebelum turun ke lokasi.',
    tarikhDicipta: new Date(Date.now() - 86400000 * 2).toISOString(),
    tarikhKemaskini: new Date(Date.now() - 86400000 * 1).toISOString(),
    createdBy: 'Sarah Adams',
    creatorAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Aisha&clothingColor=3b82f6&hair=hijab',
    workspaceId: 'ws-integriti',
  },
  {
    id: 'task-002',
    namaTask: 'Penyediaan Laporan Tindakan Tatatertib & Integriti',
    adaTempoh: 'Ada',
    tempoh: '1 Minggu',
    status: 'Dalam Proses',
    keterangan: 'Sediakan draf laporan penuh berkaitan kes aduan salah laku untuk dibentangkan kepada jawatankuasa pengurusan.',
    catatan: 'Dokumen bukti dari pengadu telah dilampirkan.',
    tarikhDicipta: new Date(Date.now() - 86400000 * 4).toISOString(),
    tarikhKemaskini: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdBy: 'Ahmad Razak',
    creatorAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Razak&clothingColor=10b981',
    workspaceId: 'ws-integriti',
  },
  {
    id: 'task-003',
    namaTask: 'Kemaskini Fail Arkib & Penutupan Kes Aduan',
    adaTempoh: 'Tiada',
    status: 'Selesai',
    keterangan: 'Pastikan kes-kes aduan yang telah selesai diproses diarkibkan dengan lengkap dalam pangkalan data.',
    catatan: 'Semua fail telah disahkan oleh Pentadbir Utama.',
    tarikhDicipta: new Date(Date.now() - 86400000 * 7).toISOString(),
    tarikhKemaskini: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdBy: 'Sarah Adams',
    creatorAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Aisha&clothingColor=3b82f6&hair=hijab',
    workspaceId: 'ws-integriti',
  },
  {
    id: 'task-004',
    namaTask: 'Bengkel Latihan Pengurusan Aduan Zon Timur',
    adaTempoh: 'Ada',
    tempoh: '2 Minggu',
    status: 'Batal',
    keterangan: 'Penganjuran sesi latihan pengendalian aduan untuk zon timur ditangguhkan kerana pertindihan program utama.',
    catatan: 'Dimaklumkan oleh urus setia latihan negeri.',
    tarikhDicipta: new Date(Date.now() - 86400000 * 10).toISOString(),
    tarikhKemaskini: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdBy: 'Nurul Huda',
    creatorAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Huda&clothingColor=ec4899',
    workspaceId: 'ws-integriti',
  },
];

type TasksListener = (tasks: TaskItem[]) => void;

class TaskService {
  private tasks: TaskItem[] = [];
  private deletedTaskIds: Set<string> = new Set();
  private listeners: Set<TasksListener> = new Set();
  private isFirebaseSubscribed = false;
  private isDeletedSubscribed = false;

  constructor() {
    this.initDeletedIds();
    this.initLocal();
    this.setupFirebaseSubscriptions();
  }

  private initDeletedIds() {
    try {
      const saved = localStorage.getItem(DELETED_TASKS_KEY);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          this.deletedTaskIds = new Set(arr);
        }
      }
    } catch (e) {
      console.error('Error loading deleted task IDs:', e);
    }
  }

  private saveDeletedIds() {
    try {
      localStorage.setItem(DELETED_TASKS_KEY, JSON.stringify(Array.from(this.deletedTaskIds)));
    } catch (e) {
      console.error('Error saving deleted task IDs:', e);
    }
  }

  private initLocal() {
    try {
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.tasks = parsed.filter((t) => !this.deletedTaskIds.has(t.id));
        } else {
          this.tasks = INITIAL_TASKS.filter((t) => !this.deletedTaskIds.has(t.id));
        }
      } else {
        this.tasks = INITIAL_TASKS.filter((t) => !this.deletedTaskIds.has(t.id));
      }
    } catch (e) {
      console.error('Error reading tasks from local storage:', e);
      this.tasks = INITIAL_TASKS.filter((t) => !this.deletedTaskIds.has(t.id));
    }
    this.saveLocal();
  }

  private saveLocal() {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(this.tasks));
    } catch (e) {
      console.error('Error saving tasks to local storage:', e);
    }
  }

  private setupFirebaseSubscriptions() {
    this.setupDeletedTasksSubscription();
    this.setupTasksSubscription();
  }

  /**
   * Realtime listener to sync deleted task tombstones across all clients and devices
   */
  private setupDeletedTasksSubscription() {
    if (!db || this.isDeletedSubscribed) return;

    try {
      this.isDeletedSubscribed = true;
      const deletedColRef = collection(db, 'deleted_tasks');

      onSnapshot(
        deletedColRef,
        (snapshot) => {
          if (!snapshot.empty) {
            let changed = false;
            snapshot.forEach((docSnap) => {
              const id = docSnap.id;
              if (!this.deletedTaskIds.has(id)) {
                this.deletedTaskIds.add(id);
                changed = true;
              }
            });

            if (changed) {
              this.saveDeletedIds();
              const beforeCount = this.tasks.length;
              this.tasks = this.tasks.filter((t) => !this.deletedTaskIds.has(t.id));
              if (this.tasks.length !== beforeCount) {
                this.notify();
              }
            }
          }
        },
        (err) => {
          console.warn('Firestore deleted_tasks subscription warning:', err?.message);
        }
      );
    } catch (e) {
      console.warn('Failed to subscribe to deleted_tasks collection:', e);
    }
  }

  /**
   * Realtime listener for active tasks collection in Firestore
   */
  private setupTasksSubscription() {
    if (!db || this.isFirebaseSubscribed) return;

    try {
      this.isFirebaseSubscribed = true;
      const tasksColRef = collection(db, 'tasks');

      onSnapshot(
        tasksColRef,
        async (snapshot) => {
          if (!snapshot.empty) {
            const loadedTasks: TaskItem[] = [];

            snapshot.forEach((docSnap) => {
              // If marked deleted, remove from Firestore active collection and skip
              if (this.deletedTaskIds.has(docSnap.id)) {
                if (db) {
                  deleteDoc(doc(db, 'tasks', docSnap.id)).catch(() => {});
                }
                return;
              }

              const data = docSnap.data();
              const item: TaskItem = {
                id: docSnap.id,
                namaTask: data.namaTask || 'Task Tanpa Nama',
                adaTempoh: data.adaTempoh === 'Ada' ? 'Ada' : 'Tiada',
                tempoh: data.tempoh || undefined,
                status: (['Dalam Proses', 'Batal', 'Selesai'].includes(data.status) ? data.status : 'Dalam Proses') as TaskStatus,
                keterangan: data.keterangan || '',
                catatan: data.catatan || '',
                tarikhDicipta: data.tarikhDicipta || new Date().toISOString(),
                tarikhKemaskini: data.tarikhKemaskini || new Date().toISOString(),
                createdBy: data.createdBy || 'Pengguna Workspace',
                creatorAvatar: data.creatorAvatar || 'https://api.dicebear.com/7.x/personas/svg?seed=TaskUser',
                workspaceId: data.workspaceId || 'ws-integriti',
              };
              loadedTasks.push(item);
            });

            // Sort by tarikhKemaskini descending
            loadedTasks.sort((a, b) => new Date(b.tarikhKemaskini || b.tarikhDicipta || 0).getTime() - new Date(a.tarikhKemaskini || a.tarikhDicipta || 0).getTime());
            this.tasks = loadedTasks;
            this.saveLocal();
            this.notify();
          } else {
            // First time seeding if Firestore is completely pristine
            const seeded = await isSystemSeeded();
            if (!seeded) {
              await markSystemAsSeeded();
              await this.seedAllLocalToFirebase();
            } else {
              // If system was already seeded and snapshot is empty, it means all tasks were deleted!
              this.tasks = [];
              this.saveLocal();
              this.notify();
            }
          }
        },
        (err) => {
          console.warn('Firestore tasks listener warning:', err?.message);
        }
      );
    } catch (e) {
      console.warn('Failed to subscribe to Firestore tasks:', e);
    }
  }

  public async seedAllLocalToFirebase() {
    if (!db) return;
    try {
      for (const t of this.tasks) {
        if (!this.deletedTaskIds.has(t.id)) {
          await setDoc(doc(db, 'tasks', t.id), cleanForFirestore(t));
        }
      }
      console.log('Seeded initial tasks collection to Firestore successfully.');
    } catch (e) {
      console.error('Error seeding tasks to Firestore:', e);
    }
  }

  public subscribe(listener: TasksListener): () => void {
    this.listeners.add(listener);
    listener([...this.tasks]);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.saveLocal();
    const current = [...this.tasks];
    this.listeners.forEach((fn) => fn(current));
  }

  public getTasks(filter?: { status?: string; searchQuery?: string; workspaceId?: string }): TaskItem[] {
    let result = [...this.tasks];

    if (filter?.workspaceId && filter.workspaceId !== 'all') {
      result = result.filter((t) => !t.workspaceId || t.workspaceId === filter.workspaceId);
    }

    if (filter?.status && filter.status !== 'all') {
      result = result.filter((t) => t.status === filter.status);
    }

    if (filter?.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.namaTask.toLowerCase().includes(q) ||
          t.keterangan.toLowerCase().includes(q) ||
          (t.catatan && t.catatan.toLowerCase().includes(q)) ||
          (t.tempoh && t.tempoh.toLowerCase().includes(q))
      );
    }

    return result;
  }

  public getTaskById(id: string): TaskItem | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  public async addTask(
    data: Omit<TaskItem, 'id' | 'tarikhDicipta' | 'tarikhKemaskini'>
  ): Promise<TaskItem> {
    const now = new Date().toISOString();
    const newTask: TaskItem = {
      ...data,
      id: `task-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      adaTempoh: data.adaTempoh === 'Ada' ? 'Ada' : 'Tiada',
      tempoh: data.adaTempoh === 'Ada' ? data.tempoh || '1 Hari' : undefined,
      catatan: data.catatan?.trim() || '',
      tarikhDicipta: now,
      tarikhKemaskini: now,
    };

    if (this.deletedTaskIds.has(newTask.id)) {
      this.deletedTaskIds.delete(newTask.id);
      this.saveDeletedIds();
    }

    this.tasks = [newTask, ...this.tasks.filter((t) => t.id !== newTask.id)];
    this.notify();

    if (db) {
      try {
        const payload = cleanForFirestore(newTask);
        await setDoc(doc(db, 'tasks', newTask.id), payload);
        await deleteDoc(doc(db, 'deleted_tasks', newTask.id)).catch(() => {});
        console.log(`Task [${newTask.namaTask}] synced to Firestore successfully.`);
      } catch (e) {
        console.error('Failed to sync new task to Firestore:', e);
      }
    }

    return newTask;
  }

  public async updateTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem | null> {
    const existing = this.tasks.find((t) => t.id === id);
    if (!existing) return null;

    const merged: TaskItem = {
      ...existing,
      ...updates,
      adaTempoh: updates.adaTempoh !== undefined ? updates.adaTempoh : existing.adaTempoh,
      tempoh:
        updates.adaTempoh === 'Tiada'
          ? undefined
          : updates.tempoh !== undefined
          ? updates.tempoh
          : existing.tempoh,
      tarikhKemaskini: new Date().toISOString(),
    };

    this.tasks = this.tasks.map((t) => (t.id === id ? merged : t));
    this.notify();

    if (db) {
      try {
        const payload = cleanForFirestore(merged);
        await setDoc(doc(db, 'tasks', merged.id), payload, { merge: true });
        console.log(`Task update [${merged.namaTask}] synced to Firestore.`);
      } catch (e) {
        console.error('Failed to sync updated task to Firestore:', e);
      }
    }

    return merged;
  }

  public async deleteTask(id: string): Promise<boolean> {
    // 1. Mark as deleted in local set & storage
    this.deletedTaskIds.add(id);
    this.saveDeletedIds();

    // 2. Remove immediately from memory state & storage
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.notify();

    // 3. Delete permanently from Firestore 'tasks' collection AND record tombstone in 'deleted_tasks'
    if (db) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
        await setDoc(doc(db, 'deleted_tasks', id), {
          id,
          deletedAt: new Date().toISOString(),
        });
        console.log(`Task [${id}] permanently deleted & tombstone recorded in Firestore.`);
      } catch (e) {
        console.error('Failed to delete task from Firestore:', e);
      }
    }

    return true;
  }

  public async updateTaskStatus(id: string, newStatus: TaskStatus): Promise<TaskItem | null> {
    return this.updateTask(id, { status: newStatus });
  }
}

export const taskService = new TaskService();
