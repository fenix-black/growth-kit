const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findLandingApp() {
  try {
    const app = await prisma.app.findFirst({
      where: {
        name: 'Growth Landing Page'
      },
      select: {
        name: true,
        publicKey: true,
        corsOrigins: true,
      },
    });
    
    if (!app) {
      console.log('\n❌ "Growth Landing Page" app not found in database');
      console.log('\nAll apps:');
      const allApps = await prisma.app.findMany({
        select: { name: true, publicKey: true }
      });
      allApps.forEach(a => console.log(`  - ${a.name} (${a.publicKey || 'no key'})`));
      return;
    }
    
    console.log('\n📱 App:', app.name);
    console.log('🔑 Public Key:', app.publicKey || 'NOT SET');
    console.log('🌐 CORS Origins:', app.corsOrigins);
    
    const expectedKey = process.env.EXPECTED_PUBLIC_KEY;
    
    if (!app.publicKey) {
      console.log('\n⚠️  This app has NO public key!');
      console.log('\n💡 Generate a public key using:');
      console.log('   node scripts/generate-public-key.js <appId>');
    } else {
      console.log('\n✅ App has a public key!');
      
      if (expectedKey && app.publicKey !== expectedKey) {
        console.log('\n⚠️  Key mismatch detected!');
        console.log(`\n📝 Update your .env.local to:`);
        console.log(`NEXT_PUBLIC_GROWTHKIT_PUBLIC_KEY=${app.publicKey}`);
      } else if (expectedKey) {
        console.log('✅ Public key matches expected value!');
      }
    }
    
    if (!app.corsOrigins.includes('http://localhost:3001')) {
      console.log('\n⚠️  Adding localhost:3001 to CORS...');
      await prisma.app.updateMany({
        where: { name: 'Growth Landing Page' },
        data: {
          corsOrigins: [...app.corsOrigins, 'http://localhost:3001'],
        },
      });
      console.log('✅ CORS updated');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findLandingApp();
