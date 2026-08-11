import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';

export interface DownloadFileItem {
  id: string;
  title: string;
  description: string;
  category: string;
  downloadUrl: string;
  imageUrl: string;
  fileType: string;
  fileSize: string;
  downloadCount: number;
  updatedAt: string;
  updatedBy?: string;
}

export interface DownloadCategoryItem {
  id: string;
  name: string;
  updatedAt: string;
}

export const DEFAULT_DOWNLOAD_CATEGORIES: string[] = [
  'Borang & Format',
  'Garis Panduan',
  'Templat / Format',
  'Pek Maklumat',
  'Aplikasi / Sistem',
];

const STORAGE_KEY = 'WORKSPACE_DOWNLOAD_COLLECTION_V1';
const CAT_STORAGE_KEY = 'WORKSPACE_DOWNLOAD_CATEGORIES_V1';

export const INITIAL_DOWNLOAD_ITEMS: DownloadFileItem[] = [
  {
    id: 'dl-001',
    title: 'Borang Permohonan Aduan Integriti (PDF Rasmi)',
    description: 'Borang fizikal dan digital rasmi untuk aduan integriti dan salah guna kuasa.',
    category: 'Borang & Format',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=600',
    fileType: 'PDF',
    fileSize: '1.8 MB',
    downloadCount: 342,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Muhammad Hafiz Bin Abdullah',
  },
  {
    id: 'dl-002',
    title: 'Garis Panduan Pengurusan Aduan LZS 2026',
    description: 'Dokumen panduan lengkap skop kerja, kriteria kelayakan, dan proses semakan aduan.',
    category: 'Garis Panduan',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=600',
    fileType: 'PDF',
    fileSize: '3.5 MB',
    downloadCount: 215,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Muhammad Hafiz Bin Abdullah',
  },
  {
    id: 'dl-003',
    title: 'Templat Excel Rekod Laporan Aduan Bulanan',
    description: 'Format lembaran kerja berserta formula automatik untuk kiraan kes aduan.',
    category: 'Templat / Format',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    imageUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=600',
    fileType: 'XLSX',
    fileSize: '850 KB',
    downloadCount: 189,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Muhammad Hafiz Bin Abdullah',
  },
  {
    id: 'dl-004',
    title: 'Pek Infografik & Panduan Pengadu Awam',
    description: 'Poster dan bahan maklumat bergambar untuk kaunter aduan dan edaran awam.',
    category: 'Pek Maklumat',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
    fileType: 'ZIP',
    fileSize: '12.4 MB',
    downloadCount: 512,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Muhammad Hafiz Bin Abdullah',
  },
];

type DownloadListener = (items: DownloadFileItem[]) => void;
type CategoryListener = (categories: string[]) => void;

class DownloadService {
  private items: DownloadFileItem[] = [];
  private categories: string[] = [...DEFAULT_DOWNLOAD_CATEGORIES];
  private listeners: Set<DownloadListener> = new Set();
  private categoryListeners: Set<CategoryListener> = new Set();
  private isFirebaseSubscribed = false;

  constructor() {
    this.initLocal();
    this.setupFirebaseSubscription();
  }

  private initLocal() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.items = parsed;
        } else {
          this.items = [...INITIAL_DOWNLOAD_ITEMS];
        }
      } else {
        this.items = [...INITIAL_DOWNLOAD_ITEMS];
      }

      const savedCats = localStorage.getItem(CAT_STORAGE_KEY);
      if (savedCats) {
        const parsedCats = JSON.parse(savedCats);
        if (Array.isArray(parsedCats) && parsedCats.length > 0) {
          this.categories = parsedCats;
        } else {
          this.categories = [...DEFAULT_DOWNLOAD_CATEGORIES];
        }
      } else {
        this.categories = [...DEFAULT_DOWNLOAD_CATEGORIES];
      }
    } catch (e) {
      console.error('Error reading download items from localStorage:', e);
      this.items = [...INITIAL_DOWNLOAD_ITEMS];
      this.categories = [...DEFAULT_DOWNLOAD_CATEGORIES];
    }
    this.saveLocal();
  }

  private saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(this.categories));
    } catch (e) {
      console.error('Error saving download items to localStorage:', e);
    }
  }

  public setupFirebaseSubscription() {
    if (!db || this.isFirebaseSubscribed) return;
    try {
      this.isFirebaseSubscribed = true;
      const colRef = collection(db, 'download_files');
      onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteItems: DownloadFileItem[] = [];
            snapshot.forEach((docSnap) => {
              remoteItems.push(docSnap.data() as DownloadFileItem);
            });
            // Sort by updatedAt desc
            remoteItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            this.items = remoteItems;
            this.saveLocal();
            this.notify();
          } else {
            // Seed initial download files if database collection is empty
            this.seedFirebaseInitial();
          }
        },
        (error) => {
          console.warn('Firestore download_files onSnapshot warning:', error?.message);
        }
      );

      // Category collection listener
      const catColRef = collection(db, 'download_categories');
      onSnapshot(
        catColRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteCats: string[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              if (data && data.name) {
                remoteCats.push(data.name);
              }
            });
            if (remoteCats.length > 0) {
              this.categories = remoteCats;
              this.saveLocal();
              this.notifyCategories();
            }
          } else {
            this.seedCategoriesInitial();
          }
        },
        (error) => {
          console.warn('Firestore download_categories onSnapshot warning:', error?.message);
        }
      );
    } catch (e) {
      console.warn('Error setting up Firebase download listeners:', e);
    }
  }

  private async seedCategoriesInitial() {
    if (!db) return;
    try {
      for (const catName of DEFAULT_DOWNLOAD_CATEGORIES) {
        const id = `cat-${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        await setDoc(doc(db, 'download_categories', id), {
          id,
          name: catName,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Error seeding initial download_categories:', e);
    }
  }

  private async seedFirebaseInitial() {
    if (!db) return;
    try {
      for (const item of INITIAL_DOWNLOAD_ITEMS) {
        await setDoc(doc(db, 'download_files', item.id), item);
      }
    } catch (e) {
      console.warn('Error seeding initial download_files to Firebase:', e);
    }
  }

  public subscribe(listener: DownloadListener): () => void {
    this.listeners.add(listener);
    listener(this.getItems());
    return () => this.listeners.delete(listener);
  }

  public subscribeCategories(listener: CategoryListener): () => void {
    this.categoryListeners.add(listener);
    listener(this.getCategories());
    return () => this.categoryListeners.delete(listener);
  }

  private notify() {
    this.saveLocal();
    const current = this.getItems();
    this.listeners.forEach((fn) => fn(current));
  }

  private notifyCategories() {
    this.saveLocal();
    const currentCats = this.getCategories();
    this.categoryListeners.forEach((fn) => fn(currentCats));
  }

  public getItems(): DownloadFileItem[] {
    return [...this.items];
  }

  public getCategories(): string[] {
    return [...this.categories];
  }

  public async addCategory(catName: string): Promise<void> {
    const trimmed = catName.trim();
    if (!trimmed || this.categories.includes(trimmed)) return;

    this.categories = [...this.categories, trimmed];
    this.notifyCategories();

    if (db) {
      try {
        const id = `cat-${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        await setDoc(doc(db, 'download_categories', id), {
          id,
          name: trimmed,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Error adding category to Firebase:', e);
      }
    }
  }

  public async updateCategory(oldName: string, newName: string): Promise<void> {
    const trimmedNew = newName.trim();
    if (!trimmedNew || oldName === trimmedNew) return;

    this.categories = this.categories.map((c) => (c === oldName ? trimmedNew : c));
    
    // Also update any files using this category
    this.items = this.items.map((item) => {
      if (item.category === oldName) {
        return { ...item, category: trimmedNew };
      }
      return item;
    });

    this.notifyCategories();
    this.notify();

    if (db) {
      try {
        const oldId = `cat-${oldName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const newId = `cat-${trimmedNew.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        await deleteDoc(doc(db, 'download_categories', oldId));
        await setDoc(doc(db, 'download_categories', newId), {
          id: newId,
          name: trimmedNew,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Error updating category in Firebase:', e);
      }
    }
  }

  public async deleteCategory(catName: string): Promise<void> {
    this.categories = this.categories.filter((c) => c !== catName);
    this.notifyCategories();

    if (db) {
      try {
        const id = `cat-${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        await deleteDoc(doc(db, 'download_categories', id));
      } catch (e) {
        console.error('Error deleting category from Firebase:', e);
      }
    }
  }

  public async addFile(newItem: Omit<DownloadFileItem, 'id' | 'downloadCount' | 'updatedAt'>): Promise<DownloadFileItem> {
    const item: DownloadFileItem = {
      ...newItem,
      id: `dl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      downloadCount: 0,
      updatedAt: new Date().toISOString(),
    };

    this.items = [item, ...this.items];
    this.notify();

    if (db) {
      try {
        await setDoc(doc(db, 'download_files', item.id), item);
      } catch (e) {
        console.error('Error adding download file to Firebase:', e);
      }
    }

    return item;
  }

  public async updateFile(id: string, updatedData: Partial<DownloadFileItem>): Promise<void> {
    const idx = this.items.findIndex((it) => it.id === id);
    if (idx !== -1) {
      const merged: DownloadFileItem = {
        ...this.items[idx],
        ...updatedData,
        updatedAt: new Date().toISOString(),
      };
      this.items[idx] = merged;
      this.notify();

      if (db) {
        try {
          await setDoc(doc(db, 'download_files', id), merged, { merge: true });
        } catch (e) {
          console.error('Error updating download file in Firebase:', e);
        }
      }
    }
  }

  public async deleteFile(id: string): Promise<void> {
    this.items = this.items.filter((it) => it.id !== id);
    this.notify();

    if (db) {
      try {
        await deleteDoc(doc(db, 'download_files', id));
      } catch (e) {
        console.error('Error deleting download file from Firebase:', e);
      }
    }
  }

  public async recordDownload(id: string): Promise<void> {
    const idx = this.items.findIndex((it) => it.id === id);
    if (idx !== -1) {
      this.items[idx].downloadCount += 1;
      this.notify();

      if (db) {
        try {
          await updateDoc(doc(db, 'download_files', id), {
            downloadCount: increment(1),
          });
        } catch (e) {
          console.warn('Error incrementing download count in Firebase:', e);
        }
      }
    }
  }
}

export const downloadService = new DownloadService();
