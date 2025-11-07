// Seed Data Service - Real API Integration
// This service fetches seed data from the backend instead of using mock data

import { User, Project, Task } from '@/types';
import type { Document } from '@/types/document';
import type { Organization } from '@/services/organization.service';

// Service interface for seed data
export interface SeedDataService {
  getLocations(): Promise<typeof MALAYSIAN_LOCATIONS>;
  getOrganizations(): Promise<Partial<Organization>[]>;
  getUsers(): Promise<Partial<User>[]>;
  getProjects(): Promise<Partial<Project>[]>;
  getTasks(): Promise<Partial<Task>[]>;
  getDocuments(): Promise<Partial<Document>[]>;
}

// Default empty structures for initial state
export const MALAYSIAN_LOCATIONS = {
  'Demo Area': {
    state: 'Demo State',
    cities: ['Demo City'],
    postcodes: ['00000']
  }
};

export const SEED_ORGANIZATIONS: Partial<Organization>[] = [];
export const SEED_USERS: Partial<User>[] = [];
export const SEED_PROJECTS: Partial<Project>[] = [];
export const SEED_TASKS: Partial<Task>[] = [];
export const SEED_DOCUMENTS: Partial<Document>[] = [];

// Sample data for demo mode (minimal examples)
export const SAMPLE_ORGANIZATIONS: Partial<Organization>[] = [
  {
    id: 'demo-org-1',
    name: 'Demo Organization',
    slug: 'demo-org',
    email: 'demo@organization.com',
    phone: '+60123456789',
    website: 'https://demo-organization.com',
    address: 'Demo Address',
    city: 'Demo City',
    state: 'Demo State',
    postcode: '00000',
    country: 'Malaysia',
    businessType: 'architecture',
    registrationNo: 'DEMO123456',
    taxNo: 'DEMO12345',
    establishedYear: 2024,
    employeeCount: '1-10',
    planId: 'basic',
    maxUsers: 10,
    maxProjects: 5,
    maxStorage: 10000000000, // 10GB
    status: 'active',
    isTrialActive: false,
  }
];

export const SAMPLE_USERS: Partial<User>[] = [
  {
    id: 'demo-user-1',
    name: 'Demo User',
    email: 'demo@user.com',
    role: 'staff',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&face',
    permissions: ['read'],
    department: 'Demo Department',
    phone: '+60123456789',
  }
];

export const SAMPLE_PROJECTS: Partial<Project>[] = [
  {
    id: 'demo-project-1',
    name: 'Demo Project',
    description: 'A demonstration project for testing purposes',
    status: 'concept',
    clientId: 'demo-client-1',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    budget: {
      estimated: 10000,
      approved: 10000,
      actual: 0,
      currency: 'MYR'
    },
  }
];

export const SAMPLE_TASKS: Partial<Task>[] = [
  {
    id: 'demo-task-1',
    title: 'Demo Task',
    description: 'A demonstration task for testing purposes',
    status: 'todo',
    priority: 'medium',
    projectId: 'demo-project-1',
    assignedTo: 'demo-user-1',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  }
];

export const SAMPLE_DOCUMENTS: Partial<Document>[] = [
  {
    id: 'demo-doc-1',
    title: 'Demo Document',
    description: 'A demonstration document for testing purposes',
    filename: 'demo-document.pdf',
    filePath: '/documents/demo-document.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    projectId: 'demo-project-1',
    uploadedBy: 'demo-user-1',
    status: 'active' as any,
    isPublic: false,
  }
];

// Export empty arrays for real API integration
export const mockOrganizations = SEED_ORGANIZATIONS;
export const mockUsers = SEED_USERS;
export const mockProjects = SEED_PROJECTS;
export const mockTasks = SEED_TASKS;
export const mockDocuments = SEED_DOCUMENTS;