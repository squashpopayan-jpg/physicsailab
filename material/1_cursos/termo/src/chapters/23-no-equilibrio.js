/* Capítulo 23 — Termodinámica fuera del equilibrio */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;

  /* 23.1 Producción de entropía en una barra */
  EM.defineSim('produccion-entropia', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('TH', { label: 'Foco caliente', min: 310, max: 800, step: 1, value: 500, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('TC', { label: 'Foco frío', min: 250, max: 400, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('k', { label: 'Material (conductividad)', min: 1, max: 400, step: 1, value: 50, unit: 'W/m·K', log: true, fmt: (v) => v.toFixed(0) });
    sim.resetButton(() => reset());
    sim.out('S', 'Producción total de entropía', { hl: true });
    sim.out('Sst', 'Valor estacionario <i>Q̇</i>(1/<i>T<sub>C</sub></i> − 1/<i>T<sub>H</sub></i>)');
    sim.out('Q', 'Calor que entra · que sale');
    const N = 50, L = 0.2, A = 1e-4, rho = 7800, c = 470;
    let T, t;
    const reset = () => { T = new Float64Array(N).fill(sim.p.TC); T[0] = sim.p.TH; t = 0; };
    reset();
    sim.onChange = (id) => { if (id !== 'k') reset(); };
    sim.animate((dt) => {
      if (!(dt > 0)) return;
      const D = sim.p.k / (rho * c), dx = L / (N - 1), tau = (L * L) / D, simdt = dt * tau * 0.03, hmax = (0.4 * dx * dx) / D, n = Math.min(3000, Math.ceil(simdt / hmax));
      for (let i = 0; i < n; i++) T = TH.heatStep(T, D, dx, simdt / n, sim.p.TH, sim.p.TC);
      t += simdt;
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const dx = L / (N - 1), xs = [], sig = [];
      let S = 0;
      for (let i = 0; i < N - 1; i++) { const g = (T[i + 1] - T[i]) / dx, Tm = (T[i] + T[i + 1]) / 2, s = (p.k * g * g) / (Tm * Tm); xs.push((i + 0.5) * dx * 100); sig.push(s / 1000); S += s * dx * A; }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W / 2, h: H, xmin: 0, xmax: 20, ymin: p.TC - 10, ymax: p.TH + 10, xlabel: 'x (cm)', ylabel: 'T (K)' });
      pl.frame(); pl.xy(Array.from({ length: N }, (_, i) => i * dx * 100), Array.from(T), { color: '--accent', width: 2.6 });
      pl.fn((x) => p.TH - ((p.TH - p.TC) * x) / 20, { color: '--grid-2', dash: [5, 4] });
      const Qs = (p.k * A * (p.TH - p.TC)) / L, Sst = Qs * (1 / p.TC - 1 / p.TH);
      const smax = Math.max(...sig, ((p.k * Math.pow((p.TH - p.TC) / L, 2)) / (p.TC * p.TC)) / 1000) * 1.1;
      const p2 = new EM.Plot(ctx, { x: W / 2, y: 0, w: W / 2, h: H, xmin: 0, xmax: 20, ymin: 0, ymax: smax, xlabel: 'x (cm)', ylabel: 'σ (kW/K·m³)' });
      p2.frame(); p2.xy(xs, sig, { color: '--c3', width: 2.4, fill: '--c3', fillAlpha: 0.15 });
      p2.fn((x) => { const Tx = p.TH - ((p.TH - p.TC) * x) / 20; return (p.k * Math.pow((p.TH - p.TC) / L, 2)) / (Tx * Tx) / 1000; }, { color: '--ink-3', width: 1.2, dash: [5, 4] });
      const qin = (-p.k * A * (T[1] - T[0])) / dx, qout = (-p.k * A * (T[N - 1] - T[N - 2])) / dx;
      sim.set('S', EM.fix(S * 1000, 4) + ' mW/K');
      sim.set('Sst', EM.fix(Sst * 1000, 4) + ' mW/K');
      sim.set('Q', EM.fix(qin, 3) + ' W · ' + EM.fix(qout, 3) + ' W');
    });
  });

  /* 23.2 Módulo termoeléctrico */
  EM.defineSim('termoelectrico', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('mode', { label: 'Modo', options: [['gen', 'Generador'], ['ref', 'Refrigerador Peltier']], value: 'gen' });
    sim.slider('TH', { label: 'Lado caliente', min: 20, max: 400, step: 1, value: 200, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('TC', { label: 'Lado frío', min: -30, max: 60, step: 1, value: 30, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('ZT', { label: 'Figura de mérito <i>ZT</i>', min: 0.1, max: 3, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) });
    sim.out('e', 'Eficiencia o COP máximos', { hl: true });
    sim.out('c', 'Límite de Carnot');
    sim.out('f', 'Fracción de Carnot');
    sim.onChange = (id) => { if (id === 'mode') { if (sim.p.mode === 'ref') { sim.ctl.TH.set(27, true); sim.ctl.TC.set(7, true); } else { sim.ctl.TH.set(200, true); sim.ctl.TC.set(30, true); } } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const Th = Math.max(p.TH, p.TC + 1) + 273.15, Tc = p.TC + 273.15;
      const gen = p.mode === 'gen';
      const effG = (zt) => TH.tegEta(Th, Tc, zt);
      const copR = (zt) => { const z = Math.sqrt(1 + zt); return (Tc / (Th - Tc)) * (z - Th / Tc) / (z + 1); };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 3, ymin: 0, ymax: gen ? 1 - Tc / Th : Math.min(30, Tc / (Th - Tc)) * 1.05, xlabel: 'ZT', ylabel: gen ? 'η máxima' : 'COP máximo' });
      pl.frame();
      pl.fn(gen ? effG : (zt) => Math.max(0, copR(zt)), { color: '--accent', width: 2.6 });
      pl.hline(gen ? 1 - Tc / Th : Tc / (Th - Tc), { color: '--c3', label: 'Carnot' });
      const v = gen ? effG(p.ZT) : copR(p.ZT), cl = gen ? 1 - Tc / Th : Tc / (Th - Tc);
      pl.dot(p.ZT, Math.max(0, v), { color: '--accent', r: 6 });
      [['Bi₂Te₃ comercial', 0.9], ['PbTe', 1.5], ['SnSe (récord)', 2.6]].forEach(([n, z]) => pl.vline(z, { color: '--ink-3', label: n, labelY: 40 }));
      sim.set('e', gen ? EM.fix(100 * v, 2) + ' %' : v > 0 ? EM.fix(v, 3) : 'no enfría con este ΔT');
      sim.set('c', gen ? EM.fix(100 * cl, 2) + ' %' : EM.fix(cl, 2));
      sim.set('f', EM.fix((100 * Math.max(0, v)) / cl, 1) + ' %');
    });
  });

  /* 23.3 Movimiento browniano */
  EM.defineSim('browniano', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('r', { label: 'Radio de las partículas', min: 0.1, max: 3, step: 0.01, value: 0.5, unit: 'µm', log: true, fmt: (v) => v.toFixed(2) });
    sim.slider('t', { label: 'Temperatura del agua', min: 5, max: 80, step: 1, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('n', { label: 'Número de partículas', min: 5, max: 200, step: 1, value: 40, fmt: (v) => v.toFixed(0) });
    sim.resetButton(() => reset());
    sim.out('D', 'Coeficiente de difusión teórico', { hl: true });
    sim.out('Dm', 'Medido con la pendiente de ⟨r²⟩');
    sim.out('NA', 'Constante de Avogadro despejada');
    /* viscosidad del agua (Vogel, ajuste a IAPWS) */
    const visc = (t) => 2.414e-5 * Math.pow(10, 247.8 / (t + 273.15 - 140));
    let P, t0, msd, tt;
    const reset = () => { const n = sim.p.n; P = Array.from({ length: n }, () => ({ x: 0, y: 0, tr: [[0, 0]] })); msd = []; tt = 0; };
    reset();
    sim.onChange = reset;
    const Dth = () => (TH.kB * (sim.p.t + 273.15)) / (6 * Math.PI * visc(sim.p.t) * sim.p.r * 1e-6);
    sim.animate((dt) => {
      if (!(dt > 0)) return;
      const D = Dth(), h = 0.05; /* 50 ms por paso simulado */
      for (let k = 0; k < 2; k++) {
        const s = Math.sqrt(2 * D * h);
        let sum = 0;
        for (const q of P) { q.x += s * EM.gauss(); q.y += s * EM.gauss(); if (q.tr.length < 2000) q.tr.push([q.x, q.y]); sum += q.x * q.x + q.y * q.y; }
        tt += h; msd.push([tt, sum / P.length]);
        if (msd.length > 2000) msd.shift();
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const D = Dth(), scale = Math.max(5e-6, 3.2 * Math.sqrt(4 * D * Math.max(tt, 10)));
      const side = H - 20, ox = 10 + side / 2, oy = H / 2;
      ctx.strokeStyle = EM.col('--rule'); ctx.strokeRect(10, 10, side, side);
      P.slice(0, 12).forEach((q, i) => {
        ctx.strokeStyle = EM.alpha(['--c1', '--c2', '--c3', '--c4', '--c5'][i % 5], 0.7); ctx.lineWidth = 1; ctx.beginPath();
        q.tr.forEach(([x, y], j) => { const X = ox + (x / scale) * side, Y = oy + (y / scale) * side; j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
      });
      EM.text(ctx, 'escala: ' + EM.fix(scale * 1e6, 1) + ' µm', 14, H - 14, { size: 10.5, color: '--ink-3' });
      const tmax = Math.max(1, tt);
      const pl = new EM.Plot(ctx, { x: side + 20, y: 0, w: W - side - 20, h: H, xmin: 0, xmax: tmax, ymin: 0, ymax: Math.max(4 * D * tmax * 1.5, 1e-13) * 1e12, xlabel: 't (s)', ylabel: '⟨r²⟩ (µm²)' });
      pl.frame();
      pl.fn((x) => 4 * D * x * 1e12, { color: '--c3', width: 1.6, dash: [5, 4] });
      pl.path(msd.map(([a, b]) => [a, b * 1e12]), { color: '--accent', width: 2 });
      /* pendiente por mínimos cuadrados con origen */
      let sxy = 0, sxx = 0; for (const [a, b] of msd) { sxy += a * b; sxx += a * a; }
      const Dm = sxx > 0 ? sxy / sxx / 4 : NaN, T = p.t + 273.15;
      sim.set('D', EM.sci(D, 3) + ' m²/s (η = ' + EM.sci(visc(p.t), 3) + ' Pa·s)');
      sim.set('Dm', isFinite(Dm) ? EM.sci(Dm, 3) + ' m²/s' : '—');
      sim.set('NA', isFinite(Dm) ? EM.sci((TH.R * T) / (6 * Math.PI * visc(p.t) * p.r * 1e-6 * Dm), 3) + ' mol⁻¹' : '—');
    });
  });

  /* 23.4 Ruido de Johnson–Nyquist */
  EM.defineSim('johnson', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('R', { label: 'Resistencia', min: 10, max: 1e8, step: 1, value: 1e6, log: true, fmt: (v) => EM.si(v, 'Ω') });
    sim.slider('T', { label: 'Temperatura', min: 1, max: 600, step: 1, value: 300, unit: 'K', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('B', { label: 'Ancho de banda', min: 10, max: 1e7, step: 1, value: 1e4, log: true, fmt: (v) => EM.si(v, 'Hz') });
    sim.out('v', 'Tensión eficaz de ruido', { hl: true });
    sim.out('d', 'Densidad espectral √(4<i>k<sub>B</sub>TR</i>)');
    let seq = [];
    sim.animate(() => { const s = Math.sqrt(4 * TH.kB * sim.p.T * sim.p.R * sim.p.B); for (let i = 0; i < 6; i++) seq.push(s * EM.gauss()); if (seq.length > 600) seq = seq.slice(-600); });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const vr = Math.sqrt(4 * TH.kB * p.T * p.R * p.B), ref = Math.sqrt(4 * TH.kB * 300 * p.R * p.B);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.65, h: H, xmin: 0, xmax: 600, ymin: -4 * ref * 1e6, ymax: 4 * ref * 1e6, xlabel: 'muestras', ylabel: 'V (µV)' });
      pl.frame(); pl.xy(seq.map((_, i) => i), seq.map((v) => v * 1e6), { color: '--accent', width: 1 });
      pl.hline(vr * 1e6, { color: '--c3' }); pl.hline(-vr * 1e6, { color: '--c3' });
      const nb = 30, hist = new Array(nb).fill(0), lo = -4 * ref, w = (8 * ref) / nb;
      for (const v of seq) { const k = Math.floor((v - lo) / w); if (k >= 0 && k < nb) hist[k]++; }
      const p2 = new EM.Plot(ctx, { x: W * 0.65, y: 0, w: W * 0.35, h: H, xmin: 0, xmax: Math.max(...hist, 1) * 1.1, ymin: -4 * ref * 1e6, ymax: 4 * ref * 1e6, xlabel: 'cuentas', yticks: [] });
      p2.frame();
      ctx.fillStyle = EM.alpha('--c1', 0.5);
      hist.forEach((c, k) => { const y0 = p2.Y((lo + k * w) * 1e6), y1 = p2.Y((lo + (k + 1) * w) * 1e6); ctx.fillRect(p2.X(0), y1, p2.X(c) - p2.X(0), y0 - y1 - 1); });
      sim.set('v', EM.si(vr, 'V'));
      sim.set('d', EM.si(Math.sqrt(4 * TH.kB * p.T * p.R), 'V/√Hz'));
    });
  });
})();
