/* Capítulo 11 — Mecánica analítica */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, RAD = PI / 180;

  EM.formula('aro', {
    gx: 'r',
    params: [
      { k: 'R', label: 'Radio del aro <i>R</i>', min: 0.1, max: 2, value: 0.5, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) },
      { k: 'r', label: 'Razón ω/ω<sub>c</sub> entre la velocidad del aro y la crítica', min: 1.01, max: 5, value: 1.5, fmt: (v) => EM.fix(v, 3) }
    ],
    outs: [
      { k: 'wc', label: 'Velocidad angular crítica ω<sub>c</sub> = √(<i>g</i>/<i>R</i>)', short: 'ω crítica', f: (p) => Math.sqrt(p.g / p.R), unit: 'rad/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'th', label: 'Ángulo de equilibrio θ₀ = arccos(<i>g</i>/ω²<i>R</i>) = arccos(1/<i>r</i>²)', short: 'θ₀', f: (p) => Math.acos(1 / (p.r * p.r)) / RAD, unit: '°', fmt: (v) => EM.fix(v, 4), hl: true },
      { k: 'wo', label: 'Frecuencia de pequeñas oscilaciones ω sen θ₀', short: 'ω de oscilación', f: (p) => p.r * Math.sqrt(p.g / p.R) * Math.sqrt(1 - Math.pow(p.r, -4)), unit: 'rad/s', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const cyc = (p) => { const ph = p.ph, x = p.R * (ph - Math.sin(ph)), y = p.R * (1 - Math.cos(ph)); return { x, y, Tc: ph * Math.sqrt(p.R / p.g), Tl: Math.sqrt(2 * (x * x + y * y) / (p.g * y)) }; };
  EM.formula('braquistocrona', {
    gx: 'ph',
    params: [
      { k: 'R', label: 'Radio del círculo generador de la cicloide <i>R</i>', min: 0.1, max: 10, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'ph', label: 'Ángulo de rodadura al llegar φ<sub>B</sub> (π: punto más bajo)', min: 0.2, max: 6, value: PI, unit: 'rad', fmt: (v) => EM.fix(v, 3), angle: true },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'Tc', label: 'Tiempo por la cicloide <i>T</i> = φ<sub>B</sub>√(<i>R</i>/<i>g</i>)', short: 'T cicloide', f: (p) => cyc(p).Tc, unit: 's', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'Tl', label: 'Tiempo por la recta que une los mismos puntos', short: 'T recta', f: (p) => cyc(p).Tl, unit: 's', fmt: (v) => EM.sci(v, 6) },
      { k: 'x', label: 'Punto de llegada <i>x</i> = <i>R</i>(φ − sen φ)', short: 'x_B', f: (p) => cyc(p).x, unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 'y', label: 'Punto de llegada <i>y</i> = <i>R</i>(1 − cos φ) (hacia abajo)', short: 'y_B', f: (p) => cyc(p).y, unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 'ra', label: 'Cociente <i>T</i>cicloide/<i>T</i>recta', short: 'cociente', f: (p) => { const c = cyc(p); return c.Tc / c.Tl; }, fmt: (v) => EM.fix(v, 6) }
    ]
  });

  EM.formula('conico', {
    gx: 'th',
    params: [
      { k: 'L', label: 'Longitud del hilo <i>L</i>', min: 0.1, max: 5, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'th', label: 'Ángulo con la vertical θ', min: 5, max: 80, value: 30, unit: '°', fmt: (v) => EM.fix(v, 1), angle: true },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'w', label: 'Velocidad angular ω = √(<i>g</i>/(<i>L</i> cos θ))', short: 'ω', f: (p) => Math.sqrt(p.g / (p.L * Math.cos(p.th * RAD))), unit: 'rad/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'T', label: 'Periodo 2π√(<i>L</i> cos θ/<i>g</i>)', short: 'T', f: (p) => 2 * PI * Math.sqrt(p.L * Math.cos(p.th * RAD) / p.g), unit: 's', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'v', label: 'Rapidez √(<i>gL</i> sen θ tan θ)', short: 'v', f: (p) => Math.sqrt(p.g * p.L * Math.sin(p.th * RAD) * Math.tan(p.th * RAD)), unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'Tn', label: 'Tensión en pesos <i>T</i>/<i>mg</i> = 1/cos θ', short: 'tensión/peso', f: (p) => 1 / Math.cos(p.th * RAD), fmt: (v) => EM.fix(v, 5) }
    ]
  });

  EM.formula('hamilton', {
    gx: 'E',
    params: [
      { k: 'm', label: 'Masa <i>m</i>', min: 0.01, max: 10, value: 0.5, log: true, unit: 'kg', fmt: (v) => EM.sci(v, 3) },
      { k: 'w', label: 'Frecuencia angular ω', min: 1, max: 100, value: 20, log: true, unit: 'rad/s', fmt: (v) => EM.sci(v, 3) },
      { k: 'E', label: 'Energía <i>E</i>', min: 1e-4, max: 10, value: 0.25, log: true, unit: 'J', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'q', label: 'Semieje en posición <i>q</i><sub>máx</sub> = √(2<i>E</i>/<i>m</i>ω²)', short: 'q máx', f: (p) => Math.sqrt(2 * p.E / (p.m * p.w * p.w)), unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 'pm', label: 'Semieje en momento <i>p</i><sub>máx</sub> = √(2<i>mE</i>)', short: 'p máx', f: (p) => Math.sqrt(2 * p.m * p.E), unit: 'kg·m/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'A', label: 'Área de la elipse en el espacio de fases π<i>q</i><sub>máx</sub><i>p</i><sub>máx</sub> = 2π<i>E</i>/ω', short: 'área de fase', f: (p) => 2 * PI * p.E / p.w, unit: 'J·s', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'J', label: 'Variable de acción <i>J</i> = <i>E</i>/ω', short: 'acción J', f: (p) => p.E / p.w, unit: 'J·s', fmt: (v) => EM.sci(v, 6) },
      { k: 'n', label: 'Área en unidades de la constante de Planck <i>h</i> (número de «estados»)', short: 'A/h', f: (p) => 2 * PI * p.E / p.w / 6.62607015e-34, fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('doble', {
    gx: 'mu',
    params: [
      { k: 'L', label: 'Longitud de cada barra <i>L</i>', min: 0.1, max: 5, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'mu', label: 'Razón de masas μ = <i>m</i>₂/<i>m</i>₁ (masa inferior / superior)', min: 0.05, max: 20, value: 1, log: true, fmt: (v) => EM.sci(v, 3) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'wm', label: 'Modo lento ω₋ = √[(<i>g</i>/<i>L</i>)(1 + μ − √(μ(1+μ)))]', short: 'ω₋', f: (p) => Math.sqrt(p.g / p.L * (1 + p.mu - Math.sqrt(p.mu * (1 + p.mu)))), unit: 'rad/s', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'wp', label: 'Modo rápido ω₊ = √[(<i>g</i>/<i>L</i>)(1 + μ + √(μ(1+μ)))]', short: 'ω₊', f: (p) => Math.sqrt(p.g / p.L * (1 + p.mu + Math.sqrt(p.mu * (1 + p.mu)))), unit: 'rad/s', fmt: (v) => EM.sci(v, 6) },
      { k: 'rt', label: 'Cociente ω₊/ω₋', short: 'ω₊/ω₋', f: (p) => Math.sqrt((1 + p.mu + Math.sqrt(p.mu * (1 + p.mu))) / (1 + p.mu - Math.sqrt(p.mu * (1 + p.mu)))), fmt: (v) => EM.fix(v, 6) },
      { k: 'Tm', label: 'Periodo del modo lento 2π/ω₋', short: 'T lento', f: (p) => 2 * PI / Math.sqrt(p.g / p.L * (1 + p.mu - Math.sqrt(p.mu * (1 + p.mu)))), unit: 's', fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
