/* Capítulo 24 — Enlace químico: H₂⁺, Hückel y orbitales moleculares */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, B = FQ.bond, Q = FQ.qm, EV = Q.HARTREE_EV;

  /* 24.1 H₂⁺ con LCAO */
  EM.defineSim('h2plus', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('R', { label: 'Distancia internuclear R', min: 0.6, max: 8, step: 0.02, value: 2.5, unit: 'bohr', fmt: (v) => v.toFixed(2) });
    sim.check('opt', { label: 'Optimizar el exponente ζ de los orbitales 1s en cada R', value: false });
    sim.out('E', '<i>E</i>(σ<sub>g</sub>) · <i>E</i>(σ<sub>u</sub>) a este <i>R</i> (hartree, con repulsión nuclear 1/<i>R</i>)', { hl: true });
    sim.out('S', 'Solapamiento <i>S</i> · Coulomb <i>J</i> · intercambio <i>K</i> · ζ');
    sim.out('min', 'Mínimo de σ<sub>g</sub>: <i>R</i><sub>e</sub> · <i>E</i> · energía de disociación <i>D</i><sub>e</sub> (exacto: 2.00 bohr, −0.6026 Eh, 2.79 eV)');
    const m1 = B.h2pMin(false), m2 = B.h2pMin(true);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, R = p.R, opt = !!p.opt;
      EM.draw.clear(cv);
      const zOf = (r) => (opt ? (() => { let a = 0.5, b = 2.5; const g = 0.618034; let c = b - g * (b - a), d = a + g * (b - a); for (let i = 0; i < 60; i++) { if (B.h2p(r, c).Eg < B.h2p(r, d).Eg) b = d; else a = c; c = b - g * (b - a); d = a + g * (b - a); } return 0.5 * (a + b); })() : 1);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.56, h: H, xmin: 0.6, xmax: 8, ymin: -0.65, ymax: 0.3, xlabel: 'R (bohr)', ylabel: 'energía total (hartree)', ml: 56, title: 'Curvas de energía potencial' });
      pl.frame(); pl.hline(-0.5, { color: '--ink-3', dash: [4, 3], label: 'H + H⁺' });
      const Rs = Array.from({ length: 200 }, (_, i) => 0.6 + (7.4 * i) / 199);
      pl.xy(Rs, Rs.map((r) => B.h2p(r, zOf(r)).Eg), { color: '--c1', width: 2.8 }); pl.xy(Rs, Rs.map((r) => B.h2p(r, zOf(r)).Eu), { color: '--c2', width: 2.8 });
      pl.dot(2.0, -0.6026, { color: '--accent', r: 5 }); pl.vline(R, { color: '--ink-3', dash: [3, 3] });
      pl.legend([{ label: 'σg (enlazante)', color: '--c1' }, { label: 'σu* (antienlazante)', color: '--c2' }, { label: 'exacto (Bates, 1953)', color: '--accent', kind: 'dot' }], 'tr');
      const z = zOf(R), h = B.h2p(R, z), xs = Array.from({ length: 300 }, (_, i) => -5 + (10 * i) / 299);
      const pl2 = new EM.Plot(ctx, { x: W * 0.59, y: 0, w: W * 0.41, h: H, xmin: -5, xmax: 5, ymin: -0.6, ymax: 0.6, xlabel: 'posición en el eje (bohr)', ylabel: 'ψ', ml: 40, mr: 8, title: 'Orbitales a este R' });
      pl2.frame(); pl2.hline(0, { color: '--ink-3' }); pl2.xy(xs, xs.map((x) => B.h2pPsi(R, z, 1, x)), { color: '--c1', width: 2.4 }); pl2.xy(xs, xs.map((x) => B.h2pPsi(R, z, -1, x)), { color: '--c2', width: 2.4 }); pl2.dot(-R / 2, 0, { color: '--ink', r: 4 }); pl2.dot(R / 2, 0, { color: '--ink', r: 4 });
      const m = opt ? m2 : m1;
      sim.set('E', EM.fix(h.Eg, 4) + ' · ' + EM.fix(h.Eu, 4));
      sim.set('S', EM.fix(h.S, 3) + ' · ' + EM.fix(h.J, 3) + ' · ' + EM.fix(h.K, 3) + ' · ' + EM.fix(z, 3));
      sim.set('min', EM.fix(m.R, 2) + ' bohr · ' + EM.fix(m.E, 4) + ' Eh · ' + EM.fix((-0.5 - m.E) * EV, 2) + ' eV');
    });
  });

  /* 24.2 Hückel */
  const MOLS = { eteno: ['Eteno (2 C)', () => B.chain(2), 2], alilo: ['Alilo (3 C): catión, radical o anión', () => B.chain(3), 3], butadieno: ['1,3-Butadieno', () => B.chain(4), 4], ciclobutadieno: ['Ciclobutadieno', () => B.ring(4), 4], hexatrieno: ['1,3,5-Hexatrieno', () => B.chain(6), 6], benceno: ['Benceno', () => B.ring(6), 6], naftaleno: ['Naftaleno', () => B.naphthalene(), 10], octatetraeno: ['Octatetraeno', () => B.chain(8), 8], ciclooctatetraeno: ['Ciclooctatetraeno (plano)', () => B.ring(8), 8] };
  EM.defineSim('huckel', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Sistema π', options: Object.entries(MOLS).map(([k, v]) => [k, v[0]]), value: 'benceno' });
    sim.slider('dn', { label: 'Carga: electrones π añadidos (−) o quitados (+)', min: -2, max: 2, step: 1, value: 0, fmt: (v) => (v > 0 ? '−' + v : v < 0 ? '+' + (-v) : '0') });
    sim.slider('beta', { label: 'Integral de resonancia |β|', min: 1, max: 5, step: 0.05, value: 3, unit: 'eV', fmt: (v) => v.toFixed(2) });
    sim.out('E', 'Energía π total <i>E</i><sub>π</sub> = <i>nα</i> + (Σ<i>n</i><sub>i</sub><i>x</i><sub>i</sub>)β · energía de deslocalización (frente a enlaces dobles aislados)', { hl: true });
    sim.out('g', 'Brecha HOMO–LUMO en |β| · en eV · longitud de onda de la primera transición');
    sim.out('bo', 'Orden de enlace de Coulson de los primeros enlaces (1–2, 2–3) · carga π del átomo 1');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, mk, ne0] = MOLS[p.m], adj = mk(), n = adj.length, N = Math.max(1, ne0 + Math.round(p.dn)), h = B.huckel(adj, N);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 1, ymin: -n * 0 - 2.8, ymax: 2.8, xlabel: '', ylabel: '(E − α)/β → arriba = más ligado (β < 0)', ml: 60, title: 'Niveles π' });
      pl.frame(); const grp = {}; h.x.forEach((x, k) => { const key = x.toFixed(4); (grp[key] = grp[key] || []).push(k); });
      Object.values(grp).forEach((ks) => { const x = h.x[ks[0]], w = 0.7 / ks.length; ks.forEach((k, i) => { const x0 = 0.15 + i * w; pl.path([[x0, x], [x0 + w * 0.85, x]], { color: '--ink-3', width: 3 }); const o = h.occ[k]; if (o > 0) EM.text(ctx, o >= 2 * 0.999 ? '↑↓' : '↑', pl.X(x0 + w * 0.42), pl.Y(x) - 6, { size: 12, align: 'center', color: '--accent' }); }); });
      /* disposición de los átomos y orbital HOMO */
      const ringQ = p.m === 'benceno' || p.m === 'ciclobutadieno' || p.m === 'ciclooctatetraeno', cx = W * 0.76, cy = H / 2, Rr = Math.min(W * 0.2, H * 0.34);
      let pos;
      if (p.m === 'naftaleno') { const a = [[0, 0], [1, 0.5], [2, 0], [2, -1], [1, -1.5], [0, -1]]; pos = [[-1, 0.5], [0, 1], [1, 0.5], [1, -0.5], [0, -1], [-1, -0.5], [-2, 1], [-3, 0.5], [-3, -0.5], [-2, -1]].map(([x, y]) => [x * 0 + x, y]); pos = [[0.5, 1], [1.5, 0.5], [1.5, -0.5], [0.5, -1], [-0.5, -0.5], [-0.5, 0.5], [-1.5, 1], [-2.5, 0.5], [-2.5, -0.5], [-1.5, -1]].map(([x, y]) => [x * 0.9, y * 0.9]); pos = pos.map(([x, y]) => [x, y]); }
      else if (ringQ) pos = Array.from({ length: n }, (_, i) => [Math.cos((2 * Math.PI * i) / n), Math.sin((2 * Math.PI * i) / n)]);
      else pos = Array.from({ length: n }, (_, i) => [(i - (n - 1) / 2) * (2 / Math.max(3, n - 1)) * 1.4, i % 2 ? 0.25 : -0.25]);
      const sc = p.m === 'naftaleno' ? Rr * 0.6 : ringQ ? Rr : Math.min(Rr, (W * 0.22) / Math.max(1, (n - 1) / 2 * 0.7));
      const P = (i) => [cx + pos[i][0] * sc, cy - pos[i][1] * sc];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (adj[i][j]) { const a = P(i), b = P(j); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1 + 4 * Math.abs(h.bo(i, j)); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      const k = Math.max(0, h.homo);
      for (let i = 0; i < n; i++) { const a = P(i), c = h.C[k][i], r = 4 + 16 * Math.abs(c); ctx.fillStyle = c >= 0 ? EM.alpha('--c1', 0.75) : EM.alpha('--c2', 0.75); ctx.beginPath(); ctx.arc(a[0], a[1], r, 0, 2 * Math.PI); ctx.fill(); }
      EM.text(ctx, 'HOMO: tamaño ∝ |c|, color = signo; grosor del enlace ∝ orden de enlace π', cx, H - 10, { size: 11, align: 'center', color: '--ink-3' });
      const Eloc = N * 0 + h.Epi, ndb = Math.floor(N / 2), deloc = Epi_deloc(h, N), gap = h.lumo >= 0 ? h.x[h.homo] - h.x[h.lumo] : 0, bi = p.beta;
      function Epi_deloc(hh, NN) { return hh.Epi - 2 * Math.floor(NN / 2) * 1; }
      sim.set('E', EM.fix(N, 0) + 'α + ' + EM.fix(h.Epi, 3) + 'β · ' + EM.fix(deloc, 3) + 'β  (' + EM.fix(deloc * bi, 2) + ' eV si |β| = ' + EM.fix(bi, 2) + ')');
      sim.set('g', h.lumo >= 0 ? EM.fix(gap, 3) + ' · ' + EM.fix(gap * bi, 2) + ' eV · ' + (gap * bi > 0.01 ? EM.fix(1239.84 / (gap * bi), 0) + ' nm' : '∞ (capa abierta o degenerada)') : '—');
      sim.set('bo', EM.fix(h.bo(0, 1), 3) + ' · ' + EM.fix(h.bo(1, 2 % n), 3) + ' · ' + EM.fix(h.q[0], 3));
    });
  });

  /* 24.3 Diatómicas homonucleares del segundo período */
  EM.defineSim('diatomicas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('N', { label: 'Electrones de valencia (2s, 2p)', min: 1, max: 15, step: 1, value: 12, fmt: (v) => v.toFixed(0) });
    sim.out('bo', 'Orden de enlace (<i>n</i><sub>enlazantes</sub> − <i>n</i><sub>antienlazantes</sub>)/2 · electrones desapareados', { hl: true });
    sim.out('ex', 'Moléculas de referencia con esta cuenta (NIST: <i>r</i><sub>e</sub> en Å y <i>D</i><sub>0</sub> en eV)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, N = Math.round(p.N), swap = N >= 12, d = B.dia(N, swap);
      EM.draw.clear(cv);
      const lv = d.levels, ys = [0.1, 0.27, swap ? 0.45 : 0.45, 0.63, 0.78, 0.92], order = lv.map((l, i) => ({ l, y: H * (0.9 - 0.14 * i) })), cx = W * 0.27;
      order.forEach(({ l, y }) => { const w = 48; for (let g = 0; g < l.g; g++) { const x0 = cx - (l.g * (w + 10)) / 2 + g * (w + 10); ctx.strokeStyle = EM.col(l.nm.includes('*') ? '--c2' : '--c1'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke(); const o = l.occ[g]; EM.text(ctx, o === 2 ? '↑↓' : o === 1 ? '↑' : '', x0 + w / 2, y - 7, { size: 14, align: 'center', color: '--ink' }); } EM.text(ctx, l.nm, cx + (l.g * 58) / 2 + 28, y + 4, { size: 12, color: '--ink-2' }); });
      EM.text(ctx, 'energía ↑', 10, 16, { size: 11, color: '--ink-3' });
      const dat = Object.entries(B.DIA).map(([k, [n, r, D]]) => ({ k, bo: B.dia(n, n >= 12).bondOrder, r, D, n }));
      const pl = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0.5, xmax: 3.5, ymin: 0, ymax: 11, xlabel: 'orden de enlace', ylabel: 'D₀ (eV)', ml: 44, mr: 8, title: 'Orden de enlace y energía de disociación' });
      pl.frame(); dat.forEach((q) => { pl.dot(q.bo, q.D, { color: '--c1', r: 6 }); EM.text(ctx, q.k, pl.X(q.bo) + 8, pl.Y(q.D) - 6, { size: 11, color: '--ink-2' }); });
      if (dat.some((q) => q.n === N)) { const q = dat.find((q) => q.n === N); pl.dot(q.bo, q.D, { color: '--accent', r: 9 }); }
      const known = dat.filter((q) => q.n === N).map((q) => `${q.k}: ${q.r} Å, ${q.D} eV`).join('; ');
      sim.set('bo', EM.fix(d.bondOrder, 1) + ' · ' + d.unpaired + (d.unpaired ? ' (paramagnética)' : ' (diamagnética)'));
      sim.set('ex', known || (N === 4 ? 'Be₂: orden 0, no existe como molécula estable (D₀ ≈ 0.1 eV, van der Waals)' : N === 11 ? 'O₂⁺: orden 2.5, r_e 1.116 Å' : N === 13 ? 'O₂⁻ (superóxido): orden 1.5, r_e 1.34 Å' : N === 15 ? 'Ne₂: orden 0' : '—'));
    });
  });
})();
