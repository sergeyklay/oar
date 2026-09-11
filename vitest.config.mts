import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const ROOT_DIR = path.resolve(import.meta.dirname);

export default defineConfig({
  plugins: [react()],

  resolve: {
    // Mirrors the TypeScript path mapping `@/* -> ./*` at the repository root.
    alias: [{ find: /^@\//, replacement: `${ROOT_DIR}/` }],
  },

  test: {
    environment: 'jsdom',
    globals: false,
    clearMocks: true,
    css: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'actions/**/*.test.ts',
      'components/**/*.test.ts',
      'components/**/*.test.tsx',
      'lib/**/*.test.ts',
      '__tests__/**/*.test.ts',
    ],
    exclude: ['node_modules/**', '.next/**', 'coverage/**'],
    reporters: ['default', ['junit', { classnameTemplate: '{filepath}' }]],
    outputFile: {
      junit: './junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/__mocks__/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
