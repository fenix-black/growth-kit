const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCors() {
  try {
    const app = await prisma.app.findFirst({
      select: {
        name: true,
        publicKey: true,
        corsOrigins: true,
      },
    });
    
    console.log('\n📱 App:', app.name);
    console.log('🔑 Public Key:', app.publicKey);
    console.log('🌐 CORS Origins:', app.corsOrigins);
    console.log('\n💡 Current dev server: http://localhost:3001');
    
    if (!app.corsOrigins.includes('http://localhost:3001')) {
      console.log('\n⚠️  localhost:3001 is NOT in CORS origins!');
      console.log('Adding it now...\n');
      
      await prisma.app.update({
        where: { id: app.id },
        data: {
          corsOrigins: [...app.corsOrigins, 'http://localhost:3001'],
        },
      });
      
      console.log('✅ Added http://localhost:3001 to CORS origins');
    } else {
      console.log('\n✅ localhost:3001 is already allowed');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCors();
