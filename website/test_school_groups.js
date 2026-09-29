import fs from 'fs';

let content = fs.readFileSync('src/components/schoolFinder.js', 'utf-8');
const searchMatch = content.match(/function renderSchoolFinder/);
if (searchMatch) console.log("Found renderSchoolFinder");
else console.log("Not found renderSchoolFinder");
