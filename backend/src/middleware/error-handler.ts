import type { Request, Response, NextFunction } from "express";
import multer from "multer";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(200).json({ uploaded: 0, matched: 0, errors: ["file too large (max 100MB)"], unmatched: [] });
      return;
    }
    res.status(200).json({ uploaded: 0, matched: 0, errors: [err.message], unmatched: [] });
    return;
  }
  console.error("[Error]", err.message);
  res.status(500).json({ error: err.message ?? "Internal server error" });
}
