const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function moveAppToOrganization(appName, organizationName) {
  if (!appName || !organizationName) {
    console.log('❌ Usage: node move-app-to-org.js "App Name" "Organization Name"');
    console.log('Example: node move-app-to-org.js "My App" "My Organization"');
    process.exit(1);
  }

  console.log(`🚀 Moving "${appName}" app to "${organizationName}" organization...\n`);
  
  try {
    // First, find the specified app
    const app = await prisma.app.findFirst({
      where: {
        name: appName
      },
      select: {
        id: true,
        name: true,
        domain: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!app) {
      console.log(`❌ App "${appName}" not found`);
      
      // Show all available apps for reference
      console.log('\nAvailable apps:');
      const allApps = await prisma.app.findMany({
        select: { name: true, domain: true, organizationId: true }
      });
      allApps.forEach(a => {
        console.log(`  - ${a.name} (${a.domain}) - Org ID: ${a.organizationId || 'None'}`);
      });
      return;
    }

    console.log(`📱 Found app: "${app.name}" (${app.domain})`);
    console.log(`   Current organization: ${app.organization?.name || 'None'} (ID: ${app.organizationId || 'None'})`);

    // Find the specified organization
    const organization = await prisma.organization.findFirst({
      where: {
        name: organizationName
      },
      select: {
        id: true,
        name: true,
        creditBalance: true
      }
    });

    if (!organization) {
      console.log(`\n❌ Organization "${organizationName}" not found`);
      
      // Show all available organizations for reference
      console.log('\nAvailable organizations:');
      const allOrgs = await prisma.organization.findMany({
        select: { name: true, id: true, creditBalance: true }
      });
      allOrgs.forEach(org => {
        console.log(`  - ${org.name} (ID: ${org.id}) - Credits: ${org.creditBalance}`);
      });
      return;
    }

    console.log(`\n🏢 Found organization: "${organization.name}" (ID: ${organization.id})`);
    console.log(`   Credit Balance: ${organization.creditBalance}`);

    // Check if the app is already in this organization
    if (app.organizationId === organization.id) {
      console.log('\n✅ App is already in the correct organization!');
      return;
    }

    // Move the app to the organization
    console.log('\n🔄 Moving app to organization...');
    
    const updatedApp = await prisma.app.update({
      where: {
        id: app.id
      },
      data: {
        organizationId: organization.id
      },
      select: {
        id: true,
        name: true,
        domain: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('\n✅ App successfully moved to organization!');
    console.log(`   App: "${updatedApp.name}" (${updatedApp.domain})`);
    console.log(`   Organization: "${updatedApp.organization?.name}" (ID: ${updatedApp.organizationId})`);

    // Log this action for audit purposes
    await prisma.adminActivity.create({
      data: {
        action: 'app_moved_to_organization',
        targetType: 'app',
        targetId: app.id,
        metadata: {
          appName: app.name,
          appDomain: app.domain,
          previousOrganizationId: app.organizationId,
          newOrganizationId: organization.id,
          organizationName: organization.name
        }
      }
    });

    console.log('\n📝 Admin activity logged for audit trail');
    
  } catch (error) {
    console.error('\n❌ Error moving app to organization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('\n🔐 Database connection closed');
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const appName = args[0];
const organizationName = args[1];

// Run the script
moveAppToOrganization(appName, organizationName)
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
