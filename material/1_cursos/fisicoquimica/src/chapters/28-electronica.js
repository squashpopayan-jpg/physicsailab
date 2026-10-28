/* Capítulo 28 — Espectroscopía electrónica y de resonancia magnética nuclear */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, S = FQ.esp, B = FQ.bond;
  const HC = 1239.841984; /* eV·nm */

  /* 28.1 Ley de Beer–Lambert */
  const CHR = { nadh: ['NADH, 340 nm', 6220], trp: ['Triptófano, 280 nm', 5600], kmno4: ['KMnO₄, 525 nm', 2455], feph: ['[Fe(fen)₃]²⁺, 510 nm', 11100], car: ['β-caroteno (hexano), 450 nm', 1.40e5] };
  EM.defineSim('beer', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('c', { label: 'Cromóforo', options: Object.entries(CHR).map(([k, v]) => [k, `${v[0]} (ε = ${EM.sci(v[1], 3)} M⁻¹cm⁻¹)`]), value: 'nadh' });
    sim.slider('conc', { label: 'Concentración', min: 0.01, max: 1000, step: 0.01, value: 50, log: true, unit: 'µM', fmt: (v) => EM.sci(v, 2) });
    sim.slider('l', { label: 'Paso óptico', min: 0.1, max: 10, step: 0.1, value: 1, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('s', { label: 'Luz parásita del instrumento', min: 0, max: 0.02, step: 0.0005, value: 0.002, fmt: (v) => (100 * v).toFixed(2) + ' %' });
    sim.out('A', 'Absorbancia verdadera <i>A</i> = ε<i>cl</i> · medida con luz parásita', { hl: true });
    sim.out('T', 'Transmitancia <i>T</i> = 10<sup>−A</sup> · fracción de fotones absorbidos');
    sim.out('r', 'Intervalo útil: concentración para <i>A</i> = 0.1 y para <i>A</i> = 1.5 (a este paso)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, eps = CHR[p.c][1], c = p.conc * 1e-6, A = S.absorbance(eps, c, p.l), Tm = S.transmit(A, p.s);
      EM.draw.clear(cv);
      const cmax = Math.max(c * 3, 1.5 / (eps * p.l) * 2), pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.58, h: cv.h, xmin: 0, xmax: cmax * 1e6, ymin: 0, ymax: 3, xlabel: 'concentración (µM)', ylabel: 'absorbancia', ml: 46, title: 'Ley de Beer–Lambert y desviación por luz parásita' });
      pl.frame(); pl.fn((x) => eps * x * 1e-6 * p.l, { color: '--c1', width: 2.2, dash: [5, 4] }); pl.fn((x) => -Math.log10(S.transmit(eps * x * 1e-6 * p.l, p.s)), { color: '--c2', width: 2.8, n: 300 }); pl.dot(c * 1e6, -Math.log10(Tm), { color: '--accent' }); pl.hline(1.5, { color: '--ink-3', dash: [3, 3], label: 'A = 1.5' });
      pl.legend([{ label: 'ley ideal', color: '--c1', dash: [5, 4] }, { label: 'medida con luz parásita', color: '--c2' }], 'tl');
      const pl2 = new EM.Plot(ctx, { x: cv.w * 0.62, y: 0, w: cv.w * 0.38, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1.05, xlabel: 'recorrido en la cubeta', ylabel: 'intensidad I/I₀', ml: 44, mr: 8, title: 'Atenuación en la cubeta' });
      pl2.frame(); pl2.fn((x) => Math.pow(10, -A * x), { color: '--c3', width: 2.6 });
      sim.set('A', EM.fix(A, 4) + ' · ' + EM.fix(-Math.log10(Tm), 4) + (A > 2 ? ' (la luz parásita satura la medida)' : ''));
      sim.set('T', EM.fix(100 * Math.pow(10, -A), 3) + ' % · ' + EM.fix(100 * (1 - Math.pow(10, -A)), 2) + ' %');
      sim.set('r', EM.sci(0.1 / (eps * p.l) * 1e6, 2) + ' µM · ' + EM.sci(1.5 / (eps * p.l) * 1e6, 2) + ' µM');
    });
  });

  /* 28.2 Franck–Condon */
  EM.defineSim('franck-condon', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('S', { label: 'Factor de Huang–Rhys S = ½ξ₀² (desplazamiento del mínimo)', min: 0, max: 6, step: 0.05, value: 1.5, fmt: (v) => v.toFixed(2) });
    sim.slider('w', { label: 'Frecuencia vibracional ħω', min: 200, max: 3000, step: 10, value: 1400, unit: 'cm⁻¹', fmt: (v) => v.toFixed(0) });
    sim.slider('g', { label: 'Anchura de cada banda', min: 20, max: 600, step: 5, value: 120, unit: 'cm⁻¹', fmt: (v) => v.toFixed(0) });
    sim.out('fc', 'Factores de Franck–Condon |⟨0|<i>v</i>′⟩|² = e<sup>−S</sup>S<sup><i>v</i></sup>/<i>v</i>! para <i>v</i> = 0, 1, 2, 3', { hl: true });
    sim.out('mx', 'Banda más intensa (<i>v</i>′ = ⌊S⌋ o ⌈S⌉−1) · intensidad 0–0 · energía de reorganización λ = S ħω');
    sim.out('st', 'Desplazamiento de Stokes entre los máximos de absorción y de emisión ≈ 2Sħω');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, w = p.w, vm = 9, sp = S.vibronic(p.S, w, 0, vm);
      EM.draw.clear(cv);
      /* potenciales (en unidades de ħω): V = ½ x², V' = ½ (x − ξ0)² + E00 */
      const x0 = Math.sqrt(2 * p.S), pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.42, h: H, xmin: -3, xmax: x0 + 3.5, ymin: -0.3, ymax: 9, xlabel: 'coordenada normal (adimensional)', ylabel: 'energía (ħω)', ml: 40, title: 'Estados S₀ y S₁ y transiciones verticales' });
      pl.frame(); const E0 = 4.5; pl.fn((x) => 0.5 * x * x, { color: '--c1', width: 2.4, n: 200 }); pl.fn((x) => 0.5 * (x - x0) * (x - x0) + E0, { color: '--c2', width: 2.4, n: 200 });
      for (let v = 0; v <= 5; v++) { const e = v + 0.5, a = Math.sqrt(2 * e); pl.path([[-a, e], [a, e]], { color: '--c1', width: 1 }); pl.path([[x0 - a, e + E0], [x0 + a, e + E0]], { color: '--c2', width: 1 }); }
      pl.path([[0, 0.5], [0, E0 + 0.5 * x0 * x0]], { color: '--accent', width: 2 }); pl.arrow && pl.arrow(0, 0.5, 0, E0 + 0.5 * x0 * x0 - 0.1, { color: '--accent' });
      /* espectros: absorción hacia la derecha desde E00, emisión hacia la izquierda */
      const Nn = 700, lo = -(vm + 1) * w, hi = (vm + 1) * w, xs = Array.from({ length: Nn }, (_, i) => lo + ((hi - lo) * i) / (Nn - 1)), prof = (list, sign) => xs.map((x) => { let s = 0; for (const [e, I] of list) { const d = (x - e) / p.g; s += I * Math.exp(-0.5 * d * d); } return s; });
      const ya = prof(sp.abs.map(([e, I]) => [e, I])), ye = prof(sp.emi.map(([e, I]) => [e, I])), mx = Math.max(...ya, ...ye);
      const pl2 = new EM.Plot(ctx, { x: W * 0.45, y: 0, w: W * 0.55, h: H, xmin: lo, xmax: hi, ymin: 0, ymax: mx * 1.1, xlabel: 'energía relativa a la transición 0–0 (cm⁻¹)', ylabel: 'intensidad', ml: 40, mr: 8, title: 'Espectros de absorción y de fluorescencia (imágenes especulares)' });
      pl2.frame(); pl2.xy(xs, ya, { color: '--c2', width: 2.6, fill: '--c2', fillAlpha: 0.15 }); pl2.xy(xs, ye, { color: '--c1', width: 2.6, fill: '--c1', fillAlpha: 0.15 }); pl2.vline(0, { color: '--ink-3', dash: [3, 3], label: '0–0' });
      pl2.legend([{ label: 'absorción S₀ → S₁ (v′ = 0, 1, 2…)', color: '--c2' }, { label: 'emisión S₁ → S₀ (v = 0, 1, 2…)', color: '--c1' }], 'tr');
      const fc = [0, 1, 2, 3].map((v) => S.fc(p.S, v)), imax = fc.indexOf(Math.max(...fc));
      sim.set('fc', fc.map((x) => EM.fix(x, 3)).join(' · '));
      sim.set('mx', 'v′ = ' + (p.S < 1 ? 0 : Math.floor(p.S)) + ' · ' + EM.fix(S.fc(p.S, 0), 3) + ' · ' + EM.fix(p.S * w, 0) + ' cm⁻¹ (' + EM.fix(p.S * w / 8065.544, 3) + ' eV)');
      sim.set('st', EM.fix(S.stokes(p.S, w), 0) + ' cm⁻¹ (' + EM.fix(S.stokes(p.S, w) / 8065.544, 3) + ' eV)');
    });
  });

  /* 28.3 Polienos: Hückel frente al experimento */
  const POLI = [[1, 165], [2, 217], [3, 258], [4, 290], [5, 334], [6, 364], [11, 452]];
  EM.defineSim('polienos', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('b', { label: 'Integral de resonancia |β|', min: 2, max: 7, step: 0.05, value: 4.62, unit: 'eV', fmt: (v) => v.toFixed(2) });
    sim.slider('n', { label: 'Número de enlaces dobles conjugados n', min: 1, max: 14, step: 1, value: 4, fmt: (v) => v.toFixed(0) });
    sim.out('g', 'Brecha HOMO–LUMO de Hückel (|β|) · energía de la transición (eV) · longitud de onda', { hl: true });
    sim.out('e', 'Experimento (hexano o fase gas) · error del modelo');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, lam = (n) => { const h = B.huckel(B.chain(2 * n), 2 * n), gap = h.x[h.homo] - h.x[h.lumo]; return { gap, nm: HC / (gap * p.b) }; };
      EM.draw.clear(cv);
      const ns = Array.from({ length: 14 }, (_, i) => i + 1), pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.5, xmax: 14.5, ymin: 100, ymax: 800, xlabel: 'número de enlaces dobles conjugados', ylabel: 'λ_máx (nm)', ml: 50 });
      pl.frame(); pl.xy(ns, ns.map((n) => lam(n).nm), { color: '--c1', width: 2.6 }); POLI.forEach(([n, l]) => pl.dot(n, l, { color: '--c2', r: 5 })); pl.dot(Math.round(p.n), lam(Math.round(p.n)).nm, { color: '--accent', r: 6 });
      pl.legend([{ label: 'Hückel (con |β| elegida)', color: '--c1' }, { label: 'experimento', color: '--c2', kind: 'dot' }], 'tr');
      const n = Math.round(p.n), r = lam(n), ex = POLI.find((q) => q[0] === n);
      sim.set('g', EM.fix(r.gap, 3) + ' · ' + EM.fix(r.gap * p.b, 2) + ' eV · ' + EM.fix(r.nm, 0) + ' nm');
      sim.set('e', ex ? ex[1] + ' nm · ' + EM.fix(100 * (r.nm - ex[1]) / ex[1], 0) + ' %' : 'sin dato experimental para este n');
    });
  });

  /* 28.4 RMN: multipletes de primer orden y sistema AB */
  EM.defineSim('rmn', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('t', { label: 'Sistema', options: [['m', 'Multiplete de primer orden (n vecinos)'], ['ab', 'Dos espines A y B (cálculo exacto)']], value: 'm' });
    sim.slider('n', { label: 'Número de protones vecinos equivalentes n', min: 0, max: 6, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('J', { label: 'Constante de acoplamiento J', min: 0, max: 20, step: 0.1, value: 7, unit: 'Hz', fmt: (v) => v.toFixed(1) });
    sim.slider('d', { label: 'Diferencia de desplazamiento químico Δν = ν_A − ν_B (solo AB)', min: 0, max: 200, step: 1, value: 40, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.slider('B0', { label: 'Campo magnético del espectrómetro', min: 1.4, max: 23.5, step: 0.1, value: 9.4, unit: 'T', fmt: (v) => v.toFixed(1) });
    sim.out('f', 'Frecuencia de Larmor de ¹H · de ¹³C · exceso de población ΔN/N a 298 K', { hl: true });
    sim.out('l', 'Líneas del espectro (Hz relativos al centro) · intensidades relativas');
    sim.out('p', 'En ppm: la diferencia Δν/ν₀ · J (en ppm, J/ν₀) disminuye al subir el campo (el espectro se simplifica)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, nu0 = S.larmor(5.5856946893, p.B0), n = Math.round(p.n);
      EM.draw.clear(cv);
      let lines;
      if (p.t === 'm') { const co = S.pascal(n); lines = co.map((c, k) => ({ f: (k - n / 2) * p.J, I: c })); }
      else { const base = 2000, l = S.ab(base + p.d, base, p.J), c = base + p.d / 2; lines = l.map((q) => ({ f: q.f - c, I: q.I * 4 })); }
      const span = Math.max(40, p.t === 'm' ? (n + 3) * p.J : p.d + 3 * p.J + 10), xs = Array.from({ length: 900 }, (_, i) => -span + (2 * span * i) / 899), lw = 0.7, im = Math.max(...lines.map((l) => l.I));
      const ys = xs.map((x) => lines.reduce((s, l) => s + l.I / im / (1 + Math.pow((x - l.f) / lw, 2)), 0));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -span, xmax: span, ymin: 0, ymax: Math.max(...ys) * 1.15, xlabel: 'frecuencia relativa al centro (Hz)', ylabel: 'intensidad', ml: 46 });
      pl.frame(); pl.xy(xs, ys, { color: '--c1', width: 2.2, fill: '--c1', fillAlpha: 0.12 }); lines.forEach((l) => pl.path([[l.f, 0], [l.f, l.I / im]], { color: '--c2', width: 1 }));
      sim.set('f', EM.fix(nu0 / 1e6, 2) + ' MHz · ' + EM.fix(S.larmor(1.4048236, p.B0) / 1e6, 2) + ' MHz · ' + EM.sci(S.boltzDiff(nu0, 298.15), 2));
      sim.set('l', lines.map((l) => EM.fix(l.f, 1)).join(', ') + ' Hz · ' + lines.map((l) => EM.fix(l.I / lines.reduce((m, q) => Math.min(m, q.I), 1e9), 2)).join(' : '));
      sim.set('p', p.t === 'ab' ? EM.fix(p.d / (nu0 / 1e6), 3) + ' ppm · ' + EM.fix(p.J / (nu0 / 1e6), 3) + ' ppm' + (p.d / p.J < 5 ? ' (Δν/J < 5: acoplamiento fuerte, «efecto de techo»)' : ' (Δν/J grande: primer orden)') : EM.fix(p.J / (nu0 / 1e6), 3) + ' ppm (J no cambia con el campo en Hz)');
    });
  });
})();
