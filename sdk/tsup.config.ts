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
  {
    // Server-side utilities (Node.js compatible)
    entry: ['src/server.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    minify: true,
    splitting: false,
    sourcemap: true,
    clean: false,
  },
  {
    // Auto-middleware with zero config
    entry: ['src/auto-middleware.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    minify: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    external: ['next/server'],
  },
]);
