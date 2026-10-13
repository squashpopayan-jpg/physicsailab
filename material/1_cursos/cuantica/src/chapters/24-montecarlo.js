/* Capítulo 24 — Monte Carlo y el algoritmo de Metropolis */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, SM = P.sm, LA = P.la;
  const f3 = (v) => CQ.fix(v, 3), f4 = (v) => CQ.fix(v, 4);

  /* ======================================================================
     24.1 Estimar π
     ====================================================================== */
  CQ.defineSim('mc-pi', function (sim) {
    sim.cols2();
    const cq = sim.canvas({ aspect: 1 });
    const ce = sim.canvas({ aspect: 1 });
    sim.group('Lanzamientos');
    sim.slider('rate', { label: 'Puntos por segundo (en cada réplica)', min: 10, max: 50000, value: 600, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.note('Se lanzan 8 réplicas independientes a la vez (semillas distintas); el cuadrado muestra la primera.');
    sim.out('N', 'Puntos por réplica <i>N</i>');
    sim.out('pi', 'π estimado (réplica 1)', { hl: true });
    sim.out('err', 'Error rms de las 8 réplicas');
    sim.out('th', 'Error esperado 4√(<i>p</i>(1−<i>p</i>)/<i>N</i>)');
    const R = 8, pth = Math.PI / 4, sth = 4 * Math.sqrt(pth * (1 - pth));
    let rng, hits, N, pts, hist, nextRec, acc;
    const reset = () => {
      rng = Array.from({ length: R }, (_, i) => P.rng(1000 + 17 * i));
      hits = new Float64Array(R); N = 0; pts = []; hist = []; nextRec = 1; acc = 0;
    };
    reset();
    sim.resetButton(reset);
    sim.animate((dt) => {
      acc += dt * sim.p.rate;
      let n = Math.floor(acc);
      acc -= n;
      n = Math.min(n, 200000);
      for (let q = 0; q < n; q++) {
        N++;
        for (let r = 0; r < R; r++) {
          const x = 2 * rng[r]() - 1, y = 2 * rng[r]() - 1, inn = x * x + y * y <= 1;
          if (inn) hits[r]++;
          if (r === 0 && pts.length < 6000) pts.push([x, y, inn]);
        }
        if (N >= nextRec) {
          let s2 = 0;
          const est = [];
          for (let r = 0; r < R; r++) { const e = (4 * hits[r]) / N; est.push(e); s2 += (e - Math.PI) ** 2; }
          hist.push({ N, rms: Math.sqrt(s2 / R), est });
          nextRec = Math.max(nextRec + 1, Math.round(nextRec * 1.12));
        }
      }
    });
    sim.onDraw(() => {
      /* cuadrado con el círculo */
      CQ.draw.clear(cq);
      const ctx = cq.ctx, W = cq.w, H = cq.h, S = Math.min(W, H) - 40, x0 = (W - S) / 2, y0 = (H - S) / 2 + 6;
      ctx.strokeStyle = CQ.col('--axis'); ctx.lineWidth = 1; ctx.strokeRect(x0, y0, S, S);
      ctx.beginPath(); ctx.arc(x0 + S / 2, y0 + S / 2, S / 2, 0, 7); ctx.strokeStyle = CQ.col('--ink-2'); ctx.lineWidth = 1.4; ctx.stroke();
      const cin = CQ.col('--c1'), cout = CQ.col('--c2'), rr = pts.length > 2000 ? 1.3 : 2;
      for (const p of pts) { ctx.fillStyle = p[2] ? cin : cout; ctx.fillRect(x0 + ((p[0] + 1) / 2) * S - rr / 2, y0 + ((1 - p[1]) / 2) * S - rr / 2, rr, rr); }
      CQ.text(ctx, `dentro / total → π/4   (se dibujan ${Math.min(pts.length, 6000)} puntos)`, W / 2, 14, { size: 11.5, align: 'center', color: '--ink-2' });
      /* error frente a N en escala log-log */
      CQ.draw.clear(ce);
      const Nmax = Math.max(1e3, N * 1.5);
      const pe = new CQ.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: 0, xmax: Math.log10(Nmax), ymin: -5, ymax: 0.7, xlabel: 'log₁₀ N', ylabel: 'log₁₀ |π_{est} − π|', title: 'el error cae como 1/√N' });
      pe.frame();
      pe.fn((lx) => Math.log10(sth / Math.sqrt(Math.pow(10, lx))), { color: '--c2', width: 2, dash: [6, 4] });
      for (let r = 0; r < R; r++) {
        const xs = [], ys = [];
        for (const h of hist) { const e = Math.abs(h.est[r] - Math.PI); if (e > 0) { xs.push(Math.log10(h.N)); ys.push(Math.log10(e)); } }
        pe.xy(xs, ys, { color: CQ.alpha('--c1', 0.35), width: 1 });
      }
      pe.xy(hist.map((h) => Math.log10(h.N)), hist.map((h) => Math.log10(Math.max(1e-9, h.rms))), { color: '--accent', width: 2.6 });
      pe.legend([{ label: 'cada réplica', color: CQ.alpha('--c1', 0.6) }, { label: 'error rms', color: '--accent' }, { label: '1.64/√N (teoría)', color: '--c2', dash: [6, 4] }], 'bl');
      sim.set('N', String(N));
      sim.set('pi', N ? CQ.fix((4 * hits[0]) / N, 5) : '—');
      sim.set('err', hist.length ? CQ.sci(hist[hist.length - 1].rms, 2) : '—');
      sim.set('th', N ? CQ.sci(sth / Math.sqrt(N), 2) : '—');
    });
  });

  /* ======================================================================
     24.2 Cadena de Markov de tres estados
     ====================================================================== */
  CQ.defineSim('markov3', function (sim) {
    sim.cols2();
    const cb = sim.canvas({ aspect: 0.78 });
    const ct = sim.canvas({ aspect: 0.78 });
    sim.group('Estados y temperatura');
    sim.note('Energías: <i>E</i><sub>1</sub> = 0. Propuesta: uno de los otros dos estados, con probabilidad ½ cada uno.');
    sim.slider('E2', { label: '<i>E</i><sub>2</sub>', min: 0, max: 3, value: 0.5, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('E3', { label: '<i>E</i><sub>3</sub>', min: 0, max: 3, value: 1.2, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('kT', { label: '<i>k</i><sub>B</sub><i>T</i>', min: 0.1, max: 5, value: 0.6, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.seg('ini', { label: 'Estado inicial', options: [['1', 'Todo en 1'], ['3', 'Todo en 3'], ['u', 'Uniforme']], value: '3' });
    sim.slider('sp', { label: 'Pasos por segundo', min: 1, max: 60, value: 6, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('pi', 'Boltzmann π<sub><i>i</i></sub>');
    sim.out('p', 'Distribución <i>p</i>(<i>n</i>)', { hl: true });
    sim.out('W', 'Matriz de transición <i>W<sub>ij</sub></i>');
    sim.out('fl', 'Flujos π<sub>1</sub><i>W</i><sub>12</sub> · π<sub>2</sub><i>W</i><sub>21</sub>');
    sim.out('l2', 'Segundo autovalor λ<sub>2</sub> (‖<i>p</i> − π‖ ∝ λ<sub>2</sub><sup><i>n</i></sup>)');
    const rng = P.rng(3);
    let p, n, hist, walker, visits, acc;
    const reset = () => {
      const i0 = sim.p.ini;
      p = i0 === 'u' ? [1 / 3, 1 / 3, 1 / 3] : i0 === '1' ? [1, 0, 0] : [0, 0, 1];
      n = 0; hist = [p.slice()]; walker = i0 === '1' ? 0 : i0 === '3' ? 2 : 1; visits = [0, 0, 0]; acc = 0;
    };
    reset();
    sim.resetButton(reset);
    sim.onChange = (id) => { if (id !== 'sp') reset(); };
    const W = () => SM.markov3([0, sim.p.E2, sim.p.E3], sim.p.kT);
    sim.animate((dt) => {
      acc += dt * sim.p.sp;
      const T = W();
      while (acc > 1) {
        acc -= 1; n++;
        p = SM.markovStep(p, T);
        hist.push(p.slice());
        if (hist.length > 400) hist.shift();
        /* un caminante individual: 20 pasos por paso de la gráfica */
        for (let q = 0; q < 20; q++) {
          const u = rng();
          let j = 0, c = T[walker][0];
          while (u > c && j < 2) { j++; c += T[walker][j]; }
          walker = j; visits[walker]++;
        }
      }
    });
    sim.onDraw(() => {
      const E = [0, sim.p.E2, sim.p.E3], kT = sim.p.kT, T = W();
      const w = E.map((e) => Math.exp(-e / kT)), Z = w[0] + w[1] + w[2], pi = w.map((x) => x / Z);
      const nv = visits[0] + visits[1] + visits[2];
      CQ.draw.clear(cb);
      const pb = new CQ.Plot(cb.ctx, { x: 0, y: 0, w: cb.w, h: cb.h, xmin: 0.4, xmax: 3.6, ymin: 0, ymax: 1.05, xticks: [1, 2, 3], xfmt: (v) => 'estado ' + v, ylabel: 'probabilidad', title: `paso n = ${n}` });
      pb.frame();
      pb.clip((ctx) => {
        for (let i = 0; i < 3; i++) {
          const xc = i + 1;
          ctx.fillStyle = CQ.alpha('--accent', 0.75);
          ctx.fillRect(pb.X(xc - 0.34), pb.Y(p[i]), pb.X(xc - 0.04) - pb.X(xc - 0.34), pb.Y(0) - pb.Y(p[i]));
          if (nv) { const f = visits[i] / nv; ctx.fillStyle = CQ.alpha('--c3', 0.55); ctx.fillRect(pb.X(xc + 0.04), pb.Y(f), pb.X(xc + 0.34) - pb.X(xc + 0.04), pb.Y(0) - pb.Y(f)); }
          ctx.strokeStyle = CQ.col('--ink'); ctx.lineWidth = 2; ctx.setLineDash([5, 3]);
          ctx.beginPath(); ctx.moveTo(pb.X(xc - 0.42), pb.Y(pi[i])); ctx.lineTo(pb.X(xc + 0.42), pb.Y(pi[i])); ctx.stroke(); ctx.setLineDash([]);
        }
      });
      pb.legend([{ label: 'p(n) de la cadena', color: '--accent', kind: 'sq' }, { label: 'visitas de un caminante', color: '--c3', kind: 'sq' }, { label: 'Boltzmann', color: '--ink', dash: [5, 3] }], 'tr');
      CQ.draw.clear(ct);
      const n0 = n - hist.length + 1, nm = Math.max(30, n + 2);
      const pt = new CQ.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: Math.max(0, n0), xmax: Math.max(nm, n0 + 30), ymin: 0, ymax: 1.02, xlabel: 'paso n', ylabel: 'p_i(n)', title: 'convergencia al equilibrio' });
      pt.frame();
      const cols = ['--c1', '--c3', '--c2'];
      for (let i = 0; i < 3; i++) {
        pt.hline(pi[i], { color: cols[i], dash: [5, 4] });
        pt.xy(hist.map((_, k) => n0 + k), hist.map((h) => h[i]), { color: cols[i], width: 2.2 });
      }
      pt.legend([{ label: 'estado 1', color: cols[0] }, { label: 'estado 2', color: cols[1] }, { label: 'estado 3', color: cols[2] }], 'tr');
      /* autovalores de la matriz simetrizada D^{1/2} W D^{−1/2} */
      const Sm = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (Math.sqrt(pi[i]) * T[i][j]) / Math.sqrt(pi[j])));
      const ev = LA.eigh(Sm, { vectors: false }).values.slice().sort((a, b) => Math.abs(b) - Math.abs(a));
      sim.set('pi', pi.map(f3).join(' · '));
      sim.set('p', p.map(f3).join(' · '));
      sim.set('W', CQ.matHTML(T, { fmt: (v) => CQ.fix(v, 2) }));
      sim.set('fl', `${CQ.fix(pi[0] * T[0][1], 4)} · ${CQ.fix(pi[1] * T[1][0], 4)}`);
      sim.set('l2', f4(ev[1]));
    });
  });

  /* ======================================================================
     24.3 Metropolis en 1D
     ====================================================================== */
  CQ.defineSim('metropolis-1d', function (sim) {
    sim.cols2();
    const cl = sim.canvas({ aspect: 0.92 });
    const cr = sim.canvas({ aspect: 0.92 });
    const POT = {
      arm: { n: 'Armónico  V = x²/2', V: (x) => 0.5 * x * x },
      doble: { n: 'Doble pozo  V = (x² − 1)²', V: (x) => (x * x - 1) ** 2 },
      asim: { n: 'Doble pozo inclinado  (x² − 1)² + 0.3x', V: (x) => (x * x - 1) ** 2 + 0.3 * x },
      rug: { n: 'Rugoso  x²/2 + 0.35 cos 8x', V: (x) => 0.5 * x * x + 0.35 * Math.cos(8 * x) }
    };
    sim.group('Paisaje y temperatura');
    sim.select('pot', { options: Object.keys(POT).map((k) => [k, POT[k].n]), value: 'doble' });
    sim.slider('T', { label: '<i>k</i><sub>B</sub><i>T</i> (unidades de <i>V</i>)', min: 0.03, max: 2, value: 0.25, log: true, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('st', { label: 'Tamaño máximo del paso δ', min: 0.01, max: 4, value: 0.5, log: true, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('rate', { label: 'Pasos por segundo', min: 10, max: 200000, value: 2000, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('n', 'Pasos');
    sim.out('acc', 'Aceptación', { hl: true });
    sim.out('x2', '⟨<i>x</i>²⟩ muestra / exacto');
    sim.out('right', 'Fracción en <i>x</i> &gt; 0 muestra / exacto');
    sim.out('cross', 'Cruces de la barrera (x = 0)');
    const rng = P.rng(53), lo = -3, hi = 3, nb = 90, bw = (hi - lo) / nb;
    let x, v, n, nacc, counts, s2, nr, trace, acc, cross, exact = null, ekey = '';
    const reset = () => { x = -1; v = POT[sim.p.pot].V(x); n = 0; nacc = 0; counts = new Float64Array(nb); s2 = 0; nr = 0; trace = []; acc = 0; cross = 0; };
    reset();
    sim.resetButton(reset);
    sim.onChange = (id) => { if (id !== 'rate') reset(); };
    const getExact = () => {
      const key = sim.p.pot + '|' + sim.p.T;
      if (key !== ekey) {
        const V = POT[sim.p.pot].V, b = SM.boltz1D(V, sim.p.T, -6, 6, 4000);
        const fx2 = new Float64Array(b.x.length), fr = new Float64Array(b.x.length);
        for (let i = 0; i < b.x.length; i++) { fx2[i] = b.x[i] * b.x[i] * b.p[i]; fr[i] = b.x[i] > 0 ? b.p[i] : 0; }
        exact = { b, x2: P.integ.simpson(fx2, b.h), right: P.integ.simpson(fr, b.h) };
        ekey = key;
      }
      return exact;
    };
    sim.animate((dt) => {
      const V = POT[sim.p.pot].V, T = sim.p.T, d = sim.p.st;
      acc += dt * sim.p.rate;
      let k = Math.min(Math.floor(acc), 400000);
      acc -= Math.floor(acc);
      const every = Math.max(1, Math.round(sim.p.rate / 300));
      while (k-- > 0) {
        const y = x + d * (2 * rng() - 1), vy = V(y);
        if (vy <= v || rng() < Math.exp(-(vy - v) / T)) { if (y * x < 0) cross++; x = y; v = vy; nacc++; }
        n++;
        const bi = Math.floor((x - lo) / bw);
        if (bi >= 0 && bi < nb) counts[bi]++;
        s2 += x * x; if (x > 0) nr++;
        if (n % every === 0) { trace.push([n, x]); if (trace.length > 1500) trace.shift(); }
      }
    });
    sim.onDraw(() => {
      const V = POT[sim.p.pot].V, T = sim.p.T, ex = getExact();
      CQ.draw.clear(cl);
      const hTop = cl.h * 0.42;
      const pv = new CQ.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: hTop, xmin: lo, xmax: hi, ymin: -0.4, ymax: 2.5, xlabel: '', ylabel: 'V(x)', title: 'paisaje de energía y caminante', mb: 18 });
      pv.frame();
      pv.fn(V, { color: '--ink', width: 2, n: 400 });
      let vmin = Infinity;
      for (let q = 0; q <= 300; q++) vmin = Math.min(vmin, V(lo + ((hi - lo) * q) / 300));
      pv.hline(vmin + T, { color: '--c2', dash: [4, 4], label: 'V_{mín} + k_BT', labelRight: true });
      pv.dot(x, V(x), { color: '--accent', r: 6 });
      const ph = new CQ.Plot(cl.ctx, { x: 0, y: hTop, w: cl.w, h: cl.h - hTop, xmin: lo, xmax: hi, ymin: 0, ymax: 1, xlabel: 'x', ylabel: 'densidad' });
      let pmax = 0;
      for (let i = 0; i < ex.b.x.length; i++) if (ex.b.x[i] >= lo && ex.b.x[i] <= hi) pmax = Math.max(pmax, ex.b.p[i]);
      const dens = Array.from(counts, (c) => (n ? c / (n * bw) : 0));
      ph.set({ ymax: Math.max(pmax, ...dens) * 1.12 || 1 });
      ph.frame();
      CQ.drawHist(ph, { nb, lo, w: bw, dens }, { color: '--c1' });
      ph.xy(Array.from(ex.b.x), Array.from(ex.b.p), { color: '--c2', width: 2.2 });
      ph.legend([{ label: 'histograma de Metropolis', color: '--c1', kind: 'sq' }, { label: 'e^{−V/k_BT}/Z exacta', color: '--c2' }], 'tr');
      CQ.draw.clear(cr);
      const n0 = trace.length ? trace[0][0] : 0, n1 = Math.max(n0 + 10, n);
      const pt = new CQ.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: n0, xmax: n1, ymin: lo, ymax: hi, xlabel: 'paso de Monte Carlo', ylabel: 'x', title: 'trayectoria x(n)' });
      pt.frame();
      pt.path(trace, { color: '--accent', width: 1.2 });
      sim.set('n', String(n));
      sim.set('acc', n ? CQ.fix((100 * nacc) / n, 1) + ' %' : '—');
      sim.set('x2', n ? `${f3(s2 / n)} / ${f3(ex.x2)}` : '—');
      sim.set('right', n ? `${f3(nr / n)} / ${f3(ex.right)}` : '—');
      sim.set('cross', String(cross));
    });
  });

  /* ======================================================================
     24.4 Generadores pseudoaleatorios
     ====================================================================== */
  CQ.defineSim('rng', function (sim) {
    sim.cols2();
    const c3 = sim.canvas({ aspect: 1 });
    const ch = sim.canvas({ aspect: 1 });
    const v3 = new CQ.View3D(sim, c3, { radius: 1.05, az: M.rad(30), el: M.rad(22), persp: 0 });
    sim.group('Generador');
    sim.seg('g', { label: 'Algoritmo', options: [['randu', 'RANDU (1960s)'], ['mb', 'Mulberry32 (hBN-MC)']], value: 'randu' });
    sim.slider('seed', { label: 'Semilla', min: 1, max: 99, value: 1, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('N', { label: 'Ternas (x<sub><i>k</i></sub>, x<sub><i>k</i>+1</sub>, x<sub><i>k</i>+2</sub>)', min: 500, max: 6000, value: 3000, step: 100, fmt: (v) => CQ.fix(v, 0) });
    sim.button('Mirar de canto a los planos', () => { v3.az = Math.atan2(9, 6) + Math.PI; v3.el = 0.001; v3.zoom = 1; }, { primary: true });
    sim.out('first', 'Primeros tres números');
    sim.out('mean', 'Media (ideal 0.5) · varianza (ideal 1/12 = 0.0833)');
    sim.out('pl', 'Valores distintos de 9<i>x</i><sub><i>k</i></sub> − 6<i>x</i><sub><i>k</i>+1</sub> + <i>x</i><sub><i>k</i>+2</sub>', { hl: true });
    sim.onDraw(() => {
      const gen = sim.p.g === 'randu' ? P.lcg(2 * 7919 * sim.p.seed + 1) : P.rng(sim.p.seed);
      const N = sim.p.N, xs = new Float64Array(N + 2);
      for (let i = 0; i < N + 2; i++) xs[i] = gen();
      v3.begin();
      const e = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => v3.line(e[a].map((q) => q - 0.5), e[b].map((q) => q - 0.5), { color: '--axis', width: 1 }));
      const col = CQ.col(sim.p.g === 'randu' ? '--c2' : '--c1');
      for (let i = 0; i < N; i++) v3.point([xs[i] - 0.5, xs[i + 1] - 0.5, xs[i + 2] - 0.5], { r: 1.5, color: col, ring: false });
      v3.render();
      CQ.text(c3.ctx, 'arrastre para girar el cubo', 8, c3.h - 10, { size: 11, color: '--ink-3' });
      /* combinación 9x − 6y + z: para RANDU es siempre entera */
      const comb = new Float64Array(N);
      let s = 0, s2 = 0;
      const seen = new Set();
      for (let i = 0; i < N; i++) { comb[i] = 9 * xs[i] - 6 * xs[i + 1] + xs[i + 2]; s += xs[i]; s2 += xs[i] * xs[i]; seen.add(Math.round(comb[i] * 1e6)); }
      CQ.draw.clear(ch);
      const lo = -6.5, hi = 10.5, nb = 170, bw = (hi - lo) / nb, counts = new Float64Array(nb);
      for (const c of comb) { const b = Math.floor((c - lo) / bw); if (b >= 0 && b < nb) counts[b]++; }
      const ph = new CQ.Plot(ch.ctx, { x: 0, y: 0, w: ch.w, h: ch.h, xmin: lo, xmax: hi, ymin: 0, ymax: Math.max(...counts) * 1.1, xlabel: '9x_k − 6x_{k+1} + x_{k+2}', ylabel: 'cuentas', title: sim.p.g === 'randu' ? 'RANDU: 15 valores → 15 planos' : 'Mulberry32: valores continuos' });
      ph.frame();
      CQ.drawHist(ph, { nb, lo, w: bw, counts }, { color: sim.p.g === 'randu' ? '--c2' : '--c1', counts: true, alpha: 0.7 });
      const m = s / N, va = s2 / N - m * m;
      sim.set('first', Array.from(xs.slice(0, 3)).map((q) => CQ.fix(q, 6)).join(' · '));
      sim.set('mean', `${f4(m)} · ${f4(va)}`);
      sim.set('pl', seen.size > 50 ? `${seen.size} (todos distintos)` : `${seen.size} (los planos)`);
    });
  });
})();
