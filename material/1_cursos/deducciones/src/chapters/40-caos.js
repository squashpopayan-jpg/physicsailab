/* Capítulo 40 — Caos y sistemas no lineales */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI;

  /* ---- Mapa logístico ---- */
  const lg = (r) => {
    let x = 0.3;
    for (let i = 0; i < 500; i++) x = r * x * (1 - x);
    let s = 0;
    for (let i = 0; i < 2000; i++) { x = r * x * (1 - x); s += Math.log(Math.abs(r * (1 - 2 * x))); }
    return s / 2000;
  };
  EM.formula('caos-logistico', {
    gx: 'r',
    params: [
      { k: 'r', label: 'Parámetro de crecimiento <i>r</i> del mapa <i>x</i><sub>n+1</sub> = <i>r x</i><sub>n</sub>(1 − <i>x</i><sub>n</sub>)', min: 1.5, max: 4, value: 3.9, fmt: (v) => EM.sci(v, 6) }
    ],
    outs: [
      { k: 'xs', label: 'Punto fijo <i>x</i>* = 1 − 1/<i>r</i>', short: 'x*', f: (p) => 1 - 1 / p.r, fmt: (v) => EM.sci(v, 8) },
      { k: 'mu', label: 'Multiplicador <i>f</i>′(<i>x</i>*) = 2 − <i>r</i>', short: 'f′(x*)', f: (p) => 2 - p.r, fmt: (v) => EM.sci(v, 8) },
      { k: 'st', label: 'Estable (1) si |2 − <i>r</i>| < 1, es decir, 1 < <i>r</i> < 3', short: 'estabilidad', f: (p) => (Math.abs(2 - p.r) < 1 ? 1 : 0), fmt: (v) => EM.sci(v, 3) },
      { k: 'ly', label: 'Exponente de Lyapunov λ = ⟨ln|<i>r</i>(1 − 2<i>x</i>)|⟩ (2000 iteraciones)', short: 'λ', f: (p) => lg(p.r), fmt: (v) => EM.sci(v, 8), hl: true }
    ]
  });

  /* ---- Lorenz ---- */
  EM.formula('caos-lorenz', {
    gx: 'r',
    params: [
      { k: 's', label: 'Número de Prandtl σ (clásico: 10)', min: 6, max: 20, value: 10, fmt: (v) => EM.sci(v, 5) },
      { k: 'b', label: 'Razón de aspecto <i>b</i> (clásico: 8/3)', min: 0.5, max: 4, value: 8 / 3, fmt: (v) => EM.sci(v, 6) },
      { k: 'r', label: 'Número de Rayleigh reducido <i>r</i> (clásico: 28)', min: 1.01, max: 100, value: 28, log: true, fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'xs', label: 'Coordenadas de los puntos de convección <i>x</i>* = <i>y</i>* = ±√[<i>b</i>(<i>r</i> − 1)]', short: 'x*', f: (p) => Math.sqrt(p.b * (p.r - 1)), fmt: (v) => EM.sci(v, 8) },
      { k: 'zs', label: 'Altura <i>z</i>* = <i>r</i> − 1', short: 'z*', f: (p) => p.r - 1, fmt: (v) => EM.sci(v, 8) },
      { k: 'rH', label: 'Umbral de Hopf <i>r</i><sub>H</sub> = σ(σ + <i>b</i> + 3)/(σ − <i>b</i> − 1)', short: 'r_H', f: (p) => p.s * (p.s + p.b + 3) / (p.s - p.b - 1), fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'dv', label: 'Divergencia del campo ∇·<b>F</b> = −(σ + <i>b</i> + 1)', short: '∇·F', f: (p) => -(p.s + p.b + 1), fmt: (v) => EM.sci(v, 8) }
    ]
  });

  /* ---- Van der Pol ---- */
  const vdp = (mu) => {
    const dt = 1e-3;
    let x = 2, y = 0, t = 0, cross = [], xmax = -1e9, amp = 0;
    const f = (xx, yy) => [yy, mu * (1 - xx * xx) * yy - xx];
    let steps = 0;
    while (cross.length < 4 && steps < 800000) {
      const k1 = f(x, y), k2 = f(x + dt / 2 * k1[0], y + dt / 2 * k1[1]), k3 = f(x + dt / 2 * k2[0], y + dt / 2 * k2[1]), k4 = f(x + dt * k3[0], y + dt * k3[1]);
      const xn = x + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), yn = y + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      if (steps > 0 && x < 0 && xn >= 0) {
        const tc = t + dt * (-x) / (xn - x);
        if (cross.length > 0) { amp = xmax; xmax = -1e9; }
        cross.push(tc);
      }
      if (cross.length > 0 && xn > xmax) xmax = xn;
      x = xn; y = yn; t += dt; steps++;
    }
    return { T: cross[cross.length - 1] - cross[cross.length - 2], A: amp };
  };
  EM.formula('caos-vdp', {
    gx: 'mu',
    params: [
      { k: 'mu', label: 'Parámetro de no linealidad μ de <i>x</i>″ − μ(1 − <i>x</i>²)<i>x</i>′ + <i>x</i> = 0', min: 0.1, max: 8, value: 1, log: true, fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'T', label: 'Período del ciclo límite (integración numérica)', short: 'T', f: (p) => vdp(p.mu).T, fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'A', label: 'Amplitud del ciclo límite (≈ 2)', short: 'A', f: (p) => vdp(p.mu).A, fmt: (v) => EM.sci(v, 7) },
      { k: 'Ts', label: 'Período para μ pequeño 2π(1 + μ²/16)', short: 'T (μ ≪ 1)', f: (p) => 2 * PI * (1 + p.mu * p.mu / 16), fmt: (v) => EM.sci(v, 7) },
      { k: 'Tl', label: 'Período para μ grande (3 − 2 ln 2)μ + 3 α μ<sup>−1/3</sup>, α = 2.338', short: 'T (μ ≫ 1)', f: (p) => (3 - 2 * Math.LN2) * p.mu + 3 * 2.338107410459767 * Math.pow(p.mu, -1 / 3), fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Dimensión fractal ---- */
  EM.formula('caos-fractal', {
    gx: 'n',
    params: [
      { k: 'N', label: 'Número de copias <i>N</i> (Cantor: 2; Koch: 4; Sierpinski: 3)', min: 2, max: 20, value: 4, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'q', label: 'Razón de reducción 1/<i>s</i> (Cantor: 3; Koch: 3; Sierpinski: 2)', min: 2, max: 20, value: 3, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'E', label: 'Dimensión del espacio <i>E</i> (1, 2 o 3)', min: 1, max: 3, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'n', label: 'Nivel de construcción <i>n</i>', min: 0, max: 12, value: 5, fmt: (v) => EM.sci(v, 3), step: 1 }
    ],
    outs: [
      { k: 'D', label: 'Dimensión de similitud <i>D</i> = ln <i>N</i>/ln(1/<i>s</i>)', short: 'D', f: (p) => Math.log(p.N) / Math.log(p.q), fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'cd', label: 'Codimensión <i>E</i> − <i>D</i>', short: 'E − D', f: (p) => p.E - Math.log(p.N) / Math.log(p.q), fmt: (v) => EM.sci(v, 8) },
      { k: 'pc', label: 'Número de piezas en el nivel <i>n</i>: <i>N</i><sup>n</sup>', short: 'N^n', f: (p) => Math.pow(p.N, p.n), fmt: (v) => EM.sci(v, 8) },
      { k: 'ms', label: 'Medida <i>E</i>-dimensional relativa (<i>N</i>/(1/<i>s</i>)<sup>E</sup>)<sup>n</sup>', short: 'medida', f: (p) => Math.pow(p.N / Math.pow(p.q, p.E), p.n), fmt: (v) => EM.sci(v, 8) }
    ]
  });

  /* ---- Kuramoto ---- */
  EM.formula('caos-kuramoto', {
    gx: 'K',
    params: [
      { k: 'K', label: 'Intensidad del acoplamiento <i>K</i>', min: 0.05, max: 10, value: 2, log: true, fmt: (v) => EM.sci(v, 4) },
      { k: 'g', label: 'Semianchura γ de la distribución lorentziana de frecuencias', min: 0.05, max: 2, value: 0.5, log: true, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'Kc', label: 'Acoplamiento crítico <i>K</i><sub>c</sub> = 2/(π<i>g</i>(0)) = 2γ', short: 'K_c', f: (p) => 2 * p.g, fmt: (v) => EM.sci(v, 8) },
      { k: 'r', label: 'Parámetro de orden <i>r</i> = √(1 − <i>K</i><sub>c</sub>/<i>K</i>) (0 si <i>K</i> ≤ <i>K</i><sub>c</sub>)', short: 'r', f: (p) => (p.K > 2 * p.g ? Math.sqrt(1 - 2 * p.g / p.K) : 0), fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'fl', label: 'Fracción de osciladores sincronizados (2/π) arctan(<i>Kr</i>/γ)', short: 'sincronizados', f: (p) => { const r = p.K > 2 * p.g ? Math.sqrt(1 - 2 * p.g / p.K) : 0; return 2 / PI * Math.atan(p.K * r / p.g); }, fmt: (v) => EM.sci(v, 8) }
    ]
  });
})();
