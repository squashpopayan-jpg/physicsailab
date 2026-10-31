const g = sim('fiesta-moleculas'); const r = [];
for (const T of [0.05, 0.1, 0.2, 0.3, 0.4, 0.6, 1.0, 1.5]) { g.setSlider('T', T); g._tick(600); r.push([T, +g.dbg.z.toFixed(2), g.dbg.st]); }
return r;
