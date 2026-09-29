import fs from 'fs';

let content = fs.readFileSync('src/components/documentChecklist.js', 'utf-8');

content = content.replace(/\`\$\{8 - completed\} Remaining\`/g, "`${8 - completed}${t(' Remaining')}`");

fs.writeFileSync('src/components/documentChecklist.js', content);
