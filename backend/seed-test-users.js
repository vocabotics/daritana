const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function seedTestUsers() {
  try {
    console.log('🌱 Seeding test users...')
    
    // Create subscription plan first
    const plan = await prisma.subscriptionPlan.upsert({
      where: { name: 'Basic' },
      update: {},
      create: {
        name: 'Basic',
        displayName: 'Basic Plan',
        monthlyPrice: 49.99,
        yearlyPrice: 499.99,
        maxUsers: 5,
        maxProjects: 10,
        maxStorage: 5120,
        features: ['projects', 'tasks', 'documents', 'team']
      }
    })
    
    // Create a test organization
    const org = await prisma.organization.upsert({
      where: { slug: 'test-org' },
      update: {},
      create: {
        name: 'Test Architecture Firm',
        slug: 'test-org',
        email: 'info@test-org.com',
        plan: {
          connect: { id: plan.id }
        }
      }
    })
    
    console.log('✅ Organization created:', org.name)
    
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        username: 'admin',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true
      }
    })
    
    console.log('✅ Admin user created:', adminUser.email)
    
    // Add admin to organization
    await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: adminUser.id,
          organizationId: org.id
        }
      },
      update: {},
      create: {
        userId: adminUser.id,
        organizationId: org.id,
        role: 'ORG_ADMIN',
        permissions: ['*']
      }
    })
    
    console.log('✅ Admin added to organization')
    
    // Create additional test users
    const testUsers = [
      { email: 'designer@test.com', name: 'Designer User', role: 'DESIGNER' },
      { email: 'client@test.com', name: 'Client User', role: 'CLIENT' },
      { email: 'lead@test.com', name: 'Project Lead', role: 'PROJECT_LEAD' }
    ]
    
    for (const userData of testUsers) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          email: userData.email,
          username: userData.email.split('@')[0],
          password: hashedPassword,
          firstName: userData.name.split(' ')[0],
          lastName: userData.name.split(' ')[1],
          name: userData.name,
          isActive: true,
          emailVerified: true
        }
      })
      
      await prisma.organizationMember.upsert({
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
          role: userData.role,
          permissions: ['view', 'edit']
        }
      })
      
      console.log(`✅ ${userData.role} user created:`, user.email)
    }
    
    console.log('\n🎉 Test users seeded successfully!')
    console.log('\nTest credentials:')
    console.log('  Email: admin@test.com')
    console.log('  Password: password123')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTestUsers()