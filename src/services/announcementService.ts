import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const ANNOUNCEMENT_STORAGE_KEY = 'WORKSPACE_ANNOUNCEMENT_TICKER_V1';
export const DEFAULT_ANNOUNCEMENT = 'Gagal itu biasa. Tanpa kegagalan kita tidak akan merasa kemanisan dalam kejayaan.';

type AnnouncementListener = (text: string) => void;

class AnnouncementService {
  private announcementText: string = DEFAULT_ANNOUNCEMENT;
  private listeners: Set<AnnouncementListener> = new Set();
  private isFirebaseSubscribed = false;

  constructor() {
    this.initLocal();
    this.setupFirebaseSubscription();
  }

  private initLocal() {
    try {
      const saved = localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
      if (saved) {
        this.announcementText = saved;
      } else {
        this.announcementText = DEFAULT_ANNOUNCEMENT;
      }
    } catch (e) {
      console.error('Error reading announcement local storage:', e);
      this.announcementText = DEFAULT_ANNOUNCEMENT;
    }
  }

  private saveLocal() {
    try {
      localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, this.announcementText);
    } catch (e) {
      console.error('Error saving announcement local storage:', e);
    }
  }

  public subscribe(listener: AnnouncementListener): () => void {
    this.listeners.add(listener);
    listener(this.getAnnouncementText());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.saveLocal();
    const current = this.getAnnouncementText();
    this.listeners.forEach((fn) => fn(current));
  }

  public getAnnouncementText(): string {
    return this.announcementText || DEFAULT_ANNOUNCEMENT;
  }

  public setupFirebaseSubscription() {
    if (!db || this.isFirebaseSubscribed) return;
    this.isFirebaseSubscribed = true;

    try {
      const docRef = doc(db, 'system_config', 'announcement');
      onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && typeof data.text === 'string' && data.text.trim()) {
              this.announcementText = data.text.trim();
              this.notify();
            }
          } else {
            // Seed default to Firebase
            setDoc(docRef, {
              text: DEFAULT_ANNOUNCEMENT,
              updatedAt: new Date().toISOString(),
              updatedBy: 'System',
            }).catch((err) => console.error('Error seeding announcement:', err));
          }
        },
        (error) => {
          console.error('🔥 Error listening to system_config/announcement in Firebase:', error);
        }
      );
    } catch (e) {
      console.error('Announcement Firebase subscription error:', e);
    }
  }

  public async updateAnnouncement(newText: string, updatedBy: string = 'Admin'): Promise<string> {
    const trimmed = newText.trim() || DEFAULT_ANNOUNCEMENT;
    this.announcementText = trimmed;
    this.notify();

    if (db) {
      try {
        const docRef = doc(db, 'system_config', 'announcement');
        await setDoc(docRef, {
          text: trimmed,
          updatedAt: new Date().toISOString(),
          updatedBy,
        });
      } catch (e) {
        console.error('Failed to sync announcement to Firebase:', e);
      }
    }

    return this.getAnnouncementText();
  }
}

export const announcementService = new AnnouncementService();
