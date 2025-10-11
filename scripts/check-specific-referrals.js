// Check specific referral IDs from the credit metadata
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Specific Referral Records\n');

  const referralIds = [
    'cmg5psayf0007l2044e0e5bmi',
    'cmg5nt0cv0007jm04f6wic4ys'
  ];

  for (const refId of referralIds) {
    console.log(`Checking Referral ID: ${refId}`);
    
    const referral = await prisma.referral.findUnique({
      where: { id: refId },
      include: {
        referrer: {
          include: {
            leads: { take: 1, orderBy: { createdAt: 'desc' } }
          }
        },
        referred: {
          include: {
            leads: { take: 1, orderBy: { createdAt: 'desc' } }
          }
        }
      }
    });

    if (referral) {
      console.log('  ✅ Referral EXISTS');
      console.log(`  Referrer ID: ${referral.referrerId}`);
      console.log(`  Referred ID: ${referral.referredId}`);
      console.log(`  Claimed At: ${referral.claimedAt}`);
      
      if (referral.referrer) {
        const referrerName = referral.referrer.leads[0]?.name || 
                           referral.referrer.leads[0]?.email || 
                           `fp_${referral.referrer.fingerprint.substring(0, 8)}`;
        console.log(`  Referrer: ${referrerName}`);
      }
      
      if (referral.referred) {
        const referredName = referral.referred.leads[0]?.name || 
                           referral.referred.leads[0]?.email || 
                           `fp_${referral.referred.fingerprint.substring(0, 8)}`;
        console.log(`  Referred User: ${referredName}`);
      } else {
        console.log(`  ⚠️  Referred user is NULL (referredId field is not set)`);
      }
    } else {
      console.log('  ❌ Referral NOT FOUND');
    }
    console.log('');
  }

  // Check all referrals regardless of claimed status
  console.log('\n📋 All Referrals in Database:\n');
  const allReferrals = await prisma.referral.findMany({
    include: {
      referrer: {
        include: {
          leads: { take: 1, orderBy: { createdAt: 'desc' } }
        }
      },
      referred: {
        include: {
          leads: { take: 1, orderBy: { createdAt: 'desc' } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log(`Total referrals found: ${allReferrals.length}\n`);

  allReferrals.forEach((ref, i) => {
    const referrerName = ref.referrer?.leads[0]?.name || 
                        ref.referrer?.leads[0]?.email || 
                        `fp_${ref.referrer?.fingerprint?.substring(0, 8) || 'unknown'}`;
    
    const referredName = ref.referred?.leads[0]?.name || 
                        ref.referred?.leads[0]?.email || 
                        (ref.referred ? `fp_${ref.referred.fingerprint.substring(0, 8)}` : '[NULL]');

    console.log(`Referral #${i + 1}:`);
    console.log(`  ID: ${ref.id}`);
    console.log(`  Referrer: ${referrerName}`);
    console.log(`  Referred: ${referredName}`);
    console.log(`  Claimed: ${ref.claimedAt ? 'YES' : 'NO'}`);
    console.log(`  referredId field: ${ref.referredId || '[NULL]'}`);
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
