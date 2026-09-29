import { t } from '../../i18n.js';
/**
 * website/src/components/charts/disciplineDonutChart.js
 * Chart 2: Academic Discipline Distribution
 * Pure SVG Segmented Donut Chart with Polar Math & Center Metric Callout
 * 
 * Features:
 * - Polar arc paths (M... A... L... A... Z) with gap angle spacing
 * - Four disciplines: STEM & AI (42%), Language (24%), Economics (18%), Medicine (16%)
 * - Dynamic data adapter (gracefully handles any custom array input)
 * - Interactive center callout badge updating to active slice percentage and student count
 * - Physical radial explosion on hover/focus along bisector angle
 * - Bidirectionally synchronized interactive legend
 * - Keyboard accessible (tabindex="0", role="button", ARIA labels)
 */

export const DEFAULT_DISCIPLINE_DATA = [
  {
    id: "stem",
    name: "STEM & Artificial Intelligence",
    nameZh: "理工与人工智能",
    percent: 42,
    count: "206,640",
    color: "#FF2A4A",
    gradientId: "grad-stem"
  },
  {
    id: "lang",
    name: "Chinese Language & Culture",
    nameZh: "汉语言文学与文化",
    percent: 24,
    count: "118,080",
    color: "#DE2910",
    gradientId: "grad-lang"
  },
  {
    id: "econ",
    name: "Economics & Global Trade",
    nameZh: "经济学与国际商贸",
    percent: 18,
    count: "88,560",
    color: "#FFDE00",
    gradientId: "grad-econ"
  },
  {
    id: "med",
    name: "Clinical Medicine & Health",
    nameZh: "临床医学与公共卫生",
    percent: 16,
    count: "78,720",
    color: "#4A90E2",
    gradientId: "grad-med"
  }
];

export function computeDonutArcs(data, cx = 200, cy = 200, R = 140, r = 85, gap = 0.035) {
  const total = data.reduce((sum, d) => sum + (d.percent || d.value || 0), 0);
  let curAngle = -Math.PI / 2;

  const GRADIENT_MAP = {
    stem: 'grad-stem',
    lang: 'grad-lang',
    econ: 'grad-econ',
    med: 'grad-med'
  };

  const COLOR_MAP = {
    stem: '#FF2A4A',
    lang: '#DE2910',
    econ: '#FFDE00',
    med: '#4A90E2'
  };

  return data.map((d, i) => {
    const rawVal = d.percent || d.value || 0;
    const pct = Math.round((rawVal / total) * 100);
    const span = (rawVal / total) * 2 * Math.PI;

    const a1 = curAngle + gap / 2;
    const a2 = curAngle + span - gap / 2;
    const midAngle = (a1 + a2) / 2;
    curAngle += span;

    const x1 = cx + R * Math.cos(a1);
    const y1 = cy + R * Math.sin(a1);
    const x2 = cx + R * Math.cos(a2);
    const y2 = cy + R * Math.sin(a2);

    const x3 = cx + r * Math.cos(a2);
    const y3 = cy + r * Math.sin(a2);
    const x4 = cx + r * Math.cos(a1);
    const y4 = cy + r * Math.sin(a1);

    const largeArc = (a2 - a1 > Math.PI) ? 1 : 0;
    const pathD = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${r} ${r} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;

    // Radial explosion vector (6px outward translation)
    const explodeX = (6 * Math.cos(midAngle)).toFixed(2);
    const explodeY = (6 * Math.sin(midAngle)).toFixed(2);

    const resolvedColor = d.color || COLOR_MAP[d.id] || '#DE2910';
    const resolvedGrad = d.gradientId || GRADIENT_MAP[d.id] || `grad-slice-${i}`;

    return {
      ...d,
      pct,
      pathD,
      explodeX,
      explodeY,
      color: resolvedColor,
      gradientId: resolvedGrad
    };
  });
}

export function renderDisciplineDonutChart(customData = null) {
  const data = Array.isArray(customData) && customData.length > 0
    ? customData
    : DEFAULT_DISCIPLINE_DATA;

  const arcs = computeDonutArcs(data);

  return `
    <div class="card chart-card" id="chart-card-discipline-donut">
      <div class="chart-header">
        <div class="chart-header-top">
          <span class="card-badge"><span class="badge-dot"></span> ${t('Academic Landscape')}</span>
          <span class="chart-metric-callout">${t('Top Discipline: STEM (42%)')}</span>
        </div>
        <h3 class="card-title">${t('Discipline Distribution')}</h3>
        <p class="card-sub">${t('International Student Enrollment by Primary Field of Academic Study')}</p>
      </div>

      <div class="chart-svg-wrap">
        <svg
          class="chart-svg"
          viewBox="0 0 400 400"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Donut chart showing student discipline distribution: STEM & AI 42%, Chinese Language 24%, Economics 18%, Medicine 16%"
        >
          <defs>
            ${arcs.map((a) => `
              <linearGradient id="${a.gradientId}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="${a.color}" />
                <stop offset="100%" stop-color="${a.color}" stop-opacity="0.85" />
              </linearGradient>
            `).join('')}
            <linearGradient id="grad-stem" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#FF2A4A" />
              <stop offset="100%" stop-color="#FF5E74" />
            </linearGradient>

            <linearGradient id="grad-lang" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#DE2910" />
              <stop offset="100%" stop-color="#FF3B30" />
            </linearGradient>

            <linearGradient id="grad-econ" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#FFDE00" />
              <stop offset="100%" stop-color="#FFB800" />
            </linearGradient>

            <linearGradient id="grad-med" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#4A90E2" />
              <stop offset="100%" stop-color="#357ABD" />
            </linearGradient>

            <!-- Drop Shadow for Slices -->
            <filter id="donut-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0, 0, 0, 0.6)" />
            </filter>
          </defs>

          <!-- Outer Background Ring -->
          <circle cx="200" cy="200" r="112.5" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="56" />

          <!-- Polar Arc Segments -->
          <g class="donut-slices-group" role="group" aria-label="Academic disciplines segments">
            ${arcs.map((a, i) => `
              <path
                class="donut-slice"
                data-id="${a.id || i}"
                data-index="${i}"
                data-name="${a.name}"
                data-pct="${a.pct}"
                data-count="${a.count || ''}"
                data-color="${a.color}"
                data-explode-x="${a.explodeX}"
                data-explode-y="${a.explodeY}"
                d="${a.pathD}"
                fill="url(#${a.gradientId})"
                stroke="rgba(10, 12, 16, 0.85)"
                stroke-width="2.5"
                filter="url(#donut-shadow)"
                tabindex="0"
                role="button"
                aria-label="${a.name}: ${a.pct}% (${a.count || ''} students)"
              />
            `).join('')}
          </g>

          <!-- Center Callout Badge Plate -->
          <g class="donut-center-group" pointer-events="none" aria-live="polite">
            <circle cx="200" cy="200" r="76" fill="rgba(18, 21, 28, 0.94)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />
            <circle cx="200" cy="200" r="70" fill="none" stroke="rgba(222, 41, 16, 0.25)" stroke-width="1" />

            <text id="donut-center-metric" class="donut-center-val" x="200" y="194" text-anchor="middle" fill="#FFFFFF" font-size="28" font-weight="800" font-family="var(--font-sans, sans-serif)">492K+</text>
            <text id="donut-center-label" class="donut-center-label" x="200" y="215" text-anchor="middle" fill="#9CA3AF" font-size="11" font-weight="600" font-family="var(--font-sans, sans-serif)">${t('Total Enrolled')}</text>
            <text id="donut-center-sub" class="donut-center-sub" x="200" y="231" text-anchor="middle" fill="#FFDE00" font-size="10" font-family="var(--font-sans, sans-serif)">学科分布</text>
          </g>
        </svg>
      </div>

      <!-- Synchronized Interactive Legend -->
      <div class="chart-legend donut-legend" role="list" aria-label="Discipline Legend">
        ${arcs.map((a, i) => `
          <div
            class="chart-legend-item"
            data-id="${a.id || i}"
            data-index="${i}"
            role="listitem"
            tabindex="0"
            aria-label="${a.name}: ${a.pct}%"
          >
            <span class="chart-legend-swatch" style="background: ${a.color};"></span>
            <div class="legend-text-col">
              <span class="legend-name">${a.name}</span>
              ${a.nameZh ? `<span class="legend-zh">${a.nameZh}</span>` : ''}
            </div>
            <span class="chart-legend-badge" style="color: ${a.color};">${a.pct}%</span>
          </div>
        `).join('')}
      </div>

      <div class="chart-footnote">
        <span>${t('Lead Priority: Engineering & Applied AI')}</span>
        <span>${t('CSC Scholarship Favorability')}</span>
      </div>
    </div>
  `;
}

export function setupDisciplineDonutChart(cardElement, customData = null) {
  if (!cardElement) return null;

  const data = Array.isArray(customData) && customData.length > 0
    ? customData
    : DEFAULT_DISCIPLINE_DATA;

  const arcs = computeDonutArcs(data);

  const slices = cardElement.querySelectorAll('.donut-slice');
  const legendItems = cardElement.querySelectorAll('.chart-legend-item');
  const metricEl = cardElement.querySelector('#donut-center-metric');
  const labelEl = cardElement.querySelector('#donut-center-label');
  const subEl = cardElement.querySelector('#donut-center-sub');

  if (!metricEl || !labelEl || slices.length === 0) return null;

  const defaultMetric = '492K+';
  const defaultLabel = 'Total Enrolled';
  const defaultSub = '学科分布';
  const defaultColor = '#FFFFFF';

  const activateSlice = (idx) => {
    const arc = arcs[idx];
    if (!arc) return;

    slices.forEach((s, i) => {
      if (i === idx) {
        s.classList.add('is-active');
        s.style.transform = `translate(${arc.explodeX}px, ${arc.explodeY}px)`;
      } else {
        s.classList.remove('is-active');
        s.style.transform = 'translate(0px, 0px)';
      }
    });

    legendItems.forEach((item, i) => {
      item.classList.toggle('is-active', i === idx);
    });

    // Update center callout
    metricEl.textContent = `${arc.pct}%`;
    metricEl.setAttribute('fill', arc.color);
    labelEl.textContent = arc.name.split('&')[0].trim();
    subEl.textContent = arc.count ? `${arc.count} Students` : arc.nameZh || '';
  };

  const deactivateSlice = () => {
    slices.forEach((s) => {
      s.classList.remove('is-active');
      s.style.transform = 'translate(0px, 0px)';
    });

    legendItems.forEach((item) => item.classList.remove('is-active'));

    metricEl.textContent = defaultMetric;
    metricEl.setAttribute('fill', defaultColor);
    labelEl.textContent = defaultLabel;
    subEl.textContent = defaultSub;
  };

  const cleanups = [];

  // Bind slice events
  slices.forEach((slice) => {
    const idx = parseInt(slice.dataset.index, 10);
    const onEnter = () => activateSlice(idx);
    const onLeave = () => deactivateSlice();

    slice.addEventListener('mouseenter', onEnter);
    slice.addEventListener('mouseleave', onLeave);
    slice.addEventListener('focus', onEnter);
    slice.addEventListener('blur', onLeave);
    slice.addEventListener('click', onEnter);

    cleanups.push(() => {
      slice.removeEventListener('mouseenter', onEnter);
      slice.removeEventListener('mouseleave', onLeave);
      slice.removeEventListener('focus', onEnter);
      slice.removeEventListener('blur', onLeave);
      slice.removeEventListener('click', onEnter);
    });
  });

  // Bind legend events
  legendItems.forEach((item) => {
    const idx = parseInt(item.dataset.index, 10);
    const onEnter = () => activateSlice(idx);
    const onLeave = () => deactivateSlice();

    item.addEventListener('mouseenter', onEnter);
    item.addEventListener('mouseleave', onLeave);
    item.addEventListener('focus', onEnter);
    item.addEventListener('blur', onLeave);
    item.addEventListener('click', onEnter);

    cleanups.push(() => {
      item.removeEventListener('mouseenter', onEnter);
      item.removeEventListener('mouseleave', onLeave);
      item.removeEventListener('focus', onEnter);
      item.removeEventListener('blur', onLeave);
      item.removeEventListener('click', onEnter);
    });
  });

  return {
    destroy: () => {
      cleanups.forEach((fn) => fn());
    }
  };
}

export default {
  DEFAULT_DISCIPLINE_DATA,
  computeDonutArcs,
  renderDisciplineDonutChart,
  setupDisciplineDonutChart
};
