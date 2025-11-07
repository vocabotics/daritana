import { DashboardWidget } from '@/types/dashboard';

export interface SavedLayout {
  id: string;
  name: string;
  description?: string;
  context: 'global' | 'project' | 'both';
  projectId?: string;
  userId: string;
  widgets: DashboardWidget[];
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean;
  isShared?: boolean;
  tags?: string[];
}

export interface LayoutStorageService {
  saveLayout(layout: Omit<SavedLayout, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedLayout>;
  loadLayout(layoutId: string): Promise<SavedLayout | null>;
  loadUserLayouts(userId: string): Promise<SavedLayout[]>;
  updateLayout(layoutId: string, updates: Partial<SavedLayout>): Promise<SavedLayout>;
  deleteLayout(layoutId: string): Promise<boolean>;
  setDefaultLayout(layoutId: string, context: 'global' | 'project', projectId?: string): Promise<void>;
  getDefaultLayout(userId: string, context: 'global' | 'project', projectId?: string): Promise<SavedLayout | null>;
  shareLayout(layoutId: string, userIds: string[]): Promise<void>;
  exportLayout(layoutId: string): Promise<string>;
  importLayout(layoutData: string, userId: string): Promise<SavedLayout>;
}

class LocalStorageLayoutService implements LayoutStorageService {
  private readonly STORAGE_KEY = 'daritana_dashboard_layouts';
  private readonly DEFAULT_KEY = 'daritana_default_layouts';

  private getLayouts(): SavedLayout[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    try {
      const layouts = JSON.parse(stored);
      // Convert date strings back to Date objects
      return layouts.map((layout: any) => ({
        ...layout,
        createdAt: new Date(layout.createdAt),
        updatedAt: new Date(layout.updatedAt)
      }));
    } catch {
      return [];
    }
  }

  private saveLayouts(layouts: SavedLayout[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(layouts));
  }

  private getDefaults(): Record<string, string> {
    const stored = localStorage.getItem(this.DEFAULT_KEY);
    if (!stored) return {};
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }

  private saveDefaults(defaults: Record<string, string>): void {
    localStorage.setItem(this.DEFAULT_KEY, JSON.stringify(defaults));
  }

  async saveLayout(layout: Omit<SavedLayout, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedLayout> {
    const layouts = this.getLayouts();
    const newLayout: SavedLayout = {
      ...layout,
      id: `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    layouts.push(newLayout);
    this.saveLayouts(layouts);
    
    return newLayout;
  }

  async loadLayout(layoutId: string): Promise<SavedLayout | null> {
    const layouts = this.getLayouts();
    return layouts.find(l => l.id === layoutId) || null;
  }

  async loadUserLayouts(userId: string): Promise<SavedLayout[]> {
    const layouts = this.getLayouts();
    return layouts.filter(l => l.userId === userId || l.isShared);
  }

  async updateLayout(layoutId: string, updates: Partial<SavedLayout>): Promise<SavedLayout> {
    const layouts = this.getLayouts();
    const index = layouts.findIndex(l => l.id === layoutId);
    
    if (index === -1) {
      throw new Error(`Layout ${layoutId} not found`);
    }
    
    layouts[index] = {
      ...layouts[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.saveLayouts(layouts);
    return layouts[index];
  }

  async deleteLayout(layoutId: string): Promise<boolean> {
    const layouts = this.getLayouts();
    const filtered = layouts.filter(l => l.id !== layoutId);
    
    if (filtered.length === layouts.length) {
      return false;
    }
    
    this.saveLayouts(filtered);
    
    // Remove from defaults if it was default
    const defaults = this.getDefaults();
    const newDefaults = Object.entries(defaults)
      .filter(([_, id]) => id !== layoutId)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    this.saveDefaults(newDefaults);
    
    return true;
  }

  async setDefaultLayout(layoutId: string, context: 'global' | 'project', projectId?: string): Promise<void> {
    const defaults = this.getDefaults();
    const key = projectId ? `project-${projectId}` : context;
    defaults[key] = layoutId;
    this.saveDefaults(defaults);
  }

  async getDefaultLayout(userId: string, context: 'global' | 'project', projectId?: string): Promise<SavedLayout | null> {
    const defaults = this.getDefaults();
    const key = projectId ? `project-${projectId}` : context;
    const layoutId = defaults[key];
    
    if (!layoutId) return null;
    
    const layout = await this.loadLayout(layoutId);
    return layout && (layout.userId === userId || layout.isShared) ? layout : null;
  }

  async shareLayout(layoutId: string, userIds: string[]): Promise<void> {
    // In a real implementation, this would share with specific users
    // For now, we'll just mark it as shared
    await this.updateLayout(layoutId, { isShared: true });
  }

  async exportLayout(layoutId: string): Promise<string> {
    const layout = await this.loadLayout(layoutId);
    if (!layout) {
      throw new Error(`Layout ${layoutId} not found`);
    }
    
    // Create export data without sensitive information
    const exportData = {
      name: layout.name,
      description: layout.description,
      context: layout.context,
      widgets: layout.widgets,
      tags: layout.tags
    };
    
    return btoa(JSON.stringify(exportData));
  }

  async importLayout(layoutData: string, userId: string): Promise<SavedLayout> {
    try {
      const decoded = atob(layoutData);
      const parsed = JSON.parse(decoded);
      
      return await this.saveLayout({
        ...parsed,
        userId,
        name: `${parsed.name} (Imported)`,
        isShared: false
      });
    } catch (error) {
      throw new Error('Invalid layout data');
    }
  }
}

// Mock API service for future backend integration
class APILayoutService implements LayoutStorageService {
  private readonly apiUrl = '/api/layouts';

  async saveLayout(layout: Omit<SavedLayout, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedLayout> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(layout)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save layout');
    }
    
    return await response.json();
  }

  async loadLayout(layoutId: string): Promise<SavedLayout | null> {
    const response = await fetch(`${this.apiUrl}/${layoutId}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to load layout');
    }
    
    return await response.json();
  }

  async loadUserLayouts(userId: string): Promise<SavedLayout[]> {
    const response = await fetch(`${this.apiUrl}?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to load user layouts');
    }
    
    return await response.json();
  }

  async updateLayout(layoutId: string, updates: Partial<SavedLayout>): Promise<SavedLayout> {
    const response = await fetch(`${this.apiUrl}/${layoutId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update layout');
    }
    
    return await response.json();
  }

  async deleteLayout(layoutId: string): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/${layoutId}`, {
      method: 'DELETE'
    });
    
    return response.ok;
  }

  async setDefaultLayout(layoutId: string, context: 'global' | 'project', projectId?: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${layoutId}/set-default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, projectId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to set default layout');
    }
  }

  async getDefaultLayout(userId: string, context: 'global' | 'project', projectId?: string): Promise<SavedLayout | null> {
    const params = new URLSearchParams({
      userId,
      context,
      ...(projectId && { projectId })
    });
    
    const response = await fetch(`${this.apiUrl}/default?${params}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to get default layout');
    }
    
    return await response.json();
  }

  async shareLayout(layoutId: string, userIds: string[]): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${layoutId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds })
    });
    
    if (!response.ok) {
      throw new Error('Failed to share layout');
    }
  }

  async exportLayout(layoutId: string): Promise<string> {
    const response = await fetch(`${this.apiUrl}/${layoutId}/export`);
    
    if (!response.ok) {
      throw new Error('Failed to export layout');
    }
    
    return await response.text();
  }

  async importLayout(layoutData: string, userId: string): Promise<SavedLayout> {
    const response = await fetch(`${this.apiUrl}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layoutData, userId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to import layout');
    }
    
    return await response.json();
  }
}

// Export singleton instance
// Use LocalStorage for now, can switch to API when backend is ready
export const layoutStorage: LayoutStorageService = new LocalStorageLayoutService();

// Helper functions for easy access
export const saveCurrentLayout = async (
  name: string,
  widgets: DashboardWidget[],
  userId: string,
  context: 'global' | 'project',
  projectId?: string,
  description?: string
): Promise<SavedLayout> => {
  return await layoutStorage.saveLayout({
    name,
    description,
    context,
    projectId,
    userId,
    widgets
  });
};

export const loadDefaultLayout = async (
  userId: string,
  context: 'global' | 'project',
  projectId?: string
): Promise<SavedLayout | null> => {
  return await layoutStorage.getDefaultLayout(userId, context, projectId);
};

export const getUserLayouts = async (userId: string): Promise<SavedLayout[]> => {
  return await layoutStorage.loadUserLayouts(userId);
};