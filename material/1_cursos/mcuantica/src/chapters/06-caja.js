/* Capítulo 6 — El pozo infinito */
(function () {
  'use strict';
  const EM = window.EM, K = EM.qm.K;
  const PI = Math.PI, EV = K.e;
  const PART = { e: ['Electrón', K.me], p: ['Protón', K.mp], He: ['Átomo de He', 6.6464731e-27], n2: ['Molécula de N₂', 28.0134 * K.u] };

  /* 6.1 Estados estacionarios de la caja y límite clásico */
  EM.defineSim('caja1d', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('m', { label: 'Partícula', options: Object.entries(PART).map(([k, v]) => [k, v[0]]), value: 'e' });
    sim.slider('L', { label: 'Ancho de la caja L', min: 0.01, max: 1e8, step: 0.01, value: 1, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 3) });
    sim.slider('n', { label: 'Número cuántico n', min: 1, max: 30, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.slider('a', { label: 'Intervalo de interés: extremo izquierdo a/L', min: 0, max: 0.95, step: 0.01, value: 0.25, fmt: (v) => EM.fix(v, 2) });
    sim.slider('b', { label: 'Intervalo de interés: extremo derecho b/L', min: 0.05, max: 1, step: 0.01, value: 0.75, fmt: (v) => EM.fix(v, 2) });
    sim.out('E', 'Energía <i>E</i><sub>n</sub> = <i>n</i>²π²ħ²/(2<i>mL</i>²) · en kJ/mol · en <i>k</i><sub>B</sub><i>T</i> a 298 K', { hl: true });
    sim.out('dE', 'Separación al nivel siguiente <i>E</i><sub>n+1</sub> − <i>E</i><sub>n</sub> · longitud de onda de un fotón con esa energía');
    sim.out('P', 'Probabilidad en [<i>a</i>, <i>b</i>]: cuántica · clásica (<i>b</i> − <i>a</i>)/<i>L</i>');
    sim.out('u', 'Δ<i>x</i>/<i>L</i> · Δ<i>p</i>·<i>L</i>/ħ · Δ<i>x</i>Δ<i>p</i>/(ħ/2) (n grande → ∞)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, m = PART[p.m][1], L = p.L * 1e-9, n = Math.round(p.n), a = Math.min(p.a, p.b - 0.01), b = p.b;
      EM.draw.clear(cv);
      const En = (k) => (k * k * PI * PI * K.hbar * K.hbar) / (2 * m * L * L), E = En(n), dE = En(n + 1) - E;
      /* Niveles */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.34, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: En(8) / EV * 1.05, xlabel: '', ylabel: 'energía (eV)', ml: 52, mr: 6, title: 'Niveles E_n = n² E₁' });
      pl.frame(); for (let k = 1; k <= 8; k++) pl.path([[0.1, En(k) / EV], [0.9, En(k) / EV]], { color: k === n ? '--accent' : '--ink-3', width: k === n ? 3 : 1.3 });
      if (n > 8) pl.label(0.5, En(8) / EV * 0.9, `n = ${n}: ${EM.sci(E / EV, 3)} eV (fuera de escala)`, { size: 11, color: '--accent', align: 'center' });
      /* Función y densidad */
      const xs = Array.from({ length: 601 }, (_, i) => i / 600), psi = xs.map((x) => Math.SQRT2 * Math.sin(n * PI * x)), rho = psi.map((v) => v * v);
      const p2 = new EM.Plot(ctx, { x: cv.w * 0.37, y: 0, w: cv.w * 0.63, h: cv.h, xmin: 0, xmax: 1, ymin: -1.8, ymax: 2.4, xlabel: 'x / L', ylabel: 'ψ (en 1/√L) y |ψ|² (en 1/L)', ml: 48, mr: 8, title: `Estado n = ${n}` });
      p2.frame(); p2.hline(0, { color: '--ink-3', dash: [] }); p2.band(a, b, { color: '--accent', alpha: 0.1 });
      p2.xy(xs, psi, { color: '--c1', width: 1.8 }); p2.xy(xs, rho, { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.15 });
      p2.hline(1, { color: '--c4', dash: [6, 4], label: 'densidad clásica 1/L', labelRight: true });
      /* probabilidad en [a, b]: ∫ 2 sin²(nπx) = (b − a) − (sin 2nπb − sin 2nπa)/(2nπ) */
      const Pq = (b - a) - (Math.sin(2 * n * PI * b) - Math.sin(2 * n * PI * a)) / (2 * n * PI), dx = L * Math.sqrt(1 / 12 - 1 / (2 * n * n * PI * PI)) / L, dp = n * PI;
      sim.set('E', `${EM.sci(E / EV, 4)} eV · ${EM.sci(E * K.NA / 1000, 4)} kJ/mol · ${EM.sci(E / (K.kB * 298), 3)}`);
      sim.set('dE', `${EM.sci(dE / EV, 3)} eV · ${(K.hc_eVnm * EV / dE) >= 1e4 ? EM.sci(K.hc_eVnm * EV / dE * 1e-3, 3) + ' µm' : EM.fix(K.hc_eVnm * EV / dE, 1) + ' nm'}`);
      sim.set('P', `${EM.fix(100 * Pq, 2)} % · ${EM.fix(100 * (b - a), 2)} %`);
      sim.set('u', `${EM.fix(dx, 4)} · ${EM.fix(dp, 3)} · ${EM.fix((2 * dx * dp), 3)} (límite ${EM.fix(2 * PI / Math.sqrt(12), 3)}·n)`);
    });
  });

  /* 6.2 Alfombra cuántica: evolución espacio–tiempo de un paquete en la caja */
  EM.defineSim('alfombra', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('x0', { label: 'Centro inicial del paquete x₀/L', min: 0.1, max: 0.9, step: 0.01, value: 0.3, fmt: (v) => EM.fix(v, 2) });
    sim.slider('sg', { label: 'Anchura σ/L', min: 0.015, max: 0.15, step: 0.005, value: 0.04, fmt: (v) => EM.fix(v, 3) });
    sim.slider('k0', { label: 'Momento inicial k₀L/π', min: 0, max: 40, step: 1, value: 20, fmt: (v) => v.toFixed(0) });
    sim.slider('tm', { label: 'Tiempo mostrado, en unidades del tiempo de renacimiento T', min: 0.05, max: 1, step: 0.01, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.out('T', 'Tiempo de renacimiento <i>T</i> = 4<i>mL</i>²/(πħ) = 2πħ/<i>E</i><sub>1</sub> (en unidades ħ = <i>m</i> = <i>L</i> = 1: 4/π)', { hl: true });
    sim.out('v', 'Velocidad del paquete ħ<i>k</i><sub>0</sub>/<i>m</i> · tiempo de ida y vuelta 2<i>L</i>/<i>v</i> en unidades de <i>T</i>');
    sim.out('M', 'Modos que contribuyen (|c<sub>n</sub>|² &gt; 10⁻⁶) · ⟨<i>E</i>⟩/<i>E</i><sub>1</sub>');
    const NX = 200, NT = 200, MM = 120; let c = null, tab = null, t = 0;
    const calc = () => {
      const p = sim.p, M = 600, ph = (n, x) => Math.SQRT2 * Math.sin(n * PI * x), g = (x) => Math.exp(-((x - p.x0) ** 2) / (4 * p.sg * p.sg));
      const re = [], im = [], xs = Array.from({ length: M + 1 }, (_, i) => i / M), w = (i) => (i === 0 || i === M ? 1 : i % 2 ? 4 : 2) / (3 * M);
      let nn = 0; for (let i = 0; i <= M; i++) nn += w(i) * g(xs[i]) ** 2;
      const A = 1 / Math.sqrt(nn);
      for (let n = 1; n <= MM; n++) { let sr = 0, si = 0; for (let i = 0; i <= M; i++) { const a = g(xs[i]) * A * ph(n, xs[i]) * w(i), th = p.k0 * PI * xs[i]; sr += a * Math.cos(th); si += a * Math.sin(th); } re.push(sr); im.push(si); }
      c = { re, im, norm: re.reduce((s, v, i) => s + v * v + im[i] * im[i], 0) };
      /* tabla de modos sobre la malla espacial */
      tab = Array.from({ length: MM }, (_, k) => Float64Array.from({ length: NX }, (_, i) => ph(k + 1, (i + 0.5) / NX)));
    };
    calc(); sim.onChange = () => { calc(); };
    sim.resetButton(() => { t = 0; });
    sim.animate((dt) => { t = (t + dt * 0.12) % 1; });
    const T = 4 / PI, E1 = PI * PI / 2;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, tmax = p.tm * T;
      EM.draw.clear(cv);
      /* alfombra */
      const mx = 0.1 * W, my = 22, rw = W * 0.62, rh = H - 52;
      const dens = new Float64Array(NX * NT); let vmax = 0;
      for (let it = 0; it < NT; it++) {
        const tt = (tmax * it) / (NT - 1), cs = [], sn = [];
        for (let k = 0; k < MM; k++) { const ph = -E1 * (k + 1) * (k + 1) * tt; cs.push(Math.cos(ph)); sn.push(Math.sin(ph)); }
        for (let ix = 0; ix < NX; ix++) { let sr = 0, si = 0; for (let k = 0; k < MM; k++) { const f = tab[k][ix]; sr += f * (c.re[k] * cs[k] - c.im[k] * sn[k]); si += f * (c.re[k] * sn[k] + c.im[k] * cs[k]); } const d = sr * sr + si * si; dens[it * NX + ix] = d; if (d > vmax) vmax = d; }
      }
      EM.heat(ctx, { x: mx, y: my, w: rw, h: rh }, NX, NT, (ix, iy) => Math.pow(Math.min(1, dens[iy * NX + ix] / (0.5 * vmax)), 0.55), { cmap: 'inferno' });
      EM.text(ctx, 'posición x / L', mx + rw / 2, H - 6, { size: 11.5, align: 'center', color: '--ink-3' });
      EM.text(ctx, 'tiempo →', mx - 8, my + rh / 2, { size: 11.5, align: 'center', color: '--ink-3' });
      EM.text(ctx, '0', mx - 6, my + 10, { size: 10.5, align: 'right', color: '--ink-3' }); EM.text(ctx, `${EM.fix(p.tm, 2)} T`, mx - 6, my + rh, { size: 10.5, align: 'right', color: '--ink-3' });
      const yc = my + (t * rh); ctx.save(); ctx.strokeStyle = EM.col('--accent'); ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(mx, yc); ctx.lineTo(mx + rw, yc); ctx.stroke(); ctx.restore();
      /* corte en el instante del cursor */
      const tc = t * tmax, rho = Array.from({ length: NX }, (_, ix) => { let sr = 0, si = 0; for (let k = 0; k < MM; k++) { const ph = -E1 * (k + 1) * (k + 1) * tc, f = tab[k][ix]; sr += f * (c.re[k] * Math.cos(ph) - c.im[k] * Math.sin(ph)); si += f * (c.re[k] * Math.sin(ph) + c.im[k] * Math.cos(ph)); } return sr * sr + si * si; });
      const pl = new EM.Plot(ctx, { x: W * 0.74, y: 0, w: W * 0.26, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: Math.max(...rho) * 1.1, xlabel: 'x / L', ylabel: '|ψ|²', title: 'corte en t = ' + EM.fix(tc / T, 3) + ' T', ml: 40, mr: 6 });
      pl.frame(); pl.xy(Array.from({ length: NX }, (_, i) => (i + 0.5) / NX), rho, { color: '--accent', width: 2.2, fill: '--accent', fillAlpha: 0.16 });
      const nsig = c.re.reduce((s, v, i) => s + (v * v + c.im[i] * c.im[i] > 1e-6 ? 1 : 0), 0), Em = c.re.reduce((s, v, i) => s + (v * v + c.im[i] * c.im[i]) * (i + 1) ** 2, 0) / c.norm;
      sim.set('T', `${EM.fix(T, 4)} (u. a. de la caja) · para un electrón en 1 nm: ${EM.fix((4 * K.me * 1e-18) / (PI * K.hbar) * 1e15, 2)} fs`);
      sim.set('v', `${EM.fix(p.k0 * PI, 2)} · ${EM.fix((2 / (p.k0 * PI)) / T, 4)}`);
      sim.set('M', `${nsig} · ${EM.fix(Em, 1)}`);
    });
  });

  /* 6.3 Caja bidimensional: degeneración y superposición */
  EM.defineSim('caja2d', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('nx', { label: 'n_x (primer estado)', min: 1, max: 6, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('ny', { label: 'n_y (primer estado)', min: 1, max: 6, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('mx', { label: 'm_x (segundo estado)', min: 1, max: 6, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('my', { label: 'm_y (segundo estado)', min: 1, max: 6, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.check('mix', { label: 'Superponer los dos estados (igual peso)', value: true });
    sim.slider('r', { label: 'Cociente de lados L_y/L_x (1 = cuadrada: aparece degeneración)', min: 0.7, max: 1.6, step: 0.01, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.out('E', 'Energías en unidades de <i>E</i><sub>1</sub> = π²ħ²/(2<i>mL</i><sub>x</sub>²): primer estado · segundo estado', { hl: true });
    sim.out('d', 'Degeneración del nivel del primer estado en una caja cuadrada · diferencia de energías (frecuencia de oscilación)');
    let t = 0;
    sim.resetButton(() => { t = 0; });
    sim.animate((dt) => { t += dt * 1.2; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, r = p.r, nx = p.nx, ny = p.ny, mx = p.mx, my = p.my;
      EM.draw.clear(cv);
      const E = (a, b) => a * a + (b / r) * (b / r), E1_ = E(nx, ny), E2_ = E(mx, my), N = 90;
      const bw = Math.min(W * 0.55, (H - 30) * (1 / r)), bh = bw * r, x0 = W * 0.04, y0 = (H - bh) / 2;
      const w = p.mix ? 1 / Math.SQRT2 : 1;
      const val = (ix, iy) => { const x = (ix + 0.5) / N, y = (iy + 0.5) / N; const f1 = 2 * Math.sin(nx * PI * x) * Math.sin(ny * PI * y) / Math.sqrt(r); const f2 = 2 * Math.sin(mx * PI * x) * Math.sin(my * PI * y) / Math.sqrt(r); const th1 = -E1_ * t * 0.8, th2 = -E2_ * t * 0.8; const re = w * f1 * Math.cos(th1) + (p.mix ? w * f2 * Math.cos(th2) : 0), im = w * f1 * Math.sin(th1) + (p.mix ? w * f2 * Math.sin(th2) : 0); return re * re + im * im; };
      const vm = (p.mix ? 4 * 2 / r : 4 / r) * 0.5;
      EM.heat(ctx, { x: x0, y: y0, w: bw, h: bh }, N, N, (ix, iy) => Math.pow(Math.min(1, val(ix, N - 1 - iy) / vm), 0.6), { cmap: 'inferno' });
      /* escalera de niveles */
      const lv = []; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) lv.push([E(a, b), a, b]); lv.sort((u, v) => u[0] - v[0]);
      const pl = new EM.Plot(ctx, { x: W * 0.62, y: 0, w: W * 0.38, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: Math.max(E1_, E2_) * 1.4 + 4, xlabel: '', ylabel: 'E / E₁', ml: 40, mr: 6, title: 'Niveles de la caja' });
      pl.frame(); const used = new Map(); for (const [e, a, b] of lv) { if (e > pl.o.ymax) continue; const key = e.toFixed(6), k = used.get(key) || 0; used.set(key, k + 1); const cx = 0.12 + 0.17 * k; pl.path([[cx, e], [cx + 0.14, e]], { color: Math.abs(e - E1_) < 1e-6 || Math.abs(e - E2_) < 1e-6 ? '--accent' : '--ink-3', width: 2.2 }); }
      let deg = 0; for (let a = 1; a <= 60; a++) for (let b = 1; b <= 60; b++) if (a * a + b * b === nx * nx + ny * ny) deg++;
      sim.set('E', `${EM.fix(E1_, 3)} · ${EM.fix(E2_, 3)}`);
      sim.set('d', `${deg} (nx² + ny² = ${nx * nx + ny * ny}) · |ΔE| = ${EM.fix(Math.abs(E2_ - E1_), 3)} E₁`);
    });
  });

  /* 6.4 Expansión súbita de la caja */
  EM.defineSim('expansubita', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('a', { label: 'Factor de expansión a = L′/L (la pared se mueve de L a L′)', min: 1.1, max: 5, step: 0.05, value: 2, fmt: (v) => EM.fix(v, 2) });
    sim.out('P', 'Probabilidades de los estados de la caja nueva: <i>P</i><sub>1</sub> · <i>P</i><sub>2</sub> · <i>P</i><sub>3</sub> · <i>P</i><sub>4</sub>', { hl: true });
    sim.out('E', '⟨<i>E</i>⟩ de la suma truncada (80 términos) · energía inicial exacta <i>E</i><sub>1</sub>(<i>L</i>) (la serie converge como 1/<i>N</i>)');
    sim.out('x', 'Posición media ⟨<i>x</i>⟩/<i>L</i> en este instante');
    let t = 0, cs = [], Lp = 2; const MM = 80;
    const calc = () => {
      Lp = sim.p.a; const M = 1200, f = (x) => Math.SQRT2 * Math.sin(PI * x), phn = (n, x) => Math.sqrt(2 / Lp) * Math.sin(n * PI * x / Lp), w = (i) => (i === 0 || i === M ? 1 : i % 2 ? 4 : 2) / (3 * M);
      cs = []; for (let n = 1; n <= MM; n++) { let s = 0; for (let i = 0; i <= M; i++) { const x = i / M; s += w(i) * f(x) * phn(n, x); } cs.push(s); }
    };
    calc(); sim.onChange = () => { calc(); t = 0; };
    sim.resetButton(() => { t = 0; });
    sim.animate((dt) => { t += dt * 0.08; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, N = 400;
      EM.draw.clear(cv);
      const xs = Array.from({ length: N + 1 }, (_, i) => (i / N) * Lp), tt = t * 4 * Lp * Lp / PI;
      const dens = xs.map((x) => { let sr = 0, si = 0; for (let n = 1; n <= MM; n++) { const ph = -(n * n * PI * PI) / (2 * Lp * Lp) * tt, f = Math.sqrt(2 / Lp) * Math.sin(n * PI * x / Lp) * cs[n - 1]; sr += f * Math.cos(ph); si += f * Math.sin(ph); } return sr * sr + si * si; });
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.62, h: cv.h, xmin: 0, xmax: 5, ymin: 0, ymax: 2.4, xlabel: 'x / L', ylabel: '|ψ|² (en 1/L)', ml: 46, mr: 8, title: 'Densidad tras la expansión' });
      pl.frame(); pl.band(Lp, 5, { color: '--ink-3', alpha: 0.18 }); pl.vline(1, { color: '--c4', dash: [5, 3], label: 'pared original', align: 'right' });
      pl.xy(xs, dens, { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.16 });
      const P = cs.map((v) => v * v), pb = new EM.Plot(ctx, { x: cv.w * 0.65, y: 0, w: cv.w * 0.35, h: cv.h, xmin: 0.4, xmax: 10.6, ymin: 0, ymax: Math.max(...P) * 1.2, xlabel: 'estado n de la caja nueva', ylabel: 'probabilidad', ml: 46, mr: 8, title: 'Reparto en los nuevos estados' });
      pb.frame(); for (let n = 1; n <= 10; n++) pb.path([[n, 0], [n, P[n - 1]]], { color: '--c1', width: 11 });
      const Em = P.reduce((s, v, i) => s + v * (i + 1) ** 2 * PI * PI / (2 * Lp * Lp), 0), mx = xs.reduce((s, x, i) => s + x * dens[i] * (Lp / N), 0);
      sim.set('P', P.slice(0, 4).map((v) => EM.fix(v, 4)).join(' · '));
      sim.set('E', `${EM.fix(Em, 4)} · ${EM.fix(PI * PI / 2, 4)} `);
      sim.set('x', EM.fix(mx, 4));
    });
  });
})();
