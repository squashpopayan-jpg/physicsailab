/* Capítulo 14 — Grafeno, h-BN y h-BNC (modelo π de enlace fuerte, eV y Å) */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, TB = P.tb, LA = P.la;
  const f3 = (v) => CQ.fix(v, 3);
  const HBAR = 6.582119569e-16;

  /* ======================================================================
     14.1 Superficies E±(k)
     ====================================================================== */
  CQ.defineSim('bandas-panal-3d', function (sim) {
    const cv = sim.canvas({ aspect: 1.3 });
    const v3 = new CQ.View3D(sim, cv, { radius: 1.9, az: M.rad(-55), el: M.rad(24) });
    sim.group('Parámetros (eV)');
    sim.slider('D', { label: 'Δ = ε<sub>B</sub> − ε<sub>N</sub> (0: grafeno)', min: 0, max: 6, value: 0, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('t', { label: 'Salto <i>t</i>', min: 1.5, max: 3.2, value: 2.7, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.check('lo', { label: 'Banda de valencia', value: true });
    sim.check('hi', { label: 'Banda de conducción', value: true });
    sim.out('gap', 'Brecha en K', { hl: true });
    sim.out('W', 'Ancho total de las bandas π');
    sim.onDraw(() => {
      const lat = TB.honeycomb(1.42), Kn = Math.hypot(...lat.K);
      const D = sim.p.D, t = sim.p.t;
      const sc = 0.12;
      v3.begin();
      const R = 1.25;
      const hex = Array.from({ length: 7 }, (_, q) => [Math.cos((q * Math.PI) / 3), Math.sin((q * Math.PI) / 3), -1.2]);
      v3.polyline(hex, { color: '--accent', width: 1.6 });
      for (let q = 0; q < 6; q++) v3.text([hex[q][0] * 1.12, hex[q][1] * 1.12, -1.2], q % 2 ? "K'" : 'K', { size: 12, color: '--accent', weight: 700 });
      const E = (x, y, s) => TB.bands2(x * Kn, y * Kn, lat, D / 2, -D / 2, t)[s];
      const col = (z, base) => base;
      if (sim.p.lo) v3.mesh((x, y) => [x, y, E(x, y, 0) * sc], -R, R, 40, -R, R, 40, { fillFn: () => col(0, '--c1'), alpha: 0.85, seam: true });
      if (sim.p.hi) v3.mesh((x, y) => [x, y, E(x, y, 1) * sc], -R, R, 40, -R, R, 40, { fillFn: () => col(0, '--c2'), alpha: 0.85, seam: true });
      v3.arrow([-R - 0.2, -R - 0.2, -1.2], [-R + 0.4, -R - 0.2, -1.2], { color: '--axis', width: 1.4, head: 8 });
      v3.arrow([-R - 0.2, -R - 0.2, -1.2], [-R - 0.2, -R + 0.4, -1.2], { color: '--axis', width: 1.4, head: 8 });
      v3.text([-R + 0.55, -R - 0.2, -1.2], 'k_x', { size: 12, italic: true });
      v3.text([-R - 0.2, -R + 0.55, -1.2], 'k_y', { size: 12, italic: true });
      v3.render();
      const b = TB.bands2(lat.K[0], lat.K[1], lat, D / 2, -D / 2, t), g = TB.bands2(0, 0, lat, D / 2, -D / 2, t);
      sim.set('gap', f3(b[1] - b[0]) + ' eV');
      sim.set('W', f3(g[1] - g[0]) + ' eV');
    });
  });

  /* ======================================================================
     14.2 Bandas en el camino Γ–K–M–Γ y densidad de estados
     ====================================================================== */
  CQ.defineSim('bandas-camino', function (sim) {
    sim.cols2();
    const cb = sim.canvas({ aspect: 0.85 });
    const cd = sim.canvas({ aspect: 0.85 });
    const PRE = { gr: ['Grafeno', 2.7, 0, 1.42], bn: ['h-BN', 2.3, 4.6, 1.446], bnc: ['h-BNC (promedio ilustrativo)', 2.5, 2.3, 1.43] };
    sim.group('Material');
    sim.select('pre', { options: Object.keys(PRE).map((k) => [k, PRE[k][0]]), value: 'bn', onInput: (v) => { sim.ctl.t.set(PRE[v][1], true); sim.ctl.D.set(PRE[v][2], true); } });
    sim.slider('t', { label: 'Salto <i>t</i>', min: 1.5, max: 3.2, value: 2.3, step: 0.05, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.slider('D', { label: 'Δ = ε<sub>B</sub> − ε<sub>N</sub>', min: 0, max: 6, value: 4.6, step: 0.05, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.out('gap', 'Brecha (directa en K)', { hl: true });
    sim.out('vF', 'Pendiente en K → <i>v</i><sub>F</sub>');
    sim.out('vFf', '3<i>td</i>/2ħ');
    sim.out('ms', 'Masa efectiva en K (si Δ > 0)');
    sim.out('wN', 'Peso de la banda de valencia en N, en K');
    let dosCache = { key: '' };
    sim.onDraw(() => {
      const d = PRE[sim.p.pre][3], lat = TB.honeycomb(d), t = sim.p.t, D = sim.p.D;
      const path = TB.path(lat, 90);
      const Emax = 3 * t + D / 2 + 0.5;
      CQ.draw.clear(cb);
      const pl = new CQ.Plot(cb.ctx, { x: 0, y: 0, w: cb.w, h: cb.h, xmin: 0, xmax: path.s[path.s.length - 1], ymin: -Emax, ymax: Emax, xticks: path.ticks.map((q) => q.s), xfmt: (v) => ((path.ticks.find((q) => Math.abs(q.s - v) < 1e-9) || {}).label || '').replace('G', 'Γ'), ylabel: 'E (eV)', xlabel: 'camino en la zona de Brillouin' });
      pl.frame();
      const lo = [], hi = [];
      path.k.forEach((k, i) => { const b = TB.bands2(k[0], k[1], lat, D / 2, -D / 2, t); lo.push([path.s[i], b[0]]); hi.push([path.s[i], b[1]]); });
      pl.band(0, path.s[path.s.length - 1], { color: '--c1', alpha: 0 });
      pl.path(lo, { color: '--c1', width: 2.6 });
      pl.path(hi, { color: '--c2', width: 2.6 });
      pl.hline(0, { color: '--ink-3', label: 'E_F (mitad de la brecha)' });
      path.ticks.forEach((q) => pl.vline(q.s, { color: '--grid-2', dash: [] }));
      /* DOS */
      const key = `${t}|${D}|${d}`;
      if (dosCache.key !== key) dosCache = { key, r: TB.dos((kx, ky) => TB.bands2(kx, ky, lat, D / 2, -D / 2, t).slice(0, 2), lat, { nk: 180, ne: 360, sigma: 0.06, emin: -Emax, emax: Emax }) };
      const r = dosCache.r;
      CQ.draw.clear(cd);
      const gmax = Math.max(...r.dos) * 1.1;
      const pd = new CQ.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: 0, xmax: gmax, ymin: -Emax, ymax: Emax, xlabel: 'g(E) (estados/eV/celda)', ylabel: '' });
      pd.frame();
      pd.clip((ctx) => {
        ctx.beginPath(); ctx.moveTo(pd.X(0), pd.Y(r.E[0]));
        for (let i = 0; i < r.E.length; i++) ctx.lineTo(pd.X(r.dos[i]), pd.Y(r.E[i]));
        ctx.lineTo(pd.X(0), pd.Y(r.E[r.E.length - 1])); ctx.closePath();
        ctx.fillStyle = CQ.alpha('--c3', 0.18); ctx.fill();
        ctx.strokeStyle = CQ.col('--c3'); ctx.lineWidth = 1.8; ctx.stroke();
      });
      pd.hline(0, { color: '--ink-3' });
      /* lecturas */
      const bK = TB.bands2(lat.K[0], lat.K[1], lat, D / 2, -D / 2, t);
      const q = 1e-4, bq = TB.bands2(lat.K[0] + q, lat.K[1], lat, D / 2, -D / 2, t);
      const slope = (bq[1] - bK[1]) / q;
      const curv = (TB.bands2(lat.K[0] + 0.01, lat.K[1], lat, D / 2, -D / 2, t)[1] - bK[1]) / 1e-4; /* ≈ ħ²/2m* en eV·Å² */
      /* en K, f = 0: la banda de valencia es exactamente el orbital del N si Δ > 0 */
      const wN = D > 0 ? 1 : 0.5;
      sim.set('gap', f3(bK[1] - bK[0]) + ' eV');
      sim.set('vF', D === 0 ? CQ.si(((slope * 1e-10) / HBAR), 'm/s') : 'parabólica (Δ > 0)');
      sim.set('vFf', CQ.si((3 * t * d * 1e-10) / (2 * HBAR), 'm/s'));
      sim.set('ms', D > 0 ? CQ.fix(3.80998 / curv, 3) + ' mₑ' : '— (sin masa)');
      sim.set('wN', CQ.fix(100 * wN, 0) + ' %');
    });
  });

  /* ======================================================================
     14.3 Nanocintas
     ====================================================================== */
  CQ.defineSim('nanocinta', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 0.75 });
    const cb = sim.canvas({ aspect: 0.75 });
    sim.group('Nanocinta');
    sim.seg('kind', { label: 'Borde', options: [['zigzag', 'zigzag'], ['armchair', 'armchair']], value: 'zigzag' });
    sim.seg('mat', { label: 'Material', options: [['gr', 'grafeno'], ['bn', 'h-BN']], value: 'gr' });
    sim.slider('W', { label: 'Ancho <i>W</i> (cadenas o líneas de dímeros)', min: 2, max: 16, value: 8, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('na', 'Átomos por celda');
    sim.out('gap', 'Brecha', { hl: true });
    sim.out('edge', 'Bandas con > 50 % de peso en los bordes (en k = π)');
    let cache = { key: '' };
    const compute = () => {
      const { kind, mat, W } = sim.p;
      const gr = mat === 'gr', d = gr ? 1.42 : 1.446;
      const cell = kind === 'zigzag' ? TB.zigzagRibbon(W, d, gr ? 'C' : 'B', gr ? 'C' : 'N') : TB.armchairRibbon(W, d, gr ? 'C' : 'B', gr ? 'C' : 'N');
      const onsite = (s) => (s === 'B' ? 2.3 : s === 'N' ? -2.3 : 0);
      const hop = (a, b) => (a === 'C' && b === 'C' ? 2.7 : 2.3);
      const n = cell.atoms.length, L = Math.hypot(...cell.T);
      const bonds = TB.bondsPeriodic(cell, 1.2 * d);
      const NK = 81, ks = [], bands = [], ew = [];
      const edgeSet = new Set(cell.atoms.map((a, i) => (a.w === 0 || a.w === W - 1 ? i : -1)).filter((i) => i >= 0));
      for (let q = 0; q < NK; q++) {
        const k = -Math.PI + (2 * Math.PI * q) / (NK - 1);
        const Re = LA.zeros(n), Im = LA.zeros(n);
        for (let i = 0; i < n; i++) Re[i][i] = onsite(cell.atoms[i].s);
        for (const b of bonds) {
          const tt = -hop(cell.atoms[b.i].s, cell.atoms[b.j].s), ph = k * b.m;
          Re[b.i][b.j] += tt * Math.cos(ph); Im[b.i][b.j] += tt * Math.sin(ph);
          Re[b.j][b.i] += tt * Math.cos(ph); Im[b.j][b.i] -= tt * Math.sin(ph);
        }
        const r = LA.eighC(Re, Im);
        ks.push(k); bands.push(Array.from(r.values));
        ew.push(Array.from(r.values, (_, c) => { let s = 0; for (const i of edgeSet) s += r.re[i][c] ** 2 + r.im[i][c] ** 2; return s; }));
      }
      return { key: `${kind}|${mat}|${W}`, cell, ks, bands, ew, n, L, d, onsite };
    };
    sim.onDraw(() => {
      const key = `${sim.p.kind}|${sim.p.mat}|${sim.p.W}`;
      if (cache.key !== key) cache = compute();
      const { cell, ks, bands, ew, n, d } = cache;
      /* estructura: dos celdas */
      CQ.draw.clear(cs);
      const pts = [], ext = [];
      for (let rep = -2; rep <= 2; rep++) cell.atoms.forEach((a) => { const q = { x: a.x + rep * cell.T[0], y: a.y + rep * cell.T[1], s: a.s, w: a.w }; ext.push(q); if (Math.abs(rep) <= 1) pts.push(q); });
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      const vw = new CQ.View2D(cs, { xmin: Math.min(...xs) - 1.5, xmax: Math.max(...xs) + 1.5, ymin: Math.min(...ys) - 1.5, ymax: Math.max(...ys) + 1.5 });
      vw.update();
      const ctx = cs.ctx;
      ctx.strokeStyle = CQ.alpha('--ink-3', 0.6); ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) < 1.15 * d) { ctx.moveTo(vw.X(pts[i].x), vw.Y(pts[i].y)); ctx.lineTo(vw.X(pts[j].x), vw.Y(pts[j].y)); }
      ctx.stroke();
      /* hidrógenos en los átomos con dos vecinos */
      for (const p of pts) {
        const nb = ext.filter((q) => q !== p && Math.hypot(q.x - p.x, q.y - p.y) < 1.15 * d);
        if (nb.length === 2) {
          const mx = nb.reduce((s, q) => s + q.x, 0) / 2 - p.x, my = nb.reduce((s, q) => s + q.y, 0) / 2 - p.y, nn = Math.hypot(mx, my) || 1;
          const hx = p.x - (mx / nn) * 1.0, hy = p.y - (my / nn) * 1.0;
          ctx.strokeStyle = CQ.alpha('--ink-3', 0.6); ctx.beginPath(); ctx.moveTo(vw.X(p.x), vw.Y(p.y)); ctx.lineTo(vw.X(hx), vw.Y(hy)); ctx.stroke();
          CQ.draw.atom(ctx, vw.X(hx), vw.Y(hy), Math.max(2, 0.16 * vw.s), 'H');
        }
      }
      for (const p of pts) CQ.draw.atom(ctx, vw.X(p.x), vw.Y(p.y), Math.max(3, 0.26 * vw.s), p.s, { label: vw.s > 26 });
      CQ.text(ctx, `celda: ${n} átomos (3 celdas dibujadas)`, 8, 16, { size: 11.5, color: '--ink-2', halo: true });
      /* bandas */
      CQ.draw.clear(cb);
      const pl = new CQ.Plot(cb.ctx, { x: 0, y: 0, w: cb.w, h: cb.h, xmin: -Math.PI, xmax: Math.PI, xpi: true, ymin: -4, ymax: 4, xlabel: 'k·T (T = periodo de la cinta)', ylabel: 'E (eV)' });
      pl.frame();
      for (let b = 0; b < n; b++) {
        for (let q = 0; q < ks.length - 1; q++) {
          const w = Math.min(1, ew[q][b] * 1.6);
          pl.clip((c2) => { c2.strokeStyle = CQ.mix(CQ.col('--ink-3'), CQ.col('--accent'), w); c2.lineWidth = 1.2 + 2 * w; c2.beginPath(); c2.moveTo(pl.X(ks[q]), pl.Y(bands[q][b])); c2.lineTo(pl.X(ks[q + 1]), pl.Y(bands[q + 1][b])); c2.stroke(); });
        }
      }
      pl.hline(0, { color: '--ink-3' });
      /* brecha alrededor de E = 0 (mitad de las bandas) */
      let vb = -Infinity, cbm = Infinity;
      bands.forEach((E) => { vb = Math.max(vb, E[n / 2 - 1]); cbm = Math.min(cbm, E[n / 2]); });
      const lastEw = ew[ew.length - 1];
      sim.set('na', String(n));
      sim.set('gap', f3(Math.max(0, cbm - vb)) + ' eV');
      sim.set('edge', String(lastEw.filter((w) => w > 0.5).length));
    });
    sim.legend([{ label: 'estado en el interior', color: '--ink-3' }, { label: 'estado en los bordes', color: '--accent' }]);
  });

  /* ======================================================================
     14.4 Copos h-BNC
     ====================================================================== */
  CQ.defineSim('copo-bnc', function (sim) {
    sim.cols2();
    const cm = sim.canvas({ aspect: 0.95 });
    const cd = sim.canvas({ aspect: 0.95 });
    sim.group('Copo hexagonal');
    sim.slider('n', { label: 'Tamaño (orden del hexágono)', min: 3, max: 7, value: 5, step: 1, fmt: (v) => `${v} · ${6 * v * v} átomos` });
    sim.slider('x', { label: 'Fracción de carbono', min: 0, max: 1, value: 0.2, step: 0.01, fmt: (v) => CQ.fix(100 * v, 0) + ' %' });
    sim.seg('dist', { label: 'Distribución del carbono', options: [['dom', 'dominio central'], ['rnd', 'al azar']], value: 'dom' });
    sim.slider('seed', { label: 'Semilla (azar)', min: 1, max: 50, value: 1, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.seg('show', { label: 'Estado dibujado', options: [['homo', 'HOMO'], ['lumo', 'LUMO']], value: 'homo' });
    sim.out('nat', 'Átomos B / N / C');
    sim.out('ne', 'Electrones π');
    sim.out('gap', 'Brecha HOMO–LUMO', { hl: true });
    sim.out('wC', 'Peso del estado dibujado en el C');
    let cache = { key: '' };
    const build = () => {
      const { n, x, dist, seed } = sim.p;
      const fl = TB.flake('hex', n, 1.44);
      const N = fl.sites.length, nC = Math.round(x * N);
      fl.sites.forEach((s) => { s.s = s.sub === 'A' ? 'B' : 'N'; });
      if (dist === 'dom') { const ord = fl.sites.map((s, i) => [Math.hypot(s.x, s.y), i]).sort((a, b) => a[0] - b[0]); for (let q = 0; q < nC; q++) fl.sites[ord[q][1]].s = 'C'; }
      else { const rng = P.rng(seed); const idx = fl.sites.map((_, i) => i); for (let i = N - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; [idx[i], idx[j]] = [idx[j], idx[i]]; } for (let q = 0; q < nC; q++) fl.sites[idx[q]].s = 'C'; }
      const onsite = (s) => (s === 'B' ? 2.3 : s === 'N' ? -2.3 : 0);
      const hop = (a, b) => (a === 'C' && b === 'C' ? 2.7 : a === 'C' || b === 'C' ? 2.5 : 2.3);
      const H = TB.flakeHamiltonian(fl, onsite, hop);
      const r = LA.eigh(H);
      const ne = fl.sites.reduce((s, a) => s + (a.s === 'N' ? 2 : a.s === 'C' ? 1 : 0), 0);
      return { key: `${n}|${x}|${dist}|${seed}`, fl, r, ne };
    };
    sim.onDraw(() => {
      const key = `${sim.p.n}|${sim.p.x}|${sim.p.dist}|${sim.p.seed}`;
      if (cache.key !== key) cache = build();
      const { fl, r, ne } = cache;
      const N = fl.sites.length;
      const iH = Math.ceil(ne / 2) - 1, iL = iH + 1;
      const st = sim.p.show === 'homo' ? iH : Math.min(N - 1, iL);
      /* mapa */
      CQ.draw.clear(cm);
      const xs = fl.sites.map((s) => s.x), ys = fl.sites.map((s) => s.y);
      const vw = new CQ.View2D(cm, { xmin: Math.min(...xs) - 1.5, xmax: Math.max(...xs) + 1.5, ymin: Math.min(...ys) - 1.5, ymax: Math.max(...ys) + 1.5 });
      vw.update();
      const ctx = cm.ctx;
      ctx.strokeStyle = CQ.alpha('--ink-3', 0.55); ctx.lineWidth = 1.4; ctx.beginPath();
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (Math.abs(fl.sites[i].x - fl.sites[j].x) < 1.8 && Math.hypot(fl.sites[i].x - fl.sites[j].x, fl.sites[i].y - fl.sites[j].y) < 1.6) { ctx.moveTo(vw.X(fl.sites[i].x), vw.Y(fl.sites[i].y)); ctx.lineTo(vw.X(fl.sites[j].x), vw.Y(fl.sites[j].y)); }
      ctx.stroke();
      let mx = 0; for (let i = 0; i < N; i++) mx = Math.max(mx, r.vectors[i][st] ** 2);
      fl.sites.forEach((s, i) => {
        const p = r.vectors[i][st] ** 2 / (mx || 1);
        if (p > 0.01) { ctx.beginPath(); ctx.arc(vw.X(s.x), vw.Y(s.y), 2 + 0.75 * vw.s * Math.sqrt(p), 0, 7); ctx.fillStyle = CQ.alpha('--accent', 0.45); ctx.fill(); }
        CQ.draw.atom(ctx, vw.X(s.x), vw.Y(s.y), Math.max(2.5, 0.25 * vw.s), s.s);
      });
      CQ.text(ctx, `${sim.p.show === 'homo' ? 'HOMO' : 'LUMO'}: E = ${CQ.fix(r.values[st], 3)} eV (círculos ∝ |c|²)`, 8, 16, { size: 11.5, color: '--ink-2', halo: true });
      /* niveles / DOS */
      CQ.draw.clear(cd);
      const pd = new CQ.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: 0, xmax: 1, ymin: -6, ymax: 6, xticks: [], ylabel: 'E (eV)', mb: 14, title: 'niveles del copo' });
      pd.frame();
      pd.clip((c2) => {
        Array.from(r.values).forEach((E, i) => {
          const wC = fl.sites.reduce((s, a, j) => s + (a.s === 'C' ? r.vectors[j][i] ** 2 : 0), 0);
          c2.strokeStyle = CQ.mix(CQ.col(i <= iH ? '--c1' : '--ink-3'), CQ.col('--atC'), wC * 0.8);
          c2.lineWidth = i === iH || i === iL ? 2.6 : 1.1;
          c2.beginPath(); c2.moveTo(pd.X(i <= iH ? 0.1 : 0.5), pd.Y(E)); c2.lineTo(pd.X(i <= iH ? 0.5 : 0.9), pd.Y(E)); c2.stroke();
        });
      });
      CQ.text(cd.ctx, 'ocupados', pd.X(0.3), pd.iy + pd.ih - 6, { size: 11, align: 'center', color: '--c1' });
      CQ.text(cd.ctx, 'vacíos', pd.X(0.7), pd.iy + 14, { size: 11, align: 'center', color: '--ink-3' });
      const cnt = { B: 0, N: 0, C: 0 }; fl.sites.forEach((s) => cnt[s.s]++);
      const wC = fl.sites.reduce((s, a, j) => s + (a.s === 'C' ? r.vectors[j][st] ** 2 : 0), 0);
      sim.set('nat', `${cnt.B} / ${cnt.N} / ${cnt.C}`);
      sim.set('ne', String(ne));
      sim.set('gap', f3(r.values[iL] - r.values[iH]) + ' eV');
      sim.set('wC', CQ.fix(100 * wC, 1) + ' %');
    });
  });
})();
