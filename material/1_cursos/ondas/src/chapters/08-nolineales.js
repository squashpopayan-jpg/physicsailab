/* Capítulo 8 — Oscilaciones no lineales y caos */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);
  const wrapPi = (a) => { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; };

  /* Paso RK4 rápido para sistemas de 2 variables con forzamiento dependiente del tiempo */
  function rk2d(f, t, x, v, h) {
    const a1 = f(t, x, v), k1x = v;
    const a2 = f(t + h / 2, x + (h / 2) * k1x, v + (h / 2) * a1), k2x = v + (h / 2) * a1;
    const a3 = f(t + h / 2, x + (h / 2) * k2x, v + (h / 2) * a2), k3x = v + (h / 2) * a2;
    const a4 = f(t + h, x + h * k3x, v + h * a3), k4x = v + h * a3;
    return [x + (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x), v + (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4)];
  }
  EM.rk2d = rk2d;

  /* ======================================================================
     8.1 Oscilador anarmónico
     ====================================================================== */
  EM.defineSim('anharmonic', function (sim) {
    sim.cols2();
    const ct = sim.canvas({ aspect: 1.2 });
    const cs = sim.canvas({ aspect: 1.2 });
    sim.slider('al', { label: 'Coeficiente cuadrático <i>α</i>', min: -1, max: 1, step: 0.01, value: 0, unit: 's⁻²m⁻¹', fmt: f2 });
    sim.slider('be', { label: 'Coeficiente cúbico <i>β</i>', min: -1, max: 3, step: 0.01, value: 1, unit: 's⁻²m⁻²', fmt: f2 });
    sim.slider('A', { label: 'Amplitud inicial <i>A</i>', min: 0.05, max: 1.5, step: 0.01, value: 0.8, unit: 'm', fmt: f2 });
    sim.note('<i>ω</i><sub>0</sub> = 1 rad/s. La masa parte del reposo en <i>x</i> = <i>A</i>.');
    sim.out('w', 'Frecuencia medida', { hl: true });
    sim.out('wl', 'Predicción de Lindstedt');
    sim.out('mean', 'Posición media');
    sim.out('h', 'Armónicos (amplitud relativa)');
    let cache = null;
    sim.onDraw(() => {
      const p = sim.p;
      const key = p.al + ',' + p.be + ',' + p.A;
      if (!cache || cache.key !== key) {
        const N = 4096, Tt = 40 * 2 * Math.PI, h = Tt / N;
        const xs = new Float64Array(N);
        let x = p.A, v = 0, esc = false;
        const f = (t, x, v) => -x - p.al * x * x - p.be * x * x * x;
        for (let i = 0; i < N; i++) {
          xs[i] = x;
          for (let s = 0; s < 4; s++) [x, v] = rk2d(f, 0, x, v, h / 4);
          if (!isFinite(x) || Math.abs(x) > 50) { esc = true; break; }
        }
        /* frecuencia por cruces de la media */
        let mean = 0;
        for (let i = 0; i < N; i++) mean += xs[i];
        mean /= N;
        const cr = [];
        for (let i = 1; i < N; i++) if (xs[i - 1] < mean && xs[i] >= mean) cr.push(i - 1 + (mean - xs[i - 1]) / (xs[i] - xs[i - 1]));
        const w = cr.length > 2 ? (2 * Math.PI * (cr.length - 1)) / ((cr[cr.length - 1] - cr[0]) * h) : NaN;
        /* espectro por FFT con ventana de Hann */
        const re = new Float64Array(N), im = new Float64Array(N);
        for (let i = 0; i < N; i++) re[i] = (xs[i] - mean) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
        EM.fft(re, im);
        const spec = [];
        for (let k = 0; k < N / 2; k++) spec.push(Math.hypot(re[k], im[k]));
        cache = { key, xs, h, w, mean, spec, esc, dw: (2 * Math.PI) / (N * h) };
      }
      const C = cache;
      EM.draw.clear(ct);
      const pt = new EM.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: 0, xmax: 4 * 2 * Math.PI, ymin: -1.8, ymax: 1.8, xlabel: 't (s)', ylabel: 'x (m)', ml: 52 });
      pt.frame();
      pt.fn((t) => p.A * Math.cos(t), { color: '--ink-3', width: 1.2, dash: [5, 4] });
      const n4 = Math.floor((8 * Math.PI) / C.h);
      pt.xy(Array.from({ length: n4 }, (_, i) => i * C.h), Array.from(C.xs.slice(0, n4)), { color: '--accent', width: 2.2 });
      pt.legend([{ label: 'oscilador real', color: '--accent' }, { label: 'MAS de igual amplitud', color: '--ink-3', dash: [5, 4] }], 'br');
      EM.draw.clear(cs);
      const ps = new EM.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0, xmax: 6, ymin: 1e-5, ymax: 2, ylog: true, xlabel: 'ω (rad/s)', ylabel: 'espectro (relativo)', ml: 52 });
      ps.frame();
      const mx = Math.max(...C.spec);
      const ks = C.spec.map((_, k) => k * C.dw), vs = C.spec.map((s) => Math.max(1e-6, s / mx));
      ps.xy(ks, vs, { color: '--c1', width: 1.6, fill: '--c1', fillAlpha: 0.12, base: 1e-5 });
      if (isFinite(C.w)) for (let n = 1; n <= 5; n++) ps.vline(n * C.w, { color: '--ink-3', alpha: 0.5, label: n + 'ω' });
      const hs = [];
      if (isFinite(C.w)) for (let n = 2; n <= 4; n++) { const k = Math.round((n * C.w) / C.dw); let m = 0; for (let j = k - 3; j <= k + 3; j++) if (C.spec[j]) m = Math.max(m, C.spec[j]); hs.push(n + 'ω: ' + EM.sci(m / mx, 2)); }
      sim.set('w', C.esc ? 'la partícula escapa del pozo' : EM.fix(C.w, 4) + ' rad/s');
      sim.set('wl', EM.fix(1 + (3 * p.be * p.A * p.A) / 8, 4) + ' rad/s (sólo β)');
      sim.set('mean', EM.fix(C.mean, 4) + ' m');
      sim.set('h', hs.join(' · '));
    });
  });

  /* ======================================================================
     8.2 Barrido de frecuencia en Duffing
     ====================================================================== */
  EM.defineSim('duffing-sweep', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.5, cls: 'full' });
    sim.slider('be', { label: 'No linealidad <i>β</i>', min: -0.3, max: 1, step: 0.01, value: 0.4, fmt: f2, onInput: () => reset() });
    sim.slider('g', { label: 'Amortiguamiento <i>γ</i>', min: 0.02, max: 0.5, step: 0.005, value: 0.08, fmt: f3, onInput: () => reset() });
    sim.slider('F', { label: 'Fuerza <i>F</i><sub>0</sub>/<i>m</i>', min: 0.02, max: 0.5, step: 0.005, value: 0.25, fmt: f3, onInput: () => reset() });
    sim.seg('dir', { label: 'Barrido', options: [[1, 'Subiendo ω'], [-1, 'Bajando ω']], value: 1, onInput: () => { sweeping = true; } });
    sim.button('Barrer', () => { sweeping = true; }, { primary: true });
    sim.button('Borrar puntos', () => { pts.length = 0; });
    sim.note('<i>ω</i><sub>0</sub> = 1. Cada punto se mide tras dejar que el sistema se acomode a la nueva frecuencia, sin reiniciarlo.');
    sim.out('w', 'Frecuencia actual <i>ω</i>', { hl: true });
    sim.out('A', 'Amplitud medida');
    let x = 0, v = 0, t = 0, w = 0.5, sweeping = false;
    const pts = [];
    const reset = () => { x = 0; v = 0; t = 0; pts.length = 0; w = sim.p.dir > 0 ? 0.5 : 2.2; sweeping = false; };
    reset();
    sweeping = true;
    sim.animate(() => {
      if (!sweeping) return;
      const p = sim.p;
      const f = (tt, x, v) => p.F * Math.cos(w * tt) - p.g * v - x - p.be * x * x * x;
      const T = (2 * Math.PI) / w, nper = 30, steps = 60;
      let amp = 0;
      for (let k = 0; k < nper; k++) for (let s = 0; s < steps; s++) { [x, v] = rk2d(f, t, x, v, T / steps); t += T / steps; if (k >= nper - 4) amp = Math.max(amp, Math.abs(x)); }
      pts.push([w, amp, p.dir]);
      w += 0.01 * p.dir;
      if (w > 2.2 || w < 0.5) { sweeping = false; w = M.clamp(w, 0.5, 2.2); }
    }, { autoplay: true });
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cv);
      const Amax = Math.min(8, Math.max(1, p.F / (p.g * 1) * 1.15));
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.5, xmax: 2.2, ymin: 0, ymax: Amax, xlabel: 'ω / ω₀', ylabel: 'amplitud A', ml: 52 });
      pl.frame();
      /* curva teórica: para cada A, raíces en u = ω² */
      const br1 = [], br2 = [];
      for (let i = 1; i <= 600; i++) {
        const A = (Amax * i) / 600, c = 1 + 0.75 * p.be * A * A, g2 = p.g * p.g;
        const B = 2 * c - g2, Cq = c * c - (p.F * p.F) / (A * A), D = B * B - 4 * Cq;
        if (D < 0) continue;
        const u1 = (B + Math.sqrt(D)) / 2, u2 = (B - Math.sqrt(D)) / 2;
        if (u1 > 0) br1.push([Math.sqrt(u1), A]);
        if (u2 > 0) br2.push([Math.sqrt(u2), A]);
      }
      pl.path(br1, { color: '--ink-3', width: 1.4, dash: [5, 4] });
      pl.path(br2, { color: '--ink-3', width: 1.4, dash: [5, 4] });
      pl.fn((ww) => p.F / Math.hypot(1 - ww * ww, p.g * ww), { color: '--grid-2', width: 1.2 });
      pts.forEach(([ww, a, d]) => pl.dot(ww, a, { color: d > 0 ? '--c2' : '--c1', r: 3 }));
      pl.vline(w, { color: '--accent' });
      pl.legend([{ label: 'balance armónico', color: '--ink-3', dash: [5, 4] }, { label: 'lineal (β = 0)', color: '--grid-2' }, { label: 'medido subiendo', color: '--c2', kind: 'dot' }, { label: 'medido bajando', color: '--c1', kind: 'dot' }], 'tr');
      sim.set('w', EM.fix(w, 3) + (sweeping ? ' (barriendo…)' : ''));
      sim.set('A', pts.length ? EM.fix(pts[pts.length - 1][1], 3) : '—');
    });
  });

  /* ======================================================================
     8.3 Resonancia paramétrica y péndulo de Kapitza
     ====================================================================== */
  EM.defineSim('parametric', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 0.95 });
    const cm = sim.canvas({ aspect: 0.95 });
    const ct = sim.canvas({ aspect: 3.2, cls: 'full' });
    sim.group('Suspensión');
    sim.slider('W', { label: 'Frecuencia <i>Ω</i>/<i>ω</i><sub>0</sub>', min: 0.5, max: 50, value: 2, log: true, step: 0.01, fmt: f2, onInput: () => restart() });
    sim.slider('a', { label: 'Amplitud <i>a</i>/<i>ℓ</i>', min: 0, max: 0.3, step: 0.001, value: 0.075, fmt: f3, onInput: () => restart() });
    sim.slider('g', { label: 'Amortiguamiento <i>γ</i>/<i>ω</i><sub>0</sub>', min: 0, max: 0.3, step: 0.005, value: 0.05, fmt: f3, onInput: () => { chart = null; restart(); } });
    sim.seg('mode', { label: 'Posición inicial', options: [['down', 'Colgando'], ['up', 'Invertido']], value: 'down', onInput: () => restart() });
    sim.resetButton(() => restart());
    sim.out('h', '<i>h</i> = <i>a</i>Ω²/<i>g</i>', { hl: true });
    sim.out('st', 'Reposo');
    sim.out('kap', 'Kapitza: (<i>a</i>/<i>ℓ</i>)²(<i>Ω</i>/<i>ω</i><sub>0</sub>)²');
    /* unidades: ℓ = 1, ω0 = 1 (g = 1) */
    let th, om, t, tr, chart = null;
    const restart = () => { th = sim.p.mode === 'up' ? Math.PI - 0.05 : 0.02; om = 0; t = 0; tr = new EM.Trace(1600); };
    restart();
    const acc = (tt, x, v) => { const p = sim.p, W = p.W, ys = -p.a * W * W * Math.cos(W * tt); return -(1 + ys) * Math.sin(x) - p.g * v; };
    sim.animate((dt) => {
      const p = sim.p, T = (2 * Math.PI) / p.W;
      const n = Math.max(20, Math.ceil((dt * 2.5) / (T / 40)));
      const h = (dt * 2.5) / n;
      for (let i = 0; i < n; i++) { [th, om] = rk2d(acc, t, th, om, h); t += h; }
      tr.push(t, th);
    });
    /* mapa de estabilidad de la ecuación de Mathieu linealizada (Floquet) */
    const buildChart = () => {
      const g = sim.p.g, NX = 70, NY = 44;
      const data = new Float32Array(NX * NY);
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        const W = 0.5 + (4 * (i + 0.5)) / NX, hh = (1.2 * (j + 0.5)) / NY;
        const f = (tt, x, v) => -(1 - hh * Math.cos(W * tt)) * x - g * v;
        const T = (2 * Math.PI) / W, n = 120;
        let a = [1, 0], b = [0, 1], tt = 0;
        for (let k = 0; k < n; k++) { a = rk2d(f, tt, a[0], a[1], T / n); b = rk2d(f, tt, b[0], b[1], T / n); tt += T / n; }
        const tr2 = a[0] + b[1], det = a[0] * b[1] - a[1] * b[0];
        const disc = tr2 * tr2 - 4 * det;
        let lam;
        if (disc >= 0) lam = Math.max(Math.abs((tr2 + Math.sqrt(disc)) / 2), Math.abs((tr2 - Math.sqrt(disc)) / 2));
        else lam = Math.sqrt(Math.abs(det));
        data[j * NX + i] = lam;
      }
      chart = { NX, NY, data };
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const L = Math.min(W, H) * 0.32, cx = W / 2;
      const ys = p.a * Math.cos(p.W * t);
      const py = H * 0.5 - ys * L;
      ctx.fillStyle = EM.alpha('--ink-3', 0.5); ctx.fillRect(cx - 30, py - 6, 60, 6);
      const bx = cx + L * Math.sin(th), by = py + L * Math.cos(th);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, py); ctx.lineTo(bx, by); ctx.stroke();
      EM.draw.bob(ctx, bx, by, 11, { color: '--accent' });
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(cx, py, 4, 0, 7); ctx.fill();
      EM.draw.clear(cm);
      const pm = new EM.Plot(cm.ctx, { x: 0, y: 0, w: cm.w, h: cm.h, xmin: 0.5, xmax: 4.5, ymin: 0, ymax: 1.2, xlabel: 'Ω / ω₀', ylabel: 'h', ml: 52 });
      pm.frame();
      if (!chart) buildChart();
      const cw = pm.iw / chart.NX, chh = pm.ih / chart.NY;
      for (let j = 0; j < chart.NY; j++) for (let i = 0; i < chart.NX; i++) {
        const l = chart.data[j * chart.NX + i];
        if (l > 1.0005) { cm.ctx.fillStyle = EM.alpha('--c2', Math.min(0.55, 0.15 + 0.4 * Math.log(l))); cm.ctx.fillRect(pm.ix + i * cw, pm.iy + pm.ih - (j + 1) * chh, cw + 0.5, chh + 0.5); }
      }
      pm.label(2.05, 1.1, 'inestable', { color: '--c2', size: 11 });
      const hcur = p.a * p.W * p.W;
      if (p.W <= 4.5) pm.dot(p.W, Math.min(hcur, 1.19), { color: '--accent', r: 6 });
      else pm.label(3.2, 0.1, 'Ω fuera del mapa', { color: '--ink-3', size: 11 });
      EM.draw.clear(ct);
      const span = 60, t0 = Math.max(0, t - span);
      const pt = new EM.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: t0, xmax: t0 + span, ymin: -200, ymax: 200, xlabel: 't (1/ω₀)', ylabel: 'θ (°)', ml: 52, yticks: [-180, 0, 180] });
      pt.frame();
      pt.xy(tr.t, tr.col(0).map((a) => M.deg(wrapPi(a))), { color: '--accent', width: 1.6, breakJumps: true });
      sim.set('h', EM.fix(hcur, 3));
      let stable = '—';
      if (p.mode === 'down' && p.W <= 4.5 && chart) {
        const i = Math.floor(((p.W - 0.5) / 4) * chart.NX), j = Math.floor((hcur / 1.2) * chart.NY);
        stable = j >= chart.NY ? 'fuera del mapa' : chart.data[j * chart.NX + M.clamp(i, 0, chart.NX - 1)] > 1.0005 ? 'inestable: la oscilación crece' : 'estable';
      }
      sim.set('st', stable);
      const kap = (p.a * p.W) ** 2;
      sim.set('kap', EM.fix(kap, 3) + (kap > 2 ? ' > 2: invertido estable' : ' < 2: invertido inestable'));
    });
  });

  /* ======================================================================
     8.4 Van der Pol
     ====================================================================== */
  EM.defineSim('van-der-pol', function (sim) {
    sim.cols2();
    const cp = sim.canvas({ aspect: 1 });
    const ct = sim.canvas({ aspect: 1 });
    sim.slider('mu', { label: 'Parámetro <i>μ</i>', min: 0.05, max: 8, step: 0.05, value: 1, fmt: f2, onInput: () => { trajs.forEach((q) => { q.tr = []; }); } });
    sim.button('Borrar trayectorias', () => { trajs.length = 0; });
    sim.hint('Haz clic en el plano de fases para lanzar trayectorias', cp);
    sim.out('A', 'Amplitud del ciclo límite', { hl: true });
    sim.out('T', 'Período');
    const L = 4, VL = 12;
    const trajs = [];
    const add = (x, v) => { trajs.push({ x, v, tr: [[x, v]], t: 0, xt: [] }); if (trajs.length > 6) trajs.shift(); };
    add(0.1, 0); add(3.5, 3);
    let gp = null;
    EM.pointer(cp, { down: (px, py) => { if (!gp || !gp.inside(px, py)) return null; add(gp.invX(px), gp.invY(py)); sim.redraw(); return null; }, hover: () => 'crosshair' });
    let amp = NaN, per = NaN, lastCross = null;
    sim.animate((dt) => {
      const mu = sim.p.mu;
      const f = (t, x, v) => mu * (1 - x * x) * v - x;
      const n = Math.ceil(30 * (1 + mu / 2));
      trajs.forEach((q, k) => {
        for (let i = 0; i < n; i++) {
          const ox = q.x;
          [q.x, q.v] = rk2d(f, 0, q.x, q.v, (dt * 2.5) / n);
          q.t += (dt * 2.5) / n;
          if (k === trajs.length - 1 && ox < 0 && q.x >= 0) { if (lastCross !== null) per = q.t - lastCross; lastCross = q.t; }
        }
        q.tr.push([q.x, q.v]); if (q.tr.length > 900) q.tr.shift();
        q.xt.push([q.t, q.x]); if (q.xt.length > 900) q.xt.shift();
      });
      const last = trajs[trajs.length - 1];
      if (last) amp = Math.max(...last.tr.slice(-300).map((q) => Math.abs(q[0])));
    });
    const cols = ['--c1', '--c2', '--c3', '--c4', '--c5', '--accent'];
    sim.onDraw(() => {
      EM.draw.clear(cp);
      const vl = Math.min(VL, 3 + sim.p.mu * 1.5);
      gp = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -L, xmax: L, ymin: -vl, ymax: vl, xlabel: 'x', ylabel: 'ẋ', ml: 52 });
      gp.frame();
      gp.band(-1, 1, { color: '--c3', alpha: 0.07 });
      trajs.forEach((q, i) => { gp.path(q.tr, { color: cols[i % 6], width: 1.6 }); gp.dot(q.x, q.v, { color: cols[i % 6], r: 4.5 }); });
      EM.draw.clear(ct);
      const last = trajs[trajs.length - 1];
      const t1 = last ? last.t : 0;
      const pt = new EM.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: Math.max(0, t1 - 30), xmax: Math.max(30, t1), ymin: -L, ymax: L, xlabel: 't', ylabel: 'x', ml: 52 });
      pt.frame();
      trajs.forEach((q, i) => pt.path(q.xt, { color: cols[i % 6], width: 1.6 }));
      sim.set('A', isFinite(amp) ? EM.fix(amp, 3) : '—');
      sim.set('T', isFinite(per) ? EM.fix(per, 3) + ' (2π = 6.283 si μ → 0)' : '—');
    });
  });

  /* ======================================================================
     8.5 Péndulo caótico
     ====================================================================== */
  const WD = 2 / 3, GAM = 0.5;
  const pendF = (F) => (t, x, v) => -GAM * v - Math.sin(x) + F * Math.cos(WD * t);
  EM.defineSim('chaotic-pendulum', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1 });
    const cq = sim.canvas({ aspect: 1 });
    const cd = sim.canvas({ aspect: 3.2, cls: 'full' });
    sim.slider('F', { label: 'Fuerza <i>F</i> (unidades de <i>mLω</i><sub>0</sub>²)', min: 0.5, max: 1.6, step: 0.005, value: 1.15, fmt: f3, onInput: () => restart() });
    sim.slider('d0', { label: 'Diferencia inicial Δ<i>θ</i><sub>0</sub>', min: 1e-9, max: 1e-2, value: 1e-6, log: true, step: 1e-10, unit: 'rad', fmt: (v) => EM.sci(v, 1) });
    sim.slider('sp', { label: 'Velocidad de simulación', min: 1, max: 20, step: 1, value: 6, fmt: (v) => v.toFixed(0) + '×' });
    sim.resetButton(() => restart());
    sim.note('<i>γ</i> = 0.5 <i>ω</i><sub>0</sub>, <i>ω</i> = (2/3) <i>ω</i><sub>0</sub>. Parten del reposo.');
    sim.out('n', 'Períodos de la fuerza');
    sim.out('d', 'Separación |Δ<i>θ</i>|', { hl: true });
    sim.out('lam', 'Exponente de Lyapunov estimado');
    let A, B, t, pc, dl, nextP, lamv;
    const restart = () => { A = [0, 0]; B = [sim.p.d0, 0]; t = 0; pc = []; dl = new EM.Trace(2000); nextP = (2 * Math.PI) / WD * 1; lamv = null; };
    restart();
    sim.animate((dt) => {
      const f = pendF(sim.p.F), h = 0.03;
      const n = Math.round((dt * sim.p.sp) / h) || 1;
      for (let i = 0; i < n; i++) {
        A = rk2d(f, t, A[0], A[1], h); B = rk2d(f, t, B[0], B[1], h); t += h;
        if (t >= nextP) { pc.push([wrapPi(A[0]), A[1]]); nextP += (2 * Math.PI) / WD; if (pc.length > 6000) pc.shift(); }
      }
      const dd = Math.max(1e-16, Math.hypot(B[0] - A[0], B[1] - A[1]));
      dl.push(t, dd);
      if (lamv === null && dd > 0.1 && t > 20) lamv = Math.log(dd / sim.p.d0) / t;
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const cx = W / 2, cy = H / 2, L = Math.min(W, H) * 0.36;
      ctx.strokeStyle = EM.col('--grid-2'); ctx.beginPath(); ctx.arc(cx, cy, L, 0, 7); ctx.stroke();
      const dp = (th, c, a) => { const bx = cx + L * Math.sin(th), by = cy + L * Math.cos(th); ctx.globalAlpha = a; ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke(); EM.draw.bob(ctx, bx, by, 10, { color: c }); ctx.globalAlpha = 1; };
      dp(B[0], '--c1', 0.8); dp(A[0], '--accent', 1);
      EM.text(ctx, 'dos péndulos con Δθ₀ = ' + EM.sci(sim.p.d0, 1) + ' rad', 10, H - 10, { size: 11, color: '--ink-3' });
      EM.draw.clear(cq);
      const pq = new EM.Plot(cq.ctx, { x: 0, y: 0, w: cq.w, h: cq.h, xmin: -Math.PI, xmax: Math.PI, ymin: -3, ymax: 3, xpi: true, xlabel: 'θ', ylabel: 'θ̇ / ω₀', title: 'Sección de Poincaré', ml: 52 });
      pq.frame();
      cq.ctx.fillStyle = EM.col('--c5');
      pc.forEach(([x, v], i) => { if (i < 30) return; cq.ctx.fillRect(pq.X(x) - 0.8, pq.Y(v) - 0.8, 1.6, 1.6); });
      EM.draw.clear(cd);
      const pd = new EM.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: 0, xmax: Math.max(100, t), ymin: 1e-12, ymax: 100, ylog: true, xlabel: 't (1/ω₀)', ylabel: '|Δ|', ml: 58 });
      pd.frame();
      pd.xy(dl.t, dl.col(0), { color: '--c2', width: 1.6 });
      sim.set('n', EM.fix(t / ((2 * Math.PI) / WD), 0));
      const d = dl.v.length ? dl.v[dl.v.length - 1][0] : 0;
      sim.set('d', EM.sci(d, 2));
      sim.set('lam', lamv !== null ? EM.fix(lamv, 3) + ' ω₀' : t > 60 ? 'separación aún pequeña: no caótico (o lento)' : '—');
    });
  });

  /* ======================================================================
     8.6 Diagrama de bifurcaciones
     ====================================================================== */
  EM.defineSim('bifurcation', function (sim) {
    const cv = sim.canvas({ aspect: 2 });
    sim.slider('F0', { label: 'Fuerza mínima', min: 0.8, max: 1.4, step: 0.01, value: 1.0, fmt: f2, onInput: () => restart() });
    sim.slider('F1', { label: 'Fuerza máxima', min: 1.05, max: 1.6, step: 0.01, value: 1.5, fmt: f2, onInput: () => restart() });
    sim.resetButton(() => restart());
    sim.out('p', 'Progreso', { hl: true });
    sim.note('Para cada valor de <i>F</i> se descartan 120 períodos de transitorio y se marcan 60 puntos de la sección de Poincaré (<i>θ̇</i>). Cada valor de <i>F</i> continúa desde el estado final del anterior.');
    const NF = 360;
    let cols, i, st;
    const restart = () => { cols = []; i = 0; st = [0, 0]; };
    restart();
    sim.animate(() => {
      const p = sim.p;
      for (let rep = 0; rep < 3 && i < NF; rep++, i++) {
        const F = p.F0 + ((p.F1 - p.F0) * i) / (NF - 1);
        const f = pendF(F), T = (2 * Math.PI) / WD, n = 100, h = T / n;
        let x = st[0], v = st[1], t = 0;
        const pts = [];
        for (let k = 0; k < 180; k++) {
          for (let s = 0; s < n; s++) { [x, v] = rk2d(f, t, x, v, h); t += h; }
          if (k >= 120) pts.push(v);
        }
        st = [wrapPi(x), v];
        cols.push([F, pts]);
      }
    });
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cv);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: p.F0, xmax: p.F1, ymin: -3, ymax: 3, xlabel: 'amplitud de la fuerza F', ylabel: 'θ̇ en la sección de Poincaré', ml: 58 });
      pl.frame();
      cv.ctx.fillStyle = EM.col('--c1');
      cols.forEach(([F, pts]) => pts.forEach((v) => { const y = pl.Y(v); if (y > pl.iy && y < pl.iy + pl.ih) cv.ctx.fillRect(pl.X(F) - 0.6, y - 0.6, 1.3, 1.3); }));
      sim.set('p', EM.fix((100 * i) / NF, 0) + ' %');
    });
  });
})();
