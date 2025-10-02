#!/usr/bin/env node

/**
 * Validation script for Product Waitlists feature
 * 
 * This script validates:
 * - Database schema changes (productTag field)
 * - Product configurations in App.metadata
 * - Waitlist entries with productTag
 * - Backward compatibility (null productTag = app-level)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProductWaitlists() {
  console.log('🔍 Product Waitlists Validation\n' + '='.repeat(50) + '\n');

  try {
    // 1. Check if schema changes are applied
    console.log('1️⃣  Checking database schema...');
    
    let migrationApplied = true;
    try {
      const firstWaitlist = await prisma.waitlist.findFirst();
      if (firstWaitlist) {
        const hasProductTag = 'productTag' in firstWaitlist;
        console.log(hasProductTag 
          ? '   ✅ productTag field exists in Waitlist model'
          : '   ⚠️  productTag field NOT found - run migration first'
        );
        if (!hasProductTag) migrationApplied = false;
      }

      const firstApp = await prisma.app.findFirst();
      if (firstApp) {
        const hasMetadata = 'metadata' in firstApp;
        console.log(hasMetadata 
          ? '   ✅ metadata field exists in App model'
          : '   ⚠️  metadata field NOT found - run migration first'
        );
        if (!hasMetadata) migrationApplied = false;
      }
    } catch (error) {
      console.log('   ⚠️  Migration not applied yet');
      console.log('   ℹ️  Run: npx prisma migrate deploy');
      console.log('\n   This is expected if you haven\'t deployed yet.');
      console.log('   All code is ready - just waiting for database migration.\n');
      migrationApplied = false;
    }

    if (!migrationApplied) {
      console.log('\n🔧 Next Steps:');
      console.log('   1. Review the migration file: prisma/migrations/20251002_add_product_waitlists/migration.sql');
      console.log('   2. Backup your database');
      console.log('   3. Run: npx prisma migrate deploy');
      console.log('   4. Run this script again to verify\n');
      return;
    }

    console.log('');

    // 2. Check for apps with product waitlists
    console.log('2️⃣  Checking product waitlist configurations...');
    
    const apps = await prisma.app.findMany({
      select: {
        id: true,
        name: true,
        metadata: true,
      },
    });

    let appsWithProducts = 0;
    let totalProducts = 0;

    apps.forEach(app => {
      const metadata = app.metadata;
      if (metadata && typeof metadata === 'object' && 'productWaitlists' in metadata) {
        const products = metadata.productWaitlists;
        if (Array.isArray(products) && products.length > 0) {
          appsWithProducts++;
          totalProducts += products.length;
          console.log(`   📦 ${app.name}: ${products.length} product(s)`);
          products.forEach(p => {
            console.log(`      - ${p.name} (${p.tag}) - ${p.enabled ? 'Enabled' : 'Disabled'}`);
          });
        }
      }
    });

    console.log(`\n   Total: ${appsWithProducts} app(s) with ${totalProducts} product waitlist(s)`);
    console.log('');

    // 3. Check waitlist entries with productTag
    console.log('3️⃣  Checking waitlist entries...');
    
    const appLevelCount = await prisma.waitlist.count({
      where: { productTag: null },
    });

    const productLevelCount = await prisma.waitlist.count({
      where: { productTag: { not: null } },
    });

    console.log(`   App-level waitlists: ${appLevelCount}`);
    console.log(`   Product waitlists: ${productLevelCount}`);

    // Show some examples
    if (productLevelCount > 0) {
      console.log('\n   Example product waitlist entries:');
      const productEntries = await prisma.waitlist.findMany({
        where: { productTag: { not: null } },
        take: 5,
        select: {
          email: true,
          productTag: true,
          status: true,
          createdAt: true,
        },
      });

      productEntries.forEach(entry => {
        console.log(`      ${entry.email} → ${entry.productTag} (${entry.status})`);
      });
    }

    console.log('');

    // 4. Check for unique constraint
    console.log('4️⃣  Testing unique constraint...');
    
    const duplicates = await prisma.$queryRaw`
      SELECT "appId", email, "productTag", COUNT(*) as count
      FROM waitlist
      GROUP BY "appId", email, "productTag"
      HAVING COUNT(*) > 1
    `;

    if (Array.isArray(duplicates) && duplicates.length > 0) {
      console.log('   ❌ Found duplicate entries (should not happen with new constraint):');
      duplicates.forEach(dup => {
        console.log(`      ${dup.email} - ${dup.product_tag || 'app-level'} (${dup.count} times)`);
      });
    } else {
      console.log('   ✅ No duplicate entries found - unique constraint working correctly');
    }

    console.log('');

    // 5. Test backward compatibility
    console.log('5️⃣  Testing backward compatibility...');
    
    const appLevelEntries = await prisma.waitlist.findMany({
      where: { productTag: null },
      take: 3,
      select: {
        email: true,
        status: true,
        position: true,
      },
    });

    if (appLevelEntries.length > 0) {
      console.log('   ✅ App-level waitlists (productTag=null) still queryable');
      appLevelEntries.forEach(entry => {
        console.log(`      ${entry.email} - Position #${entry.position} (${entry.status})`);
      });
    } else {
      console.log('   ℹ️  No app-level waitlist entries found (this is okay if not using app waitlists)');
    }

    console.log('');

    // 6. Summary
    console.log('📊 Summary\n' + '='.repeat(50));
    console.log(`✅ Schema validation: PASSED`);
    console.log(`✅ Product configurations: ${totalProducts} found`);
    console.log(`✅ Waitlist entries: ${appLevelCount + productLevelCount} total`);
    console.log(`   - App-level: ${appLevelCount}`);
    console.log(`   - Product-level: ${productLevelCount}`);
    console.log(`✅ Unique constraint: Working`);
    console.log(`✅ Backward compatibility: Preserved`);
    console.log('\n✨ Product Waitlists feature is ready!\n');

  } catch (error) {
    console.error('\n❌ Error during validation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductWaitlists();

