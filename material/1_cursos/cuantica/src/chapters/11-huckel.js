/* Capítulo 11 — Orbitales moleculares de Hückel (energías en unidades de |β|) */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, MOL = P.mol, LA = P.la;
  const f3 = (v) => CQ.fix(v, 3);

  /* Dibuja una molécula con los coeficientes de un orbital (círculos: tamaño |c|, color: signo) */
  function drawMolecule(cv, mol, coef, o = {}) {
    const ctx = cv.ctx;
    const xs = mol.atoms.map((a) => a.x), ys = mol.atoms.map((a) => a.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = 1.0;
    const view = new CQ.View2D(cv, { xmin: x0 - pad, xmax: x1 + pad, ymin: y0 - pad, ymax: y1 + pad });
    view.update();
    ctx.save();
    ctx.strokeStyle = CQ.col('--ink-3'); ctx.lineWidth = 2.5;
    for (const [i, j] of mol.bonds) { ctx.beginPath(); ctx.moveTo(view.X(mol.atoms[i].x), view.Y(mol.atoms[i].y)); ctx.lineTo(view.X(mol.atoms[j].x), view.Y(mol.atoms[j].y)); ctx.stroke(); }
    ctx.restore();
    const R = Math.min(0.42 * view.s, 46);
    mol.atoms.forEach((a, i) => {
      const c = coef ? coef[i] : 0;
      if (coef) {
        ctx.beginPath(); ctx.arc(view.X(a.x), view.Y(a.y), Math.max(1, R * Math.abs(c) * 1.6), 0, 7);
        ctx.fillStyle = CQ.alpha(c >= 0 ? '--c2' : '--c1', 0.55); ctx.fill();
        ctx.strokeStyle = CQ.col(c >= 0 ? '--c2' : '--c1'); ctx.lineWidth = 1.2; ctx.stroke();
      }
      CQ.draw.atom(ctx, view.X(a.x), view.Y(a.y), Math.max(5, R * 0.28), a.s, { label: true });
    });
    return view;
  }

  /* ======================================================================
     11.1 Cadenas
     ====================================================================== */
  CQ.defineSim('huckel-cadena', function (sim) {
    sim.cols2();
    const cl = sim.canvas({ aspect: 0.9 });
    const cg = sim.canvas({ aspect: 0.9 });
    const cm = sim.canvas({ aspect: 4.5, cls: 'full' });
    sim.group('Cadena');
    sim.slider('N', { label: 'Número de átomos <i>N</i>', min: 2, max: 40, value: 8, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('dl', { label: 'Alternancia de enlaces δ (β = −1 ± δ)', min: 0, max: 0.6, value: 0, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('D', { label: 'Alternancia de sitios Δ (α = ±Δ/2)', min: 0, max: 3, value: 0, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('k', { label: 'Orbital dibujado (1 = el más bajo)', min: 1, max: 40, value: 4, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('ho', 'HOMO / LUMO');
    sim.out('gap', 'Brecha HOMO–LUMO', { hl: true });
    sim.out('ex', 'Fórmula 2|β|cos(kπ/(N+1)) (sin alternancias)');
    const solve = (N, dl, D) => {
      const H = LA.zeros(N);
      for (let i = 0; i < N; i++) { H[i][i] = i % 2 ? -D / 2 : D / 2; if (i < N - 1) { const b = -1 + (i % 2 ? -dl : dl); H[i][i + 1] = H[i + 1][i] = b; } }
      return LA.eigh(H);
    };
    sim.onDraw(() => {
      const N = sim.p.N, dl = sim.p.dl, D = sim.p.D;
      const r = solve(N, dl, D);
      const ne = N, ho = Math.ceil(ne / 2) - 1, lu = ho + 1;
      const kk = Math.min(sim.p.k, N) - 1;
      CQ.draw.clear(cl);
      const pl = new CQ.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 0, xmax: 1, ymin: -2.6 - D / 2, ymax: 2.6 + D / 2, xticks: [], ylabel: 'E (|β|)', mb: 14, title: `niveles (${N} electrones π)` });
      pl.frame();
      pl.band(0, 1, { color: '--c1', alpha: 0.04 });
      Array.from(r.values).forEach((E, i) => {
        CQ.drawLevels(pl, [{ E, x0: 0.25, x1: 0.75, color: i === kk ? '--accent' : i <= ho ? '--c1' : '--ink-3', width: i === kk ? 2.6 : 1.4 }]);
        if (i <= ho && N <= 20) { const occ = 2 * (i + 1) <= ne ? 2 : 1; CQ.drawMOcolumn(pl, 0.85, 0.1, E, { occ, color: '--c1' }); }
      });
      pl.hline(-2, { color: '--ink-3', dash: [3, 3] }); pl.hline(2, { color: '--ink-3', dash: [3, 3] });
      /* brecha frente a N */
      CQ.draw.clear(cg);
      const pg = new CQ.Plot(cg.ctx, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: 0, xmax: 41, ymin: 0, ymax: 2.2 + D, xlabel: 'N (par)', ylabel: 'brecha (|β|)', title: 'la brecha frente a la longitud' });
      pg.frame();
      const pts = [];
      for (let n = 2; n <= 40; n += 2) { const e = solve(n, dl, D).values; pts.push([n, e[n / 2] - e[n / 2 - 1]]); }
      pg.path(pts, { color: '--c3', width: 2 });
      pts.forEach(([n, g]) => pg.dot(n, g, { color: n === N ? '--accent' : '--c3', r: n === N ? 5 : 3 }));
      /* cadena infinita: brecha = 2√(Δ²/4 + |β₁ − β₂|²) = √(Δ² + 16δ²) */
      if (dl > 0 || D > 0) pg.hline(Math.sqrt(D * D + 16 * dl * dl), { color: '--ink-3', label: 'límite N → ∞' });
      /* orbital dibujado sobre la cadena */
      CQ.draw.clear(cm);
      const mol = { atoms: Array.from({ length: N }, (_, i) => ({ s: D > 0 ? (i % 2 ? 'N' : 'B') : 'C', x: i * 0.866, y: i % 2 ? 0.25 : -0.25 })), bonds: Array.from({ length: N - 1 }, (_, i) => [i, i + 1]) };
      drawMolecule(cm, mol, r.vectors.map((row) => row[kk]));
      sim.set('ho', `${f3(r.values[ho])} / ${f3(r.values[lu] !== undefined ? r.values[lu] : NaN)}`);
      sim.set('gap', r.values[lu] !== undefined ? f3(r.values[lu] - r.values[ho]) + ' |β|' : '—');
      sim.set('ex', dl === 0 && D === 0 && N % 2 === 0 ? f3(4 * Math.cos(((N / 2) * Math.PI) / (N + 1))) + ' |β|' : '—');
    });
  });

  /* ======================================================================
     11.2 Moléculas de la biblioteca
     ====================================================================== */
  CQ.defineSim('huckel-molecula', function (sim) {
    sim.cols2();
    const cl = sim.canvas({ aspect: 0.9 });
    const cm = sim.canvas({ aspect: 0.9 });
    const LIB = MOL.LIBRARY;
    sim.group('Molécula');
    sim.select('mol', { options: Object.keys(LIB).map((k) => [k, LIB[k].name]), value: 'benceno' });
    sim.slider('D', { label: 'Δ = α<sub>B</sub> − α<sub>N</sub> (solo borazina)', min: 0, max: 4, value: 2, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('k', { label: 'Orbital dibujado (1 = el más bajo)', min: 1, max: 10, value: 3, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('Epi', 'Energía π total', { hl: true });
    sim.out('gap', 'Brecha HOMO–LUMO');
    sim.out('Ek', 'Energía del orbital dibujado');
    sim.out('wN', 'Peso del orbital en N (borazina)');
    sim.onDraw(() => {
      const mol = LIB[sim.p.mol].make();
      const par = { alpha: { C: 0, B: sim.p.D / 2, N: -sim.p.D / 2 }, beta: { default: -1 } };
      const r = MOL.huckel(mol, par);
      const N = mol.atoms.length, ne = N, ho = Math.ceil(ne / 2) - 1;
      const k = Math.min(sim.p.k, N) - 1;
      CQ.draw.clear(cl);
      const lo = Math.min(...r.E) - 0.5, hi = Math.max(...r.E) + 0.5;
      const pl = new CQ.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 0, xmax: 1, ymin: lo, ymax: hi, xticks: [], ylabel: 'E (|β|)', mb: 14, title: 'niveles π (α_C = 0, β = −1)' });
      pl.frame();
      /* niveles agrupando degeneraciones */
      const groups = [];
      r.E.forEach((E, i) => { const g = groups.find((q) => Math.abs(q.E - E) < 1e-6); if (g) g.idx.push(i); else groups.push({ E, idx: [i] }); });
      let filled = ne;
      for (const g of groups) {
        const n = g.idx.length;
        g.idx.forEach((i, q) => {
          const xc = 0.5 + (q - (n - 1) / 2) * 0.22;
          CQ.drawLevels(pl, [{ E: g.E, x0: xc - 0.09, x1: xc + 0.09, color: i === k ? '--accent' : i <= ho ? '--c1' : '--ink-3', width: i === k ? 2.6 : 1.8 }]);
          const occ = Math.min(2, Math.max(0, filled)); filled -= occ;
          if (occ) CQ.drawMOcolumn(pl, xc, 0.18, g.E, { occ, color: '--c1' });
        });
        pl.label(0.95, g.E, CQ.fix(g.E, 3), { size: 10.5, color: '--ink-3', align: 'right', mono: true, dy: -4 });
      }
      CQ.draw.clear(cm);
      drawMolecule(cm, mol, r.C.map((row) => row[k]));
      CQ.text(cm.ctx, `orbital ${k + 1}: E = ${CQ.fix(r.E[k], 3)} |β|`, 10, 18, { size: 12, color: '--ink-2', halo: true });
      const Epi = r.E.slice(0, Math.floor(ne / 2)).reduce((s, e) => s + 2 * e, 0) + (ne % 2 ? r.E[Math.floor(ne / 2)] : 0);
      const wN = mol.atoms.reduce((s, a, i) => s + (a.s === 'N' ? r.C[i][k] ** 2 : 0), 0);
      sim.set('Epi', f3(Epi) + ' |β|');
      sim.set('gap', f3(r.E[ho + 1] - r.E[ho]) + ' |β|');
      sim.set('Ek', f3(r.E[k]) + ' |β|');
      sim.set('wN', sim.p.mol === 'borazina' ? CQ.fix(100 * wN, 1) + ' %' : '—');
    });
  });

  /* ======================================================================
     11.3 Anillos de N átomos: de los niveles a la banda
     ====================================================================== */
  CQ.defineSim('huckel-anillo', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Anillo');
    sim.slider('N', { label: 'Número de átomos <i>N</i>', min: 3, max: 80, value: 12, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('D', { label: 'Alternancia de sitios Δ (requiere N par)', min: 0, max: 3, value: 0, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.out('w', 'Ancho total ocupado por los niveles');
    sim.out('gap', 'Brecha en el centro', { hl: true });
    sim.onDraw(() => {
      const N = sim.p.N, D = N % 2 ? 0 : sim.p.D;
      const eps = Array.from({ length: N }, (_, i) => (i % 2 ? -D / 2 : D / 2));
      const r = P.tb.ringTB(eps, 1);
      CQ.draw.clear(cv);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -Math.PI, xmax: Math.PI, xpi: true, ymin: -2.4 - D / 2, ymax: 2.4 + D / 2, xlabel: 'número de onda k (en unidades de 1/a)', ylabel: 'E (|β|)' });
      pl.frame();
      if (D === 0) {
        pl.fn((k) => -2 * Math.cos(k), { color: '--c1', width: 1.6, dash: [5, 4] });
        for (let m = 0; m < N; m++) { let k = (2 * Math.PI * m) / N; if (k > Math.PI) k -= 2 * Math.PI; pl.dot(k, -2 * Math.cos(k), { color: '--c1', r: 4 }); }
      } else {
        /* celda de dos sitios (constante 2a): |1 + e^{2ika}|² = 4cos²(ka), zona reducida |k| ≤ π/2a */
        const band = (k, s) => s * Math.sqrt((D * D) / 4 + (2 * Math.cos(k)) ** 2);
        pl.fn((k) => band(k, -1), { color: '--c1', width: 1.6, dash: [5, 4], from: -Math.PI / 2, to: Math.PI / 2 });
        pl.fn((k) => band(k, 1), { color: '--c2', width: 1.6, dash: [5, 4], from: -Math.PI / 2, to: Math.PI / 2 });
        for (let m = 0; m < N / 2; m++) { let k = (2 * Math.PI * m) / N; if (k > Math.PI / 2) k -= Math.PI; pl.dot(k, band(k, -1), { color: '--c1', r: 4 }); pl.dot(k, band(k, 1), { color: '--c2', r: 4 }); }
        pl.vline(-Math.PI / 2, { color: '--ink-3' }); pl.vline(Math.PI / 2, { color: '--ink-3' });
      }
      /* niveles numéricos a la derecha */
      pl.clip((ctx) => { ctx.strokeStyle = CQ.col('--accent'); ctx.lineWidth = 1.5; for (const E of r.values) { ctx.beginPath(); ctx.moveTo(pl.X(Math.PI) - 26, pl.Y(E)); ctx.lineTo(pl.X(Math.PI) - 4, pl.Y(E)); ctx.stroke(); } });
      const v = Array.from(r.values);
      const mid = N % 2 ? NaN : v[N / 2] - v[N / 2 - 1];
      sim.set('w', f3(v[N - 1] - v[0]) + ' |β|');
      sim.set('gap', isFinite(mid) ? f3(mid) + ' |β|' : 'N impar');
    });
  });
})();
