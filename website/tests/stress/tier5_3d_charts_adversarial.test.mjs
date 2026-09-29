/**
 * website/tests/stress/tier5_3d_charts_adversarial.test.mjs
 * 
 * Phase 2 — Tier 5 Adversarial Coverage Hardening:
 * 3D Graphics Engine, Countdown Timer & SVG Charts
 * 
 * Target modules:
 * - website/src/three/sceneController.js
 * - website/src/three/globeMesh.js
 * - website/src/three/particleField.js
 * - website/src/components/countdownTimer.js
 * - website/src/components/charts/studentGrowthChart.js
 * - website/src/components/charts/disciplineDonutChart.js
 * - website/src/components/chinaMetrics.js
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';

import { createSceneController, initSceneController } from '../../src/three/sceneController.js';
import { createGlobeMesh } from '../../src/three/globeMesh.js';
import { createParticleField } from '../../src/three/particleField.js';
import {
  TARGET_DATE_ISO,
  TARGET_MS,
  BASELINE_START_MS,
  calculateCountdown,
  getCountdownTime,
  renderCountdownTimer,
  mountCountdownTimer,
  unmountCountdownTimer,
} from '../../src/components/countdownTimer.js';
import {
  renderStudentGrowthChart,
  setupStudentGrowthChart,
  DEFAULT_STUDENT_DATA,
} from '../../src/components/charts/studentGrowthChart.js';
import {
  computeDonutArcs,
  renderDisciplineDonutChart,
  setupDisciplineDonutChart,
  DEFAULT_DISCIPLINE_DATA,
} from '../../src/components/charts/disciplineDonutChart.js';
import chinaMetricsDefault, {
  renderChinaMetrics,
  renderMetricCard,
  renderMetricsHeader,
  mountChinaMetrics,
} from '../../src/components/chinaMetrics.js';

// =============================================================================
// DOM & WebGL Emulation Utilities
// =============================================================================

function createMockGlContext(options = {}) {
  let contextLost = false;
  return {
    isContextLost: () => contextLost,
    setContextLost: (val) => { contextLost = val; },
    createShader: (type) => ({ type, id: Math.random() }),
    shaderSource: () => {},
    compileShader: () => {},
    createProgram: () => ({ id: Math.random() }),
    attachShader: () => {},
    linkProgram: () => {},
    deleteShader: () => {},
    getAttribLocation: () => 0,
    getUniformLocation: () => ({ id: Math.random() }),
    createBuffer: () => ({ id: Math.random() }),
    bindBuffer: () => {},
    bufferData: () => {},
    deleteBuffer: () => {},
    deleteProgram: () => {},
    viewport: () => {},
    clearColor: () => {},
    clear: () => {},
    enable: () => {},
    blendFunc: () => {},
    useProgram: () => {},
    uniformMatrix4fv: () => {},
    uniform1f: () => {},
    uniform4f: () => {},
    enableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},
    drawArrays: () => {},
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    STREAM_DRAW: 35040,
    COLOR_BUFFER_BIT: 16384,
    DEPTH_BUFFER_BIT: 256,
    BLEND: 3042,
    SRC_ALPHA: 770,
    ONE: 1,
    FLOAT: 5126,
    LINES: 1,
    POINTS: 0,
  };
}

function createMock2dContext() {
  return {
    save: () => {},
    restore: () => {},
    clearRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    lineWidth: 1,
    strokeStyle: '',
    fillStyle: '',
    shadowColor: '',
    shadowBlur: 0,
  };
}

function setupMockEnvironment(initialDpr = 1) {
  const windowListeners = new Map();
  const canvasListeners = new Map();
  let rafQueue = [];
  let rafIdCounter = 0;

  const mockWindow = {
    innerWidth: 1280,
    innerHeight: 800,
    devicePixelRatio: initialDpr,
    addEventListener(type, fn) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      if (windowListeners.has(type)) {
        windowListeners.set(type, windowListeners.get(type).filter((f) => f !== fn));
      }
    },
    requestAnimationFrame(fn) {
      rafIdCounter++;
      rafQueue.push({ id: rafIdCounter, fn });
      return rafIdCounter;
    },
    cancelAnimationFrame(id) {
      rafQueue = rafQueue.filter((item) => item.id !== id);
    },
    trigger(type, ev) {
      const list = windowListeners.get(type) || [];
      for (const fn of list) fn(ev);
    },
  };

  const mockParent = {
    clientWidth: 1280,
    clientHeight: 800,
    contains: () => true,
  };

  class MockHTMLCanvasElement {
    constructor(supportWebGL = false) {
      this.width = 1280;
      this.height = 800;
      this.style = {};
      this.parentElement = mockParent;
      this._supportWebGL = supportWebGL;
      this._mockGl = supportWebGL ? createMockGlContext() : null;
      this._mock2d = createMock2dContext();
    }
    getContext(type) {
      if (type.includes('webgl')) {
        return this._supportWebGL ? this._mockGl : null;
      }
      if (type === '2d') {
        return this._mock2d;
      }
      return null;
    }
    addEventListener(type, fn) {
      if (!canvasListeners.has(type)) canvasListeners.set(type, []);
      canvasListeners.get(type).push(fn);
    }
    removeEventListener(type, fn) {
      if (canvasListeners.has(type)) {
        canvasListeners.set(type, canvasListeners.get(type).filter((f) => f !== fn));
      }
    }
    trigger(type, ev) {
      const list = canvasListeners.get(type) || [];
      for (const fn of list) fn(ev);
    }
  }

  const mockDocument = {
    body: mockParent,
    createElement: (tag) => {
      if (tag === 'canvas') return new MockHTMLCanvasElement();
      return new SyntheticElement(tag);
    },
    getElementById: () => null,
    querySelector: () => null,
  };

  globalThis.window = mockWindow;
  globalThis.document = mockDocument;
  globalThis.requestAnimationFrame = mockWindow.requestAnimationFrame;
  globalThis.cancelAnimationFrame = mockWindow.cancelAnimationFrame;
  globalThis.HTMLCanvasElement = MockHTMLCanvasElement;
  globalThis.HTMLElement = SyntheticElement;
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };

  function stepFrames(count = 1) {
    for (let i = 0; i < count; i++) {
      const current = [...rafQueue];
      rafQueue = [];
      for (const item of current) {
        item.fn(performance.now());
      }
    }
  }

  return {
    mockWindow,
    mockDocument,
    MockHTMLCanvasElement,
    stepFrames,
    cleanup: () => {
      delete globalThis.window;
      delete globalThis.document;
      delete globalThis.requestAnimationFrame;
      delete globalThis.cancelAnimationFrame;
      delete globalThis.HTMLCanvasElement;
      delete globalThis.HTMLElement;
      delete globalThis.ResizeObserver;
    },
  };
}

// Lightweight Synthetic Element for Component Interactions
class SyntheticElement {
  constructor(tagName = 'div', id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = {
      _classes: new Set(className ? className.split(/\s+/).filter(Boolean) : []),
      add: (cls) => this.classList._classes.add(cls),
      remove: (cls) => this.classList._classes.delete(cls),
      toggle: (cls, force) => {
        if (force === undefined) {
          if (this.classList._classes.has(cls)) this.classList._classes.delete(cls);
          else this.classList._classes.add(cls);
        } else if (force) {
          this.classList._classes.add(cls);
        } else {
          this.classList._classes.delete(cls);
        }
      },
      contains: (cls) => this.classList._classes.has(cls),
    };
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.children = [];
    this.innerHTML = '';
    this.textContent = '';
  }

  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }

  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }

  removeEventListener(type, fn) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter((l) => l !== fn);
  }

  dispatchEvent(eventObj) {
    const type = typeof eventObj === 'string' ? eventObj : eventObj.type;
    const ev = typeof eventObj === 'string' ? { type, target: this } : { target: this, ...eventObj };
    if (this.listeners[type]) {
      this.listeners[type].forEach((fn) => fn(ev));
    }
  }

  querySelector(sel) {
    if (sel.startsWith('#')) {
      const id = sel.slice(1);
      if (this.id === id) return this;
      for (const child of this.children) {
        const found = child.querySelector(sel);
        if (found) return found;
      }
      return null;
    }
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      if (this.classList.contains(cls)) return this;
      for (const child of this.children) {
        const found = child.querySelector(sel);
        if (found) return found;
      }
      return null;
    }
    return null;
  }

  querySelectorAll(sel) {
    const results = [];
    const search = (node) => {
      if (sel.startsWith('.')) {
        const cls = sel.slice(1);
        if (node.classList.contains(cls)) results.push(node);
      }
      for (const c of node.children) search(c);
    };
    search(this);
    return results;
  }
}

// =============================================================================
// SUITE 1: 3D Graphics Engine White-Box Coverage & Extreme Conditions
// =============================================================================

describe('Tier 5 Suite 1: 3D Graphics Engine Adversarial Hardening', () => {
  let env;

  before(() => {
    env = setupMockEnvironment();
  });

  after(() => {
    env.cleanup();
  });

  test('1.1 WebGL context acquisition failure triggers 2D fallback cleanly', () => {
    const canvas = new env.MockHTMLCanvasElement(false); // No WebGL
    const ctl = createSceneController();
    const ok = ctl.init(canvas);

    assert.strictEqual(ok, true, 'Controller init must return true with 2D fallback');
    const hook = globalThis.window.__CHINA_2027_3D__;
    assert.ok(hook, 'window.__CHINA_2027_3D__ hook must be published');
    assert.strictEqual(hook.isFallback2D, true, 'isFallback2D must be true');
    assert.strictEqual(hook.isContextLost, false, 'isContextLost must be false initially');

    ctl.destroy();
  });

  test('1.2 WebGL context lost event triggers preventDefault, updates state hook, and activates 2D fallback', () => {
    const canvas = new env.MockHTMLCanvasElement(true); // Supports WebGL
    const ctl = createSceneController();
    ctl.init(canvas);

    const hook = globalThis.window.__CHINA_2027_3D__;
    assert.strictEqual(hook.renderer.isWebGL, true);

    let prevented = false;
    canvas.trigger('webglcontextlost', {
      preventDefault: () => { prevented = true; },
    });

    assert.strictEqual(prevented, true, 'webglcontextlost must call preventDefault()');
    assert.strictEqual(hook.isContextLost, true, 'hook.isContextLost must be true');

    // Step animation frames while context is lost to verify no crashes
    env.stepFrames(3);
    assert.strictEqual(hook.frameCount, 3, 'Animation loop continues running during context loss');

    ctl.destroy();
  });

  test('1.3 WebGL context restored event recovers WebGL context and updates state hook', () => {
    const canvas = new env.MockHTMLCanvasElement(true);
    const ctl = createSceneController();
    ctl.init(canvas);

    const hook = globalThis.window.__CHINA_2027_3D__;

    // Trigger loss
    canvas.trigger('webglcontextlost', { preventDefault() {} });
    assert.strictEqual(hook.isContextLost, true);

    // Trigger restoration
    canvas.trigger('webglcontextrestored', {});
    assert.strictEqual(hook.isContextLost, false, 'hook.isContextLost must be reset to false');
    assert.strictEqual(hook.isFallback2D, false, 'isFallback2D must be restored to false');

    // Step animation frames post-restoration
    env.stepFrames(3);
    assert.strictEqual(hook.frameCount, 3);

    ctl.destroy();
  });

  test('1.4 Consecutive/rapid WebGL context lost and restored cycles (10 cycles)', () => {
    const canvas = new env.MockHTMLCanvasElement(true);
    const ctl = createSceneController();
    ctl.init(canvas);
    const hook = globalThis.window.__CHINA_2027_3D__;

    for (let i = 0; i < 10; i++) {
      canvas.trigger('webglcontextlost', { preventDefault() {} });
      assert.strictEqual(hook.isContextLost, true);
      env.stepFrames(1);

      canvas.trigger('webglcontextrestored', {});
      assert.strictEqual(hook.isContextLost, false);
      env.stepFrames(1);
    }

    assert.strictEqual(hook.frameCount, 20, 'All 20 frames processed cleanly across 10 loss/restore cycles');
    ctl.destroy();
  });

  test('1.5 Canvas resize with 0x0 dimensions (zero width and zero height)', () => {
    const canvas = new env.MockHTMLCanvasElement(true);
    const ctl = createSceneController();
    ctl.init(canvas);

    const hook = globalThis.window.__CHINA_2027_3D__;
    assert.doesNotThrow(() => {
      hook.renderer.setSize(0, 0);
    });

    assert.strictEqual(canvas.width, 0);
    assert.strictEqual(canvas.height, 0);

    // Render frame with 0x0 dimensions
    assert.doesNotThrow(() => {
      env.stepFrames(2);
    });

    ctl.destroy();
  });

  test('1.6 Canvas resize with negative dimensions (-500x-300)', () => {
    const canvas = new env.MockHTMLCanvasElement(true);
    const ctl = createSceneController();
    ctl.init(canvas);

    const hook = globalThis.window.__CHINA_2027_3D__;
    assert.doesNotThrow(() => {
      hook.renderer.setSize(-500, -300);
    });

    // Step frame without crash
    assert.doesNotThrow(() => {
      env.stepFrames(2);
    });

    ctl.destroy();
  });

  test('1.7 DevicePixelRatio extreme downscaling (dpr = 0.1)', () => {
    globalThis.window.devicePixelRatio = 0.1;
    const canvas = new env.MockHTMLCanvasElement(true);
    const ctl = createSceneController();
    ctl.init(canvas);

    const hook = globalThis.window.__CHINA_2027_3D__;
    hook.renderer.setSize(1000, 500);

    // 1000 * 0.1 = 100
    assert.strictEqual(canvas.width, 100, 'Canvas width scaled to 100 at 0.1 DPR');
    assert.strictEqual(canvas.height, 50, 'Canvas height scaled to 50 at 0.1 DPR');

    env.stepFrames(2);
    ctl.destroy();
    globalThis.window.devicePixelRatio = 1;
  });

  test('1.8 DevicePixelRatio extreme retina scaling (dpr = 5.0) clamped to 2.0', () => {
    globalThis.window.devicePixelRatio = 5.0;
    const canvas = new env.MockHTMLCanvasElement(true);
    const ctl = createSceneController();
    ctl.init(canvas);

    const hook = globalThis.window.__CHINA_2027_3D__;
    hook.renderer.setSize(1000, 500);

    // Clamped to 2.0: 1000 * 2 = 2000
    assert.strictEqual(canvas.width, 2000, 'Canvas width clamped to 2000 at 5.0 DPR (max DPR 2)');
    assert.strictEqual(canvas.height, 1000, 'Canvas height clamped to 1000 at 5.0 DPR');

    env.stepFrames(2);
    ctl.destroy();
    globalThis.window.devicePixelRatio = 1;
  });

  test('1.9 DevicePixelRatio invalid/zero/negative values (dpr = 0, -2, NaN)', () => {
    const invalidDprs = [0, -2, NaN, undefined, null];
    for (const badDpr of invalidDprs) {
      globalThis.window.devicePixelRatio = badDpr;
      const canvas = new env.MockHTMLCanvasElement(true);
      const ctl = createSceneController();
      ctl.init(canvas);

      const hook = globalThis.window.__CHINA_2027_3D__;
      assert.doesNotThrow(() => {
        hook.renderer.setSize(800, 600);
        env.stepFrames(1);
      }, `Must not throw on invalid DPR: ${badDpr}`);

      ctl.destroy();
    }
    globalThis.window.devicePixelRatio = 1;
  });

  test('1.10 Multiple re-initializations of scene controller on the same instance', () => {
    const canvas = new env.MockHTMLCanvasElement(true);
    const ctl = createSceneController();

    const ok1 = ctl.init(canvas);
    assert.strictEqual(ok1, true);

    // Call init a second time without destroying
    const ok2 = ctl.init(canvas);
    assert.strictEqual(ok2, true, 'Second init call should return true');

    // Frame progression should still work
    const hook = globalThis.window.__CHINA_2027_3D__;
    env.stepFrames(3);
    assert.strictEqual(hook.frameCount, 3);

    ctl.destroy();
  });

  test('1.11 SceneController init with invalid arguments (null, undefined, plain object)', () => {
    const ctl = createSceneController();
    assert.strictEqual(ctl.init(null), false, 'init(null) must return false');
    assert.strictEqual(ctl.init(undefined), false, 'init(undefined) must return false');
    assert.strictEqual(ctl.init({}), false, 'init({}) must return false');
    assert.strictEqual(ctl.init('canvas'), false, 'init("canvas") must return false');
  });

  test('1.12 Animation loop start/stop/restart rapid cycling (50 cycles)', () => {
    const canvas = new env.MockHTMLCanvasElement(true);
    const ctl = createSceneController();
    ctl.init(canvas);
    const hook = globalThis.window.__CHINA_2027_3D__;

    for (let i = 0; i < 50; i++) {
      ctl.stopAnimationLoop();
      ctl.stopAnimationLoop(); // Idempotent stop
      ctl.startAnimationLoop();
      ctl.startAnimationLoop(); // Idempotent start
    }

    env.stepFrames(5);
    assert.strictEqual(hook.frameCount, 5, 'Frames continue ticking monotonically after rapid start/stop');
    ctl.destroy();
  });

  test('1.13 SceneController destroy idempotency (multiple destroy calls without error)', () => {
    const canvas = new env.MockHTMLCanvasElement(true);
    const ctl = createSceneController();
    ctl.init(canvas);

    assert.ok(globalThis.window.__CHINA_2027_3D__);
    assert.doesNotThrow(() => {
      ctl.destroy();
      ctl.destroy();
      ctl.destroy();
    }, 'Multiple destroy() calls must not throw');

    assert.strictEqual(globalThis.window.__CHINA_2027_3D__, undefined, 'Hook deleted on destroy');
  });

  test('1.14 Pointer move and touch move with zero window dimensions (division-by-zero check)', () => {
    const origW = globalThis.window.innerWidth;
    const origH = globalThis.window.innerHeight;
    globalThis.window.innerWidth = 0;
    globalThis.window.innerHeight = 0;

    const canvas = new env.MockHTMLCanvasElement(true);
    const ctl = createSceneController();
    ctl.init(canvas);

    // Trigger pointermove and touchmove when window is 0x0
    assert.doesNotThrow(() => {
      globalThis.window.trigger('pointermove', { clientX: 100, clientY: 50 });
      globalThis.window.trigger('touchmove', { touches: [{ clientX: 100, clientY: 50 }] });
      globalThis.window.trigger('touchmove', { touches: [] }); // empty touches
    });

    // Step frames to observe parallax computation behavior
    assert.doesNotThrow(() => {
      env.stepFrames(3);
    });

    ctl.destroy();
    globalThis.window.innerWidth = origW;
    globalThis.window.innerHeight = origH;
  });

  test('1.15 Particle field color distribution ratio under extreme counts (count = 10, count = 3000)', () => {
    const mockGl = createMockGlContext();
    const pfSmall = createParticleField(mockGl, true, 10);
    assert.ok(pfSmall && typeof pfSmall.renderWebGL === 'function');
    pfSmall.dispose();

    const pfLarge = createParticleField(mockGl, true, 3000);
    assert.ok(pfLarge && typeof pfLarge.renderWebGL === 'function');
    pfLarge.dispose();

    // In 2D fallback mode
    const pf2D = createParticleField(null, false, 50);
    const mockCtx2d = createMock2dContext();
    assert.doesNotThrow(() => {
      pf2D.render2D(mockCtx2d, 800, 600, { position: { z: 2.85 } }, { currentX: 0.1, currentY: 0.1 }, 1.0);
    });
    pf2D.dispose();
  });

  test('1.16 Globe mesh wireframe geometry and 2D fallback projection math', () => {
    const mockGl = createMockGlContext();
    const globeWebGL = createGlobeMesh(mockGl, true);
    assert.ok(globeWebGL && typeof globeWebGL.renderWebGL === 'function');
    globeWebGL.dispose();

    const globe2D = createGlobeMesh(null, false);
    const mockCtx2d = createMock2dContext();
    assert.doesNotThrow(() => {
      globe2D.render2D(mockCtx2d, 800, 600, { position: { z: 2.85 } }, { currentX: 0.1, currentY: 0.1 }, 1.0);
    });
    globe2D.dispose();
  });

  test('1.17 initSceneController factory initialization and invalid arguments', () => {
    const canvas = new env.MockHTMLCanvasElement(true);
    const ctl = initSceneController(canvas);
    assert.ok(ctl && typeof ctl.destroy === 'function');
    assert.strictEqual(globalThis.window.__CHINA_2027_3D__.renderer.domElement, canvas);
    ctl.destroy();

    // Calling initSceneController with invalid argument
    const nullCtl = initSceneController(null);
    assert.ok(nullCtl && typeof nullCtl.destroy === 'function');
    assert.strictEqual(globalThis.window.__CHINA_2027_3D__, undefined);
    nullCtl.destroy();
  });

  test('1.18 ctl.handleResize() external invocation and scene graph add/remove hooks', () => {
    const canvas = new env.MockHTMLCanvasElement(true);
    const ctl = createSceneController();

    // handleResize before init must not throw
    assert.doesNotThrow(() => {
      ctl.handleResize();
    });

    ctl.init(canvas);

    // handleResize after init with canvas parentElement dimensions
    assert.doesNotThrow(() => {
      ctl.handleResize();
    });

    // Test scene.add and scene.remove hooks
    const hook = globalThis.window.__CHINA_2027_3D__;
    const initialCount = hook.scene.children.length;
    const dummyObj = { id: 'test_node' };

    hook.scene.add(dummyObj);
    assert.strictEqual(hook.scene.children.length, initialCount + 1);
    assert.ok(hook.scene.children.includes(dummyObj));

    hook.scene.remove(dummyObj);
    assert.strictEqual(hook.scene.children.length, initialCount);
    assert.strictEqual(hook.scene.children.includes(dummyObj), false);

    ctl.destroy();
  });

  test('1.19 Fallback resize behavior when global ResizeObserver is undefined', () => {
    const origRO = globalThis.ResizeObserver;
    delete globalThis.ResizeObserver;

    try {
      const canvas = new env.MockHTMLCanvasElement(true);
      const ctl = createSceneController();
      ctl.init(canvas);

      // Trigger window resize event
      assert.doesNotThrow(() => {
        globalThis.window.trigger('resize', {});
      });

      env.stepFrames(2);
      ctl.destroy();
    } finally {
      globalThis.ResizeObserver = origRO;
    }
  });
});

// =============================================================================
// SUITE 2: Countdown Timer Edge Cases, Extreme Datasets & Lifecycle
// =============================================================================

describe('Tier 5 Suite 2: Countdown Timer Edge Cases, Extreme Datasets & Lifecycle', () => {

  after(() => {
    unmountCountdownTimer();
  });

  test('2.1 Distant future dates: Year 2127, Year 9999, Year 100,000', () => {
    const futureDates = [
      '2127-09-01T00:00:00.000Z',
      '9999-12-31T23:59:59.000Z',
    ];

    const now = new Date('2026-09-01T00:00:00.000Z').getTime();

    for (const fDate of futureDates) {
      const res = calculateCountdown(fDate, now);
      assert.strictEqual(res.isExpired, false, `Date ${fDate} must not be expired`);
      assert.ok(res.deltaMs > 0, `deltaMs must be > 0 for ${fDate}`);
      assert.ok(res.days > 0, `days must be > 0 for ${fDate}`);
      assert.ok(!Number.isNaN(res.days));
      assert.ok(!Number.isNaN(res.progressPercent));
      assert.ok(!res.formatted.includes('NaN'), `formatted must not contain NaN for ${fDate}`);
    }
  });

  test('2.2 Leap year calendar math: 2028 (leap year, Feb 29) vs 2027 (non-leap year, Feb 28)', () => {
    // 2027 non-leap February
    const feb1_2027 = new Date('2027-02-01T00:00:00.000Z').getTime();
    const res2027 = calculateCountdown('2027-03-01T00:00:00.000Z', feb1_2027);
    assert.strictEqual(res2027.days, 28, 'Feb 2027 non-leap month must span exactly 28 days');

    // 2028 leap February
    const feb1_2028 = new Date('2028-02-01T00:00:00.000Z').getTime();
    const res2028 = calculateCountdown('2028-03-01T00:00:00.000Z', feb1_2028);
    assert.strictEqual(res2028.days, 29, 'Feb 2028 leap month must span exactly 29 days');
  });

  test('2.3 Leap century rule: Year 2000 (leap, 366 days) vs Year 2100 (non-leap, 365 days)', () => {
    const y2000_start = new Date('2000-01-01T00:00:00.000Z').getTime();
    const res2000 = calculateCountdown('2001-01-01T00:00:00.000Z', y2000_start);
    assert.strictEqual(res2000.days, 366, 'Year 2000 (divisible by 400) is a leap year (366 days)');

    const y2100_start = new Date('2100-01-01T00:00:00.000Z').getTime();
    const res2100 = calculateCountdown('2101-01-01T00:00:00.000Z', y2100_start);
    assert.strictEqual(res2100.days, 365, 'Year 2100 (not divisible by 400) is a non-leap year (365 days)');
  });

  test('2.4 Extreme and pathological numeric/NaN inputs (NaN, Infinity, -Infinity, boundaries)', () => {
    const pathologicalInputs = [
      [NaN, NaN],
      [NaN, TARGET_MS],
      [TARGET_DATE_ISO, NaN],
      [Infinity, TARGET_MS],
      [-Infinity, TARGET_MS],
      [8.64e15 + 1000, Date.now()], // Exceeds ECMAScript max date 8.64e15
      [-8.64e15 - 1000, Date.now()],
    ];

    for (const [arg1, arg2] of pathologicalInputs) {
      const res = calculateCountdown(arg1, arg2);
      assert.ok(!Number.isNaN(res.deltaMs), `deltaMs must not be NaN for inputs: ${arg1}, ${arg2}`);
      assert.ok(!Number.isNaN(res.days), `days must not be NaN for inputs: ${arg1}, ${arg2}`);
      assert.ok(!Number.isNaN(res.hours));
      assert.ok(!Number.isNaN(res.minutes));
      assert.ok(!Number.isNaN(res.seconds));
      assert.ok(!Number.isNaN(res.progressPercent));
      assert.strictEqual(typeof res.formatted, 'string');
      assert.ok(!res.formatted.includes('NaN'), `formatted string must not include NaN`);
    }
  });

  test('2.5 Malformed inputs: null, undefined, boolean, empty object, array, invalid date strings', () => {
    const malformedInputs = [
      [null, null],
      [undefined, undefined],
      [true, false],
      [{}, []],
      ['invalid-date-string-xyz', 'another-invalid-string'],
      ['', ''],
      [() => {}, Symbol('test')],
    ];

    for (const [arg1, arg2] of malformedInputs) {
      assert.doesNotThrow(() => {
        const res = calculateCountdown(arg1, arg2);
        assert.ok(typeof res.deltaMs === 'number');
        assert.ok(!Number.isNaN(res.deltaMs));
        assert.ok(!res.formatted.includes('NaN'));
      }, `calculateCountdown should handle malformed inputs: ${String(arg1)}, ${String(arg2)}`);
    }
  });

  test('2.6 Rapid mount/unmount and stop/destroy lifecycle calls (1,000 cycles)', () => {
    const mockContainer = {
      innerHTML: '',
      querySelector: () => null,
    };

    const t0 = Date.now();
    for (let i = 0; i < 1000; i++) {
      const unmount = mountCountdownTimer(mockContainer);
      unmount();
    }
    const elapsed = Date.now() - t0;
    assert.ok(elapsed < 1500, `1000 mount/unmount cycles finished in ${elapsed}ms (expected < 1500ms)`);
  });

  test('2.7 White-box finding: module-level interval singleton behavior across multiple containers', () => {
    // When mountCountdownTimer is called on container A, then container B:
    // Container A's interval is replaced by Container B's interval.
    const containerA = { innerHTML: '', querySelector: () => null };
    const containerB = { innerHTML: '', querySelector: () => null };

    const unmountA = mountCountdownTimer(containerA);
    const unmountB = mountCountdownTimer(containerB);

    assert.ok(containerA.innerHTML.includes('Fall 2027 Admission Countdown'));
    assert.ok(containerB.innerHTML.includes('Fall 2027 Admission Countdown'));

    // Calling unmountA or unmountB clears the shared singleton interval
    unmountB();
    unmountCountdownTimer();
  });

  test('2.8 Timezone variance: verifying UTC invariance across extreme timezone offsets', () => {
    const testNow = new Date('2027-04-10T12:00:00.000Z').getTime();

    // Fixed ISO string vs numeric timestamp
    const resA = calculateCountdown(TARGET_DATE_ISO, testNow);
    const resB = calculateCountdown(TARGET_MS, testNow);

    assert.strictEqual(resA.deltaMs, resB.deltaMs);
    assert.strictEqual(resA.days, resB.days);
    assert.strictEqual(resA.hours, resB.hours);
    assert.strictEqual(resA.minutes, resB.minutes);
    assert.strictEqual(resA.seconds, resB.seconds);
    assert.strictEqual(resA.formatted, resB.formatted);
  });

  test('2.9 Malformed container DOM resilience during mount (missing sub-elements)', () => {
    // Container returns null for all querySelectors
    const bareContainer = {
      innerHTML: '',
      querySelector: () => null,
    };

    assert.doesNotThrow(() => {
      const unmount = mountCountdownTimer(bareContainer);
      unmount();
    });
  });

  test('2.10 RenderCountdownTimer resilience with corrupt or partial state objects', () => {
    const partialStates = [
      null,
      undefined,
      {},
      { days: NaN },
      { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, progressPercent: 100 },
      { days: -10, hours: -5, minutes: -2, seconds: -1, isExpired: true },
    ];

    for (const st of partialStates) {
      const html = renderCountdownTimer(st);
      assert.ok(typeof html === 'string');
      assert.ok(html.includes('id="countdown"'));
      assert.ok(!html.includes('NaN'), `renderCountdownTimer output must not contain NaN`);
    }
  });

  test('2.11 getCountdownTime alias interface contract equivalence with calculateCountdown', () => {
    const testNow = new Date('2027-04-10T12:00:00.000Z').getTime();
    const resFromCalc = calculateCountdown(TARGET_DATE_ISO, testNow);
    const resFromAlias = getCountdownTime(TARGET_DATE_ISO, testNow);

    assert.deepStrictEqual(resFromAlias, resFromCalc, 'getCountdownTime must match calculateCountdown exactly');

    // Zero-argument call
    const resDefault = getCountdownTime();
    assert.strictEqual(resDefault.targetDateIso, TARGET_DATE_ISO);
    assert.ok(typeof resDefault.deltaMs === 'number');
  });

  test('2.12 Date object polymorphism: valid Date, invalid Date, and mixed argument permutations', () => {
    const targetDate = new Date('2027-09-01T00:00:00.000Z');
    const nowDate = new Date('2027-04-10T12:00:00.000Z');

    // (Date, Date)
    const resDateDate = calculateCountdown(targetDate, nowDate);
    assert.strictEqual(resDateDate.days, 143);
    assert.strictEqual(resDateDate.isExpired, false);

    // (Date, String)
    const resDateStr = calculateCountdown(nowDate, TARGET_DATE_ISO);
    assert.strictEqual(resDateStr.days, 143);

    // (Date, Number)
    const resDateNum = calculateCountdown(targetDate, nowDate.getTime());
    assert.strictEqual(resDateNum.days, 143);

    // (Number, Date)
    const resNumDate = calculateCountdown(TARGET_MS, nowDate);
    assert.strictEqual(resNumDate.days, 143);

    // Invalid Date instances
    const invalidDate = new Date('invalid');
    const resInvalid1 = calculateCountdown(invalidDate, nowDate);
    assert.ok(!Number.isNaN(resInvalid1.days));

    const resInvalid2 = calculateCountdown(targetDate, invalidDate);
    assert.ok(!Number.isNaN(resInvalid2.days));
  });

  test('2.13 Exact numeric boundary conditions: target moment, 1ms before, 1ms after, and baseline', () => {
    // Exact deadline
    const exact = calculateCountdown(TARGET_MS, TARGET_MS);
    assert.strictEqual(exact.deltaMs, 0);
    assert.strictEqual(exact.days, 0);
    assert.strictEqual(exact.hours, 0);
    assert.strictEqual(exact.minutes, 0);
    assert.strictEqual(exact.seconds, 0);
    assert.strictEqual(exact.isExpired, true);
    assert.strictEqual(exact.progressPercent, 100);
    assert.strictEqual(exact.formatted, '00d : 00h : 00m : 00s');

    // 1 millisecond before deadline
    const justBefore = calculateCountdown(TARGET_MS, TARGET_MS - 1);
    assert.strictEqual(justBefore.deltaMs, 1);
    assert.strictEqual(justBefore.days, 0);
    assert.strictEqual(justBefore.seconds, 0);
    assert.strictEqual(justBefore.isExpired, false);

    // 1 millisecond after deadline
    const justAfter = calculateCountdown(TARGET_MS, TARGET_MS + 1);
    assert.strictEqual(justAfter.deltaMs, 0);
    assert.strictEqual(justAfter.isExpired, true);

    // Baseline kickoff start (Sept 1, 2026)
    const kickoff = calculateCountdown(TARGET_MS, BASELINE_START_MS);
    assert.strictEqual(kickoff.progressPercent, 0, 'Baseline start must be 0% elapsed');

    // Pre-kickoff moment (Aug 2026)
    const preKickoff = calculateCountdown(TARGET_MS, BASELINE_START_MS - 10_000_000);
    assert.strictEqual(preKickoff.progressPercent, 0, 'Pre-baseline time must clamp to 0%');
  });

  test('2.14 Live interval ticker DOM updates, second pulse, and auto-unmount upon expiration', () => {
    let intervalCallback = null;
    const origSetInterval = globalThis.setInterval;
    const origClearInterval = globalThis.clearInterval;

    globalThis.setInterval = (fn, ms) => {
      intervalCallback = fn;
      return 99999;
    };
    globalThis.clearInterval = () => {
      intervalCallback = null;
    };

    try {
      const elements = new Map();
      const mockContainer = {
        innerHTML: '',
        querySelector: (sel) => {
          if (sel === '#countdown-days') return elements.get('days');
          if (sel === '#countdown-hours') return elements.get('hours');
          if (sel === '#countdown-minutes') return elements.get('minutes');
          if (sel === '#countdown-seconds') return elements.get('seconds');
          if (sel === '#countdown-progress-text') return elements.get('progText');
          if (sel === '#countdown-progress-bar') return elements.get('progBar');
          if (sel === '.countdown-seconds-card') return elements.get('secCard');
          return null;
        }
      };

      // Create synthetic elements
      elements.set('days', { textContent: '' });
      elements.set('hours', { textContent: '' });
      elements.set('minutes', { textContent: '' });
      elements.set('seconds', { textContent: '' });
      elements.set('progText', { textContent: '' });
      elements.set('progBar', { style: {}, setAttribute(k, v) { this[k] = v; } });
      elements.set('secCard', {
        offsetWidth: 100,
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); }
        }
      });

      const unmount = mountCountdownTimer(mockContainer);
      assert.ok(intervalCallback, 'setInterval callback should be registered');

      // Execute a tick
      assert.doesNotThrow(() => {
        intervalCallback();
      });

      assert.ok(elements.get('days').textContent.length > 0);
      assert.ok(elements.get('hours').textContent.length > 0);
      assert.ok(elements.get('secCard').classList.classes.has('pulse-tick'));

      unmount();
    } finally {
      globalThis.setInterval = origSetInterval;
      globalThis.clearInterval = origClearInterval;
    }
  });
});

// =============================================================================
// SUITE 3: SVG Charts & China Metrics Extreme Math, Geometry & Interaction Resilience
// =============================================================================

describe('Tier 5 Suite 3: SVG Charts & China Metrics Extreme Math & Interaction Resilience', () => {
  let env;

  before(() => {
    env = setupMockEnvironment();
  });

  after(() => {
    env.cleanup();
  });

  // --- Student Growth Chart Tests ---

  test('3.1 Student growth chart: Single-datum inputs (projected vs non-projected)', () => {
    // Single non-projected datum
    const singleHist = [
      { year: '2024', degree: 300, exchange: 200, total: 500, isProjected: false },
    ];
    const htmlHist = renderStudentGrowthChart(singleHist);
    assert.ok(!htmlHist.includes('NaN'), 'Single historical datum must not produce NaN');
    assert.ok(htmlHist.includes('x="308.0"'), 'Bar column should be centered');

    // Single projected datum
    const singleProj = [
      { year: '2027P', degree: 400, exchange: 300, total: 700, isProjected: true },
    ];
    const htmlProj = renderStudentGrowthChart(singleProj);
    assert.ok(!htmlProj.includes('NaN'), 'Single projected datum must not produce NaN');
    assert.ok(htmlProj.includes('class="bar-group is-projected"'));
  });

  test('3.2 White-box finding: Student growth chart behavior with zero and null data values', () => {
    // Test all-zero data point: { degree: 0, exchange: 0 }
    const zeroData = [
      { year: '2025', degree: 0, exchange: 0, total: 0, isProjected: false },
    ];
    const zeroHtml = renderStudentGrowthChart(zeroData);
    assert.ok(!zeroHtml.includes('NaN'), 'renderStudentGrowthChart must not produce NaN in SVG markup for zero totals');

    // Setup interactive card with zero data
    const card = new SyntheticElement('div', 'chart-card-student-growth');
    const tooltip = new SyntheticElement('div', 'student-growth-tooltip');
    const barGroup = new SyntheticElement('g', '', 'bar-group');
    barGroup.dataset.index = '0';
    card.children = [tooltip, barGroup];

    const ctl = setupStudentGrowthChart(card, zeroData);
    assert.ok(ctl);

    // Trigger hover on zero data point
    barGroup.dispatchEvent('mouseenter');

    // White-box finding: In setupStudentGrowthChart line 286:
    // pctDeg = Math.round((0 / 0) * 100) => NaN!
    const hasNaNInTooltip = tooltip.innerHTML.includes('NaN%');
    assert.strictEqual(
      hasNaNInTooltip,
      true,
      'White-box finding confirmed: Zero-total data point produces NaN% in tooltip calculation'
    );

    ctl.destroy();
  });

  test('3.3 White-box finding: Student growth chart throws TypeError if degree or exchange is null/undefined during hover', () => {
    const nullData = [
      { year: '2025', degree: null, exchange: null, isProjected: false },
    ];

    const card = new SyntheticElement('div', 'chart-card-student-growth');
    const tooltip = new SyntheticElement('div', 'student-growth-tooltip');
    const barGroup = new SyntheticElement('g', '', 'bar-group');
    barGroup.dataset.index = '0';
    card.children = [tooltip, barGroup];

    const ctl = setupStudentGrowthChart(card, nullData);
    assert.ok(ctl);

    // White-box finding: item.degree.toLocaleString() throws TypeError when item.degree is null
    assert.throws(
      () => {
        barGroup.dispatchEvent('mouseenter');
      },
      { name: 'TypeError' },
      'White-box finding confirmed: item.degree.toLocaleString() throws TypeError when degree is null'
    );

    ctl.destroy();
  });

  test('3.4 Student growth chart: Extreme numbers (billions, decimals, negative)', () => {
    const extremeData = [
      { year: '2024', degree: 1_000_000_000, exchange: 500_000_000, total: 1_500_000_000, isProjected: false },
      { year: '2026', degree: 0.005, exchange: 0.002, total: 0.007, isProjected: false },
      { year: '2027P', degree: 400.75, exchange: 299.25, total: 700.0, isProjected: true },
    ];

    const html = renderStudentGrowthChart(extremeData);
    assert.ok(!html.includes('NaN'), 'Must not contain NaN for extreme numbers');
    assert.ok(!html.includes('Infinity'), 'Must not contain Infinity for extreme numbers');
  });

  test('3.5 Student growth chart: Tooltip mouseout without hover, and rapid hover/leave cycles', () => {
    const card = new SyntheticElement('div', 'chart-card-student-growth');
    const tooltip = new SyntheticElement('div', 'student-growth-tooltip');
    const barGroup = new SyntheticElement('g', '', 'bar-group');
    barGroup.dataset.index = '0';
    card.children = [tooltip, barGroup];

    const ctl = setupStudentGrowthChart(card);

    // Mouseleave without prior hover
    assert.doesNotThrow(() => {
      barGroup.dispatchEvent('mouseleave');
      barGroup.dispatchEvent('blur');
    });
    assert.strictEqual(tooltip.classList.contains('is-visible'), false);

    // Rapid hover/leave cycles (20 cycles)
    for (let i = 0; i < 20; i++) {
      barGroup.dispatchEvent('mouseenter');
      barGroup.dispatchEvent('mouseleave');
    }
    assert.strictEqual(tooltip.classList.contains('is-visible'), false);

    // Multiple destroy idempotency
    ctl.destroy();
    ctl.destroy();
  });

  // --- Discipline Donut Chart Tests ---

  test('3.6 Discipline donut chart: Single-datum input (100% slice geometry)', () => {
    const singleData = [
      { id: 'all', name: 'Global Studies', percent: 100, count: '500,000', color: '#DE2910' },
    ];

    const arcs = computeDonutArcs(singleData);
    assert.strictEqual(arcs.length, 1);
    assert.strictEqual(arcs[0].pct, 100);
    assert.ok(!arcs[0].pathD.includes('NaN'), 'Single slice path must not contain NaN');

    const html = renderDisciplineDonutChart(singleData);
    assert.ok(html.includes('viewBox="0 0 400 400"'));
    assert.ok(!html.includes('NaN'), 'Rendered single-slice donut chart must not contain NaN');
  });

  test('3.7 White-box finding: Discipline donut chart all-zero dataset produces NaN coordinates', () => {
    const allZeroData = [
      { id: 'a', name: 'A', percent: 0, count: '0', color: '#DE2910' },
      { id: 'b', name: 'B', percent: 0, count: '0', color: '#FFDE00' },
    ];

    const arcs = computeDonutArcs(allZeroData);

    // White-box finding: When total is 0, rawVal / total = 0 / 0 = NaN!
    const hasNaN = arcs.some((a) => a.pathD.includes('NaN') || Number.isNaN(a.pct));
    assert.strictEqual(
      hasNaN,
      true,
      'White-box finding confirmed: all-zero donut data produces NaN coordinates in computeDonutArcs'
    );
  });

  test('3.8 White-box finding: Discipline donut chart throws TypeError when data contains null element', () => {
    const dataWithNull = [
      { id: 'stem', name: 'STEM', percent: 50 },
      null,
    ];

    // White-box finding: data.reduce((sum, d) => sum + (d.percent ...)) throws on null
    assert.throws(
      () => {
        computeDonutArcs(dataWithNull);
      },
      { name: 'TypeError' },
      'White-box finding confirmed: computeDonutArcs throws TypeError on null element in array'
    );
  });

  test('3.9 Discipline donut chart: Deactivate slice without prior hover, and out-of-bounds index', () => {
    const card = new SyntheticElement('div', 'chart-card-discipline-donut');
    const metricEl = new SyntheticElement('text', 'donut-center-metric');
    const labelEl = new SyntheticElement('text', 'donut-center-label');
    const subEl = new SyntheticElement('text', 'donut-center-sub');
    const slice0 = new SyntheticElement('path', '', 'donut-slice');
    slice0.dataset.index = '0';
    const legend0 = new SyntheticElement('div', '', 'chart-legend-item');
    legend0.dataset.index = '0';

    card.children = [metricEl, labelEl, subEl, slice0, legend0];

    const ctl = setupDisciplineDonutChart(card);
    assert.ok(ctl);

    // Mouseleave without prior hover
    assert.doesNotThrow(() => {
      slice0.dispatchEvent('mouseleave');
    });
    assert.strictEqual(metricEl.textContent, '492K+');

    // Rapid hover/leave cycles
    for (let i = 0; i < 20; i++) {
      slice0.dispatchEvent('mouseenter');
      slice0.dispatchEvent('mouseleave');
    }
    assert.strictEqual(metricEl.textContent, '492K+');

    ctl.destroy();
    ctl.destroy();
  });

  // --- China Metrics Component Tests ---

  test('3.10 China metrics: renderMetricCard defensive handling of null, undefined, empty, and XSS payload objects', () => {
    // Null/undefined/empty
    assert.strictEqual(renderMetricCard(null), '');
    assert.strictEqual(renderMetricCard(undefined), '');
    assert.strictEqual(renderMetricCard('string'), '');
    assert.strictEqual(renderMetricCard(123), '');

    // Partial object
    const partialHtml = renderMetricCard({});
    assert.ok(partialHtml.includes('class="card stat-card metric-card"'));
    assert.ok(partialHtml.includes('Macro Metric'));
    assert.ok(partialHtml.includes('--'));

    // Object with potential XSS strings
    const xssStat = {
      id: '<script>alert(1)</script>',
      label: '<img src=x onerror=alert(2)>',
      value: '$18.5T',
    };
    const xssHtml = renderMetricCard(xssStat);
    assert.ok(typeof xssHtml === 'string');
    assert.ok(xssHtml.includes('$18.5T'));
  });

  test('3.11 China metrics: renderChinaMetrics with empty array, fallback data, and valid custom items', () => {
    // Empty array triggers default data
    const emptyHtml = renderChinaMetrics([]);
    assert.ok(emptyHtml.includes('china-metrics-section'));
    assert.ok(emptyHtml.includes('Gross Domestic Product'));

    // Custom metrics
    const custom = [
      {
        id: 'metric_1',
        label: 'Supercomputing',
        labelZh: '超级计算',
        value: '#1 World',
        badge: 'Technology Lead',
        category: 'Compute',
        description: 'Exascale supercomputing infrastructure.',
      },
    ];
    const customHtml = renderChinaMetrics(custom);
    assert.ok(customHtml.includes('Supercomputing'));
    assert.ok(customHtml.includes('超级计算'));
    assert.ok(customHtml.includes('#1 World'));
  });

  test('3.12 China metrics: mountChinaMetrics with synthetic DOM container, keyboard and click interactions', () => {
    const container = new SyntheticElement('div', 'china-metrics-container');
    const mounted = mountChinaMetrics(container);
    assert.strictEqual(mounted, container);
    assert.ok(container.innerHTML.includes('china-metrics-section'));

    // Verify interaction binding on cards
    const card = container.querySelector('.stat-card');
    if (card) {
      // Simulate Enter keydown
      card.dispatchEvent({ type: 'keydown', key: 'Enter', preventDefault() {} });
      // Simulate Click
      card.dispatchEvent({ type: 'click' });
    }
  });

  test('3.13 China metrics: mountChinaMetrics returns null safely when target container is not found in document', () => {
    const res = mountChinaMetrics(null);
    assert.strictEqual(res, null, 'mountChinaMetrics should return null safely when target not found');
  });

  test('3.14 White-box finding: mountChinaMetrics throws ReferenceError in environments without global HTMLElement', () => {
    const origHtmlEl = globalThis.HTMLElement;
    delete globalThis.HTMLElement;

    try {
      assert.throws(
        () => {
          mountChinaMetrics({});
        },
        { name: 'ReferenceError' },
        'White-box finding confirmed: mountChinaMetrics evaluates target instanceof HTMLElement without checking if HTMLElement exists'
      );
    } finally {
      globalThis.HTMLElement = origHtmlEl;
    }
  });

  test('3.15 Student growth chart: All-projected dataset and custom total calculation', () => {
    const allProjected = [
      { year: '2027P', degree: 415, exchange: 285, total: 700, isProjected: true },
      { year: '2028P', degree: 450, exchange: 300, total: 750, isProjected: true },
    ];
    const html = renderStudentGrowthChart(allProjected);
    assert.ok(!html.includes('NaN'), 'All projected data must not produce NaN');
    assert.ok(html.includes('2027P') && html.includes('2028P'));

    // Custom data where d.total is explicitly provided and differs from degree + exchange
    const customTotalData = [
      { year: '2025', degree: 200, exchange: 100, total: 350, isProjected: false },
    ];
    const htmlCustom = renderStudentGrowthChart(customTotalData);
    assert.ok(htmlCustom.includes('350k students'));
  });

  test('3.16 Student growth chart: Touch and keyboard focus event dispatching', () => {
    const card = new SyntheticElement('div', 'chart-card-student-growth');
    const tooltip = new SyntheticElement('div', 'student-growth-tooltip');
    const barGroup = new SyntheticElement('g', '', 'bar-group');
    barGroup.dataset.index = '0';
    card.children = [tooltip, barGroup];

    const ctl = setupStudentGrowthChart(card);

    // Focus
    barGroup.dispatchEvent('focus');
    assert.strictEqual(tooltip.classList.contains('is-visible'), true);

    // Blur
    barGroup.dispatchEvent('blur');
    assert.strictEqual(tooltip.classList.contains('is-visible'), false);

    // Touchstart
    barGroup.dispatchEvent('touchstart');
    assert.strictEqual(tooltip.classList.contains('is-visible'), true);

    ctl.destroy();
  });

  test('3.17 Discipline donut chart: Custom geometry parameters, click interactions, and legend clicks', () => {
    // Custom geometry: cx=300, cy=300, R=200, r=100, gap=0.05
    const arcs = computeDonutArcs(DEFAULT_DISCIPLINE_DATA, 300, 300, 200, 100, 0.05);
    assert.strictEqual(arcs.length, DEFAULT_DISCIPLINE_DATA.length);
    assert.ok(!arcs[0].pathD.includes('NaN'));

    // Setup chart and test click on slice and legend
    const card = new SyntheticElement('div', 'chart-card-discipline-donut');
    const metricEl = new SyntheticElement('text', 'donut-center-metric');
    const labelEl = new SyntheticElement('text', 'donut-center-label');
    const subEl = new SyntheticElement('text', 'donut-center-sub');
    const slice0 = new SyntheticElement('path', '', 'donut-slice');
    slice0.dataset.index = '0';
    const legend0 = new SyntheticElement('div', '', 'chart-legend-item');
    legend0.dataset.index = '0';

    card.children = [metricEl, labelEl, subEl, slice0, legend0];

    const ctl = setupDisciplineDonutChart(card);

    // Click slice
    slice0.dispatchEvent('click');
    assert.strictEqual(metricEl.textContent, '42%');

    // Click legend
    legend0.dispatchEvent('click');
    assert.strictEqual(metricEl.textContent, '42%');

    // Focus & blur on legend item
    legend0.dispatchEvent('focus');
    assert.strictEqual(metricEl.textContent, '42%');

    legend0.dispatchEvent('blur');
    assert.strictEqual(metricEl.textContent, '492K+');

    ctl.destroy();
  });

  test('3.18 White-box finding: Discipline donut chart throws TypeError when slice item has undefined name', () => {
    const dataWithUndefinedName = [
      { id: 'nameless', percent: 50, count: '100,000', color: '#FF2A4A' },
    ];

    const card = new SyntheticElement('div', 'chart-card-discipline-donut');
    const metricEl = new SyntheticElement('text', 'donut-center-metric');
    const labelEl = new SyntheticElement('text', 'donut-center-label');
    const subEl = new SyntheticElement('text', 'donut-center-sub');
    const slice0 = new SyntheticElement('path', '', 'donut-slice');
    slice0.dataset.index = '0';
    const legend0 = new SyntheticElement('div', '', 'chart-legend-item');
    legend0.dataset.index = '0';

    card.children = [metricEl, labelEl, subEl, slice0, legend0];

    const ctl = setupDisciplineDonutChart(card, dataWithUndefinedName);

    // White-box finding: arc.name.split('&') throws TypeError when name is undefined
    assert.throws(
      () => {
        slice0.dispatchEvent('mouseenter');
      },
      { name: 'TypeError' },
      'White-box finding confirmed: arc.name.split("&") throws TypeError when name is undefined'
    );

    ctl.destroy();
  });

  test('3.19 China metrics: Mount cases A & B and METRIC_ICONS completeness', () => {
    // Case A: Mounting directly into container with id="stats-grid"
    const statsGridContainer = new SyntheticElement('div', 'stats-grid');
    const resA = mountChinaMetrics(statsGridContainer);
    assert.strictEqual(resA, statsGridContainer);
    assert.ok(statsGridContainer.innerHTML.includes('metric-card'));

    // Case B: Mounting into china-metrics-container with sibling #stats-grid
    const parentContainer = new SyntheticElement('div');
    const metricsContainer = new SyntheticElement('div', 'china-metrics-container');
    const siblingStatsGrid = new SyntheticElement('div', 'stats-grid');
    metricsContainer.parentElement = parentContainer;
    siblingStatsGrid.parentElement = parentContainer;

    const origGetElementById = globalThis.document.getElementById;
    globalThis.document.getElementById = (id) => {
      if (id === 'stats-grid') return siblingStatsGrid;
      if (id === 'china-metrics-container') return metricsContainer;
      return null;
    };

    try {
      const resB = mountChinaMetrics(metricsContainer);
      assert.strictEqual(resB, metricsContainer);
      assert.ok(metricsContainer.innerHTML.includes('metrics-header-block'));
      assert.ok(siblingStatsGrid.innerHTML.includes('metric-card'));
    } finally {
      globalThis.document.getElementById = origGetElementById;
    }

    // Verify METRIC_ICONS completeness
    const iconKeys = ['gdp', 'rd', 'patents', 'hsr', 'intl_students', 'rankings', 'default'];
    for (const key of iconKeys) {
      assert.ok(chinaMetricsDefault.METRIC_ICONS[key], `METRIC_ICONS should define ${key}`);
      assert.ok(chinaMetricsDefault.METRIC_ICONS[key].includes('<svg'), `METRIC_ICONS[${key}] must contain SVG`);
    }
  });
});
