import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPassword() {
  try {
    // Find the admin user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@daritana.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', user.email);
    console.log('Stored password hash:', user.password);
    
    // Test password
    const testPassword = 'password123';
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    console.log('Password "password123" is valid:', isValid);
    
    // Create a new hash to compare
    const newHash = await bcrypt.hash('password123', 12);
    console.log('New hash for password123:', newHash);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();