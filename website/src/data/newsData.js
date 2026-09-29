/**
 * src/data/newsData.js
 * China Higher Education, Economy & International Student Intelligence News
 */
import { t } from '../i18n.js';

export const INITIAL_NEWS = [
  {
    id: 'news-1',
    date: '2026-09-28',
    category: 'Higher Education',
    categoryZh: '高等教育',
    title: 'China Expands Silk Road & Belt and Road Scholarships for 2027 International Intakes',
    titleZh: '中国扩大2027年“一带一路”国际奖学金规模',
    summary: 'The Ministry of Education announced an expanded allocation of CSC full scholarships focusing on STEM, Artificial Intelligence, and Renewable Energy for incoming degree students in 2027.',
    source: 'Ministry of Education PRC',
    tag: 'Scholarships & Visas',
    readTime: '3 min read',
    url: 'http://en.moe.gov.cn/'
  },
  {
    id: 'news-2',
    date: '2026-09-25',
    category: 'Economy & Tech',
    categoryZh: '经济与科技',
    title: 'China Outlines 15th Five-Year Higher Education & Quantum Tech Strategic Roadmap',
    titleZh: '中国发布第十五个五年高等教育与量子科技战略路线图',
    summary: 'National scientific research funding in C9 League universities is set to rise by 12% annually, prioritizing joint international laboratories and foreign researcher partnerships.',
    source: 'Xinhua News Agency',
    tag: 'Economy & Research',
    readTime: '4 min read',
    url: 'http://www.xinhuanet.com/english/'
  },
  {
    id: 'news-3',
    date: '2026-09-21',
    category: 'Student Life & Visa',
    categoryZh: '留学与签证',
    title: 'Streamlined X1 Student Visa Application & Digital JW202 Procedures Announced for 2027',
    titleZh: '2027年X1学生签证与电子版JW202表全面推行数字化流程',
    summary: 'Consulates will deploy an accelerated digital pre-clearance portal for admitted international master and doctoral degree candidates starting in early 2027.',
    source: 'National Immigration Administration',
    tag: 'Visa & Immigration',
    readTime: '2 min read',
    url: 'https://en.nia.gov.cn/'
  },
  {
    id: 'news-4',
    date: '2026-09-15',
    category: 'University Rankings',
    categoryZh: '大学排名',
    title: 'Top Chinese Universities Strengthen Positions in Global QS & THE Subject Rankings',
    titleZh: '中国顶尖高校在最新全球大学学科排名中表现亮眼',
    summary: 'Tsinghua and Peking University continue their ascent in global computer science and engineering rankings, accompanied by significant expansions in bilingual graduate curricula.',
    source: 'Global Academic Review',
    tag: 'Rankings & C9',
    readTime: '3 min read',
    url: 'https://www.topuniversities.com/'
  }
];

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

export const newsData = translateData(INITIAL_NEWS);
export default newsData;
