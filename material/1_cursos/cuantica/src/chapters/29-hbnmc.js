/* Capítulo 29 — hBN-MC de principio a fin */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, H = P.hbn;
  const f2 = (v) => CQ.fix(v, 2), f3 = (v) => CQ.fix(v, 3);

  /* Protocolos térmicos: copia de temperatureAtStep() de core.js de hBN-MC */
  const temperatureAtStep = (s, n, mode, t0, t1) => {
    const N = Math.max(1, n);
    if (mode === 'iso') return t0;
    if (mode === '3phase') {
      const p1 = Math.floor(N * 0.3), p2 = Math.floor(N * 0.7);
      if (s < p1) return t0;
      if (s < p2) return t0 + ((t1 - t0) * (s - p1)) / Math.max(1, p2 - p1);
      return t1;
    }
    if (mode === 'cycle') { const half = N / 2; return s < half ? t0 + ((t1 - t0) * s) / half : t1 + ((t0 - t1) * (s - half)) / half; }
    return t0 + ((t1 - t0) * s) / N;
  };
  /* Estructuras iniciales */
  const buildLattice = (L, st, n, seed, res, dmu) => {
    const lat = new H.Lattice(L, { rng: P.rng(seed), res, dmu });
    switch (st) {
      case 'triN': lat.triangle(n, 'N'); break;
      case 'triB': lat.triangle(n, 'B'); break;
      case 'frag': lat.monovacancies((n * (n + 1)) / 2, 2); lat.monovacancies((n * (n - 1)) / 2, 1); break;
      case 'cdisk': lat.carbonDisk(Math.max(2, n * 0.9)); break;
      case 'crand': lat.carbonRandom(0.2); break;
      case 'triC': lat.triangle(n, 'N'); lat.carbonRandom(0.1); break;
      default: break;
    }
    lat.E = lat.energy();
    return lat;
  };

  /* ======================================================================
     29.1 hBN-MC en miniatura
     ====================================================================== */
  CQ.defineSim('mini-hbnmc', function (sim) {
    sim.cols2();
    const cl = sim.canvas({ aspect: 0.6 });
    const cg = sim.canvas({ aspect: 0.6 });
    const ST = { triN: 'Poro triangular, borde N', triB: 'Poro triangular, borde B', frag: 'Monovacancias (mismos átomos que el triángulo N)', cdisk: 'Dominio de carbono (sin poro)', crand: 'Carbono al azar, 20 % (pares C–C)', triC: 'Poro borde N + carbono al azar 10 %' };
    const MODES = { anneal: 'Recocido (rampa Ti → Tf)', iso: 'Isotérmico (Ti)', '3phase': '3 fases (Ti 30 % · rampa 40 % · Tf 30 %)', cycle: 'Ciclo Ti → Tf → Ti' };
    sim.group('Paso 1–2 · Red y estructura');
    sim.seg('L', { label: 'Red', options: [[16, '16 × 16'], [20, '20 × 20'], [24, '24 × 24']], value: 24 });
    sim.select('st', { options: Object.keys(ST).map((k) => [k, ST[k]]), value: 'triN' });
    sim.slider('n', { label: 'Orden del poro <i>n</i> (<i>n</i>² vacancias)', min: 2, max: 6, value: 5, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('seed', { label: 'Semilla', min: 1, max: 99, value: 7, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.group('Paso 3 · Protocolo');
    sim.select('mode', { options: Object.keys(MODES).map((k) => [k, MODES[k]]), value: '3phase' });
    sim.slider('Ti', { label: '<i>T</i><sub>i</sub>', min: 500, max: 20000, value: 6000, step: 100, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
    sim.slider('Tf', { label: '<i>T</i><sub>f</sub>', min: 500, max: 20000, value: 2500, step: 100, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
    sim.slider('steps', { label: 'Pasos totales (intentos)', min: 1e4, max: 1e7, value: 1e6, log: true, step: 1000, fmt: (v) => CQ.sci(v, 2) });
    sim.slider('gf', { label: 'Fracción de intercambios globales', min: 0, max: 0.5, value: 0.3, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('rate', { label: 'Velocidad (pasos por segundo)', min: 1e3, max: 2e6, value: 2.5e5, log: true, step: 100, fmt: (v) => CQ.sci(v, 2) });
    sim.group('Paso 4 · Reservorio de H');
    sim.seg('res', { options: [['tesis', 'Tesis 2019'], ['H2', 'Gran canónico (H₂)']], value: 'H2', onInput: (v) => sim.ctl.dmu.show(v === 'H2') });
    sim.slider('dmu', { label: 'Δμ<sub>H</sub>', min: -2, max: 0.5, value: -1.5, step: 0.05, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.out('s', 'Paso · barridos equivalentes');
    sim.out('T', 'Temperatura', { hl: true });
    sim.out('E', '<i>E</i> − <i>E</i><sub>inicial</sub>');
    sim.out('acc', 'Aceptación (último bloque)');
    sim.out('pores', 'Poros · mayor · <i>N</i><sub>H</sub>', { hl: true });
    sim.out('eh', 'Energía de borde <i>e</i><sub>H</sub>');
    sim.out('ac', 'α<sub>C</sub> (Warren–Cowley del carbono)');
    let lat, s, hist, E0, lastAcc, acc, view;
    const reset = () => {
      lat = buildLattice(sim.p.L, sim.p.st, Math.round(sim.p.n), Math.round(sim.p.seed), sim.p.res, sim.p.dmu);
      s = 0; hist = []; E0 = lat.E; lastAcc = null; acc = 0;
      view = new CQ.View2D(cl, { xmin: -0.8, xmax: lat.g.W - 0.2, ymin: -0.9, ymax: lat.g.H - 0.4 });
      hist.push([0, temperatureAtStep(0, sim.p.steps, sim.p.mode, sim.p.Ti, sim.p.Tf), 0, lat.pores().length ? lat.pores()[0].n : 0]);
    };
    reset();
    sim.resetButton(reset);
    sim.onChange = (id) => { if (['L', 'st', 'n', 'seed', 'res', 'dmu', 'mode', 'Ti', 'Tf', 'steps'].includes(id)) reset(); };
    sim.animate((dt) => {
      const n = Math.round(sim.p.steps);
      if (s >= n) return;
      acc += dt * sim.p.rate;
      let todo = Math.min(Math.floor(acc), n - s, 3e5);
      acc -= Math.floor(acc);
      const rec = Math.max(1, Math.floor(n / 700));
      let accB = 0, triedB = 0;
      while (todo > 0) {
        const chunk = Math.min(todo, Math.max(64, lat.N >> 2), rec - (s % rec));
        const T = temperatureAtStep(s, n, sim.p.mode, sim.p.Ti, sim.p.Tf);
        const r = lat.sweep(T, chunk, sim.p.gf);
        accB += r.acc; triedB += r.tried;
        s += chunk; todo -= chunk;
        if (s % rec === 0 || s >= n) { const pr = lat.pores(); hist.push([s, T, lat.E - E0, pr.length ? pr[0].n : 0]); }
      }
      if (triedB) lastAcc = accB / triedB;
    });
    sim.onDraw(() => {
      const n = Math.round(sim.p.steps), cyc = sim.p.mode === 'cycle';
      view.update();
      CQ.draw.clear(cl);
      CQ.drawLattice(view, lat, { r: Math.max(1.8, 0.27 * view.s) });
      const pr = lat.pores(), sp = lat.species();
      CQ.text(cl.ctx, `paso ${CQ.sci(s, 2)} de ${CQ.sci(n, 2)}`, 8, cl.h - 8, { size: 11, color: '--ink-2', halo: true, mono: true });
      CQ.draw.clear(cg);
      const h3 = cg.h / 3;
      const pT = new CQ.Plot(cg.ctx, { x: 0, y: 0, w: cg.w, h: h3, xmin: 0, xmax: n / 1000, ymin: 0, ymax: Math.max(sim.p.Ti, sim.p.Tf) * 1.1, xlabel: '', ylabel: 'T (K)', title: 'protocolo T(paso)', mb: 20 });
      pT.frame();
      pT.fn((x) => temperatureAtStep(1000 * x, n, sim.p.mode, sim.p.Ti, sim.p.Tf), { color: '--ink-3', width: 1.6, n: 300 });
      pT.vline(s / 1000, { color: '--accent' });
      const Es = hist.map((q) => q[2]);
      const emin = Math.min(0, ...Es), emax = Math.max(1, ...Es);
      const pE = new CQ.Plot(cg.ctx, { x: 0, y: h3, w: cg.w, h: h3, xmin: 0, xmax: n / 1000, ymin: emin - 0.05 * (emax - emin), ymax: emax + 0.05 * (emax - emin), xlabel: 'paso (miles)', ylabel: 'E − E_0 (eV)', title: 'energía', mb: 34 });
      pE.frame();
      pE.path(hist.map((q) => [q[0] / 1000, q[2]]), { color: '--accent', width: 1.6 });
      const Tmin = Math.min(sim.p.Ti, sim.p.Tf), Tmax = Math.max(sim.p.Ti, sim.p.Tf);
      const pET = new CQ.Plot(cg.ctx, { x: 0, y: 2 * h3, w: cg.w, h: h3, xmin: Tmin - 0.05 * (Tmax - Tmin + 1), xmax: Tmax + 0.05 * (Tmax - Tmin + 1), ymin: emin - 0.05 * (emax - emin), ymax: emax + 0.05 * (emax - emin), xlabel: 'T (K)', ylabel: 'E − E_0', title: cyc ? 'E(T): calentamiento (rojo) y enfriamiento (azul)' : 'E(T)' });
      pET.frame();
      if (cyc) {
        const a = hist.filter((q) => q[0] <= n / 2), b = hist.filter((q) => q[0] >= n / 2);
        pET.path(a.map((q) => [q[1], q[2]]), { color: '--c2', width: 1.6 });
        pET.path(b.map((q) => [q[1], q[2]]), { color: '--c1', width: 1.6 });
      } else hist.forEach((q) => pET.dot(q[1], q[2], { color: CQ.alpha('--accent', 0.5), r: 1.8 }));
      const T = temperatureAtStep(Math.min(s, n - 1), n, sim.p.mode, sim.p.Ti, sim.p.Tf);
      sim.set('s', `${CQ.sci(s, 3)} · ${CQ.fix(s / lat.N, 0)}`);
      sim.set('T', CQ.fix(T, 0) + ' K (k<sub>B</sub>T = ' + f3(H.KB * T) + ' eV)');
      sim.set('E', f2(lat.E - E0) + ' eV');
      sim.set('acc', lastAcc === null ? '—' : CQ.fix(100 * lastAcc, 3) + ' %');
      sim.set('pores', `${pr.length} · ${pr.length ? pr[0].n : 0} · ${lat.nH()}`);
      sim.set('eh', f3(H.edgePerH(sim.p.res, sim.p.dmu)) + ' eV');
      const a = sp.C ? lat.alphaC() : null;
      sim.set('ac', a === null ? '— (sin carbono)' : f3(a));
    });
    sim.ctl.dmu.show(true);
  });

  /* ======================================================================
     29.2 Dos inicios: equilibrio frente a atrapamiento
     ====================================================================== */
  CQ.defineSim('dos-inicios', function (sim) {
    const cl = sim.canvas({ aspect: 1.2 });
    const cp = sim.canvas({ aspect: 2.6 });
    sim.group('Condiciones (red 24 × 24, 25 vacancias, gran canónico)');
    sim.slider('T', { label: 'Temperatura', min: 1500, max: 9000, value: 3000, step: 100, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
    sim.slider('dmu', { label: 'Δμ<sub>H</sub>', min: -2, max: -0.5, value: -1.5, step: 0.05, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.slider('gf', { label: 'Fracción de intercambios globales', min: 0, max: 0.5, value: 0.3, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('sp', { label: 'Barridos por segundo', min: 1, max: 400, value: 60, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('k', 'Barridos (576 pasos cada uno)');
    sim.out('big', '⟨mayor poro⟩ en la segunda mitad: desde triángulo · desde monovacancias', { hl: true });
    sim.out('nh', '⟨<i>N</i><sub>H</sub>⟩ en la segunda mitad');
    sim.out('eh', '<i>e</i><sub>H</sub> · estimación de <i>T</i>* = 33.4·(<i>e</i><sub>H</sub>/0.557)/(98 <i>k</i><sub>B</sub>)');
    sim.out('v', 'Diagnóstico', { hl: true });
    let A, B, k, hA, hB, acc;
    const reset = () => {
      A = buildLattice(24, 'triN', 5, 11, 'H2', sim.p.dmu);
      B = buildLattice(24, 'frag', 5, 12, 'H2', sim.p.dmu);
      k = 0; hA = []; hB = []; acc = 0;
    };
    reset();
    sim.resetButton(reset);
    sim.onChange = (id) => { if (id === 'dmu') reset(); else if (id !== 'sp') { hA = []; hB = []; k = 0; } };
    sim.animate((dt) => {
      acc += dt * sim.p.sp;
      let q = Math.min(Math.floor(acc), 24);
      acc -= Math.floor(acc);
      while (q-- > 0) {
        A.sweep(sim.p.T, A.N, sim.p.gf); B.sweep(sim.p.T, B.N, sim.p.gf); k++;
        const pa = A.pores(), pb = B.pores();
        hA.push([k, pa.length ? pa[0].n : 0, A.nH()]); hB.push([k, pb.length ? pb[0].n : 0, B.nH()]);
        if (hA.length > 3000) { hA = hA.filter((_, i) => i % 2 === 0); hB = hB.filter((_, i) => i % 2 === 0); }
      }
    });
    const half2 = (h, j) => { const m = h.filter((q) => q[0] > k / 2); return m.length ? m.reduce((s, q) => s + q[j], 0) / m.length : NaN; };
    const sd2 = (h, j) => { const m = h.filter((q) => q[0] > k / 2).map((q) => q[j]); return m.length > 1 ? P.stat.std(m) : 0; };
    sim.onDraw(() => {
      CQ.draw.clear(cl);
      const half = cl.w / 2;
      [[A, 'inicio: triángulo de borde N', '--c1'], [B, 'inicio: 25 monovacancias', '--c2']].forEach(([lat, title, col], i) => {
        const ctx = cl.ctx;
        ctx.save(); ctx.translate(i * half, 0);
        const v = new CQ.View2D({ w: half - 6, h: cl.h - 22, ctx }, { xmin: -0.7, xmax: lat.g.W - 0.2, ymin: -0.7, ymax: lat.g.H - 0.3 });
        v.update();
        ctx.translate(0, 22);
        CQ.drawLattice(v, lat, { r: Math.max(1.8, 0.27 * v.s) });
        ctx.translate(0, -22);
        const pr = lat.pores();
        CQ.text(ctx, half < 260 ? `${i ? 'monovacancias' : 'triángulo'} · ${pr.length ? pr[0].n : 0}` : `${title} · mayor poro ${pr.length ? pr[0].n : 0}`, half / 2, 14, { size: 12, color: col, align: 'center', weight: 650 });
        ctx.restore();
      });
      CQ.draw.clear(cp);
      const k0 = hA.length ? hA[0][0] : 0;
      const pl = new CQ.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: k0, xmax: Math.max(k0 + 20, k), ymin: 0, ymax: 26, xlabel: 'barridos', ylabel: 'mayor poro', title: 'tamaño del mayor poro (vacancias)' });
      pl.frame();
      pl.path(hA.map((q) => [q[0], q[1]]), { color: '--c1', width: 1.8 });
      pl.path(hB.map((q) => [q[0], q[1]]), { color: '--c2', width: 1.8 });
      if (k > 4) pl.vline(k / 2, { color: '--ink-3', dash: [3, 3], label: 'mitad' });
      pl.legend([{ label: 'desde el triángulo', color: '--c1' }, { label: 'desde monovacancias', color: '--c2' }], 'tr');
      const a = half2(hA, 1), b = half2(hB, 1), na = half2(hA, 2), nb = half2(hB, 2);
      const eh = H.edgePerH('H2', sim.p.dmu);
      sim.set('k', String(k));
      sim.set('big', k > 4 ? `${CQ.fix(a, 1)} · ${CQ.fix(b, 1)}` : '—');
      sim.set('nh', k > 4 ? `${CQ.fix(na, 1)} · ${CQ.fix(nb, 1)}` : '—');
      sim.set('eh', `${f3(eh)} eV · ${eh > 0 ? CQ.fix((60 * eh) / (98 * H.KB), 0) + ' K' : 'no hay cruce (e<sub>H</sub> ≤ 0)'}`);
      const tol = Math.max(2, 0.5 * (sd2(hA, 1) + sd2(hB, 1)));
      sim.set('v', k < 300 ? 'esperando (mínimo 300 barridos)…' : Math.abs(a - b) < tol ? 'coinciden dentro de las fluctuaciones: compatible con equilibrio' : 'no coinciden: al menos una está atrapada o falta tiempo');
    });
  });
})();
