// Create project lead test user
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createProjectLead() {
  try {
    console.log('Creating project lead user...');

    // Get default organization
    const defaultOrg = await prisma.organization.findFirst({
      where: { slug: 'default-org' }
    });

    if (!defaultOrg) {
      console.error('Default organization not found. Run setup-db.js first.');
      return;
    }

    // Check if project lead exists
    let projectLead = await prisma.user.findFirst({
      where: { email: 'lead@test.com' }
    });

    if (!projectLead) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      projectLead = await prisma.user.create({
        data: {
          email: 'lead@test.com',
          username: 'projectlead',
          password: hashedPassword,
          firstName: 'David',
          lastName: 'Lead',
          name: 'David Lead',
          role: 'USER',
          position: 'Project Manager',
          department: 'Project Management',
          isActive: true,
          emailVerified: true
        }
      });

      // Add to organization with PROJECT_MANAGER role
      await prisma.organizationMember.create({
        data: {
          userId: projectLead.id,
          organizationId: defaultOrg.id,
          role: 'PROJECT_MANAGER',
          isActive: true,
          permissions: [
            'manage_projects',
            'manage_tasks',
            'manage_team',
            'view_financials',
            'approve_tasks',
            'generate_reports'
          ]
        }
      });

      console.log('✅ Project Lead created successfully!');
      console.log('📧 Login: lead@test.com / password123');
    } else {
      console.log('✅ Project Lead already exists');
      console.log('📧 Login: lead@test.com / password123');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProjectLead();