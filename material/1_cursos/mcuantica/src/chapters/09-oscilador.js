/* Capítulo 9 — El oscilador armónico */
(function () {
  'use strict';
  const EM = window.EM, K = EM.qm.K, HO = EM.qm.ho;
  const CM_EV = 1.239841984e-4, CM_KJ = 0.011962656; /* 1 cm⁻¹ en eV y kJ/mol */
  const MOL = { au: ['Unidades naturales (ħ = m = ω = 1)', 0, 0], H2: ['H₂ (ω_e = 4401.21 cm⁻¹, μ = 0.50391 u)', 4401.21, 0.50391], HCl: ['H³⁵Cl (2990.95 cm⁻¹, μ = 0.97959 u)', 2990.95, 0.97959], CO: ['CO (2169.81 cm⁻¹, μ = 6.8562 u)', 2169.81, 6.8562], N2: ['N₂ (2358.57 cm⁻¹, μ = 7.0034 u)', 2358.57, 7.0034], I2: ['I₂ (214.50 cm⁻¹, μ = 63.452 u)', 214.5, 63.452] };
  const ellA = (wcm, mu) => (Math.sqrt(K.hbar / (mu * K.u * 2 * Math.PI * K.c * 100 * wcm))) * 1e10; /* ℓ en Å */

  /* 9.1 Estados propios y límite clásico */
  EM.defineSim('oscilador', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('mol', { label: 'Sistema', options: Object.entries(MOL).map(([k, v]) => [k, v[0]]), value: 'HCl' });
    sim.slider('n', { label: 'Número cuántico v (o n)', min: 0, max: 30, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.check('cl', { label: 'Mostrar la densidad de probabilidad clásica 1/(π√(A² − x²))', value: true });
    sim.out('E', 'Energía <i>E</i><sub>n</sub> = ħω(<i>n</i> + ½): en ħω · cm⁻¹ · eV · kJ/mol', { hl: true });
    sim.out('t', 'Puntos de retorno ± ξ<sub>n</sub> = ±√(2<i>n</i> + 1) en unidades de ℓ = √(ħ/<i>m</i>ω) · ℓ y puntos de retorno en Å');
    sim.out('f', 'Probabilidad en la región clásicamente prohibida |ξ| &gt; ξ<sub>n</sub>');
    sim.out('u', '⟨<i>x</i>²⟩ = (<i>n</i> + ½)ℓ² · Δ<i>x</i>Δ<i>p</i> = (<i>n</i> + ½)ħ · ⟨<i>T</i>⟩ = ⟨<i>V</i>⟩ = <i>E</i>/2');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, n = Math.round(p.n), [nm, wcm, mu] = MOL[p.mol], phys = wcm > 0, xt = Math.sqrt(2 * n + 1), xm = Math.max(xt + 2.5, 5), ymaxE = Math.max(n + 0.5, 2.5) * 1.18;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.56, h: cv.h, xmin: -xm, xmax: xm, ymin: 0, ymax: ymaxE, xlabel: 'ξ = x/ℓ', ylabel: 'energía (en ħω)', ml: 46, mr: 8, title: 'Potencial, niveles y función de onda' });
      pl.frame(); pl.fn((x) => 0.5 * x * x, { color: '--ink-2', width: 2, n: 300 });
      for (let k = 0; k <= Math.min(30, Math.ceil(ymaxE)); k++) pl.path([[-Math.sqrt(2 * k + 1), k + 0.5], [Math.sqrt(2 * k + 1), k + 0.5]], { color: k === n ? '--accent' : '--ink-3', width: k === n ? 2 : 0.8 });
      const xs = Array.from({ length: 600 }, (_, i) => -xm + (2 * xm * i) / 599);
      pl.xy(xs, xs.map((x) => n + 0.5 + 0.9 * HO.psi(n, x)), { color: '--accent', width: 2.4 });
      pl.vline(xt, { color: '--c2', dash: [3, 3] }); pl.vline(-xt, { color: '--c2', dash: [3, 3] });
      const pr = new EM.Plot(ctx, { x: cv.w * 0.59, y: 0, w: cv.w * 0.41, h: cv.h, xmin: -xm, xmax: xm, ymin: 0, ymax: Math.max(Math.max(...xs.map((x) => HO.psi(n, x) ** 2)) * 1.1, 0.4), xlabel: 'ξ', ylabel: '|ψ_n|²', ml: 40, mr: 8, title: 'Cuántica frente a clásica' });
      pr.frame(); pr.band(-xm, -xt, { color: '--c2', alpha: 0.1 }); pr.band(xt, xm, { color: '--c2', alpha: 0.1 });
      pr.xy(xs, xs.map((x) => HO.psi(n, x) ** 2), { color: '--accent', width: 2.4, fill: '--accent', fillAlpha: 0.15 });
      if (p.cl) pr.xy(xs.filter((x) => Math.abs(x) < xt - 1e-3), xs.filter((x) => Math.abs(x) < xt - 1e-3).map((x) => HO.classical(n, x)), { color: '--c4', width: 1.8, dash: [6, 3] });
      const pf = HO.forbidden(n), E = n + 0.5;
      sim.set('E', phys ? `${EM.fix(E, 1)} ħω · ${EM.fix(E * wcm, 1)} cm⁻¹ · ${EM.sci(E * wcm * CM_EV, 4)} eV · ${EM.fix(E * wcm * CM_KJ, 2)} kJ/mol` : `${EM.fix(E, 1)} ħω`);
      const l = phys ? ellA(wcm, mu) : 1;
      sim.set('t', phys ? `±${EM.fix(xt, 3)} · ℓ = ${EM.fix(l, 4)} Å · ±${EM.fix(xt * l, 3)} Å` : `±${EM.fix(xt, 4)}`);
      sim.set('f', `${EM.fix(100 * pf, 3)} %${n === 0 ? ' (= erfc(1) = 15.73 %)' : ''}`);
      sim.set('u', `${EM.fix(E, 1)} ℓ² · ${EM.fix(E, 1)} ħ · ${EM.fix(E / 2, 2)} ħω`);
    });
  });

  /* 9.2 Dinámica de una superposición de estados del oscilador */
  EM.defineSim('ho-superpos', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('c0', { label: 'Peso del estado n = 0', min: 0, max: 1, step: 0.01, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.slider('c1', { label: 'Peso del estado n = 1', min: 0, max: 1, step: 0.01, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.slider('c2', { label: 'Peso del estado n = 2', min: 0, max: 1, step: 0.01, value: 0, fmt: (v) => EM.fix(v, 2) });
    sim.slider('c3', { label: 'Peso del estado n = 3', min: 0, max: 1, step: 0.01, value: 0, fmt: (v) => EM.fix(v, 2) });
    sim.out('E', '⟨<i>E</i>⟩ (en ħω) · Δ<i>E</i>', { hl: true });
    sim.out('x', '⟨<i>x</i>⟩(<i>t</i>) en ℓ · ⟨<i>p</i>⟩(<i>t</i>) en ħ/ℓ · en este instante');
    sim.out('T', 'Periodo de la dinámica <i>T</i> = 2π/ω: el estado es exactamente periódico, porque los niveles son equiespaciados');
    let t = 0; sim.resetButton(() => { t = 0; }); sim.animate((dt) => { t = (t + dt * 0.12) % 1; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, w = [p.c0, p.c1, p.c2, p.c3], nrm = Math.sqrt(w.reduce((s, v) => s + v * v, 0)) || 1, c = w.map((v) => v / nrm), tau = 2 * Math.PI * t;
      EM.draw.clear(cv);
      const N = 500, xm = 5, xs = Array.from({ length: N }, (_, i) => -xm + (2 * xm * i) / (N - 1)), dx = xs[1] - xs[0];
      const psi = (x) => { let re = 0, im = 0; for (let n = 0; n < 4; n++) { const f = c[n] * HO.psi(n, x), th = -(n + 0.5) * tau; re += f * Math.cos(th); im += f * Math.sin(th); } return [re, im]; };
      const dens = xs.map((x) => { const q = psi(x); return q[0] * q[0] + q[1] * q[1]; }), re = xs.map((x) => psi(x)[0]);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.58, h: cv.h, xmin: -xm, xmax: xm, ymin: 0, ymax: 1.0, xlabel: 'ξ = x/ℓ', ylabel: '|ψ|²', ml: 46, mr: 8, title: 'Densidad de probabilidad' });
      pl.frame(); pl.fn((x) => 0.5 * x * x * 0.03, { color: '--ink-3', width: 1, n: 100 });
      pl.xy(xs, dens, { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.15 });
      /* ⟨x⟩ y ⟨p⟩ exactos con los elementos de matriz de escalera */
      const ex = (tt) => { let s = 0; for (let n = 0; n < 3; n++) s += 2 * c[n] * c[n + 1] * HO.xmat(n, n + 1) * Math.cos(tt); return s; };
      const ep = (tt) => { let s = 0; for (let n = 0; n < 3; n++) s += 2 * c[n] * c[n + 1] * (-HO.xmat(n, n + 1)) * Math.sin(tt) * (-1); return -s; };
      const ts = Array.from({ length: 201 }, (_, i) => i / 200);
      const pp = new EM.Plot(ctx, { x: cv.w * 0.61, y: 0, w: cv.w * 0.39, h: cv.h, xmin: 0, xmax: 1, ymin: -2, ymax: 2, xlabel: 't / T', ylabel: '⟨x⟩, ⟨p⟩', ml: 40, mr: 8, title: 'Trayectoria del valor esperado' });
      pp.frame(); pp.hline(0, { color: '--ink-3', dash: [] });
      pp.xy(ts, ts.map((u) => ex(2 * Math.PI * u)), { color: '--c1', width: 2.2 }); pp.xy(ts, ts.map((u) => ep(2 * Math.PI * u)), { color: '--c2', width: 2.2 });
      pp.dot(t, ex(tau), { color: '--c1' }); pp.dot(t, ep(tau), { color: '--c2' });
      pp.legend([{ label: '⟨x⟩', color: '--c1' }, { label: '⟨p⟩', color: '--c2' }], 'tr');
      const Em = c.reduce((s, v, n) => s + v * v * (n + 0.5), 0), E2 = c.reduce((s, v, n) => s + v * v * (n + 0.5) ** 2, 0);
      sim.set('E', `${EM.fix(Em, 4)} · ${EM.fix(Math.sqrt(Math.max(0, E2 - Em * Em)), 4)}`);
      sim.set('x', `${EM.fix(ex(tau), 4)} · ${EM.fix(ep(tau), 4)}`);
      sim.set('T', 'T = 2π/ω (1 ciclo cada 8 s en la animación)');
    });
  });

  /* 9.3 Energía de punto cero e isótopos */
  const BOND = { CH: ['C–H (ν̃ = 2900 cm⁻¹)', 2900, 12.0, 1.00782503], OH: ['O–H (ν̃ = 3400 cm⁻¹)', 3400, 15.99491462, 1.00782503], NH: ['N–H (ν̃ = 3300 cm⁻¹)', 3300, 14.0030740, 1.00782503], H2: ['H₂ (ν̃ = 4401.21 cm⁻¹)', 4401.21, 1.00782503, 1.00782503] };
  EM.defineSim('ho-isotopo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('b', { label: 'Enlace que se rompe o se transfiere', options: Object.entries(BOND).map(([k, v]) => [k, v[0]]), value: 'CH' });
    sim.slider('T', { label: 'Temperatura', min: 150, max: 800, step: 1, value: 298.15, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('w', 'Frecuencia del enlace con H · con D (ν̃ ∝ 1/√μ)', { hl: true });
    sim.out('z', 'Energía de punto cero ½<i>hc</i>ν̃: H · D · diferencia ΔZPE (kJ/mol)');
    sim.out('k', 'Efecto isotópico cinético máximo semiclásico <i>k</i><sub>H</sub>/<i>k</i><sub>D</sub> = exp(ΔZPE/<i>RT</i>)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [nm, wH, m1, m2] = BOND[p.b], muH = (m1 * m2) / (m1 + m2), m2D = p.b === 'H2' ? 2.01410178 : 2.01410178, muD = p.b === 'H2' ? m2D / 2 : (m1 * m2D) / (m1 + m2D), wD = wH * Math.sqrt(muH / muD), R = 8.314462618;
      EM.draw.clear(cv);
      const zH = 0.5 * wH * CM_KJ, zD = 0.5 * wD * CM_KJ, dz = zH - zD, kie = (T) => Math.exp((dz * 1000) / (R * T));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.45, h: cv.h, xmin: -1.5, xmax: 1.5, ymin: 0, ymax: 4.2, xlabel: 'distancia de enlace (unidades de ℓ)', ylabel: 'energía (en ħω_H)', ml: 44, mr: 8, title: 'Mismo pozo, dos masas' });
      pl.frame(); pl.fn((x) => 0.5 * x * x * 1.0 * 1.0, { color: '--ink-2', width: 2, n: 200 });
      pl.path([[-1, 0.5], [1, 0.5]], { color: '--c2', width: 2.4 }); pl.path([[-1.0, 0.5 * wD / wH], [1.0, 0.5 * wD / wH]], { color: '--c1', width: 2.4 }); pl.label(1.02, 0.5 + 0.08, 'H', { size: 11, color: '--c2' }); pl.label(1.02, 0.5 * wD / wH - 0.05, 'D', { size: 11, color: '--c1' });
      pl.path([[0.0, 0.5 * wD / wH], [0.0, 0.5]], { color: '--ink', width: 1.4 }); pl.label(0.05, 0.5 * (1 + wD / wH) / 2, `ΔZPE = ${EM.fix(dz, 2)} kJ/mol`, { size: 10.5, color: '--ink' });
      const pt = new EM.Plot(ctx, { x: cv.w * 0.48, y: 0, w: cv.w * 0.52, h: cv.h, xmin: 150, xmax: 800, ymin: 1, ymax: 40, ylog: true, xlabel: 'temperatura (K)', ylabel: 'k_H/k_D (máximo semiclásico)', ml: 50, mr: 8, title: 'Efecto isotópico máximo' });
      pt.frame(); pt.fn(kie, { color: '--accent', width: 2.6, n: 200 }); pt.dot(p.T, kie(p.T), { color: '--c2', label: EM.fix(kie(p.T), 2) });
      sim.set('w', `${EM.fix(wH, 1)} cm⁻¹ · ${EM.fix(wD, 1)} cm⁻¹`);
      sim.set('z', `${EM.fix(zH, 2)} · ${EM.fix(zD, 2)} · ${EM.fix(dz, 2)} kJ/mol`);
      sim.set('k', EM.fix(kie(p.T), 3));
    });
  });
})();
