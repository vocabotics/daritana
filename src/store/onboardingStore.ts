import { create } from 'zustand';

/**
 * Onboarding Store - Memory-Only (No Persistence)
 *
 * SECURITY: This store does NOT use persist() middleware.
 * All onboarding state is kept in memory only.
 *
 * When user completes onboarding, data is saved to backend via API.
 * This eliminates localStorage security risks.
 */

interface CompanyRegistrationData {
  companyName: string;
  businessType: string;
  teamSize: string;
  country: string;
  description: string;
  registrationNumber?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  postcode?: string;
  phone?: string;
  website?: string;
}

interface UserProfile {
  fullName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  bio?: string;
  avatar?: string;
}

interface SocialAccounts {
  linkedin?: string;
  twitter?: string;
  github?: string;
  website?: string;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface OnboardingState {
  // Company Registration Data
  companyRegistrationData: CompanyRegistrationData | null;
  setCompanyRegistrationData: (data: CompanyRegistrationData) => void;

  // Organization Info (set after organization creation)
  organizationId: string | null;
  organizationName: string | null;
  setOrganizationInfo: (id: string, name: string) => void;

  // User Profile (for member onboarding)
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;

  // Social Accounts (for member onboarding)
  socialAccounts: SocialAccounts | null;
  setSocialAccounts: (accounts: SocialAccounts) => void;

  // Project Templates
  projectTemplates: ProjectTemplate[];
  setProjectTemplates: (templates: ProjectTemplate[]) => void;

  // Integrations
  integrations: Integration[];
  setIntegrations: (integrations: Integration[]) => void;

  // Completion Flags
  organizationOnboardingComplete: boolean;
  memberOnboardingComplete: boolean;
  vendorOnboardingComplete: boolean;
  setOrganizationOnboardingComplete: (complete: boolean) => void;
  setMemberOnboardingComplete: (complete: boolean) => void;
  setVendorOnboardingComplete: (complete: boolean) => void;

  // Reset functions
  resetCompanyData: () => void;
  resetUserData: () => void;
  resetAll: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  // Initial state
  companyRegistrationData: null,
  organizationId: null,
  organizationName: null,
  userProfile: null,
  socialAccounts: null,
  projectTemplates: [],
  integrations: [],
  organizationOnboardingComplete: false,
  memberOnboardingComplete: false,
  vendorOnboardingComplete: false,

  // Actions
  setCompanyRegistrationData: (data) => set({ companyRegistrationData: data }),

  setOrganizationInfo: (id, name) => set({
    organizationId: id,
    organizationName: name,
  }),

  setUserProfile: (profile) => set({ userProfile: profile }),

  setSocialAccounts: (accounts) => set({ socialAccounts: accounts }),

  setProjectTemplates: (templates) => set({ projectTemplates: templates }),

  setIntegrations: (integrations) => set({ integrations }),

  setOrganizationOnboardingComplete: (complete) => set({ organizationOnboardingComplete: complete }),

  setMemberOnboardingComplete: (complete) => set({ memberOnboardingComplete: complete }),

  setVendorOnboardingComplete: (complete) => set({ vendorOnboardingComplete: complete }),

  // Reset functions
  resetCompanyData: () => set({
    companyRegistrationData: null,
    organizationId: null,
    organizationName: null,
    projectTemplates: [],
    integrations: [],
    organizationOnboardingComplete: false,
  }),

  resetUserData: () => set({
    userProfile: null,
    socialAccounts: null,
    memberOnboardingComplete: false,
  }),

  resetAll: () => set({
    companyRegistrationData: null,
    organizationId: null,
    organizationName: null,
    userProfile: null,
    socialAccounts: null,
    projectTemplates: [],
    integrations: [],
    organizationOnboardingComplete: false,
    memberOnboardingComplete: false,
    vendorOnboardingComplete: false,
  }),
}));
