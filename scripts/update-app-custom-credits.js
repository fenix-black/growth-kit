import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking and updating app custom credits settings...');
  
  // First, get all apps
  const apps = await prisma.app.findMany({
    select: {
      id: true,
      name: true,
      domain: true,
      allowCustomCredits: true,
      maxCustomCredits: true
    }
  });
  
  console.log(`Found ${apps.length} apps`);
  
  // Update apps that need it
  let updatedCount = 0;
  for (const app of apps) {
    if (app.allowCustomCredits === null || app.maxCustomCredits === null) {
      await prisma.app.update({
        where: { id: app.id },
        data: {
          allowCustomCredits: app.allowCustomCredits ?? true,
          maxCustomCredits: app.maxCustomCredits ?? 100
        }
      });
      updatedCount++;
      console.log(`Updated ${app.name} (${app.domain})`);
    }
  }
  
  console.log(`\nUpdated ${updatedCount} apps`);
  
  // Show current settings
  const updatedApps = await prisma.app.findMany({
    select: {
      id: true,
      name: true,
      domain: true,
      allowCustomCredits: true,
      maxCustomCredits: true
    }
  });
  
  console.log('\nCurrent app settings:');
  updatedApps.forEach(app => {
    console.log(`- ${app.name} (${app.domain}): allowCustomCredits=${app.allowCustomCredits}, maxCustomCredits=${app.maxCustomCredits}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
