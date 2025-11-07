import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting simplified seed...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create a simple user without organization first
  const testUser = await prisma.user.upsert({
    where: { email: 'test@daritana.com' },
    update: {},
    create: {
      email: 'test@daritana.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
    },
  });

  console.log('Seed completed successfully!');
  console.log('');
  console.log('Test credentials:');
  console.log('================');
  console.log('Email: test@daritana.com | Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });