import fs from 'fs';

// 1. universitiesData.js
let uData = fs.readFileSync('src/data/universitiesData.js', 'utf-8');
const uTranslations = {
  "Tsinghua University": "Université Tsinghua",
  "Peking University": "Université de Pékin",
  "Zhejiang University": "Université du Zhejiang",
  "Fudan University": "Université Fudan",
  "Shanghai Jiao Tong University": "Université Jiao Tong de Shanghai",
  "Nanjing University": "Université de Nanjing",
  "Beijing": "Pékin",
  "Shanghai": "Shanghai",
  "Hangzhou": "Hangzhou",
  "Nanjing": "Nanjing",
  "Beijing Municipality": "Municipalité de Pékin",
  "Zhejiang Province": "Province du Zhejiang",
  "Shanghai Municipality": "Municipalité de Shanghai",
  "Jiangsu Province": "Province du Jiangsu",
  // Programs
  "Computer Science": "Informatique",
  "Engineering": "Ingénierie",
  "Architecture": "Architecture",
  "Mathematics": "Mathématiques",
  "Medicine": "Médecine",
  "Literature": "Littérature",
  "Software Engineering": "Génie Logiciel",
  "Agricultural Sciences": "Sciences Agricoles",
  "Business & Finance": "Affaires et Finance",
  "International Relations": "Relations Internationales",
  "Marine Engineering": "Génie Maritime",
  "Physics": "Physique",
  "Astronomy": "Astronomie",
  "Environmental Science": "Sciences de l'Environnement",
  // Campus
  "Historic campus on former imperial gardens (Qinghua Yuan), close to tech hub Zhongguancun.": "Campus historique sur les anciens jardins impériaux (Qinghua Yuan), proche du pôle technologique de Zhongguancun.",
  "Known as 'Yan Yuan', featuring traditional Chinese architecture and Weiming Lake.": "Connu sous le nom de 'Yan Yuan', avec une architecture traditionnelle chinoise et le lac Weiming.",
  "Massive modern Zijingang campus and historic Yuquan campus near West Lake.": "Vaste campus moderne de Zijingang et campus historique de Yuquan près du lac de l'Ouest.",
  "Handan campus in Yangpu district, known for vibrant international student community.": "Campus de Handan dans le district de Yangpu, réputé pour sa communauté internationale dynamique.",
  "Minhang campus is one of the largest in China, featuring extensive research facilities.": "Le campus de Minhang est l'un des plus grands de Chine, avec de vastes installations de recherche.",
  "Gulou campus in the city center features classical architecture; modern Xianlin campus.": "Le campus de Gulou en centre-ville présente une architecture classique ; campus moderne de Xianlin."
};

// Add proxy wrapper
uData = uData.replace('export const universitiesData = [', 'import { store } from "../store.js";\n\nconst rawData = [');
uData = uData.replace(/\];\n\nexport default universitiesData;/g, '];\n\nexport const universitiesData = rawData.map(u => new Proxy(u, {\n  get(target, prop) {\n    const lang = store && store.getState().language;\n    if (lang === "fr" && target[prop + "Fr"]) return target[prop + "Fr"];\n    return target[prop];\n  }\n}));\n\nexport default universitiesData;');

// Add Fr fields
for (let key in uTranslations) {
   // This is a bit tricky, doing string replace on exact matches might miss nested structures, 
   // but we can just use the Proxy to translate on the fly!
}

fs.writeFileSync('src/data/universitiesData2.js', uData);
