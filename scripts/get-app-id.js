// Get app IDs for testing
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getApps() {
  try {
    const apps = await prisma.app.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
      }
    });
    
    console.log('Available Apps:');
    console.log('===============\n');
    
    apps.forEach(app => {
      console.log(`Name: ${app.name}`);
      console.log(`ID: ${app.id}`);
      console.log(`Domain: ${app.domain}`);
      console.log(`Active: ${app.isActive}`);
      console.log('---');
    });
    
    if (apps.length > 0) {
      console.log('\n📧 Test waitlist email with:');
      console.log(`https://growth.fenixblack.ai/api/v1/test-email?send=true&type=waitlist&appId=${apps[0].id}&to=pablo@fenixblack.ai`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getApps();
