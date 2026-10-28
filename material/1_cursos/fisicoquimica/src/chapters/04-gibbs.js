/* Capítulo 4 — Entropía absoluta, tercera ley y energía de Gibbs de reacción */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, R = FQ.R;

  /* 4.1 Entropía de un metal desde cero absoluto: red de Debye + electrones */
  const MN = { Cu: 'Cobre', Ag: 'Plata', Al: 'Aluminio', Pb: 'Plomo', Zn: 'Zinc', Fe: 'Hierro', Ni: 'Níquel', Mg: 'Magnesio', Ca: 'Calcio', Ti: 'Titanio', Si: 'Silicio' };
  EM.defineSim('entropia-T', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.select('m', { label: 'Elemento', options: Object.entries(MN), value: 'Cu' });
    sim.slider('th', { label: 'Temperatura de Debye θ', min: 50, max: 800, step: 1, value: 343, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.check('el', { label: 'Incluir la entropía electrónica γ<i>T</i>', value: true });
    sim.button('Ajustar θ a la entropía de 298 K', () => { fit(); }, { primary: true });
    sim.out('S', '<i>S</i>(298.15 K): modelo · tabla NBS', { hl: true });
    sim.out('d', 'Diferencia');
    sim.out('Cv', '<i>C</i><sub>V</sub> a 298 K y límite de Dulong–Petit (3<i>R</i> = 24.94)');
    sim.out('T3', 'Ley <i>T</i>³ a 10 K: <i>C</i><sub>V</sub>');
    const S298 = () => FQ.tt[sim.p.m + '(s)'].S, M = () => FQ.METAL[sim.p.m];
    const model = (T) => FQ.debyeS(T, sim.p.th) + (sim.p.el ? M().g * 1e-3 * T : 0);
    const fit = () => { const th = FQ.bisect((x) => model298(x) - S298(), 20, 3000); if (isFinite(th)) sim.ctl.th.set(Math.min(800, th)); };
    const model298 = (th) => FQ.debyeS(298.15, th) + (sim.p.el ? M().g * 1e-3 * 298.15 : 0);
    sim.onChange = (id) => { if (id === 'm') sim.ctl.th.set(M().th, true); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const ymax = Math.max(S298() * 1.25, model(400) * 1.05);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 400, ymin: 0, ymax, xlabel: 'T (K)', ylabel: 'S (J/mol·K)', ml: 56 });
      pl.frame();
      pl.fn((T) => (T < 0.5 ? 0 : model(T)), { color: '--c1', width: 2.4, n: 160 });
      pl.fn((T) => (T < 0.5 ? 0 : FQ.debyeS(T, p.th)), { color: '--ink-3', width: 1.2, dash: [5, 4], n: 160 });
      pl.dot(298.15, S298(), { color: '--c2', label: 'S° tabulada = ' + EM.fix(S298(), 2), dx: -8, dy: -12, align: 'right' });
      pl.vline(p.th, { color: '--c3', label: 'θ' });
      pl.legend([{ label: 'modelo: Debye' + (p.el ? ' + electrones' : ''), color: '--c1' }, { label: 'solo red', color: '--ink-3', dash: [5, 4] }, { label: 'dato calorimétrico (298 K)', color: '--c2', kind: 'dot' }], 'br');
      const m = model(298.15);
      sim.set('S', EM.fix(m, 2) + ' · ' + EM.fix(S298(), 2) + ' J/mol·K');
      sim.set('d', EM.fix(m - S298(), 2) + ' J/mol·K (' + EM.fix((100 * (m - S298())) / S298(), 1) + ' %)');
      sim.set('Cv', EM.fix(FQ.debyeCv(298.15, p.th), 2) + ' · 24.94 J/mol·K');
      sim.set('T3', EM.fix(FQ.debyeCv(10, p.th) * 1e3, 3) + ' mJ/mol·K (= (12π⁴/5)R(T/θ)³ = ' + EM.fix(((12 * Math.PI ** 4) / 5) * R * Math.pow(10 / p.th, 3) * 1e3, 3) + ')');
    });
  });

  /* 4.2 Entropía de reacción y moles de gas */
  const NR = [
    ['N₂ + 3H₂ → 2NH₃', { 'N2(g)': -1, 'H2(g)': -3, 'NH3(g)': 2 }], ['N₂O₄ → 2NO₂', { 'N2O4(g)': -1, 'NO2(g)': 2 }],
    ['CaCO₃(s) → CaO(s) + CO₂', { 'CaCO3(s)': -1, 'CaO(s)': 1, 'CO2(g)': 1 }], ['CH₄ + 2O₂ → CO₂ + 2H₂O(l)', { 'CH4(g)': -1, 'O2(g)': -2, 'CO2(g)': 1, 'H2O(l)': 2 }],
    ['H₂ + ½O₂ → H₂O(l)', { 'H2(g)': -1, 'O2(g)': -0.5, 'H2O(l)': 1 }], ['2NO + O₂ → 2NO₂', { 'NO(g)': -2, 'O2(g)': -1, 'NO2(g)': 2 }],
    ['C(gr) + O₂ → CO₂', { 'C(gr)': -1, 'O2(g)': -1, 'CO2(g)': 1 }], ['C(gr) + ½O₂ → CO', { 'C(gr)': -1, 'O2(g)': -0.5, 'CO(g)': 1 }],
    ['CO + ½O₂ → CO₂', { 'CO(g)': -1, 'O2(g)': -0.5, 'CO2(g)': 1 }], ['H₂ + Cl₂ → 2HCl', { 'H2(g)': -1, 'Cl2(g)': -1, 'HCl(g)': 2 }],
    ['C₂H₄ + H₂ → C₂H₆', { 'C2H4(g)': -1, 'H2(g)': -1, 'C2H6(g)': 1 }], ['2SO₂ + O₂ → 2SO₃', { 'SO2(g)': -2, 'O2(g)': -1, 'SO3(g)': 2 }],
    ['H₂O(l) → H₂O(g)', { 'H2O(l)': -1, 'H2O(g)': 1 }], ['CH₃OH(l) → CH₃OH(g)', { 'CH3OH(l)': -1, 'CH3OH(g)': 1 }],
    ['C₆H₆(l) → C₆H₆(g)', { 'C6H6(l)': -1, 'C6H6(g)': 1 }], ['C₂H₅OH(l) → C₂H₅OH(g)', { 'C2H5OH(l)': -1, 'C2H5OH(g)': 1 }],
    ['CH₄ + H₂O(g) → CO + 3H₂', { 'CH4(g)': -1, 'H2O(g)': -1, 'CO(g)': 1, 'H2(g)': 3 }], ['C(gr) + CO₂ → 2CO', { 'C(gr)': -1, 'CO2(g)': -1, 'CO(g)': 2 }],
    ['Fe₂O₃ + 3C → 2Fe + 3CO', { 'Fe2O3(s)': -1, 'C(gr)': -3, 'Fe(s)': 2, 'CO(g)': 3 }], ['2H₂O(l) → 2H₂ + O₂', { 'H2O(l)': -2, 'H2(g)': 2, 'O2(g)': 1 }],
    ['C(gr) → C(diam)', { 'C(gr)': -1, 'C(diam)': 1 }], ['H₂O₂(l) → H₂O(l) + ½O₂', { 'H2O2(l)': -1, 'H2O(l)': 1, 'O2(g)': 0.5 }],
    ['CaO + CO₂ → CaCO₃', { 'CaO(s)': -1, 'CO2(g)': -1, 'CaCO3(s)': 1 }], ['NaCl(s) → Na⁺(aq) + Cl⁻(aq)', { 'NaCl(s)': -1, 'Na+(aq)': 1, 'Cl-(aq)': 1 }]
  ];
  const dng = (nu) => Object.entries(nu).reduce((s, [k, v]) => s + (FQ.tt[k].st === 'g' ? v : 0), 0);
  EM.defineSim('entropia-dn', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('r', { label: 'Resaltar la reacción', options: NR.map((r, i) => [i, r[0]]), value: 0 });
    sim.out('dn', 'Δ<i>n</i><sub>gas</sub>', { hl: true });
    sim.out('S', 'Δ<sub>r</sub><i>S</i>°');
    sim.out('fit', 'Ajuste Δ<sub>r</sub><i>S</i>° = <i>a</i> + <i>b</i>·Δ<i>n</i><sub>gas</sub>');
    const pts = NR.map((r) => [dng(r[1]), FQ.rxn(r[1]).S]);
    const lf = FQ.linfit(pts.map((q) => q[0]), pts.map((q) => q[1]));
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, i = +p.r;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -3.5, xmax: 3.5, ymin: -260, ymax: 560, xlabel: 'Δn de gas de la reacción', ylabel: 'Δ_rS° (J/mol·K)', ml: 56 });
      pl.frame();
      pl.fn((x) => lf.a + lf.b * x, { color: '--ink-3', width: 1.4, dash: [6, 4] });
      pts.forEach((q, k) => pl.dot(q[0], q[1], { color: k === i ? '--accent' : '--c1', r: k === i ? 6 : 3.8 }));
      pl.dot(pts[i][0], pts[i][1], { color: '--accent', r: 6, label: NR[i][0], dx: 9, dy: -9 });
      sim.set('dn', EM.fix(pts[i][0], 1));
      sim.set('S', EM.fix(pts[i][1], 1) + ' J/mol·K');
      sim.set('fit', EM.fix(lf.a, 0) + ' + ' + EM.fix(lf.b, 0) + '·Δn  (r² = ' + EM.fix(lf.r2, 2) + ')');
    });
  });

  /* 4.3 Plano ΔH–TΔS: signo de ΔG */
  EM.defineSim('hs-plano', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.slider('T', { label: 'Temperatura', min: 200, max: 2000, step: 5, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.select('r', { label: 'Resaltar', options: NR.map((r, i) => [i, r[0]]), value: 3 });
    sim.out('n', 'Reacciones espontáneas (Δ<i>G</i>° < 0) a esta <i>T</i>', { hl: true });
    sim.out('sel', 'Reacción resaltada: Δ<i>H</i>°, <i>T</i>Δ<i>S</i>°, Δ<i>G</i>°');
    sim.out('Tx', 'Temperatura de inversión Δ<i>H</i>°/Δ<i>S</i>° (supuestas constantes)');
    const rx = NR.map((r) => FQ.rxn(r[1]));
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, T = p.T, i = +p.r;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -1000, xmax: 400, ymin: -600, ymax: 700, xlabel: 'Δ_rH° (kJ/mol)', ylabel: 'T·Δ_rS° (kJ/mol)', ml: 56 });
      pl.frame();
      /* regiones: ΔG = ΔH − TΔS < 0 ⇔ TΔS > ΔH */
      ctx.save(); ctx.beginPath(); ctx.rect(pl.ix, pl.iy, pl.iw, pl.ih); ctx.clip();
      ctx.fillStyle = EM.alpha('--c3', 0.08);
      ctx.beginPath(); ctx.moveTo(pl.X(-1000), pl.Y(-1000)); ctx.lineTo(pl.X(700), pl.Y(700)); ctx.lineTo(pl.X(700), pl.Y(900)); ctx.lineTo(pl.X(-1000), pl.Y(900)); ctx.closePath(); ctx.fill();
      ctx.restore();
      pl.path([[-1000, -1000], [700, 700]], { color: '--ink-2', width: 1.6, dash: [6, 4] });
      pl.label(-960, -520, 'ΔG° = 0', { size: 11.5, color: '--ink-2' });
      pl.label(-850, 420, 'ΔG° < 0 (espontánea)', { size: 12, color: '--c3', weight: 600 });
      pl.label(120, -300, 'ΔG° > 0', { size: 12, color: '--c2', weight: 600 });
      let nsp = 0;
      rx.forEach((r, k) => { const ts = (T * r.S) / 1e3, g = r.H - ts; if (g < 0) nsp++; pl.dot(r.H, ts, { color: g < 0 ? '--c3' : '--c2', r: k === i ? 6.5 : 4 }); });
      pl.dot(rx[i].H, (T * rx[i].S) / 1e3, { color: '--accent', r: 7, label: NR[i][0], dx: 9, dy: -9 });
      sim.set('n', nsp + ' de ' + NR.length);
      const r = rx[i], ts = (T * r.S) / 1e3;
      sim.set('sel', EM.fix(r.H, 1) + ' · ' + EM.fix(ts, 1) + ' · ' + EM.fix(r.H - ts, 1) + ' kJ/mol');
      sim.set('Tx', r.S !== 0 && r.H / r.S > 0 ? EM.fix((1000 * r.H) / r.S, 0) + ' K' : r.H * r.S < 0 ? 'no existe (ΔG° mantiene su signo)' : '—');
    });
  });

  /* 4.4 Diagrama de Ellingham */
  const EK = ['Ca', 'Mg', 'Al', 'Ti', 'Si', 'Zn', 'Fe', 'Ni', 'Cu'];
  EM.defineSim('ellingham', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.select('m', { label: 'Óxido resaltado', options: EK.map((k) => [k, FQ.ELL[k].n]), value: 'Fe' });
    sim.slider('T', { label: 'Temperatura', min: 300, max: 2000, step: 5, value: 1200, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.check('po', { label: 'Líneas de presión parcial de oxígeno', value: true });
    sim.out('G', 'Δ<sub>f</sub><i>G</i>° del óxido (por mol de O₂)', { hl: true });
    sim.out('p', 'Presión de oxígeno de equilibrio');
    sim.out('red', 'Temperatura de reducción con carbono (a CO)');
    sim.out('can', '¿Reduce el carbono al óxido a esta <i>T</i>?');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, T = p.T, k = p.m;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 300, xmax: 2000, ymin: -1250, ymax: 0, xlabel: 'T (K)', ylabel: 'Δ_fG° (kJ por mol de O₂)', ml: 62, mr: 46 });
      pl.frame();
      if (p.po) {
        for (const e of [0, -10, -20, -30, -40]) {
          pl.path([[300, (R * 300 * Math.log(Math.pow(10, e))) / 1e3], [2000, (R * 2000 * Math.log(Math.pow(10, e))) / 1e3]], { color: '--grid-2', width: 1.1, dash: [2, 3] });
          pl.label(1995, (R * 1995 * Math.log(Math.pow(10, e))) / 1e3, '10^{' + EM.minus(String(e)) + '}', { size: 10, align: 'right', dy: 9, color: '--ink-3' });
        }
      }
      const Ts = []; for (let t = 300; t <= 2000; t += 10) Ts.push(t);
      const draw = (key, col, w, label, y0) => { pl.xy(Ts, Ts.map((t) => FQ.ellG(key, t)), { color: col, width: w }); if (label) pl.label(2000, FQ.ellG(key, 2000), label, { size: 11, dx: 4, align: 'left', dy: y0 || 0, color: col }); };
      EK.forEach((m) => { if (m !== k) draw(m, '--c6', 1.4, m); });
      draw('CO', '--c4', 2.2, 'C→CO'); draw('CO2', '--c4', 1.6, 'C→CO₂', 10); draw('CO_CO2', '--c5', 1.6, 'CO→CO₂'); draw('H2O', '--c1', 1.6, 'H₂→H₂O', 10);
      draw(k, '--accent', 3, k);
      pl.vline(T, { color: '--accent' });
      const g = FQ.ellG(k, T); pl.dot(T, g, { color: '--accent' });
      const gco = FQ.ellG('CO', T);
      /* temperatura de reducción */
      const Tr = FQ.bisect((t) => FQ.ellG(k, t) - FQ.ellG('CO', t), 300, 3000);
      if (isFinite(Tr) && Tr <= 2000) pl.dot(Tr, FQ.ellG('CO', Tr), { color: '--c4', label: EM.fix(Tr, 0) + ' K', dy: -12, r: 5 });
      pl.legend([{ label: 'óxido resaltado', color: '--accent', width: 3 }, { label: 'otros óxidos', color: '--c6' }, { label: 'carbono y CO', color: '--c4' }], 'tl');
      const po2 = Math.exp((g * 1e3) / (R * T));
      sim.set('G', EM.fix(g, 1) + ' kJ/mol');
      sim.set('p', EM.sci(po2, 2) + ' bar');
      sim.set('red', isFinite(Tr) ? EM.fix(Tr, 0) + ' K (' + EM.fix(Tr - 273.15, 0) + ' °C)' : (FQ.ellG(k, 300) > FQ.ellG('CO', 300) ? 'ya a 300 K' : 'por encima de 3000 K'));
      sim.set('can', g > gco ? 'sí: la línea del C→CO queda por debajo' : 'no: el óxido es más estable que el CO');
    });
  });
})();
