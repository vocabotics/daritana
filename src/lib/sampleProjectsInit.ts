import { ProjectContextItem, useProjectContextStore } from '@/store/projectContextStore';

// Service interface for project initialization
export interface ProjectInitService {
  getSampleProjects(): Promise<ProjectContextItem[]>;
  initializeProjects(): Promise<void>;
}

// Default empty structures for real API integration
export const sampleProjects: ProjectContextItem[] = [];

// Sample data for demo mode (minimal examples)
export const demoProjects: ProjectContextItem[] = [
  {
    id: 'demo-proj-1',
    name: 'Demo Project',
    type: 'residential',
    status: 'in_progress',
    progress: 50,
    coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
    lastAccessedAt: new Date().toISOString(),
    client: {
      name: 'Demo Client',
      companyName: 'Demo Company'
    }
  }
];

// Initialize demo projects for development
export const initializeSampleProjects = () => {
  const store = useProjectContextStore.getState();
  
  // Add demo projects to recent projects to populate the context switcher
  demoProjects.forEach(project => {
    store.addRecentProject(project);
  });

  // Set project colors for visual consistency
  const projectColors = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#06B6D4'  // cyan
  ];

  // Assign colors to demo projects
  demoProjects.forEach((project, index) => {
    store.setProjectColor(project.id, projectColors[index % projectColors.length]);
  });
};

// Export empty array for real API integration
export const mockSampleProjects = sampleProjects;