import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf-8')
);

export default defineConfig({
  // Browser-only entry (excludes server-side code)
  entry: ['src/browser.ts'],
  
  // IIFE format for browser (self-executing)
  format: ['iife'],
  
  // Global variable name: window.GrowthKit
  globalName: 'GrowthKit',
  
  // Output directory
  outDir: 'dist',
  
  // Output file name and extension
  outExtension: () => ({ js: '.umd.js' }),
  
  // Override entry name to get bundle.umd.js instead of browser.umd.js
  esbuildOptions(options) {
    options.entryNames = 'bundle';
    options.banner = {
      js: `/* GrowthKit SDK v${packageJson.version} - Auto-Update Enabled */`,
    };
  },
  
  // Minify for production
  minify: true,
  
  // No source maps for production bundle
  sourcemap: false,
  
  // No code splitting (single bundle)
  splitting: false,
  
  // Bundle ALL dependencies (self-contained)
  noExternal: [
    'react',
    'react-dom',
    '@fingerprintjs/fingerprintjs',
    'jsonwebtoken',
  ],
  
  // Inject SDK version as compile-time constant
  define: {
    '__SDK_VERSION__': JSON.stringify(packageJson.version),
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  
  // Platform: browser
  platform: 'browser',
  
  // Target modern browsers
  target: 'es2020',
  
  // Clean output before build
  clean: false, // Handled by npm script
});

