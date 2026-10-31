/* Capítulo 2 — La ecuación de Schrödinger y la interpretación de Born */
(function () {
  'use strict';
  const EM = window.EM, K = EM.qm.K, O = EM.qm.orig;

  /* 2.1 Probabilidades con una función de onda dada: normalización, ⟨x⟩ y Δx */
  const SHAPES = {
    gauss: ['Gaussiana  e^{−x²/4σ²}', (x, w) => Math.exp(-(x * x) / (4 * w * w)), true],
    exp: ['Exponencial  e^{−|x|/a}', (x, w) => Math.exp(-Math.abs(x) / w), true],
    caja: ['Parábola  x(L − x) en [0, L]', (x, w) => (x > 0 && x < 2 * w ? x * (2 * w - x) : 0), true],
    lor: ['Con |ψ|² lorentziana: (1 + x²/a²)^(−1/2)', (x, w) => 1 / Math.sqrt(1 + (x * x) / (w * w)), false],
    sech: ['Secante hiperbólica  sech(x/a)', (x, w) => 1 / Math.cosh(x / w), true]
  };
  EM.defineSim('norma', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('f', { label: 'Función de onda ψ(x) (sin normalizar)', options: Object.entries(SHAPES).map(([k, v]) => [k, v[0]]), value: 'gauss' });
    sim.slider('w', { label: 'Parámetro de escala (σ, a o L/2)', min: 0.3, max: 2.5, step: 0.05, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.slider('a', { label: 'Extremo izquierdo a del intervalo', min: -6, max: 6, step: 0.05, value: -1, fmt: (v) => EM.fix(v, 2) });
    sim.slider('b', { label: 'Extremo derecho b del intervalo', min: -6, max: 6, step: 0.05, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.out('A', 'Constante de normalización <i>A</i> (∫|<i>A</i>ψ|² dx = 1)', { hl: true });
    sim.out('P', 'Probabilidad de hallar la partícula en [<i>a</i>, <i>b</i>]');
    sim.out('x', '⟨<i>x</i>⟩ · Δ<i>x</i> = √(⟨<i>x</i>²⟩ − ⟨<i>x</i>⟩²)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [nm, f, fin] = SHAPES[p.f], N = 2400, x0 = -12, x1 = 12, dx = (x1 - x0) / N;
      EM.draw.clear(cv);
      const xs = [], ps = []; let n = 0, m1 = 0, m2 = 0;
      for (let i = 0; i <= N; i++) { const x = x0 + i * dx, q = f(x, p.w), w = i === 0 || i === N ? 0.5 : 1; xs.push(x); ps.push(q * q); n += w * q * q * dx; m1 += w * x * q * q * dx; m2 += w * x * x * q * q * dx; }
      if (p.f === 'lor') n = Math.PI * p.w; /* ∫dx/(1+x²/a²) = πa (la cola 1/x² no cabe en la ventana) */
      const A2 = 1 / n, rho = ps.map((q) => q * A2), a = Math.min(p.a, p.b), b = Math.max(p.a, p.b);
      /* integral acumulada (trapecios) e interpolación lineal en los extremos del intervalo */
      const cum = new Float64Array(N + 1); for (let i = 1; i <= N; i++) cum[i] = cum[i - 1] + 0.5 * (rho[i - 1] + rho[i]) * dx;
      const C = (x) => { const t = (x - x0) / dx, i = Math.max(0, Math.min(N - 1, Math.floor(t))), f = t - i; return cum[i] + f * (cum[i + 1] - cum[i]); };
      const P = C(b) - C(a);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -6, xmax: 6, ymin: -0.2 * Math.max(...rho), ymax: Math.max(...rho) * 1.25, xlabel: 'x', ylabel: 'ψ normalizada y |ψ|²', ml: 56 });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [] });
      pl.band(a, b, { color: '--accent', alpha: 0.12 });
      pl.xy(xs, xs.map((x, i) => f(x, p.w) * Math.sqrt(A2)), { color: '--c1', width: 2 });
      pl.xy(xs, rho, { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.16 });
      pl.xy(xs.filter((x) => x >= a && x <= b), rho.filter((_, i) => xs[i] >= a && xs[i] <= b), { color: '--accent', width: 0, fill: '--accent', fillAlpha: 0.35 });
      pl.legend([{ label: 'ψ normalizada', color: '--c1' }, { label: '|ψ|² (densidad de probabilidad)', color: '--accent' }], 'tr');
      const xm = m1 * A2, dxs = Math.sqrt(Math.max(0, m2 * A2 - xm * xm));
      sim.set('A', `${EM.fix(Math.sqrt(A2), 5)}  (A² = ${EM.fix(A2, 5)})`);
      sim.set('P', `${EM.fix(100 * P, 3)} %`);
      sim.set('x', fin ? `${EM.fix(xm, 4)} · ${EM.fix(dxs, 4)}` : `${EM.fix(xm, 4)} · diverge (⟨x²⟩ = ∞): la lorentziana no tiene Δx finita`);
    });
  });

  /* 2.2 Superposición de dos estados estacionarios de la caja: densidad, corriente y continuidad */
  const E = (n) => (n * n * Math.PI * Math.PI) / 2; /* L = ħ = m = 1 */
  const phi = (n, x) => Math.SQRT2 * Math.sin(n * Math.PI * x);
  EM.defineSim('bohrfreq', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('n1', { label: 'Primer estado n₁', min: 1, max: 5, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('n2', { label: 'Segundo estado n₂', min: 1, max: 6, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('r', { label: 'Peso del segundo estado |c₂|² (|c₁|² = 1 − |c₂|²)', min: 0, max: 1, step: 0.01, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.slider('ph', { label: 'Fase relativa δ de c₂', min: 0, max: 360, step: 1, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.check('cur', { label: 'Mostrar corriente de probabilidad j(x, t)', value: true });
    sim.out('w', 'Frecuencia de Bohr (<i>E</i><sub>2</sub> − <i>E</i><sub>1</sub>)/ħ · periodo <i>T</i> = 2πħ/(<i>E</i><sub>2</sub> − <i>E</i><sub>1</sub>)', { hl: true });
    sim.out('x', '⟨<i>x</i>⟩ en este instante · amplitud de su oscilación');
    sim.out('c', 'Continuidad: máx |∂ρ/∂<i>t</i> + ∂<i>j</i>/∂<i>x</i>| · ∫ρ dx');
    let t = 0;
    sim.resetButton(() => { t = 0; });
    sim.animate((dt) => { t += dt * 0.6 / (2 * Math.PI / Math.abs(E(2) - E(1))); });
    const psi = (x, tt, p) => {
      const c2 = Math.sqrt(p.r), c1 = Math.sqrt(1 - p.r), d = (p.ph * Math.PI) / 180, n1 = Math.round(p.n1), n2 = Math.round(p.n2);
      const a1 = [c1 * Math.cos(-E(n1) * tt), c1 * Math.sin(-E(n1) * tt)], a2 = [c2 * Math.cos(d - E(n2) * tt), c2 * Math.sin(d - E(n2) * tt)];
      const f1 = phi(n1, x), f2 = phi(n2, x);
      return [a1[0] * f1 + a2[0] * f2, a1[1] * f1 + a2[1] * f2];
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, N = 400, n1 = Math.round(p.n1), n2 = Math.round(p.n2), per = 2 * Math.PI / Math.max(1e-9, Math.abs(E(n2) - E(n1)));
      EM.draw.clear(cv);
      const xs = Array.from({ length: N + 1 }, (_, i) => i / N), h = 1 / N, tt = t * per;
      const dxs = 1e-5, dts = 1e-6;
      const rho = (x, q) => { const [a, b] = psi(x, q, p); return a * a + b * b; };
      const cur = (x) => { const [a, b] = psi(x, tt, p), [a2, b2] = psi(x + dxs, tt, p), [a1, b1] = psi(x - dxs, tt, p); return (a * (b2 - b1) - b * (a2 - a1)) / (2 * dxs); };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: -6, ymax: 4.6, xlabel: 'x / L', ylabel: 'ψ, |ψ|², j (L = ħ = m = 1)', ml: 52 });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [] });
      const R = xs.map((x) => rho(x, tt)), Re = xs.map((x) => psi(x, tt, p)[0]), Im = xs.map((x) => psi(x, tt, p)[1]);
      pl.xy(xs, R, { color: '--accent', width: 2.8, fill: '--accent', fillAlpha: 0.14 });
      pl.xy(xs, Re, { color: '--c1', width: 1.5 }); pl.xy(xs, Im, { color: '--c2', width: 1.5, dash: [5, 3] });
      const leg = [{ label: '|Ψ|²', color: '--accent' }, { label: 'Re Ψ', color: '--c1' }, { label: 'Im Ψ', color: '--c2', dash: [5, 3] }];
      if (p.cur) { pl.xy(xs, xs.map(cur), { color: '--c3', width: 2 }); leg.push({ label: 'corriente j', color: '--c3' }); }
      pl.legend(leg, 'tr');
      /* ⟨x⟩ y continuidad */
      let nrm = 0, mx = 0, res = 0;
      for (let i = 0; i <= N; i++) { const w = i === 0 || i === N ? 0.5 : 1; nrm += w * R[i] * h; mx += w * xs[i] * R[i] * h; const dr = (rho(xs[i], tt + dts) - rho(xs[i], tt - dts)) / (2 * dts), dj = (cur(Math.min(0.999, xs[i] + 1e-4)) - cur(Math.max(0.001, xs[i] - 1e-4))) / (Math.min(0.999, xs[i] + 1e-4) - Math.max(0.001, xs[i] - 1e-4)); if (i > 4 && i < N - 4) res = Math.max(res, Math.abs(dr + dj)); }
      const amp = 2 * Math.sqrt(p.r * (1 - p.r)) * Math.abs(xmat(n1, n2));
      sim.set('w', `${EM.fix(Math.abs(E(n2) - E(n1)), 3)} (u. a. de la caja) · ${EM.fix(per, 4)}`);
      sim.set('x', `${EM.fix(mx, 4)} · ${EM.fix(amp, 4)} (L)`);
      sim.set('c', `${EM.sci(res, 2)} · ${EM.fix(nrm, 6)}`);
    });
  });
  /* ⟨n₁|x|n₂⟩ en la caja de ancho 1 */
  function xmat(n, m) {
    if (n === m) return 0.5;
    if ((n + m) % 2 === 0) return 0;
    return (-8 * n * m) / (Math.PI * Math.PI * Math.pow(n * n - m * m, 2));
  }

  /* 2.3 Doble rendija con electrones: aparece el patrón de interferencia impacto a impacto */
  EM.defineSim('rendijas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('V', { label: 'Energía de los electrones', min: 1, max: 200, step: 1, value: 50, log: true, unit: 'keV', fmt: (v) => EM.sci(v, 3) });
    sim.slider('d', { label: 'Separación entre rendijas d', min: 0.5, max: 6, step: 0.05, value: 2, unit: 'µm', fmt: (v) => EM.fix(v, 2) });
    sim.slider('a', { label: 'Anchura de cada rendija a', min: 0.1, max: 2, step: 0.05, value: 0.5, unit: 'µm', fmt: (v) => EM.fix(v, 2) });
    sim.check('which', { label: 'Un detector revela por qué rendija pasó cada electrón', value: false });
    sim.out('lam', 'Longitud de onda de de Broglie del electrón', { hl: true });
    sim.out('fr', 'Interfranja <i>λL/d</i> en una pantalla a <i>L</i> = 0.35 m · franjas bajo el máximo central ≈ 2<i>d/a</i>');
    sim.out('n', 'Electrones registrados · puntos acumulados en la pantalla');
    const NB = 241; let hits = new Float64Array(NB), total = 0;
    const L = 0.35;
    const clear = () => { hits = new Float64Array(NB); total = 0; };
    sim.resetButton(clear);
    sim.button('+ 200 electrones', () => emit(200));
    sim.button('+ 5000 electrones', () => emit(5000), { newRow: false });
    sim.onChange = clear;
    const model = () => {
      const p = sim.p, lam = O.electronLambda(p.V * 1e3) * 1e6 /* µm */, ymax = 3 * (lam * L * 1e6) / p.a * 0.9;
      const cdf = new Float64Array(NB + 1), pdf = new Float64Array(NB);
      for (let i = 0; i < NB; i++) {
        const y = (-0.5 + (i + 0.5) / NB) * 2 * ymax, s = y / (L * 1e6), beta = (Math.PI * p.a * s) / lam, del = (Math.PI * p.d * s) / lam;
        const env = Math.abs(beta) < 1e-9 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
        pdf[i] = env * (p.which ? 1 : Math.pow(Math.cos(del), 2));
      }
      let s = 0; for (let i = 0; i < NB; i++) { s += pdf[i]; cdf[i + 1] = s; }
      return { lam, ymax, pdf, cdf, tot: s };
    };
    const emit = (n) => {
      const m = model();
      for (let k = 0; k < n; k++) { const u = Math.random() * m.tot; let lo = 0, hi = NB; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (m.cdf[mid] <= u) lo = mid; else hi = mid; } hits[lo]++; total++; }
    };
    sim.animate(() => { if (total < 20000) emit(60); }, { autoplay: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, m = model(), W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H * 0.62, xmin: -m.ymax, xmax: m.ymax, ymin: 0, ymax: 1.15, xlabel: '', ylabel: 'probabilidad (normalizada)', ml: 52, mb: 8, title: 'Predicción de la mecánica cuántica' });
      pl.frame();
      const xs = Array.from({ length: NB }, (_, i) => (-0.5 + (i + 0.5) / NB) * 2 * m.ymax), mx = Math.max(...m.pdf);
      pl.xy(xs, Array.from(m.pdf, (q) => q / mx), { color: '--accent', width: 2.4, fill: '--accent', fillAlpha: 0.12 });
      const envs = xs.map((y) => { const beta = (Math.PI * p.a * y / (L * 1e6)) / m.lam; return Math.abs(beta) < 1e-9 ? 1 : Math.pow(Math.sin(beta) / beta, 2); });
      pl.xy(xs, envs, { color: '--c4', width: 1.4, dash: [5, 3] });
      /* pantalla de impactos */
      const y0 = H * 0.66, hh = H * 0.34 - 22, x0 = pl.ix, ww = pl.iw;
      ctx.save(); ctx.fillStyle = EM.col('--canvas'); ctx.strokeStyle = EM.col('--rule-strong'); ctx.fillRect(x0, y0, ww, hh); ctx.strokeRect(x0 + 0.5, y0 + 0.5, ww, hh);
      const mxh = Math.max(1, ...hits), acc = EM.col('--accent');
      for (let i = 0; i < NB; i++) { if (!hits[i]) continue; const px = x0 + ((i + 0.5) / NB) * ww, a = Math.min(1, 0.12 + (0.88 * hits[i]) / mxh); ctx.fillStyle = EM.alpha('--accent', a); ctx.fillRect(px - ww / NB / 2, y0 + 1, Math.max(1, ww / NB), hh - 1); }
      /* puntos individuales (los últimos) */
      ctx.restore();
      EM.text(ctx, 'posición en la pantalla y (µm)    ·    el histograma se llena impacto a impacto', x0 + ww / 2, H - 6, { size: 11.5, align: 'center', color: '--ink-3' });
      EM.text(ctx, `−${EM.sci(m.ymax, 2)}`, x0, y0 + hh + 14, { size: 10.5, color: '--ink-3' }); EM.text(ctx, `${EM.sci(m.ymax, 2)}`, x0 + ww, y0 + hh + 14, { size: 10.5, color: '--ink-3', align: 'right' });
      pl.legend([{ label: p.which ? 'sin interferencia (se conoce la rendija)' : 'interferencia  sinc²·cos²', color: '--accent' }, { label: 'envolvente de una rendija', color: '--c4', dash: [5, 3] }], 'tr');
      sim.set('lam', `${EM.fix(m.lam * 1e6, 3)} pm`);
      sim.set('fr', `${EM.fix((m.lam * L * 1e6) / p.d, 3)} µm · ${EM.fix((2 * p.d) / p.a, 1)}`);
      sim.set('n', `${total} · ${hits.reduce((a, b) => a + (b > 0 ? 1 : 0), 0)} intervalos ocupados`);
    });
  });
})();
