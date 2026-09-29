import fs from 'fs';

let content = fs.readFileSync('src/data/universitiesData.js', 'utf-8');

// We will add teachingCategory right after the province or league
content = content.replace(/id: 'thu',/, "id: 'thu',\n    teachingCategory: 'Engineering & Technology',");
content = content.replace(/id: 'pku',/, "id: 'pku',\n    teachingCategory: 'Comprehensive & Humanities',");
content = content.replace(/id: 'fudan',/, "id: 'fudan',\n    teachingCategory: 'Comprehensive & Humanities',");
content = content.replace(/id: 'sjtu',/, "id: 'sjtu',\n    teachingCategory: 'Engineering & Technology',");
content = content.replace(/id: 'zju',/, "id: 'zju',\n    teachingCategory: 'Engineering & Technology',");
content = content.replace(/id: 'ustc',/, "id: 'ustc',\n    teachingCategory: 'Engineering & Technology',");
content = content.replace(/id: 'nju',/, "id: 'nju',\n    teachingCategory: 'Comprehensive & Humanities',");
content = content.replace(/id: 'hit',/, "id: 'hit',\n    teachingCategory: 'Engineering & Technology',");
content = content.replace(/id: 'blcu',/, "id: 'blcu',\n    teachingCategory: 'Languages & Cultural Studies',");
content = content.replace(/id: 'sysu',/, "id: 'sysu',\n    teachingCategory: 'Comprehensive & Humanities',");

fs.writeFileSync('src/data/universitiesData.js', content);
