#!/usr/bin/env node
/**
 * Test SDK endpoints
 * Tests that /api/sdk/version and /api/sdk/latest/bundle.js are working correctly
 */

const SERVER_URL = process.env.SERVER_URL || 'https://growth.fenixblack.ai';

async function testVersionEndpoint() {
  console.log('\n🔍 Testing SDK version endpoint...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/sdk/version`);
    
    if (!response.ok) {
      console.error('❌ Version endpoint failed:', response.status, response.statusText);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Version endpoint response:', JSON.stringify(data, null, 2));
    
    // Validate response structure
    const required = ['version', 'buildHash', 'buildTime', 'fullVersion', 'bundleUrl'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required fields:', missing);
      return false;
    }
    
    console.log('✅ Version endpoint structure is valid');
    return true;
  } catch (error) {
    console.error('❌ Version endpoint error:', error.message);
    return false;
  }
}

async function testBundleEndpoint() {
  console.log('\n🔍 Testing SDK bundle endpoint...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/sdk/latest/bundle.js`);
    
    if (!response.ok) {
      console.error('❌ Bundle endpoint failed:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response:', text);
      return false;
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('javascript')) {
      console.error('❌ Unexpected content type:', contentType);
      return false;
    }
    
    const bundle = await response.text();
    const sizeKB = (bundle.length / 1024).toFixed(2);
    
    console.log('✅ Bundle endpoint response:');
    console.log(`   Size: ${sizeKB} KB`);
    console.log(`   Content-Type: ${contentType}`);
    console.log(`   Preview: ${bundle.substring(0, 100)}...`);
    
    // Check if it looks like valid JavaScript
    if (!bundle.includes('function') && !bundle.includes('const') && !bundle.includes('var')) {
      console.error('❌ Bundle does not look like valid JavaScript');
      return false;
    }
    
    console.log('✅ Bundle endpoint is serving valid JavaScript');
    return true;
  } catch (error) {
    console.error('❌ Bundle endpoint error:', error.message);
    return false;
  }
}

async function testCORS() {
  console.log('\n🔍 Testing CORS headers...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/sdk/version`, {
      method: 'OPTIONS',
    });
    
    const corsOrigin = response.headers.get('access-control-allow-origin');
    const corsMethods = response.headers.get('access-control-allow-methods');
    
    console.log('✅ CORS headers:');
    console.log(`   Access-Control-Allow-Origin: ${corsOrigin}`);
    console.log(`   Access-Control-Allow-Methods: ${corsMethods}`);
    
    if (corsOrigin !== '*') {
      console.warn('⚠️  CORS origin is not "*", may cause issues with CDN loading');
    }
    
    return true;
  } catch (error) {
    console.error('❌ CORS test error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing SDK Endpoints');
  console.log('Server:', SERVER_URL);
  
  const versionOk = await testVersionEndpoint();
  const bundleOk = await testBundleEndpoint();
  const corsOk = await testCORS();
  
  console.log('\n' + '='.repeat(50));
  if (versionOk && bundleOk && corsOk) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

main();

