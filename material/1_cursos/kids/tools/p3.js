const out = [];
for (let lv = 0; lv < 3; lv++) {
  const L = FK.laserLevels[lv], n = L.mirrors.length; let sol = null;
  const rec = (i, angs) => { if (sol) return; if (i === n) { const r = FK.laserTrace(L, L.mirrors.map((m, k) => ({ x: m.x, y: m.y, a: angs[k] }))); if (r.hit) sol = angs.slice(); return; } for (let a = -85; a <= 90; a += 5) { angs[i] = a; rec(i + 1, angs); if (sol) return; } };
  rec(0, []);
  const init = FK.laserTrace(L, L.mirrors.map((m) => ({ x: m.x, y: m.y, a: m.a }))).hit;
  out.push({ lv: lv + 1, solucion: sol, yaResuelto: init });
}
return out;
