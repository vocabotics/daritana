import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedOrganizationSystem() {
  console.log('🌱 Seeding organization system...');

  try {
    // 1. Create Feature Groups
    console.log('Creating feature groups...');
    
    const coreFeatures = await prisma.featureGroup.upsert({
      where: { name: 'core' },
      update: {},
      create: {
        name: 'core',
        displayName: 'Core Features',
        description: 'Essential features for project management',
        category: 'core',
        sortOrder: 1,
      }
    });

    const premiumFeatures = await prisma.featureGroup.upsert({
      where: { name: 'premium' },
      update: {},
      create: {
        name: 'premium',
        displayName: 'Premium Features',
        description: 'Advanced features for growing teams',
        category: 'premium',
        sortOrder: 2,
      }
    });

    const enterpriseFeatures = await prisma.featureGroup.upsert({
      where: { name: 'enterprise' },
      update: {},
      create: {
        name: 'enterprise',
        displayName: 'Enterprise Features',
        description: 'Enterprise-grade features for large organizations',
        category: 'enterprise',
        sortOrder: 3,
      }
    });

    // 2. Create Features
    console.log('Creating features...');
    
    const features = [
      // Core Features
      {
        groupId: coreFeatures.id,
        name: 'project_management',
        displayName: 'Project Management',
        description: 'Create and manage projects',
        requiredPlan: 'basic',
        hasLimit: true,
        defaultLimit: 5,
      },
      {
        groupId: coreFeatures.id,
        name: 'task_management',
        displayName: 'Task Management',
        description: 'Create and assign tasks',
        requiredPlan: 'basic',
      },
      {
        groupId: coreFeatures.id,
        name: 'document_storage',
        displayName: 'Document Storage',
        description: 'Upload and manage documents',
        requiredPlan: 'basic',
        hasLimit: true,
        defaultLimit: 1024, // MB
      },
      {
        groupId: coreFeatures.id,
        name: 'basic_reporting',
        displayName: 'Basic Reporting',
        description: 'Generate basic project reports',
        requiredPlan: 'basic',
      },
      
      // Premium Features
      {
        groupId: premiumFeatures.id,
        name: 'advanced_reporting',
        displayName: 'Advanced Reporting',
        description: 'Comprehensive analytics and custom reports',
        requiredPlan: 'professional',
      },
      {
        groupId: premiumFeatures.id,
        name: 'time_tracking',
        displayName: 'Time Tracking',
        description: 'Track time spent on projects and tasks',
        requiredPlan: 'professional',
      },
      {
        groupId: premiumFeatures.id,
        name: 'custom_fields',
        displayName: 'Custom Fields',
        description: 'Add custom fields to projects and tasks',
        requiredPlan: 'professional',
      },
      {
        groupId: premiumFeatures.id,
        name: 'integrations',
        displayName: 'Third-party Integrations',
        description: 'Connect with external tools and services',
        requiredPlan: 'professional',
      },
      
      // Enterprise Features
      {
        groupId: enterpriseFeatures.id,
        name: 'sso',
        displayName: 'Single Sign-On',
        description: 'Enterprise SSO integration',
        requiredPlan: 'enterprise',
      },
      {
        groupId: enterpriseFeatures.id,
        name: 'advanced_permissions',
        displayName: 'Advanced Permissions',
        description: 'Granular role and permission management',
        requiredPlan: 'enterprise',
      },
      {
        groupId: enterpriseFeatures.id,
        name: 'audit_logs',
        displayName: 'Audit Logs',
        description: 'Comprehensive activity logging',
        requiredPlan: 'enterprise',
      },
      {
        groupId: enterpriseFeatures.id,
        name: 'api_access',
        displayName: 'API Access',
        description: 'REST API for custom integrations',
        requiredPlan: 'enterprise',
      },
    ];

    for (const feature of features) {
      await prisma.feature.upsert({
        where: { name: feature.name },
        update: {},
        create: feature
      });
    }

    // 3. Create Permissions
    console.log('Creating permissions...');
    
    const permissions = [
      // Organization permissions
      { resource: 'organization', action: 'manage', scope: 'ORGANIZATION' },
      { resource: 'organization', action: 'read', scope: 'ORGANIZATION' },
      
      // User permissions
      { resource: 'users', action: 'manage', scope: 'ORGANIZATION' },
      { resource: 'users', action: 'invite', scope: 'ORGANIZATION' },
      { resource: 'users', action: 'read', scope: 'ORGANIZATION' },
      
      // Project permissions
      { resource: 'projects', action: 'manage', scope: 'ORGANIZATION' },
      { resource: 'projects', action: 'create', scope: 'ORGANIZATION' },
      { resource: 'projects', action: 'update', scope: 'ORGANIZATION' },
      { resource: 'projects', action: 'read', scope: 'ORGANIZATION' },
      { resource: 'projects', action: 'delete', scope: 'ORGANIZATION' },
      
      // Task permissions
      { resource: 'tasks', action: 'manage', scope: 'ORGANIZATION' },
      { resource: 'tasks', action: 'create', scope: 'ORGANIZATION' },
      { resource: 'tasks', action: 'update', scope: 'ORGANIZATION' },
      { resource: 'tasks', action: 'read', scope: 'ORGANIZATION' },
      { resource: 'tasks', action: 'delete', scope: 'ORGANIZATION' },
      
      // Document permissions
      { resource: 'documents', action: 'manage', scope: 'ORGANIZATION' },
      { resource: 'documents', action: 'upload', scope: 'ORGANIZATION' },
      { resource: 'documents', action: 'read', scope: 'ORGANIZATION' },
      { resource: 'documents', action: 'delete', scope: 'ORGANIZATION' },
      
      // Meeting permissions
      { resource: 'meetings', action: 'manage', scope: 'ORGANIZATION' },
      { resource: 'meetings', action: 'create', scope: 'ORGANIZATION' },
      { resource: 'meetings', action: 'read', scope: 'ORGANIZATION' },
      
      // Billing permissions
      { resource: 'billing', action: 'manage', scope: 'ORGANIZATION' },
      { resource: 'billing', action: 'read', scope: 'ORGANIZATION' },
      
      // Settings permissions
      { resource: 'settings', action: 'manage', scope: 'ORGANIZATION' },
      { resource: 'settings', action: 'read', scope: 'ORGANIZATION' },
      
      // System permissions (for system admins)
      { resource: 'system', action: 'manage', scope: 'SYSTEM' },
      { resource: 'organizations', action: 'manage', scope: 'SYSTEM' },
      { resource: 'subscriptions', action: 'manage', scope: 'SYSTEM' },
      { resource: 'analytics', action: 'view', scope: 'SYSTEM' },
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: {
          resource_action_scope: {
            resource: permission.resource,
            action: permission.action,
            scope: permission.scope as any,
          }
        },
        update: {},
        create: {
          name: `${permission.resource}:${permission.action}`,
          displayName: `${permission.action.charAt(0).toUpperCase() + permission.action.slice(1)} ${permission.resource}`,
          resource: permission.resource,
          action: permission.action,
          scope: permission.scope as any,
        }
      });
    }

    // 4. Create Subscription Plans
    console.log('Creating subscription plans...');
    
    const basicPlan = await prisma.subscriptionPlan.upsert({
      where: { name: 'basic' },
      update: {},
      create: {
        name: 'basic',
        displayName: 'Basic Plan',
        description: 'Perfect for small teams getting started',
        monthlyPrice: 49.99,
        yearlyPrice: 499.99,
        maxUsers: 5,
        maxProjects: 10,
        maxStorage: 5120, // 5GB
        maxFiles: 500,
        features: [
          'project_management',
          'task_management', 
          'document_storage',
          'basic_reporting'
        ],
        isActive: true,
        isPublic: true,
        sortOrder: 1,
      }
    });

    const professionalPlan = await prisma.subscriptionPlan.upsert({
      where: { name: 'professional' },
      update: {},
      create: {
        name: 'professional',
        displayName: 'Professional Plan',
        description: 'Advanced features for growing teams',
        monthlyPrice: 99.99,
        yearlyPrice: 999.99,
        maxUsers: 25,
        maxProjects: 50,
        maxStorage: 20480, // 20GB
        maxFiles: 2000,
        features: [
          'project_management',
          'task_management',
          'document_storage',
          'basic_reporting',
          'advanced_reporting',
          'time_tracking',
          'custom_fields',
          'integrations'
        ],
        isActive: true,
        isPublic: true,
        sortOrder: 2,
      }
    });

    const enterprisePlan = await prisma.subscriptionPlan.upsert({
      where: { name: 'enterprise' },
      update: {},
      create: {
        name: 'enterprise',
        displayName: 'Enterprise Plan',
        description: 'Everything you need for large organizations',
        monthlyPrice: 299.99,
        yearlyPrice: 2999.99,
        maxUsers: 100,
        maxProjects: 200,
        maxStorage: 102400, // 100GB
        maxFiles: 10000,
        features: [
          'project_management',
          'task_management',
          'document_storage',
          'basic_reporting',
          'advanced_reporting',
          'time_tracking',
          'custom_fields',
          'integrations',
          'sso',
          'advanced_permissions',
          'audit_logs',
          'api_access'
        ],
        isActive: true,
        isPublic: true,
        sortOrder: 3,
      }
    });

    // 5. Create Super Admin User
    console.log('Creating super admin user...');
    
    const superAdminEmail = 'admin@daritana.com';
    const superAdminPassword = 'DaritanaAdmin2024!';
    
    let superAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail }
    });

    if (!superAdmin) {
      const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
      superAdmin = await prisma.user.create({
        data: {
          email: superAdminEmail,
          firstName: 'Super',
          lastName: 'Admin',
          password: hashedPassword,
          emailVerified: true,
          isActive: true,
        }
      });
    }

    // Create system admin record
    await prisma.systemAdmin.upsert({
      where: { userId: superAdmin.id },
      update: {},
      create: {
        userId: superAdmin.id,
        role: 'SUPER_ADMIN',
        permissions: ['*'], // All permissions
      }
    });

    // 6. Create Demo Organization
    console.log('Creating demo organization...');
    
    const demoOrgEmail = 'demo@example.com';
    const demoPassword = 'DemoUser123!';
    
    let demoUser = await prisma.user.findUnique({
      where: { email: demoOrgEmail }
    });

    if (!demoUser) {
      const hashedPassword = await bcrypt.hash(demoPassword, 12);
      demoUser = await prisma.user.create({
        data: {
          email: demoOrgEmail,
          firstName: 'Demo',
          lastName: 'User',
          password: hashedPassword,
          emailVerified: true,
        }
      });
    }

    const demoOrg = await prisma.organization.upsert({
      where: { slug: 'demo-architecture' },
      update: {},
      create: {
        name: 'Demo Architecture Firm',
        slug: 'demo-architecture',
        email: demoOrgEmail,
        businessType: 'Architecture Firm',
        country: 'Malaysia',
        planId: professionalPlan.id,
        maxUsers: professionalPlan.maxUsers,
        maxProjects: professionalPlan.maxProjects,
        maxStorage: professionalPlan.maxStorage,
        status: 'ACTIVE',
        isTrialActive: false,
      }
    });

    // Create demo user organization membership
    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: demoUser.id,
          organizationId: demoOrg.id,
        }
      },
      update: {},
      create: {
        userId: demoUser.id,
        organizationId: demoOrg.id,
        role: 'ORG_ADMIN',
        permissions: [
          'organization:manage',
          'users:manage',
          'projects:manage',
          'billing:manage',
          'settings:manage'
        ]
      }
    });

    // Create demo subscription
    await prisma.subscription.upsert({
      where: { organizationId: demoOrg.id },
      update: {},
      create: {
        organizationId: demoOrg.id,
        planId: professionalPlan.id,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        userCount: 1,
        projectCount: 0,
        storageUsed: 0,
      }
    });

    console.log('✅ Organization system seeded successfully!');
    console.log('\n📋 Accounts created:');
    console.log(`   Super Admin: ${superAdminEmail} / ${superAdminPassword}`);
    console.log(`   Demo User: ${demoOrgEmail} / ${demoPassword}`);
    console.log('\n📦 Subscription Plans:');
    console.log(`   Basic: RM ${basicPlan.monthlyPrice}/month`);
    console.log(`   Professional: RM ${professionalPlan.monthlyPrice}/month`);
    console.log(`   Enterprise: RM ${enterprisePlan.monthlyPrice}/month`);

  } catch (error) {
    console.error('❌ Error seeding organization system:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedOrganizationSystem()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedOrganizationSystem;