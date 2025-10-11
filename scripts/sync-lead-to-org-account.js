#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncLeadToOrgAccount() {
  try {
    console.log('\n=== SYNCING LEAD DATA TO ORG ACCOUNTS ===\n');

    // Get all fingerprints linked to OrgUserAccounts
    const fingerprints = await prisma.fingerprint.findMany({
      where: {
        orgUserAccountId: { not: null },
      },
      include: {
        leads: {
          select: { name: true, email: true, emailVerified: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        orgUserAccount: { select: { id: true, name: true, email: true, emailVerified: true } },
        app: { select: { name: true } },
      },
    });

    console.log(`Found ${fingerprints.length} fingerprint(s) with OrgUserAccount\n`);

    let updateCount = 0;

    for (const fp of fingerprints) {
      const lead = fp.leads[0];
      const orgAccount = fp.orgUserAccount;

      if (!lead || !orgAccount) continue;

      // Check if Lead has data that OrgUserAccount doesn't
      const needsUpdate = {
        name: lead.name && !orgAccount.name,
        email: lead.email && !orgAccount.email,
        emailVerified: lead.emailVerified && !orgAccount.emailVerified,
      };

      if (needsUpdate.name || needsUpdate.email || needsUpdate.emailVerified) {
        console.log(`📝 Updating OrgUserAccount ${orgAccount.id} from ${fp.app.name}:`);
        
        const updateData = {};
        if (needsUpdate.name) {
          console.log(`   name: NULL → "${lead.name}"`);
          updateData.name = lead.name;
        }
        if (needsUpdate.email) {
          console.log(`   email: NULL → "${lead.email}"`);
          updateData.email = lead.email;
        }
        if (needsUpdate.emailVerified) {
          console.log(`   emailVerified: false → true`);
          updateData.emailVerified = lead.emailVerified;
        }

        updateData.updatedAt = new Date();

        await prisma.orgUserAccount.update({
          where: { id: orgAccount.id },
          data: updateData,
        });

        updateCount++;
        console.log('');
      }
    }

    if (updateCount === 0) {
      console.log('✨ No updates needed - all OrgUserAccounts are in sync');
    } else {
      console.log(`✅ Updated ${updateCount} OrgUserAccount(s)\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncLeadToOrgAccount();
