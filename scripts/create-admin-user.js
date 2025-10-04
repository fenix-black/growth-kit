#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Creating admin user and organization...');
    
    // Configuration
    const userData = {
      email: 'pablo@fenixblack.ai',
      name: 'Pablo Schaffner',
      password: 'FenixGrowth2025!', // Strong password
    };
    
    const organizationData = {
      name: 'FenixBlack Organization',
    };

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      console.log('✅ User already exists:', userData.email);
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    // Create organization first
    const organization = await prisma.organization.create({
      data: organizationData
    });
    
    console.log('✅ Created organization:', organization.name);

    // Create user and connect to organization
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        organizations: {
          connect: { id: organization.id }
        }
      }
    });

    console.log('✅ Created user:', user.email);

    // Get all existing apps and assign them to the organization (one by one to avoid timeout)
    const existingApps = await prisma.app.findMany();
    
    if (existingApps.length > 0) {
      console.log(`ℹ️  Found ${existingApps.length} existing apps, assigning to organization...`);
      
      // Update apps one by one to avoid timeout
      for (let i = 0; i < existingApps.length; i++) {
        const app = existingApps[i];
        try {
          await prisma.app.update({
            where: { id: app.id },
            data: { organizationId: organization.id }
          });
          console.log(`✅ Assigned app "${app.name}" to organization (${i + 1}/${existingApps.length})`);
        } catch (updateError) {
          console.log(`⚠️  Failed to assign app "${app.name}":`, updateError.message);
        }
      }
      
      console.log(`✅ Finished assigning apps to organization`);
    } else {
      console.log('ℹ️  No existing apps found to assign');
    }

    console.log('\n🎉 Setup complete!');
    console.log('📧 Email:', userData.email);
    console.log('🔑 Password:', userData.password);
    console.log('🏢 Organization:', organization.name);
    console.log('\n⚠️  Please save these credentials and update your admin login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      console.error('Email already exists in database');
    } else if (error.code === 'P2025') {
      console.error('Record not found - check if tables exist');
    } else {
      console.error('Full error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();
