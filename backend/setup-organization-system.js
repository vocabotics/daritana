const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupOrganizationSystem() {
  try {
    console.log('🔧 Setting up organization system...');

    // 1. Create subscription plan if it doesn't exist
    let plan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'Basic Plan' }
    });

    if (!plan) {
      plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Basic Plan',
          displayName: 'Basic Plan',
          description: 'Basic subscription for small teams',
          price: 0,
          currency: 'MYR',
          billingCycle: 'MONTHLY',
          maxUsers: 10,
          maxProjects: 20,
          maxStorage: 10240, // 10GB
          features: ['basic_projects', 'basic_documents', 'team_collaboration']
        }
      });
      console.log('✅ Created Basic Plan');
    }

    // 2. Create test organization
    let organization = await prisma.organization.findFirst({
      where: { name: 'Test Organization' }
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
          email: 'admin@test.com',
          planId: plan.id,
          country: 'Malaysia',
          maxUsers: 10,
          maxProjects: 20,
          maxStorage: 10240
        }
      });
      console.log('✅ Created Test Organization');
    }

    // 3. Create or get test user
    let user = await prisma.user.findFirst({
      where: { email: 'admin@test.com' }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'admin@test.com',
          password: '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A', // password123
          firstName: 'Admin',
          lastName: 'User',
          name: 'Admin User',
          role: 'USER',
          isActive: true,
          emailVerified: true
        }
      });
      console.log('✅ Created test user');
    }

    // 4. Create organization membership
    const existingMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId: organization.id
      }
    });

    if (!existingMembership) {
      await prisma.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'ORG_ADMIN',
          permissions: ['*'],
          isActive: true
        }
      });
      console.log('✅ Added user to organization as admin');
    } else {
      console.log('✅ User already has organization membership');
    }

    // 5. Create sample project
    const existingProject = await prisma.project.findFirst({
      where: { name: 'Sample Project' }
    });

    if (!existingProject) {
      await prisma.project.create({
        data: {
          name: 'Sample Project',
          description: 'A sample project for testing',
          status: 'PLANNING',
          organizationId: organization.id,
          clientId: user.id, // Using the user as client for simplicity
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      });
      console.log('✅ Created sample project');
    }

    console.log('🎉 Organization system setup complete!');
    console.log(`📧 Test User: ${user.email}`);
    console.log(`🏢 Organization: ${organization.name}`);
    console.log(`🔑 Password: password123`);

  } catch (error) {
    console.error('❌ Error setting up organization system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupOrganizationSystem();
