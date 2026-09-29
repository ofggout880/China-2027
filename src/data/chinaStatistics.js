/**
 * website/src/data/chinaStatistics.js
 * Authoritative Data Model for Modern China Macroeconomic & Educational Statistics
 * Milestone: M2 (Modern China Data Dashboard & Countdown Timer)
 * References: ORIGINAL_REQUEST.md (R2), PROJECT.md (Feature 4, 5, 6), dataSchemas.test.mjs
 */

/**
 * 6 Key Macroeconomic & Higher Education Metric Cards
 * Attributes: id, label, labelZh, value, numericValue, valueUnit, growth, growthTrend, badge, category, icon, description
 */
const macroStats_raw = [
  {
    id: 'gdp',
    label: 'Gross Domestic Product (GDP)',
    labelZh: '国内生产总值',
    value: '$18.56 Trillion',
    numericValue: 18.56,
    valueUnit: 'Trillion USD',
    growth: '+5.0% YoY',
    growthTrend: 'up',
    badge: 'World #2 Economy',
    category: 'Economic Pillar',
    icon: 'chart-bar',
    description: "World's second-largest economy driving unprecedented research investment, high-tech employment, and international scholarship budgets."
  },
  {
    id: 'rd',
    label: 'R&D Expenditure',
    labelZh: '研发投入强度',
    value: '2.64% of GDP',
    numericValue: 2.64,
    valueUnit: '% of GDP',
    growth: '>$450B Annual',
    growthTrend: 'up',
    badge: 'Innovation Powerhouse',
    category: 'Science & Tech',
    icon: 'microchip',
    description: 'Surpassing 3.3 trillion RMB ($450B+) in annual research expenditure, powering world-class university laboratories in AI, quantum computing, and green energy.'
  },
  {
    id: 'patents',
    label: 'WIPO International Patents',
    labelZh: 'PCT国际专利申请量',
    value: '70,015 Filings/yr',
    numericValue: 70015,
    valueUnit: 'Filings / year',
    growth: '#1 Global Ranking',
    growthTrend: 'up',
    badge: 'PCT Global Leader',
    category: 'Intellectual Property',
    icon: 'shield-check',
    description: 'Ranked #1 globally in Patent Cooperation Treaty (PCT) applications for 5 consecutive years, creating thriving commercialization ecosystems around top campuses.'
  },
  {
    id: 'hsr',
    label: 'High-Speed Rail Network',
    labelZh: '高速铁路运营里程',
    value: '45,000+ km',
    numericValue: 45000,
    valueUnit: 'km operational',
    growth: '>70% of Global Total',
    growthTrend: 'up',
    badge: '350 km/h Operational',
    category: 'Infrastructure',
    icon: 'train',
    description: "Over 70% of the entire world's high-speed rail network, seamlessly connecting student life across Beijing, Shanghai, Hangzhou, and the Greater Bay Area in hours."
  },
  {
    id: 'intl_students',
    label: 'International Student Population',
    labelZh: '来华留学生规模',
    value: '492,000+',
    numericValue: 492000,
    valueUnit: 'Students',
    growth: 'From 196 Nations',
    growthTrend: 'up',
    badge: 'Top Asian Destination',
    category: 'Global Community',
    icon: 'globe',
    description: 'The primary study-abroad destination in Asia with over 492k international students from 196 countries, backed by generous CSC and university scholarships.'
  },
  {
    id: 'rankings',
    label: 'Global Top-Tier Universities',
    labelZh: '世界一流大学群',
    value: '2 in World Top 15',
    numericValue: 2,
    valueUnit: 'Universities',
    growth: 'Tsinghua #14 · Peking #12',
    growthTrend: 'up',
    badge: 'C9 League Elite',
    category: 'Higher Education',
    icon: 'academic-cap',
    description: "Tsinghua University (QS #14) and Peking University (QS #12) lead China's Double First-Class university initiative, with 5 institutions in the global top 50."
  }
];

/**
 * Visual Analytics Chart Datasets (Stacked Bar & Donut Charts)
 * Meets all criteria in dataSchemas.test.mjs:
 * - studentEnrollmentTrend.data (Array)
 * - disciplineDistribution.data (Array)
 */
const charts_raw = {
  studentEnrollmentTrend: {
    id: 'chart_intl_students',
    title: 'International Student Enrollment Trajectory (2018–2027 Projected)',
    type: 'stacked-bar',
    xAxisLabel: 'Academic Year',
    yAxisLabel: 'Students (in Thousands)',
    series: [
      { name: 'Degree Seeking (Bachelor/Master/PhD)', color: '#DE2910' },
      { name: 'Language & Non-Degree Exchange', color: '#FFDE00' }
    ],
    data: [
      { year: '2018', degree: 258, exchange: 234, total: 492, isProjected: false },
      { year: '2020', degree: 240, exchange: 150, total: 390, isProjected: false },
      { year: '2022', degree: 265, exchange: 175, total: 440, isProjected: false },
      { year: '2024', degree: 310, exchange: 210, total: 520, isProjected: false },
      { year: '2026', degree: 360, exchange: 250, total: 610, isProjected: false },
      { year: '2027P', degree: 415, exchange: 285, total: 700, isProjected: true }
    ]
  },
  disciplineDistribution: {
    id: 'chart_disciplines',
    title: 'International Students by Academic Discipline',
    type: 'donut',
    totalLabel: 'Top Fields',
    data: [
      { id: 'stem', name: 'STEM & Artificial Intelligence', nameZh: '理工与人工智能', value: 42, percent: 42, count: '206,640', color: '#FF2A4A', gradientId: 'grad-stem' },
      { id: 'lang', name: 'Chinese Language & Culture', nameZh: '汉语言文学与文化', value: 24, percent: 24, count: '118,080', color: '#DE2910', gradientId: 'grad-lang' },
      { id: 'econ', name: 'Economics & Global Trade', nameZh: '经济学与国际商贸', value: 18, percent: 18, count: '88,560', color: '#FFDE00', gradientId: 'grad-econ' },
      { id: 'med', name: 'Clinical Medicine & Health', nameZh: '临床医学与公共卫生', value: 16, percent: 16, count: '78,720', color: '#4A90E2', gradientId: 'grad-med' }
    ]
  }
};

/**
 * Primary Unified Export
 */
const chinaStatistics_raw = {
  macroStats: macroStats_raw,
  charts: charts_raw
};




import { t } from '../i18n.js';

function translateData(data) {
  if (Array.isArray(data)) {
    return data.map(translateData);
  } else if (typeof data === 'object' && data !== null) {
    return new Proxy(data, {
      get(target, prop) {
        const val = target[prop];
        if (typeof val === 'string') return t(val);
        if (Array.isArray(val)) return val.map(v => typeof v === 'string' ? t(v) : v);
        return val;
      }
    });
  }
  return typeof data === 'string' ? t(data) : data;
}

export const macroStats = translateData(macroStats_raw);

export const charts = translateData(charts_raw);
export const chinaStatistics = translateData(chinaStatistics_raw);
export const CHINA_STATS = chinaStatistics;
export default chinaStatistics;