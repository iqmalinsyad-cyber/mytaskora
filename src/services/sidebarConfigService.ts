import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const STORAGE_KEY = 'WORKSPACE_SIDEBAR_NAV_CONFIG_V1';

export const DEFAULT_OVERVIEW_NAV = [
  'dashboard',
  'calendar',
  'aduan',
  'laporan_aduan',
  'kanban',
  'tasks',
  'templates',
];

export const DEFAULT_WORKSPACE_NAV = ['linkhub', 'downloads', 'notes'];

export const DEFAULT_SYSTEM_NAV = ['admin', 'login', 'settings'];

export interface SidebarConfig {
  overviewNavIds: string[];
  workspaceNavIds: string[];
  systemNavIds: string[];
  updatedAt?: string;
}

type SidebarConfigListener = (config: SidebarConfig) => void;

class SidebarConfigService {
  private config: SidebarConfig = {
    overviewNavIds: [...DEFAULT_OVERVIEW_NAV],
    workspaceNavIds: [...DEFAULT_WORKSPACE_NAV],
    systemNavIds: [...DEFAULT_SYSTEM_NAV],
  };

  private listeners: Set<SidebarConfigListener> = new Set();
  private isFirebaseSubscribed = false;

  constructor() {
    this.initLocal();
    this.setupFirebaseSubscription();
  }

  private ensureAllDefaultNavItems(config: SidebarConfig): SidebarConfig {
    const overview = Array.isArray(config.overviewNavIds) ? [...config.overviewNavIds] : [...DEFAULT_OVERVIEW_NAV];
    const workspace = Array.isArray(config.workspaceNavIds) ? [...config.workspaceNavIds] : [...DEFAULT_WORKSPACE_NAV];
    const system = Array.isArray(config.systemNavIds) ? [...config.systemNavIds] : [...DEFAULT_SYSTEM_NAV];

    DEFAULT_OVERVIEW_NAV.forEach((id) => {
      if (!overview.includes(id) && !workspace.includes(id) && !system.includes(id)) {
        overview.push(id);
      }
    });

    DEFAULT_WORKSPACE_NAV.forEach((id) => {
      if (!overview.includes(id) && !workspace.includes(id) && !system.includes(id)) {
        workspace.push(id);
      }
    });

    DEFAULT_SYSTEM_NAV.forEach((id) => {
      if (!overview.includes(id) && !workspace.includes(id) && !system.includes(id)) {
        system.push(id);
      }
    });

    return {
      overviewNavIds: overview,
      workspaceNavIds: workspace,
      systemNavIds: system,
      updatedAt: config.updatedAt,
    };
  }

  private initLocal() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.overviewNavIds)) {
          this.config = this.ensureAllDefaultNavItems({
            overviewNavIds: parsed.overviewNavIds || [...DEFAULT_OVERVIEW_NAV],
            workspaceNavIds: parsed.workspaceNavIds || [...DEFAULT_WORKSPACE_NAV],
            systemNavIds: parsed.systemNavIds || [...DEFAULT_SYSTEM_NAV],
            updatedAt: parsed.updatedAt,
          });
          return;
        }
      }
    } catch (e) {
      console.error('Error reading sidebar config from localStorage:', e);
    }
    this.config = this.ensureAllDefaultNavItems({
      overviewNavIds: [...DEFAULT_OVERVIEW_NAV],
      workspaceNavIds: [...DEFAULT_WORKSPACE_NAV],
      systemNavIds: [...DEFAULT_SYSTEM_NAV],
    });
  }

  private saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('Error saving sidebar config to localStorage:', e);
    }
  }

  private setupFirebaseSubscription() {
    if (!db || this.isFirebaseSubscribed) return;
    try {
      this.isFirebaseSubscribed = true;
      const configDocRef = doc(db, 'settings', 'sidebar_config');
      onSnapshot(
        configDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as SidebarConfig;
            if (data && Array.isArray(data.overviewNavIds)) {
              this.config = this.ensureAllDefaultNavItems({
                overviewNavIds: data.overviewNavIds,
                workspaceNavIds: data.workspaceNavIds || [...DEFAULT_WORKSPACE_NAV],
                systemNavIds: data.systemNavIds || [...DEFAULT_SYSTEM_NAV],
                updatedAt: data.updatedAt,
              });
              this.saveLocal();
              this.notify();
            }
          }
        },
        (error) => {
          console.warn('Firestore sidebar_config listener warning:', error?.message);
        }
      );
    } catch (e) {
      console.warn('Failed to subscribe to Firestore sidebar_config:', e);
    }
  }

  public subscribe(listener: SidebarConfigListener): () => void {
    this.listeners.add(listener);
    listener(this.getConfig());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.saveLocal();
    const current = this.getConfig();
    this.listeners.forEach((fn) => fn(current));
  }

  public getConfig(): SidebarConfig {
    return {
      overviewNavIds: [...this.config.overviewNavIds],
      workspaceNavIds: [...this.config.workspaceNavIds],
      systemNavIds: [...this.config.systemNavIds],
      updatedAt: this.config.updatedAt,
    };
  }

  public async saveConfig(newConfig: SidebarConfig): Promise<void> {
    this.config = {
      ...newConfig,
      updatedAt: new Date().toISOString(),
    };
    this.notify();

    if (db) {
      try {
        const configDocRef = doc(db, 'settings', 'sidebar_config');
        await setDoc(configDocRef, this.config, { merge: true });
        console.log('Sidebar navigation configuration synced to Firebase successfully.');
      } catch (e) {
        console.warn('Error syncing sidebar_config to Firebase:', e);
      }
    }
  }

  public async resetConfig(): Promise<void> {
    const defaultConfig: SidebarConfig = {
      overviewNavIds: [...DEFAULT_OVERVIEW_NAV],
      workspaceNavIds: [...DEFAULT_WORKSPACE_NAV],
      systemNavIds: [...DEFAULT_SYSTEM_NAV],
      updatedAt: new Date().toISOString(),
    };
    await this.saveConfig(defaultConfig);
  }
}

export const sidebarConfigService = new SidebarConfigService();
