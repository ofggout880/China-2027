/**
 * globeMesh.js
 * Celestial Wireframe Globe with Beijing Beacon Node (39.9042°N, 116.4074°E),
 * pulsating concentric radar rings, and vertical laser ray pointing toward 2027.
 * Supports both WebGL line rendering and Canvas 2D perspective fallback.
 */

export function createGlobeMesh(gl, isWebGL) {
  const R = 1.0;
  const beijingLat = (39.9042 * Math.PI) / 180;
  const beijingLon = (116.4074 * Math.PI) / 180;

  // Beijing Cartesian Position (unit sphere)
  const beijingNode = [
    R * Math.cos(beijingLat) * Math.sin(beijingLon),
    R * Math.sin(beijingLat),
    R * Math.cos(beijingLat) * Math.cos(beijingLon)
  ];

  // Orthonormal basis in tangent plane at Beijing
  const n = [...beijingNode];
  let ux = -n[2], uy = 0, uz = n[0];
  const uLen = Math.hypot(ux, uz) || 1;
  ux /= uLen; uz /= uLen;

  const vx = n[1] * uz - n[2] * uy;
  const vy = n[2] * ux - n[0] * uz;
  const vz = n[0] * uy - n[1] * ux;

  // Wireframe lines generation (parallels and meridians)
  const lineVertices = [];
  const latRings = 10;
  for (let i = 1; i <= latRings; i++) {
    const lat = -Math.PI / 2 + (i * Math.PI) / (latRings + 1);
    const ringR = R * Math.cos(lat);
    const y = R * Math.sin(lat);
    const segs = 48;
    for (let j = 0; j < segs; j++) {
      const lon1 = (j * 2 * Math.PI) / segs;
      const lon2 = ((j + 1) * 2 * Math.PI) / segs;
      lineVertices.push(
        ringR * Math.sin(lon1), y, ringR * Math.cos(lon1),
        ringR * Math.sin(lon2), y, ringR * Math.cos(lon2)
      );
    }
  }

  const lonRings = 14;
  for (let i = 0; i < lonRings; i++) {
    const lon = (i * Math.PI) / lonRings;
    const segs = 48;
    for (let j = 0; j < segs; j++) {
      const lat1 = (j * 2 * Math.PI) / segs;
      const lat2 = ((j + 1) * 2 * Math.PI) / segs;
      lineVertices.push(
        R * Math.cos(lat1) * Math.sin(lon), R * Math.sin(lat1), R * Math.cos(lat1) * Math.cos(lon),
        R * Math.cos(lat2) * Math.sin(lon), R * Math.sin(lat2), R * Math.cos(lat2) * Math.cos(lon)
      );
    }
  }

  // WebGL Shader Compilation & Buffers
  let shaderProgram = null;
  let lineVbo = null;
  let posAttr = -1;
  let projUnif = null, viewUnif = null, modelUnif = null, colorUnif = null;

  if (isWebGL && gl) {
    const vsSource = `
      attribute vec3 a_position;
      uniform mat4 u_projection;
      uniform mat4 u_view;
      uniform mat4 u_model;
      void main() {
        gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
      }
    `;
    const fsSource = `
      precision mediump float;
      uniform vec4 u_color;
      void main() {
        gl_FragColor = u_color;
      }
    `;

    shaderProgram = buildProgram(gl, vsSource, fsSource);
    if (shaderProgram) {
      posAttr = gl.getAttribLocation(shaderProgram, 'a_position');
      projUnif = gl.getUniformLocation(shaderProgram, 'u_projection');
      viewUnif = gl.getUniformLocation(shaderProgram, 'u_view');
      modelUnif = gl.getUniformLocation(shaderProgram, 'u_model');
      colorUnif = gl.getUniformLocation(shaderProgram, 'u_color');

      lineVbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, lineVbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);
    }
  }

  const modelMatrix = new Float32Array(16);

  function renderWebGL(gl, camera, parallax, time) {
    if (!shaderProgram) return;

    gl.useProgram(shaderProgram);
    gl.uniformMatrix4fv(projUnif, false, camera.projectionMatrix);

    // View matrix: camera position + subtle pitch/yaw
    const view = computeViewMatrix(camera, parallax);
    gl.uniformMatrix4fv(viewUnif, false, view);

    // Continuous globe rotation around Y axis
    const rotY = time * 0.15;
    const rotX = 0.25; // Tilted toward user
    computeModelMatrix(modelMatrix, rotX, rotY);
    gl.uniformMatrix4fv(modelUnif, false, modelMatrix);

    // 1. Draw Wireframe Globe (China Flag Red: rgba(222, 41, 16, 0.35))
    gl.uniform4f(colorUnif, 0.87, 0.16, 0.06, 0.35);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineVbo);
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, lineVertices.length / 3);

    // 2. Draw Pulsating Concentric Radar Rings at Beijing
    drawRadarRingsWebGL(gl, time);

    // 3. Draw Vertical Laser Ray pointing to 2027
    drawLaserRayWebGL(gl);
  }

  function drawRadarRingsWebGL(gl, time) {
    const ringVerts = [];
    const ringCount = 3;
    for (let r = 0; r < ringCount; r++) {
      const phase = (time * 0.7 + r * 0.33) % 1.0;
      const radius = 0.03 + phase * 0.22;
      const alpha = (1.0 - phase) * 0.8;
      const segs = 32;
      for (let s = 0; s < segs; s++) {
        const a1 = (s * 2 * Math.PI) / segs;
        const a2 = ((s + 1) * 2 * Math.PI) / segs;
        const p1x = n[0] + radius * (Math.cos(a1) * ux + Math.sin(a1) * vx);
        const p1y = n[1] + radius * (Math.cos(a1) * uy + Math.sin(a1) * vy);
        const p1z = n[2] + radius * (Math.cos(a1) * uz + Math.sin(a1) * vz);
        const p2x = n[0] + radius * (Math.cos(a2) * ux + Math.sin(a2) * vx);
        const p2y = n[1] + radius * (Math.cos(a2) * uy + Math.sin(a2) * vy);
        const p2z = n[2] + radius * (Math.cos(a2) * uz + Math.sin(a2) * vz);
        ringVerts.push(p1x, p1y, p1z, p2x, p2y, p2z);
      }
      gl.uniform4f(colorUnif, 1.0, 0.165, 0.29, alpha);
      const tempBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, tempBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ringVerts), gl.STREAM_DRAW);
      gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINES, 0, ringVerts.length / 3);
      gl.deleteBuffer(tempBuf);
      ringVerts.length = 0;
    }
  }

  function drawLaserRayWebGL(gl) {
    const rayVerts = [
      n[0], n[1], n[2],
      n[0] * 1.45, n[1] * 1.45, n[2] * 1.45
    ];
    gl.uniform4f(colorUnif, 1.0, 0.87, 0.0, 0.95); // Imperial gold beacon tip
    const rayBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rayBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rayVerts), gl.STREAM_DRAW);
    gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, 2);
    gl.deleteBuffer(rayBuf);
  }

  // High-Fidelity 2D Canvas Fallback
  function render2D(ctx, width, height, camera, parallax, time) {
    const rotY = time * 0.15;
    const rotX = 0.25 + parallax.currentY * 0.15;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(222, 41, 16, 0.35)';

    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const cx = width / 2, cy = height / 2;
    const scale = Math.min(width, height) * 0.38;

    // Project and draw globe lines
    ctx.beginPath();
    for (let i = 0; i < lineVertices.length; i += 6) {
      const p1 = project3D(lineVertices[i], lineVertices[i+1], lineVertices[i+2], cosY, sinY, cosX, sinX, scale, cx, cy);
      const p2 = project3D(lineVertices[i+3], lineVertices[i+4], lineVertices[i+5], cosY, sinY, cosX, sinX, scale, cx, cy);
      if (p1.z > -0.2 || p2.z > -0.2) {
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
    }
    ctx.stroke();

    // Project Beijing Beacon
    const bp = project3D(n[0], n[1], n[2], cosY, sinY, cosX, sinX, scale, cx, cy);
    if (bp.z > -0.2) {
      // Beacon point
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FF2A4A';
      ctx.shadowColor = '#FF2A4A';
      ctx.shadowBlur = 12;
      ctx.fill();

      // Pulsating radar rings
      for (let r = 0; r < 3; r++) {
        const phase = (time * 0.7 + r * 0.33) % 1.0;
        const rad = 6 + phase * 24;
        const alpha = (1.0 - phase) * 0.8;
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, rad, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 42, 74, ${alpha})`;
        ctx.stroke();
      }

      // Laser Ray
      const tip = project3D(n[0] * 1.45, n[1] * 1.45, n[2] * 1.45, cosY, sinY, cosX, sinX, scale, cx, cy);
      ctx.beginPath();
      ctx.moveTo(bp.x, bp.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.strokeStyle = 'rgba(255, 222, 0, 0.9)';
      ctx.stroke();
    }
    ctx.restore();
  }

  function project3D(x, y, z, cosY, sinY, cosX, sinX, scale, cx, cy) {
    // Rotate Y
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    // Rotate X
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    // Perspective division (camera at z = 2.85)
    const pScale = 2.85 / (2.85 - z2);
    return {
      x: cx + x1 * pScale * scale,
      y: cy - y2 * pScale * scale,
      z: z2
    };
  }

  function dispose() {
    if (gl && lineVbo) gl.deleteBuffer(lineVbo);
    if (gl && shaderProgram) gl.deleteProgram(shaderProgram);
  }

  return { renderWebGL, render2D, dispose };
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

function computeViewMatrix(cam, parallax) {
  const m = new Float32Array(16);
  m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1;
  m[12] = -parallax.currentX * 0.3;
  m[13] = parallax.currentY * 0.2;
  m[14] = -cam.position.z;
  return m;
}

function computeModelMatrix(out, rotX, rotY) {
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  out[0] = cosY;  out[1] = sinX * sinY;  out[2] = -cosX * sinY; out[3] = 0;
  out[4] = 0;     out[5] = cosX;         out[6] = sinX;          out[7] = 0;
  out[8] = sinY;  out[9] = -sinX * cosY; out[10] = cosX * cosY; out[11] = 0;
  out[12] = 0;    out[13] = 0;           out[14] = 0;            out[15] = 1;
}
