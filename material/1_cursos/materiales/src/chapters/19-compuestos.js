/* Capítulo 19 — Materiales compuestos */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;
  /* Fases: E (GPa), ν, σ* (MPa), ρ */
  const PH = { glass: ['Vidrio E', 72.5, 0.22, 3450, 2.58], carbon: ['Carbono estándar', 230, 0.2, 3500, 1.78], aramid: ['Aramida', 131, 0.35, 3600, 1.44], wc: ['Carburo de tungsteno (partículas)', 600, 0.24, 0, 15.6], sic: ['SiC (partículas)', 410, 0.19, 0, 3.2] };
  const MX = { epoxy: ['Epoxi', 3.4, 0.35, 69, 1.2], polyester: ['Poliéster', 3.4, 0.38, 50, 1.25], al: ['Aluminio', 70, 0.33, 300, 2.7], co: ['Cobalto', 211, 0.31, 600, 8.9] };
  /* Hashin–Shtrikman para E a partir de K y G */
  function hs(E1, n1, E2, n2, V2) {
    const K = (E, n) => E / (3 * (1 - 2 * n)), G = (E, n) => E / (2 * (1 + n));
    let [Ka, Ga, Kb, Gb, Vb] = [K(E1, n1), G(E1, n1), K(E2, n2), G(E2, n2), V2];
    const Va = 1 - Vb;
    const bound = (K1, G1, K2, G2, V1, V2_) => {
      const Kx = K1 + V2_ / (1 / (K2 - K1) + (3 * V1) / (3 * K1 + 4 * G1));
      const Gx = G1 + V2_ / (1 / (G2 - G1) + (6 * (K1 + 2 * G1) * V1) / (5 * G1 * (3 * K1 + 4 * G1)));
      return (9 * Kx * Gx) / (3 * Kx + Gx);
    };
    const soft = Ga < Gb ? [Ka, Ga, Kb, Gb, Va, Vb] : [Kb, Gb, Ka, Ga, Vb, Va];
    const hard = Ga < Gb ? [Kb, Gb, Ka, Ga, Vb, Va] : [Ka, Ga, Kb, Gb, Va, Vb];
    return [bound(...soft), bound(...hard)];
  }
  EM.hashinShtrikman = hs;

  /* ======================================================================
     19.1 Regla de las mezclas
     ====================================================================== */
  EM.defineSim('rule-of-mixtures', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('f', { label: 'Refuerzo', options: Object.entries(PH).map(([k, v]) => [k, v[0]]), value: 'glass' });
    sim.select('m', { label: 'Matriz', options: Object.entries(MX).map(([k, v]) => [k, v[0]]), value: 'polyester' });
    sim.slider('V', { label: 'Fracción de refuerzo <i>V<sub>f</sub></i>', min: 0, max: 0.8, step: 0.01, value: 0.4, fmt: (v) => EM.fix(v, 2) });
    sim.out('v', 'Voigt (longitudinal)', { hl: true });
    sim.out('r', 'Reuss (transversal)');
    sim.out('ht', 'Halpin–Tsai (ξ = 2)');
    sim.out('hs', 'Hashin–Shtrikman (partículas)');
    sim.out('load', 'Carga soportada por el refuerzo (isodeformación)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const [, Ef, nf] = PH[p.f], [, Em, nm] = MX[p.m];
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: Math.max(Ef, Em) * 1.05, xlabel: 'fracción volumétrica de refuerzo V_f', ylabel: 'módulo E (GPa)', ml: 50 });
      pl.frame();
      pl.fn((V) => MAT.voigt(Ef, Em, V), { color: '--c2', width: 2.2 });
      pl.fn((V) => MAT.reuss(Ef, Em, V), { color: '--c1', width: 2.2 });
      pl.fn((V) => MAT.halpinTsai(Ef, Em, V, 2), { color: '--c3', width: 1.8, dash: [6, 3] });
      pl.fn((V) => hs(Em, nm, Ef, nf, V)[0], { color: '--c5', width: 1.4, dash: [3, 3] });
      pl.fn((V) => hs(Em, nm, Ef, nf, V)[1], { color: '--c5', width: 1.4, dash: [3, 3] });
      pl.vline(p.V, { color: '--ink-3' });
      pl.legend([{ label: 'Voigt (isodeformación)', color: '--c2' }, { label: 'Reuss (isoesfuerzo)', color: '--c1' }, { label: 'Halpin–Tsai, ξ = 2', color: '--c3', dash: [6, 3] }, { label: 'cotas de Hashin–Shtrikman', color: '--c5', dash: [3, 3] }], 'tl');
      const hsv = hs(Em, nm, Ef, nf, p.V);
      sim.set('v', EM.fix(MAT.voigt(Ef, Em, p.V), 2) + ' GPa');
      sim.set('r', EM.fix(MAT.reuss(Ef, Em, p.V), 2) + ' GPa');
      sim.set('ht', EM.fix(MAT.halpinTsai(Ef, Em, p.V, 2), 2) + ' GPa');
      sim.set('hs', EM.fix(hsv[0], 1) + ' – ' + EM.fix(hsv[1], 1) + ' GPa');
      sim.set('load', EM.fix((100 * Ef * p.V) / (Ef * p.V + Em * (1 - p.V)), 1) + ' %');
    });
  });

  /* ======================================================================
     19.2 Longitud de fibra
     ====================================================================== */
  EM.defineSim('fiber-length', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('sf', { label: 'Resistencia de la fibra σ<sub>f</sub>*', min: 500, max: 5000, step: 50, value: 3450, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.slider('d', { label: 'Diámetro <i>d</i>', min: 5, max: 25, step: 0.5, value: 10, unit: 'µm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('tau', { label: 'Resistencia de la interfaz τ<sub>c</sub>', min: 2, max: 80, step: 1, value: 10, unit: 'MPa', fmt: (v) => v.toFixed(0) });
    sim.slider('lr', { label: 'Longitud de la fibra <i>l</i>/<i>l<sub>c</sub></i>', min: 0.3, max: 15, step: 0.1, value: 2, log: true, fmt: (v) => EM.fix(v, 1) });
    sim.out('lc', 'Longitud crítica <i>l<sub>c</sub></i>', { hl: true });
    sim.out('eff', 'Eficiencia de refuerzo (esfuerzo medio / σ<sub>f</sub>*)');
    sim.out('mode', 'Modo de falla');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const lc = MAT.critLength(p.sf * 1e6, p.d * 1e-6, p.tau * 1e6), l = p.lr * lc;
      const lmm = l * 1e3;
      const prof = (x) => Math.max(0, Math.min(p.sf, (4 * p.tau * Math.min(x, lmm - x)) / (p.d * 1e-3))); // x y d en mm
      const pl = new EM.Plot(ctx, { x: 0, y: H * 0.22, w: W, h: H * 0.78, xmin: 0, xmax: l * 1e3, ymin: 0, ymax: p.sf * 1.15, xlabel: 'posición a lo largo de la fibra (mm)', ylabel: 'σ_fibra (MPa)', ml: 56 });
      pl.frame();
      pl.fn((x) => prof(x), { color: '--accent', width: 2.6 });
      pl.hline(p.sf, { color: '--c2', label: 'σ_f*' });
      /* fibra dibujada */
      const x0 = pl.X(0), x1 = pl.X(l * 1e3);
      ctx.fillStyle = EM.alpha('--c6', 0.25); ctx.fillRect(x0 - 6, 10, x1 - x0 + 12, H * 0.16);
      const grad = ctx.createLinearGradient(x0, 0, x1, 0);
      for (let k = 0; k <= 20; k++) { const xx = (k / 20) * l * 1e3; grad.addColorStop(k / 20, EM.mix(EM.col('--c1'), EM.col('--c2'), prof(xx) / p.sf)); }
      ctx.fillStyle = grad; ctx.fillRect(x0, 10 + H * 0.06, x1 - x0, H * 0.04);
      EM.text(ctx, 'matriz', x0, 22, { size: 10.5, color: '--ink-3' });
      const avg = MAT.integrate((x) => prof(x), 0, l * 1e3, 400) / (l * 1e3);
      sim.set('lc', EM.fix(lc * 1e3, 3) + ' mm (' + EM.fix(lc / (p.d * 1e-6), 0) + ' diámetros)');
      sim.set('eff', EM.fix(avg / p.sf, 3) + (p.lr >= 1 ? ' (teoría 1 − l_c/2l = ' + EM.fix(1 - 1 / (2 * p.lr), 3) + ')' : ''));
      sim.set('mode', p.lr < 1 ? 'la fibra se arranca (pull-out) sin romperse' : 'la fibra se rompe en el centro');
    });
  });

  /* ======================================================================
     19.3 Resistencia longitudinal
     ====================================================================== */
  EM.defineSim('composite-strength', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('f', { label: 'Fibra', options: ['glass', 'carbon', 'aramid'].map((k) => [k, PH[k][0]]), value: 'carbon' });
    sim.select('m', { label: 'Matriz', options: ['epoxy', 'polyester', 'al'].map((k) => [k, MX[k][0]]), value: 'epoxy' });
    sim.slider('V', { label: 'Fracción de fibras <i>V<sub>f</sub></i>', min: 0, max: 0.75, step: 0.01, value: 0.6, fmt: (v) => EM.fix(v, 2) });
    sim.out('s', 'Resistencia longitudinal', { hl: true });
    sim.out('sm', 'σ<sub>m</sub>′ (matriz cuando rompen las fibras)');
    sim.out('vm', '<i>V</i><sub>mín</sub> y <i>V</i><sub>crít</sub>');
    sim.out('rho', 'Densidad y resistencia específica');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const [, Ef, , sf, rf] = PH[p.f], [, Em, , smu, rm] = MX[p.m];
      const smp = (Em * sf) / Ef;
      const scl = (V) => smp * (1 - V) + sf * V;
      const Vmin = (smu - smp) / (sf + smu - smp), Vcrit = (smu - smp) / (sf - smp);
      const st = (V) => Math.max(scl(V), smu * (1 - V));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 0.8, ymin: 0, ymax: sf * 0.85, xlabel: 'V_f', ylabel: 'resistencia (MPa)', ml: 56 });
      pl.frame();
      pl.fn(scl, { color: '--c1', width: 1.6, dash: [5, 4] });
      pl.fn((V) => smu * (1 - V), { color: '--c3', width: 1.6, dash: [5, 4] });
      pl.fn(st, { color: '--accent', width: 2.6 });
      pl.dot(p.V, st(p.V), { color: '--accent', r: 6 });
      pl.legend([{ label: 'falla controlada por las fibras', color: '--c1', dash: [5, 4] }, { label: 'solo la matriz', color: '--c3', dash: [5, 4] }, { label: 'compuesto', color: '--accent' }], 'tl');
      const rho = rf * p.V + rm * (1 - p.V);
      sim.set('s', EM.fix(st(p.V), 0) + ' MPa');
      sim.set('sm', EM.fix(smp, 1) + ' MPa');
      sim.set('vm', EM.fix(100 * Math.max(0, Vmin), 2) + ' % y ' + EM.fix(100 * Math.max(0, Vcrit), 2) + ' %');
      sim.set('rho', EM.fix(rho, 2) + ' g/cm³ · ' + EM.fix(st(p.V) / rho, 0) + ' MPa·cm³/g');
    });
  });

  /* ======================================================================
     19.4 Laminados (diagrama polar)
     ====================================================================== */
  const LAY = { u0: ['Unidireccional [0]', [0]], u45: ['Unidireccional [45]', [45]], cp: ['Cruzado [0/90]s', [0, 90]], ang: ['Ángulo [±45]s', [45, -45]], qi: ['Cuasiisótropo [0/±45/90]s', [0, 45, -45, 90]], qi60: ['Cuasiisótropo [0/±60]s', [0, 60, -60]] };
  const PLY = { cf: ['Carbono-epoxi', 140, 10, 5, 0.3, 1.55], gf: ['Vidrio-epoxi', 45, 12, 5.5, 0.28, 2.0], kf: ['Aramida-epoxi', 76, 5.5, 2.3, 0.34, 1.38] };
  EM.defineSim('laminate', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.select('ply', { label: 'Lámina', options: Object.entries(PLY).map(([k, v]) => [k, v[0]]), value: 'cf' });
    sim.select('lay', { label: 'Secuencia', options: Object.entries(LAY).map(([k, v]) => [k, v[0]]), value: 'qi' });
    sim.slider('phi', { label: 'Dirección de carga φ', min: 0, max: 90, step: 1, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.check('al', { label: 'Comparar con aluminio (69 GPa, 2.70 g/cm³)', value: true });
    sim.out('E', '<i>E<sub>x</sub></i>(φ)', { hl: true });
    sim.out('rng', 'Mínimo y máximo en el plano');
    sim.out('spec', '<i>E</i>/ρ del laminado');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const [, E1, E2, G12, nu, rho] = PLY[p.ply], plies = LAY[p.lay][1];
      const Ex = (phi) => MAT.laminateEx(E1, E2, G12, nu, plies, phi);
      const Emax = E1 * 1.05;
      const pol = new EM.Polar(ctx, { cx: cv.w * 0.31, cy: cv.h * 0.5, R: Math.min(cv.w * 0.27, cv.h * 0.42), zero: 'right', rings: [0.25, 0.5, 0.75, 1], spokes: 30 });
      pol.frame();
      pol.curve((a) => Ex(M.deg(a)) / Emax, { color: '--accent', width: 2.4 });
      if (p.al) pol.curve(() => 69 / Emax, { color: '--c6', width: 1.4, fill: false, dash: [5, 4] });
      const [x, y] = pol.xy(M.rad(p.phi), Ex(p.phi) / Emax);
      EM.text(ctx, 'anillo exterior = ' + EM.fix(Emax, 0) + ' GPa', 10, cv.h - 8, { size: 10.5, color: '--ink-3' });
      EM.draw.bob(ctx, x, y, 6, { color: '--accent' });
      /* esquema de las láminas */
      const sx = cv.w * 0.66, sw = cv.w * 0.32;
      plies.concat(plies.slice().reverse()).forEach((th, i, arr) => {
        const yy = 20 + i * ((cv.h - 40) / arr.length), hh = (cv.h - 40) / arr.length - 4;
        ctx.save(); ctx.beginPath(); ctx.rect(sx, yy, sw, hh); ctx.clip();
        ctx.fillStyle = EM.alpha('--c6', 0.15); ctx.fillRect(sx, yy, sw, hh);
        ctx.strokeStyle = EM.alpha('--c1', 0.8); ctx.lineWidth = 1;
        const t = M.rad(th);
        for (let k = -40; k < 40; k++) { const cx = sx + sw / 2 + k * 7; ctx.beginPath(); ctx.moveTo(cx - 100 * Math.cos(t), yy + hh / 2 + 100 * Math.sin(t)); ctx.lineTo(cx + 100 * Math.cos(t), yy + hh / 2 - 100 * Math.sin(t)); ctx.stroke(); }
        ctx.restore();
        EM.text(ctx, th + '°', sx - 6, yy + hh / 2 + 4, { size: 11, align: 'right', color: '--ink-2' });
      });
      const vals = M.linspace(0, 90, 91).map(Ex);
      sim.set('E', EM.fix(Ex(p.phi), 1) + ' GPa');
      sim.set('rng', EM.fix(Math.min(...vals), 1) + ' – ' + EM.fix(Math.max(...vals), 1) + ' GPa');
      sim.set('spec', EM.fix(Ex(p.phi) / rho, 1) + ' GPa·cm³/g (aluminio: 25.6)');
    });
  });
})();
