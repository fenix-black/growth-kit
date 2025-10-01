#!/usr/bin/env node

/**
 * Test actual API response from /me endpoint
 * Usage: node scripts/test-api-response.js <appId> <apiKey>
 */

const https = require('https');
const http = require('http');

async function testApi(appId, apiKeyHint) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Get the app and API key
    const app = await prisma.app.findUnique({
      where: { id: appId },
      include: {
        apiKeys: {
          where: { 
            isActive: true,
            keyHint: apiKeyHint 
          },
        },
      },
    });

    if (!app) {
      console.error('❌ App not found');
      process.exit(1);
    }

    if (!app.apiKeys || app.apiKeys.length === 0) {
      console.error('❌ No matching API key found');
      console.log('\nAvailable API keys for this app:');
      const allKeys = await prisma.apiKey.findMany({
        where: { appId: app.id, isActive: true },
        select: { keyHint: true },
      });
      allKeys.forEach(k => console.log('  -', k.keyHint));
      process.exit(1);
    }

    // Get a test fingerprint
    let fingerprint = await prisma.fingerprint.findFirst({
      where: { appId: app.id },
    });

    if (!fingerprint) {
      fingerprint = await prisma.fingerprint.create({
        data: {
          appId: app.id,
          fingerprint: 'test-' + Date.now(),
        },
      });
    }

    console.log('\n📱 App:', app.name);
    console.log('🔑 API Key:', app.apiKeys[0].keyHint);
    console.log('👤 Test Fingerprint:', fingerprint.fingerprint.substring(0, 20) + '...');
    console.log('\n🌐 Testing API call to /v1/me...\n');

    // Make actual API call
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const url = new URL('/api/v1/me', apiUrl);
    
    const postData = JSON.stringify({
      fingerprint: fingerprint.fingerprint,
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-api-key': `gk_${app.apiKeys[0].keyHint}`, // Using hint for test - in real use need full key
      },
    };

    console.log('📤 Request URL:', url.href);
    console.log('📤 Request headers:', options.headers);
    
    // Note: This won't work without the full API key, just for demonstration
    console.log('\n⚠️  Note: This test requires the full API key, not just the hint');
    console.log('To test the actual response, check browser console logs or network tab\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const appId = process.argv[2];
const apiKeyHint = process.argv[3];

if (!appId) {
  console.log('Usage: node scripts/test-api-response.js <appId> [apiKeyHint]');
  process.exit(1);
}

testApi(appId, apiKeyHint);

