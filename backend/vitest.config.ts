import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    globalSetup: './src/__tests__/global-setup.ts',
    env: {
      DATABASE_URL:
        'postgresql://postgres:T0scanianDEv!l@localhost:5433/ikim_annotation_db_test?schema=public',
    },
  },
});
