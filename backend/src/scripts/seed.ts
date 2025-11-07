import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../utils/password.utils';
import { createLogger } from '../utils/logger';

const prisma = new PrismaClient();
const logger = createLogger('DatabaseSeed');

async function createUsers() {
  logger.info('Creating users...');

  const users = [
    {
      email: 'admin@daritana.com',
      password: await hashPassword('admin123!'),
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      company: 'Daritana',
      position: 'System Administrator'
    },
    {
      email: 'lead@daritana.com',
      password: await hashPassword('lead123!'),
      firstName: 'Project',
      lastName: 'Lead',
      role: UserRole.PROJECT_LEAD,
      isActive: true,
      emailVerified: true,
      company: 'Daritana',
      position: 'Project Manager',
      phone: '+60123456789'
    },
    {
      email: 'designer@daritana.com',
      password: await hashPassword('designer123!'),
      firstName: 'Interior',
      lastName: 'Designer',
      role: UserRole.DESIGNER,
      isActive: true,
      emailVerified: true,
      company: 'Daritana',
      position: 'Senior Designer',
      phone: '+60123456788'
    },
    {
      email: 'contractor@daritana.com',
      password: await hashPassword('contractor123!'),
      firstName: 'Building',
      lastName: 'Contractor',
      role: UserRole.CONTRACTOR,
      isActive: true,
      emailVerified: true,
      company: 'KL Construction Sdn Bhd',
      position: 'Site Supervisor',
      phone: '+60123456787',
      city: 'Kuala Lumpur',
      state: 'Kuala Lumpur'
    },
    {
      email: 'client@daritana.com',
      password: await hashPassword('client123!'),
      firstName: 'Sarah',
      lastName: 'Tan',
      role: UserRole.CLIENT,
      isActive: true,
      emailVerified: true,
      company: 'Tech Solutions Sdn Bhd',
      position: 'CEO',
      phone: '+60123456786',
      address: 'Jalan Ampang',
      city: 'Kuala Lumpur',
      state: 'Kuala Lumpur',
      postcode: '50450'
    },
    {
      email: 'staff@daritana.com',
      password: await hashPassword('staff123!'),
      firstName: 'Ahmad',
      lastName: 'Rahman',
      role: UserRole.STAFF,
      isActive: true,
      emailVerified: true,
      company: 'Daritana',
      position: 'Assistant',
      phone: '+60123456785'
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        logger.info(`User ${userData.email} already exists, skipping...`);
        createdUsers.push(existingUser);
        continue;
      }

      const user = await prisma.user.create({
        data: userData
      });
      
      logger.info(`Created user: ${user.email} (${user.role})`);
      createdUsers.push(user);
    } catch (error) {
      logger.error(`Failed to create user ${userData.email}:`, error);
    }
  }

  return createdUsers;
}

async function createSampleProjects(users: any[]) {
  logger.info('Creating sample projects...');

  const client = users.find(u => u.role === 'CLIENT');
  const designer = users.find(u => u.role === 'DESIGNER');
  const projectLead = users.find(u => u.role === 'PROJECT_LEAD');

  if (!client || !designer || !projectLead) {
    logger.warn('Required users not found for creating projects');
    return [];
  }

  const projects = [
    {
      name: 'KLCC Penthouse Renovation',
      description: 'Luxury penthouse interior design and renovation in KLCC area',
      clientId: client.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-06-30'),
      budget: 250000.00,
      actualCost: 180000.00,
      progress: 65,
      address: 'KLCC, Kuala Lumpur',
      city: 'Kuala Lumpur',
      state: 'Kuala Lumpur',
      type: 'Residential',
      category: 'Interior Design'
    },
    {
      name: 'George Town Heritage Office',
      description: 'Modern office design while preserving heritage elements',
      clientId: client.id,
      status: 'PLANNING',
      priority: 'MEDIUM',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-08-15'),
      budget: 180000.00,
      address: 'Lebuh Armenian, George Town',
      city: 'George Town',
      state: 'Penang',
      type: 'Commercial',
      category: 'Architecture'
    },
    {
      name: 'Bangsar Bungalow Extension',
      description: 'Adding modern extension to traditional bungalow',
      clientId: client.id,
      status: 'COMPLETED',
      priority: 'LOW',
      startDate: new Date('2023-09-01'),
      endDate: new Date('2024-01-15'),
      budget: 120000.00,
      actualCost: 115000.00,
      progress: 100,
      address: 'Bangsar, Kuala Lumpur',
      city: 'Kuala Lumpur',
      state: 'Kuala Lumpur',
      type: 'Residential',
      category: 'Architecture'
    }
  ];

  const createdProjects = [];
  for (const projectData of projects) {
    try {
      const existingProject = await prisma.project.findFirst({
        where: { name: projectData.name }
      });

      if (existingProject) {
        logger.info(`Project ${projectData.name} already exists, skipping...`);
        createdProjects.push(existingProject);
        continue;
      }

      const project = await prisma.project.create({
        data: projectData
      });

      logger.info(`Created project: ${project.name}`);
      createdProjects.push(project);
    } catch (error) {
      logger.error(`Failed to create project ${projectData.name}:`, error);
    }
  }

  return createdProjects;
}

async function createSampleTasks(projects: any[], users: any[]) {
  logger.info('Creating sample tasks...');

  if (projects.length === 0) {
    logger.warn('No projects available for creating tasks');
    return [];
  }

  const designer = users.find(u => u.role === 'DESIGNER');
  const contractor = users.find(u => u.role === 'CONTRACTOR');
  const projectLead = users.find(u => u.role === 'PROJECT_LEAD');

  if (!designer || !contractor || !projectLead) {
    logger.warn('Required users not found for creating tasks');
    return [];
  }

  const project = projects[0]; // Use first project

  const tasks = [
    {
      projectId: project.id,
      title: 'Initial Site Survey',
      description: 'Conduct detailed site survey and measurements',
      status: 'COMPLETED',
      priority: 'HIGH',
      dueDate: new Date('2024-01-20'),
      completedAt: new Date('2024-01-18'),
      estimatedHours: 8,
      actualHours: 6,
      createdBy: projectLead.id
    },
    {
      projectId: project.id,
      title: 'Design Concepts Development',
      description: 'Create initial design concepts and mood boards',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date('2024-02-15'),
      estimatedHours: 40,
      actualHours: 25,
      createdBy: projectLead.id
    },
    {
      projectId: project.id,
      title: 'Material Selection',
      description: 'Select appropriate materials and finishes',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date('2024-02-28'),
      estimatedHours: 16,
      createdBy: designer.id
    }
  ];

  const createdTasks = [];
  for (const taskData of tasks) {
    try {
      const task = await prisma.task.create({
        data: taskData
      });

      // Assign tasks to users
      if (task.title.includes('Design')) {
        await prisma.taskAssignment.create({
          data: {
            taskId: task.id,
            userId: designer.id
          }
        });
      } else if (task.title.includes('Survey')) {
        await prisma.taskAssignment.create({
          data: {
            taskId: task.id,
            userId: contractor.id
          }
        });
      }

      logger.info(`Created task: ${task.title}`);
      createdTasks.push(task);
    } catch (error) {
      logger.error(`Failed to create task ${taskData.title}:`, error);
    }
  }

  return createdTasks;
}

async function createSampleDesignBriefs(projects: any[]) {
  logger.info('Creating sample design briefs...');

  if (projects.length === 0) {
    logger.warn('No projects available for creating design briefs');
    return [];
  }

  const project = projects[0];

  const designBriefData = {
    projectId: project.id,
    stylePreferences: ['Modern', 'Minimalist', 'Scandinavian'],
    roomRequirements: {
      living_room: {
        size: '30 sqm',
        requirements: ['Open concept', 'Natural lighting', 'Entertainment area']
      },
      kitchen: {
        size: '15 sqm',
        requirements: ['Island counter', 'Premium appliances', 'Storage']
      },
      bedrooms: {
        count: 3,
        master_suite: true,
        requirements: ['Walk-in closet', 'En-suite bathroom']
      }
    },
    budget: 250000.00,
    timeline: '6 months',
    specialRequests: 'Pet-friendly design with easy-to-clean materials',
    culturalElements: ['Malaysian art', 'Tropical elements'],
    sustainabilityFeatures: ['Energy-efficient lighting', 'Sustainable materials'],
    status: 'IN_REVIEW'
  };

  try {
    const existingBrief = await prisma.designBrief.findFirst({
      where: { projectId: project.id }
    });

    if (existingBrief) {
      logger.info('Design brief already exists for this project, skipping...');
      return [existingBrief];
    }

    const designBrief = await prisma.designBrief.create({
      data: designBriefData
    });

    logger.info('Created design brief');
    return [designBrief];
  } catch (error) {
    logger.error('Failed to create design brief:', error);
    return [];
  }
}

async function main() {
  try {
    logger.info('🌱 Starting database seeding...');

    // Create users first
    const users = await createUsers();
    logger.info(`✅ Created ${users.length} users`);

    // Create projects
    const projects = await createSampleProjects(users);
    logger.info(`✅ Created ${projects.length} projects`);

    // Create tasks
    const tasks = await createSampleTasks(projects, users);
    logger.info(`✅ Created ${tasks.length} tasks`);

    // Create design briefs
    const designBriefs = await createSampleDesignBriefs(projects);
    logger.info(`✅ Created ${designBriefs.length} design briefs`);

    logger.info('🎉 Database seeding completed successfully!');
    logger.info('\n📝 Test Account Credentials:');
    logger.info('Admin: admin@daritana.com / admin123!');
    logger.info('Project Lead: lead@daritana.com / lead123!');
    logger.info('Designer: designer@daritana.com / designer123!');
    logger.info('Contractor: contractor@daritana.com / contractor123!');
    logger.info('Client: client@daritana.com / client123!');
    logger.info('Staff: staff@daritana.com / staff123!');

  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed script
if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;