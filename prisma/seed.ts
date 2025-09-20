import { PrismaClient } from '@prisma/client';
import { hashApiKey, generateApiKey } from '../src/lib/security/apiKeys';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create a default app for testing
  let app = await prisma.app.findFirst({
    where: { domain: 'localhost:3001' }
  });

  if (!app) {
    app = await prisma.app.create({
      data: {
      name: 'Test App',
      domain: 'localhost:3001',
      corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
      redirectUrl: 'http://localhost:3001',
      isActive: true,
      policyJson: {
        referralCredits: 5,
        referredCredits: 3,
        nameClaimCredits: 2,
        emailClaimCredits: 2,
        emailVerifyCredits: 5,
        dailyReferralCap: 10,
        actions: {
          default: { creditsRequired: 1 },
          premium: { creditsRequired: 5 },
          free: { creditsRequired: 0 }
        }
      }
    }
  });
  }

  console.log('Created app:', app.name);

  // Generate an API key for the test app
  const { key, hint } = generateApiKey();
  const hashedKey = await hashApiKey(key);

  await prisma.apiKey.create({
    data: {
      appId: app.id,
      keyHint: hint,
      hashedKey,
      scope: 'full',
      isActive: true,
    }
  });

  console.log('Created API key for testing:');
  console.log('API Key:', key);
  console.log('App ID:', app.id);
  console.log('\n⚠️  Save this API key! It won\'t be shown again.\n');

  // Log the admin credentials
  console.log('Admin Login Credentials:');
  console.log('Username:', process.env.ADMIN_USER);
  console.log('Password:', process.env.ADMIN_PASSWORD);
  console.log('\nAdmin URL: http://localhost:3000/admin');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
