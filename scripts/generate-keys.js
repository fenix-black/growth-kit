#!/usr/bin/env node

const crypto = require('crypto');

// Generate secure random strings
const refSecret = crypto.randomBytes(32).toString('base64url');
const serviceKey = crypto.randomBytes(32).toString('base64url'); 
const adminPassword = crypto.randomBytes(16).toString('base64url');

console.log('🔐 Generated Secure Keys for GrowthKit');
console.log('=====================================\n');

console.log('Add these to your .env.local or .env file:\n');
console.log(`REF_SECRET=${refSecret}`);
console.log(`SERVICE_KEY=${serviceKey}`);
console.log(`ADMIN_USER=admin`);
console.log(`ADMIN_PASSWORD=${adminPassword}`);
console.log(`CORS_ALLOWLIST=http://localhost:3000,http://localhost:3001`);

console.log('\n📝 Note: Save these values securely!');
console.log('The REF_SECRET is used for HMAC tokens in the referral system.');
console.log('The SERVICE_KEY protects admin API endpoints.');
console.log('The ADMIN credentials are for the admin dashboard.\n');
