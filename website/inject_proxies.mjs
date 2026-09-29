import fs from 'fs';

const PROXY_CODE = `
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
`;

function injectProxy(filePath, oldExport, newExportName) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('translateData')) return; // already injected
  
  // replace "export const X = [" with "const X_raw = ["
  const regex = new RegExp(`export const ${oldExport} = (\\{|\\[)`);
  content = content.replace(regex, `const ${oldExport}_raw = $1`);
  
  // Append proxy code at the end
  content += PROXY_CODE;
  content += `\nexport const ${oldExport} = translateData(${oldExport}_raw);\n`;
  if (newExportName) {
     content = content.replace(`export const ${newExportName} = ${oldExport};`, `export const ${newExportName} = ${oldExport};`);
     content = content.replace(`export default ${oldExport};`, `export default ${oldExport};`);
  }
  
  fs.writeFileSync(filePath, content);
}

injectProxy('src/data/universitiesData.js', 'universitiesData');
injectProxy('src/data/checklistData.js', 'CHECKLIST_ITEMS', 'checklistData');
injectProxy('src/data/hskMilestones.js', 'hskMilestones');
injectProxy('src/data/chinaStatistics.js', 'macroStats');
injectProxy('src/data/chinaStatistics.js', 'chinaStatistics');

