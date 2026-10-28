/* Capítulo 7 — Equilibrio de fases en sustancias puras */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, DAT = EM.dat, TH = EM.th, R = FQ.R;
  const NAME = { H2O: 'Agua', CO2: 'Dióxido de carbono' };

  /* 7.1 Diagrama P–T */
  EM.defineSim('fases-pt', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.seg('g', { label: 'Sustancia', options: [['H2O', 'Agua'], ['CO2', 'CO₂']], value: 'H2O' });
    sim.slider('T', { label: 'Temperatura', min: 150, max: 700, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('P', { label: 'Presión', min: 1e2, max: 1e9, step: 1, value: 101325, unit: 'Pa', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.out('ph', 'Fase estable', { hl: true });
    sim.out('F', 'Grados de libertad <i>F</i> = <i>C</i> − <i>P</i> + 2');
    sim.out('pts', 'Punto triple · punto crítico');
    sim.onChange = (id) => { if (id === 'g') { const o = sim.p.g === 'H2O'; sim.ctl.T.set(o ? 298 : 250, true); sim.ctl.P.set(o ? 101325 : 1e6, true); } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, g = p.g, d = DAT.ph[g];
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 150, xmax: 700, ymin: 1e2, ymax: 1e9, ylog: true, xlabel: 'T (K)', ylabel: 'P (Pa)', ml: 58 });
      pl.frame();
      const sat = d.sat; pl.xy(sat.map((q) => q[0]), sat.map((q) => q[1]), { color: '--c2', width: 2.6 });
      const mel = d.mel.filter((q) => q[0] >= d.Pt); pl.xy(mel.map((q) => q[1]), mel.map((q) => q[0]), { color: '--c1', width: 2.6 });
      const Ts = []; for (let T = 150; T <= d.Tt; T += 1) Ts.push(T);
      pl.xy(Ts, Ts.map((T) => FQ.Psub(g, T)), { color: '--c3', width: 2.6 });
      pl.dot(d.Tt, d.Pt, { color: '--ink', label: 'punto triple', dx: 8, dy: 14 }); pl.dot(d.Tc, d.Pc, { color: '--ink', label: 'punto crítico', dx: -8, dy: -10, align: 'right' });
      EM.text(ctx, 'SÓLIDO', pl.X(g === 'H2O' ? 190 : 175), pl.Y(g === 'H2O' ? 1e8 : 1e8), { size: 13, weight: 700, color: '--c1', align: 'center' });
      EM.text(ctx, 'LÍQUIDO', pl.X(g === 'H2O' ? 340 : 255), pl.Y(g === 'H2O' ? 1e8 : 1e8), { size: 13, weight: 700, color: '--c2', align: 'center' });
      EM.text(ctx, 'GAS', pl.X(g === 'H2O' ? 500 : 300), pl.Y(g === 'H2O' ? 5e3 : 1e4), { size: 13, weight: 700, color: '--c3', align: 'center' });
      EM.text(ctx, 'supercrítico', pl.X(d.Tc * 1.08), pl.Y(d.Pc * 5), { size: 11.5, color: '--ink-2' });
      pl.vline(p.T, { color: '--accent', width: 1, alpha: 0.5 }); pl.hline(p.P, { color: '--accent', width: 1 });
      pl.dot(p.T, p.P, { color: '--accent', r: 6 });
      const ph = FQ.phaseAt(g, p.T, p.P);
      let on = false;
      const Pe = p.T >= d.Tt ? (p.T < d.Tc ? FQ.Pvap(g, p.T) : Infinity) : FQ.Psub(g, p.T);
      if (Math.abs(Math.log(p.P / Pe)) < 0.03) on = true;
      if (p.P >= d.Pt && Math.abs(p.T - FQ.Tmelt(g, p.P)) < 0.6) on = true;
      sim.set('ph', on ? 'sobre una curva de coexistencia (' + ph + ' y la fase vecina)' : ph);
      sim.set('F', on ? '1 (dos fases: se puede variar solo T o P)' : ph === 'fluido supercrítico' ? '2 (una fase)' : '2 (una fase: se pueden variar T y P)');
      sim.set('pts', EM.fix(d.Tt, 2) + ' K, ' + EM.sci(d.Pt, 3) + ' Pa · ' + EM.fix(d.Tc, 2) + ' K, ' + EM.fix(d.Pc / 1e6, 3) + ' MPa');
    });
  });

  /* 7.2 Clapeyron y Clausius–Clapeyron */
  const CP = {
    vap: ['Vaporización del agua', 'H2O', 'v'], mel: ['Fusión del agua', 'H2O', 'm'], sub: ['Sublimación del CO₂ (hielo seco)', 'CO2', 's'], vco2: ['Vaporización del CO₂', 'CO2', 'v']
  };
  EM.defineSim('clapeyron', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('c', { label: 'Equilibrio', options: Object.entries(CP).map(([k, v]) => [k, v[0]]), value: 'vap' });
    sim.slider('u', { label: 'Posición sobre la curva (0 = punto triple)', min: 0.02, max: 0.98, step: 0.005, value: 0.4, fmt: (v) => v.toFixed(3) });
    sim.out('pt', 'Estado (<i>T</i>, <i>P</i>)', { hl: true });
    sim.out('sl', 'Pendiente d<i>P</i>/d<i>T</i> numérica de la curva');
    sim.out('cl', 'Pendiente de Clapeyron Δ<i>H</i>/(<i>T</i>Δ<i>V</i>)');
    sim.out('H', 'Δ<i>H</i> aparente (Clausius–Clapeyron: <i>R</i>·d ln<i>P</i>/d(−1/<i>T</i>))');
    sim.out('ref', 'Δ<i>H</i> de referencia');
    const W = TH.agua;
    const curve = (k) => {
      const [, g, t] = CP[k], d = DAT.ph[g];
      if (t === 'v') return { f: (T) => FQ.Pvap(g, T), T0: d.Tt, T1: d.Tc * 0.99 };
      if (t === 's') return { f: (T) => FQ.Psub(g, T), T0: 150, T1: d.Tt - 0.01 };
      return { f: (T) => FQ.Pvap('H2O', T), T0: 0, T1: 0 };
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, k = p.c, [nm, g, t] = CP[k], d = DAT.ph[g];
      EM.draw.clear(cv);
      let Tf, Pf, xs = [], ys = [];
      if (t === 'm') {
        const mel = d.mel.filter((q) => q[0] >= 1e6 && q[0] < 3e8);
        const T0 = d.Tt, T1 = Math.min(...mel.map((q) => q[1]));
        const pts = mel.slice().sort((a, b) => b[0] - a[0]);
        mel.forEach((q) => { xs.push(q[1]); ys.push(q[0]); });
        const iu = Math.min(mel.length - 1, Math.round(p.u * (mel.length - 1)));
        Tf = mel[iu][1]; Pf = mel[iu][0];
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 250, xmax: 274, ymin: 0, ymax: 3e8, xlabel: 'T (K)', ylabel: 'P (Pa)', ml: 62 });
        pl.frame(); pl.xy(xs, ys, { color: '--c1', width: 2.6 });
        pl.dot(Tf, Pf, { color: '--accent' });
        const sl = (() => { const i = Math.max(1, Math.min(mel.length - 2, iu)); return (mel[i + 1][0] - mel[i - 1][0]) / (mel[i + 1][1] - mel[i - 1][1]); })();
        const cl = 6010 / (Tf * (-1.63e-6));
        sim.set('pt', EM.fix(Tf, 2) + ' K, ' + EM.fix(Pf / 1e6, 2) + ' MPa');
        sim.set('sl', EM.fix(sl / 1e6, 1) + ' MPa/K');
        sim.set('cl', EM.fix(cl / 1e6, 1) + ' MPa/K (ΔH = 6.01 kJ/mol, ΔV = −1.63 cm³/mol)');
        sim.set('H', '— (la fusión no es un equilibrio líquido–vapor)');
        sim.set('ref', '6.01 kJ/mol; el signo negativo de ΔV hace que el hielo funda a menor T al subir P');
        pl.legend([{ label: 'curva de fusión del hielo Ih', color: '--c1' }], 'tr');
        return;
      }
      const c = curve(k), T = c.T0 + p.u * (c.T1 - c.T0), P = c.f(T);
      for (let i = 0; i <= 160; i++) { const TT = c.T0 + ((c.T1 - c.T0) * i) / 160; xs.push(1000 / TT); ys.push(Math.log10(c.f(TT))); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: Math.min(...xs), xmax: Math.max(...xs), ymin: Math.min(...ys) - 0.1, ymax: Math.max(...ys) + 0.1, xlabel: '1000/T (K⁻¹)', ylabel: 'log₁₀(P / Pa)', ml: 58 });
      pl.frame(); pl.xy(xs, ys, { color: '--c1', width: 2.6 });
      const dT = 0.5, dlnP = (Math.log(c.f(T + dT)) - Math.log(c.f(T - dT))) / (2 * dT);
      const Happ = R * T * T * dlnP, slope = P * dlnP;
      const m = -Happ / (R * Math.LN10) / 1000, x0 = 1000 / T, y0 = Math.log10(P), ds = (Math.max(...xs) - Math.min(...xs)) * 0.25;
      pl.path([[x0 - ds, y0 - m * ds], [x0 + ds, y0 + m * ds]], { color: '--c4', width: 2, dash: [6, 4] });
      pl.dot(x0, y0, { color: '--accent' });
      pl.legend([{ label: 'curva de equilibrio', color: '--c1' }, { label: 'recta de Clausius–Clapeyron en este punto', color: '--c4', dash: [6, 4] }], 'tr');
      sim.set('pt', EM.fix(T, 2) + ' K, ' + EM.sci(P, 3) + ' Pa');
      sim.set('sl', EM.fix(slope / 1e3, 3) + ' kPa/K');
      if (g === 'H2O' && t === 'v') {
        const s = W.sat(T); sim.set('cl', EM.fix((s.hfg / (T * (s.vg - s.vf))) / 1e3, 3) + ' kPa/K (tablas IAPWS-95: h_fg = ' + EM.fix(s.hfg / 1e3, 0) + ' kJ/kg)');
        sim.set('ref', EM.fix((s.hfg * W.M) / 1e3, 2) + ' kJ/mol (IAPWS-95); Clausius–Clapeyron con vapor ideal sobreestima');
      } else if (t === 's') {
        sim.set('cl', '—'); sim.set('ref', '25.2 kJ/mol (entalpía de sublimación del CO₂ a unos 195 K)');
      } else { sim.set('cl', '—'); sim.set('ref', 'disminuye al acercarse al punto crítico, donde se anula'); }
      sim.set('H', EM.fix(Happ / 1e3, 2) + ' kJ/mol');
    });
  });

  /* 7.3 Isotermas del CO₂ con Peng–Robinson */
  EM.defineSim('isotermas-co2', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('T', { label: 'Temperatura', min: 220, max: 340, step: 0.5, value: 280, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.check('all', { label: 'Mostrar otras isotermas', value: true });
    sim.out('Ps', 'Presión de saturación: Peng–Robinson · referencia (CoolProp)', { hl: true });
    sim.out('V', 'Volúmenes molares de líquido y vapor saturados (cm³/mol)');
    sim.out('st', 'Estado');
    const sp = 'CO2', c = FQ.crit[sp];
    const pr = (T) => FQ.prParams(sp, T);
    const Pof = (T, v) => { const q = pr(T); return (FQ.R * T) / (v - q.b) - q.a / (v * v + 2 * q.b * v - q.b * q.b); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 30, xmax: 600, ymin: 0, ymax: 14, xlabel: 'V_m (cm³/mol)', ylabel: 'P (MPa)', ml: 52 });
      pl.frame();
      const iso = (T, col, w, dash) => { const xs = [], ys = []; for (let i = 0; i <= 300; i++) { const v = (pr(T).b * 1e6 * 1.03) + ((600 - pr(T).b * 1e6 * 1.03) * i) / 300; xs.push(v); ys.push(Pof(T, v * 1e-6) / 1e6); } pl.xy(xs, ys, { color: col, width: w, dash }); };
      if (p.all) [240, 260, 280, 300, c.Tc, 320, 340].forEach((T) => iso(T, T === c.Tc ? '--c2' : '--grid-2', T === c.Tc ? 1.6 : 1.2, T === c.Tc ? [5, 4] : null));
      iso(p.T, '--c1', 2.8);
      const Ps = FQ.prPsat(sp, p.T);
      if (isFinite(Ps)) {
        const L = FQ.prPure(sp, p.T, Ps, 'L'), V = FQ.prPure(sp, p.T, Ps, 'V');
        pl.path([[L.v * 1e6, Ps / 1e6], [V.v * 1e6, Ps / 1e6]], { color: '--accent', width: 2.2, dash: [6, 4] });
        pl.dot(L.v * 1e6, Ps / 1e6, { color: '--c2' }); pl.dot(V.v * 1e6, Ps / 1e6, { color: '--c3' });
        sim.set('V', EM.fix(L.v * 1e6, 1) + ' · ' + EM.fix(V.v * 1e6, 1));
        sim.set('st', 'dos fases entre estos volúmenes (regla de la palanca): la presión se mantiene constante');
      } else { sim.set('V', '—'); sim.set('st', 'T ≥ T_c: no hay transición de fase, el fluido es supercrítico'); }
      const ref = p.T < c.Tc ? FQ.Pvap('CO2', p.T) : NaN;
      sim.set('Ps', isFinite(Ps) ? EM.fix(Ps / 1e6, 3) + ' MPa · ' + EM.fix(ref / 1e6, 3) + ' MPa (' + EM.fix((100 * (Ps - ref)) / ref, 1) + ' %)' : '—');
      const vc = 0.3074 * FQ.R * c.Tc / c.Pc * 1e6; pl.dot(vc, c.Pc / 1e6, { color: '--ink', label: 'crítico', dx: 8, dy: -8 });
    });
  });

  /* 7.4 Ebullición y altitud */
  const CITY = [['Cali', 1018], ['Medellín', 1495], ['Popayán', 1760], ['Bogotá', 2640], ['Quito', 2850], ['Cusco', 3400], ['La Paz', 3640], ['Everest', 8849]];
  EM.defineSim('ebullicion-altitud', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('h', { label: 'Altitud', min: 0, max: 9000, step: 10, value: 1760, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.slider('g', { label: 'Sobrepresión de la olla (manométrica)', min: 0, max: 200, step: 5, value: 0, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.slider('Ea', { label: 'Energía de activación de la cocción (supuesto)', min: 40, max: 120, step: 5, value: 80, unit: 'kJ/mol', fmt: (v) => v.toFixed(0) });
    sim.out('P', 'Presión atmosférica (atmósfera estándar)', {});
    sim.out('Tb', 'Temperatura de ebullición del agua', { hl: true });
    sim.out('t', 'Tiempo de cocción relativo al nivel del mar y 100 °C');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const Tb = (h, gk) => TH.agua.Tsat(FQ.isaP(h) + gk * 1e3) - 273.15;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 9000, ymin: 60, ymax: 130, xlabel: 'altitud (m)', ylabel: 'T de ebullición (°C)', ml: 52 });
      pl.frame();
      pl.fn((h) => Tb(h, 0), { color: '--c1', width: 2.6, n: 90 });
      pl.fn((h) => Tb(h, p.g), { color: '--c2', width: 2.2, n: 90 });
      CITY.forEach(([n, h]) => { pl.dot(h, Tb(h, 0), { color: '--ink', r: 3.5, label: n, dx: 4, dy: -8, mono: false }); });
      pl.vline(p.h, { color: '--accent' }); pl.dot(p.h, Tb(p.h, p.g), { color: '--accent' });
      pl.legend([{ label: 'olla abierta', color: '--c1' }, { label: 'con sobrepresión (olla a presión)', color: '--c2' }], 'tr');
      const T = Tb(p.h, p.g) + 273.15, f = Math.exp((-p.Ea * 1e3 / R) * (1 / T - 1 / 373.15));
      sim.set('P', EM.fix(FQ.isaP(p.h) / 1e3, 1) + ' kPa');
      sim.set('Tb', EM.fix(T - 273.15, 1) + ' °C');
      sim.set('t', EM.fix(1 / f, 2) + '× (' + (1 / f > 1 ? 'más lento' : 'más rápido') + ')');
    });
  });
})();
