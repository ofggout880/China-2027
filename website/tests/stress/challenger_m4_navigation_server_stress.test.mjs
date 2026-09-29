/**
 * website/tests/stress/challenger_m4_navigation_server_stress.test.mjs
 * Challenger 2 (Milestone M4): Adversarial Stress Testing Suite
 *
 * Scope:
 * 1. Rapid View Switching Stress:
 *    - Rapid transitions (dashboard -> schools -> timeline -> checklist -> dashboard) over 100+ cycles
 *    - Verification of DOM consistency across transitions:
 *      * Dashboard view: all 4 panels have style.display = 'block', style.opacity = '1', .active class, no hidden attribute
 *      * Specific tab view: exactly one panel has .active, is visible, and non-target panels are hidden (display: none, opacity: 0, hidden attr)
 *    - Interaction delegation stress: click and keyboard triggers across desktop nav, mobile nav, brand logo, and hero CTA buttons
 *    - Eventual consistency and race condition immunity under asynchronous rapid dispatch
 *    - Boundary inputs and malformed tab IDs
 *
 * 2. Server Resilience Stress:
 *    - High concurrency (200+ and 500 simultaneous requests) against static assets, SPA routes, and health API
 *    - Adversarial Directory Traversal matrix under concurrency (double-encoded, Windows backslashes, mixed path tokens) returning 403
 *    - Null-Byte injection attack matrix under concurrency returning 400 Bad Request without crashing
 *    - Malformed URL & Percent-Encoding fuzzing under concurrency returning 400 Bad Request
 *    - Malformed Host Header fuzzing under concurrency
 *    - RFC HTTP HEAD method exact zero-body verification under concurrency
 *    - False-positive verification for legitimate query parameters with '..' under concurrency
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { store } from '../../src/store.js';
import {
  renderTopHeader,
  renderBottomNav,
  setupNavigationEvents,
  syncNavigationDOM,
  NAV_ITEMS
} from '../../src/components/navigation.js';
import { createStaticServer } from '../../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

// =========================================================================
// Synthetic DOM Infrastructure for Browser-Free In-Memory Stress Testing
// =========================================================================

class SyntheticClassList {
  constructor(className = '') {
    this._classes = new Set(className ? className.split(/\s+/).filter(Boolean) : []);
  }

  add(...classes) {
    for (const c of classes) {
      if (c) this._classes.add(c);
    }
  }

  remove(...classes) {
    for (const c of classes) {
      this._classes.delete(c);
    }
  }

  toggle(className, force) {
    if (force === undefined) {
      if (this._classes.has(className)) {
        this._classes.delete(className);
        return false;
      }
      this._classes.add(className);
      return true;
    }
    if (force) {
      this._classes.add(className);
      return true;
    }
    this._classes.delete(className);
    return false;
  }

  contains(className) {
    return this._classes.has(className);
  }

  get value() {
    return Array.from(this._classes).join(' ');
  }

  toString() {
    return this.value;
  }
}

class SyntheticElement {
  constructor(tagName = 'div', id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = new SyntheticClassList(className);
    this.style = {};
    this.dataset = {};
    this._attributes = new Map();
    this._listeners = new Map();
    this.children = [];
    this.parentElement = null;
    this._innerHTML = '';
    this.textContent = '';
    this.value = '';

    if (id) this._attributes.set('id', id);
    if (className) this._attributes.set('class', className);
  }

  setAttribute(name, val) {
    const strVal = String(val);
    this._attributes.set(name, strVal);
    if (name.startsWith('data-')) {
      const camel = name.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      this.dataset[camel] = strVal;
    }
    if (name === 'id') this.id = strVal;
    if (name === 'class') {
      this.className = strVal;
      this.classList = new SyntheticClassList(strVal);
    }
  }

  getAttribute(name) {
    return this._attributes.get(name) ?? null;
  }

  hasAttribute(name) {
    return this._attributes.has(name);
  }

  removeAttribute(name) {
    this._attributes.delete(name);
    if (name.startsWith('data-')) {
      const camel = name.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      delete this.dataset[camel];
    }
    if (name === 'class') {
      this.className = '';
      this.classList = new SyntheticClassList('');
    }
    if (name === 'id') this.id = '';
  }

  addEventListener(type, fn) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type).add(fn);
  }

  removeEventListener(type, fn) {
    const set = this._listeners.get(type);
    if (set) set.delete(fn);
  }

  dispatchEvent(event) {
    const ev = typeof event === 'string'
      ? { type: event, target: this, defaultPrevented: false }
      : event;
    if (!ev.target) ev.target = this;
    if (!ev.preventDefault) {
      ev.preventDefault = () => { ev.defaultPrevented = true; };
    }

    let current = this;
    while (current) {
      const handlers = current._listeners.get(ev.type);
      if (handlers) {
        for (const handler of Array.from(handlers)) {
          handler.call(current, ev);
        }
      }
      current = current.parentElement;
    }
    return !ev.defaultPrevented;
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this, defaultPrevented: false });
  }

  closest(selector) {
    const s = selector.trim();
    const selectors = s.split(',').map((x) => x.trim());

    const matchesSingle = (el, sel) => {
      if (!el) return false;
      if (sel.startsWith('.')) return el.classList.contains(sel.slice(1));
      if (sel.startsWith('#')) return el.id === sel.slice(1);
      if (sel.startsWith('[') && sel.endsWith(']')) {
        const attrExp = sel.slice(1, -1);
        if (attrExp.includes('=')) {
          const [k, v] = attrExp.split('=');
          const cleanVal = v.replace(/^["']|["']$/g, '');
          return el.getAttribute(k) === cleanVal;
        }
        return el.hasAttribute(attrExp);
      }
      return el.tagName && el.tagName.toLowerCase() === sel.toLowerCase();
    };

    let curr = this;
    while (curr) {
      for (const sel of selectors) {
        if (matchesSingle(curr, sel)) return curr;
      }
      curr = curr.parentElement;
    }
    return null;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  // Recursive flat traversal for querySelectorAll
  getAllDescendants() {
    const list = [];
    const traverse = (node) => {
      for (const child of node.children) {
        list.push(child);
        traverse(child);
      }
    };
    traverse(this);
    return list;
  }

  querySelectorAll(selector) {
    const rawSelectors = selector.split(',').map((s) => s.trim());
    const all = this.getAllDescendants();
    const resultSet = new Set();

    for (const sel of rawSelectors) {
      for (const el of all) {
        let match = true;
        // 1. Tag name if present
        const tagMatch = sel.match(/^([a-zA-Z0-9]+)/);
        if (tagMatch) {
          if (el.tagName.toLowerCase() !== tagMatch[1].toLowerCase()) {
            match = false;
          }
        }
        // 2. Class names
        const classMatches = sel.match(/\.([a-zA-Z0-9_-]+)/g);
        if (classMatches) {
          for (const cm of classMatches) {
            if (!el.classList.contains(cm.slice(1))) {
              match = false;
            }
          }
        }
        // 3. Attribute selectors
        const attrMatches = sel.match(/\[([a-zA-Z0-9_-]+)(?:=([^\]]+))?\]/g);
        if (attrMatches) {
          for (const am of attrMatches) {
            const inner = am.slice(1, -1);
            if (inner.includes('=')) {
              const [k, v] = inner.split('=');
              const cleanVal = v.replace(/^["']|["']$/g, '');
              if (el.getAttribute(k) !== cleanVal) {
                match = false;
              }
            } else {
              if (!el.hasAttribute(inner)) {
                match = false;
              }
            }
          }
        }
        // 4. ID selector
        const idMatch = sel.match(/#([a-zA-Z0-9_-]+)/);
        if (idMatch) {
          if (el.id !== idMatch[1]) {
            match = false;
          }
        }

        if (match) {
          resultSet.add(el);
        }
      }
    }

    // Return in document order
    return all.filter((el) => resultSet.has(el));
  }

  querySelector(selector) {
    const results = this.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  }
}

// Builds the full DOM environment mimicking website/index.html
function buildApplicationDOM() {
  const doc = new SyntheticElement('html', 'html-root');
  const body = new SyntheticElement('body');
  doc.appendChild(body);

  const app = new SyntheticElement('div', 'app', 'app-layout');
  body.appendChild(app);

  const header = new SyntheticElement('header', 'app-header', 'top-header app-header');
  app.appendChild(header);

  // Top header elements
  const headerContainer = new SyntheticElement('div', '', 'header-container');
  header.appendChild(headerContainer);

  const brand = new SyntheticElement('div', '', 'brand-group brand');
  brand.setAttribute('data-nav', 'dashboard');
  brand.setAttribute('role', 'button');
  brand.setAttribute('tabindex', '0');
  headerContainer.appendChild(brand);

  const desktopNav = new SyntheticElement('nav', '', 'desktop-nav');
  desktopNav.setAttribute('role', 'tablist');
  headerContainer.appendChild(desktopNav);

  const tabIds = ['dashboard', 'schools', 'timeline', 'checklist'];
  const tabNames = { dashboard: 'Dashboard', schools: 'Schools', timeline: 'Timeline', checklist: 'Checklist' };
  const tabNamesZh = { dashboard: '概览', schools: '院校', timeline: '时间线', checklist: '清单' };

  for (const tid of tabIds) {
    const btn = new SyntheticElement('button', '', `desktop-nav-tab nav-tab ${tid === 'dashboard' ? 'active' : ''}`);
    btn.setAttribute('type', 'button');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('data-tab', tid);
    btn.setAttribute('data-testid', `tab-${tid}`);
    btn.setAttribute('aria-selected', tid === 'dashboard' ? 'true' : 'false');
    btn.setAttribute('aria-controls', `view-${tid}`);
    desktopNav.appendChild(btn);
  }

  // Main content & views container
  const main = new SyntheticElement('main', 'main-content', 'main-content');
  app.appendChild(main);

  const viewsContainer = new SyntheticElement('div', 'views-container', 'views-container');
  main.appendChild(viewsContainer);

  // 4 View panels as defined in index.html:
  // Each has classes "view-panel app-view"
  const panelElements = {};
  for (const tid of tabIds) {
    const isDefault = tid === 'dashboard';
    const panel = new SyntheticElement(
      'section',
      `view-${tid}`,
      `view-panel app-view ${isDefault ? 'active' : ''}`
    );
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${tid}`);
    panel.setAttribute('data-view', tid);

    // Initial styles
    panel.style.display = isDefault ? 'block' : 'none';
    panel.style.opacity = isDefault ? '1' : '0';
    if (!isDefault) {
      panel.setAttribute('hidden', '');
    }

    viewsContainer.appendChild(panel);
    panelElements[tid] = panel;
  }

  // Bottom mobile nav
  const bottomNavContainer = new SyntheticElement('div', 'bottom-nav-container');
  app.appendChild(bottomNavContainer);

  const bottomNav = new SyntheticElement('nav', '', 'bottom-nav');
  bottomNav.setAttribute('role', 'tablist');
  bottomNavContainer.appendChild(bottomNav);

  for (const tid of tabIds) {
    const btn = new SyntheticElement('button', '', `bottom-nav-tab bottom-tab ${tid === 'dashboard' ? 'active' : ''}`);
    btn.setAttribute('type', 'button');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('data-tab', tid);
    btn.setAttribute('data-testid', `tab-${tid}`);
    btn.setAttribute('aria-selected', tid === 'dashboard' ? 'true' : 'false');
    btn.setAttribute('aria-controls', `view-${tid}`);
    bottomNav.appendChild(btn);
  }

  // Hero CTA buttons (with data-nav attributes)
  const heroContainer = new SyntheticElement('div', 'hero-container');
  main.appendChild(heroContainer);

  const heroCtaSchools = new SyntheticElement('button', 'hero-cta-schools', 'hero-cta-primary');
  heroCtaSchools.setAttribute('data-nav', 'schools');
  heroContainer.appendChild(heroCtaSchools);

  const heroCtaChecklist = new SyntheticElement('button', 'hero-cta-checklist', 'hero-cta-secondary');
  heroCtaChecklist.setAttribute('data-nav', 'checklist');
  heroContainer.appendChild(heroCtaChecklist);

  return {
    doc,
    body,
    brand,
    desktopNav,
    bottomNav,
    panelElements,
    heroCtaSchools,
    heroCtaChecklist
  };
}

// Mock HTTP helper for server stress testing
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

// =========================================================================
// TEST SUITE: CHALLENGER 2 ADVERSARIAL STRESS
// =========================================================================

describe('Challenger 2 Adversarial Stress Suite (M4)', () => {

  // =======================================================================
  // PART 1: RAPID VIEW SWITCHING & DOM CONSISTENCY STRESS
  // =======================================================================
  describe('Part 1: Rapid View Switching & DOM Consistency Stress', () => {
    let dom;
    let origDoc;
    let origWindow;

    beforeEach(() => {
      dom = buildApplicationDOM();
      origDoc = globalThis.document;
      origWindow = globalThis.window;

      globalThis.document = {
        querySelector: (sel) => dom.doc.querySelector(sel),
        querySelectorAll: (sel) => dom.doc.querySelectorAll(sel),
        getElementById: (id) => dom.doc.querySelector(`#${id}`),
        activeElement: null,
        addEventListener: (type, fn) => dom.doc.addEventListener(type, fn),
        removeEventListener: (type, fn) => dom.doc.removeEventListener(type, fn),
        dispatchEvent: (ev) => dom.doc.dispatchEvent(ev)
      };

      globalThis.window = {
        scrollTo: () => {}
      };

      // Reset store to dashboard
      store.setTab('dashboard');
      syncNavigationDOM('dashboard');
    });

    afterEach(() => {
      globalThis.document = origDoc;
      globalThis.window = origWindow;
    });

    /**
     * Helper to verify DOM consistency for a given activeTab
     */
    function verifyDOMConsistency(expectedTab) {
      const allPanels = dom.doc.querySelectorAll('.view-panel, .app-view');
      const allTabs = dom.doc.querySelectorAll('[data-tab]');

      assert.strictEqual(allPanels.length, 4, 'Must have exactly 4 view panels');
      assert.strictEqual(allTabs.length, 8, 'Must have 8 nav tabs (4 desktop + 4 mobile)');

      if (expectedTab === 'dashboard') {
        // Dashboard requirement:
        // When on dashboard, all panels are display: block with full opacity (1), .active class, no hidden attr
        for (const panel of allPanels) {
          assert.strictEqual(
            panel.style.display,
            'block',
            `Panel ${panel.id} must have style.display = 'block' on dashboard`
          );
          assert.strictEqual(
            panel.style.opacity,
            '1',
            `Panel ${panel.id} must have style.opacity = '1' on dashboard`
          );
          assert.strictEqual(
            panel.hasAttribute('hidden'),
            false,
            `Panel ${panel.id} must NOT have hidden attribute on dashboard`
          );
          assert.strictEqual(
            panel.classList.contains('active'),
            true,
            `Panel ${panel.id} must have .active class on dashboard`
          );
        }

        // Tab buttons verification
        for (const tab of allTabs) {
          const isDashboardTab = tab.dataset.tab === 'dashboard';
          assert.strictEqual(
            tab.classList.contains('active'),
            isDashboardTab,
            `Tab button [data-tab="${tab.dataset.tab}"] active state mismatch`
          );
          assert.strictEqual(
            tab.getAttribute('aria-selected'),
            isDashboardTab ? 'true' : 'false',
            `Tab button [data-tab="${tab.dataset.tab}"] aria-selected mismatch`
          );
        }
      } else {
        // Specific tab requirement:
        // Exactly ONE panel has .active, is visible (display: block, opacity: 1, no hidden);
        // Non-target panels are hidden (display: none, opacity: 0, hidden attr, no .active)
        const targetPanelId = `view-${expectedTab}`;
        let activePanelCount = 0;

        for (const panel of allPanels) {
          const isTarget = panel.id === targetPanelId;
          if (isTarget) {
            activePanelCount++;
            assert.strictEqual(
              panel.classList.contains('active'),
              true,
              `Target panel ${panel.id} must have .active class`
            );
            assert.strictEqual(
              panel.style.display,
              'block',
              `Target panel ${panel.id} must have display = 'block'`
            );
            assert.strictEqual(
              panel.style.opacity,
              '1',
              `Target panel ${panel.id} must have opacity = '1'`
            );
            assert.strictEqual(
              panel.hasAttribute('hidden'),
              false,
              `Target panel ${panel.id} must NOT have hidden attribute`
            );
          } else {
            assert.strictEqual(
              panel.classList.contains('active'),
              false,
              `Non-target panel ${panel.id} must NOT have .active class`
            );
            assert.strictEqual(
              panel.style.display,
              'none',
              `Non-target panel ${panel.id} must have display = 'none'`
            );
            assert.strictEqual(
              panel.style.opacity,
              '0',
              `Non-target panel ${panel.id} must have opacity = '0'`
            );
            assert.strictEqual(
              panel.hasAttribute('hidden'),
              true,
              `Non-target panel ${panel.id} must have hidden attribute`
            );
          }
        }

        assert.strictEqual(
          activePanelCount,
          1,
          `Expected exactly 1 active panel for tab "${expectedTab}", found ${activePanelCount}`
        );

        // Tab buttons verification
        for (const tab of allTabs) {
          const isExpected = tab.dataset.tab === expectedTab;
          assert.strictEqual(
            tab.classList.contains('active'),
            isExpected,
            `Tab button [data-tab="${tab.dataset.tab}"] active state mismatch for view "${expectedTab}"`
          );
          assert.strictEqual(
            tab.getAttribute('aria-selected'),
            isExpected ? 'true' : 'false',
            `Tab button [data-tab="${tab.dataset.tab}"] aria-selected mismatch for view "${expectedTab}"`
          );
        }
      }
    }

    test('1.1 Rapid view switching: 120 rapid transitions across tabs with strict DOM consistency', () => {
      // Sequence: dashboard -> schools -> timeline -> checklist -> dashboard
      const cycle = ['schools', 'timeline', 'checklist', 'dashboard'];
      const totalCycles = 30; // 30 * 4 = 120 rapid transitions

      const startTime = performance.now();

      for (let c = 0; c < totalCycles; c++) {
        for (const tab of cycle) {
          store.setTab(tab);
          syncNavigationDOM(tab);
          verifyDOMConsistency(tab);
        }
      }

      const elapsed = performance.now() - startTime;
      assert.ok(
        elapsed < 1000,
        `120 rapid transitions completed in ${elapsed.toFixed(1)}ms (must be < 1000ms)`
      );

      // Final check: confirm store and DOM are in dashboard state
      assert.strictEqual(store.getState().activeTab, 'dashboard');
      verifyDOMConsistency('dashboard');
    });

    test('1.2 Event Delegation Rapid Switching: 100+ simulated DOM clicks across navigation elements', () => {
      setupNavigationEvents();

      const desktopTabs = dom.desktopNav.querySelectorAll('button[data-tab]');
      const bottomTabs = dom.bottomNav.querySelectorAll('button[data-tab]');

      // Map tab buttons by tabId
      const desktopMap = {};
      const bottomMap = {};
      desktopTabs.forEach((btn) => { desktopMap[btn.dataset.tab] = btn; });
      bottomTabs.forEach((btn) => { bottomMap[btn.dataset.tab] = btn; });

      const tabsSequence = ['schools', 'timeline', 'checklist', 'dashboard'];
      const iterations = 25; // 25 * 4 = 100 click events

      for (let i = 0; i < iterations; i++) {
        // Alternate between desktop buttons, mobile buttons, brand logo, and hero CTA buttons
        for (const tab of tabsSequence) {
          if (tab === 'dashboard' && i % 2 === 0) {
            // Click brand logo to go to dashboard
            dom.brand.click();
          } else if (tab === 'schools' && i % 3 === 0) {
            // Click hero CTA button
            dom.heroCtaSchools.click();
          } else if (tab === 'checklist' && i % 3 === 0) {
            // Click hero CTA checklist button
            dom.heroCtaChecklist.click();
          } else if (i % 2 === 0) {
            // Click desktop tab
            desktopMap[tab].click();
          } else {
            // Click mobile tab
            bottomMap[tab].click();
          }

          assert.strictEqual(store.getState().activeTab, tab);
          verifyDOMConsistency(tab);
        }
      }
    });

    test('1.3 Keyboard Accessibility Rapid Switching (Enter & Space keys on tabs)', () => {
      setupNavigationEvents();

      const tabs = ['schools', 'timeline', 'checklist', 'dashboard'];
      const desktopTabs = dom.desktopNav.querySelectorAll('button[data-tab]');
      const tabMap = {};
      desktopTabs.forEach((b) => { tabMap[b.dataset.tab] = b; });

      for (let i = 0; i < 20; i++) {
        for (const tab of tabs) {
          const targetBtn = tabMap[tab];
          globalThis.document.activeElement = targetBtn;

          const keyToPress = i % 2 === 0 ? 'Enter' : ' ';
          const keyEvent = {
            type: 'keydown',
            key: keyToPress,
            preventDefault: () => {}
          };

          dom.doc.dispatchEvent(keyEvent);
          assert.strictEqual(store.getState().activeTab, tab);
          verifyDOMConsistency(tab);
        }
      }
    });

    test('1.4 Chaos Stress: 250 randomized view transitions with zero invariant failures', () => {
      const tabs = ['dashboard', 'schools', 'timeline', 'checklist'];
      let prevTab = 'dashboard';

      for (let i = 0; i < 250; i++) {
        const nextTab = tabs[Math.floor(Math.random() * tabs.length)];
        store.setTab(nextTab);
        syncNavigationDOM(nextTab);

        verifyDOMConsistency(nextTab);
        prevTab = nextTab;
      }
    });

    test('1.5 Boundary & Malformed Tab inputs to syncNavigationDOM fallback safely', () => {
      // 1. undefined / null / '' -> must default to 'dashboard'
      syncNavigationDOM(undefined);
      verifyDOMConsistency('dashboard');

      syncNavigationDOM(null);
      verifyDOMConsistency('dashboard');

      syncNavigationDOM('');
      verifyDOMConsistency('dashboard');

      // 2. Invalid tab string to store.setTab is ignored, store retains currentTab
      store.setTab('dashboard');
      store.setTab('invalid_nonexistent_tab');
      assert.strictEqual(store.getState().activeTab, 'dashboard');
    });

    test('1.6 Asynchronous Rapid Microtask Burst: Eventual consistency verified', async () => {
      setupNavigationEvents();
      const tabs = ['schools', 'timeline', 'checklist', 'dashboard'];

      // Dispatch 100 interleaved store mutations across microtasks
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const tab = tabs[i % tabs.length];
        promises.push(
          Promise.resolve().then(() => {
            store.setTab(tab);
          })
        );
      }

      await Promise.all(promises);

      // Verify DOM is synchronized with whatever the final store tab is
      const finalTab = store.getState().activeTab;
      verifyDOMConsistency(finalTab);
    });
  });

  // =======================================================================
  // PART 2: SERVER RESILIENCE, CONCURRENCY & SECURITY ADVERSARIAL STRESS
  // =======================================================================
  describe('Part 2: Server Resilience, Concurrency & Security Adversarial Stress', () => {
    const server = createStaticServer();

    test('2.1 High Concurrency: 250 simultaneous requests against static assets and health API', async () => {
      const endpoints = [
        '/',
        '/index.html',
        '/api/health',
        '/src/main.js',
        '/src/styles/layout.css',
        '/src/styles/variables.css',
        '/favicon.svg'
      ];
      const count = 250;
      const promises = [];

      for (let i = 0; i < count; i++) {
        const url = endpoints[i % endpoints.length];
        promises.push(sendMockRequest(server, { url }));
      }

      const results = await Promise.all(promises);
      assert.strictEqual(results.length, count);

      for (const res of results) {
        assert.strictEqual(res.crashed, false, 'Server must never crash under concurrency');
        assert.strictEqual(res.statusCode, 200, `Expected 200 for static asset, got ${res.statusCode}`);
        assert.ok(res.body.length > 0, 'Response body should not be empty');
      }
    });

    test('2.2 Directory Traversal Attack Matrix under 200+ concurrency returning strictly 403 Forbidden', async () => {
      const traversalAttacks = [
        '/../../etc/passwd',
        '/..%2f..%2fetc/passwd',
        '/%2e%2e/%2e%2e/etc/passwd',
        '/%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '/%252e%252e/%252e%252e/etc/passwd',
        '/....//....//etc/passwd',
        '/..\\..\\etc\\passwd',
        '/index.html/../../../etc/passwd',
        '/src/../../../../etc/hosts',
        '/../../../../../../../../../../../../etc/shadow'
      ];

      const count = 200;
      const promises = [];
      for (let i = 0; i < count; i++) {
        const url = traversalAttacks[i % traversalAttacks.length];
        promises.push(sendMockRequest(server, { url }));
      }

      const results = await Promise.all(promises);
      assert.strictEqual(results.length, count);

      for (const res of results) {
        assert.strictEqual(res.crashed, false);
        assert.strictEqual(
          res.statusCode,
          403,
          `Directory traversal must return 403 Forbidden, got ${res.statusCode}`
        );
        assert.ok(!res.body.includes('root:'), 'Must never leak /etc/passwd contents');
        assert.ok(!res.body.includes('localhost'), 'Must never leak host file contents');
      }
    });

    test('2.3 Null-Byte Injection Matrix under 200+ concurrency returning strictly 400 Bad Request', async () => {
      const nullByteAttacks = [
        '/\0',
        '/%00',
        '/index.html\0',
        '/index.html%00',
        '/src/main.js%00.html',
        '/%00%00',
        '/api/health%00',
        '/favicon.svg\0.png',
        '/test\0/../'
      ];

      const count = 200;
      const promises = [];
      for (let i = 0; i < count; i++) {
        const url = nullByteAttacks[i % nullByteAttacks.length];
        promises.push(sendMockRequest(server, { url }));
      }

      const results = await Promise.all(promises);
      assert.strictEqual(results.length, count);

      for (const res of results) {
        assert.strictEqual(res.crashed, false, 'Server must not crash on null byte injection');
        assert.strictEqual(
          res.statusCode,
          400,
          `Null byte attack must return 400 Bad Request, got ${res.statusCode}`
        );
        assert.ok(
          res.body.includes('Null bytes are prohibited'),
          'Error message must indicate null bytes prohibited'
        );
      }
    });

    test('2.4 Malformed URLs and Percent-Encoding Fuzzing under 200+ concurrency returning 400 Bad Request', async () => {
      const malformedUrls = [
        '/%E0%A4%A',
        '/%FF',
        '/%a',
        '/%',
        '/%c0%ae%c0%ae',
        '/test%80%80',
        '/foo%ZZbar',
        '/%u0000',
        '/%%'
      ];

      const count = 200;
      const promises = [];
      for (let i = 0; i < count; i++) {
        const url = malformedUrls[i % malformedUrls.length];
        promises.push(sendMockRequest(server, { url }));
      }

      const results = await Promise.all(promises);
      assert.strictEqual(results.length, count);

      for (const res of results) {
        assert.strictEqual(res.crashed, false, 'Server must handle malformed percent-encoding without crash');
        assert.strictEqual(
          res.statusCode,
          400,
          `Malformed URL must return 400 Bad Request, got ${res.statusCode}`
        );
      }
    });

    test('2.5 Malformed Host Header robustness under 100 simultaneous requests', async () => {
      const hostileHosts = [
        '::1',
        'bad::host::name',
        'localhost:3000:8080',
        '[::1]',
        'invalid.host:::1',
        ' '
      ];

      const promises = [];
      for (let i = 0; i < 100; i++) {
        const host = hostileHosts[i % hostileHosts.length];
        promises.push(sendMockRequest(server, { url: '/', headers: { host } }));
      }

      const results = await Promise.all(promises);
      for (const res of results) {
        assert.strictEqual(res.crashed, false);
        // Valid fallback to 127.0.0.1 (200 OK) or clean 400 Bad Request
        assert.ok(
          res.statusCode === 200 || res.statusCode === 400,
          `Hostile host header handled cleanly with ${res.statusCode}`
        );
      }
    });

    test('2.6 Legitimate query strings with ".." preserved without false-positive 403 under concurrency', async () => {
      const queries = [
        '/schools?range=1..10',
        '/timeline?version=1.0.0..2.0.0',
        '/?filter=a..z',
        '/dashboard?period=2026..2027',
        '/checklist?tag=doc..item'
      ];

      const promises = [];
      for (let i = 0; i < 100; i++) {
        const url = queries[i % queries.length];
        promises.push(sendMockRequest(server, { url }));
      }

      const results = await Promise.all(promises);
      for (const res of results) {
        assert.strictEqual(res.crashed, false);
        assert.strictEqual(
          res.statusCode,
          200,
          `Legitimate query with ".." must return 200 SPA fallback, not 403`
        );
        assert.ok(
          res.body.includes('<!DOCTYPE html>') || res.body.includes('<html'),
          'Must serve SPA index.html'
        );
      }
    });

    test('2.7 RFC HTTP HEAD zero-body enforcement across 200, 400, 403, and 404 under concurrency', async () => {
      const headRequests = [
        { url: '/index.html', expectedStatus: 200 },
        { url: '/api/health', expectedStatus: 200 },
        { url: '/%E0%A4%A', expectedStatus: 400 },
        { url: '/../../etc/passwd', expectedStatus: 403 },
        { url: '/nonexistent.css', expectedStatus: 404 }
      ];

      const promises = [];
      for (let i = 0; i < 100; i++) {
        const item = headRequests[i % headRequests.length];
        promises.push(
          sendMockRequest(server, { method: 'HEAD', url: item.url }).then((res) => ({
            res,
            item
          }))
        );
      }

      const results = await Promise.all(promises);
      for (const { res, item } of results) {
        assert.strictEqual(res.crashed, false);
        assert.strictEqual(
          res.statusCode,
          item.expectedStatus,
          `HEAD ${item.url} status mismatch: expected ${item.expectedStatus}, got ${res.statusCode}`
        );
        assert.strictEqual(
          res.body.length,
          0,
          `HEAD request must return strictly 0 body bytes, got ${res.body.length} bytes for ${item.url}`
        );
      }
    });
  });
});
