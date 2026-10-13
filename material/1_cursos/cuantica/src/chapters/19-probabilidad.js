/* Capítulo 19 — Probabilidad y estadística */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, ST = P.stat;
  const f3 = (v) => CQ.fix(v, 3), f4 = (v) => CQ.fix(v, 4);

  /* ======================================================================
     19.1 Límite central
     ====================================================================== */
  CQ.defineSim('limite-central', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    const DIST = {
      unif: { n: 'Uniforme en [0, 1]', s: (r) => r(), mu: 0.5, sd: Math.sqrt(1 / 12), lo: 0, hi: 1 },
      expo: { n: 'Exponencial (media 1)', s: (r) => -Math.log(1 - r()), mu: 1, sd: 1, lo: 0, hi: 5 },
      dado: { n: 'Dado de 6 caras', s: (r) => 1 + Math.floor(6 * r()), mu: 3.5, sd: Math.sqrt(35 / 12), lo: 0.5, hi: 6.5 },
      bern: { n: 'Moneda (0 o 1)', s: (r) => (r() < 0.5 ? 0 : 1), mu: 0.5, sd: 0.5, lo: -0.25, hi: 1.25 }
    };
    sim.group('Experimento');
    sim.select('d', { label: 'Distribución de cada dato', options: Object.keys(DIST).map((k) => [k, DIST[k].n]), value: 'expo' });
    sim.slider('N', { label: 'Datos promediados <i>N</i>', min: 1, max: 100, value: 5, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('rate', { label: 'Promedios por segundo', min: 10, max: 3000, value: 400, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('n', 'Promedios acumulados');
    sim.out('m', 'Media de los promedios / μ');
    sim.out('s', 'Desviación de los promedios / σ/√N', { hl: true });
    const rng = P.rng(19);
    let data = [], acc = 0;
    sim.resetButton(() => { data = []; });
    sim.onChange = (id) => { if (id !== 'rate') data = []; };
    sim.animate((dt) => {
      const D = DIST[sim.p.d];
      acc += dt * sim.p.rate;
      while (acc > 1) { acc -= 1; let s = 0; for (let i = 0; i < sim.p.N; i++) s += D.s(rng); data.push(s / sim.p.N); if (data.length > 200000) data.shift(); }
    });
    sim.onDraw(() => {
      const D = DIST[sim.p.d], N = sim.p.N;
      const se = D.sd / Math.sqrt(N);
      const lo = N === 1 ? D.lo : Math.max(D.lo, D.mu - 5 * se), hi = N === 1 ? D.hi : Math.min(D.hi, D.mu + 5 * se);
      CQ.draw.clear(cv);
      const nb = sim.p.d === 'dado' && N === 1 ? 6 : sim.p.d === 'bern' && N === 1 ? 3 : 60;
      const h = data.length ? ST.hist(data, lo, hi, nb) : null;
      const gmax = 1 / (Math.sqrt(2 * Math.PI) * se);
      const ymax = Math.max(h ? Math.max(...h.dens) : 0, N > 1 ? gmax : 0, 0.5) * 1.15;
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: lo, xmax: hi, ymin: 0, ymax, xlabel: 'promedio de N datos', ylabel: 'densidad' });
      pl.frame();
      if (h) CQ.drawHist(pl, h, { color: '--c1' });
      pl.fn((x) => Math.exp(-((x - D.mu) ** 2) / (2 * se * se)) / (Math.sqrt(2 * Math.PI) * se), { color: '--c2', width: 2.2, n: 500 });
      pl.vline(D.mu, { color: '--ink-3', label: 'μ' });
      pl.legend([{ label: 'histograma de promedios', color: '--c1', kind: 'sq' }, { label: 'gaussiana μ, σ/√N', color: '--c2' }]);
      const n = data.length;
      sim.set('n', String(n));
      sim.set('m', n ? `${f4(ST.mean(data))} / ${f4(D.mu)}` : '—');
      sim.set('s', n > 1 ? `${f4(ST.std(data))} / ${f4(se)}` : '—');
    });
  });

  /* ======================================================================
     19.2 Caminata aleatoria en el panal
     ====================================================================== */
  CQ.defineSim('caminata-aleatoria', function (sim) {
    sim.cols2();
    const cw = sim.canvas({ aspect: 1 });
    const cr = sim.canvas({ aspect: 1 });
    sim.group('Caminantes');
    sim.slider('W', { label: 'Número de caminantes', min: 10, max: 600, value: 200, step: 10, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('sp', { label: 'Pasos por segundo', min: 1, max: 200, value: 20, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('n', 'Pasos dados <i>N</i>');
    sim.out('r2', '⟨<i>r</i>²⟩ / (<i>N d</i>²)', { hl: true });
    sim.out('rms', '<i>r</i><sub>rms</sub> (en <i>d</i>)');
    const L = 120, g = P.sm.brick(L), rng = P.rng(7);
    let walkers = [], steps = 0, acc = 0, hist = [];
    const c0 = g.N / 2 + L / 2;
    const reset = () => { walkers = Array.from({ length: sim.p.W }, () => ({ k: c0, dx: 0, dy: 0 })); steps = 0; hist = []; };
    reset();
    sim.resetButton(reset);
    sim.onChange = (id) => { if (id === 'W') reset(); };
    sim.animate((dt) => {
      acc += dt * sim.p.sp;
      while (acc > 1) {
        acc -= 1; steps++;
        let s2 = 0;
        for (const w of walkers) {
          const m = g.nb[3 * w.k + ((rng() * 3) | 0)];
          let ddx = g.x[m] - g.x[w.k], ddy = g.y[m] - g.y[w.k];
          ddx -= g.W * Math.round(ddx / g.W); ddy -= g.H * Math.round(ddy / g.H);
          w.dx += ddx; w.dy += ddy; w.k = m;
          s2 += w.dx * w.dx + w.dy * w.dy;
        }
        hist.push([steps, s2 / walkers.length]);
        if (hist.length > 4000) hist.shift();
      }
    });
    sim.onDraw(() => {
      CQ.draw.clear(cw);
      const R = Math.max(8, 3 * Math.sqrt(Math.max(1, steps)));
      const view = new CQ.View2D(cw, { xmin: -R, xmax: R, ymin: -R, ymax: R });
      view.update();
      const ctx = cw.ctx;
      ctx.strokeStyle = CQ.alpha('--accent', 0.5); ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(view.X(0), view.Y(0), Math.sqrt(steps) * view.s, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      for (const w of walkers) { ctx.beginPath(); ctx.arc(view.X(w.dx), view.Y(w.dy), 2.4, 0, 7); ctx.fillStyle = CQ.alpha('--c1', 0.7); ctx.fill(); }
      CQ.text(ctx, 'círculo: radio √N (en distancias de enlace)', 8, 16, { size: 11, color: '--ink-2', halo: true });
      CQ.draw.clear(cr);
      const nmax = Math.max(10, steps);
      const pr = new CQ.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: 0, xmax: nmax, ymin: 0, ymax: Math.max(10, nmax * 1.3), xlabel: 'pasos N', ylabel: '⟨r²⟩ (d²)', title: 'el cuadrado medio crece linealmente' });
      pr.frame();
      pr.fn((n) => n, { color: '--ink-3', dash: [5, 4], width: 1.5 });
      if (hist.length) pr.path(hist, { color: '--c1', width: 2 });
      const r2 = hist.length ? hist[hist.length - 1][1] : 0;
      sim.set('n', String(steps));
      sim.set('r2', steps ? f3(r2 / steps) : '—');
      sim.set('rms', f3(Math.sqrt(r2)));
    });
  });

  /* ======================================================================
     19.3 Intervalos de confianza
     ====================================================================== */
  CQ.defineSim('intervalos', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.group('Muestreo');
    sim.slider('n', { label: 'Datos por experimento <i>n</i>', min: 2, max: 50, value: 5, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.seg('k', { label: 'Factor del intervalo', options: [['z', '1.96 (normal)'], ['t', 't de Student']], value: 't' });
    sim.button('Otros 100 experimentos', () => { draw(); }, { primary: true });
    sim.out('fac', 'Factor usado');
    sim.out('cov', 'Intervalos que contienen μ', { hl: true });
    sim.out('cum', 'Cobertura acumulada');
    const rng = P.rng(95);
    let exps = [], tot = 0, hit = 0;
    const draw = () => {
      exps = [];
      for (let e = 0; e < 100; e++) { const d = Array.from({ length: sim.p.n }, () => 10 + 2 * rng.gauss()); exps.push({ m: ST.mean(d), s: ST.std(d) }); }
    };
    draw();
    sim.onChange = () => { draw(); tot = 0; hit = 0; };
    sim.onDraw(() => {
      const n = sim.p.n, fac = sim.p.k === 't' ? ST.tQuantile(0.975, n - 1) : 1.96;
      CQ.draw.clear(cv);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 101, ymin: 4, ymax: 16, xlabel: 'experimento', ylabel: 'media ± intervalo' });
      pl.frame();
      pl.hline(10, { color: '--ink', label: 'μ verdadera = 10', dash: [] });
      let c = 0;
      pl.clip((ctx) => {
        exps.forEach((e, i) => {
          const h = (fac * e.s) / Math.sqrt(n), ok = Math.abs(e.m - 10) <= h;
          if (ok) c++;
          ctx.strokeStyle = CQ.col(ok ? '--c3' : '--c2'); ctx.lineWidth = ok ? 1.4 : 2.2;
          ctx.beginPath(); ctx.moveTo(pl.X(i + 1), pl.Y(e.m - h)); ctx.lineTo(pl.X(i + 1), pl.Y(e.m + h)); ctx.stroke();
          ctx.fillStyle = CQ.col(ok ? '--c3' : '--c2'); ctx.fillRect(pl.X(i + 1) - 1.5, pl.Y(e.m) - 1.5, 3, 3);
        });
      });
      if (sim._lastDraw !== exps) { tot += 100; hit += c; sim._lastDraw = exps; }
      sim.set('fac', f4(fac));
      sim.set('cov', `${c} de 100`);
      sim.set('cum', `${CQ.fix((100 * hit) / Math.max(1, tot), 1)} % (${tot} intervalos)`);
    });
  });

  /* ======================================================================
     19.4 Autocorrelación y bloques
     ====================================================================== */
  CQ.defineSim('autocorrelacion', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 0.95 });
    const cb = sim.canvas({ aspect: 0.95 });
    sim.group('Serie autocorrelacionada');
    sim.note('<i>x</i><sub><i>i</i>+1</sub> = φ <i>x<sub>i</sub></i> + ruido gaussiano (proceso AR(1))');
    sim.slider('phi', { label: 'Memoria φ', min: 0, max: 0.99, value: 0.9, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('n', { label: 'Longitud de la serie', min: 1000, max: 100000, value: 32768, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.button('Nueva serie', () => { seed++; }, { primary: true });
    sim.out('naive', 'Error ingenuo <i>s</i>/√<i>n</i>');
    sim.out('blk', 'Error por bloques (meseta)', { hl: true });
    sim.out('tau', 'τ<sub>int</sub> estimado / exacto');
    sim.out('ex', 'Error exacto √(2τ/<i>n</i>)·σ', { hl: true });
    let seed = 1;
    sim.onDraw(() => {
      const phi = sim.p.phi, n = Math.round(sim.p.n), rng = P.rng(seed);
      const x = new Float64Array(n);
      const sd = Math.sqrt(1 - phi * phi);
      x[0] = rng.gauss();
      for (let i = 1; i < n; i++) x[i] = phi * x[i - 1] + sd * rng.gauss();
      CQ.draw.clear(cs);
      const pl = new CQ.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h * 0.5, xmin: 0, xmax: 400, ymin: -3.5, ymax: 3.5, xlabel: '', ylabel: 'x_i', title: 'primeros 400 datos', mb: 18 });
      pl.frame();
      pl.xy(Array.from({ length: 400 }, (_, i) => i), Array.from(x.slice(0, 400)), { color: '--c1', width: 1.2 });
      const ac = ST.autocorr(Array.from(x.slice(0, Math.min(n, 30000))), 200);
      const pa = new CQ.Plot(cs.ctx, { x: 0, y: cs.h * 0.5, w: cs.w, h: cs.h * 0.5, xmin: 0, xmax: 100, ymin: -0.1, ymax: 1.05, xlabel: 'retardo k', ylabel: 'ρ(k)' });
      pa.frame();
      pa.xy(Array.from({ length: 101 }, (_, k) => k), Array.from(ac.rho.slice(0, 101)), { color: '--c1', width: 2 });
      pa.fn((k) => Math.pow(phi, k), { color: '--c2', width: 1.4, dash: [4, 3] });
      /* bloques */
      const bl = ST.blocking(Array.from(x));
      CQ.draw.clear(cb);
      const tauEx = 0.5 * (1 + phi) / (1 - phi);
      const exact = Math.sqrt((2 * tauEx) / n);
      const ymax = Math.max(...bl.map((b) => b.err), exact) * 1.3;
      const pb = new CQ.Plot(cb.ctx, { x: 0, y: 0, w: cb.w, h: cb.h, xmin: 1, xmax: Math.max(2, bl[bl.length - 1].block), xlog: true, ymin: 0, ymax, xlabel: 'tamaño del bloque', ylabel: 'error estimado de la media', title: 'método de bloques' });
      pb.frame();
      pb.path(bl.map((b) => [b.block, b.err]), { color: '--c3', width: 2 });
      bl.forEach((b) => pb.dot(b.block, b.err, { color: '--c3', r: 3 }));
      pb.hline(exact, { color: '--c2', label: 'error exacto' });
      pb.hline(bl[0].err, { color: '--ink-3', label: 'ingenuo' });
      const plateau = Math.max(...bl.slice(0, Math.max(1, bl.length - 3)).map((b) => b.err));
      sim.set('naive', CQ.sci(bl[0].err, 3));
      sim.set('blk', CQ.sci(plateau, 3));
      sim.set('tau', `${CQ.fix(ac.tau, 2)} / ${CQ.fix(tauEx, 2)}`);
      sim.set('ex', CQ.sci(exact, 3));
    });
  });
})();
