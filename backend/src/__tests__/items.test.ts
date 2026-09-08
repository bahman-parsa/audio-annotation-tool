import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { readdir, unlink } from 'node:fs/promises';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { createTestWavBuffer } from './helpers.js';

interface ListResponse {
  items: Array<{
    id: string;
    filename: string;
    duration: number;
    status: string;
    transcript: unknown;
  }>;
}

interface TranscriptResponse {
  transcript: {
    id: string;
    audioItemId: string;
    originalLabel: string;
    correctedText: string;
  };
}

interface ErrorResponse {
  error: string;
}

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

async function uploadAudio(filename: string): Promise<string> {
  const buffer = createTestWavBuffer(130);
  await request(app)
    .post('/api/upload')
    .attach('files', buffer, { filename });

  const item = await prisma.audioItem.findFirst({ where: { filename } });
  return item!.id;
}

beforeAll(async () => {
  await cleanupDb();
  await cleanupUploads();
});

afterAll(async () => {
  await cleanupDb();
  await cleanupUploads();
});

describe('GET /api/items', () => {
  it('returns list of audio items with transcripts', async () => {
    const filename = `list-${randomUUID()}.wav`;
    await uploadAudio(filename);

    const res = await request(app).get('/api/items');
    const body = res.body as ListResponse;

    expect(res.status).toBe(200);
    expect(body.items).toBeInstanceOf(Array);
    expect(body.items.length).toBeGreaterThanOrEqual(1);

    const item = body.items.find((i) => i.filename === filename);
    expect(item).toBeDefined();
    expect(item!.duration).toBeGreaterThan(0);
  });
});

describe('POST /api/items/:id/transcript', () => {
  it('creates a transcript for audio without one', async () => {
    const filename = `transcript-${randomUUID()}.wav`;
    const audioItemId = await uploadAudio(filename);

    const res = await request(app)
      .post(`/api/items/${audioItemId}/transcript`)
      .send({
        originalLabel: 'Arztbericht für Frau Schneider.',
        rawPath: '/some/path/file.mp3',
      });

    const body = res.body as TranscriptResponse;
    expect(res.status).toBe(201);
    expect(body.transcript).toBeDefined();
    expect(body.transcript.originalLabel).toBe('Arztbericht für Frau Schneider.');
    expect(body.transcript.correctedText).toBe('Arztbericht für Frau Schneider.');
    expect(body.transcript.audioItemId).toBe(audioItemId);
  });

  it('returns 404 for non-existent audio item', async () => {
    const res = await request(app)
      .post(`/api/items/${randomUUID()}/transcript`)
      .send({
        originalLabel: 'some text',
        rawPath: '/path/file.mp3',
      });

    const body = res.body as ErrorResponse;
    expect(res.status).toBe(404);
    expect(body.error).toContain('not found');
  });

  it('returns 409 if audio already has a transcript', async () => {
    const filename = `dup-transcript-${randomUUID()}.wav`;
    const audioItemId = await uploadAudio(filename);

    await request(app)
      .post(`/api/items/${audioItemId}/transcript`)
      .send({
        originalLabel: 'first transcript',
        rawPath: '/path/file.mp3',
      });

    const res = await request(app)
      .post(`/api/items/${audioItemId}/transcript`)
      .send({
        originalLabel: 'second transcript',
        rawPath: '/path/file.mp3',
      });

    const body = res.body as ErrorResponse;
    expect(res.status).toBe(409);
    expect(body.error).toContain('already has a transcript');
  });

  it('returns 400 if originalLabel is missing', async () => {
    const filename = `no-label-${randomUUID()}.wav`;
    const audioItemId = await uploadAudio(filename);

    const res = await request(app)
      .post(`/api/items/${audioItemId}/transcript`)
      .send({ rawPath: '/path/file.mp3' });

    const body = res.body as ErrorResponse;
    expect(res.status).toBe(400);
    expect(body.error).toContain('originalLabel');
  });

  it('returns 400 if rawPath is missing', async () => {
    const filename = `no-path-${randomUUID()}.wav`;
    const audioItemId = await uploadAudio(filename);

    const res = await request(app)
      .post(`/api/items/${audioItemId}/transcript`)
      .send({ originalLabel: 'some text' });

    const body = res.body as ErrorResponse;
    expect(res.status).toBe(400);
    expect(body.error).toContain('rawPath');
  });
});
