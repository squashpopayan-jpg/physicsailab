/* Capítulo 27 — Espectros de rotación y vibración */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, V = FQ.rv;

  /* 27.1 Banda fundamental de vibración–rotación */
  EM.defineSim('rovib', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Molécula', options: Object.entries(V.MOL).map(([k, v]) => [k, v.nm]), value: 'HCl' });
    sim.slider('T', { label: 'Temperatura', min: 20, max: 1000, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('w', { label: 'Anchura de línea (resolución del espectrómetro)', min: 0.02, max: 4, step: 0.01, value: 0.3, log: true, unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 2) });
    sim.check('iso', { label: 'Incluir los isótopos naturales (HCl: ³⁵Cl 75.8 %, ³⁷Cl 24.2 %)', value: true });
    sim.out('nu', 'Origen de la banda ν₀ = <i>E</i>(1,0) − <i>E</i>(0,0) · separación de las ramas P y R en el centro (≈ 4<i>B</i>)', { hl: true });
    sim.out('l', 'Primeras líneas: R(0) · P(1) · R(1) · P(2) (cm⁻¹)');
    sim.out('B', 'Constantes rotacionales <i>B</i>₀ · <i>B</i>₁ · de las diferencias de combinación <i>B</i>″ = [R(<i>J</i>−1) − P(<i>J</i>+1)]/4(<i>J</i>+½) en <i>J</i> = 1');
    sim.out('r', 'Distancia internuclear <i>r</i> = √(ħ/4π<i>cμB</i><sub>0</sub>) · intensidad máxima en <i>J</i>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, m0 = V.MOL[p.m], isos = p.iso && p.m === 'HCl' ? [[m0, 0.7576], [V.isotopologue(m0, 'H', 'Cl37'), 0.2424]] : [[m0, 1]];
      EM.draw.clear(cv);
      const nu0 = V.nu0(m0), Jmax = 35, lines = []; for (const [m, ab] of isos) for (let J = 0; J <= Jmax; J++) { lines.push([V.R(m, J), ab * V.IR(m, J, p.T), 'R', J]); if (J >= 1) lines.push([V.P(m, J), ab * V.IP(m, J, p.T), 'P', J]); }
      const imax = Math.max(...lines.map((l) => l[1])), pos = lines.map((l) => l[0]), lo = Math.min(...pos) - 4 * p.w, hi = Math.max(...pos) + 4 * p.w;
      /* recorte: intensidad > 0.5 % del máximo */
      const vis = lines.filter((l) => l[1] > 0.004 * imax), a = Math.min(...vis.map((l) => l[0])) - 6, b = Math.max(...vis.map((l) => l[0])) + 6;
      const N = 1400, xs = Array.from({ length: N }, (_, i) => a + ((b - a) * i) / (N - 1)), ys = xs.map((x) => { let s = 0; for (const l of vis) { const d = (x - l[0]) / p.w; if (Math.abs(d) < 12) s += l[1] / imax * Math.exp(-0.5 * d * d); } return s; });
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: a, xmax: b, ymin: 0, ymax: Math.max(1.1, ...ys) * 1.05, xlabel: 'número de onda (cm⁻¹)', ylabel: 'absorción relativa', ml: 50 });
      pl.frame(); vis.forEach((l) => pl.path([[l[0], 0], [l[0], l[1] / imax]], { color: l[2] === 'R' ? '--c2' : '--c1', width: 1, alpha: 0.5 })); pl.xy(xs, ys, { color: '--ink', width: 1.6 }); pl.vline(nu0, { color: '--accent', dash: [4, 3], label: 'ν₀ (sin línea Q)' });
      pl.legend([{ label: 'rama R (ΔJ = +1)', color: '--c2' }, { label: 'rama P (ΔJ = −1)', color: '--c1' }], 'tr');
      const B0 = m0.Be - m0.ae / 2, B1 = m0.Be - 1.5 * m0.ae, mu = V.redMass(m0.a, m0.b), rr = Math.sqrt(16.8576 / (mu * B0)) /* ħ/(4π c μ B) en Å con μ en u y B en cm⁻¹ */;
      const Jm = vis.reduce((best, l) => (l[1] > best[1] ? l : best), [0, 0, '', 0]);
      sim.set('nu', EM.fix(nu0, 3) + ' cm⁻¹ · ' + EM.fix(V.R(m0, 0) - V.P(m0, 1), 3) + ' cm⁻¹ (4B₀ = ' + EM.fix(4 * B0, 2) + ')');
      sim.set('l', [V.R(m0, 0), V.P(m0, 1), V.R(m0, 1), V.P(m0, 2)].map((x) => EM.fix(x, 2)).join(' · '));
      sim.set('B', EM.fix(B0, 4) + ' · ' + EM.fix(B1, 4) + ' · ' + EM.fix(V.combo(m0, 1) / (4 * 1.5), 4) + ' cm⁻¹ (B₁ < B₀: el enlace se alarga al excitarse)');
      sim.set('r', EM.fix(rr, 4) + ' Å · J = ' + Jm[3] + ' (' + Jm[2] + ')');
    });
  });

  /* 27.2 Raman rotacional con estadística de espín nuclear */
  const RAM = { N2: ['N₂ (¹⁴N, espín nuclear 1, bosón)', 1.98957, 5.7e-6, 1, false, 0], H2: ['H₂ (espín ½, fermión): ortho/para 3 : 1', 59.322, 0.0471, 0.5, true, 0], O2: ['¹⁶O₂ (espín 0): solo J impar', 1.4377, 4.85e-6, 0, false, 1], CO2: ['¹²C¹⁶O₂ (espín 0): solo J par', 0.39022, 1.33e-7, 0, false, 2], D2: ['D₂ (espín 1, bosón): ortho/para 2 : 1', 29.907, 0.0116, 1, false, 0] };
  EM.defineSim('raman-rot', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Molécula homonuclear', options: Object.entries(RAM).map(([k, v]) => [k, v[0]]), value: 'N2' });
    sim.slider('T', { label: 'Temperatura', min: 20, max: 700, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('B', 'Constante <i>B</i><sub>e</sub> · línea de Raman S(0) (6<i>B</i>) · separación de las líneas 4<i>B</i>', { hl: true });
    sim.out('w', 'Alternancia de intensidades por el espín nuclear: peso de <i>J</i> par : <i>J</i> impar');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [nm, B, D, I, fermion, kind] = RAM[p.m], kT = 0.6950348 * p.T;
      EM.draw.clear(cv);
      const Jm = 30, lines = []; for (let J = 0; J <= Jm; J++) { const allowed = kind === 1 ? J % 2 === 1 : kind === 2 ? J % 2 === 0 : true; if (!allowed) continue; const w = kind ? 1 : V.spinW(I, J, fermion), pop = w * (2 * J + 1) * Math.exp((-B * J * (J + 1)) / kT) * ((3 * (J + 1) * (J + 2)) / (2 * (2 * J + 1) * (2 * J + 3))); lines.push([V.ramanS(B, D, J), pop, J]); }
      const imax = Math.max(...lines.map((l) => l[1])), xs = lines.map((l) => l[0]);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Math.max(...xs.filter((_, i) => lines[i][1] > 0.01 * imax)) + 8 * B, ymin: 0, ymax: 1.1, xlabel: 'desplazamiento Raman (cm⁻¹)', ylabel: 'intensidad relativa', ml: 50 });
      pl.frame(); lines.forEach((l) => { pl.path([[l[0], 0], [l[0], l[1] / imax]], { color: l[2] % 2 ? '--c2' : '--c1', width: 4 }); });
      pl.legend([{ label: 'J inicial par', color: '--c1' }, { label: 'J inicial impar', color: '--c2' }], 'tr');
      const we = kind ? (kind === 1 ? 'solo J impar (ausentes los pares)' : 'solo J par (ausentes los impares)') : EM.fix(V.spinW(I, 0, fermion), 0) + ' : ' + EM.fix(V.spinW(I, 1, fermion), 0) + (I === 0.5 ? ' (para : orto = 1 : 3)' : '');
      sim.set('B', EM.fix(B, 4) + ' cm⁻¹ · ' + EM.fix(6 * B, 2) + ' cm⁻¹ · ' + EM.fix(4 * B, 3) + ' cm⁻¹');
      sim.set('w', we);
    });
  });

  /* 27.3 Efecto isotópico cinético por energía de punto cero */
  const BOND = { CH: ['C–H → C–D', 'C12', 'H', 'D', 2900], OH: ['O–H → O–D', 'O16', 'H', 'D', 3400], NH: ['N–H → N–D', 'N14', 'H', 'D', 3300], HH: ['H–H → D–D (los dos átomos)', 'H', 'H', 'D', 4401] };
  EM.defineSim('kie', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('b', { label: 'Enlace que se rompe', options: Object.entries(BOND).map(([k, v]) => [k, v[0]]), value: 'CH' });
    sim.slider('T', { label: 'Temperatura', min: 150, max: 800, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('nu', { label: 'Frecuencia de tensión del enlace con H', min: 1000, max: 4500, step: 10, value: 2900, unit: 'cm⁻¹', fmt: (v) => v.toFixed(0) });
    sim.out('nd', 'Frecuencia con D: <i>ν</i><sub>D</sub> = <i>ν</i><sub>H</sub>√(<i>μ</i><sub>H</sub>/<i>μ</i><sub>D</sub>) · cociente de masas reducidas', { hl: true });
    sim.out('z', 'Diferencia de energía de punto cero ½<i>hc</i>(<i>ν</i><sub>H</sub> − <i>ν</i><sub>D</sub>) · en kJ/mol');
    sim.out('k', 'Efecto isotópico cinético máximo <i>k</i><sub>H</sub>/<i>k</i><sub>D</sub> = exp(ΔZPE/<i>RT</i>)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [nm, a, b1, b2] = BOND[p.b], muH = V.redMass(a, b1), muD = V.redMass(a, b2), rt = Math.sqrt(muH / muD), nuD = p.nu * rt;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 150, xmax: 800, ymin: 1, ymax: 40, ylog: true, xlabel: 'temperatura (K)', ylabel: 'k_H/k_D (solo punto cero)', ml: 52 });
      pl.frame(); pl.fn((T) => V.zpeKIE(p.nu, nuD, T), { color: '--c1', width: 2.8, n: 200 }); pl.dot(p.T, V.zpeKIE(p.nu, nuD, p.T), { color: '--accent' }); pl.hline(7, { color: '--ink-3', dash: [4, 3], label: '≈ 7 (límite habitual a 298 K)' });
      const dz = 0.5 * (p.nu - nuD), kj = dz * 0.0119627;
      sim.set('nd', EM.fix(nuD, 0) + ' cm⁻¹ · ' + EM.fix(rt, 4));
      sim.set('z', EM.fix(dz, 0) + ' cm⁻¹ · ' + EM.fix(kj, 2) + ' kJ/mol');
      sim.set('k', EM.fix(V.zpeKIE(p.nu, nuD, p.T), 2));
    });
  });
})();
