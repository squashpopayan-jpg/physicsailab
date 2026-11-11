/* Capítulo 14 — Hidrostática y capilaridad */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, RAD = PI / 180, G0 = 9.80665, R = 8.314462618;

  EM.formula('presion-fluido', {
    gx: 'h',
    params: [
      { k: 'rho', label: 'Densidad del líquido ρ', min: 1, max: 14000, value: 998, log: true, unit: 'kg/m³', fmt: (v) => EM.sci(v, 4) },
      { k: 'h', label: 'Profundidad <i>h</i>', min: 0.01, max: 11000, value: 10, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'p0', label: 'Presión en la superficie <i>p</i>₀', min: 1000, max: 200000, value: 101325, log: true, unit: 'Pa', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'pg', label: 'Presión manométrica ρ<i>gh</i>', short: 'p manométrica', f: (p) => p.rho * G0 * p.h, unit: 'Pa', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'pa', label: 'Presión absoluta <i>p</i> = <i>p</i>₀ + ρ<i>gh</i>', short: 'p absoluta', f: (p) => p.p0 + p.rho * G0 * p.h, unit: 'Pa', fmt: (v) => EM.sci(v, 6) },
      { k: 'at', label: 'Presión absoluta en atmósferas (101 325 Pa)', short: 'p (atm)', f: (p) => (p.p0 + p.rho * G0 * p.h) / 101325, fmt: (v) => EM.sci(v, 5) },
      { k: 'h1', label: 'Profundidad que añade una atmósfera 101 325/(ρ<i>g</i>)', short: 'h por atmósfera', f: (p) => 101325 / (p.rho * G0), unit: 'm', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('barometrica', {
    gx: 'z',
    params: [
      { k: 'z', label: 'Altitud <i>z</i>', min: 10, max: 30000, value: 5500, log: true, unit: 'm', fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura (supuesta uniforme) <i>T</i>', min: 200, max: 320, value: 288.15, unit: 'K', fmt: (v) => EM.fix(v, 2) },
      { k: 'M', label: 'Masa molar del gas <i>M</i>', min: 2, max: 50, value: 28.96, log: true, unit: 'g/mol', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'pr', label: 'Cociente <i>p</i>/<i>p</i>₀ = e<sup>−<i>Mgz</i>/<i>RT</i></sup>', short: 'p/p₀', f: (q) => Math.exp(-q.M * 1e-3 * G0 * q.z / (R * q.T)), fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'p', label: 'Presión con <i>p</i>₀ = 101 325 Pa', short: 'p', f: (q) => 101325 * Math.exp(-q.M * 1e-3 * G0 * q.z / (R * q.T)), unit: 'Pa', fmt: (v) => EM.sci(v, 6) },
      { k: 'H', label: 'Altura de escala <i>H</i> = <i>RT</i>/(<i>Mg</i>)', short: 'H', f: (q) => R * q.T / (q.M * 1e-3 * G0), unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 'zh', label: 'Altitud a la que la presión cae a la mitad <i>H</i> ln 2', short: 'z de la mitad', f: (q) => R * q.T / (q.M * 1e-3 * G0) * Math.LN2, unit: 'm', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('iceberg', {
    gx: 'rf',
    params: [
      { k: 'ro', label: 'Densidad del objeto ρ<sub>o</sub>', min: 400, max: 1000, value: 917, unit: 'kg/m³', fmt: (v) => EM.fix(v, 1) },
      { k: 'rf', label: 'Densidad del fluido ρ<sub>f</sub>', min: 1010, max: 1300, value: 1025, unit: 'kg/m³', fmt: (v) => EM.fix(v, 1) },
      { k: 'V', label: 'Volumen total <i>V</i>', min: 0.001, max: 1e6, value: 1e5, log: true, unit: 'm³', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'fs', label: 'Fracción sumergida ρ<sub>o</sub>/ρ<sub>f</sub>', short: 'fracción sumergida', f: (p) => p.ro / p.rf, fmt: (v) => EM.fix(v, 5), hl: true },
      { k: 'va', label: 'Volumen emergente <i>V</i>(1 − ρ<sub>o</sub>/ρ<sub>f</sub>)', short: 'volumen emergente', f: (p) => p.V * (1 - p.ro / p.rf), unit: 'm³', fmt: (v) => EM.sci(v, 5) },
      { k: 'Fb', label: 'Empuje = peso del objeto ρ<sub>o</sub><i>Vg</i>', short: 'empuje', f: (p) => p.ro * p.V * G0, unit: 'N', fmt: (v) => EM.sci(v, 5) },
      { k: 'dm', label: 'Masa extra que lo hundiría (ρ<sub>f</sub> − ρ<sub>o</sub>)<i>V</i>', short: 'masa para hundirlo', f: (p) => (p.rf - p.ro) * p.V, unit: 'kg', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('laplace', {
    gx: 'R',
    params: [
      { k: 's', label: 'Tensión superficial σ', min: 0.01, max: 0.5, value: 0.0728, log: true, unit: 'N/m', fmt: (v) => EM.fix(v, 4) },
      { k: 'R', label: 'Radio de curvatura <i>R</i>', min: 1e-7, max: 0.1, value: 1e-3, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'gota', label: 'Gota (una superficie) Δ<i>p</i> = 2σ/<i>R</i>', short: 'gota', f: (p) => 2 * p.s / p.R, unit: 'Pa', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'burb', label: 'Pompa de jabón (dos superficies) Δ<i>p</i> = 4σ/<i>R</i>', short: 'pompa', f: (p) => 4 * p.s / p.R, unit: 'Pa', fmt: (v) => EM.sci(v, 5) },
      { k: 'cil', label: 'Chorro cilíndrico Δ<i>p</i> = σ/<i>R</i>', short: 'cilindro', f: (p) => p.s / p.R, unit: 'Pa', fmt: (v) => EM.sci(v, 5) },
      { k: 'atm', label: 'Gota en atmósferas 2σ/(<i>R</i>·101 325)', short: 'gota (atm)', f: (p) => 2 * p.s / p.R / 101325, fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('jurin', {
    gx: 'r',
    params: [
      { k: 's', label: 'Tensión superficial σ', min: 0.01, max: 0.6, value: 0.0728, log: true, unit: 'N/m', fmt: (v) => EM.fix(v, 4) },
      { k: 'th', label: 'Ángulo de contacto θ', min: 0, max: 170, value: 0, unit: '°', fmt: (v) => EM.fix(v, 1), angle: true },
      { k: 'rho', label: 'Densidad ρ', min: 500, max: 14000, value: 998, log: true, unit: 'kg/m³', fmt: (v) => EM.sci(v, 4) },
      { k: 'r', label: 'Radio del tubo <i>r</i>', min: 1e-6, max: 0.01, value: 5e-4, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'h', label: 'Altura de ascenso (descenso si es negativa) <i>h</i> = 2σ cos θ/(ρ<i>gr</i>)', short: 'h', f: (p) => 2 * p.s * Math.cos(p.th * RAD) / (p.rho * G0 * p.r), unit: 'm', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'lc', label: 'Longitud capilar √(σ/(ρ<i>g</i>))', short: 'longitud capilar', f: (p) => Math.sqrt(p.s / (p.rho * G0)), unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 'hr', label: 'Producto <i>h</i>·<i>r</i> = 2σ cos θ/(ρ<i>g</i>)', short: 'h·r', f: (p) => 2 * p.s * Math.cos(p.th * RAD) / (p.rho * G0), unit: 'm²', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('presa', {
    gx: 'H',
    params: [
      { k: 'rho', label: 'Densidad del agua ρ', min: 900, max: 1100, value: 1000, unit: 'kg/m³', fmt: (v) => EM.fix(v, 1) },
      { k: 'w', label: 'Ancho del muro <i>w</i>', min: 1, max: 1000, value: 100, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'H', label: 'Altura del agua <i>H</i>', min: 0.5, max: 300, value: 10, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'F', label: 'Fuerza total sobre el muro <i>F</i> = ½ρ<i>gwH</i>²', short: 'fuerza total', f: (p) => 0.5 * p.rho * G0 * p.w * p.H * p.H, unit: 'N', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'M', label: 'Momento respecto de la base ρ<i>gwH</i>³/6', short: 'momento en la base', f: (p) => p.rho * G0 * p.w * Math.pow(p.H, 3) / 6, unit: 'N·m', fmt: (v) => EM.sci(v, 5) },
      { k: 'pb', label: 'Presión en el fondo ρ<i>gH</i>', short: 'p en el fondo', f: (p) => p.rho * G0 * p.H, unit: 'Pa', fmt: (v) => EM.sci(v, 5) },
      { k: 'zc', label: 'Profundidad del centro de presión 2<i>H</i>/3', short: 'centro de presión', f: (p) => 2 * p.H / 3, unit: 'm', fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
