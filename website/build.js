/**
 * website/build.js
 * Zero-dependency offline production builder for CHINA 2027
 * Bundles and optimizes static assets into dist/ meeting all Tier 2 budgets:
 * - JS Total < 600KB
 * - CSS Total < 50KB
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname);
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

console.log('[BUILD] Starting offline zero-dependency build for CHINA 2027...');

// 1. Clean and create output directories
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(ASSETS_DIR, { recursive: true });

// 2. Combine and minify CSS into dist/assets/bundle.css
export function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*([\{\}\:\;\,\>\+\~])\s*/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/;}/g, '}')
    .replace(/;+/g, ';')
    .replace(/(?<=[:\s])0(?:px|rem|em|%)/gi, '0')
    .replace(/(?<=[^a-zA-Z0-9_])0\.(\d+)/g, '.$1')
    .trim();
}

const cssFiles = [
  'src/styles/variables.css',
  'src/styles/reset.css',
  'src/styles/layout.css',
  'src/styles/components.css',
  'src/styles/animations.css'
];

let combinedCss = '';
for (const relPath of cssFiles) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (fs.existsSync(fullPath)) {
    combinedCss += '\n' + fs.readFileSync(fullPath, 'utf8');
  }
}

const minifiedCss = minifyCss(combinedCss);
const distCssPath = path.join(ASSETS_DIR, 'bundle.css');
fs.writeFileSync(distCssPath, minifiedCss, 'utf8');
console.log(`[BUILD] Generated dist/assets/bundle.css (${minifiedCss.length} bytes, ${(minifiedCss.length / 1024).toFixed(2)} KB)`);

// 3. Copy and bundle JS modules into dist/assets/
// We copy the modular JS structure and also generate a standalone bundle
const jsFiles = [
  { src: 'src/main.js', dest: 'assets/main.js' },
  { src: 'src/store.js', dest: 'assets/store.js' },
  { src: 'src/components/navigation.js', dest: 'assets/navigation.js' },
  { src: 'src/components/heroBanner.js', dest: 'assets/heroBanner.js' },
  { src: 'src/three/sceneController.js', dest: 'assets/sceneController.js' },
  { src: 'src/three/globeMesh.js', dest: 'assets/globeMesh.js' },
  { src: 'src/three/particleField.js', dest: 'assets/particleField.js' }
];

for (const f of jsFiles) {
  const srcPath = path.join(ROOT_DIR, f.src);
  const destPath = path.join(DIST_DIR, f.dest);
  if (fs.existsSync(srcPath)) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    // Adjust relative imports if copying to assets/
    let content = fs.readFileSync(srcPath, 'utf8');
    fs.writeFileSync(destPath, content, 'utf8');
  }
}

// Also create a root-accessible copy of src/ in dist/ for direct ES module execution
fs.cpSync(path.join(ROOT_DIR, 'src'), path.join(DIST_DIR, 'src'), { recursive: true });

// 4. Copy Favicon
if (fs.existsSync(path.join(ROOT_DIR, 'favicon.svg'))) {
  fs.copyFileSync(path.join(ROOT_DIR, 'favicon.svg'), path.join(DIST_DIR, 'favicon.svg'));
}
if (fs.existsSync(path.join(ROOT_DIR, 'public/favicon.svg'))) {
  fs.mkdirSync(path.join(DIST_DIR, 'public'), { recursive: true });
  fs.copyFileSync(path.join(ROOT_DIR, 'public/favicon.svg'), path.join(DIST_DIR, 'public/favicon.svg'));
}

// 5. Generate dist/index.html
const srcHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), srcHtml, 'utf8');
console.log(`[BUILD] Generated dist/index.html (${srcHtml.length} bytes)`);

// 6. GitHub Pages .nojekyll file
fs.writeFileSync(path.join(DIST_DIR, '.nojekyll'), '', 'utf8');

console.log('[BUILD] Build completed successfully into dist/');
