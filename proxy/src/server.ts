import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router as healthRouter } from './routes/health.js';
import { router as aiPatchRouter } from './routes/ai.patch.js';
import { router as aiStructRouter } from './routes/ai.struct.js';
import { router as aiUtilRouter } from './routes/ai.util.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Basic health
app.use('/health', healthRouter);

// AI routes
app.use('/ai/patch', aiPatchRouter);
app.use('/ai/struct', aiStructRouter);
app.use('/ai/util', aiUtilRouter);

const port = Number(process.env.PORT || 3001);

if (!process.env.OPENAI_API_KEY) {
  console.warn('[proxy] OPENAI_API_KEY is missing. AI routes will error until it is set.');
}

const server = app.listen(port, () => {
  console.log(`[proxy] listening on http://localhost:${port}`);
});

server.on('error', (err: any) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(`[proxy] Port ${port} is already in use. Set PORT or stop the other process.`);
    process.exit(1);
  }
  console.error('[proxy] Server error:', err?.message || err);
  process.exit(1);
});

export default app;


