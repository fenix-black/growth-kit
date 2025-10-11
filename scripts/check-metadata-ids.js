// Check if the IDs in credit metadata are fingerprints
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Credit Metadata IDs\n');

  const referralCredits = await prisma.credit.findMany({
    where: {
      reason: 'referral'
    },
    include: {
      fingerprint: {
        include: {
          leads: { take: 1, orderBy: { createdAt: 'desc' } }
        }
      }
    }
  });

  for (const credit of referralCredits) {
    const userName = credit.fingerprint.leads[0]?.name || 
                    credit.fingerprint.leads[0]?.email || 
                    `fp_${credit.fingerprint.fingerprint.substring(0, 8)}`;
    
    console.log(`\nCredit for: ${userName}`);
    console.log(`  Amount: ${credit.amount}`);
    console.log(`  Metadata: ${JSON.stringify(credit.metadata, null, 2)}`);

    // Check if the IDs in metadata are fingerprints or referrals
    const metadata = credit.metadata;
    
    if (metadata?.referrerId) {
      const referrerFingerprint = await prisma.fingerprint.findUnique({
        where: { id: metadata.referrerId },
        include: {
          leads: { take: 1, orderBy: { createdAt: 'desc' } }
        }
      });
      
      if (referrerFingerprint) {
        const referrerName = referrerFingerprint.leads[0]?.name || 
                           referrerFingerprint.leads[0]?.email || 
                           `fp_${referrerFingerprint.fingerprint.substring(0, 8)}`;
        console.log(`  ✅ referrerId IS a Fingerprint: ${referrerName}`);
      } else {
        console.log(`  ❌ referrerId is NOT a Fingerprint`);
      }
    }

    if (metadata?.referredId) {
      const referredFingerprint = await prisma.fingerprint.findUnique({
        where: { id: metadata.referredId },
        include: {
          leads: { take: 1, orderBy: { createdAt: 'desc' } }
        }
      });
      
      if (referredFingerprint) {
        const referredName = referredFingerprint.leads[0]?.name || 
                           referredFingerprint.leads[0]?.email || 
                           `fp_${referredFingerprint.fingerprint.substring(0, 8)}`;
        console.log(`  ✅ referredId IS a Fingerprint: ${referredName}`);
      } else {
        console.log(`  ❌ referredId is NOT a Fingerprint`);
      }
    }

    if (metadata?.referralId) {
      const referralFingerprint = await prisma.fingerprint.findUnique({
        where: { id: metadata.referralId },
        include: {
          leads: { take: 1, orderBy: { createdAt: 'desc' } }
        }
      });
      
      if (referralFingerprint) {
        const referralName = referralFingerprint.leads[0]?.name || 
                           referralFingerprint.leads[0]?.email || 
                           `fp_${referralFingerprint.fingerprint.substring(0, 8)}`;
        console.log(`  ✅ referralId IS a Fingerprint: ${referralName}`);
      } else {
        console.log(`  ❌ referralId is NOT a Fingerprint`);
      }
    }
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
