const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updatePasswords() {
  console.log('Updating user passwords...');
  
  // Generate new hash
  const newPassword = 'Demo@2024';
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  console.log('Generated hash:', hashedPassword);
  
  // Verify the hash works
  const isValid = await bcrypt.compare(newPassword, hashedPassword);
  console.log('Hash is valid:', isValid);
  
  // Update all test users
  const emails = [
    'admin@daritana.com',
    'lead@daritana.com',
    'designer@daritana.com',
    'client@daritana.com'
  ];
  
  for (const email of emails) {
    try {
      const user = await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      console.log(`Updated password for: ${email}`);
    } catch (error) {
      console.log(`User ${email} not found, skipping...`);
    }
  }
  
  console.log('\n✅ Passwords updated successfully!');
  console.log('You can now login with: Demo@2024');
}

updatePasswords()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });