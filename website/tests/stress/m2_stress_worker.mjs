/**
 * website/tests/stress/m2_stress_worker.mjs
 * Worker thread module for multi-threaded concurrency & stress benchmarking
 * of Milestone M2 countdown and SVG chart calculations.
 */

import { parentPort, workerData } from 'node:worker_threads';
import {
  TARGET_DATE_ISO,
  TARGET_MS,
  calculateCountdown,
  renderCountdownTimer
} from '../../src/components/countdownTimer.js';
import {
  renderStudentGrowthChart,
  DEFAULT_STUDENT_DATA
} from '../../src/components/charts/studentGrowthChart.js';
import {
  computeDonutArcs,
  renderDisciplineDonutChart,
  DEFAULT_DISCIPLINE_DATA
} from '../../src/components/charts/disciplineDonutChart.js';

const { workerId, iterations = 5000 } = workerData || {};

const FORMATTED_REGEX = /^\d+d : \d{2}h : \d{2}m : \d{2}s$/;

function runWorkerStress() {
  const startTime = Date.now();
  let countdownCalcErrors = 0;
  let countdownRenderErrors = 0;
  let studentChartErrors = 0;
  let donutChartErrors = 0;

  // 1. Countdown Calculation Stress across randomized & boundary timestamps
  for (let i = 0; i < iterations; i++) {
    // Generate various test timestamps
    const nowMs = TARGET_MS - (i * 3600000) - (i % 1000);
    const state = calculateCountdown(TARGET_DATE_ISO, nowMs);

    if (
      typeof state.deltaMs !== 'number' ||
      Number.isNaN(state.deltaMs) ||
      state.deltaMs < 0 ||
      state.days < 0 ||
      state.hours < 0 || state.hours > 23 ||
      state.minutes < 0 || state.minutes > 59 ||
      state.seconds < 0 || state.seconds > 59 ||
      typeof state.isExpired !== 'boolean' ||
      state.progressPercent < 0 || state.progressPercent > 100 ||
      !FORMATTED_REGEX.test(state.formatted)
    ) {
      countdownCalcErrors++;
    }

    // Boundary edge tests
    const expiredState = calculateCountdown(TARGET_DATE_ISO, TARGET_MS + i + 1);
    if (!expiredState.isExpired || expiredState.deltaMs !== 0 || expiredState.days !== 0) {
      countdownCalcErrors++;
    }

    // Invalid string fallback
    const fallbackState = calculateCountdown('invalid-date-string-xyz', nowMs);
    if (fallbackState.targetDateIso !== TARGET_DATE_ISO || Number.isNaN(fallbackState.deltaMs)) {
      countdownCalcErrors++;
    }
  }

  // 2. Countdown Timer HTML Rendering Stress (iterations / 5)
  const renderIterations = Math.max(100, Math.floor(iterations / 5));
  for (let i = 0; i < renderIterations; i++) {
    const dummyState = {
      targetDateIso: TARGET_DATE_ISO,
      deltaMs: (i * 1234567),
      days: i % 365,
      hours: i % 24,
      minutes: i % 60,
      seconds: i % 60,
      isExpired: i % 10 === 0,
      progressPercent: (i * 7) % 100,
      formatted: `${i % 365}d : 12h : 34m : 56s`
    };

    const html = renderCountdownTimer(dummyState);
    if (
      !html ||
      typeof html !== 'string' ||
      html.includes('NaN') ||
      html.includes('undefined') ||
      !html.includes('id="countdown"') ||
      !html.includes('countdown-days') ||
      !html.includes('countdown-hours') ||
      !html.includes('countdown-minutes') ||
      !html.includes('countdown-seconds')
    ) {
      countdownRenderErrors++;
    }
  }

  // 3. Student Growth Chart SVG Rendering Stress (renderIterations)
  for (let i = 0; i < renderIterations; i++) {
    // Generate variable datasets
    const customData = [
      { year: '2020', degree: 200 + (i % 50), exchange: 100 + (i % 40), total: 300 + (i % 90), isProjected: false },
      { year: '2024', degree: 300 + (i % 60), exchange: 180 + (i % 50), total: 480 + (i % 110), isProjected: false },
      { year: '2027P', degree: 400 + (i % 70), exchange: 250 + (i % 60), total: 650 + (i % 130), isProjected: true }
    ];

    const svg = renderStudentGrowthChart(customData);
    if (
      !svg ||
      typeof svg !== 'string' ||
      svg.includes('NaN') ||
      svg.includes('Infinity') ||
      !svg.includes('viewBox="0 0 620 320"') ||
      !svg.includes('class="chart-svg"') ||
      !svg.includes('id="chart-card-student-growth"')
    ) {
      studentChartErrors++;
    }
  }

  // 4. Discipline Donut Chart Math & Rendering Stress (renderIterations)
  for (let i = 0; i < renderIterations; i++) {
    const customDonut = [
      { id: 'd1', name: 'Field 1', percent: 30 + (i % 10), count: '100k', color: '#DE2910' },
      { id: 'd2', name: 'Field 2', percent: 25, count: '80k', color: '#FFDE00' },
      { id: 'd3', name: 'Field 3', percent: 25, count: '80k', color: '#FF2A4A' },
      { id: 'd4', name: 'Field 4', percent: 20 - (i % 10), count: '60k', color: '#4A90E2' }
    ];

    const arcs = computeDonutArcs(customDonut);
    if (arcs.length !== customDonut.length) {
      donutChartErrors++;
    }

    const donutSvg = renderDisciplineDonutChart(customDonut);
    if (
      !donutSvg ||
      typeof donutSvg !== 'string' ||
      donutSvg.includes('NaN') ||
      donutSvg.includes('Infinity') ||
      !donutSvg.includes('viewBox="0 0 400 400"') ||
      !donutSvg.includes('donut-slice') ||
      !donutSvg.includes('id="chart-card-discipline-donut"')
    ) {
      donutChartErrors++;
    }
  }

  const durationMs = Date.now() - startTime;

  return {
    workerId,
    durationMs,
    iterations,
    renderIterations,
    countdownCalcErrors,
    countdownRenderErrors,
    studentChartErrors,
    donutChartErrors,
    totalErrors: countdownCalcErrors + countdownRenderErrors + studentChartErrors + donutChartErrors
  };
}

const result = runWorkerStress();
if (parentPort) {
  parentPort.postMessage(result);
}
