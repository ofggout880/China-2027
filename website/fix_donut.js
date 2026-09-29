import fs from 'fs';

// 1. Update chinaStatistics.js
let stats = fs.readFileSync('src/data/chinaStatistics.js', 'utf-8');
stats = stats.replace(
  "{ id: 'stem', name: 'STEM & Artificial Intelligence', nameZh: '理工与人工智能', value: 42, percent: 42, count: '206,640', color: '#FF2A4A' }",
  "{ id: 'stem', name: 'STEM & Artificial Intelligence', nameZh: '理工与人工智能', value: 42, percent: 42, count: '206,640', color: '#FF2A4A', gradientId: 'grad-stem' }"
);
stats = stats.replace(
  "{ id: 'lang', name: 'Chinese Language & Culture', nameZh: '汉语言文学与文化', value: 24, percent: 24, count: '118,080', color: '#DE2910' }",
  "{ id: 'lang', name: 'Chinese Language & Culture', nameZh: '汉语言文学与文化', value: 24, percent: 24, count: '118,080', color: '#DE2910', gradientId: 'grad-lang' }"
);
stats = stats.replace(
  "{ id: 'econ', name: 'Economics & Global Trade', nameZh: '经济学与国际商贸', value: 18, percent: 18, count: '88,560', color: '#FFDE00' }",
  "{ id: 'econ', name: 'Economics & Global Trade', nameZh: '经济学与国际商贸', value: 18, percent: 18, count: '88,560', color: '#FFDE00', gradientId: 'grad-econ' }"
);
stats = stats.replace(
  "{ id: 'med', name: 'Clinical Medicine & Health', nameZh: '临床医学与公共卫生', value: 16, percent: 16, count: '78,720', color: '#4A90E2' }",
  "{ id: 'med', name: 'Clinical Medicine & Health', nameZh: '临床医学与公共卫生', value: 16, percent: 16, count: '78,720', color: '#4A90E2', gradientId: 'grad-med' }"
);
fs.writeFileSync('src/data/chinaStatistics.js', stats);

// 2. Update disciplineDonutChart.js
let donut = fs.readFileSync('src/components/charts/disciplineDonutChart.js', 'utf-8');

const updatedCompute = `export function computeDonutArcs(data, cx = 200, cy = 200, R = 140, r = 85, gap = 0.035) {
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
    const pathD = \`M \${x1.toFixed(2)} \${y1.toFixed(2)} A \${R} \${R} 0 \${largeArc} 1 \${x2.toFixed(2)} \${y2.toFixed(2)} L \${x3.toFixed(2)} \${y3.toFixed(2)} A \${r} \${r} 0 \${largeArc} 0 \${x4.toFixed(2)} \${y4.toFixed(2)} Z\`;

    // Radial explosion vector (6px outward translation)
    const explodeX = (6 * Math.cos(midAngle)).toFixed(2);
    const explodeY = (6 * Math.sin(midAngle)).toFixed(2);

    const resolvedColor = d.color || COLOR_MAP[d.id] || '#DE2910';
    const resolvedGrad = d.gradientId || GRADIENT_MAP[d.id] || \`grad-slice-\${i}\`;

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
}`;

donut = donut.replace(/export function computeDonutArcs[\s\S]*?^}/m, updatedCompute);

// In renderDisciplineDonutChart, make sure defs has all gradients + inline styles
const updatedDefs = `<defs>
            \${arcs.map((a) => \`
              <linearGradient id="\${a.gradientId}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="\${a.color}" />
                <stop offset="100%" stop-color="\${a.color}" stop-opacity="0.85" />
              </linearGradient>
            \`).join('')}
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
          </defs>`;

donut = donut.replace(/<defs>[\s\S]*?<\/defs>/, updatedDefs);

if (!donut.includes("import { t }")) {
  donut = "import { t } from '../../i18n.js';\n" + donut;
}

fs.writeFileSync('src/components/charts/disciplineDonutChart.js', donut);
