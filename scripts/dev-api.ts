
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import generateHandler from '../api/ai/generate.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Mock Vercel request/response behavior for the handler
app.post('/api/ai/generate', async (req: Request, res: Response) => {
  console.log(`[Dev-API] POST /api/ai/generate`);

  // Minimal Vercel-like response object
  const vercelRes: any = {
    status: (code: number) => {
      res.status(code);
      return vercelRes;
    },
    json: (data: any) => res.json(data),
    setHeader: (name: string, value: string) => res.setHeader(name, value),
    write: (chunk: string) => res.write(chunk),
    end: () => res.end(),
    headersSent: false
  };

  // Update headersSent tracker
  const originalWrite = res.write.bind(res);
  res.write = (chunk: any) => {
    vercelRes.headersSent = true;
    return originalWrite(chunk);
  };

  try {
    await generateHandler(req as any, vercelRes);
  } catch (err) {
    console.error('[Dev-API] Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
});

// Simple ping testing
app.get('/api/ping', (req: Request, res: Response) => {
  res.send('pong');
});

const server = createServer(app);
server.listen(port, () => {
  console.log(`\x1b[32m[Dev-API] Local API server listening at http://localhost:${port}\x1b[0m`);
  console.log(`[Dev-API] Proxying /api/ai/generate -> api/ai/generate.ts`);
});
