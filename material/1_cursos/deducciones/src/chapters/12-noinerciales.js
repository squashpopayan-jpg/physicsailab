/* Capítulo 12 — Sistemas no inerciales y elasticidad */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, RAD = PI / 180, W = 2 * PI / 86164.1;

  EM.formula('coriolis-caida', {
    gx: 'lat',
    params: [
      { k: 'h', label: 'Altura de caída <i>h</i>', min: 1, max: 1000, value: 100, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'lat', label: 'Latitud λ', min: 0, max: 89, value: 45, unit: '°', fmt: (v) => EM.fix(v, 1), angle: true },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.80665, unit: 'm/s²', fmt: (v) => EM.fix(v, 3) }
    ],
    outs: [
      { k: 'd', label: 'Desviación hacia el este δ = ⅓ω<i>g</i><i>t</i>³ cos λ', short: 'desviación al este', f: (p) => W * p.g * Math.pow(Math.sqrt(2 * p.h / p.g), 3) * Math.cos(p.lat * RAD) / 3, unit: 'm', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 't', label: 'Tiempo de caída √(2<i>h</i>/<i>g</i>)', short: 't de caída', f: (p) => Math.sqrt(2 * p.h / p.g), unit: 's', fmt: (v) => EM.sci(v, 5) },
      { k: 'vx', label: 'Velocidad hacia el este al llegar ω<i>gt</i>² cos λ', short: 'v este', f: (p) => W * p.g * 2 * p.h / p.g * Math.cos(p.lat * RAD), unit: 'm/s', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('foucault', {
    gx: 'lat',
    params: [
      { k: 'lat', label: 'Latitud λ', min: 0.5, max: 90, value: 48.8566, unit: '°', fmt: (v) => EM.fix(v, 4), angle: true },
      { k: 'T0', label: 'Periodo de rotación del planeta (día sideral)', min: 3600, max: 1e6, value: 86164.1, log: true, unit: 's', fmt: (v) => EM.sci(v, 6) }
    ],
    outs: [
      { k: 'O', label: 'Velocidad de precesión Ω<sub>F</sub> = ω sen λ', short: 'Ω_F', f: (p) => 2 * PI / p.T0 * Math.sin(p.lat * RAD), unit: 'rad/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'dh', label: 'Giro del plano de oscilación en grados por hora', short: '°/h', f: (p) => 360 / (p.T0 / 3600) * Math.sin(p.lat * RAD), unit: '°/h', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'T', label: 'Tiempo para una vuelta completa <i>T</i><sub>0</sub>/sen λ', short: 'T vuelta', f: (p) => p.T0 / Math.sin(p.lat * RAD) / 3600, unit: 'h', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  EM.formula('cubeta', {
    gx: 'w',
    params: [
      { k: 'w', label: 'Velocidad angular de la cubeta ω', min: 0.05, max: 20, value: 0.7, log: true, unit: 'rad/s', fmt: (v) => EM.sci(v, 3) },
      { k: 'r', label: 'Distancia al eje <i>r</i>', min: 0.01, max: 3, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.80665, unit: 'm/s²', fmt: (v) => EM.fix(v, 3) }
    ],
    outs: [
      { k: 'z', label: 'Altura de la superficie <i>z</i> = ω²<i>r</i>²/(2<i>g</i>)', short: 'z(r)', f: (p) => p.w * p.w * p.r * p.r / (2 * p.g), unit: 'm', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'f', label: 'Distancia focal del espejo líquido <i>f</i> = <i>g</i>/(2ω²)', short: 'distancia focal', f: (p) => p.g / (2 * p.w * p.w), unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 'rpm', label: 'Revoluciones por minuto 30ω/π', short: 'rpm', f: (p) => 30 * p.w / PI, unit: 'rpm', fmt: (v) => EM.sci(v, 5) },
      { k: 'sl', label: 'Pendiente de la superficie tan α = ω²<i>r</i>/<i>g</i>', short: 'pendiente', f: (p) => p.w * p.w * p.r / p.g, fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('viga', {
    gx: 'L',
    params: [
      { k: 'F', label: 'Fuerza en el extremo libre <i>F</i>', min: 1, max: 1000, value: 20, log: true, unit: 'N', fmt: (v) => EM.sci(v, 3) },
      { k: 'L', label: 'Longitud <i>L</i>', min: 0.05, max: 5, value: 0.5, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'E', label: 'Módulo de Young <i>E</i>', min: 1, max: 400, value: 200, log: true, unit: 'GPa', fmt: (v) => EM.sci(v, 3) },
      { k: 'b', label: 'Ancho de la sección <i>b</i>', min: 2, max: 100, value: 20, log: true, unit: 'mm', fmt: (v) => EM.sci(v, 3) },
      { k: 'h', label: 'Altura de la sección <i>h</i> (en la dirección de la flexión)', min: 1, max: 50, value: 5, log: true, unit: 'mm', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'd', label: 'Flecha en el extremo δ = <i>FL</i>³/(3<i>EI</i>), <i>I</i> = <i>bh</i>³/12', short: 'flecha', f: (p) => p.F * Math.pow(p.L, 3) / (3 * p.E * 1e9 * p.b * 1e-3 * Math.pow(p.h * 1e-3, 3) / 12), unit: 'm', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'k', label: 'Rigidez <i>k</i> = 3<i>EI</i>/<i>L</i>³', short: 'rigidez', f: (p) => 3 * p.E * 1e9 * p.b * 1e-3 * Math.pow(p.h * 1e-3, 3) / 12 / Math.pow(p.L, 3), unit: 'N/m', fmt: (v) => EM.sci(v, 5) },
      { k: 's', label: 'Tensión máxima en el empotramiento σ = 6<i>FL</i>/(<i>bh</i>²)', short: 'σ máx', f: (p) => 6 * p.F * p.L / (p.b * 1e-3 * Math.pow(p.h * 1e-3, 2)), unit: 'Pa', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('pandeo', {
    gx: 'L',
    params: [
      { k: 'E', label: 'Módulo de Young <i>E</i>', min: 1, max: 400, value: 200, log: true, unit: 'GPa', fmt: (v) => EM.sci(v, 3) },
      { k: 'b', label: 'Ancho de la sección <i>b</i>', min: 2, max: 100, value: 20, log: true, unit: 'mm', fmt: (v) => EM.sci(v, 3) },
      { k: 'h', label: 'Espesor <i>h</i> (el menor lado: dirección de pandeo)', min: 1, max: 50, value: 5, log: true, unit: 'mm', fmt: (v) => EM.sci(v, 3) },
      { k: 'L', label: 'Longitud <i>L</i>', min: 0.05, max: 5, value: 0.5, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'K', label: 'Factor de longitud efectiva <i>K</i> (articulada 1; empotrada–libre 2; empotrada–empotrada 0.5)', min: 0.5, max: 2, value: 1, fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'P', label: 'Carga crítica de Euler <i>P</i><sub>cr</sub> = π²<i>EI</i>/(<i>KL</i>)²', short: 'P crítica', f: (p) => PI * PI * p.E * 1e9 * p.b * 1e-3 * Math.pow(p.h * 1e-3, 3) / 12 / Math.pow(p.K * p.L, 2), unit: 'N', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 's', label: 'Tensión crítica σ<sub>cr</sub> = <i>P</i><sub>cr</sub>/<i>A</i>', short: 'σ crítica', f: (p) => PI * PI * p.E * 1e9 * p.b * 1e-3 * Math.pow(p.h * 1e-3, 3) / 12 / Math.pow(p.K * p.L, 2) / (p.b * 1e-3 * p.h * 1e-3), unit: 'Pa', fmt: (v) => EM.sci(v, 5) },
      { k: 'esb', label: 'Esbeltez <i>KL</i>/<i>r</i>, con <i>r</i> = <i>h</i>/√12', short: 'esbeltez', f: (p) => p.K * p.L / (p.h * 1e-3 / Math.sqrt(12)), fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
