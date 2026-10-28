/* Capítulo 13 — Celdas galvánicas, ecuación de Nernst y diagramas de Pourbaix */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, R = FQ.R, F = FQ.F, T0 = 298.15, LN10 = Math.LN10;
  const G = (k) => FQ.tt[k].G * 1e3, S = (k) => FQ.tt[k].S, H = (k) => FQ.tt[k].H * 1e3;

  /* Semirreacciones M^z+ + z e⁻ → M a partir de ΔfG° (convención del electrodo estándar de hidrógeno: ΔfG°(H⁺) = 0) */
  const HALF = [['K⁺/K', 'K+(aq)', 'K(s)', 1], ['Na⁺/Na', 'Na+(aq)', 'Na(s)', 1], ['Mg²⁺/Mg', 'Mg2+(aq)', 'Mg(s)', 2], ['Al³⁺/Al', 'Al3+(aq)', 'Al(s)', 3], ['Zn²⁺/Zn', 'Zn2+(aq)', 'Zn(s)', 2], ['Ni²⁺/Ni', 'Ni2+(aq)', 'Ni(s)', 2], ['Pb²⁺/Pb', 'Pb2+(aq)', 'Pb(s)', 2], ['H⁺/H₂', 'H+(aq)', null, 1], ['Cu²⁺/Cu', 'Cu2+(aq)', 'Cu(s)', 2], ['Ag⁺/Ag', 'Ag+(aq)', 'Ag(s)', 1]];
  const E0 = (h) => G(h[1]) / (h[3] * F); /* E° = +ΔfG°(M^z+)/(zF) para M^z+ + z e⁻ → M */
  const HALFE = HALF.map((h) => ({ n: h[0], ion: h[1], z: h[3], E0: E0(h) }));
  FQ.HALFE = HALFE;

  /* 13.1 Celda galvánica con ecuación de Nernst */
  EM.defineSim('celda-nernst', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    const opt = HALFE.map((h, i) => [i, h.n]);
    sim.select('a', { label: 'Ánodo (se oxida): el de menor E°', options: opt, value: 4 });
    sim.select('c', { label: 'Cátodo (se reduce): el de mayor E°', options: opt, value: 8 });
    sim.slider('ca', { label: 'Concentración del ion del ánodo', min: 1e-4, max: 2, step: 1e-4, value: 1, unit: 'mol/L', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('cc', { label: 'Concentración del ion del cátodo', min: 1e-4, max: 2, step: 1e-4, value: 1, unit: 'mol/L', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('T', { label: 'Temperatura', min: 273, max: 343, step: 0.5, value: 298.15, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.out('E0', 'Potencial estándar <i>E</i>° = <i>E</i>°<sub>cátodo</sub> − <i>E</i>°<sub>ánodo</sub>', { hl: true });
    sim.out('E', 'Potencial de la celda <i>E</i> (Nernst)');
    sim.out('G', 'Δ<sub>r</sub><i>G</i> = −<i>nFE</i> · <i>n</i>');
    sim.out('K', 'Constante de equilibrio <i>K</i> = exp(<i>nFE</i>°/<i>RT</i>)');
    sim.out('w', 'Trabajo eléctrico máximo por mol de reacción');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, Ht = cv.h, a = HALFE[+p.a], c = HALFE[+p.c];
      EM.draw.clear(cv);
      /* reacción global: (n/za) M_a + (n/zc) M_c^zc+ → ... con n = mcm(za, zc) */
      const gcd = (x, y) => (y ? gcd(y, x % y) : x), n = (a.z * c.z) / gcd(a.z, c.z);
      const Ecell0 = c.E0 - a.E0, RT = R * p.T;
      /* Nernst: actividades = concentraciones; el ánodo produce M_a^za+ y el cátodo consume M_c^zc+: Q = [A]^(n/za) / [C]^(n/zc) */
      const lnQ = (n / a.z) * Math.log(p.ca) - (n / c.z) * Math.log(p.cc);
      /* dependencia de E° con T por ΔS° (aprox. a partir de los S° tabulados) */
      const metal = { 'K+(aq)': 'K(s)', 'Na+(aq)': 'Na(s)', 'Mg2+(aq)': 'Mg(s)', 'Al3+(aq)': 'Al(s)', 'Zn2+(aq)': 'Zn(s)', 'Ni2+(aq)': 'Ni(s)', 'Pb2+(aq)': 'Pb(s)', 'Cu2+(aq)': 'Cu(s)', 'Ag+(aq)': 'Ag(s)' };
      /* ΔS de «ox» por ion: S(M^z+) − S(M) (para H⁺, S(H⁺) − ½S(H₂)); los electrones se cancelan en la celda completa */
      const dsOx = (h) => (h.ion === 'H+(aq)' ? S('H+(aq)') - 0.5 * S('H2(g)') : S(h.ion) - S(metal[h.ion]));
      const dSrx = (n / a.z) * dsOx(a) - (n / c.z) * dsOx(c);
      const E = Ecell0 + (dSrx / (n * F)) * (p.T - T0) - (RT / (n * F)) * lnQ;
      /* dibujo: escala de potenciales */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: Ht, xmin: -0.5, xmax: HALFE.length - 0.5, ymin: -3.2, ymax: 1.1, xlabel: '', ylabel: 'E° (V) frente al electrodo estándar de hidrógeno', ml: 56, xticks: HALFE.map((_, i) => i), xfmt: (v) => (HALFE[Math.round(v)] ? HALFE[Math.round(v)].n : '') });
      pl.frame();
      const ord = HALFE.map((h) => h.E0);
      HALFE.forEach((h, i) => pl.dot(i, h.E0, { color: i === +p.a ? '--c2' : i === +p.c ? '--c1' : '--ink-3', r: i === +p.a || i === +p.c ? 6 : 4 }));
      pl.path([[+p.a, a.E0], [+p.c, c.E0]], { color: '--accent', width: 2.4, dash: [6, 4] });
      pl.label((+p.a + +p.c) / 2, (a.E0 + c.E0) / 2, 'E° = ' + EM.fix(Ecell0, 3) + ' V', { size: 12, color: '--accent', weight: 700, dy: -10 });
      pl.hline(0, { color: '--ink-3', label: 'SHE (0 V)' });
      sim.set('E0', EM.fix(Ecell0, 3) + ' V' + (Ecell0 < 0 ? ' (negativo: la reacción no es espontánea; invierta ánodo y cátodo)' : ''));
      sim.set('E', EM.fix(E, 4) + ' V');
      sim.set('G', EM.fix((-n * F * E) / 1e3, 1) + ' kJ/mol · n = ' + n);
      sim.set('K', EM.sci(Math.exp((n * F * Ecell0) / (R * p.T)), 3));
      sim.set('w', EM.fix((n * F * E) / 1e3, 1) + ' kJ por mol de reacción (' + EM.fix((n * F * E) / 3.6e3, 1) + ' Wh)');
    });
  });

  /* 13.2 Diagramas de Pourbaix */
  /* Especies por átomo de metal: [nombre, ΔfG° kJ por átomo de metal, o (átomos de O), h (átomos de H), carga q, sólido?, color] */
  const GW = -237.13;
  const SYS = {
    Cu: { n: 'Cobre', sp: [
      ['Cu', 0, 0, 0, 0, true, '--c4'], ['Cu²⁺', FQ.tt['Cu2+(aq)'].G, 0, 0, 2, false, '--c1'], ['Cu₂O', FQ.tt['Cu2O(s)'].G / 2, 0.5, 0, 0, true, '--c2'], ['CuO', FQ.tt['CuO(s)'].G, 1, 0, 0, true, '--c5']
    ] },
    Fe: { n: 'Hierro (simplificado: sin hidróxidos ni ferratos)', sp: [
      ['Fe', 0, 0, 0, 0, true, '--c4'], ['Fe²⁺', -84.94, 0, 0, 2, false, '--c3'], ['Fe³⁺', -10.54, 0, 0, 3, false, '--c1'], ['Fe₃O₄', FQ.tt['Fe3O4(s)'].G / 3, 4 / 3, 0, 0, true, '--c5'], ['Fe₂O₃', FQ.tt['Fe2O3(s)'].G / 2, 1.5, 0, 0, true, '--c2']
    ] }
  };
  const Geff = (s, E, pH, a) => { const o = s[2], h = s[3], q = s[4], n = q + 2 * o - h; return s[1] * 1e3 - o * GW * 1e3 - (2 * o - h) * R * T0 * LN10 * pH - n * F * E + (s[5] ? 0 : R * T0 * Math.log(a)); };
  EM.defineSim('pourbaix', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.seg('m', { label: 'Metal', options: [['Cu', 'Cobre'], ['Fe', 'Hierro']], value: 'Cu' });
    sim.slider('a', { label: 'Actividad de las especies disueltas', min: 1e-8, max: 1, step: 1e-8, value: 1e-6, unit: 'mol/L', log: true, fmt: (v) => EM.sci(v, 1) });
    sim.slider('pH', { label: 'pH del punto de lectura', min: 0, max: 14, step: 0.05, value: 7, fmt: (v) => v.toFixed(2) });
    sim.slider('E', { label: 'Potencial del punto de lectura (frente a ESH)', min: -1.2, max: 1.8, step: 0.01, value: 0.2, unit: 'V', fmt: (v) => v.toFixed(2) });
    sim.out('sp', 'Especie estable en el punto', { hl: true });
    sim.out('reg', 'Régimen frente a la corrosión (con <i>a</i> = 10⁻⁶ mol/L)');
    sim.out('w', 'Agua: límite del hidrógeno · del oxígeno a este pH');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, Ht = cv.h, sys = SYS[p.m];
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: Ht, xmin: 0, xmax: 14, ymin: -1.2, ymax: 1.8, xlabel: 'pH', ylabel: 'E (V) frente al electrodo estándar de hidrógeno', ml: 54, grid: false });
      pl.frame();
      /* mapa de especies estables por celdas */
      const nx = 140, ny = 120;
      ctx.save(); ctx.beginPath(); ctx.rect(pl.ix, pl.iy, pl.iw, pl.ih); ctx.clip();
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const pH = ((i + 0.5) / nx) * 14, E = 1.8 - ((j + 0.5) / ny) * 3.0;
        let best = 0, bg = Infinity; sys.sp.forEach((s, k) => { const g = Geff(s, E, pH, p.a); if (g < bg) { bg = g; best = k; } });
        ctx.fillStyle = EM.alpha(sys.sp[best][6], 0.30); ctx.fillRect(pl.X(pH - 7 / nx), pl.Y(E + 1.5 / ny), pl.iw / nx + 1, pl.ih / ny + 1);
      }
      ctx.restore();
      /* etiquetas por centroides */
      const cen = sys.sp.map(() => [0, 0, 0]);
      for (let i = 0; i < 70; i++) for (let j = 0; j < 60; j++) { const pH = ((i + 0.5) / 70) * 14, E = 1.8 - ((j + 0.5) / 60) * 3.0; let best = 0, bg = Infinity; sys.sp.forEach((s, k) => { const g = Geff(s, E, pH, p.a); if (g < bg) { bg = g; best = k; } }); cen[best][0] += pH; cen[best][1] += E; cen[best][2]++; }
      sys.sp.forEach((s, k) => { if (cen[k][2] > 25) EM.text(ctx, s[0], pl.X(cen[k][0] / cen[k][2]), pl.Y(cen[k][1] / cen[k][2]), { size: 15, weight: 700, color: s[6], align: 'center', baseline: 'middle', halo: true }); });
      /* agua */
      pl.path([[0, 0], [14, -14 * LN10 * R * T0 / F]], { color: '--ink-2', width: 1.6, dash: [6, 4] });
      pl.path([[0, 1.229], [14, 1.229 - 14 * LN10 * R * T0 / F]], { color: '--ink-2', width: 1.6, dash: [6, 4] });
      pl.label(0.3, 0.1, 'H⁺/H₂', { size: 11, color: '--ink-2' }); pl.label(0.3, 1.32, 'O₂/H₂O', { size: 11, color: '--ink-2' });
      pl.dot(p.pH, p.E, { color: '--accent', r: 6 });
      /* lectura */
      let best = 0, bg = Infinity; sys.sp.forEach((s, k) => { const g = Geff(s, p.E, p.pH, p.a); if (g < bg) { bg = g; best = k; } });
      const sp = sys.sp[best];
      sim.set('sp', sp[0] + (sp[5] ? ' (sólido)' : ' (disuelto)'));
      sim.set('reg', sp[0] === sys.sp[0][0] ? 'inmunidad: el metal es estable, no se corroe' : sp[5] ? 'pasivación: el óxido sólido protege la superficie' : 'corrosión: el metal pasa a ion en disolución');
      sim.set('w', EM.fix(-LN10 * R * T0 * p.pH / F, 2) + ' V · ' + EM.fix(1.229 - LN10 * R * T0 * p.pH / F, 2) + ' V (' + (p.E < -LN10 * R * T0 * p.pH / F ? 'por debajo: el agua se reduce a H₂' : p.E > 1.229 - LN10 * R * T0 * p.pH / F ? 'por encima: el agua se oxida a O₂' : 'dentro de la estabilidad del agua') + ')');
    });
  });

  /* 13.3 Electrodo de vidrio y medidor de pH */
  EM.defineSim('electrodo-ph', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('T', { label: 'Temperatura de la muestra', min: 273.15, max: 353.15, step: 0.5, value: 298.15, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.slider('pH', { label: 'pH de la muestra', min: 0, max: 14, step: 0.01, value: 6.5, fmt: (v) => v.toFixed(2) });
    sim.slider('sl', { label: 'Eficiencia del electrodo (pendiente real/teórica)', min: 0.85, max: 1.0, step: 0.001, value: 0.97, fmt: (v) => (100 * v).toFixed(1) + ' %' });
    sim.slider('off', { label: 'Desplazamiento del cero (asimetría)', min: -30, max: 30, step: 0.5, value: 8, unit: 'mV', fmt: (v) => v.toFixed(1) });
    sim.check('comp', { label: 'Compensación de temperatura', value: true });
    sim.out('s', 'Pendiente teórica de Nernst 2.303<i>RT</i>/<i>F</i>', { hl: true });
    sim.out('E', 'Potencial medido <i>E</i>');
    sim.out('r', 'pH indicado tras calibrar con tampones 4.01 y 7.00 a 25 °C');
    sim.out('er', 'Error de pH');
    const bufpH = (T, p25) => p25 + (T - 298.15) * 0; /* los tampones varían poco (< 0.05 en 0–50 °C) */
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, T = p.T;
      EM.draw.clear(cv);
      const slope = (T_) => (LN10 * R * T_) / F * 1e3; /* mV/pH */
      const Ereal = (pH, T_) => p.off - p.sl * slope(T_) * (pH - 7);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 14, ymin: -450, ymax: 450, xlabel: 'pH', ylabel: 'E (mV)', ml: 52 });
      pl.frame();
      pl.fn((pH) => Ereal(pH, T0), { color: '--c1', width: 2.2 }); pl.fn((pH) => Ereal(pH, T), { color: '--c2', width: 2.4 });
      pl.dot(p.pH, Ereal(p.pH, T), { color: '--accent' });
      pl.legend([{ label: 'electrodo a 25 °C', color: '--c1' }, { label: 'a la temperatura de la muestra', color: '--c2' }], 'tr');
      /* calibración a 25 °C con 4.01 y 7.00 */
      const E4 = Ereal(4.01, T0), E7 = Ereal(7.00, T0), m = (E4 - E7) / (4.01 - 7.00), b = E7 - m * 7.0;
      const Em = Ereal(p.pH, T), pHind = p.comp ? 7 + (Em - b - m * 7) / (m * (T / T0)) : (Em - b) / m;
      sim.set('s', EM.fix(slope(T), 2) + ' mV/pH (a 25 °C: 59.16)');
      sim.set('E', EM.fix(Em, 1) + ' mV');
      sim.set('r', EM.fix(pHind, 3));
      sim.set('er', EM.fix(pHind - p.pH, 3) + ' unidades de pH' + (p.comp ? ' (con compensación)' : ' (sin compensar T)'));
    });
  });
})();
