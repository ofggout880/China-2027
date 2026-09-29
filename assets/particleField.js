/**
 * particleField.js
 * 1,200 Floating Particle Constellation with China Red (#FF2A4A),
 * Imperial Gold (#FFDE00), and White Diamond Stars, soft glowing point shaders,
 * twinkle oscillation, interactive pointer/touch parallax reaction, and 2D canvas fallback.
 */

export function createParticleField(gl, isWebGL, count = 1200) {
  const particles = [];
  const posArray = new Float32Array(count * 3);
  const colorArray = new Float32Array(count * 4);
  const sizeArray = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const cosPhi = Math.random() * 2 - 1;
    const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
    const r = 1.2 + 2.6 * Math.cbrt(Math.random());

    const x = r * sinPhi * Math.cos(theta);
    const y = r * sinPhi * Math.sin(theta);
    const z = r * cosPhi;

    posArray[i * 3] = x;
    posArray[i * 3 + 1] = y;
    posArray[i * 3 + 2] = z;

    // Color distribution: 70% Red, 20% Gold, 10% White
    const randColor = Math.random();
    let rCol, gCol, bCol, colorHex;
    if (randColor < 0.70) {
      rCol = 1.0; gCol = 0.165; bCol = 0.29; // Vibrant Crimson (#FF2A4A)
      colorHex = '#FF2A4A';
    } else if (randColor < 0.90) {
      rCol = 1.0; gCol = 0.871; bCol = 0.0;  // Five-Star Gold (#FFDE00)
      colorHex = '#FFDE00';
    } else {
      rCol = 1.0; gCol = 1.0; bCol = 1.0;    // Diamond White (#FFFFFF)
      colorHex = '#FFFFFF';
    }

    const baseAlpha = 0.35 + Math.random() * 0.6;
    colorArray[i * 4] = rCol;
    colorArray[i * 4 + 1] = gCol;
    colorArray[i * 4 + 2] = bCol;
    colorArray[i * 4 + 3] = baseAlpha;

    const size = 1.8 + Math.random() * 2.8;
    sizeArray[i] = size;

    particles.push({
      x, y, z,
      baseAlpha,
      twinkleSpeed: 1.5 + Math.random() * 2.5,
      twinklePhase: Math.random() * Math.PI * 2,
      driftSpeed: 0.0004 + Math.random() * 0.0006,
      size,
      rCol, gCol, bCol,
      colorHex
    });
  }

  let shaderProgram = null;
  let posVbo = null, colorVbo = null, sizeVbo = null;
  let posAttr = -1, colorAttr = -1, sizeAttr = -1;
  let projUnif = null, viewUnif = null, timeUnif = null, dprUnif = null;

  if (isWebGL && gl) {
    const vsSource = `
      attribute vec3 a_position;
      attribute vec4 a_color;
      attribute float a_size;
      uniform mat4 u_projection;
      uniform mat4 u_view;
      uniform float u_time;
      uniform float u_dpr;
      varying vec4 v_color;

      void main() {
        // Subtle organic float
        vec3 pos = a_position;
        pos.y += sin(u_time * 1.5 + a_position.x * 2.0) * 0.03;
        pos.x += cos(u_time * 1.2 + a_position.z * 2.0) * 0.03;

        vec4 mvPos = u_view * vec4(pos, 1.0);
        gl_PointSize = a_size * u_dpr * (280.0 / -mvPos.z);
        gl_Position = u_projection * mvPos;

        // Twinkling alpha modulation
        float twinkle = 0.7 + 0.3 * sin(u_time * 3.0 + a_position.y * 10.0);
        v_color = vec4(a_color.rgb, a_color.a * twinkle);
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec4 v_color;
      void main() {
        // Soft glowing circle discard
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, dist) * v_color.a;
        gl_FragColor = vec4(v_color.rgb, alpha);
      }
    `;

    shaderProgram = buildProgram(gl, vsSource, fsSource);
    if (shaderProgram) {
      posAttr = gl.getAttribLocation(shaderProgram, 'a_position');
      colorAttr = gl.getAttribLocation(shaderProgram, 'a_color');
      sizeAttr = gl.getAttribLocation(shaderProgram, 'a_size');
      projUnif = gl.getUniformLocation(shaderProgram, 'u_projection');
      viewUnif = gl.getUniformLocation(shaderProgram, 'u_view');
      timeUnif = gl.getUniformLocation(shaderProgram, 'u_time');
      dprUnif = gl.getUniformLocation(shaderProgram, 'u_dpr');

      posVbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posVbo);
      gl.bufferData(gl.ARRAY_BUFFER, posArray, gl.STATIC_DRAW);

      colorVbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorVbo);
      gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);

      sizeVbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, sizeVbo);
      gl.bufferData(gl.ARRAY_BUFFER, sizeArray, gl.STATIC_DRAW);
    }
  }

  function renderWebGL(gl, camera, parallax, time) {
    if (!shaderProgram) return;

    gl.useProgram(shaderProgram);
    gl.uniformMatrix4fv(projUnif, false, camera.projectionMatrix);

    const view = computeParticleViewMatrix(camera, parallax);
    gl.uniformMatrix4fv(viewUnif, false, view);
    gl.uniform1f(timeUnif, time);
    gl.uniform1f(dprUnif, Math.min(window.devicePixelRatio || 1, 2));

    gl.bindBuffer(gl.ARRAY_BUFFER, posVbo);
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorVbo);
    gl.enableVertexAttribArray(colorAttr);
    gl.vertexAttribPointer(colorAttr, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sizeVbo);
    gl.enableVertexAttribArray(sizeAttr);
    gl.vertexAttribPointer(sizeAttr, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, count);
  }

  function render2D(ctx, width, height, camera, parallax, time) {
    const cx = width / 2;
    const cy = height / 2;
    const scale = Math.min(width, height) * 0.38;
    const camZ = 2.85;

    ctx.save();
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      // Slow orbital drift
      const angle = time * p.driftSpeed;
      const cosA = Math.cos(angle), sinA = Math.sin(angle);
      const px = p.x * cosA + p.z * sinA;
      const pz = -p.x * sinA + p.z * cosA;
      const py = p.y;

      // Parallax shift with depth factor
      const shiftX = parallax.currentX * (2.0 / (camZ - pz));
      const shiftY = parallax.currentY * (2.0 / (camZ - pz));

      // Perspective projection
      const zDist = camZ - pz;
      if (zDist <= 0.1) continue;
      const pScale = camZ / zDist;
      const sx = cx + (px + shiftX) * pScale * scale;
      const sy = cy - (py - shiftY) * pScale * scale;

      if (sx < -20 || sx > width + 20 || sy < -20 || sy > height + 20) continue;

      // Twinkle alpha
      const alpha = p.baseAlpha * (0.65 + 0.35 * Math.sin(time * p.twinkleSpeed + p.twinklePhase));
      const r = Math.max(0.8, p.size * pScale * 0.7);

      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(p.colorHex, alpha);
      ctx.fill();
    }
    ctx.restore();
  }

  function dispose() {
    if (gl) {
      if (posVbo) gl.deleteBuffer(posVbo);
      if (colorVbo) gl.deleteBuffer(colorVbo);
      if (sizeVbo) gl.deleteBuffer(sizeVbo);
      if (shaderProgram) gl.deleteProgram(shaderProgram);
    }
  }

  return { renderWebGL, render2D, dispose };
}

function hexToRgba(hex, alpha) {
  if (hex === '#FF2A4A') return `rgba(255, 42, 74, ${alpha})`;
  if (hex === '#FFDE00') return `rgba(255, 222, 0, ${alpha})`;
  return `rgba(255, 255, 255, ${alpha})`;
}

function computeParticleViewMatrix(cam, parallax) {
  const m = new Float32Array(16);
  m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1;
  // Subtle differential parallax
  m[12] = -parallax.currentX * 0.45;
  m[13] = parallax.currentY * 0.35;
  m[14] = -cam.position.z;
  return m;
}

function buildProgram(gl, vsSource, fsSource) {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vsSource);
  gl.compileShader(vs);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fsSource);
  gl.compileShader(fs);

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return prog;
}
