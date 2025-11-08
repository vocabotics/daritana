const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test users...');
  
  // Hash password
  const hashedPassword = await bcrypt.hash('Demo@2024', 10);
  
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@daritana.com' },
    update: {},
    create: {
      email: 'admin@daritana.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true,
      isActive: true
    }
  });
  console.log('Created admin:', admin.email);

  // Create project lead
  const lead = await prisma.user.upsert({
    where: { email: 'lead@daritana.com' },
    update: {},
    create: {
      email: 'lead@daritana.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Abdullah',
      emailVerified: true,
      isActive: true
    }
  });
  console.log('Created project lead:', lead.email);

  // Create designer
  const designer = await prisma.user.upsert({
    where: { email: 'designer@daritana.com' },
    update: {},
    create: {
      email: 'designer@daritana.com',
      password: hashedPassword,
      firstName: 'Raj',
      lastName: 'Kumar',
      emailVerified: true,
      isActive: true
    }
  });
  console.log('Created designer:', designer.email);

  // Create client
  const client = await prisma.user.upsert({
    where: { email: 'client@daritana.com' },
    update: {},
    create: {
      email: 'client@daritana.com',
      password: hashedPassword,
      firstName: 'David',
      lastName: 'Tan',
      emailVerified: true,
      isActive: true
    }
  });
  console.log('Created client:', client.email);

  console.log('\n✅ Test users created successfully!');
  console.log('\n📧 Login Credentials:');
  console.log('Admin: admin@daritana.com / Demo@2024');
  console.log('Project Lead: lead@daritana.com / Demo@2024');
  console.log('Designer: designer@daritana.com / Demo@2024');
  console.log('Client: client@daritana.com / Demo@2024');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });