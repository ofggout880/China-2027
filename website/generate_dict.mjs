import fs from 'fs';
import path from 'path';

let dict = {};

function addStrings(obj) {
  if (typeof obj === 'string') {
    if (!dict[obj]) dict[obj] = obj;
  } else if (Array.isArray(obj)) {
    obj.forEach(addStrings);
  } else if (typeof obj === 'object' && obj !== null) {
    Object.values(obj).forEach(addStrings);
  }
}

async function loadData() {
  const uData = (await import('./src/data/universitiesData.js')).universitiesData;
  const cData = (await import('./src/data/checklistData.js')).CHECKLIST_ITEMS;
  const hData = (await import('./src/data/hskMilestones.js')).hskMilestones;
  const sData = (await import('./src/data/chinaStatistics.js')).macroEconomicsData;
  
  addStrings(uData);
  addStrings(cData);
  addStrings(hData);
  addStrings(sData);
  
  fs.writeFileSync('all_data_strings.json', JSON.stringify(Object.keys(dict), null, 2));
}

loadData();
