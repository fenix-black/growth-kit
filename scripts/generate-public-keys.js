const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Generate a new public key for client-side usage
 */
function generatePublicKey() {
  return `pk_${crypto.randomBytes(16).toString('base64url')}`;
}

async function generatePublicKeysForApps() {
  try {
    console.log('🔑 Generating public keys for existing apps...');
    
    // Find all apps without public keys
    const appsWithoutPublicKeys = await prisma.app.findMany({
      where: {
        publicKey: null
      },
      select: {
        id: true,
        name: true,
        domain: true
      }
    });

    console.log(`Found ${appsWithoutPublicKeys.length} apps without public keys`);

    if (appsWithoutPublicKeys.length === 0) {
      console.log('✅ All apps already have public keys!');
      return;
    }

    // Generate and update public keys
    for (const app of appsWithoutPublicKeys) {
      const publicKey = generatePublicKey();
      
      await prisma.app.update({
        where: { id: app.id },
        data: { publicKey }
      });
      
      console.log(`✅ Generated public key for app "${app.name}" (${app.domain}): ${publicKey}`);
    }

    console.log(`🎉 Successfully generated public keys for ${appsWithoutPublicKeys.length} apps!`);
    
  } catch (error) {
    console.error('❌ Error generating public keys:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generatePublicKeysForApps()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
