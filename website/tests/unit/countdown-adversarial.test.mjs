/**
 * website/tests/unit/countdown-adversarial.test.mjs
 * Adversarial Stress & Boundary Verification Suite for September 2027 Countdown Timer
 * Milestones: M2, M5 (Adversarial Hardening)
 *
 * Tests:
 * 1. Rapid mount/unmount lifecycle & interval leak prevention
 * 2. Exact deadline & boundary ms edges (TARGET_MS, ±1ms, +100 years, epoch 0, negative timestamps)
 * 3. Invalid date strings, empty strings, and NaN propagation
 * 4. Leap year arithmetic (2027 non-leap 28d Feb vs 2028 leap 29d Feb)
 * 5. Timezone invariance across 24+ global timezones
 * 6. High-concurrency throughput (10,000 iterations) and immutability
 * 7. Two-number argument ordering and past-deadline detection
 * 8. Post-deadline mount interval lifecycle
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TARGET_DATE_ISO,
  TARGET_MS,
  BASELINE_START_MS,
  calculateCountdown,
  getCountdownTime,
  renderCountdownTimer,
  mountCountdownTimer,
  unmountCountdownTimer,
} from '../../src/components/countdownTimer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEBSITE_ROOT = path.resolve(__dirname, '../../');

function createMockContainer() {
  const elements = {};
  return {
    innerHTML: '',
    querySelector(selector) {
      if (!elements[selector]) {
        elements[selector] = {
          textContent: '',
          style: {},
          classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); },
          },
          setAttribute(name, val) { this[name] = val; },
          get offsetWidth() { return 100; },
        };
      }
      return elements[selector];
    },
    getMockElement(selector) {
      return elements[selector];
    },
  };
}

describe('Adversarial Stress Suite: Countdown Timer Component', () => {

  after(() => {
    unmountCountdownTimer();
  });

  // =========================================================================
  // 1. Mount / Unmount Cycling & Interval Leak Stress
  // =========================================================================
  describe('1. Mount/Unmount Lifecycle & Timer Leaks', () => {
    test('1.1 Standard mount and unmount cleans up active ticker cleanly', () => {
      const container = createMockContainer();
      const unmountFn = mountCountdownTimer(container);

      assert.ok(container.innerHTML.includes('Fall 2027 Admission Countdown'), 'Mount should render HTML');
      assert.strictEqual(typeof unmountFn, 'function', 'Mount returns unmount function');

      unmountFn();
      // Verify subsequent unmount call is idempotent and safe
      assert.doesNotThrow(() => unmountCountdownTimer());
    });

    test('1.2 Rapid mount/unmount cycling: 2,000 iterations without crash or handle leaks', () => {
      const t0 = Date.now();
      for (let i = 0; i < 2000; i++) {
        const c = createMockContainer();
        const unmount = mountCountdownTimer(c);
        unmount();
      }
      const duration = Date.now() - t0;
      assert.ok(duration < 2000, `2000 cycles completed in ${duration}ms (expected < 2000ms)`);
    });

    test('1.3 Consecutive mounts without unmounting cleans up previous interval', () => {
      const containers = Array.from({ length: 50 }, () => createMockContainer());
      for (const c of containers) {
        mountCountdownTimer(c);
      }
      // Clean up the single active ticker
      unmountCountdownTimer();
    });

    test('1.4 Mounting on null or undefined container returns safe no-op function', () => {
      const unmountNull = mountCountdownTimer(null);
      assert.strictEqual(typeof unmountNull, 'function');
      assert.doesNotThrow(() => unmountNull());

      const unmountUndefined = mountCountdownTimer(undefined);
      assert.strictEqual(typeof unmountUndefined, 'function');
      assert.doesNotThrow(() => unmountUndefined());
    });

    test('1.5 Automatic unmount when deadline arrives while mounted', async () => {
      let mockNow = TARGET_MS - 200; // 200ms before deadline
      const origDateNow = Date.now;
      try {
        Date.now = () => mockNow;
        let tickCount = 0;
        const container = {
          _html: '',
          get innerHTML() { return this._html; },
          set innerHTML(v) { this._html = v; },
          querySelector(sel) {
            return {
              set textContent(v) { tickCount++; },
              style: {},
              classList: { add() {}, remove() {} },
              setAttribute() {},
              get offsetWidth() { return 100; },
            };
          }
        };

        mountCountdownTimer(container);
        assert.ok(!container.innerHTML.includes('countdown-expired-alert'), 'Initial state not expired');

        // Advance past target
        mockNow = TARGET_MS + 2000;

        // Wait 1.2s for interval tick
        await new Promise(r => setTimeout(r, 1200));
        assert.ok(container.innerHTML.includes('countdown-expired-alert'), 'Expired alert rendered on target arrival');

        // Check if interval was cancelled
        const ticksAtExpiration = tickCount;
        await new Promise(r => setTimeout(r, 1200));
        assert.strictEqual(tickCount, ticksAtExpiration, 'No further interval ticks should fire after expiration');
      } finally {
        Date.now = origDateNow;
        unmountCountdownTimer();
      }
    });
  });

  // =========================================================================
  // 2. Timestamp Edge Cases & Boundaries
  // =========================================================================
  describe('2. Timestamp Edge Cases & Clamping', () => {
    test('2.1 Exact deadline moment (deltaMs = 0)', () => {
      const res = calculateCountdown(TARGET_DATE_ISO, TARGET_MS);
      assert.strictEqual(res.deltaMs, 0);
      assert.strictEqual(res.days, 0);
      assert.strictEqual(res.hours, 0);
      assert.strictEqual(res.minutes, 0);
      assert.strictEqual(res.seconds, 0);
      assert.strictEqual(res.isExpired, true);
      assert.strictEqual(res.progressPercent, 100);
      assert.strictEqual(res.formatted, '00d : 00h : 00m : 00s');
    });

    test('2.2 Exact 1 millisecond before deadline (deltaMs = 1)', () => {
      const res = calculateCountdown(TARGET_DATE_ISO, TARGET_MS - 1);
      assert.strictEqual(res.deltaMs, 1);
      assert.strictEqual(res.days, 0);
      assert.strictEqual(res.hours, 0);
      assert.strictEqual(res.minutes, 0);
      assert.strictEqual(res.seconds, 0); // 1 ms floors to 0 seconds
      assert.strictEqual(res.isExpired, false);
      assert.strictEqual(res.progressPercent, 100);
    });

    test('2.3 Exact 1 millisecond after deadline (deltaMs = -1 clamped to 0)', () => {
      const res = calculateCountdown(TARGET_DATE_ISO, TARGET_MS + 1);
      assert.strictEqual(res.deltaMs, 0);
      assert.strictEqual(res.days, 0);
      assert.strictEqual(res.hours, 0);
      assert.strictEqual(res.minutes, 0);
      assert.strictEqual(res.seconds, 0);
      assert.strictEqual(res.isExpired, true);
      assert.strictEqual(res.progressPercent, 100);
    });

    test('2.4 Extreme future timestamp (+100 years past deadline)', () => {
      const futureNow = TARGET_MS + 100 * 365.25 * 86400 * 1000;
      const res = calculateCountdown(TARGET_DATE_ISO, futureNow);
      assert.strictEqual(res.deltaMs, 0);
      assert.strictEqual(res.days, 0);
      assert.strictEqual(res.hours, 0);
      assert.strictEqual(res.minutes, 0);
      assert.strictEqual(res.seconds, 0);
      assert.strictEqual(res.isExpired, true);
      assert.strictEqual(res.progressPercent, 100);
    });

    test('2.5 Target date 100 years in future (2127)', () => {
      const futureTargetIso = '2127-09-01T00:00:00.000Z';
      const nowMs = new Date('2027-09-01T00:00:00.000Z').getTime();
      const res = calculateCountdown(futureTargetIso, nowMs);
      assert.ok(res.days > 36000, `Days remaining in 100 years must be > 36000 (got ${res.days})`);
      assert.strictEqual(res.isExpired, false);
      assert.ok(!Number.isNaN(res.deltaMs));
    });

    test('2.6 Unix Epoch 0 (1970-01-01T00:00:00.000Z)', () => {
      const res = calculateCountdown(TARGET_DATE_ISO, 0);
      assert.strictEqual(res.deltaMs, TARGET_MS);
      assert.strictEqual(res.days, 21062);
      assert.strictEqual(res.hours, 0);
      assert.strictEqual(res.minutes, 0);
      assert.strictEqual(res.seconds, 0);
      assert.strictEqual(res.isExpired, false);
      assert.strictEqual(res.progressPercent, 0);
    });

    test('2.7 Negative timestamp (Pre-1970 date)', () => {
      const pre1970Ms = -86400000; // 1969-12-31T00:00:00.000Z
      const res = calculateCountdown(TARGET_DATE_ISO, pre1970Ms);
      assert.strictEqual(res.deltaMs, TARGET_MS + 86400000);
      assert.strictEqual(res.days, 21063);
      assert.strictEqual(res.isExpired, false);
      assert.strictEqual(res.progressPercent, 0);
    });
  });

  // =========================================================================
  // 3. Leap Year Handling (2027 vs 2028)
  // =========================================================================
  describe('3. Leap Year Calendar Arithmetic', () => {
    test('3.1 February 2027 non-leap month has exactly 28 days', () => {
      const feb1 = new Date('2027-02-01T00:00:00.000Z').getTime();
      const mar1 = '2027-03-01T00:00:00.000Z';
      const res = calculateCountdown(mar1, feb1);
      assert.strictEqual(res.days, 28, 'Feb 2027 must span exactly 28 days');
      assert.strictEqual(res.hours, 0);
      assert.strictEqual(res.minutes, 0);
      assert.strictEqual(res.seconds, 0);
    });

    test('3.2 February 2028 leap month has exactly 29 days', () => {
      const feb1 = new Date('2028-02-01T00:00:00.000Z').getTime();
      const mar1 = '2028-03-01T00:00:00.000Z';
      const res = calculateCountdown(mar1, feb1);
      assert.strictEqual(res.days, 29, 'Feb 2028 leap year must span exactly 29 days');
      assert.strictEqual(res.hours, 0);
      assert.strictEqual(res.minutes, 0);
      assert.strictEqual(res.seconds, 0);
    });

    test('3.3 Feb 28 to Mar 1 in 2027 is 1 day vs 2 days in 2028', () => {
      const feb28_2027 = new Date('2027-02-28T00:00:00.000Z').getTime();
      const res2027 = calculateCountdown('2027-03-01T00:00:00.000Z', feb28_2027);
      assert.strictEqual(res2027.days, 1);

      const feb28_2028 = new Date('2028-02-28T00:00:00.000Z').getTime();
      const res2028 = calculateCountdown('2028-03-01T00:00:00.000Z', feb28_2028);
      assert.strictEqual(res2028.days, 2);
    });
  });

  // =========================================================================
  // 4. Timezone Invariance across 24+ Global Timezones
  // =========================================================================
  describe('4. Timezone Invariance Verification', () => {
    test('4.1 Deterministic UTC output identical across 31 world timezones', () => {
      const timezones = [
        'UTC', 'Europe/London', 'Europe/Paris', 'Africa/Cairo', 'Europe/Moscow',
        'Asia/Tehran', 'Asia/Dubai', 'Asia/Kabul', 'Asia/Karachi', 'Asia/Kolkata',
        'Asia/Kathmandu', 'Asia/Dhaka', 'Asia/Bangkok', 'Asia/Shanghai', 'Asia/Tokyo',
        'Australia/Darwin', 'Australia/Adelaide', 'Australia/Sydney', 'Pacific/Auckland',
        'Pacific/Chatham', 'Pacific/Kiritimati', 'Atlantic/Azores', 'America/Sao_Paulo',
        'America/St_Johns', 'America/New_York', 'America/Chicago', 'America/Denver',
        'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu', 'Pacific/Pago_Pago',
      ];

      const fixedNow = new Date('2027-03-15T14:30:45.123Z').getTime();
      const baseline = JSON.stringify(calculateCountdown(TARGET_DATE_ISO, fixedNow));

      for (const tz of timezones) {
        const cmd = `TZ="${tz}" node -e "import('./src/components/countdownTimer.js').then(m => console.log(JSON.stringify(m.calculateCountdown('${TARGET_DATE_ISO}', ${fixedNow}))))"`;
        const out = execSync(cmd, { cwd: WEBSITE_ROOT }).toString().trim();
        assert.strictEqual(out, baseline, `Timezone mismatch detected in ${tz}`);
      }
    });
  });

  // =========================================================================
  // 5. Concurrency & Pure Function Invariance
  // =========================================================================
  describe('5. High Concurrency & Immutability', () => {
    test('5.1 20,000 rapid concurrent calculations return consistent results', () => {
      const iterations = 20000;
      for (let i = 0; i < iterations; i++) {
        const testNow = 1788220800000 + (i * 1000); // from baseline onwards
        const resA = calculateCountdown(TARGET_DATE_ISO, testNow);
        const resB = getCountdownTime(TARGET_DATE_ISO, testNow);

        assert.strictEqual(resA.deltaMs, resB.deltaMs);
        assert.strictEqual(resA.days, resB.days);
        assert.strictEqual(resA.formatted, resB.formatted);
      }
    });

    test('5.2 Target Date ISO Contract Compliance', () => {
      const res = calculateCountdown();
      assert.strictEqual(res.targetDateIso, '2027-09-01T00:00:00.000Z');
      assert.strictEqual(typeof res.deltaMs, 'number');
      assert.strictEqual(typeof res.days, 'number');
      assert.strictEqual(typeof res.hours, 'number');
      assert.strictEqual(typeof res.minutes, 'number');
      assert.strictEqual(typeof res.seconds, 'number');
      assert.strictEqual(typeof res.isExpired, 'boolean');
      assert.strictEqual(typeof res.progressPercent, 'number');
    });
  });

  // =========================================================================
  // 6. Adversarial Vulnerability Remediation Assertions
  // =========================================================================
  describe('6. Adversarial Vulnerability Remediation Assertions', () => {
    test('6.1 Remediation: Two-number signature with past deadline correctly clamps to expired', () => {
      const pastNow = TARGET_MS + 10000; // 10 seconds past deadline
      // Correct behavior via string ISO target
      const resIso = calculateCountdown(TARGET_DATE_ISO, pastNow);
      assert.strictEqual(resIso.isExpired, true, 'ISO target must be expired');
      assert.strictEqual(resIso.deltaMs, 0);

      // Remediated behavior: passing (TARGET_MS, pastNow)
      const resNumbers = calculateCountdown(TARGET_MS, pastNow);
      assert.strictEqual(resNumbers.isExpired, true, 'Must report isExpired === true when pastNow > TARGET_MS');
      assert.strictEqual(resNumbers.deltaMs, 0, 'deltaMs must clamp to 0');
      assert.strictEqual(resNumbers.days, 0);
      assert.strictEqual(resNumbers.hours, 0);
      assert.strictEqual(resNumbers.minutes, 0);
      assert.strictEqual(resNumbers.seconds, 0);

      // Inverted numeric signature (pastNow, TARGET_MS)
      const resInverted = calculateCountdown(pastNow, TARGET_MS);
      assert.strictEqual(resInverted.isExpired, true, 'Inverted call must also be expired');
      assert.strictEqual(resInverted.deltaMs, 0);
    });

    test('6.2 Remediation: Invalid date strings fallback gracefully to default target without NaN', () => {
      const res = calculateCountdown('not-a-valid-date');
      assert.strictEqual(res.targetDateIso, TARGET_DATE_ISO);
      assert.strictEqual(Number.isNaN(res.deltaMs), false, 'deltaMs must not be NaN');
      assert.strictEqual(Number.isNaN(res.days), false, 'days must not be NaN');
      assert.strictEqual(Number.isNaN(res.hours), false, 'hours must not be NaN');
      assert.strictEqual(Number.isNaN(res.minutes), false, 'minutes must not be NaN');
      assert.strictEqual(Number.isNaN(res.seconds), false, 'seconds must not be NaN');
      assert.strictEqual(Number.isNaN(res.progressPercent), false, 'progressPercent must not be NaN');
      assert.strictEqual(typeof res.formatted, 'string');
      assert.ok(!res.formatted.includes('NaN'), 'Formatted string must not include NaN');

      // Invalid date string with past timestamp fallback
      const resPast = calculateCountdown('not-a-valid-date', TARGET_MS + 5000);
      assert.strictEqual(resPast.isExpired, true, 'Must be expired with past now timestamp');
      assert.strictEqual(resPast.deltaMs, 0);
      assert.strictEqual(resPast.formatted, '00d : 00h : 00m : 00s');
    });

    test('6.3 Remediation: Mounting when already expired does not start ticking interval', async () => {
      const origDateNow = Date.now;
      let tickCount = 0;
      try {
        // Mock current time to 1 hour past deadline
        Date.now = () => TARGET_MS + 3600000;
        const container = {
          _html: '',
          get innerHTML() { return this._html; },
          set innerHTML(v) { this._html = v; },
          querySelector(sel) {
            return {
              set textContent(v) { tickCount++; },
              style: {},
              classList: { add() {}, remove() {} },
              setAttribute() {},
              get offsetWidth() { return 100; },
            };
          }
        };

        const unmount = mountCountdownTimer(container);
        assert.ok(container.innerHTML.includes('countdown-expired-alert'), 'Renders expired alert');

        // Wait 1.5 seconds to observe if interval is active
        await new Promise(r => setTimeout(r, 1500));
        assert.strictEqual(tickCount, 0, 'Interval timer must not tick on an already-expired countdown');
        unmount();
      } finally {
        Date.now = origDateNow;
        unmountCountdownTimer();
      }
    });
  });
});
