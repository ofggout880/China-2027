/**
 * website/tests/stress/tier5_store_server_adversarial.test.mjs
 * Tier 5 White-box Coverage Hardening: Directory, Timeline, Storage & Server
 * Challenger 2 Adversarial Stress Testing Suite
 *
 * Scope:
 * 1. School Finder: huge queries (100k chars), unicode homoglyphs, malformed data, 0-match restoration.
 * 2. HSK Timeline: missing/empty milestone fields, invalid levels, accordion idempotence, chip click resilience, mount listener leak verification.
 * 3. Document Checklist & Reactive Store: SecurityError / QuotaExceededError resilience, malformed/non-array JSON, prototype pollution immunity, listener unsubscription idempotence, reset listener duplication verification.
 * 4. Static Server: boundary path requests, malformed query strings, non-standard headers, unexpected HTTP methods (TRACE, PATCH, PUT, DELETE, OPTIONS, HEAD), content-type verification.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

// Imports from implementation modules
import {
  universitiesData
} from '../../src/data/universitiesData.js';

import {
  filterUniversities,
  normalizeText,
  renderUniversityCard,
  renderSchoolFinder,
  mountSchoolFinder
} from '../../src/components/schoolFinder.js';

import {
  hskMilestones,
  getHskSummary,
  getMilestoneById,
  getMilestonesByStatus
} from '../../src/data/hskMilestones.js';

import {
  renderMilestoneCard,
  renderLanguageTimeline,
  renderFilterChips,
  renderTimelineHero,
  mountLanguageTimeline
} from '../../src/components/languageTimeline.js';

import {
  store,
  getStoredChecklist,
  saveStoredChecklist,
  calculateChecklistStats,
  DEFAULT_CHECKLIST_STATE
} from '../../src/store.js';

import {
  ChecklistStore,
  InMemoryStorage,
  resolveStorage,
  renderChecklistItem,
  renderDocumentChecklist,
  setupChecklistEvents,
  mountDocumentChecklist
} from '../../src/components/documentChecklist.js';

import {
  createStaticServer
} from '../../server.js';

// =========================================================================
// Helper Mock for Server Requests
// =========================================================================
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
      resolve({ statusCode, headers: resHeaders, body, bodyLength: body.length, crashed: false });
    };

    try {
      server.emit('request', req, res);
    } catch (err) {
      resolve({ statusCode: null, error: err, crashed: true });
    }
  });
}

// =========================================================================
// 1. SCHOOL FINDER ADVERSARIAL STRESS SUITE
// =========================================================================
describe('Tier 5 Adversarial: School Finder Directory & Filtering Hardening', () => {

  test('1.1 Huge search query (100,000 characters) executes safely without stack overflow or timeout', () => {
    const hugeQuery = 'X'.repeat(100000);
    const start = performance.now();
    const result = filterUniversities(universitiesData, hugeQuery);
    const elapsed = performance.now() - start;

    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 0, 'Huge string of non-matching chars must return 0 results');
    assert.ok(elapsed < 100, `Huge search took ${elapsed.toFixed(2)}ms (must be <100ms)`);
  });

  test('1.2 Unicode special characters, null bytes, and emoji sequences in search query', () => {
    const adversarialQueries = [
      'Tsing\0hua',                 // Null byte injection
      '🎓 Tsinghua 🇨🇳',            // Emoji sequences
      '清华大学/Peking\\University', // Forward & back slashes
      '"><script>alert(1)</script>',// HTML injection
      '\' OR \'1\'=\'1',             // SQL injection payload
      'B\u030Ce\u030Cij\u030Ci\u030Cng', // Combining diacritical marks
      'عالم',                       // Arabic (RTL)
      'שלום',                       // Hebrew (RTL)
      '\u200B\u200C\u200D',         // Zero-width spaces
      '\r\n\t\b\f',                 // Control whitespace
    ];

    for (const q of adversarialQueries) {
      const res = filterUniversities(universitiesData, q);
      assert.ok(Array.isArray(res), `Failed to handle adversarial query: ${JSON.stringify(q)}`);
    }
  });

  test('1.3 Unicode homoglyphs and normalization analysis: full-width vs ASCII', () => {
    // Standard ASCII search
    const asciiRes = filterUniversities(universitiesData, 'tsinghua');
    assert.strictEqual(asciiRes.length, 1);

    // Full-width Latin letters: 'Ｔｓｉｎｇｈｕａ'
    const fullwidth = 'Ｔｓｉｎｇｈｕａ';
    const fullwidthNorm = normalizeText(fullwidth);
    const fullwidthRes = filterUniversities(universitiesData, fullwidth);

    // White-box finding: NFD does not fold full-width Latin letters to ASCII (NFKC would).
    // Test asserts exact actual behavior: normalizeText produces fullwidth lowercase
    assert.ok(fullwidthNorm.includes('ｔｓｉｎｇｈｕａ'));
    assert.strictEqual(fullwidthRes.length, 0, 'Fullwidth characters do not match ASCII names under NFD');
  });

  test('1.4 Active filter combinations resulting in 0 matches and clearing back to all 10', () => {
    // Filter combination that yields 0 matches: Harbin + Project 985 + "Medicine"
    const zeroResults = filterUniversities(universitiesData, 'Medicine', {
      city: 'Harbin',
      league: 'C9'
    });
    assert.strictEqual(zeroResults.length, 0, 'Should return 0 matches for non-existent intersection');

    // Clearing filters restores all 10 universities
    const restored = filterUniversities(universitiesData, '', { city: 'all', league: 'all' });
    assert.strictEqual(restored.length, 10, 'Clearing filters must restore all 10 universities');
  });

  test('1.5 Graceful degradation on malformed university data objects in filterUniversities', () => {
    const malformedList = [
      null,
      undefined,
      {},
      { name: 'Partial Univ' },
      { name: 12345, city: null, topPrograms: null, scholarships: 'not_an_array' },
      { name: 'Valid Univ', city: 'Beijing', league: 'C9', topPrograms: ['CS'], scholarships: ['CSC'] }
    ];

    // Should not throw TypeError on null, undefined, or malformed items
    const filtered = filterUniversities(malformedList, 'Valid');
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].name, 'Valid Univ');

    // Searching across malformed items with empty query filters out null/undefined objects
    const allValid = filterUniversities(malformedList, '');
    assert.strictEqual(allValid.length, 4, 'Should keep only valid object representations');
  });

  test('1.6 renderUniversityCard robustness against null or partial objects', () => {
    // Null argument returns empty string
    assert.strictEqual(renderUniversityCard(null), '');
    assert.strictEqual(renderUniversityCard(undefined), '');

    // Partial university object with minimal fields
    const partial = {
      id: 'test_u',
      name: 'Test University',
      nameZh: '测试大学',
      pinyin: 'Cèshì Dàxué',
      city: 'TestCity',
      province: 'TestProvince',
      rankQs: 99,
      rankThe: 99,
      league: 'C9 League',
      topPrograms: ['AI'],
      scholarships: ['CSC'],
      campusFeatures: 'Modern campus',
      website: 'https://test.edu'
    };
    const html = renderUniversityCard(partial);
    assert.ok(html.includes('data-university="test_u"'));
    assert.ok(html.includes('Test University'));
  });

  test('1.7 filterUniversities resilience with null/undefined filters and unexpected property types', () => {
    // Null and undefined filters
    assert.strictEqual(filterUniversities(universitiesData, '', null).length, 10);
    assert.strictEqual(filterUniversities(universitiesData, '', undefined).length, 10);
    assert.strictEqual(filterUniversities(universitiesData, '', 'not_an_object').length, 10);

    // Filters with non-string values
    const nonStringFilters = { city: 123, league: true, scholarship: [] };
    assert.doesNotThrow(() => filterUniversities(universitiesData, 'Beijing', nonStringFilters));
  });
});

// =========================================================================
// 2. HSK TIMELINE ADVERSARIAL STRESS SUITE
// =========================================================================
describe('Tier 5 Adversarial: Language Timeline & HSK Roadmap Hardening', () => {

  test('2.1 getHskSummary robustness with empty array and boundary inputs', () => {
    const emptySummary = getHskSummary([]);
    assert.strictEqual(emptySummary.totalMilestones, 0);
    assert.strictEqual(emptySummary.completedCount, 0);
    assert.strictEqual(emptySummary.inProgressLevel, 'None');
    assert.strictEqual(emptySummary.currentVocab, 0);
    assert.strictEqual(emptySummary.progressPercent, 0);
    assert.strictEqual(emptySummary.targetDeadline, '2027-09-01');

    // Default summary with official 6 milestones
    const defaultSummary = getHskSummary();
    assert.strictEqual(defaultSummary.totalMilestones, 6);
    assert.strictEqual(defaultSummary.completedCount, 1);
    assert.strictEqual(defaultSummary.inProgressLevel, 'HSK 2');
    assert.ok(defaultSummary.currentVocab > 0);
    assert.ok(defaultSummary.progressPercent > 0);
  });

  test('2.2 White-box vulnerability test: renderMilestoneCard crashes if level or counts are missing', () => {
    // Calling with empty object throws TypeError because of unguarded level.replace()
    assert.throws(
      () => renderMilestoneCard({}),
      /Cannot read properties of undefined/
    );

    // Calling with missing vocabCount/characterCount throws TypeError on toLocaleString()
    assert.throws(
      () => renderMilestoneCard({ id: 'hsk1', level: 'HSK 1', title: 'Test' }),
      /Cannot read properties of undefined/
    );

    // Calling with full valid milestone succeeds cleanly
    const validCard = renderMilestoneCard(hskMilestones[0]);
    assert.ok(validCard.includes('data-hsk="hsk1"'));
    assert.ok(validCard.includes('Beginner Phonetics'));
  });

  test('2.3 Accordion open/close idempotence (100 rapid state toggles)', () => {
    // Synthetic DOM elements for accordion test
    let isExpanded = false;
    const toggle = {
      attributes: { 'aria-expanded': 'false' },
      getAttribute(k) { return this.attributes[k]; },
      setAttribute(k, v) { this.attributes[k] = String(v); }
    };
    const drawer = {
      classes: new Set(),
      classList: {
        toggle(c, force) {
          if (force === undefined) {
            if (drawer.classes.has(c)) drawer.classes.delete(c);
            else drawer.classes.add(c);
          } else if (force) drawer.classes.add(c);
          else drawer.classes.delete(c);
        },
        contains(c) { return drawer.classes.has(c); }
      }
    };

    // Simulate 100 alternating clicks
    for (let i = 0; i < 100; i++) {
      const currentExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !currentExpanded ? 'true' : 'false');
      drawer.classList.toggle('is-open', !currentExpanded);

      const expected = (i % 2 === 0);
      assert.strictEqual(toggle.getAttribute('aria-expanded'), expected ? 'true' : 'false');
      assert.strictEqual(drawer.classList.contains('is-open'), expected);
    }
  });

  test('2.4 White-box vulnerability test: mountLanguageTimeline listener leak verification', () => {
    // Synthetic environment to verify listener accumulation
    globalThis.HTMLElement = class {};
    const mockContainer = new globalThis.HTMLElement();
    mockContainer.innerHTML = '';
    mockContainer.querySelectorAll = () => [];
    mockContainer.querySelector = () => null;
    mockContainer.addEventListener = () => {};

    // Record initial listener count
    const initialCount = store._keyListeners.get('selectedHskLevel')?.size || 0;

    // Mount 10 times consecutively (simulating tab switching)
    const MOUNTS = 10;
    for (let i = 0; i < MOUNTS; i++) {
      mountLanguageTimeline(mockContainer);
    }

    const afterCount = store._keyListeners.get('selectedHskLevel')?.size || 0;
    const leakedListeners = afterCount - initialCount;

    // Confirm that mountLanguageTimeline accumulated listeners without unregistering
    assert.strictEqual(
      leakedListeners,
      MOUNTS,
      `mountLanguageTimeline should be noted as accumulating ${MOUNTS} listeners without cleanup`
    );
  });

  test('2.5 getMilestoneById and getMilestonesByStatus edge cases', () => {
    // Non-existent IDs
    assert.strictEqual(getMilestoneById(''), null);
    assert.strictEqual(getMilestoneById(null), null);
    assert.strictEqual(getMilestoneById('hsk99'), null);

    // Case-insensitive ID lookup
    assert.ok(getMilestoneById('HSK1') !== null);
    assert.strictEqual(getMilestoneById('hsk1').id, 'hsk1');

    // Status filtering
    const completed = getMilestonesByStatus('completed');
    assert.strictEqual(completed.length, 1);
    const inProgress = getMilestonesByStatus('in-progress');
    assert.strictEqual(inProgress.length, 1);
    const upcoming = getMilestonesByStatus('upcoming');
    assert.strictEqual(upcoming.length, 4);
    const all = getMilestonesByStatus('all');
    assert.strictEqual(all.length, 6);
  });
});

// =========================================================================
// 3. DOCUMENT CHECKLIST & REACTIVE STORE ADVERSARIAL STRESS SUITE
// =========================================================================
describe('Tier 5 Adversarial: Document Checklist & Reactive Store Hardening', () => {

  test('3.1 LocalStorage SecurityError handling during read & write', () => {
    // Mock storage backend that throws SecurityError on all operations (private mode / sandboxed iframe)
    const restrictedStorage = {
      getItem() {
        const err = new Error('Access to localStorage is denied in restricted sandboxed contexts');
        err.name = 'SecurityError';
        throw err;
      },
      setItem() {
        const err = new Error('Access to localStorage is denied in restricted sandboxed contexts');
        err.name = 'SecurityError';
        throw err;
      }
    };

    const checklistStore = new ChecklistStore(undefined, restrictedStorage);
    // Should gracefully fall back to default completed items
    assert.strictEqual(checklistStore.isChecked('doc_passport'), true);
    assert.strictEqual(checklistStore.isChecked('doc_transcripts'), true);
    assert.strictEqual(checklistStore.isChecked('doc_language'), false);

    // Toggling should succeed in memory despite storage SecurityError
    const nextVal = checklistStore.toggle('doc_language');
    assert.strictEqual(nextVal, true);
    assert.strictEqual(checklistStore.isChecked('doc_language'), true);
  });

  test('3.2 LocalStorage QuotaExceededError during item toggle', () => {
    let writeAttempts = 0;
    const quotaStorage = {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) {
        writeAttempts++;
        const err = new Error('QuotaExceededError: DOM Exception 22');
        err.name = 'QuotaExceededError';
        err.code = 22;
        throw err;
      }
    };

    const checklistStore = new ChecklistStore(undefined, quotaStorage);
    // Toggle item -> save() encounters QuotaExceededError
    checklistStore.toggle('doc_passport');

    assert.ok(writeAttempts > 0, 'Should have attempted to write to storage');
    assert.strictEqual(checklistStore.isChecked('doc_passport'), false, 'In-memory state toggled correctly');
  });

  test('3.3 Corrupted JSON and non-array storage payloads resilience', () => {
    const testCases = [
      'NOT_VALID_JSON{{{',
      'null',
      '12345',
      '"just_a_string"',
      'true',
      'false',
      '{"unknown_key_999": true}', // missing expected keys
      '["__proto__", "constructor", "doc_passport"]' // prototype pollution payload
    ];

    for (const payload of testCases) {
      const mockStorage = {
        getItem() { return payload; },
        setItem() {}
      };
      const cs = new ChecklistStore(undefined, mockStorage);
      const summary = cs.getSummary();
      assert.ok(summary.total === 8, 'Total must always be 8');
      assert.ok(summary.percentage >= 0 && summary.percentage <= 100, 'Percentage must remain bounded [0, 100]');
    }

    // Verify global Object.prototype is unpolluted
    assert.strictEqual(({}).polluted, undefined);
  });

  test('3.4 High-concurrency rapid toggling (5,000 operations) maintains state integrity', () => {
    const memoryStorage = new InMemoryStorage();
    const cs = new ChecklistStore(undefined, memoryStorage);

    const start = performance.now();
    for (let i = 0; i < 5000; i++) {
      cs.toggle('doc_passport');
      cs.toggle('doc_transcripts');
    }
    const elapsed = performance.now() - start;

    assert.ok(elapsed < 200, `5,000 toggles completed in ${elapsed.toFixed(1)}ms (must be <200ms)`);
    // Even number of toggles leaves default completed items unchanged
    assert.strictEqual(cs.isChecked('doc_passport'), true);
    assert.strictEqual(cs.isChecked('doc_transcripts'), true);
  });

  test('3.5 Pub/Sub listener unsubscription idempotence and error isolation', () => {
    let callCount = 0;
    const unsub = store.subscribe(() => {
      callCount++;
    });

    store.setState({ schoolSearchQuery: 'test1' });
    assert.strictEqual(callCount, 1);

    // Unsubscribe
    unsub();
    // Calling unsubscribe multiple times must be safe (idempotent)
    assert.doesNotThrow(() => unsub());
    assert.doesNotThrow(() => unsub());

    store.setState({ schoolSearchQuery: 'test2' });
    assert.strictEqual(callCount, 1, 'Listener must not be called after unsubscription');
  });

  test('3.6 White-box vulnerability test: setupChecklistEvents listener accumulation on reset', () => {
    class MockContainer {
      constructor() {
        this.listeners = {};
        this.innerHTML = '';
      }
      addEventListener(event, fn) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(fn);
      }
      querySelector() { return null; }
      querySelectorAll() { return []; }
    }

    const testStore = new ChecklistStore();
    const testContainer = new MockContainer();

    setupChecklistEvents(testContainer, testStore);
    assert.strictEqual(testStore.listeners.size, 1, 'Initial store listener count is 1');
    assert.strictEqual(testContainer.listeners['click'].length, 1, 'Initial click listener count is 1');

    // Simulate clicking the reset button twice
    const resetEvent = {
      preventDefault() {},
      target: {
        closest(sel) {
          if (sel.includes('reset')) return { closest: () => true };
          return null;
        }
      }
    };

    // First reset click
    testContainer.listeners['click'][0](resetEvent);
    assert.strictEqual(testStore.listeners.size, 2, 'Store listeners accumulated to 2 after 1 reset click');
    assert.strictEqual(testContainer.listeners['click'].length, 2, 'Click listeners accumulated to 2 after 1 reset click');

    // Second reset click
    testContainer.listeners['click'][0](resetEvent);
    assert.strictEqual(testStore.listeners.size, 3, 'Store listeners accumulated to 3 after 2 reset clicks');
    assert.strictEqual(testContainer.listeners['click'].length, 3, 'Click listeners accumulated to 3 after 2 reset clicks');
  });

  test('3.7 calculateChecklistStats resilience against corrupted, null, or foreign states', () => {
    // Null / undefined state
    const nullStats = calculateChecklistStats(null);
    assert.strictEqual(nullStats.total, 8);
    assert.strictEqual(nullStats.completed, 0);
    assert.strictEqual(nullStats.percentage, 0);

    const undefinedStats = calculateChecklistStats(undefined);
    assert.strictEqual(undefinedStats.total, 8);
    assert.strictEqual(undefinedStats.completed, 0);

    // Foreign / unknown keys injected do not skew counts
    const pollutedState = {
      doc_passport: true,
      alien_key_1: true,
      alien_key_2: true,
      doc_transcripts: true
    };
    const pollutedStats = calculateChecklistStats(pollutedState);
    assert.strictEqual(pollutedStats.completed, 2, 'Only registered DEFAULT_CHECKLIST_STATE keys must be counted');
    assert.strictEqual(pollutedStats.total, 8);
    assert.strictEqual(pollutedStats.percentage, 25);
  });
});

// =========================================================================
// 4. STATIC SERVER ADVERSARIAL STRESS SUITE
// =========================================================================
describe('Tier 5 Adversarial: Static Server HTTP & Security Boundary Hardening', () => {
  const server = createStaticServer();

  test('4.1 Unexpected HTTP methods analysis (TRACE, PATCH, PUT, DELETE, OPTIONS, HEAD)', async () => {
    // OPTIONS must return 204 No Content
    const optRes = await sendMockRequest(server, { method: 'OPTIONS', url: '/' });
    assert.strictEqual(optRes.statusCode, 204);
    assert.strictEqual(optRes.bodyLength, 0);

    // HEAD on /api/health must return 200 with Content-Length and 0 body length
    const headHealth = await sendMockRequest(server, { method: 'HEAD', url: '/api/health' });
    assert.strictEqual(headHealth.statusCode, 200);
    assert.strictEqual(headHealth.bodyLength, 0);
    assert.ok(Number(headHealth.headers['content-length']) > 0);

    // HEAD on /index.html must return 200 with Content-Length and 0 body length
    const headIndex = await sendMockRequest(server, { method: 'HEAD', url: '/index.html' });
    assert.strictEqual(headIndex.statusCode, 200);
    assert.strictEqual(headIndex.bodyLength, 0);
    assert.ok(Number(headIndex.headers['content-length']) > 0);

    // White-box finding: TRACE, PATCH, PUT, DELETE are not rejected with 405 Method Not Allowed;
    // they fall through and serve the file with 200. We assert the exact server response.
    for (const method of ['TRACE', 'PATCH', 'PUT', 'DELETE']) {
      const res = await sendMockRequest(server, { method, url: '/index.html' });
      assert.strictEqual(res.crashed, false, `Server must not crash on method ${method}`);
      // Documenting actual behavior: serves 200 rather than 405 Method Not Allowed
      assert.strictEqual(res.statusCode, 200, `Method ${method} served file with 200`);
    }
  });

  test('4.2 Boundary path requests: /, //, /., SPA fallback, and 404 behavior', async () => {
    // Root serves index.html
    const rootRes = await sendMockRequest(server, { url: '/' });
    assert.strictEqual(rootRes.statusCode, 200);
    assert.ok(rootRes.body.includes('<!DOCTYPE html>'));

    // Protocol-relative double-slash URL '//' is rejected as malformed URL (400)
    const doubleSlash = await sendMockRequest(server, { url: '//' });
    assert.strictEqual(doubleSlash.statusCode, 400);

    // '/.' SPA fallback serves index.html
    const dotRes = await sendMockRequest(server, { url: '/.' });
    assert.strictEqual(dotRes.statusCode, 200);

    // Non-existent path without extension -> SPA fallback serves index.html
    const spaRes = await sendMockRequest(server, { url: '/random-spa-route' });
    assert.strictEqual(spaRes.statusCode, 200);
    assert.ok(spaRes.body.includes('<!DOCTYPE html>'));

    // Non-existent path WITH extension -> returns 404
    const notFoundRes = await sendMockRequest(server, { url: '/nonexistent-script.js' });
    assert.strictEqual(notFoundRes.statusCode, 404);
  });

  test('4.3 Malformed percent-encoding and null-byte rejection in paths', async () => {
    const malformedPaths = [
      '/%',
      '/%E0%A4%A',
      '/%FF',
      '/%00',
      '/index.html%00'
    ];

    for (const url of malformedPaths) {
      const res = await sendMockRequest(server, { url });
      assert.strictEqual(res.crashed, false, `Server must not crash on ${url}`);
      assert.strictEqual(res.statusCode, 400, `Expected 400 Bad Request for ${url}, got ${res.statusCode}`);
    }
  });

  test('4.4 Non-standard headers: missing host, IPv6 host, custom headers', async () => {
    // Missing host header
    const noHost = await sendMockRequest(server, { url: '/index.html', headers: { host: '' } });
    assert.strictEqual(noHost.crashed, false);
    assert.strictEqual(noHost.statusCode, 200);

    // IPv6 host header
    const ipv6Host = await sendMockRequest(server, { url: '/index.html', headers: { host: '[::1]:3000' } });
    assert.strictEqual(ipv6Host.crashed, false);
    assert.strictEqual(ipv6Host.statusCode, 200);

    // Custom tracking and proxy headers
    const customHeaders = await sendMockRequest(server, {
      url: '/index.html',
      headers: {
        'x-request-id': 'test-uuid-1234',
        'x-forwarded-proto': 'https',
        'x-custom-header': 'value@!#$%'
      }
    });
    assert.strictEqual(customHeaders.crashed, false);
    assert.strictEqual(customHeaders.statusCode, 200);
  });

  test('4.5 MIME types and security response headers audit', async () => {
    const assets = [
      { url: '/index.html', expectedType: 'text/html; charset=UTF-8' },
      { url: '/src/main.js', expectedType: 'text/javascript; charset=UTF-8' },
      { url: '/src/styles/variables.css', expectedType: 'text/css; charset=UTF-8' },
      { url: '/package.json', expectedType: 'application/json; charset=UTF-8' },
      { url: '/favicon.svg', expectedType: 'image/svg+xml' }
    ];

    for (const { url, expectedType } of assets) {
      const res = await sendMockRequest(server, { url });
      assert.strictEqual(res.statusCode, 200, `Asset ${url} should return 200`);
      assert.strictEqual(res.headers['content-type'], expectedType, `Incorrect MIME type for ${url}`);
      assert.strictEqual(res.headers['access-control-allow-origin'], '*');
      assert.strictEqual(res.headers['cache-control'], 'no-cache, no-store, must-revalidate');
    }
  });

  test('4.6 Query strings containing dots do not trigger false positive 403', async () => {
    // Legitimate query strings containing dots (e.g. search query or tracking parameter)
    const res = await sendMockRequest(server, { url: '/index.html?search=hello..world' });
    assert.strictEqual(res.statusCode, 200, 'Legitimate query string containing dots should return 200');
    assert.ok(res.body.includes('<!DOCTYPE html>'));
  });
});
