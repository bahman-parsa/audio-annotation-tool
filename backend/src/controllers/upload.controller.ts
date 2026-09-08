import type { Request, Response } from 'express';
import { processUnifiedUpload } from '../services/upload.service.js';

export async function upload(req: Request, res: Response): Promise<void> {
  const files = req.files as Express.Multer.File[] | undefined;
  const transcriptsJson = (req.body as Record<string, unknown>).transcripts as
    | string
    | undefined;

  if ((!files || files.length === 0) && !transcriptsJson) {
    res.status(400).json({ error: 'No files or transcripts provided' });
    return;
  }

  const result = await processUnifiedUpload(files ?? [], transcriptsJson);

  res.json(result);
}
