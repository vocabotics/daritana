import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useSessionManager } from '@/hooks/useSessionManager';
import { LoginPage } from '@/components/auth/LoginForm';
import { PageLoading, FullPageLoading } from '@/components/ui/loading';
import { Toaster } from '@/components/ui/sonner';
import { ARIAProvider } from '@/components/aria/ARIAProvider';
import { ARIAFloatingAssistant } from '@/components/aria/ARIAFloatingAssistant';
import { initializeAIServices } from '@/services/ai';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

// Core Pages (loaded immediately)
import { UltimateStudioHub } from '@/pages/UltimateStudioHub';
import { SmartDashboard } from '@/pages/SmartDashboard';
import { Projects } from '@/pages/Projects';
import { ProjectDetail } from '@/pages/ProjectDetail';

// Lazy loaded pages for better performance
const KanbanPage = lazy(() => import('@/pages/KanbanPage'));
const TimelinePage = lazy(() => import('@/pages/TimelinePage'));
const DesignBriefPage = lazy(() => import('@/pages/DesignBriefPage'));
const Files = lazy(() => import('@/pages/Files'));
const Documents = lazy(() => import('@/pages/Documents'));
const Profile = lazy(() => import('@/pages/Profile'));
const TeamPage = lazy(() => import('@/pages/TeamPage'));
const Financial = lazy(() => import('@/pages/Financial'));
const Compliance = lazy(() => import('@/pages/Compliance'));
const SecuritySettings = lazy(() => import('@/pages/SecuritySettings'));
const Community = lazy(() => import('@/pages/Community'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const Settings = lazy(() => import('@/pages/Settings'));
const AdminPortal = lazy(() => import('@/pages/AdminPortal'));
const AdminPermissions = lazy(() => import('@/pages/AdminPermissions'));
const EnterprisePM = lazy(() => import('@/pages/EnterprisePM'));
const HRDashboard = lazy(() => import('@/pages/HRDashboard'));
const LearningDashboard = lazy(() => import('@/pages/LearningDashboard'));
const SearchResults = lazy(() => import('@/pages/SearchResults'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Integrations = lazy(() => import('@/pages/Integrations'));
const SecurityEnhanced = lazy(() => import('@/pages/SecurityEnhanced'));
const Performance = lazy(() => import('@/pages/Performance'));
const ActivityFeedExample = lazy(() => import('@/pages/ActivityFeedExample'));
const ARIACommandCenter = lazy(() => import('@/components/aria/ARIACommandCenter'));

// Import specific dashboard for construction
const ConstructionDashboard = lazy(() => 
  import('@/pages/ConstructionProgress/ConstructionDashboard').then(module => ({
    default: module.ConstructionDashboard
  }))
);

function AppEnhanced() {
  const { isAuthenticated, user, isLoading, getCurrentUser } = useAuth();
  const baseUrl = import.meta.env.BASE_URL || '/';
  
  // Enhanced session management
  useSessionManager({
    sessionTimeout: 30, // 30 minutes
    warningTime: 5,     // 5 minutes warning
    checkInterval: 1,   // Check every minute
    autoLogoutOnVisible: true,
    showWarnings: true,
  });
  
  // Progressive Web App features
  const { offlineReady, updateAvailable } = useServiceWorker();
  
  // Initialize services when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Initialize AI services
      initializeAIServices().catch(error => {
        console.error('Failed to initialize AI services:', error);
      });
      
      // Refresh user data on mount
      getCurrentUser().catch(error => {
        console.error('Failed to refresh user data:', error);
      });
    }
  }, [isAuthenticated, getCurrentUser]);

  // Show full-page loading while initializing
  if (isLoading) {
    return (
      <FullPageLoading 
        message="Initializing Daritana..." 
      />
    );
  }

  // Lazy loading fallback component
  const LazyFallback: React.FC<{ pageName?: string }> = ({ pageName }) => (
    <PageLoading 
      title={pageName ? `Loading ${pageName}...` : "Loading..."} 
      description="Please wait while we prepare your content"
    />
  );

  // Check if user is new organization
  const isNewOrganization = false; // This would come from auth state

  return (
    <ErrorBoundary>
      <Router basename={baseUrl}>
        <ARIAProvider>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />
              
              {/* Onboarding route */}
              <Route path="/onboarding" element={
                <ProtectedRoute requireAuth={true}>
                  <OnboardingWizard />
                </ProtectedRoute>
              } />

              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigate to={isNewOrganization ? "/onboarding" : "/dashboard"} replace />
                </ProtectedRoute>
              } />

              {/* Core Dashboard Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  {isNewOrganization ? (
                    <Navigate to="/onboarding" replace />
                  ) : (
                    <UltimateStudioHub />
                  )}
                </ProtectedRoute>
              } />

              <Route path="/widgets-dashboard" element={
                <ProtectedRoute>
                  <SmartDashboard />
                </ProtectedRoute>
              } />

              {/* Project Management Routes */}
              <Route path="/projects" element={
                <ProtectedRoute requiredPermission="view_projects">
                  <Projects />
                </ProtectedRoute>
              } />

              <Route path="/projects/:id" element={
                <ProtectedRoute requiredPermission="view_projects">
                  <ProjectDetail />
                </ProtectedRoute>
              } />

              <Route path="/enterprise-pm" element={
                <ProtectedRoute requiredPermission="manage_projects">
                  <Suspense fallback={<LazyFallback pageName="Enterprise PM" />}>
                    <EnterprisePM />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Task Management Routes */}
              <Route path="/kanban" element={
                <ProtectedRoute requiredPermission="view_tasks">
                  <Suspense fallback={<LazyFallback pageName="Kanban Board" />}>
                    <KanbanPage />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/tasks" element={
                <ProtectedRoute requiredPermission="view_tasks">
                  <Suspense fallback={<LazyFallback pageName="Tasks" />}>
                    <KanbanPage />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Timeline and Calendar */}
              <Route path="/timeline" element={
                <ProtectedRoute requiredPermission="view_projects">
                  <Suspense fallback={<LazyFallback pageName="Timeline" />}>
                    <TimelinePage />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/calendar" element={
                <ProtectedRoute requiredPermission="view_projects">
                  <Suspense fallback={<LazyFallback pageName="Calendar" />}>
                    <TimelinePage />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Design and Documents */}
              <Route path="/design-brief" element={
                <ProtectedRoute requiredPermission="edit_designs">
                  <Suspense fallback={<LazyFallback pageName="Design Brief" />}>
                    <DesignBriefPage />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/files" element={
                <ProtectedRoute requiredPermission="view_files">
                  <Suspense fallback={<LazyFallback pageName="Files" />}>
                    <Files />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/documents" element={
                <ProtectedRoute requiredPermission="view_files">
                  <Suspense fallback={<LazyFallback pageName="Documents" />}>
                    <Documents />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Team and HR */}
              <Route path="/team" element={
                <ProtectedRoute requiredPermission="view_team">
                  <Suspense fallback={<LazyFallback pageName="Team" />}>
                    <TeamPage />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/hr" element={
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={<LazyFallback pageName="HR Dashboard" />}>
                    <HRDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Financial */}
              <Route path="/financial" element={
                <ProtectedRoute requiredPermission="view_financials">
                  <Suspense fallback={<LazyFallback pageName="Financial" />}>
                    <Financial />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/quotations" element={
                <ProtectedRoute requiredPermission="view_financials">
                  <Suspense fallback={<LazyFallback pageName="Quotations" />}>
                    <Financial />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/invoices" element={
                <ProtectedRoute requiredPermission="view_financials">
                  <Suspense fallback={<LazyFallback pageName="Invoices" />}>
                    <Financial />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Community and Marketplace */}
              <Route path="/community" element={
                <ProtectedRoute>
                  <Suspense fallback={<LazyFallback pageName="Community" />}>
                    <Community />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/marketplace" element={
                <ProtectedRoute>
                  <Suspense fallback={<LazyFallback pageName="Marketplace" />}>
                    <Marketplace />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Analytics and Reporting */}
              <Route path="/analytics" element={
                <ProtectedRoute requiredPermission="view_analytics">
                  <Suspense fallback={<LazyFallback pageName="Analytics" />}>
                    <Analytics />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/reports" element={
                <ProtectedRoute requiredPermission="view_analytics">
                  <SmartDashboard />
                </ProtectedRoute>
              } />

              {/* Settings and Profile */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Suspense fallback={<LazyFallback pageName="Profile" />}>
                    <Profile />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <Suspense fallback={<LazyFallback pageName="Settings" />}>
                    <Settings />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Security and Compliance */}
              <Route path="/security" element={
                <ProtectedRoute requiredPermission="manage_security">
                  <Suspense fallback={<LazyFallback pageName="Security" />}>
                    <SecuritySettings />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/security-enhanced" element={
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={<LazyFallback pageName="Enhanced Security" />}>
                    <SecurityEnhanced />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/compliance" element={
                <ProtectedRoute requiredPermission="manage_compliance">
                  <Suspense fallback={<LazyFallback pageName="Compliance" />}>
                    <Compliance />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin/*" element={
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={<LazyFallback pageName="Admin Portal" />}>
                    <AdminPortal />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/admin-permissions" element={
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={<LazyFallback pageName="Permissions" />}>
                    <AdminPermissions />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Additional Features */}
              <Route path="/integrations" element={
                <ProtectedRoute requiredPermission="manage_integrations">
                  <Suspense fallback={<LazyFallback pageName="Integrations" />}>
                    <Integrations />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/performance" element={
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={<LazyFallback pageName="Performance" />}>
                    <Performance />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/learning" element={
                <ProtectedRoute>
                  <Suspense fallback={<LazyFallback pageName="Learning" />}>
                    <LearningDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/construction/:siteId" element={
                <ProtectedRoute requiredPermission="view_construction">
                  <Suspense fallback={<LazyFallback pageName="Construction" />}>
                    <ConstructionDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/construction" element={
                <ProtectedRoute requiredPermission="view_construction">
                  <Suspense fallback={<LazyFallback pageName="Construction" />}>
                    <ConstructionDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/activity-feed" element={
                <ProtectedRoute>
                  <Suspense fallback={<LazyFallback pageName="Activity Feed" />}>
                    <ActivityFeedExample />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/aria" element={
                <ProtectedRoute>
                  <Suspense fallback={<LazyFallback pageName="ARIA Assistant" />}>
                    <ARIACommandCenter />
                  </Suspense>
                </ProtectedRoute>
              } />

              <Route path="/search-results" element={
                <ProtectedRoute>
                  <Suspense fallback={<LazyFallback pageName="Search Results" />}>
                    <SearchResults />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Fallback routes */}
              <Route path="/unauthorized" element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                  </div>
                </div>
              } />

              {/* Catch all route */}
              <Route path="*" element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              } />
            </Routes>

            {/* Global components for authenticated users */}
            {isAuthenticated && (
              <>
                <InstallPrompt />
                <ARIAFloatingAssistant />
              </>
            )}
          </div>

          {/* Global toast notifications */}
          <Toaster />
        </ARIAProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default AppEnhanced;