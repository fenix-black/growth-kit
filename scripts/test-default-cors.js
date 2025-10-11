#!/usr/bin/env node

/**
 * Test script for default CORS origins
 * Tests the new default allowed origins: localhost, 127.0.0.1, *.vusercontent.net
 */

// Simple test of the CORS matching logic
function testOriginMatching() {
  console.log('🧪 Testing Default CORS Origin Matching Logic\n');
  
  // Test cases
  const testCases = [
    // Localhost tests
    { origin: 'http://localhost:3000', expected: true, reason: 'localhost on port 3000' },
    { origin: 'http://localhost:8080', expected: true, reason: 'localhost on port 8080' },
    { origin: 'https://localhost:3000', expected: true, reason: 'localhost https on port 3000' },
    
    // 127.0.0.1 tests
    { origin: 'http://127.0.0.1:3000', expected: true, reason: '127.0.0.1 on port 3000' },
    { origin: 'http://127.0.0.1:5173', expected: true, reason: '127.0.0.1 on port 5173 (Vite)' },
    { origin: 'https://127.0.0.1:8443', expected: true, reason: '127.0.0.1 https on port 8443' },
    
    // Vercel v0 preview tests
    { origin: 'https://preview-fenixblack-landing-page-kzmncgg3bcjmojevq5o5.vusercontent.net', expected: true, reason: 'Vercel v0 preview site' },
    { origin: 'https://another-app-xyz123.vusercontent.net', expected: true, reason: 'Another Vercel v0 site' },
    { origin: 'https://test.vusercontent.net', expected: true, reason: 'vusercontent.net subdomain' },
    
    // Should NOT match
    { origin: 'https://example.com', expected: false, reason: 'Random domain (should be configured)' },
    { origin: 'https://malicious-vusercontent.net.evil.com', expected: false, reason: 'Malicious domain mimicking vusercontent' },
  ];
  
  // Simulate the isDefaultOriginAllowed logic
  function isDefaultOriginAllowed(origin) {
    try {
      const url = new URL(origin);
      const hostname = url.hostname;
      
      // Check localhost or 127.0.0.1 (any port)
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return true;
      }
      
      // Check wildcard patterns (e.g., *.vusercontent.net)
      const DEFAULT_ALLOWED_ORIGINS = ['*.vusercontent.net'];
      for (const pattern of DEFAULT_ALLOWED_ORIGINS) {
        if (pattern.startsWith('*.')) {
          const domain = pattern.slice(2);
          if (hostname.endsWith(domain)) {
            return true;
          }
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }
  
  // Run tests
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(({ origin, expected, reason }) => {
    const result = isDefaultOriginAllowed(origin);
    const status = result === expected ? '✅ PASS' : '❌ FAIL';
    
    if (result === expected) {
      passed++;
    } else {
      failed++;
    }
    
    console.log(`${status} - ${reason}`);
    console.log(`  Origin: ${origin}`);
    console.log(`  Expected: ${expected}, Got: ${result}\n`);
  });
  
  console.log('═'.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!\n');
    return true;
  } else {
    console.log('⚠️  Some tests failed!\n');
    return false;
  }
}

// Run tests
const success = testOriginMatching();
process.exit(success ? 0 : 1);

