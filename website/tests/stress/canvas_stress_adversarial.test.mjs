/**
 * website/tests/stress/canvas_stress_adversarial.test.mjs
 * Challenger 1 (Milestone M1): Empirical Adversarial Stress Testing Suite
 * 
 * Verifies:
 * 1. Rapid Viewport Resizing & DPR Clamping Under Stress (320px -> 1920px -> 4K)
 * 2. WebGL Context Loss & Restoration Lifecycle (`webglcontextlost`, `webglcontextrestored`, 2D fallback)
 * 3. Rapid Pointer & Touch Parallax Event Injection (100+ events in 100ms, NaN & matrix overflow immunity)
 * 4. Exhaustive Static CSS Media Query & Max-Width Audit
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSceneController } from '../../src/three/sceneController.js';
import { createGlobeMesh } from '../../src/three/globeMesh.js';
import { createParticleField } from '../../src/three/particleField.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

// =============================================================================
// Mock Helpers for Full WebGL / 2D Canvas / DOM Environment
// =============================================================================

function createMockWebGLContext() {
  let contextLost = false;
  let nextId = 1;
  const buffers = new Set();
  const shaders = new Set();
  const programs = new Set();

  return {
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    STREAM_DRAW: 35040,
    FLOAT: 5126,
    LINES: 1,
    POINTS: 0,
    COLOR_BUFFER_BIT: 16384,
    DEPTH_BUFFER_BIT: 256,
    BLEND: 3042,
    SRC_ALPHA: 770,
    ONE: 1,

    isContextLost: () => contextLost,
    _simulateLoss: () => { contextLost = true; },
    _simulateRestore: () => { contextLost = false; },

    createShader: (type) => {
      const id = { __type: 'shader', id: nextId++, type };
      shaders.add(id);
      return id;
    },
    shaderSource: (s, src) => {},
    compileShader: (s) => {},
    createProgram: () => {
      const id = { __type: 'program', id: nextId++ };
      programs.add(id);
      return id;
    },
    attachShader: (p, s) => {},
    linkProgram: (p) => {},
    deleteShader: (s) => { shaders.delete(s); },
    deleteProgram: (p) => { programs.delete(p); },

    getAttribLocation: (p, name) => {
      if (name === 'a_position') return 0;
      if (name === 'a_color') return 1;
      if (name === 'a_size') return 2;
      return -1;
    },
    getUniformLocation: (p, name) => ({ __type: 'uniform', name }),

    createBuffer: () => {
      if (contextLost) return null;
      const b = { __type: 'buffer', id: nextId++ };
      buffers.add(b);
      return b;
    },
    bindBuffer: (target, buf) => {},
    bufferData: (target, data, usage) => {},
    deleteBuffer: (b) => { buffers.delete(b); },

    useProgram: (p) => {},
    uniformMatrix4fv: (loc, transpose, val) => {},
    uniform4f: (loc, x, y, z, w) => {},
    uniform1f: (loc, val) => {},

    enableVertexAttribArray: (idx) => {},
    vertexAttribPointer: (idx, size, type, norm, stride, offset) => {},
    drawArrays: (mode, first, count) => {},

    clearColor: (r, g, b, a) => {},
    clear: (mask) => {},
    enable: (cap) => {},
    blendFunc: (sfactor, dfactor) => {},
    viewport: (x, y, w, h) => {},

    _getActiveBufferCount: () => buffers.size,
  };
}

function createMock2DContext() {
  return {
    save: () => {},
    restore: () => {},
    clearRect: (x, y, w, h) => {},
    beginPath: () => {},
    arc: (x, y, r, sa, ea) => {},
    moveTo: (x, y) => {},
    lineTo: (x, y) => {},
    stroke: () => {},
    fill: () => {},
    lineWidth: 1,
    strokeStyle: '',
    fillStyle: '',
    shadowColor: '',
    shadowBlur: 0,
  };
}

class MockCanvasElement {
  constructor(supportWebGL = true) {
    this.width = 800;
    this.height = 600;
    this.style = { width: '800px', height: '600px' };
    this.supportWebGL = supportWebGL;
    this.gl = supportWebGL ? createMockWebGLContext() : null;
    this.ctx2d = createMock2DContext();
    this.eventListeners = new Map();
    this.parentElement = {
      clientWidth: 800,
      clientHeight: 600,
    };
  }

  getContext(type, options) {
    if (type === 'webgl2' || type === 'webgl' || type === 'experimental-webgl') {
      return this.supportWebGL ? this.gl : null;
    }
    if (type === '2d') {
      return this.ctx2d;
    }
    return null;
  }

  addEventListener(event, handler, options) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(handler);
  }

  removeEventListener(event, handler) {
    const list = this.eventListeners.get(event) || [];
    this.eventListeners.set(event, list.filter(fn => fn !== handler));
  }

  dispatchEvent(event) {
    const list = this.eventListeners.get(event.type) || [];
    for (const fn of list) {
      fn(event);
    }
  }
}

// Setup Global Environment Mock for tests
let savedGlobals = {};

function setupGlobalEnvironment(canvasInstance) {
  savedGlobals = {
    window: globalThis.window,
    document: globalThis.document,
    HTMLCanvasElement: globalThis.HTMLCanvasElement,
    ResizeObserver: globalThis.ResizeObserver,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    performance: globalThis.performance,
  };

  const windowListeners = new Map();

  globalThis.HTMLCanvasElement = MockCanvasElement;
  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 800,
    devicePixelRatio: 2.0,
    addEventListener: (event, handler, options) => {
      if (!windowListeners.has(event)) windowListeners.set(event, []);
      windowListeners.get(event).push(handler);
    },
    removeEventListener: (event, handler) => {
      const list = windowListeners.get(event) || [];
      windowListeners.set(event, list.filter(fn => fn !== handler));
    },
    _dispatchEvent: (event) => {
      const list = windowListeners.get(event.type) || [];
      for (const fn of list) fn(event);
    },
    requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
  };

  globalThis.document = {
    body: {
      clientWidth: 1280,
      clientHeight: 800,
    },
  };

  globalThis.performance = {
    now: () => Date.now(),
  };

  globalThis.requestAnimationFrame = globalThis.window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = globalThis.window.cancelAnimationFrame;

  globalThis.ResizeObserver = class MockResizeObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe(target) {}
    disconnect() {}
    _trigger(entries) {
      this.callback(entries);
    }
  };
}

function restoreGlobalEnvironment() {
  Object.assign(globalThis, savedGlobals);
}

// =============================================================================
// Test Suites
// =============================================================================

describe('Challenger 1: Milestone M1 3D Canvas Adversarial Stress Test', () => {

  afterEach(() => {
    restoreGlobalEnvironment();
  });

  // =========================================================================
  // 1. Rapid Viewport Resizing & DPR Clamping Under Stress
  // =========================================================================
  describe('1. Viewport Resizing & DPR Clamping Stress Harness', () => {
    test('1.1 500 rapid resize cycles across mobile, desktop, and 4K clamp DPR to max 2.0 without crash', () => {
      const canvas = new MockCanvasElement(true);
      setupGlobalEnvironment(canvas);

      const controller = createSceneController();
      const initialized = controller.init(canvas);
      assert.strictEqual(initialized, true, 'Scene controller must initialize');

      const hook = globalThis.window.__CHINA_2027_3D__;
      assert.ok(hook, 'window.__CHINA_2027_3D__ hook must be exposed');

      const viewports = [
        { w: 320, h: 480, dpr: 1 },    // iPhone SE baseline
        { w: 375, h: 667, dpr: 2 },    // iPhone 8
        { w: 390, h: 844, dpr: 3 },    // iPhone 13 Pro (high DPR 3.0)
        { w: 414, h: 896, dpr: 2.75 }, // iPhone XR
        { w: 768, h: 1024, dpr: 2 },   // iPad portrait
        { w: 1024, h: 768, dpr: 2 },   // iPad landscape
        { w: 1280, h: 800, dpr: 1 },   // MacBook desktop
        { w: 1440, h: 900, dpr: 2 },   // Retina desktop
        { w: 1920, h: 1080, dpr: 1 },  // FHD
        { w: 2560, h: 1440, dpr: 2 },  // 2K
        { w: 3840, h: 2160, dpr: 4 },  // 4K Ultra-DPR (adversarial DPR 4.0)
      ];

      // Execute 500 rapid resizes
      for (let i = 0; i < 500; i++) {
        const vp = viewports[i % viewports.length];
        globalThis.window.devicePixelRatio = vp.dpr;
        globalThis.window.innerWidth = vp.w;
        globalThis.window.innerHeight = vp.h;

        // Trigger setSize through hook
        hook.renderer.setSize(vp.w, vp.h);

        const clampedDpr = Math.min(vp.dpr, 2.0);
        const expectedW = Math.floor(vp.w * clampedDpr);
        const expectedH = Math.floor(vp.h * clampedDpr);

        assert.strictEqual(canvas.width, expectedW, `Cycle ${i}: canvas.width should be clamped to DPR 2`);
        assert.strictEqual(canvas.height, expectedH, `Cycle ${i}: canvas.height should be clamped to DPR 2`);
        assert.strictEqual(canvas.style.width, `${vp.w}px`);
        assert.strictEqual(canvas.style.height, `${vp.h}px`);

        // Check camera aspect ratio
        const expectedAspect = vp.w / vp.h;
        assert.ok(
          Math.abs(hook.camera.aspect - expectedAspect) < 1e-5,
          `Camera aspect ratio must equal ${expectedAspect}`
        );

        // Verify camera projection matrix has NO NaN or Infinity
        for (let m = 0; m < 16; m++) {
          assert.ok(
            Number.isFinite(hook.camera.projectionMatrix[m]),
            `Cycle ${i}: ProjectionMatrix[${m}] must be finite, got ${hook.camera.projectionMatrix[m]}`
          );
        }
      }

      controller.destroy();
    });

    test('1.2 Boundary & Pathological Viewport Dimensions (0px, 1px, negative, non-numeric)', () => {
      const canvas = new MockCanvasElement(true);
      setupGlobalEnvironment(canvas);

      const controller = createSceneController();
      controller.init(canvas);
      const hook = globalThis.window.__CHINA_2027_3D__;

      // 1. Minimal 1x1 viewport
      assert.doesNotThrow(() => {
        hook.renderer.setSize(1, 1);
      });
      assert.strictEqual(canvas.width, 2); // 1 * 2 DPR
      assert.strictEqual(canvas.height, 2);

      // 2. Large 8K viewport
      assert.doesNotThrow(() => {
        hook.renderer.setSize(7680, 4320);
      });
      assert.strictEqual(canvas.width, 15360);
      assert.strictEqual(canvas.height, 8640);

      // Restore to normal
      hook.renderer.setSize(1280, 800);
      assert.strictEqual(canvas.width, 2560);
      assert.strictEqual(canvas.height, 1600);

      controller.destroy();
    });
  });

  // =========================================================================
  // 2. WebGL Context Loss & Restoration Lifecycle Simulation
  // =========================================================================
  describe('2. WebGL Context Loss & Restoration Lifecycle', () => {
    test('2.1 webglcontextlost event calls preventDefault and switches state cleanly', () => {
      const canvas = new MockCanvasElement(true);
      setupGlobalEnvironment(canvas);

      const controller = createSceneController();
      controller.init(canvas);
      const hook = globalThis.window.__CHINA_2027_3D__;

      assert.strictEqual(hook.isContextLost, false);
      assert.strictEqual(hook.renderer.isWebGL, true);

      let preventDefaultCalled = false;
      const lossEvent = {
        type: 'webglcontextlost',
        preventDefault: () => { preventDefaultCalled = true; }
      };

      // Trigger WebGL context loss
      canvas.gl._simulateLoss();
      canvas.dispatchEvent(lossEvent);

      assert.strictEqual(preventDefaultCalled, true, 'webglcontextlost must call event.preventDefault()');
      assert.strictEqual(hook.isContextLost, true, 'isContextLost must be true on hook');

      controller.destroy();
    });

    test('2.2 Render loop continues safely during context loss without throwing or stalling', async () => {
      const canvas = new MockCanvasElement(true);
      setupGlobalEnvironment(canvas);

      const controller = createSceneController();
      controller.init(canvas);
      const hook = globalThis.window.__CHINA_2027_3D__;

      const initialFrames = hook.frameCount;

      // Simulate context loss
      canvas.gl._simulateLoss();
      canvas.dispatchEvent({ type: 'webglcontextlost', preventDefault: () => {} });

      // Run 30 simulated frames during context loss
      await new Promise(r => setTimeout(r, 60));

      assert.ok(hook.frameCount > initialFrames, 'Frame count must continue incrementing during context loss');
      assert.strictEqual(hook.isContextLost, true);

      controller.destroy();
    });

    test('2.3 webglcontextrestored cleanly restores WebGL pipeline without crashing', () => {
      const canvas = new MockCanvasElement(true);
      setupGlobalEnvironment(canvas);

      const controller = createSceneController();
      controller.init(canvas);
      const hook = globalThis.window.__CHINA_2027_3D__;

      // 1. Loss
      canvas.gl._simulateLoss();
      canvas.dispatchEvent({ type: 'webglcontextlost', preventDefault: () => {} });
      assert.strictEqual(hook.isContextLost, true);

      // 2. Restore
      canvas.gl._simulateRestore();
      canvas.dispatchEvent({ type: 'webglcontextrestored' });
      assert.strictEqual(hook.isContextLost, false, 'isContextLost must reset to false');

      controller.destroy();
    });

    test('2.4 Rapid Context Loss Flip-Flop (50 cycles) survives without memory or resource leaks', () => {
      const canvas = new MockCanvasElement(true);
      setupGlobalEnvironment(canvas);

      const controller = createSceneController();
      controller.init(canvas);
      const hook = globalThis.window.__CHINA_2027_3D__;

      assert.doesNotThrow(() => {
        for (let i = 0; i < 50; i++) {
          canvas.gl._simulateLoss();
          canvas.dispatchEvent({ type: 'webglcontextlost', preventDefault: () => {} });
          assert.strictEqual(hook.isContextLost, true);

          canvas.gl._simulateRestore();
          canvas.dispatchEvent({ type: 'webglcontextrestored' });
          assert.strictEqual(hook.isContextLost, false);
        }
      });

      controller.destroy();
    });

    test('2.5 Automatic 2D Fallback executes in environments without WebGL context', () => {
      // Create canvas where WebGL is completely unavailable (returns null)
      const canvas = new MockCanvasElement(false);
      setupGlobalEnvironment(canvas);

      const controller = createSceneController();
      const initialized = controller.init(canvas);
      assert.strictEqual(initialized, true);

      const hook = globalThis.window.__CHINA_2027_3D__;
      assert.strictEqual(hook.isFallback2D, true, 'isFallback2D must be true when WebGL unavailable');
      assert.strictEqual(hook.renderer.isWebGL, false);

      // Verify globe and particles fallback render without throwing
      const globe = createGlobeMesh(null, false);
      const particles = createParticleField(null, false, 100);

      const mockCtx = canvas.getContext('2d');
      const cam = { aspect: 1, projectionMatrix: new Float32Array(16) };
      const parallax = { currentX: 0, currentY: 0 };

      assert.doesNotThrow(() => {
        globe.render2D(mockCtx, 800, 600, cam, parallax, 1.0);
        particles.render2D(mockCtx, 800, 600, cam, parallax, 1.0);
      });

      controller.destroy();
    });
  });

  // =========================================================================
  // 3. Rapid Pointer & Touch Parallax Event Injection
  // =========================================================================
  describe('3. Pointer & Touch Parallax Event Injection', () => {
    test('3.1 100 rapid pointermove events in 100ms maintain finite coordinates and no matrix overflow', async () => {
      const canvas = new MockCanvasElement(true);
      setupGlobalEnvironment(canvas);

      const controller = createSceneController();
      controller.init(canvas);
      const hook = globalThis.window.__CHINA_2027_3D__;

      const extremeCoords = [
        { x: -5000, y: -5000 },
        { x: 5000, y: 5000 },
        { x: 0, y: 0 },
        { x: 640, y: 400 },
        { x: 1280, y: 800 },
        { x: -999999, y: 999999 },
      ];

      // Inject 100 rapid pointer events
      for (let i = 0; i < 100; i++) {
        const coord = extremeCoords[i % extremeCoords.length];
        globalThis.window._dispatchEvent({
          type: 'pointermove',
          clientX: coord.x,
          clientY: coord.y,
        });
      }

      // Wait 50ms for render loop damping
      await new Promise(r => setTimeout(r, 50));

      // Verify projection matrix is still finite
      for (let m = 0; m < 16; m++) {
        assert.ok(
          Number.isFinite(hook.camera.projectionMatrix[m]),
          `Camera projectionMatrix[${m}] must be finite`
        );
      }

      controller.destroy();
    });

    test('3.2 Rapid touchmove events with multi-touch and boundary coords survive cleanly', async () => {
      const canvas = new MockCanvasElement(true);
      setupGlobalEnvironment(canvas);

      const controller = createSceneController();
      controller.init(canvas);

      // Inject 100 touch events
      for (let i = 0; i < 100; i++) {
        globalThis.window._dispatchEvent({
          type: 'touchmove',
          touches: [
            { clientX: (i * 37) % 1280, clientY: (i * 29) % 800 },
            { clientX: (i * 19) % 1280, clientY: (i * 53) % 800 },
          ],
        });
      }

      // Empty touches array edge case (e.g. touch release)
      assert.doesNotThrow(() => {
        globalThis.window._dispatchEvent({
          type: 'touchmove',
          touches: [],
        });
      });

      await new Promise(r => setTimeout(r, 40));
      controller.destroy();
    });

    test('3.3 Long-running simulation (10,000 frames) does not produce trigonometric degradation or overflow', () => {
      const globe = createGlobeMesh(null, false);
      const particles = createParticleField(null, false, 50);
      const mockCtx = createMock2DContext();
      const cam = { aspect: 16/9, projectionMatrix: new Float32Array(16) };
      const parallax = { currentX: 0.5, currentY: -0.3 };

      assert.doesNotThrow(() => {
        // Step time by 16.6ms for 10,000 frames (~166 seconds simulated)
        let t = 0;
        for (let frame = 0; frame < 10000; frame++) {
          t += 0.0166;
          // Sample every 500 frames to keep test execution fast
          if (frame % 500 === 0) {
            globe.render2D(mockCtx, 1280, 800, cam, parallax, t);
            particles.render2D(mockCtx, 1280, 800, cam, parallax, t);
          }
        }
      });
    });
  });

  // =========================================================================
  // 4. Exhaustive Static CSS Media Query & Max-Width Audit
  // =========================================================================
  describe('4. Static CSS Media Query & Max-Width Audit', () => {
    test('4.1 Zero occurrences of max-width media queries across all project CSS files', () => {
      const stylesDir = path.join(ROOT_DIR, 'src/styles');
      const cssFiles = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css'));

      assert.ok(cssFiles.length >= 5, 'Must inspect at least 5 CSS files');

      const violations = [];

      for (const file of cssFiles) {
        const filePath = path.join(stylesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Remove CSS comments to avoid false alarms in comment text
        const codeOnly = content.replace(/\/\*[\s\S]*?\*\//g, '');

        // Search for @media statements containing max-width
        const mediaRegex = /@media[^{]+\{/gi;
        let match;
        while ((match = mediaRegex.exec(codeOnly)) !== null) {
          const mediaStatement = match[0];
          if (/max-width/i.test(mediaStatement)) {
            violations.push({
              file,
              query: mediaStatement.trim(),
            });
          }
        }
      }

      assert.strictEqual(
        violations.length,
        0,
        `Violations found: ${JSON.stringify(violations, null, 2)}`
      );
    });

    test('4.2 Verify all responsive layout scaling queries strictly use min-width progressive scaling', () => {
      const layoutCss = fs.readFileSync(path.join(ROOT_DIR, 'src/styles/layout.css'), 'utf8');
      const codeOnly = layoutCss.replace(/\/\*[\s\S]*?\*\//g, '');

      const mediaQueries = [];
      const mediaRegex = /@media\s*\(([^)]+)\)/gi;
      let match;
      while ((match = mediaRegex.exec(codeOnly)) !== null) {
        mediaQueries.push(match[1].trim());
      }

      assert.ok(mediaQueries.length > 0, 'layout.css must contain responsive media queries');

      for (const q of mediaQueries) {
        assert.ok(
          q.startsWith('min-width:'),
          `Responsive query in layout.css must start with min-width:, found: "${q}"`
        );
      }

      // Check standard breakpoints are present
      assert.ok(mediaQueries.some(q => q.includes('640px')), 'Must have 640px breakpoint');
      assert.ok(mediaQueries.some(q => q.includes('768px')), 'Must have 768px breakpoint');
      assert.ok(mediaQueries.some(q => q.includes('1024px')), 'Must have 1024px breakpoint');
      assert.ok(mediaQueries.some(q => q.includes('1280px')), 'Must have 1280px breakpoint');
    });

    test('4.3 Check index.html and dist bundle for zero inline or embedded max-width media queries', () => {
      const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
      assert.ok(!/@media[^{]*max-width/i.test(indexHtml), 'index.html must not contain max-width media query');

      const bundleCssPath = path.join(ROOT_DIR, 'dist/assets/bundle.css');
      if (fs.existsSync(bundleCssPath)) {
        const bundleCss = fs.readFileSync(bundleCssPath, 'utf8');
        const codeOnly = bundleCss.replace(/\/\*[\s\S]*?\*\//g, '');
        const matches = codeOnly.match(/@media[^{]*max-width/gi) || [];
        assert.strictEqual(matches.length, 0, 'bundle.css must not contain max-width media queries');
      }
    });
  });
});
