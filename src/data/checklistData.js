/**
 * src/data/checklistData.js
 * 8 Critical Admission & Scholarship Documents for Chinese Universities (Intake 2027)
 * Authoritative Sources: PRC Ministry of Education International Student Admission Regulations,
 * China Scholarship Council (CSC) Standard Dossier Guidelines, Interface Contract 3.
 */

const CHECKLIST_ITEMS_raw = [
  {
    id: 'doc_passport',
    title: 'Valid International Passport',
    titleZh: '有效普通护照',
    category: 'Identity & Legal',
    categoryZh: '身份与法律',
    description: 'Ordinary passport with validity extending at least 6 months beyond the intended date of departure from China (minimum validity through March 2028). Scans must clearly display biographical info, signature, and visa pages.',
    defaultCompleted: true,
    requiredFor: 'All Applicants (University Admission & X1 Student Visa)',
    notes: 'Color scan in high resolution (PDF/JPEG < 3MB). If passport expires before March 2028, renew immediately before submitting visa applications.',
    icon: 'passport',
    deadline: '2026-12-31',
    agency: 'National Passport Authority / Embassy'
  },
  {
    id: 'doc_transcripts',
    title: 'Notarized Highest Diploma & Transcripts',
    titleZh: '最高学历证明及成绩单公证书',
    category: 'Academic Records',
    categoryZh: '学历与成绩',
    description: 'Original or officially notarized highest degree diploma certificate and complete official academic transcripts with cumulative GPA. Documents in languages other than Chinese or English must include official certified notarized translations.',
    defaultCompleted: true,
    requiredFor: 'All Degree Applicants (Bachelor, Master, Ph.D.) & CSC Scholarships',
    notes: 'Graduating students submit provisional pre-graduation certificate issued by current university. Cumulative GPA >= 3.0/4.0 recommended for C9 and Project 985 institutions.',
    icon: 'academic',
    deadline: '2027-01-15',
    agency: 'University Registrar / Official Notary Public'
  },
  {
    id: 'doc_language',
    title: 'Language Proficiency Certificates (HSK / IELTS)',
    titleZh: '语言水平证明（HSK/雅思/托福）',
    category: 'Language Qualifications',
    categoryZh: '语言能力',
    description: 'Official test score report verifying language proficiency: HSK Level 4 (score >= 210) or Level 5 (score >= 180) for Chinese-taught majors; IELTS (score >= 6.5) or TOEFL iBT (score >= 90) for English-taught degree tracks.',
    defaultCompleted: false,
    requiredFor: 'Mandatory for all degree admissions and scholarship evaluations',
    notes: 'Score reports are strictly valid for 2 years from examination date. Register for HSK 4/5 exams prior to April 2027 to ensure official score report delivery.',
    icon: 'certificate',
    deadline: '2027-03-31',
    agency: 'Hanban / CTI (HSK) or British Council / ETS'
  },
  {
    id: 'doc_recommendations',
    title: 'Two Letters of Recommendation',
    titleZh: '两封专家推荐信',
    category: 'Academic References',
    categoryZh: '专家推荐',
    description: 'Two formal letters of recommendation written in English or Chinese from full professors or associate professors in the applicant\'s academic field. Letters must evaluate academic potential, research capabilities, and character.',
    defaultCompleted: false,
    requiredFor: 'Postgraduate Degree Applicants (Master & Ph.D.) and CSC Type A/B',
    notes: 'Must be printed on official institutional letterhead, dated within 6 months prior to application submission, and contain referee\'s title, phone, email, and handwritten signature.',
    icon: 'letter',
    deadline: '2027-02-28',
    agency: 'Academic Referees / University Department'
  },
  {
    id: 'doc_study_plan',
    title: 'Personal Statement & Research Study Plan',
    titleZh: '个人陈述与来华学习研究计划',
    category: 'Application Statement',
    categoryZh: '学习计划',
    description: 'In-depth proposal outlining educational background, prospective supervisor alignment, academic research objectives in China, and post-graduation career path. Minimum 800 words for Bachelor/Master, 1,500 words for Ph.D. candidates.',
    defaultCompleted: false,
    requiredFor: 'All International Degree Admissions & CSC Scholarship Applicants',
    notes: 'Must be written in Chinese for Chinese-taught programs or English for English-taught programs. Highly weighted criterion for CSC selection committees.',
    icon: 'document',
    deadline: '2027-02-15',
    agency: 'Applicant Self-Prepared'
  },
  {
    id: 'doc_physical_exam',
    title: 'Foreigner Physical Examination Form',
    titleZh: '外国人体格检查表',
    category: 'Health & Medical',
    categoryZh: '体检证明',
    description: 'Standard Foreigner Physical Examination Form completed in English or Chinese, including electrocardiogram (ECG), chest X-ray, blood serology (HIV, Syphilis, Hepatitis B), signed by examining physician and stamped with hospital official seal over photograph.',
    defaultCompleted: false,
    requiredFor: 'X1 Long-term Student Visa (>180 days) & CSC Scholarship Acceptance',
    notes: 'Exam results are valid for strictly 6 months. To ensure validity covers September 2027 university registration, schedule medical exam between March and May 2027.',
    icon: 'medical',
    deadline: '2027-05-15',
    agency: 'Designated Quarantine / Public Hospital'
  },
  {
    id: 'doc_police_clearance',
    title: 'Certificate of Non-Criminal Record',
    titleZh: '无犯罪记录证明',
    category: 'Legal Clearance',
    categoryZh: '无犯罪记录',
    description: 'Official police clearance certificate or judicial background check issued by the applicant\'s local municipal, state, or federal police authority, verifying zero criminal record within the jurisdiction of residence.',
    defaultCompleted: false,
    requiredFor: 'University Admission Dossier & PRC Ministry of Foreign Affairs Visa',
    notes: 'Must be issued within 6 months of application date. Documents must be certified, apostilled, or legalized by the PRC embassy/consulate in the issuing nation.',
    icon: 'shield',
    deadline: '2027-04-30',
    agency: 'Local Police Department / Ministry of Justice'
  },
  {
    id: 'doc_financial',
    title: 'Financial Guarantee / Bank Proof',
    titleZh: '经济担保证明 / 银行存款证明',
    category: 'Financial Support',
    categoryZh: '资金证明',
    description: 'Official bank deposit certificate or notarized financial sponsor declaration verifying liquid funds (minimum equivalent to RMB 25,000–50,000 / USD 3,500–7,000) sufficient to cover first-year tuition and living expenses in China.',
    defaultCompleted: false,
    requiredFor: 'Self-Funded Applicants & Partial Scholarship Recipients',
    notes: 'Account deposit should be frozen for 3–6 months during the admission review window. Full CSC Type A/B scholarship winners may submit scholarship award letter in lieu.',
    icon: 'bank',
    deadline: '2027-03-15',
    agency: 'Commercial Bank / Financial Sponsor'
  }
];


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

export const CHECKLIST_ITEMS = translateData(CHECKLIST_ITEMS_raw);

export const checklistData = CHECKLIST_ITEMS;

export default CHECKLIST_ITEMS;
