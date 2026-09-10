import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(import.meta.dirname, '.env.test'), override: true });

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    globalSetup: './src/__tests__/global-setup.ts',
  },
});
