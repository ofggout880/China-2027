import { t } from '../../i18n.js';
/**
 * website/src/components/charts/studentGrowthChart.js
 * Chart 1: International Student Inflow Trajectory & 2027 Projections
 * Pure SVG Stacked Bar & Trajectory Area Chart (Zero External Dependencies)
 * 
 * Features:
 * - Stacked bars: Degree Seeking (China Red #DE2910) + Language/Exchange (Imperial Gold #FFDE00)
 * - Trajectory area fill and projection trendline to 2027P (Target 700k students)
 * - Y-axis horizontal gridlines and scaled metric ticks (0 to 800k)
 * - Interactive floating tooltip with exact counts, percentages, and projected milestone badges
 * - Keyboard accessible (tabindex="0", role="button", ARIA labels)
 * - Mobile-first responsive vector scaling (viewBox="0 0 620 320")
 */

export const DEFAULT_STUDENT_DATA = [
  { year: "2018", degree: 258, exchange: 234, total: 492, isProjected: false },
  { year: "2020", degree: 240, exchange: 150, total: 390, isProjected: false },
  { year: "2022", degree: 265, exchange: 175, total: 440, isProjected: false },
  { year: "2024", degree: 310, exchange: 210, total: 520, isProjected: false },
  { year: "2026", degree: 360, exchange: 250, total: 610, isProjected: false },
  { year: "2027P", degree: 415, exchange: 285, total: 700, isProjected: true }
];

export function renderStudentGrowthChart(customData = null) {
  const data = Array.isArray(customData) && customData.length > 0
    ? customData
    : DEFAULT_STUDENT_DATA;

  const svgW = 620;
  const svgH = 320;
  const padLeft = 60;
  const padRight = 20;
  const padTop = 35;
  const padBottom = 45;
  const chartW = svgW - padLeft - padRight; // 540
  const chartH = svgH - padTop - padBottom; // 240
  const yMax = 800;
  const baselineY = padTop + chartH; // 275

  // Y-axis ticks
  const yTicks = [0, 200, 400, 600, 800];
  const colW = chartW / data.length; // 90
  const barW = 44;

  // Compute geometry for each bar column
  const points = data.map((d, i) => {
    const cx = padLeft + (i + 0.5) * colW;
    const x = cx - barW / 2;
    const hDeg = (d.degree / yMax) * chartH;
    const yDeg = baselineY - hDeg;
    const hExc = (d.exchange / yMax) * chartH;
    const yExc = yDeg - hExc;
    const total = d.total || (d.degree + d.exchange);
    const pctDegree = Math.round((d.degree / total) * 100);
    const pctExchange = Math.round((d.exchange / total) * 100);

    return {
      ...d,
      total,
      pctDegree,
      pctExchange,
      cx,
      x,
      yDeg,
      hDeg,
      yExc,
      hExc,
    };
  });

  // Polyline coordinates for historical and projection segments
  const historicalPoints = points.filter((p) => !p.isProjected);
  const projectedPoint = points.find((p) => p.isProjected) || points[points.length - 1];
  const lastHistorical = historicalPoints[historicalPoints.length - 1];

  const historicalLineD = historicalPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)} ${p.yExc.toFixed(1)}`)
    .join(' ');

  const projectionLineD = lastHistorical && projectedPoint
    ? `M ${lastHistorical.cx.toFixed(1)} ${lastHistorical.yExc.toFixed(1)} L ${projectedPoint.cx.toFixed(1)} ${projectedPoint.yExc.toFixed(1)}`
    : '';

  // Area under curve polygon
  const areaPolygonD = `M ${points[0].cx.toFixed(1)} ${baselineY} ` +
    points.map((p) => `L ${p.cx.toFixed(1)} ${p.yExc.toFixed(1)}`).join(' ') +
    ` L ${points[points.length - 1].cx.toFixed(1)} ${baselineY} Z`;

  return `
    <div class="card chart-card" id="chart-card-student-growth">
      <div class="chart-header">
        <div class="chart-header-top">
          <span class="card-badge"><span class="badge-dot"></span> ${t('Growth Trajectory')}</span>
          <span class="chart-metric-callout">${t('Target: 700K (2027P)')}</span>
        </div>
        <h3 class="card-title">${t('International Student Enrollment Trajectory')}</h3>
        <p class="card-sub">${t('Actual & Projected International Student Inflow (2018–2027)')}</p>
      </div>

      <div class="chart-svg-wrap">
        <div class="chart-tooltip" id="student-growth-tooltip" aria-hidden="true"></div>

        <svg
          class="chart-svg"
          viewBox="0 0 ${svgW} ${svgH}"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Stacked bar chart showing international student enrollment growing from 492,000 in 2018 to projected 700,000 in 2027"
        >
          <defs>
            <!-- Degree Bar Gradient (China Red to Vibrant Crimson) -->
            <linearGradient id="grad-degree" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stop-color="#8B0000" />
              <stop offset="60%" stop-color="#DE2910" />
              <stop offset="100%" stop-color="#FF2A4A" />
            </linearGradient>

            <!-- Exchange Bar Gradient (Imperial Gold) -->
            <linearGradient id="grad-exchange" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stop-color="#C29200" />
              <stop offset="60%" stop-color="#FFDE00" />
              <stop offset="100%" stop-color="#FFF066" />
            </linearGradient>

            <!-- Area Envelope Gradient -->
            <linearGradient id="grad-growth-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#DE2910" stop-opacity="0.30" />
              <stop offset="70%" stop-color="#DE2910" stop-opacity="0.08" />
              <stop offset="100%" stop-color="#DE2910" stop-opacity="0.00" />
            </linearGradient>

            <!-- Active Glow Filter -->
            <filter id="glow-bar" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- Background Area Fill Under Curve -->
          <path d="${areaPolygonD}" fill="url(#grad-growth-area)" />

          <!-- Y-Axis Gridlines & Labels -->
          <g class="chart-gridlines" aria-hidden="true">
            ${yTicks.map((tick) => {
              const yPos = baselineY - (tick / yMax) * chartH;
              return `
                <line x1="${padLeft}" y1="${yPos.toFixed(1)}" x2="${padLeft + chartW}" y2="${yPos.toFixed(1)}" stroke="rgba(255, 255, 255, 0.08)" stroke-dasharray="3 3" />
                <text x="${padLeft - 8}" y="${(yPos + 4).toFixed(1)}" text-anchor="end" fill="#9CA3AF" font-size="11" font-family="var(--font-mono, monospace)">${tick}k</text>
              `;
            }).join('')}
            <!-- Baseline -->
            <line x1="${padLeft}" y1="${baselineY}" x2="${padLeft + chartW}" y2="${baselineY}" stroke="rgba(255, 255, 255, 0.2)" stroke-width="1.5" />
          </g>

          <!-- Stacked Bars & Hit Zones -->
          ${points.map((p, i) => `
            <g class="bar-group ${p.isProjected ? 'is-projected' : ''}" data-index="${i}" tabindex="0" role="button" aria-label="${p.year}: Total ${p.total}k students (${p.degree}k degree, ${p.exchange}k exchange)">
              <!-- Degree Seeking Bar (Bottom) -->
              <rect
                class="bar-degree"
                x="${p.x.toFixed(1)}"
                y="${p.yDeg.toFixed(1)}"
                width="${barW}"
                height="${p.hDeg.toFixed(1)}"
                rx="2"
                fill="url(#grad-degree)"
              />

              <!-- Language & Exchange Bar (Stacked on Top) -->
              <rect
                class="bar-exchange"
                x="${p.x.toFixed(1)}"
                y="${p.yExc.toFixed(1)}"
                width="${barW}"
                height="${p.hExc.toFixed(1)}"
                rx="3"
                fill="url(#grad-exchange)"
              />

              <!-- Projection Indicator Outline for 2027P -->
              ${p.isProjected ? `
                <rect
                  class="projection-outline"
                  x="${(p.x - 2).toFixed(1)}"
                  y="${(p.yExc - 2).toFixed(1)}"
                  width="${barW + 4}"
                  height="${(p.hDeg + p.hExc + 2).toFixed(1)}"
                  rx="4"
                  fill="none"
                  stroke="#FFDE00"
                  stroke-width="1.5"
                  stroke-dasharray="4 3"
                />
              ` : ''}

              <!-- Peak Marker Dot -->
              <circle
                class="bar-apex-dot"
                cx="${p.cx.toFixed(1)}"
                cy="${p.yExc.toFixed(1)}"
                r="${p.isProjected ? 4.5 : 3.5}"
                fill="${p.isProjected ? '#FFDE00' : '#FFFFFF'}"
                stroke="${p.isProjected ? '#FFFFFF' : '#DE2910'}"
                stroke-width="1.5"
              />

              <!-- X-Axis Year Label -->
              <text
                class="x-label ${p.isProjected ? 'x-label-gold' : ''}"
                x="${p.cx.toFixed(1)}"
                y="300"
                text-anchor="middle"
                fill="${p.isProjected ? '#FFDE00' : '#F3F4F6'}"
                font-size="${p.isProjected ? 12 : 11}"
                font-weight="${p.isProjected ? 700 : 500}"
                font-family="var(--font-sans, sans-serif)"
              >${p.year}</text>

              <!-- Transparent Hit Zone for Smooth Hover / Touch / Keyboard -->
              <rect
                class="chart-hit-zone"
                x="${(p.cx - colW / 2).toFixed(1)}"
                y="${padTop}"
                width="${colW.toFixed(1)}"
                height="${chartH + 30}"
                fill="transparent"
                style="cursor: pointer;"
              />
            </g>
          `).join('')}

          <!-- Trendline (Solid Historical + Dashed Projected) -->
          <g class="chart-trendlines" pointer-events="none" aria-hidden="true">
            <path d="${historicalLineD}" fill="none" stroke="rgba(255, 255, 255, 0.75)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            ${projectionLineD ? `
              <path d="${projectionLineD}" fill="none" stroke="#FFDE00" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round" />
            ` : ''}
          </g>
        </svg>
      </div>

      <!-- Chart Legend & Metadata -->
      <div class="chart-legend" role="list" aria-label="Chart Legend">
        <div class="chart-legend-item" role="listitem">
          <span class="chart-legend-swatch" style="background: linear-gradient(135deg, #DE2910, #FF2A4A);"></span>
          <span>${t('Degree Seeking (Bachelor/Master/PhD)')}</span>
        </div>
        <div class="chart-legend-item" role="listitem">
          <span class="chart-legend-swatch" style="background: #FFDE00;"></span>
          <span>${t('Language & Non-Degree Exchange')}</span>
        </div>
        <div class="chart-legend-item" role="listitem">
          <span class="chart-legend-swatch" style="background: transparent; border: 1.5px dashed #FFDE00;"></span>
          <span>${t('Projected 2027 Target')}</span>
        </div>
      </div>

      <div class="chart-footnote">
        <span>+79.5% projected surge from 2020 baseline</span>
        <span>Source: MOE PRC International Statistics</span>
      </div>
    </div>
  `;
}

export function setupStudentGrowthChart(cardElement, customData = null) {
  if (!cardElement) return null;

  const data = Array.isArray(customData) && customData.length > 0
    ? customData
    : DEFAULT_STUDENT_DATA;

  const tooltip = cardElement.querySelector('#student-growth-tooltip');
  const barGroups = cardElement.querySelectorAll('.bar-group');

  if (!tooltip || barGroups.length === 0) return null;

  const showTooltip = (idx, targetGroup) => {
    const item = data[idx];
    if (!item) return;

    barGroups.forEach((g) => g.classList.remove('is-active'));
    targetGroup.classList.add('is-active');

    const total = item.total || (item.degree + item.exchange);
    const pctDeg = Math.round((item.degree / total) * 100);
    const pctExc = Math.round((item.exchange / total) * 100);

    tooltip.innerHTML = `
      <div class="chart-tooltip-title">
        <span>Academic Year ${item.year}</span>
        ${item.isProjected ? '<span class="chart-badge-gold">Intake Target</span>' : ''}
      </div>
      <div class="chart-tooltip-row">
        <span><span class="chart-tooltip-dot" style="background:#DE2910"></span>Degree Seeking:</span>
        <span class="chart-tooltip-val"><strong>${item.degree.toLocaleString()},000</strong> (${pctDeg}%)</span>
      </div>
      <div class="chart-tooltip-row">
        <span><span class="chart-tooltip-dot" style="background:#FFDE00"></span>Language & Exchange:</span>
        <span class="chart-tooltip-val"><strong>${item.exchange.toLocaleString()},000</strong> (${pctExc}%)</span>
      </div>
      <div class="chart-tooltip-row total-row">
        <span>Total International:</span>
        <span class="chart-tooltip-val"><strong>${total.toLocaleString()},000</strong></span>
      </div>
    `;

    // Calculate position
    const colW = 540 / data.length;
    const cx = 60 + (idx + 0.5) * colW;
    const leftPercent = (cx / 620) * 100;

    tooltip.style.left = `${leftPercent.toFixed(1)}%`;
    tooltip.style.top = '15%';
    tooltip.classList.add('is-visible');
    tooltip.setAttribute('aria-hidden', 'false');
  };

  const hideTooltip = () => {
    barGroups.forEach((g) => g.classList.remove('is-active'));
    tooltip.classList.remove('is-visible');
    tooltip.setAttribute('aria-hidden', 'true');
  };

  const cleanups = [];

  barGroups.forEach((group) => {
    const idx = parseInt(group.dataset.index, 10);

    const onEnter = () => showTooltip(idx, group);
    const onLeave = () => hideTooltip();
    const onFocus = () => showTooltip(idx, group);
    const onBlur = () => hideTooltip();

    group.addEventListener('mouseenter', onEnter);
    group.addEventListener('mouseleave', onLeave);
    group.addEventListener('focus', onFocus);
    group.addEventListener('blur', onBlur);
    group.addEventListener('touchstart', onEnter, { passive: true });

    cleanups.push(() => {
      group.removeEventListener('mouseenter', onEnter);
      group.removeEventListener('mouseleave', onLeave);
      group.removeEventListener('focus', onFocus);
      group.removeEventListener('blur', onBlur);
      group.removeEventListener('touchstart', onEnter);
    });
  });

  return {
    destroy: () => {
      cleanups.forEach((fn) => fn());
    }
  };
}

export default {
  DEFAULT_STUDENT_DATA,
  renderStudentGrowthChart,
  setupStudentGrowthChart,
};
