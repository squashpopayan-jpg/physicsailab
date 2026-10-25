/* ===================================================================
   36-crystal.js — Cristales y zonas de Brillouin en 3D (sobre View3D)
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd;

  /* Átomos de N₁×N₂×N₃ celdas convencionales, con las imágenes de borde (f = 0 → también f = N).
     Devuelve [{p (cartesiano), s, f}] */
  EM.crystalAtoms = function (st, N = [1, 1, 1], o = {}) {
    const out = [], eps = 1e-9;
    for (let a = 0; a <= N[0]; a++) for (let b = 0; b <= N[1]; b++) for (let c = 0; c <= N[2]; c++) {
      for (const at of st.atoms) {
        const f = [at.f[0] + a, at.f[1] + b, at.f[2] + c];
        if (f[0] > N[0] + eps || f[1] > N[1] + eps || f[2] > N[2] + eps) continue;
        if (o.noImages && (f[0] > N[0] - eps || f[1] > N[1] - eps || f[2] > N[2] - eps)) continue;
        out.push({ p: SS.frac2cart(st.cell, f), s: at.s, f });
      }
    }
    return out;
  };

  /* Dibuja una estructura. o: {N, els, rScale, radii:[por especie], bonds (Å), center, scale, cellColor, alpha, only, highlight} */
  EM.renderCrystal = function (v, st, o = {}) {
    const N = o.N || [1, 1, 1];
    const atoms = EM.crystalAtoms(st, N, o);
    const cen = o.center || SS.frac2cart(st.cell, [N[0] / 2, N[1] / 2, N[2] / 2]);
    const sc = o.scale || 2 / Math.max(...[0, 1, 2].map((i) => Math.hypot(...st.cell[i]) * N[i]));
    const T = (p) => [(p[0] - cen[0]) * sc, (p[1] - cen[1]) * sc, (p[2] - cen[2]) * sc];
    /* aristas de las celdas */
    if (o.edges !== false) {
      const cellLine = (f1, f2) => v.line(T(SS.frac2cart(st.cell, f1)), T(SS.frac2cart(st.cell, f2)), { color: o.cellColor || '--ink-3', width: 1.1, seg: 3, alpha: 0.85 });
      for (let a = 0; a <= N[0]; a++) for (let b = 0; b <= N[1]; b++) cellLine([a, b, 0], [a, b, N[2]]);
      for (let a = 0; a <= N[0]; a++) for (let c = 0; c <= N[2]; c++) cellLine([a, 0, c], [a, N[1], c]);
      for (let b = 0; b <= N[1]; b++) for (let c = 0; c <= N[2]; c++) cellLine([0, b, c], [N[0], b, c]);
    }
    /* enlaces */
    if (o.bonds) {
      for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
        const a = atoms[i].p, b = atoms[j].p, d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        if (d < o.bonds * 1.001 && (!o.bondDiff || atoms[i].s !== atoms[j].s)) v.line(T(a), T(b), { color: '--ink-2', width: 2.2, seg: 2, alpha: 0.7 });
      }
    }
    const radii = o.radii || [0.5, 0.5, 0.5];
    const els = o.els || [];
    for (const at of atoms) {
      if (o.only !== undefined && at.s !== o.only) continue;
      const r = (o.rScale || 0.16) * radii[at.s] * sc * v.s * (Math.hypot(...st.cell[0]));
      const col = o.colors ? o.colors[at.s] : els[at.s] ? D.atomColor(els[at.s], at.s) : ['--c1', '--c2', '--c3'][at.s];
      v.point(T(at.p), { r: Math.max(2, r), color: col, glow: true, ring: false, alpha: o.alpha });
    }
    return { atoms, T, sc };
  };

  /* Zona de Brillouin: caras translúcidas, aristas y puntos especiales (k en unidades 2π/a → escala s) */
  EM.renderBZ = function (v, bz, o = {}) {
    const s = o.scale || 1;
    const P = (p) => [p[0] * s, p[1] * s, p[2] * s];
    for (const f of bz.faces) {
      v.poly(f.map((i) => P(bz.verts[i])), { fill: o.fill || '--accent', alpha: o.alpha === undefined ? 0.13 : o.alpha, shade: true, stroke: o.stroke || '--accent', strokeAlpha: 0.9, strokeWidth: 1.4 });
    }
    if (o.points) for (const [lab, k] of Object.entries(o.points)) {
      const q = P(k.map((x) => x * (o.kScale || 1)));
      v.point(q, { r: 4, color: '--c2', ring: false, bias: 0.5 });
      v.text(q, lab, { size: 13, dx: 9, dy: -8, weight: 650, color: '--ink' });
    }
  };
})();
