import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { config } from 'dotenv';

export default function globalSetup() {
  const rootDir = resolve(import.meta.dirname, '../..');

  config({ path: resolve(rootDir, '.env.test') });

  execSync('npx prisma migrate deploy', {
    cwd: rootDir,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });
}
