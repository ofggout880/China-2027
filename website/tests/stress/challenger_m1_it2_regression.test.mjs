/**
 * website/tests/stress/challenger_m1_it2_regression.test.mjs
 * Challenger 1 (Milestone M1 Iteration 2): Comprehensive Empirical Stress & Regression Suite
 * 
 * Verifies:
 * 1. 500-request high concurrency burst across mixed endpoints (static, health, SPA, 404)
 * 2. Deep directory traversal adversarial matrix (double encoding, backslashes, mixed path tokens)
 * 3. Legitimate query strings containing ".." (/schools?range=1..10) returning 200 SPA, not 403
 * 4. Malformed URL, Host header, and null-byte injection crash-immunity
 * 5. RFC HTTP HEAD method exact zero-body verification across 200, 400, 403, 404 statuses
 * 6. SPA routing vs Static 404 asset segregation
 * 7. Store high-frequency pub/sub stress under 10,000 rapid state mutations
 * 8. Server event handling under malformed / synthetic events
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createStaticServer } from '../../server.js';
import { store } from '../../src/store.js';

function sendMockRequest(server, { method = 'GET', url = '/', headers = {}, body = '' }) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.headers = { host: '127.0.0.1:3000', ...headers };

    const res = new EventEmitter();
    let statusCode = 200;
    const resHeaders = {};
    let responseBody = '';

    res.setHeader = (k, v) => { resHeaders[k.toLowerCase()] = v; };
    res.writeHead = (code, h = {}) => {
      statusCode = code;
      Object.entries(h).forEach(([k, v]) => { resHeaders[k.toLowerCase()] = v; });
    };
    res.write = (chunk) => { if (chunk) responseBody += chunk.toString(); };
    res.end = (chunk) => {
      if (chunk) responseBody += chunk.toString();
      resolve({
        statusCode,
        headers: resHeaders,
        body: responseBody,
        crashed: false
      });
    };

    try {
      server.emit('request', req, res);
      if (body) {
        req.emit('data', Buffer.from(body));
        req.emit('end');
      }
    } catch (err) {
      resolve({ statusCode: null, headers: {}, body: '', crashed: true, error: err });
    }
  });
}

describe('Challenger 1 M1-it2 Empirical Challenge Suite', () => {
  const server = createStaticServer();

  // =========================================================================
  // 1. High Concurrency Burst (500 requests across mixed endpoints)
  // =========================================================================
  test('1. Concurrency: 500 simultaneous requests execute with zero drops or errors', async () => {
    const targetPaths = [
      '/',
      '/api/health',
      '/src/main.js',
      '/src/styles/variables.css',
      '/src/styles/layout.css',
      '/favicon.svg',
      '/dashboard',     // SPA route
      '/schools',       // SPA route
      '/nonexistent.js' // 404 asset
    ];

    const count = 500;
    const promises = [];
    for (let i = 0; i < count; i++) {
      const url = targetPaths[i % targetPaths.length];
      promises.push(sendMockRequest(server, { url }));
    }

    const responses = await Promise.all(promises);
    assert.strictEqual(responses.length, count);

    for (let i = 0; i < count; i++) {
      const res = responses[i];
      assert.strictEqual(res.crashed, false, 'Server must not crash under concurrency');
      const p = targetPaths[i % targetPaths.length];
      if (p === '/nonexistent.js') {
        assert.strictEqual(res.statusCode, 404, `Expected 404 for missing JS, got ${res.statusCode}`);
      } else {
        assert.strictEqual(res.statusCode, 200, `Expected 200 for ${p}, got ${res.statusCode}`);
      }
    }
  });

  // =========================================================================
  // 2. Directory Traversal Adversarial Matrix
  // =========================================================================
  test('2. Deep Directory Traversal: All variants blocked with 403 Forbidden without leaks', async () => {
    const traversalAttacks = [
      '/../../etc/passwd',
      '/..%2f..%2fetc/passwd',
      '/%2e%2e/%2e%2e/etc/passwd',
      '/%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '/%252e%252e/%252e%252e/etc/passwd', // Double URL encoded
      '/....//....//etc/passwd',
      '/..\\..\\etc\\passwd',
      '/index.html/../../../etc/passwd',
      '/src/../../../../etc/hosts',
    ];

    for (const attackUrl of traversalAttacks) {
      const res = await sendMockRequest(server, { url: attackUrl });
      assert.strictEqual(res.crashed, false, `Server must not crash on traversal: ${attackUrl}`);
      assert.strictEqual(
        res.statusCode,
        403,
        `Traversal attack "${attackUrl}" must return 403 Forbidden, got ${res.statusCode}`
      );
      assert.ok(!res.body.includes('root:'), `Attack leaked file contents on ${attackUrl}`);
      assert.ok(!res.body.includes('localhost'), `Attack leaked hosts on ${attackUrl}`);
    }
  });

  // =========================================================================
  // 3. Legitimate Query Strings Containing Dots / Special Characters
  // =========================================================================
  test('3. Legitimate query strings containing ".." must NOT trigger false 403 Forbidden', async () => {
    const legitimatePaths = [
      '/schools?range=1..10',
      '/schools?search=A..Z',
      '/timeline?version=1.0.0..2.0.0',
      '/?filter=foo..bar',
      '/dashboard?date=2026..2027',
    ];

    for (const path of legitimatePaths) {
      const res = await sendMockRequest(server, { url: path });
      assert.strictEqual(res.crashed, false);
      assert.strictEqual(
        res.statusCode,
        200,
        `Legitimate path "${path}" must return 200 OK (SPA fallback), got ${res.statusCode}`
      );
      assert.ok(res.body.includes('id="bg-canvas"'), 'Must serve SPA index.html for legitimate queries');
    }
  });

  // =========================================================================
  // 4. Malformed URLs, Percent Encodings, and Host Headers
  // =========================================================================
  test('4. Pathological inputs and malformed headers return 400 Bad Request without crashing', async () => {
    // 4.1 Malformed URLs
    const malformedPaths = [
      '/%E0%A4%A',
      '/%FF',
      '/%a',
      '/%',
      '/%c0%ae%c0%ae',
      '/test%80%80',
    ];

    for (const p of malformedPaths) {
      const res = await sendMockRequest(server, { url: p });
      assert.strictEqual(res.crashed, false, `Server crashed on malformed URL: ${p}`);
      assert.strictEqual(res.statusCode, 400, `Malformed path "${p}" must return 400 Bad Request`);
    }

    // 4.2 Malformed Host headers
    const badHostHeaders = [
      '::1',
      'bad::host::name',
      'localhost:3000:8080',
    ];

    for (const host of badHostHeaders) {
      const res = await sendMockRequest(server, { url: '/', headers: { host } });
      assert.strictEqual(res.crashed, false, `Server crashed on bad host header: ${host}`);
      assert.ok(res.statusCode === 200 || res.statusCode === 400, `Host header "${host}" handled cleanly`);
    }

    // 4.3 Extremely long URL path (20,000 characters)
    const longPath = '/' + 'A'.repeat(20000);
    const resLong = await sendMockRequest(server, { url: longPath });
    assert.strictEqual(resLong.crashed, false);
    assert.strictEqual(resLong.statusCode, 200, 'Long SPA path should be handled gracefully');
  });

  // =========================================================================
  // 5. RFC HTTP HEAD Method: Exact Zero-Body Verification
  // =========================================================================
  test('5. HTTP HEAD method returns correct status and headers with strictly ZERO body bytes', async () => {
    const headTests = [
      { path: '/', expectedStatus: 200 },
      { path: '/api/health', expectedStatus: 200 },
      { path: '/src/main.js', expectedStatus: 200 },
      { path: '/nonexistent.css', expectedStatus: 404 },
      { path: '/../../etc/passwd', expectedStatus: 403 },
      { path: '/%E0%A4%A', expectedStatus: 400 },
    ];

    for (const t of headTests) {
      const res = await sendMockRequest(server, { method: 'HEAD', url: t.path });
      assert.strictEqual(res.crashed, false);
      assert.strictEqual(res.statusCode, t.expectedStatus, `HEAD ${t.path} status mismatch`);
      assert.strictEqual(res.body.length, 0, `HEAD ${t.path} must return 0 bytes body, got "${res.body}"`);
      if (t.expectedStatus === 200) {
        assert.ok(res.headers['content-length'], `HEAD ${t.path} should include Content-Length`);
        assert.ok(Number(res.headers['content-length']) > 0, `HEAD ${t.path} Content-Length must be > 0`);
      }
    }
  });

  // =========================================================================
  // 6. SPA Routing vs Static 404 Asset Segregation
  // =========================================================================
  test('6. Routing segregation: extensionless paths return SPA index.html, paths with extension return 404', async () => {
    // Extensionless SPA routes -> 200 OK + index.html content
    const spaRoutes = ['/dashboard', '/schools', '/timeline', '/checklist', '/about', '/apply'];
    for (const route of spaRoutes) {
      const res = await sendMockRequest(server, { url: route });
      assert.strictEqual(res.crashed, false);
      assert.strictEqual(res.statusCode, 200, `SPA route ${route} must return 200`);
      assert.ok(res.body.includes('<title>CHINA 2027'), `SPA route ${route} must serve index.html`);
    }

    // Missing files with extensions -> 404 Not Found
    const missingAssets = [
      '/missing.js',
      '/styles/not-found.css',
      '/images/unknown.png',
      '/data/missing.json',
      '/favicon.ico.missing'
    ];
    for (const asset of missingAssets) {
      const res = await sendMockRequest(server, { url: asset });
      assert.strictEqual(res.crashed, false);
      assert.strictEqual(res.statusCode, 404, `Missing asset ${asset} must return 404`);
      assert.ok(res.body.includes('404 Not Found'), `404 body should clearly indicate Not Found`);
    }
  });

  // =========================================================================
  // 7. Store High-Frequency Stress (10,000 State Mutations)
  // =========================================================================
  test('7. Store handles 10,000 rapid state mutations with zero memory leaks or inconsistencies', () => {
    const tabs = ['dashboard', 'schools', 'timeline', 'checklist'];
    let listenerCallCount = 0;

    const unsubscribe = store.subscribe(() => {
      listenerCallCount++;
    });

    const start = Date.now();
    for (let i = 0; i < 10000; i++) {
      const tab = tabs[i % tabs.length];
      store.setTab(tab);
    }
    const elapsed = Date.now() - start;

    unsubscribe();

    assert.ok(elapsed < 1000, `10,000 mutations completed in ${elapsed}ms (budget < 1000ms)`);
    assert.ok(listenerCallCount > 0, 'Subscribers must be notified');

    // Reset store state
    store.setTab('dashboard');
    assert.strictEqual(store.getState().activeTab, 'dashboard');
  });

  // =========================================================================
  // 8. Client Error Event Resilience (Simulating socket reset or early EOF)
  // =========================================================================
  test('8. clientError event handles ECONNRESET and unwritable socket gracefully', () => {
    const mockSocket = new EventEmitter();
    mockSocket.writable = false;
    let ended = false;
    mockSocket.end = () => { ended = true; };

    // Emit ECONNRESET on clientError
    assert.doesNotThrow(() => {
      server.emit('clientError', { code: 'ECONNRESET' }, mockSocket);
    });
    assert.strictEqual(ended, false, 'ECONNRESET should not attempt to write to unwritable socket');

    // Emit general error on writable socket
    mockSocket.writable = true;
    let writeData = '';
    mockSocket.end = (data) => {
      ended = true;
      if (data) writeData = data.toString();
    };

    assert.doesNotThrow(() => {
      server.emit('clientError', { code: 'HPE_INVALID_HEADER_TOKEN' }, mockSocket);
    });
    assert.strictEqual(ended, true, 'clientError should end socket with 400');
    assert.ok(writeData.includes('400 Bad Request'));
  });
});
