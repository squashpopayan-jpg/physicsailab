/* Capítulo 15 — Momento angular, espín y estructura fina */
(function () {
  'use strict';
  const EM = window.EM, S = EM.fm.spin, K = EM.qm.K, e = K.e, h = K.h, kB = K.kB, muB = S.muB;
  const GAMMA = { p: ['Protón (¹H)', 42.577478518], n: ['Neutrón', 29.1646931], e: ['Electrón', 28024.9514242] };    /* γ/2π en MHz/T (CODATA 2018) */

  /* 15.1 Experimento de Stern–Gerlach */
  EM.defineSim('sterngerlach', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('mode', { label: 'Modelo', options: [['q', 'Cuántico (espín ½)'], ['c', 'Clásico (momento orientable)'], ['s1', 'Hipotético: espín 1']], value: 'q' });
    sim.slider('g', { label: 'Gradiente del campo magnético dB/dz', min: 100, max: 3000, step: 10, value: 1000, unit: 'T/m', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura del horno de plata', min: 600, max: 2000, step: 10, value: 1200, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('v', 'Velocidad media del haz v̄ · aceleración a = μ_B (dB/dz)/m', { hl: true });
    sim.out('z', 'Desviación de las componentes ±μ_B (imán de 3.5 cm, 1 cm hasta la pantalla): ±z');
    sim.out('n', 'Átomos detectados');
    const m = 107.8682 * K.u, LM = 0.035, DD = 0.01; let hist = new Float64Array(120), total = 0;
    const zmax = 0.8e-3;
    const reset = () => { hist = new Float64Array(120); total = 0; };
    const gauss = () => { let s = 0; for (let i = 0; i < 12; i++) s += Math.random(); return s - 6; };
    const shoot = () => {
      const T = sim.p.T, g = sim.p.g; const u = -Math.log(Math.random()) - Math.log(Math.random()), v2 = u * (2 * kB * T) / m;  /* v² ~ Gamma(2, 2kT/m) (flujo del haz) */
      let mu; if (sim.p.mode === 'q') mu = Math.random() < 0.5 ? muB : -muB; else if (sim.p.mode === 'c') mu = muB * (2 * Math.random() - 1); else { const r = Math.random(); mu = r < 1 / 3 ? -muB : r < 2 / 3 ? 0 : muB; }
      const z = ((mu * g) / m) * ((LM * LM) / (2 * v2) + (LM * DD) / v2) + 6e-6 * gauss();
      const k = Math.floor(((z + zmax) / (2 * zmax)) * 120); if (k >= 0 && k < 120) { hist[k]++; total++; }
    };
    sim.resetButton(reset); sim.onChange = () => reset();
    sim.animate(() => { for (let i = 0; i < 120; i++) shoot(); });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, v = S.vMeanBeam(p.T, m), a = (muB * p.g) / m, zq = S.sgDeflection(muB, p.g, m, v, LM, DD);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: -zmax * 1e3, xmax: zmax * 1e3, ymin: 0, ymax: 1.1, xlabel: 'posición en la pantalla z (mm)', ylabel: 'impactos (relativos)', ml: 50, mr: 8, title: 'Impactos de átomos de plata en la pantalla' });
      pl.frame();
      let cm = 1; for (let k = 0; k < 120; k++) cm = Math.max(cm, hist[k]);
      ctx.save(); ctx.fillStyle = EM.alpha('--c1', 0.6); for (let k = 0; k < 120; k++) { const x0 = pl.X(-zmax * 1e3 + (k * 2 * zmax * 1e3) / 120), x1 = pl.X(-zmax * 1e3 + ((k + 1) * 2 * zmax * 1e3) / 120), hh = (hist[k] / cm) * (pl.Y(0) - pl.Y(1)); ctx.fillRect(x0, pl.Y(0) - hh, Math.max(1, x1 - x0 - 0.5), hh); } ctx.restore();
      if (p.mode !== 'c') { pl.vline(zq * 1e3, { color: '--c3', dash: [3, 3] }); pl.vline(-zq * 1e3, { color: '--c3', dash: [3, 3] }); if (p.mode === 's1') pl.vline(0, { color: '--c3', dash: [3, 3] }); }
      /* esquema */
      const cx = W * 0.8, cy = H * 0.5;
      EM.text(ctx, 'Imán con gradiente (esquema)', cx, 16, { size: 12, align: 'center', color: '--ink-2' });
      ctx.save(); ctx.fillStyle = EM.alpha('--c3', 0.4); ctx.strokeStyle = EM.col('--c3'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 50, cy - 28); ctx.lineTo(cx + 10, cy - 14); ctx.lineTo(cx + 10, cy - 70); ctx.lineTo(cx - 50, cy - 70); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - 50, cy + 28); ctx.lineTo(cx + 10, cy + 40); ctx.lineTo(cx + 10, cy + 96); ctx.lineTo(cx - 50, cy + 96); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      EM.draw.arrow(ctx, cx - 88, cy + 6, cx - 52, cy + 6, { color: '--ink', width: 2.4, head: 8 });
      const ends = p.mode === 'q' ? [-1, 1] : p.mode === 's1' ? [-1, 0, 1] : [-1, -0.5, 0, 0.5, 1];
      ends.forEach((s) => { ctx.save(); ctx.strokeStyle = EM.alpha('--accent', 0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 52, cy + 6); ctx.lineTo(cx + 78, cy + 6 - s * 52); ctx.stroke(); ctx.restore(); });
      sim.set('v', `${EM.fix(v, 1)} m/s · ${EM.sci(a, 4)} m/s²`);
      sim.set('z', `±${EM.fix(zq * 1e3, 4)} mm (separación ${EM.fix(2 * zq * 1e3, 4)} mm)`);
      sim.set('n', `${total}`);
    });
  });

  /* 15.2 Efecto Zeeman de un estado p: del régimen débil a Paschen–Back */
  const ATOM = { Na: ['Sodio 3p (ΔE_fs = 2.132 meV)', (2 / 3) * 2.132032e-3 * e, 30], H: ['Hidrógeno 2p (ΔE_fs = 0.0453 meV)', (2 / 3) * 4.52826e-5 * e, 1.5] };
  EM.defineSim('zeeman', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('at', { label: 'Átomo', options: Object.entries(ATOM).map(([k, v]) => [k, v[0]]), value: 'Na' });
    sim.slider('B', { label: 'Campo magnético B', min: 0, max: 60, step: 0.05, value: 5, unit: 'T', fmt: (v) => EM.fix(v, 2) });
    sim.out('g', 'Factores de Landé: ²S½: 2 · ²P½: 2/3 · ²P3/2: 4/3 (régimen débil: E = g_J m_J μ_B B)', { hl: true });
    sim.out('r', 'Campo de cruce B* = A/μ_B (μ_B B = A) · régimen en el campo elegido');
    sim.out('E', 'Energías de los seis niveles en el campo elegido (meV, relativas al baricentro)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, A] = ATOM[p.at], Bx = Math.max(60 * (p.at === 'H' ? 0.1 : 1), 6), Bstar = A / muB;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.68, h: H, xmin: 0, xmax: Bx, ymin: -(2 * muB * Bx + A) / e * 1e3 * 1.05, ymax: (2 * muB * Bx + A) / e * 1e3 * 1.05, xlabel: 'campo magnético B (T)', ylabel: 'energía (meV)', ml: 56, mr: 8, title: 'Estado p con espín–órbita en campo magnético' });
      pl.frame();
      const pal = { '1.5': '--c1', '0.5': '--c2', '-0.5': '--c3', '-1.5': '--c4' }, N = 160; const cur = [[], [], [], [], [], []], xs = [];
      for (let i = 0; i <= N; i++) { const B = (Bx * i) / N, lv = S.pLevels(A, B); xs.push(B); lv.forEach((q, k) => cur[k].push((q.E - 0) / e * 1e3)); }
      const lv0 = S.pLevels(A, p.B), cols = ['--c4', '--c3', '--c3', '--c2', '--c2', '--c1'];
      cur.forEach((ys, k) => pl.xy(xs, ys, { color: cols[k], width: 2.3 }));
      pl.vline(Bstar, { color: '--ink-3', label: 'B* = A/μ_B', dash: [3, 3] }); pl.vline(p.B, { color: '--accent', dash: [] });
      lv0.forEach((q) => pl.dot(p.B, q.E / e * 1e3, { color: '--accent', r: 3.5 }));
      const regime = p.B < 0.2 * Bstar ? 'Zeeman débil (anómalo): los niveles se clasifican por J y m_J' : p.B > 5 * Bstar ? 'Paschen–Back: se clasifican por m_l y m_s (E ≈ μ_B B(m_l + 2m_s))' : 'régimen intermedio: ni J ni m_l, m_s son buenos números cuánticos';
      sim.set('g', `${S.landeG(0.5, 0, 0.5)} · ${EM.fix(S.landeG(0.5, 1, 0.5), 4)} · ${EM.fix(S.landeG(1.5, 1, 0.5), 4)}`);
      sim.set('r', `${EM.fix(Bstar, 3)} T · ${regime}`);
      sim.set('E', lv0.map((q) => EM.fix((q.E / e) * 1e3, 4)).join(' · '));
    });
  });

  /* 15.3 Resonancia magnética */
  EM.defineSim('rmn', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('B', { label: 'Campo magnético B', min: 0.05, max: 14, step: 0.01, value: 3, log: true, unit: 'T', fmt: (v) => EM.fix(v, 2) });
    sim.slider('T', { label: 'Temperatura de la muestra', min: 4, max: 400, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('p', 'Resonancia del protón ν = γ_pB/2π (RM de imagen) · de los neutrones', { hl: true });
    sim.out('e', 'Resonancia de espín electrónico (ESR) ν = g μ_B B/h');
    sim.out('P', 'Polarización térmica de los protones P = tanh(γħB/2k_BT) · energía de la separación Zeeman');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.64, h: H, xmin: 0.05, xmax: 14, xlog: true, ymin: 1, ymax: 1e6, ylog: true, xlabel: 'campo magnético B (T)', ylabel: 'frecuencia de resonancia (MHz)', ml: 56, mr: 8, title: 'ν = γB/2π' });
      pl.frame();
      const cols = { p: '--c1', n: '--c2', e: '--c3' };
      Object.entries(GAMMA).forEach(([k, [nm, g]]) => pl.fn((B) => g * B, { color: cols[k], width: 2.6, n: 100 }));
      pl.legend(Object.entries(GAMMA).map(([k, [nm]]) => ({ label: nm, color: cols[k] })), 'tl');
      for (const [B, nm] of [[0.5, '0.5 T'], [1.5, '1.5 T'], [3, '3 T'], [7, '7 T']]) pl.vline(B, { color: '--ink-3', dash: [2, 4] });
      pl.vline(p.B, { color: '--accent', dash: [] });
      const P = S.polarization(GAMMA.p[1] * 1e6, p.B, p.T), dE = h * GAMMA.p[1] * 1e6 * p.B / e;
      /* Derecha: poblaciones de los dos niveles de espín */
      const cx = W * 0.82, cy = H * 0.5;
      EM.text(ctx, 'Poblaciones del espín ½', cx, 16, { size: 12, align: 'center', color: '--ink-2' });
      const bw = 48, n1 = (1 - P) / 2, n2 = (1 + P) / 2;
      ctx.save(); ctx.fillStyle = EM.alpha('--c1', 0.5); ctx.fillRect(cx - 60, cy - 110 * n1 * 2 * 0.5 * 1.0 - 4, bw, 110 * n1 * 2 * 0.5 + 4); ctx.fillRect(cx + 12, cy + 80 - 110 * n2 * 2 * 0.5, bw, 110 * n2 * 2 * 0.5); ctx.restore();
      EM.text(ctx, `P = ${EM.sci(P, 3)}`, cx, H - 16, { size: 12, align: 'center', color: '--ink' });
      EM.text(ctx, `ΔE = ${EM.fix(dE * 1e6, 3)} µeV frente a k_BT = ${EM.fix((kB * p.T / e) * 1e3, 3)} meV`, cx, H - 2, { size: 10.5, align: 'center', color: '--ink-3' });
      sim.set('p', `${EM.fix(GAMMA.p[1] * p.B, 4)} MHz · ${EM.fix(GAMMA.n[1] * p.B, 4)} MHz`);
      sim.set('e', `${EM.fix(GAMMA.e[1] * p.B / 1e3, 4)} GHz`);
      sim.set('P', `${EM.sci(P, 4)} (${EM.sci(P * 1e6, 3)} ppm) · ${EM.fix(dE * 1e6, 4)} µeV`);
    });
  });
})();
