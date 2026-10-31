/* Capítulo 7 — Pozo finito, delta y doble pozo */
(function () {
  'use strict';
  const EM = window.EM, K = EM.qm.K, Q = EM.P.q1d, X = Q.exact;
  const HB2M_E = 0.0761996; /* ħ²/m_e en eV·nm² */
  const PART = { e: ['Electrón libre', 1], gaas: ['Electrón en GaAs (m* = 0.067 mₑ)', 0.067], p: ['Protón', 1836.15267] };

  /* 7.1 Pozo finito */
  EM.defineSim('finito', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Partícula (masa efectiva)', options: Object.entries(PART).map(([k, v]) => [k, v[0]]), value: 'e' });
    sim.slider('V0', { label: 'Profundidad del pozo V₀', min: 0.02, max: 100, step: 0.01, value: 5, log: true, unit: 'eV', fmt: (v) => EM.sci(v, 3) });
    sim.slider('L', { label: 'Ancho del pozo L', min: 0.05, max: 30, step: 0.01, value: 1, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 3) });
    sim.slider('n', { label: 'Estado mostrado', min: 1, max: 12, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.out('z', 'Parámetro del pozo <i>z</i><sub>0</sub> = (<i>L</i>/2)√(2<i>mV</i><sub>0</sub>)/ħ · estados ligados', { hl: true });
    sim.out('E', 'Energía del estado mostrado medida desde el fondo · la de la caja infinita del mismo ancho');
    sim.out('k', 'Longitud de penetración 1/κ · probabilidad de hallar la partícula fuera del pozo');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, mr = PART[p.m][1], m = mr / HB2M_E * (1 / 1) /* 1/(ħ²/m) con ħ=1 */, V0 = p.V0, L = p.L;
      EM.draw.clear(cv);
      const r = X.finiteWell(V0, L, mr / HB2M_E, 1), nb = r.states.length, n = Math.min(Math.round(p.n), nb), st = r.states[n - 1];
      const Ebox = (k) => (k * k * Math.PI * Math.PI * HB2M_E) / (2 * mr * L * L);
      const span = Math.max(3 * L, 6 / Math.max(st.kappa, 1e-3));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -span, xmax: span, ymin: -0.05 * V0, ymax: 1.15 * V0, xlabel: 'x (nm)', ylabel: 'energía desde el fondo del pozo (eV)', ml: 56, title: `${nb} estado${nb === 1 ? '' : 's'} ligado${nb === 1 ? '' : 's'}` });
      pl.frame();
      pl.path([[-span, V0], [-L / 2, V0], [-L / 2, 0], [L / 2, 0], [L / 2, V0], [span, V0]], { color: '--ink', width: 2.2 });
      r.states.forEach((s, i) => pl.path([[-span, s.E + V0], [span, s.E + V0]], { color: i === n - 1 ? '--accent' : '--ink-3', width: i === n - 1 ? 1.8 : 1, dash: i === n - 1 ? [] : [3, 4] }));
      const xs = Array.from({ length: 700 }, (_, i) => -span + (2 * span * i) / 699), amp = V0 * 0.18 / Math.max(...xs.map((x) => Math.abs(X.finiteWellPsi(st, V0, L, x))));
      pl.xy(xs, xs.map((x) => st.E + V0 + amp * X.finiteWellPsi(st, V0, L, x)), { color: '--accent', width: 2.4 });
      /* probabilidad fuera del pozo: ∫|ψ|² fuera = (cos²ka o sin²ka)/κ normalizado */
      const a = L / 2, k = st.k, q = st.kappa, even = st.parity === 'par', Nin = even ? a + Math.sin(2 * k * a) / (2 * k) : a - Math.sin(2 * k * a) / (2 * k), c = even ? Math.cos(k * a) : Math.sin(k * a), Nout = (c * c) / q, Pout = Nout / (Nin + Nout);
      sim.set('z', `${EM.fix(r.z0, 3)} · ${nb} (n ≤ ${nb}; sin la caja: ∞)`);
      sim.set('E', `${EM.sci(st.E + V0, 4)} eV (${st.parity}) · ${EM.sci(Ebox(n), 4)} eV`);
      sim.set('k', `${EM.sci(1 / q, 3)} nm · ${EM.fix(100 * Pout, 3)} %`);
    });
  });

  /* 7.2 Potencial delta: estado ligado y dispersión (ħ = m = 1) */
  EM.defineSim('delta', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('al', { label: 'Intensidad α de V = ∓α δ(x)', min: 0.2, max: 4, step: 0.05, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.check('rep', { label: 'Delta repulsiva (V = +α δ): no hay estado ligado', value: false });
    sim.out('k', 'Constante de decaimiento κ = <i>m</i>α/ħ² · energía de ligadura −<i>m</i>α²/2ħ²', { hl: true });
    sim.out('T', 'Transmisión <i>T</i> y reflexión <i>R</i> en <i>E</i> = α²/2 (<i>E</i> = |<i>E</i><sub>0</sub>|), en <i>E</i> = 4 |<i>E</i><sub>0</sub>|');
    sim.out('x', 'Δ<i>x</i> del estado ligado = 1/(√2 κ) · producto Δ<i>x</i>Δ<i>p</i>/(ħ/2)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, al = p.al, k0 = al, E0 = al * al / 2;
      EM.draw.clear(cv);
      const T = (E) => 1 / (1 + (al * al) / (2 * E));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.45, h: cv.h, xmin: -4, xmax: 4, ymin: -0.15, ymax: 1.4, xlabel: 'x', ylabel: 'ψ (normalizada)', ml: 44, mr: 8, title: p.rep ? 'Barrera delta (sin estados ligados)' : 'Estado ligado' });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [] });
      if (!p.rep) { const xs = Array.from({ length: 500 }, (_, i) => -4 + (8 * i) / 499); pl.xy(xs, xs.map((x) => Math.sqrt(k0) * Math.exp(-k0 * Math.abs(x))), { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.14 }); pl.vline(0, { color: '--c2', dash: [], label: '−αδ', width: 2 }); pl.vline(1 / k0, { color: '--ink-3', dash: [3, 3], label: '1/κ' }); } else { pl.vline(0, { color: '--c2', dash: [], label: '+αδ', width: 2 }); pl.label(0, 0.7, 'ninguna solución normalizable con E < 0', { size: 11.5, align: 'center', color: '--ink-2' }); }
      const pt = new EM.Plot(ctx, { x: cv.w * 0.48, y: 0, w: cv.w * 0.52, h: cv.h, xmin: 0.02, xmax: 20, ymin: 0, ymax: 1.05, xlabel: 'energía E (en unidades ħ²κ²/2m = |E₀|)', ylabel: 'T, R', ml: 46, mr: 8, title: 'Dispersión: T y R no dependen del signo de α' });
      pt.frame();
      pt.fn((e) => T(e * E0), { color: '--accent', width: 2.6, n: 400 }); pt.fn((e) => 1 - T(e * E0), { color: '--c2', width: 2, dash: [5, 3], n: 400 });
      pt.vline(1, { color: '--ink-3', dash: [3, 3] }); pt.legend([{ label: 'T(E) = 1/(1 + α²/2E)', color: '--accent' }, { label: 'R = 1 − T', color: '--c2', dash: [5, 3] }], 'br');
      const dx = 1 / (Math.SQRT2 * k0), dpp = k0;
      sim.set('k', p.rep ? '— (repulsiva: no hay estado ligado)' : `${EM.fix(k0, 3)} · ${EM.fix(-E0, 4)}`);
      sim.set('T', `${EM.fix(T(E0), 4)} y ${EM.fix(1 - T(E0), 4)} · ${EM.fix(T(4 * E0), 4)} y ${EM.fix(1 - T(4 * E0), 4)}`);
      sim.set('x', p.rep ? '—' : `${EM.fix(dx, 4)} · ${EM.fix(2 * dx * dpp, 4)} (= √2 = 1.414)`);
    });
  });

  /* 7.3 Doble pozo y efecto túnel: desdoblamiento y oscilación (ħ = m = 1) */
  EM.defineSim('dobledoble', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('a', { label: 'Semidistancia entre los mínimos a', min: 1, max: 2.5, step: 0.05, value: 1.5, fmt: (v) => EM.fix(v, 2) });
    sim.slider('V0', { label: 'Altura de la barrera central V₀ (V = V₀ [(x/a)² − 1]²)', min: 2, max: 30, step: 0.5, value: 12, fmt: (v) => EM.fix(v, 1) });
    sim.out('E', 'Energías de los dos niveles más bajos · desdoblamiento Δ<i>E</i> = <i>E</i><sub>1</sub> − <i>E</i><sub>0</sub>', { hl: true });
    sim.out('T', 'Periodo de la oscilación entre pozos <i>T</i> = 2πħ/Δ<i>E</i> · frecuencia ΔE/<i>h</i> (u. a.)');
    sim.out('b', 'Altura de la barrera <i>V</i><sub>0</sub> respecto de <i>E</i><sub>0</sub> · energía de punto cero de un pozo ≈ ω/2 con ω = √(8<i>V</i><sub>0</sub>)/<i>a</i>');
    sim.out('P', 'Probabilidad en el pozo izquierdo en este instante');
    let t = 0, S = null;
    const solve = () => {
      const p = sim.p, N = 700, xa = -3 * p.a - 3, xb = 3 * p.a + 3, V = (x) => p.V0 * ((x / p.a) ** 2 - 1) ** 2, r = Q.fdEigen(V, xa, xb, N, 3);
      let psi0 = r.psi[0], psi1 = r.psi[1]; const h = r.h; let sl = 0; for (let i = 0; i < N; i++) if (r.x[i] < 0) sl += psi0[i] * psi1[i] * h;
      if (sl < 0) psi1 = psi1.map((v) => -v); /* ψ₀ + ψ₁ localizado a la izquierda */
      S = { x: r.x, h, psi0, psi1, E0: r.E[0], E1: r.E[1], V, xa, xb };
    };
    solve(); sim.onChange = solve;
    sim.resetButton(() => { t = 0; });
    sim.animate((dt) => { t = (t + dt * 0.1) % 1; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, { x, h, psi0, psi1, E0, E1, V } = S, dE = E1 - E0, T = (2 * Math.PI) / dE, tt = t * T;
      EM.draw.clear(cv);
      const ymax = Math.min(p.V0 * 1.3, E1 * 3 + 2);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.6, h: cv.h, xmin: S.xa, xmax: S.xb, ymin: 0, ymax, xlabel: 'x', ylabel: 'V(x), niveles y |Ψ|²', ml: 46, mr: 8, title: 'Doble pozo' });
      pl.frame(); pl.fn(V, { color: '--ink', width: 2.2, n: 400 });
      pl.path([[S.xa, E0], [S.xb, E0]], { color: '--c1', width: 1.2, dash: [4, 3] }); pl.path([[S.xa, E1], [S.xb, E1]], { color: '--c2', width: 1.2, dash: [4, 3] });
      const dens = Array.from(x, (_, i) => { const a0 = psi0[i], a1 = psi1[i]; return 0.5 * (a0 * a0 + a1 * a1) + a0 * a1 * Math.cos(dE * tt); }); /* ψ₀ + ψ₁ localizado a la izquierda */
      const sc = ymax * 0.35 / Math.max(...dens.map(Math.abs));
      pl.xy(Array.from(x), dens.map((d) => E0 + sc * d), { color: '--accent', width: 2.6, fill: '--accent', fillAlpha: 0.2, base: E0 });
      pl.xy(Array.from(x), Array.from(psi0, (v) => E0 + sc * 0.5 * v * v * 0), { color: '--c1', width: 0 });
      let PL = 0, nrm = 0; for (let i = 0; i < x.length; i++) { nrm += dens[i] * h; if (x[i] < 0) PL += dens[i] * h; }
      /* P_left(t) a lo largo de un periodo */
      const pp = new EM.Plot(ctx, { x: cv.w * 0.63, y: 0, w: cv.w * 0.37, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1.05, xlabel: 't / T', ylabel: 'P(pozo izquierdo)', ml: 46, mr: 8, title: 'Oscilación por efecto túnel' });
      pp.frame(); const a0l = psi0.reduce((s, v, i) => s + (x[i] < 0 ? v * v * h : 0), 0);
      pp.fn((u) => 0.5 * (1 + Math.cos(2 * Math.PI * u)), { color: '--accent', width: 2.4, n: 200 }); pp.dot(t, PL / nrm, { color: '--c2', r: 5 });
      sim.set('E', `${EM.fix(E0, 4)} · ${EM.fix(E1, 4)} · ${EM.sci(dE, 4)}`);
      sim.set('T', `${EM.sci(T, 3)} · ${EM.sci(dE / (2 * Math.PI), 3)}`);
      sim.set('b', `${EM.fix(p.V0 - E0, 3)} · ${EM.fix(Math.sqrt(8 * p.V0) / p.a / 2, 3)}`);
      sim.set('P', EM.fix(PL / nrm, 4));
    });
  });
})();
