/* Capítulo 1 — Potencial químico y propiedades molares parciales */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th, FQ = EM.fq, R = FQ.R;

  /* 1.1 Potencial químico del agua: hielo, líquido y vapor frente a la temperatura (referencia: el líquido) */
  EM.defineSim('mu-fases', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('P', { label: 'Presión', min: 0.2, max: 20000, step: 0.01, value: 101.325, unit: 'kPa', log: true, fmt: (v) => (v < 10 ? v.toFixed(2) : v.toFixed(1)) });
    sim.out('Tf', 'Temperatura de fusión', { hl: true });
    sim.out('Tb', 'Temperatura de ebullición (o de sublimación)');
    sim.out('dS', 'Entropía de cambio de fase: pendiente entre líneas');
    const W = TH.agua, M = W.M;
    /* Δμ respecto del líquido, en J/mol.
       Vapor (gas ideal): μ_v − μ_l = RT ln(P/P_sat) − M v_f (P − P_sat), con P_sat de Wagner–Pruß (extrapolada por debajo de 273.16 K).
       Hielo: μ_i − μ_l = −ΔG_fus(T) + (V_hielo − V_líq)(P − P_atm), con ΔH_fus = 6010 J/mol a 273.15 K y ΔC_p = 38 J/mol·K. */
    const dHf = 6010, dCp = 38, Tm0 = 273.15, Vi = 19.65e-6, Vl = 18.02e-6;
    const dmu = (T, P) => {
      const Ps = TH.psatW(T), vf = W.sat(Math.max(T, 273.16)).vf;
      const vap = R * T * Math.log(P / Ps) - M * vf * (P - Ps);
      const dH = dHf + dCp * (T - Tm0), dS = dHf / Tm0 + dCp * Math.log(T / Tm0);
      const ice = -(dH - T * dS) + (Vi - Vl) * (P - 101325);
      return { vap, ice };
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, P = p.P * 1e3;
      EM.draw.clear(cv);
      const Tlo = 245, Thi = 420, data = [];
      for (let i = 0; i <= 140; i++) { const T = Tlo + ((Thi - Tlo) * i) / 140, m = dmu(T, P); data.push([T, 0, m.vap / 1e3, m.ice / 1e3]); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: Tlo, xmax: Thi, ymin: -12, ymax: 12, xlabel: 'T (K)', ylabel: 'μ − μ líquido (kJ/mol)', ml: 58 });
      pl.frame();
      pl.path(data.map((d) => [d[0], d[3]]), { color: '--c1', width: 2.4 });
      pl.path(data.map((d) => [d[0], 0]), { color: '--c3', width: 2.4 });
      pl.path(data.map((d) => [d[0], d[2]]), { color: '--c2', width: 2.4 });
      const Tm = FQ.bisect((T) => dmu(T, P).ice, 230, 290), Tb = FQ.bisect((T) => dmu(T, P).vap, 250, 640), Ts = FQ.bisect((T) => dmu(T, P).vap - dmu(T, P).ice, 150, 273.2);
      const liquid = P > 611.7;
      if (liquid && isFinite(Tm)) pl.dot(Tm, 0, { color: '--c1', label: 'fusión', dy: 16 });
      if (liquid && isFinite(Tb) && Tb < Thi) pl.dot(Tb, 0, { color: '--c2', label: 'ebullición', dy: 16, align: 'right', dx: -8 });
      if (!liquid && isFinite(Ts)) pl.dot(Ts, dmu(Ts, P).ice / 1e3, { color: '--accent', label: 'sublimación', dy: -10 });
      pl.legend([{ label: 'hielo', color: '--c1' }, { label: 'agua líquida (referencia)', color: '--c3' }, { label: 'vapor (gas ideal)', color: '--c2' }], 'tr');
      sim.set('Tf', liquid ? EM.fix(Tm, 2) + ' K (' + EM.fix(Tm - 273.15, 2) + ' °C)' : 'no hay líquido estable: P < presión del punto triple (0.6117 kPa)');
      sim.set('Tb', liquid ? EM.fix(Tb, 2) + ' K (' + EM.fix(Tb - 273.15, 2) + ' °C)' : EM.fix(Ts, 1) + ' K (sublimación)');
      const dT = 0.05, sl = (f, T) => -(f(T + dT) - f(T - dT)) / (2 * dT);
      if (liquid && isFinite(Tb) && Tb < Thi && isFinite(Tm)) sim.set('dS', 'fusión ' + EM.fix(-sl((T) => dmu(T, P).ice, Tm), 1) + ' · vaporización ' + EM.fix(sl((T) => dmu(T, P).vap, Tb), 1) + ' J/mol·K');
      else sim.set('dS', '—');
    });
  });

  /* 1.2 Energía de Gibbs de mezcla */
  EM.defineSim('gibbs-mezcla', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('chi', { label: 'Parámetro de interacción χ = ω/(RT)', min: 0, max: 3.2, step: 0.01, value: 0, fmt: (v) => v.toFixed(2) });
    sim.slider('x', { label: 'Composición de referencia, x', min: 0.02, max: 0.98, step: 0.005, value: 0.3, fmt: (v) => v.toFixed(3) });
    sim.check('tan', { label: 'Mostrar la tangente (da los potenciales químicos)', value: true });
    sim.out('G', 'Δ<sub>mez</sub><i>G</i>/(<i>RT</i>) en <i>x</i>', { hl: true });
    sim.out('mu', 'μ₁ − μ₁* y μ₂ − μ₂* (en unidades de <i>RT</i>)');
    sim.out('st', 'Estabilidad');
    const g = (x, c) => x * Math.log(x) + (1 - x) * Math.log(1 - x) + c * x * (1 - x);
    const dg = (x, c) => Math.log(x / (1 - x)) + c * (1 - 2 * x);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, c = p.chi, x0 = p.x;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: -0.75, ymax: 0.4, xlabel: 'fracción molar del componente 2, x', ylabel: 'Δmez G / RT', ml: 56 });
      pl.frame();
      pl.fn((x) => (x <= 0 || x >= 1 ? NaN : g(x, 0)), { color: '--ink-3', width: 1.4, dash: [6, 4] });
      pl.fn((x) => (x <= 0 || x >= 1 ? NaN : g(x, c)), { color: '--c1', width: 2.6 });
      if (c > 2) {
        const xb = FQ.bisect((x) => dg(x, c), 1e-9, 0.5 - 1e-9, 1e-13);
        const gb = g(xb, c), gb2 = g(1 - xb, c);
        pl.path([[xb, gb], [1 - xb, gb2]], { color: '--c2', width: 1.8, dash: [4, 3] });
        pl.dot(xb, gb, { color: '--c2', label: 'binodal', dy: 18 }); pl.dot(1 - xb, gb2, { color: '--c2', label: 'binodal', dy: 18, align: 'right', dx: -7 });
        const xs = 0.5 - Math.sqrt(0.25 - 1 / (2 * c));
        pl.vline(xs, { color: '--c4', label: 'espinodal' }); pl.vline(1 - xs, { color: '--c4', label: 'espinodal', align: 'right' });
      }
      const G = g(x0, c), m = dg(x0, c);
      if (p.tan) { pl.path([[0, G - m * x0], [1, G + m * (1 - x0)]], { color: '--accent', width: 1.8 }); }
      pl.dot(x0, G, { color: '--accent' });
      pl.legend([{ label: 'mezcla ideal (χ = 0)', color: '--ink-3', dash: [6, 4] }, { label: 'mezcla regular', color: '--c1' }], 'br');
      sim.set('G', EM.fix(G, 4));
      /* μ2 − μ2* = tangente en x=1; μ1 − μ1* = tangente en x=0 */
      sim.set('mu', EM.fix(G - m * x0, 4) + ' y ' + EM.fix(G + m * (1 - x0), 4));
      const d2 = 1 / (x0 * (1 - x0)) - 2 * c;
      sim.set('st', d2 > 0 ? 'estable (curvatura positiva)' : 'inestable: se separa en dos fases (espinodal)');
    });
  });

  /* 1.3 Volumen molar parcial por la construcción de la tangente */
  const E = FQ.etoh;
  EM.defineSim('vol-parcial', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('x', { label: 'Fracción molar de etanol, x', min: 0.001, max: 0.999, step: 0.001, value: 0.2, fmt: (v) => v.toFixed(3) });
    sim.out('w', 'Equivale a % en masa de etanol', {});
    sim.out('Vm', 'Volumen molar de la mezcla', { hl: true });
    sim.out('V1', 'Volumen molar parcial del etanol');
    sim.out('V2', 'Volumen molar parcial del agua');
    sim.out('Vid', 'Volumen ideal · exceso');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, x = p.x;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 10, ymax: 62, xlabel: 'fracción molar de etanol, x', ylabel: 'V (cm³ por mol de mezcla)', ml: 56 });
      pl.frame();
      pl.path([[0, E.V2], [1, E.V1]], { color: '--ink-3', width: 1.4, dash: [6, 4] });
      pl.fn((xx) => E.VmFit(xx), { color: '--c1', width: 2.4 });
      E.x.forEach((xx, i) => pl.dot(xx, E.V[i], { color: '--c1', r: 3 }));
      const [v1, v2] = E.Vbar(x), vm = E.VmFit(x);
      pl.path([[0, v2], [1, v1]], { color: '--accent', width: 2 });
      pl.dot(0, v2, { color: '--c3', label: 'V̄₂ = ' + EM.fix(v2, 2), dx: 8, dy: -8 }); pl.dot(1, v1, { color: '--c2', label: 'V̄₁ = ' + EM.fix(v1, 2), dx: -8, dy: 16, align: 'right' });
      pl.dot(x, vm, { color: '--accent' });
      pl.legend([{ label: 'mezcla ideal (aditiva)', color: '--ink-3', dash: [6, 4] }, { label: 'datos de densidad (Lange, 20 °C)', color: '--c1', kind: 'dot' }, { label: 'tangente en x', color: '--accent' }], 'tl');
      sim.set('w', EM.fix(E.wOfX(x), 1) + ' %');
      sim.set('Vm', EM.fix(vm, 3) + ' cm³/mol');
      sim.set('V1', EM.fix(v1, 2) + ' cm³/mol (puro: ' + EM.fix(E.V1, 2) + ')');
      sim.set('V2', EM.fix(v2, 3) + ' cm³/mol (puro: ' + EM.fix(E.V2, 3) + ')');
      sim.set('Vid', EM.fix(x * E.V1 + (1 - x) * E.V2, 3) + ' · ' + EM.fix(E.VEfit(x), 3) + ' cm³/mol');
    });
  });

  /* 1.4 Curvas de volumen parcial, Gibbs–Duhem y contracción de volumen */
  EM.defineSim('gibbs-duhem', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('Ve', { label: 'Volumen de etanol puro', min: 5, max: 150, step: 1, value: 50, unit: 'mL', fmt: (v) => v.toFixed(0) });
    sim.slider('Va', { label: 'Volumen de agua pura', min: 5, max: 150, step: 1, value: 50, unit: 'mL', fmt: (v) => v.toFixed(0) });
    sim.out('x', 'Fracción molar de etanol · % en masa', { hl: true });
    sim.out('Vt', 'Volumen real de la mezcla');
    sim.out('Vs', 'Suma de volúmenes antes de mezclar · contracción');
    sim.out('gd', 'Residuo de Gibbs–Duhem  <i>x</i>₁d<i>V̄</i>₁ + <i>x</i>₂d<i>V̄</i>₂');
    const rhoE = E.V1 ? E.M1 / E.V1 : 0.789, rhoA = E.M2 / E.V2;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 8, ymax: 62, xlabel: 'fracción molar de etanol, x', ylabel: 'V̄ (cm³/mol)', ml: 56 });
      pl.frame();
      const xs = [], a = [], b = [];
      for (let i = 1; i < 400; i++) { const x = i / 400, v = E.Vbar(x); xs.push(x); a.push(v[0]); b.push(v[1]); }
      pl.xy(xs, a, { color: '--c2', width: 2.4 }); pl.xy(xs, b, { color: '--c3', width: 2.4 });
      pl.hline(E.V1, { color: '--c2', width: 1, dash: [2, 4] }); pl.hline(E.V2, { color: '--c3', width: 1, dash: [2, 4] });
      const n1 = (p.Ve * rhoE) / E.M1, n2 = (p.Va * rhoA) / E.M2, x = n1 / (n1 + n2);
      pl.vline(x, { color: '--accent', label: 'x = ' + EM.fix(x, 3) });
      const v = E.Vbar(x); pl.dot(x, v[0], { color: '--c2' }); pl.dot(x, v[1], { color: '--c3' });
      pl.legend([{ label: 'V̄ etanol', color: '--c2' }, { label: 'V̄ agua', color: '--c3' }], 'br');
      const Vt = n1 * v[0] + n2 * v[1], Vs = p.Ve + p.Va;
      sim.set('x', EM.fix(x, 4) + ' · ' + EM.fix(E.wOfX(x), 1) + ' %');
      sim.set('Vt', EM.fix(Vt, 2) + ' mL (V = n₁V̄₁ + n₂V̄₂)');
      sim.set('Vs', EM.fix(Vs, 1) + ' mL · ' + EM.fix(Vs - Vt, 2) + ' mL (' + EM.fix((100 * (Vs - Vt)) / Vs, 2) + ' %)');
      const h = 1e-4, d = (E.Vbar(x + h)[0] - E.Vbar(x - h)[0]) / (2 * h) * x + (E.Vbar(x + h)[1] - E.Vbar(x - h)[1]) / (2 * h) * (1 - x);
      sim.set('gd', d.toExponential(1) + ' cm³/mol (cero, salvo error numérico)');
    });
  });
})();
