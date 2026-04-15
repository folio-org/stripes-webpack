// Vite Express Server for development with custom middleware support
// This replaces webpack's serve.js functionality

import express from 'express';
import cors from 'cors';
import connectHistoryApiFallback from 'connect-history-api-fallback';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createDevServer(stripesConfig = {}, options = {}) {
  const app = express();
  const port = options.port || process.env.STRIPES_PORT || 3000;
  const host = options.host || process.env.STRIPES_HOST || 'localhost';

  // Validate config
  if (typeof stripesConfig.okapi !== 'object') {
    throw new Error('Missing Okapi config');
  }
  if (typeof stripesConfig.okapi.url !== 'string') {
    throw new Error('Missing Okapi URL');
  }
  if (stripesConfig.okapi.url.endsWith('/')) {
    throw new Error('Trailing slash in Okapi URL will prevent Stripes from functioning');
  }

  // Middleware setup
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(cors());

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Use Vite's transform middleware
  app.use(vite.middlewares);

  // History API fallback for SPA routing
  app.use(connectHistoryApiFallback());

  // Serve static files
  const serverRoot = path.join(__dirname, '..');
  const publicDir = path.join(serverRoot, 'public');
  app.use(express.static(publicDir));

  // Serve compiled assets with proper cache headers
  app.use('/assets', express.static(path.join(serverRoot, 'dist', 'assets'), {
    immutable: true,
    maxAge: '1y',
  }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return new Promise((resolve) => {
    const server = app.listen(port, host, () => {
      console.log(`Stripes dev server running at http://${host}:${port}`);
      resolve({
        app,
        server,
        vite,
        port,
        host,
      });
    });
  });
}

// CLI support for starting the dev server
if (import.meta.url === `file://${process.argv[1]}`) {
  // Basic stripes config
  const stripesConfig = {
    okapi: {
      url: process.env.OKAPI_URL || 'http://localhost:9130',
      tenant: process.env.OKAPI_TENANT || 'supertenant',
    },
    modules: {},
  };

  const options = {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
  };

  createDevServer(stripesConfig, options).catch(err => {
    console.error('Failed to start dev server:', err);
    process.exit(1);
  });
}

export default createDevServer;
