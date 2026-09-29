import fs from 'fs';

const strings = JSON.parse(fs.readFileSync('all_data_strings.json', 'utf-8'));
const englishStrings = strings.filter(s => {
  // filter out dates, ids, numbers, single letters, pure chinese
  if (s.length < 2) return false;
  if (/^[0-9-]+$/.test(s)) return false;
  if (/^doc_/.test(s)) return false;
  if (/^hsk/.test(s)) return false;
  // if contains chinese characters
  if (/[\u3400-\u9FBF]/.test(s)) return false;
  if (/^[a-z]+$/.test(s)) return false; // pinyin or single words lowercase
  if (s.startsWith('L') && s.length == 2) return false;
  if (s.includes('CEFR')) return false;
  return true;
});

fs.writeFileSync('english_strings.json', JSON.stringify(englishStrings, null, 2));
console.log("English strings to translate:", englishStrings.length);
