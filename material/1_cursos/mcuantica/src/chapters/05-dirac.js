/* Capítulo 5 — Espacios de Hilbert y notación de Dirac */
(function () {
  'use strict';
  const EM = window.EM, LA = EM.P.la, Q = EM.P.q1d;

  /* 5.1 Mecánica matricial: el hamiltoniano de una partícula en una caja, escrito en la base de la caja */
  const POT = {
    lin: ['Campo uniforme  V = F (x − ½)', (F) => (x) => F * (x - 0.5), 'F'],
    arm: ['Parábola  V = ½ k (x − ½)²', (k) => (x) => 0.5 * k * (x - 0.5) ** 2, 'k'],
    esc: ['Escalón  V = V₀ para x > ½', (V0) => (x) => (x > 0.5 ? V0 : 0), 'V₀'],
    del: ['Barrera fina en el centro  V = g δ(x − ½)', null, 'g']
  };
  const E1 = Math.PI * Math.PI / 2; /* ħ = m = L = 1 */
  EM.defineSim('matriz', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('v', { label: 'Potencial añadido dentro de la caja (unidades de E₁ = π²/2)', options: Object.entries(POT).map(([k, v]) => [k, v[0]]), value: 'lin' });
    sim.slider('s', { label: 'Intensidad del potencial (F, k, V₀ o g)', min: 0, max: 100, step: 0.5, value: 30, fmt: (v) => EM.fix(v, 1) });
    sim.slider('N', { label: 'Tamaño de la base: N estados de la caja', min: 1, max: 30, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.out('E', 'Energías de los cuatro estados más bajos con <i>N</i> estados de base', { hl: true });
    sim.out('X', 'Valores «exactos» (diferencias finitas, 2000 puntos) · error del nivel más bajo');
    sim.out('V', 'Elemento de matriz <i>H</i><sub>12</sub> · acoplamiento que mezcla ψ₁ y ψ₂');
    const NMAX = 30, M = 2000;
    const phi = (n, x) => Math.SQRT2 * Math.sin(n * Math.PI * x);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, N = Math.round(p.N), [nm, fac, lab] = POT[p.v], s = p.s;
      EM.draw.clear(cv);
      const xs = Array.from({ length: M + 1 }, (_, i) => i / M), w = (i) => (i === 0 || i === M ? 1 : i % 2 ? 4 : 2) / (3 * M);
      const Vf = p.v === 'del' ? null : fac(s);
      /* elementos de matriz de V en la base completa de 30 estados */
      const H = LA.zeros(NMAX, NMAX);
      for (let m = 1; m <= NMAX; m++) for (let n = m; n <= NMAX; n++) {
        let v = 0;
        if (p.v === 'del') v = s * phi(m, 0.5) * phi(n, 0.5); else for (let i = 0; i <= M; i++) v += w(i) * phi(m, xs[i]) * Vf(xs[i]) * phi(n, xs[i]);
        H[m - 1][n - 1] = v + (m === n ? E1 * m * m : 0); H[n - 1][m - 1] = H[m - 1][n - 1];
      }
      const sub = (n) => { const A = LA.zeros(n); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) A[i][j] = H[i][j]; return A; };
      const rN = LA.eigh(sub(N)), r30 = LA.eigh(sub(NMAX));
      /* referencia: diferencias finitas (la delta se aproxima por una barra de un paso) */
      const NF = 2001, h = 1 / (NF + 1), dg = (x) => (p.v === 'del' ? (Math.abs(x - 0.5) < h * 0.5 + 1e-12 ? s / h : 0) : Vf(x));
      const ref = Q.fdEigen(dg, 0, 1, NF + 0, 4, { vectors: false }).E;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.5, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: Math.max(rN.values[3] || 0, 16 * E1) * 1.05, xlabel: '', ylabel: 'energía', ml: 46, mr: 8, title: 'Niveles: base de N estados (azul) y exactos (negro)' });
      pl.frame();
      for (let k = 0; k < Math.min(4, N); k++) pl.path([[0.08, rN.values[k]], [0.46, rN.values[k]]], { color: '--accent', width: 3 });
      for (let k = 0; k < 4; k++) pl.path([[0.54, ref[k]], [0.92, ref[k]]], { color: '--ink', width: 1.5 });
      /* convergencia del nivel más bajo con N */
      const conv = []; for (let n = 1; n <= NMAX; n++) conv.push(LA.eigh(sub(n), { vectors: false }).values[0]);
      const pc = new EM.Plot(ctx, { x: cv.w * 0.52, y: 0, w: cv.w * 0.48, h: cv.h, xmin: 1, xmax: NMAX, ymin: 1e-8, ymax: 10, ylog: true, xlabel: 'tamaño de la base N', ylabel: 'E₀(N) − E₀ exacta', ml: 54, mr: 8, title: 'Convergencia desde arriba (variacional)' });
      pc.frame(); pc.xy(Array.from({ length: NMAX }, (_, i) => i + 1), conv.map((v) => Math.max(v - ref[0], 1e-9)), { color: '--accent', width: 2.4 }); pc.dot(N, Math.max(conv[N - 1] - ref[0], 1e-9), { color: '--c2' });
      sim.set('E', Array.from({ length: Math.min(4, N) }, (_, k) => EM.fix(rN.values[k], 3)).join(' · '));
      sim.set('X', `${ref.map((v) => EM.fix(v, 3)).join(' · ')} · ${EM.sci(Math.max(0, rN.values[0] - ref[0]), 2)}`);
      sim.set('V', `${EM.fix(H[0][1], 4)} (en unidades de ħ²/mL²)`);
    });
  });

  /* 5.2 Sistema de dos niveles: la evolución unitaria e^{−iHt/ħ} y el vector de Bloch */
  EM.defineSim('dosniveles', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('Om', { label: 'Acoplamiento Ω (frecuencia de Rabi)', min: 0.2, max: 4, step: 0.05, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.slider('De', { label: 'Desintonía Δ (diferencia de energías de los dos niveles menos la del campo, en ħ)', min: -4, max: 4, step: 0.05, value: 0, fmt: (v) => EM.fix(v, 2) });
    sim.out('R', 'Frecuencia de Rabi generalizada Ω<sub>R</sub> = √(Ω² + Δ²) · periodo', { hl: true });
    sim.out('P', 'Probabilidad máxima de excitar el nivel superior Ω²/Ω<sub>R</sub>² · tiempo de un pulso π (si Δ = 0)');
    sim.out('B', 'Vector de Bloch (⟨σ<sub>x</sub>⟩, ⟨σ<sub>y</sub>⟩, ⟨σ<sub>z</sub>⟩) en este instante · longitud');
    let t = 0;
    sim.resetButton(() => { t = 0; });
    sim.animate((dt) => { t = (t + dt * 1.6) % 20; });
    /* H = (ħ/2)(Ω σx + Δ σz) en la base (|e⟩, |g⟩); ⟨σ⟩ obedece dB/dt = (Ω, 0, Δ) × B y el sistema parte de |g⟩: B(0) = (0, 0, −1) */
    const bloch = (tt, O, D) => {
      const W = Math.hypot(O, D), nx = O / W, nz = D / W, c = Math.cos(W * tt), s = Math.sin(W * tt);
      return [-nx * nz * (1 - c), nx * s, -c - nz * nz * (1 - c)];
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, O = p.Om, D = p.De, W = Math.hypot(O, D);
      EM.draw.clear(cv);
      const ts = Array.from({ length: 401 }, (_, i) => (20 * i) / 400);
      const Pe = (tt) => (1 + bloch(tt, O, D)[2]) / 2;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.62, h: cv.h, xmin: 0, xmax: 20, ymin: -1.05, ymax: 1.15, xlabel: 'tiempo t (ħ = 1)', ylabel: 'población y ⟨σ⟩', ml: 46, mr: 8 });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [] });
      pl.xy(ts, ts.map(Pe), { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.12 });
      pl.xy(ts, ts.map((x) => bloch(x, O, D)[0]), { color: '--c1', width: 1.4 }); pl.xy(ts, ts.map((x) => bloch(x, O, D)[1]), { color: '--c2', width: 1.4 }); pl.xy(ts, ts.map((x) => bloch(x, O, D)[2]), { color: '--c3', width: 1.4 });
      pl.vline(t, { color: '--ink-2', dash: [2, 3] });
      pl.legend([{ label: 'P(superior)', color: '--accent' }, { label: '⟨σx⟩', color: '--c1' }, { label: '⟨σy⟩', color: '--c2' }, { label: '⟨σz⟩', color: '--c3' }], 'tr');
      /* esfera de Bloch (proyección xz) */
      const cx = cv.w * 0.82, cy = cv.h * 0.5, R = Math.min(cv.w * 0.15, cv.h * 0.38), b = bloch(t, O, D);
      ctx.save(); ctx.strokeStyle = EM.col('--axis'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke(); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke(); ctx.restore();
      EM.text(ctx, '|e⟩', cx, cy - R - 6, { size: 12, align: 'center', color: '--ink-2' }); EM.text(ctx, '|g⟩', cx, cy + R + 14, { size: 12, align: 'center', color: '--ink-2' }); EM.text(ctx, 'x', cx + R + 10, cy + 4, { size: 11, color: '--ink-3' });
      const ax = W > 0 ? [O / W, D / W] : [1, 0]; EM.draw.arrow(ctx, cx - ax[0] * R * 0.9, cy + ax[1] * R * 0.9, cx + ax[0] * R * 0.9, cy - ax[1] * R * 0.9, { color: '--c4', width: 1.4, alpha: 0.7, head: 7 });
      EM.draw.arrow(ctx, cx, cy, cx + b[0] * R, cy - b[2] * R, { color: '--accent', width: 3, head: 11 });
      EM.text(ctx, 'esfera de Bloch (plano xz)', cx, cy + R + 32, { size: 10.5, align: 'center', color: '--ink-3' });
      sim.set('R', `${EM.fix(W, 3)} · ${EM.fix((2 * Math.PI) / W, 3)}`);
      sim.set('P', `${EM.fix((O * O) / (W * W), 4)} · ${EM.fix(Math.PI / O, 4)} (en unidades 1/Ω)`);
      sim.set('B', `(${EM.fix(b[0], 3)}, ${EM.fix(b[1], 3)}, ${EM.fix(b[2], 3)}) · ${EM.fix(Math.hypot(...b), 5)}`);
    });
  });
})();
