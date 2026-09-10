import { execFile } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * Derived Distance Estimate
 *
 * Method: RMS (Root Mean Square) signal level.
 * Algorithm:
 *   1. Decode audio buffer to mono 16kHz float32 PCM via ffmpeg.
 *   2. Compute RMS: sqrt(sum(sample²) / N).
 *   3. Normalize to 0–1: min(1.0, rms / REFERENCE_RMS).
 *
 * Interpretation:
 *   - 1.0 = speaker very close to the microphone (loud signal)
 *   - 0.0 = speaker very far from the microphone (quiet signal)
 *
 * This is an estimate, not a physical distance measurement.
 * Annotators can override the computed value; the override is exported.
 */
const REFERENCE_RMS = 0.1; // reference level for normalization

export async function computeDistanceEstimate(
  buffer: Buffer,
): Promise<number | null> {
  const tmpPath = join(tmpdir(), `rms-${randomUUID()}.audio`);
  try {
    await writeFile(tmpPath, buffer);
    const pcm = await decodeToPcm(tmpPath);
    if (pcm.length === 0) return null;
    const rms = computeRms(pcm);
    return Math.min(1.0, rms / REFERENCE_RMS);
  } catch (err) {
    console.error('Distance estimate failed:', err);
    return null;
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

function decodeToPcm(inputPath: string): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      'ffmpeg',
      [
        '-i', inputPath,
        '-f', 'f32le',
        '-ac', '1',
        '-ar', '16000',
        '-v', 'error',
        'pipe:1',
      ],
      { maxBuffer: 100 * 1024 * 1024, encoding: 'buffer' as BufferEncoding },
      (err, stdout) => {
        if (err) {
          reject(err);
          return;
        }
        const buf = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
        const floatCount = buf.length / 4;
        const samples = new Float32Array(floatCount);
        for (let i = 0; i < floatCount; i++) {
          samples[i] = buf.readFloatLE(i * 4);
        }
        resolve(samples);
      },
    );

    child.stdin?.end();
  });
}

function computeRms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}
