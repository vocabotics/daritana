import { ProjectContextItem, useProjectContextStore } from '@/store/projectContextStore';

// Service interface for project initialization
export interface ProjectInitService {
  getSampleProjects(): Promise<ProjectContextItem[]>;
  initializeProjects(): Promise<void>;
}

// ✅ No sample/demo projects - all projects fetched from backend API
export const sampleProjects: ProjectContextItem[] = [];

// Initialize projects from backend API
export const initializeSampleProjects = async () => {
  const store = useProjectContextStore.getState();

  try {
    // Fetch real projects from API
    const response = await fetch('/api/projects/recent', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      console.error('Failed to fetch recent projects');
      return;
    }

    const projects = await response.json();

    // Add recent projects to store
    projects.forEach((project: ProjectContextItem) => {
      store.addRecentProject(project);
    });

    // Assign colors to projects
    const projectColors = [
      '#3B82F6', // blue
      '#10B981', // emerald
      '#F59E0B', // amber
      '#EF4444', // red
      '#8B5CF6', // violet
      '#06B6D4'  // cyan
    ];

    projects.forEach((project: ProjectContextItem, index: number) => {
      store.setProjectColor(project.id, projectColors[index % projectColors.length]);
    });
  } catch (error) {
    console.error('Failed to initialize projects:', error);
  }
};

// ✅ No mock data exported
export const mockSampleProjects = sampleProjects;