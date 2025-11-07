import { api } from '@/lib/api';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  isActive?: boolean;
}

class ClientService {
  async getAllClients(): Promise<Client[]> {
    try {
      const response = await api.get<Client[]>('/clients');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      throw error;
    }
  }

  async getClientById(id: string): Promise<Client> {
    try {
      const response = await api.get<Client>(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch client ${id}:`, error);
      throw error;
    }
  }

  async createClient(data: CreateClientData): Promise<Client> {
    try {
      const response = await api.post<Client>('/clients', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create client:', error);
      throw error;
    }
  }

  async updateClient(id: string, data: UpdateClientData): Promise<Client> {
    try {
      const response = await api.put<Client>(`/clients/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to update client ${id}:`, error);
      throw error;
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
      await api.delete(`/clients/${id}`);
    } catch (error) {
      console.error(`Failed to delete client ${id}:`, error);
      throw error;
    }
  }

  async searchClients(query: string): Promise<Client[]> {
    try {
      const response = await api.get<Client[]>(`/clients/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search clients:', error);
      throw error;
    }
  }
}

export const clientService = new ClientService();
