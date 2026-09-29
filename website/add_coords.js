import fs from 'fs';

let content = fs.readFileSync('src/data/universitiesData.js', 'utf-8');

const coords = {
  tsinghua: { lat: 39.9997, lng: 116.3264 },
  pku: { lat: 39.9869, lng: 116.3059 },
  fudan: { lat: 31.2973, lng: 121.5036 },
  sjtu: { lat: 31.0264, lng: 121.4370 },
  zju: { lat: 30.2638, lng: 120.1219 },
  ustc: { lat: 31.8384, lng: 117.2625 },
  nju: { lat: 32.0573, lng: 118.7788 },
  hit: { lat: 45.7439, lng: 126.6322 },
  blcu: { lat: 39.9972, lng: 116.3486 },
  sysu: { lat: 23.0965, lng: 113.2988 }
};

for (const [id, c] of Object.entries(coords)) {
  const reg = new RegExp(`id:\\s*['"]${id}['"],`);
  content = content.replace(reg, `id: '${id}',\n    coordinates: { lat: ${c.lat}, lng: ${c.lng} },`);
}

fs.writeFileSync('src/data/universitiesData.js', content);
