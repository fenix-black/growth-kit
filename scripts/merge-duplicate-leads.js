const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function mergeDuplicateLeads() {
  try {
    const fingerprint = '5291764462133909';
    
    // Find the fingerprint record
    const fingerprintRecord = await prisma.fingerprint.findFirst({
      where: { fingerprint },
    });
    
    if (!fingerprintRecord) {
      console.log('Fingerprint not found');
      return;
    }
    
    // Get all leads for this fingerprint
    const leads = await prisma.lead.findMany({
      where: {
        fingerprintId: fingerprintRecord.id,
        appId: 'cmftthk7k0005vmkgeambjze0', // Your app ID from the logs
      },
      orderBy: { createdAt: 'asc' },
    });
    
    console.log(`Found ${leads.length} leads for fingerprint ${fingerprint}`);
    
    if (leads.length <= 1) {
      console.log('No duplicates to merge');
      return;
    }
    
    // Find the best lead to keep (one with email)
    const leadToKeep = leads.find(l => l.email) || leads[0];
    const leadsToDelete = leads.filter(l => l.id !== leadToKeep.id);
    
    // Collect all data
    const name = leads.find(l => l.name)?.name || null;
    const email = leadToKeep.email;
    const emailVerified = leadToKeep.emailVerified;
    
    console.log('\nMerging into lead:', leadToKeep.id);
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Email Verified:', emailVerified);
    
    // Update the keeper lead with all data
    await prisma.lead.update({
      where: { id: leadToKeep.id },
      data: {
        name: name,
        email: email,
        emailVerified: emailVerified,
      },
    });
    
    // Delete the duplicate leads
    if (leadsToDelete.length > 0) {
      await prisma.lead.deleteMany({
        where: {
          id: { in: leadsToDelete.map(l => l.id) },
        },
      });
      console.log(`\nDeleted ${leadsToDelete.length} duplicate leads`);
    }
    
    console.log('\nMerge complete!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

mergeDuplicateLeads();
