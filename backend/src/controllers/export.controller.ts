import type { Request, Response } from 'express';
import { getExportLines } from '../services/export.service.js';

export async function exportGoldStandard(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const lines = await getExportLines();
    const jsonl = lines.map((line) => JSON.stringify(line)).join('\n');

    res.setHeader('Content-Type', 'application/jsonl');
    res.setHeader('Content-Disposition', 'attachment; filename="gold-standard.jsonl"');
    res.send(jsonl);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}
