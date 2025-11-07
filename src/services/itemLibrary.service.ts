import { api } from '@/lib/api';

export interface ItemLibraryItem {
  id: string;
  item_code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  base_price: number;
  sst_rate: number;
  is_active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateItemData {
  item_code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  base_price: number;
  sst_rate: number;
}

export interface UpdateItemData extends Partial<CreateItemData> {
  is_active?: boolean;
}

class ItemLibraryService {
  async getAllItems(): Promise<ItemLibraryItem[]> {
    try {
      const response = await api.get<ItemLibraryItem[]>('/item-library');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch item library:', error);
      throw error;
    }
  }

  async getItemById(id: string): Promise<ItemLibraryItem> {
    try {
      const response = await api.get<ItemLibraryItem>(`/item-library/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch item ${id}:`, error);
      throw error;
    }
  }

  async createItem(data: CreateItemData): Promise<ItemLibraryItem> {
    try {
      const response = await api.post<ItemLibraryItem>('/item-library', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    }
  }

  async updateItem(id: string, data: UpdateItemData): Promise<ItemLibraryItem> {
    try {
      const response = await api.put<ItemLibraryItem>(`/item-library/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to update item ${id}:`, error);
      throw error;
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      await api.delete(`/item-library/${id}`);
    } catch (error) {
      console.error(`Failed to delete item ${id}:`, error);
      throw error;
    }
  }

  async searchItems(query: string): Promise<ItemLibraryItem[]> {
    try {
      const response = await api.get<ItemLibraryItem[]>(`/item-library/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search items:', error);
      throw error;
    }
  }

  async getItemsByCategory(category: string): Promise<ItemLibraryItem[]> {
    try {
      const response = await api.get<ItemLibraryItem[]>(`/item-library/category/${encodeURIComponent(category)}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch items by category ${category}:`, error);
      throw error;
    }
  }

  async getActiveItems(): Promise<ItemLibraryItem[]> {
    try {
      const response = await api.get<ItemLibraryItem[]>('/item-library/active');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch active items:', error);
      throw error;
    }
  }
}

export const itemLibraryService = new ItemLibraryService();
