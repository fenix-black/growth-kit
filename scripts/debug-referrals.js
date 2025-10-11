// Debug script to check referral relationships in the database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Debugging Referral Relationships\n');

  // Get all referrals
  const referrals = await prisma.referral.findMany({
    where: {
      claimedAt: { not: null }
    },
    include: {
      referrer: {
        include: {
          leads: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          }
        }
      },
      referred: {
        include: {
          leads: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          }
        }
      }
    },
    orderBy: { claimedAt: 'desc' },
    take: 10,
  });

  console.log(`Found ${referrals.length} claimed referrals\n`);

  if (referrals.length === 0) {
    console.log('❌ No claimed referrals found in database');
    console.log('   Users need to claim a referral code for the relationship to exist\n');
  } else {
    referrals.forEach((ref, i) => {
      console.log(`Referral #${i + 1}:`);
      console.log(`  ID: ${ref.id}`);
      console.log(`  Claimed At: ${ref.claimedAt}`);
      
      if (ref.referrer) {
        const referrerName = ref.referrer.leads[0]?.name || ref.referrer.leads[0]?.email || `fp_${ref.referrer.fingerprint.substring(0, 8)}`;
        console.log(`  Referrer: ${referrerName}`);
      } else {
        console.log(`  Referrer: [Missing - referrerId: ${ref.referrerId}]`);
      }
      
      if (ref.referred) {
        const referredName = ref.referred.leads[0]?.name || ref.referred.leads[0]?.email || `fp_${ref.referred.fingerprint.substring(0, 8)}`;
        console.log(`  Referred User: ${referredName}`);
      } else {
        console.log(`  Referred User: [Missing - referredId: ${ref.referredId}]`);
      }
      console.log('');
    });
  }

  // Now let's check fingerprints with referredBy relation
  console.log('\n🔗 Checking Fingerprints with referredBy relationship:\n');

  const fingerprintsWithReferrals = await prisma.fingerprint.findMany({
    where: {
      referredBy: {
        isNot: null
      }
    },
    include: {
      referredBy: {
        include: {
          referrer: {
            include: {
              leads: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              }
            }
          }
        }
      },
      leads: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      }
    },
    take: 10,
  });

  console.log(`Found ${fingerprintsWithReferrals.length} fingerprints with referredBy relationship\n`);

  fingerprintsWithReferrals.forEach((fp, i) => {
    const userName = fp.leads[0]?.name || fp.leads[0]?.email || `fp_${fp.fingerprint.substring(0, 8)}`;
    console.log(`User #${i + 1}: ${userName}`);
    
    if (fp.referredBy) {
      console.log(`  Has referredBy: YES`);
      console.log(`  Referral ID: ${fp.referredBy.id}`);
      console.log(`  Claimed At: ${fp.referredBy.claimedAt}`);
      
      if (fp.referredBy.referrer) {
        const referrerName = fp.referredBy.referrer.leads[0]?.name || 
                           fp.referredBy.referrer.leads[0]?.email || 
                           `fp_${fp.referredBy.referrer.fingerprint.substring(0, 8)}`;
        console.log(`  Referrer: ${referrerName}`);
      } else {
        console.log(`  Referrer: [MISSING]`);
      }
    } else {
      console.log(`  Has referredBy: NO`);
    }
    console.log('');
  });

  // Check total counts
  console.log('\n📊 Summary Statistics:\n');
  const totalFingerprints = await prisma.fingerprint.count();
  const totalReferrals = await prisma.referral.count();
  const claimedReferrals = await prisma.referral.count({
    where: { claimedAt: { not: null } }
  });
  const fingerprintsWithRef = await prisma.fingerprint.count({
    where: {
      referredBy: {
        isNot: null
      }
    }
  });

  console.log(`Total Fingerprints: ${totalFingerprints}`);
  console.log(`Total Referrals: ${totalReferrals}`);
  console.log(`Claimed Referrals: ${claimedReferrals}`);
  console.log(`Fingerprints with referredBy: ${fingerprintsWithRef}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
