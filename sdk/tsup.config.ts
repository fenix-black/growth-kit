import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // Main entry (React components, hooks, etc.)
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    minify: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    external: ['react', 'react-dom'],
  },
  {
    // Edge Runtime compatible middleware
    entry: ['src/middleware.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    minify: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    // No React in middleware
    external: ['next/server'],
  },
  // Note: Server utilities are now handled by middleware
]);
