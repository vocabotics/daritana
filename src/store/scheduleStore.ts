import { create } from 'zustand';
import { 
  GanttConfig, 
  Holiday, 
  ResourceLeveling, 
  ResourceConstraint,
  LevelingResult,
  ProjectTimeline,
  Milestone,
  CriticalPath
} from '@/types';

interface ScheduleState {
  ganttConfig: GanttConfig;
  holidays: Holiday[];
  resourceLeveling: ResourceLeveling | null;
  criticalPaths: Map<string, CriticalPath>;
  
  // Actions
  updateGanttConfig: (config: Partial<GanttConfig>) => void;
  addHoliday: (holiday: Holiday) => void;
  removeHoliday: (date: Date) => void;
  calculateCriticalPath: (projectId: string, tasks: ProjectTimeline[]) => CriticalPath;
  performResourceLeveling: (constraints: ResourceConstraint[]) => LevelingResult[];
  checkResourceConflicts: (projectId: string) => any[];
  optimizeSchedule: (projectId: string, goal: 'duration' | 'cost' | 'resource') => void;
  generateMilestones: (projectId: string, phase: string) => Milestone[];
}

// Malaysian public holidays for 2024
const defaultHolidays: Holiday[] = [
  { date: new Date('2024-01-01'), name: 'New Year\'s Day', type: 'federal' },
  { date: new Date('2024-01-25'), name: 'Thaipusam', type: 'federal' },
  { date: new Date('2024-02-10'), name: 'Chinese New Year', type: 'federal' },
  { date: new Date('2024-02-11'), name: 'Chinese New Year Holiday', type: 'federal' },
  { date: new Date('2024-03-28'), name: 'Nuzul Al-Quran', type: 'federal' },
  { date: new Date('2024-04-10'), name: 'Hari Raya Aidilfitri', type: 'federal' },
  { date: new Date('2024-04-11'), name: 'Hari Raya Aidilfitri Holiday', type: 'federal' },
  { date: new Date('2024-05-01'), name: 'Labour Day', type: 'federal' },
  { date: new Date('2024-05-22'), name: 'Wesak Day', type: 'federal' },
  { date: new Date('2024-06-03'), name: 'Agong\'s Birthday', type: 'federal' },
  { date: new Date('2024-06-17'), name: 'Hari Raya Haji', type: 'federal' },
  { date: new Date('2024-07-07'), name: 'Awal Muharram', type: 'federal' },
  { date: new Date('2024-08-31'), name: 'Merdeka Day', type: 'federal' },
  { date: new Date('2024-09-16'), name: 'Malaysia Day', type: 'federal' },
  { date: new Date('2024-09-16'), name: 'Prophet Muhammad\'s Birthday', type: 'federal' },
  { date: new Date('2024-10-31'), name: 'Deepavali', type: 'federal' },
  { date: new Date('2024-12-25'), name: 'Christmas Day', type: 'federal' },
];

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  ganttConfig: {
    viewMode: 'month',
    showDependencies: true,
    showCriticalPath: true,
    showMilestones: true,
    showResourceNames: true,
    showProgress: true,
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    holidays: defaultHolidays,
    workingHours: {
      start: '08:00',
      end: '18:00'
    }
  },
  
  holidays: defaultHolidays,
  resourceLeveling: null,
  criticalPaths: new Map(),
  
  updateGanttConfig: (config) => {
    set((state) => ({
      ganttConfig: { ...state.ganttConfig, ...config }
    }));
  },
  
  addHoliday: (holiday) => {
    set((state) => ({
      holidays: [...state.holidays, holiday],
      ganttConfig: {
        ...state.ganttConfig,
        holidays: [...state.ganttConfig.holidays, holiday]
      }
    }));
  },
  
  removeHoliday: (date) => {
    set((state) => ({
      holidays: state.holidays.filter(h => 
        h.date.toDateString() !== date.toDateString()
      ),
      ganttConfig: {
        ...state.ganttConfig,
        holidays: state.ganttConfig.holidays.filter(h => 
          h.date.toDateString() !== date.toDateString()
        )
      }
    }));
  },
  
  calculateCriticalPath: (projectId, tasks) => {
    // Implementation of Critical Path Method (CPM)
    const sortedTasks = [...tasks].sort((a, b) => 
      a.startDate.getTime() - b.startDate.getTime()
    );
    
    // Calculate early start and early finish
    const taskMap = new Map<string, any>();
    sortedTasks.forEach(task => {
      const duration = Math.ceil(
        (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      let earlyStart = 0;
      if (task.dependencies.length > 0) {
        earlyStart = Math.max(
          ...task.dependencies.map(depId => {
            const dep = taskMap.get(depId);
            return dep ? dep.earlyFinish : 0;
          })
        );
      }
      
      taskMap.set(task.id, {
        ...task,
        duration,
        earlyStart,
        earlyFinish: earlyStart + duration,
        lateStart: 0,
        lateFinish: 0,
        float: 0
      });
    });
    
    // Calculate late start and late finish (backward pass)
    const projectEnd = Math.max(
      ...Array.from(taskMap.values()).map(t => t.earlyFinish)
    );
    
    Array.from(taskMap.values())
      .reverse()
      .forEach(task => {
        if (task.successors && task.successors.length > 0) {
          task.lateFinish = Math.min(
            ...task.successors.map((succId: string) => {
              const succ = taskMap.get(succId);
              return succ ? succ.lateStart : projectEnd;
            })
          );
        } else {
          task.lateFinish = projectEnd;
        }
        task.lateStart = task.lateFinish - task.duration;
        task.float = task.lateStart - task.earlyStart;
      });
    
    // Identify critical path (tasks with zero float)
    const criticalTasks = Array.from(taskMap.values())
      .filter(t => t.float === 0)
      .map(t => t.id);
    
    const criticalPath: CriticalPath = {
      tasks: criticalTasks,
      totalDuration: projectEnd,
      startDate: sortedTasks[0]?.startDate || new Date(),
      endDate: new Date(
        (sortedTasks[0]?.startDate || new Date()).getTime() + 
        projectEnd * 24 * 60 * 60 * 1000
      ),
      buffer: Math.ceil(projectEnd * 0.1), // 10% buffer
      lastCalculated: new Date()
    };
    
    set((state) => {
      const newPaths = new Map(state.criticalPaths);
      newPaths.set(projectId, criticalPath);
      return { criticalPaths: newPaths };
    });
    
    return criticalPath;
  },
  
  performResourceLeveling: (constraints) => {
    // Resource leveling algorithm
    const results: LevelingResult[] = [];
    
    // Simplified resource leveling logic
    // In production, this would use more sophisticated algorithms
    constraints.forEach(constraint => {
      // Check resource availability and adjust task schedules
      const result: LevelingResult = {
        taskId: constraint.resourceId,
        originalStart: new Date(),
        originalEnd: new Date(),
        leveledStart: new Date(),
        leveledEnd: new Date(),
        reason: 'Resource conflict resolved'
      };
      results.push(result);
    });
    
    set({ 
      resourceLeveling: {
        method: 'automatic',
        constraints,
        optimizationGoal: 'resource_utilization',
        results
      }
    });
    
    return results;
  },
  
  checkResourceConflicts: (projectId) => {
    // Check for resource over-allocation
    const conflicts: any[] = [];
    
    // Implementation would check resource allocation across all tasks
    // and identify conflicts where resources are over-allocated
    
    return conflicts;
  },
  
  optimizeSchedule: (projectId, goal) => {
    // Schedule optimization based on different goals
    switch (goal) {
      case 'duration':
        // Fast-track critical path tasks
        break;
      case 'cost':
        // Optimize for minimal cost while maintaining deadlines
        break;
      case 'resource':
        // Level resources to avoid peaks and valleys
        get().performResourceLeveling([]);
        break;
    }
  },
  
  generateMilestones: (projectId, phase) => {
    // Generate standard milestones based on project phase
    const milestones: Milestone[] = [];
    
    const phaseMilestones: Record<string, string[]> = {
      'pre-design': [
        'Client Brief Finalized',
        'Site Survey Completed',
        'Feasibility Study Approved'
      ],
      'concept': [
        'Concept Design Presentation',
        'Client Concept Approval',
        'Budget Estimate Confirmed'
      ],
      'schematic': [
        'Schematic Design Submission',
        'Authority Pre-consultation',
        'Design Development Go-ahead'
      ],
      'design_development': [
        'DD Package Complete',
        'Engineering Coordination',
        'Cost Estimate Update'
      ],
      'documentation': [
        'Construction Documents Complete',
        'Authority Submission',
        'Tender Documents Issued'
      ],
      'tender': [
        'Tender Opening',
        'Tender Evaluation',
        'Contract Award'
      ],
      'construction': [
        'Construction Commencement',
        'Structural Completion',
        'M&E Installation',
        'Testing & Commissioning',
        'Practical Completion'
      ],
      'post-completion': [
        'CCC Obtained',
        'Final Account Settlement',
        'Defects Liability End'
      ]
    };
    
    const milestoneNames = phaseMilestones[phase] || [];
    const today = new Date();
    
    milestoneNames.forEach((name, index) => {
      const milestone: Milestone = {
        id: `${projectId}-milestone-${index}`,
        name,
        description: `${name} for project`,
        date: new Date(today.getTime() + (index + 1) * 30 * 24 * 60 * 60 * 1000),
        status: 'upcoming',
        deliverables: [],
        paymentLinked: index % 3 === 0, // Every third milestone linked to payment
        paymentAmount: index % 3 === 0 ? 0 : undefined,
        clientApprovalRequired: true,
        dependencies: index > 0 ? [`${projectId}-milestone-${index - 1}`] : []
      };
      milestones.push(milestone);
    });
    
    return milestones;
  }
}));