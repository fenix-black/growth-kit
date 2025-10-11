#!/usr/bin/env node
/**
 * Drop SdkVersionUsage table from database
 * Clean up after auto-update rollback
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Dropping sdk_version_usage table...\n');

  try {
    // Check if table exists first
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sdk_version_usage'
      );
    `;
    
    const exists = result[0]?.exists;
    
    if (!exists) {
      console.log('✅ Table sdk_version_usage does not exist (already clean)');
      return;
    }
    
    console.log('📊 Table exists, checking record count...');
    
    const count = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM sdk_version_usage;
    `;
    
    console.log(`   Records: ${count[0]?.count || 0}`);
    
    // Drop the table
    console.log('\n⚠️  Dropping table in 3 seconds... (Ctrl+C to cancel)');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await prisma.$executeRaw`DROP TABLE IF EXISTS sdk_version_usage CASCADE;`;
    
    console.log('✅ Table sdk_version_usage dropped successfully!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

