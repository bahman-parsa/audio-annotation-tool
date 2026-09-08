import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import multer from 'multer';
import { upload } from '../controllers/upload.controller.js';
import { config } from '../config.js';

const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (_req, file, cb) => {
    const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, decoded.includes('\uFFFD') ? file.originalname : decoded);
  },
});
const uploadMiddleware = multer({ storage });

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
