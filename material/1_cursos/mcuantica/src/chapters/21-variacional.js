/* Capítulo 21 — Método variacional */
(function () {
  'use strict';
  const EM = window.EM, VA = EM.qm.var, PT = EM.qm.pert, M = EM.M, PI = Math.PI;
  const EHEV = 27.211386246;

  /* 21.1 Gaussiana de prueba en el oscilador anarmónico */
  EM.defineSim('var-gauss', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('g', { label: 'Anarmonicidad g del término g x⁴', min: 0, max: 2, step: 0.01, value: 0.3, fmt: (v) => EM.fix(v, 2) });
    sim.slider('a', { label: 'Parámetro variacional α de ψ ∝ exp(−αx²/2)', min: 0.4, max: 3.5, step: 0.01, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.out('e', 'E(α) = α/4 + 1/(4α) + 3g/(4α²) (hartree) · mínimo variacional E(α*) y α* (raíz de α³ − α − 6g = 0)', { hl: true });
    sim.out('x', 'Energía exacta (diagonalización) · error de la cota variacional (siempre ≥ 0) · error de la serie de orden 2 (para comparar)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, g = sim.p.g, a = sim.p.a, ao = VA.gaussOpt(g), Eo = VA.gaussE(g, ao), ex = PT.anharmExact(g, 120, 1)[0];
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0.4, xmax: 3.5, ymin: Math.min(ex, Eo) - 0.05, ymax: Math.min(Math.max(Eo + 1.5, 1.6), 4), xlabel: 'α', ylabel: 'E(α)', ml: 52, mr: 8, title: 'Energía variacional frente a α' });
      pl.frame(); pl.fn((x) => VA.gaussE(g, x), { color: '--accent', width: 2.4 }); pl.hline(ex, { color: '--c2', dash: [5, 4], label: 'exacta', labelRight: true }); pl.dot(ao, Eo, { color: '--c3', r: 5 }); pl.dot(a, VA.gaussE(g, a), { color: '--accent', r: 5 });
      const q = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: -4, xmax: 4, ymin: 0, ymax: 0.9, xlabel: 'x', ylabel: '|ψ|²', ml: 48, mr: 8, title: 'Densidad: gaussiana de prueba y exacta' });
      q.frame(); const sg = Math.sqrt(a / PI); q.fn((x) => sg * Math.exp(-a * x * x), { color: '--accent', width: 2 });
      /* densidad exacta por diferencias finitas */
      const r = EM.P.q1d.fdEigen((x) => 0.5 * x * x + g * x ** 4, -7, 7, 500, 1); q.xy(r.x.filter((_, i) => i % 2 === 0), r.psi[0].filter((_, i) => i % 2 === 0).map((v) => v * v), { color: '--c2', width: 1.8, dash: [5, 3] });
      q.legend([{ label: 'prueba (α elegido)', color: '--accent' }, { label: 'exacta', color: '--c2', dash: [5, 3] }], 'tr');
      const c = PT.rs(Array.from({ length: 60 }, (_, i) => i + 0.5), PT.hoX4(60), 0, 2), s2 = c[0] + c[1] * g + c[2] * g * g;
      sim.set('e', `${EM.fix(VA.gaussE(g, a), 6)} · ${EM.fix(Eo, 6)} en α* = ${EM.fix(ao, 4)}`);
      sim.set('x', `${EM.fix(ex, 6)} · ${EM.sci(Eo - ex, 3)} · ${EM.sci(s2 - ex, 3)}`);
    });
  });

  /* 21.2 Hidrógeno con una base de gaussianas (Rayleigh–Ritz) */
  EM.defineSim('ritz-h', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('N', { label: 'Número de gaussianas N', min: 1, max: 10, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.slider('b', { label: 'Razón entre exponentes sucesivos (base «even-tempered»)', min: 1.6, max: 8, step: 0.1, value: 4, fmt: (v) => EM.fix(v, 1) });
    sim.slider('a0', { label: 'Exponente menor (a₁)', min: 0.01, max: 0.5, step: 0.005, value: 0.1, log: true, fmt: (v) => EM.fix(v, 3) });
    sim.out('e', 'Energía variacional del estado fundamental (hartree) y exacta −0.5 · error (siempre positivo)', { hl: true });
    sim.out('p', 'ψ(0) calculada frente a la exacta 1/√π = 0.5642 (las gaussianas no reproducen la cúspide) · ⟨r⟩ calculado y exacto 1.5');
    sim.out('o', 'Energías de los demás estados de la base (hartree): solo el primero es físico; los restantes son «pseudoestados» ≥ el nivel exacto superior (teorema de separación)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, N = Math.round(sim.p.N), exps = Array.from({ length: N }, (_, i) => sim.p.a0 * Math.pow(sim.p.b, i)), r = VA.hydrogenGTO(exps);
      EM.draw.clear(cv);
      if (!r) { sim.set('e', 'base casi linealmente dependiente: reduzca la razón'); return; }
      const nn = VA.gtoNorm(exps, r.c), ps = (x) => nn * VA.gtoPsi(exps, r.c, x);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 5, ymin: 0, ymax: 0.65, xlabel: 'r (a₀)', ylabel: 'ψ(r)', ml: 52, mr: 8, title: 'Orbital 1s: gaussianas frente a exacto' });
      pl.frame(); pl.fn((x) => Math.exp(-x) / Math.sqrt(PI), { color: '--c2', width: 2, dash: [5, 3] }); pl.fn(ps, { color: '--accent', width: 2.4 });
      pl.legend([{ label: 'e^{−r}/√π (exacta)', color: '--c2', dash: [5, 3] }, { label: 'combinación de gaussianas', color: '--accent' }], 'tr');
      /* convergencia con N para la razón y a1 elegidos */
      const Ns = [], errs = []; for (let n = 1; n <= 10; n++) { const e = Array.from({ length: n }, (_, i) => sim.p.a0 * Math.pow(sim.p.b, i)), q = VA.hydrogenGTO(e); if (q) { Ns.push(n); errs.push(Math.log10(Math.max(q.E + 0.5, 1e-16))); } }
      const q2 = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0.5, xmax: 10.5, ymin: -12, ymax: 0, xlabel: 'N', ylabel: 'log₁₀(E − E_exacta)', ml: 50, mr: 8, title: 'Convergencia de la energía con N' });
      q2.frame(); q2.xy(Ns, errs, { color: '--accent', width: 2 }); Ns.forEach((n, i) => q2.dot(n, errs[i], { color: n === N ? '--c2' : '--accent', r: n === N ? 5 : 3 }));
      /* <r> */
      let rm = 0; const nr = 1500, rmax = 14; for (let i = 0; i < nr; i++) { const x = (rmax * (i + 0.5)) / nr; rm += x * ps(x) ** 2 * 4 * PI * x * x * (rmax / nr); }
      sim.set('e', `${EM.fix(r.E, 8)} · ${EM.sci(r.E + 0.5, 3)}`);
      sim.set('p', `${EM.fix(ps(0), 4)} · ⟨r⟩ = ${EM.fix(rm, 4)}`);
      sim.set('o', r.vals.slice(1, 4).map((v) => EM.fix(v, 3)).join(', ') || '—');
    });
  });

  /* 21.3 Helio con carga efectiva */
  const EXACT_HE = { 2: -2.903724377, 3: -7.279913413, 4: -13.655566239, 5: -22.030971580, 6: -32.406246602 };
  EM.defineSim('helio-var', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('Z', { label: 'Carga nuclear Z (He, Li⁺, Be²⁺, B³⁺, C⁴⁺)', min: 2, max: 6, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('z', { label: 'Carga efectiva ζ de cada electrón (orbital 1s con exponente ζ)', min: 0.8, max: 6, step: 0.01, value: 1.6875, fmt: (v) => EM.fix(v, 4) });
    sim.out('e', 'E(ζ) = ζ² − 2Zζ + 5ζ/8 (hartree) · energía con ζ elegido · mínimo en ζ* = Z − 5/16', { hl: true });
    sim.out('c', 'Comparación (hartree): perturbación de 1.er orden −Z² + 5Z/8 · variacional · exacta (Pekeris) · error variacional (eV)');
    sim.out('i', 'Energía de ionización: variacional frente a experimental (He: 24.587 eV): E(ion) − E(átomo)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, Z = Math.round(sim.p.Z), z = sim.p.z, zo = VA.heliumOpt(Z), Eo = VA.heliumE(zo, Z), ex = EXACT_HE[Z], E1 = -Z * Z + 5 * Z / 8;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.8, xmax: 6, ymin: ex - 0.15 * Math.abs(ex) - 0.5, ymax: Math.max(VA.heliumE(0.8, Z), E1 + 3) + 0.5, xlabel: 'ζ', ylabel: 'E (hartree)', ml: 56, mr: 14, title: `Helio-like Z = ${Z}: energía variacional frente a la carga efectiva` });
      pl.frame(); pl.fn((x) => VA.heliumE(x, Z), { color: '--accent', width: 2.4 });
      pl.hline(E1, { color: '--ink-3', dash: [3, 4], label: '1.er orden', labelRight: true }); pl.hline(ex, { color: '--c2', dash: [6, 4], label: 'exacta', labelRight: true }); pl.hline(-Z * Z, { color: '--ink-3', dash: [2, 5], label: 'sin repulsión', labelRight: true });
      pl.dot(zo, Eo, { color: '--c3', r: 5 }); pl.dot(z, VA.heliumE(z, Z), { color: '--accent', r: 5 });
      sim.set('e', `${EM.fix(VA.heliumE(z, Z), 5)} · ${EM.fix(Eo, 6)} en ζ* = ${EM.fix(zo, 4)}`);
      sim.set('c', `${EM.fix(E1, 5)} · ${EM.fix(Eo, 6)} · ${EM.fix(ex, 6)} · ${EM.fix((Eo - ex) * EHEV, 3)} eV`);
      const ionE = -(Z * Z) / 2; sim.set('i', `${EM.fix((ionE - Eo) * EHEV, 4)} eV (variacional) · ${EM.fix((ionE - ex) * EHEV, 4)} eV (exacto no relativista)`);
    });
  });

  /* 21.4 Ion molecular H₂⁺: LCAO */
  EM.defineSim('h2plus-lcao', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('R', { label: 'Distancia internuclear R (a₀)', min: 0.6, max: 8, step: 0.01, value: 2.5, fmt: (v) => EM.fix(v, 2) });
    sim.out('s', 'Integral de solapamiento <i>S</i> · integral de Coulomb <i>j</i> · integral de intercambio <i>k</i> (hartree)', { hl: true });
    sim.out('e', 'Energías de los orbitales enlazante σ<sub>g</sub> y antienlazante σ<sub>u</sub> con la repulsión nuclear 1/R (hartree)');
    sim.out('d', 'Mínimo de σ<sub>g</sub>: <i>R</i><sub>e</sub> y energía de disociación <i>D</i><sub>e</sub> = −½ − <i>E</i>(<i>R</i><sub>e</sub>) frente a la exacta (<i>R</i><sub>e</sub> = 1.997, <i>D</i><sub>e</sub> = 2.793 eV)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, R = sim.p.R, h = VA.h2plus(R), mn = VA.h2plusMin();
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0.6, xmax: 8, ymin: -0.7, ymax: 0.2, xlabel: 'R (a₀)', ylabel: 'E (hartree)', ml: 52, mr: 8, title: 'H₂⁺: curvas de energía potencial LCAO' });
      pl.frame(); pl.hline(-0.5, { color: '--ink-3', dash: [4, 4], label: 'H + p', labelRight: true });
      pl.fn((x) => VA.h2plus(x).g, { color: '--accent', width: 2.4 }); pl.fn((x) => VA.h2plus(x).u, { color: '--c2', width: 2 }); pl.dot(mn.R, mn.E, { color: '--c3', r: 5 }); pl.vline(R, { color: '--ink-3', dash: [3, 3] });
      pl.legend([{ label: 'σg (enlazante)', color: '--accent' }, { label: 'σu (antienlazante)', color: '--c2' }], 'tr');
      /* densidades a lo largo del eje */
      const q = new EM.Plot(ctx, { x: W * 0.64, y: 0, w: W * 0.36, h: H, xmin: -4, xmax: 4, ymin: 0, ymax: 0.6, xlabel: 'z (a₀)', ylabel: '|ψ|² sobre el eje', ml: 48, mr: 8, title: `Densidad con R = ${EM.fix(R, 2)}` });
      q.frame(); const f1 = (z, s) => { const a = Math.exp(-Math.abs(z + R / 2)), b = Math.exp(-Math.abs(z - R / 2)); return (a + s * b) / Math.sqrt(PI); }; const ng = 2 * (1 + h.S), nu = 2 * (1 - h.S);
      q.fn((z) => (f1(z, 1) ** 2) / ng, { color: '--accent', width: 2 }); q.fn((z) => (f1(z, -1) ** 2) / nu, { color: '--c2', width: 2 });
      sim.set('s', `${EM.fix(h.S, 5)} · ${EM.fix(h.j, 5)} · ${EM.fix(h.k, 5)}`);
      sim.set('e', `${EM.fix(h.g, 5)} · ${EM.fix(h.u, 5)}`);
      sim.set('d', `${EM.fix(mn.R, 3)} a₀ y ${EM.fix((-0.5 - mn.E) * EHEV, 3)} eV`);
    });
  });
})();
