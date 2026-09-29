import fs from 'fs';

let chart = fs.readFileSync('src/components/charts/studentGrowthChart.js', 'utf-8');

if (!chart.includes("import { t }")) {
  chart = "import { t } from '../../i18n.js';\n" + chart;
}

chart = chart.replace(
  '<span class="card-badge"><span class="badge-dot"></span> Inflow Dynamics</span>',
  '<span class="card-badge"><span class="badge-dot"></span> ${t(\'Growth Trajectory\')}</span>'
);
chart = chart.replace(
  '<span class="chart-metric-callout">Target: 700k (2027)</span>',
  '<span class="chart-metric-callout">${t(\'Target: 700K (2027P)\')}</span>'
);
chart = chart.replace(
  '<h3 class="card-title">International Student Trajectory</h3>',
  '<h3 class="card-title">${t(\'International Student Enrollment Trajectory\')}</h3>'
);
chart = chart.replace(
  '<p class="card-sub">2018–2027 Projected Enrollment (Degree Seeking vs Language & Exchange)</p>',
  '<p class="card-sub">${t(\'Actual & Projected International Student Inflow (2018–2027)\')}</p>'
);
chart = chart.replace(
  '<span>Degree Seeking (Bachelor/Master/PhD)</span>',
  '<span>${t(\'Degree Seeking (Bachelor/Master/PhD)\')}</span>'
);
chart = chart.replace(
  '<span>Language & Exchange</span>',
  '<span>${t(\'Language & Non-Degree Exchange\')}</span>'
);
chart = chart.replace(
  '<span>2027 Target Intake</span>',
  '<span>${t(\'Projected 2027 Target\')}</span>'
);

fs.writeFileSync('src/components/charts/studentGrowthChart.js', chart);
