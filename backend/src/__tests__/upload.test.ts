import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { readdir, unlink } from 'node:fs/promises';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import type { UploadResult } from '../services/upload.service.js';
import { createTestWavBuffer } from './helpers.js';

const UPLOADS_DIR = join(process.cwd(), 'uploads');

async function cleanupDb() {
  await prisma.annotation.deleteMany();
  await prisma.transcript.deleteMany();
  await prisma.audioItem.deleteMany();
}

async function cleanupUploads() {
  const entries = await readdir(UPLOADS_DIR).catch(() => []);
  for (const entry of entries) {
    if (entry === '.gitkeep') continue;
    await unlink(join(UPLOADS_DIR, entry)).catch(() => {});
  }
}

beforeAll(async () => {
  await cleanupDb();
  await cleanupUploads();
});

afterAll(async () => {
  await cleanupDb();
  await cleanupUploads();
});

describe('POST /api/upload', () => {
  describe('transcript validation', () => {
    it('returns error for invalid JSON string', async () => {
      const res = await request(app)
        .post('/api/upload')
        .field('transcripts', 'not valid json {');

      expect(res.status).toBe(200);
      const body = res.body as UploadResult;
      expect(body.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Invalid transcript JSON'),
        ]),
      );
    });

    it('returns error for JSON with missing path', async () => {
      const transcripts = JSON.stringify([{ label: 'some label' }]);

      const res = await request(app)
        .post('/api/upload')
        .field('transcripts', transcripts);

      expect(res.status).toBe(200);
      const body = res.body as UploadResult;
      expect(body.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('missing or invalid "path"'),
        ]),
      );
    });

    it('returns error for JSON with missing label', async () => {
      const transcripts = JSON.stringify([{ path: '/some/file.mp3' }]);

      const res = await request(app)
        .post('/api/upload')
        .field('transcripts', transcripts);

      expect(res.status).toBe(200);
      const body = res.body as UploadResult;
      expect(body.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('missing or invalid "label"'),
        ]),
      );
    });

    it('returns error for JSON object instead of array', async () => {
      const transcripts = JSON.stringify({ path: '/file.mp3', label: 'text' });

      const res = await request(app)
        .post('/api/upload')
        .field('transcripts', transcripts);

      expect(res.status).toBe(200);
      const body = res.body as UploadResult;
      expect(body.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Transcript JSON must be an array'),
        ]),
      );
    });
  });

  describe('transcript without matching audio', () => {
    it('reports missing audio for unmatched transcripts', async () => {
      const audio1 = `audio-a-${randomUUID()}.wav`;
      const audio2 = `audio-b-${randomUUID()}.wav`;
      const buffer = createTestWavBuffer(130);

      // Upload 2 audio files
      await request(app)
        .post('/api/upload')
        .attach('files', buffer, { filename: audio1 });
      await request(app)
        .post('/api/upload')
        .attach('files', buffer, { filename: audio2 });

      // Send transcripts for 4 files (2 uploaded + 2 missing)
      const transcripts = JSON.stringify([
        { path: audio1, label: 'first' },
        { path: audio2, label: 'second' },
        { path: `missing-c-${randomUUID()}.mp3`, label: 'third' },
        { path: `missing-d-${randomUUID()}.mp3`, label: 'fourth' },
      ]);

      const res = await request(app)
        .post('/api/upload')
        .field('transcripts', transcripts);

      const body = res.body as UploadResult;
      expect(body.matched).toBe(2);
      expect(body.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('please add related audio to the transcript'),
        ]),
      );
      expect(body.unmatched).toHaveLength(2);
    });
  });

  describe('file type validation', () => {
    const invalidExtensions = [
      '.txt',
      '.ogg',
      '.flac',
      '.exe',
      '.pdf',
      '.avi',
      '.zip',
    ];

    it.each(invalidExtensions)('3 - rejects %s files', async (ext) => {
      const res = await request(app)
        .post('/api/upload')
        .attach('files', Buffer.from('data'), {
          filename: `test-${randomUUID()}${ext}`,
        });

      expect(res.status).toBe(200);
      const body = res.body as UploadResult;
      expect(body.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('unsupported file type'),
        ]),
      );
    });
  });

  describe('file size validation', () => {
    it('rejects files exceeding 100MB', async () => {
      const largeBuffer = Buffer.alloc(100 * 1024 * 1024 + 1, 0);

      const res = await request(app)
        .post('/api/upload')
        .attach('files', largeBuffer, {
          filename: `large-${randomUUID()}.wav`,
        });

      expect(res.status).toBe(200);
      const body = res.body as UploadResult;
      expect(body.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('file too large')]),
      );
    });
  });

  describe('duplicate file validation', () => {
    it('rejects duplicate filenames', async () => {
      const filename = `dup-${randomUUID()}.wav`;
      const buffer = createTestWavBuffer(130);

      const res1 = await request(app)
        .post('/api/upload')
        .attach('files', buffer, { filename });

      expect(res1.status).toBe(200);
      const body1 = res1.body as UploadResult;
      expect(body1.uploaded).toBe(1);

      const res2 = await request(app)
        .post('/api/upload')
        .attach('files', buffer, { filename });

      expect(res2.status).toBe(200);
      const body2 = res2.body as UploadResult;
      expect(body2.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('duplicate file')]),
      );
    });
  });

  describe('audio duration extraction', () => {
    it('reads duration from audio file and saves to DB', async () => {
      const filename = `duration-${randomUUID()}.wav`;
      const buffer = createTestWavBuffer(130);

      const res = await request(app)
        .post('/api/upload')
        .attach('files', buffer, { filename });

      expect(res.status).toBe(200);
      const body = res.body as UploadResult;
      expect(body.uploaded).toBe(1);
      expect(body.errors).toHaveLength(0);

      const audioItem = await prisma.audioItem.findFirst({
        where: { filename },
      });
      expect(audioItem).not.toBeNull();
      expect(audioItem!.duration).toBeGreaterThan(0);
    });
  });

  describe('short audio file rejection', () => {
    it('rejects single file shorter than 15s', async () => {
      const filename = `short-${randomUUID()}.wav`;
      const buffer = createTestWavBuffer(20); // reports ~2.5s via music-metadata

      const res = await request(app)
        .post('/api/upload')
        .attach('files', buffer, { filename });

      expect(res.status).toBe(200);
      const body = res.body as UploadResult;
      expect(body.uploaded).toBe(0);
      expect(body.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('duration too short')]),
      );

      const audioItem = await prisma.audioItem.findFirst({
        where: { filename },
      });
      expect(audioItem).toBeNull();

      const fileExists = await readdir(UPLOADS_DIR)
        .then((entries) => entries.includes(filename))
        .catch(() => false);
      expect(fileExists).toBe(false);
    });

    it('rejects short files but saves valid ones', async () => {
      const shortFilename = `short-${randomUUID()}.wav`;
      const validFilename = `valid-${randomUUID()}.wav`;
      const shortBuffer = createTestWavBuffer(20); // reports ~2.5s
      const validBuffer = createTestWavBuffer(130); // reports ~16.25s

      const res1 = await request(app)
        .post('/api/upload')
        .attach('files', shortBuffer, { filename: shortFilename });

      const body1 = res1.body as UploadResult;
      expect(body1.uploaded).toBe(0);
      expect(body1.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('duration too short')]),
      );

      const shortItem = await prisma.audioItem.findFirst({
        where: { filename: shortFilename },
      });
      expect(shortItem).toBeNull();

      const res2 = await request(app)
        .post('/api/upload')
        .attach('files', validBuffer, { filename: validFilename });

      const body2 = res2.body as UploadResult;
      expect(body2.uploaded).toBe(1);
      expect(body2.errors).toHaveLength(0);

      const validItem = await prisma.audioItem.findFirst({
        where: { filename: validFilename },
      });
      expect(validItem).not.toBeNull();
      expect(validItem!.status).toBe('PENDING');
    });
  });
});
