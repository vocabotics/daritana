import { SEED_DATA, generateAdditionalProjects } from '@/data/seedData';
import { apiWrapper } from '@/services/api';
import { toast } from 'sonner';

interface SeedingProgress {
  step: string;
  progress: number;
  total: number;
  completed: boolean;
}

interface SeedingOptions {
  includeUsers?: boolean;
  includeProjects?: boolean;
  includeTasks?: boolean;
  includeDocuments?: boolean;
  includeOrganizations?: boolean;
  additionalProjectCount?: number;
  onProgress?: (progress: SeedingProgress) => void;
  delay?: number; // Delay between API calls in ms
}

class DatabaseSeeder {
  private static instance: DatabaseSeeder;
  private isSeeding = false;

  private constructor() {}

  public static getInstance(): DatabaseSeeder {
    if (!DatabaseSeeder.instance) {
      DatabaseSeeder.instance = new DatabaseSeeder();
    }
    return DatabaseSeeder.instance;
  }

  async seedDatabase(options: SeedingOptions = {}): Promise<void> {
    if (this.isSeeding) {
      throw new Error('Seeding is already in progress');
    }

    const {
      includeUsers = true,
      includeProjects = true,
      includeTasks = true,
      includeDocuments = false, // Documents require actual file uploads
      includeOrganizations = true,
      additionalProjectCount = 0,
      onProgress,
      delay = 500,
    } = options;

    this.isSeeding = true;
    let currentStep = 0;
    const totalSteps = this.calculateTotalSteps(options);

    try {
      toast.info('Starting database seeding...', {
        description: 'This may take a few minutes',
      });

      // Step 1: Seed Organizations
      if (includeOrganizations) {
        await this.reportProgress('Seeding Organizations', currentStep++, totalSteps, onProgress);
        await this.seedOrganizations(delay);
      }

      // Step 2: Seed Users
      if (includeUsers) {
        await this.reportProgress('Seeding Users', currentStep++, totalSteps, onProgress);
        await this.seedUsers(delay);
      }

      // Step 3: Seed Projects
      if (includeProjects) {
        await this.reportProgress('Seeding Projects', currentStep++, totalSteps, onProgress);
        await this.seedProjects(delay);

        // Add additional generated projects
        if (additionalProjectCount > 0) {
          await this.reportProgress('Generating Additional Projects', currentStep++, totalSteps, onProgress);
          await this.seedAdditionalProjects(additionalProjectCount, delay);
        }
      }

      // Step 4: Seed Tasks
      if (includeTasks) {
        await this.reportProgress('Seeding Tasks', currentStep++, totalSteps, onProgress);
        await this.seedTasks(delay);
      }

      // Step 5: Seed Documents (metadata only)
      if (includeDocuments) {
        await this.reportProgress('Seeding Document Metadata', currentStep++, totalSteps, onProgress);
        await this.seedDocumentMetadata(delay);
      }

      await this.reportProgress('Seeding Complete', totalSteps, totalSteps, onProgress, true);

      toast.success('Database seeding completed successfully!', {
        description: `Seeded ${totalSteps} data categories`,
      });

    } catch (error) {
      console.error('Seeding failed:', error);
      toast.error('Database seeding failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      throw error;
    } finally {
      this.isSeeding = false;
    }
  }

  private calculateTotalSteps(options: SeedingOptions): number {
    let steps = 0;
    if (options.includeOrganizations) steps++;
    if (options.includeUsers) steps++;
    if (options.includeProjects) steps++;
    if (options.additionalProjectCount && options.additionalProjectCount > 0) steps++;
    if (options.includeTasks) steps++;
    if (options.includeDocuments) steps++;
    return steps;
  }

  private async reportProgress(
    step: string,
    current: number,
    total: number,
    onProgress?: (progress: SeedingProgress) => void,
    completed = false
  ): Promise<void> {
    const progress: SeedingProgress = {
      step,
      progress: current,
      total,
      completed,
    };

    onProgress?.(progress);
    console.log(`Seeding Progress: ${step} (${current}/${total})`);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async seedOrganizations(delayMs: number): Promise<void> {
    for (const org of SEED_DATA.organizations) {
      try {
        await apiWrapper.post('/organizations', org);
        await this.delay(delayMs);
      } catch (error) {
        // Organization might already exist, continue with next
        console.warn(`Failed to create organization ${org.name}:`, error);
      }
    }
  }

  private async seedUsers(delayMs: number): Promise<void> {
    for (const user of SEED_DATA.users) {
      try {
        // Create user with registration endpoint
        const userData = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: 'TempPassword123!', // Default password for seed users
          confirmPassword: 'TempPassword123!',
          role: user.role,
          phoneNumber: user.phone,
          companyName: 'Daritana Architecture',
        };

        await apiWrapper.post('/auth/register', userData);
        await this.delay(delayMs);
      } catch (error) {
        // User might already exist, continue with next
        console.warn(`Failed to create user ${user.email}:`, error);
      }
    }
  }

  private async seedProjects(delayMs: number): Promise<void> {
    for (const project of SEED_DATA.projects) {
      try {
        await apiWrapper.post('/projects', project);
        await this.delay(delayMs);
      } catch (error) {
        console.warn(`Failed to create project ${project.name}:`, error);
      }
    }
  }

  private async seedAdditionalProjects(count: number, delayMs: number): Promise<void> {
    // Assume first organization for generated projects
    const organizationId = SEED_DATA.organizations[0]?.id || 'org-001';
    const additionalProjects = generateAdditionalProjects(count, organizationId);

    for (const project of additionalProjects) {
      try {
        await apiWrapper.post('/projects', project);
        await this.delay(delayMs);
      } catch (error) {
        console.warn(`Failed to create generated project ${project.name}:`, error);
      }
    }
  }

  private async seedTasks(delayMs: number): Promise<void> {
    for (const task of SEED_DATA.tasks) {
      try {
        await apiWrapper.post('/tasks', task);
        await this.delay(delayMs);
      } catch (error) {
        console.warn(`Failed to create task ${task.title}:`, error);
      }
    }
  }

  private async seedDocumentMetadata(delayMs: number): Promise<void> {
    for (const doc of SEED_DATA.documents) {
      try {
        // Create document metadata (without actual file)
        const documentData = {
          name: doc.name,
          category: doc.category,
          description: `Seeded document: ${doc.name}`,
          projectId: doc.projectId,
          isPublic: doc.isPublic || false,
          tags: doc.tags || [],
        };

        await apiWrapper.post('/documents/metadata', documentData);
        await this.delay(delayMs);
      } catch (error) {
        console.warn(`Failed to create document metadata ${doc.name}:`, error);
      }
    }
  }

  // Utility methods for specific seeding scenarios
  async seedDemoData(): Promise<void> {
    return this.seedDatabase({
      includeUsers: true,
      includeProjects: true,
      includeTasks: true,
      includeDocuments: false,
      includeOrganizations: true,
      additionalProjectCount: 10,
      delay: 300,
    });
  }

  async seedDevelopmentData(): Promise<void> {
    return this.seedDatabase({
      includeUsers: true,
      includeProjects: true,
      includeTasks: true,
      includeDocuments: true,
      includeOrganizations: true,
      additionalProjectCount: 25,
      delay: 100,
    });
  }

  async seedTestData(): Promise<void> {
    return this.seedDatabase({
      includeUsers: true,
      includeProjects: true,
      includeTasks: true,
      includeDocuments: false,
      includeOrganizations: true,
      additionalProjectCount: 5,
      delay: 50,
    });
  }

  // Method to clear existing data (use with caution!)
  async clearAllData(): Promise<void> {
    if (import.meta.env.PROD) {
      throw new Error('Data clearing is not allowed in production environment');
    }

    toast.warning('Clearing all data...', {
      description: 'This action cannot be undone',
    });

    try {
      // Clear data in reverse dependency order
      await apiWrapper.delete('/tasks/all');
      await apiWrapper.delete('/documents/all');
      await apiWrapper.delete('/projects/all');
      await apiWrapper.delete('/users/all');
      await apiWrapper.delete('/organizations/all');

      toast.success('All data cleared successfully');
    } catch (error) {
      toast.error('Failed to clear data', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Method to reset to initial state
  async resetToInitialState(): Promise<void> {
    if (import.meta.env.PROD) {
      throw new Error('Data reset is not allowed in production environment');
    }

    await this.clearAllData();
    await this.delay(1000); // Wait for cleanup
    await this.seedDemoData();
  }

  // Check if seeding is currently in progress
  get isSeedingInProgress(): boolean {
    return this.isSeeding;
  }
}

// Export singleton instance
export const databaseSeeder = DatabaseSeeder.getInstance();

// Utility functions for common seeding operations
export const seedDemoData = () => databaseSeeder.seedDemoData();
export const seedDevelopmentData = () => databaseSeeder.seedDevelopmentData();
export const seedTestData = () => databaseSeeder.seedTestData();
export const clearAllData = () => databaseSeeder.clearAllData();
export const resetToInitialState = () => databaseSeeder.resetToInitialState();

// Development-only seeding commands
if (import.meta.env.DEV) {
  (window as any).seedDatabase = {
    demo: seedDemoData,
    development: seedDevelopmentData,
    test: seedTestData,
    clear: clearAllData,
    reset: resetToInitialState,
    custom: (options: SeedingOptions) => databaseSeeder.seedDatabase(options),
  };
}