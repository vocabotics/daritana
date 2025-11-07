import { api } from '@/lib/api';

export interface Design {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  style: string;
  location: string;
  area: number;
  unit: string;
  budget: number;
  currency: string;
  completionDate: string;
  architect: {
    id: string;
    name: string;
    company: string;
    avatar: string;
    rating: number;
    verified: boolean;
  };
  images: string[];
  videos?: string[];
  documents?: Array<{ name: string; type: string; url: string }>;
  tags: string[];
  featured: boolean;
  trending: boolean;
  sustainable: boolean;
  awards: string[];
  likes: number;
  views: number;
  downloads: number;
  isLiked: boolean;
  isSaved: boolean;
}

export interface CreateDesignData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  style: string;
  location: string;
  area: number;
  unit: string;
  budget: number;
  currency: string;
  completionDate: string;
  images: string[];
  videos?: string[];
  documents?: Array<{ name: string; type: string; url: string }>;
  tags: string[];
  sustainable: boolean;
}

export interface UpdateDesignData extends Partial<CreateDesignData> {
  featured?: boolean;
  trending?: boolean;
}

export interface DesignFilters {
  category?: string;
  subcategory?: string;
  style?: string;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  minArea?: number;
  maxArea?: number;
  sustainable?: boolean;
  featured?: boolean;
  trending?: boolean;
  architectId?: string;
}

class DesignShowcaseService {
  async getAllDesigns(): Promise<Design[]> {
    try {
      const response = await api.get<Design[]>('/design-showcase/designs');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch designs:', error);
      throw error;
    }
  }

  async getDesignById(id: string): Promise<Design> {
    try {
      const response = await api.get<Design>(`/design-showcase/designs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch design ${id}:`, error);
      throw error;
    }
  }

  async searchDesigns(query: string): Promise<Design[]> {
    try {
      const response = await api.get<Design[]>(`/design-showcase/designs/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search designs:', error);
      throw error;
    }
  }

  async getDesignsByCategory(category: string): Promise<Design[]> {
    try {
      const response = await api.get<Design[]>(`/design-showcase/designs/category/${encodeURIComponent(category)}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch designs by category ${category}:`, error);
      throw error;
    }
  }

  async getDesignsByStyle(style: string): Promise<Design[]> {
    try {
      const response = await api.get<Design[]>(`/design-showcase/designs/style/${encodeURIComponent(style)}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch designs by style ${style}:`, error);
      throw error;
    }
  }

  async getDesignsByLocation(location: string): Promise<Design[]> {
    try {
      const response = await api.get<Design[]>(`/design-showcase/designs/location/${encodeURIComponent(location)}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch designs by location ${location}:`, error);
      throw error;
    }
  }

  async getFeaturedDesigns(): Promise<Design[]> {
    try {
      const response = await api.get<Design[]>('/design-showcase/designs/featured');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch featured designs:', error);
      throw error;
    }
  }

  async getTrendingDesigns(): Promise<Design[]> {
    try {
      const response = await api.get<Design[]>('/design-showcase/designs/trending');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trending designs:', error);
      throw error;
    }
  }

  async getDesignsByArchitect(architectId: string): Promise<Design[]> {
    try {
      const response = await api.get<Design[]>(`/design-showcase/designs/architect/${architectId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch designs by architect ${architectId}:`, error);
      throw error;
    }
  }

  async filterDesigns(filters: DesignFilters): Promise<Design[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get<Design[]>(`/design-showcase/designs/filter?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to filter designs:', error);
      throw error;
    }
  }

  // Design creation and management
  async createDesign(data: CreateDesignData): Promise<Design> {
    try {
      const response = await api.post<Design>('/design-showcase/designs', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create design:', error);
      throw error;
    }
  }

  async updateDesign(id: string, data: UpdateDesignData): Promise<Design> {
    try {
      const response = await api.put<Design>(`/design-showcase/designs/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to update design ${id}:`, error);
      throw error;
    }
  }

  async deleteDesign(id: string): Promise<void> {
    try {
      await api.delete(`/design-showcase/designs/${id}`);
    } catch (error) {
      console.error(`Failed to delete design ${id}:`, error);
      throw error;
    }
  }

  // User interactions
  async likeDesign(designId: string): Promise<void> {
    try {
      await api.post(`/design-showcase/designs/${designId}/like`);
    } catch (error) {
      console.error(`Failed to like design ${designId}:`, error);
      throw error;
    }
  }

  async unlikeDesign(designId: string): Promise<void> {
    try {
      await api.delete(`/design-showcase/designs/${designId}/like`);
    } catch (error) {
      console.error(`Failed to unlike design ${designId}:`, error);
      throw error;
    }
  }

  async saveDesign(designId: string): Promise<void> {
    try {
      await api.post(`/design-showcase/designs/${designId}/save`);
    } catch (error) {
      console.error(`Failed to save design ${designId}:`, error);
      throw error;
    }
  }

  async unsaveDesign(designId: string): Promise<void> {
    try {
      await api.delete(`/design-showcase/designs/${designId}/save`);
    } catch (error) {
      console.error(`Failed to unsave design ${designId}:`, error);
      throw error;
    }
  }

  async downloadDesign(designId: string): Promise<Blob> {
    try {
      const response = await api.get(`/design-showcase/designs/${designId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to download design ${designId}:`, error);
      throw error;
    }
  }

  async viewDesign(designId: string): Promise<void> {
    try {
      await api.post(`/design-showcase/designs/${designId}/view`);
    } catch (error) {
      console.error(`Failed to record view for design ${designId}:`, error);
      throw error;
    }
  }

  // User collections
  async getLikedDesigns(): Promise<Design[]> {
    try {
      const response = await api.get<Design[]>('/design-showcase/user/liked');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch liked designs:', error);
      throw error;
    }
  }

  async getSavedDesigns(): Promise<Design[]> {
    try {
      const response = await api.get<Design[]>('/design-showcase/user/saved');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch saved designs:', error);
      throw error;
    }
  }

  async getDownloadedDesigns(): Promise<Design[]> {
    try {
      const response = await api.get<Design[]>('/design-showcase/user/downloaded');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch downloaded designs:', error);
      throw error;
    }
  }

  // Architect operations
  async contactArchitect(architectId: string, message: any): Promise<any> {
    try {
      const response = await api.post<any>(`/design-showcase/architects/${architectId}/contact`, message);
      return response.data;
    } catch (error) {
      console.error(`Failed to contact architect ${architectId}:`, error);
      throw error;
    }
  }

  async getArchitectDetails(architectId: string): Promise<any> {
    try {
      const response = await api.get<any>(`/design-showcase/architects/${architectId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch architect details ${architectId}:`, error);
      throw error;
    }
  }

  async getArchitects(): Promise<any[]> {
    try {
      const response = await api.get<any[]>('/design-showcase/architects');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch architects:', error);
      throw error;
    }
  }

  // Design reviews and ratings
  async getDesignReviews(designId: string): Promise<any[]> {
    try {
      const response = await api.get<any[]>(`/design-showcase/designs/${designId}/reviews`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch design reviews ${designId}:`, error);
      throw error;
    }
  }

  async addDesignReview(designId: string, review: any): Promise<any> {
    try {
      const response = await api.post<any>(`/design-showcase/designs/${designId}/reviews`, review);
      return response.data;
    } catch (error) {
      console.error('Failed to add design review:', error);
      throw error;
    }
  }

  // Design comparison
  async compareDesigns(designIds: string[]): Promise<any[]> {
    try {
      const response = await api.post<any[]>('/design-showcase/designs/compare', { designIds });
      return response.data;
    } catch (error) {
      console.error('Failed to compare designs:', error);
      throw error;
    }
  }

  // Export designs
  async exportDesigns(format: 'csv' | 'excel' | 'pdf' = 'csv', filters?: DesignFilters): Promise<Blob> {
    try {
      const response = await api.post(`/design-showcase/designs/export?format=${format}`, filters, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export designs:', error);
      throw error;
    }
  }

  // Analytics and insights
  async getDesignAnalytics(designId: string): Promise<any> {
    try {
      const response = await api.get<any>(`/design-showcase/designs/${designId}/analytics`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch design analytics ${designId}:`, error);
      throw error;
    }
  }

  async getPopularDesigns(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<Design[]> {
    try {
      const response = await api.get<Design[]>(`/design-showcase/designs/popular?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch popular designs:', error);
      throw error;
    }
  }

  async getDesignInsights(): Promise<any> {
    try {
      const response = await api.get<any>('/design-showcase/insights');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch design insights:', error);
      throw error;
    }
  }
}

export const designShowcaseService = new DesignShowcaseService();
