import { LinkItem } from '../types';
import { INITIAL_LINK_HUB_ITEMS } from '../data/mockData';
import { getSupabaseClient } from '../lib/supabase';

const LINK_HUB_STORAGE_KEY = 'WORKSPACE_LINK_HUB_ITEMS_V1';

export const linkhubService = {
  getLocalLinks(): LinkItem[] {
    try {
      const saved = localStorage.getItem(LINK_HUB_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading local linkhub storage:', e);
    }
    localStorage.setItem(LINK_HUB_STORAGE_KEY, JSON.stringify(INITIAL_LINK_HUB_ITEMS));
    return INITIAL_LINK_HUB_ITEMS;
  },

  /**
   * Fetch all LinkHub items (from Supabase if connected, else LocalStorage)
   */
  async getLinks(): Promise<LinkItem[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('link_hub')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('click_count', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && data) {
          if (data.length === 0) {
            // Seed local items to Supabase link_hub table
            const local = this.getLocalLinks();
            for (const item of local) {
              await supabase.from('link_hub').upsert({
                id: item.id,
                title: item.title,
                url: item.url,
                category: item.category,
                description: item.description || '',
                icon: item.icon || 'Globe',
                is_pinned: item.isPinned ?? false,
                created_by: item.createdBy,
                created_at: item.createdAt,
                click_count: item.clickCount || 0,
              });
            }
            return local;
          }

          const links: LinkItem[] = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            url: d.url,
            category: d.category || 'Sistem Kerajaan',
            description: d.description || '',
            icon: d.icon || 'Globe',
            faviconUrl: d.favicon_url || d.faviconUrl || '',
            isPinned: d.is_pinned ?? false,
            createdBy: d.created_by || 'Pentadbir Sistem',
            createdAt: d.created_at || new Date().toISOString(),
            clickCount: d.click_count || 0,
          }));
          return links;
        }
      } catch (err) {
        console.warn('Supabase fetch link_hub failed, falling back to local storage:', err);
      }
    }

    // Local Storage Fallback
    try {
      const saved = localStorage.getItem(LINK_HUB_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading local linkhub storage:', e);
    }

    // Initialize with mock data if empty
    localStorage.setItem(LINK_HUB_STORAGE_KEY, JSON.stringify(INITIAL_LINK_HUB_ITEMS));
    return INITIAL_LINK_HUB_ITEMS;
  },

  /**
   * Save (Create or Update) LinkHub Item
   */
  async saveLink(link: LinkItem): Promise<LinkItem[]> {
    const currentLinks = await this.getLinks();
    const existingIndex = currentLinks.findIndex((l) => l.id === link.id);

    let updatedList: LinkItem[];
    if (existingIndex >= 0) {
      updatedList = [...currentLinks];
      updatedList[existingIndex] = link;
    } else {
      updatedList = [link, ...currentLinks];
    }

    // Save LocalStorage
    localStorage.setItem(LINK_HUB_STORAGE_KEY, JSON.stringify(updatedList));

    // Sync Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('link_hub').upsert({
          id: link.id,
          title: link.title,
          url: link.url,
          category: link.category,
          description: link.description || '',
          icon: link.icon || 'Globe',
          is_pinned: link.isPinned ?? false,
          created_by: link.createdBy,
          created_at: link.createdAt,
          click_count: link.clickCount || 0,
        });
      } catch (err) {
        console.error('Failed to sync link to Supabase:', err);
      }
    }

    return updatedList;
  },

  /**
   * Delete LinkHub Item
   */
  async deleteLink(id: string): Promise<LinkItem[]> {
    const currentLinks = await this.getLinks();
    const updatedList = currentLinks.filter((l) => l.id !== id);

    localStorage.setItem(LINK_HUB_STORAGE_KEY, JSON.stringify(updatedList));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('link_hub').delete().eq('id', id);
      } catch (err) {
        console.error('Failed to delete link from Supabase:', err);
      }
    }

    return updatedList;
  },

  /**
   * Increment click count when user opens the link
   */
  async incrementClick(id: string): Promise<LinkItem[]> {
    const currentLinks = await this.getLinks();
    const updatedList = currentLinks.map((l) => {
      if (l.id === id) {
        return { ...l, clickCount: (l.clickCount || 0) + 1 };
      }
      return l;
    });

    localStorage.setItem(LINK_HUB_STORAGE_KEY, JSON.stringify(updatedList));

    const updatedItem = updatedList.find((l) => l.id === id);
    const supabase = getSupabaseClient();
    if (supabase && updatedItem) {
      try {
        await supabase
          .from('link_hub')
          .update({ click_count: updatedItem.clickCount })
          .eq('id', id);
      } catch (err) {
        console.error('Failed to update click count in Supabase:', err);
      }
    }

    return updatedList;
  },

  /**
   * Toggle Pin status
   */
  async togglePin(id: string): Promise<LinkItem[]> {
    const currentLinks = await this.getLinks();
    const updatedList = currentLinks.map((l) => {
      if (l.id === id) {
        return { ...l, isPinned: !l.isPinned };
      }
      return l;
    });

    localStorage.setItem(LINK_HUB_STORAGE_KEY, JSON.stringify(updatedList));

    const updatedItem = updatedList.find((l) => l.id === id);
    const supabase = getSupabaseClient();
    if (supabase && updatedItem) {
      try {
        await supabase
          .from('link_hub')
          .update({ is_pinned: updatedItem.isPinned })
          .eq('id', id);
      } catch (err) {
        console.error('Failed to update pin in Supabase:', err);
      }
    }

    return updatedList;
  }
};
