import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { settingsService } from '@/services/settings.service';
import './i18n'; // Initialize i18n
import { LoginPage } from '@/components/auth/LoginForm';
import { SmartDashboard } from '@/pages/SmartDashboard';
import { UltimateStudioHub } from '@/pages/UltimateStudioHub';
import { Projects } from '@/pages/Projects';
import { KanbanPage } from '@/pages/KanbanPage';
import { TimelinePage } from '@/pages/TimelinePage';
import { DesignBriefPage } from '@/pages/DesignBriefPage';
import { Files } from '@/pages/Files';
import { ProjectDetail } from '@/pages/ProjectDetail';
import Profile from '@/pages/Profile';
import { TeamPage } from '@/pages/TeamPage';
import Financial from '@/pages/Financial';
import Compliance from '@/pages/Compliance';
import SecuritySettings from '@/pages/SecuritySettings';
import Community from '@/pages/Community';
import Marketplace from '@/pages/Marketplace';
import Settings from '@/pages/Settings';
import AdminPortal from '@/pages/AdminPortal';
import AdminPermissions from '@/pages/AdminPermissions';
import Documents from '@/pages/Documents';
import ActivityFeedExample from '@/pages/ActivityFeedExample';
import EnterprisePM from '@/pages/EnterprisePM';
import HRDashboard from '@/pages/HRDashboard';
import LearningDashboard from '@/pages/LearningDashboard';
import SearchResults from '@/pages/SearchResults';
import { ConstructionDashboard } from '@/pages/ConstructionProgress/ConstructionDashboard';
import TestChecklist from '@/pages/TestChecklist';
import Billing from '@/pages/Billing';
import { HelpCenter } from '@/pages/HelpCenter';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { MemberOnboarding } from '@/components/onboarding/MemberOnboarding';
import { VendorOnboarding } from '@/components/onboarding/VendorOnboarding';
import CompanyRegistration from '@/pages/CompanyRegistration';
import { Toaster } from '@/components/ui/sonner';
import { ARIAProvider } from '@/components/aria/ARIAProvider';
import { ARIAFloatingAssistant } from '@/components/aria/ARIAFloatingAssistant';
import { ARIACommandCenter } from '@/components/aria/ARIACommandCenter';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';
import { FullPageSkeleton } from '@/components/ui/skeleton';
import { initializeAIServices } from '@/services/ai';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { usePWA, useResponsive } from '@/hooks/usePWA';
import { MobileNav } from '@/components/mobile/MobileNav';
// import '@/utils/fixPermissions';  // Disabled to prevent reload loops

// Lazy load new feature pages for better performance
const Analytics = lazy(() => import('@/pages/Analytics'));
const Integrations = lazy(() => import('@/pages/Integrations'));
const SecurityEnhanced = lazy(() => import('@/pages/SecurityEnhanced'));
const Performance = lazy(() => import('@/pages/Performance'));

// Architect feature pages
const RFIManagement = lazy(() => import('@/pages/architect/RFIManagement'));
const ChangeOrderManagement = lazy(() => import('@/pages/architect/ChangeOrderManagement'));
const DrawingManagement = lazy(() => import('@/pages/architect/DrawingManagement'));
const SiteVisitReports = lazy(() => import('@/pages/architect/SiteVisitReports'));
const PunchListManagement = lazy(() => import('@/pages/architect/PunchListManagement'));
const PAMContractAdmin = lazy(() => import('@/pages/architect/PAMContractAdmin'));
const UBBLCompliance = lazy(() => import('@/pages/architect/UBBLCompliance'));
const AuthorityTracking = lazy(() => import('@/pages/architect/AuthorityTracking'));
const PaymentCertificates = lazy(() => import('@/pages/architect/PaymentCertificates'));
const SiteInstructionRegister = lazy(() => import('@/pages/architect/SiteInstructionRegister'));
const SubmittalTracking = lazy(() => import('@/pages/architect/SubmittalTracking'));
const MeetingMinutes = lazy(() => import('@/pages/architect/MeetingMinutes'));
const DLPManagement = lazy(() => import('@/pages/architect/DLPManagement'));
const FeeCalculator = lazy(() => import('@/pages/architect/FeeCalculator'));
const CCCTracking = lazy(() => import('@/pages/architect/CCCTracking'));
const RetentionTracking = lazy(() => import('@/pages/architect/RetentionTracking'));

function App() {
  const { isAuthenticated, user, checkAuth, isLoading, isNewOrganization, needsMemberOnboarding, needsVendorOnboarding } = useAuthStore();
  const baseUrl = import.meta.env.BASE_URL || '/';
  const { installApp, isInstallable, isOffline, isUpdateAvailable } = usePWA();
  const { isMobile, isTablet } = useResponsive();

  // Initialize service worker for PWA
  useServiceWorker();
  
  useEffect(() => {
    // Check authentication status on mount
    checkAuth();

    // Disabled automatic token refresh to prevent loops
    // Token refresh commented out until backend is properly configured
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency to run only once on mount

  useEffect(() => {
    // Initialize AI services when authenticated
    if (isAuthenticated) {
      initializeAIServices().catch(error => {
        console.error('Failed to initialize AI services:', error);
      });
      
      // Initialize user settings from backend
      settingsService.initialize().catch(error => {
        console.error('Failed to initialize settings:', error);
      });
    }
  }, [isAuthenticated]);

  // Admin route guard component
  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (user?.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  };
  
  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router basename={baseUrl} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ARIAProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Mobile Navigation */}
          {isAuthenticated && (isMobile || isTablet) && <MobileNav />}
          
          {/* PWA Install Prompt */}
          {isInstallable && (
            <div className="fixed bottom-20 right-4 z-50 lg:bottom-4">
              <InstallPrompt onInstall={installApp} />
            </div>
          )}
          
          {/* Update Available Banner */}
          {isUpdateAvailable && (
            <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-2 text-center z-50">
              A new version is available.
              <button 
                onClick={() => window.location.reload()} 
                className="ml-2 underline"
              >
                Update Now
              </button>
            </div>
          )}
          
          {/* Offline Indicator */}
          {isOffline && (
            <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white p-2 text-center z-50">
              You are currently offline. Some features may be limited.
            </div>
          )}
          
          {!isAuthenticated ? (
            <>
              <Routes>
                <Route path="/register" element={<CompanyRegistration />} />
                <Route path="*" element={<LoginPage />} />
              </Routes>
            </>
          ) : isNewOrganization && user?.role === 'admin' ? (
            <Routes>
              <Route path="*" element={<Navigate to="/onboarding" replace />} />
              <Route path="/onboarding" element={<OnboardingWizard />} />
            </Routes>
          ) : needsMemberOnboarding ? (
            <Routes>
              <Route path="*" element={<Navigate to="/member-onboarding" replace />} />
              <Route path="/member-onboarding" element={<MemberOnboarding />} />
            </Routes>
          ) : needsVendorOnboarding ? (
            <Routes>
              <Route path="*" element={<Navigate to="/vendor-onboarding" replace />} />
              <Route path="/vendor-onboarding" element={<VendorOnboarding />} />
            </Routes>
          ) : (
            <>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
                <Route path="/member-onboarding" element={<Navigate to="/dashboard" replace />} />
                <Route path="/vendor-onboarding" element={<Navigate to="/marketplace/vendor-dashboard" replace />} />
                <Route path="/dashboard" element={<UltimateStudioHub />} />
                <Route path="/widgets-dashboard" element={<SmartDashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/enterprise-pm" element={<EnterprisePM />} />
                <Route path="/hr" element={<HRDashboard />} />
                <Route path="/learning" element={<LearningDashboard />} />
                <Route path="/construction/:siteId" element={<ConstructionDashboard />} />
                <Route path="/construction" element={<ConstructionDashboard />} />
                <Route path="/kanban" element={<KanbanPage />} />
                <Route path="/timeline" element={<TimelinePage />} />
                <Route path="/design-brief" element={<DesignBriefPage />} />
                <Route path="/files" element={<Files />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/community" element={<Community />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/vendor-dashboard" element={<Marketplace />} />
                <Route path="/tasks" element={<KanbanPage />} />
                <Route path="/calendar" element={<TimelinePage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/financial" element={<Financial />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/security" element={<SecuritySettings />} />
                <Route path="/reports" element={<SmartDashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/meetings" element={<SmartDashboard />} />
                <Route path="/approvals" element={<SmartDashboard />} />
                <Route path="/messages" element={<SmartDashboard />} />
                <Route path="/quotations" element={<Financial />} />
                <Route path="/invoices" element={<Financial />} />
                <Route path="/portfolio" element={<SmartDashboard />} />
                <Route path="/activity-feed" element={<ActivityFeedExample />} />
                <Route path="/aria" element={<ARIACommandCenter />} />
                <Route path="/search-results" element={<SearchResults />} />
                <Route path="/test" element={<TestChecklist />} />
                <Route path="/billing" element={<Billing />} />

                {/* Architect Feature Routes */}
                <Route path="/architect/rfi" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <RFIManagement />
                  </Suspense>
                } />
                <Route path="/architect/change-orders" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <ChangeOrderManagement />
                  </Suspense>
                } />
                <Route path="/architect/drawings" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <DrawingManagement />
                  </Suspense>
                } />
                <Route path="/architect/site-visits" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <SiteVisitReports />
                  </Suspense>
                } />
                <Route path="/architect/punch-list" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <PunchListManagement />
                  </Suspense>
                } />
                <Route path="/architect/contracts" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <PAMContractAdmin />
                  </Suspense>
                } />
                <Route path="/architect/ubbl" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <UBBLCompliance />
                  </Suspense>
                } />
                <Route path="/architect/authorities" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <AuthorityTracking />
                  </Suspense>
                } />
                <Route path="/architect/payment-certificates" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <PaymentCertificates />
                  </Suspense>
                } />
                <Route path="/architect/site-instructions" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <SiteInstructionRegister />
                  </Suspense>
                } />
                <Route path="/architect/submittals" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <SubmittalTracking />
                  </Suspense>
                } />
                <Route path="/architect/meeting-minutes" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <MeetingMinutes />
                  </Suspense>
                } />
                <Route path="/architect/dlp" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <DLPManagement />
                  </Suspense>
                } />
                <Route path="/architect/fee-calculator" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <FeeCalculator />
                  </Suspense>
                } />
                <Route path="/architect/ccc-tracking" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <CCCTracking />
                  </Suspense>
                } />
                <Route path="/architect/retention-tracking" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <RetentionTracking />
                  </Suspense>
                } />

                {/* New Feature Routes with Lazy Loading */}
                <Route path="/analytics" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <Analytics />
                  </Suspense>
                } />
                <Route path="/integrations" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <Integrations />
                  </Suspense>
                } />
                <Route path="/security-enhanced" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <SecurityEnhanced />
                  </Suspense>
                } />
                <Route path="/performance" element={
                  <Suspense fallback={<FullPageSkeleton />}>
                    <Performance />
                  </Suspense>
                } />
                
                {/* Admin-only routes */}
                <Route path="/admin/*" element={
                  <AdminRoute>
                    <AdminPortal />
                  </AdminRoute>
                } />
                <Route path="/admin-permissions" element={
                  <AdminRoute>
                    <AdminPermissions />
                  </AdminRoute>
                } />
                
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>

              {/* ARIA Floating Assistant - Only when escaped from sidebar */}
              <ARIAFloatingAssistant />

              {/* Keyboard Shortcuts Dialog */}
              <KeyboardShortcutsDialog />
            </>
          )}
          <Toaster />
        </div>
      </ARIAProvider>
    </Router>
  );
}

export default App;