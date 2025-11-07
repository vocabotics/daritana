import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

// Malaysian architecture studio demo data
const DEMO_COMPANY = {
  name: 'ArchiTech Solutions Sdn Bhd',
  registrationNumber: 'SSM-202401234567',
  address: 'Level 15, Menara KL, Jalan Raja Chulan',
  city: 'Kuala Lumpur',
  state: 'Wilayah Persekutuan',
  postalCode: '50200',
  country: 'Malaysia',
  phone: '+60 3-2345 6789',
  email: 'info@architech.my'
}

async function seedBetaData() {
  console.log('🌱 Starting beta data seeding for Malaysian architecture studio...')

  try {
    // 1. Create subscription plans
    console.log('Creating subscription plans...')
    const plans = await Promise.all([
      prisma.subscriptionPlan.upsert({
        where: { name: 'Basic' },
        update: {},
        create: {
          name: 'Basic',
          description: 'Perfect for small studios and freelancers',
          price: 49.99,
          currency: 'MYR',
          billingPeriod: 'MONTHLY',
          features: [
            '5 Active Projects',
            '10 Team Members',
            '10GB Storage',
            'Basic Support',
            'Standard Templates'
          ],
          maxUsers: 10,
          maxProjects: 5,
          maxStorage: 10737418240, // 10GB
          maxFileSize: 52428800, // 50MB
          isActive: true
        }
      }),
      prisma.subscriptionPlan.upsert({
        where: { name: 'Professional' },
        update: {},
        create: {
          name: 'Professional',
          description: 'Ideal for growing architecture firms',
          price: 99.99,
          currency: 'MYR',
          billingPeriod: 'MONTHLY',
          features: [
            '20 Active Projects',
            '25 Team Members',
            '100GB Storage',
            'Priority Support',
            'Advanced Templates',
            'API Access',
            'Custom Branding'
          ],
          maxUsers: 25,
          maxProjects: 20,
          maxStorage: 107374182400, // 100GB
          maxFileSize: 209715200, // 200MB
          isActive: true
        }
      }),
      prisma.subscriptionPlan.upsert({
        where: { name: 'Enterprise' },
        update: {},
        create: {
          name: 'Enterprise',
          description: 'Complete solution for large firms',
          price: 299.99,
          currency: 'MYR',
          billingPeriod: 'MONTHLY',
          features: [
            'Unlimited Projects',
            'Unlimited Team Members',
            '1TB Storage',
            '24/7 Support',
            'All Templates',
            'Full API Access',
            'White Labeling',
            'Advanced Analytics',
            'SSO Integration'
          ],
          maxUsers: 1000,
          maxProjects: 1000,
          maxStorage: 1099511627776, // 1TB
          maxFileSize: 1073741824, // 1GB
          isActive: true
        }
      })
    ])

    // 2. Create demo organization
    console.log('Creating demo organization...')
    const organization = await prisma.organization.upsert({
      where: { registrationNumber: DEMO_COMPANY.registrationNumber },
      update: {},
      create: {
        ...DEMO_COMPANY,
        type: 'ARCHITECTURE_FIRM',
        size: 'MEDIUM',
        industry: 'Architecture & Design',
        website: 'https://www.architech.my',
        logo: '/assets/demo-logo.png',
        status: 'ACTIVE'
      }
    })

    // 3. Create subscription for organization
    console.log('Creating subscription...')
    const professionalPlan = plans.find(p => p.name === 'Professional')!
    const subscription = await prisma.subscription.upsert({
      where: { organizationId: organization.id },
      update: {},
      create: {
        organizationId: organization.id,
        planId: professionalPlan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        billingPeriod: 'MONTHLY',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14-day trial
      }
    })

    // 4. Create demo users
    console.log('Creating demo users...')
    const hashedPassword = await bcrypt.hash('Demo@2024', 10)

    const users = await Promise.all([
      // Admin/Owner
      prisma.user.upsert({
        where: { email: 'admin@architech.my' },
        update: {},
        create: {
          email: 'admin@architech.my',
          password: hashedPassword,
          firstName: 'Ahmad',
          lastName: 'Ibrahim',
          phoneNumber: '+60123456789',
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          profileImage: '/assets/avatars/admin.jpg',
          bio: 'Founder and Principal Architect at ArchiTech Solutions'
        }
      }),
      // Project Lead
      prisma.user.upsert({
        where: { email: 'lead@architech.my' },
        update: {},
        create: {
          email: 'lead@architech.my',
          password: hashedPassword,
          firstName: 'Sarah',
          lastName: 'Abdullah',
          phoneNumber: '+60123456790',
          role: 'PROJECT_LEAD',
          status: 'ACTIVE',
          emailVerified: true,
          profileImage: '/assets/avatars/lead.jpg',
          bio: 'Senior Architect and Project Manager'
        }
      }),
      // Designer
      prisma.user.upsert({
        where: { email: 'designer@architech.my' },
        update: {},
        create: {
          email: 'designer@architech.my',
          password: hashedPassword,
          firstName: 'Raj',
          lastName: 'Kumar',
          phoneNumber: '+60123456791',
          role: 'DESIGNER',
          status: 'ACTIVE',
          emailVerified: true,
          profileImage: '/assets/avatars/designer.jpg',
          bio: 'Interior Designer and 3D Visualization Specialist'
        }
      }),
      // Client
      prisma.user.upsert({
        where: { email: 'client@example.my' },
        update: {},
        create: {
          email: 'client@example.my',
          password: hashedPassword,
          firstName: 'David',
          lastName: 'Tan',
          phoneNumber: '+60123456792',
          role: 'CLIENT',
          status: 'ACTIVE',
          emailVerified: true,
          profileImage: '/assets/avatars/client.jpg',
          bio: 'Property Developer'
        }
      })
    ])

    // 5. Add users to organization
    console.log('Adding users to organization...')
    for (const user of users) {
      await prisma.organizationMember.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: organization.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          organizationId: organization.id,
          role: user.role === 'ADMIN' ? 'ORG_OWNER' : 
                user.role === 'PROJECT_LEAD' ? 'PROJECT_MANAGER' :
                user.role === 'DESIGNER' ? 'DESIGNER' : 'CLIENT',
          department: user.role === 'DESIGNER' ? 'Design' : 
                      user.role === 'PROJECT_LEAD' ? 'Management' : null,
          status: 'ACTIVE',
          joinedAt: new Date()
        }
      })
    }

    // 6. Create demo projects
    console.log('Creating demo projects...')
    const [admin, lead, designer, client] = users

    const projects = await Promise.all([
      // KLCC Luxury Condo
      prisma.project.create({
        data: {
          organizationId: organization.id,
          name: 'KLCC Luxury Condominium',
          description: 'High-end residential development with panoramic city views',
          type: 'RESIDENTIAL',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          budget: 2500000,
          currency: 'MYR',
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
          progress: 35,
          squareFootage: 3500,
          floors: 2,
          units: 1,
          culturalConsiderations: {
            prayerRoom: true,
            vastuCompliant: false,
            fengShui: true
          },
          sustainabilityFeatures: [
            'Solar panels',
            'Rainwater harvesting',
            'Energy-efficient lighting',
            'Green roof'
          ],
          complianceRequirements: [
            'UBBL compliance',
            'Fire safety certificate',
            'Green Building Index certification'
          ]
        }
      }),
      // Penang Heritage Restoration
      prisma.project.create({
        data: {
          organizationId: organization.id,
          name: 'George Town Heritage Shophouse',
          description: 'Restoration and conversion of UNESCO heritage shophouse',
          type: 'RENOVATION',
          status: 'PLANNING',
          priority: 'MEDIUM',
          budget: 800000,
          currency: 'MYR',
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
          progress: 15,
          squareFootage: 2200,
          floors: 3,
          culturalConsiderations: {
            heritagePreservation: true,
            originalFeatures: ['Timber floors', 'Air wells', 'Decorative tiles']
          },
          complianceRequirements: [
            'UNESCO heritage guidelines',
            'Penang Heritage Trust approval',
            'Conservation plan'
          ]
        }
      }),
      // Commercial Office Building
      prisma.project.create({
        data: {
          organizationId: organization.id,
          name: 'Cyberjaya Tech Hub',
          description: 'Modern office complex for technology companies',
          type: 'COMMERCIAL',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          budget: 15000000,
          currency: 'MYR',
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
          progress: 60,
          squareFootage: 50000,
          floors: 8,
          units: 40,
          sustainabilityFeatures: [
            'LEED Gold certification target',
            'Smart building systems',
            'EV charging stations',
            'Bicycle facilities'
          ],
          complianceRequirements: [
            'MSC Malaysia guidelines',
            'BOMBA approval',
            'Environmental Impact Assessment'
          ]
        }
      })
    ])

    // 7. Create sample tasks for projects
    console.log('Creating sample tasks...')
    const taskStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']
    const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

    for (const project of projects) {
      const tasks = [
        {
          title: 'Initial site survey and measurements',
          description: 'Complete detailed site survey and take accurate measurements',
          status: 'DONE',
          priority: 'HIGH',
          estimatedHours: 8
        },
        {
          title: 'Concept design development',
          description: 'Develop initial concept designs and mood boards',
          status: 'DONE',
          priority: 'HIGH',
          estimatedHours: 24
        },
        {
          title: 'Client presentation preparation',
          description: 'Prepare presentation materials for client review',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          estimatedHours: 12
        },
        {
          title: 'Structural engineering consultation',
          description: 'Coordinate with structural engineer for feasibility',
          status: 'TODO',
          priority: 'HIGH',
          estimatedHours: 4
        },
        {
          title: 'Material selection and specification',
          description: 'Select and specify all materials and finishes',
          status: 'TODO',
          priority: 'MEDIUM',
          estimatedHours: 16
        }
      ]

      for (const [index, taskData] of tasks.entries()) {
        await prisma.task.create({
          data: {
            ...taskData,
            projectId: project.id,
            organizationId: organization.id,
            creatorId: lead.id,
            assigneeId: index % 2 === 0 ? designer.id : lead.id,
            dueDate: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000),
            order: index
          }
        })
      }
    }

    // 8. Create sample meetings
    console.log('Creating sample meetings...')
    await Promise.all([
      prisma.meeting.create({
        data: {
          organizationId: organization.id,
          projectId: projects[0].id,
          title: 'Design Review Meeting',
          description: 'Review latest design iterations with client',
          startTime: new Date('2024-01-15T10:00:00'),
          endTime: new Date('2024-01-15T11:30:00'),
          location: 'Conference Room A',
          type: 'IN_PERSON',
          status: 'SCHEDULED',
          organizerId: lead.id,
          attendees: [admin.id, lead.id, designer.id, client.id]
        }
      }),
      prisma.meeting.create({
        data: {
          organizationId: organization.id,
          projectId: projects[1].id,
          title: 'Heritage Committee Presentation',
          description: 'Present restoration plans to heritage committee',
          startTime: new Date('2024-01-20T14:00:00'),
          endTime: new Date('2024-01-20T16:00:00'),
          location: 'Penang Heritage Trust Office',
          type: 'IN_PERSON',
          status: 'SCHEDULED',
          organizerId: admin.id,
          attendees: [admin.id, lead.id, designer.id]
        }
      })
    ])

    // 9. Create notification preferences
    console.log('Setting up notification preferences...')
    for (const user of users) {
      await prisma.notificationPreference.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: organization.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          organizationId: organization.id,
          emailEnabled: true,
          pushEnabled: true,
          weeklyDigest: true,
          instantNotifications: true,
          taskReminders: true,
          projectUpdates: true
        }
      })
    }

    // 10. Create sample quotations
    console.log('Creating sample quotations...')
    await prisma.quotation.create({
      data: {
        organizationId: organization.id,
        projectId: projects[0].id,
        quotationNumber: `Q-${Date.now()}`,
        clientId: client.id,
        preparedBy: admin.id,
        items: [
          {
            description: 'Architectural Design Services',
            quantity: 1,
            unitPrice: 150000,
            total: 150000
          },
          {
            description: 'Interior Design Services',
            quantity: 1,
            unitPrice: 80000,
            total: 80000
          },
          {
            description: '3D Visualization and Rendering',
            quantity: 10,
            unitPrice: 2000,
            total: 20000
          }
        ],
        subtotal: 250000,
        tax: 15000,
        total: 265000,
        currency: 'MYR',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'SENT',
        terms: [
          '30% deposit upon acceptance',
          '40% upon design approval',
          '30% upon project completion',
          'All prices in Malaysian Ringgit (MYR)'
        ]
      }
    })

    console.log('✅ Beta data seeding completed successfully!')
    console.log('\n📧 Demo Login Credentials:')
    console.log('Admin: admin@architech.my / Demo@2024')
    console.log('Project Lead: lead@architech.my / Demo@2024')
    console.log('Designer: designer@architech.my / Demo@2024')
    console.log('Client: client@example.my / Demo@2024')

    return {
      organization,
      users,
      projects,
      subscription
    }
  } catch (error) {
    console.error('❌ Error seeding beta data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
if (require.main === module) {
  seedBetaData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default seedBetaData