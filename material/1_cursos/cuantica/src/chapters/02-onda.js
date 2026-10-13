/* Capítulo 2 — La función de onda */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M;
  const f3 = (v) => CQ.fix(v, 3);

  /* ======================================================================
     2.1 Paquete a partir de ondas planas
     ====================================================================== */
  CQ.defineSim('paquete-fourier', function (sim) {
    const cx = sim.canvas({ aspect: 2.3 });
    const ck = sim.canvas({ aspect: 3.6 });
    sim.group('Componentes');
    sim.slider('N', { label: 'Número de ondas planas <i>N</i>', min: 1, max: 81, value: 15, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('k0', { label: 'Número de onda central <i>k</i><sub>0</sub>', min: 0, max: 6, value: 3, step: 0.1, fmt: (v) => CQ.fix(v, 1) });
    sim.slider('dk', { label: 'Dispersión Δ<i>k</i>', min: 0.1, max: 1.5, value: 0.5, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.group('Vista');
    sim.check('parts', { label: 'Dibujar algunas componentes', value: true });
    sim.check('re', { label: 'Parte real de ψ', value: true });
    sim.out('dx', 'Δ<i>x</i> (numérico)');
    sim.out('dkk', 'Δ<i>k</i> (de los pesos)');
    sim.out('prod', 'Δ<i>x</i>·Δ<i>k</i>', { hl: true });
    sim.out('per', 'Periodo de repetición 2π/δ<i>k</i>');
    const L = 30, NX = 900;
    sim.onDraw(() => {
      const N = sim.p.N, k0 = sim.p.k0, dk = sim.p.dk;
      const span = 6 * dk;
      const dks = N > 1 ? span / (N - 1) : 0;
      const ks = [], w = [];
      for (let j = 0; j < N; j++) { const k = N > 1 ? k0 - span / 2 + j * dks : k0; ks.push(k); w.push(Math.exp(-((k - k0) ** 2) / (4 * dk * dk))); }
      const xs = P.util.linspace(-L, L, NX);
      const re = new Float64Array(NX), im = new Float64Array(NX);
      for (let i = 0; i < NX; i++) for (let j = 0; j < N; j++) { re[i] += w[j] * Math.cos(ks[j] * xs[i]); im[i] += w[j] * Math.sin(ks[j] * xs[i]); }
      let mx = 0;
      for (let i = 0; i < NX; i++) mx = Math.max(mx, Math.hypot(re[i], im[i]));
      for (let i = 0; i < NX; i++) { re[i] /= mx; im[i] /= mx; }
      CQ.draw.clear(cx);
      const pl = new CQ.Plot(cx.ctx, { x: 0, y: 0, w: cx.w, h: cx.h, xmin: -L, xmax: L, ymin: -1.1, ymax: 1.1, xlabel: 'x', ylabel: 'ψ (normalizada al máximo)' });
      pl.frame();
      if (sim.p.parts && N > 1) {
        const sel = [0, Math.floor(N / 4), Math.floor(N / 2), Math.floor((3 * N) / 4), N - 1];
        const wsum = w.reduce((a, b) => a + b, 0);
        for (const j of [...new Set(sel)]) pl.fn((x) => (w[j] / wsum) * N * 0.12 * Math.cos(ks[j] * x), { color: '--ink-3', width: 0.9, alpha: 0.6, n: 700 });
      }
      CQ.drawPhaseCurve(pl, xs, re, im, { scale: 1 });
      if (sim.p.re) pl.xy(xs, re, { color: '--c1', width: 1.4 });
      pl.xy(xs, Array.from(re, (v, i) => Math.hypot(v, im[i])), { color: '--ink', width: 1.6 });
      /* espacio k */
      CQ.draw.clear(ck);
      const pk = new CQ.Plot(ck.ctx, { x: 0, y: 0, w: ck.w, h: ck.h, xmin: -0.5, xmax: 8, ymin: 0, ymax: 1.15, xlabel: 'k', ylabel: 'peso', yticks: [0, 0.5, 1], mt: 10 });
      pk.frame();
      pk.fn((k) => Math.exp(-((k - k0) ** 2) / (4 * dk * dk)), { color: '--c5', width: 1.2, dash: [4, 3] });
      pk.clip((ctx) => {
        ctx.strokeStyle = CQ.col('--accent'); ctx.lineWidth = 2;
        for (let j = 0; j < N; j++) { ctx.beginPath(); ctx.moveTo(pk.X(ks[j]), pk.Y(0)); ctx.lineTo(pk.X(ks[j]), pk.Y(w[j])); ctx.stroke(); }
      });
      /* anchuras en un periodo centrado */
      const per = dks > 0 ? (2 * Math.PI) / dks : Infinity;
      const half = Math.min(L, per / 2);
      let n0 = 0, m1 = 0, m2 = 0;
      for (let i = 0; i < NX; i++) if (Math.abs(xs[i]) <= half) { const p = re[i] * re[i] + im[i] * im[i]; n0 += p; m1 += p * xs[i]; m2 += p * xs[i] * xs[i]; }
      const dx = Math.sqrt(Math.max(0, m2 / n0 - (m1 / n0) ** 2));
      const w2 = w.map((v) => v * v), sw = w2.reduce((a, b) => a + b, 0);
      const km = ks.reduce((s, k, j) => s + k * w2[j], 0) / sw;
      const dkk = Math.sqrt(ks.reduce((s, k, j) => s + (k - km) ** 2 * w2[j], 0) / sw);
      sim.set('dx', N > 1 ? f3(dx) : '∞ (onda plana)');
      sim.set('dkk', f3(dkk));
      sim.set('prod', N > 1 ? f3(dx * dkk) + ' (mín. 0.5)' : '—');
      sim.set('per', isFinite(per) ? CQ.fix(per, 1) : '∞');
    });
  });

  /* ======================================================================
     2.2 Paquete que evoluciona (Crank–Nicolson)
     ====================================================================== */
  CQ.defineSim('paquete-libre', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.group('Paquete inicial (ħ = m = 1)');
    sim.slider('s0', { label: 'Anchura inicial σ<sub>0</sub>', min: 0.4, max: 3, value: 1, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('k0', { label: 'Número de onda <i>k</i><sub>0</sub>', min: -4, max: 4, value: 2, step: 0.1, fmt: (v) => CQ.fix(v, 1) });
    sim.group('Potencial');
    sim.select('pot', { options: [['libre', 'Partícula libre'], ['pared', 'Pared impenetrable en x = 12'], ['escalon', 'Escalón en x = 5'], ['barrera', 'Barrera de ancho 1 en x = 5']], value: 'libre' });
    sim.slider('V0', { label: 'Altura <i>V</i><sub>0</sub>', min: 0.5, max: 6, value: 2, step: 0.1, fmt: (v) => CQ.fix(v, 1) });
    sim.check('re', { label: 'Parte real de ψ', value: false });
    sim.out('t', 'Tiempo <i>t</i>');
    sim.out('n', 'Norma ∫|ψ|²d<i>x</i>', { hl: true });
    sim.out('xm', '⟨<i>x</i>⟩');
    sim.out('sx', 'σ<sub>x</sub> numérica', { hl: true });
    sim.out('se', 'σ<sub>x</sub> exacta (libre)');
    sim.out('pm', '⟨<i>p</i>⟩ y Δ<i>p</i>');
    sim.out('Tr', 'Probabilidad a la derecha del obstáculo');
    const X0 = -40, X1 = 40, NX = 1601;
    const x = P.util.linspace(X0, X1, NX);
    const dt = 0.01;
    let cn, re, im, t = 0;
    const Vf = () => {
      const V0 = sim.p.V0;
      switch (sim.p.pot) {
        case 'pared': return (xx) => (xx >= 12 ? 1e4 : 0);
        case 'escalon': return (xx) => (xx >= 5 ? V0 : 0);
        case 'barrera': return (xx) => (xx >= 5 && xx <= 6 ? V0 : 0);
        default: return () => 0;
      }
    };
    const reset = () => {
      cn = new P.q1d.CrankNicolson(x, Vf(), dt);
      [re, im] = P.q1d.gaussPacket(x, -15, sim.p.s0, sim.p.k0);
      t = 0;
    };
    reset();
    sim.resetButton(reset);
    sim.onChange = (id) => { if (id !== 're') reset(); sim.ctl.V0.show(sim.p.pot === 'escalon' || sim.p.pot === 'barrera'); };
    sim.ctl.V0.show(false);
    sim.animate((ft) => {
      const steps = Math.max(1, Math.round(ft / 0.008));
      for (let s = 0; s < Math.min(steps, 6); s++) { [re, im] = cn.step(re, im); t += dt; }
      if (t > 14) reset();
    });
    sim.onDraw(() => {
      CQ.draw.clear(cv);
      const peak = 1 / Math.sqrt(2 * Math.PI * sim.p.s0 * sim.p.s0);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -30, xmax: 30, ymin: -0.25 * peak, ymax: 1.15 * peak, xlabel: 'x', ylabel: '|ψ|², coloreada por la fase' });
      pl.frame();
      const V = Vf();
      if (sim.p.pot !== 'libre') {
        const vmax = sim.p.pot === 'pared' ? 1 : sim.p.V0;
        pl.fn((xx) => (Math.min(V(xx), vmax) / Math.max(vmax, 1e-9)) * 0.9 * peak, { color: '--ink-3', width: 1.8, n: 1200, fill: '--ink-3', fillAlpha: 0.12 });
      }
      CQ.drawPhaseCurve(pl, x, re, im, { scale: 1 });
      if (sim.p.re) pl.xy(x, re, { color: '--c1', width: 1.1, alpha: 0.9 });
      const m = P.q1d.moments(x, re, im);
      if (sim.p.pot === 'libre') {
        const se = P.q1d.freeWidth(sim.p.s0, t), xc = -15 + sim.p.k0 * t;
        pl.fn((xx) => Math.exp(-((xx - xc) ** 2) / (2 * se * se)) / Math.sqrt(2 * Math.PI * se * se), { color: '--ink', width: 1.3, dash: [5, 4], n: 600 });
        sim.set('se', f3(se));
      } else sim.set('se', '—');
      const pm = P.q1d.momentumStats(x, re, im);
      let right = 0;
      const xb = sim.p.pot === 'pared' ? 12 : sim.p.pot === 'barrera' ? 6 : 5;
      for (let i = 0; i < NX; i++) if (x[i] > xb) right += re[i] * re[i] + im[i] * im[i];
      right *= x[1] - x[0];
      sim.set('t', CQ.fix(t, 2));
      sim.set('n', CQ.fix(m.norm, 9));
      sim.set('xm', f3(m.mean));
      sim.set('sx', f3(m.sigma));
      sim.set('pm', `${CQ.fix(pm.mean, 3)} · ${CQ.fix(pm.sigma, 3)}`);
      sim.set('Tr', sim.p.pot === 'libre' ? '—' : CQ.fix(right, 4));
    });
  });

  /* ======================================================================
     2.3 Medidas repetidas de la posición
     ====================================================================== */
  CQ.defineSim('medida-posicion', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    const STATES = {
      b1: { n: 'Caja, n = 1', f: (x) => Math.sqrt(2) * Math.sin(Math.PI * x) },
      b2: { n: 'Caja, n = 2', f: (x) => Math.sqrt(2) * Math.sin(2 * Math.PI * x) },
      b3: { n: 'Caja, n = 3', f: (x) => Math.sqrt(2) * Math.sin(3 * Math.PI * x) },
      sup: { n: 'Superposición (ψ₁ + ψ₂)/√2', f: (x) => Math.sin(Math.PI * x) + Math.sin(2 * Math.PI * x) },
      gau: { n: 'Gaussiana centrada en 0.35', f: (x) => Math.exp(-((x - 0.35) ** 2) / (4 * 0.08 * 0.08)) }
    };
    sim.group('Estado');
    sim.select('st', { options: Object.keys(STATES).map((k) => [k, STATES[k].n]), value: 'b1' });
    sim.group('Medir');
    sim.slider('nb', { label: 'Barras del histograma', min: 10, max: 80, value: 40, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.check('auto', { label: 'Medir continuamente', value: true });
    const rng = P.rng(99);
    let data = [], last = null;
    const NG = 2001, xs = P.util.linspace(0, 1, NG);
    let pdf, cdf, xm, sx;
    const prep = () => {
      const f = STATES[sim.p.st].f;
      pdf = xs.map((x) => f(x) ** 2);
      const h = 1 / (NG - 1), Z = P.integ.simpson(pdf, h);
      pdf = pdf.map((v) => v / Z);
      cdf = new Float64Array(NG);
      for (let i = 1; i < NG; i++) cdf[i] = cdf[i - 1] + 0.5 * h * (pdf[i] + pdf[i - 1]);
      xm = P.integ.simpson(xs.map((x, i) => x * pdf[i]), h);
      sx = Math.sqrt(P.integ.simpson(xs.map((x, i) => (x - xm) ** 2 * pdf[i]), h));
      data = []; last = null;
    };
    const sample = () => {
      const u = rng() * cdf[NG - 1];
      let lo = 0, hi = NG - 1;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cdf[mid] < u) lo = mid; else hi = mid; }
      const x = xs[lo] + ((u - cdf[lo]) / Math.max(1e-300, cdf[hi] - cdf[lo])) * (xs[hi] - xs[lo]);
      data.push(x); last = x;
    };
    prep();
    sim.onChange = (id) => { if (id === 'st') prep(); };
    sim.button('Medir 1', () => sample(), { primary: true });
    sim.button('+100', () => { for (let i = 0; i < 100; i++) sample(); });
    sim.button('+10 000', () => { for (let i = 0; i < 10000; i++) sample(); });
    sim.button('Borrar', () => { data = []; last = null; }, { newRow: true });
    sim.out('N', 'Medidas <i>N</i>', { hl: true });
    sim.out('mean', 'Promedio ± error estándar');
    sim.out('ex', '⟨<i>x</i>⟩ exacto');
    sim.out('sd', 'Desviación: muestra / exacta');
    let acc = 0;
    sim.animate((dt) => { if (!sim.p.auto) return; acc += dt * 40; while (acc > 1) { acc -= 1; sample(); } });
    sim.onDraw(() => {
      CQ.draw.clear(cv);
      const ymax = Math.max(...pdf) * 1.35;
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax, xlabel: 'x / L', ylabel: 'densidad de probabilidad' });
      pl.frame();
      if (data.length) CQ.drawHist(pl, P.stat.hist(data, 0, 1, sim.p.nb), { color: '--c1' });
      pl.xy(xs, pdf, { color: '--prob', width: 2.4 });
      pl.vline(xm, { color: '--prob', label: '⟨x⟩' });
      if (last !== null) {
        const ctx = cv.ctx;
        ctx.save(); ctx.fillStyle = CQ.col('--accent');
        ctx.beginPath(); ctx.moveTo(pl.X(last), pl.Y(ymax * 0.97)); ctx.lineTo(pl.X(last) - 6, pl.Y(ymax * 0.97) - 10); ctx.lineTo(pl.X(last) + 6, pl.Y(ymax * 0.97) - 10); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      const n = data.length;
      const m = n ? P.stat.mean(data) : NaN, s = n > 1 ? P.stat.std(data) : NaN;
      sim.set('N', String(n));
      sim.set('mean', n > 1 ? `${CQ.fix(m, 4)} ± ${CQ.fix(s / Math.sqrt(n), 4)}` : n ? CQ.fix(m, 4) : '—');
      sim.set('ex', CQ.fix(xm, 4));
      sim.set('sd', n > 1 ? `${CQ.fix(s, 4)} / ${CQ.fix(sx, 4)}` : `— / ${CQ.fix(sx, 4)}`);
    });
  });
})();
