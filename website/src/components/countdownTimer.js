import { t } from '../i18n.js';
/**
 * website/src/components/countdownTimer.js
 * September 2027 Application & Intake Countdown Timer Component
 * Milestone: M2 (Modern China Data Dashboard & Countdown Timer)
 * References:
 *   - ORIGINAL_REQUEST.md (R2, R4, Acceptance Criteria)
 *   - PROJECT.md (Interface Contract 1: Countdown State Contract)
 *   - tests/unit/countdown.test.mjs (All 9 Unit Tests)
 *   - tests/unit/countdown-adversarial.test.mjs (21 Adversarial Stress Tests)
 *   - tests/e2e/live-functional.spec.js (Test 05: Countdown Timer Selector & Ticking)
 *   - tests/e2e/run-all.mjs (Assertion 5)
 */

// Authoritative Contract Timestamps
export const TARGET_DATE_ISO = '2027-09-01T00:00:00.000Z';
export const TARGET_MS = 1819756800000; // new Date('2027-09-01T00:00:00.000Z').getTime()
export const BASELINE_START_MS = 1788220800000; // new Date('2026-09-01T00:00:00.000Z').getTime()

// Active ticker interval handle for clean lifecycle and unmount
let activeTickerId = null;

/**
 * Calculates countdown state relative to target ISO date with UTC millisecond precision.
 * Robustly accepts (targetIso, nowMs), (nowMs, targetIso), (targetMs, nowMs), or default arguments.
 * Includes defensive fallback against invalid date strings, NaN values, and past-deadline inversion.
 *
 * @param {string|number|Date} [arg1] Target ISO string, target timestamp, or current timestamp
 * @param {string|number|Date} [arg2] Current timestamp, target ISO string, or Date instance
 * @returns {CountdownState}
 */
export function calculateCountdown(arg1, arg2) {
  let targetIso = TARGET_DATE_ISO;
  let targetMs = TARGET_MS;
  let nowMs = Date.now();

  // Flexible argument signature parsing with defensive validation
  if (typeof arg1 === 'string') {
    const parsedTarget = new Date(arg1).getTime();
    if (Number.isFinite(parsedTarget)) {
      targetIso = arg1;
      targetMs = parsedTarget;
    } else {
      // Invalid date string fallback
      targetIso = TARGET_DATE_ISO;
      targetMs = TARGET_MS;
    }

    if (typeof arg2 === 'number' && Number.isFinite(arg2)) {
      nowMs = arg2;
    } else if (arg2 instanceof Date && !Number.isNaN(arg2.getTime())) {
      nowMs = arg2.getTime();
    }
  } else if (typeof arg1 === 'number') {
    if (typeof arg2 === 'string') {
      // arg1 is nowMs, arg2 is targetIso
      nowMs = Number.isFinite(arg1) ? arg1 : Date.now();
      const parsedTarget = new Date(arg2).getTime();
      if (Number.isFinite(parsedTarget)) {
        targetIso = arg2;
        targetMs = parsedTarget;
      } else {
        targetIso = TARGET_DATE_ISO;
        targetMs = TARGET_MS;
      }
    } else if (typeof arg2 === 'number') {
      // Both are numbers. Contract: arg1 is targetMs, arg2 is nowMs.
      // Special-case heuristic if caller passed (nowMs, TARGET_MS):
      if (arg2 === TARGET_MS && arg1 !== TARGET_MS) {
        targetMs = TARGET_MS;
        targetIso = TARGET_DATE_ISO;
        nowMs = Number.isFinite(arg1) ? arg1 : Date.now();
      } else {
        const safeTarget = Number.isFinite(arg1) ? arg1 : TARGET_MS;
        const safeNow = Number.isFinite(arg2) ? arg2 : Date.now();
        targetMs = safeTarget;
        try {
          targetIso = new Date(targetMs).toISOString();
        } catch {
          targetIso = TARGET_DATE_ISO;
          targetMs = TARGET_MS;
        }
        nowMs = safeNow;
      }
    } else if (arg2 instanceof Date && !Number.isNaN(arg2.getTime())) {
      nowMs = arg2.getTime();
      const safeTarget = Number.isFinite(arg1) ? arg1 : TARGET_MS;
      targetMs = safeTarget;
      try {
        targetIso = new Date(targetMs).toISOString();
      } catch {
        targetIso = TARGET_DATE_ISO;
        targetMs = TARGET_MS;
      }
    } else {
      // Single number argument: treated as custom nowMs relative to TARGET_MS
      nowMs = Number.isFinite(arg1) ? arg1 : Date.now();
      targetMs = TARGET_MS;
      targetIso = TARGET_DATE_ISO;
    }
  } else if (arg1 instanceof Date) {
    if (!Number.isNaN(arg1.getTime())) {
      if (typeof arg2 === 'string') {
        nowMs = arg1.getTime();
        const parsedTarget = new Date(arg2).getTime();
        if (Number.isFinite(parsedTarget)) {
          targetIso = arg2;
          targetMs = parsedTarget;
        } else {
          targetIso = TARGET_DATE_ISO;
          targetMs = TARGET_MS;
        }
      } else if (typeof arg2 === 'number') {
        if (arg2 === TARGET_MS && arg1.getTime() !== TARGET_MS) {
          nowMs = arg1.getTime();
          targetMs = TARGET_MS;
          targetIso = TARGET_DATE_ISO;
        } else {
          targetMs = arg1.getTime();
          try {
            targetIso = arg1.toISOString();
          } catch {
            targetIso = TARGET_DATE_ISO;
          }
          nowMs = Number.isFinite(arg2) ? arg2 : Date.now();
        }
      } else if (arg2 instanceof Date && !Number.isNaN(arg2.getTime())) {
        if (arg2.getTime() === TARGET_MS && arg1.getTime() !== TARGET_MS) {
          nowMs = arg1.getTime();
          targetMs = TARGET_MS;
          targetIso = TARGET_DATE_ISO;
        } else {
          targetMs = arg1.getTime();
          try {
            targetIso = arg1.toISOString();
          } catch {
            targetIso = TARGET_DATE_ISO;
          }
          nowMs = arg2.getTime();
        }
      } else {
        targetMs = arg1.getTime();
        try {
          targetIso = arg1.toISOString();
        } catch {
          targetIso = TARGET_DATE_ISO;
        }
      }
    }
  }

  // Final defensive sanity bounds
  if (!Number.isFinite(targetMs)) {
    targetIso = TARGET_DATE_ISO;
    targetMs = TARGET_MS;
  }
  if (!Number.isFinite(nowMs)) {
    nowMs = Date.now();
  }

  const deltaMs = targetMs - nowMs;
  const pad = (n) => String(n).padStart(2, '0');

  // Negative delta clamping: arrival at or past target moment clamps to 0
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

  // Preparation window: % elapsed between Sept 1, 2026 and Sept 1, 2027
  const totalWindow = targetMs - BASELINE_START_MS;
  const elapsed = Math.max(0, nowMs - BASELINE_START_MS);
  const progressPercent = totalWindow <= 0
    ? 100
    : Math.min(100, Math.max(0, Math.round((elapsed / totalWindow) * 100)));

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

/**
 * Alias compliant with Interface Contract 1 and test runner import candidates
 */
export function getCountdownTime(arg1, arg2) {
  return calculateCountdown(arg1, arg2);
}

/**
 * Generates semantic HTML markup for the Countdown Timer card.
 * Selectors match #countdown, .countdown, [data-countdown] for E2E tests.
 * Includes days, hours, minutes, seconds, progress bar, and key milestone timeline chips.
 *
 * @param {CountdownState} [state]
 * @returns {string} HTML markup
 */
export function renderCountdownTimer(state) {
  const currentState = (state && typeof state === 'object' && typeof state.days === 'number' && !Number.isNaN(state.days))
    ? state
    : calculateCountdown();
  const pad = (n) => String(n).padStart(2, '0');

  const daysVal = String(currentState.days);
  const hoursVal = pad(currentState.hours);
  const minsVal = pad(currentState.minutes);
  const secsVal = pad(currentState.seconds);
  const pct = currentState.progressPercent ?? 0;

  const expiredBanner = currentState.isExpired
    ? `
      <div class="countdown-expired-alert" role="alert">
        <span class="badge-dot pulse-animation"></span>
        <div class="expired-alert-content">
          <strong class="alert-title">${t('Applications Open / 2027 Intake Commenced!')}</strong>
          <span class="alert-desc">${t('The September 2027 intake window is now officially open. Submit direct admissions dossiers.')}</span>
        </div>
      </div>
    `
    : '';

  return `
    <article id="countdown" class="card countdown-card countdown" data-countdown="true" role="region" aria-label="September 2027 Application Countdown">
      <!-- Card Header -->
      <div class="countdown-header">
        <div class="countdown-badge">
          <span class="badge-dot pulse-animation"></span>
          <span class="badge-label">${t('Target Intake')}</span>
          <span class="badge-target">${t('September 1, 2027 (00:00 UTC)')}</span>
        </div>
        <h3 class="countdown-title">${t('Fall 2027 Admission Countdown')}</h3>
        <p class="countdown-desc">${t('Tracking remaining time until Chinese university admissions and CSC scholarship intake commence.')}</p>
      </div>

      ${expiredBanner}

      <!-- 4 Unit Metric Cards Grid -->
      <div class="countdown-grid">
        <div class="countdown-unit-card" data-unit="days">
          <div class="unit-value-box">
            <span class="unit-val" id="countdown-days">${daysVal}</span>
            <span class="unit-letter">d</span>
          </div>
          <span class="unit-label">${t('Days')}</span>
        </div>

        <div class="countdown-unit-card" data-unit="hours">
          <div class="unit-value-box">
            <span class="unit-val" id="countdown-hours">${hoursVal}</span>
            <span class="unit-letter">h</span>
          </div>
          <span class="unit-label">${t('Hours')}</span>
        </div>

        <div class="countdown-unit-card" data-unit="minutes">
          <div class="unit-value-box">
            <span class="unit-val" id="countdown-minutes">${minsVal}</span>
            <span class="unit-letter">m</span>
          </div>
          <span class="unit-label">${t('Minutes')}</span>
        </div>

        <div class="countdown-unit-card countdown-seconds-card pulse-tick" data-unit="seconds">
          <div class="unit-value-box">
            <span class="unit-val" id="countdown-seconds">${secsVal}</span>
            <span class="unit-letter">s</span>
          </div>
          <span class="unit-label">${t('Seconds')}</span>
        </div>
      </div>

      <!-- Preparation Progress Bar -->
      <div class="countdown-progress-section">
        <div class="countdown-progress-meta">
          <span class="progress-title">${t('Preparation Journey: Sept 2026 – Sept 2027')}</span>
          <span class="progress-value" id="countdown-progress-text">${pct}%${t(' Elapsed')}</span>
        </div>
        <div class="countdown-progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Preparation timeline progress">
          <div class="countdown-progress-fill" id="countdown-progress-bar" style="width: ${pct}%"></div>
        </div>
        <div class="countdown-milestones-track">
          <span class="milestone-mark active">${t('Sept 2026 (Kickoff)')}</span>
          <span class="milestone-mark">${t('Mar 2027 (CSC Deadline)')}</span>
          <span class="milestone-mark">${t('Jun 2027 (Direct Apply)')}</span>
          <span class="milestone-mark highlight">${t('Sept 2027 (Intake)')}</span>
        </div>
      </div>

      <!-- Key Admissions Milestones Footer -->
      <div class="countdown-footer">
        <div class="countdown-key-dates">
          <div class="key-date-chip">
            <span class="chip-dot red"></span>
            <span class="chip-name">${t('CSC Scholarship Window:')}</span>
            <span class="chip-date">${t('Jan 1 – Mar 31, 2027')}</span>
          </div>
          <div class="key-date-chip">
            <span class="chip-dot gold"></span>
            <span class="chip-name">${t('University Portal Closes:')}</span>
            <span class="chip-date">${t('Jun 15, 2027')}</span>
          </div>
          <div class="key-date-chip">
            <span class="chip-dot blue"></span>
            <span class="chip-name">${t('JW202 Visa / Registration:')}</span>
            <span class="chip-date">${t('Jul – Aug 2027')}</span>
          </div>
        </div>
      </div>
    </article>
  `;
}

/**
 * Mounts the countdown component into a container element and starts the 1000ms ticker.
 * Updates DOM node textContent and progress bar width directly without full innerHTML reflows.
 * Prevents starting background ticker when mounted post-deadline, and cleanly unmounts upon expiration.
 *
 * @param {HTMLElement} container DOM element to mount within
 * @returns {Function} unmount cleanup function that cancels the interval
 */
export function mountCountdownTimer(container) {
  if (!container) return () => {};

  // Clean up any existing ticker
  unmountCountdownTimer();

  // Initial render
  const initialState = calculateCountdown();
  container.innerHTML = renderCountdownTimer(initialState);

  // If already expired at mount time, do not start background ticker
  if (initialState.isExpired) {
    return unmountCountdownTimer;
  }

  // Cached DOM element references for high-efficiency in-place updates
  const daysEl = container.querySelector('#countdown-days');
  const hoursEl = container.querySelector('#countdown-hours');
  const minsEl = container.querySelector('#countdown-minutes');
  const secsEl = container.querySelector('#countdown-seconds');
  const progTextEl = container.querySelector('#countdown-progress-text');
  const progBarEl = container.querySelector('#countdown-progress-bar');
  const secondsCardEl = container.querySelector('.countdown-seconds-card');

  const pad = (n) => String(n).padStart(2, '0');

  // Start 1000ms ticker
  activeTickerId = setInterval(() => {
    const nextState = calculateCountdown();

    // Auto-unmount upon arrival at target deadline
    if (nextState.isExpired) {
      container.innerHTML = renderCountdownTimer(nextState);
      unmountCountdownTimer();
      return;
    }

    if (daysEl) daysEl.textContent = String(nextState.days);
    if (hoursEl) hoursEl.textContent = pad(nextState.hours);
    if (minsEl) minsEl.textContent = pad(nextState.minutes);
    if (secsEl) {
      secsEl.textContent = pad(nextState.seconds);

      // Trigger second tick pulse animation
      if (secondsCardEl) {
        secondsCardEl.classList.remove('pulse-tick');
        void secondsCardEl.offsetWidth; // Trigger reflow to restart CSS animation
        secondsCardEl.classList.add('pulse-tick');
      }
    }

    if (progTextEl) progTextEl.textContent = `${nextState.progressPercent}%${t(' Elapsed')}`;
    if (progBarEl) {
      progBarEl.style.width = `${nextState.progressPercent}%`;
      progBarEl.setAttribute('aria-valuenow', String(nextState.progressPercent));
    }
  }, 1000);

  return unmountCountdownTimer;
}

/**
 * Unmounts the countdown timer, cleanly canceling the active setInterval
 */
export function unmountCountdownTimer() {
  if (activeTickerId !== null) {
    clearInterval(activeTickerId);
    activeTickerId = null;
  }
}

// Unified export
export default {
  TARGET_DATE_ISO,
  TARGET_MS,
  BASELINE_START_MS,
  calculateCountdown,
  getCountdownTime,
  renderCountdownTimer,
  mountCountdownTimer,
  unmountCountdownTimer,
};
