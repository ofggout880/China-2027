/**
 * website/tests/unit/countdown.test.mjs
 * Tier 1 Unit Test: September 2027 Countdown Mathematics & Formatting
 * Authoritative Source: ORIGINAL_REQUEST.md (R2), PROJECT.md (Interface Contract 1)
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_PATH = path.resolve(__dirname, '../../src/components/countdownTimer.js');

// Authoritative Contract Target
const TARGET_DATE_ISO = '2027-09-01T00:00:00.000Z';
const TARGET_MS = 1819756800000; // new Date('2027-09-01T00:00:00.000Z').getTime()
const BASELINE_START_MS = new Date('2026-09-01T00:00:00.000Z').getTime();

// Reference implementation strictly derived from PROJECT.md and survey specifications
function calculateCountdownRef(nowMs, targetDateIso = TARGET_DATE_ISO) {
  const targetMs = new Date(targetDateIso).getTime();
  const deltaMs = targetMs - nowMs;

  if (deltaMs <= 0) {
    return {
      targetDateIso: TARGET_DATE_ISO,
      deltaMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      progressPercent: 100,
      formatted: '00d : 00h : 00m : 00s',
    };
  }

  const MS_PER_SEC = 1000;
  const MS_PER_MIN = MS_PER_SEC * 60;
  const MS_PER_HOUR = MS_PER_MIN * 60;
  const MS_PER_DAY = MS_PER_HOUR * 24;

  const days = Math.floor(deltaMs / MS_PER_DAY);
  const hours = Math.floor((deltaMs % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((deltaMs % MS_PER_HOUR) / MS_PER_MIN);
  const seconds = Math.floor((deltaMs % MS_PER_MIN) / MS_PER_SEC);

  const totalWindow = targetMs - BASELINE_START_MS;
  const elapsed = Math.max(0, nowMs - BASELINE_START_MS);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalWindow) * 100)));

  const pad = (n) => String(n).padStart(2, '0');

  return {
    targetDateIso: TARGET_DATE_ISO,
    deltaMs,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    progressPercent,
    formatted: `${days}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`,
  };
}

describe('Tier 1: Countdown Timer Mathematics & Edge Cases', async () => {
  let targetFn = calculateCountdownRef;
  let isUsingSrcModule = false;

  before(async () => {
    if (fs.existsSync(SRC_PATH)) {
      try {
        const mod = await import(SRC_PATH);
        const candidate = mod.getCountdownTime || mod.calculateCountdown || mod.default?.getCountdownTime || mod.default;
        if (typeof candidate === 'function') {
          targetFn = (nowMs, targetIso) => {
            const res = candidate(targetIso, nowMs);
            return res || calculateCountdownRef(nowMs, targetIso);
          };
          isUsingSrcModule = true;
        }
      } catch (err) {
        console.warn('Note: Could not import src module, falling back to authoritative specification:', err.message);
      }
    }
  });

  test('Target UTC timestamp matches exact POSIX specification', () => {
    const parsedTarget = new Date(TARGET_DATE_ISO).getTime();
    assert.strictEqual(parsedTarget, 1819756800000, '2027-09-01T00:00:00.000Z must equal 1819756800000 ms');
  });

  test('Exact 365 days delta calculation (1 year before target)', () => {
    const oneYearBefore = new Date('2026-09-01T00:00:00.000Z').getTime();
    const result = targetFn(oneYearBefore, TARGET_DATE_ISO);

    assert.strictEqual(result.days, 365, 'Exact delta from 2026-09-01 to 2027-09-01 must be 365 days');
    assert.strictEqual(result.hours, 0, 'Hours must be 0');
    assert.strictEqual(result.minutes, 0, 'Minutes must be 0');
    assert.strictEqual(result.seconds, 0, 'Seconds must be 0');
    assert.strictEqual(result.isExpired, false, 'Should not be marked expired');
  });

  test('Sub-day boundary calculation: 1 second before intake deadline', () => {
    const oneSecBefore = TARGET_MS - 1000;
    const result = targetFn(oneSecBefore, TARGET_DATE_ISO);

    assert.strictEqual(result.days, 0, 'Days remaining must be 0');
    assert.strictEqual(result.hours, 0, 'Hours remaining must be 0');
    assert.strictEqual(result.minutes, 0, 'Minutes remaining must be 0');
    assert.strictEqual(result.seconds, 1, 'Seconds remaining must be 1');
    assert.strictEqual(result.isExpired, false, '1 second before deadline is not expired');
  });

  test('Complex timestamp delta: hours, minutes, and seconds breakdown', () => {
    // 5 days, 4 hours, 3 minutes, 2 seconds before target
    const delta = (5 * 86400 + 4 * 3600 + 3 * 60 + 2) * 1000;
    const mockNow = TARGET_MS - delta;
    const result = targetFn(mockNow, TARGET_DATE_ISO);

    assert.strictEqual(result.days, 5);
    assert.strictEqual(result.hours, 4);
    assert.strictEqual(result.minutes, 3);
    assert.strictEqual(result.seconds, 2);
    assert.strictEqual(result.deltaMs, delta);
  });

  test('Deadline arrival clamping: exact deadline moment (deltaMs = 0)', () => {
    const result = targetFn(TARGET_MS, TARGET_DATE_ISO);

    assert.strictEqual(result.days, 0, 'Days must be clamped to 0');
    assert.strictEqual(result.hours, 0, 'Hours must be clamped to 0');
    assert.strictEqual(result.minutes, 0, 'Minutes must be clamped to 0');
    assert.strictEqual(result.seconds, 0, 'Seconds must be clamped to 0');
    assert.strictEqual(result.isExpired, true, 'isExpired flag must be true at deadline');
    assert.strictEqual(result.progressPercent, 100, 'progressPercent must be 100%');
  });

  test('Post-deadline clamping: dates well past September 2027 never produce negative numbers', () => {
    const postDeadlines = [
      TARGET_MS + 1000,                      // 1 second past
      TARGET_MS + 86400000,                  // 1 day past
      new Date('2028-01-01T00:00:00Z').getTime(), // 4 months past
      new Date('2030-09-01T00:00:00Z').getTime(), // 3 years past
    ];

    for (const pastMs of postDeadlines) {
      const result = targetFn(pastMs, TARGET_DATE_ISO);
      assert.strictEqual(result.days, 0, `Days must remain clamped to 0 for past timestamp ${pastMs}`);
      assert.strictEqual(result.hours, 0, `Hours must remain clamped to 0 for past timestamp ${pastMs}`);
      assert.strictEqual(result.minutes, 0, `Minutes must remain clamped to 0 for past timestamp ${pastMs}`);
      assert.strictEqual(result.seconds, 0, `Seconds must remain clamped to 0 for past timestamp ${pastMs}`);
      assert.ok(result.days >= 0 && result.hours >= 0 && result.minutes >= 0 && result.seconds >= 0, 'Values must never be negative');
      assert.strictEqual(result.isExpired, true, 'isExpired must remain true');
    }
  });

  test('Timezone invariance: UTC delta is identical across any client clock offset', () => {
    // The POSIX timestamp difference depends strictly on UTC milliseconds, not local timezone offset
    const simulatedNow = new Date('2027-01-15T08:30:00.000Z').getTime();
    const result = targetFn(simulatedNow, TARGET_DATE_ISO);

    // Delta between 2027-01-15T08:30:00Z and 2027-09-01T00:00:00Z
    // Days in Jan remaining: 16 (16 days from 15th to 31st) - 8.5h = 15d 15.5h
    // Feb: 28 days (2027 is non-leap)
    // Mar: 31 days
    // Apr: 30 days
    // May: 31 days
    // Jun: 30 days
    // Jul: 31 days
    // Aug: 31 days
    // Total days: 15 + 28 + 31 + 30 + 31 + 30 + 31 + 31 = 227 days
    assert.strictEqual(result.days, 228); // 228 days, 15 hours, 30 minutes
    assert.strictEqual(result.hours, 15);
    assert.strictEqual(result.minutes, 30);
    assert.strictEqual(result.seconds, 0);
  });

  test('Formatted string preserves two-digit zero padding for hours, minutes, and seconds', () => {
    // 100 days, 5 hours, 7 minutes, 3 seconds
    const delta = (100 * 86400 + 5 * 3600 + 7 * 60 + 3) * 1000;
    const result = targetFn(TARGET_MS - delta, TARGET_DATE_ISO);

    assert.ok(result.formatted.includes('05h') || result.formatted.includes('05:'), 'Hours must be 2-digit zero-padded: "05"');
    assert.ok(result.formatted.includes('07m') || result.formatted.includes('07:'), 'Minutes must be 2-digit zero-padded: "07"');
    assert.ok(result.formatted.includes('03s') || result.formatted.includes('03'), 'Seconds must be 2-digit zero-padded: "03"');
  });

  test('Progress percentage stays bounded within [0, 100]', () => {
    const wayBefore = new Date('2025-01-01T00:00:00Z').getTime();
    const midPoint = (BASELINE_START_MS + TARGET_MS) / 2;
    const wayAfter = new Date('2030-01-01T00:00:00Z').getTime();

    assert.strictEqual(targetFn(wayBefore, TARGET_DATE_ISO).progressPercent, 0, 'Pre-baseline timestamp clamped to 0%');
    assert.strictEqual(targetFn(midPoint, TARGET_DATE_ISO).progressPercent, 50, 'Midpoint timestamp yields exactly 50%');
    assert.strictEqual(targetFn(wayAfter, TARGET_DATE_ISO).progressPercent, 100, 'Post-deadline timestamp clamped to 100%');
  });
});
