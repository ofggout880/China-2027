import fs from 'fs';
import path from 'path';

function extractStrings(dir) {
  let strings = new Set();
  const files = fs.readdirSync(dir, { recursive: true });
  
  files.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.html')) {
      const p = path.join(dir, file);
      const content = fs.readFileSync(p, 'utf-8');
      
      // Match text inside HTML tags: >Text<
      const htmlMatches = content.match(/>([^<]+)</g);
      if (htmlMatches) {
        htmlMatches.forEach(m => {
          const s = m.slice(1, -1).trim();
          if (s && !s.match(/^[0-9\s.,-]+$/) && !s.includes('${')) strings.add(s);
        });
      }

      // Match string literals in JS: 'Text' or "Text"
      const jsMatches = content.match(/(["'])(?:(?=(\\?))\2.)*?\1/g);
      if (jsMatches) {
        jsMatches.forEach(m => {
          const s = m.slice(1, -1).trim();
          // Filter out obvious code strings
          if (s && s.length > 2 && s.includes(' ') && !s.match(/^[a-z_A-Z0-9.\/#-]+$/)) {
             strings.add(s);
          }
        });
      }
    }
  });
  
  return Array.from(strings);
}

const s = extractStrings('./src');
fs.writeFileSync('strings.json', JSON.stringify(s, null, 2));
console.log('Extracted', s.length, 'strings');
