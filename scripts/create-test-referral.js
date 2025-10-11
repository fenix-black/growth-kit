// Create a test referral relationship between two existing users
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating Test Referral Relationship\n');

  // Get two fingerprints to create a referral between them
  const fingerprints = await prisma.fingerprint.findMany({
    include: {
      leads: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      referredBy: true,
    },
    take: 5,
  });

  if (fingerprints.length < 2) {
    console.log('❌ Need at least 2 fingerprints to create a referral relationship');
    return;
  }

  // Find a fingerprint that isn't already referred
  const referrer = fingerprints[0];
  const referred = fingerprints.find(fp => !fp.referredBy && fp.id !== referrer.id);

  if (!referred) {
    console.log('❌ All fingerprints are already referred by someone');
    return;
  }

  const referrerName = referrer.leads[0]?.name || 
                      referrer.leads[0]?.email || 
                      `fp_${referrer.fingerprint.substring(0, 8)}`;
  
  const referredName = referred.leads[0]?.name || 
                      referred.leads[0]?.email || 
                      `fp_${referred.fingerprint.substring(0, 8)}`;

  console.log(`Creating referral relationship:`);
  console.log(`  Referrer: ${referrerName}`);
  console.log(`  Referred: ${referredName}\n`);

  // Get the app ID
  const appId = referrer.appId;

  // Create the referral relationship
  const referral = await prisma.referral.create({
    data: {
      appId: appId,
      referrerId: referrer.id,
      referredId: referred.id,
      claimToken: 'test-claim-token-' + Date.now(),
      claimedAt: new Date(),
      visitCount: 1,
      lastVisitAt: new Date(),
    },
  });

  console.log('✅ Referral relationship created successfully!');
  console.log(`  Referral ID: ${referral.id}`);
  console.log(`  Claimed At: ${referral.claimedAt}\n`);

  // Verify the relationship
  const verifyReferred = await prisma.fingerprint.findUnique({
    where: { id: referred.id },
    include: {
      referredBy: {
        include: {
          referrer: {
            include: {
              leads: { take: 1, orderBy: { createdAt: 'desc' } }
            }
          }
        }
      }
    }
  });

  if (verifyReferred?.referredBy) {
    console.log('✅ Verification: referredBy relationship is working!');
    console.log(`  ${referredName} was referred by ${referrerName}`);
    console.log('\n🎉 Now refresh your dashboard and you should see the referral indicator!\n');
  } else {
    console.log('❌ Verification failed: referredBy relationship not found');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
