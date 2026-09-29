/**
 * website/tests/unit/m2Verification.test.mjs
 * Milestone M2 Comprehensive Verification Suite
 * Modern China Macro Statistics, SVG Charts, and September 2027 Countdown
 * Authoritative References: ORIGINAL_REQUEST.md (R2, R4), PROJECT.md (Features 4, 5, 6, 7)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../../src');

describe('Milestone M2 Comprehensive Verification Suite', () => {

  test('1. All M2 core files exist and are non-empty', () => {
    const requiredFiles = [
      'data/chinaStatistics.js',
      'components/chinaMetrics.js',
      'components/charts/studentGrowthChart.js',
      'components/charts/disciplineDonutChart.js',
      'components/countdownTimer.js',
    ];

    for (const relPath of requiredFiles) {
      const fullPath = path.join(SRC_DIR, relPath);
      assert.ok(fs.existsSync(fullPath), `Missing required file: src/${relPath}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 200, `File src/${relPath} is unexpectedly small (${stats.size} bytes)`);
    }
  });

  test('2. China Statistics dataset contains 6 authentic macroeconomic cards', async () => {
    const mod = await import(path.join(SRC_DIR, 'data/chinaStatistics.js'));
    const { macroStats, charts } = mod;

    assert.ok(Array.isArray(macroStats), 'macroStats must be an array');
    assert.strictEqual(macroStats.length, 6, 'Must contain exactly 6 macro stats');

    const expectedIds = ['gdp', 'rd', 'patents', 'hsr', 'intl_students', 'rankings'];
    const ids = macroStats.map((s) => s.id);
    for (const expId of expectedIds) {
      assert.ok(ids.includes(expId), `macroStats missing metric id: ${expId}`);
    }

    // Verify detailed schema for each card
    for (const stat of macroStats) {
      assert.ok(stat.label && stat.label.length > 0, `stat ${stat.id} missing label`);
      assert.ok(stat.labelZh && stat.labelZh.length > 0, `stat ${stat.id} missing labelZh`);
      assert.ok(stat.value && stat.value.length > 0, `stat ${stat.id} missing value`);
      assert.ok(typeof stat.numericValue === 'number', `stat ${stat.id} numericValue must be a number`);
      assert.ok(stat.category && stat.category.length > 0, `stat ${stat.id} missing category`);
      assert.ok(stat.badge && stat.badge.length > 0, `stat ${stat.id} missing badge`);
      assert.ok(stat.description && stat.description.length > 0, `stat ${stat.id} missing description`);
    }

    // Verify charts data
    assert.ok(charts, 'charts object must be exported');
    assert.ok(Array.isArray(charts.studentEnrollmentTrend.data), 'studentEnrollmentTrend data array required');
    assert.strictEqual(charts.studentEnrollmentTrend.data.length, 6, 'Trend must cover 6 periods');
    assert.ok(Array.isArray(charts.disciplineDistribution.data), 'disciplineDistribution data array required');
    assert.ok(charts.disciplineDistribution.data.length >= 4, 'Must have at least 4 disciplines');
  });

  test('3. China Metrics component produces valid semantic HTML with required selectors', async () => {
    const mod = await import(path.join(SRC_DIR, 'components/chinaMetrics.js'));
    const { renderMetricCard, renderMetricsHeader, renderChinaMetrics } = mod;

    const sampleStat = {
      id: 'gdp',
      label: 'Gross Domestic Product (GDP)',
      labelZh: '国内生产总值',
      value: '$18.56 Trillion',
      growth: '+5.0% YoY',
      badge: 'World #2 Economy',
      category: 'Economic Pillar',
      description: 'Test description for GDP.'
    };

    const cardHtml = renderMetricCard(sampleStat);
    assert.ok(cardHtml.includes('class="card stat-card metric-card"'), 'Must have .stat-card and .metric-card classes');
    assert.ok(cardHtml.includes('data-stat="gdp"'), 'Must have data-stat="gdp"');
    assert.ok(cardHtml.includes('$18.56 Trillion'), 'Must display metric value');
    assert.ok(cardHtml.includes('国内生产总值'), 'Must display Chinese label');
    assert.ok(cardHtml.includes('stat-card-glow-halo'), 'Must have ambient glow halo element');

    const headerHtml = renderMetricsHeader();
    assert.ok(headerHtml.includes('metrics-header-block'), 'Must contain header block class');
    assert.ok(headerHtml.includes('Modern China'), 'Header must contain Modern China');

    const fullSectionHtml = renderChinaMetrics();
    assert.ok(fullSectionHtml.includes('china-metrics-section'), 'Full section must contain wrapper');
    assert.ok(fullSectionHtml.includes('stats-grid'), 'Full section must contain stats-grid');
    // Ensure all 6 cards are rendered
    assert.strictEqual((fullSectionHtml.match(/data-stat="/g) || []).length, 6, 'Full render must contain 6 cards');
  });

  test('4. Student Growth Chart renders SVG stacked bar & trajectory geometry without NaN', async () => {
    const mod = await import(path.join(SRC_DIR, 'components/charts/studentGrowthChart.js'));
    const { renderStudentGrowthChart, DEFAULT_STUDENT_DATA } = mod;

    assert.ok(Array.isArray(DEFAULT_STUDENT_DATA), 'DEFAULT_STUDENT_DATA must be array');
    const chartHtml = renderStudentGrowthChart();

    assert.ok(chartHtml.includes('<svg'), 'Must render SVG element');
    assert.ok(chartHtml.includes('viewBox="0 0 620 320"'), 'Must specify responsive viewBox');
    assert.ok(!chartHtml.includes('NaN'), 'SVG must not contain NaN coordinates');
    assert.ok(chartHtml.includes('id="chart-card-student-growth"'), 'Must have distinct container ID');
    assert.ok(chartHtml.includes('id="student-growth-tooltip"'), 'Must provide interactive tooltip container');
    assert.ok(chartHtml.includes('bar-degree'), 'Must render degree-seeking bars');
    assert.ok(chartHtml.includes('bar-exchange'), 'Must render language & exchange bars');
    assert.ok(chartHtml.includes('2027P'), 'Must include 2027 Projected intake step');
    assert.ok(chartHtml.includes('projection-outline'), 'Must include projected indicator outline');
    assert.ok(chartHtml.includes('chart-trendlines'), 'Must render trajectory trendline');
  });

  test('5. Discipline Donut Chart computes precise trigonometry and renders polar SVG paths', async () => {
    const mod = await import(path.join(SRC_DIR, 'components/charts/disciplineDonutChart.js'));
    const { computeDonutArcs, renderDisciplineDonutChart, DEFAULT_DISCIPLINE_DATA } = mod;

    const arcs = computeDonutArcs(DEFAULT_DISCIPLINE_DATA);
    assert.strictEqual(arcs.length, DEFAULT_DISCIPLINE_DATA.length, 'Must compute arcs for all disciplines');

    for (const arc of arcs) {
      assert.ok(typeof arc.pathD === 'string' && arc.pathD.startsWith('M'), `Path D must start with M for ${arc.id}`);
      assert.ok(!arc.pathD.includes('NaN'), `Path D must not contain NaN for ${arc.id}`);
      assert.ok(!isNaN(parseFloat(arc.explodeX)), `explodeX must be numeric for ${arc.id}`);
      assert.ok(!isNaN(parseFloat(arc.explodeY)), `explodeY must be numeric for ${arc.id}`);
      assert.ok(arc.pct > 0 && arc.pct <= 100, `Percentage must be between 1 and 100 for ${arc.id}`);
    }

    const donutHtml = renderDisciplineDonutChart();
    assert.ok(donutHtml.includes('<svg'), 'Must render SVG element');
    assert.ok(donutHtml.includes('viewBox="0 0 400 400"'), 'Must specify responsive viewBox');
    assert.ok(!donutHtml.includes('NaN'), 'SVG must not contain NaN coordinates');
    assert.ok(donutHtml.includes('id="chart-card-discipline-donut"'), 'Must have distinct container ID');
    assert.ok(donutHtml.includes('id="donut-center-metric"'), 'Must have center metric callout element');
    assert.ok(donutHtml.includes('donut-slices-group'), 'Must group slices for interaction');
    assert.ok(donutHtml.includes('donut-legend'), 'Must render interactive synchronized legend');
  });

  test('6. Countdown Timer component calculates real-time UTC state and renders HTML structure', async () => {
    const mod = await import(path.join(SRC_DIR, 'components/countdownTimer.js'));
    const { calculateCountdown, renderCountdownTimer, TARGET_DATE_ISO, TARGET_MS } = mod;

    assert.strictEqual(TARGET_DATE_ISO, '2027-09-01T00:00:00.000Z');
    assert.strictEqual(TARGET_MS, 1819756800000);

    const state = calculateCountdown();
    assert.ok(typeof state.days === 'number' && state.days > 0, 'Current days must be positive');
    assert.ok(typeof state.hours === 'number' && state.hours >= 0 && state.hours < 24);
    assert.ok(typeof state.minutes === 'number' && state.minutes >= 0 && state.minutes < 60);
    assert.ok(typeof state.seconds === 'number' && state.seconds >= 0 && state.seconds < 60);
    assert.strictEqual(state.isExpired, false);
    assert.ok(state.progressPercent >= 0 && state.progressPercent <= 100);

    const html = renderCountdownTimer(state);
    assert.ok(html.includes('id="countdown"'), 'Must have id="countdown" for E2E locator');
    assert.ok(html.includes('class="card countdown-card countdown"'), 'Must have .countdown class');
    assert.ok(html.includes('data-countdown="true"'), 'Must have data-countdown attribute');
    assert.ok(html.includes('id="countdown-days"'), 'Must render #countdown-days');
    assert.ok(html.includes('id="countdown-hours"'), 'Must render #countdown-hours');
    assert.ok(html.includes('id="countdown-minutes"'), 'Must render #countdown-minutes');
    assert.ok(html.includes('id="countdown-seconds"'), 'Must render #countdown-seconds');
    assert.ok(html.includes('id="countdown-progress-bar"'), 'Must render #countdown-progress-bar');
    assert.ok(html.includes('id="countdown-progress-text"'), 'Must render #countdown-progress-text');
    assert.ok(html.includes('pulse-tick'), 'Must include pulse tick animation class');
  });

  test('7. App main.js cleanly exposes initDashboardView and integrates all M2 components', async () => {
    const mainMod = await import(path.join(SRC_DIR, 'main.js'));
    assert.ok(typeof mainMod.initDashboardView === 'function', 'initDashboardView must be exported');
  });
});
