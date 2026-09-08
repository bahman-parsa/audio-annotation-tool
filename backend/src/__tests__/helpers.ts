import { randomUUID } from 'node:crypto';
import { mkdir, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { prisma } from '../lib/prisma.js';

const UPLOADS_DIR = join(process.cwd(), 'uploads');
const TEST_UPLOADS_DIR = join(UPLOADS_DIR, '__test__');

export async function ensureTestDir(): Promise<void> {
  await mkdir(TEST_UPLOADS_DIR, { recursive: true });
}

export async function cleanupDb(): Promise<void> {
  await prisma.annotation.deleteMany();
  await prisma.transcript.deleteMany();
  await prisma.audioItem.deleteMany();
}

export async function cleanupUploads(): Promise<void> {
  const entries = await readdir(TEST_UPLOADS_DIR).catch(() => []);
  for (const entry of entries) {
    await unlink(join(TEST_UPLOADS_DIR, entry)).catch(() => {});
  }
}

export function randomFilename(ext: string): string {
  return `${randomUUID()}.${ext}`;
}

export function createTestWavBuffer(durationSeconds: number): Buffer {
  const sampleRate = 44100;
  const channels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;

  const buf = Buffer.alloc(44 + dataSize);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(fileSize, 4);
  buf.write('WAVE', 8);

  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(channels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 30);
  buf.writeUInt16LE(bitsPerSample, 32);

  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  return buf;
}
