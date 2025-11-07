import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore'

describe('Project Store', () => {
  beforeEach(() => {
    // Reset store to initial state with mock data
    useProjectStore.setState({
      projects: useProjectStore.getState().projects,
      tasks: useProjectStore.getState().tasks,
      designBriefs: useProjectStore.getState().designBriefs,
      timelines: useProjectStore.getState().timelines,
    })
  })

  describe('project management', () => {
    it('should fetch all projects', () => {
      const { projects } = useProjectStore.getState()
      expect(projects).toHaveLength(3)
      expect(projects[0].name).toBe('KLCC Tower Renovation')
    })

    it('should add a new project', () => {
      const { addProject, projects } = useProjectStore.getState()
      
      const newProject = {
        id: 'test-project',
        name: 'Test Project',
        clientId: 'client-1',
        status: 'planning' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        budget: 100000,
        description: 'Test project description',
        managerId: 'user-1',
        teamIds: ['user-2'],
        progress: 0,
        location: 'Test Location',
        projectType: 'residential' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      addProject(newProject)
      
      const updatedProjects = useProjectStore.getState().projects
      expect(updatedProjects).toHaveLength(4)
      expect(updatedProjects.find(p => p.id === 'test-project')).toBeDefined()
    })

    it('should update project status', () => {
      const { updateProject, projects } = useProjectStore.getState()
      const projectId = projects[0].id
      
      updateProject(projectId, { status: 'completed' })
      
      const updatedProject = useProjectStore.getState().projects.find(p => p.id === projectId)
      expect(updatedProject?.status).toBe('completed')
    })

    it('should delete a project', () => {
      const { deleteProject, projects } = useProjectStore.getState()
      const projectId = projects[0].id
      const initialCount = projects.length
      
      deleteProject(projectId)
      
      const updatedProjects = useProjectStore.getState().projects
      expect(updatedProjects).toHaveLength(initialCount - 1)
      expect(updatedProjects.find(p => p.id === projectId)).toBeUndefined()
    })
  })

  describe('task management', () => {
    it('should fetch tasks for a project', () => {
      const { tasks } = useProjectStore.getState()
      const projectTasks = tasks.filter(t => t.projectId === 'proj-1')
      expect(projectTasks.length).toBeGreaterThan(0)
    })

    it('should add a new task', () => {
      const { addTask, tasks } = useProjectStore.getState()
      
      const newTask = {
        id: 'test-task',
        projectId: 'proj-1',
        title: 'Test Task',
        description: 'Test task description',
        status: 'todo' as const,
        priority: 'medium' as const,
        assigneeId: 'user-2',
        dueDate: new Date('2024-06-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      addTask(newTask)
      
      const updatedTasks = useProjectStore.getState().tasks
      expect(updatedTasks.find(t => t.id === 'test-task')).toBeDefined()
    })

    it('should update task status', () => {
      const { updateTask, tasks } = useProjectStore.getState()
      const taskId = tasks[0].id
      
      updateTask(taskId, { status: 'completed' })
      
      const updatedTask = useProjectStore.getState().tasks.find(t => t.id === taskId)
      expect(updatedTask?.status).toBe('completed')
    })

    it('should move task between columns', () => {
      const { moveTask, tasks } = useProjectStore.getState()
      const taskId = tasks[0].id
      
      moveTask(taskId, 'in_progress')
      
      const updatedTask = useProjectStore.getState().tasks.find(t => t.id === taskId)
      expect(updatedTask?.status).toBe('in_progress')
    })
  })

  describe('design brief management', () => {
    it('should create a design brief', () => {
      const { addDesignBrief, designBriefs } = useProjectStore.getState()
      
      const newBrief = {
        id: 'test-brief',
        projectId: 'proj-1',
        projectType: 'residential' as const,
        style: 'modern',
        budget: {
          min: 50000,
          max: 100000,
          currency: 'MYR' as const,
        },
        timeline: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-06-01'),
          phases: [],
        },
        requirements: {
          rooms: 5,
          bathrooms: 2,
          parking: 2,
          features: ['garden', 'pool'],
        },
        preferences: {
          colors: ['blue', 'white'],
          materials: ['wood', 'stone'],
          styles: ['minimalist'],
        },
        culturalConsiderations: ['feng shui'],
        climateRequirements: ['tropical'],
        sustainabilityGoals: ['solar panels'],
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      addDesignBrief(newBrief)
      
      const updatedBriefs = useProjectStore.getState().designBriefs
      expect(updatedBriefs.find(b => b.id === 'test-brief')).toBeDefined()
    })

    it('should update design brief status', () => {
      const { designBriefs, updateDesignBrief } = useProjectStore.getState()
      const briefId = designBriefs[0].id
      
      updateDesignBrief(briefId, { status: 'approved' })
      
      const updatedBrief = useProjectStore.getState().designBriefs.find(b => b.id === briefId)
      expect(updatedBrief?.status).toBe('approved')
    })
  })

  describe('timeline management', () => {
    it('should fetch project timelines', () => {
      const { timelines } = useProjectStore.getState()
      expect(timelines.length).toBeGreaterThan(0)
    })

    it('should update timeline phase status', () => {
      const { updateTimeline, timelines } = useProjectStore.getState()
      const timeline = timelines[0]
      
      if (timeline && timeline.phases.length > 0) {
        const updatedPhases = timeline.phases.map((phase, index) => 
          index === 0 ? { ...phase, status: 'completed' as const } : phase
        )
        
        updateTimeline(timeline.id, { phases: updatedPhases })
        
        const updatedTimeline = useProjectStore.getState().timelines.find(t => t.id === timeline.id)
        expect(updatedTimeline?.phases[0].status).toBe('completed')
      }
    })
  })
})