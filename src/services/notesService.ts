import { db, isSystemSeeded, markSystemAsSeeded } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  color?: string; // 'amber' | 'emerald' | 'sky' | 'indigo' | 'purple' | 'rose' | 'slate'
  isPinned?: boolean;
  tags?: string[];
  authorName?: string;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
}

const NOTES_STORAGE_KEY = 'WORKSPACE_NOTES_ITEMS_V1';
const CAT_STORAGE_KEY = 'WORKSPACE_NOTES_CATEGORIES_V1';

export const DEFAULT_NOTE_CATEGORIES = ['SOP & Panduan', 'Pertanyaan & Contact', 'Minit & Catatan', 'Peringatan Utama', 'Umum'];

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'note-001',
    title: 'SOP Pengesahan Laporan & Tindakan Aduan Awam',
    content: '1. Setiap aduan yang diterima melalui portal mesti disemak dalam tempoh 24 jam.\n2. Maklumat pengadu hendaklah dirahsiakan mengikut Akta Perlindungan Data.\n3. Laporan siasatan perlu dilengkapkan bersama gambar bukti sebelum ditutup.\n4. Kes yang dikategori Risiko Tinggi perlu dilaporkan terus kepada Pentadbir Utama.',
    category: 'SOP & Panduan',
    color: 'amber',
    isPinned: true,
    tags: ['SOP', 'Aduan', 'Integriti'],
    authorName: 'Pentadbir Utama',
    authorId: 'usr-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-002',
    title: 'Nombor Hubungan & Meja Bantuan Dalaman',
    content: '• Meja Bantuan IT: 03-8000 8899 (Samb. 404)\n• Unit Aduan & Integriti: 03-8000 8123\n• Pengurus Sistem: admin@workspace.gov.my\n• Talian Kecemasan Keselamatan: 03-8000 9999',
    category: 'Pertanyaan & Contact',
    color: 'emerald',
    isPinned: true,
    tags: ['Hotline', 'Kontak', 'Bantuan'],
    authorName: 'Sarah Adams',
    authorId: 'usr-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-003',
    title: 'Format Ringkasan Catatan Minit Mesyuarat',
    content: 'Gunakan template piawai bagi penyediaan catatan:\n- Tarikh & Masa Mesyuarat\n- Senarai Kehadiran Ahli\n- Ringkasan Perbincangan & Isu\n- Senarai Tindakan (Action Items) & Tarikh Akhir Completion',
    category: 'Minit & Catatan',
    color: 'sky',
    isPinned: false,
    tags: ['Minit', 'Format', 'Template'],
    authorName: 'Ahmad Razak',
    authorId: 'usr-002',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

type NotesListener = (notes: NoteItem[]) => void;
type NoteCatListener = (cats: string[]) => void;

class NotesService {
  private notes: NoteItem[] = [];
  private categories: string[] = [...DEFAULT_NOTE_CATEGORIES];
  private listeners: Set<NotesListener> = new Set();
  private catListeners: Set<NoteCatListener> = new Set();
  private isFirebaseSubscribed = false;

  constructor() {
    this.initLocal();
    this.setupFirebaseSubscription();
  }

  private initLocal() {
    try {
      const saved = localStorage.getItem(NOTES_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.notes = parsed;
        } else {
          this.notes = [...INITIAL_NOTES];
        }
      } else {
        this.notes = [...INITIAL_NOTES];
      }

      const savedCats = localStorage.getItem(CAT_STORAGE_KEY);
      if (savedCats !== null) {
        const parsedCats = JSON.parse(savedCats);
        if (Array.isArray(parsedCats)) {
          this.categories = parsedCats;
        } else {
          this.categories = [...DEFAULT_NOTE_CATEGORIES];
        }
      } else {
        this.categories = [...DEFAULT_NOTE_CATEGORIES];
      }
    } catch (e) {
      console.error('Error reading notes local storage:', e);
      this.notes = [...INITIAL_NOTES];
      this.categories = [...DEFAULT_NOTE_CATEGORIES];
    }
    this.saveLocal();
  }

  private saveLocal() {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(this.notes));
      localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(this.categories));
    } catch (e) {
      console.error('Error saving notes local storage:', e);
    }
  }

  public subscribe(listener: NotesListener): () => void {
    this.listeners.add(listener);
    listener(this.getNotesList());
    return () => this.listeners.delete(listener);
  }

  public subscribeCategories(listener: NoteCatListener): () => void {
    this.catListeners.add(listener);
    listener(this.getCategoriesList());
    return () => this.catListeners.delete(listener);
  }

  private notify() {
    this.saveLocal();
    const current = this.getNotesList();
    this.listeners.forEach((fn) => fn(current));
  }

  private notifyCategories() {
    this.saveLocal();
    const current = this.getCategoriesList();
    this.catListeners.forEach((fn) => fn(current));
  }

  public getNotesList(): NoteItem[] {
    return [...this.notes].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  public getCategoriesList(): string[] {
    return [...this.categories];
  }

  public setupFirebaseSubscription() {
    if (!db || this.isFirebaseSubscribed) return;
    this.isFirebaseSubscribed = true;

    try {
      onSnapshot(
        collection(db, 'notes'),
        async (snapshot) => {
          if (!snapshot.empty) {
            const list: NoteItem[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as NoteItem;
              list.push({ ...data, id: docSnap.id });
            });
            this.notes = list;
            this.notify();
          } else {
            const notesSeeded = localStorage.getItem('NOTES_COLLECTION_SEEDED_V1') === 'true';
            if (!notesSeeded) {
              localStorage.setItem('NOTES_COLLECTION_SEEDED_V1', 'true');
              await this.seedNotesToFirebase();
            } else {
              this.notes = [];
              this.notify();
            }
          }
        },
        (error) => {
          console.error('🔥 Error listening to notes collection in Firebase:', error);
        }
      );

      onSnapshot(
        collection(db, 'notes_categories'),
        async (snapshot) => {
          if (!snapshot.empty) {
            const cats: string[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              if (data.name) cats.push(data.name);
            });
            this.categories = cats;
            this.notifyCategories();
          } else {
            const catsSeeded = localStorage.getItem('NOTES_CATS_SEEDED_V1') === 'true';
            if (!catsSeeded) {
              localStorage.setItem('NOTES_CATS_SEEDED_V1', 'true');
              await this.seedCategoriesToFirebase();
            } else {
              this.categories = [];
              this.notifyCategories();
            }
          }
        },
        (error) => {
          console.error('🔥 Error listening to notes_categories in Firebase:', error);
        }
      );
    } catch (e) {
      console.error('Notes Firebase subscription error:', e);
    }
  }

  private async seedNotesToFirebase() {
    if (!db) return;
    try {
      for (const note of INITIAL_NOTES) {
        await setDoc(doc(db, 'notes', note.id), note);
      }
    } catch (e) {
      console.error('Seed notes to Firebase failed:', e);
    }
  }

  private async seedCategoriesToFirebase() {
    if (!db) return;
    try {
      for (const catName of DEFAULT_NOTE_CATEGORIES) {
        const catId = `cat-${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        await setDoc(doc(db, 'notes_categories', catId), { id: catId, name: catName });
      }
    } catch (e) {
      console.error('Seed notes_categories to Firebase failed:', e);
    }
  }

  public async saveNote(note: Partial<NoteItem> & { id?: string; title: string; content: string }): Promise<NoteItem[]> {
    const now = new Date().toISOString();
    const id = note.id || `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const existingNote = this.notes.find((n) => n.id === id);

    const fullNote: NoteItem = {
      id,
      title: note.title.trim(),
      content: note.content.trim(),
      category: note.category || 'Umum',
      color: note.color || 'amber',
      isPinned: Boolean(note.isPinned),
      tags: Array.isArray(note.tags) ? note.tags : [],
      authorName: note.authorName || existingNote?.authorName || 'Pengguna Workspace',
      authorId: note.authorId || existingNote?.authorId || 'usr-guest',
      createdAt: existingNote?.createdAt || now,
      updatedAt: now,
    };

    const idx = this.notes.findIndex((n) => n.id === id);
    if (idx >= 0) {
      this.notes[idx] = fullNote;
    } else {
      this.notes = [fullNote, ...this.notes];
    }
    this.notify();

    if (db) {
      try {
        await setDoc(doc(db, 'notes', id), fullNote);
      } catch (e) {
        console.error('Failed to sync note to Firebase:', e);
      }
    }

    return this.getNotesList();
  }

  public async deleteNote(id: string): Promise<NoteItem[]> {
    this.notes = this.notes.filter((n) => n.id !== id);
    this.notify();

    if (db) {
      try {
        await deleteDoc(doc(db, 'notes', id));
      } catch (e) {
        console.error('Failed to delete note from Firebase:', e);
      }
    }

    return this.getNotesList();
  }

  public async togglePinNote(id: string): Promise<NoteItem[]> {
    const note = this.notes.find((n) => n.id === id);
    if (note) {
      note.isPinned = !note.isPinned;
      note.updatedAt = new Date().toISOString();
      this.notify();

      if (db) {
        try {
          await setDoc(doc(db, 'notes', id), note, { merge: true });
        } catch (e) {
          console.error('Failed to toggle pin in Firebase:', e);
        }
      }
    }
    return this.getNotesList();
  }

  public async addCategory(catName: string): Promise<string[]> {
    const trimmed = catName.trim();
    if (!trimmed || this.categories.includes(trimmed)) return this.getCategoriesList();

    this.categories.push(trimmed);
    this.notifyCategories();

    if (db) {
      try {
        const catId = `cat-${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        await setDoc(doc(db, 'notes_categories', catId), { id: catId, name: trimmed });
      } catch (e) {
        console.error('Failed to add note category to Firebase:', e);
      }
    }

    return this.getCategoriesList();
  }

  public async deleteCategory(catName: string): Promise<string[]> {
    this.categories = this.categories.filter((c) => c !== catName);
    this.notifyCategories();

    if (db) {
      try {
        const catId = `cat-${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        await deleteDoc(doc(db, 'notes_categories', catId));
      } catch (e) {
        console.error('Failed to delete note category from Firebase:', e);
      }
    }

    return this.getCategoriesList();
  }
}

export const notesService = new NotesService();
