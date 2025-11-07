import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  
  // Clean up all data
  await prisma.organizationMember.deleteMany();
  await prisma.challengeSubmission.deleteMany();
  await prisma.communityChallenge.deleteMany();
  await prisma.communityGroupMember.deleteMany();
  await prisma.communityGroup.deleteMany();
  await prisma.communityShare.deleteMany();
  await prisma.communityCommentLike.deleteMany();
  await prisma.communityComment.deleteMany();
  await prisma.communityLike.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.wBSNode.deleteMany();
  await prisma.resourceAllocation.deleteMany();
  await prisma.monteCarloInput.deleteMany();
  await prisma.monteCarloSimulation.deleteMany();
  await prisma.riskAssessment.deleteMany();
  console.log('✨ Cleaned up existing data');

  // Create subscription plans first
  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan_basic' },
    update: {},
    create: {
      id: 'plan_basic',
      name: 'BASIC',
      displayName: 'Basic Plan',
      description: 'Perfect for small teams and individual architects',
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,
      currency: 'MYR',
      features: ['5 Projects', '2 Users', '1GB Storage'],
      maxProjects: 5,
      maxUsers: 2,
      maxStorage: 1000, // 1GB represented as 1000 MB
      maxFiles: 100,
      isActive: true,
      isPublic: true
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan_pro' },
    update: {},
    create: {
      id: 'plan_pro',
      name: 'PROFESSIONAL',
      displayName: 'Professional Plan',
      description: 'For growing architecture firms',
      monthlyPrice: 99.99,
      yearlyPrice: 999.99,
      currency: 'MYR',
      features: ['Unlimited Projects', '10 Users', '100GB Storage', 'Priority Support'],
      maxProjects: -1, // Unlimited
      maxUsers: 10,
      maxStorage: 100000, // 100GB represented as 100000 MB
      maxFiles: 1000,
      isActive: true,
      isPublic: true
    },
  });

  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan_enterprise' },
    update: {},
    create: {
      id: 'plan_enterprise',
      name: 'ENTERPRISE',
      displayName: 'Enterprise Plan',
      description: 'For large enterprises with custom needs',
      monthlyPrice: 299.99,
      yearlyPrice: 2999.99,
      currency: 'MYR',
      features: ['Unlimited Everything', 'Unlimited Users', 'Unlimited Storage', '24/7 Support', 'Custom Features'],
      maxProjects: -1,
      maxUsers: -1,
      maxStorage: -1,
      maxFiles: -1,
      isActive: true,
      isPublic: true,
    },
  });

  // Create organizations
  const orgDaritana = await prisma.organization.upsert({
    where: { id: 'org_daritana' },
    update: {},
    create: {
      id: 'org_daritana',
      name: 'Daritana Architects',
      slug: 'daritana',
      email: 'info@daritana.com',
      country: 'Malaysia',
      timezone: 'Asia/Kuala_Lumpur',
      currency: 'MYR',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      planId: enterprisePlan.id,
    },
  });

  const orgClient = await prisma.organization.upsert({
    where: { id: 'org_client' },
    update: {},
    create: {
      id: 'org_client',
      name: 'Client Organization',
      slug: 'client-org',
      email: 'contact@clientorg.com',
      country: 'Malaysia',
      timezone: 'Asia/Kuala_Lumpur',
      currency: 'MYR',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      planId: basicPlan.id,
    },
  });

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@daritana.com' },
    update: {},
    create: {
      email: 'admin@daritana.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&face',
    },
  });

  const leadUser = await prisma.user.upsert({
    where: { email: 'lead@daritana.com' },
    update: {},
    create: {
      email: 'lead@daritana.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&face',
    },
  });

  const designerUser = await prisma.user.upsert({
    where: { email: 'designer@daritana.com' },
    update: {},
    create: {
      email: 'designer@daritana.com',
      password: hashedPassword,
      firstName: 'Maria',
      lastName: 'Santos',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&face',
    },
  });

  const contractorUser = await prisma.user.upsert({
    where: { email: 'contractor@daritana.com' },
    update: {},
    create: {
      email: 'contractor@daritana.com',
      password: hashedPassword,
      firstName: 'Kumar',
      lastName: 'Patel',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&face',
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: 'client@daritana.com' },
    update: {},
    create: {
      email: 'client@daritana.com',
      password: hashedPassword,
      firstName: 'Ahmad',
      lastName: 'Razak',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&face',
    },
  });

  // Create organization memberships
  await prisma.organizationMember.create({
    data: {
      organizationId: orgDaritana.id,
      userId: adminUser.id,
      role: 'ORG_ADMIN',
      permissions: ['all'],
    },
  });

  await prisma.organizationMember.create({
    data: {
      organizationId: orgDaritana.id,
      userId: leadUser.id,
      role: 'PROJECT_LEAD',
      permissions: ['project:manage', 'task:manage', 'team:view'],
    },
  });

  await prisma.organizationMember.create({
    data: {
      organizationId: orgDaritana.id,
      userId: designerUser.id,
      role: 'DESIGNER',
      permissions: ['project:view', 'task:edit', 'document:upload'],
    },
  });

  await prisma.organizationMember.create({
    data: {
      organizationId: orgDaritana.id,
      userId: contractorUser.id,
      role: 'CONTRACTOR',
      permissions: ['project:view', 'task:view'],
    },
  });

  await prisma.organizationMember.create({
    data: {
      organizationId: orgClient.id,
      userId: clientUser.id,
      role: 'CLIENT',
      permissions: ['project:view'],
    },
  });

  // Create sample projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Modern Condominium Renovation',
      description: 'Complete renovation of a 3-bedroom unit in KLCC',
      type: 'renovation',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      progress: 65,
      estimatedBudget: 150000,
      actualCost: 98000,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-06-30'),
      siteAddress: '188 Jalan Ampang',
      siteCity: 'Kuala Lumpur',
      siteState: 'Kuala Lumpur',
      siteCountry: 'Malaysia',
      organizationId: orgDaritana.id,
      managerId: leadUser.id,
      clientId: clientUser.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Boutique Hotel Design',
      description: 'New boutique hotel in George Town heritage area',
      type: 'commercial',
      status: 'PLANNING',
      priority: 'MEDIUM',
      progress: 25,
      estimatedBudget: 500000,
      actualCost: 50000,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-12-31'),
      siteAddress: '23 Lebuh Armenian',
      siteCity: 'George Town',
      siteState: 'Penang',
      siteCountry: 'Malaysia',
      organizationId: orgDaritana.id,
      managerId: leadUser.id,
      clientId: clientUser.id,
    },
  });

  // Create sample tasks
  await prisma.task.create({
    data: {
      title: 'Complete floor plan revisions',
      description: 'Update floor plans based on client feedback',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project1.id,
      assignedToId: designerUser.id,
      createdById: leadUser.id,
      organizationId: orgDaritana.id,
      dueDate: new Date('2024-02-15'),
    },
  });

  await prisma.task.create({
    data: {
      title: 'Material selection for kitchen',
      description: 'Select and approve kitchen materials and finishes',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: project1.id,
      assignedToId: designerUser.id,
      createdById: leadUser.id,
      organizationId: orgDaritana.id,
      dueDate: new Date('2024-02-20'),
    },
  });

  await prisma.task.create({
    data: {
      title: 'Site survey and measurements',
      description: 'Conduct detailed site survey for hotel project',
      status: 'TODO',
      priority: 'HIGH',
      projectId: project2.id,
      assignedToId: leadUser.id,
      createdById: leadUser.id,
      organizationId: orgDaritana.id,
      dueDate: new Date('2024-03-10'),
    },
  });

  // Create community posts
  const post1 = await prisma.communityPost.create({
    data: {
      organizationId: orgDaritana.id,
      authorId: leadUser.id,
      title: 'Best Practices for Sustainable Architecture in Malaysia',
      content: 'In this post, I want to share some insights on sustainable architecture practices that work particularly well in Malaysian climate...',
      excerpt: 'Exploring sustainable architecture practices for tropical climates',
      type: 'ARTICLE',
      category: 'Sustainability',
      tags: ['sustainable', 'architecture', 'malaysia', 'green-building'],
      status: 'PUBLISHED',
      isFeatured: true,
      viewCount: 145,
      likeCount: 23,
      commentCount: 8,
      shareCount: 5
    }
  });

  // Create community groups
  const group1 = await prisma.communityGroup.create({
    data: {
      organizationId: orgDaritana.id,
      name: 'Malaysian Architects Network',
      slug: 'malaysian-architects',
      description: 'A community for architects practicing in Malaysia',
      type: 'PUBLIC',
      category: 'Professional',
      tags: ['architecture', 'malaysia', 'networking'],
      ownerId: leadUser.id,
      memberCount: 2,
      isVerified: true
    }
  });

  // Add members to group
  await prisma.communityGroupMember.createMany({
    data: [
      { groupId: group1.id, userId: leadUser.id, role: 'OWNER' },
      { groupId: group1.id, userId: designerUser.id, role: 'MEMBER' }
    ]
  });

  // Create courses
  const course1 = await prisma.course.create({
    data: {
      organizationId: orgDaritana.id,
      title: 'Introduction to BIM for Architects',
      slug: 'intro-bim-architects',
      description: 'Learn the fundamentals of Building Information Modeling',
      category: 'Technical',
      level: 'BEGINNER',
      duration: 480,
      language: 'en',
      tags: ['bim', 'architecture', 'software'],
      instructorId: leadUser.id,
      price: 299,
      currency: 'MYR',
      prerequisites: ['Basic CAD knowledge'],
      objectives: ['Understand BIM concepts', 'Create 3D models'],
      targetAudience: ['Architects', 'Designers'],
      status: 'PUBLISHED',
      publishedAt: new Date(),
      enrollmentCount: 0
    }
  });

  // Create course module
  const module1 = await prisma.courseModule.create({
    data: {
      courseId: course1.id,
      title: 'Module 1: BIM Fundamentals',
      description: 'Introduction to BIM concepts',
      sortOrder: 1,
      duration: 120
    }
  });

  // Create lessons
  await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: 'What is BIM?',
      description: 'Understanding Building Information Modeling',
      type: 'VIDEO',
      videoUrl: 'https://example.com/videos/bim-intro.mp4',
      sortOrder: 1,
      duration: 15,
      isPreview: true,
      isMandatory: true
    }
  });

  // Create risk assessments
  await prisma.riskAssessment.create({
    data: {
      projectId: project1.id,
      title: 'Material Delivery Delays',
      description: 'Risk of delays in material delivery',
      category: 'Schedule',
      probability: 0.4,
      impact: 3,
      riskScore: 1.2,
      mitigationPlan: 'Maintain buffer stock',
      owner: 'Procurement Team',
      status: 'IDENTIFIED'
    }
  });

  // Create WBS nodes
  const wbs1 = await prisma.wBSNode.create({
    data: {
      projectId: project1.id,
      code: '1',
      name: 'Renovation Project',
      description: 'Main project deliverable',
      level: 0,
      sortOrder: 1,
      nodeType: 'PHASE',
      estimatedHours: 2000,
      estimatedCost: 150000,
      responsibleId: leadUser.id
    }
  });

  await prisma.wBSNode.create({
    data: {
      projectId: project1.id,
      code: '1.1',
      name: 'Design Phase',
      description: 'Complete design work',
      parentId: wbs1.id,
      level: 1,
      sortOrder: 1,
      nodeType: 'DELIVERABLE',
      estimatedHours: 400,
      estimatedCost: 30000,
      responsibleId: designerUser.id,
      progressPercent: 75
    }
  });

  // Create resource allocations
  await prisma.resourceAllocation.create({
    data: {
      projectId: project1.id,
      resourceType: 'Human',
      resourceId: designerUser.id,
      resourceName: 'Maria Santos - Designer',
      allocatedUnits: 40,
      allocatedCost: 8000,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-15'),
      utilizationRate: 1.0
    }
  });

  // Create a community challenge
  await prisma.communityChallenge.create({
    data: {
      organizationId: orgDaritana.id,
      title: 'Sustainable Office Design Challenge',
      description: 'Design an eco-friendly office space',
      type: 'DESIGN',
      difficulty: 'INTERMEDIATE',
      category: 'Sustainability',
      tags: ['sustainable', 'office', 'competition'],
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-04-30'),
      status: 'UPCOMING',
      createdById: leadUser.id
    }
  });

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Test credentials:');
  console.log('================');
  console.log('Email: admin@daritana.com | Password: password123 | Role: Admin');
  console.log('Email: lead@daritana.com | Password: password123 | Role: Project Lead');
  console.log('Email: designer@daritana.com | Password: password123 | Role: Designer');
  console.log('Email: contractor@daritana.com | Password: password123 | Role: Contractor');
  console.log('Email: client@daritana.com | Password: password123 | Role: Client');
  console.log('');
  console.log('✅ Created community posts, groups, and challenges');
  console.log('✅ Created courses with modules and lessons');
  console.log('✅ Created risk assessments and WBS structure');
  console.log('✅ Created resource allocations');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });