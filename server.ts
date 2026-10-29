import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function executePythonEngine(payload: Record<string, unknown>): Promise<any> {
  return new Promise((resolve) => {
    const pyProcess = spawn('python3', [path.resolve(__dirname, 'py_engine.py')], {
      timeout: 8000,
    });

    let stdout = '';
    let stderr = '';

    pyProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pyProcess.on('close', (code) => {
      if (stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
          return;
        } catch {
          // Fall through
        }
      }
      resolve({
        success: false,
        error: stderr.trim() || (code !== 0 ? `Process exited with code ${code}` : 'No response from Python engine'),
      });
    });

    pyProcess.on('error', (err) => {
      resolve({
        success: false,
        error: `Python execution error: ${err.message}`,
      });
    });

    try {
      pyProcess.stdin.write(JSON.stringify(payload));
      pyProcess.stdin.end();
    } catch (err: any) {
      resolve({
        success: false,
        error: `Failed writing to Python process: ${err.message}`,
      });
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '2mb' }));

  // Health check
  app.get('/api/python/health', async (_req: Request, res: Response) => {
    const test = await executePythonEngine({ action: 'eval', code: '2 + 2' });
    res.json({ status: 'ok', pythonAvailable: test.success, engine: test });
  });

  // Evaluate single expression or assignment
  app.post('/api/python/eval', async (req: Request, res: Response) => {
    const { code, degMode, variables } = req.body;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, error: 'Code expression is required' });
      return;
    }
    const result = await executePythonEngine({
      action: 'eval',
      code,
      degMode: !!degMode,
      variables: variables || {},
    });
    res.json(result);
  });

  // Run multi-line Python script / REPL
  app.post('/api/python/run', async (req: Request, res: Response) => {
    const { code, degMode, variables } = req.body;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, error: 'Python code is required' });
      return;
    }
    const result = await executePythonEngine({
      action: 'run',
      code,
      degMode: !!degMode,
      variables: variables || {},
    });
    res.json(result);
  });

  // Plot function y = f(x)
  app.post('/api/python/plot', async (req: Request, res: Response) => {
    const { formula, xMin, xMax, samples } = req.body;
    const result = await executePythonEngine({
      action: 'plot',
      formula: formula || 'math.sin(x)',
      xMin: xMin !== undefined ? Number(xMin) : -10,
      xMax: xMax !== undefined ? Number(xMax) : 10,
      samples: samples !== undefined ? Number(samples) : 200,
    });
    res.json(result);
  });

  // Setup Vite in Dev or static in Prod
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PyCalc server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
