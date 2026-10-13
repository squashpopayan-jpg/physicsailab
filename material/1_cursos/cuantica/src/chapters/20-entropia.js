/* Capítulo 20 — Microestados y entropía */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, S = P.sf;
  const f3 = (v) => CQ.fix(v, 3), f2 = (v) => CQ.fix(v, 2);

  /* ======================================================================
     20.1 Entropía configuracional
     ====================================================================== */
  CQ.defineSim('entropia-mezcla', function (sim) {
    sim.cols2();
    const cg = sim.canvas({ aspect: 0.95 });
    const cl = sim.canvas({ aspect: 0.95 });
    sim.group('Red y vacancias');
    sim.slider('N', { label: 'Sitios <i>N</i>', min: 20, max: 10000, value: 576, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('x', { label: 'Fracción de vacancias <i>x</i> = <i>n</i>/<i>N</i>', min: 0.001, max: 0.999, value: 0.05, step: 0.001, fmt: (v) => CQ.fix(v, 3) });
    sim.seg('show', { label: 'Configuración dibujada', options: [['rnd', 'dispersas'], ['pore', 'poro compacto']], value: 'rnd' });
    sim.out('n', 'Vacancias <i>n</i>');
    sim.out('ex', 'ln Ω exacto = ln C(N, n)', { hl: true });
    sim.out('st', 'Stirling: −N[x ln x + (1−x) ln(1−x)]');
    sim.out('st2', 'Stirling con corrección');
    sim.out('pore', 'ln Ω de un poro compacto ≈ ln N');
    sim.onDraw(() => {
      const N = Math.round(sim.p.N), n = Math.max(1, Math.min(N - 1, Math.round(sim.p.x * N))), x = n / N;
      const ex = S.logBinom(N, n), st = -N * (x * Math.log(x) + (1 - x) * Math.log(1 - x));
      const st2 = st - 0.5 * Math.log(2 * Math.PI * N * x * (1 - x));
      CQ.draw.clear(cg);
      const pl = new CQ.Plot(cg.ctx, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: 0, xmax: 1, ymin: 0, ymax: 0.8, xlabel: 'x', ylabel: 'S / (N k_B)', title: 'entropía configuracional por sitio' });
      pl.frame();
      pl.fn((q) => (q <= 0 || q >= 1 ? 0 : -(q * Math.log(q) + (1 - q) * Math.log(1 - q))), { color: '--c1', width: 2.4, n: 400 });
      const pts = []; for (let k = 1; k < N; k += Math.max(1, Math.floor(N / 200))) pts.push([k / N, S.logBinom(N, k) / N]);
      pl.path(pts, { color: '--c2', width: 1.6, dash: [4, 3] });
      pl.hline(Math.log(2), { color: '--ink-3', label: 'ln 2' });
      pl.dot(x, ex / N, { color: '--accent' });
      pl.legend([{ label: 'Stirling', color: '--c1' }, { label: `exacto (N = ${N})`, color: '--c2', dash: [4, 3] }], 'bl');
      /* dibujo de una red con vacancias */
      CQ.draw.clear(cl);
      const L = 20, g = P.sm.brick(L), rng = P.rng(5);
      const s = new Uint8Array(g.N).fill(1);
      const nv = Math.round(x * g.N);
      if (sim.p.show === 'rnd') { const idx = Array.from({ length: g.N }, (_, i) => i); for (let i = g.N - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; [idx[i], idx[j]] = [idx[j], idx[i]]; } for (let q = 0; q < nv; q++) s[idx[q]] = 0; }
      else { const c = [g.W / 2, g.H / 2]; const ord = Array.from({ length: g.N }, (_, k) => [Math.hypot(g.x[k] - c[0], g.y[k] - c[1]), k]).sort((a, b) => a[0] - b[0]); for (let q = 0; q < nv; q++) s[ord[q][1]] = 0; }
      const view = new CQ.View2D(cl, { xmin: -0.8, xmax: g.W, ymin: -0.8, ymax: g.H });
      view.update();
      const ctx = cl.ctx;
      ctx.strokeStyle = CQ.alpha('--ink-3', 0.5); ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 0; k < g.N; k++) for (let q = 0; q < 3; q++) { const m = g.nb[3 * k + q]; if (m > k && s[k] && s[m] && Math.abs(g.x[m] - g.x[k]) < 1.5 && Math.abs(g.y[m] - g.y[k]) < 1.5) { ctx.moveTo(view.X(g.x[k]), view.Y(g.y[k])); ctx.lineTo(view.X(g.x[m]), view.Y(g.y[m])); } }
      ctx.stroke();
      for (let k = 0; k < g.N; k++) CQ.draw.atom(ctx, view.X(g.x[k]), view.Y(g.y[k]), Math.max(2, 0.25 * view.s), s[k] ? (g.par[k] ? 'N' : 'B') : 'X', { flat: true });
      CQ.text(ctx, `${nv} vacancias en ${g.N} sitios (ilustración)`, 8, 16, { size: 11.5, color: '--ink-2', halo: true });
      sim.set('n', String(n));
      sim.set('ex', f2(ex) + ' (' + CQ.fix(ex / N, 4) + ' por sitio)');
      sim.set('st', f2(st));
      sim.set('st2', f2(st2));
      sim.set('pore', f2(Math.log(N)));
    });
  });

  /* ======================================================================
     20.2 Dos sólidos de Einstein
     ====================================================================== */
  CQ.defineSim('solidos-einstein', function (sim) {
    sim.cols2();
    const cp = sim.canvas({ aspect: 0.95 });
    const ct = sim.canvas({ aspect: 0.95 });
    sim.group('Sólidos');
    sim.slider('NA', { label: 'Osciladores de A', min: 5, max: 400, value: 60, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('NB', { label: 'Osciladores de B', min: 5, max: 400, value: 40, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('q', { label: 'Cuantos de energía en total', min: 10, max: 400, value: 100, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('sp', { label: 'Intercambios por segundo', min: 50, max: 50000, value: 3000, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('qa', '<i>q</i><sub>A</sub> ahora');
    sim.out('qm', '<i>q</i><sub>A</sub> más probable (teoría)', { hl: true });
    sim.out('TT', '<i>k</i><sub>B</sub><i>T</i>/ε de A y B ahora');
    sim.out('rel', 'Anchura relativa del pico');
    const rng = P.rng(20);
    let osc = null, qa = 0, trace = [], t = 0, acc = 0;
    const reset = () => {
      const NA = sim.p.NA, NB = sim.p.NB, q = sim.p.q;
      osc = new Int32Array(NA + NB);
      for (let k = 0; k < q; k++) osc[(rng() * NA) | 0]++; /* toda la energía empieza en A */
      qa = q; trace = []; t = 0;
    };
    reset();
    sim.resetButton(reset);
    sim.onChange = (id) => { if (id !== 'sp') reset(); };
    sim.animate((dt) => {
      const NA = sim.p.NA, N = osc.length;
      acc += dt * sim.p.sp;
      let k = 0;
      while (acc > 1 && k < 100000) {
        acc -= 1; k++;
        const i = (rng() * N) | 0; if (!osc[i]) continue;
        const j = (rng() * N) | 0;
        osc[i]--; osc[j]++;
        if (i < NA && j >= NA) qa--; else if (i >= NA && j < NA) qa++;
      }
      t += dt;
      trace.push([t, qa]); if (trace.length > 1500) trace.shift();
    });
    sim.onDraw(() => {
      const NA = sim.p.NA, NB = sim.p.NB, q = sim.p.q;
      const lp = []; let mx = -Infinity;
      for (let a = 0; a <= q; a++) { const v = P.sm.lnOmegaEinstein(NA, a) + P.sm.lnOmegaEinstein(NB, q - a); lp.push(v); mx = Math.max(mx, v); }
      const pr = lp.map((v) => Math.exp(v - mx)); const Z = pr.reduce((a, b) => a + b, 0); const pn = pr.map((v) => v / Z);
      const amax = pn.indexOf(Math.max(...pn));
      CQ.draw.clear(cp);
      const pl = new CQ.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: q, ymin: 0, ymax: Math.max(...pn) * 1.15, xlabel: 'q_A (cuantos en A)', ylabel: 'probabilidad ∝ Ω_A Ω_B', title: 'distribución de la energía' });
      pl.frame();
      pl.xy(pn.map((_, a) => a), pn, { color: '--c1', width: 2.2, fill: '--c1', fillAlpha: 0.15 });
      pl.vline(qa, { color: '--accent', label: 'ahora' });
      CQ.draw.clear(ct);
      const pt = new CQ.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: trace.length ? trace[0][0] : 0, xmax: Math.max(1, t), ymin: 0, ymax: q, xlabel: 't (s)', ylabel: 'q_A', title: 'evolución por intercambios aleatorios' });
      pt.frame();
      if (trace.length > 1) pt.path(trace, { color: '--c2', width: 1.6 });
      pt.hline(amax, { color: '--c1', label: 'máximo de Ω_AΩ_B' });
      const kT = (n, qq) => (qq > 0 ? 1 / Math.log((qq + n) / qq) : 0);
      let m1 = 0, m2 = 0; pn.forEach((p, a) => { m1 += p * a; m2 += p * a * a; });
      sim.set('qa', String(qa));
      sim.set('qm', `${amax} (A recibe ${CQ.fix((100 * NA) / (NA + NB), 0)} % de los osciladores)`);
      sim.set('TT', `${f3(kT(NA, qa))} · ${f3(kT(NB, q - qa))}`);
      sim.set('rel', CQ.fix(Math.sqrt(Math.max(0, m2 - m1 * m1)) / Math.max(1, m1), 3));
    });
  });

  /* ======================================================================
     20.3 Dos niveles: S(E) y T(E)
     ====================================================================== */
  CQ.defineSim('dos-niveles-entropia', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 0.95 });
    const ct = sim.canvas({ aspect: 0.95 });
    sim.group('Sistema');
    sim.slider('N', { label: 'Partículas <i>N</i>', min: 10, max: 1000, value: 100, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('f', { label: 'Fracción excitada <i>n</i>/<i>N</i>', min: 0.01, max: 0.99, value: 0.25, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.out('S', '<i>S</i>/<i>k</i><sub>B</sub>', { hl: true });
    sim.out('T', '<i>k</i><sub>B</sub><i>T</i>/ε', { hl: true });
    sim.out('pop', 'Ocupación de Boltzmann a esa T');
    sim.onDraw(() => {
      const N = sim.p.N, f = sim.p.f, n = Math.round(f * N);
      CQ.draw.clear(cs);
      const pl = new CQ.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0, xmax: 1, ymin: 0, ymax: Math.log(2) * 1.15, xlabel: 'E/(Nε) = n/N', ylabel: 'S/(N k_B)', title: 'entropía' });
      pl.frame();
      const pts = []; for (let k = 0; k <= N; k++) pts.push([k / N, P.sf.logBinom(N, k) / N]);
      pl.path(pts, { color: '--c1', width: 2.2 });
      const sl = Math.log((N - n) / Math.max(n, 1e-9));
      pl.fn((x) => P.sf.logBinom(N, n) / N + sl * (x - n / N), { color: '--accent', width: 1.4, dash: [5, 3], from: Math.max(0, n / N - 0.2), to: Math.min(1, n / N + 0.2) });
      pl.dot(n / N, P.sf.logBinom(N, n) / N, { color: '--accent' });
      CQ.draw.clear(ct);
      const pt = new CQ.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: 0, xmax: 1, ymin: -5, ymax: 5, xlabel: 'n/N', ylabel: 'k_B T / ε', title: 'temperatura (pendiente⁻¹)' });
      pt.frame();
      pt.fn((x) => 1 / Math.log((1 - x) / x), { color: '--c2', width: 2.2, breakJumps: true, from: 0.005, to: 0.995, n: 800 });
      pt.band(0.5, 1, { color: '--c2', alpha: 0.06 });
      pt.label(0.62, 4.2, 'T < 0 (inversión)', { color: '--c2' });
      pt.dot(n / N, 1 / sl, { color: '--accent' });
      const kT = 1 / sl;
      sim.set('S', CQ.fix(P.sf.logBinom(N, n), 3));
      sim.set('T', isFinite(kT) ? CQ.fix(kT, 4) : '±∞');
      sim.set('pop', isFinite(kT) ? CQ.fix(1 / (Math.exp(1 / kT) + 1), 4) + ` (n/N = ${CQ.fix(n / N, 4)})` : '½');
    });
  });
})();
