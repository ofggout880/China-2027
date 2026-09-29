import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.mjs': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=UTF-8'
};

export function createStaticServer() {
  const server = http.createServer((req, res) => {
    // Enable CORS and disable aggressive caching for dev/testing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // 1. Defend against malformed Host headers and malformed URLs
    let parsedUrl;
    let pathname;
    try {
      const host = (req.headers && req.headers.host && !req.headers.host.includes('::') && req.headers.host.split(':').length <= 2)
        ? req.headers.host
        : '127.0.0.1';
      parsedUrl = new URL(req.url || '/', `http://${host}`);
      pathname = decodeURIComponent(parsedUrl.pathname);
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=UTF-8' });
      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end('400 Bad Request: Malformed URL or host header');
      }
      return;
    }

    // 2. Reject null byte injection
    if (pathname.includes('\0') || (req.url && req.url.includes('\0'))) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=UTF-8' });
      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end('400 Bad Request: Null bytes are prohibited');
      }
      return;
    }

    // 3. Health check endpoint (supports GET and HEAD)
    if (pathname === '/api/health') {
      const healthData = JSON.stringify({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
      });
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=UTF-8',
        'Content-Length': Buffer.byteLength(healthData),
      });
      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end(healthData);
      }
      return;
    }

    // 4. Default route
    if (pathname === '/') {
      pathname = '/index.html';
    }

    // 5. Detect and block directory traversal attempts
    // Extract raw path component before query/hash to avoid false positives on legitimate query strings
    const rawPath = (req.url || '/').split('?')[0].split('#')[0];
    let decodedRawPath = rawPath;
    let doubleDecodedRawPath = rawPath;
    try {
      decodedRawPath = decodeURIComponent(rawPath);
      doubleDecodedRawPath = decodeURIComponent(decodedRawPath);
    } catch {}

    const isTraversal = rawPath.includes('..') ||
      decodedRawPath.includes('..') ||
      doubleDecodedRawPath.includes('..') ||
      pathname.includes('..');

    const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    const relativePath = safePath.replace(/^[/\\]+/, '');
    const filePath = path.resolve(ROOT_DIR, relativePath);

    // Prevent directory traversal outside ROOT_DIR
    if (isTraversal || (!filePath.startsWith(ROOT_DIR + path.sep) && filePath !== ROOT_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end('403 Forbidden: Access outside root directory is prohibited');
      }
      return;
    }

    fs.stat(filePath, (err, stats) => {
      // SPA Fallback: if file does not exist or is a directory, inspect extension
      if (err || !stats.isFile()) {
        const ext = path.extname(filePath);
        // Extensionless path -> serve client-side SPA index.html
        if (!ext || ext === '') {
          const indexPath = path.join(ROOT_DIR, 'index.html');
          return serveFile(indexPath, req.method, res);
        }

        // File WITH extension not found -> return standard 404
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        if (req.method === 'HEAD') {
          res.end();
        } else {
          res.end(`404 Not Found: ${pathname}`);
        }
        return;
      }

      serveFile(filePath, req.method, res);
    });
  });

  server.on('clientError', (err, socket) => {
    if (err.code === 'ECONNRESET' || !socket.writable) {
      return;
    }
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  return server;
}

function serveFile(filePath, method, res) {
  // Defensive argument check if invoked as serveFile(filePath, res)
  if (typeof method !== 'string' && method && typeof method.writeHead === 'function') {
    res = method;
    method = 'GET';
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  if (method === 'HEAD') {
    try {
      const stats = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size
      });
      res.end();
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end();
    }
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end(`500 Internal Server Error: ${err.message}`);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length
    });
    res.end(content);
  });
}

export function startServer(port = 3000, host = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    const server = createStaticServer();
    server.on('error', reject);
    server.listen(port, host, () => {
      console.log(`[CHINA 2027 Server] Running at http://${host}:${port}`);
      resolve(server);
    });
  });
}

// Auto-run if executed directly via CLI: `node server.js`
const isMain = process.argv[1] && (path.resolve(process.argv[1]) === path.resolve(__filename));
if (isMain) {
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || '127.0.0.1';

  startServer(PORT, HOST).then((server) => {
    const handleShutdown = (signal) => {
      console.log(`\n[CHINA 2027 Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[CHINA 2027 Server] Closed cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  }).catch((err) => {
    console.error('[CHINA 2027 Server] Failed to start:', err.message);
    process.exit(1);
  });
}
