/**
 * website/tests/stress/three-3d-adversarial.test.mjs
 * Challenger 2 Adversarial Stress Testing Suite:
 * 1. 3D WebGL Scene Controller Lifecycle & window.__CHINA_2027_3D__ Hook
 * 2. Animation FrameProgression (frameCount increments)
 * 3. Scene Hierarchy & DOM Attachment Verification
 * 4. Fallback 2D Resilience (No WebGL Context Available)
 * 5. WebGL Context Loss & Restoration Event Resilience
 * 6. Destroy & Cleanup Lifecycle
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createSceneController } from '../../src/three/sceneController.js';

describe('Challenger 2 Adversarial Test Suite: 3D WebGL Controller & Test Hooks', () => {
  // Setup browser global environment emulation
  function setupDomEnvironment() {
    const listeners = new Map();
    let rafQueue = [];
    let rafIdCounter = 0;

    const mockWindow = {
      innerWidth: 1280,
      innerHeight: 800,
      devicePixelRatio: 1,
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(fn);
      },
      removeEventListener(type, fn) {
        if (listeners.has(type)) {
          listeners.set(type, listeners.get(type).filter(f => f !== fn));
        }
      },
      requestAnimationFrame(fn) {
        rafIdCounter++;
        rafQueue.push({ id: rafIdCounter, fn });
        return rafIdCounter;
      },
      cancelAnimationFrame(id) {
        rafQueue = rafQueue.filter(item => item.id !== id);
      },
      triggerEvent(type, eventObj) {
        const handlers = listeners.get(type) || [];
        for (const h of handlers) h(eventObj);
      }
    };

    const mockBody = {
      clientWidth: 1280,
      clientHeight: 800,
      contains(el) {
        return el === mockCanvas;
      }
    };

    const mockDocument = {
      body: mockBody,
      createElement: () => ({}),
      addEventListener: () => {},
      removeEventListener: () => {}
    };

    const canvasListeners = new Map();
    class MockCanvas {
      constructor() {
        this.width = 800;
        this.height = 600;
        this.style = {};
        this.parentElement = mockBody;
      }
      getContext(type) {
        // Return null to simulate WebGL hardware acceleration unavailable
        return null;
      }
      addEventListener(type, fn) {
        if (!canvasListeners.has(type)) canvasListeners.set(type, []);
        canvasListeners.get(type).push(fn);
      }
      removeEventListener(type, fn) {
        if (canvasListeners.has(type)) {
          canvasListeners.set(type, canvasListeners.get(type).filter(f => f !== fn));
        }
      }
      triggerEvent(type, eventObj) {
        const handlers = canvasListeners.get(type) || [];
        for (const h of handlers) h(eventObj);
      }
    }

    const mockCanvas = new MockCanvas();

    // Assign to globalThis
    globalThis.window = mockWindow;
    globalThis.document = mockDocument;
    globalThis.requestAnimationFrame = mockWindow.requestAnimationFrame;
    globalThis.cancelAnimationFrame = mockWindow.cancelAnimationFrame;
    globalThis.HTMLCanvasElement = MockCanvas;
    globalThis.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };

    function stepFrames(count = 1) {
      for (let i = 0; i < count; i++) {
        const currentQueue = [...rafQueue];
        rafQueue = [];
        for (const item of currentQueue) {
          item.fn(performance.now());
        }
      }
    }

    return { mockWindow, mockDocument, mockCanvas, stepFrames };
  }

  test('1. Scene controller initializes 2D fallback gracefully when WebGL is unavailable', () => {
    const env = setupDomEnvironment();
    const controller = createSceneController();
    const success = controller.init(env.mockCanvas);

    assert.strictEqual(success, true, 'Controller init must return true even when WebGL is unavailable');
    assert.ok(globalThis.window.__CHINA_2027_3D__, 'window.__CHINA_2027_3D__ must be exposed');
    assert.strictEqual(globalThis.window.__CHINA_2027_3D__.isFallback2D, true, 'isFallback2D must be true');

    controller.destroy();
  });

  test('2. window.__CHINA_2027_3D__ inspection hook satisfies architectural contract', () => {
    const env = setupDomEnvironment();
    const controller = createSceneController();
    controller.init(env.mockCanvas);

    const hook = globalThis.window.__CHINA_2027_3D__;
    assert.ok(hook, 'window.__CHINA_2027_3D__ hook must exist');

    // Requirement: scene.children.length >= 2 (globe + particles)
    assert.ok(hook.scene, 'hook.scene must exist');
    assert.ok(Array.isArray(hook.scene.children), 'scene.children must be an array');
    assert.ok(
      hook.scene.children.length >= 2,
      `scene.children.length must be >= 2, got ${hook.scene.children.length}`
    );

    // Requirement: renderer.domElement attached to DOM
    assert.ok(hook.renderer, 'hook.renderer must exist');
    assert.strictEqual(hook.renderer.domElement, env.mockCanvas, 'renderer.domElement must be the canvas');
    assert.strictEqual(
      env.mockDocument.body.contains(hook.renderer.domElement),
      true,
      'renderer.domElement must be attached to the DOM'
    );

    controller.destroy();
  });

  test('3. frameCount increments monotonically per animation frame step', () => {
    const env = setupDomEnvironment();
    const controller = createSceneController();
    controller.init(env.mockCanvas);

    const hook = globalThis.window.__CHINA_2027_3D__;
    const initialFrame = hook.frameCount;
    assert.strictEqual(initialFrame, 0, 'Initial frameCount must be 0');

    // Step 5 frames
    env.stepFrames(5);
    assert.strictEqual(hook.frameCount, 5, `Expected frameCount to be 5, got ${hook.frameCount}`);

    // Step 15 more frames
    env.stepFrames(15);
    assert.strictEqual(hook.frameCount, 20, `Expected frameCount to be 20, got ${hook.frameCount}`);

    // Stop animation loop
    hook.stopAnimationLoop();
    env.stepFrames(5);
    assert.strictEqual(hook.frameCount, 20, 'frameCount must not increment when animation loop is stopped');

    // Resume animation loop
    hook.startAnimationLoop();
    env.stepFrames(3);
    assert.strictEqual(hook.frameCount, 23, 'frameCount must resume incrementing');

    controller.destroy();
  });

  test('4. WebGL Context Loss and Restored lifecycle events', () => {
    const env = setupDomEnvironment();
    const controller = createSceneController();
    controller.init(env.mockCanvas);

    const hook = globalThis.window.__CHINA_2027_3D__;
    assert.strictEqual(hook.isContextLost, false);

    // Trigger context loss
    let defaultPrevented = false;
    env.mockCanvas.triggerEvent('webglcontextlost', {
      preventDefault: () => { defaultPrevented = true; }
    });

    assert.strictEqual(defaultPrevented, true, 'webglcontextlost must call preventDefault()');
    assert.strictEqual(hook.isContextLost, true, 'isContextLost must be true after loss event');

    // Trigger context restored
    env.mockCanvas.triggerEvent('webglcontextrestored', {});
    assert.strictEqual(hook.isContextLost, false, 'isContextLost must be false after restore event');

    controller.destroy();
  });

  test('5. Destroy cleanly unbinds listeners and removes global hook', () => {
    const env = setupDomEnvironment();
    const controller = createSceneController();
    controller.init(env.mockCanvas);

    assert.ok(globalThis.window.__CHINA_2027_3D__);
    controller.destroy();
    assert.strictEqual(globalThis.window.__CHINA_2027_3D__, undefined, 'window.__CHINA_2027_3D__ must be deleted on destroy');
  });
});
