/**
 * website/src/data/hskMilestones.js
 * Authoritative Chinese Language Learning Roadmap & HSK Milestone Dataset
 * Milestone: M3 (Roadmap Tools: Chinese Language Learning Timeline & HSK Tracker)
 * References:
 *   - ORIGINAL_REQUEST.md (R3: Language Learning Timeline prior to Sept 2027)
 *   - PROJECT.md (Interface Contract 4: HSKMilestone)
 *   - tests/unit/dataSchemas.test.mjs (HSK Language Timeline Schema Integrity)
 *   - tests/e2e/live-functional.spec.js (Test 07: Timeline HSK 1-6)
 *   - tests/e2e/run-all.mjs (Assertion 7)
 */

const hskMilestones_raw = [
  {
    id: 'hsk1',
    level: 'HSK 1',
    levelShort: 'L1',
    title: 'Beginner Phonetics & Daily Essentials',
    titleZh: '初级入门与日常基础',
    targetDate: 'November 2026',
    targetDateIso: '2026-11-30',
    vocabCount: 150,
    characterCount: 174,
    competency: 'Can understand and use simple Chinese phrases, make basic self-introductions, and express basic everyday personal needs.',
    competencyZh: '掌握最基本的日常词汇与拼音发音，能进行简单的自我介绍并应对基础问候。',
    studyHours: '40–60 hours',
    cefrEquivalent: 'CEFR A1',
    status: 'completed',
    statusLabel: 'Completed',
    statusLabelZh: '已达成',
    isAdmissionThreshold: false,
    admissionNote: 'Foundation level for phonetics and character stroke recognition.',
    recommendedResources: [
      'HSK 1 Standard Course Textbook & Workbook (BLCUP)',
      'HelloChinese Interactive Mobile App',
      'Pleco Chinese Dictionary & Flashcard System'
    ],
    sampleWords: [
      {
        hanzi: '你好',
        pinyin: 'nǐ hǎo',
        translation: 'Hello / Greetings',
        exampleZh: '你好，很高兴认识你！',
        exampleEn: 'Hello, very nice to meet you!',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '谢谢',
        pinyin: 'xièxie',
        translation: 'Thank you',
        exampleZh: '谢谢你的热情帮助。',
        exampleEn: 'Thank you for your warm help.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '中国',
        pinyin: 'Zhōngguó',
        translation: 'China',
        exampleZh: '我想在2027年去中国留学。',
        exampleEn: 'I want to study abroad in China in 2027.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '学习',
        pinyin: 'xuéxí',
        translation: 'To study / To learn',
        exampleZh: '我们每天一起学习汉语。',
        exampleEn: 'We study Chinese together every day.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '朋友',
        pinyin: 'péngyou',
        translation: 'Friend',
        exampleZh: '他在北京结识了很多中国朋友。',
        exampleEn: 'He made many Chinese friends in Beijing.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      }
    ]
  },
  {
    id: 'hsk2',
    level: 'HSK 2',
    levelShort: 'L2',
    title: 'Elementary Conversational Chinese',
    titleZh: '基础会话与生活交流',
    targetDate: 'January 2027',
    targetDateIso: '2027-01-31',
    vocabCount: 300,
    characterCount: 347,
    competency: 'Can conduct simple and direct communication on everyday topics such as shopping, transportation, lodging, and dining.',
    competencyZh: '能就日常熟悉的场景（购物、交通出行、问路、餐馆点餐）进行直接明了的交流。',
    studyHours: '80–100 hours',
    cefrEquivalent: 'CEFR A2',
    status: 'in-progress',
    statusLabel: 'In Progress',
    statusLabelZh: '进行中',
    isAdmissionThreshold: false,
    admissionNote: 'Sufficient for independent tourist travel and survival navigation across China.',
    recommendedResources: [
      'HSK 2 Standard Course (Volumes 1 & 2)',
      'Chineasy Daily Character Memory Method',
      'Skritter Character Stroke Order Trainer'
    ],
    sampleWords: [
      {
        hanzi: '准备',
        pinyin: 'zhǔnbèi',
        translation: 'To prepare / Ready',
        exampleZh: '我已经准备好申请材料了。',
        exampleEn: 'I have already prepared my application materials.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '机场',
        pinyin: 'jīchǎng',
        translation: 'Airport',
        exampleZh: '北京首都国际机场非常宏伟。',
        exampleEn: 'Beijing Capital International Airport is very magnificent.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '便宜',
        pinyin: 'piányi',
        translation: 'Inexpensive / Cheap',
        exampleZh: '大学食堂的饭菜既美味又便宜。',
        exampleEn: 'The food in university cafeterias is both delicious and cheap.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '欢迎',
        pinyin: 'huānyíng',
        translation: 'Welcome',
        exampleZh: '热烈欢迎世界各地的留学生。',
        exampleEn: 'Warmly welcome international students from all over the world.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '希望',
        pinyin: 'xīwàng',
        translation: 'To hope / Wish',
        exampleZh: '我希望顺利被清华大学录取。',
        exampleEn: 'I hope to be smoothly admitted into Tsinghua University.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      }
    ]
  },
  {
    id: 'hsk3',
    level: 'HSK 3',
    levelShort: 'L3',
    title: 'Intermediate Daily Communication',
    titleZh: '中级日常与实用表达',
    targetDate: 'March 2027',
    targetDateIso: '2027-03-31',
    vocabCount: 600,
    characterCount: 617,
    competency: 'Can complete basic communicative tasks in daily life, study, and travel; can navigate most situations encountered when traveling across China.',
    competencyZh: '能完成生活、学习中的基本交际任务，赴华旅游留学时能自如应对绝大多数交流情境。',
    studyHours: '120–150 hours',
    cefrEquivalent: 'CEFR B1',
    status: 'upcoming',
    statusLabel: 'Upcoming',
    statusLabelZh: '待开始',
    isAdmissionThreshold: false,
    admissionNote: 'Threshold for non-degree short-term language immersion semester programs.',
    recommendedResources: [
      'HSK 3 Standard Course Textbook & Workbook',
      'Du Chinese Graded Chinese Reading Stories',
      'SuperChinese AI Powered Grammar Coach'
    ],
    sampleWords: [
      {
        hanzi: '大学',
        pinyin: 'dàxué',
        translation: 'University / College',
        exampleZh: '中国的高水平大学拥有雄厚科研实力。',
        exampleEn: 'Top Chinese universities possess immense research capabilities.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '护照',
        pinyin: 'hùzhào',
        translation: 'Passport',
        exampleZh: '请确保护照有效期超过六个月。',
        exampleEn: 'Please ensure your passport is valid for more than six months.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '签证',
        pinyin: 'qiānzhèng',
        translation: 'Visa',
        exampleZh: '收到录取通知书后办理X1学习签证。',
        exampleEn: 'Apply for the X1 study visa after receiving the admission letter.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '提高',
        pinyin: 'tígāo',
        translation: 'To improve / Elevate',
        exampleZh: '多与语伴交流能有效提高听力水平。',
        exampleEn: 'Talking more with language partners effectively improves listening skills.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '环境',
        pinyin: 'huánjìng',
        translation: 'Environment / Surroundings',
        exampleZh: '大学校园环境宜人且数字化设施先进。',
        exampleEn: 'The university campus environment is pleasant with advanced digital facilities.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      }
    ]
  },
  {
    id: 'hsk4',
    level: 'HSK 4',
    levelShort: 'L4',
    title: 'Upper Intermediate & Academic Threshold',
    titleZh: '中高阶通用与大学入学标准',
    targetDate: 'May 2027',
    targetDateIso: '2027-05-31',
    vocabCount: 1200,
    characterCount: 1064,
    competency: 'Can converse fluently with native Chinese speakers on a wide range of topics. Fulfills the standard Chinese language requirement for CSC scholarship science and engineering degree programs.',
    competencyZh: '能就较广泛的话题与中文母语者流利自如交流，满足中国政府奖学金（CSC）理工科本科入学标准。',
    studyHours: '200–250 hours',
    cefrEquivalent: 'CEFR B2',
    status: 'upcoming',
    statusLabel: 'Upcoming',
    statusLabelZh: '待开始',
    isAdmissionThreshold: true,
    admissionNote: 'Official admission requirement for English-taught undergrads and CSC STEM scholarship applicants.',
    recommendedResources: [
      'HSK 4 Standard Course (Volumes 1 & 2)',
      'The Chairman\'s Bao Graded News Reader',
      'Bilibili Science & Campus Life Listening Vlogs'
    ],
    sampleWords: [
      {
        hanzi: '申请',
        pinyin: 'shēnqǐng',
        translation: 'To apply / Application',
        exampleZh: '我准备在春季提交CSC中国政府奖学金申请。',
        exampleEn: 'I plan to submit my CSC Chinese Government Scholarship application in spring.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '奖学金',
        pinyin: 'jiǎngxuéjīn',
        translation: 'Scholarship',
        exampleZh: '全额奖学金覆盖学费、住宿费及生活补贴。',
        exampleEn: 'Full scholarships cover tuition, accommodation, and living stipends.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '专业',
        pinyin: 'zhuānyè',
        translation: 'Academic Major / Specialty',
        exampleZh: '人工智能与计算机科学是全球热门专业。',
        exampleEn: 'Artificial intelligence and computer science are globally popular majors.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '录取',
        pinyin: 'lùqǔ',
        translation: 'To admit / Enrollment',
        exampleZh: '恭喜你获得浙江大学计算机学院的正式录取！',
        exampleEn: 'Congratulations on your official admission to Zhejiang University CS school!',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '积累',
        pinyin: 'jīlěi',
        translation: 'To accumulate',
        exampleZh: '持之以恒地积累核心学术词汇至关重要。',
        exampleEn: 'Consistently accumulating core academic vocabulary is essential.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      }
    ]
  },
  {
    id: 'hsk5',
    level: 'HSK 5',
    levelShort: 'L5',
    title: 'Advanced Academic & University Admissions',
    titleZh: '高级学术与中国大学专业入学',
    targetDate: 'July 2027',
    targetDateIso: '2027-07-31',
    vocabCount: 2500,
    characterCount: 1685,
    competency: 'Can read Chinese newspapers and academic journals, watch Chinese films without subtitles, and deliver formal speeches. Mandatory threshold for admission to Chinese-taught undergraduate and graduate degrees at premier C9 League universities.',
    competencyZh: '能阅读中文学术报刊、欣赏影视作品、用中文进行完整专业演讲，达到C9联盟顶尖名校中文授课项目录取线。',
    studyHours: '350–450 hours',
    cefrEquivalent: 'CEFR C1',
    status: 'upcoming',
    statusLabel: 'Upcoming',
    statusLabelZh: '待开始',
    isAdmissionThreshold: true,
    admissionNote: 'Mandatory standard qualification for all Chinese-taught bachelor and master degrees.',
    recommendedResources: [
      'HSK 5 Standard Course (Textbooks 1 & 2)',
      'Past Official HSK 5 Real Examination Papers',
      'Zhihu / People\'s Daily Academic & Technology Essays'
    ],
    sampleWords: [
      {
        hanzi: '学术',
        pinyin: 'xuéshù',
        translation: 'Academic / Scholarly',
        exampleZh: '中国高校积极鼓励留学生参与前沿学术会议。',
        exampleEn: 'Chinese universities actively encourage international students to participate in cutting-edge academic conferences.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '导师',
        pinyin: 'dǎoshī',
        translation: 'Academic Advisor / Supervisor',
        exampleZh: '与导师探讨毕业论文的开题报告与实验方案。',
        exampleEn: 'Discuss the dissertation proposal and experimental plan with the advisor.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '研究',
        pinyin: 'yánjiū',
        translation: 'Research / Investigate',
        exampleZh: '这所国家重点实验室专注于量子信息科学研究。',
        exampleEn: 'This state key laboratory specializes in quantum information science research.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '推荐信',
        pinyin: 'tuījiànxìn',
        translation: 'Recommendation Letter',
        exampleZh: '申请名校需要两位副教授以上的推荐信。',
        exampleEn: 'Applying to elite universities requires recommendation letters from two associate professors or above.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '综合',
        pinyin: 'zōnghé',
        translation: 'Comprehensive / Synthesis',
        exampleZh: '综合考量学术背景、语言成绩与科研潜力。',
        exampleEn: 'Comprehensively assess academic background, language scores, and research potential.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      }
    ]
  },
  {
    id: 'hsk6',
    level: 'HSK 6',
    levelShort: 'L6',
    title: 'Mastery & Academic Research Fluency',
    titleZh: '精通卓越与学术科研流利度',
    targetDate: 'September 2027',
    targetDateIso: '2027-09-01',
    vocabCount: 5000,
    characterCount: 2663,
    competency: 'Can effortlessly understand any written or spoken Chinese information, and express oneself effectively both orally and in formal academic papers and thesis defenses.',
    competencyZh: '能轻松理解任何中文书面或口头信息，自如进行高深度学术研讨、科技文献撰写与学位论文答辩。',
    studyHours: '600+ hours',
    cefrEquivalent: 'CEFR C2',
    status: 'upcoming',
    statusLabel: 'Upcoming',
    statusLabelZh: '待开始',
    isAdmissionThreshold: true,
    admissionNote: 'Highest certification level; demonstrates full bilingual research and professional capabilities.',
    recommendedResources: [
      'HSK 6 Standard Course & Lexicon Reference',
      'CNKI China National Knowledge Infrastructure Academic Database',
      'CCTV / Phoenix TV Academic & Scientific Documentaries'
    ],
    sampleWords: [
      {
        hanzi: '论文',
        pinyin: 'lùnwén',
        translation: 'Dissertation / Thesis / Paper',
        exampleZh: '留学生博士毕业需在核心期刊发表高水平学术论文。',
        exampleEn: 'International PhD candidates must publish high-level papers in core journals to graduate.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '答辩',
        pinyin: 'dábiàn',
        translation: 'Oral Defense (Thesis)',
        exampleZh: '顺利通过学位论文答辩并获得评委高度赞誉。',
        exampleEn: 'Smoothly passed the thesis oral defense and received high praise from the committee.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '前沿',
        pinyin: 'qiányán',
        translation: 'Frontier / Cutting-edge',
        exampleZh: '紧跟全球人工智能与新能源科技的最前沿发展。',
        exampleEn: 'Keep close track of the foremost frontiers in global AI and renewable energy tech.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '领域',
        pinyin: 'lǐngyù',
        translation: 'Academic Domain / Field',
        exampleZh: '在交叉学科领域取得突破性创新科研成果。',
        exampleEn: 'Achieved breakthrough innovative research outcomes in interdisciplinary fields.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      },
      {
        hanzi: '贡献',
        pinyin: 'gòngxiàn',
        translation: 'Contribution / Dedication',
        exampleZh: '为深化国际青年科技文化交流做出杰出贡献。',
        exampleEn: 'Made outstanding contributions to deepening international youth science and cultural exchanges.',
        toString() { return `${this.hanzi} (${this.pinyin}) - ${this.translation}`; }
      }
    ]
  }
];


/**
 * Calculates aggregate statistics for the HSK learning journey
 * @param {Array} milestones
 * @returns {Object}
 */
export function getHskSummary(milestones = hskMilestones) {
  const list = Array.isArray(milestones) ? milestones : hskMilestones;
  const total = list.length;
  const completed = list.filter((m) => m.status === 'completed').length;
  const inProgress = list.find((m) => m.status === 'in-progress') || null;
  const totalVocabTarget = list[total - 1]?.vocabCount || 5000;
  const totalCharactersTarget = list[total - 1]?.characterCount || 2663;

  // Current vocabulary reached (all completed plus half of in-progress)
  let currentVocab = 0;
  for (const m of list) {
    if (m.status === 'completed') {
      currentVocab = Math.max(currentVocab, m.vocabCount);
    } else if (m.status === 'in-progress') {
      const prev = list[list.indexOf(m) - 1]?.vocabCount || 0;
      currentVocab = prev + Math.round((m.vocabCount - prev) * 0.5);
      break;
    }
  }

  const progressPercent = totalVocabTarget > 0
    ? Math.min(100, Math.round((currentVocab / totalVocabTarget) * 100))
    : 0;

  return {
    totalMilestones: total,
    completedCount: completed,
    inProgressLevel: inProgress ? inProgress.level : 'None',
    inProgressId: inProgress ? inProgress.id : null,
    currentVocab,
    totalVocabTarget,
    totalCharactersTarget,
    progressPercent,
    targetDeadline: '2027-09-01'
  };
}

/**
 * Find milestone by ID (e.g. 'hsk1', 'hsk4')
 * @param {string} id
 * @returns {Object|null}
 */
export function getMilestoneById(id) {
  if (!id) return null;
  return hskMilestones.find((m) => m.id === String(id).toLowerCase()) || null;
}

/**
 * Filter milestones by status ('completed', 'in-progress', 'upcoming', 'all')
 * @param {string} status
 * @returns {Array}
 */
export function getMilestonesByStatus(status) {
  if (!status || status === 'all') return [...hskMilestones];
  return hskMilestones.filter((m) => m.status === status);
}


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

export const hskMilestones = translateData(hskMilestones_raw);

export const HSK_MILESTONES = hskMilestones;

export default hskMilestones;
