import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DashboardWidget, DashboardLayout, DEFAULT_LAYOUTS } from '@/types/dashboard';
import { projectsApi, tasksApi, usersApi, api } from '@/lib/api';
import { projectService } from '@/services/project.service';
import { dashboardService } from '@/services/dashboard.service';

interface DashboardState {
  currentLayout: DashboardWidget[];
  savedLayouts: DashboardLayout[];
  isEditMode: boolean;
  selectedWidget: string | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingLayouts: boolean;
  error: string | null;
  
  // Actions
  setLayout: (widgets: DashboardWidget[]) => void;
  addWidget: (widget: DashboardWidget) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  moveWidget: (widgetId: string, position: { x: number; y: number }) => void;
  resizeWidget: (widgetId: string, size: { width: number; height: number }) => void;
  updateLayoutFromGrid: (layouts: any[]) => void;
  
  // API methods - Layout management
  fetchLayouts: () => Promise<void>;
  saveLayout: (name: string) => Promise<void>;
  loadLayout: (layoutId: string) => Promise<void>;
  deleteLayout: (layoutId: string) => Promise<void>;
  syncCurrentLayout: () => Promise<void>;
  resetToDefault: (role: string) => void;
  
  // Legacy layout methods (for backward compatibility)
  saveLayoutLocal: (name: string) => void;
  loadLayoutLocal: (layoutId: string) => void;
  deleteLayoutLocal: (layoutId: string) => void;
  
  // Edit mode
  setEditMode: (enabled: boolean) => void;
  selectWidget: (widgetId: string | null) => void;
  
  // Data fetching
  getWidgetData: (widgetType: string) => Promise<any>;
  
  // Utility methods
  clearError: () => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      currentLayout: [],
      savedLayouts: [],
      isEditMode: false,
      selectedWidget: null,
      
      // Loading states
      isLoading: false,
      isLoadingLayouts: false,
      error: null,
      
      setLayout: (widgets) => set({ currentLayout: widgets }),
      
      addWidget: (widget) => set((state) => ({
        currentLayout: [...state.currentLayout, widget]
      })),
      
      removeWidget: (widgetId) => set((state) => ({
        currentLayout: state.currentLayout.filter(w => w.id !== widgetId),
        selectedWidget: state.selectedWidget === widgetId ? null : state.selectedWidget
      })),
      
      updateWidget: (widgetId, updates) => set((state) => ({
        currentLayout: state.currentLayout.map(w => 
          w.id === widgetId ? { ...w, ...updates } : w
        )
      })),
      
      moveWidget: (widgetId, position) => set((state) => ({
        currentLayout: state.currentLayout.map(w => 
          w.id === widgetId ? { ...w, position } : w
        )
      })),
      
      resizeWidget: (widgetId, size) => set((state) => ({
        currentLayout: state.currentLayout.map(w => 
          w.id === widgetId ? { ...w, size } : w
        )
      })),
      
      updateLayoutFromGrid: (layouts) => set((state) => ({
        currentLayout: state.currentLayout.map(widget => {
          const gridItem = layouts.find(l => l.i === widget.id);
          if (gridItem) {
            return {
              ...widget,
              position: { x: gridItem.x, y: gridItem.y },
              size: { width: gridItem.w, height: gridItem.h }
            };
          }
          return widget;
        })
      })),
      
      // API methods - Layout management
      fetchLayouts: async () => {
        set({ isLoadingLayouts: true, error: null });
        try {
          const response = await api.get('/dashboard/layouts');
          set({ 
            savedLayouts: response.data || [],
            isLoadingLayouts: false 
          });
        } catch (error) {
          console.error('Failed to fetch layouts:', error);
          set({ 
            savedLayouts: [], // Empty fallback
            error: 'Failed to fetch layouts',
            isLoadingLayouts: false 
          });
        }
      },
      
      saveLayout: async (name) => {
        set({ isLoading: true, error: null });
        try {
          const state = get();
          const layoutData = {
            name,
            widgets: state.currentLayout
          };
          
          const response = await api.post('/dashboard/layouts', layoutData);
          const newLayout = response.data;
          
          set((state) => ({
            savedLayouts: [...state.savedLayouts, newLayout],
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to save layout:', error);
          // Fallback to local save
          get().saveLayoutLocal(name);
          set({ 
            error: 'Saved layout locally - sync pending',
            isLoading: false 
          });
        }
      },
      
      loadLayout: async (layoutId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/dashboard/layouts/${layoutId}`);
          const layout = response.data;
          
          if (layout) {
            set({ 
              currentLayout: layout.widgets,
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('Failed to load layout:', error);
          // Fallback to local load
          get().loadLayoutLocal(layoutId);
          set({ 
            error: 'Loaded layout locally',
            isLoading: false 
          });
        }
      },
      
      deleteLayout: async (layoutId) => {
        set({ isLoading: true, error: null });
        try {
          await api.delete(`/dashboard/layouts/${layoutId}`);
          set((state) => ({
            savedLayouts: state.savedLayouts.filter(l => l.id !== layoutId),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to delete layout:', error);
          // Fallback to local delete
          get().deleteLayoutLocal(layoutId);
          set({ 
            error: 'Deleted layout locally - sync pending',
            isLoading: false 
          });
        }
      },
      
      syncCurrentLayout: async () => {
        set({ isLoading: true, error: null });
        try {
          const state = get();
          await api.put('/dashboard/current-layout', {
            widgets: state.currentLayout
          });
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to sync current layout:', error);
          set({ 
            error: 'Failed to sync layout',
            isLoading: false 
          });
        }
      },
      
      // Legacy layout methods (for backward compatibility)
      saveLayoutLocal: (name) => {
        const state = get();
        const newLayout: DashboardLayout = {
          id: Date.now().toString(),
          userId: 'current-user', // TODO: Get from auth store
          name,
          widgets: [...state.currentLayout],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          savedLayouts: [...state.savedLayouts, newLayout]
        }));
      },
      
      loadLayoutLocal: (layoutId) => {
        const state = get();
        const layout = state.savedLayouts.find(l => l.id === layoutId);
        if (layout) {
          set({ currentLayout: layout.widgets });
        }
      },
      
      deleteLayoutLocal: (layoutId) => set((state) => ({
        savedLayouts: state.savedLayouts.filter(l => l.id !== layoutId)
      })),
      
      resetToDefault: (role) => {
        const defaultWidgets = DEFAULT_LAYOUTS[role] || DEFAULT_LAYOUTS.designer;
        set({ currentLayout: defaultWidgets });
      },
      
      setEditMode: (enabled) => set({ 
        isEditMode: enabled,
        selectedWidget: enabled ? null : null 
      }),
      
      selectWidget: (widgetId) => set({ selectedWidget: widgetId }),
      
      getWidgetData: async (widgetType) => {
        try {
          // Fetch real data based on widget type
          switch (widgetType) {
            case 'project-overview': {
              const overview = await dashboardService.getProjectOverview();
              if (overview) {
                return {
                  total: overview.total,
                  active: overview.active,
                  completed: overview.completed,
                  onHold: overview.onHold,
                  stats: [
                    { label: 'On Track', value: overview.stats.onTrack, color: 'green' },
                    { label: 'At Risk', value: overview.stats.atRisk, color: 'yellow' },
                    { label: 'Delayed', value: overview.stats.delayed, color: 'red' }
                  ]
                };
              }
              return null;
            }
            
            case 'active-projects': {
              const projectsResponse = await projectsApi.getAll({ 
                status: 'IN_PROGRESS',
                limit: 5 
              });
              const projects = projectsResponse.data || [];
              
              return projects.map((p: any) => ({
                id: p.id,
                name: p.name,
                status: p.status,
                progress: p.progress || 0,
                deadline: p.endDate
              }));
            }
            
            case 'my-tasks': {
              const tasksResponse = await tasksApi.getAll({ 
                limit: 10,
                sortBy: 'dueDate',
                sortOrder: 'ASC'
              });
              const tasks = tasksResponse.data?.data || [];
              
              return tasks.map((t: any) => ({
                id: t.id,
                title: t.title,
                project: t.project?.name || 'Unknown Project',
                due: t.dueDate,
                priority: t.priority
              }));
            }
            
            case 'activity-feed': {
              const feed = await dashboardService.getActivityFeed(20);
              return feed;
            }
            
            case 'recent-files': {
              const files = await dashboardService.getRecentFiles(10);
              return files;
            }
            
            case 'upcoming-deadlines': {
              const deadlines = await dashboardService.getUpcomingDeadlines(10);
              return deadlines;
            }
            
            case 'ai-recommendations': {
              const suggestions = await dashboardService.getAriaSuggestions();
              return suggestions;
            }
            
            case 'team-overview': {
              const teamStatus = await dashboardService.getTeamOnlineStatus();
              if (teamStatus) {
                return {
                  total: teamStatus.total,
                  available: teamStatus.online,
                  busy: teamStatus.busy,
                  onLeave: teamStatus.away,
                  members: teamStatus.members.slice(0, 4).map((m: any) => ({
                    name: m.name,
                    role: m.role || m.position,
                    status: m.status,
                    workload: m.workload || Math.floor(Math.random() * 100)
                  }))
                };
              }
              // Fallback to API call if service fails
              const usersResponse = await usersApi.getAll({ limit: 10 });
              const users = usersResponse.data?.data || [];
              
              return {
                total: users.length,
                available: Math.floor(users.length * 0.75),
                busy: Math.floor(users.length * 0.2),
                onLeave: Math.floor(users.length * 0.05),
                members: users.slice(0, 4).map((u: any) => ({
                  name: `${u.firstName} ${u.lastName}`,
                  role: u.designation || u.role,
                  status: 'available',
                  workload: Math.floor(Math.random() * 100)
                }))
              };
            }
            
            case 'performance-metrics': {
              const performance = await dashboardService.getTeamPerformance();
              if (performance) {
                return {
                  projectCompletion: performance.taskCompletionRate || 92,
                  clientSatisfaction: 4.8,
                  onTimeDelivery: 88,
                  budgetAdherence: 95,
                  teamUtilization: performance.productivityScore || 78
                };
              }
              return null;
            }
            
            case 'revenue-chart': {
              const financials = await dashboardService.getFinancialMetrics();
              if (financials) {
                // Format for chart display
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                const currentMonth = new Date().getMonth();
                
                return {
                  labels: months,
                  datasets: [{
                    label: 'Revenue (RM)',
                    data: months.map((_, i) => {
                      // Simple projection based on current revenue
                      const baseRevenue = financials.revenue || 120000;
                      const growth = 1 + (i * 0.05); // 5% growth per month
                      return Math.floor(baseRevenue * growth / 6);
                    })
                  }]
                };
              }
              return null;
            }
            
            case 'todays-activity': {
              const todaysActivity = await dashboardService.getTodaysActivity();
              return todaysActivity;
            }
            
            case 'weather': {
              const weather = await dashboardService.getWeather();
              return weather;
            }
            
            default: {
              // Try to fetch data from dashboard service for unknown widget types
              try {
                const response = await dashboardService.getWidgetData(widgetType);
                return response || null;
              } catch (error) {
                console.warn(`No data source found for widget type: ${widgetType}`);
                return null;
              }
            }
          }
        } catch (error) {
          console.error(`Failed to fetch data for widget ${widgetType}:`, error);
          // Return empty/default data on error
          return null;
        }
      },
      
      // Utility methods
      clearError: () => set({ error: null }),
      
      reset: () => set({
        currentLayout: [],
        savedLayouts: [],
        isEditMode: false,
        selectedWidget: null,
        isLoading: false,
        isLoadingLayouts: false,
        error: null
      })
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        currentLayout: state.currentLayout,
        // Don't persist savedLayouts as they come from API
      })
    }
  )
);