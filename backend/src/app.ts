import express from 'express';
import cors from 'cors';
import uploadRoutes from './routes/upload.routes.js';
import itemsRoutes from './routes/items.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { config } from './config.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api', uploadRoutes);
app.use('/api', itemsRoutes);

// Serve uploaded audio files
app.use('/uploads', express.static(config.uploadDir));

app.use(errorHandler);

export { app };
