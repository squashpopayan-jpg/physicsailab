/* Capítulo 23 — Perturbaciones dependientes del tiempo y regla de oro de Fermi */
(function () {
  'use strict';
  const EM = window.EM, TD = EM.qm.tdep, M = EM.M, PI = Math.PI;

  /* 23.1 Pulsos: la probabilidad de transición es la transformada de Fourier del pulso */
  const SHAPES = {
    sq: ['Cuadrado (duración T)', (T) => (t) => 1],
    ga: ['Gaussiano (σ = T/4)', (T) => (t) => Math.exp(-((t - T / 2) ** 2) / (2 * (T / 4) ** 2))],
    sin: ['Seno cuadrado sin²(πt/T)', (T) => (t) => Math.sin((PI * t) / T) ** 2]
  };
  EM.defineSim('pulso-tdpt', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('f', { label: 'Forma del pulso', options: Object.entries(SHAPES).map(([k, v]) => [k, v[0]]), value: 'sq' });
    sim.slider('T', { label: 'Duración T del pulso (unidades de 1/Ω)', min: 1, max: 40, step: 0.5, value: 12, fmt: (v) => EM.fix(v, 1) });
    sim.slider('V', { label: 'Acoplamiento (frecuencia de Rabi Ω)', min: 0.01, max: 1.0, step: 0.01, value: 0.1, log: true, fmt: (v) => EM.fix(v, 2) });
    sim.slider('D', { label: 'Desintonía Δ = ω₀ − ω del punto marcado', min: -1.5, max: 1.5, step: 0.01, value: 0.2, fmt: (v) => EM.fix(v, 2) });
    sim.out('p', 'Probabilidad de primer orden P = (Ω/2)²|∫g(t)e<sup>iΔt</sup>dt|² · exacta (integración numérica de la ecuación de Schrödinger) en la desintonía elegida', { hl: true });
    sim.out('w', 'Anchura a mitad de altura del espectro Δω (primer orden) · producto Δω·T (la relación de incertidumbre tiempo–frecuencia)');
    sim.out('v', 'Validez de la teoría de perturbaciones: P ≪ 1 · si P de primer orden pasa de ~0.2 hay que usar Rabi (cap. 5)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, T = sim.p.T, V = sim.p.V, D = sim.p.D, g = SHAPES[sim.p.f][1](T);
      EM.draw.clear(cv);
      const Ds = Array.from({ length: 241 }, (_, i) => -1.5 + (3 * i) / 240), P1 = Ds.map((d) => TD.firstOrderPulse(g, T, d, V, 600));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: -1.5, xmax: 1.5, ymin: 0, ymax: Math.max(...P1) * 1.15 + 1e-9, xlabel: 'Δ = ω₀ − ω', ylabel: 'P (primer orden)', ml: 56, mr: 8, title: 'Espectro de excitación = |FT del pulso|²' });
      pl.frame(); pl.xy(Ds, P1, { color: '--accent', width: 2.4 });
      /* exacta en 11 puntos (RK4) */
      const De = Array.from({ length: 31 }, (_, i) => -1.5 + (3 * i) / 30), Hf = (d) => (t) => { const a = (V / 2) * g(t); return { re: [Float64Array.of(0, a), Float64Array.of(a, 0)], im: [new Float64Array(2), new Float64Array(2)] }; };
      const ex = (d) => { const r = TD.evolve((t) => { const a = (V / 2) * g(t), c = Math.cos(d * t), s = Math.sin(d * t); return { re: [Float64Array.of(0, a * c), Float64Array.of(a * c, 0)], im: [Float64Array.of(0, a * s), Float64Array.of(-a * s, 0)] }; }, { re: Float64Array.of(1, 0), im: new Float64Array(2) }, 0, T, 400); return r.re[1] ** 2 + r.im[1] ** 2; };
      const Pe = De.map(ex); pl.xy(De, Pe, { color: '--c2', width: 1.6, dash: [5, 3] }); De.forEach((d, i) => pl.dot(d, Pe[i], { color: '--c2', r: 2.6 }));
      pl.vline(D, { color: '--ink-3', dash: [3, 3] }); pl.legend([{ label: 'primer orden', color: '--accent' }, { label: 'exacta (numérica)', color: '--c2', dash: [5, 3] }], 'tr');
      /* envolvente del pulso */
      const q = new EM.Plot(ctx, { x: W * 0.64, y: 0, w: W * 0.36, h: H, xmin: 0, xmax: T, ymin: 0, ymax: 1.1, xlabel: 't', ylabel: 'g(t)', ml: 40, mr: 8, title: 'Envolvente del pulso' });
      q.frame(); q.fn(g, { color: '--c3', width: 2.2 });
      const pmax = Math.max(...P1); let lo = 0, hi = Ds.length - 1; const half = Ds.map((_, i) => P1[i] >= pmax / 2 ? i : -1).filter((i) => i >= 0); lo = half[0]; hi = half[half.length - 1]; const fw = Ds[hi] - Ds[lo];
      const P1d = TD.firstOrderPulse(g, T, D, V, 2000), Pex = ex(D);
      sim.set('p', `${EM.fix(P1d, 6)} · ${EM.fix(Pex, 6)}`);
      sim.set('w', `${EM.fix(fw, 4)} · ${EM.fix(fw * T, 3)}`);
      sim.set('v', `${P1d < 0.2 ? 'sí' : 'no'} (P = ${EM.fix(P1d, 4)}) · ${EM.fix(Math.abs(P1d - Pex) / Math.max(Pex, 1e-12) * 100, 3)} % de diferencia`);
    });
  });

  /* 23.2 Regla de oro: decaimiento de un estado discreto en un cuasicontinuo */
  EM.defineSim('regla-oro', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('V', { label: 'Acoplamiento V (ħ = 1)', min: 0.002, max: 0.1, step: 0.001, value: 0.01, log: true, fmt: (v) => EM.fix(v, 3) });
    sim.slider('eps', { label: 'Espaciado ε entre los niveles de la banda (densidad de estados ρ = 1/ε)', min: 0.02, max: 0.3, step: 0.005, value: 0.1, fmt: (v) => EM.fix(v, 3) });
    sim.slider('N', { label: 'Número de niveles de la banda N', min: 20, max: 300, step: 10, value: 200, fmt: (v) => v.toFixed(0) });
    sim.out('g', 'Tasa de la regla de oro Γ = 2π|V|²ρ = 2π<i>V</i>²/ε · vida media 1/Γ', { hl: true });
    sim.out('t', 'Tiempo de retorno de Poincaré 2π/ε (reaparición del estado inicial) · supervivencia en ese instante · ancho de banda N·ε');
    sim.out('c', 'Condiciones de validez: Γ ≪ ancho de banda; Γ ≪ ε no vale (si Γ ≳ ε el decaimiento es exponencial hasta T<sub>ret</sub>); Γ·T<sub>ret</sub> = (2π)²V²/ε²');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, V = sim.p.V, eps = sim.p.eps, N = Math.round(sim.p.N), b = TD.bandDecay(N, eps, V), G = TD.golden(V, eps), Tr = (2 * PI) / eps;
      EM.draw.clear(cv);
      const tmax = 1.6 * Tr, ts = Array.from({ length: 700 }, (_, i) => (tmax * i) / 699), P = ts.map((t) => b.P0(t));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.64, h: H, xmin: 0, xmax: tmax, ymin: 0, ymax: 1.05, xlabel: 't', ylabel: '|⟨0|ψ(t)⟩|² (supervivencia)', ml: 54, mr: 8, title: 'Decaimiento exponencial y reaparición de Poincaré' });
      pl.frame(); pl.fn((t) => Math.exp(-G * t), { color: '--c2', width: 1.8, dash: [6, 4] }); pl.xy(ts, P, { color: '--accent', width: 2.2 }); pl.vline(Tr, { color: '--ink-3', dash: [3, 3], label: '2π/ε', labelRight: true });
      pl.legend([{ label: 'exacta (N + 1 niveles)', color: '--accent' }, { label: 'e^{−Γt} (regla de oro)', color: '--c2', dash: [6, 4] }], 'tr');
      const q = new EM.Plot(ctx, { x: W * 0.66, y: 0, w: W * 0.34, h: H, xmin: -N * eps / 2, xmax: N * eps / 2, ymin: 0, ymax: Math.max(...b.w) * 1.1, xlabel: 'E', ylabel: 'peso |⟨k|0⟩|²', ml: 44, mr: 8, title: 'Ensanchamiento de Breit–Wigner' });
      q.frame(); q.fn((E) => (eps / (2 * PI)) * G / (E * E + (G / 2) ** 2) / 1 * 1, { color: '--c2', width: 1.4, dash: [4, 3] }); q.xy(b.E.slice(), b.w.slice(), { color: '--accent', width: 1.4 }); b.E.forEach((E, i) => q.dot(E, b.w[i], { color: '--accent', r: 1.8 }));
      sim.set('g', `${EM.sci(G, 4)} · τ = ${EM.fix(1 / G, 3)}`);
      sim.set('t', `${EM.fix(Tr, 3)} · ${EM.fix(b.P0(Tr), 4)} · ${EM.fix(N * eps, 3)}`);
      sim.set('c', `Γ/ε = ${EM.fix(G / eps, 4)} · Γ·T_ret = ${EM.fix(G * Tr, 4)}`);
    });
  });

  /* 23.3 Coeficientes de Einstein: emisión estimulada, espontánea y radiación térmica */
  const KB = 1.380649e-23, HP = 6.62607015e-34, CL = 299792458;
  EM.defineSim('einstein-ab', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('T', { label: 'Temperatura del campo de radiación T (K)', min: 2, max: 20000, step: 1, value: 5800, log: true, fmt: (v) => v.toFixed(0) + ' K' });
    sim.select('l', { label: 'Transición', options: [['lya', 'Lyman-α del H (121.5 nm), A = 6.27×10⁸ s⁻¹'], ['ha', 'Hα (656.5 nm), A = 4.41×10⁷ s⁻¹'], ['21', 'Línea de 21 cm del H, A = 2.88×10⁻¹⁵ s⁻¹'], ['na', 'Na D (589 nm), A = 6.16×10⁷ s⁻¹'], ['ir', 'Infrarrojo de 10 µm, A = 10 s⁻¹']], value: 'ha' });
    sim.out('n', 'Número medio de fotones por modo <i>n̄</i> = 1/(e<sup>hν/kT</sup> − 1) a la frecuencia de la transición', { hl: true });
    sim.out('r', 'Cociente emisión estimulada/espontánea = <i>n̄</i> · el cociente absorción/emisión espontánea = <i>n̄</i> (g₁ = g₂)');
    sim.out('b', 'Coeficiente de Einstein B₂₁ = π²c³A/(ħω³) (m³ J⁻¹ s⁻²) y tiempo de vida espontáneo 1/A');
    const L = { lya: [121.567e-9, 6.2649e8], ha: [656.28e-9, 4.4101e7], 21: [0.21106, 2.8843e-15], na: [589.0e-9, 6.16e7], ir: [10e-6, 10] };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, T = sim.p.T, [lam, A] = L[sim.p.l], nu = CL / lam, x = (HP * nu) / (KB * T), nb = 1 / Math.expm1(x), om = 2 * PI * nu, B = (PI * PI * CL ** 3 * A) / (HP / (2 * PI) * om ** 3);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: -7, xmax: 3, ymin: -30, ymax: 6, xlabel: 'log₁₀ (λ / µm)', ylabel: 'log₁₀ n̄ (fotones por modo)', ml: 56, mr: 12, title: 'Ocupación de los modos de un cuerpo negro: estimulada frente a espontánea' });
      pl.frame();
      const ls = Array.from({ length: 200 }, (_, i) => -7 + (10 * i) / 199), f = (T2) => ls.map((l) => { const xx = (HP * CL) / (Math.pow(10, l) * 1e-6 * KB * T2); return Math.max(-30, Math.min(6, Math.log10(1 / Math.expm1(xx)))); });
      pl.xy(ls, f(T), { color: '--accent', width: 2.4 }); pl.xy(ls, f(2.725), { color: '--c3', width: 1.4, dash: [4, 3] }); pl.hline(0, { color: '--ink-3', dash: [3, 4], label: 'n̄ = 1: estimulada = espontánea', labelRight: false });
      pl.dot(Math.log10(lam * 1e6), Math.max(-30, Math.min(6, Math.log10(nb))), { color: '--c2', r: 6 });
      pl.legend([{ label: `T = ${T.toFixed(0)} K`, color: '--accent' }, { label: 'fondo cósmico 2.725 K', color: '--c3', dash: [4, 3] }], 'tr');
      sim.set('n', `${EM.sci(nb, 4)} (hν/kT = ${EM.fix(x, 4)})`);
      sim.set('r', `${EM.sci(nb, 4)} · ${nb > 1 ? 'domina la emisión estimulada (efecto láser/máser posible)' : 'domina la espontánea'}`);
      sim.set('b', `${EM.sci(B, 4)} m³J⁻¹s⁻² · 1/A = ${EM.sci(1 / A, 3)} s`);
    });
  });
})();
