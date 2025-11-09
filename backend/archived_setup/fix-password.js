import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPassword() {
  try {
    // Create correct hash
    const hashedPassword = await bcrypt.hash('password123', 12);
    console.log('Creating new hash for password123:', hashedPassword);
    
    // Update all users with the correct password
    const users = ['admin@daritana.com', 'lead@daritana.com', 'designer@daritana.com', 'contractor@daritana.com', 'client@daritana.com'];
    
    for (const email of users) {
      const result = await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      console.log(`Updated password for ${email}`);
    }
    
    // Test the password works
    const user = await prisma.user.findUnique({
      where: { email: 'admin@daritana.com' }
    });
    
    const isValid = await bcrypt.compare('password123', user.password);
    console.log('Password test after update:', isValid);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPassword();