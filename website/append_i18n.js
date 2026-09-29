import fs from 'fs';

const dict = {
  // Universities
  "Tsinghua University": "Université Tsinghua",
  "Peking University": "Université de Pékin",
  "Fudan University": "Université Fudan",
  "Shanghai Jiao Tong University": "Université Jiao Tong de Shanghai",
  "Zhejiang University": "Université du Zhejiang",
  "University of Science and Technology of China": "Université des Sciences et Technologies de Chine",
  "Nanjing University": "Université de Nanjing",
  "Beijing": "Pékin",
  "Beijing Municipality": "Municipalité de Pékin",
  "Shanghai": "Shanghai",
  "Shanghai Municipality": "Municipalité de Shanghai",
  "Hangzhou": "Hangzhou",
  "Zhejiang Province": "Province du Zhejiang",
  "Hefei": "Hefei",
  "Anhui Province": "Province de l'Anhui",
  "Nanjing": "Nanjing",
  "Jiangsu Province": "Province du Jiangsu",
  
  // Programs
  "Computer Science & AI": "Informatique et IA",
  "Civil Engineering": "Génie Civil",
  "Economics & Finance": "Économie et Finance",
  "Global Affairs": "Affaires Mondiales",
  "International Relations": "Relations Internationales",
  "Chinese Linguistics & Literature": "Linguistique et Littérature Chinoises",
  "Biomedical Sciences": "Sciences Biomédicales",
  "Yenching Global Studies": "Études Mondiales Yenching",
  "International Business (IMBA)": "Commerce International (IMBA)",
  "Clinical Medicine": "Médecine Clinique",
  "Journalism": "Journalisme",
  "Micro-electronics": "Micro-électronique",
  "Mechanical & Naval Engineering": "Génie Mécanique et Naval",
  "Robotics & Automation": "Robotique et Automatisation",
  "Economics & Management": "Économie et Gestion",
  "Biomedical Engineering": "Génie Biomédical",
  "Computer Science & Big Data": "Informatique et Big Data",
  "Agricultural Science": "Sciences Agricoles",
  "Chemical Engineering": "Génie Chimique",
  "Control Science": "Sciences de Contrôle",
  "Quantum Physics": "Physique Quantique",
  "Nanotechnology": "Nanotechnologie",
  "Mathematics": "Mathématiques",
  "Computer Science": "Informatique",
  "Astronomy & Astrophysics": "Astronomie et Astrophysique",
  "Environmental Science": "Sciences de l'Environnement",
  "Chinese History & Culture": "Histoire et Culture Chinoises",
  "Geology": "Géologie",
  
  // Scholarships
  "Chinese Government Scholarship (CSC)": "Bourse du Gouvernement Chinois (CSC)",
  "Beijing Municipal Scholarship": "Bourse Municipale de Pékin",
  "Schwarzman Scholars": "Bourse Schwarzman",
  "CSC Scholarship Type A & B": "Bourse CSC Type A & B",
  "Peking University Foreign Student Scholarship": "Bourse Étudiants Étrangers PKU",
  "Yenching Academy Fellowship": "Bourse de l'Académie Yenching",
  "CSC Scholarship": "Bourse CSC",
  "Shanghai Government Scholarship (SGS)": "Bourse du Gouvernement de Shanghai (SGS)",
  "Fudan University President Scholarship": "Bourse du Président de l'Université Fudan",
  "CSC High-Level Postgrad": "CSC Haut Niveau Post-universitaire",
  "Shanghai Municipal Government Scholarship": "Bourse du Gouvernement Municipal de Shanghai",
  "SJTU Antai Business Scholarship": "Bourse SJTU Antai Business",
  "Chinese Government Scholarship": "Bourse du Gouvernement Chinois",
  "Zhejiang Provincial Government Scholarship": "Bourse du Gouvernement Provincial du Zhejiang",
  "ZJU Outstanding Student Award": "Prix de l'Étudiant Exceptionnel de la ZJU",
  "CAS - TWAS Fellowship": "Bourse CAS - TWAS",
  "USTC International Student Fellowship": "Bourse Étudiants Internationaux USTC",
  "Jiangsu Jasmine Scholarship": "Bourse Jasmin du Jiangsu",
  
  // Descriptions
  "Historic imperial Qing garden grounds, world-leading AI labs, cutting-edge athletic facilities, Schwarzman College.": "Anciens jardins impériaux Qing, laboratoires d'IA de renommée mondiale, Collège Schwarzman.",
  "Famous Weiming Lake and Boya Pagoda, classical imperial architecture, national center for humanities & fundamental sciences.": "Célèbre lac Weiming et pagode Boya, architecture classique impériale, centre national des sciences humaines.",
  "Handan historic twin towers campus, premier financial hub connectivity in Shanghai, top teaching hospitals.": "Campus historique de Handan, excellente connectivité avec le centre financier de Shanghai.",
  "Sprawling Minhang high-tech campus, UM-SJTU Joint Institute, state key laboratories for robotics and ocean engineering.": "Vaste campus high-tech de Minhang, Institut conjoint UM-SJTU, laboratoires clés pour la robotique.",
  "Zijingang modern hyper-campus, deep innovation ecosystem linked to Alibaba and Hangzhou tech hub.": "Campus hyper-moderne de Zijingang, écosystème d'innovation lié à Alibaba et au pôle tech de Hangzhou.",
  "National Synchrotron Radiation Laboratory, Hefei National Laboratory for Quantum Information Sciences, elite science focus.": "Laboratoire national de rayonnement synchrotron, orientation scientifique d'élite.",
  "Gulou city-center classic campus covered in ivy, vast Xianlin modern campus, profound humanities library.": "Campus classique de Gulou en centre-ville, vaste campus moderne de Xianlin.",

  // Checklist Titles
  "Valid International Passport": "Passeport International Valide",
  "Notarized Highest Diploma & Transcripts": "Diplôme et Relevés de Notes Notariés",
  "Language Proficiency Certificates (HSK / IELTS)": "Certificats de Langue (HSK / IELTS)",
  "Two Letters of Recommendation": "Deux Lettres de Recommandation",
  "Personal Statement & Research Study Plan": "Lettre de Motivation & Plan d'Études",
  "Foreigner Physical Examination Form": "Formulaire d'Examen Physique",
  "Certificate of Non-Criminal Record": "Extrait de Casier Judiciaire",
  "Financial Guarantee / Bank Proof": "Garantie Financière / Preuve Bancaire",
  
  // Checklist Categories
  "Identity & Legal": "Identité et Légal",
  "Academic Records": "Dossier Académique",
  "Language Qualifications": "Qualifications Linguistiques",
  "Academic References": "Références Académiques",
  "Application Statement": "Déclaration de Candidature",
  "Health & Medical": "Santé et Médical",
  "Legal Clearance": "Contrôle Légal",
  "Financial Support": "Soutien Financier",
  
  // Checklist Descriptions
  "Ordinary passport with validity extending at least 6 months beyond the intended date of departure from China (minimum validity through March 2028). Scans must clearly display biographical info, signature, and visa pages.": "Passeport avec une validité de plus de 6 mois. Les scans doivent inclure infos bio, signature et visas.",
  "Original or officially notarized highest degree diploma certificate and complete official academic transcripts with cumulative GPA. Documents in languages other than Chinese or English must include official certified notarized translations.": "Diplôme original ou notarié et relevés de notes avec GPA. Traduction certifiée requise si ce n'est pas en anglais/chinois.",
  "Official test score report verifying language proficiency: HSK Level 4 (score >= 210) or Level 5 (score >= 180) for Chinese-taught majors; IELTS (score >= 6.5) or TOEFL iBT (score >= 90) for English-taught degree tracks.": "Rapport officiel (HSK/IELTS/TOEFL) vérifiant le niveau de langue.",
  "Two formal letters of recommendation written in English or Chinese from full professors or associate professors in the applicant's academic field. Letters must evaluate academic potential, research capabilities, and character.": "Deux lettres de recommandation formelles de professeurs.",
  "In-depth proposal outlining educational background, prospective supervisor alignment, academic research objectives in China, and post-graduation career path. Minimum 800 words for Bachelor/Master, 1,500 words for Ph.D. candidates.": "Proposition détaillée du parcours, objectifs de recherche, et carrière.",
  "Standard Foreigner Physical Examination Form completed in English or Chinese, including electrocardiogram (ECG), chest X-ray, blood serology (HIV, Syphilis, Hepatitis B), signed by examining physician and stamped with hospital official seal over photograph.": "Examen médical incluant ECG, radio pulmonaire et analyses sanguines.",
  "Official police clearance certificate or judicial background check issued by the applicant's local municipal, state, or federal police authority, verifying zero criminal record within the jurisdiction of residence.": "Certificat de police vérifiant l'absence de casier judiciaire.",
  "Official bank deposit certificate or notarized financial sponsor declaration verifying liquid funds (minimum equivalent to RMB 25,000–50,000 / USD 3,500–7,000) sufficient to cover first-year tuition and living expenses in China.": "Preuve de fonds liquides pour couvrir la première année d'études.",
  
  // Checklist Required For
  "All Applicants (University Admission & X1 Student Visa)": "Tous les candidats",
  "All Degree Applicants (Bachelor, Master, Ph.D.) & CSC Scholarships": "Candidats aux diplômes et bourses CSC",
  "Mandatory for all degree admissions and scholarship evaluations": "Obligatoire pour les diplômes et bourses",
  "Postgraduate Degree Applicants (Master & Ph.D.) and CSC Type A/B": "Candidats aux diplômes de troisième cycle et CSC Type A/B",
  "All International Degree Admissions & CSC Scholarship Applicants": "Tous les candidats internationaux",
  "X1 Long-term Student Visa (>180 days) & CSC Scholarship Acceptance": "Visa d'étudiant X1 (> 180 jours)",
  "University Admission Dossier & PRC Ministry of Foreign Affairs Visa": "Dossier d'admission et visa Ministère Affaires Étrangères",
  "Self-Funded Applicants & Partial Scholarship Recipients": "Candidats autofinancés",
  
  // Checklist Notes
  "Color scan in high resolution (PDF/JPEG < 3MB). If passport expires before March 2028, renew immediately before submitting visa applications.": "Scan couleur haute résolution. Renouvelez votre passeport s'il expire avant mars 2028.",
  "Graduating students submit provisional pre-graduation certificate issued by current university. Cumulative GPA >= 3.0/4.0 recommended for C9 and Project 985 institutions.": "Les étudiants diplômés soumettent un certificat provisoire. GPA >= 3.0 recommandé.",
  "Score reports are strictly valid for 2 years from examination date. Register for HSK 4/5 exams prior to April 2027 to ensure official score report delivery.": "Validité de 2 ans. Inscrivez-vous aux examens HSK avant avril 2027.",
  "Must be printed on official institutional letterhead, dated within 6 months prior to application submission, and contain referee's title, phone, email, and handwritten signature.": "En-tête officiel, daté de moins de 6 mois, avec signature.",
  "Must be written in Chinese for Chinese-taught programs or English for English-taught programs. Highly weighted criterion for CSC selection committees.": "Rédigé en chinois ou anglais selon le programme. Très important pour le CSC.",
  "Exam results are valid for strictly 6 months. To ensure validity covers September 2027 university registration, schedule medical exam between March and May 2027.": "Valable 6 mois. À planifier entre mars et mai 2027.",
  "Must be issued within 6 months of application date. Documents must be certified, apostilled, or legalized by the PRC embassy/consulate in the issuing nation.": "Émis dans les 6 mois. Doit être certifié ou légalisé.",
  "Account deposit should be frozen for 3–6 months during the admission review window. Full CSC Type A/B scholarship winners may submit scholarship award letter in lieu.": "Dépôt bloqué 3 à 6 mois. Les boursiers CSC Type A/B sont exemptés.",
  
  // Checklist agencies
  "National Passport Authority / Embassy": "Autorité nationale / Ambassade",
  "University Registrar / Official Notary Public": "Université / Notaire",
  "Hanban / CTI (HSK) or British Council / ETS": "Hanban / CTI / British Council",
  "Academic Referees / University Department": "Références Académiques",
  "Applicant Self-Prepared": "Préparé par le candidat",
  "Designated Quarantine / Public Hospital": "Hôpital public désigné",
  "Local Police Department / Ministry of Justice": "Police locale / Ministère de la Justice",
  "Commercial Bank / Financial Sponsor": "Banque / Sponsor Financier",
  
  // HSK Timeline titles
  "Basic Survival Chinese": "Chinois de Survie de Base",
  "Intermediate Daily Communication": "Communication Quotidienne",
  "Upper Intermediate & Academic Threshold": "Intermédiaire Supérieur & Seuil Académique",
  "Advanced Academic & University Admissions": "Académique Avancé & Admissions Universitaires",
  "Mastery & Academic Research Fluency": "Maîtrise & Fluidité en Recherche",
  
  // HSK Timeline descriptions
  "Can understand and use simple Chinese phrases, meet basic needs for communication. Covers Pinyin fundamentals and basic grammar.": "Peut comprendre des phrases simples et répondre aux besoins de base.",
  "Can communicate simply and directly on daily topics. Essential for interacting on campus and ordering food.": "Communication quotidienne de base. Essentiel sur le campus.",
  "Can complete basic communicative tasks in daily life, study, and travel; can navigate most situations encountered when traveling across China.": "Tâches communicatives de base de la vie quotidienne.",
  "Can converse fluently with native Chinese speakers on a wide range of topics. Fulfills the standard Chinese language requirement for CSC scholarship science and engineering degree programs.": "Conversation fluide avec des natifs. Requis pour le CSC.",
  "Can read Chinese newspapers and academic journals, watch Chinese films without subtitles, and deliver formal speeches. Mandatory threshold for admission to Chinese-taught undergraduate and graduate degrees at premier C9 League universities.": "Lecture de journaux, visionnage de films. Seuil pour les admissions C9.",
  "Can effortlessly understand any written or spoken Chinese information, and express oneself effectively both orally and in formal academic papers and thesis defenses.": "Compréhension sans effort, expression efficace.",
  
  // HSK goals
  "Threshold for non-degree short-term language immersion semester programs.": "Seuil pour les programmes courts non diplômants.",
  "Official admission requirement for English-taught undergrads and CSC STEM scholarship applicants.": "Exigence d'admission officielle pour les cursus en anglais.",
  "Mandatory standard qualification for all Chinese-taught bachelor and master degrees.": "Qualification standard obligatoire pour les diplômes en chinois.",
  "Highest certification level; demonstrates full bilingual research and professional capabilities.": "Niveau de certification le plus élevé ; compétences de recherche bilingues.",
  
  // HSK courses
  "HSK 1 & 2 Standard Course": "Cours Standard HSK 1 & 2",
  "HelloChinese Mobile App": "Application HelloChinese",
  "Pleco Dictionary & Flashcards": "Dictionnaire Pleco",
  "HSK 3 Standard Course Textbook & Workbook": "Manuel et Cahier d'Exercices HSK 3",
  "Du Chinese Graded Chinese Reading Stories": "Lectures graduées Du Chinese",
  "SuperChinese AI Powered Grammar Coach": "SuperChinese IA Grammaire",
  "HSK 4 Standard Course (Volumes 1 & 2)": "Cours Standard HSK 4 (Volumes 1 & 2)",
  "The Chairman's Bao Graded News Reader": "Articles d'actualités gradués The Chairman's Bao",
  "Bilibili Science & Campus Life Listening Vlogs": "Vlogs Bilibili sur la Science et la Vie de Campus",
  "HSK 5 Standard Course (Textbooks 1 & 2)": "Cours Standard HSK 5 (Manuels 1 & 2)",
  "Past Official HSK 5 Real Examination Papers": "Anciens Sujets Officiels HSK 5",
  "Zhihu / People's Daily Academic & Technology Essays": "Essais Zhihu / People's Daily",
  "HSK 6 Standard Course & Lexicon Reference": "Cours Standard HSK 6",
  "CNKI China National Knowledge Infrastructure Academic Database": "Base de données académiques CNKI",
  "CCTV / Phoenix TV Academic & Scientific Documentaries": "Documentaires CCTV / Phoenix TV"
};

let i18n = fs.readFileSync('src/i18n.js', 'utf-8');
const dictStr = JSON.stringify(dict, null, 2).slice(1, -1);
i18n = i18n.replace('export const dictionary = {', 'export const dictionary = {' + dictStr + ',');
fs.writeFileSync('src/i18n.js', i18n);
