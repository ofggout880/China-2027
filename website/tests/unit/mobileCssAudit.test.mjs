/**
 * website/tests/unit/mobileCssAudit.test.mjs
 * Tier 1 Static Analysis: Mobile-First CSS Architecture Audit
 * Authoritative Source: ORIGINAL_REQUEST.md (R4 Acceptance Criteria), PROJECT.md
 * Rule: Default CSS styles target mobile devices, with @media queries used EXCLUSIVELY to scale up (min-width).
 * Strictly ZERO max-width media queries permitted.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STYLES_DIR = path.resolve(__dirname, '../../src/styles');

// Helper to recursively find all CSS files in a directory
function getCssFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getCssFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.css')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Mobile-first CSS validator
export function auditCssContent(cssContent, fileName = 'unknown.css') {
  const violations = [];

  // Match all @media statements
  const mediaRegex = /@media[^{]+\{/gi;
  let match;

  while ((match = mediaRegex.exec(cssContent)) !== null) {
    const mediaStatement = match[0];

    // Rule 1: Strictly NO max-width queries
    if (/max-width/i.test(mediaStatement)) {
      violations.push({
        type: 'FORBIDDEN_MAX_WIDTH',
        file: fileName,
        snippet: mediaStatement.trim(),
        message: 'Mobile-first violation: max-width media query detected. Use min-width to scale up instead.',
      });
    }

    // Rule 2: Ensure width queries use min-width
    if (/width/i.test(mediaStatement) && !/min-width/i.test(mediaStatement) && !/max-width/i.test(mediaStatement)) {
      violations.push({
        type: 'AMBIGUOUS_WIDTH_QUERY',
        file: fileName,
        snippet: mediaStatement.trim(),
        message: 'Ambiguous width media query. Only min-width is allowed for responsive scaling.',
      });
    }
  }

  return violations;
}

describe('Tier 1: Mobile-First CSS Static Analysis & Media Query Audit', () => {
  test('Audit engine correctly detects non-compliant max-width media queries', () => {
    const badCss = `
      .header { font-size: 24px; }
      @media (max-width: 768px) {
        .header { font-size: 16px; }
      }
    `;
    const violations = auditCssContent(badCss, 'bad.css');
    assert.strictEqual(violations.length, 1);
    assert.strictEqual(violations[0].type, 'FORBIDDEN_MAX_WIDTH');
  });

  test('Audit engine accepts strictly compliant min-width progressive queries', () => {
    const compliantCss = `
      /* Mobile default: 1 column */
      .grid { display: grid; grid-template-columns: 1fr; }

      /* Tablet enhancement */
      @media (min-width: 640px) {
        .grid { grid-template-columns: repeat(2, 1fr); }
      }

      /* Desktop enhancement */
      @media (min-width: 1024px) {
        .grid { grid-template-columns: repeat(3, 1fr); }
      }
    `;
    const violations = auditCssContent(compliantCss, 'compliant.css');
    assert.strictEqual(violations.length, 0, 'Compliant CSS with min-width should produce 0 violations');
  });

  test('Audit engine permits print and orientation queries without width constraints', () => {
    const otherQueries = `
      @media print {
        body { background: white; }
      }
      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; }
      }
    `;
    const violations = auditCssContent(otherQueries, 'safe.css');
    assert.strictEqual(violations.length, 0);
  });

  test('Scan all project CSS files in src/styles/ for 0 max-width violations', (t) => {
    const cssFiles = getCssFiles(STYLES_DIR);

    if (cssFiles.length === 0) {
      t.skip('Pending implementation: No CSS files found in src/styles/ yet (scheduled for M1 scaffolding)');
      return;
    }

    const allViolations = [];
    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const fileViolations = auditCssContent(content, path.relative(STYLES_DIR, file));
      allViolations.push(...fileViolations);
    }

    if (allViolations.length > 0) {
      const details = allViolations.map((v) => `[${v.file}] ${v.snippet} -> ${v.message}`).join('\n');
      assert.fail(`Found ${allViolations.length} mobile-first CSS violations:\n${details}`);
    }

    assert.strictEqual(allViolations.length, 0, 'Strict mobile-first compliance: 0 max-width queries allowed');
  });

  test('Verify CSS variables specification in variables.css if present', (t) => {
    const varFile = path.join(STYLES_DIR, 'variables.css');
    if (!fs.existsSync(varFile)) {
      t.skip('variables.css not yet created (scheduled for M1)');
      return;
    }

    const content = fs.readFileSync(varFile, 'utf8');
    const requiredTokens = [
      '--bg-primary',
      '--color-red-primary',
      '--color-red-vibrant',
      '--color-gold',
    ];

    for (const token of requiredTokens) {
      assert.ok(
        content.includes(token),
        `variables.css must define root token "${token}"`
      );
    }
  });
});
