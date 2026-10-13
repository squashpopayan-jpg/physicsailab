/* Capítulo 13 — Bandas de energía */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, LA = P.la, TB = P.tb;
  const f3 = (v) => CQ.fix(v, 3);

  /* ======================================================================
     13.1 Cadena de enlace fuerte
     ====================================================================== */
  CQ.defineSim('cadena-tb', function (sim) {
    sim.cols2();
    const cb = sim.canvas({ aspect: 0.95 });
    const cd = sim.canvas({ aspect: 0.95 });
    sim.group('Cadena periódica (ε = 0)');
    sim.slider('N', { label: 'Número de átomos <i>N</i>', min: 4, max: 400, value: 40, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('t', { label: 'Salto <i>t</i>', min: 0.2, max: 3, value: 1, step: 0.05, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.slider('ne', { label: 'Electrones por átomo', min: 0, max: 2, value: 1, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.out('W', 'Ancho de banda 4<i>t</i>');
    sim.out('EF', 'Nivel de Fermi', { hl: true });
    sim.out('mst', 'Masa efectiva en el fondo (<i>a</i> = 2.5 Å)');
    sim.out('kind', 'Comportamiento', { hl: true });
    sim.onDraw(() => {
      const N = Math.round(sim.p.N), t = sim.p.t;
      const ks = [], Es = [];
      for (let m = 0; m < N; m++) { let k = (2 * Math.PI * m) / N; if (k >= Math.PI) k -= 2 * Math.PI; ks.push(k); Es.push(-2 * t * Math.cos(k)); }
      const sorted = Es.slice().sort((a, b) => a - b);
      const nel = Math.round(sim.p.ne * N);
      const nfull = Math.floor(nel / 2);
      const EF = nel === 0 ? -2 * t : nel >= 2 * N ? 2 * t : sorted[Math.min(N - 1, Math.max(0, Math.ceil(nel / 2) - 1))];
      CQ.draw.clear(cb);
      const pl = new CQ.Plot(cb.ctx, { x: 0, y: 0, w: cb.w, h: cb.h, xmin: -Math.PI, xmax: Math.PI, xpi: true, ymin: -3.3, ymax: 3.3, xlabel: 'k·a', ylabel: 'E (eV)', title: 'E(k) = −2t cos ka' });
      pl.frame();
      pl.fn((k) => -2 * t * Math.cos(k), { color: '--ink-3', width: 1.3, dash: [5, 4] });
      const order = Es.map((e, i) => i).sort((a, b) => Es[a] - Es[b]);
      const occ = new Array(N).fill(0);
      order.forEach((i, r) => { occ[i] = r < nfull ? 2 : r === nfull && nel % 2 ? 1 : 0; });
      ks.forEach((k, i) => pl.dot(k, Es[i], { color: occ[i] === 2 ? '--c1' : occ[i] === 1 ? '--c3' : '--ink-3', r: N > 120 ? 2 : 3.5 }));
      pl.hline(EF, { color: '--accent', label: 'E_F', labelRight: true });
      /* DOS */
      CQ.draw.clear(cd);
      const nb = Math.max(10, Math.min(60, Math.round(N / 4)));
      const h = P.stat.hist(Es, -2.2 * t, 2.2 * t, nb);
      const gmax = Math.max(...h.dens, 1 / (Math.PI * t * 0.4)) * 1.1;
      const pd = new CQ.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: -3.3, xmax: 3.3, ymin: 0, ymax: Math.min(gmax, 3 / t), xlabel: 'E (eV)', ylabel: 'g(E) por átomo', title: 'densidad de estados' });
      pd.frame();
      CQ.drawHist(pd, h, { color: '--c1' });
      pd.fn((E) => (Math.abs(E) < 2 * t ? 1 / (Math.PI * Math.sqrt(4 * t * t - E * E)) : 0), { color: '--ink', width: 1.8, n: 800 });
      pd.band(-3.3, EF, { color: '--c1', alpha: 0.08 });
      pd.vline(EF, { color: '--accent', label: 'E_F' });
      const a = 2.5;
      sim.set('W', f3(4 * t) + ' eV');
      sim.set('EF', f3(EF) + ' eV');
      sim.set('mst', CQ.fix(3.80998 / (t * a * a), 3) + ' mₑ');
      sim.set('kind', nel === 0 ? 'banda vacía (aislante)' : nel >= 2 * N ? 'banda llena (aislante)' : 'banda parcialmente llena (metal)');
    });
  });

  /* ======================================================================
     13.2 Cadena diatómica
     ====================================================================== */
  CQ.defineSim('cadena-diatomica', function (sim) {
    sim.cols2();
    const cb = sim.canvas({ aspect: 0.95 });
    const cw = sim.canvas({ aspect: 0.95 });
    sim.group('Celda de dos sitios (eV)');
    sim.slider('D', { label: 'Δ = ε<sub>A</sub> − ε<sub>B</sub>', min: 0, max: 6, value: 2, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('t1', { label: 'Salto dentro de la celda <i>t</i><sub>1</sub>', min: 0, max: 3, value: 1.5, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('t2', { label: 'Salto entre celdas <i>t</i><sub>2</sub>', min: 0, max: 3, value: 1.5, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('k', { label: 'k·a para la composición', min: -Math.PI, max: Math.PI, value: Math.PI, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.out('Eg', 'Brecha', { hl: true });
    sim.out('Ef', 'Fórmula 2√(Δ²/4 + (t₁ − t₂)²)');
    sim.out('Wv', 'Ancho de la banda de valencia');
    sim.out('wB', 'Peso de la banda de valencia en B (en k)');
    const bands = (k) => {
      const { D, t1, t2 } = sim.p;
      const re = t1 + t2 * Math.cos(k), im = t2 * Math.sin(k);
      const f2 = re * re + im * im, w = Math.sqrt(D * D / 4 + f2);
      /* peso en A del estado inferior: |c_A|² = f²/(f² + (εA − E₋)²) */
      const Em = -w, pA = f2 / (f2 + (D / 2 - Em) ** 2 || 1);
      return { Em, Ep: w, pAv: isFinite(pA) ? pA : 0 };
    };
    sim.onDraw(() => {
      const { D, t1, t2, k } = sim.p;
      CQ.draw.clear(cb);
      const top = D / 2 + t1 + t2 + 0.5;
      const pl = new CQ.Plot(cb.ctx, { x: 0, y: 0, w: cb.w, h: cb.h, xmin: -Math.PI, xmax: Math.PI, xpi: true, ymin: -top, ymax: top, xlabel: 'k·a (a = celda de 2 sitios)', ylabel: 'E (eV)' });
      pl.frame();
      /* color según la composición */
      pl.clip((ctx) => {
        for (let q = 0; q < 300; q++) {
          const k1 = -Math.PI + (2 * Math.PI * q) / 300, k2 = k1 + (2 * Math.PI) / 300;
          const b1 = bands(k1), b2 = bands(k2);
          const mixA = (p) => CQ.mix(CQ.col('--atN'), CQ.col('--atB'), p);
          ctx.lineWidth = 3;
          ctx.strokeStyle = mixA(b1.pAv); ctx.beginPath(); ctx.moveTo(pl.X(k1), pl.Y(b1.Em)); ctx.lineTo(pl.X(k2), pl.Y(b2.Em)); ctx.stroke();
          ctx.strokeStyle = mixA(1 - b1.pAv); ctx.beginPath(); ctx.moveTo(pl.X(k1), pl.Y(b1.Ep)); ctx.lineTo(pl.X(k2), pl.Y(b2.Ep)); ctx.stroke();
        }
      });
      pl.band(-Math.PI, Math.PI, { color: '--c1', alpha: 0.0 });
      const g = bands(Math.PI);
      pl.clip((ctx) => { ctx.fillStyle = CQ.alpha('--accent', 0.1); ctx.fillRect(pl.ix, pl.Y(g.Ep), pl.iw, pl.Y(g.Em) - pl.Y(g.Ep)); });
      pl.vline(k, { color: '--accent' });
      pl.legend([{ label: 'en el sitio A', color: '--atB' }, { label: 'en el sitio B', color: '--atN' }], 'tr');
      /* composición del estado en k */
      CQ.draw.clear(cw);
      const b = bands(k);
      const ctx = cw.ctx, W = cw.w, H = cw.h;
      [[`banda de conducción, E = ${CQ.fix(b.Ep, 2)} eV`, 1 - b.pAv, 0.12], [`banda de valencia, E = ${CQ.fix(b.Em, 2)} eV`, b.pAv, 0.56]].forEach(([title, pA, y0]) => {
        CQ.text(ctx, title, 14, H * y0, { size: 12.5, weight: 650, color: '--ink' });
        [['A', pA, '--atB'], ['B', 1 - pA, '--atN']].forEach(([lab, p, col], j) => {
          const x = 30 + j * (W * 0.45), bw = W * 0.35, bh = H * 0.24, y = H * y0 + 12;
          ctx.fillStyle = CQ.col('--surface-2'); ctx.fillRect(x, y, bw, bh);
          ctx.fillStyle = CQ.col(col); ctx.fillRect(x, y + bh * (1 - p), bw, bh * p);
          CQ.text(ctx, `${lab}: ${CQ.fix(100 * p, 1)} %`, x + bw / 2, y + bh + 16, { size: 12, align: 'center', color: '--ink-2' });
        });
      });
      let vmin = Infinity, vmax = -Infinity;
      for (let q = 0; q <= 200; q++) { const e = bands(-Math.PI + (2 * Math.PI * q) / 200).Em; vmin = Math.min(vmin, e); vmax = Math.max(vmax, e); }
      sim.set('Eg', f3(g.Ep - g.Em) + ' eV');
      sim.set('Ef', f3(2 * Math.sqrt(D * D / 4 + (t1 - t2) ** 2)) + ' eV');
      sim.set('Wv', f3(vmax - vmin) + ' eV');
      sim.set('wB', CQ.fix(100 * (1 - b.pAv), 1) + ' %');
    });
  });

  /* ======================================================================
     13.3 Electrones casi libres (base de ondas planas)
     ====================================================================== */
  CQ.defineSim('casi-libres', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.group('Potencial V(x) = 2V₁cos(2πx/a) + 2V₂cos(4πx/a)');
    sim.slider('V1', { label: '<i>V</i><sub>1</sub> (en unidades de <i>E</i><sub>0</sub>)', min: 0, max: 1.5, value: 0.3, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('V2', { label: '<i>V</i><sub>2</sub>', min: 0, max: 1, value: 0.1, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('nG', { label: 'Ondas planas en la base (2<i>n</i> + 1)', min: 1, max: 12, value: 6, step: 1, fmt: (v) => CQ.fix(2 * v + 1, 0) });
    sim.seg('zone', { label: 'Esquema de zonas', options: [['red', 'reducida'], ['ext', 'extendida']], value: 'red' });
    sim.note('<i>E</i><sub>0</sub> = ħ²(π/a)²/2m es la energía del electrón libre en el borde de la zona.');
    sim.out('g1', 'Primera brecha (en k = π/a)', { hl: true });
    sim.out('g1f', 'Aproximación 2|<i>V</i><sub>1</sub>|');
    sim.out('g2', 'Segunda brecha (en k = 0)');
    const solve = (k, nmax) => {
      const n = 2 * nmax + 1, H = LA.zeros(n);
      for (let i = 0; i < n; i++) {
        const G = 2 * (i - nmax);
        H[i][i] = (k + G) ** 2;
        if (i + 1 < n) H[i][i + 1] = H[i + 1][i] = sim.p.V1;
        if (i + 2 < n) H[i][i + 2] = H[i + 2][i] = sim.p.V2;
      }
      return Array.from(LA.eigh(H, { vectors: false }).values);
    };
    sim.onDraw(() => {
      const nmax = sim.p.nG;
      const ext = sim.p.zone === 'ext';
      CQ.draw.clear(cv);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: ext ? -3 : -1, xmax: ext ? 3 : 1, ymin: 0 - 1.5 * sim.p.V1 - 0.3, ymax: ext ? 9.5 : 9.5, xlabel: 'k (en unidades de π/a)', ylabel: 'E / E₀' });
      pl.frame();
      pl.fn((k) => k * k, { color: '--ink-3', width: 1.2, dash: [5, 4] });
      const NK = 160, nb = Math.min(5, 2 * nmax + 1);
      const series = Array.from({ length: nb }, () => []);
      for (let q = 0; q <= NK; q++) {
        const k = -1 + (2 * q) / NK;
        const E = solve(k, nmax);
        for (let b = 0; b < nb; b++) series[b].push([k, E[b]]);
      }
      const cols = ['--c1', '--c2', '--c3', '--c4', '--c5'];
      if (!ext) series.forEach((s, b) => pl.path(s, { color: cols[b], width: 2.2 }));
      else {
        /* zona extendida: la banda b se dibuja en |k| ∈ [b, b+1] (en π/a) */
        series.forEach((s, b) => {
          const pts = [];
          for (const [k, E] of s) {
            const sgn = k >= 0 ? 1 : -1;
            const kk = b % 2 === 0 ? sgn * (b + Math.abs(k)) : sgn * (b + 1 - Math.abs(k));
            pts.push([kk, E]);
          }
          const pos = pts.filter((p) => p[0] >= 0).sort((a, c) => a[0] - c[0]), neg = pts.filter((p) => p[0] <= 0).sort((a, c) => a[0] - c[0]);
          pl.path(pos, { color: cols[b], width: 2.2 }); pl.path(neg, { color: cols[b], width: 2.2 });
        });
        [-1, 1, -2, 2].forEach((x) => pl.vline(x, { color: '--ink-3' }));
      }
      if (!ext) { pl.vline(-1, { color: '--ink-3' }); pl.vline(1, { color: '--ink-3' }); }
      const Eb = solve(1, nmax), E0 = solve(0, nmax);
      sim.set('g1', f3(Eb[1] - Eb[0]) + ' E₀');
      sim.set('g1f', f3(2 * sim.p.V1) + ' E₀');
      sim.set('g2', f3(E0[2] - E0[1]) + ' E₀');
    });
  });
})();
