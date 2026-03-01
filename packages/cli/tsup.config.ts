import { cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  async onSuccess() {
    cpSync(
      join(__dirname, '..', 'review-components'),
      join(__dirname, 'dist', 'registry'),
      { recursive: true },
    );
    console.log('✓ Registry copied to dist/registry');
  },
});
