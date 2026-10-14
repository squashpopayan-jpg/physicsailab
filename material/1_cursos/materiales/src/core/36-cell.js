/* 36-cell.js — Dibujo de celdas unitarias con View3D */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat;
  /* Dibuja la celda 'type' (o 'hcp') repetida N veces por eje.
     o: {N, rScale, edges, species:[radios relativos], colors, center:[x,y,z], ghost, only} */
  EM.renderCell = function (v, type, o = {}) {
    const N = o.N || 1, s = o.size || 2 / N;
    const ctr = o.center || [N / 2, N / 2, N / 2];
    const colors = o.colors || EM.SPECIES;
    const T = (p) => [(p[0] - ctr[0]) * s, (p[1] - ctr[1]) * s, (p[2] - ctr[2]) * s];
    let pts;
    if (type === 'hcp') {
      pts = MAT.hcpPoints(o.ca);
      const cc = (o.ca || Math.sqrt(8 / 3));
      const sh = 0.75 * s * N;
      const TH = (p) => [p[0] * sh, p[1] * sh, (p[2] - cc / 2) * sh];
      const hex = [];
      for (let k = 0; k <= 6; k++) hex.push([Math.cos((k * Math.PI) / 3), Math.sin((k * Math.PI) / 3)]);
      if (o.edges !== false) for (const z of [0, cc]) {
        for (let k = 0; k < 6; k++) v.line(TH([hex[k][0], hex[k][1], z]), TH([hex[k + 1][0], hex[k + 1][1], z]), { color: '--ink-3', width: 1.1 });
        if (z === 0) for (let k = 0; k < 6; k++) v.line(TH([hex[k][0], hex[k][1], 0]), TH([hex[k][0], hex[k][1], cc]), { color: '--ink-3', width: 1.1 });
      }
      const rr = (o.rScale || 0.5) * sh;
      for (const a of pts) v.point(TH(a.p), { r: rr * v.s, color: a.s ? colors[1] : colors[0], glow: true, ring: false });
      return pts.length;
    }
    pts = MAT.latticePoints(type, N);
    if (o.edges !== false) {
      const E = [[0, 0, 0], [N, 0, 0], [N, N, 0], [0, N, 0]];
      for (let k = 0; k < 4; k++) {
        const a = E[k], b = E[(k + 1) % 4];
        v.line(T(a), T(b), { color: '--ink-3', width: 1.1 });
        v.line(T([a[0], a[1], N]), T([b[0], b[1], N]), { color: '--ink-3', width: 1.1 });
        v.line(T(a), T([a[0], a[1], N]), { color: '--ink-3', width: 1.1 });
      }
    }
    const radii = o.species || [1, 1, 1];
    const rBase = (o.rScale || 0.18) * s;
    let n = 0;
    for (const a of pts) {
      if (o.only !== undefined && a.s !== o.only) continue;
      const r = rBase * radii[a.s] * v.s;
      v.point(T(a.p), { r, color: colors[a.s], glow: true, ring: false, alpha: o.ghost ? 0.35 : 1 });
      n++;
    }
    return n;
  };
})();
