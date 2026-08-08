import { FormatTemplate } from '../types';
import { FORMAT_TEMPLATES } from '../data/mockData';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

const TEMPLATES_STORAGE_KEY = 'WORKSPACE_CATATAN_FORMATS_V2';
const CATEGORIES_STORAGE_KEY = 'WORKSPACE_CATATAN_CATEGORIES_V2';

const DEFAULT_CATEGORIES = [
  'Bantuan Sewa Rumah',
  'Bantuan Deposit Sewa',
  'Bantuan Tunggakan Utiliti',
  'Bantuan Tunggakan Sewa/Ansuran Rumah',
  'Bantuan Kewangan',
  'Bantuan Penerapan Nilai Islam',
  'Tambang Pengangkutan Sekolah'
];

type TemplatesListener = (templates: FormatTemplate[]) => void;
type CategoriesListener = (categories: string[]) => void;

class CatatanTemplateService {
  private templates: FormatTemplate[] = [];
  private categories: string[] = [];
  private templatesListeners: Set<TemplatesListener> = new Set();
  private categoriesListeners: Set<CategoriesListener> = new Set();
  private isFirebaseSubscribed = false;

  constructor() {
    this.initLocalData();
    this.setupFirebaseSubscription();
  }

  private initLocalData() {
    try {
      const savedFmt = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (savedFmt) {
        this.templates = JSON.parse(savedFmt);
      } else {
        this.templates = FORMAT_TEMPLATES;
        this.saveTemplatesToLocal();
      }

      const savedCat = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (savedCat) {
        this.categories = JSON.parse(savedCat);
      } else {
        this.categories = DEFAULT_CATEGORIES;
        this.saveCategoriesToLocal();
      }
    } catch (e) {
      console.error('Error initializing CatatanTemplateService:', e);
      this.templates = FORMAT_TEMPLATES;
      this.categories = DEFAULT_CATEGORIES;
    }
  }

  private saveTemplatesToLocal() {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(this.templates));
    } catch (e) {
      console.error('Error saving templates to local:', e);
    }
  }

  private saveCategoriesToLocal() {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(this.categories));
    } catch (e) {
      console.error('Error saving categories to local:', e);
    }
  }

  public subscribeTemplates(listener: TemplatesListener): () => void {
    this.templatesListeners.add(listener);
    listener(this.getTemplates());
    return () => this.templatesListeners.delete(listener);
  }

  public subscribeCategories(listener: CategoriesListener): () => void {
    this.categoriesListeners.add(listener);
    listener(this.getCategories());
    return () => this.categoriesListeners.delete(listener);
  }

  private notifyTemplates() {
    this.saveTemplatesToLocal();
    const curr = this.getTemplates();
    this.templatesListeners.forEach((fn) => fn(curr));
  }

  private notifyCategories() {
    this.saveCategoriesToLocal();
    const curr = this.getCategories();
    this.categoriesListeners.forEach((fn) => fn(curr));
  }

  public getTemplates(): FormatTemplate[] {
    return [...this.templates];
  }

  public getCategories(): string[] {
    return [...this.categories];
  }

  public setupFirebaseSubscription() {
    if (!db || this.isFirebaseSubscribed) return;
    this.isFirebaseSubscribed = true;

    try {
      // 1. Templates collection listener
      onSnapshot(
        collection(db, 'catatan_templates'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: FormatTemplate[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as FormatTemplate);
            });
            this.templates = list;
            this.notifyTemplates();
          } else {
            // Seed initial templates to Firebase
            this.seedToFirebase();
          }
        },
        (error) => {
          console.error('🔥 Error listening to catatan_templates:', error);
        }
      );

      // 2. Categories document listener
      onSnapshot(
        collection(db, 'catatan_categories'),
        (snapshot) => {
          if (!snapshot.empty) {
            const cats: string[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as { name: string };
              if (data.name) cats.push(data.name);
            });
            if (cats.length > 0) {
              this.categories = cats;
              this.notifyCategories();
            }
          } else {
            this.seedCategoriesToFirebase();
          }
        },
        (error) => {
          console.error('🔥 Error listening to catatan_categories:', error);
        }
      );
    } catch (e) {
      console.error('CatatanTemplateService subscription failed:', e);
    }
  }

  private async seedToFirebase() {
    if (!db) return;
    try {
      for (const t of this.templates) {
        await setDoc(doc(db, 'catatan_templates', t.id), t);
      }
    } catch (e) {
      console.error('Seed templates failed:', e);
    }
  }

  private async seedCategoriesToFirebase() {
    if (!db) return;
    try {
      for (const cat of this.categories) {
        const catId = `cat-${cat.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
        await setDoc(doc(db, 'catatan_categories', catId), { name: cat });
      }
    } catch (e) {
      console.error('Seed categories failed:', e);
    }
  }

  public async saveTemplate(template: FormatTemplate): Promise<void> {
    const idx = this.templates.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
      this.templates[idx] = template;
    } else {
      this.templates = [template, ...this.templates];
    }
    this.notifyTemplates();

    if (db) {
      try {
        await setDoc(doc(db, 'catatan_templates', template.id), template);
      } catch (e) {
        console.error('Failed save template to Firebase:', e);
      }
    }
  }

  public async deleteTemplate(id: string): Promise<void> {
    this.templates = this.templates.filter((t) => t.id !== id);
    this.notifyTemplates();

    if (db) {
      try {
        await deleteDoc(doc(db, 'catatan_templates', id));
      } catch (e) {
        console.error('Failed delete template from Firebase:', e);
      }
    }
  }

  public async addCategory(newCategory: string): Promise<void> {
    const clean = newCategory.trim();
    if (!clean || this.categories.includes(clean)) return;

    this.categories = [...this.categories, clean];
    this.notifyCategories();

    if (db) {
      try {
        const catId = `cat-${clean.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
        await setDoc(doc(db, 'catatan_categories', catId), { name: clean });
      } catch (e) {
        console.error('Failed save category to Firebase:', e);
      }
    }
  }
}

export const catatanTemplateService = new CatatanTemplateService();
