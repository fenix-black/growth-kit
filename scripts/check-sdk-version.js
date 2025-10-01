#!/usr/bin/env node

/**
 * Check which SDK version is installed
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking SDK Version...\n');

// Check package.json dependency
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const sdkDependency = packageJson.dependencies['@fenixblack/growthkit'];
console.log('Package.json dependency:', sdkDependency);

// Check installed version in node_modules
const sdkPackageJsonPath = path.join('./node_modules/@fenixblack/growthkit/package.json');
if (fs.existsSync(sdkPackageJsonPath)) {
  const sdkPackageJson = JSON.parse(fs.readFileSync(sdkPackageJsonPath, 'utf-8'));
  console.log('Installed version:', sdkPackageJson.version);
  
  // Check if AppBranding type exists in the built files
  const indexDtsPath = path.join('./node_modules/@fenixblack/growthkit/dist/index.d.ts');
  if (fs.existsSync(indexDtsPath)) {
    const indexDts = fs.readFileSync(indexDtsPath, 'utf-8');
    const hasAppBranding = indexDts.includes('AppBranding');
    const hasWaitlistLayout = indexDts.includes('waitlistLayout');
    
    console.log('\n📦 SDK Features:');
    console.log('  AppBranding type:', hasAppBranding ? '✅ Present' : '❌ Missing');
    console.log('  waitlistLayout support:', hasWaitlistLayout ? '✅ Present' : '❌ Missing');
    
    if (!hasAppBranding) {
      console.log('\n⚠️  SDK is missing branding features!');
      console.log('   This might be an old version or the local SDK needs to be built.');
    } else {
      console.log('\n✅ SDK has branding features');
    }
  }
  
  // Check if WaitlistForm has the new implementation
  const waitlistPath = path.join('./node_modules/@fenixblack/growthkit/dist/index.js');
  if (fs.existsSync(waitlistPath)) {
    const waitlistContent = fs.readFileSync(waitlistPath, 'utf-8');
    const hasLogoSupport = waitlistContent.includes('logoUrl');
    const hasLayoutSupport = waitlistContent.includes('waitlistLayout');
    
    console.log('\n🎨 WaitlistForm Implementation:');
    console.log('  Logo support:', hasLogoSupport ? '✅ Present' : '❌ Missing');
    console.log('  Layout support:', hasLayoutSupport ? '✅ Present' : '❌ Missing');
  }
  
} else {
  console.log('❌ SDK not found in node_modules');
  console.log('   Run: npm install');
}

console.log('');

