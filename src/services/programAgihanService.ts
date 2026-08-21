import { ProgramAgihanKPI } from '../types';
import { INITIAL_PROGRAM_AGIHAN_KPI } from '../data/mockData';
import { db, isSystemSeeded, markSystemAsSeeded } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

const STORAGE_KEY = 'WORKSPACE_PROGRAM_AGIHAN_KPI_V1';

type ProgramAgihanListener = (items: ProgramAgihanKPI[]) => void;

class ProgramAgihanService {
  private items: ProgramAgihanKPI[] = [];
  private listeners: Set<ProgramAgihanListener> = new Set();
  private isFirebaseSubscribed = false;

  constructor() {
    this.initLocal();
    this.setupFirebaseSubscription();
  }

  private initLocal() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.items = parsed;
          return;
        }
      }
    } catch (e) {
      console.error('Error reading local program agihan storage:', e);
    }
    this.items = INITIAL_PROGRAM_AGIHAN_KPI;
    this.saveLocal();
  }

  private saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.error('Error saving local program agihan:', e);
    }
  }

  public subscribe(listener: ProgramAgihanListener): () => void {
    this.listeners.add(listener);
    listener(this.getItemsList());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.saveLocal();
    const current = this.getItemsList();
    this.listeners.forEach((fn) => fn(current));
  }

  public getItemsList(): ProgramAgihanKPI[] {
    // Sort by tarikh descending (latest first)
    return [...this.items].sort((a, b) => new Date(b.tarikh).getTime() - new Date(a.tarikh).getTime());
  }

  public setupFirebaseSubscription() {
    if (!db || this.isFirebaseSubscribed) return;
    this.isFirebaseSubscribed = true;

    try {
      onSnapshot(
        collection(db, 'program_agihan_kpi'),
        async (snapshot) => {
          if (!snapshot.empty) {
            const list: ProgramAgihanKPI[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as ProgramAgihanKPI);
            });
            this.items = list;
            this.notify();
          } else {
            const seeded = await isSystemSeeded();
            if (!seeded) {
              await markSystemAsSeeded();
              await this.seedToFirebase();
            } else {
              this.items = [];
              this.notify();
            }
          }
        },
        (error) => {
          console.error('🔥 Error listening to program_agihan_kpi collection in Firebase:', error);
        }
      );
    } catch (e) {
      console.error('Program Agihan Firebase subscription error:', e);
    }
  }

  private async seedToFirebase() {
    if (!db) return;
    try {
      for (const item of this.items) {
        await setDoc(doc(db, 'program_agihan_kpi', item.id), item);
      }
    } catch (e) {
      console.error('Seed program_agihan_kpi failed:', e);
    }
  }

  public async getItems(): Promise<ProgramAgihanKPI[]> {
    return this.getItemsList();
  }

  public async saveItem(item: ProgramAgihanKPI): Promise<ProgramAgihanKPI[]> {
    const idx = this.items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      this.items[idx] = item;
    } else {
      this.items = [item, ...this.items];
    }
    this.notify();

    if (db) {
      try {
        await setDoc(doc(db, 'program_agihan_kpi', item.id), item);
      } catch (e) {
        console.error('Failed to sync program agihan to Firebase:', e);
      }
    }

    return this.getItemsList();
  }

  public async deleteItem(id: string): Promise<ProgramAgihanKPI[]> {
    this.items = this.items.filter((i) => i.id !== id);
    this.notify();

    if (db) {
      try {
        await deleteDoc(doc(db, 'program_agihan_kpi', id));
      } catch (e) {
        console.error('Failed to delete program agihan from Firebase:', e);
      }
    }

    return this.getItemsList();
  }
}

export const programAgihanService = new ProgramAgihanService();
