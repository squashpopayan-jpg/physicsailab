# -*- coding: utf-8 -*-
src = open(r'C:\Users\User\Documents\Claude\ConCode\mcuantica\src\chapters\01-crisis.js', encoding='utf-8').read()
i0 = src.index("  /* 1.5 Ondas de materia")
i1 = src.rindex("})();")
blk = src[i0:i1]
head = """/* Capítulo 9 — Ondas de materia e incertidumbre */
(function () {
  'use strict';
  const EM = window.EM, O = EM.qm.orig, T = EM.fm.mat, K = EM.qm.K, c = K.c, hbar = K.hbar;

"""
new = r"""
  /* 9.2 Doble rendija con partículas una a una */
  const BEAM = { e: ['Electrón de 50 keV (Jönsson, Tonomura)', T.lambdaK(50e3 * K.e, K.me)], n: ['Neutrón frío (25 meV)', T.lambdaK(0.025 * K.e, K.mn)], c60: ['Molécula de C₆₀ a 117 m/s (Arndt)', K.h / (720.642 * K.u * 117)], laser: ['Luz de He–Ne (fotones)', 632.8e-9] };
  EM.defineSim('rendijas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('b', { label: 'Partícula incidente', options: Object.entries(BEAM).map(([k, v]) => [k, v[0]]), value: 'e' });
    sim.slider('d', { label: 'Separación de las rendijas d', min: 0.1, max: 50, step: 0.05, value: 2, log: true, unit: 'µm', fmt: (v) => EM.fix(v, 2) });
    sim.slider('r', { label: 'Anchura de cada rendija en unidades de la separación a/d', min: 0.03, max: 0.5, step: 0.005, value: 0.25, fmt: (v) => EM.fix(v, 3) });
    sim.slider('D', { label: 'Información de «cuál camino» D (0 = ninguna, 1 = completa)', min: 0, max: 1, step: 0.01, value: 0, fmt: (v) => EM.fix(v, 2) });
    sim.out('lam', 'Longitud de onda de de Broglie λ · separación angular de franjas λ/d', { hl: true });
    sim.out('V', 'Visibilidad de las franjas V = √(1 − D²) (complementariedad)');
    sim.out('nf', 'Franjas brillantes dentro del lóbulo central de difracción (≈ 2d/a − 1)');
    sim.out('n', 'Partículas detectadas');
    const NB = 150, UMAX = 4.5; let counts = new Float64Array(NB), total = 0, cdf = null, last = '';
    const profile = (u) => { const r = sim.p.r, V = T.visibility(sim.p.D), beta = Math.PI * u, alpha = Math.PI * u * r; return 0.5 * (1 + V * Math.cos(2 * beta)) * T.sinc(alpha) ** 2; };
    const mk = () => { const n = 3000; cdf = new Float64Array(n + 1); for (let i = 1; i <= n; i++) cdf[i] = cdf[i - 1] + profile(-UMAX + ((i - 0.5) / n) * 2 * UMAX); const s = cdf[n]; for (let i = 0; i <= n; i++) cdf[i] /= s; counts = new Float64Array(NB); total = 0; };
    const draw1 = () => { const x = Math.random(); let lo = 0, hi = cdf.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; cdf[mid] < x ? (lo = mid) : (hi = mid); } const u = -UMAX + ((lo + (x - cdf[lo]) / (cdf[hi] - cdf[lo] || 1)) / (cdf.length - 1)) * 2 * UMAX; const k = Math.floor(((u + UMAX) / (2 * UMAX)) * NB); if (k >= 0 && k < NB) { counts[k]++; total++; } };
    mk(); sim.resetButton(mk); sim.onChange = (id) => { if (id !== 'b' && id !== 'd') mk(); };
    sim.animate(() => { for (let i = 0; i < 60; i++) draw1(); });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, lam = BEAM[p.b][1], d = p.d * 1e-6;
      EM.draw.clear(cv);
      const mx = Math.max(1, ...counts), top = Math.max(0.2, mx / (total / NB * 2 * UMAX) * 0.0 + 1);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: -UMAX, xmax: UMAX, ymin: 0, ymax: 1.1, xlabel: 'orden de interferencia u = d senθ/λ', ylabel: 'intensidad (relativa)', ml: 50, mr: 8, title: 'Patrón en la pantalla' });
      pl.frame();
      /* histograma normalizado al máximo teórico */
      const norm = total > 0 ? (total / NB) * 0 + 1 : 1; void norm; void top;
      const scale = (total / (cdf.length - 1)) ; void scale;
      let cmax = 1; for (let k = 0; k < NB; k++) cmax = Math.max(cmax, counts[k]);
      const bw = (2 * UMAX) / NB;
      ctx.save(); ctx.fillStyle = EM.alpha('--c1', 0.55);
      for (let k = 0; k < NB; k++) { const x0 = pl.X(-UMAX + k * bw), x1 = pl.X(-UMAX + (k + 1) * bw), hgt = (counts[k] / cmax) * (pl.Y(0) - pl.Y(1)) * 0.98; ctx.fillRect(x0, pl.Y(0) - hgt, Math.max(1, x1 - x0 - 0.5), hgt); }
      ctx.restore();
      pl.fn(profile, { color: '--accent', width: 2.6, n: 500 });
      pl.legend([{ label: 'cos²β · sinc²α (teoría)', color: '--accent' }, { label: 'impactos acumulados', color: '--c1', kind: 'sq' }], 'tr');
      /* Esquema */
      const sx = W * 0.66, sy = H * 0.5;
      EM.text(ctx, 'Montaje (esquema)', W * 0.82, 16, { size: 12, align: 'center', color: '--ink-2' });
      ctx.save(); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 4;
      const a = p.r * 26, dd = 26; ctx.beginPath(); ctx.moveTo(sx + 60, H * 0.12); ctx.lineTo(sx + 60, sy - dd / 2 - a / 2); ctx.moveTo(sx + 60, sy - dd / 2 + a / 2); ctx.lineTo(sx + 60, sy + dd / 2 - a / 2); ctx.moveTo(sx + 60, sy + dd / 2 + a / 2); ctx.lineTo(sx + 60, H * 0.88); ctx.stroke(); ctx.restore();
      for (let k = -1; k <= 1; k += 2) { ctx.save(); ctx.strokeStyle = EM.alpha('--c1', 0.6); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(sx + 60, sy + (k * dd) / 2); ctx.lineTo(sx + W * 0.3, sy + k * H * 0.3); ctx.stroke(); ctx.restore(); }
      EM.draw.arrow(ctx, sx, sy, sx + 52, sy, { color: '--c2', width: 2.4, head: 8 }); EM.text(ctx, 'haz', sx, sy - 10, { size: 11, color: '--c2' });
      const wd = p.D > 0.01 ? 'detector de camino activo' : 'sin información de camino'; EM.text(ctx, wd, W * 0.82, H - 10, { size: 11.5, align: 'center', color: p.D > 0.01 ? '--c3' : '--ink-3' });
      const r = p.r;
      sim.set('lam', `${EM.sci(lam, 4)} m (${EM.fix(lam * 1e12, 3)} pm) · ${EM.sci(lam / d * 1e6, 4)} µrad`);
      sim.set('V', `${EM.fix(T.visibility(p.D), 4)}`);
      sim.set('nf', `${EM.fix(2 / r - 1, 1)} (central: |u| < 1/r = ${EM.fix(1 / r, 2)})`);
      sim.set('n', `${total}`);
    });
  });

  /* 9.3 Paquete gaussiano e incertidumbre */
  const MASSES = { e: ['Electrón', K.me], n: ['Neutrón', K.mn], c60: ['Molécula de C₆₀', 720.642 * K.u], dust: ['Grano de polvo de 1 µg', 1e-9] };
  EM.defineSim('incert', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('m', { label: 'Partícula', options: Object.entries(MASSES).map(([k, v]) => [k, `${v[0]} (${EM.sci(v[1], 3)} kg)`]), value: 'e' });
    sim.slider('s0', { label: 'Anchura inicial σ₀ (incertidumbre en la posición)', min: 0.01, max: 1e6, step: 0.001, value: 0.1, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 3) });
    sim.slider('t', { label: 'Tiempo transcurrido en unidades de t_s = 2mσ₀²/ħ', min: 0, max: 20, step: 0.01, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.out('ts', 'Tiempo de expansión t_s = 2mσ₀²/ħ', { hl: true });
    sim.out('sg', 'σ(t) · σ(t)/σ₀ = √(1 + (t/t_s)²)');
    sim.out('dp', 'Δp = ħ/(2σ₀) (constante) · dispersión de velocidad Δv = Δp/m');
    sim.out('pr', 'Producto ΔxΔp en unidades de ħ/2 = √(1 + (t/t_s)²)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, m = MASSES[p.m][1], s0 = p.s0 * 1e-9, ts = T.spreadTime(s0, m), t = p.t * ts, sg = T.sigma(t, s0, m);
      EM.draw.clear(cv);
      const xm = 5 * T.sigma(20 * ts, s0, m) / s0 * 0.35 + 5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: -xm, xmax: xm, ymin: 0, ymax: 0.45, xlabel: 'x / σ₀', ylabel: 'densidad de probabilidad × σ₀', ml: 52, mr: 8, title: 'Paquete en el instante t' });
      pl.frame();
      pl.fn((x) => Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI), { color: '--c2', width: 1.8, dash: [6, 4], n: 400 });
      const s = sg / s0; pl.fn((x) => Math.exp(-(x * x) / (2 * s * s)) / (Math.sqrt(2 * Math.PI) * s), { color: '--accent', width: 3, n: 600, fill: '--accent', fillAlpha: 0.14 });
      pl.legend([{ label: 't = 0', color: '--c2', dash: [6, 4] }, { label: 'instante t', color: '--accent' }], 'tr');
      const pr = new EM.Plot(ctx, { x: W * 0.64, y: 0, w: W * 0.36, h: H, xmin: 0, xmax: 20, ymin: 0.5, ymax: 25, ymin: 0.9, ylog: true, ymax: 25, xlabel: 't / t_s', ylabel: 'σ(t)/σ₀ = ΔxΔp/(ħ/2)', ml: 46, mr: 8, title: 'Crecimiento' });
      pr.frame(); pr.fn((x) => Math.sqrt(1 + x * x), { color: '--accent', width: 3, n: 300 }); pr.dot(p.t, Math.sqrt(1 + p.t * p.t), { color: '--c3', r: 5.5 });
      const dp = T.dp(s0);
      sim.set('ts', ts > 3.15e7 ? `${EM.sci(ts, 3)} s (${EM.sci(ts / 3.15576e7, 3)} años)` : `${EM.sci(ts, 3)} s`);
      sim.set('sg', `${EM.sci(sg, 4)} m · ${EM.fix(sg / s0, 4)}`);
      sim.set('dp', `${EM.sci(dp, 4)} kg·m/s · ${EM.sci(dp / m, 4)} m/s`);
      sim.set('pr', EM.fix(sg / s0, 4));
    });
  });

  /* 9.4 Estimación del estado fundamental del hidrógeno con la incertidumbre */
  EM.defineSim('hestimado', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('r', { label: 'Radio de confinamiento del electrón r', min: 5, max: 400, step: 1, value: 100, unit: 'pm', fmt: (v) => v.toFixed(0) });
    sim.out('K', 'Energía cinética mínima K ≈ ħ²/(2mr²) (con Δp ≈ ħ/r)', { hl: true });
    sim.out('U', 'Energía potencial U = −e²/(4πε₀r)');
    sim.out('E', 'Energía total E(r) · mínimo: E = −13.606 eV en r = a₀ = 52.918 pm');
    sim.out('n', 'Si el electrón se confinara al tamaño de un núcleo (5 fm): pc ≈ ħc/r · K');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, r = p.r * 1e-12, eV = K.e, min = T.hEstimateMin();
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.64, h: H, xmin: 5, xmax: 400, ymin: -40, ymax: 60, xlabel: 'r (pm)', ylabel: 'energía (eV)', ml: 52, mr: 8, title: 'Energía frente al radio de confinamiento' });
      pl.frame(); pl.hline(0, { color: '--ink-2', dash: [] });
      const kin = (rr) => (hbar * hbar) / (2 * K.me * (rr * 1e-12) ** 2) / eV, pot = (rr) => -((eV * eV) / (4 * Math.PI * K.eps0 * (rr * 1e-12))) / eV;
      pl.fn(kin, { color: '--c3', width: 2, n: 300 }); pl.fn(pot, { color: '--c1', width: 2, n: 300 }); pl.fn((rr) => kin(rr) + pot(rr), { color: '--accent', width: 3, n: 300 });
      pl.dot(min.r * 1e12, min.E / eV, { color: '--accent', r: 5.5, label: 'mínimo', dx: 8, dy: 14 }); pl.dot(p.r, kin(p.r) + pot(p.r), { color: '--c2', r: 5 });
      pl.legend([{ label: 'cinética ħ²/2mr²', color: '--c3' }, { label: 'potencial −e²/4πε₀r', color: '--c1' }, { label: 'total', color: '--accent' }], 'tr');
      const rn = 5e-15, pcn = (K.hbar * c) / rn / eV / 1e6;
      sim.set('K', `${EM.fix(kin(p.r), 3)} eV`);
      sim.set('U', `${EM.fix(pot(p.r), 3)} eV`);
      sim.set('E', `${EM.fix(kin(p.r) + pot(p.r), 3)} eV · mínimo ${EM.fix(min.E / eV, 4)} eV en ${EM.fix(min.r * 1e12, 3)} pm`);
      sim.set('n', `${EM.fix(pcn, 1)} MeV · K ≈ ${EM.fix(pcn - K.me * c * c / eV / 1e6, 1)} MeV`);
    });
  });
})();
"""
open(r'C:\Users\User\Documents\Claude\ConCode\moderna\src\chapters\09-materia.js', 'w', encoding='utf-8').write(head + blk + new)
print('ok')
