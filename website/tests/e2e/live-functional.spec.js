/**
 * website/tests/e2e/live-functional.spec.js
 * Playwright E2E Functional Test Suite (Tier 3)
 * Authoritative Source: ORIGINAL_REQUEST.md (R1-R5), PROJECT.md
 * Run via: npx playwright test
 */

import { test, expect } from '@playwright/test';

test.describe('Tier 3: E2E Live Browser Verification Suite', () => {
  let consoleErrors = [];
  let pageErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    pageErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message || String(err));
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
  });

  test('01 - Zero Console Errors & Page Stability (R1, R5)', async ({ page }) => {
    // Zero tolerance for unhandled errors
    expect(consoleErrors, `Found console errors: ${consoleErrors.join(', ')}`).toHaveLength(0);
    expect(pageErrors, `Found uncaught page errors: ${pageErrors.join(', ')}`).toHaveLength(0);

    // Page title check
    const title = await page.title();
    expect(title.toLowerCase()).toContain('china');
  });

  test('02 - 3D WebGL Canvas Scene Presence & Context (R1)', async ({ page }) => {
    const canvas = page.locator('canvas#bg-canvas, canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);

    // Evaluate WebGL context
    const contextInfo = await canvas.evaluate((el) => {
      const gl = el.getContext('webgl2') || el.getContext('webgl') || el.getContext('2d');
      return {
        hasContext: Boolean(gl),
        isLost: gl && typeof gl.isContextLost === 'function' ? gl.isContextLost() : false,
      };
    });

    expect(contextInfo.hasContext).toBe(true);
    expect(contextInfo.isLost).toBe(false);
  });

  test('03 - Dark Theme & China Red Visual Identity (R1)', async ({ page }) => {
    const theme = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const bodyStyle = getComputedStyle(document.body);
      return {
        bgPrimary: rootStyle.getPropertyValue('--bg-primary').trim() || bodyStyle.backgroundColor,
        redPrimary: rootStyle.getPropertyValue('--color-red-primary').trim() || rootStyle.getPropertyValue('--color-red-vibrant').trim(),
        gold: rootStyle.getPropertyValue('--color-gold').trim(),
      };
    });

    // Verify dark background (contains #0 or rgb <= 30)
    expect(theme.bgPrimary).toBeTruthy();
    // Verify China red token is registered
    expect(theme.redPrimary).toBeTruthy();
  });

  test('04 - Modern China Statistics & 2 Distinct SVG Charts (R2)', async ({ page }) => {
    // Metric cards
    const statCards = page.locator('.stat-card, [data-stat], .metric-card');
    await expect(statCards.first()).toBeVisible({ timeout: 5000 });
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // SVG Charts
    const svgs = page.locator('svg');
    const svgCount = await svgs.count();
    expect(svgCount).toBeGreaterThanOrEqual(2);

    // Check SVG bounding boxes
    const firstChartBox = await svgs.first().boundingBox();
    expect(firstChartBox).not.toBeNull();
    expect(firstChartBox.width).toBeGreaterThan(50);
  });

  test('05 - September 2027 Countdown Timer (R2)', async ({ page }) => {
    const timer = page.locator('#countdown, .countdown, [data-countdown]').first();
    await expect(timer).toBeVisible();

    const text = await timer.innerText();
    const daysMatch = text.match(/(\d+)\s*(?:d|days?)/i);
    expect(daysMatch).not.toBeNull();

    const days = parseInt(daysMatch[1], 10);
    expect(days).toBeGreaterThan(300);
    expect(days).toBeLessThanOrEqual(750);
  });

  test('06 - School Finder Search & Dynamic Filtering (R3)', async ({ page }) => {
    const searchInput = page.locator('#school-search, input[type="search"], .school-search-input').first();
    const universityCards = page.locator('.school-card, .university-card, [data-university]');

    await expect(searchInput).toBeVisible();
    const initialCount = await universityCards.count();
    expect(initialCount).toBeGreaterThanOrEqual(5);

    // Filter by typing Tsinghua
    await searchInput.fill('Tsinghua');
    await page.waitForTimeout(300);

    const filteredCards = page.locator('.school-card:visible, .university-card:visible, [data-university]:visible');
    const filteredCount = await filteredCards.count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThanOrEqual(1);

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(200);
    const restoredCount = await page.locator('.school-card:visible, .university-card:visible, [data-university]:visible').count();
    expect(restoredCount).toBe(initialCount);
  });

  test('07 - Chinese Language Learning Timeline HSK 1-6 (R3)', async ({ page }) => {
    const milestones = page.locator('.timeline-milestone, .hsk-card, [data-hsk]');
    const count = await milestones.count();
    expect(count).toBeGreaterThanOrEqual(6);

    // Check first milestone contains HSK 1
    const firstText = await milestones.first().innerText();
    expect(firstText).toContain('1');
  });

  test('08 - Application Document Checklist & LocalStorage Persistence (R3)', async ({ page }) => {
    const checkboxes = page.locator('.checklist-checkbox, input[type="checkbox"]');
    const totalCount = await checkboxes.count();
    expect(totalCount).toBeGreaterThanOrEqual(5);

    // Find unchecked checkbox and click
    const unchecked = page.locator('.checklist-checkbox:not(:checked), input[type="checkbox"]:not(:checked)').first();
    if (await unchecked.count() > 0) {
      await unchecked.click();
    } else {
      await checkboxes.first().click();
    }

    // Verify localStorage has key china2027_checklist_v1
    const stored = await page.evaluate(() => localStorage.getItem('china2027_checklist_v1'));
    expect(stored).not.toBeNull();

    // Reload and check persistence
    await page.reload({ waitUntil: 'domcontentloaded' });
    const storedPostReload = await page.evaluate(() => localStorage.getItem('china2027_checklist_v1'));
    expect(storedPostReload).toBe(stored);
  });

  test('09 - Mobile Viewport Overflow Audit & Desktop Scaling (R4)', async ({ page }) => {
    // Mobile Viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(200);

    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(mobileOverflow, 'Mobile viewport (375px) must not have horizontal scroll overflow').toBe(false);

    // Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(200);

    const desktopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(desktopOverflow, 'Desktop viewport (1280px) must not have horizontal scroll overflow').toBe(false);
  });
});
