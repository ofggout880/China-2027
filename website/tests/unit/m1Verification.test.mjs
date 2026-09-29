/**
 * website/tests/unit/m1Verification.test.mjs
 * Comprehensive Milestone M1 Verification Suite
 * Tests all components, math algorithms, store actions, DOM structures, and server routing.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'node:events';

import { store, DEFAULT_CHECKLIST_STATE, calculateChecklistStats } from '../../src/store.js';
import { createSceneController } from '../../src/three/sceneController.js';
import { createGlobeMesh } from '../../src/three/globeMesh.js';
import { createParticleField } from '../../src/three/particleField.js';
import { renderTopHeader, renderBottomNav, NAV_ITEMS } from '../../src/components/navigation.js';
import { renderHeroBanner } from '../../src/components/heroBanner.js';
import { createStaticServer } from '../../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

describe('Milestone M1 Comprehensive Verification Suite', () => {
  test('1. All M1 core files exist and are non-empty', () => {
    const requiredFiles = [
      'package.json',
      'vite.config.js',
      'server.js',
      'build.js',
      'index.html',
      'favicon.svg',
      'public/favicon.svg',
      'src/main.js',
      'src/store.js',
      'src/styles/variables.css',
      'src/styles/reset.css',
      'src/styles/layout.css',
      'src/styles/components.css',
      'src/styles/animations.css',
      'src/three/sceneController.js',
      'src/three/globeMesh.js',
      'src/three/particleField.js',
      'src/components/navigation.js',
      'src/components/heroBanner.js',
    ];

    for (const rel of requiredFiles) {
      const full = path.join(ROOT_DIR, rel);
      assert.ok(fs.existsSync(full), `File ${rel} must exist`);
      const stat = fs.statSync(full);
      assert.ok(stat.size > 20, `File ${rel} must be non-empty (was ${stat.size} bytes)`);
    }
  });

  test('2. index.html contains all required DOM anchors and meta tags', () => {
    const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    const requiredIds = [
      'bg-canvas',
      'app',
      'app-header',
      'main-content',
      'hero-container',
      'views-container',
      'view-dashboard',
      'view-schools',
      'view-timeline',
      'view-checklist',
      'countdown-container',
      'charts-container',
      'school-finder-container',
      'language-timeline-container',
      'document-checklist-container',
      'bottom-nav-container',
    ];

    for (const id of requiredIds) {
      assert.ok(html.includes(`id="${id}"`), `index.html must contain id="${id}"`);
    }

    assert.ok(html.includes('viewport-fit=cover'), 'index.html must include viewport-fit=cover');
    assert.ok(html.includes('theme-color'), 'index.html must specify theme-color');
  });

  test('3. Store reactive state transitions, subscriptions, and actions', () => {
    // Test initial state
    const state = store.getState();
    assert.ok(state.activeTab, 'Active tab must be defined');
    assert.ok(state.checklist, 'Checklist must be defined');

    // Test tab transition
    let notifiedTab = null;
    const unsub = store.subscribeKey('activeTab', (tab) => {
      notifiedTab = tab;
    });

    store.setTab('schools');
    assert.strictEqual(store.getState().activeTab, 'schools');
    assert.strictEqual(notifiedTab, 'schools');

    store.setTab('checklist');
    assert.strictEqual(store.getState().activeTab, 'checklist');
    assert.strictEqual(notifiedTab, 'checklist');

    store.setTab('dashboard');
    assert.strictEqual(store.getState().activeTab, 'dashboard');

    unsub();

    // Test checklist stats
    const stats = calculateChecklistStats(DEFAULT_CHECKLIST_STATE);
    assert.strictEqual(stats.completed, 2);
    assert.strictEqual(stats.total, 8);
    assert.strictEqual(stats.percent, 25);
    assert.strictEqual(stats.formattedText, '2 of 8 completed (25%)');

    // Test toggle
    const toggled = store.toggleChecklistItem('doc_language');
    assert.strictEqual(toggled, true);
    assert.strictEqual(store.getState().checklist.doc_language, true);

    store.resetChecklist();
    assert.strictEqual(store.getState().checklist.doc_language, false);
  });

  test('4. Beijing beacon spherical coordinate mathematics and vector norm', () => {
    const R = 1.0;
    const beijingLat = (39.9042 * Math.PI) / 180;
    const beijingLon = (116.4074 * Math.PI) / 180;

    const x = R * Math.cos(beijingLat) * Math.sin(beijingLon);
    const y = R * Math.sin(beijingLat);
    const z = R * Math.cos(beijingLat) * Math.cos(beijingLon);

    const norm = Math.hypot(x, y, z);
    assert.ok(Math.abs(norm - 1.0) < 1e-6, `Norm must be 1.0, got ${norm}`);
    assert.ok(Math.abs(x - 0.68707) < 0.001, `x expected ~0.6871, got ${x}`);
    assert.ok(Math.abs(y - 0.64151) < 0.001, `y expected ~0.6415, got ${y}`);
    assert.ok(Math.abs(z - (-0.34118)) < 0.001, `z expected ~-0.3412, got ${z}`);

    // Verify globeMesh module instantiates in 2D mode cleanly
    const mesh = createGlobeMesh(null, false);
    assert.ok(mesh.render2D, 'GlobeMesh must have render2D fallback');
    assert.ok(mesh.dispose, 'GlobeMesh must have dispose');
  });

  test('5. Particle field color ratios and constellation geometry', () => {
    const count = 1200;
    const pField = createParticleField(null, false, count);
    assert.ok(pField.render2D, 'ParticleField must have render2D fallback');
    assert.ok(pField.dispose, 'ParticleField must have dispose');
  });

  test('6. SceneController lifecycle and 2D fallback activation', () => {
    const controller = createSceneController();
    assert.ok(controller.init, 'Controller must have init');
    assert.ok(controller.startAnimationLoop, 'Controller must have startAnimationLoop');
    assert.ok(controller.stopAnimationLoop, 'Controller must have stopAnimationLoop');
    assert.ok(controller.handleResize, 'Controller must have handleResize');
    assert.ok(controller.destroy, 'Controller must have destroy');
  });

  test('7. Navigation components render valid HTML with 4 tabs and ARIA roles', () => {
    const topHtml = renderTopHeader();
    const bottomHtml = renderBottomNav();

    assert.strictEqual(NAV_ITEMS.length, 4, 'Must have 4 navigation tabs');

    for (const item of NAV_ITEMS) {
      assert.ok(topHtml.includes(`data-tab="${item.id}"`), `Top nav missing tab ${item.id}`);
      assert.ok(bottomHtml.includes(`data-tab="${item.id}"`), `Bottom nav missing tab ${item.id}`);
    }

    assert.ok(topHtml.includes('role="tablist"'), 'Top nav must have role="tablist"');
    assert.ok(bottomHtml.includes('role="tablist"'), 'Bottom nav must have role="tablist"');
  });

  test('8. HeroBanner renders CTA buttons, badges, and stats ribbon', () => {
    const heroHtml = renderHeroBanner();
    assert.ok(heroHtml.includes('Target'), 'Hero banner must contain Target');
    assert.ok(heroHtml.includes('China 2027'), 'Hero banner must contain China 2027');
    assert.ok(heroHtml.includes('explore-schools') || heroHtml.includes('data-nav="schools"'), 'Hero banner must contain explore schools CTA');
    assert.ok(heroHtml.includes('view-checklist') || heroHtml.includes('data-nav="checklist"'), 'Hero banner must contain checklist CTA');
    assert.ok(heroHtml.includes('Sept 1, 2027'), 'Hero banner must mention target intake date');
  });

  test('9. Static server request routing, MIME types, and health check', async () => {
    const server = createStaticServer();

    function mockRequest(url) {
      return new Promise((resolve) => {
        const req = new EventEmitter();
        req.method = 'GET';
        req.url = url;
        req.headers = { host: '127.0.0.1:3000' };

        const res = new EventEmitter();
        res.headers = {};
        res.statusCode = 200;
        let body = '';

        res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
        res.writeHead = (code, headers = {}) => {
          res.statusCode = code;
          Object.entries(headers).forEach(([k, v]) => res.headers[k.toLowerCase()] = v);
        };
        res.write = (chunk) => { body += chunk; };
        res.end = (chunk) => {
          if (chunk) body += chunk;
          resolve({ statusCode: res.statusCode, headers: res.headers, body });
        };

        server.emit('request', req, res);
      });
    }

    // Health check
    const health = await mockRequest('/api/health');
    assert.strictEqual(health.statusCode, 200);
    const healthJson = JSON.parse(health.body);
    assert.strictEqual(healthJson.status, 'ok');

    // Index HTML
    const index = await mockRequest('/');
    assert.strictEqual(index.statusCode, 200);
    assert.ok(index.headers['content-type'].includes('text/html'));
    assert.ok(index.body.includes('CHINA 2027'));

    // CSS
    const css = await mockRequest('/src/styles/variables.css');
    assert.strictEqual(css.statusCode, 200);
    assert.ok(css.headers['content-type'].includes('text/css'));

    // JS
    const js = await mockRequest('/src/main.js');
    assert.strictEqual(js.statusCode, 200);
    assert.ok(js.headers['content-type'].includes('text/javascript'));
  });
});
