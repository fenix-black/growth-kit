const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLeads() {
  try {
    // Get the fingerprint from the logs
    const fingerprint = '5291764462133909';
    
    // Find the fingerprint record
    const fingerprintRecord = await prisma.fingerprint.findFirst({
      where: { fingerprint },
      include: {
        leads: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            appId: true,
          }
        }
      }
    });
    
    console.log('Fingerprint:', fingerprint);
    console.log('Fingerprint ID:', fingerprintRecord?.id);
    console.log('\nLeads for this fingerprint:');
    console.log(JSON.stringify(fingerprintRecord?.leads, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeads();
