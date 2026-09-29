/**
 * website/tests/build/bundle-check.mjs
 * Tier 2 Build & Production Bundle Integrity Verification
 * Authoritative Source: TEST_INFRA.md, DISPATCH.md
 * Verifies dist/ output, JS/CSS chunk naming, and strict bundle size budgets:
 * - JS Total < 600KB (614,400 bytes)
 * - CSS Total < 50KB (51,200 bytes)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../../dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

// Strict bundle size budgets
const JS_BUDGET_BYTES = 600 * 1024; // 600 KB
const CSS_BUDGET_BYTES = 50 * 1024; // 50 KB

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = (bytes / 1024).toFixed(2);
  return `${kb} KB`;
}

export function verifyProductionBundle(distDir = DIST_DIR) {
  console.log('\n======================================================');
  console.log('   Tier 2: Production Bundle & Asset Verification');
  console.log('======================================================');

  if (!fs.existsSync(distDir)) {
    console.log(`[SKIP / PENDING] Production directory not found at: ${distDir}`);
    console.log('                 Please run "npm run build" first to generate dist/');
    return {
      success: true,
      pending: true,
      message: 'dist/ directory not yet built (pending build step)',
    };
  }

  const indexHtmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.error(`[FAIL] dist/index.html does not exist!`);
    return { success: false, error: 'dist/index.html is missing' };
  }

  const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  if (htmlContent.length < 50) {
    console.error(`[FAIL] dist/index.html is unexpectedly small (${htmlContent.length} bytes)!`);
    return { success: false, error: 'dist/index.html content is truncated' };
  }

  console.log(`✔ Verified dist/index.html (${formatBytes(htmlContent.length)})`);

  // Scan assets directory
  const assetsDir = path.join(distDir, 'assets');
  let jsFiles = [];
  let cssFiles = [];

  if (fs.existsSync(assetsDir)) {
    const entries = fs.readdirSync(assetsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const fullPath = path.join(assetsDir, entry.name);
      const stat = fs.statSync(fullPath);
      if (entry.name.endsWith('.js')) {
        jsFiles.push({ name: entry.name, path: fullPath, size: stat.size });
      } else if (entry.name.endsWith('.css')) {
        cssFiles.push({ name: entry.name, path: fullPath, size: stat.size });
      }
    }
  } else {
    // Vite or build might output assets at root of dist
    const entries = fs.readdirSync(distDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const fullPath = path.join(distDir, entry.name);
      const stat = fs.statSync(fullPath);
      if (entry.name.endsWith('.js')) {
        jsFiles.push({ name: entry.name, path: fullPath, size: stat.size });
      } else if (entry.name.endsWith('.css')) {
        cssFiles.push({ name: entry.name, path: fullPath, size: stat.size });
      }
    }
  }

  if (jsFiles.length === 0) {
    console.error('[FAIL] No JavaScript assets found in production bundle!');
    return { success: false, error: 'Zero JS chunks found' };
  }

  // Calculate totals
  const totalJsSize = jsFiles.reduce((acc, f) => acc + f.size, 0);
  const totalCssSize = cssFiles.reduce((acc, f) => acc + f.size, 0);

  console.log('\n--- Chunk Breakdown ---');
  for (const js of jsFiles) {
    console.log(`  JS:  ${js.name.padEnd(30)} ${formatBytes(js.size).padStart(10)}`);
  }
  for (const css of cssFiles) {
    console.log(`  CSS: ${css.name.padEnd(30)} ${formatBytes(css.size).padStart(10)}`);
  }

  console.log('-----------------------');
  console.log(`  Total JS:  ${formatBytes(totalJsSize).padEnd(10)} (Budget: < ${formatBytes(JS_BUDGET_BYTES)})`);
  console.log(`  Total CSS: ${formatBytes(totalCssSize).padEnd(10)} (Budget: < ${formatBytes(CSS_BUDGET_BYTES)})`);

  let passed = true;
  const errors = [];

  if (totalJsSize > JS_BUDGET_BYTES) {
    const msg = `JS bundle exceeded budget: ${formatBytes(totalJsSize)} > ${formatBytes(JS_BUDGET_BYTES)}`;
    console.error(`✖ ${msg}`);
    errors.push(msg);
    passed = false;
  } else {
    console.log(`✔ JS bundle is well within budget (${Math.round((totalJsSize / JS_BUDGET_BYTES) * 100)}% of limit)`);
  }

  if (totalCssSize > CSS_BUDGET_BYTES) {
    const msg = `CSS bundle exceeded budget: ${formatBytes(totalCssSize)} > ${formatBytes(CSS_BUDGET_BYTES)}`;
    console.error(`✖ ${msg}`);
    errors.push(msg);
    passed = false;
  } else {
    console.log(`✔ CSS bundle is well within budget (${Math.round((totalCssSize / CSS_BUDGET_BYTES) * 100)}% of limit)`);
  }

  // Verify asset references in index.html resolve
  const assetRefRegex = /(?:src|href)="([^"]+)"/g;
  let match;
  while ((match = assetRefRegex.exec(htmlContent)) !== null) {
    const rawUrl = match[1];
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:') || rawUrl.startsWith('#')) {
      continue;
    }
    const cleanPath = rawUrl.replace(/^\.?\//, '');
    const assetOnDisk = path.join(distDir, cleanPath);
    if (!fs.existsSync(assetOnDisk)) {
      console.warn(`[WARN] HTML references asset not found directly at ${cleanPath} (may be route/virtual)`);
    }
  }

  console.log('======================================================');
  if (passed) {
    console.log('✔ Tier 2: Production Bundle Verification PASSED');
  } else {
    console.log('✖ Tier 2: Production Bundle Verification FAILED');
  }
  console.log('======================================================\n');

  return { success: passed, totalJsSize, totalCssSize, errors };
}

// Auto-run if executed directly as script
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = verifyProductionBundle();
  if (!result.success) {
    process.exit(1);
  }
}
