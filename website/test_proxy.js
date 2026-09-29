const u = { name: "Tsinghua", nameFr: "Université Tsinghua" };
let lang = 'fr';
const p = new Proxy(u, {
  get(target, prop) {
    if (lang === 'fr' && target[prop + 'Fr']) return target[prop + 'Fr'];
    return target[prop];
  }
});
console.log(p.name);
