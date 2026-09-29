/**
 * website/tests/helpers/testUtils.js
 * Shared Utilities for Tier 3 & Tier 4 E2E Browser Testing
 * Includes:
 * - Server detection, health polling, and fallback server spawner
 * - Chromium launch options with macOS Apple Silicon sandbox bypass
 * - DOM inspection, color parsing, and WCAG AA contrast calculation
 */

import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEBSITE_ROOT = path.resolve(__dirname, '../../');

/**
 * macOS Chromium Sandbox Bypass Launch Arguments
 * Eliminates the MachPort rendezvous permission denied crash in Apple Silicon sandbox.
 */
export const CHROMIUM_MACOS_ARGS = [
  '--single-process',          // Crucial on macOS sandbox to avoid MachPort IPC crash
  '--no-sandbox',              // Disable Chromium sandbox in restricted runner
  '--disable-setuid-sandbox',
  '--enable-webgl',            // Enable WebGL/WebGL2
  '--use-gl=angle',            // Route GL calls via ANGLE
  '--use-angle=metal',         // Metal hardware backend on Apple Silicon
  '--disable-dev-shm-usage',
  '--disable-gpu-watchdog',
  '--mute-audio',
];

/**
 * Check if a TCP port is open and listening
 */
export function isPortListening(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

/**
 * Poll an HTTP URL until it returns 200 OK or timeout
 */
export function waitForHttpServer(url, timeoutMs = 25000, intervalMs = 300) {
  const parsed = new URL(url);
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.request(
        {
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.pathname || '/',
          method: 'GET',
          timeout: 1000,
        },
        (res) => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve(true);
          } else if (Date.now() - startTime >= timeoutMs) {
            reject(new Error(`Server returned HTTP ${res.statusCode} after ${timeoutMs}ms at ${url}`));
          } else {
            setTimeout(check, intervalMs);
          }
        }
      );

      req.on('error', () => {
        if (Date.now() - startTime >= timeoutMs) {
          reject(new Error(`Timed out waiting for server at ${url} after ${timeoutMs}ms`));
        } else {
          setTimeout(check, intervalMs);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (Date.now() - startTime >= timeoutMs) {
          reject(new Error(`Connection timed out waiting for server at ${url}`));
        } else {
          setTimeout(check, intervalMs);
        }
      });

      req.end();
    };

    check();
  });
}

/**
 * Starts a fallback static server using Node.js built-ins if no server is running
 */
export function startStaticFallbackServer(port = 3000, rootDir = WEBSITE_ROOT) {
  const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') {
      reqPath = '/index.html';
    }

    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(rootDir, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      });

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => {
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });

    server.on('error', (err) => reject(err));
  });
}

/**
 * Auto-detects running server (5173, 4173, 3000) or starts server
 */
export async function ensureServerReady() {
  const candidatePorts = [5173, 4173, 3000];

  for (const port of candidatePorts) {
    const isListening = await isPortListening(port);
    if (isListening) {
      const url = `http://127.0.0.1:${port}`;
      try {
        await waitForHttpServer(url, 2000);
        console.log(`[INFO] Reusing active server at: ${url}`);
        return { url, stop: async () => {} };
      } catch {
        // Port responded to TCP but not HTTP, try next
      }
    }
  }

  // If server.js exists, spawn it
  const serverScript = path.join(WEBSITE_ROOT, 'server.js');
  if (fs.existsSync(serverScript)) {
    console.log('[INFO] Spawning Node static server from server.js on port 3000...');
    const proc = spawn('node', ['server.js'], {
      cwd: WEBSITE_ROOT,
      stdio: 'pipe',
      detached: false,
    });

    const url = 'http://127.0.0.1:3000';
    await waitForHttpServer(url, 15000);
    return {
      url,
      stop: async () => {
        proc.kill('SIGTERM');
      },
    };
  }

  // Otherwise start built-in Node fallback server
  console.log('[INFO] Starting built-in fallback HTTP server on port 3000...');
  const fallback = await startStaticFallbackServer(3000, WEBSITE_ROOT);
  return {
    url: fallback.url,
    stop: fallback.close,
  };
}

/**
 * Launch Chromium browser instance via Playwright with required flags
 */
export async function launchTestBrowser() {
  let pw;
  try {
    pw = await import('playwright');
  } catch {
    try {
      pw = await import('@playwright/test');
    } catch {
      throw new Error(
        'Playwright not found in node_modules. Please ensure @playwright/test is installed via "npm install".'
      );
    }
  }

  const chromium = pw.chromium;
  const browser = await chromium.launch({
    headless: true,
    args: CHROMIUM_MACOS_ARGS,
  });

  return browser;
}

/**
 * Calculate WCAG AA contrast ratio between two hex or rgb colors
 */
export function calculateContrastRatio(colorA, colorB) {
  function getLuminance(r, g, b) {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function parseRgb(colorStr) {
    if (colorStr.startsWith('#')) {
      let hex = colorStr.slice(1);
      if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
      const num = parseInt(hex, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }
    const match = colorStr.match(/\d+/g);
    if (match && match.length >= 3) {
      return match.slice(0, 3).map(Number);
    }
    return [0, 0, 0];
  }

  const rgb1 = parseRgb(colorA);
  const rgb2 = parseRgb(colorB);
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}
