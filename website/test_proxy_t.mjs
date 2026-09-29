function t(key) {
  const dict = { "Beijing": "Pékin", "Computer Science": "Informatique" };
  return dict[key] || key;
}

const u = { name: "Beijing", topPrograms: ["Computer Science", "Math"] };
const p = new Proxy(u, {
  get(target, prop) {
    const val = target[prop];
    if (typeof val === 'string') return t(val);
    if (Array.isArray(val)) return val.map(v => typeof v === 'string' ? t(v) : v);
    return val;
  }
});
console.log(p.name, p.topPrograms);
