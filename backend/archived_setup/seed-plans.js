const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPlans() {
  console.log('Seeding subscription plans...');

  const plans = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Basic',
      displayName: 'Basic Plan',
      description: 'Perfect for small teams and startups',
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,
      currency: 'MYR',
      interval: 'MONTHLY',
      features: ['basic_projects', 'basic_storage', 'email_support'],
      maxUsers: 5,
      maxProjects: 10,
      maxStorage: 10737418240, // 10GB
      maxFiles: 1000,
      isActive: true,
      isPublic: true,
      tier: 'BASIC',
      sortOrder: 1,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Professional',
      displayName: 'Professional Plan',
      description: 'For growing teams with advanced needs',
      monthlyPrice: 99.99,
      yearlyPrice: 999.99,
      currency: 'MYR',
      interval: 'MONTHLY',
      features: ['unlimited_projects', 'team_collaboration', 'cloud_storage', 'priority_support'],
      maxUsers: 20,
      maxProjects: 50,
      maxStorage: 107374182400, // 100GB
      maxFiles: 10000,
      isActive: true,
      isPublic: true,
      tier: 'PROFESSIONAL',
      sortOrder: 2,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Enterprise',
      displayName: 'Enterprise Plan',
      description: 'For large organizations with custom requirements',
      monthlyPrice: 299.99,
      yearlyPrice: 2999.99,
      currency: 'MYR',
      interval: 'MONTHLY',
      features: ['unlimited_everything', 'custom_integrations', 'dedicated_support', 'sla_guarantee'],
      maxUsers: 9999, // Very large number instead of -1
      maxProjects: 9999, // Very large number instead of -1
      maxStorage: 1099511627776, // 1TB
      maxFiles: 100000,
      isActive: true,
      isPublic: true,
      tier: 'ENTERPRISE',
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    try {
      const { ...planData } = plan;
      // Remove fields that don't exist in schema
      delete planData.price;
      delete planData.slug;
      
      await prisma.subscriptionPlan.upsert({
        where: { id: plan.id },
        update: planData,
        create: planData,
      });
      console.log(`✅ Created/Updated plan: ${plan.name}`);
    } catch (error) {
      console.error(`❌ Error creating plan ${plan.name}:`, error.message);
    }
  }

  console.log('\n✅ Subscription plans seeded successfully');
}

seedPlans()
  .catch(console.error)
  .finally(() => prisma.$disconnect());