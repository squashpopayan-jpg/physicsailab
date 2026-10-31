/* Capítulo 32 — Medida cuántica y decoherencia */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, PI = Math.PI;
  const erf = (x) => EM.P.sf.erf(x);

  /* 32.1 Medida de von Neumann: el aparato se entrelaza con el sistema */
  EM.defineSim('medida-vn', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('g', { label: 'Desplazamiento del puntero para cada estado del qubit, ±d (en unidades de σ de la posición inicial del puntero)', min: 0, max: 6, step: 0.05, value: 1.5, fmt: (v) => EM.fix(v, 2) });
    sim.slider('c', { label: 'Amplitud del qubit en |0⟩: cos(θ/2) (el estado del sistema es cos|0⟩ + sen|1⟩)', min: 0.05, max: 0.99, step: 0.01, value: 0.7071, fmt: (v) => EM.fix(v, 3) });
    sim.out('o', 'Solapamiento de los dos estados del puntero ⟨p₀|p₁⟩ = e<sup>−<i>d</i>²/2σ²</sup> · coherencia que queda del qubit |ρ₀₁| = cos·sen·⟨p₀|p₁⟩', { hl: true });
    sim.out('v', 'Visibilidad V = ⟨p₀|p₁⟩ (de la interferencia posible) y distinguibilidad D = √(1 − V²) (información de camino): relación de Englert V² + D² = 1 en el caso puro');
    sim.out('e', 'Entropía del qubit tras la medida (bits) · probabilidades de 0 y 1 (que no cambian: la medida no destruye las poblaciones)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, d = sim.p.g, c = sim.p.c, s = Math.sqrt(1 - c * c), ov = Math.exp(-d * d / 2), r01 = c * s * ov;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: -7, xmax: 7, ymin: 0, ymax: 0.5, xlabel: 'posición del puntero x/σ', ylabel: 'densidad de probabilidad del puntero', ml: 52, mr: 8, title: 'Estados del puntero asociados a |0⟩ y |1⟩' });
      pl.frame(); const g1 = (x, m) => Math.exp(-((x - m) ** 2) / 2) / Math.sqrt(2 * PI); pl.fn((x) => c * c * g1(x, -d), { color: '--c1', width: 2 }); pl.fn((x) => s * s * g1(x, d), { color: '--c2', width: 2 }); pl.fn((x) => c * c * g1(x, -d) + s * s * g1(x, d), { color: '--accent', width: 2.4 });
      pl.legend([{ label: '|c|² · puntero (|0⟩)', color: '--c1' }, { label: '|s|² · puntero (|1⟩)', color: '--c2' }, { label: 'distribución total', color: '--accent' }], 'tr');
      const q = new EM.Plot(ctx, { x: W * 0.62, y: 0, w: W * 0.38, h: H, xmin: 0, xmax: 6, ymin: 0, ymax: 1.05, xlabel: 'd/σ', ylabel: 'V, D', ml: 44, mr: 8, title: 'V² + D² = 1' });
      q.frame(); q.fn((x) => Math.exp(-x * x / 2), { color: '--accent', width: 2.2 }); q.fn((x) => Math.sqrt(1 - Math.exp(-x * x)), { color: '--c2', width: 2.2, dash: [5, 3] }); q.vline(d, { color: '--ink-3', dash: [3, 3] }); q.legend([{ label: 'V (interferencia)', color: '--accent' }, { label: 'D (información de camino)', color: '--c2', dash: [5, 3] }], 'mr');
      const rho = [[c * c, r01], [r01, s * s]], ev = [(1 + Math.sqrt(1 - 4 * (rho[0][0] * rho[1][1] - r01 * r01))) / 2, (1 - Math.sqrt(1 - 4 * (rho[0][0] * rho[1][1] - r01 * r01))) / 2], S = ev.reduce((t, x) => t - (x > 1e-14 ? x * Math.log2(x) : 0), 0);
      sim.set('o', `${EM.fix(ov, 5)} · |ρ₀₁| = ${EM.fix(r01, 5)} (inicial ${EM.fix(c * s, 5)})`);
      sim.set('v', `V = ${EM.fix(ov, 5)} · D = ${EM.fix(Math.sqrt(1 - ov * ov), 5)} · V² + D² = ${EM.fix(ov * ov + 1 - ov * ov, 3)}`);
      sim.set('e', `${EM.fix(S, 5)} bits · P(0) = ${EM.fix(c * c, 4)}, P(1) = ${EM.fix(s * s, 4)}`);
    });
  });

  /* 32.2 Decoherencia por un baño de espines */
  EM.defineSim('bano-espines', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('N', { label: 'Número de espines del entorno N', min: 1, max: 60, step: 1, value: 20, fmt: (v) => v.toFixed(0) });
    sim.slider('s', { label: 'Dispersión relativa de los acoplamientos g_k (0 = todos iguales)', min: 0, max: 1, step: 0.01, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.out('t', 'Tiempo de decoherencia T<sub>2</sub> = 1/√(Σ<i>g</i><sub>k</sub>²) (decaimiento gaussiano) · coherencia |ρ₀₁(t)| = ½ Π cos(<i>g</i><sub>k</sub><i>t</i>)', { hl: true });
    sim.out('r', 'Reaparición: con todos los acoplamientos iguales la coherencia reaparece en <i>t</i> = π/<i>g</i> (si hay pocos espines); con dispersión de acoplamientos y muchos espines, nunca (recurrencia de Poincaré ≈ ∞)');
    sim.out('p', 'Pureza del qubit en ese instante Tr ρ<sub>S</sub>² = ½[1 + (2|ρ₀₁|)²] · valor mínimo alcanzado');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, N = Math.round(sim.p.N), sp = sim.p.s;
      let sd = 4242; const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
      const gk = Array.from({ length: N }, () => 1 + sp * (2 * rnd() - 1)), g2 = gk.reduce((t, x) => t + x * x, 0), T2 = 1 / Math.sqrt(g2);
      EM.draw.clear(cv);
      const tmax = Math.min(8, 7 * T2 + 1), ts = Array.from({ length: 800 }, (_, i) => (tmax * i) / 799), coh = ts.map((t) => Math.abs(gk.reduce((p, g) => p * Math.cos(g * t), 1)));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 0, xmax: tmax, ymin: 0, ymax: 1.05, xlabel: 't (en unidades de 1/g̅)', ylabel: '2|ρ₀₁(t)| (coherencia relativa)', ml: 52, mr: 8, title: 'Pérdida de coherencia de un qubit por el entorno' });
      pl.frame(); pl.xy(ts, coh, { color: '--accent', width: 2 }); pl.fn((t) => Math.exp(-0.5 * g2 * t * t), { color: '--c2', width: 1.8, dash: [6, 4] }); pl.vline(T2, { color: '--ink-3', dash: [3, 3], label: 'T₂', labelRight: true });
      pl.legend([{ label: 'exacta Π cos(g_k t)', color: '--accent' }, { label: 'gaussiana exp(−Σg²t²/2)', color: '--c2', dash: [6, 4] }], 'tr');
      const pur = coh.map((c) => 0.5 * (1 + c * c)), q = new EM.Plot(ctx, { x: W * 0.62, y: 0, w: W * 0.38, h: H, xmin: 0, xmax: tmax, ymin: 0.5, ymax: 1.02, xlabel: 't', ylabel: 'pureza Tr ρ_S²', ml: 44, mr: 8, title: 'El qubit pasa de puro a mezclado' });
      q.frame(); q.xy(ts, pur, { color: '--c3', width: 2 });
      const half = ts.findIndex((t, i) => coh[i] < 0.5), late = coh.slice(Math.floor(coh.length / 2)).reduce((m, x) => Math.max(m, x), 0);
      sim.set('t', `T₂ = ${EM.fix(T2, 4)} · 2|ρ₀₁| cae a 1/2 en t = ${half > 0 ? EM.fix(ts[half], 3) : '> ' + EM.fix(tmax, 2)} (gaussiana: ${EM.fix(Math.sqrt(2 * Math.LN2) * T2, 3)})`);
      sim.set('r', `máxima coherencia en la segunda mitad del intervalo: ${EM.fix(late, 4)} ${late > 0.5 ? '(¡reaparición!)' : ''}`);
      sim.set('p', `mínimo ${EM.fix(Math.min(...pur), 5)} (límite: ½) · en t = T₂: ${EM.fix(0.5 * (1 + Math.exp(-1)), 4)}`);
    });
  });

  /* 32.3 Decoherencia de un gato de Schrödinger en un oscilador amortiguado (T = 0) */
  EM.defineSim('gato', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('a', { label: 'Amplitud α del gato (|α⟩ + |−α⟩): número medio de cuantos n̄ = α²', min: 0.2, max: 6, step: 0.05, value: 2, fmt: (v) => EM.fix(v, 2) + ' (n̄ = ' + EM.fix(v * v, 1) + ')' });
    sim.slider('t', { label: 'Tiempo γt (γ = tasa de pérdida de energía del oscilador)', min: 0, max: 1, step: 0.002, value: 0.05, fmt: (v) => EM.fix(v, 3) });
    sim.out('r', 'Coherencia entre las dos copias del gato: exp[−½|α₁ − α₂|²(1 − e<sup>−γt</sup>)] con |α₁ − α₂|² = 4α² · valor en el instante elegido', { hl: true });
    sim.out('c', 'Tiempo de decoherencia τ<sub>D</sub> = 1/(2γα²) frente al tiempo de relajación 1/γ: τ<sub>D</sub>γ = 1/(2<i>n̄</i>)');
    sim.out('w', 'Las poblaciones de los estados coherentes decaen a la tasa γ (se pierde energía lentamente) mientras que las coherencias lo hacen a la tasa 2γ<i>n̄</i>: la decoherencia precede a la disipación');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, a = sim.p.a, g = sim.p.t, D2 = 4 * a * a, dec = (x, d2) => Math.exp(-0.5 * d2 * (1 - Math.exp(-x)));
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.52, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: 1.05, xlabel: 'γt', ylabel: 'coherencia relativa de las copias del gato', ml: 50, mr: 8, title: 'Decaimiento de la coherencia (cada curva, un tamaño de gato)' });
      pl.frame(); [0.5, 1, 2, 3].forEach((aa, i) => pl.fn((x) => dec(x, 4 * aa * aa), { color: ['--c1', '--c2', '--c3', '--c4'][i], width: 1.4, dash: [4, 3] })); pl.fn((x) => dec(x, D2), { color: '--accent', width: 2.6 }); pl.fn((x) => Math.exp(-x), { color: '--ink-3', width: 1.3, dash: [2, 3] }); pl.vline(g, { color: '--ink-3', dash: [3, 3] });
      pl.legend([{ label: 'α actual', color: '--accent' }, { label: 'población e^{−γt}', color: '--ink-3', dash: [2, 3] }], 'tr');
      const ns = Array.from({ length: 80 }, (_, i) => Math.exp(Math.log(0.1) + (Math.log(1000) * i) / 79)), q = new EM.Plot(ctx, { x: W * 0.54, y: 0, w: W * 0.46, h: H, xmin: 0.1, xmax: 100, ymin: 1e-3, ymax: 10, xlog: true, ylog: true, xlabel: 'n̄ = α² (tamaño del gato)', ylabel: 'τ_D / (1/γ)', ml: 50, mr: 8, title: 'Cuanto más grande, más rápido decohere' });
      q.frame(); q.xy(ns.filter((n) => n <= 100), ns.filter((n) => n <= 100).map((n) => 1 / (2 * n)), { color: '--accent', width: 2.4 }); q.dot(a * a, 1 / (2 * a * a), { color: '--c3', r: 6 });
      sim.set('r', `${EM.fix(dec(g, D2), 5)} a γt = ${EM.fix(g, 3)} (para n̄ = ${EM.fix(a * a, 2)})`);
      sim.set('c', `τ_D = ${EM.fix(1 / (2 * a * a), 4)}/γ · τ_Dγ = ${EM.fix(1 / (2 * a * a), 4)}`);
      sim.set('w', `a γt = ${EM.fix(g, 3)}: población ${EM.fix(Math.exp(-g), 4)} · coherencia ${EM.fix(dec(g, D2), 5)}`);
    });
  });
})();
