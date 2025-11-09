/**
 * Test Prisma models to identify exact issues
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testModels() {
  console.log('🔍 Testing Prisma Models...\n');
  
  try {
    // Test UserPresence model
    console.log('Testing UserPresence model...');
    const presenceFields = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'UserPresence'
    `;
    console.log('UserPresence fields:', presenceFields.length > 0 ? 'EXISTS' : 'MISSING');
    
    // Test Document model
    console.log('\nTesting Document model...');
    const documentFields = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Document'
    `;
    console.log('Document fields:', documentFields.length > 0 ? 'EXISTS' : 'MISSING');
    
    // Test ComplianceIssue model
    console.log('\nTesting ComplianceIssue model...');
    const complianceFields = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'ComplianceIssue'
    `;
    console.log('ComplianceIssue fields:', complianceFields.length > 0 ? 'EXISTS' : 'MISSING');
    
    // Test CourseEnrollment model
    console.log('\nTesting CourseEnrollment model...');
    const enrollmentFields = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'CourseEnrollment'
    `;
    console.log('CourseEnrollment fields:', enrollmentFields.length > 0 ? 'EXISTS' : 'MISSING');
    
    // Try to create a test document
    console.log('\n📝 Attempting to create test Document...');
    try {
      const doc = await prisma.document.create({
        data: {
          name: 'Test Document',
          category: 'general',
          organizationId: 'test-org-id',
          uploadedById: 'test-user-id',
          url: '/test/document.pdf',
          size: 1000,
          mimeType: 'application/pdf'
        }
      });
      console.log('✅ Document created:', doc.id);
    } catch (error) {
      console.log('❌ Document creation failed:', error.message);
      if (error.code === 'P2003') {
        console.log('   → Foreign key constraint issue');
      }
    }
    
    // Try to create test UserPresence
    console.log('\n👤 Attempting to create test UserPresence...');
    try {
      // First get a real user
      const user = await prisma.user.findFirst();
      if (user) {
        const presence = await prisma.userPresence.create({
          data: {
            userId: user.id,
            status: 'online',
            location: 'dashboard',
            lastSeen: new Date()
          }
        });
        console.log('✅ UserPresence created:', presence.id);
      } else {
        console.log('⚠️ No users found to test with');
      }
    } catch (error) {
      console.log('❌ UserPresence creation failed:', error.message);
    }
    
    // Check if CourseEnrollment model exists
    console.log('\n🎓 Testing CourseEnrollment...');
    try {
      const count = await prisma.courseEnrollment.count();
      console.log('✅ CourseEnrollment model exists, count:', count);
    } catch (error) {
      console.log('❌ CourseEnrollment model issue:', error.message);
      
      // Check if it's a missing model issue
      if (error.message.includes('courseEnrollment')) {
        console.log('   → Model "CourseEnrollment" not found in Prisma schema');
      }
    }
    
    // Check if ComplianceIssue model exists
    console.log('\n⚖️ Testing ComplianceIssue...');
    try {
      const count = await prisma.complianceIssue.count();
      console.log('✅ ComplianceIssue model exists, count:', count);
    } catch (error) {
      console.log('❌ ComplianceIssue model issue:', error.message);
      
      if (error.message.includes('complianceIssue')) {
        console.log('   → Model "ComplianceIssue" not found in Prisma schema');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testModels();