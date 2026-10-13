/* Capítulo 25 — Monte Carlo del modelo de Ising y de aleaciones */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, SM = P.sm, H = P.hbn;
  const KB = P.K.kB_eV;
  const f3 = (v) => CQ.fix(v, 3), f4 = (v) => CQ.fix(v, 4);

  /* Mapa de espines con ImageData (un píxel por espín, escalado sin suavizado) */
  const spinImage = (cv, is, x0, y0, S) => {
    const L = is.L;
    if (!cv._off || cv._off.width !== L) { cv._off = document.createElement('canvas'); cv._off.width = L; cv._off.height = L; }
    const oc = cv._off.getContext('2d'), img = oc.createImageData(L, L), d = img.data;
    const up = CQ.rgb('--c1'), dn = CQ.rgb('--c2');
    for (let k = 0; k < is.N; k++) {
      const c = is.s[k] > 0 ? up : dn, q = 4 * k;
      d[q] = c[0]; d[q + 1] = c[1]; d[q + 2] = c[2]; d[q + 3] = is.s[k] > 0 ? 255 : 150;
    }
    oc.putImageData(img, 0, 0);
    const ctx = cv.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cv._off, x0, y0, S, S);
    ctx.imageSmoothingEnabled = true;
    ctx.strokeStyle = CQ.col('--axis'); ctx.lineWidth = 1; ctx.strokeRect(x0 - 0.5, y0 - 0.5, S + 1, S + 1);
  };

  /* ======================================================================
     25.1 Ising 2D con Metropolis
     ====================================================================== */
  CQ.defineSim('ising-2d', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 1 });
    const ct = sim.canvas({ aspect: 1 });
    sim.group('Red y condiciones');
    sim.seg('L', { label: 'Lado de la red <i>L</i>', options: [[32, '32'], [64, '64'], [128, '128'], [200, '200']], value: 128 });
    sim.slider('T', { label: 'Temperatura <i>k</i><sub>B</sub><i>T</i>/<i>J</i>', min: 0.5, max: 5, value: 1.5, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('h', { label: 'Campo <i>h</i>/<i>J</i>', min: -1, max: 1, value: 0, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('sp', { label: 'Barridos por segundo', min: 1, max: 300, value: 30, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.seg('ini', { label: 'Reiniciar desde', options: [['random', 'Al azar (T = ∞)'], ['up', 'Todo arriba (T = 0)']], value: 'random' });
    sim.out('n', 'Barridos (desde el último cambio)');
    sim.out('acc', 'Aceptación de volteos');
    sim.out('e', '⟨<i>e</i>⟩ simulación / Onsager', { hl: true });
    sim.out('m', '⟨|<i>m</i>|⟩ simulación / Onsager', { hl: true });
    sim.note('Los promedios descartan los primeros 100 barridos después de cada cambio (termalización).');
    const rng = P.rng(2025);
    let is, n, ser, sumE, sumM, nm, acc, lastAcc;
    const resetStats = () => { n = 0; sumE = 0; sumM = 0; nm = 0; ser = []; };
    const reset = () => { is = new SM.Ising(sim.p.L, rng, { start: sim.p.ini, h: sim.p.h }); resetStats(); acc = 0; lastAcc = 0; };
    reset();
    sim.resetButton(reset);
    sim.onChange = (id) => {
      if (id === 'L' || id === 'ini') reset();
      else if (id === 'T' || id === 'h') { is.h = sim.p.h; resetStats(); }
    };
    sim.animate((dt) => {
      acc += dt * sim.p.sp;
      let k = Math.floor(acc);
      acc -= k;
      k = Math.min(k, Math.max(1, Math.floor(2e6 / is.N)));
      for (let q = 0; q < k; q++) {
        lastAcc = is.sweep(sim.p.T); n++;
        const r = is.energy(), e = r.E / is.N, m = r.M / is.N;
        ser.push([n, e, m]);
        if (ser.length > 600) ser.shift();
        if (n > 100) { sumE += e; sumM += Math.abs(m); nm++; }
      }
    });
    sim.onDraw(() => {
      const T = sim.p.T, h = sim.p.h;
      CQ.draw.clear(cs);
      const S = Math.min(cs.w, cs.h) - 24;
      spinImage(cs, is, (cs.w - S) / 2, (cs.h - S) / 2 + 6, S);
      CQ.text(cs.ctx, `${is.L} × ${is.L} espines   (azul: +1, rojo: −1)`, cs.w / 2, 13, { size: 11.5, align: 'center', color: '--ink-2' });
      CQ.draw.clear(ct);
      const n0 = ser.length ? ser[0][0] : 0, n1 = Math.max(n0 + 50, n);
      const pe = new CQ.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h / 2, xmin: n0, xmax: n1, ymin: -2.1, ymax: 0.1, xlabel: '', ylabel: 'e = E/NJ', title: 'energía por espín', mb: 22 });
      pe.frame();
      if (h === 0) pe.hline(SM.onsager.u(T), { color: '--ink', dash: [5, 4], label: 'Onsager', labelRight: true });
      pe.xy(ser.map((r) => r[0]), ser.map((r) => r[1]), { color: '--c3', width: 1.8 });
      const pm = new CQ.Plot(ct.ctx, { x: 0, y: ct.h / 2, w: ct.w, h: ct.h / 2, xmin: n0, xmax: n1, ymin: -1.05, ymax: 1.05, xlabel: 'barrido', ylabel: 'm = M/N', title: 'magnetización por espín' });
      pm.frame();
      if (h === 0) { const m0 = SM.onsager.m(T); pm.hline(m0, { color: '--ink', dash: [5, 4] }); pm.hline(-m0, { color: '--ink', dash: [5, 4] }); }
      pm.xy(ser.map((r) => r[0]), ser.map((r) => r[2]), { color: '--accent', width: 1.8 });
      sim.set('n', String(n));
      sim.set('acc', CQ.fix(100 * lastAcc, 1) + ' %');
      sim.set('e', nm ? `${f4(sumE / nm)} / ${h === 0 ? f4(SM.onsager.u(T)) : '—'}` : 'termalizando…');
      sim.set('m', nm ? `${f4(sumM / nm)} / ${h === 0 ? f4(SM.onsager.m(T)) : '—'}` : 'termalizando…');
    });
  });

  /* ======================================================================
     25.2 Barrido en temperatura y tamaño finito
     ====================================================================== */
  CQ.defineSim('ising-barrido', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    sim.group('Cálculo');
    sim.seg('L', { label: 'Lado de la red <i>L</i>', options: [[8, '8'], [16, '16'], [32, '32'], [48, '48']], value: 16 });
    sim.slider('ns', { label: 'Barridos de medida por temperatura', min: 200, max: 6000, value: 1500, log: true, step: 50, fmt: (v) => CQ.fix(v, 0) });
    sim.button('Calcular barrido', () => start(), { primary: true });
    sim.button('Borrar curvas', () => { res = {}; job = null; });
    sim.out('st', 'Estado', { hl: true });
    sim.out('pk', 'Pico de <i>c</i>: posición y altura');
    sim.out('ex', 'Exacto (red infinita)');
    sim.note('Cada temperatura parte de la configuración final de la anterior (de frío a caliente) y descarta un 20 % de barridos de termalización.');
    const COL = { 8: '--c3', 16: '--c1', 32: '--c2', 48: '--c4' };
    const Ts = []; for (let T = 1.4; T <= 3.401; T += 0.05) Ts.push(+T.toFixed(3));
    let res = {}, job = null;
    const rng = P.rng(77);
    const start = () => {
      const L = sim.p.L;
      job = { L, i: 0, is: new SM.Ising(L, rng, { start: 'up' }), ns: Math.round(sim.p.ns), nt: Math.round(0.2 * sim.p.ns), k: 0, acc: null, out: [] };
      res[L] = job.out;
    };
    const step = () => {
      if (!job) return;
      let budget = 2.5e6;
      while (budget > 0 && job) {
        const T = Ts[job.i], is = job.is;
        if (!job.acc) job.acc = { e: 0, e2: 0, m: 0, m2: 0, m4: 0, n: 0 };
        is.sweep(T); job.k++; budget -= is.N;
        if (job.k > job.nt) {
          const r = is.energy(), e = r.E / is.N, m = Math.abs(r.M) / is.N, a = job.acc;
          a.e += e; a.e2 += e * e; a.m += m; a.m2 += m * m; a.m4 += m ** 4; a.n++;
        }
        if (job.k >= job.nt + job.ns) {
          const a = job.acc, N = is.N, e = a.e / a.n, e2 = a.e2 / a.n, m = a.m / a.n, m2 = a.m2 / a.n, m4 = a.m4 / a.n;
          job.out.push({ T, e, m, c: (N * (e2 - e * e)) / (T * T), chi: (N * (m2 - m * m)) / T, U: 1 - m4 / (3 * m2 * m2) });
          job.i++; job.k = 0; job.acc = null;
          if (job.i >= Ts.length) job = null;
        }
      }
    };
    sim.animate(() => step(), { autoplay: true });
    start();
    sim.onDraw(() => {
      CQ.draw.clear(cv);
      const W = cv.w / 2, Hh = cv.h / 2, Tc = SM.onsager.Tc;
      const mk = (x, y, ymin, ymax, ylabel, title) => { const p = new CQ.Plot(cv.ctx, { x, y, w: W, h: Hh, xmin: 1.4, xmax: 3.4, ymin, ymax, xlabel: 'k_BT/J', ylabel, title }); p.frame(); p.vline(Tc, { color: '--ink-3', dash: [3, 3] }); return p; };
      const pe = mk(0, 0, -2.05, -0.3, 'e', 'energía por espín');
      pe.fn((t) => SM.onsager.u(t), { color: '--ink', dash: [5, 4], width: 1.6, n: 300 });
      const pm = mk(W, 0, 0, 1.05, '⟨|m|⟩', 'magnetización');
      pm.fn((t) => SM.onsager.m(t), { color: '--ink', dash: [5, 4], width: 1.6, n: 400 });
      let cmax = 1.2;
      for (const L in res) for (const r of res[L]) cmax = Math.max(cmax, r.c * 1.1);
      const pc = mk(0, Hh, 0, Math.min(cmax, 4), 'c / k_B', 'calor específico (fluctuaciones)');
      pc.fn((t) => (Math.abs(t - Tc) < 2e-3 ? NaN : SM.onsager.c(t)), { color: '--ink', dash: [5, 4], width: 1.6, n: 600 });
      const pu = mk(W, Hh, 0, 0.72, 'U_4', 'cumulante de Binder');
      pu.hline(2 / 3, { color: '--ink-3', dash: [2, 3] });
      const leg = [];
      const pk = [];
      Object.keys(res).map(Number).sort((a, b) => a - b).forEach((L) => {
        const r = res[L], col = COL[L];
        if (!r.length) return;
        const T = r.map((q) => q.T);
        pe.xy(T, r.map((q) => q.e), { color: col, width: 1.8 }); r.forEach((q) => pe.dot(q.T, q.e, { color: col, r: 2.5 }));
        pm.xy(T, r.map((q) => q.m), { color: col, width: 1.8 }); r.forEach((q) => pm.dot(q.T, q.m, { color: col, r: 2.5 }));
        pc.xy(T, r.map((q) => q.c), { color: col, width: 1.8 }); r.forEach((q) => pc.dot(q.T, q.c, { color: col, r: 2.5 }));
        pu.xy(T, r.map((q) => q.U), { color: col, width: 1.8 }); r.forEach((q) => pu.dot(q.T, q.U, { color: col, r: 2.5 }));
        leg.push({ label: 'L = ' + L, color: col });
        const best = r.reduce((b, q) => (q.c > b.c ? q : b), r[0]);
        pk.push(`L = ${L}: ${CQ.fix(best.T, 2)} · ${CQ.fix(best.c, 2)}`);
      });
      leg.push({ label: 'Onsager (L = ∞)', color: '--ink', dash: [5, 4] });
      pm.legend(leg, 'bl');
      sim.set('st', job ? `calculando L = ${job.L}: T = ${CQ.fix(Ts[job.i], 2)} (${job.i + 1} de ${Ts.length})` : 'listo');
      sim.set('pk', pk.length ? pk.join('<br>') : '—');
      sim.set('ex', `T<sub>c</sub> = ${CQ.fix(Tc, 4)} · c diverge (log)`);
    });
  });

  /* ======================================================================
     25.3 Kawasaki en el panal: carbono en h-BN (pseudo-binaria)
     ====================================================================== */
  CQ.defineSim('kawasaki-aleacion', function (sim) {
    const cl = sim.canvas({ aspect: 1.75 });
    const ca = sim.canvas({ aspect: 3.2 });
    const W0 = H.mixBNC() / 2;
    sim.group('Aleación');
    sim.seg('L', { label: 'Red (sitios)', options: [[24, '24 × 24'], [40, '40 × 40'], [60, '60 × 60']], value: 40 });
    sim.slider('x', { label: 'Fracción de carbono <i>x</i><sub>C</sub>', min: 0.05, max: 0.95, value: 0.3, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('w', { label: 'ε<sub>C–BN</sub> − (ε<sub>CC</sub> + ε<sub>BN</sub>)/2 = ΔE<sub>mix</sub>/2', min: -0.4, max: 0.4, value: W0, step: 0.005, unit: 'eV', fmt: (v) => CQ.fix(v, 3) });
    sim.slider('T', { label: 'Temperatura', min: 300, max: 6000, value: 1200, step: 50, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
    sim.slider('g', { label: 'Fracción de intercambios globales', min: 0, max: 1, value: 0.2, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('sp', { label: 'Barridos por segundo', min: 1, max: 200, value: 20, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('n', 'Barridos');
    sim.out('a', 'Warren–Cowley α<sub>C</sub>', { hl: true });
    sim.out('mix', 'Enlaces C–BN / al azar');
    sim.out('acc', 'Aceptación de intercambios');
    sim.out('tc', '<i>T</i><sub>c</sub> pseudo-binaria (<i>x</i> = 0.5): 1.519·|<i>J</i>|/<i>k</i><sub>B</sub>');
    const rng = P.rng(1966);
    let al, n, hist, acc, lastAcc;
    const reset = () => { al = new SM.Alloy(sim.p.L, sim.p.x, rng, { e: { AA: 0, BB: 0, AB: sim.p.w } }); n = 0; hist = []; acc = 0; lastAcc = 0; };
    reset();
    sim.resetButton(reset);
    sim.onChange = (id) => {
      if (id === 'L' || id === 'x') reset();
      else if (id === 'w') al.e.AB = sim.p.w;
    };
    const sweep = (kT, gf) => {
      const { N, nb } = al.g, s = al.s;
      let ok = 0, tr = 0;
      for (let a = 0; a < N; a++) {
        const k = (rng() * N) | 0, m = rng() < gf ? (rng() * N) | 0 : nb[3 * k + ((rng() * 3) | 0)];
        if (m === k || s[k] === s[m]) continue;
        tr++;
        const dE = al.siteE(k, s[m], m) + al.siteE(m, s[k], k) - al.siteE(k, s[k], m) - al.siteE(m, s[m], k);
        if (dE <= 0 || rng() < Math.exp(-dE / kT)) { const t = s[k]; s[k] = s[m]; s[m] = t; ok++; }
      }
      return tr ? ok / tr : 0;
    };
    sim.animate((dt) => {
      acc += dt * sim.p.sp;
      let k = Math.floor(acc);
      acc -= k;
      k = Math.min(k, 30);
      for (let q = 0; q < k; q++) {
        lastAcc = sweep(KB * sim.p.T, sim.p.g); n++;
        hist.push([n, al.warrenCowley()]);
        if (hist.length > 4000) hist = hist.filter((_, i) => i % 2 === 0);
      }
    });
    sim.onDraw(() => {
      const g = al.g, s = al.s;
      CQ.draw.clear(cl);
      const ctx = cl.ctx;
      /* se dibuja girada 90°: x de pantalla = y de la red */
      const sc = Math.min((cl.w - 16) / (g.H + 0.5), (cl.h - 34) / (g.W + 0.5));
      const ox = (cl.w - sc * g.H) / 2 + sc * 0.25, oy = 26 + (cl.h - 26 - sc * g.W) / 2 + sc * 0.25;
      const r = Math.max(1.4, 0.42 * sc), cB = CQ.col('--atB'), cN = CQ.col('--atN'), cC = CQ.col('--atC');
      for (let k = 0; k < g.N; k++) {
        ctx.fillStyle = s[k] ? cC : g.par[k] ? cB : cN;
        ctx.beginPath(); ctx.arc(ox + g.y[k] * sc, oy + g.x[k] * sc, r, 0, 7); ctx.fill();
      }
      CQ.text(ctx, 'C (gris) en h-BN (B rosado, N azul)', cl.w / 2, 14, { size: 11.5, align: 'center', color: '--ink-2' });
      CQ.draw.clear(ca);
      const n0 = hist.length ? hist[0][0] : 0, n1 = Math.max(50, n);
      const pa = new CQ.Plot(ca.ctx, { x: 0, y: 0, w: ca.w, h: ca.h, xmin: n0, xmax: n1, ymin: -0.6, ymax: 1, xlabel: 'barrido', ylabel: 'α_C', title: 'orden de corto alcance (Warren–Cowley)', mt: 22 });
      pa.frame();
      pa.hline(0, { color: '--ink-3', label: 'al azar', labelRight: true });
      pa.path(hist, { color: '--accent', width: 2 });
      /* enlaces mixtos */
      let mixed = 0, nbonds = 0;
      for (let k = 0; k < g.N; k++) for (let q = 0; q < 3; q++) { const m = g.nb[3 * k + q]; if (m > k) { nbonds++; if (s[k] !== s[m]) mixed++; } }
      let nC = 0; for (let k = 0; k < g.N; k++) nC += s[k];
      const xC = nC / g.N, rand = 2 * xC * (1 - xC) * nbonds;
      const J = sim.p.w / 2;
      sim.set('n', String(n));
      sim.set('a', f3(al.warrenCowley()));
      sim.set('mix', `${mixed} / ${CQ.fix(rand, 0)}`);
      sim.set('acc', CQ.fix(100 * lastAcc, 1) + ' %');
      sim.set('tc', Math.abs(J) > 1e-6 ? CQ.fix((1.518651 * Math.abs(J)) / KB, 0) + ' K' : '— (mezcla ideal)');
    });
  });
})();
