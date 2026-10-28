/* Capítulo 29 — Función de partición y termodinámica de los gases */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, St = FQ.stat, R = St.R;
  const KEYS = Object.keys(St.MOL);

  /* 29.1 Entropía y capacidad calorífica de gases desde las constantes moleculares */
  EM.defineSim('entropia-mol', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Molécula', options: KEYS.map((k) => [k, St.MOL[k].nm]), value: 'H2O' });
    sim.slider('T', { label: 'Temperatura', min: 100, max: 3000, step: 5, value: 298.15, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.out('S', 'Entropía estándar <i>S</i>° (1 bar): mecánica estadística · tabla NASA/JANAF', { hl: true });
    sim.out('p', 'Contribuciones a <i>S</i>°: traslación · rotación · vibración · electrónica (J/mol·K)');
    sim.out('C', '<i>C</i><sub>p</sub>: mecánica estadística · NASA · <i>H</i>(<i>T</i>) − <i>H</i>(0) (kJ/mol)');
    sim.out('q', 'Funciones de partición: <i>q</i><sub>tras</sub>/<i>V</i> · <i>q</i><sub>rot</sub> (a esta <i>T</i>)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, k = p.m, m = St.MOL[k], t = St.thermo(m, p.T), has = FQ.species.includes(k), sN = has ? FQ.s(k, p.T) : NaN, cN = has ? FQ.cp(k, p.T) : NaN;
      EM.draw.clear(cv);
      const Ts = Array.from({ length: 120 }, (_, i) => 100 + (2900 * i) / 119), pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.58, h: H, xmin: 100, xmax: 3000, ymin: 0, ymax: Math.max(...Ts.map((T) => St.thermo(m, T).Cp)) * 1.1 + 2, xlabel: 'temperatura (K)', ylabel: 'C_p (J/mol·K)', ml: 46, title: 'Capacidad calorífica' });
      pl.frame(); pl.xy(Ts, Ts.map((T) => St.thermo(m, T).Cp), { color: '--c1', width: 2.8 }); if (has) pl.xy(Ts, Ts.map((T) => FQ.cp(k, T)), { color: '--c2', width: 1.8, dash: [5, 4] }); pl.vline(p.T, { color: '--accent', dash: [3, 3] });
      pl.legend([{ label: 'RRHO (mecánica estadística)', color: '--c1' }, { label: 'NASA-7 (experimento)', color: '--c2', dash: [5, 4] }], 'br');
      const parts = [['trans', '--c1'], ['rot', '--c2'], ['vib', '--c3'], ['elec', '--c4']], tot = Math.max(t.S, 10), bx = W * 0.64, bw = W * 0.3;
      EM.text(ctx, 'Entropía por contribuciones', bx, 22, { size: 12, color: '--ink-3' });
      let y = 40; parts.forEach(([nm, col]) => { const v = t.p.S[nm]; ctx.fillStyle = EM.col(col); ctx.globalAlpha = 0.75; ctx.fillRect(bx, y, Math.max(0, (v / tot) * bw), 22); ctx.globalAlpha = 1; EM.text(ctx, nm + ' ' + EM.fix(v, 1), bx + 4, y + 15, { size: 11 }); y += 30; });
      sim.set('S', EM.fix(t.S, 2) + ' · ' + (has ? EM.fix(sN, 2) : '—') + ' J/mol·K' + (has ? ' (diferencia ' + EM.fix(t.S - sN, 2) + ')' : ''));
      sim.set('p', parts.map(([nm]) => EM.fix(t.p.S[nm], 2)).join(' · '));
      sim.set('C', EM.fix(t.Cp, 2) + ' · ' + (has ? EM.fix(cN, 2) : '—') + ' J/mol·K · ' + EM.fix(t.dH0 / 1e3, 3));
      const lam3 = Math.pow((2 * Math.PI * m.M * 1.66053906660e-27 * 1.380649e-23 * p.T) / (6.62607015e-34 ** 2), 1.5);
      sim.set('q', EM.sci(lam3, 3) + ' m⁻³ · ' + (t.p.q_rot ? EM.fix(t.p.q_rot, 2) : '—'));
    });
  });

  /* 29.2 Escalones de la capacidad calorífica (congelación de los grados de libertad) */
  EM.defineSim('escalones', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Diatómica', options: [['N2', 'N₂ (θ_rot = 2.9 K, θ_vib = 3390 K)'], ['H2', 'H₂ (θ_rot = 87.6 K, θ_vib = 6330 K)'], ['CO', 'CO (θ_rot = 2.8 K, θ_vib = 3120 K)'], ['NO', 'NO (con el doblete electrónico de 121 cm⁻¹)']], value: 'H2' });
    sim.out('r', 'Temperaturas características: θ<sub>rot</sub> = <i>hcB</i>/<i>k</i><sub>B</sub> · θ<sub>vib</sub> = <i>hcν</i>/<i>k</i><sub>B</sub>', { hl: true });
    sim.out('v', '<i>C</i><sub>v</sub>/<i>R</i> a 25 K · 100 K · 298 K · 1000 K · 3000 K');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, m = St.MOL[p.m];
      EM.draw.clear(cv);
      const Ts = Array.from({ length: 200 }, (_, i) => Math.pow(10, 1 + (2.6 * i) / 199)), cvr = (T) => St.parts(m, T).Cv.total / R;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 10, xmax: 4000, ymin: 1.3, ymax: 4, xlog: true, xlabel: 'temperatura (K)', ylabel: 'C_v / R', ml: 46 });
      pl.frame(); [1.5, 2.5, 3.5].forEach((v) => pl.hline(v, { color: '--ink-3', dash: [3, 3], label: v === 1.5 ? '3/2 (traslación)' : v === 2.5 ? '5/2 (+ rotación)' : '7/2 (+ vibración)' }));
      pl.xy(Ts, Ts.map(cvr), { color: '--c1', width: 2.8 });
      const th = m.B * 1.438777, tv = m.vib[0] * 1.438777; pl.vline(th, { color: '--c2', dash: [4, 3], label: 'θ_rot' }); pl.vline(tv, { color: '--c3', dash: [4, 3], label: 'θ_vib' });
      sim.set('r', EM.fix(th, 1) + ' K · ' + EM.fix(tv, 0) + ' K');
      sim.set('v', [25, 100, 298.15, 1000, 3000].map((T) => EM.fix(cvr(T), 3)).join(' · '));
    });
  });

  /* 29.3 Anomalía de Schottky */
  EM.defineSim('schottky', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('D', { label: 'Separación de los dos niveles Δ', min: 10, max: 2000, step: 5, value: 300, unit: 'cm⁻¹', fmt: (v) => v.toFixed(0) });
    sim.slider('g1', { label: 'Degeneración del nivel superior g₁ (g₀ = 1)', min: 1, max: 6, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura marcada', min: 10, max: 2000, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('M', 'Máximo de <i>C</i><sub>v</sub>: temperatura · valor (en unidades de <i>R</i>) · fracción en el nivel superior a la <i>T</i> marcada', { hl: true });
    sim.out('S', 'Entropía de los dos niveles <i>R</i>[ln(1 + <i>r</i>) + <i>xr</i>/(1 + <i>r</i>)] a la <i>T</i> marcada · límite a alta <i>T</i> <i>R</i> ln(1 + <i>g</i><sub>1</sub>)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, g1 = Math.round(p.g1), Ts = Array.from({ length: 300 }, (_, i) => Math.pow(10, 0.5 + (3.3 * i) / 299)), cvf = (T) => St.schottky(1, g1, p.D, T).Cv / R;
      EM.draw.clear(cv);
      const ys = Ts.map(cvf), mx = Math.max(...ys), Tm = Ts[ys.indexOf(mx)], pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 3, xmax: 6000, ymin: 0, ymax: mx * 1.15, xlog: true, xlabel: 'temperatura (K)', ylabel: 'C_v / R', ml: 46 });
      pl.frame(); pl.xy(Ts, ys, { color: '--c1', width: 2.8 }); pl.dot(p.T, cvf(p.T), { color: '--accent' }); pl.vline(Tm, { color: '--ink-3', dash: [4, 3], label: 'T_máx' });
      const r = g1 * Math.exp(-p.D / (0.6950348004 * p.T));
      sim.set('M', EM.fix(Tm, 1) + ' K (= ' + EM.fix(Tm * 0.6950348004 / p.D, 3) + ' Δ/k_B) · ' + EM.fix(mx, 3) + ' · ' + EM.fix(100 * r / (1 + r), 1) + ' %');
      sim.set('S', EM.fix(St.schottky(1, g1, p.D, p.T).S, 3) + ' J/mol·K · ' + EM.fix(R * Math.log(1 + g1), 3) + ' J/mol·K');
    });
  });
})();
