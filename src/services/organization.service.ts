/**
 * Organization Service
 * Handles organization management, team invitations, and multi-tenant operations
 */

import { api } from '@/lib/api';

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'basic',
    name: 'Basic Plan',
    displayName: 'Basic',
    description: 'Perfect for small teams getting started',
    price: 0,
    currency: 'MYR',
    billingCycle: 'monthly',
    maxUsers: 10,
    maxProjects: 20,
    maxStorage: 10240, // 10GB
    features: [
      'Basic project management',
      'Document storage',
      'Team collaboration',
      'Email support'
    ]
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional Plan',
    displayName: 'Professional',
    description: 'Advanced features for growing businesses',
    price: 99,
    currency: 'MYR',
    billingCycle: 'monthly',
    maxUsers: 50,
    maxProjects: 100,
    maxStorage: 102400, // 100GB
    features: [
      'Everything in Basic',
      'Advanced analytics',
      'Custom workflows',
      'Priority support',
      'API access'
    ]
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    displayName: 'Enterprise',
    description: 'Full-featured solution for large organizations',
    price: 299,
    currency: 'MYR',
    billingCycle: 'monthly',
    maxUsers: -1, // Unlimited
    maxProjects: -1, // Unlimited
    maxStorage: -1, // Unlimited
    features: [
      'Everything in Professional',
      'White-label solution',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee'
    ]
  }
} as const;

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  plan: string;
  userCount: number;
  projectCount: number;
  createdAt: string;
  lastActive: string;
  country: string;
  businessType: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city: string;
  state: string;
  postalCode?: string;
  description?: string;
  adminEmail: string;
  adminName: string;
  trialEndsAt?: string;
  maxUsers: number;
  maxProjects: number;
  maxStorage: number;
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  businessType: string;
  description?: string;
  adminEmail: string;
  adminName: string;
}

export interface UpdateOrganizationData extends Partial<CreateOrganizationData> {
  status?: Organization['status'];
  plan?: string;
  maxUsers?: number;
  maxProjects?: number;
  maxStorage?: number;
}

class OrganizationService {
  async getAllOrganizations(): Promise<Organization[]> {
    try {
      const response = await api.get<Organization[]>('/organizations');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      throw error;
    }
  }

  async getOrganizationById(id: string): Promise<Organization> {
    try {
      const response = await api.get<Organization>(`/organizations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch organization ${id}:`, error);
      throw error;
    }
  }

  async getOrganizationBySlug(slug: string): Promise<Organization> {
    try {
      const response = await api.get<Organization>(`/organizations/slug/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch organization by slug ${slug}:`, error);
      throw error;
    }
  }

  async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    try {
      const response = await api.post<Organization>('/organizations', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    }
  }

  async updateOrganization(id: string, data: UpdateOrganizationData): Promise<Organization> {
    try {
      const response = await api.put<Organization>(`/organizations/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to update organization ${id}:`, error);
      throw error;
    }
  }

  async deleteOrganization(id: string): Promise<void> {
    try {
      await api.delete(`/organizations/${id}`);
    } catch (error) {
      console.error(`Failed to delete organization ${id}:`, error);
      throw error;
    }
  }

  async suspendOrganization(id: string, reason?: string): Promise<Organization> {
    try {
      const response = await api.post<Organization>(`/organizations/${id}/suspend`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Failed to suspend organization ${id}:`, error);
      throw error;
    }
  }

  async activateOrganization(id: string): Promise<Organization> {
    try {
      const response = await api.post<Organization>(`/organizations/${id}/activate`);
      return response.data;
    } catch (error) {
      console.error(`Failed to activate organization ${id}:`, error);
      throw error;
    }
  }

  async getOrganizationStats(id: string): Promise<any> {
    try {
      const response = await api.get<any>(`/organizations/${id}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch organization stats ${id}:`, error);
      throw error;
    }
  }

  async getOrganizationMembers(id: string): Promise<any[]> {
    try {
      const response = await api.get<any[]>(`/organizations/${id}/members`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch organization members ${id}:`, error);
      throw error;
    }
  }

  async addOrganizationMember(organizationId: string, memberData: any): Promise<any> {
    try {
      const response = await api.post<any>(`/organizations/${organizationId}/members`, memberData);
      return response.data;
    } catch (error) {
      console.error(`Failed to add member to organization ${organizationId}:`, error);
      throw error;
    }
  }

  async removeOrganizationMember(organizationId: string, memberId: string): Promise<void> {
    try {
      await api.delete(`/organizations/${organizationId}/members/${memberId}`);
    } catch (error) {
      console.error(`Failed to remove member from organization ${organizationId}:`, error);
      throw error;
    }
  }

  async updateOrganizationMember(organizationId: string, memberId: string, data: any): Promise<any> {
    try {
      const response = await api.put<any>(`/organizations/${organizationId}/members/${memberId}`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to update member in organization ${organizationId}:`, error);
      throw error;
    }
  }

  async searchOrganizations(query: string): Promise<Organization[]> {
    try {
      const response = await api.get<Organization[]>(`/organizations/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search organizations:', error);
      throw error;
    }
  }

  async getOrganizationsByStatus(status: string): Promise<Organization[]> {
    try {
      const response = await api.get<Organization[]>(`/organizations/status/${status}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch organizations by status ${status}:`, error);
      throw error;
    }
  }

  async getOrganizationsByPlan(plan: string): Promise<Organization[]> {
    try {
      const response = await api.get<Organization[]>(`/organizations/plan/${plan}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch organizations by plan ${plan}:`, error);
      throw error;
    }
  }

  async getOrganizationsByCountry(country: string): Promise<Organization[]> {
    try {
      const response = await api.get<Organization[]>(`/organizations/country/${encodeURIComponent(country)}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch organizations by country ${country}:`, error);
      throw error;
    }
  }

  async exportOrganizations(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const response = await api.get(`/organizations/export?format=${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export organizations:', error);
      throw error;
    }
  }
}

export const organizationService = new OrganizationService();
export default organizationService;