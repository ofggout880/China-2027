/**
 * website/src/data/universitiesData.js
 * 10 Premier Chinese Universities Directory Dataset
 * Milestone: M3 (Roadmap Tools: School Finder, Timeline, Checklist)
 * Authoritative References:
 * - ORIGINAL_REQUEST.md (R3: School Exploration/Finding Section)
 * - PROJECT.md (Interface Contract 2: University Directory Item Contract)
 * - tests/unit/searchFilter.test.mjs
 * - tests/unit/dataSchemas.test.mjs
 */

import { store } from "../store.js";

const rawData = [
  {
    id: 'tsinghua',
    name: 'Tsinghua University',
    nameZh: '清华大学',
    pinyin: 'Qīnghuá Dàxué',
    city: 'Beijing',
    province: 'Beijing Municipality',
    rankQs: 14,
    rankThe: 12,
    league: 'C9 League · Project 985',
    topPrograms: [
      'Computer Science & AI',
      'Civil Engineering',
      'Economics & Finance',
      'Global Affairs'
    ],
    languageReqs: {
      chineseTaught: 'HSK 5 (210+) or HSK 6 (180+)',
      englishTaught: 'IELTS 6.5+ / TOEFL 90+'
    },
    tuitionRMB: '30,000 - 45,000 / year',
    scholarships: [
      'Chinese Government Scholarship (CSC)',
      'Beijing Municipal Scholarship',
      'Schwarzman Scholars'
    ],
    campusFeatures: 'Historic imperial Qing garden grounds, world-leading AI labs, cutting-edge athletic facilities, Schwarzman College.',
    website: 'https://www.tsinghua.edu.cn/en'
  },
  {
    id: 'pku',
    name: 'Peking University',
    nameZh: '北京大学',
    pinyin: 'Běijīng Dàxué',
    city: 'Beijing',
    province: 'Beijing Municipality',
    rankQs: 12,
    rankThe: 14,
    league: 'C9 League · Project 985',
    topPrograms: [
      'International Relations',
      'Chinese Linguistics & Literature',
      'Biomedical Sciences',
      'Yenching Global Studies'
    ],
    languageReqs: {
      chineseTaught: 'HSK 6 (210+)',
      englishTaught: 'IELTS 7.0+ / TOEFL 100+'
    },
    tuitionRMB: '29,000 - 42,000 / year',
    scholarships: [
      'CSC Scholarship Type A & B',
      'Peking University Foreign Student Scholarship',
      'Yenching Academy Fellowship'
    ],
    campusFeatures: 'Famous Weiming Lake and Boya Pagoda, classical imperial architecture, national center for humanities & fundamental sciences.',
    website: 'https://english.pku.edu.cn'
  },
  {
    id: 'fudan',
    name: 'Fudan University',
    nameZh: '复旦大学',
    pinyin: 'Fùdàn Dàxué',
    city: 'Shanghai',
    province: 'Shanghai Municipality',
    rankQs: 39,
    rankThe: 44,
    league: 'C9 League · Project 985',
    topPrograms: [
      'International Business (IMBA)',
      'Clinical Medicine',
      'Journalism',
      'Micro-electronics'
    ],
    languageReqs: {
      chineseTaught: 'HSK 5 (210+)',
      englishTaught: 'IELTS 6.5+ / TOEFL 90+'
    },
    tuitionRMB: '26,000 - 48,000 / year',
    scholarships: [
      'CSC Scholarship',
      'Shanghai Government Scholarship (SGS)',
      'Fudan University President Scholarship'
    ],
    campusFeatures: 'Handan historic twin towers campus, premier financial hub connectivity in Shanghai, top teaching hospitals.',
    website: 'https://www.fudan.edu.cn/en'
  },
  {
    id: 'sjtu',
    name: 'Shanghai Jiao Tong University',
    nameZh: '上海交通大学',
    pinyin: 'Shànghǎi Jiāotōng Dàxué',
    city: 'Shanghai',
    province: 'Shanghai Municipality',
    rankQs: 45,
    rankThe: 52,
    league: 'C9 League · Project 985',
    topPrograms: [
      'Mechanical & Naval Engineering',
      'Robotics & Automation',
      'Economics & Management',
      'Biomedical Engineering'
    ],
    languageReqs: {
      chineseTaught: 'HSK 5 (200+)',
      englishTaught: 'IELTS 6.5+ / TOEFL 90+'
    },
    tuitionRMB: '28,900 - 45,000 / year',
    scholarships: [
      'CSC High-Level Postgrad',
      'Shanghai Municipal Government Scholarship',
      'SJTU Antai Business Scholarship'
    ],
    campusFeatures: 'Sprawling Minhang high-tech campus, UM-SJTU Joint Institute, state key laboratories for robotics and ocean engineering.',
    website: 'https://en.sjtu.edu.cn'
  },
  {
    id: 'zju',
    name: 'Zhejiang University',
    nameZh: '浙江大学',
    pinyin: 'Zhèjiāng Dàxué',
    city: 'Hangzhou',
    province: 'Zhejiang Province',
    rankQs: 44,
    rankThe: 55,
    league: 'C9 League · Project 985',
    topPrograms: [
      'Computer Science & Big Data',
      'Agricultural Science',
      'Chemical Engineering',
      'Control Science'
    ],
    languageReqs: {
      chineseTaught: 'HSK 5 (180+)',
      englishTaught: 'IELTS 6.5+ / TOEFL 90+'
    },
    tuitionRMB: '24,800 - 39,800 / year',
    scholarships: [
      'Chinese Government Scholarship',
      'Zhejiang Provincial Government Scholarship',
      'ZJU Outstanding Student Award'
    ],
    campusFeatures: 'Zijingang modern hyper-campus, deep innovation ecosystem linked to Alibaba and Hangzhou tech hub.',
    website: 'https://www.zju.edu.cn/english'
  },
  {
    id: 'ustc',
    name: 'University of Science and Technology of China',
    nameZh: '中国科学技术大学',
    pinyin: 'Zhōngguó Kēxué Jìshù Dàxué',
    city: 'Hefei',
    province: 'Anhui Province',
    rankQs: 137,
    rankThe: 57,
    league: 'C9 League · Project 985',
    topPrograms: [
      'Quantum Physics',
      'Nanotechnology',
      'Mathematics',
      'Computer Science'
    ],
    languageReqs: {
      chineseTaught: 'HSK 4 (210+) or HSK 5',
      englishTaught: 'IELTS 6.5+ / TOEFL 85+'
    },
    tuitionRMB: '26,000 - 35,000 / year',
    scholarships: [
      'CAS - TWAS Fellowship',
      'CSC Scholarship',
      'USTC International Student Fellowship'
    ],
    campusFeatures: 'National Synchrotron Radiation Laboratory, Hefei National Laboratory for Quantum Information Sciences, elite science focus.',
    website: 'https://en.ustc.edu.cn'
  },
  {
    id: 'nju',
    name: 'Nanjing University',
    nameZh: '南京大学',
    pinyin: 'Nánjīng Dàxué',
    city: 'Nanjing',
    province: 'Jiangsu Province',
    rankQs: 145,
    rankThe: 73,
    league: 'C9 League · Project 985',
    topPrograms: [
      'Astronomy & Astrophysics',
      'Environmental Science',
      'Chinese History & Culture',
      'Geology'
    ],
    languageReqs: {
      chineseTaught: 'HSK 5 (210+)',
      englishTaught: 'IELTS 6.5+ / TOEFL 90+'
    },
    tuitionRMB: '23,000 - 38,000 / year',
    scholarships: [
      'CSC Scholarship',
      'Jiangsu Jasmine Scholarship',
      'Nanjing University International Student Scholarship'
    ],
    campusFeatures: 'Xianlin modern lakeside campus & Gulou historic campus with Hopkins-Nanjing Center for Chinese and American Studies.',
    website: 'https://www.nju.edu.cn/en'
  },
  {
    id: 'hit',
    name: 'Harbin Institute of Technology',
    nameZh: '哈尔滨工业大学',
    pinyin: "Hā'ěrbīn Gōngyè Dàxué",
    city: 'Harbin',
    province: 'Heilongjiang Province',
    rankQs: 252,
    rankThe: 168,
    league: 'C9 League · Project 985',
    topPrograms: [
      'Aerospace & Astronautics',
      'Robotics & Mechanics',
      'Civil Engineering',
      'Computer Science'
    ],
    languageReqs: {
      chineseTaught: 'HSK 4 (180+) or HSK 5',
      englishTaught: 'IELTS 6.0+ / TOEFL 80+'
    },
    tuitionRMB: '22,000 - 34,000 / year',
    scholarships: [
      'CSC Scholarship',
      'HIT Distinguished International Scholarship',
      'Heilongjiang Provincial Scholarship'
    ],
    campusFeatures: 'China Aerospace Science & Technology powerhouse, robotics innovation center, winter sports hub and Russian cultural architecture.',
    website: 'http://en.hit.edu.cn'
  },
  {
    id: 'blcu',
    name: 'Beijing Language and Culture University',
    nameZh: '北京语言大学',
    pinyin: 'Běijīng Yǔyán Dàxué',
    city: 'Beijing',
    province: 'Beijing Municipality',
    rankQs: 600,
    rankThe: 800,
    league: 'Mini-United Nations · Double First-Class',
    topPrograms: [
      'Teaching Chinese as a Second Language',
      'Simultaneous Interpretation',
      'International Chinese Education',
      'Sinology'
    ],
    languageReqs: {
      chineseTaught: 'HSK 4 to HSK 6 (program dependent)',
      englishTaught: 'IELTS 6.0+ / TOEFL 80+'
    },
    tuitionRMB: '23,200 - 32,000 / year',
    scholarships: [
      'Confucius Scholarship (CIS)',
      'CSC Scholarship',
      'Beijing Municipal Government Award'
    ],
    campusFeatures: 'Global international student community representing >140 countries, official HSK testing headquarters, premier Chinese language immersion.',
    website: 'https://english.blcu.edu.cn'
  },
  {
    id: 'sysu',
    name: 'Sun Yat-sen University',
    nameZh: '中山大学',
    pinyin: 'Zhōngshān Dàxué',
    city: 'Guangzhou',
    province: 'Guangdong Province',
    rankQs: 268,
    rankThe: 150,
    league: 'Project 985 · Double First-Class',
    topPrograms: [
      'Clinical Medicine & Oncology',
      'Business Administration',
      'Marine Sciences',
      'Computer Science'
    ],
    languageReqs: {
      chineseTaught: 'HSK 5 (210+)',
      englishTaught: 'IELTS 6.5+ / TOEFL 90+'
    },
    tuitionRMB: '25,000 - 45,000 / year',
    scholarships: [
      'CSC Scholarship',
      'Guangdong Provincial Government Award',
      'SYSU President International Fellowship'
    ],
    campusFeatures: 'Greater Bay Area presence spanning 5 campuses across Guangzhou, Zhuhai, and Shenzhen, top medical teaching hospital network.',
    website: 'https://www.sysu.edu.cn/sysuen'
  }
];

// Universal named & default exports for maximum interoperability
export const UNIVERSITIES = universitiesData;
export default universitiesData;
