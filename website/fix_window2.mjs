import fs from 'fs';
let content = fs.readFileSync('src/main.js', 'utf-8');
content = content.replace(/syncNavigationDOM\(store\.getState\(\)\.activeTab\);\n\}\);/g, "syncNavigationDOM(store.getState().activeTab);\n});\n}");
fs.writeFileSync('src/main.js', content);
