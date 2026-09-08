import type { Request, Response } from 'express';
import {
  getAllItems,
  createTranscript,
  updateTranscript,
} from '../services/items.service.js';

export async function getItems(_req: Request, res: Response): Promise<void> {
  const items = await getAllItems();
  res.json({ items });
}

export async function createItemTranscript(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params.id as string;
  const body = req.body as Record<string, unknown>;
  const originalLabel = body.originalLabel;
  const rawPath = body.rawPath;

  if (typeof originalLabel !== 'string' || !originalLabel) {
    res.status(400).json({ error: 'originalLabel must be a non-empty string' });
    return;
  }

  if (typeof rawPath !== 'string' || !rawPath) {
    res.status(400).json({ error: 'rawPath must be a non-empty string' });
    return;
  }

  try {
    const transcript = await createTranscript(id, originalLabel, rawPath);
    res.status(201).json({ transcript });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else if (message.includes('already has a transcript')) {
      res.status(409).json({ error: message });
    } else {
      res.status(500).json({ error: message });
    }
  }
}

export async function updateItemTranscript(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params.id as string;
  const body = req.body as Record<string, unknown>;
  const correctedText = body.correctedText;
  const annotations = body.annotations;

  if (typeof correctedText !== 'string') {
    res.status(400).json({ error: 'correctedText must be a string' });
    return;
  }

  if (!Array.isArray(annotations)) {
    res.status(400).json({ error: 'annotations must be an array' });
    return;
  }

  try {
    const item = await updateTranscript(
      id,
      correctedText,
      annotations as Array<{
        id: string;
        transcriptId: string;
        startOffset: number;
        endOffset: number;
        startTime: number;
        endTime: number;
        text: string;
        type: string;
        attributes: Record<string, unknown>;
      }>,
    );
    res.json({ item });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else {
      res.status(500).json({ error: message });
    }
  }
}
