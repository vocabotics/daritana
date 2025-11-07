import dotenv from 'dotenv'
import { sequelize } from '../database/connection'
import { logger } from '../utils/logger'
import User, { UserRole, UserStatus } from '../models/User'
import Project, { ProjectStatus, ProjectType } from '../models/Project'
import Task, { TaskStatus, TaskPriority, TaskType } from '../models/Task'
import '../models/associations' // Import associations
import argon2 from 'argon2'

dotenv.config()

const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...')
    
    // Test connection
    await sequelize.authenticate()
    logger.info('Database connection established')
    
    // Clear existing data (in reverse order of dependencies)
    await sequelize.query('TRUNCATE TABLE tasks CASCADE')
    await sequelize.query('TRUNCATE TABLE documents CASCADE')
    await sequelize.query('TRUNCATE TABLE notifications CASCADE')
    await sequelize.query('TRUNCATE TABLE projects CASCADE')
    await sequelize.query('TRUNCATE TABLE users CASCADE')
    logger.info('Cleared existing data')
    
    // Hash passwords manually since hooks aren't working properly
    const hashedPassword = await argon2.hash('Admin123!')
    
    // Create users (sequentially to ensure they're properly returned)
    const adminUser = await User.create({
      email: 'admin@daritana.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneNumber: '+60123456789',
      companyName: 'Daritana Architects'
    })

    const clientUser = await User.create({
      email: 'john.client@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Client',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneNumber: '+60123456790',
      companyName: 'ABC Corporation'
    })

    const designerUser = await User.create({
      email: 'sarah.designer@daritana.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Designer',
      role: UserRole.DESIGNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneNumber: '+60123456791',
      companyName: 'Daritana Architects',
      designation: 'Senior Designer'
    })

    const leadUser = await User.create({
      email: 'mike.lead@daritana.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Johnson',
      role: UserRole.PROJECT_LEAD,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneNumber: '+60123456792',
      companyName: 'Daritana Architects',
      designation: 'Project Manager'
    })

    const contractorUser = await User.create({
      email: 'contractor@buildco.com',
      password: hashedPassword,
      firstName: 'David',
      lastName: 'Builder',
      role: UserRole.CONTRACTOR,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneNumber: '+60123456793',
      companyName: 'BuildCo Contractors'
    })

    const users = [adminUser, clientUser, designerUser, leadUser, contractorUser]
    
    logger.info(`Created ${users.length} users`)
    
    // Log user IDs for debugging
    users.forEach((user, index) => {
      if (user && user.dataValues) {
        logger.info(`User ${index}: ${user.dataValues.email} - ID: ${user.dataValues.id}`)
      } else {
        logger.info(`User ${index}: object structure issue`, user)
      }
    })
    
    // Ensure we have users before creating projects
    if (users.length < 5) {
      throw new Error('Failed to create all required users')
    }
    
    // Create projects
    const projects = await Promise.all([
      Project.create({
        name: 'KLCC Tower Renovation',
        description: 'Modern office space renovation project in KLCC area',
        type: ProjectType.COMMERCIAL,
        status: ProjectStatus.IN_PROGRESS,
        clientId: users[1].dataValues.id, // John Client
        projectLeadId: users[3].dataValues.id, // Mike Lead
        designerId: users[2].dataValues.id, // Sarah Designer
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-31'),
        budget: 5000000,
        address: 'KLCC Tower, Jalan Ampang',
        city: 'Kuala Lumpur',
        state: 'Wilayah Persekutuan',
        postcode: '50088',
        country: 'Malaysia',
        squareFootage: 15000,
        numberOfFloors: 3,
        priority: 'high',
        progress: 45,
        metadata: {
          designStyle: 'Modern Minimalist',
          sustainabilityFeatures: ['Energy-efficient lighting', 'Rainwater harvesting', 'Solar panels'],
          teamMembers: [users[2].dataValues.id, users[3].dataValues.id], // Sarah and Mike
          clientRequirements: 'Open office concept with breakout areas',
          permits: ['Building permit', 'Renovation permit'],
          milestones: [
            { name: 'Design Approval', date: '2024-02-15', completed: true },
            { name: 'Construction Start', date: '2024-03-01', completed: true },
            { name: 'Phase 1 Completion', date: '2024-06-30', completed: false }
          ]
        }
      }),
      Project.create({
        name: 'George Town Heritage Villa',
        description: 'Restoration of heritage villa in George Town, Penang',
        type: ProjectType.RESIDENTIAL,
        status: ProjectStatus.PLANNING,
        clientId: users[1].dataValues.id,
        projectLeadId: users[3].dataValues.id,
        designerId: users[2].dataValues.id,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-10-31'),
        budget: 2500000,
        address: 'Lebuh Armenian',
        city: 'George Town',
        state: 'Penang',
        postcode: '10200',
        country: 'Malaysia',
        squareFootage: 5000,
        numberOfFloors: 2,
        priority: 'medium',
        progress: 15,
        metadata: {
          designStyle: 'Colonial Heritage',
          sustainabilityFeatures: ['Natural ventilation', 'Heritage material preservation'],
          teamMembers: [users[2].dataValues.id],
          heritageRequirements: 'Maintain original facade and structure',
          consultants: ['Heritage consultant', 'Structural engineer']
        }
      }),
      Project.create({
        name: 'Cyberjaya Tech Campus',
        description: 'New technology campus development in Cyberjaya',
        type: ProjectType.INSTITUTIONAL,
        status: ProjectStatus.PLANNING,
        clientId: users[1].dataValues.id,
        projectLeadId: users[3].dataValues.id,
        designerId: users[2].dataValues.id,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-12-31'),
        budget: 15000000,
        address: 'Persiaran Multimedia',
        city: 'Cyberjaya',
        state: 'Selangor',
        postcode: '63000',
        country: 'Malaysia',
        squareFootage: 50000,
        numberOfFloors: 5,
        priority: 'urgent',
        progress: 25,
        metadata: {
          designStyle: 'Contemporary Tech',
          sustainabilityFeatures: ['LEED Gold certification target', 'Smart building systems', 'EV charging stations'],
          teamMembers: [users[2].id, users[3].id],
          targetOccupancy: 2000,
          facilities: ['Auditorium', 'Labs', 'Cafeteria', 'Sports complex']
        }
      })
    ])
    
    logger.info(`Created ${projects.length} projects`)
    
    // Create tasks for the first project
    const tasks = await Promise.all([
      Task.create({
        title: 'Complete floor plan revisions',
        description: 'Revise floor plans based on client feedback',
        type: TaskType.DESIGN,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        projectId: projects[0].dataValues.id,
        assigneeId: users[2].dataValues.id, // Sarah
        reporterId: users[3].dataValues.id, // Mike
        dueDate: new Date('2024-02-20'),
        estimatedHours: 16,
        actualHours: 8,
        progress: 50,
        tags: ['design', 'revision', 'urgent'],
        attachments: [],
        dependencies: [],
        metadata: {
          clientComments: 'Need more open space in the main area',
          revisionNumber: 3
        }
      }),
      Task.create({
        title: 'Material procurement list',
        description: 'Prepare comprehensive material procurement list',
        type: TaskType.PROCUREMENT,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        projectId: projects[0].dataValues.id,
        assigneeId: users[4].dataValues.id, // Contractor
        reporterId: users[3].dataValues.id,
        dueDate: new Date('2024-03-01'),
        estimatedHours: 8,
        tags: ['procurement', 'materials'],
        attachments: [],
        dependencies: []
      }),
      Task.create({
        title: 'Submit building permit application',
        description: 'Prepare and submit all documents for building permit',
        type: TaskType.DOCUMENTATION,
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        projectId: projects[0].dataValues.id,
        assigneeId: users[3].dataValues.id,
        reporterId: users[3].dataValues.id,
        completedDate: new Date('2024-01-30'),
        estimatedHours: 12,
        actualHours: 10,
        progress: 100,
        tags: ['permit', 'documentation', 'compliance'],
        attachments: [],
        dependencies: []
      }),
      Task.create({
        title: 'Site inspection',
        description: 'Conduct initial site inspection and assessment',
        type: TaskType.SITE_VISIT,
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        projectId: projects[0].dataValues.id,
        assigneeId: users[3].dataValues.id,
        reporterId: users[3].dataValues.id,
        completedAt: new Date('2024-01-20'),
        estimatedHours: 4,
        actualHours: 4,
        progress: 100,
        tags: ['site', 'inspection'],
        attachments: [],
        dependencies: []
      })
    ])
    
    logger.info(`Created ${tasks.length} tasks`)
    
    logger.info('Database seeding completed successfully')
    process.exit(0)
  } catch (error) {
    logger.error('Seeding failed:', error)
    process.exit(1)
  }
}

// Run seeding
seedDatabase()