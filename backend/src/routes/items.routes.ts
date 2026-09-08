import { Router } from 'express';
import {
  getItems,
  createItemTranscript,
  updateItemTranscript,
} from '../controllers/items.controller.js';

const router = Router();

router.get('/items', getItems);
router.post('/items/:id/transcript', createItemTranscript);
router.put('/items/:id/transcript', updateItemTranscript);

export default router;
