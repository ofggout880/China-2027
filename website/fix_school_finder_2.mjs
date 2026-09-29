import fs from 'fs';
let content = fs.readFileSync('src/components/schoolFinder.js', 'utf-8');

// The filters are rendered like this:
// `<button ...>${LEAGUE_FILTERS[key]}</button>`
content = content.replace(/\$\{LEAGUE_FILTERS\[key\]\}/g, '${t(LEAGUE_FILTERS[key])}');
content = content.replace(/\$\{CITY_FILTERS\[key\]\}/g, '${t(CITY_FILTERS[key])}');

fs.writeFileSync('src/components/schoolFinder.js', content);
