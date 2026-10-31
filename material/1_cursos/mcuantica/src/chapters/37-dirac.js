/* Capítulo 37 — La ecuación de Dirac */
(function () {
  'use strict';
  const EM = window.EM, D = EM.qm.dir, PI = Math.PI;
  const MEC2 = 510998.95; /* eV */

  /* 37.1 Zitterbewegung de un paquete de Dirac */
  EM.defineSim('zitterbewegung', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('sg', { label: 'Anchura σ del paquete (en 1/m = longitud de Compton reducida)', min: 0.2, max: 4, step: 0.1, value: 1, fmt: (v) => EM.fix(v, 1) });
    sim.slider('p0', { label: 'Momento medio p₀ (en mc)', min: 0, max: 3, step: 0.1, value: 0, fmt: (v) => EM.fix(v, 1) });
    sim.slider('ch', { label: 'Mezcla de espinor: (cos χ, sen χ)', min: 0, max: 90, step: 1, value: 45, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('t', { label: 'Instante t del perfil de densidad (en 1/mc²)', min: 0, max: 12, step: 0.1, value: 3, fmt: (v) => EM.fix(v, 1) });
    sim.out('w', 'Peso de energía negativa del paquete inicial · frecuencia de la oscilación 2E₀ y periodo π/E₀ (E₀ = √(m² + p₀²))', { hl: true });
    sim.out('x', 'Desplazamiento ⟨x⟩ en el intervalo 0 ≤ t ≤ 12: mínimo, máximo (el temblor tiene amplitud ≲ ħ/2mc = 0.5)');
    sim.out('n', 'Norma conservada · velocidad ⟨σ_x⟩ = d⟨x⟩/dt en el instante t (teorema de Ehrenfest)');
    const N = 512, Lg = 80, m = 1;
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, sg = sim.p.sg, p0 = sim.p.p0, chi = M_rad(sim.p.ch), t0 = sim.p.t;
      EM.draw.clear(cv);
      const ps = D.gauss1D(N, Lg, sg, p0, chi), ts = Array.from({ length: 121 }, (_, i) => 0.1 * i), xs = [], vs = [];
      for (const t of ts) { const st = D.stats1D(D.evolve1D(ps.ar, ps.ai, ps.br, ps.bi, Lg, m, t), Lg, m); xs.push(st.x); vs.push(st.sigmax); }
      const lo = Math.min(...xs, ...vs, -0.1), hi = Math.max(...xs, ...vs, 0.1), pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 12, ymin: lo - 0.1 * (hi - lo), ymax: hi + 0.1 * (hi - lo), xlabel: 't', ylabel: '⟨x⟩ (1/m) y ⟨σ_x⟩', ml: 50, mr: 8, title: 'Zitterbewegung: ⟨x⟩(t) y velocidad' });
      pl.frame(); pl.hline(0, { color: '--axis' }); pl.xy(ts, xs, { color: '--accent', width: 2.2 }); pl.xy(ts, vs, { color: '--c2', width: 1.2 }); pl.legend([{ label: '⟨x⟩', color: '--accent' }, { label: '⟨σ_x⟩ = d⟨x⟩/dt', color: '--c2' }], 'br'); pl.vline(t0, { color: '--c3', dash: [4, 3] });
      const s = D.evolve1D(ps.ar, ps.ai, ps.br, ps.bi, Lg, m, t0), st = D.stats1D(s, Lg, m), xx = D.x1d(N, Lg), da = [], db = [], dt = [];
      let xc = st.x; const span = 10 + 6 * sg; for (let j = 0; j < N; j++) if (Math.abs(xx[j] - xc) < span) { const pa = s.ar[j] ** 2 + s.ai[j] ** 2, pb = s.br[j] ** 2 + s.bi[j] ** 2; da.push([xx[j], pa]); db.push([xx[j], pb]); dt.push([xx[j], pa + pb]); }
      const q = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: xc - span, xmax: xc + span, ymin: 0, ymax: Math.max(...dt.map((d) => d[1])) * 1.15, xlabel: 'x', ylabel: 'densidad', ml: 46, mr: 8, title: `Perfil en t = ${EM.fix(t0, 1)}` });
      q.frame(); q.path(dt, { color: '--ink', width: 2 }); q.path(da, { color: '--accent', width: 1.4 }); q.path(db, { color: '--c2', width: 1.4 }); q.legend([{ label: '|a|² + |b|²', color: '--ink' }, { label: '|a|² (superior)', color: '--accent' }, { label: '|b|² (inferior)', color: '--c2' }], 'tr');
      const E0 = Math.sqrt(m * m + p0 * p0), i0 = Math.round(t0 / 0.1), vv = vs[Math.min(i0, 120)];
      sim.set('w', `${EM.fix(D.stats1D(ps, Lg, m).wneg * 100, 2)} % · 2E₀ = ${EM.fix(2 * E0, 4)} · π/E₀ = ${EM.fix(PI / E0, 4)}`);
      sim.set('x', `${EM.fix(Math.min(...xs), 4)} · ${EM.fix(Math.max(...xs), 4)}`);
      sim.set('n', `${EM.fix(st.norm, 6)} · ⟨σ_x⟩ = ${EM.fix(vv, 4)}`);
    });
    function M_rad(d) { return (d * PI) / 180; }
  });

  /* 37.2 La paradoja de Klein */
  EM.defineSim('klein', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('E', { label: 'Energía de la partícula incidente E (en mc²)', min: 1.05, max: 6, step: 0.05, value: 2, fmt: (v) => EM.fix(v, 2) });
    sim.slider('V', { label: 'Altura del escalón V₀ (en mc²)', min: 0, max: 14, step: 0.05, value: 5, fmt: (v) => EM.fix(v, 2) });
    sim.out('r', 'Régimen · momento incidente p y transmitido q · r = k(E+m)/[p(E−V₀+m)]', { hl: true });
    sim.out('t', 'Reflectancia R = ((1−r)/(1+r))² · transmitancia T = 4r/(1+r)² (flujo de probabilidad) · R + T');
    sim.out('k', 'Límite V₀ → ∞ (transmisión de Klein): T∞ = 4p(E+m)/(p+E+m)² · la teoría no relativista daría T → 0 (efecto túnel suprimido)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, E = sim.p.E, V0 = sim.p.V, k = D.klein(E, V0, 1);
      EM.draw.clear(cv);
      const vs = Array.from({ length: 561 }, (_, i) => 0.025 * i), Ts = vs.map((v) => D.klein(E, v, 1).T), Rs = vs.map((v) => D.klein(E, v, 1).R);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: 14, ymin: 0, ymax: 1.05, xlabel: 'V₀ (mc²)', ylabel: 'T, R', ml: 46, mr: 8, title: `Escalón de Dirac, E = ${EM.fix(E, 2)} mc²` });
      pl.frame(); pl.band(E - 1, E + 1, { color: '--c3', alpha: 0.12 }); pl.xy(vs, Ts, { color: '--accent', width: 2.4 }); pl.xy(vs, Rs, { color: '--c2', width: 1.8, dash: [5, 3] }); pl.vline(V0, { color: '--ink-3', dash: [3, 3] }); pl.hline(D.kleinInfinite(E), { color: '--accent', dash: [2, 4] });
      pl.legend([{ label: 'T', color: '--accent' }, { label: 'R', color: '--c2', dash: [5, 3] }], 'tr');
      pl.label(E - 0.9, 0.5, 'prohibido (E−m<V₀<E+m)', { color: '--c3', size: 10 });
      /* esquema de los niveles */
      const bx = W * 0.66, bw = W * 0.32, by = 30, bh = H - 60, y = (e) => by + bh * (1 - (e + 6) / 22);
      ctx.save(); ctx.strokeStyle = EM.col('--axis'); ctx.lineWidth = 1;
      ctx.fillStyle = EM.alpha('--ink-3', 0.12); ctx.fillRect(bx, y(1), bw / 2, y(-1) - y(1)); ctx.fillRect(bx + bw / 2, y(V0 + 1), bw / 2, y(V0 - 1) - y(V0 + 1));
      ctx.fillStyle = EM.alpha('--c2', 0.18); ctx.fillRect(bx, y(-1), bw / 2, by + bh - y(-1)); ctx.fillRect(bx + bw / 2, y(V0 - 1), bw / 2, by + bh - y(V0 - 1));
      ctx.fillStyle = EM.alpha('--accent', 0.18); ctx.fillRect(bx, by, bw / 2, y(1) - by); ctx.fillRect(bx + bw / 2, by, bw / 2, y(V0 + 1) - by);
      ctx.strokeStyle = EM.col('--c3'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, y(E)); ctx.lineTo(bx + bw, y(E)); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'continuo de energía positiva', bx + bw / 4, y(5), { size: 10, align: 'center', color: '--ink-2' }); EM.text(ctx, 'continuo negativo', bx + bw / 4, y(-4), { size: 10, align: 'center', color: '--ink-2' }); EM.text(ctx, 'E', bx + bw + 2, y(E) + 4, { size: 11, color: '--c3', align: 'right' });
      EM.text(ctx, 'x < 0', bx + bw / 4, by - 10, { size: 11, align: 'center', color: '--ink-2' }); EM.text(ctx, 'x > 0', bx + (3 * bw) / 4, by - 10, { size: 11, align: 'center', color: '--ink-2' });
      sim.set('r', k.regime === 'evanescente' ? `evanescente (|E − V₀| < m): p = ${EM.fix(k.p, 4)} · onda decreciente en x > 0, reflexión total` : `${k.regime === 'Klein' ? 'túnel de Klein (E − V₀ < −m)' : 'transmisión normal'} · p = ${EM.fix(k.p, 4)} · q = ${EM.fix(k.q, 4)} · r = ${EM.fix(k.r, 4)}`);
      sim.set('t', `R = ${EM.fix(k.R, 5)} · T = ${EM.fix(k.T, 5)} · R + T = ${EM.fix(k.R + k.T, 5)}`);
      sim.set('k', `T∞ = ${EM.fix(D.kleinInfinite(E), 5)}`);
    });
  });

  /* 37.3 El átomo hidrogenoide de Dirac */
  EM.defineSim('dirac-hidrogeno', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('Z', { label: 'Número atómico Z (núcleo puntual)', min: 1, max: 137, step: 1, value: 92, fmt: (v) => v.toFixed(0) });
    sim.out('e', 'Energía de ligadura del 1s½ (keV): Dirac · no relativista Z²α²mc²/2 · cociente', { hl: true });
    sim.out('f', 'Desdoblamiento fino 2p₃/₂ − 2p₁/₂ (eV): Dirac exacto · fórmula α⁴ · degeneración 2s½ = 2p½ (diferencia: 0 exacta)');
    sim.out('c', 'Colapso del 1s: E = mc²√(1 − (Zα)²) → 0 en Zα = 1 (Z = 137.04); con núcleo extenso llega a −mc² en Z ≈ 173 (supercrítico: creación de pares)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, Z = Math.round(sim.p.Z), a = D.fineStructure, zs = Array.from({ length: 137 }, (_, i) => i + 1);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.58, h: H, xmin: 1, xmax: 137, ymin: 0, ymax: 1.02, xlabel: 'Z', ylabel: 'E / mc²', ml: 46, mr: 8, title: 'Niveles de Dirac: energía total' });
      pl.frame(); pl.xy(zs, zs.map((z) => 1 - 0.5 * (z * a) ** 2), { color: '--ink-3', width: 1.4, dash: [4, 3] });
      pl.xy(zs, zs.map((z) => D.hydrogenic(1, 0.5, z)), { color: '--accent', width: 2.4 }); pl.xy(zs, zs.map((z) => D.hydrogenic(2, 0.5, z)), { color: '--c2', width: 2 }); pl.xy(zs, zs.map((z) => D.hydrogenic(2, 1.5, z)), { color: '--c3', width: 2 });
      pl.vline(Z, { color: '--ink-3', dash: [3, 3] }); pl.legend([{ label: '1s½', color: '--accent' }, { label: '2s½ = 2p½', color: '--c2' }, { label: '2p₃/₂', color: '--c3' }, { label: '1 − (Zα)²/2', color: '--ink-3', dash: [4, 3] }], 'bl');
      const rel = zs.map((z) => (1 - D.hydrogenic(1, 0.5, z)) / (0.5 * (z * a) ** 2)), q = new EM.Plot(ctx, { x: W * 0.6, y: 0, w: W * 0.4, h: H, xmin: 1, xmax: 137, ymin: 0.9, ymax: Math.max(...rel) * 1.05, xlabel: 'Z', ylabel: 'ligadura Dirac / no relativista', ml: 46, mr: 8, title: 'Corrección relativista' });
      q.frame(); q.xy(zs, rel, { color: '--accent', width: 2.2 }); q.vline(Z, { color: '--ink-3', dash: [3, 3] }); q.hline(1, { color: '--axis' });
      const B = (1 - D.hydrogenic(1, 0.5, Z)) * MEC2 / 1000, Bn = 0.5 * (Z * a) ** 2 * MEC2 / 1000, fsx = (D.hydrogenic(2, 1.5, Z) - D.hydrogenic(2, 0.5, Z)) * MEC2, fa = (Z ** 4 * a ** 4 / 32) * MEC2;
      sim.set('e', `${EM.fix(B, 5)} · ${EM.fix(Bn, 5)} · ${EM.fix(B / Bn, 5)}`);
      sim.set('f', `${EM.fix(fsx, 5)} eV · ${EM.fix(fa, 5)} eV (Z⁴α⁴mc²/32) · diferencia ${EM.fix(D.hydrogenic(2, 0.5, Z) - D.hydrogenic(2, 0.5, Z), 1)}`);
      sim.set('c', `E_1s = ${EM.fix(D.groundCritical(Z), 5)} mc² (Zα = ${EM.fix(Z * a, 4)})`);
    });
  });
})();
