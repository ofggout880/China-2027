import fs from 'fs';

const dict = {
  "Academic Landscape": "Paysage Académique",
  "Top Discipline: STEM (42%)": "Filière N°1 : STIM (42%)",
  "Discipline Distribution": "Répartition des Disciplines",
  "International Student Enrollment by Primary Field of Academic Study": "Effectifs d'étudiants internationaux par domaine d'études principal",
  "Total Enrolled": "Total Inscrits",
  "Lead Priority: Engineering & Applied AI": "Priorité : Ingénierie & IA Appliquée",
  "CSC Scholarship Favorability": "Forte Éligibilité aux Bourses CSC",
  "International Student Enrollment Trajectory": "Trajectoire des Étudiants Internationaux",
  "Growth Trajectory": "Trajectoire de Croissance",
  "Target: 700K (2027P)": "Cible : 700K (2027P)",
  "Actual & Projected International Student Inflow (2018–2027)": "Flux réels et projetés d'étudiants internationaux (2018–2027)",
  "Degree Seeking (Bachelor/Master/PhD)": "Cursus Diplômants (Licence/Master/Doctorat)",
  "Language & Non-Degree Exchange": "Séjours Linguistiques & Échanges",
  "Projected 2027 Target": "Cible Projetée 2027",
  "Historical Baseline (2018)": "Référence Historique (2018)",
  "Projected Intake": "Rentrée Projetée",
  "Degree Programs": "Programmes Diplômants",
  "Non-Degree / Lang": "Non-Diplômant / Langue",
  "Total Inflow": "Flux Total"
};

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
const dictStr = JSON.stringify(dict, null, 2).slice(1, -1);
i18n = i18n.replace('export const dictionary = {', 'export const dictionary = {' + dictStr + ',');
fs.writeFileSync('src/i18n.js', i18n);

// Now update disciplineDonutChart.js to use t() on header and footer
let donut = fs.readFileSync('src/components/charts/disciplineDonutChart.js', 'utf-8');
donut = donut.replace(
  '<span class="card-badge"><span class="badge-dot"></span> Academic Landscape</span>',
  '<span class="card-badge"><span class="badge-dot"></span> ${t(\'Academic Landscape\')}</span>'
);
donut = donut.replace(
  '<span class="chart-metric-callout">Top Discipline: STEM (42%)</span>',
  '<span class="chart-metric-callout">${t(\'Top Discipline: STEM (42%)\')}</span>'
);
donut = donut.replace(
  '<h3 class="card-title">Discipline Distribution</h3>',
  '<h3 class="card-title">${t(\'Discipline Distribution\')}</h3>'
);
donut = donut.replace(
  '<p class="card-sub">International Student Enrollment by Primary Field of Academic Study</p>',
  '<p class="card-sub">${t(\'International Student Enrollment by Primary Field of Academic Study\')}</p>'
);
donut = donut.replace(
  '<text id="donut-center-label" class="donut-center-label" x="200" y="215" text-anchor="middle" fill="#9CA3AF" font-size="11" font-weight="600" font-family="var(--font-sans, sans-serif)">Total Enrolled</text>',
  '<text id="donut-center-label" class="donut-center-label" x="200" y="215" text-anchor="middle" fill="#9CA3AF" font-size="11" font-weight="600" font-family="var(--font-sans, sans-serif)">${t(\'Total Enrolled\')}</text>'
);
donut = donut.replace(
  '<span>Lead Priority: Engineering & Applied AI</span>',
  '<span>${t(\'Lead Priority: Engineering & Applied AI\')}</span>'
);
donut = donut.replace(
  '<span>CSC Scholarship Favorability</span>',
  '<span>${t(\'CSC Scholarship Favorability\')}</span>'
);

fs.writeFileSync('src/components/charts/disciplineDonutChart.js', donut);
