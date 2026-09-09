import { Router } from 'express';
import { exportGoldStandard } from '../controllers/export.controller.js';

const router = Router();

router.get('/export', exportGoldStandard);

export default router;
