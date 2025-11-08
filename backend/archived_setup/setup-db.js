// Setup script to create initial organization and memberships
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('Setting up database with initial data...');

    // 1. Create or get basic subscription plan
    console.log('1. Creating subscription plan...');
    let basicPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'Basic' }
    });

    if (!basicPlan) {
      basicPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Basic',
          displayName: 'Basic Plan',
          description: 'Basic plan for getting started',
          monthlyPrice: 0,
          yearlyPrice: 0,
          currency: 'MYR',
          tier: 'BASIC',
          billingCycle: 'MONTHLY',
          price: 0,
          features: ['10 Projects', '5 Users', 'Basic Support', '5GB Storage'],
          maxProjects: 10,
          maxUsers: 5,
          maxStorage: 5120, // 5GB in MB
          maxFiles: 100,
          isActive: true,
          isPublic: true,
          sortOrder: 0
        }
      });
      console.log('✅ Basic plan created');
    } else {
      console.log('✅ Basic plan already exists');
    }

    // 2. Create or get admin user
    console.log('\n2. Creating admin user...');
    let adminUser = await prisma.user.findFirst({
      where: { email: 'admin@test.com' }
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@test.com',
          username: 'admin',
          password: hashedPassword,
          firstName: 'System',
          lastName: 'Admin',
          name: 'System Admin',
          role: 'ADMIN',
          isActive: true,
          emailVerified: true
        }
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }

    // 3. Create default organization
    console.log('\n3. Creating default organization...');
    let defaultOrg = await prisma.organization.findFirst({
      where: { slug: 'default-org' }
    });

    if (!defaultOrg) {
      defaultOrg = await prisma.organization.create({
        data: {
          name: 'Daritana Test Organization',
          slug: 'default-org',
          email: 'contact@daritana.com',
          phone: '+60123456789',
          website: 'https://daritana.com',
          
          // Address
          address: '123 Test Street',
          city: 'Kuala Lumpur',
          state: 'Wilayah Persekutuan',
          postcode: '50000',
          country: 'Malaysia',
          
          // Business details
          businessType: 'Architecture Firm',
          registrationNo: 'TEST-123456',
          establishedYear: 2024,
          employeeCount: 10,
          
          // Subscription
          planId: basicPlan.id,
          
          // Settings
          timezone: 'Asia/Kuala_Lumpur',
          currency: 'MYR',
          language: 'en',
          
          // Features & Limits
          maxUsers: 5,
          maxProjects: 10,
          maxStorage: 5120,
          
          // Status
          status: 'ACTIVE',
          isTrialActive: false
        }
      });
      console.log('✅ Default organization created');
    } else {
      console.log('✅ Default organization already exists');
    }

    // 4. Create organization membership for admin
    console.log('\n4. Creating organization membership...');
    const existingMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: adminUser.id,
        organizationId: defaultOrg.id
      }
    });

    if (!existingMembership) {
      await prisma.organizationMember.create({
        data: {
          userId: adminUser.id,
          organizationId: defaultOrg.id,
          role: 'ORG_ADMIN',
          isActive: true,
          permissions: ['all']
        }
      });
      console.log('✅ Admin added as organization owner');
    } else {
      console.log('✅ Admin membership already exists');
    }

    // 5. Create some sample users
    console.log('\n5. Creating sample users...');
    const sampleUsers = [
      {
        email: 'designer@test.com',
        username: 'designer',
        firstName: 'John',
        lastName: 'Designer',
        role: 'USER',
        orgRole: 'DESIGNER'
      },
      {
        email: 'client@test.com',
        username: 'client',
        firstName: 'Jane',
        lastName: 'Client',
        role: 'USER',
        orgRole: 'CLIENT'
      },
      {
        email: 'contractor@test.com',
        username: 'contractor',
        firstName: 'Bob',
        lastName: 'Builder',
        role: 'USER',
        orgRole: 'CONTRACTOR'
      }
    ];

    for (const userData of sampleUsers) {
      let user = await prisma.user.findFirst({
        where: { email: userData.email }
      });

      if (!user) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        user = await prisma.user.create({
          data: {
            email: userData.email,
            username: userData.username,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            name: `${userData.firstName} ${userData.lastName}`,
            role: userData.role,
            isActive: true,
            emailVerified: true
          }
        });

        // Add to organization
        await prisma.organizationMember.create({
          data: {
            userId: user.id,
            organizationId: defaultOrg.id,
            role: userData.orgRole,
            isActive: true
          }
        });

        console.log(`✅ Created user: ${userData.email}`);
      } else {
        console.log(`✅ User already exists: ${userData.email}`);
      }
    }

    console.log('\n✨ Database setup complete!');
    console.log('\n📧 Login credentials:');
    console.log('  Admin: admin@test.com / password123');
    console.log('  Designer: designer@test.com / password123');
    console.log('  Client: client@test.com / password123');
    console.log('  Contractor: contractor@test.com / password123');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();