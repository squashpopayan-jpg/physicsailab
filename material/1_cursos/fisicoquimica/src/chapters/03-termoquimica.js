/* Capítulo 3 — Termoquímica */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, DAT = EM.dat, R = FQ.R;
  const pretty = (k) => k.replace(/(\d+)/g, '<sub>$1</sub>').replace(/\((g|l|s|aq|gr|diam)\)/, '<sub>($1)</sub>').replace(/_(\d[+-])/, '<sup>$1</sup>').replace(/([+-])\(aq\)/, '<sup>$1</sup>(aq)');
  const txt = (k) => k.replace(/_/g, '').replace(/\((g|l|s|aq|gr|diam)\)/, ' ($1)');
  const lab = (nu) => {
    const f = (side) => Object.entries(nu).filter(([, v]) => side * v > 0).map(([k, v]) => (Math.abs(v) === 1 ? '' : Math.abs(v)) + txt(k)).join(' + ');
    return f(-1) + ' → ' + f(1);
  };

  /* 3.1 Entalpías estándar de reacción por la ley de Hess */
  const RX = {
    ch4: ['Combustión del metano', { 'CH4(g)': -1, 'O2(g)': -2, 'CO2(g)': 1, 'H2O(l)': 2 }],
    etoh: ['Combustión del etanol', { 'C2H5OH(l)': -1, 'O2(g)': -3, 'CO2(g)': 2, 'H2O(l)': 3 }],
    glu: ['Combustión de la glucosa', { 'glucosa(s)': -1, 'O2(g)': -6, 'CO2(g)': 6, 'H2O(l)': 6 }],
    benz: ['Combustión del benceno', { 'C6H6(l)': -1, 'O2(g)': -7.5, 'CO2(g)': 6, 'H2O(l)': 3 }],
    h2: ['Formación del agua líquida', { 'H2(g)': -1, 'O2(g)': -0.5, 'H2O(l)': 1 }],
    therm: ['Termita', { 'Fe2O3(s)': -1, 'Al(s)': -2, 'Al2O3(s)': 1, 'Fe(s)': 2 }],
    caco3: ['Calcinación de la caliza', { 'CaCO3(s)': -1, 'CaO(s)': 1, 'CO2(g)': 1 }],
    haber: ['Síntesis de amoníaco', { 'N2(g)': -1, 'H2(g)': -3, 'NH3(g)': 2 }],
    n2o4: ['Disociación del N₂O₄', { 'N2O4(g)': -1, 'NO2(g)': 2 }],
    diam: ['Grafito a diamante', { 'C(gr)': -1, 'C(diam)': 1 }],
    nacl: ['Disolución del NaCl', { 'NaCl(s)': -1, 'Na+(aq)': 1, 'Cl-(aq)': 1 }],
    neut: ['Neutralización fuerte', { 'H+(aq)': -1, 'OH-(aq)': -1, 'H2O(l)': 1 }],
    agcl: ['Disolución del AgCl', { 'AgCl(s)': -1, 'Ag+(aq)': 1, 'Cl-(aq)': 1 }]
  };
  EM.defineSim('hess', function (sim) {
    const cv = sim.canvas({ aspect: 1.85 });
    sim.select('rx', { label: 'Reacción', options: Object.entries(RX).map(([k, v]) => [k, v[0]]), value: 'ch4' });
    sim.out('eq', 'Ecuación', {});
    sim.out('H', 'Δ<sub>r</sub><i>H</i>° = Σ ν Δ<sub>f</sub><i>H</i>°', { hl: true });
    sim.out('S', 'Δ<sub>r</sub><i>S</i>° · <i>T</i>Δ<sub>r</sub><i>S</i>° a 298.15 K');
    sim.out('G', 'Δ<sub>r</sub><i>G</i>° = Δ<sub>r</sub><i>H</i>° − <i>T</i>Δ<sub>r</sub><i>S</i>°');
    sim.out('K', 'Constante de equilibrio <i>K</i>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, nu = RX[p.rx][1], r = FQ.rxn(nu);
      EM.draw.clear(cv);
      const reac = Object.entries(nu).filter(([, v]) => v < 0), prod = Object.entries(nu).filter(([, v]) => v > 0);
      const sumH = (list) => list.reduce((s, [k, v]) => s + Math.abs(v) * FQ.tt[k].H, 0);
      const hr = sumH(reac), hp = sumH(prod);
      const lo = Math.min(0, hr, hp), hi = Math.max(0, hr, hp), span = Math.max(1, hi - lo), pad = span * 0.18;
      const top = 34, bot = H - 30, Y = (v) => bot - ((v - (lo - pad)) / (span + 2 * pad)) * (bot - top);
      const x1 = W * 0.2, x2 = W * 0.62, bw = Math.min(150, W * 0.2);
      ctx.save();
      ctx.strokeStyle = EM.col('--ink-3'); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(40, Y(0)); ctx.lineTo(W - 20, Y(0)); ctx.stroke(); ctx.setLineDash([]);
      EM.text(ctx, 'elementos en su estado estándar (H = 0)', W - 24, Y(0) - 7, { size: 11.5, color: '--ink-3', align: 'right' });
      const bar = (x, v, col, label) => {
        ctx.fillStyle = EM.alpha(col, 0.35); ctx.strokeStyle = EM.col(col); ctx.lineWidth = 2;
        const y0 = Y(0), y1 = Y(v); ctx.fillRect(x - bw / 2, Math.min(y0, y1), bw, Math.abs(y1 - y0)); ctx.strokeRect(x - bw / 2, Math.min(y0, y1), bw, Math.abs(y1 - y0));
        EM.text(ctx, label, x, v <= 0 ? Y(v) + 16 : Y(v) - 10, { size: 12, color: '--ink', align: 'center', weight: 600 });
        EM.text(ctx, EM.fix(v, 1) + ' kJ', x, v <= 0 ? Y(v) + 32 : Y(v) - 26, { size: 11.5, color: '--ink-2', align: 'center', mono: true });
      };
      bar(x1, hr, '--c1', 'reactivos'); bar(x2, hp, '--c2', 'productos');
      const hh = r.H;
      ctx.restore();
      EM.draw.arrow(ctx, (x1 + x2) / 2, Y(hr), (x1 + x2) / 2, Y(hp), { color: hh < 0 ? '--c3' : '--c4', width: 2.6 });
      EM.text(ctx, 'Δ_rH° = ' + EM.fix(hh, 1) + ' kJ', (x1 + x2) / 2 + 10, (Y(hr) + Y(hp)) / 2, { size: 13, color: hh < 0 ? '--c3' : '--c4', weight: 700, halo: true });
      EM.text(ctx, hh < 0 ? 'exotérmica: el sistema cede calor' : 'endotérmica: el sistema absorbe calor', W * 0.5, 16, { size: 12.5, color: '--ink-2', align: 'center' });
      sim.set('eq', lab(nu));
      sim.set('H', EM.fix(r.H, 2) + ' kJ/mol');
      sim.set('S', EM.fix(r.S, 1) + ' J/mol·K · ' + EM.fix((298.15 * r.S) / 1e3, 1) + ' kJ/mol');
      sim.set('G', EM.fix(r.G, 2) + ' kJ/mol');
      sim.set('K', r.lnK > 600 ? '≈ 10^{' + EM.fix(r.lnK / Math.LN10, 0) + '}' : EM.sci(r.K, 3));
    });
  });

  /* 3.2 Ley de Kirchhoff con polinomios NASA */
  const GRX = {
    ch4: ['CH₄ + 2 O₂ → CO₂ + 2 H₂O(g)', { CH4: -1, O2: -2, CO2: 1, H2O: 2 }],
    haber: ['N₂ + 3 H₂ → 2 NH₃', { N2: -1, H2: -3, NH3: 2 }],
    wgs: ['CO + H₂O → CO₂ + H₂ (gas de agua)', { CO: -1, H2O: -1, CO2: 1, H2: 1 }],
    hyd: ['C₂H₄ + H₂ → C₂H₆', { C2H4: -1, H2: -1, C2H6: 1 }],
    no: ['N₂ + O₂ → 2 NO', { N2: -1, O2: -1, NO: 2 }],
    smr: ['CH₄ + H₂O → CO + 3 H₂ (reformado)', { CH4: -1, H2O: -1, CO: 1, H2: 3 }]
  };
  EM.defineSim('kirchhoff', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('rx', { label: 'Reacción en fase gaseosa', options: Object.entries(GRX).map(([k, v]) => [k, v[0]]), value: 'wgs' });
    sim.slider('T', { label: 'Temperatura', min: 300, max: 3000, step: 10, value: 1000, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.check('ap', { label: 'Aproximación de Δ<i>C</i><sub>p</sub> constante (valor a 298 K)', value: true });
    sim.out('H', 'Δ<sub>r</sub><i>H</i>°(<i>T</i>)', { hl: true });
    sim.out('Cp', 'Δ<sub>r</sub><i>C</i><sub>p</sub>° a 298 K · a <i>T</i>');
    sim.out('S', 'Δ<sub>r</sub><i>S</i>°(<i>T</i>)');
    sim.out('G', 'Δ<sub>r</sub><i>G</i>°(<i>T</i>) · temperatura de ΔG = 0');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, nu = GRX[p.rx][1];
      EM.draw.clear(cv);
      const Ts = [], H = [], TS = [], G = [], Ha = [];
      const H0 = FQ.dH(nu, 298.15) / 1e3, S0 = FQ.dS(nu, 298.15), Cp0 = FQ.dCp(nu, 298.15);
      for (let T = 300; T <= 3000; T += 30) { Ts.push(T); H.push(FQ.dH(nu, T) / 1e3); TS.push((T * FQ.dS(nu, T)) / 1e3); G.push(FQ.dG(nu, T) / 1e3); Ha.push(H0 + (Cp0 * (T - 298.15)) / 1e3); }
      const all = H.concat(TS, G); let lo = Math.min(...all), hi = Math.max(...all); const pad = (hi - lo) * 0.08;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 300, xmax: 3000, ymin: lo - pad, ymax: hi + pad, xlabel: 'T (K)', ylabel: 'kJ/mol', ml: 56 });
      pl.frame();
      pl.xy(Ts, H, { color: '--c1', width: 2.4 }); pl.xy(Ts, TS, { color: '--c4', width: 2.2 }); pl.xy(Ts, G, { color: '--c2', width: 2.4 });
      if (p.ap) pl.xy(Ts, Ha, { color: '--c1', width: 1.4, dash: [5, 4] });
      const T = p.T; pl.vline(T, { color: '--accent' });
      const Tg = FQ.bisect((t) => FQ.dG(nu, t), 300, 3000, 1e-9);
      if (isFinite(Tg)) pl.dot(Tg, 0, { color: '--c2', label: 'ΔG° = 0 en ' + EM.fix(Tg, 0) + ' K', dy: -12 });
      pl.legend([{ label: 'Δ_rH° (NASA)', color: '--c1' }, { label: 'T·Δ_rS°', color: '--c4' }, { label: 'Δ_rG° = ΔH° − TΔS°', color: '--c2' }, { label: 'ΔH° con ΔCp constante', color: '--c1', dash: [5, 4] }], 'tr');
      sim.set('H', EM.fix(FQ.dH(nu, T) / 1e3, 2) + ' kJ/mol' + (p.ap ? ' (con ΔC_p constante: ' + EM.fix(H0 + (Cp0 * (T - 298.15)) / 1e3, 2) + ')' : ''));
      sim.set('Cp', EM.fix(Cp0, 2) + ' · ' + EM.fix(FQ.dCp(nu, T), 2) + ' J/mol·K');
      sim.set('S', EM.fix(FQ.dS(nu, T), 2) + ' J/mol·K');
      sim.set('G', EM.fix(FQ.dG(nu, T) / 1e3, 2) + ' kJ/mol · ' + (isFinite(Tg) ? EM.fix(Tg, 0) + ' K' : 'no cruza en 300–3000 K'));
    });
  });

  /* 3.3 Calorímetro de bomba */
  const SAMPLES = { bz: ['Ácido benzoico (patrón)', 122.123, -3227, -0.5], nf: ['Naftaleno', 128.174, -5157, -2], gl: ['Glucosa', 180.156, -2803, 0] };
  EM.defineSim('calorimetro', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('s', { label: 'Muestra problema', options: Object.entries(SAMPLES).map(([k, v]) => [k, v[0]]), value: 'nf' });
    sim.slider('m', { label: 'Masa de la muestra', min: 0.4, max: 1.4, step: 0.01, value: 0.8, unit: 'g', fmt: (v) => v.toFixed(2) });
    sim.slider('k', { label: 'Intercambio con la chaqueta (k)', min: 0, max: 1, step: 0.01, value: 0.2, unit: '×10⁻³ s⁻¹', fmt: (v) => v.toFixed(2) });
    sim.slider('dTj', { label: 'Chaqueta más caliente que el agua', min: -0.5, max: 0.5, step: 0.01, value: 0.1, unit: 'K', fmt: (v) => v.toFixed(2) });
    sim.slider('noise', { label: 'Ruido del termómetro', min: 0, max: 2, step: 0.05, value: 0.5, unit: 'mK', fmt: (v) => v.toFixed(2) });
    sim.out('dT', 'Elevación corregida Δ<i>T</i> (extrapolación) · verdadera', { hl: true });
    sim.out('C', 'Capacidad calorífica de la bomba (calibrada con 1.000 g de ácido benzoico)');
    sim.out('U', 'Δ<sub>c</sub><i>U</i>° medido · Δ<sub>c</sub><i>H</i>° medido');
    sim.out('ref', 'Δ<sub>c</sub><i>H</i>° de la literatura · error');
    const Ccal = 10.5; /* kJ/K, valor «verdadero» escondido */
    const RT = (R * 298.15) / 1e3;
    const hash = (i, seed) => { const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };
    function run(smp, mass, k, dTj, noise, seed) {
      const [, M, dcH, dn] = SAMPLES[smp], n = mass / M, dcU = dcH - dn * RT, dTtrue = (-n * dcU) / Ccal;
      const kk = k * 1e-3, ti = 300, tau = 30, Tj = dTj, T0 = 0; /* temperaturas relativas al agua inicial */
      const ts = [], Ts = []; let T = T0;
      for (let t = 0; t <= 1200; t += 5) {
        ts.push(t); Ts.push(T + (noise * 1e-3 * hash(t, seed)) / 1);
        for (let s = 0; s < 5; s++) { const heat = t >= ti ? (dTtrue / tau) * Math.exp(-(t + s - ti) / tau) : 0; T += (-kk * (T - Tj) + heat) * 1; }
      }
      /* extrapolación: recta de antes de la ignición y de después (t > 650) */
      const sel = (a, b) => { const x = [], y = []; ts.forEach((t, i) => { if (t >= a && t <= b) { x.push(t); y.push(Ts[i]); } }); return FQ.linfit(x, y); };
      const pre = sel(0, 280), post = sel(650, 1200);
      /* instante t_m en el que se alcanza el 63 % del ascenso (Dickinson) */
      let tm = ti + 30;
      for (let it = 0; it < 30; it++) {
        const Ti = pre.a + pre.b * ti, Tf = post.a + post.b * (ti + 150);
        const Tt = Ti + 0.63 * (Tf - Ti);
        let found = ti; for (let i = 0; i < ts.length; i++) if (ts[i] >= ti && Ts[i] >= Tt) { found = ts[i]; break; }
        if (Math.abs(found - tm) < 1) break; tm = found;
      }
      const dT = post.a + post.b * tm - (pre.a + pre.b * tm);
      return { ts, Ts, pre, post, tm, dT, dTtrue, n, dcU, dcH };
    }
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const cal = run('bz', 1.0, p.k, p.dTj, p.noise, 7);
      const Cest = (-cal.n * (SAMPLES.bz[2] - SAMPLES.bz[3] * RT)) / cal.dT;
      const r = run(p.s, p.m, p.k, p.dTj, p.noise, 3);
      const dcU = (-Cest * r.dT) / r.n, dcH = dcU + SAMPLES[p.s][3] * RT;
      const lo = Math.min(...r.Ts), hi = Math.max(...r.Ts), pad = (hi - lo) * 0.1 + 0.002;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1200, ymin: lo - pad, ymax: hi + pad, xlabel: 't (s)', ylabel: 'T − T inicial (K)', ml: 62, yfmt: (v) => v.toFixed(3) });
      pl.frame();
      pl.xy(r.ts, r.Ts, { color: '--c1', width: 1.4 });
      pl.fn((t) => r.pre.a + r.pre.b * t, { color: '--ink-3', width: 1.4, dash: [6, 4] });
      pl.fn((t) => r.post.a + r.post.b * t, { color: '--ink-3', width: 1.4, dash: [6, 4], from: 250 });
      pl.vline(r.tm, { color: '--c3', label: 't_m' });
      pl.path([[r.tm, r.pre.a + r.pre.b * r.tm], [r.tm, r.post.a + r.post.b * r.tm]], { color: '--accent', width: 3 });
      pl.vline(300, { color: '--c2', label: 'ignición', labelY: 28 });
      pl.legend([{ label: 'temperatura medida', color: '--c1' }, { label: 'extrapolación de las derivas', color: '--ink-3', dash: [6, 4] }, { label: 'ΔT corregida', color: '--accent' }], 'br');
      sim.set('dT', EM.fix(r.dT * 1e3, 1) + ' mK · ' + EM.fix(r.dTtrue * 1e3, 1) + ' mK (verdadero)');
      sim.set('C', EM.fix(Cest, 3) + ' kJ/K (valor real 10.500)');
      sim.set('U', EM.fix(dcU, 1) + ' · ' + EM.fix(dcH, 1) + ' kJ/mol');
      sim.set('ref', EM.fix(SAMPLES[p.s][2], 0) + ' kJ/mol · ' + EM.fix((100 * (dcH - SAMPLES[p.s][2])) / SAMPLES[p.s][2], 2) + ' %');
    });
  });

  /* 3.4 Entalpías de enlace */
  const BONDS = {
    CH4: { 'C-H': 4 }, O2: { 'O=O': 1 }, CO2: { 'C=O(CO2)': 2 }, H2O: { 'O-H': 2 }, H2: { 'H-H': 1 }, N2: { 'N#N': 1 }, NH3: { 'N-H': 3 }, C2H4: { 'C=C': 1, 'C-H': 4 },
    C2H6: { 'C-C': 1, 'C-H': 6 }, C2H5OH: { 'C-C': 1, 'C-H': 5, 'C-O': 1, 'O-H': 1 }, Cl2: { 'Cl-Cl': 1 }, HCl: { 'H-Cl': 1 }, CH3OH: { 'C-H': 3, 'C-O': 1, 'O-H': 1 }, C2H2: { 'C#C': 1, 'C-H': 2 }
  };
  const BRX = {
    ch4: ['Combustión del metano (agua gaseosa)', { CH4: -1, O2: -2, CO2: 1, H2O: 2 }, { CH4: 'CH4(g)', O2: 'O2(g)', CO2: 'CO2(g)', H2O: 'H2O(g)' }],
    haber: ['Síntesis de amoníaco', { N2: -1, H2: -3, NH3: 2 }, { N2: 'N2(g)', H2: 'H2(g)', NH3: 'NH3(g)' }],
    hyd: ['Hidrogenación del eteno', { C2H4: -1, H2: -1, C2H6: 1 }, { C2H4: 'C2H4(g)', H2: 'H2(g)', C2H6: 'C2H6(g)' }],
    hcl: ['Formación de HCl', { H2: -1, Cl2: -1, HCl: 2 }, { H2: 'H2(g)', Cl2: 'Cl2(g)', HCl: 'HCl(g)' }],
    etoh: ['Combustión del etanol (agua gaseosa)', { C2H5OH: -1, O2: -3, CO2: 2, H2O: 3 }, { C2H5OH: 'C2H5OH(g)', O2: 'O2(g)', CO2: 'CO2(g)', H2O: 'H2O(g)' }],
    acet: ['Hidrogenación del etino a eteno', { C2H2: -1, H2: -1, C2H4: 1 }, { C2H2: 'C2H2(g)', H2: 'H2(g)', C2H4: 'C2H4(g)' }]
  };
  EM.defineSim('enlaces', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('rx', { label: 'Reacción (todas las especies en gas)', options: Object.entries(BRX).map(([k, v]) => [k, v[0]]), value: 'ch4' });
    sim.out('rot', 'Enlaces rotos (reactivos)', {});
    sim.out('form', 'Enlaces formados (productos)');
    sim.out('est', 'Δ<sub>r</sub><i>H</i> estimada = ΣD(rotos) − ΣD(formados)', { hl: true });
    sim.out('real', 'Δ<sub>r</sub><i>H</i>° de las entalpías de formación');
    sim.out('err', 'Desviación');
    const B = DAT.bond;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, nu, map] = BRX[p.rx];
      EM.draw.clear(cv);
      const side = (sgn) => { const t = {}; for (const [sp, v] of Object.entries(nu)) if (sgn * v > 0) for (const [b, n] of Object.entries(BONDS[sp])) t[b] = (t[b] || 0) + n * Math.abs(v); return t; };
      const broken = side(-1), formed = side(1);
      const E = (t) => Object.entries(t).reduce((s, [b, n]) => s + n * B[b], 0);
      const Eb = E(broken), Ef = E(formed), est = Eb - Ef;
      const real = Object.entries(nu).reduce((s, [sp, v]) => s + v * FQ.tt[map[sp]].H, 0);
      const labelB = (b) => b.replace('(CO2)', '').replace('#', '≡');
      const fmt = (t) => Object.entries(t).map(([b, n]) => n + '×' + labelB(b)).join(' · ');
      const hi = Math.max(Eb, Ef) * 1.12, y = (v) => H - 34 - (v / hi) * (H - 78);
      const bx = [W * 0.14, W * 0.42], bw = Math.min(W * 0.2, 130);
      ctx.save();
      ctx.fillStyle = EM.alpha('--c1', 0.35); ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2;
      ctx.fillRect(bx[0], y(Eb), bw, y(0) - y(Eb)); ctx.strokeRect(bx[0], y(Eb), bw, y(0) - y(Eb));
      ctx.fillStyle = EM.alpha('--c2', 0.35); ctx.strokeStyle = EM.col('--c2');
      ctx.fillRect(bx[1], y(Ef), bw, y(0) - y(Ef)); ctx.strokeRect(bx[1], y(Ef), bw, y(0) - y(Ef));
      ctx.restore();
      EM.text(ctx, 'romper: +' + EM.fix(Eb, 0) + ' kJ', bx[0] + bw / 2, y(Eb) - 10, { size: 12, color: '--c1', align: 'center', weight: 600 });
      EM.text(ctx, 'formar: −' + EM.fix(Ef, 0) + ' kJ', bx[1] + bw / 2, y(Ef) - 10, { size: 12, color: '--c2', align: 'center', weight: 600 });
      EM.text(ctx, 'átomos libres', bx[0] + bw / 2 + 0, y(0) + 14, { size: 11.5, color: '--ink-3', align: 'center' });
      /* comparación */
      const x0 = W * 0.7, mx = Math.max(Math.abs(est), Math.abs(real), 1) * 1.15, zero = H / 2 + 10, sc = (H * 0.32) / mx;
      ctx.strokeStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.moveTo(x0 - 10, zero); ctx.lineTo(W - 10, zero); ctx.stroke();
      const bar = (x, v, col, l) => { ctx.fillStyle = EM.alpha(col, 0.45); ctx.strokeStyle = EM.col(col); ctx.lineWidth = 2; const hh = v * sc; ctx.fillRect(x, hh < 0 ? zero : zero - hh, W * 0.1, Math.abs(hh)); ctx.strokeRect(x, hh < 0 ? zero : zero - hh, W * 0.1, Math.abs(hh)); EM.text(ctx, EM.fix(v, 0), x + W * 0.05, hh < 0 ? zero + 16 : zero - hh - 8 - 0, { size: 12, align: 'center', weight: 700 }); EM.text(ctx, l, x + W * 0.05, hh < 0 ? zero - 8 : zero + 16, { size: 11.5, color: '--ink-2', align: 'center' }); };
      bar(x0, est, '--c4', 'enlaces'); bar(x0 + W * 0.14, real, '--c3', 'Hess');
      EM.text(ctx, 'Δ_rH (kJ/mol)', x0 + W * 0.1, 18, { size: 12, color: '--ink-2', align: 'center' });
      sim.set('rot', fmt(broken) + ' = ' + EM.fix(Eb, 0) + ' kJ');
      sim.set('form', fmt(formed) + ' = ' + EM.fix(Ef, 0) + ' kJ');
      sim.set('est', EM.fix(est, 0) + ' kJ/mol');
      sim.set('real', EM.fix(real, 1) + ' kJ/mol');
      sim.set('err', EM.fix(est - real, 0) + ' kJ/mol (' + EM.fix((100 * (est - real)) / Math.abs(real), 1) + ' %)');
    });
  });

  /* 3.5 Ciclo de Born–Haber */
  EM.defineSim('born-haber', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.select('M', { label: 'Catión', options: Object.keys(DAT.born.M).map((k) => [k, k + '⁺']), value: 'Na' });
    sim.select('X', { label: 'Anión', options: Object.keys(DAT.born.X).map((k) => [k, k + '⁻']), value: 'Cl' });
    sim.out('U', 'Energía reticular (ciclo de Born–Haber)', { hl: true });
    sim.out('UBM', 'Estimación de Born–Mayer (electrostática)');
    sim.out('r0', 'Distancia catión–anión <i>r</i><sub>0</sub>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const b = FQ.born(p.M, p.X);
      const steps = [['M(s) → M(g)', b.sub, '+'], ['M(g) → M⁺(g) + e⁻', b.IE, '+'], ['½X₂ → X(g)', b.atom, '+'], ['X(g) + e⁻ → X⁻(g)', b.EA, ''], ['M⁺(g) + X⁻(g) → MX(s)', b.U, '']];
      const levels = [0]; steps.forEach((s) => levels.push(levels[levels.length - 1] + s[1]));
      const total = levels[levels.length - 1];
      const lo = Math.min(...levels, b.Hf) - 80, hi = Math.max(...levels) + 80, yv = (v) => H - 30 - ((v - lo) / (hi - lo)) * (H - 70);
      const n = steps.length + 1, colw = (W - 150) / n;
      ctx.strokeStyle = EM.col('--rule'); ctx.beginPath(); ctx.moveTo(30, yv(0)); ctx.lineTo(W - 10, yv(0)); ctx.stroke();
      EM.text(ctx, 'M(s) + ½ X₂', 34, yv(0) + 14, { size: 11, color: '--ink-3' });
      for (let i = 0; i < steps.length; i++) {
        const x = 50 + colw * i + colw * 0.5, a = levels[i], c = levels[i + 1];
        const col = steps[i][1] >= 0 ? '--c2' : '--c1';
        EM.draw.arrow(ctx, x, yv(a), x, yv(c), { color: i === steps.length - 1 ? '--accent' : col, width: 2.6 });
        EM.text(ctx, (steps[i][1] > 0 ? '+' : '') + EM.fix(steps[i][1], 1), x + 8, (yv(a) + yv(c)) / 2, { size: 12, weight: 700, color: '--ink', halo: true });
        EM.text(ctx, steps[i][0], x, Math.max(yv(Math.max(a, c)) - 10, 12), { size: 10.5, color: '--ink-2', align: 'center' });
      }
      const xf = 50 + colw * steps.length + colw * 0.5;
      EM.draw.arrow(ctx, xf, yv(0), xf, yv(b.Hf), { color: '--c3', width: 3 });
      EM.text(ctx, 'Δ_fH° = ' + EM.fix(b.Hf, 1), xf + 8, (yv(0) + yv(b.Hf)) / 2, { size: 12, weight: 700, color: '--c3', halo: true });
      EM.text(ctx, 'formación directa', xf, yv(0) - 10, { size: 10.5, color: '--ink-2', align: 'center' });
      EM.text(ctx, 'Σ de los pasos = ' + EM.fix(total, 1) + ' kJ/mol (debe igualar ΔfH°)', W / 2, H - 8, { size: 11.5, color: '--ink-3', align: 'center' });
      sim.set('U', EM.fix(b.U, 1) + ' kJ/mol');
      sim.set('UBM', EM.fix(b.UBM, 1) + ' kJ/mol (' + EM.fix((100 * (b.UBM - b.U)) / b.U, 1) + ' %)');
      sim.set('r0', EM.fix(b.r0, 0) + ' pm (radios de Shannon)');
    });
  });
})();
