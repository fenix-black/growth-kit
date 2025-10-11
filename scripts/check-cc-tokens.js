#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCCTokens() {
  try {
    const ccApp = await prisma.app.findFirst({
      where: { name: { contains: 'canvas', mode: 'insensitive' } },
      select: { id: true, name: true },
    });

    // Check if there's a PUBLIC KEY for this app
    const publicKeys = await prisma.apiKey.findMany({
      where: {
        appId: ccApp.id,
        scope: 'public',
      },
      select: { keyHint: true, isActive: true, createdAt: true },
    });

    console.log(`\n${ccApp.name} - Public Keys: ${publicKeys.length}\n`);
    publicKeys.forEach(key => {
      console.log(`  ${key.keyHint}... (active: ${key.isActive})`);
    });

    // Check fingerprints created in last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentFps = await prisma.fingerprint.findMany({
      where: {
        appId: ccApp.id,
        createdAt: { gte: tenMinutesAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`\n\nRecent fingerprints (last 10 min): ${recentFps.length}\n`);
    recentFps.forEach(fp => {
      console.log(`  ${fp.fingerprint.substring(0, 20)}...`);
      console.log(`  Created: ${fp.createdAt.toISOString()}`);
      console.log('');
    });

    if (recentFps.length === 0) {
      console.log('❌ No new fingerprints created recently!');
      console.log('   This suggests the widget is reusing an old JWT token');
      console.log('   Clear localStorage AND cookies, then hard refresh');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCCTokens();
