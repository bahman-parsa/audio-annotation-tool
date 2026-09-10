import { parseBuffer } from 'music-metadata';
import { prisma } from '../lib/prisma.js';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from '../config.js';
import { computeDistanceEstimate } from '../lib/audio-analysis.js';

const ALLOWED_EXTENSIONS = ['.wav', '.mp3', '.m4a'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const AUTO_REJECT_THRESHOLD = 15; // seconds

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx === -1 ? '' : filename.slice(idx).toLowerCase();
}

function getFilenameFromPath(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/');
  return parts[parts.length - 1];
}

function validateFile(file: Express.Multer.File): {
  valid: boolean;
  error?: string;
} {
  const ext = getExtension(file.originalname);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `${file.originalname}: unsupported file type`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `${file.originalname}: file too large (max 100MB)`,
    };
  }
  return { valid: true };
}

async function extractMetadata(
  buffer: Buffer,
  mimeType: string,
): Promise<{
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number | null;
}> {
  const metadata = await parseBuffer(buffer, { mimeType });
  const format = metadata.format;

  return {
    duration: format.duration ?? 0,
    sampleRate: format.sampleRate ?? 0,
    channels: format.numberOfChannels ?? 0,
    bitDepth: format.bitsPerSample ?? null,
  };
}

async function checkDuplicate(filename: string): Promise<boolean> {
  const existing = await prisma.audioItem.findUnique({ where: { filename } });
  return existing !== null;
}

export interface TranscriptEntry {
  path: string;
  label: string;
}

export interface UploadResult {
  uploaded: number;
  matched: number;
  errors: string[];
  unmatched: string[];
}

export async function processUnifiedUpload(
  files: Express.Multer.File[],
  transcriptsJson: string | undefined,
): Promise<UploadResult> {
  const errors: string[] = [];
  const unmatched: string[] = [];
  let uploaded = 0;
  let matched = 0;

  // Track created audio items by filename for transcript pairing
  const createdAudioItems = new Map<string, string>(); // filename -> audioItemId

  // --- Step 1: Process audio files ---
  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.valid) {
      errors.push(validation.error!);
      continue;
    }

    const filename = file.originalname;

    if (await checkDuplicate(filename)) {
      errors.push(`${filename}: duplicate file`);
      continue;
    }

    try {
      const meta = await extractMetadata(file.buffer, file.mimetype);

      if (meta.duration < AUTO_REJECT_THRESHOLD) {
        errors.push(`${filename}: duration too short`);
        continue;
      }

      const filePath = join(config.uploadDir, filename);
      await writeFile(filePath, file.buffer);

      const distanceEstimate = await computeDistanceEstimate(file.buffer);

      const audioItem = await prisma.audioItem.create({
        data: {
          filename,
          filePath,
          duration: meta.duration,
          status: 'PENDING',
          sampleRate: meta.sampleRate,
          channels: meta.channels,
          bitDepth: meta.bitDepth,
          distanceEstimate,
        },
      });

      createdAudioItems.set(filename, audioItem.id);
      uploaded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${filename}: ${message}`);
    }
  }

  // --- Step 2: Process transcripts ---
  if (transcriptsJson) {
    let parsed: unknown[];
    try {
      parsed = JSON.parse(transcriptsJson) as unknown[];
    } catch {
      errors.push('Invalid transcript JSON: could not parse');
      return { uploaded, matched, errors, unmatched };
    }

    if (!Array.isArray(parsed)) {
      errors.push('Transcript JSON must be an array');
      return { uploaded, matched, errors, unmatched };
    }

    const seen = new Set<string>();

    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (!item || typeof item !== 'object') {
        errors.push(`Transcript at index ${i}: not an object`);
        continue;
      }

      const { path, label } = item as Record<string, unknown>;
      if (typeof path !== 'string' || !path) {
        errors.push(`Transcript at index ${i}: missing or invalid "path"`);
        continue;
      }
      if (typeof label !== 'string' || !label) {
        errors.push(`Transcript at index ${i}: missing or invalid "label"`);
        continue;
      }

      const filename = getFilenameFromPath(path);

      if (seen.has(filename)) {
        continue;
      }
      seen.add(filename);

      // Find audio item: first check newly uploaded, then existing in DB
      let audioItemId = createdAudioItems.get(filename);

      if (!audioItemId) {
        const existingItem = await prisma.audioItem.findUnique({
          where: { filename },
        });
        if (existingItem) {
          audioItemId = existingItem.id;
        }
      }

      if (!audioItemId) {
        errors.push(`${filename}: please add related audio to the transcript`);
        unmatched.push(path);
        continue;
      }

      // Upsert transcript
      const existingTranscript = await prisma.transcript.findUnique({
        where: { audioItemId },
      });

      if (existingTranscript) {
        await prisma.transcript.update({
          where: { id: existingTranscript.id },
          data: {
            originalLabel: label,
            correctedText: label,
            rawPath: path,
          },
        });
      } else {
        await prisma.transcript.create({
          data: {
            audioItemId,
            originalLabel: label,
            correctedText: label,
            rawPath: path,
          },
        });
      }

      await prisma.audioItem.update({
        where: { id: audioItemId },
        data: { status: 'NEW' },
      });

      matched++;
    }
  }

  return { uploaded, matched, errors, unmatched };
}
