/**
 * sceneController.js
 * High-performance, zero-dependency 3D WebGL scene controller with
 * automatic Canvas 2D fallback, clamped DPR, ResizeObserver, and test hooks.
 */

import { createGlobeMesh } from './globeMesh.js';
import { createParticleField } from './particleField.js';

export function createSceneController() {
  let canvas = null;
  let gl = null;
  let ctx2d = null;
  let isWebGL = false;
  let isFallback2D = false;
  let isContextLost = false;
  let rafId = null;
  let resizeObserver = null;
  let lastTime = performance.now();
  let frameCount = 0;

  // Parallax tracking
  const parallax = {
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    damping: 0.05
  };

  // Camera settings
  const camera = {
    position: { x: 0, y: 0.1, z: 2.85 },
    fov: 55,
    aspect: 1,
    near: 0.1,
    far: 100,
    projectionMatrix: new Float32Array(16),
    viewMatrix: new Float32Array(16)
  };

  let globe = null;
  let particles = null;

  function init(canvasElement) {
    if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
      console.warn('SceneController: Invalid canvas element provided.');
      return false;
    }
    canvas = canvasElement;

    // 1. Attempt WebGL context acquisition with fallback options
    try {
      const opts = {
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false
      };

      gl = canvas.getContext('webgl2', opts) ||
           canvas.getContext('webgl', opts) ||
           canvas.getContext('experimental-webgl', opts);

      if (gl && !gl.isContextLost()) {
        isWebGL = true;
        isFallback2D = false;
      } else {
        activate2DFallback();
      }
    } catch (e) {
      activate2DFallback();
    }

    // 2. Initialize sub-modules
    globe = createGlobeMesh(gl, isWebGL);
    particles = createParticleField(gl, isWebGL, 1200);

    // 3. Register WebGL context loss handlers
    canvas.addEventListener('webglcontextlost', onContextLost, false);
    canvas.addEventListener('webglcontextrestored', onContextRestored, false);

    // 4. Register pointer & touch parallax listeners
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // 5. Setup ResizeObserver with DPR clamp Math.min(dpr, 2)
    setupResizeObserver();

    // 6. Expose browser automation test hook
    exposeTestHook();

    // 7. Start render loop
    startAnimationLoop();
    return true;
  }

  function activate2DFallback() {
    isWebGL = false;
    isFallback2D = true;
    try {
      ctx2d = canvas.getContext('2d');
    } catch (e) {
      // Guaranteed zero uncaught errors
    }
  }

  function onContextLost(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    isContextLost = true;
    if (window.__CHINA_2027_3D__) {
      window.__CHINA_2027_3D__.isContextLost = true;
    }
    activate2DFallback();
  }

  function onContextRestored() {
    isContextLost = false;
    try {
      const opts = { alpha: true, antialias: true };
      gl = canvas.getContext('webgl2', opts) || canvas.getContext('webgl', opts);
      if (gl && !gl.isContextLost()) {
        isWebGL = true;
        isFallback2D = false;
        globe = createGlobeMesh(gl, true);
        particles = createParticleField(gl, true, 1200);
      }
    } catch (e) {
      activate2DFallback();
    }
    if (window.__CHINA_2027_3D__) {
      window.__CHINA_2027_3D__.isContextLost = false;
      window.__CHINA_2027_3D__.isFallback2D = isFallback2D;
    }
  }

  function onPointerMove(e) {
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;
    parallax.targetX = (e.clientX - halfW) / halfW;
    parallax.targetY = (e.clientY - halfH) / halfH;
  }

  function onTouchMove(e) {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      parallax.targetX = (touch.clientX - halfW) / halfW;
      parallax.targetY = (touch.clientY - halfH) / halfH;
    }
  }

  function setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            handleResize(width, height);
          }
        }
      });
      const parent = canvas.parentElement || document.body;
      resizeObserver.observe(parent);
      handleResize(parent.clientWidth || window.innerWidth, parent.clientHeight || window.innerHeight);
    } else {
      window.addEventListener('resize', () => {
        handleResize(window.innerWidth, window.innerHeight);
      }, { passive: true });
      handleResize(window.innerWidth, window.innerHeight);
    }
  }

  function handleResize(width, height) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    camera.aspect = width / height;
    updateProjectionMatrix(camera);

    if (isWebGL && gl) {
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }

  function updateProjectionMatrix(cam) {
    const fovRad = (cam.fov * Math.PI) / 180;
    const f = 1.0 / Math.tan(fovRad / 2);
    const nf = 1 / (cam.near - cam.far);
    const out = cam.projectionMatrix;
    out[0] = f / cam.aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (cam.far + cam.near) * nf; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = 2 * cam.far * cam.near * nf; out[15] = 0;
  }

  function render(time) {
    frameCount++;
    if (window.__CHINA_2027_3D__) {
      window.__CHINA_2027_3D__.frameCount = frameCount;
    }

    // Parallax damping
    parallax.currentX += (parallax.targetX - parallax.currentX) * parallax.damping;
    parallax.currentY += (parallax.targetY - parallax.currentY) * parallax.damping;

    const dt = (time - lastTime) * 0.001;
    lastTime = time;

    if (isWebGL && gl && !isContextLost) {
      gl.clearColor(0.04, 0.047, 0.063, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive glowing blend

      if (particles && particles.renderWebGL) {
        particles.renderWebGL(gl, camera, parallax, time * 0.001);
      }
      if (globe && globe.renderWebGL) {
        globe.renderWebGL(gl, camera, parallax, time * 0.001);
      }
    } else if (ctx2d) {
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      if (particles && particles.render2D) {
        particles.render2D(ctx2d, canvas.width, canvas.height, camera, parallax, time * 0.001);
      }
      if (globe && globe.render2D) {
        globe.render2D(ctx2d, canvas.width, canvas.height, camera, parallax, time * 0.001);
      }
    }

    rafId = requestAnimationFrame(render);
  }

  function startAnimationLoop() {
    if (!rafId) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(render);
    }
  }

  function stopAnimationLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function exposeTestHook() {
    window.__CHINA_2027_3D__ = {
      scene: {
        children: [globe, particles],
        add(obj) { this.children.push(obj); },
        remove(obj) { this.children = this.children.filter(c => c !== obj); }
      },
      camera,
      renderer: {
        domElement: canvas,
        gl,
        isWebGL,
        isFallback2D,
        setSize: (w, h) => handleResize(w, h),
        render: () => {},
        dispose: () => destroy()
      },
      frameCount: 0,
      isContextLost,
      isFallback2D,
      startAnimationLoop,
      stopAnimationLoop,
      destroy
    };
  }

  function destroy() {
    stopAnimationLoop();
    if (resizeObserver) resizeObserver.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('touchmove', onTouchMove);
    if (canvas) {
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
    }
    if (globe && globe.dispose) globe.dispose();
    if (particles && particles.dispose) particles.dispose();
    delete window.__CHINA_2027_3D__;
  }

  return {
    init,
    startAnimationLoop,
    stopAnimationLoop,
    handleResize: () => {
      if (canvas) {
        const p = canvas.parentElement || document.body;
        handleResize(p.clientWidth || window.innerWidth, p.clientHeight || window.innerHeight);
      }
    },
    destroy
  };
}

export function initSceneController(canvasElement) {
  const controller = createSceneController();
  controller.init(canvasElement);
  return controller;
}
