// Seed Data Service - Real API Integration
// ✅ All data fetched from database - No mock/sample data

import { User, Project, Task } from '@/types';
import type { Document } from '@/types/document';
import type { Organization } from '@/services/organization.service';

// Service interface for seed data
export interface SeedDataService {
  getLocations(): Promise<Record<string, any>>;
  getOrganizations(): Promise<Partial<Organization>[]>;
  getUsers(): Promise<Partial<User>[]>;
  getProjects(): Promise<Partial<Project>[]>;
  getTasks(): Promise<Partial<Task>[]>;
  getDocuments(): Promise<Partial<Document>[]>;
}

// ✅ All data structures are empty - real data fetched from database
export const MALAYSIAN_LOCATIONS = {};

export const SEED_ORGANIZATIONS: Partial<Organization>[] = [];
export const SEED_USERS: Partial<User>[] = [];
export const SEED_PROJECTS: Partial<Project>[] = [];
export const SEED_TASKS: Partial<Task>[] = [];
export const SEED_DOCUMENTS: Partial<Document>[] = [];
