/**
 * website/tests/stress/server-500-concurrency.test.mjs
 * Challenger 2 Verification Harness:
 * 1. 500 simultaneous concurrent requests without dropping or crashing
 * 2. Zero-body verification for HEAD requests across 200, 400, 403, and 404 paths
 * 3. Traversal protection on extensionless and extension-bearing attack paths (must be 403)
 * 4. False-positive verification for legitimate query parameters containing '..'
 * 5. Robustness against malformed Host headers
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createStaticServer } from '../../server.js';

function sendMockRequest(server, { method = 'GET', url = '/', headers = {} }) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.headers = { host: '127.0.0.1:3000', ...headers };

    const res = new EventEmitter();
    let statusCode = 200;
    const resHeaders = {};
    let body = '';

    res.setHeader = (k, v) => { resHeaders[k.toLowerCase()] = v; };
    res.writeHead = (code, h = {}) => {
      statusCode = code;
      Object.entries(h).forEach(([k, v]) => { resHeaders[k.toLowerCase()] = v; });
    };
    res.write = (chunk) => { if (chunk) body += chunk.toString(); };
    res.end = (chunk) => {
      if (chunk) body += chunk.toString();
      resolve({ statusCode, headers: resHeaders, body, crashed: false });
    };

    try {
      server.emit('request', req, res);
    } catch (err) {
      resolve({ statusCode: null, error: err, crashed: true });
    }
  });
}

describe('Challenger 2 Empirical Verification: 500 Concurrency & Deep RFC Checks', () => {
  const server = createStaticServer();

  test('High concurrency: 500 simultaneous requests complete without drops or crashes', async () => {
    const endpoints = [
      '/',
      '/api/health',
      '/src/main.js',
      '/src/styles/variables.css',
      '/favicon.svg',
      '/index.html'
    ];
    const count = 500;
    const promises = [];

    for (let i = 0; i < count; i++) {
      const url = endpoints[i % endpoints.length];
      promises.push(sendMockRequest(server, { url }));
    }

    const results = await Promise.all(promises);
    assert.strictEqual(results.length, 500);
    let successCount = 0;
    for (const r of results) {
      assert.strictEqual(r.crashed, false, 'Server must not crash under 500 concurrency');
      assert.strictEqual(r.statusCode, 200, `Expected 200 for known asset, got ${r.statusCode}`);
      successCount++;
    }
    assert.strictEqual(successCount, 500, 'All 500 requests must succeed with 200 OK');
  });

  test('HEAD requests must strictly return empty body (0 bytes) across all response codes', async () => {
    // 200 OK static asset
    const headIndex = await sendMockRequest(server, { method: 'HEAD', url: '/index.html' });
    assert.strictEqual(headIndex.statusCode, 200);
    assert.strictEqual(headIndex.body, '', 'HEAD /index.html must have empty body');
    assert.ok(Number(headIndex.headers['content-length']) > 0, 'HEAD must provide content-length header');

    // 200 OK API endpoint
    const headApi = await sendMockRequest(server, { method: 'HEAD', url: '/api/health' });
    assert.strictEqual(headApi.statusCode, 200);
    assert.strictEqual(headApi.body, '', 'HEAD /api/health must have empty body');
    assert.ok(Number(headApi.headers['content-length']) > 0);

    // 400 Bad Request (malformed percent encoding)
    const head400 = await sendMockRequest(server, { method: 'HEAD', url: '/%E0%A4%A' });
    assert.strictEqual(head400.statusCode, 400);
    assert.strictEqual(head400.body, '', 'HEAD on 400 must have empty body');

    // 403 Forbidden (traversal)
    const head403 = await sendMockRequest(server, { method: 'HEAD', url: '/../../etc/passwd' });
    assert.strictEqual(head403.statusCode, 403);
    assert.strictEqual(head403.body, '', 'HEAD on 403 must have empty body');

    // 404 Not Found (missing file with extension)
    const head404 = await sendMockRequest(server, { method: 'HEAD', url: '/missing_asset.js' });
    assert.strictEqual(head404.statusCode, 404);
    assert.strictEqual(head404.body, '', 'HEAD on 404 must have empty body');
  });

  test('Directory traversal strictly returns 403 Forbidden for both extensionless and extension paths', async () => {
    const paths = [
      '/../../etc/passwd',
      '/../../etc/passwd.txt',
      '/..%2f..%2fetc/passwd',
      '/%2e%2e/%2e%2e/package.json',
      '/../../../../etc/shadow'
    ];
    for (const url of paths) {
      const res = await sendMockRequest(server, { url });
      assert.strictEqual(res.crashed, false);
      assert.strictEqual(res.statusCode, 403, `Traversal ${url} must return 403, got ${res.statusCode}`);
      assert.ok(!res.body.includes('root:'), `Traversal leaked /etc/passwd content`);
    }
  });

  test('Legitimate query strings containing ".." must not trigger false-positive 403', async () => {
    // In SPA applications, query parameters like range=1..10 or filter=a..b should not be blocked
    const res = await sendMockRequest(server, { url: '/schools?range=1..10' });
    assert.strictEqual(res.crashed, false);
    // Should serve index.html via SPA fallback (200 OK)
    assert.strictEqual(res.statusCode, 200, `Query string with '..' should return 200, got ${res.statusCode}`);
    assert.ok(res.body.includes('<!DOCTYPE html>') || res.body.includes('<html'), 'Should serve SPA index.html');
  });

  test('Malformed Host headers (IPv6 colons, junk) handled without unhandled exception', async () => {
    const res1 = await sendMockRequest(server, { url: '/', headers: { host: '::1:3000' } });
    assert.strictEqual(res1.crashed, false);
    assert.strictEqual(res1.statusCode, 200);

    const res2 = await sendMockRequest(server, { url: '/', headers: { host: 'invalid:host:name:extra' } });
    assert.strictEqual(res2.crashed, false);
    assert.strictEqual(res2.statusCode, 200);
  });
});
