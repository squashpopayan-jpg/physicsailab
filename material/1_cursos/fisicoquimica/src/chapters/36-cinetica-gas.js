/* Capítulo 36 — Teoría cinética de los gases y transporte */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, K = FQ.kin2, R = 8.314462618, kB = 1.380649e-23, NA = 6.02214076e23;
  /* viscosidad (µPa·s) y conductividad térmica (mW/m·K) a 1 atm: CoolProp (IAPWS/Lemmon), para la comparación gráfica */
  const CP = { Ar: [[250, 19.48, 15.28], [300, 22.74, 17.84], [400, 28.70, 22.52], [500, 34.08, 26.73], [600, 39.00, 30.57], [800, 47.82, 37.46], [1000, 55.69, 43.58]], N2: [[250, 15.50, 22.25], [300, 17.89, 25.97], [400, 22.21, 32.81], [500, 26.06, 39.04], [600, 29.58, 44.84], [800, 35.89, 55.51], [1000, 41.54, 65.36]], He: [[250, 17.60, 137.5], [300, 19.93, 156.0], [400, 24.29, 190.4], [500, 28.36, 222.3], [600, 32.22, 252.4], [800, 39.43, 308.5], [1000, 46.16, 360.6]], O2: [[250, 17.80, 22.46], [300, 20.65, 26.49], [400, 25.84, 34.03], [500, 30.49, 41.05], [600, 34.73, 47.66], [800, 42.33, 60.02], [1000, 49.12, 71.55]], CO2: [[250, 12.58, 13.05], [300, 15.00, 16.77], [400, 19.64, 24.72], [500, 23.92, 32.88], [600, 27.88, 40.96], [800, 34.94, 56.44], [1000, 41.18, 70.78]], CH4: [[250, 9.62, 27.80], [300, 11.26, 34.40], [400, 14.25, 50.00], [500, 16.98, 68.50], [600, 19.50, 88.94], [800, 24.09, 132.9], [1000, 28.23, 178.4]] };
  const GAS = Object.entries(K.LJ);

  /* 36.1 Distribución de Maxwell–Boltzmann */
  EM.defineSim('maxwell', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('g', { label: 'Gas', options: GAS.map(([k, v]) => [k, v.nm + ' (M = ' + (v.M * 1e3).toFixed(2) + ' g/mol)']), value: 'N2' });
    sim.slider('T', { label: 'Temperatura', min: 50, max: 3000, step: 5, value: 298.15, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('v0', { label: 'Rapidez umbral v₀', min: 50, max: 3000, step: 10, value: 1000, unit: 'm/s', fmt: (v) => v.toFixed(0) });
    sim.out('v', 'Rapidez más probable · media · cuadrática media (m/s)', { hl: true });
    sim.out('f', 'Fracción de moléculas con rapidez > v₀');
    sim.out('e', 'Fracción de colisiones con energía relativa en la línea de centros ≥ E₀ (exp(−E₀/RT)(1 + E₀/RT)): E₀ = 50 kJ/mol · 100 kJ/mol');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, M = K.LJ[p.g].M, vmx = 3 * K.vrms(M, 3000), vs = Array.from({ length: 300 }, (_, i) => (vmx * i) / 299);
      EM.draw.clear(cv);
      const f0 = Math.max(...vs.map((v) => K.fv(v, M, 50))) , pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.min(vmx, 6 * K.vrms(M, p.T)), ymin: 0, ymax: Math.max(...vs.map((v) => K.fv(v, M, p.T))) * 1.15, xlabel: 'rapidez v (m/s)', ylabel: 'f(v) (s/m)', ml: 52 });
      pl.frame(); pl.xy(vs, vs.map((v) => K.fv(v, M, p.T)), { color: '--c1', width: 2.8, fill: '--c1', fillAlpha: 0.12 }); pl.vline(K.vmp(M, p.T), { color: '--c2', dash: [4, 3], label: 'v_mp' }); pl.vline(K.vmean(M, p.T), { color: '--c3', dash: [4, 3], label: 'v̄' }); pl.vline(K.vrms(M, p.T), { color: '--c4', dash: [4, 3], label: 'v_rms' }); pl.vline(p.v0, { color: '--accent' });
      sim.set('v', EM.fix(K.vmp(M, p.T), 0) + ' · ' + EM.fix(K.vmean(M, p.T), 0) + ' · ' + EM.fix(K.vrms(M, p.T), 0));
      sim.set('f', EM.sci(K.fracAbove(p.v0, M, p.T), 3));
      sim.set('e', EM.sci(K.fracEnergy2(50e3, p.T), 3) + ' · ' + EM.sci(K.fracEnergy2(100e3, p.T), 3));
    });
  });

  /* 36.2 Colisiones, camino libre medio y efusión */
  EM.defineSim('colisiones-gas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('g', { label: 'Gas', options: GAS.map(([k, v]) => [k, v.nm]), value: 'N2' });
    sim.slider('P', { label: 'Presión', min: 1e-6, max: 1e8, step: 1e-7, value: 101325, log: true, unit: 'Pa', fmt: (v) => EM.sci(v, 2) });
    sim.slider('T', { label: 'Temperatura', min: 50, max: 2000, step: 5, value: 298.15, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: 'Tamaño del recipiente', min: 1e-6, max: 1, step: 1e-6, value: 0.1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 2) });
    sim.out('l', 'Camino libre medio λ = <i>k</i><sub>B</sub><i>T</i>/(√2π<i>d</i>²<i>P</i>) · diámetro de colisión <i>d</i> = σ de Lennard–Jones', { hl: true });
    sim.out('z', 'Colisiones por molécula por segundo · colisiones por m³ y por segundo');
    sim.out('k', 'Número de Knudsen Kn = λ/<i>L</i> · régimen · flujo sobre una pared (moléculas/m²·s)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, g = K.LJ[p.g], d = g.sigma;
      EM.draw.clear(cv);
      const Ps = Array.from({ length: 200 }, (_, i) => 1e-6 * Math.pow(1e14, i / 199)), pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1e-6, xmax: 1e8, ymin: 1e-9, ymax: 1e3, xlog: true, ylog: true, xlabel: 'presión (Pa)', ylabel: 'camino libre medio λ (m)', ml: 52 });
      pl.frame(); pl.xy(Ps, Ps.map((P) => K.mfp(d, P, p.T)), { color: '--c1', width: 2.8 }); pl.hline(p.L, { color: '--c2', dash: [4, 3], label: 'L del recipiente' }); pl.dot(p.P, K.mfp(d, p.P, p.T), { color: '--accent' });
      const lam = K.mfp(d, p.P, p.T), Kn = lam / p.L;
      sim.set('l', EM.sci(lam, 3) + ' m (' + EM.fix(lam / d, 0) + ' diámetros) · ' + EM.fix(d * 1e10, 2) + ' Å');
      sim.set('z', EM.sci(K.zColl(d, g.M, p.P, p.T), 3) + ' s⁻¹ · ' + EM.sci(K.Zbin(d, g.M, p.P, p.T), 3) + ' m⁻³s⁻¹');
      sim.set('k', EM.sci(Kn, 2) + ' · ' + (Kn < 0.01 ? 'continuo (choques entre moléculas dominan)' : Kn < 0.1 ? 'con deslizamiento' : Kn < 10 ? 'transición' : 'molecular libre (efusión de Knudsen)') + ' · ' + EM.sci(K.wallFlux(g.M, p.P, p.T), 3));
    });
  });

  /* 36.3 Transporte: viscosidad, conductividad térmica y autodifusión */
  EM.defineSim('transporte-gas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('g', { label: 'Gas', options: GAS.map(([k, v]) => [k, v.nm]), value: 'Ar' });
    sim.select('y', { label: 'Propiedad', options: [['eta', 'Viscosidad η (µPa·s)'], ['lam', 'Conductividad térmica λ (mW/m·K)'], ['D', 'Autodifusión D a 1 atm (cm²/s)']], value: 'eta' });
    sim.slider('T', { label: 'Temperatura marcada', min: 200, max: 1200, step: 5, value: 298.15, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('a', 'Chapman–Enskog con el potencial de Lennard–Jones · tabla de CoolProp a esta <i>T</i> (viscosidad)', { hl: true });
    sim.out('b', 'Conductividad térmica: monoatómicos (15/4)(<i>R</i>/<i>M</i>)η · Eucken (<i>c</i><sub>v</sub> + 9<i>R</i>/4)η/<i>M</i> · CoolProp');
    sim.out('c', 'Escala con la presión: η y λ son independientes de <i>P</i> (el camino libre y la densidad se compensan); <i>D</i> ∝ 1/<i>P</i>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, g = K.LJ[p.g], cp = CP[p.g], mono = p.g === 'Ar' || p.g === 'He', cvT = (T) => (mono ? 1.5 * R : FQ.cp(p.g, T) - R);
      EM.draw.clear(cv);
      const eta = (T) => K.eta(g.M, T, g.sigma, g.eps) * 1e6, lam = (T) => (mono ? K.lambdaMono(g.M, K.eta(g.M, T, g.sigma, g.eps)) : K.lambdaEucken(g.M, K.eta(g.M, T, g.sigma, g.eps), cvT(T))) * 1e3, D = (T) => K.Dself(g.M, T, 101325, g.sigma, g.eps) * 1e4;
      const f = p.y === 'eta' ? eta : p.y === 'lam' ? lam : D, idx = p.y === 'eta' ? 1 : 2, Ts = Array.from({ length: 120 }, (_, i) => 200 + (1000 * i) / 119);
      const ys = Ts.map(f), pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 200, xmax: 1200, ymin: 0, ymax: Math.max(...ys, ...(p.y === 'D' ? [0] : cp.map((q) => q[idx]))) * 1.1, xlabel: 'temperatura (K)', ylabel: p.y === 'eta' ? 'η (µPa·s)' : p.y === 'lam' ? 'λ (mW/m·K)' : 'D (cm²/s)', ml: 50 });
      pl.frame(); pl.xy(Ts, ys, { color: '--c1', width: 2.8 }); if (p.y !== 'D') cp.forEach((q) => pl.dot(q[0], q[idx], { color: '--c2', r: 4.5 })); pl.vline(p.T, { color: '--accent', dash: [3, 3] });
      pl.legend([{ label: 'teoría cinética (Chapman–Enskog)', color: '--c1' }].concat(p.y !== 'D' ? [{ label: 'CoolProp (referencia)', color: '--c2', kind: 'dot' }] : []), 'tl');
      const cpEta = (() => { let a = cp[0], b = cp[cp.length - 1]; for (let i = 0; i < cp.length - 1; i++) if (p.T >= cp[i][0] && p.T <= cp[i + 1][0]) { a = cp[i]; b = cp[i + 1]; } return a[1] + ((b[1] - a[1]) * (p.T - a[0])) / (b[0] - a[0]); })();
      const cpL = (() => { let a = cp[0], b = cp[cp.length - 1]; for (let i = 0; i < cp.length - 1; i++) if (p.T >= cp[i][0] && p.T <= cp[i + 1][0]) { a = cp[i]; b = cp[i + 1]; } return a[2] + ((b[2] - a[2]) * (p.T - a[0])) / (b[0] - a[0]); })();
      sim.set('a', EM.fix(eta(p.T), 2) + ' µPa·s · ' + EM.fix(cpEta, 2) + ' µPa·s (' + EM.fix((100 * (eta(p.T) - cpEta)) / cpEta, 1) + ' %)');
      sim.set('b', (mono ? EM.fix(lam(p.T), 2) + ' (monoatómico) · ' : EM.fix(lam(p.T), 2) + ' (Eucken) · ') + EM.fix(cpL, 2) + ' mW/m·K (' + EM.fix((100 * (lam(p.T) - cpL)) / cpL, 1) + ' %)');
      sim.set('c', 'D a esta T y 1 atm: ' + EM.fix(D(p.T), 3) + ' cm²/s · a 10 atm: ' + EM.fix(D(p.T) / 10, 4) + ' cm²/s');
    });
  });
})();
