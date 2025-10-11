// Test bot detection functionality
const { isbot } = require('isbot');

console.log('🤖 Testing Bot Detection\n');

const testCases = [
  // Vercel bots
  { ua: 'vercel-screenshot', expected: true, description: 'Vercel Screenshot' },
  { ua: 'Vercel Edge Functions', expected: true, description: 'Vercel Edge Functions' },
  
  // Common crawlers
  { ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', expected: true, description: 'Googlebot' },
  { ua: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', expected: true, description: 'Facebook Bot' },
  { ua: 'Twitterbot/1.0', expected: true, description: 'Twitter Bot' },
  
  // Monitoring services
  { ua: 'UptimeRobot/2.0', expected: true, description: 'Uptime Robot' },
  { ua: 'Pingdom.com_bot_version_1.4_(http://www.pingdom.com/)', expected: true, description: 'Pingdom' },
  
  // Headless browsers
  { ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/90.0.4430.212 Safari/537.36', expected: true, description: 'Headless Chrome' },
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36 Playwright', expected: false, description: 'Playwright (not detected by isbot)' },
  
  // Legitimate browsers - should NOT be detected as bots
  { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', expected: false, description: 'Chrome on Mac' },
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0', expected: false, description: 'Firefox on Windows' },
  { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', expected: false, description: 'Safari on iPhone' },
  { ua: null, expected: true, description: 'No User-Agent (suspicious)' },
  { ua: '', expected: true, description: 'Empty User-Agent (suspicious)' },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = test.ua ? isbot(test.ua) : true; // Our function treats null/empty as bot
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
  
  if (result === test.expected) {
    passed++;
  } else {
    failed++;
  }

  console.log(`Test ${index + 1}: ${test.description}`);
  console.log(`  Expected: ${test.expected ? 'Bot' : 'Human'}`);
  console.log(`  Got: ${result ? 'Bot' : 'Human'}`);
  console.log(`  ${status}\n`);
});

console.log('═══════════════════════════════════════');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed');
  process.exit(1);
}
