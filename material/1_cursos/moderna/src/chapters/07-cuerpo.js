/* Capítulo 7 — Cuerpo negro y el cuanto de Planck */
(function () {
  'use strict';
  const EM = window.EM, O = EM.qm.orig, B = EM.fm.bb, K = EM.qm.K, c = K.c, h = K.h, kB = K.kB;
  const HC = K.hc_eVnm;

  /* 1.1 Radiación del cuerpo negro: Planck, Rayleigh–Jeans y Wien */
  EM.defineSim('planck', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura T', min: 200, max: 12000, step: 1, value: 5772, log: true, unit: 'K', fmt: (v) => EM.sci(v, 3) });
    sim.check('log', { label: 'Ejes logarítmicos (ver la caída de Rayleigh–Jeans y la de Wien)', value: false });
    sim.out('pk', 'Máximo λ<sub>máx</sub> = <i>b</i>/<i>T</i> (ley de Wien) · energía del fotón en el máximo', { hl: true });
    sim.out('M', 'Emitancia total σ<i>T</i>⁴ (Stefan–Boltzmann)');
    sim.out('vis', 'Fracción de la emitancia en el visible (380–780 nm)');
    sim.out('rj', 'Rayleigh–Jeans / Planck a 400 nm · a 4 µm (la «catástrofe ultravioleta»)');
    sim.onDraw(() => {
      const p = sim.p, T = p.T, ctx = cv.ctx;
      EM.draw.clear(cv);
      const M = (l) => O.exitance(l * 1e-6, T) * 1e-6; /* W/(m²·µm) */
      const lpk = O.wienPeak(T) * 1e6, Mpk = M(lpk), lg = p.log;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.1, xmax: 30, xlog: true, ylog: lg, ymin: lg ? Mpk * 1e-9 : 0, ymax: lg ? Mpk * 6 : Mpk * 1.25, xlabel: 'longitud de onda λ (µm)', ylabel: 'emitancia espectral M_λ (W·m⁻²·µm⁻¹)', ml: 84 });
      pl.frame();
      const vis = [0.38, 0.78];
      for (let l = vis[0]; l < vis[1]; l += 0.01) { const [r, g, b] = EM.wavelengthRGB(l * 1000); pl.band(l, l + 0.0101, { color: `rgb(${r},${g},${b})`, alpha: 0.28 }); }
      pl.fn((l) => O.rayleighJeans(l * 1e-6, T) * Math.PI * 1e-6, { color: '--c2', width: 1.8, dash: [6, 4], n: 400 });
      pl.fn((l) => O.wienLaw(l * 1e-6, T) * Math.PI * 1e-6, { color: '--c3', width: 1.8, dash: [2, 4], n: 400 });
      pl.fn(M, { color: '--accent', width: 3, n: 500 });
      pl.vline(lpk, { color: '--accent', label: 'λmáx', dash: [3, 3] });
      pl.legend([{ label: 'Planck', color: '--accent' }, { label: 'Rayleigh–Jeans (clásica)', color: '--c2', dash: [6, 4] }, { label: 'Wien (frecuencias altas)', color: '--c3', dash: [2, 4] }], 'tr');
      const lpkNm = lpk * 1000, Ep = HC / lpkNm;
      sim.set('pk', `${lpk < 1 ? EM.fix(lpkNm, 0) + ' nm' : EM.fix(lpk, 2) + ' µm'} · ${EM.fix(Ep, 3)} eV`);
      sim.set('M', `${EM.sci(O.stefanBoltzmann(T), 3)} W/m²`);
      sim.set('vis', `${EM.fix(100 * O.bandFraction(380e-9, 780e-9, T), 2)} %`);
      const r = (l) => O.rayleighJeans(l * 1e-6, T) / O.planckLambda(l * 1e-6, T);
      sim.set('rj', `${EM.sci(r(0.4), 3)} · ${EM.sci(r(4), 3)}`);
    });
  });


  /* 7.2 Estrellas como cuerpos negros: color, luminosidad y diagrama de Hertzsprung–Russell */
  const STARS = { sun: ['Sol', 5772, 1], sirA: ['Sirio A', 9940, 1.711], rig: ['Rigel', 12100, 78.9], bet: ['Betelgeuse', 3600, 764], prox: ['Próxima Centauri', 3042, 0.154] };
  EM.defineSim('estrellas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('T', { label: 'Temperatura superficial T', min: 2000, max: 40000, step: 10, value: 5772, log: true, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('R', { label: 'Radio R en radios solares', min: 0.1, max: 1000, step: 0.01, value: 1, log: true, unit: 'R☉', fmt: (v) => EM.sci(v, 3) });
    sim.out('L', 'Luminosidad L = 4πR²σT⁴ en luminosidades solares · en vatios', { hl: true });
    sim.out('lm', 'Longitud de onda del máximo (Wien) · energía del fotón en el máximo');
    sim.out('col', 'Color aparente del cuerpo negro (cromaticidad CIE xy)');
    sim.out('fr', 'Fracción de la emitancia en el visible (380–780 nm)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, Rm = p.R * 6.957e8, L = B.luminosity(Rm, p.T), Ls = 3.828e26;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.58, h: H, xmin: 40000, xmax: 2000, xlog: true, ymin: 1e-4, ymax: 1e7, ylog: true, xlabel: 'temperatura superficial T (K) — decrece hacia la derecha', ylabel: 'luminosidad L/L☉', ml: 56, mr: 8, title: 'Diagrama H–R (valores aproximados de catálogo)' });
      pl.frame();
      /* líneas de radio constante: L/Lsun = (R)^2 (T/5772)^4 */
      for (const rr of [0.01, 0.1, 1, 10, 100, 1000]) { pl.fn((T) => rr * rr * Math.pow(T / 5772, 4), { color: '--ink-3', width: 1, dash: [3, 4], n: 120, alpha: 0.7 }); pl.label(2200, rr * rr * Math.pow(2200 / 5772, 4), `${rr} R☉`, { size: 10, color: '--ink-3', dx: 4, dy: -3 }); }
      for (const [k, [nm, T, R]] of Object.entries(STARS)) pl.dot(T, (R * R * Math.pow(T / 5772, 4)), { color: '--c2', r: 4.5, label: nm, dx: 7, dy: -6 });
      const rgb = B.rgb(p.T);
      pl.dot(p.T, L / Ls, { color: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`, r: 8 });
      /* muestra de color y espectro */
      const sx = W * 0.62, sw = W * 0.35;
      ctx.save(); ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`; ctx.fillRect(sx, 22, sw, H * 0.2); ctx.strokeStyle = EM.col('--rule'); ctx.strokeRect(sx, 22, sw, H * 0.2); ctx.restore();
      const ps = new EM.Plot(ctx, { x: W * 0.6, y: H * 0.3, w: W * 0.4, h: H * 0.7, xmin: 100, xmax: 3000, xlog: true, ymin: 0, ymax: 1.1, xlabel: 'λ (nm)', ylabel: 'B_λ normalizada', ml: 40, mr: 8, mt: 8, mb: 36 });
      ps.frame(); const pk = O.planckLambda(O.wienPeak(p.T), p.T);
      for (let l = 380; l < 780; l += 6) { const [r, g, b] = EM.wavelengthRGB(l); ps.band(l, l + 6.1, { color: `rgb(${r},${g},${b})`, alpha: 0.35 }); }
      ps.fn((l) => O.planckLambda(l * 1e-9, p.T) / pk, { color: '--accent', width: 2.6, n: 300 });
      const lm = O.wienPeak(p.T) * 1e9, xy = B.xy(p.T);
      sim.set('L', `${EM.sci(L / Ls, 4)} L☉ · ${EM.sci(L, 4)} W`);
      sim.set('lm', `${EM.fix(lm, 1)} nm · ${EM.fix(HC / lm, 3)} eV`);
      sim.set('col', `x = ${EM.fix(xy[0], 4)}, y = ${EM.fix(xy[1], 4)}`);
      sim.set('fr', `${EM.fix(100 * O.bandFraction(380e-9, 780e-9, p.T), 2)} %`);
    });
  });

  /* 7.3 El fondo cósmico de microondas */
  EM.defineSim('cmb', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('T', { label: 'Temperatura del cuerpo negro T', min: 1, max: 12, step: 0.0005, value: 2.7255, unit: 'K', fmt: (v) => EM.fix(v, 4) });
    sim.out('nu', 'Máximo en frecuencia ν_máx = 58.789 GHz/K · T · y en longitud de onda λ_máx = b/T', { hl: true });
    sim.out('n', 'Fotones por cm³ · energía media por fotón');
    sim.out('u', 'Densidad de energía aT⁴ · presión aT⁴/3');
    sim.out('dip', 'Dipolo por el movimiento a 369.8 km/s: T₀β');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, T = p.T, MJ = 1e-20; /* 1 MJy = 10⁻²⁰ W m⁻² Hz⁻¹ */
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 5, xmax: 1000, xlog: true, ymin: 0, ymax: 420, xlabel: 'frecuencia ν (GHz)', ylabel: 'radiancia B_ν (MJy/sr)', ml: 52, mr: 8, title: 'Espectro de Planck' });
      pl.frame();
      pl.fn((g) => B.planckNu(g * 1e9, 2.7255) / MJ, { color: '--c2', width: 1.8, dash: [6, 4], n: 400 });
      pl.fn((g) => B.planckNu(g * 1e9, T) / MJ, { color: '--accent', width: 3, n: 400 });
      pl.fn((g) => (2 * kB * T * (g * 1e9) ** 2) / (c * c) / MJ, { color: '--c3', width: 1.4, dash: [2, 4], n: 200, to: 150 });
      pl.vline(B.nuPeak(T) / 1e9, { color: '--accent', label: 'ν_máx', dash: [3, 3] });
      pl.legend([{ label: 'T elegida', color: '--accent' }, { label: 'T = 2.7255 K (FIRAS)', color: '--c2', dash: [6, 4] }, { label: 'Rayleigh–Jeans', color: '--c3', dash: [2, 4] }], 'tl');
      /* Derecha: energía media por modo frente a hν/kT */
      const pr = new EM.Plot(ctx, { x: W * 0.63, y: 0, w: W * 0.37, h: H, xmin: 0.01, xmax: 20, xlog: true, ymin: 0, ymax: 1.1, xlabel: 'hν / kT', ylabel: '⟨E⟩ / kT', ml: 44, mr: 8, title: 'Energía por modo' });
      pr.frame(); pr.hline(1, { color: '--c3', label: 'equipartición', dash: [4, 3] });
      pr.fn((x) => x / Math.expm1(x), { color: '--accent', width: 3, n: 300 });
      const lam = K.b_wien / T;
      sim.set('nu', `${EM.fix(B.nuPeak(T) / 1e9, 3)} GHz · ${EM.fix(lam * 1e3, 4)} mm`);
      sim.set('n', `${EM.fix(B.photonDensity(T) / 1e6, 2)} cm⁻³ · ${EM.sci(B.meanPhotonEnergy(T) / K.e, 4)} eV`);
      sim.set('u', `${EM.sci(B.energyDensity(T) / K.e / 1e6, 4)} eV/cm³ (${EM.sci(B.energyDensity(T), 4)} J/m³) · ${EM.sci(B.pressure(T), 3)} Pa`);
      sim.set('dip', `${EM.fix(T * 369.82e3 / c * 1e3, 3)} mK`);
    });
  });
})();
