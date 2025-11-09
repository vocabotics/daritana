/**
 * Seed test data for API testing
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test data...');

  // Create test organization
  const org = await prisma.organization.upsert({
    where: { id: 'org_test' },
    update: {},
    create: {
      id: 'org_test',
      name: 'Test Organization',
      slug: 'test-org',
      email: 'admin@test.com',
      status: 'ACTIVE',
      planId: 'plan_basic',
      maxUsers: 100,
      maxProjects: 100,
      maxStorage: 10000
    }
  });

  console.log('✅ Organization created:', org.name);

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {
      password: hashedPassword
    },
    create: {
      email: 'admin@test.com',
      username: 'admin',
      password: hashedPassword,
      name: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      emailVerified: true,
      role: 'ADMIN'
    }
  });

  console.log('✅ User created:', user.email);

  // Create organization membership
  const membership = await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: org.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      organizationId: org.id,
      role: 'ORG_ADMIN',
      isActive: true
    }
  });

  console.log('✅ Organization membership created');

  // Create test project
  try {
    const project = await prisma.project.upsert({
      where: { id: 'test-project-1' },
      update: {},
      create: {
        id: 'test-project-1',
        name: 'Test Project',
        code: 'TEST001',
        description: 'Test project for API testing',
        organization: {
          connect: { id: org.id }
        },
        createdBy: {
          connect: { id: user.id }
        },
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      }
    });

    console.log('✅ Project created:', project.name);

    // Create test tasks
    const taskStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    for (let i = 1; i <= 5; i++) {
      await prisma.task.create({
        data: {
          title: `Test Task ${i}`,
          description: `Description for test task ${i}`,
          status: taskStatuses[i % 4],
          priority: taskPriorities[i % 4],
          project: {
            connect: { id: project.id }
          },
          assignedTo: {
            connect: { id: user.id }
          },
          createdBy: {
            connect: { id: user.id }
          },
          dueDate: new Date(Date.now() + (i * 7 * 24 * 60 * 60 * 1000)) // i weeks from now
        }
      });
    }

    console.log('✅ Tasks created: 5');
  } catch (error) {
    console.log('⚠️ Project/tasks may already exist:', error.message);
  }

  console.log('\n🎉 Test data seeded successfully!');
  console.log('\n📧 Test Credentials:');
  console.log('   Email: admin@test.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });