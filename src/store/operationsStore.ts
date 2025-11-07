import { create } from 'zustand';
import {
  DailyBriefing,
  BriefingItem,
  ActionItem,
  ProgressReview,
  Issue,
  Evidence,
  AcknowledgedUser
} from '@/types';

interface OperationsState {
  dailyBriefings: Map<string, DailyBriefing>;
  progressReviews: Map<string, ProgressReview>;
  activeIssues: Issue[];
  todayActionItems: ActionItem[];
  
  // Automation settings
  automationEnabled: boolean;
  briefingTime: string;
  reviewTime: string;
  approvalTime: string;
  
  // Actions
  generateDailyBriefing: (projectId: string, date: Date) => DailyBriefing;
  acknowledgeBriefing: (briefingId: string, userId: string, platform: string) => void;
  createProgressReview: (projectId: string, date: Date) => ProgressReview;
  uploadEvidence: (reviewId: string, evidence: Evidence) => void;
  approveProgressReview: (reviewId: string, approver: string, comments?: string) => void;
  createIssue: (issue: Issue) => void;
  updateIssue: (issueId: string, updates: Partial<Issue>) => void;
  assignActionItem: (item: ActionItem) => void;
  completeActionItem: (itemId: string, evidence?: string[]) => void;
  sendNotifications: (type: 'briefing' | 'review' | 'approval', recipients: string[]) => void;
  generateEveningReport: (projectId: string) => any;
}

export const useOperationsStore = create<OperationsState>((set, get) => ({
  dailyBriefings: new Map(),
  progressReviews: new Map(),
  activeIssues: [],
  todayActionItems: [],
  
  automationEnabled: true,
  briefingTime: '08:00',
  reviewTime: '18:00',
  approvalTime: '21:00',
  
  generateDailyBriefing: (projectId, date) => {
    // Generate morning briefing with AI-powered task prioritization
    const briefingItems: BriefingItem[] = [];
    const actionItems: ActionItem[] = [];
    
    // Get tasks due today or overdue
    // This would integrate with the project store in production
    briefingItems.push({
      category: 'task',
      priority: 'high',
      title: 'Floor Plan Review',
      description: 'Review and approve revised floor plans for Level 2',
      assignedTo: ['designer-1'],
      dueTime: new Date(date.setHours(11, 0))
    });
    
    briefingItems.push({
      category: 'meeting',
      priority: 'medium',
      title: 'Client Progress Meeting',
      description: 'Weekly progress update with client via Zoom',
      assignedTo: ['project-lead'],
      dueTime: new Date(date.setHours(14, 0))
    });
    
    briefingItems.push({
      category: 'deadline',
      priority: 'urgent',
      title: 'DBKL Submission Deadline',
      description: 'Final submission for building plan approval',
      assignedTo: ['architect-1'],
      dueTime: new Date(date.setHours(17, 0))
    });
    
    // Generate action items from briefing items
    briefingItems.forEach((item, index) => {
      if (item.category === 'task' || item.category === 'deadline') {
        actionItems.push({
          id: `action-${date.toISOString()}-${index}`,
          task: item.title,
          assignedTo: item.assignedTo?.[0] || '',
          dueDate: item.dueTime || date,
          status: 'pending'
        });
      }
    });
    
    const briefing: DailyBriefing = {
      id: `briefing-${projectId}-${date.toISOString()}`,
      date,
      projectId,
      teamMembers: ['project-lead', 'designer-1', 'architect-1', 'engineer-1'],
      agenda: briefingItems,
      actionItems,
      generatedAt: new Date(),
      acknowledgedBy: []
    };
    
    set((state) => {
      const newBriefings = new Map(state.dailyBriefings);
      newBriefings.set(briefing.id, briefing);
      return { 
        dailyBriefings: newBriefings,
        todayActionItems: [...state.todayActionItems, ...actionItems]
      };
    });
    
    // Send notifications
    get().sendNotifications('briefing', briefing.teamMembers);
    
    return briefing;
  },
  
  acknowledgeBriefing: (briefingId, userId, platform) => {
    set((state) => {
      const briefings = new Map(state.dailyBriefings);
      const briefing = briefings.get(briefingId);
      
      if (briefing) {
        const acknowledged: AcknowledgedUser = {
          userId,
          acknowledgedAt: new Date(),
          platform: platform as any
        };
        
        briefing.acknowledgedBy.push(acknowledged);
        briefings.set(briefingId, briefing);
      }
      
      return { dailyBriefings: briefings };
    });
  },
  
  createProgressReview: (projectId, date) => {
    // Evening progress review generation
    const review: ProgressReview = {
      id: `review-${projectId}-${date.toISOString()}`,
      date,
      projectId,
      reviewer: 'project-lead',
      tasksCompleted: [],
      tasksInProgress: [],
      tasksDelayed: [],
      issues: get().activeIssues.filter(i => i.status === 'open'),
      evidenceUploaded: [],
      overallProgress: 0,
      nextDayPriorities: [],
      approvalStatus: 'pending'
    };
    
    // Calculate progress from action items
    const todayItems = get().todayActionItems;
    const completed = todayItems.filter(i => i.status === 'completed');
    const inProgress = todayItems.filter(i => i.status === 'in_progress');
    const pending = todayItems.filter(i => i.status === 'pending');
    
    review.tasksCompleted = completed.map(i => i.id);
    review.tasksInProgress = inProgress.map(i => i.id);
    review.tasksDelayed = pending.map(i => i.id);
    review.overallProgress = (completed.length / todayItems.length) * 100;
    
    // Generate next day priorities based on delayed tasks and upcoming deadlines
    review.nextDayPriorities = [
      ...pending.map(i => i.task),
      'Review overnight submissions',
      'Prepare for morning standup'
    ];
    
    set((state) => {
      const newReviews = new Map(state.progressReviews);
      newReviews.set(review.id, review);
      return { progressReviews: newReviews };
    });
    
    // Notify project lead for approval
    get().sendNotifications('review', ['project-lead']);
    
    return review;
  },
  
  uploadEvidence: (reviewId, evidence) => {
    set((state) => {
      const reviews = new Map(state.progressReviews);
      const review = reviews.get(reviewId);
      
      if (review) {
        review.evidenceUploaded.push(evidence);
        reviews.set(reviewId, review);
      }
      
      return { progressReviews: reviews };
    });
  },
  
  approveProgressReview: (reviewId, approver, comments) => {
    set((state) => {
      const reviews = new Map(state.progressReviews);
      const review = reviews.get(reviewId);
      
      if (review) {
        review.approvalStatus = 'approved';
        review.approvedBy = approver;
        review.approvalComments = comments;
        reviews.set(reviewId, review);
      }
      
      return { progressReviews: reviews };
    });
    
    // Send approval notification to team
    get().sendNotifications('approval', []);
  },
  
  createIssue: (issue) => {
    set((state) => ({
      activeIssues: [...state.activeIssues, issue]
    }));
  },
  
  updateIssue: (issueId, updates) => {
    set((state) => ({
      activeIssues: state.activeIssues.map(issue =>
        issue.id === issueId ? { ...issue, ...updates } : issue
      )
    }));
  },
  
  assignActionItem: (item) => {
    set((state) => ({
      todayActionItems: [...state.todayActionItems, item]
    }));
  },
  
  completeActionItem: (itemId, evidence) => {
    set((state) => ({
      todayActionItems: state.todayActionItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              status: 'completed',
              completedAt: new Date(),
              evidence
            }
          : item
      )
    }));
  },
  
  sendNotifications: (type, recipients) => {
    // Integration with notification services
    const messages = {
      briefing: '📋 Your daily briefing is ready. Please review your tasks for today.',
      review: '📊 Evening progress review submitted. Please approve by 9 PM.',
      approval: '✅ Progress review approved. Great work today!'
    };
    
    // This would integrate with:
    // - WhatsApp Business API
    // - Telegram Bot API
    // - Email service
    // - Push notifications
    
    console.log(`Sending ${type} notification to:`, recipients);
    console.log(`Message: ${messages[type]}`);
  },
  
  generateEveningReport: (projectId) => {
    const date = new Date();
    const briefing = Array.from(get().dailyBriefings.values())
      .find(b => b.projectId === projectId && 
        b.date.toDateString() === date.toDateString());
    
    const review = Array.from(get().progressReviews.values())
      .find(r => r.projectId === projectId && 
        r.date.toDateString() === date.toDateString());
    
    const report = {
      date,
      projectId,
      morningBriefing: briefing,
      eveningReview: review,
      completionRate: review?.overallProgress || 0,
      issues: get().activeIssues.filter(i => i.status === 'open'),
      evidenceCollected: review?.evidenceUploaded.length || 0,
      teamPerformance: {
        acknowledged: briefing?.acknowledgedBy.length || 0,
        totalTeam: briefing?.teamMembers.length || 0,
        tasksCompleted: review?.tasksCompleted.length || 0,
        tasksDelayed: review?.tasksDelayed.length || 0
      }
    };
    
    return report;
  }
}));