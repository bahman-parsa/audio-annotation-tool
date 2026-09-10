import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import multer from 'multer';
import { upload } from '../controllers/upload.controller.js';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 100 },
});

const fixEncoding = (req: Request, _res: Response, next: NextFunction) => {
  if (req.files) {
    for (const file of req.files as Express.Multer.File[]) {
      const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8');
      if (!decoded.includes('\uFFFD')) {
        file.originalname = decoded;
      }
    }
  }
  next();
};

const router = Router();

router.post('/upload', uploadMiddleware.array('files'), fixEncoding, upload);

export default router;
