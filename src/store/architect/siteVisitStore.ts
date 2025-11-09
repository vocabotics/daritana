import { create } from 'zustand';
import { SiteVisit, SitePhoto, SiteIssue } from '@/types/architect';
import { siteVisitService } from '@/services/architect/siteVisit.service';

interface SiteVisitStore {
  // State
  siteVisits: SiteVisit[];
  currentSiteVisit: SiteVisit | null;
  weatherData: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
  } | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchSiteVisits: (projectId?: string, dateRange?: { from: string; to: string }) => Promise<void>;
  fetchSiteVisit: (id: string) => Promise<void>;
  createSiteVisit: (visit: Omit<SiteVisit, 'id' | 'visitNumber' | 'createdAt'>) => Promise<SiteVisit>;
  updateSiteVisit: (id: string, updates: Partial<SiteVisit>) => Promise<void>;
  uploadPhotos: (visitId: string, photos: File[]) => Promise<SitePhoto[]>;
  createIssue: (visitId: string, issue: Omit<SiteIssue, 'id'>) => Promise<SiteIssue>;
  generateReport: (visitId: string) => Promise<string>;
  fetchWeatherData: (location: string, date: string) => Promise<void>;
  clearError: () => void;
}

export const useSiteVisitStore = create<SiteVisitStore>((set, get) => ({
  // Initial state
  siteVisits: [],
  currentSiteVisit: null,
  weatherData: null,
  loading: false,
  error: null,

  // Fetch all site visits
  fetchSiteVisits: async (projectId?: string, dateRange?: { from: string; to: string }) => {
    set({ loading: true, error: null });
    try {
      const siteVisits = await siteVisitService.getSiteVisits(projectId, dateRange);
      set({ siteVisits, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch site visits', loading: false });
      console.error(error);
    }
  },

  // Fetch single site visit
  fetchSiteVisit: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const siteVisit = await siteVisitService.getSiteVisit(id);
      set({ currentSiteVisit: siteVisit, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch site visit', loading: false });
      console.error(error);
    }
  },

  // Create new site visit
  createSiteVisit: async (visit: Omit<SiteVisit, 'id' | 'visitNumber' | 'createdAt'>) => {
    set({ loading: true, error: null });
    try {
      const newSiteVisit = await siteVisitService.createSiteVisit(visit);
      set((state) => ({
        siteVisits: [newSiteVisit, ...state.siteVisits],
        loading: false,
      }));
      return newSiteVisit;
    } catch (error) {
      set({ error: 'Failed to create site visit', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Update site visit
  updateSiteVisit: async (id: string, updates: Partial<SiteVisit>) => {
    set({ loading: true, error: null });
    try {
      const updatedSiteVisit = await siteVisitService.updateSiteVisit(id, updates);
      set((state) => ({
        siteVisits: state.siteVisits.map(visit => visit.id === id ? updatedSiteVisit : visit),
        currentSiteVisit: state.currentSiteVisit?.id === id ? updatedSiteVisit : state.currentSiteVisit,
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update site visit', loading: false });
      console.error(error);
    }
  },

  // Upload photos
  uploadPhotos: async (visitId: string, photos: File[]) => {
    set({ loading: true, error: null });
    try {
      const newPhotos = await siteVisitService.uploadPhotos(visitId, photos);
      set((state) => {
        const updatedSiteVisits = state.siteVisits.map(visit => {
          if (visit.id === visitId) {
            return {
              ...visit,
              photos: [...visit.photos, ...newPhotos],
            };
          }
          return visit;
        });

        const updatedCurrentSiteVisit = state.currentSiteVisit?.id === visitId
          ? { ...state.currentSiteVisit, photos: [...state.currentSiteVisit.photos, ...newPhotos] }
          : state.currentSiteVisit;

        return {
          siteVisits: updatedSiteVisits,
          currentSiteVisit: updatedCurrentSiteVisit,
          loading: false,
        };
      });
      return newPhotos;
    } catch (error) {
      set({ error: 'Failed to upload photos', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Create issue
  createIssue: async (visitId: string, issue: Omit<SiteIssue, 'id'>) => {
    set({ loading: true, error: null });
    try {
      const newIssue = await siteVisitService.createIssue(visitId, issue);
      set((state) => {
        const updatedSiteVisits = state.siteVisits.map(visit => {
          if (visit.id === visitId) {
            return {
              ...visit,
              issues: [...visit.issues, newIssue],
            };
          }
          return visit;
        });

        const updatedCurrentSiteVisit = state.currentSiteVisit?.id === visitId
          ? { ...state.currentSiteVisit, issues: [...state.currentSiteVisit.issues, newIssue] }
          : state.currentSiteVisit;

        return {
          siteVisits: updatedSiteVisits,
          currentSiteVisit: updatedCurrentSiteVisit,
          loading: false,
        };
      });
      return newIssue;
    } catch (error) {
      set({ error: 'Failed to create issue', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Generate report
  generateReport: async (visitId: string) => {
    set({ loading: true, error: null });
    try {
      const reportUrl = await siteVisitService.generateReport(visitId);
      set({ loading: false });
      return reportUrl;
    } catch (error) {
      set({ error: 'Failed to generate report', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Fetch weather data
  fetchWeatherData: async (location: string, date: string) => {
    try {
      const weatherData = await siteVisitService.getWeatherData(location, date);
      set({ weatherData });
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));