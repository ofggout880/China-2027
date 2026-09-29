import fs from 'fs';

function fixFile(file, arrName, extras) {
  let c = fs.readFileSync(file, 'utf-8');
  
  // Remove the old exports if they are above
  if (extras) {
    extras.forEach(e => {
       c = c.replace(new RegExp(`export (const|default) ${e}.*\\n`, 'g'), '');
    });
  }
  
  // Re-append them at the very end
  if (extras) {
    extras.forEach(e => {
       if (e === 'default') {
         c += `\nexport default ${arrName};\n`;
       } else {
         c += `\nexport const ${e} = ${arrName};\n`;
       }
    });
  }
  
  fs.writeFileSync(file, c);
}

fixFile('src/data/checklistData.js', 'CHECKLIST_ITEMS', ['checklistData', 'default']);
fixFile('src/data/universitiesData.js', 'universitiesData', ['UNIVERSITIES', 'default']);
fixFile('src/data/hskMilestones.js', 'hskMilestones', ['HSK_MILESTONES', 'default']);
// chinaStatistics is slightly different
let cs = fs.readFileSync('src/data/chinaStatistics.js', 'utf-8');
cs = cs.replace(/export const charts = \{/g, 'const charts_raw = {');
cs = cs.replace(/export const chinaStatistics = \{/g, 'const chinaStatistics_raw = {');
cs = cs.replace(/export const CHINA_STATS = chinaStatistics;/g, '');
cs = cs.replace(/export default chinaStatistics;/g, '');
cs += `\nexport const charts = translateData(charts_raw);`;
cs += `\nexport const chinaStatistics = translateData(chinaStatistics_raw);`;
cs += `\nexport const CHINA_STATS = chinaStatistics;`;
cs += `\nexport default chinaStatistics;`;
fs.writeFileSync('src/data/chinaStatistics.js', cs);

