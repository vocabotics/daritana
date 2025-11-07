// ==================== COMMUNITY & MARKETPLACE TYPES ====================

export interface Professional {
  id: string;
  userId: string;
  type: 'architect' | 'interior_designer' | 'contractor' | 'supplier' | 'artisan' | 'consultant' | 'engineer';
  displayName: string;
  companyName?: string;
  bio: string;
  avatar: string;
  coverPhoto?: string;
  
  // Professional Verification
  verification: ProfessionalVerification;
  credentials: ProfessionalCredential[];
  
  // Portfolio & Showcase
  portfolio: PortfolioItem[];
  featuredProjects: string[]; // Project IDs
  awards: Award[];
  publications: Publication[];
  
  // Marketplace Presence
  services: ServiceOffering[];
  pricing: PricingStructure;
  availability: AvailabilityCalendar;
  responseTime: number; // Average in hours
  
  // Community Engagement
  communityScore: number;
  contributions: CommunityContribution[];
  following: string[]; // User IDs
  followers: string[]; // User IDs
  groups: string[]; // Group IDs
  
  // Reviews & Reputation
  rating: number;
  reviewCount: number;
  reviews: Review[];
  endorsements: Endorsement[];
  
  // Malaysian Market Specifics
  location: MalaysianLocation;
  languages: Language[];
  culturalExpertise: string[];
  certifications: MalaysianCertification[];
  
  // Gamification
  level: ProfessionalLevel;
  badges: Badge[];
  achievements: Achievement[];
  points: number;
  
  // Analytics
  profileViews: number;
  projectInquiries: number;
  conversionRate: number;
  lastActive: Date;
}

export interface ProfessionalVerification {
  status: 'unverified' | 'pending' | 'verified' | 'premium' | 'elite';
  verifiedAt?: Date;
  verificationMethod: 'document' | 'blockchain' | 'professional_body' | 'peer_review';
  verificationProof?: string;
  nextReviewDate?: Date;
}

export interface ProfessionalCredential {
  id: string;
  type: 'license' | 'certification' | 'degree' | 'membership';
  name: string;
  issuingBody: string;
  registrationNumber?: string;
  issueDate: Date;
  expiryDate?: Date;
  verified: boolean;
  documentUrl?: string;
  blockchainHash?: string; // For blockchain verification
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  videos?: string[];
  virtualTour?: string;
  projectValue?: number;
  completionDate: Date;
  location: string;
  tags: string[];
  views: number;
  likes: number;
  shares: number;
  featured: boolean;
  collaborators?: CollaboratorCredit[];
}

export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  category: string;
  deliverables: string[];
  duration: ServiceDuration;
  pricing: ServicePricing;
  availability: 'immediate' | 'scheduled' | 'by_request';
  popularityScore: number;
  bookingCount: number;
}

export interface PricingStructure {
  currency: 'MYR';
  hourlyRate?: number;
  projectMinimum?: number;
  consultationFee?: number;
  pricingModel: 'hourly' | 'fixed' | 'percentage' | 'hybrid';
  priceRange: 'budget' | 'mid_range' | 'premium' | 'luxury';
  negotiable: boolean;
  paymentTerms: string[];
  discounts?: Discount[];
}

// ==================== MARKETPLACE TYPES ====================

export interface Marketplace {
  professionals: Professional[];
  projects: MarketplaceProject[];
  bids: Bid[];
  transactions: Transaction[];
  disputes: Dispute[];
  escrow: EscrowAccount[];
}

export interface MarketplaceProject {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  budget: BudgetRange;
  timeline: ProjectTimeline;
  location: MalaysianLocation;
  requirements: ProjectRequirement[];
  
  // Bidding System
  biddingStatus: 'open' | 'closed' | 'awarded' | 'cancelled';
  bids: string[]; // Bid IDs
  shortlistedBids: string[];
  awardedBid?: string;
  
  // Visibility
  visibility: 'public' | 'invited' | 'private';
  invitedProfessionals?: string[];
  viewCount: number;
  
  // AI Matching
  aiMatchScore: { [professionalId: string]: number };
  recommendedProfessionals: string[];
  
  postedAt: Date;
  deadline: Date;
}

export interface Bid {
  id: string;
  projectId: string;
  professionalId: string;
  amount: number;
  timeline: number; // days
  proposal: string;
  attachments: string[];
  
  // Competitive Elements
  uniqueSellingPoints: string[];
  previousWork: string[]; // Portfolio item IDs
  teamMembers?: TeamMember[];
  
  status: 'submitted' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';
  submittedAt: Date;
  lastModified?: Date;
  
  // Client Interaction
  clientQuestions?: Question[];
  clarifications?: Clarification[];
  
  // Scoring
  clientScore?: number;
  aiScore?: number;
  communityVotes?: number;
}

// ==================== COMMUNITY FEATURES ====================

export interface CommunityHub {
  forums: Forum[];
  groups: CommunityGroup[];
  events: CommunityEvent[];
  challenges: DesignChallenge[];
  mentorship: MentorshipProgram[];
  knowledgeBase: KnowledgeArticle[];
}

export interface Forum {
  id: string;
  name: string;
  description: string;
  category: ForumCategory;
  moderators: string[];
  
  // Topics & Discussions
  topics: ForumTopic[];
  pinnedTopics: string[];
  
  // Engagement
  memberCount: number;
  postCount: number;
  dailyActiveUsers: number;
  
  // Rules & Guidelines
  rules: string[];
  autoModeration: AutoModerationRule[];
  
  // Malaysian Specific
  language: 'english' | 'malay' | 'chinese' | 'tamil' | 'mixed';
  culturalFocus?: string;
}

export interface ForumTopic {
  id: string;
  forumId: string;
  authorId: string;
  title: string;
  content: string;
  tags: string[];
  
  // Engagement
  replies: ForumReply[];
  views: number;
  likes: number;
  shares: number;
  bookmarks: number;
  
  // Moderation
  status: 'active' | 'locked' | 'hidden' | 'deleted';
  isPinned: boolean;
  isFeatured: boolean;
  
  // AI Enhancement
  aiSummary?: string;
  relatedTopics?: string[];
  expertOpinions?: ExpertOpinion[];
  
  createdAt: Date;
  lastActivity: Date;
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  type: 'professional' | 'interest' | 'regional' | 'cultural' | 'project';
  
  // Membership
  owner: string;
  admins: string[];
  members: GroupMember[];
  memberCount: number;
  joinPolicy: 'open' | 'approval' | 'invite_only';
  
  // Content & Activity
  posts: GroupPost[];
  events: string[]; // Event IDs
  projects: string[]; // Shared project IDs
  resources: SharedResource[];
  
  // Group Features
  features: GroupFeature[];
  rules: string[];
  
  // Malaysian Community
  location?: MalaysianLocation;
  language: string[];
  culturalAffiliation?: string;
  
  // Engagement Metrics
  activityScore: number;
  growthRate: number;
  engagementRate: number;
  
  createdAt: Date;
  lastActive: Date;
}

export interface DesignChallenge {
  id: string;
  title: string;
  description: string;
  brief: string;
  category: string;
  
  // Challenge Details
  sponsor?: Sponsor;
  prizes: Prize[];
  judgingCriteria: JudgingCriterion[];
  judges: string[]; // Professional IDs
  
  // Timeline
  startDate: Date;
  submissionDeadline: Date;
  judgingPeriod: { start: Date; end: Date };
  announcementDate: Date;
  
  // Participation
  participants: ChallengeParticipant[];
  submissions: ChallengeSubmission[];
  
  // Engagement
  viewCount: number;
  shareCount: number;
  mediaPartners?: string[];
  
  // Viral Mechanics
  votingEnabled: boolean;
  publicVotes?: { [submissionId: string]: number };
  socialSharing: SocialSharingConfig;
  
  status: 'upcoming' | 'active' | 'judging' | 'completed';
}

export interface MentorshipProgram {
  id: string;
  mentorId: string;
  mentees: MenteeProfile[];
  
  // Program Structure
  type: 'one_on_one' | 'group' | 'workshop' | 'masterclass';
  duration: number; // weeks
  schedule: MentorshipSchedule;
  curriculum: Curriculum[];
  
  // Interaction
  sessions: MentorshipSession[];
  assignments: Assignment[];
  feedback: MentorshipFeedback[];
  
  // Progress Tracking
  milestones: MentorshipMilestone[];
  completionRate: number;
  successMetrics: SuccessMetric[];
  
  // Community Building
  alumniNetwork: string[]; // User IDs
  successStories: SuccessStory[];
  
  price?: number;
  status: 'enrolling' | 'active' | 'completed';
}

// ==================== VIRAL GROWTH MECHANISMS ====================

export interface ViralMechanism {
  referralProgram: ReferralProgram;
  socialAmplification: SocialAmplification;
  gamification: GamificationSystem;
  contentVirality: ContentVirality;
  networkEffects: NetworkEffect[];
}

export interface ReferralProgram {
  id: string;
  
  // Referral Tracking
  referralCodes: ReferralCode[];
  referralChains: ReferralChain[];
  
  // Rewards Structure
  rewards: ReferralReward[];
  tiers: ReferralTier[];
  bonuses: ReferralBonus[];
  
  // Performance
  totalReferrals: number;
  conversionRate: number;
  viralCoefficient: number;
  
  // Campaigns
  campaigns: ReferralCampaign[];
  activeCampaign?: string;
}

export interface ReferralCode {
  code: string;
  ownerId: string;
  uses: number;
  maxUses?: number;
  rewards: RewardTransaction[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface SocialAmplification {
  // Content Sharing
  shareableContent: ShareableContent[];
  viralLoops: ViralLoop[];
  
  // Social Proof
  testimonials: Testimonial[];
  caseStudies: CaseStudy[];
  socialProofWidgets: SocialProofWidget[];
  
  // Influencer Network
  influencers: Influencer[];
  ambassadors: Ambassador[];
  
  // User Generated Content
  ugcCampaigns: UGCCampaign[];
  featuredContent: FeaturedContent[];
}

export interface GamificationSystem {
  // Point System
  pointsConfig: PointsConfiguration;
  pointsLedger: PointsTransaction[];
  
  // Levels & Progression
  levels: Level[];
  progressionPaths: ProgressionPath[];
  
  // Badges & Achievements
  badgeCategories: BadgeCategory[];
  achievements: AchievementDefinition[];
  
  // Leaderboards
  leaderboards: Leaderboard[];
  competitions: Competition[];
  
  // Rewards
  rewardCatalog: Reward[];
  redemptions: RewardRedemption[];
}

// ==================== AI-DRIVEN FEATURES ====================

export interface AIPersonalization {
  // Recommendation Engine
  projectRecommendations: AIRecommendation[];
  professionalMatching: AIMatching[];
  contentCuration: AIContent[];
  
  // Predictive Analytics
  trendPredictions: TrendPrediction[];
  demandForecasting: DemandForecast[];
  pricingOptimization: PricingRecommendation[];
  
  // Smart Notifications
  notificationEngine: SmartNotificationEngine;
  personalizedAlerts: PersonalizedAlert[];
  
  // Portfolio Optimization
  portfolioAnalysis: PortfolioAnalysis;
  improvementSuggestions: ImprovementSuggestion[];
}

export interface AIRecommendation {
  id: string;
  userId: string;
  type: 'project' | 'professional' | 'service' | 'content';
  recommendations: RecommendationItem[];
  algorithm: 'collaborative' | 'content_based' | 'hybrid' | 'deep_learning';
  confidence: number;
  explanation?: string;
  generatedAt: Date;
}

export interface SmartNotificationEngine {
  // User Preferences
  userPreferences: NotificationPreference[];
  
  // Timing Optimization
  optimalTimings: { [userId: string]: OptimalTiming };
  
  // Content Personalization
  templates: NotificationTemplate[];
  personalizations: ContentPersonalization[];
  
  // Channel Optimization
  channelPreferences: ChannelPreference[];
  deliveryOptimization: DeliveryOptimization;
}

// ==================== MALAYSIAN MARKET SPECIFICS ====================

export interface MalaysianLocation {
  state: MalaysianState;
  city: string;
  area?: string;
  postcode: string;
  region: 'peninsular' | 'sabah' | 'sarawak';
  urbanLevel: 'urban' | 'suburban' | 'rural';
}

export type MalaysianState = 
  | 'Kuala Lumpur' | 'Selangor' | 'Penang' | 'Johor' 
  | 'Perak' | 'Pahang' | 'Negeri Sembilan' | 'Melaka'
  | 'Kedah' | 'Perlis' | 'Kelantan' | 'Terengganu'
  | 'Sabah' | 'Sarawak' | 'Labuan' | 'Putrajaya';

export interface MalaysianCertification {
  id: string;
  type: 'LAM' | 'BEM' | 'CIDB' | 'RISM' | 'MIID' | 'PAM' | 'IEM';
  registrationNumber: string;
  validUntil: Date;
  category?: string;
  grade?: string;
}

export interface Language {
  code: 'en' | 'ms' | 'zh' | 'ta' | 'iban' | 'kadazan';
  proficiency: 'native' | 'fluent' | 'conversational' | 'basic';
  preferred: boolean;
}

// ==================== MONETIZATION ====================

export interface MonetizationModel {
  // Subscription Tiers
  subscriptions: SubscriptionPlan[];
  
  // Transaction Fees
  transactionFees: TransactionFeeStructure;
  
  // Premium Features
  premiumFeatures: PremiumFeature[];
  
  // Advertising
  advertising: AdvertisingModel;
  
  // Lead Generation
  leadGeneration: LeadGenerationService;
  
  // Training & Certification
  educationRevenue: EducationRevenue;
  
  // Event Monetization
  eventRevenue: EventRevenue;
}

export interface SubscriptionPlan {
  id: string;
  name: 'free' | 'professional' | 'business' | 'enterprise';
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  features: string[];
  limits: SubscriptionLimits;
  benefits: SubscriptionBenefit[];
}

// ==================== NETWORK EFFECTS ====================

export interface NetworkEffect {
  type: 'direct' | 'indirect' | 'data' | 'social' | 'local';
  description: string;
  
  // Measurement
  metrics: NetworkMetric[];
  growthRate: number;
  criticalMass: number;
  currentSize: number;
  
  // Amplification Strategies
  amplificationTactics: AmplificationTactic[];
  retentionMechanisms: RetentionMechanism[];
  
  // Lock-in Effects
  switchingCosts: SwitchingCost[];
  ecosystemIntegrations: EcosystemIntegration[];
}

export interface NetworkMetric {
  name: string;
  value: number;
  target: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  measurement: 'daily' | 'weekly' | 'monthly';
}

// Additional supporting types for completeness
export interface Award {
  id: string;
  name: string;
  issuingBody: string;
  year: number;
  category?: string;
  projectId?: string;
}

export interface Publication {
  id: string;
  title: string;
  publisher: string;
  date: Date;
  url?: string;
  type: 'article' | 'book' | 'whitepaper' | 'case_study';
}

export interface Review {
  id: string;
  projectId: string;
  clientId: string;
  rating: number;
  comment: string;
  aspects: {
    quality: number;
    communication: number;
    timeliness: number;
    value: number;
    professionalism: number;
  };
  photos?: string[];
  response?: string;
  helpful: number;
  createdAt: Date;
}

export interface Endorsement {
  id: string;
  endorserId: string;
  skill: string;
  relationship: string;
  comment?: string;
  createdAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  reward?: string;
}

export interface ProfessionalLevel {
  current: number;
  name: string;
  nextLevel: number;
  experiencePoints: number;
  requiredPoints: number;
  perks: string[];
}