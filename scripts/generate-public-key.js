const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function generatePublicKey() {
  try {
    // Get the first app
    const app = await prisma.app.findFirst();
    
    if (!app) {
      console.error('No app found in database. Please create an app first.');
      process.exit(1);
    }

    // Generate a public key
    const publicKey = 'pk_' + crypto.randomBytes(16).toString('base64url');
    
    // Update the app with the public key
    await prisma.app.update({
      where: { id: app.id },
      data: { publicKey },
    });

    console.log('\n✅ Public key generated successfully!');
    console.log(`\nApp: ${app.name}`);
    console.log(`Public Key: ${publicKey}`);
    console.log(`\n📝 Add this to your .env.local:`);
    console.log(`NEXT_PUBLIC_GROWTHKIT_PUBLIC_KEY=${publicKey}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generatePublicKey();
