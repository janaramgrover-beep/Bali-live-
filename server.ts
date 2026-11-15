import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Server-side M3U/M3U8 fetcher to bypass CORS restrictions on third-party IPTV playlists
  app.get('/api/fetch-m3u', async (req, res) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!rawUrl) {
      res.status(400).json({ error: 'Playlist URL is required.' });
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      res.status(400).json({ error: 'Invalid URL format.' });
      return;
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      res.status(400).json({ error: 'Only http:// and https:// URLs are supported.' });
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const customUa =
        typeof req.query.ua === 'string' && req.query.ua.trim()
          ? req.query.ua.trim().slice(0, 200)
          : 'BALINDER-LiveTV-Player/1.0';

      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': customUa,
          Accept: '*/*',
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        res.status(response.status).json({
          error: `Upstream server returned ${response.status} ${response.statusText}`,
        });
        return;
      }

      const content = await response.text();
      res.type('text/plain; charset=utf-8').send(content);
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'AbortError'
          ? 'Playlist request timed out after 15 seconds.'
          : err instanceof Error
            ? err.message
            : 'Failed to fetch playlist.';
      res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Live TV server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
