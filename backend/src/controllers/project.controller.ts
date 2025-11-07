import { Request, Response, NextFunction } from 'express'
import { Project, ProjectStatus, ProjectType } from '../models/Project'
import { User } from '../models/User'
import { Task } from '../models/Task'
import { Document } from '../models/Document'
import { ApiError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { logger } from '../utils/logger'
import { Op } from 'sequelize'

export class ProjectController {
  // Get all projects with filtering and pagination
  static async getAllProjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        type,
        priority,
        clientId,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        includeDeleted = false
      } = req.query

      const pageNum = parseInt(page as string)
      const limitNum = parseInt(limit as string)
      const offset = (pageNum - 1) * limitNum

      // Build where clause
      const where: any = {}
      
      if (status) {
        where.status = status
      }
      
      if (type) {
        where.type = type
      }
      
      if (priority) {
        where.priority = priority
      }
      
      if (clientId) {
        where.clientId = clientId
      }
      
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } },
          { city: { [Op.iLike]: `%${search}%` } }
        ]
      }

      // Filter projects based on user role
      if (req.user?.role !== 'admin' && req.user?.role !== 'staff') {
        where[Op.or] = [
          { clientId: req.user?.id },
          { projectLeadId: req.user?.id },
          { designerId: req.user?.id }
        ]
      }

      const projects = await Project.findAndCountAll({
        where,
        include: [
          { model: User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'email', 'companyName'] },
          { model: User, as: 'projectLead', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'designer', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ],
        order: [[sortBy as string, sortOrder as string]],
        limit: limitNum,
        offset,
        paranoid: includeDeleted !== 'true'
      })

      res.json({
        projects: projects.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: projects.count,
          pages: Math.ceil(projects.count / limitNum)
        }
      })
    } catch (error) {
      next(error)
    }
  }

  // Get project by ID
  static async getProjectById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const project = await Project.findByPk(id, {
        include: [
          { model: User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'email', 'companyName'] },
          { model: User, as: 'projectLead', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'designer', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: Task, as: 'tasks', include: [
            { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] }
          ]},
          { model: Document, as: 'documents' }
        ]
      })

      if (!project) {
        throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND')
      }

      res.json({ project })
    } catch (error) {
      next(error)
    }
  }

  // Create new project
  static async createProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectData = req.body

      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      // Set default values
      const project = await Project.create({
        ...projectData,
        // If no clientId provided and user is a client, use current user
        clientId: projectData.clientId || (req.user.role === 'client' ? req.user.id : projectData.clientId),
        // Set project lead or designer based on user role
        ...(req.user.role === 'project_lead' && { projectLeadId: req.user.id }),
        ...(req.user.role === 'designer' && { designerId: req.user.id })
      })

      const newProject = await Project.findByPk(project.id, {
        include: [
          { model: User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'email', 'companyName'] },
          { model: User, as: 'projectLead', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'designer', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ]
      })

      logger.info(`New project created: ${project.name} by ${req.user.email}`)

      res.status(201).json({
        message: 'Project created successfully',
        project: newProject
      })
    } catch (error) {
      next(error)
    }
  }

  // Update project
  static async updateProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const updateData = req.body

      const project = await Project.findByPk(id)
      if (!project) {
        throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND')
      }

      await project.update(updateData)

      const updatedProject = await Project.findByPk(id, {
        include: [
          { model: User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'email', 'companyName'] },
          { model: User, as: 'projectLead', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'designer', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ]
      })

      logger.info(`Project updated: ${project.name} by ${req.user?.email}`)

      res.json({
        message: 'Project updated successfully',
        project: updatedProject
      })
    } catch (error) {
      next(error)
    }
  }

  // Delete project (soft delete)
  static async deleteProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const project = await Project.findByPk(id)
      if (!project) {
        throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND')
      }

      await project.destroy()

      logger.info(`Project deleted: ${project.name} by ${req.user?.email}`)

      res.json({
        message: 'Project deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  // Get project statistics
  static async getProjectStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const project = await Project.findByPk(id, {
        include: [
          { model: Task, as: 'tasks' },
          { model: Document, as: 'documents' }
        ]
      })

      if (!project) {
        throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND')
      }

      const tasks = project.tasks || []
      const documents = project.documents || []

      const statistics = {
        tasks: {
          total: tasks.length,
          completed: tasks.filter((t: any) => t.status === 'completed').length,
          inProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
          overdue: tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length
        },
        documents: {
          total: documents.length,
          approved: documents.filter((d: any) => d.status === 'approved').length,
          pending: documents.filter((d: any) => d.status === 'draft' || d.status === 'in_review').length
        },
        timeline: {
          daysElapsed: project.actualStartDate ? 
            Math.ceil((new Date().getTime() - new Date(project.actualStartDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          daysRemaining: project.daysRemaining,
          isOverdue: project.isOverdue
        },
        financial: {
          budget: project.budget,
          actualCost: project.actualCost,
          budgetUtilization: project.budgetUtilization
        }
      }

      res.json({ statistics })
    } catch (error) {
      next(error)
    }
  }

  // Get project team members
  static async getProjectTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const project = await Project.findByPk(id, {
        include: [
          { model: User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'companyName', 'profileImage'] },
          { model: User, as: 'projectLead', attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'profileImage'] },
          { model: User, as: 'designer', attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'profileImage'] }
        ]
      })

      if (!project) {
        throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND')
      }

      // Get all users assigned to tasks in this project
      const taskAssignees = await User.findAll({
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'profileImage'],
        include: [
          {
            model: Task,
            as: 'assignedTasks',
            where: { projectId: id },
            attributes: []
          }
        ],
        group: ['User.id']
      })

      const team = {
        client: project.client,
        projectLead: project.projectLead,
        designer: project.designer,
        taskAssignees
      }

      res.json({ team })
    } catch (error) {
      next(error)
    }
  }

  // Update project progress
  static async updateProjectProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const project = await Project.findByPk(id, {
        include: [{ model: Task, as: 'tasks' }]
      })

      if (!project) {
        throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND')
      }

      // Calculate progress based on tasks
      const tasks = project.tasks || []
      if (tasks.length > 0) {
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t: any) => t.status === 'completed').length
        const progress = Math.round((completedTasks / totalTasks) * 100)
        
        await project.update({ progress })
      }

      // Also update milestones progress
      await project.updateProgress()

      const updatedProject = await Project.findByPk(id, {
        attributes: ['id', 'name', 'progress', 'status']
      })

      res.json({
        message: 'Project progress updated',
        project: updatedProject
      })
    } catch (error) {
      next(error)
    }
  }

  // Search projects
  static async searchProjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { q, status, type, limit = 10 } = req.query

      if (!q || typeof q !== 'string' || q.length < 2) {
        throw new ApiError(400, 'Search query must be at least 2 characters long', 'INVALID_SEARCH_QUERY')
      }

      const where: any = {
        [Op.and]: [
          {
            [Op.or]: [
              { name: { [Op.iLike]: `%${q}%` } },
              { description: { [Op.iLike]: `%${q}%` } },
              { address: { [Op.iLike]: `%${q}%` } },
              { city: { [Op.iLike]: `%${q}%` } }
            ]
          }
        ]
      }

      if (status) {
        where[Op.and].push({ status })
      }

      if (type) {
        where[Op.and].push({ type })
      }

      // Filter projects based on user role
      if (req.user?.role !== 'admin' && req.user?.role !== 'staff') {
        where[Op.and].push({
          [Op.or]: [
            { clientId: req.user?.id },
            { projectLeadId: req.user?.id },
            { designerId: req.user?.id }
          ]
        })
      }

      const projects = await Project.findAll({
        where,
        attributes: ['id', 'name', 'description', 'status', 'type', 'progress', 'coverImage'],
        include: [
          { model: User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'companyName'] }
        ],
        limit: parseInt(limit as string),
        order: [['name', 'ASC']]
      })

      res.json({ projects })
    } catch (error) {
      next(error)
    }
  }

  // Get dashboard statistics
  static async getDashboardStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED')
      }

      // Build where clause based on user role
      let projectWhere: any = {}
      if (req.user.role !== 'admin' && req.user.role !== 'staff') {
        projectWhere = {
          [Op.or]: [
            { clientId: req.user.id },
            { projectLeadId: req.user.id },
            { designerId: req.user.id }
          ]
        }
      }

      const [
        totalProjects,
        activeProjects,
        completedProjects,
        overdueProjects,
        recentProjects
      ] = await Promise.all([
        Project.count({ where: projectWhere }),
        Project.count({ where: { ...projectWhere, status: ProjectStatus.IN_PROGRESS } }),
        Project.count({ where: { ...projectWhere, status: ProjectStatus.COMPLETED } }),
        Project.count({
          where: {
            ...projectWhere,
            endDate: { [Op.lt]: new Date() },
            status: { [Op.notIn]: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED] }
          }
        }),
        Project.findAll({
          where: projectWhere,
          include: [
            { model: User, as: 'client', attributes: ['firstName', 'lastName', 'companyName'] }
          ],
          order: [['createdAt', 'DESC']],
          limit: 5,
          attributes: ['id', 'name', 'status', 'progress', 'createdAt']
        })
      ])

      const statistics = {
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          overdue: overdueProjects
        },
        recentProjects
      }

      res.json({ statistics })
    } catch (error) {
      next(error)
    }
  }
}