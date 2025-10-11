#!/usr/bin/env node

/**
 * Debug script for Creative Canvas token endpoint issues
 * This script tests the token endpoint with actual Creative Canvas app credentials
 */

// Use native fetch
const fetch = globalThis.fetch;

async function debugTokenEndpoint() {
  console.log('🔍 Debugging Creative Canvas Token Endpoint\n');

  const APP_CONFIG = {
    publicKey: process.env.TEST_PUBLIC_KEY || 'pk_YOUR_PUBLIC_KEY_HERE',
    appId: process.env.TEST_APP_ID || 'YOUR_APP_ID_HERE',
    domain: process.env.TEST_DOMAIN || 'your-domain.example.com',
    origin: process.env.TEST_ORIGIN || 'https://your-domain.example.com'
  };
  
  // Check if using placeholder values
  if (APP_CONFIG.publicKey === 'pk_YOUR_PUBLIC_KEY_HERE') {
    console.error('❌ Error: No public key provided!');
    console.log('\nUsage:');
    console.log('  TEST_PUBLIC_KEY=pk_xxx TEST_APP_ID=xxx node scripts/debug-token-endpoint.js');
    console.log('\nOr set environment variables:');
    console.log('  export TEST_PUBLIC_KEY=pk_xxx');
    console.log('  export TEST_APP_ID=xxx');
    process.exit(1);
  }

  console.log('📱 App Configuration:');
  console.log(`   Public Key: ${APP_CONFIG.publicKey}`);
  console.log(`   Domain: ${APP_CONFIG.domain}`);
  console.log(`   Origin: ${APP_CONFIG.origin}`);
  console.log('');

  // Test token endpoint
  const tokenUrl = 'https://growth.fenixblack.ai/api/public/auth/token';
  const testFingerprint = 'test_fingerprint_' + Date.now();

  console.log('🧪 Testing Token Endpoint:');
  console.log(`   URL: ${tokenUrl}`);
  console.log(`   Fingerprint: ${testFingerprint}`);
  console.log(`   Origin Header: ${APP_CONFIG.origin}`);
  console.log('');

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': APP_CONFIG.origin,
        'User-Agent': 'GrowthKit-Debug/1.0'
      },
      body: JSON.stringify({
        publicKey: APP_CONFIG.publicKey,
        fingerprint: testFingerprint,
        context: {
          browser: 'Chrome',
          device: 'Desktop',
          screen: { width: 1920, height: 1080 }
        }
      })
    });

    console.log('📊 Response Details:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
    console.log('');

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS - Token generated successfully!');
      console.log('   Full Response:', JSON.stringify(data, null, 2));
      
      // Extract data from possible nested structure
      const actualData = data.data || data;
      console.log(`   Token: ${actualData.token ? actualData.token.substring(0, 20) + '...' : 'N/A'}`);
      console.log(`   Expires At: ${actualData.expiresAt || 'N/A'}`);
      console.log(`   Fingerprint ID: ${actualData.fingerprintId || 'N/A'}`);
    } else {
      const errorText = await response.text();
      console.log('❌ FAILED - Token generation failed');
      console.log(`   Error Response: ${errorText}`);
      
      // Parse error if JSON
      try {
        const errorData = JSON.parse(errorText);
        console.log('   Parsed Error:', errorData);
      } catch (e) {
        console.log('   (Could not parse as JSON)');
      }
    }

  } catch (error) {
    console.error('💥 Network Error:', error.message);
  }

  console.log('\n' + '═'.repeat(60));

  // Also test preflight OPTIONS request
  console.log('\n🔍 Testing CORS Preflight (OPTIONS):');
  
  try {
    const optionsResponse = await fetch(tokenUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': APP_CONFIG.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    console.log('📊 Preflight Response:');
    console.log(`   Status: ${optionsResponse.status} ${optionsResponse.statusText}`);
    const corsHeaders = {
      'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers'),
      'Access-Control-Allow-Credentials': optionsResponse.headers.get('Access-Control-Allow-Credentials')
    };
    console.log('   CORS Headers:', corsHeaders);

    if (corsHeaders['Access-Control-Allow-Origin'] === APP_CONFIG.origin) {
      console.log('✅ CORS Preflight: PASS');
    } else {
      console.log('❌ CORS Preflight: FAIL');
    }

  } catch (error) {
    console.error('💥 Preflight Error:', error.message);
  }
}

debugTokenEndpoint();
