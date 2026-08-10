import { ProgramEvent, ProgramStatus } from '../types';
import { INITIAL_PROGRAM_EVENTS } from '../data/mockData';
import { db, isSystemSeeded, markSystemAsSeeded } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

const CALENDAR_STORAGE_KEY = 'WORKSPACE_CALENDAR_EVENTS_V1';

type CalendarListener = (events: ProgramEvent[]) => void;

class CalendarService {
  private events: ProgramEvent[] = [];
  private listeners: Set<CalendarListener> = new Set();
  private isFirebaseSubscribed = false;

  constructor() {
    this.initLocal();
    this.setupFirebaseSubscription();
  }

  private initLocal() {
    try {
      const saved = localStorage.getItem(CALENDAR_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.events = parsed;
          return;
        }
      }
    } catch (e) {
      console.error('Error reading local calendar storage:', e);
    }
    this.events = INITIAL_PROGRAM_EVENTS;
    this.saveLocal();
  }

  private saveLocal() {
    try {
      localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(this.events));
    } catch (e) {
      console.error('Error saving local calendar:', e);
    }
  }

  public subscribe(listener: CalendarListener): () => void {
    this.listeners.add(listener);
    listener(this.getEventsList());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.saveLocal();
    const current = this.getEventsList();
    this.listeners.forEach((fn) => fn(current));
  }

  public getEventsList(): ProgramEvent[] {
    // Sort by dateTime ascending (earliest to latest)
    return [...this.events].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }

  public setupFirebaseSubscription() {
    if (!db || this.isFirebaseSubscribed) return;
    this.isFirebaseSubscribed = true;

    try {
      onSnapshot(
        collection(db, 'calendar_events'),
        async (snapshot) => {
          if (!snapshot.empty) {
            const list: ProgramEvent[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as ProgramEvent);
            });
            this.events = list;
            this.notify();
          } else {
            const seeded = await isSystemSeeded();
            if (!seeded) {
              await markSystemAsSeeded();
              await this.seedToFirebase();
            } else {
              this.events = [];
              this.notify();
            }
          }
        },
        (error) => {
          console.error('🔥 Error listening to calendar_events collection in Firebase:', error);
        }
      );
    } catch (e) {
      console.error('Calendar Firebase subscription error:', e);
    }
  }

  private async seedToFirebase() {
    if (!db) return;
    try {
      for (const item of this.events) {
        await setDoc(doc(db, 'calendar_events', item.id), item);
      }
    } catch (e) {
      console.error('Seed calendar_events failed:', e);
    }
  }

  public async getEvents(): Promise<ProgramEvent[]> {
    return this.getEventsList();
  }

  public async saveEvent(event: ProgramEvent): Promise<ProgramEvent[]> {
    const idx = this.events.findIndex((e) => e.id === event.id);
    if (idx >= 0) {
      this.events[idx] = event;
    } else {
      this.events = [event, ...this.events];
    }
    this.notify();

    if (db) {
      try {
        await setDoc(doc(db, 'calendar_events', event.id), event);
      } catch (e) {
        console.error('Failed to sync event to Firebase:', e);
      }
    }

    return this.getEventsList();
  }

  public async deleteEvent(id: string): Promise<ProgramEvent[]> {
    this.events = this.events.filter((e) => e.id !== id);
    this.notify();

    if (db) {
      try {
        await deleteDoc(doc(db, 'calendar_events', id));
      } catch (e) {
        console.error('Failed to delete event from Firebase:', e);
      }
    }

    return this.getEventsList();
  }

  public async updateStatus(id: string, status: ProgramStatus): Promise<ProgramEvent[]> {
    const item = this.events.find((e) => e.id === id);
    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
      this.notify();

      if (db) {
        try {
          await setDoc(doc(db, 'calendar_events', id), item, { merge: true });
        } catch (e) {
          console.error('Failed to update event status in Firebase:', e);
        }
      }
    }

    return this.getEventsList();
  }
}

export const calendarService = new CalendarService();
