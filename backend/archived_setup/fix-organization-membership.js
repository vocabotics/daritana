const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOrganizationMembership() {
  try {
    console.log('🔧 Fixing organization membership...');

    // Get or create test organization
    let organization = await prisma.organization.findFirst({
      where: { name: 'Test Organization' }
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
          email: 'admin@test.com',
          planId: 'basic-plan', // You'll need to create this plan first
          country: 'Malaysia'
        }
      });
      console.log('✅ Created test organization');
    }

    // Get test user
    const user = await prisma.user.findFirst({
      where: { email: 'admin@test.com' }
    });

    if (!user) {
      console.log('❌ Test user not found. Please create a user first.');
      return;
    }

    // Check if user is already a member
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
          permissions: ['*']
        }
      });
      console.log('✅ Added user to organization');
    } else {
      console.log('✅ User already has organization membership');
    }

    console.log('🎉 Organization membership fixed!');
  } catch (error) {
    console.error('❌ Error fixing organization membership:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrganizationMembership();
