/* Capítulo 22 — Mecánica cuántica: los modelos solubles */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, Q = FQ.qm, EV = Q.HARTREE_EV, A0 = Q.BOHR_A;
  const HC_EV_NM = 1239.841984; /* eV·nm */

  /* 22.1 Partícula en una caja */
  const PART = { e: ['Electrón', 1], p: ['Protón', 1836.15267], h2: ['Molécula de H₂', 3672.3], n2: ['Molécula de N₂', 51052] };
  EM.defineSim('caja', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Partícula', options: Object.entries(PART).map(([k, v]) => [k, v[0]]), value: 'e' });
    sim.slider('L', { label: 'Ancho de la caja L', min: 0.05, max: 10, step: 0.01, value: 1, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 2) });
    sim.slider('n', { label: 'Estado n', min: 1, max: 8, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.out('E', 'Energía <i>E</i><sub>n</sub> = <i>n</i>²π²ħ²/(2<i>mL</i>²)', { hl: true });
    sim.out('tr', 'Transición n → n + 1: energía · longitud de onda');
    sim.out('dx', 'Δ<i>x</i>Δ<i>p</i>/(ħ/2) del estado <i>n</i> (el principio de incertidumbre exige ≥ 1)');
    sim.out('kT', 'Comparación con <i>k</i><sub>B</sub><i>T</i> a 298 K (0.0257 eV)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, m = PART[p.m][1], Lb = p.L / (A0 / 10), n = Math.round(p.n);
      EM.draw.clear(cv);
      const E = (k) => Q.boxE(k, Lb, m) * EV, En = E(n), Emax = E(8) * 1.05;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.4, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: Emax, xlabel: '', ylabel: 'energía (eV)', ml: 54, title: 'Niveles' });
      pl.frame(); for (let k = 1; k <= 8; k++) pl.path([[0.1, E(k)], [0.9, E(k)]], { color: k === n ? '--accent' : '--ink-3', width: k === n ? 3 : 1.4 });
      const xs = Array.from({ length: 301 }, (_, i) => (p.L * i) / 300);
      const pl2 = new EM.Plot(ctx, { x: W * 0.43, y: 0, w: W * 0.57, h: H, xmin: 0, xmax: p.L, ymin: -1.6, ymax: 3.2, xlabel: 'x (nm)', ylabel: 'ψ y |ψ|² (unidades de 1/√L y 1/L)', ml: 46, mr: 8, title: 'Función de onda y densidad de probabilidad' });
      pl2.frame(); pl2.hline(0, { color: '--ink-3' });
      pl2.xy(xs, xs.map((x) => Math.sqrt(p.L) * Q.boxPsi(n, p.L, x)), { color: '--c1', width: 2.4 }); pl2.xy(xs, xs.map((x) => p.L * Math.pow(Q.boxPsi(n, p.L, x), 2)), { color: '--c2', width: 2.4, fill: '--c2', fillAlpha: 0.15 });
      pl2.legend([{ label: 'ψₙ', color: '--c1' }, { label: '|ψₙ|²', color: '--c2' }], 'tr');
      const dE = E(n + 1) - En, prod = Math.sqrt((n * n * Math.PI * Math.PI) / 3 - 2) * 1; /* Δx Δp / ħ */
      sim.set('E', EM.sci(En, 3) + ' eV = ' + EM.sci(En * 96.485, 3) + ' kJ/mol');
      sim.set('tr', EM.sci(dE, 3) + ' eV · ' + (dE > 1e-3 ? EM.fix(HC_EV_NM / dE, 1) + ' nm' : EM.sci(HC_EV_NM / dE * 1e-3, 2) + ' µm'));
      sim.set('dx', EM.fix(prod, 3) + ' ×  (n = 1: 1.136)');
      sim.set('kT', EM.fix(En / 0.025693, 3) + ' k_BT · niveles separados por ' + EM.sci(dE / 0.025693, 2) + ' k_BT' + (dE / 0.025693 < 1 ? ' (la cuantización no se nota: comportamiento clásico)' : ''));
    });
  });

  /* 22.2 Efecto túnel por una barrera rectangular */
  const MASS = [['e', 'Electrón', 1], ['H', 'Protón (H)', 1836.15267], ['D', 'Deuterón (D)', 3670.48297], ['T', 'Tritón (T)', 5496.92]];
  EM.defineSim('tunel', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('V0', { label: 'Altura de la barrera V₀', min: 0.05, max: 5, step: 0.01, value: 1, unit: 'eV', fmt: (v) => v.toFixed(2) });
    sim.slider('a', { label: 'Espesor de la barrera a', min: 0.01, max: 1, step: 0.005, value: 0.1, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 2) });
    sim.out('t', 'Transmisión <i>T</i> a <i>E</i> = <i>V</i><sub>0</sub>/2: electrón · protón · deuterón · tritón', { hl: true });
    sim.out('r', 'Cociente de transmisión H/D a <i>E</i> = <i>V</i><sub>0</sub>/2 · <i>κa</i> del protón (<i>κ</i> = √(2<i>m</i>(<i>V</i><sub>0</sub> − <i>E</i>))/ħ)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, V0 = p.V0 / EV, ab = p.a / (A0 / 10);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1.6, ymin: 1e-30, ymax: 1.5, ylog: true, xlabel: 'energía de la partícula E/V₀', ylabel: 'probabilidad de transmisión T', ml: 54 });
      pl.frame(); const cols = ['--c1', '--c2', '--c3', '--c4'];
      MASS.forEach(([k, n, m], i) => pl.fn((e) => Math.max(Q.tunnelRect(e * V0, V0, ab, m), 1e-31), { color: cols[i], width: 2.4, n: 400 }));
      pl.vline(0.5, { color: '--ink-3', dash: [4, 4] }); pl.vline(1, { color: '--ink-3', dash: [2, 3], label: 'E = V₀' });
      pl.legend(MASS.map(([k, n], i) => ({ label: n, color: cols[i] })), 'br');
      const Ts = MASS.map(([k, n, m]) => Q.tunnelRect(0.5 * V0, V0, ab, m)), kap = Math.sqrt(2 * MASS[1][2] * 0.5 * V0) * ab;
      sim.set('t', Ts.map((t) => EM.sci(t, 2)).join(' · '));
      sim.set('r', EM.sci(Ts[1] / Ts[2], 2) + ' · ' + EM.fix(kap, 1));
    });
  });

  /* 22.3 Corrección de túnel en una reacción de transferencia de H (barrera parabólica) */
  EM.defineSim('tunel-cin', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('nu', { label: 'Frecuencia imaginaria de la barrera para H, ν‡', min: 300, max: 2500, step: 10, value: 1200, unit: 'cm⁻¹', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura', min: 150, max: 600, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('u', '<i>u</i> = <i>h</i>ν‡/<i>k</i><sub>B</sub><i>T</i> para H · para D (ν‡ ∝ 1/√<i>m</i>)', { hl: true });
    sim.out('Q', 'Corrección de túnel <i>Q</i> de H: Wigner · Bell · integral numérica exacta');
    sim.out('kie', 'Efecto isotópico cinético H/D solo por túnel <i>Q</i><sub>H</sub>/<i>Q</i><sub>D</sub> (sin contar la energía de punto cero)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, kT = 0.6950348 * p.T /* cm⁻¹ por K */, uH = p.nu / kT, uD = uH / Math.SQRT2;
      EM.draw.clear(cv);
      const Qnum = (u) => { if (u >= 6.2) return Infinity; /* ∫ T(E) e^{−(E−V0)/kT} dE/kT con V0 = 0, w = u kT; T = 1/(1 + e^{−2π E/w}) */ const w = u, N = 4000, E0 = -60, E1 = 60; let s = 0; for (let i = 0; i <= N; i++) { const e = E0 + ((E1 - E0) * i) / N, f = Math.exp(-e) / (1 + Math.exp((-2 * Math.PI * e) / w)); s += (i === 0 || i === N ? 0.5 : 1) * f; } return (s * (E1 - E0)) / N; };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.05, xmax: 6.2, ymin: 0.9, ymax: 1e3, ylog: true, xlabel: 'u = hν‡/k_BT', ylabel: 'Q = k_túnel/k_clásica', ml: 52 });
      pl.frame(); pl.fn((u) => Q.wigner(u), { color: '--c3', width: 2, dash: [5, 3] }); pl.fn((u) => (u < 2 * Math.PI ? Q.bell(u) : NaN), { color: '--c1', width: 2.6, n: 300 }); const us = [], qs = []; for (let u = 0.1; u <= 6.1; u += 0.1) { us.push(u); qs.push(Qnum(u)); } pl.xy(us, qs, { color: '--ink', width: 1.4, dash: [1, 3] });
      pl.vline(uH, { color: '--c2', label: 'H' }); pl.vline(uD, { color: '--c4', label: 'D' });
      pl.legend([{ label: 'Wigner 1 + u²/24', color: '--c3', dash: [5, 3] }, { label: 'Bell (u/2)/sin(u/2)', color: '--c1' }, { label: 'integral numérica', color: '--ink', dash: [1, 3] }], 'tl');
      const qH = Qnum(uH), qD = Qnum(uD);
      sim.set('u', EM.fix(uH, 2) + ' · ' + EM.fix(uD, 2));
      sim.set('Q', EM.fix(Q.wigner(uH), 2) + ' · ' + (uH < 2 * Math.PI ? EM.fix(Q.bell(uH), 2) : '∞') + ' · ' + (isFinite(qH) ? EM.fix(qH, 2) : '∞'));
      sim.set('kie', isFinite(qH) && isFinite(qD) ? EM.fix(qH / qD, 2) + ' (H: ' + EM.fix(qH, 2) + ', D: ' + EM.fix(qD, 2) + ')' : 'u ≥ 2π: la barrera parabólica ya no limita la integral (el túnel domina; hay que usar un modelo con barrera finita)');
    });
  });

  /* 22.4 Oscilador armónico y de Morse (moléculas diatómicas reales; Huber y Herzberg) */
  const MOL = { H2: ['H₂', 4401.21, 121.34, 0.50391, 0.7414], HCl: ['H³⁵Cl', 2990.95, 52.82, 0.97959, 1.2746], CO: ['CO', 2169.81, 13.288, 6.8562, 1.1283], N2: ['N₂', 2358.57, 14.324, 7.0034, 1.0977], O2: ['O₂', 1580.19, 11.98, 7.9997, 1.2075], I2: ['I₂', 214.50, 0.614, 63.452, 2.666] };
  EM.defineSim('morse', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('mol', { label: 'Molécula diatómica', options: Object.entries(MOL).map(([k, v]) => [k, v[0]]), value: 'HCl' });
    sim.slider('v', { label: 'Nivel vibracional v', min: 0, max: 12, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.out('w', 'ω<sub>e</sub> · ω<sub>e</sub>x<sub>e</sub> (cm⁻¹) · <i>D</i><sub>e</sub> de Morse = ω<sub>e</sub>²/(4ω<sub>e</sub>x<sub>e</sub>) · nº de niveles ligados', { hl: true });
    sim.out('f', 'Transición fundamental 0 → 1: Morse · armónico · primer sobretono 0 → 2');
    sim.out('z', 'Energía de punto cero (Morse · armónica) · energía del nivel <i>v</i> elegido (Morse)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, wcm, wx, mu_u, re_A] = MOL[p.mol], mu = mu_u * Q.AMU, w = wcm / Q.HARTREE_CM, D = (wcm * wcm) / (4 * wx) / Q.HARTREE_CM, a = w * Math.sqrt(mu / (2 * D)), re = re_A / A0, vmax = Q.morseVmax(D, a, mu), v = Math.min(Math.round(p.v), vmax);
      EM.draw.clear(cv);
      const Em = (k) => Q.morseE(k, D, a, mu) * Q.HARTREE_CM, Eh = (k) => Q.hoE(k, w) * Q.HARTREE_CM, Vm = (r) => D * Math.pow(1 - Math.exp(-a * (r - re)), 2) * Q.HARTREE_CM, Vh = (r) => 0.5 * mu * w * w * (r - re) * (r - re) * Q.HARTREE_CM;
      const r0 = re * 0.55, r1 = re * 2.6, rs = Array.from({ length: 700 }, (_, i) => r0 + ((r1 - r0) * i) / 699), Dcm = D * Q.HARTREE_CM;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: r0 * A0, xmax: r1 * A0, ymin: -Dcm * 0.04, ymax: Dcm * 1.25, xlabel: 'distancia internuclear r (Å)', ylabel: 'energía (cm⁻¹)', ml: 62 });
      pl.frame();
      pl.xy(rs.map((r) => r * A0), rs.map(Vh), { color: '--c3', width: 1.6, dash: [5, 3] }); pl.xy(rs.map((r) => r * A0), rs.map(Vm), { color: '--c1', width: 2.8 });
      for (let k = 0; k <= vmax; k++) { const e = Em(k), disc = Math.sqrt(Math.max(0, Math.min(0.999999, e / Dcm))), rl = re - Math.log(1 + disc) / a, rr = re - Math.log(1 - disc) / a; pl.path([[rl * A0, e], [Math.min(rr, r1) * A0, e]], { color: k === v ? '--accent' : '--ink-3', width: k === v ? 2.4 : 1 }); }
      const rps = Array.from({ length: 800 }, (_, i) => r0 * 0.9 + ((r1 * 1.3 - r0 * 0.9) * i) / 799), psi = Q.morsePsi(v, D, a, mu, re, rps), sc = (Dcm * 0.075) / Math.max(...psi.map(Math.abs));
      pl.xy(rps.map((r) => r * A0), psi.map((q, i) => Em(v) + q * sc), { color: '--accent', width: 2.2 });
      pl.legend([{ label: 'potencial de Morse', color: '--c1' }, { label: 'parábola armónica (ω_e)', color: '--c3', dash: [5, 3] }, { label: 'ψ_v de Morse', color: '--accent' }], 'br');
      sim.set('w', `${EM.fix(wcm, 1)} · ${EM.fix(wx, 2)} · ${EM.fix(Dcm, 0)} cm⁻¹ (${EM.fix(Dcm / 8065.544, 2)} eV) · ${vmax + 1}`);
      sim.set('f', `${EM.fix(Em(1) - Em(0), 1)} · ${EM.fix(wcm, 1)} · ${EM.fix(Em(2) - Em(0), 1)} cm⁻¹ (armónico: ${EM.fix(2 * wcm, 0)})`);
      sim.set('z', `${EM.fix(Em(0), 1)} · ${EM.fix(wcm / 2, 1)} cm⁻¹ · ${EM.fix(Em(v), 0)} cm⁻¹`);
    });
  });

  /* 22.5 Rotor rígido: niveles, poblaciones y espectro de microondas */
  const ROT = { CO: ['CO', 1.9313], HCl: ['H³⁵Cl', 10.5934], HF: ['HF', 20.956], N2: ['N₂ (sin espectro de microondas)', 1.9987], H2: ['H₂', 60.853], I2: ['I₂', 0.0374] };
  EM.defineSim('rotor', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('mol', { label: 'Molécula diatómica', options: Object.entries(ROT).map(([k, v]) => [k, v[0]]), value: 'CO' });
    sim.slider('T', { label: 'Temperatura', min: 20, max: 1500, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('Jm', 'Nivel más poblado <i>J</i><sub>máx</sub> (numérico) · fórmula √(<i>k</i><sub>B</sub><i>T</i>/2<i>hcB</i>) − ½', { hl: true });
    sim.out('th', 'Temperatura rotacional θ<sub>rot</sub> = <i>hcB</i>/<i>k</i><sub>B</sub> · línea de absorción 0 → 1 (2<i>B</i>)');
    sim.out('fr', 'Fracción de moléculas en <i>J</i> = 0 · en <i>J</i> ≥ 10');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, B = ROT[p.mol][1], kT = 0.6950348 * p.T, Jn = 40;
      EM.draw.clear(cv);
      const pops = Array.from({ length: Jn + 1 }, (_, J) => Q.rotPop(J, B, kT)), Z = pops.reduce((a, b) => a + b, 0), Jx = pops.indexOf(Math.max(...pops));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.55, h: cv.h, xmin: -0.5, xmax: Math.min(Jn, Math.max(15, 3 * Jx + 8)) + 0.5, ymin: 0, ymax: Math.max(...pops) / Z * 1.15, xlabel: 'número cuántico J', ylabel: 'fracción de moléculas', ml: 52, title: 'Poblaciones' });
      pl.frame(); pops.forEach((q, J) => pl.path([[J, 0], [J, q / Z]], { color: J === Jx ? '--accent' : '--c1', width: 5 }));
      pl.fn((J) => Q.rotPop(J, B, kT) / Z, { color: '--ink-3', width: 1.2, dash: [3, 3], n: 200 });
      const pl2 = new EM.Plot(ctx, { x: cv.w * 0.58, y: 0, w: cv.w * 0.42, h: cv.h, xmin: 0, xmax: 2 * B * Math.min(Jn, Math.max(15, 3 * Jx + 8)), ymin: 0, ymax: Math.max(...pops) / Z * 1.15, xlabel: 'número de onda (cm⁻¹)', ylabel: 'intensidad relativa', ml: 58, mr: 8, title: 'Líneas J → J + 1' });
      pl2.frame(); for (let J = 0; J < Jn; J++) { pl2.path([[2 * B * (J + 1), 0], [2 * B * (J + 1), pops[J] / Z]], { color: '--c2', width: 3 }); }
      const Jf = Math.sqrt(kT / (2 * B)) - 0.5;
      sim.set('Jm', Jx + ' · ' + EM.fix(Jf, 2));
      sim.set('th', EM.fix((B / 0.6950348), 2) + ' K · ' + EM.fix(2 * B, 3) + ' cm⁻¹ (' + EM.fix(2 * B * 29.9792458, 1) + ' GHz)');
      sim.set('fr', EM.fix(100 * pops[0] / Z, 2) + ' % · ' + EM.fix(100 * pops.slice(10).reduce((a, b) => a + b, 0) / Z, 1) + ' %');
    });
  });
})();
