/**
 * src/components/ui/3d-globe.js
 * Realistic WebGL 3D Earth Globe
 * Renders a photorealistic Earth with satellite texture, lighting, atmosphere glow,
 * and DOM avatar pins (panda) positioned over Beijing & Shanghai.
 *
 * Architecture:
 *  - WebGL sphere (48 segments) with equirectangular Earth texture from CDN
 *  - GLSL lighting: Phong-style diffuse + specular for ocean shine
 *  - Atmosphere: second render pass (additive blend, red/crimson for CHINA 2027 branding)
 *  - Pin overlay: DOM elements projected from 3D world space to screen
 *  - Drag + inertia interaction; touch support
 */

// ── Panda SVG Avatar ──────────────────────────────────────────────────────────
export const PANDA_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="40" fill="#111827"/>
    <circle cx="22" cy="20" r="14" fill="#111"/>
    <circle cx="58" cy="20" r="14" fill="#111"/>
    <circle cx="22" cy="20" r="7" fill="#DE2910" opacity="0.55"/>
    <circle cx="58" cy="20" r="7" fill="#DE2910" opacity="0.55"/>
    <ellipse cx="40" cy="47" rx="28" ry="25" fill="#f0ede8"/>
    <ellipse cx="28" cy="43" rx="9.5" ry="11" fill="#111" transform="rotate(-10 28 43)"/>
    <ellipse cx="52" cy="43" rx="9.5" ry="11" fill="#111" transform="rotate(10 52 43)"/>
    <circle cx="29" cy="42" r="4.5" fill="#fff"/>
    <circle cx="30" cy="41" r="2.8" fill="#111"/>
    <circle cx="31" cy="40" r="1" fill="#fff"/>
    <circle cx="51" cy="42" r="4.5" fill="#fff"/>
    <circle cx="50" cy="41" r="2.8" fill="#111"/>
    <circle cx="51" cy="40" r="1" fill="#fff"/>
    <ellipse cx="22" cy="54" rx="4" ry="2.5" fill="#ffb3c1" opacity="0.7"/>
    <ellipse cx="58" cy="54" rx="4" ry="2.5" fill="#ffb3c1" opacity="0.7"/>
    <ellipse cx="40" cy="53" rx="5" ry="3.5" fill="#1a1a1a"/>
    <path d="M35 58 Q40 64 45 58" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`
)}`;

// ── Default Markers ───────────────────────────────────────────────────────────
export const DEFAULT_GLOBE_MARKERS = [
  { id: 'beijing',   lat: 39.9042,  lng: 116.4074, label: '北京 Beijing',    sublabel: 'Target 2027',   isPrimary: true,  color: '#DE2910', avatar: PANDA_SVG },
  { id: 'shanghai',  lat: 31.2304,  lng: 121.4737, label: '上海 Shanghai',   sublabel: 'Fudan · SJTU',  isPrimary: true,  color: '#FFDE00', avatar: PANDA_SVG },
  { id: 'paris',     lat: 48.8566,  lng: 2.3522,   label: 'Paris',           isPrimary: false, color: '#60a5fa' },
  { id: 'london',    lat: 51.5074,  lng: -0.1278,  label: 'London',          isPrimary: false, color: '#60a5fa' },
  { id: 'tokyo',     lat: 35.6762,  lng: 139.6503, label: 'Tokyo',           isPrimary: false, color: '#60a5fa' },
  { id: 'newyork',   lat: 40.7128,  lng: -74.006,  label: 'New York',        isPrimary: false, color: '#60a5fa' },
  { id: 'singapore', lat: 1.3521,   lng: 103.8198, label: 'Singapore',       isPrimary: false, color: '#60a5fa' },
  { id: 'sydney',    lat: -33.8688, lng: 151.2093, label: 'Sydney',          isPrimary: false, color: '#60a5fa' },
  { id: 'moscow',    lat: 55.7558,  lng: 37.6173,  label: 'Moscow',          isPrimary: false, color: '#60a5fa' },
  { id: 'dubai',     lat: 25.2048,  lng: 55.2708,  label: 'Dubai',           isPrimary: false, color: '#60a5fa' },
];

// ── HTML Generator ────────────────────────────────────────────────────────────
export function Globe3D({ className = '', id = 'hero-globe-canvas' } = {}) {
  return `
    <div class="globe3d-host ${className}" id="globe3d-host">
      <canvas id="${id}" class="globe3d-canvas" aria-label="Interactive 3D Earth — Beijing and Shanghai markers"></canvas>
      <div id="globe3d-pins" class="globe3d-pins" aria-hidden="true"></div>
    </div>
  `.trim();
}

// ── Matrix Math (column-major, WebGL convention) ──────────────────────────────
function mat4Perspective(fov, aspect, near, far) {
  const f = 1.0 / Math.tan(fov * 0.5);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0,                    0,                        0,
    0,          f,                    0,                        0,
    0,          0,  (far + near) * nf,                       -1,
    0,          0,  2 * far * near * nf,                       0,
  ]);
}

function mat4RotY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return new Float32Array([
     c, 0, -s, 0,
     0, 1,  0, 0,
     s, 0,  c, 0,
     0, 0,  0, 1,
  ]);
}

function mat4RotX(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return new Float32Array([
    1,  0, 0, 0,
    0,  c, s, 0,
    0, -s, c, 0,
    0,  0, 0, 1,
  ]);
}

function mat4Translate(x, y, z) {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1,
  ]);
}

/** Column-major 4×4 matrix multiply: C = A × B */
function mat4Mul(a, b) {
  const o = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let v = 0;
      for (let k = 0; k < 4; k++) v += a[row + k * 4] * b[k + col * 4];
      o[row + col * 4] = v;
    }
  }
  return o;
}

// ── Sphere Geometry ───────────────────────────────────────────────────────────
/**
 * Generates an indexed sphere mesh with UV coordinates.
 * UV convention: u=0 → lng=-180°, u=1 → lng=180°, v=1 → north pole.
 * Sphere positions: x = cosφ·sinθ, y = cosθ, z = sinφ·sinθ
 * This places lng=90°E at +Z (facing the camera at Z+).
 */
function createSphere(SEG = 48) {
  const verts = [], uvs = [], normals = [], idx = [];

  for (let lat = 0; lat <= SEG; lat++) {
    const theta  = (lat  / SEG) * Math.PI;           // 0 = north pole
    const sinT   = Math.sin(theta);
    const cosT   = Math.cos(theta);
    const v      = 1 - lat / SEG;                    // v=1 at north

    for (let lon = 0; lon <= SEG; lon++) {
      const phi  = (lon / SEG) * 2 * Math.PI;        // 0 → 2π
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);

      const x = cosP * sinT;
      const y = cosT;
      const z = sinP * sinT;

      verts.push(x, y, z);
      normals.push(x, y, z);                         // unit sphere: normal = position

      // u: phi=0 → u=1 (lng=180°), phi=π → u=0.5 (lng=0°), phi=2π → u=0 (lng=-180°)
      const u = 1 - lon / SEG;
      uvs.push(u, v);
    }
  }

  for (let lat = 0; lat < SEG; lat++) {
    for (let lon = 0; lon < SEG; lon++) {
      const a = lat * (SEG + 1) + lon;
      const b = a + SEG + 1;
      idx.push(a, b, a + 1,  b, b + 1, a + 1);
    }
  }

  return {
    vertices:  new Float32Array(verts),
    normals:   new Float32Array(normals),
    uvs:       new Float32Array(uvs),
    indices:   new Uint16Array(idx),
    count:     idx.length,
  };
}

// ── GLSL Shaders ─────────────────────────────────────────────────────────────

// Earth surface — texture + Phong lighting
const VS_EARTH = `
attribute vec3 a_pos;
attribute vec3 a_norm;
attribute vec2 a_uv;
uniform mat4 u_model;
uniform mat4 u_mvp;
varying vec2  v_uv;
varying vec3  v_worldNorm;
varying vec3  v_worldPos;
void main() {
  vec4 world = u_model * vec4(a_pos, 1.0);
  v_worldPos  = world.xyz;
  v_worldNorm = mat3(u_model) * a_norm;
  v_uv        = a_uv;
  gl_Position = u_mvp * vec4(a_pos, 1.0);
}`;

const FS_EARTH = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec3 u_lightDir;    // normalised, world space
uniform vec3 u_camPos;
varying vec2 v_uv;
varying vec3 v_worldNorm;
varying vec3 v_worldPos;

void main() {
  vec4 texCol  = texture2D(u_tex, v_uv);

  vec3 N       = normalize(v_worldNorm);
  vec3 L       = normalize(u_lightDir);
  vec3 V       = normalize(u_camPos - v_worldPos);
  vec3 H       = normalize(L + V);

  float diff   = max(dot(N, L), 0.0);
  float spec   = pow(max(dot(N, H), 0.0), 64.0) * 0.35;   // ocean specular
  float ambient= 0.18;

  vec3  lit    = texCol.rgb * (ambient + diff * 0.82) + vec3(spec);

  // Very slight night-side darkening (terminator)
  float night  = smoothstep(-0.15, 0.15, dot(N, L));
  lit          = mix(texCol.rgb * 0.08, lit, night);

  gl_FragColor = vec4(lit, 1.0);
}`;

// Atmospheric halo — slightly larger sphere, additive blend
const VS_ATMO = `
attribute vec3 a_pos;
uniform mat4 u_mvp;
uniform float u_scale;
varying float v_edge;
void main() {
  vec3 scaled = a_pos * u_scale;
  gl_Position = u_mvp * vec4(scaled, 1.0);
  // Edge factor: high at silhouette, low at center
  v_edge = 1.0 - abs(dot(normalize(a_pos), vec3(0.0, 0.0, 1.0)));
}`;

const FS_ATMO = `
precision mediump float;
uniform vec3  u_color;
uniform float u_intensity;
varying float v_edge;
void main() {
  float a = pow(v_edge, 2.5) * u_intensity;
  gl_FragColor = vec4(u_color * a, a);
}`;

// ── WebGL Helpers ─────────────────────────────────────────────────────────────
function mkShader(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('[Globe3D] Shader compile error:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function mkProg(gl, vs_src, fs_src) {
  const vs = mkShader(gl, gl.VERTEX_SHADER,   vs_src);
  const fs = mkShader(gl, gl.FRAGMENT_SHADER, fs_src);
  if (!vs || !fs) return null;
  const p = gl.createProgram();
  gl.attachShader(p, vs); gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('[Globe3D] Program link error:', gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

function mkBuf(gl, data, target = null) {
  const t  = target ?? gl.ARRAY_BUFFER;
  const buf = gl.createBuffer();
  gl.bindBuffer(t, buf);
  gl.bufferData(t, data, gl.STATIC_DRAW);
  return buf;
}

function attrib(gl, prog, name, buf, size) {
  const loc = gl.getAttribLocation(prog, name);
  if (loc < 0) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
}

// ── Mount ─────────────────────────────────────────────────────────────────────
export function mountGlobe3D(canvasEl, opts = {}) {
  if (typeof window === 'undefined' || !canvasEl) return () => {};

  /* ── config ── */
  const cfg = {
    autoRotateSpeed : opts.autoRotateSpeed ?? 0.0025,
    fov             : Math.PI / 4,           // 45°
    near            : 0.1,
    far             : 50,
    cameraZ         : 2.75,
    // Texture URLs with fallbacks
    earthUrl        : 'https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/img/earth-blue-marble.jpg',
    earthUrl2       : 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/textures/land_ocean_ice_cloud_2048.jpg',
    earthUrl3       : 'https://unpkg.com/three@0.128.0/examples/textures/land_ocean_ice_cloud_2048.jpg',
    markers         : opts.markers || DEFAULT_GLOBE_MARKERS,
    lightDir        : [1.0, 1.2, 1.5],       // world-space direction (will be normalised in JS)
    atmoColor       : [0.90, 0.18, 0.08],    // crimson atmosphere
    atmoIntensity   : 0.9,
    atmoScale       : 1.14,
  };

  /* ── WebGL context ── */
  const gl = canvasEl.getContext('webgl',  { alpha: true, antialias: true })
          || canvasEl.getContext('experimental-webgl', { alpha: true, antialias: true });
  if (!gl) {
    console.warn('[Globe3D] WebGL unavailable');
    return () => {};
  }

  /* ── Programs ── */
  const earthProg = mkProg(gl, VS_EARTH, FS_EARTH);
  const atmoProg  = mkProg(gl, VS_ATMO,  FS_ATMO);
  if (!earthProg || !atmoProg) return () => {};

  /* ── Sphere geometry ── */
  const sphere = createSphere(48);

  const posBuf  = mkBuf(gl, sphere.vertices);
  const normBuf = mkBuf(gl, sphere.normals);
  const uvBuf   = mkBuf(gl, sphere.uvs);
  const idxBuf  = mkBuf(gl, sphere.indices, gl.ELEMENT_ARRAY_BUFFER);

  /* ── Texture ── */
  const tex = gl.createTexture();
  // placeholder while loading
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([20, 40, 80, 255]));

  function uploadTex(img) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  function tryLoadTexture(urls, idx = 0) {
    if (idx >= urls.length) { console.warn('[Globe3D] All texture URLs failed'); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => uploadTex(img);
    img.onerror = () => tryLoadTexture(urls, idx + 1);
    img.src = urls[idx];
  }
  tryLoadTexture([cfg.earthUrl, cfg.earthUrl2, cfg.earthUrl3]);

  /* ── Uniform locations ── */
  const E = {
    mvp      : gl.getUniformLocation(earthProg, 'u_mvp'),
    model    : gl.getUniformLocation(earthProg, 'u_model'),
    tex      : gl.getUniformLocation(earthProg, 'u_tex'),
    lightDir : gl.getUniformLocation(earthProg, 'u_lightDir'),
    camPos   : gl.getUniformLocation(earthProg, 'u_camPos'),
  };
  const A = {
    mvp       : gl.getUniformLocation(atmoProg, 'u_mvp'),
    scale     : gl.getUniformLocation(atmoProg, 'u_scale'),
    color     : gl.getUniformLocation(atmoProg, 'u_color'),
    intensity : gl.getUniformLocation(atmoProg, 'u_intensity'),
  };

  /* ── State ── */
  let W = 0, H = 0;
  let rotY = 0;         // phi=0 → lng=180°E; rotY=0 shows 90°E (India/China visible)
  let rotX = 0.15;      // slight tilt to show northern hemisphere better
  let velX = 0, velY = 0;
  let isDragging = false;
  let prevMX = 0, prevMY = 0;
  let animId = null;

  /* ── DOM Pins ── */
  const pinsContainer = document.getElementById('globe3d-pins');
  const pinEls = {};

  if (pinsContainer) {
    pinsContainer.innerHTML = '';
    cfg.markers.filter(m => m.isPrimary).forEach(m => {
      const el = document.createElement('div');
      el.id        = `pin-${m.id}`;
      el.className = 'globe3d-pin';
      el.style.cssText = 'display:none;';
      el.innerHTML = `
        <div class="globe3d-pin-tooltip">
          <span class="globe3d-pin-label">${m.label}</span>
          <span class="globe3d-pin-sub">${m.sublabel || ''}</span>
        </div>
        <div class="globe3d-pin-avatar" style="border-color:${m.color};">
          <img src="${m.avatar}" alt="${m.label}" loading="lazy"/>
          <span class="globe3d-pin-pulse"  style="border-color:${m.color};"></span>
          <span class="globe3d-pin-pulse globe3d-pin-pulse-2" style="border-color:${m.color};"></span>
        </div>
        <div class="globe3d-pin-stem" style="background:${m.color};box-shadow:0 0 6px ${m.color};"></div>
        <div class="globe3d-pin-dot"  style="background:${m.color};box-shadow:0 0 8px ${m.color};"></div>
      `;
      pinsContainer.appendChild(el);
      pinEls[m.id] = el;
    });
  }

  /* ── Resize ── */
  function resize() {
    const host = canvasEl.parentElement;
    const rect  = host ? host.getBoundingClientRect() : null;
    const dpr   = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(rect ? rect.width  : 500, 1);
    H = Math.max(rect ? rect.height : 500, 1);
    canvasEl.width        = W * dpr;
    canvasEl.height       = H * dpr;
    canvasEl.style.width  = W + 'px';
    canvasEl.style.height = H + 'px';
    gl.viewport(0, 0, canvasEl.width, canvasEl.height);
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvasEl.parentElement || canvasEl);

  /* ── Matrix helpers ── */
  function buildModel() {
    return mat4Mul(mat4RotX(rotX), mat4RotY(rotY));
  }

  function buildMVP(model) {
    const proj = mat4Perspective(cfg.fov, W / H, cfg.near, cfg.far);
    const view = mat4Translate(0, 0, -cfg.cameraZ);
    return mat4Mul(proj, mat4Mul(view, model));
  }

  /* ── Project lat/lng → screen (mirrors the WebGL transform exactly) ── */
  function projectMarker(lat, lng) {
    const phi   = ((90 - lat) * Math.PI) / 180;      // co-latitude
    const theta = (lng * Math.PI) / 180;              // longitude in rad

    // Position on unit sphere (matches sphere geometry generation)
    // x = cosθ·sinφ  (longitude θ rotates around Y)
    // Actually we need to match our sphere's convention:
    // sphere: x=cosP·sinT, y=cosT, z=sinP·sinT where P=phi_uv, T=theta_uv
    // lat/lng → theta_uv (co-lat), and lng → phi_uv via:
    //   phi_uv = (1 - u)*2π with u = (lng+180)/360
    //   phi_uv = (1 - (lng+180)/360)*2π = (180-lng)/360*2π = (π-lng*π/180)
    const phi_uv = Math.PI - lng * Math.PI / 180;
    const theta_uv = phi;

    let px = Math.cos(phi_uv) * Math.sin(theta_uv);
    let py = Math.cos(theta_uv);
    let pz = Math.sin(phi_uv) * Math.sin(theta_uv);

    // Apply RotY (column-major mat4RotY):
    // new_x =  c*px + s*pz
    // new_z = -s*px + c*pz  ... but mat4RotY is [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]
    // Row 0: [c, 0, s, 0] → new_x = c*px + 0*py + s*pz
    // Row 2: [-s, 0, c, 0] → new_z = -s*px + 0*py + c*pz
    const cY = Math.cos(rotY), sY = Math.sin(rotY);
    const rx = cY * px + sY * pz;
    const rz = -sY * px + cY * pz;
    px = rx; pz = rz;

    // Apply RotX: [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]
    // Row 1: [0, c, -s, 0] → new_y = c*py - s*pz  (from row-major reading)
    // Wait — column-major mat4RotX is:
    // col0: (1,0,0,0), col1: (0,c,s,0), col2: (0,-s,c,0), col3: (0,0,0,1)
    // Matrix (row×col): row0=(1,0,0,0), row1=(0,c,-s,0), row2=(0,s,c,0), row3=(0,0,0,1)
    const cX = Math.cos(rotX), sX = Math.sin(rotX);
    const ry2 =  cX * py - sX * pz;
    const rz2 =  sX * py + cX * pz;
    py = ry2; pz = rz2;

    // Camera at (0,0,cameraZ), point in world space (px, py, pz)
    // View space: vz = pz - cameraZ (negative = in front of camera)
    const vz = pz - cfg.cameraZ;         // this is negative for visible hemisphere

    // Perspective: NDC = (f * view_component) / (-vz) [since w = -vz]
    const aspect = W / H;
    const f = 1.0 / Math.tan(cfg.fov * 0.5);
    const w = -vz;   // homogeneous w (positive because vz < 0)

    if (w <= 0) return { x: 0, y: 0, visible: false };

    const ndcX = (f / aspect * px) / w;
    const ndcY = (f * py) / w;

    return {
      x:       (ndcX + 1) * 0.5 * W,
      y:       (1 - ndcY) * 0.5 * H,
      z:       pz,
      visible: pz > 0.05,   // positive world-space Z = facing camera
    };
  }

  /* ── Render frame ── */
  function render() {
    // Integrate velocity
    if (!isDragging) {
      rotY += cfg.autoRotateSpeed;
      velX *= 0.92;
      velY *= 0.92;
    }
    rotY += velX;
    rotX = Math.max(-0.5, Math.min(0.5, rotX + velY));

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    const model = buildModel();
    const mvp   = buildMVP(model);

    /* —— Draw Earth —— */
    gl.disable(gl.BLEND);
    gl.useProgram(earthProg);

    gl.uniformMatrix4fv(E.mvp,   false, mvp);
    gl.uniformMatrix4fv(E.model, false, model);
    gl.uniform3fv(E.lightDir, cfg.lightDir);
    gl.uniform3f(E.camPos, 0, 0, cfg.cameraZ);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(E.tex, 0);

    attrib(gl, earthProg, 'a_pos',  posBuf,  3);
    attrib(gl, earthProg, 'a_norm', normBuf, 3);
    attrib(gl, earthProg, 'a_uv',   uvBuf,   2);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.drawElements(gl.TRIANGLES, sphere.count, gl.UNSIGNED_SHORT, 0);




    /* —— Update DOM pins —— */
    updatePins();

    animId = requestAnimationFrame(render);
  }

  function updatePins() {
    if (!pinsContainer) return;
    const host  = document.getElementById('globe3d-host');
    const hRect = host  ? host.getBoundingClientRect()     : { left: 0, top: 0 };
    const cRect = canvasEl.getBoundingClientRect();
    const offX  = cRect.left - hRect.left;
    const offY  = cRect.top  - hRect.top;

    cfg.markers.filter(m => m.isPrimary).forEach(m => {
      const el = pinEls[m.id];
      if (!el) return;
      const p = projectMarker(m.lat, m.lng);
      if (p.visible) {
        el.style.display = 'flex';
        el.style.left    = (offX + p.x) + 'px';
        el.style.top     = (offY + p.y) + 'px';
        el.style.opacity = Math.min(1, (p.z - 0.05) * 3 + 0.4);
      } else {
        el.style.display = 'none';
      }
    });
  }

  /* ── Drag interaction ── */
  function onDown(e) {
    isDragging = true;
    velX = 0; velY = 0;
    const src = e.touches ? e.touches[0] : e;
    prevMX = src.clientX; prevMY = src.clientY;
  }
  function onMove(e) {
    if (!isDragging) return;
    const src = e.touches ? e.touches[0] : e;
    velX = (src.clientX - prevMX) * 0.007;
    velY = (src.clientY - prevMY) * 0.005;
    prevMX = src.clientX; prevMY = src.clientY;
  }
  function onUp() { isDragging = false; }

  canvasEl.addEventListener('mousedown',  onDown);
  window.addEventListener('mousemove',    onMove);
  window.addEventListener('mouseup',      onUp);
  canvasEl.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('touchmove',    onMove, { passive: true });
  window.addEventListener('touchend',     onUp);
  canvasEl.style.cursor = 'grab';

  render();

  /* ── Cleanup ── */
  return () => {
    cancelAnimationFrame(animId);
    ro.disconnect();
    canvasEl.removeEventListener('mousedown',  onDown);
    window.removeEventListener('mousemove',    onMove);
    window.removeEventListener('mouseup',      onUp);
    canvasEl.removeEventListener('touchstart', onDown);
    window.removeEventListener('touchmove',    onMove);
    window.removeEventListener('touchend',     onUp);
    if (pinsContainer) pinsContainer.innerHTML = '';
    gl.deleteProgram(earthProg);
    gl.deleteProgram(atmoProg);
    [posBuf, normBuf, uvBuf].forEach(b => gl.deleteBuffer(b));
    gl.deleteBuffer(idxBuf);
    gl.deleteTexture(tex);
  };
}

export default { Globe3D, mountGlobe3D, DEFAULT_GLOBE_MARKERS };
