import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedSimpleData() {
  console.log('🌱 Starting simple data seeding...')

  try {
    // Create demo users with hashed passwords
    const hashedPassword = await bcrypt.hash('Demo@2024', 10)

    console.log('Creating demo users...')
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'admin@architech.my' },
        update: {},
        create: {
          email: 'admin@architech.my',
          password: hashedPassword,
          firstName: 'Ahmad',
          lastName: 'Ibrahim',
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          bio: 'Founder and Principal Architect'
        }
      }),
      prisma.user.upsert({
        where: { email: 'lead@architech.my' },
        update: {},
        create: {
          email: 'lead@architech.my',
          password: hashedPassword,
          firstName: 'Sarah',
          lastName: 'Abdullah',
          role: 'PROJECT_LEAD',
          status: 'ACTIVE',
          emailVerified: true,
          bio: 'Senior Architect and Project Manager'
        }
      }),
      prisma.user.upsert({
        where: { email: 'designer@architech.my' },
        update: {},
        create: {
          email: 'designer@architech.my',
          password: hashedPassword,
          firstName: 'Raj',
          lastName: 'Kumar',
          role: 'DESIGNER',
          status: 'ACTIVE',
          emailVerified: true,
          bio: 'Interior Designer and 3D Specialist'
        }
      }),
      prisma.user.upsert({
        where: { email: 'client@example.my' },
        update: {},
        create: {
          email: 'client@example.my',
          password: hashedPassword,
          firstName: 'David',
          lastName: 'Tan',
          role: 'CLIENT',
          status: 'ACTIVE',
          emailVerified: true,
          bio: 'Property Developer'
        }
      })
    ])

    console.log('✅ Users created successfully!')

    // Create demo projects
    console.log('Creating demo projects...')
    const [admin, lead, designer, client] = users

    const projects = await Promise.all([
      prisma.project.upsert({
        where: { 
          name_organizationId: {
            name: 'KLCC Luxury Condominium',
            organizationId: 'demo-org'
          }
        },
        update: {},
        create: {
          organizationId: 'demo-org',
          name: 'KLCC Luxury Condominium',
          description: 'High-end residential development with panoramic city views',
          type: 'RESIDENTIAL',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          address: 'Jalan Ampang, KLCC',
          city: 'Kuala Lumpur',
          state: 'Wilayah Persekutuan',
          postalCode: '50450',
          country: 'Malaysia',
          clientId: client.id,
          projectLeadId: lead.id,
          designerId: designer.id,
          progress: 35
        }
      }),
      prisma.project.upsert({
        where: { 
          name_organizationId: {
            name: 'George Town Heritage Shophouse',
            organizationId: 'demo-org'
          }
        },
        update: {},
        create: {
          organizationId: 'demo-org',
          name: 'George Town Heritage Shophouse',
          description: 'Restoration and conversion of UNESCO heritage shophouse',
          type: 'RENOVATION',
          status: 'PLANNING',
          priority: 'MEDIUM',
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-09-30'),
          address: 'Armenian Street',
          city: 'George Town',
          state: 'Penang',
          postalCode: '10200',
          country: 'Malaysia',
          clientId: client.id,
          projectLeadId: lead.id,
          designerId: designer.id,
          progress: 15
        }
      }),
      prisma.project.upsert({
        where: { 
          name_organizationId: {
            name: 'Cyberjaya Tech Hub',
            organizationId: 'demo-org'
          }
        },
        update: {},
        create: {
          organizationId: 'demo-org',
          name: 'Cyberjaya Tech Hub',
          description: 'Modern office complex for technology companies',
          type: 'COMMERCIAL',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          startDate: new Date('2023-06-01'),
          endDate: new Date('2025-06-30'),
          address: 'Persiaran Multimedia',
          city: 'Cyberjaya',
          state: 'Selangor',
          postalCode: '63000',
          country: 'Malaysia',
          clientId: client.id,
          projectLeadId: admin.id,
          designerId: designer.id,
          progress: 60
        }
      })
    ])

    console.log('✅ Projects created successfully!')

    // Create sample tasks
    console.log('Creating sample tasks...')
    for (const project of projects) {
      const tasks = [
        {
          title: 'Initial site survey',
          description: 'Complete site survey and measurements',
          status: 'DONE' as const,
          priority: 'HIGH' as const
        },
        {
          title: 'Concept design',
          description: 'Develop initial concepts',
          status: 'IN_PROGRESS' as const,
          priority: 'HIGH' as const
        },
        {
          title: 'Client presentation',
          description: 'Prepare presentation materials',
          status: 'TODO' as const,
          priority: 'MEDIUM' as const
        }
      ]

      for (const [index, taskData] of tasks.entries()) {
        await prisma.task.create({
          data: {
            ...taskData,
            projectId: project.id,
            organizationId: 'demo-org',
            assigneeId: index % 2 === 0 ? designer.id : lead.id,
            dueDate: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000),
            order: index
          }
        })
      }
    }

    console.log('✅ Tasks created successfully!')
    console.log('\n📧 Demo Login Credentials:')
    console.log('Admin: admin@architech.my / Demo@2024')
    console.log('Project Lead: lead@architech.my / Demo@2024')
    console.log('Designer: designer@architech.my / Demo@2024')
    console.log('Client: client@example.my / Demo@2024')

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
if (require.main === module) {
  seedSimpleData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default seedSimpleData