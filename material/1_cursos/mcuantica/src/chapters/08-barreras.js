/* Capítulo 8 — Escalones, barreras y efecto túnel */
(function () {
  'use strict';
  const EM = window.EM, K = EM.qm.K, S = EM.qm.scat, W = EM.qm.wave;
  const HB2M = 0.0761996; /* ħ²/mₑ en eV·nm² */
  const PART = { e: ['Electrón', 1], gaas: ['Electrón en GaAs (m* = 0.067 mₑ)', 0.067], p: ['Protón', 1836.15267], d: ['Deuterón', 3670.48297] };

  /* 8.1 Escalón de potencial */
  EM.defineSim('escalon', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('E', { label: 'Energía de la partícula E / V₀', min: 0.05, max: 3, step: 0.01, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.out('k', 'Números de onda <i>k</i><sub>1</sub> = √(2<i>mE</i>)/ħ · <i>k</i><sub>2</sub> (o κ para <i>E</i> &lt; <i>V</i><sub>0</sub>), con ħ = <i>m</i> = <i>V</i><sub>0</sub> = 1', { hl: true });
    sim.out('rt', 'Amplitudes <i>r</i> = (<i>k</i><sub>1</sub> − <i>k</i><sub>2</sub>)/(<i>k</i><sub>1</sub> + <i>k</i><sub>2</sub>) y <i>t</i> = 2<i>k</i><sub>1</sub>/(<i>k</i><sub>1</sub> + <i>k</i><sub>2</sub>)');
    sim.out('T', 'Reflexión <i>R</i> = |<i>r</i>|² · transmisión <i>T</i> = (<i>k</i><sub>2</sub>/<i>k</i><sub>1</sub>)|<i>t</i>|² · <i>R</i> + <i>T</i>');
    sim.out('p', 'Penetración 1/κ en el escalón (solo si <i>E</i> &lt; <i>V</i><sub>0</sub>) · razón |<i>t</i>|² (no es la transmisión)');
    let t = 0; sim.animate((dt) => { t += dt * 3; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, E = p.E, r = S.solve(E, [0], [0, 1]), xs = Array.from({ length: 700 }, (_, i) => -12 + (24 * i) / 699);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -12, xmax: 12, ymin: -2.2, ymax: 4.6, xlabel: 'x', ylabel: '|ψ|², Re ψ (amplitud incidente 1)', ml: 50 });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [] });
      pl.xy([-12, 0, 0, 12], [0, 0, 1, 1].map((v) => v * 1.3 + 3.0), { color: '--ink-2', width: 2.2 }); pl.label(-11.5, 4.05, 'V = 0', { size: 11, color: '--ink-2' }); pl.label(6, 4.55, 'V = V₀', { size: 11, color: '--ink-2' });
      pl.xy(xs, xs.map((x) => { const q = r.psi(x); return q[0] * q[0] + q[1] * q[1]; }), { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.14 });
      pl.xy(xs, xs.map((x) => { const q = r.psi(x), c = Math.cos(t), s = Math.sin(t); return q[0] * c + q[1] * s; }), { color: '--c1', width: 1.4 });
      pl.legend([{ label: '|ψ|² (estacionario)', color: '--accent' }, { label: 'Re ψ e^{−iωt}', color: '--c1' }], 'tl');
      const k1 = Math.sqrt(2 * E), open = E > 1, k2 = open ? Math.sqrt(2 * (E - 1)) : Math.sqrt(2 * (1 - E)), rr = (k1 - k2) / (k1 + k2), tt = (2 * k1) / (k1 + k2);
      sim.set('k', `${EM.fix(k1, 4)} · ${EM.fix(k2, 4)}${open ? '' : ' (κ)'}`);
      sim.set('rt', open ? `${EM.fix(rr, 4)} · ${EM.fix(tt, 4)}` : 'r = (k₁ − iκ)/(k₁ + iκ), |r| = 1, y se transmite solo una cola evanescente');
      sim.set('T', `${EM.fix(r.R, 4)} · ${EM.fix(r.T, 4)} · ${EM.fix(r.R + r.T, 6)}`);
      sim.set('p', open ? `— · ${EM.fix(tt * tt, 4)}` : `${EM.fix(1 / k2, 4)} · —`);
    });
  });

  /* 8.2 Barrera rectangular: T(E), resonancias y túnel */
  EM.defineSim('barrera', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Partícula', options: Object.entries(PART).map(([k, v]) => [k, v[0]]), value: 'e' });
    sim.slider('V0', { label: 'Altura de la barrera V₀', min: 0.1, max: 10, step: 0.01, value: 1, log: true, unit: 'eV', fmt: (v) => EM.sci(v, 3) });
    sim.slider('a', { label: 'Espesor de la barrera a', min: 0.02, max: 3, step: 0.01, value: 0.5, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 3) });
    sim.slider('E', { label: 'Energía de la partícula E / V₀', min: 0.02, max: 3, step: 0.01, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.check('log', { label: 'Escala logarítmica en T', value: false });
    sim.out('T', 'Transmisión exacta <i>T</i> · aproximación de barrera gruesa 16<i>E</i>(<i>V</i><sub>0</sub> − <i>E</i>)<i>e</i><sup>−2κ<i>a</i></sup>/<i>V</i><sub>0</sub>²', { hl: true });
    sim.out('k', 'κ<i>a</i> = <i>a</i>√(2<i>m</i>(<i>V</i><sub>0</sub> − <i>E</i>))/ħ · longitud de penetración 1/κ');
    sim.out('r', 'Primera resonancia por encima de la barrera <i>E</i><sub>1</sub> = <i>V</i><sub>0</sub> + π²ħ²/2<i>ma</i>² (<i>T</i> = 1)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, mr = PART[p.m][1], m = mr / HB2M, V0 = p.V0, a = p.a, E = p.E * V0;
      EM.draw.clear(cv);
      const Tf = (e) => S.T(e, [0, a], [0, V0, 0], m, 1), lg = p.log;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.55, h: cv.h, xmin: 0.001, xmax: 3, ymin: lg ? 1e-12 : 0, ymax: lg ? 1.2 : 1.05, ylog: lg, xlabel: 'energía E / V₀', ylabel: 'transmisión T(E)', ml: 52, mr: 8, title: 'T(E)' });
      pl.frame(); pl.fn((x) => Math.max(Tf(x * V0), lg ? 1e-13 : 0), { color: '--accent', width: 2.6, n: 700 }); pl.vline(1, { color: '--ink-3', dash: [4, 3], label: 'V₀' }); pl.vline(p.E, { color: '--c2', dash: [3, 3] }); pl.dot(p.E, Math.max(Tf(E), lg ? 1e-13 : 0), { color: '--c2' });
      const r = S.solve(E, [0, a], [0, V0, 0], m, 1);
      const xr = Math.max(2.5 * a, 3 * 2 * Math.PI / r.kL), xs = Array.from({ length: 600 }, (_, i) => -xr + ((2 * xr + a) * i) / 599);
      const dens = xs.map((x) => { const q = r.psi(x); return q[0] * q[0] + q[1] * q[1]; }), dm = Math.max(...dens);
      const pw = new EM.Plot(ctx, { x: cv.w * 0.58, y: 0, w: cv.w * 0.42, h: cv.h, xmin: -xr, xmax: xr + a, ymin: 0, ymax: Math.max(dm * 1.15, 1.2), xlabel: 'x (nm)', ylabel: '|ψ|²', ml: 40, mr: 8, title: 'Función de onda' });
      pw.frame(); pw.band(0, a, { color: '--c4', alpha: 0.18 }); pw.xy(xs, dens, { color: '--accent', width: 2.2, fill: '--accent', fillAlpha: 0.14 });
      const kap = E < V0 ? Math.sqrt(2 * m * (V0 - E)) : 0, Tthick = E < V0 ? (16 * E * (V0 - E) / (V0 * V0)) * Math.exp(-2 * kap * a) : NaN;
      sim.set('T', `${EM.sci(Tf(E), 4)} · ${E < V0 ? EM.sci(Tthick, 4) : '— (E > V₀)'}`);
      sim.set('k', E < V0 ? `${EM.fix(kap * a, 3)} · ${EM.sci(1 / kap, 3)} nm` : 'E > V₀: no hay decaimiento');
      sim.set('r', `${EM.sci(V0 + (Math.PI * Math.PI) / (2 * m * a * a), 4)} eV = ${EM.fix(1 + (Math.PI * Math.PI) / (2 * m * a * a * V0), 3)} V₀`);
    });
  });

  /* 8.3 Doble barrera: túnel resonante */
  EM.defineSim('resonante', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('V0', { label: 'Altura de las barreras V₀ (GaAs/AlGaAs, m* = 0.067)', min: 0.1, max: 1, step: 0.01, value: 0.3, unit: 'eV', fmt: (v) => EM.fix(v, 2) });
    sim.slider('b', { label: 'Espesor de cada barrera b', min: 0.5, max: 4, step: 0.05, value: 2, unit: 'nm', fmt: (v) => EM.fix(v, 2) });
    sim.slider('w', { label: 'Ancho del pozo central w', min: 2, max: 10, step: 0.1, value: 5, unit: 'nm', fmt: (v) => EM.fix(v, 1) });
    sim.out('p', 'Energías de los picos de transmisión (eV) y valores de <i>T</i> en los máximos', { hl: true });
    sim.out('g', 'Anchura a mitad de altura del primer pico Γ (meV) · vida media del estado resonante τ = ħ/Γ');
    sim.out('s', 'Transmisión de una sola barrera de espesor <i>b</i> a la energía del primer pico');
    const m = 0.067 / HB2M;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, V0 = p.V0, b = p.b, w = p.w, bounds = [0, b, b + w, 2 * b + w], Vs = [0, V0, 0, V0, 0], T = (e) => S.T(e, bounds, Vs, m, 1);
      EM.draw.clear(cv);
      const ne = 1600, es = Array.from({ length: ne }, (_, i) => 1e-4 + (V0 * 0.999 * i) / (ne - 1)), ts = es.map(T);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.62, h: cv.h, xmin: 0, xmax: V0, ymin: 1e-6, ymax: 1.5, ylog: true, xlabel: 'energía E (eV)', ylabel: 'transmisión T(E)', ml: 52, mr: 8, title: 'Túnel resonante' });
      pl.frame(); pl.xy(es, ts.map((v) => Math.max(v, 1e-9)), { color: '--accent', width: 2.4 });
      /* picos: máximos de la malla refinados por búsqueda de sección áurea */
      const peaks = []; for (let i = 2; i < ne - 2; i++) if (ts[i] > ts[i - 1] && ts[i] >= ts[i + 1] && ts[i] > 1e-3) {
        let a = es[i - 1], b = es[i + 1]; const g = 0.6180339887; for (let it = 0; it < 60; it++) { const c = b - g * (b - a), d = a + g * (b - a); if (T(c) > T(d)) b = d; else a = c; }
        peaks.push({ i, E: 0.5 * (a + b), T: T(0.5 * (a + b)) });
      }
      /* niveles de un pozo finito de ancho w (estados «ligados» sin acoplamiento): líneas discontinuas */
      const fw = EM.P.q1d.exact.finiteWell(V0, w, m, 1);
      fw.states.forEach((s) => pl.vline(s.E + V0, { color: '--c3', dash: [3, 4] }));
      peaks.forEach((q) => pl.dot(q.E, q.T, { color: '--c2', r: 4 }));
      /* perfil de potencial */
      const pp = new EM.Plot(ctx, { x: cv.w * 0.65, y: 0, w: cv.w * 0.35, h: cv.h, xmin: -2, xmax: 2 * b + w + 2, ymin: 0, ymax: V0 * 1.25, xlabel: 'x (nm)', ylabel: 'V (eV)', ml: 46, mr: 8, title: 'Perfil' });
      pp.frame(); pp.path([[-2, 0], [0, 0], [0, V0], [b, V0], [b, 0], [b + w, 0], [b + w, V0], [2 * b + w, V0], [2 * b + w, 0], [2 * b + w + 2, 0]], { color: '--ink', width: 2.2 });
      if (peaks.length) {
        const q0 = peaks[0], half = q0.T / 2;
        /* se avanza por pasos hasta que T cae bajo la mitad y se afina por bisección */
        const cross = (dir) => { const st = (V0 * 0.9999) / 4000; let a = q0.E, k = 0; while (k < 4000 && a + dir * st > 1e-6 && a + dir * st < V0 * 0.9999 && T(a + dir * st) > half) { a += dir * st; k++; } let lo = a, hi = a + dir * st; for (let it = 0; it < 60; it++) { const mid = 0.5 * (lo + hi); if (T(mid) > half) lo = mid; else hi = mid; } return 0.5 * (lo + hi); };
        const eL = cross(-1), eR = cross(+1), G = eR - eL;
        sim.set('g', `${EM.sci(G * 1e3, 3)} meV · ${EM.sci(6.5821e-16 / G, 3)} s`); sim.set('s', EM.sci(S.T(q0.E, [0, b], [0, V0, 0], m, 1), 3)); pp.path([[-2, q0.E], [2 * b + w + 2, q0.E]], { color: '--c2', width: 1.2, dash: [4, 3] });
      } else { sim.set('g', '—'); sim.set('s', '—'); }
      sim.set('p', peaks.length ? peaks.map((q) => `${EM.fix(q.E, 4)} (T = ${EM.fix(q.T, 3)})`).join(' · ') : 'no hay picos por debajo de la barrera');
    });
  });

  /* 8.4 Colisión de un paquete de ondas con una barrera */
  EM.defineSim('choque', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('E', { label: 'Energía central del paquete E₀ / V₀', min: 0.2, max: 2, step: 0.01, value: 0.6, fmt: (v) => EM.fix(v, 2) });
    sim.slider('a', { label: 'Espesor de la barrera a (V₀ = 1, ħ = m = 1; múltiplos del paso de la malla 0.125)', min: 0.25, max: 2.5, step: 0.125, value: 1, fmt: (v) => EM.fix(v, 3) });
    sim.slider('s', { label: 'Anchura espacial del paquete σ', min: 3, max: 8, step: 0.5, value: 6, fmt: (v) => EM.fix(v, 1) });
    sim.out('T', 'Transmitida (<i>x</i> &gt; <i>a</i>) · reflejada (<i>x</i> &lt; 0) · dentro de la barrera', { hl: true });
    sim.out('Tf', '<i>T</i>(<i>E</i><sub>0</sub>) de la onda plana · promedio ⟨<i>T</i>⟩ = ∫|φ(<i>k</i>)|² <i>T</i>(<i>k</i>) d<i>k</i> sobre el paquete');
    sim.out('n', 'Norma · energía media ⟨<i>E</i>⟩ del paquete');
    const N = 2048, L = 256, xs = Float64Array.from({ length: N }, (_, i) => -L / 2 + (L * i) / N), dt = 0.05; let op, re, im, t;
    const setup = () => {
      const p = sim.p, k0 = Math.sqrt(2 * p.E);
      op = new W.SplitOp(xs, (x) => (x >= -1e-9 && x < p.a - 1e-9 ? 1 : 0), dt);
      const g = W.gaussFree(xs, 0, -60, p.s, k0); re = Float64Array.from(g[0]); im = Float64Array.from(g[1]); t = 0;
    };
    setup(); sim.onChange = setup; sim.resetButton(setup);
    sim.animate(() => { for (let i = 0; i < 6; i++) op.step(re, im); t += 6 * dt; if (t > 150 / Math.sqrt(2 * sim.p.E)) setup(); });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, dx = xs[1] - xs[0], rho = Array.from(re, (r, i) => r * r + im[i] * im[i]);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -110, xmax: 110, ymin: 0, ymax: 0.55 / p.s, xlabel: 'posición x', ylabel: '|ψ|²', ml: 50 });
      pl.frame(); pl.band(0, p.a, { color: '--c4', alpha: 0.35 });
      pl.xy(Array.from(xs), rho, { color: '--accent', width: 2.4, fill: '--accent', fillAlpha: 0.16 });
      let pt = 0, pr = 0, pin = 0, nrm = 0; for (let i = 0; i < N; i++) { const d = rho[i] * dx; nrm += d; if (xs[i] >= p.a - 1e-9) pt += d; else if (xs[i] < -1e-9) pr += d; else pin += d; }
      const k0 = Math.sqrt(2 * p.E), sk = 1 / (2 * p.s); let avg = 0, wsum = 0; for (let j = -400; j <= 400; j++) { const k = k0 + (j / 400) * 5 * sk, wgt = Math.exp(-((k - k0) ** 2) / (2 * sk * sk)); if (k > 1e-3) { avg += wgt * S.T(k * k / 2, [-0.0625, p.a - 0.0625], [0, 1, 0]); wsum += wgt; } }
      const Em = (() => { const st = W.stats(xs, re, im); return (st.p * st.p + st.dp * st.dp) / 2; })();
      sim.set('T', `${EM.fix(100 * pt, 2)} % · ${EM.fix(100 * pr, 2)} % · ${EM.fix(100 * pin, 2)} %`);
      sim.set('Tf', `${EM.fix(S.T(p.E, [-0.0625, p.a - 0.0625], [0, 1, 0]), 4)} · ${EM.fix(avg / wsum, 4)}`);
      sim.set('n', `${EM.fix(nrm, 5)} · ${EM.fix(Em, 4)} (E₀ = ${EM.fix(p.E, 3)}, más σ_k²/2)`);
    });
  });
})();
