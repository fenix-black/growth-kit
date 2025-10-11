// Check if there are credits with "referral" reason
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for Referral Credits\n');

  // Check credits with referral reason
  const referralCredits = await prisma.credit.findMany({
    where: {
      reason: 'referral'
    },
    include: {
      fingerprint: {
        include: {
          leads: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  console.log(`Found ${referralCredits.length} credits with "referral" reason\n`);

  referralCredits.forEach((credit, i) => {
    const userName = credit.fingerprint.leads[0]?.name || 
                    credit.fingerprint.leads[0]?.email || 
                    `fp_${credit.fingerprint.fingerprint.substring(0, 8)}`;
    
    console.log(`Credit #${i + 1}:`);
    console.log(`  User: ${userName}`);
    console.log(`  Amount: ${credit.amount}`);
    console.log(`  Created: ${credit.createdAt}`);
    console.log(`  Metadata: ${JSON.stringify(credit.metadata)}`);
    console.log('');
  });

  // Check all credit reasons
  console.log('\n📊 All Credit Reasons:\n');
  const allCredits = await prisma.credit.groupBy({
    by: ['reason'],
    _count: { reason: true },
    orderBy: { _count: { reason: 'desc' } }
  });

  allCredits.forEach(item => {
    console.log(`  ${item.reason}: ${item._count.reason} credits`);
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
