const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedTestUser() {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@daritana.com' }
    })
    
    if (existingUser) {
      // Update password
      await prisma.user.update({
        where: { email: 'admin@daritana.com' },
        data: {
          password: await bcrypt.hash('admin123', 10)
        }
      })
      console.log('✅ Updated existing admin user password')
    } else {
      // Create new user
      const user = await prisma.user.create({
        data: {
          email: 'admin@daritana.com',
          password: await bcrypt.hash('admin123', 10),
          name: 'Admin User',
          role: 'ADMIN'
        }
      })
      console.log('✅ Created admin user:', user.email)
    }
    
    // Also create a test organization if needed
    const org = await prisma.organization.findFirst()
    if (!org) {
      const newOrg = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
          subscriptionTier: 'PROFESSIONAL'
        }
      })
      
      // Add admin to organization
      const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@daritana.com' }
      })
      
      await prisma.organizationMember.create({
        data: {
          organizationId: newOrg.id,
          userId: adminUser.id,
          role: 'ADMIN',
          permissions: ['ALL']
        }
      })
      
      console.log('✅ Created test organization and added admin')
    }
    
  } catch (error) {
    console.error('Error seeding test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTestUser()