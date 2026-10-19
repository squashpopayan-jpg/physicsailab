/* Capítulo 2 — Gas ideal y teoría cinética */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;

  /* 2.1 Caja de discos duros: presión cinética */
  EM.defineSim('caja-cinetica', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('N', { label: 'Número de partículas <i>N</i>', min: 20, max: 400, step: 10, value: 150, fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura (reducida)', min: 0.25, max: 4, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('W', { label: 'Ancho de la caja (área)', min: 0.4, max: 1, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('r', { label: 'Radio de los discos', min: 0.003, max: 0.03, step: 0.001, value: 0.008, fmt: (v) => v.toFixed(3) });
    sim.check('same', { label: 'Empezar con todas las rapideces iguales', value: false });
    sim.out('P', 'Presión medida en la pared', { hl: true });
    sim.out('Pi', 'Ideal <i>Nk<sub>B</sub>T</i>/<i>A</i>');
    sim.out('Ph', 'Discos duros (Henderson)');
    sim.out('phi', 'Fracción de área ocupada');
    let g;
    const make = () => {
      const p = sim.p;
      g = new EM.GasBox({ N: p.N, r: p.r, W: p.W, H: 1, T: p.T });
      if (p.same) { const s = Math.sqrt(2 * p.T); for (let i = 0; i < g.N; i++) { const a = Math.random() * 2 * Math.PI; g.vx[i] = s * Math.cos(a); g.vy[i] = s * Math.sin(a); } }
    };
    make();
    sim.onChange = (id) => {
      if (id === 'T' && g) { g.scale(Math.sqrt(sim.p.T / Math.max(1e-9, g.Tkin()))); g.T = sim.p.T; g.Pavg = null; g._si = 0; g._st = 0; return; }
      make();
    };
    sim.resetButton(make);
    sim.animate((dt) => { if (!(dt > 0)) return; for (let s = 0; s < 8; s++) g.step(Math.min(dt, 0.03) / 8 * 0.5); g.pressure(3); });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const side = H - 20, bx = 10, by = 10;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(bx, by, side * p.W, side);
      g.draw(ctx, bx, by, side * p.W, side, { speedColor: true, Tref: p.T });
      /* histograma de rapideces */
      const vmax = 4 * Math.sqrt(p.T), nb = 24, hist = new Array(nb).fill(0);
      for (let i = 0; i < g.N; i++) { const v = Math.hypot(g.vx[i], g.vy[i]); const k = Math.floor((v / vmax) * nb); if (k < nb) hist[k]++; }
      const pl = new EM.Plot(ctx, { x: side + 20, y: 0, w: W - side - 20, h: H, xmin: 0, xmax: vmax, ymin: 0, ymax: 1.4 / Math.sqrt(p.T) * 0.62, xlabel: 'rapidez v', ylabel: 'f(v)', ml: 46, yticks: [] });
      pl.frame();
      const bw = vmax / nb;
      ctx.fillStyle = EM.alpha('--c1', 0.35);
      hist.forEach((c, k) => { const hgt = c / (g.N * bw); ctx.fillRect(pl.X(k * bw), pl.Y(hgt), pl.X(bw) - pl.X(0) - 1, pl.Y(0) - pl.Y(hgt)); });
      const Tk = g.Tkin();
      pl.fn((v) => (v / Tk) * Math.exp((-v * v) / (2 * Tk)), { color: '--accent', width: 2.4 });
      pl.legend([{ label: 'simulación', color: '--c1', kind: 'sq' }, { label: 'Maxwell 2D a la T cinética', color: '--accent' }], 'tr');
      const A = p.W, phi = (g.N * Math.PI * p.r * p.r) / A, Pi = (g.N * Tk) / A;
      const Ph = Pi * (1 + phi * phi / 8) / Math.pow(1 - phi, 2);
      sim.set('P', g.Pavg === null ? '—' : EM.fix(g.Pavg, 1) + ' (T cinética ' + EM.fix(Tk, 3) + ')');
      sim.set('Pi', EM.fix(Pi, 1));
      sim.set('Ph', EM.fix(Ph, 1));
      sim.set('phi', EM.fix(100 * phi, 2) + ' %');
    });
  });

  /* 2.2 Maxwell–Boltzmann y escape */
  const GAS = { H2: ['H₂', 2.016], He: ['He', 4.0026], H2O: ['H₂O', 18.015], N2: ['N₂', 28.013], O2: ['O₂', 31.999], Ar: ['Ar', 39.948], CO2: ['CO₂', 44.01], Xe: ['Xe', 131.29] };
  const BODY = { tierra: ['Tierra (exosfera, ~1000 K)', 11.19, 1000], luna: ['Luna (día, ~390 K)', 2.38, 390], marte: ['Marte (exosfera, ~300 K)', 5.03, 300], titan: ['Titán (~150 K)', 2.64, 150], jupiter: ['Júpiter (~1000 K)', 59.5, 1000] };
  EM.defineSim('maxwell', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('g', { label: 'Gas', options: Object.entries(GAS).map(([k, v]) => [k, v[0] + ' (' + v[1] + ' g/mol)']), value: 'N2' });
    sim.slider('T', { label: 'Temperatura', min: 20, max: 3000, step: 1, value: 300, unit: 'K', log: true, fmt: (v) => v.toFixed(0) });
    sim.select('b', { label: 'Cuerpo celeste (para el escape)', options: Object.entries(BODY).map(([k, v]) => [k, v[0]]), value: 'tierra' });
    sim.button('Usar la temperatura de la exosfera', () => { sim.ctl.T.set(BODY[sim.p.b][2]); });
    sim.out('v', '<i>v<sub>p</sub></i> · <i>v̄</i> · <i>v<sub>rms</sub></i>', { hl: true });
    sim.out('f', 'Fracción con <i>v</i> &gt; <i>v<sub>esc</sub></i>');
    sim.out('j', 'Criterio de Jeans (<i>v<sub>esc</sub></i> &gt; 6 <i>v<sub>rms</sub></i>)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const m = TH.maxwell(GAS[p.g][1], p.T), ve = BODY[p.b][1] * 1000;
      const vmax = Math.max(4 * m.vp, 1500);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: vmax, ymin: 0, ymax: (1.05 * 4) / Math.sqrt(Math.PI) / m.vp * Math.exp(-1), xlabel: 'v (m/s)', ylabel: 'f(v) (s/m)', ml: 64 });
      pl.frame();
      for (const k of Object.keys(GAS)) if (k !== p.g) pl.fn(TH.maxwell(GAS[k][1], p.T).f, { color: '--grid-2', width: 1 });
      pl.fn(m.f, { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.08 });
      pl.vline(m.vp, { label: 'v_p' }); pl.vline(m.vm, { label: 'v̄', labelY: 28 }); pl.vline(m.vrms, { label: 'v_{rms}', labelY: 44 });
      if (ve < vmax) { pl.band(ve, vmax, { color: '--c2', alpha: 0.12 }); pl.vline(ve, { color: '--c2', dash: [], label: 'escape' }); }
      const fr = m.above(ve);
      sim.set('v', [m.vp, m.vm, m.vrms].map((x) => x.toFixed(0)).join(' · ') + ' m/s');
      sim.set('f', fr < 1e-300 ? '&lt; 10⁻³⁰⁰' : EM.sci(fr, 3));
      sim.set('j', ve > 6 * m.vrms ? 'retenido durante la edad del sistema solar' : 'se pierde con el tiempo');
    });
  });

  /* 2.3 Equipartición: c_v(T) */
  const JANAF = { N2: [[300, 29.12], [500, 29.58], [1000, 32.70], [1500, 34.85], [2000, 36.0]], CO2: [[300, 37.22], [500, 44.63], [1000, 54.31], [1500, 58.38], [2000, 60.43]], H2O: [[300, 33.6], [500, 35.23], [1000, 41.27], [1500, 47.06], [2000, 51.18]], H2: [[300, 28.85], [500, 29.26], [1000, 30.2], [1500, 32.3], [2000, 34.28]] };
  const rotCv = (t) => { /* rotor rígido, t = T/Θ_r */
    let Z = 0, E = 0, E2 = 0;
    for (let J = 0; J < 200; J++) { const e = J * (J + 1), w = (2 * J + 1) * Math.exp(-e / t); Z += w; E += e * w; E2 += e * e * w; if (w < 1e-18 * Z && J > 5) break; }
    E /= Z; E2 /= Z;
    return (E2 - E * E) / (t * t);
  };
  const SPE = { He: ['Helio', '--c6'], H2: ['Hidrógeno H₂', '--c5'], N2: ['Nitrógeno N₂', '--c1'], CO2: ['Dióxido de carbono CO₂', '--c2'], H2O: ['Vapor de agua H₂O', '--c3'] };
  const cvR = (sp, T) => {
    if (sp === 'H2') { let c = 1.5 + rotCv(T / 87.6); for (const th of TH.SP.H2.vib) c += TH.einsteinCv(T, th); return c; }
    return TH.cpMol(sp, T) / TH.R - 1;
  };
  EM.defineSim('equiparticion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    for (const k of Object.keys(SPE)) sim.check(k, { label: SPE[k][0], value: k !== 'He' });
    sim.slider('T', { label: 'Temperatura', min: 10, max: 5000, step: 1, value: 300, unit: 'K', log: true, fmt: (v) => v.toFixed(0) });
    sim.out('cv', '<i>c̄<sub>v</sub></i>/<i>R</i> a esta temperatura', { hl: true });
    sim.out('k', 'Cociente <i>k</i> = <i>c<sub>p</sub></i>/<i>c<sub>v</sub></i>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 10, xmax: 5000, xlog: true, ymin: 1, ymax: 6.6, xlabel: 'T (K)', ylabel: 'c_v / R' });
      pl.frame();
      [[1.5, 'traslación 3/2'], [2.5, '+ rotación (lineal) 5/2'], [3, '+ rotación (no lineal) 3']].forEach(([y, l]) => pl.hline(y, { color: '--ink-3', label: l }));
      const leg = [], vals = [];
      for (const k of Object.keys(SPE)) {
        if (!p[k]) continue;
        pl.fn((T) => (k === 'H2' ? cvR('H2', T) : T < 60 && k !== 'He' ? NaN : cvR(k, T)), { color: SPE[k][1], width: 2.4 });
        if (JANAF[k]) for (const [T, c] of JANAF[k]) pl.dot(T, c / TH.R - 1, { color: SPE[k][1], r: 3.5 });
        pl.dot(p.T, cvR(k, p.T), { color: SPE[k][1], r: 5 });
        leg.push({ label: SPE[k][0], color: SPE[k][1] });
        const c = cvR(k, p.T); vals.push([SPE[k][0], c]);
      }
      pl.vline(p.T, { color: '--accent' });
      if (leg.length) pl.legend(leg, 'tl');
      sim.set('cv', vals.map(([n, c]) => n + ': ' + c.toFixed(3)).join('<br>') || '—');
      sim.set('k', vals.map(([n, c]) => n + ': ' + ((c + 1) / c).toFixed(3)).join('<br>') || '—');
    });
  });

  /* 2.4 Atmósfera barométrica */
  const CITY = [[0, 'nivel del mar'], [1000, 'Cali'], [1760, 'Popayán'], [2640, 'Bogotá'], [3640, 'La Paz'], [5364, 'campo base Everest'], [8849, 'cima del Everest']];
  EM.defineSim('barometrica', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('z', { label: 'Altitud', min: 0, max: 9000, step: 10, value: 1760, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.slider('T0', { label: 'Temperatura de la atmósfera isoterma', min: 200, max: 320, step: 1, value: 288, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('P', 'Presión (ISA)', { hl: true });
    sim.out('Pi', 'Presión (isoterma)');
    sim.out('rho', 'Densidad del aire (ISA)');
    sim.out('o2', 'Presión parcial de O₂');
    sim.out('Tb', 'Ebullición del agua');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const H = (TH.Rair * p.T0) / TH.g;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 9000, ymin: 0, ymax: 105, xlabel: 'altitud (m)', ylabel: 'P (kPa)  ·  T_{eb} (°C)' });
      pl.frame();
      pl.fn((z) => TH.isa(z).P / 1e3, { color: '--accent', width: 2.6 });
      pl.fn((z) => 101.325 * Math.exp(-z / H), { color: '--c1', width: 1.6, dash: [6, 4] });
      pl.fn((z) => TH.agua.Tsat(TH.isa(z).P) - 273.15, { color: '--c3', width: 2 });
      for (const [z, n] of CITY) { pl.dot(z, TH.isa(z).P / 1e3, { color: '--ink-3', r: 3, label: n, dy: -8, align: z > 8000 ? 'right' : 'left', dx: z > 8000 ? -7 : 7 }); }
      pl.vline(p.z, { color: '--accent' });
      pl.legend([{ label: 'presión ISA', color: '--accent' }, { label: 'isoterma, H = ' + (H / 1000).toFixed(2) + ' km', color: '--c1', dash: [6, 4] }, { label: 'punto de ebullición del agua', color: '--c3' }], 'tr');
      const s = TH.isa(p.z), rho = s.P / (TH.Rair * s.T);
      sim.set('P', EM.fix(s.P / 1e3, 2) + ' kPa (' + EM.fix((100 * s.P) / 101325, 1) + ' % del nivel del mar)');
      sim.set('Pi', EM.fix((101.325 * Math.exp(-p.z / H)), 2) + ' kPa');
      sim.set('rho', EM.fix(rho, 3) + ' kg/m³ a ' + EM.fix(s.T - 273.15, 1) + ' °C');
      sim.set('o2', EM.fix((0.2095 * s.P) / 1e3, 2) + ' kPa');
      sim.set('Tb', EM.fix(TH.agua.Tsat(s.P) - 273.15, 2) + ' °C');
    });
  });
})();
