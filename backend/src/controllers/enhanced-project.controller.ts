import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * List projects for organization with filtering and pagination
 */
export const listProjects = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      page = 1,
      limit = 20,
      status,
      priority,
      clientId,
      managerId,
      search,
      type,
      category,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    const where: any = { organizationId }

    // Apply filters
    if (status) where.status = status
    if (priority) where.priority = priority
    if (clientId) where.clientId = clientId
    if (managerId) where.managerId = managerId
    if (type) where.type = type
    if (category) where.category = category

    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate))
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { code: { contains: String(search), mode: 'insensitive' } }
      ]
    }

    // Check if user has access to projects
    if (req.user?.organizationRole !== 'ORG_ADMIN' && req.user?.organizationRole !== 'PROJECT_LEAD') {
      // Regular users can only see projects they're members of
      where.members = {
        some: {
          userId: req.user?.id
        }
      }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              email: true,
              name: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  avatar: true
                }
              }
            },
            take: 5 // Limit to first 5 members for list view
          },
          _count: {
            select: {
              tasks: true,
              documents: true,
              members: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { [String(sortBy)]: sortOrder }
      }),
      prisma.project.count({ where })
    ])

    res.json({
      projects,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('List projects error:', error)
    res.status(500).json({ error: 'Failed to list projects' })
  }
}

/**
 * Create new project
 */
export const createProject = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Skip permission check for now - all authenticated users can create projects
    // if (!req.user?.permissions?.includes('projects.create')) {
    //   return res.status(403).json({ error: 'No permission to create projects' })
    // }

    // Skip organization limits check for now
    // const projectCount = await prisma.project.count({
    //   where: { organizationId }
    // })

    // if (req.organization?.limits && projectCount >= req.organization.limits.maxProjects) {
    //   return res.status(403).json({
    //     error: 'Project limit reached',
    //     limit: req.organization.limits.maxProjects,
    //     current: projectCount
    //   })
    // }

    const {
      name,
      description,
      code,
      clientId,
      managerId,
      status = 'PLANNING',
      priority = 'MEDIUM',
      startDate,
      endDate,
      estimatedBudget,
      siteAddress,
      siteCity,
      siteState,
      sitePostcode,
      siteCountry = 'Malaysia',
      type,
      category,
      subCategory,
      customData,
      teamMembers = []
    } = req.body
    
    // Use current user as client if not specified
    const effectiveClientId = clientId || req.user?.id

    // Generate project code if not provided
    const projectCode = code || await generateProjectCode(organizationId)

    const project = await prisma.$transaction(async (tx) => {
      // Create project
      const newProject = await tx.project.create({
        data: {
          organizationId,
          name,
          description,
          code: projectCode,
          clientId: effectiveClientId,
          managerId: managerId || req.user!.id,
          status,
          priority,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
          siteAddress,
          siteCity,
          siteState,
          sitePostcode,
          siteCountry,
          type,
          category,
          subCategory,
          customData
        }
      })

      // Add project manager as member
      await tx.projectMember.create({
        data: {
          projectId: newProject.id,
          userId: managerId || req.user!.id,
          role: 'LEAD',
          permissions: ['view', 'edit', 'delete', 'manage_team']
        }
      })

      // Add team members
      if (teamMembers.length > 0) {
        await tx.projectMember.createMany({
          data: teamMembers.map((member: any) => ({
            projectId: newProject.id,
            userId: member.userId,
            role: member.role || 'MEMBER',
            permissions: member.permissions || ['view', 'comment']
          }))
        })
      }

      return newProject
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'create',
        resource: 'project',
        resourceId: project.id,
        newValues: { name, code: projectCode, clientId }
      }
    })

    // Fetch complete project with relations
    const completeProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    res.status(201).json(completeProject)
  } catch (error) {
    console.error('Create project error:', error)
    res.status(500).json({ error: 'Failed to create project' })
  }
}

/**
 * Get project details
 */
export const getProject = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            avatar: true,
            phone: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                firstName: true,
                lastName: true,
                avatar: true,
                position: true
              }
            }
          }
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        documents: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        timelines: {
          orderBy: { startDate: 'asc' }
        },
        milestones: {
          orderBy: { dueDate: 'asc' }
        },
        _count: {
          select: {
            tasks: true,
            documents: true,
            members: true,
            meetings: true
          }
        }
      }
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Check if user has access
    const hasAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.organizationRole === 'PROJECT_LEAD' ||
                     project.members.some(m => m.userId === req.user?.id)

    if (!hasAccess) {
      return res.status(403).json({ error: 'No access to this project' })
    }

    res.json(project)
  } catch (error) {
    console.error('Get project error:', error)
    res.status(500).json({ error: 'Failed to get project' })
  }
}

/**
 * Update project
 */
export const updateProject = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if project exists and user has access
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId
      },
      include: {
        members: true
      }
    })

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Check permissions
    const hasEditAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                         req.user?.organizationRole === 'PROJECT_LEAD' ||
                         existingProject.members.some(m => 
                           m.userId === req.user?.id && 
                           m.permissions.includes('edit')
                         )

    if (!hasEditAccess) {
      return res.status(403).json({ error: 'No permission to edit this project' })
    }

    const {
      name,
      description,
      code,
      clientId,
      managerId,
      status,
      priority,
      startDate,
      endDate,
      actualStartDate,
      actualEndDate,
      estimatedBudget,
      approvedBudget,
      actualCost,
      progress,
      siteAddress,
      siteCity,
      siteState,
      sitePostcode,
      siteCountry,
      type,
      category,
      subCategory,
      customData
    } = req.body

    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (code !== undefined) updateData.code = code
    if (clientId !== undefined) updateData.clientId = clientId
    if (managerId !== undefined) updateData.managerId = managerId
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = new Date(endDate)
    if (actualStartDate !== undefined) updateData.actualStartDate = actualStartDate ? new Date(actualStartDate) : null
    if (actualEndDate !== undefined) updateData.actualEndDate = actualEndDate ? new Date(actualEndDate) : null
    if (estimatedBudget !== undefined) updateData.estimatedBudget = parseFloat(estimatedBudget)
    if (approvedBudget !== undefined) updateData.approvedBudget = parseFloat(approvedBudget)
    if (actualCost !== undefined) updateData.actualCost = parseFloat(actualCost)
    if (progress !== undefined) updateData.progress = parseFloat(progress)
    if (siteAddress !== undefined) updateData.siteAddress = siteAddress
    if (siteCity !== undefined) updateData.siteCity = siteCity
    if (siteState !== undefined) updateData.siteState = siteState
    if (sitePostcode !== undefined) updateData.sitePostcode = sitePostcode
    if (siteCountry !== undefined) updateData.siteCountry = siteCountry
    if (type !== undefined) updateData.type = type
    if (category !== undefined) updateData.category = category
    if (subCategory !== undefined) updateData.subCategory = subCategory
    if (customData !== undefined) updateData.customData = customData

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'update',
        resource: 'project',
        resourceId: projectId,
        oldValues: { name: existingProject.name, status: existingProject.status },
        newValues: updateData
      }
    })

    res.json(updatedProject)
  } catch (error) {
    console.error('Update project error:', error)
    res.status(500).json({ error: 'Failed to update project' })
  }
}

/**
 * Delete project
 */
export const deleteProject = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { projectId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId
      },
      include: {
        members: true
      }
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Check permissions
    const hasDeleteAccess = req.user?.organizationRole === 'ORG_ADMIN' ||
                           (req.user?.organizationRole === 'PROJECT_LEAD' && project.managerId === req.user.id) ||
                           project.members.some(m => 
                             m.userId === req.user?.id && 
                             m.permissions.includes('delete')
                           )

    if (!hasDeleteAccess) {
      return res.status(403).json({ error: 'No permission to delete this project' })
    }

    // Soft delete
    await prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user!.id,
        action: 'delete',
        resource: 'project',
        resourceId: projectId,
        oldValues: { name: project.name, code: project.code }
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete project error:', error)
    res.status(500).json({ error: 'Failed to delete project' })
  }
}

/**
 * Generate unique project code
 */
async function generateProjectCode(organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const base = `PROJ-${year}-`
  
  const lastProject = await prisma.project.findFirst({
    where: {
      organizationId,
      code: { startsWith: base }
    },
    orderBy: { code: 'desc' }
  })

  let nextNumber = 1
  if (lastProject?.code) {
    const lastNumber = parseInt(lastProject.code.split('-')[2])
    nextNumber = lastNumber + 1
  }

  return `${base}${nextNumber.toString().padStart(3, '0')}`
}