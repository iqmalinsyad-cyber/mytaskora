import { LinkItem } from '../types';
import { INITIAL_LINK_HUB_ITEMS } from '../data/mockData';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

const LINK_HUB_STORAGE_KEY = 'WORKSPACE_LINK_HUB_ITEMS_V1';

type LinkHubListener = (links: LinkItem[]) => void;

class LinkHubService {
  private links: LinkItem[] = [];
  private listeners: Set<LinkHubListener> = new Set();
  private isFirebaseSubscribed = false;

  constructor() {
    this.initLocal();
    this.setupFirebaseSubscription();
  }

  private initLocal() {
    try {
      const saved = localStorage.getItem(LINK_HUB_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.links = parsed;
          return;
        }
      }
    } catch (e) {
      console.error('Error reading local linkhub storage:', e);
    }
    this.links = INITIAL_LINK_HUB_ITEMS;
    this.saveLocal();
  }

  private saveLocal() {
    try {
      localStorage.setItem(LINK_HUB_STORAGE_KEY, JSON.stringify(this.links));
    } catch (e) {
      console.error('Error saving local linkhub:', e);
    }
  }

  public subscribe(listener: LinkHubListener): () => void {
    this.listeners.add(listener);
    listener(this.getLinksList());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.saveLocal();
    const current = this.getLinksList();
    this.listeners.forEach((fn) => fn(current));
  }

  public getLinksList(): LinkItem[] {
    return [...this.links];
  }

  public setupFirebaseSubscription() {
    if (!db || this.isFirebaseSubscribed) return;
    this.isFirebaseSubscribed = true;

    try {
      onSnapshot(
        collection(db, 'link_hub'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: LinkItem[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as LinkItem);
            });
            list.sort((a, b) => {
              if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
              return (b.clickCount || 0) - (a.clickCount || 0);
            });
            this.links = list;
            this.notify();
          } else {
            const hasSeeded = localStorage.getItem('LINKHUB_INITIAL_SEEDED_V2');
            if (!hasSeeded) {
              localStorage.setItem('LINKHUB_INITIAL_SEEDED_V2', 'true');
              this.seedToFirebase();
            } else {
              this.links = [];
              this.notify();
            }
          }
        },
        (error) => {
          console.error('🔥 Error listening to link_hub collection in Firebase:', error);
        }
      );
    } catch (e) {
      console.error('LinkHub Firebase subscription error:', e);
    }
  }

  private async seedToFirebase() {
    if (!db) return;
    try {
      for (const item of this.links) {
        await setDoc(doc(db, 'link_hub', item.id), item);
      }
    } catch (e) {
      console.error('Seed link_hub failed:', e);
    }
  }

  public async getLinks(): Promise<LinkItem[]> {
    return this.getLinksList();
  }

  public async saveLink(link: LinkItem): Promise<LinkItem[]> {
    const idx = this.links.findIndex((l) => l.id === link.id);
    if (idx >= 0) {
      this.links[idx] = link;
    } else {
      this.links = [link, ...this.links];
    }
    this.notify();

    if (db) {
      try {
        await setDoc(doc(db, 'link_hub', link.id), link);
      } catch (e) {
        console.error('Failed to sync link to Firebase:', e);
      }
    }

    return this.getLinksList();
  }

  public async deleteLink(id: string): Promise<LinkItem[]> {
    this.links = this.links.filter((l) => l.id !== id);
    this.notify();

    if (db) {
      try {
        await deleteDoc(doc(db, 'link_hub', id));
      } catch (e) {
        console.error('Failed to delete link from Firebase:', e);
      }
    }

    return this.getLinksList();
  }

  public async incrementClick(id: string): Promise<LinkItem[]> {
    const item = this.links.find((l) => l.id === id);
    if (item) {
      item.clickCount = (item.clickCount || 0) + 1;
      this.notify();

      if (db) {
        try {
          await setDoc(doc(db, 'link_hub', id), item, { merge: true });
        } catch (e) {
          console.error('Failed to update click in Firebase:', e);
        }
      }
    }

    return this.getLinksList();
  }

  public async togglePin(id: string): Promise<LinkItem[]> {
    const item = this.links.find((l) => l.id === id);
    if (item) {
      item.isPinned = !item.isPinned;
      this.notify();

      if (db) {
        try {
          await setDoc(doc(db, 'link_hub', id), item, { merge: true });
        } catch (e) {
          console.error('Failed to update pin in Firebase:', e);
        }
      }
    }

    return this.getLinksList();
  }
}

export const linkhubService = new LinkHubService();
