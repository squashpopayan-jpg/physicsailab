/* Capítulo 6 — Equilibrio iónico en disolución acuosa */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, A = FQ.ACIDS;
  const opts = (keys) => keys.map((k) => [k, A[k].n + ' (' + A[k].f + ')']);

  /* 6.1 Diagrama de especiación */
  EM.defineSim('especiacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.select('a', { label: 'Sistema ácido–base', options: opts(Object.keys(A)), value: 'fosforico' });
    sim.slider('pH', { label: 'pH', min: 0, max: 14, step: 0.01, value: 7.2, fmt: (v) => v.toFixed(2) });
    sim.out('f', 'Fracciones α de cada especie (de la más protonada a la menos)', { hl: true });
    sim.out('z', 'Carga media por molécula');
    sim.out('pi', 'pH en el que la carga media es 0 (punto isoeléctrico)');
    sim.out('pk', 'p<i>K</i><sub>a</sub>');
    const COL = ['--c1', '--c3', '--c4', '--c2', '--c5'];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, ac = A[p.a], n = ac.pKa.length;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 14, ymin: 0, ymax: 1.02, xlabel: 'pH', ylabel: 'fracción de la especie, α', ml: 52 });
      pl.frame();
      const pHs = []; for (let i = 0; i <= 280; i++) pHs.push(i / 20);
      for (let k = 0; k <= n; k++) pl.xy(pHs, pHs.map((x) => FQ.alpha(ac.pKa, x)[k]), { color: COL[k], width: 2.4 });
      ac.pKa.forEach((pk) => pl.vline(pk, { color: '--ink-3', label: 'pKa ' + pk, labelY: 24 }));
      pl.vline(p.pH, { color: '--accent' });
      const al = FQ.alpha(ac.pKa, p.pH);
      al.forEach((a, k) => pl.dot(p.pH, a, { color: COL[k], r: 4.5 }));
      pl.legend(al.map((_, k) => ({ label: 'α' + k + ' (' + k + ' H⁺ perdido' + (k === 1 ? '' : 's') + ')', color: COL[k] })), 'tr');
      sim.set('f', al.map((a, k) => 'α' + k + ' = ' + EM.fix(a, 4)).join(' · '));
      sim.set('z', EM.fix(FQ.meanCharge(ac, p.pH), 3));
      const q0 = FQ.meanCharge(ac, 0), q1 = FQ.meanCharge(ac, 14);
      sim.set('pi', q0 * q1 < 0 ? EM.fix(FQ.bisect((x) => FQ.meanCharge(ac, x), 0, 14), 2) : 'no existe (la carga no cambia de signo)');
      sim.set('pk', ac.pKa.join(' · '));
    });
  });

  /* 6.2 Curvas de valoración */
  const ANA = {
    HCl: { n: 'HCl 0.1 M con NaOH (ácido fuerte)', ac: { pKa: [], z0: 0 }, S0: -1, sign: 1 },
    acetico: { n: 'Ácido acético con NaOH', ac: A.acetico, S0: 0, sign: 1 },
    formico: { n: 'Ácido fórmico con NaOH', ac: A.formico, S0: 0, sign: 1 },
    HCN: { n: 'Ácido cianhídrico con NaOH', ac: A.HCN, S0: 0, sign: 1 },
    fosforico: { n: 'Ácido fosfórico con NaOH', ac: A.fosforico, S0: 0, sign: 1 },
    citrico: { n: 'Ácido cítrico con NaOH', ac: A.citrico, S0: 0, sign: 1 },
    NH3: { n: 'Amoníaco con HCl (base débil)', ac: A.NH4, S0: 0, sign: -1 },
    Na2CO3: { n: 'Carbonato de sodio con HCl', ac: A.carbonico, S0: 2, sign: -1 },
    glicina: { n: 'Glicina (catión) con NaOH', ac: A.glicina, S0: 0, sign: 1 }
  };
  const IND = { none: ['Sin indicador', 0, 0], naranja: ['Naranja de metilo (3.1–4.4)', 3.1, 4.4], rojo: ['Rojo de metilo (4.4–6.2)', 4.4, 6.2], azul: ['Azul de bromotimol (6.0–7.6)', 6.0, 7.6], fenol: ['Fenolftaleína (8.2–10.0)', 8.2, 10.0] };
  EM.defineSim('titulacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('s', { label: 'Valoración', options: Object.entries(ANA).map(([k, v]) => [k, v.n]), value: 'acetico' });
    sim.slider('C', { label: 'Concentración del analito', min: 0.001, max: 1, step: 0.001, value: 0.1, unit: 'mol/L', log: true, fmt: (v) => v.toPrecision(2) });
    sim.slider('Ct', { label: 'Concentración del titulante', min: 0.001, max: 1, step: 0.001, value: 0.1, unit: 'mol/L', log: true, fmt: (v) => v.toPrecision(2) });
    sim.slider('V', { label: 'Volumen de titulante añadido', min: 0, max: 60, step: 0.1, value: 12.5, unit: 'mL', fmt: (v) => v.toFixed(1) });
    sim.select('ind', { label: 'Indicador', options: Object.entries(IND).map(([k, v]) => [k, v[0]]), value: 'fenol' });
    sim.out('pH', 'pH en el volumen elegido', { hl: true });
    sim.out('eq', 'Puntos de equivalencia (volumen · pH)');
    sim.out('beta', 'Capacidad tampón β = dn/dpH');
    sim.out('hh', 'Henderson–Hasselbalch (pH = p<i>K</i><sub>a</sub> + log[A⁻]/[HA]) en este punto');
    const Va = 25;
    const pHat = (s, p, v) => FQ.titration(s.ac, p.C, Va, p.Ct, s.sign, v, s.S0);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, s = ANA[p.s];
      EM.draw.clear(cv);
      const nsteps = s.ac.pKa.length || 1, strongEq = (p.C * Va) / p.Ct, Vmax = Math.max(60, Math.min(250, strongEq * (nsteps + 0.6)));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Vmax, ymin: 0, ymax: 14, xlabel: 'volumen de titulante (mL)', ylabel: 'pH', ml: 46 });
      pl.frame();
      const ind = IND[p.ind];
      if (p.ind !== 'none') { const ctx2 = ctx; ctx2.save(); ctx2.fillStyle = EM.alpha('--c2', 0.14); ctx2.fillRect(pl.ix, pl.Y(ind[2]), pl.iw, pl.Y(ind[1]) - pl.Y(ind[2])); ctx2.restore(); }
      const xs = [], ys = [];
      for (let i = 0; i <= 600; i++) { const v = (Vmax * i) / 600; xs.push(v); ys.push(pHat(s, p, v)); }
      pl.xy(xs, ys, { color: '--c1', width: 2.6 });
      /* equivalencias: a n · V_eq con n = 1..nsteps (ácido poliprótico) o 1 para ácido fuerte; Na2CO3 igual */
      const eqs = []; for (let k = 1; k <= nsteps; k++) { const ve = (k * p.C * Va) / p.Ct; if (ve < Vmax) { eqs.push([ve, pHat(s, p, ve)]); pl.dot(ve, eqs[eqs.length - 1][1], { color: '--c2', label: 'V_eq' + (nsteps > 1 ? k : '') }); } }
      pl.vline(p.V, { color: '--accent' }); pl.dot(p.V, pHat(s, p, p.V), { color: '--accent' });
      for (const pk of s.ac.pKa) { const ve = ((s.ac.pKa.indexOf(pk) + 0.5) * p.C * Va) / p.Ct; if (ve < Vmax) pl.dot(ve, pk, { color: '--c3', r: 3.5 }); }
      pl.legend([{ label: 'curva de valoración', color: '--c1' }, { label: 'equivalencia', color: '--c2', kind: 'dot' }, { label: 'semiequivalencia: pH = pKa', color: '--c3', kind: 'dot' }], 'br');
      const ph = pHat(s, p, p.V);
      sim.set('pH', EM.fix(ph, 2));
      sim.set('eq', eqs.map((e) => EM.fix(e[0], 1) + ' mL · pH ' + EM.fix(e[1], 2)).join(' ; ') || '—');
      const dV = Math.max(0.01, p.V * 0.001), dn = p.Ct * 2 * dV * 1e-3, dpH = pHat(s, p, p.V + dV) - pHat(s, p, Math.max(0, p.V - dV));
      sim.set('beta', EM.sci(Math.abs(dn / dpH), 2) + ' mol/pH (en 1 L: ' + EM.sci(Math.abs((dn / dpH) * (1000 / (Va + p.V))), 2) + ' mol/L·pH)');
      const al = FQ.alpha(s.ac.pKa, ph);
      sim.set('hh', s.ac.pKa.length === 1 ? 'log(α₁/α₀) = ' + EM.fix(Math.log10(al[1] / al[0]), 2) + ' → pKa + log = ' + EM.fix(s.ac.pKa[0] + Math.log10(al[1] / al[0]), 2) : '(sistema poliprótico: ver especiación)');
    });
  });

  /* 6.3 Sistema del carbono: lluvia y océano */
  EM.defineSim('oceano', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('f', { label: 'Fugacidad de CO₂ del aire, fCO₂', min: 150, max: 2000, step: 1, value: 425, unit: 'µatm', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('TA', { label: 'Alcalinidad total del agua de mar', min: 2000, max: 2500, step: 5, value: 2300, unit: 'µmol/kg', fmt: (v) => v.toFixed(0) });
    sim.seg('y', { label: 'Variable graficada', options: [['pH', 'pH'], ['co3', '[CO₃²⁻]'], ['om', 'Ω calcita']], value: 'pH' });
    sim.out('pH', 'pH (escala total)', { hl: true });
    sim.out('spec', 'DIC · CO₂(aq) · HCO₃⁻ · CO₃²⁻ (µmol/kg)');
    sim.out('om', 'Estado de saturación de la calcita Ω = [Ca²⁺][CO₃²⁻]/<i>K</i><sub>ps</sub>*');
    sim.out('rev', 'Factor de Revelle');
    sim.out('rain', 'Lluvia «limpia» (agua pura con este CO₂): pH');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const get = (f) => { const r = FQ.seawater(f, p.TA); return p.y === 'pH' ? r.pH : p.y === 'co3' ? r.co3 : r.omega; };
      const lab = { pH: 'pH (escala total)', co3: '[CO₃²⁻] (µmol/kg)', om: 'Ω de la calcita' }[p.y];
      const ys = []; for (let i = 0; i <= 100; i++) ys.push(get(150 * Math.pow(2000 / 150, i / 100)));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 150, xmax: 2000, ymin: Math.min(...ys) * (p.y === 'pH' ? 0.995 : 0.9), ymax: Math.max(...ys) * (p.y === 'pH' ? 1.005 : 1.1), xlog: true, xlabel: 'fCO₂ (µatm)', ylabel: lab, ml: 56 });
      pl.frame();
      pl.fn((f) => get(f), { color: '--c1', width: 2.6, n: 160 });
      for (const [f, t] of [[280, '1750'], [425, '2025'], [900, 'SSP5-8.5 en 2100']]) { pl.vline(f, { color: '--ink-3', label: t, labelY: 14 }); }
      pl.vline(p.f, { color: '--accent' }); pl.dot(p.f, get(p.f), { color: '--accent' });
      if (p.y === 'om') pl.hline(1, { color: '--c2', label: 'Ω = 1 (la calcita empieza a disolverse)' });
      const r = FQ.seawater(p.f, p.TA);
      sim.set('pH', EM.fix(r.pH, 3));
      sim.set('spec', EM.fix(r.dic, 0) + ' · ' + EM.fix(r.co2, 1) + ' · ' + EM.fix(r.hco3, 0) + ' · ' + EM.fix(r.co3, 0));
      sim.set('om', EM.fix(r.omega, 2) + (r.omega < 1 ? ' (subsaturada: la calcita se disuelve)' : ''));
      sim.set('rev', EM.fix(FQ.revelle(p.f, p.TA), 2));
      sim.set('rain', EM.fix(FQ.rainPH(p.f), 2));
    });
  });

  /* 6.4 Solubilidad */
  EM.defineSim('solubilidad', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('s', { label: 'Sal', options: [['AgCl', 'AgCl en NaCl (ion común y complejos)'], ['Mg', 'Mg(OH)₂ frente al pH'], ['CaF2', 'CaF₂ frente al pH (HF)'], ['CaCO3', 'CaCO₃ frente al pH (sistema cerrado)']], value: 'AgCl' });
    sim.slider('x', { label: 'Variable: pH, o log₁₀[Cl⁻]', min: -6, max: 1, step: 0.01, value: -2, fmt: (v) => v.toFixed(2) });
    sim.out('S', 'Solubilidad molar', { hl: true });
    sim.out('K', 'Producto de solubilidad (25 °C)');
    sim.out('x', 'En el punto elegido');
    const Ksp = FQ.KSP;
    sim.onChange = (id) => { if (id === 's') { const a = sim.p.s === 'AgCl'; sim.ctl.x.range(a ? -6 : 0, a ? 1 : 14, 0.01); sim.ctl.x.set(a ? -2 : 8, true); sim.ctl.x.label(a ? 'log₁₀[Cl⁻] (mol/L)' : 'pH'); } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, ag = p.s === 'AgCl';
      EM.draw.clear(cv);
      const f = ag ? (x) => FQ.agclSol(Math.pow(10, x)).total : p.s === 'Mg' ? FQ.mgOH2Sol : p.s === 'CaF2' ? FQ.caF2Sol : FQ.caCO3Sol;
      const xmin = ag ? -6 : 0, xmax = ag ? 1 : 14;
      const xs = [], ys = []; for (let i = 0; i <= 280; i++) { const x = xmin + ((xmax - xmin) * i) / 280; xs.push(x); ys.push(f(x)); }
      const lo = Math.max(1e-12, Math.min(...ys)), hi = Math.min(10, Math.max(...ys));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin, xmax, ymin: Math.pow(10, Math.floor(Math.log10(lo)) - 0), ymax: Math.pow(10, Math.ceil(Math.log10(hi))), ylog: true, xlabel: ag ? 'log₁₀[Cl⁻] (mol/L)' : 'pH', ylabel: 'solubilidad (mol/L)', ml: 56 });
      pl.frame();
      if (ag) {
        pl.xy(xs, xs.map((x) => FQ.agclSol(Math.pow(10, x)).ag), { color: '--c1', width: 1.4, dash: [5, 4] });
        pl.xy(xs, xs.map((x) => FQ.agclSol(Math.pow(10, x)).agcl2), { color: '--c5', width: 1.4, dash: [5, 4] });
        pl.xy(xs, xs.map((x) => FQ.agclSol(Math.pow(10, x)).agcl), { color: '--c4', width: 1.4, dash: [5, 4] });
        pl.legend([{ label: 'plata total', color: '--c2' }, { label: 'Ag⁺', color: '--c1', dash: [5, 4] }, { label: 'AgCl(aq)', color: '--c4', dash: [5, 4] }, { label: 'AgCl₂⁻', color: '--c5', dash: [5, 4] }], 'tr');
      }
      pl.xy(xs, ys, { color: '--c2', width: 2.8 });
      const v = f(p.x); pl.vline(p.x, { color: '--accent' }); pl.dot(p.x, v, { color: '--accent' });
      sim.set('S', EM.sci(v, 3) + ' mol/L (' + EM.sci(v * { AgCl: 143.32, Mg: 58.32, CaF2: 78.07, CaCO3: 100.09 }[p.s] * 1000, 2) + ' mg/L)');
      sim.set('K', EM.sci({ AgCl: Ksp.AgCl, Mg: Ksp['Mg(OH)2'], CaF2: Ksp.CaF2, CaCO3: Ksp.CaCO3 }[p.s], 3));
      sim.set('x', ag ? '[Cl⁻] = ' + EM.sci(Math.pow(10, p.x), 2) + ' mol/L' : 'pH = ' + EM.fix(p.x, 2));
    });
  });
})();
