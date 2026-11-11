/* Capítulo 6 — Dinámica de la partícula */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, RAD = PI / 180;

  EM.formula('inclinado', {
    gx: 'th',
    params: [
      { k: 'th', label: 'Inclinación del plano θ', min: 20, max: 80, value: 30, unit: '°', fmt: (v) => EM.fix(v, 1), angle: true },
      { k: 'mu', label: 'Coeficiente de rozamiento cinético μ', min: 0, max: 0.35, value: 0.2, fmt: (v) => EM.fix(v, 3) },
      { k: 'L', label: 'Longitud recorrida <i>L</i>', min: 0.5, max: 20, value: 2, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'a', label: 'Aceleración <i>a</i> = <i>g</i>(sen θ − μ cos θ)', short: 'a', f: (p) => p.g * (Math.sin(p.th * RAD) - p.mu * Math.cos(p.th * RAD)), unit: 'm/s²', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 't', label: 'Tiempo en recorrer <i>L</i>: √(2<i>L</i>/<i>a</i>)', short: 't', f: (p) => Math.sqrt(2 * p.L / (p.g * (Math.sin(p.th * RAD) - p.mu * Math.cos(p.th * RAD)))), unit: 's', fmt: (v) => EM.sci(v, 5) },
      { k: 'v', label: 'Rapidez al final √(2<i>aL</i>)', short: 'v', f: (p) => Math.sqrt(2 * p.L * p.g * (Math.sin(p.th * RAD) - p.mu * Math.cos(p.th * RAD))), unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'N', label: 'Normal por unidad de peso <i>N</i>/(<i>mg</i>) = cos θ', short: 'N/mg', f: (p) => Math.cos(p.th * RAD), fmt: (v) => EM.fix(v, 5) },
      { k: 'thc', label: 'Ángulo crítico si μ fuera el coeficiente estático: arctan μ', short: 'θ crítico', f: (p) => Math.atan(p.mu) / RAD, unit: '°', fmt: (v) => EM.fix(v, 3) }
    ]
  });

  EM.formula('atwood', {
    gx: 'm1',
    params: [
      { k: 'm1', label: 'Masa 1 <i>m</i>₁', min: 0.1, max: 10, value: 2, unit: 'kg', fmt: (v) => EM.fix(v, 2) },
      { k: 'm2', label: 'Masa 2 <i>m</i>₂', min: 0.1, max: 10, value: 1, unit: 'kg', fmt: (v) => EM.fix(v, 2) },
      { k: 'M', label: 'Masa de la polea (disco) <i>M</i>', min: 0, max: 5, value: 0, unit: 'kg', fmt: (v) => EM.fix(v, 2) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'a', label: 'Aceleración <i>a</i> = (<i>m</i>₁ − <i>m</i>₂)<i>g</i>/(<i>m</i>₁ + <i>m</i>₂ + <i>M</i>/2)', short: 'a', f: (p) => (p.m1 - p.m2) * p.g / (p.m1 + p.m2 + p.M / 2), unit: 'm/s²', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'T1', label: 'Tensión del lado de <i>m</i>₁: <i>m</i>₁(<i>g</i> − <i>a</i>)', short: 'T₁', f: (p) => p.m1 * (p.g - (p.m1 - p.m2) * p.g / (p.m1 + p.m2 + p.M / 2)), unit: 'N', fmt: (v) => EM.sci(v, 5) },
      { k: 'T2', label: 'Tensión del lado de <i>m</i>₂: <i>m</i>₂(<i>g</i> + <i>a</i>)', short: 'T₂', f: (p) => p.m2 * (p.g + (p.m1 - p.m2) * p.g / (p.m1 + p.m2 + p.M / 2)), unit: 'N', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('lineal', {
    gx: 't',
    params: [
      { k: 'm', label: 'Masa <i>m</i>', min: 0.001, max: 200, value: 80, log: true, unit: 'kg', fmt: (v) => EM.sci(v, 3) },
      { k: 'b', label: 'Coeficiente de arrastre lineal <i>b</i>', min: 0.01, max: 100, value: 20, log: true, unit: 'kg/s', fmt: (v) => EM.sci(v, 3) },
      { k: 't', label: 'Tiempo desde que se suelta <i>t</i>', min: 0.01, max: 100, value: 5, log: true, unit: 's', fmt: (v) => EM.sci(v, 3) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'v', label: 'Velocidad <i>v</i> = <i>v</i><sub>t</sub>(1 − e<sup>−<i>t</i>/τ</sup>)', short: 'v(t)', f: (p) => (p.m * p.g / p.b) * (1 - Math.exp(-p.t * p.b / p.m)), unit: 'm/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'y', label: 'Distancia caída <i>y</i> = <i>v</i><sub>t</sub>[<i>t</i> − τ(1 − e<sup>−<i>t</i>/τ</sup>)]', short: 'y(t)', f: (p) => { const vt = p.m * p.g / p.b, ta = p.m / p.b; return vt * (p.t - ta * (1 - Math.exp(-p.t / ta))); }, unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 'vt', label: 'Velocidad terminal <i>v</i><sub>t</sub> = <i>mg</i>/<i>b</i>', short: 'v terminal', f: (p) => p.m * p.g / p.b, unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'ta', label: 'Tiempo característico τ = <i>m</i>/<i>b</i>', short: 'τ', f: (p) => p.m / p.b, unit: 's', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('cuadratico', {
    gx: 't',
    params: [
      { k: 'm', label: 'Masa <i>m</i>', min: 0.01, max: 200, value: 80, log: true, unit: 'kg', fmt: (v) => EM.sci(v, 3) },
      { k: 'cda', label: 'Producto <i>C</i><sub>D</sub><i>A</i> (coeficiente de arrastre × área frontal)', min: 0.001, max: 2, value: 0.7, log: true, unit: 'm²', fmt: (v) => EM.sci(v, 3) },
      { k: 'rho', label: 'Densidad del fluido ρ', min: 0.01, max: 1000, value: 1.225, log: true, unit: 'kg/m³', fmt: (v) => EM.sci(v, 3) },
      { k: 't', label: 'Tiempo <i>t</i>', min: 0.1, max: 100, value: 5, log: true, unit: 's', fmt: (v) => EM.sci(v, 3) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'vt', label: 'Velocidad terminal <i>v</i><sub>t</sub> = √(2<i>mg</i>/(ρ<i>C</i><sub>D</sub><i>A</i>))', short: 'v terminal', f: (p) => Math.sqrt(2 * p.m * p.g / (p.rho * p.cda)), unit: 'm/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'v', label: 'Velocidad <i>v</i> = <i>v</i><sub>t</sub> tanh(<i>gt</i>/<i>v</i><sub>t</sub>)', short: 'v(t)', f: (p) => { const vt = Math.sqrt(2 * p.m * p.g / (p.rho * p.cda)); return vt * Math.tanh(p.g * p.t / vt); }, unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'y', label: 'Distancia caída <i>y</i> = (<i>v</i><sub>t</sub>²/<i>g</i>) ln cosh(<i>gt</i>/<i>v</i><sub>t</sub>)', short: 'y(t)', f: (p) => { const vt = Math.sqrt(2 * p.m * p.g / (p.rho * p.cda)), z = p.g * p.t / vt; return vt * vt / p.g * (z + Math.log((1 + Math.exp(-2 * z)) / 2)); }, unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 'tc', label: 'Tiempo característico <i>v</i><sub>t</sub>/<i>g</i>', short: 'v_t/g', f: (p) => Math.sqrt(2 * p.m * p.g / (p.rho * p.cda)) / p.g, unit: 's', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('cohete', {
    gx: 'R',
    params: [
      { k: 'Isp', label: 'Impulso específico <i>I</i><sub>sp</sub>', min: 100, max: 500, value: 300, unit: 's', fmt: (v) => EM.fix(v, 0) },
      { k: 'R', label: 'Razón de masas <i>m</i>₀/<i>m</i><sub>f</sub>', min: 1.01, max: 30, value: 10, log: true, fmt: (v) => EM.fix(v, 2) },
      { k: 'tb', label: 'Tiempo de combustión <i>t</i><sub>b</sub>', min: 1, max: 600, value: 120, log: true, unit: 's', fmt: (v) => EM.sci(v, 3) },
      { k: 'g', label: 'Gravedad (supuesta constante) <i>g</i>', min: 0, max: 12, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 've', label: 'Velocidad de escape de los gases <i>v</i><sub>e</sub> = <i>I</i><sub>sp</sub><i>g</i>₀', short: 'vₑ', f: (p) => p.Isp * 9.80665, unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'dv', label: 'Δ<i>v</i> sin gravedad: <i>v</i><sub>e</sub> ln(<i>m</i>₀/<i>m</i><sub>f</sub>)', short: 'Δv (espacio)', f: (p) => p.Isp * 9.80665 * Math.log(p.R), unit: 'm/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'dvg', label: 'Δ<i>v</i> con gravedad: <i>v</i><sub>e</sub> ln(<i>m</i>₀/<i>m</i><sub>f</sub>) − <i>gt</i><sub>b</sub>', short: 'Δv (con gravedad)', f: (p) => p.Isp * 9.80665 * Math.log(p.R) - p.g * p.tb, unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'pf', label: 'Fracción de la masa inicial que es propelente 1 − <i>m</i><sub>f</sub>/<i>m</i>₀', short: 'fracción de propelente', f: (p) => 1 - 1 / p.R, fmt: (v) => EM.fix(v, 5) }
    ]
  });

  EM.formula('cabestrante', {
    gx: 'n',
    params: [
      { k: 'mu', label: 'Coeficiente de rozamiento μ', min: 0.01, max: 1, value: 0.3, log: true, fmt: (v) => EM.fix(v, 3) },
      { k: 'n', label: 'Vueltas alrededor del cilindro <i>n</i>', min: 0.1, max: 5, value: 3, fmt: (v) => EM.fix(v, 2) },
      { k: 'W', label: 'Carga que se sostiene <i>T</i>₂', min: 10, max: 10000, value: 1000, log: true, unit: 'N', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'ra', label: 'Razón de tensiones <i>T</i>₂/<i>T</i>₁ = e<sup>μφ</sup>, con φ = 2π<i>n</i>', short: 'T₂/T₁', f: (p) => Math.exp(p.mu * 2 * PI * p.n), fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'T1', label: 'Fuerza necesaria para sostener la carga <i>T</i>₁ = <i>T</i>₂e<sup>−μφ</sup>', short: 'T₁', f: (p) => p.W * Math.exp(-p.mu * 2 * PI * p.n), unit: 'N', fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
