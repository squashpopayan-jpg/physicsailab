/* Capítulo 7 — Trabajo, energía, choques y potencia */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, RAD = PI / 180;

  EM.formula('resorte', {
    gx: 'x0',
    params: [
      { k: 'k', label: 'Constante del resorte <i>k</i>', min: 500, max: 5000, value: 500, log: true, unit: 'N/m', fmt: (v) => EM.sci(v, 3) },
      { k: 'x0', label: 'Compresión inicial <i>x</i>₀', min: 0.1, max: 0.5, value: 0.1, unit: 'm', fmt: (v) => EM.fix(v, 3) },
      { k: 'm', label: 'Masa del bloque <i>m</i>', min: 0.1, max: 1, value: 0.5, unit: 'kg', fmt: (v) => EM.fix(v, 3) },
      { k: 'mu', label: 'Coeficiente de rozamiento cinético μ', min: 0.02, max: 0.4, value: 0.3, fmt: (v) => EM.fix(v, 3) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'v', label: 'Rapidez al pasar por la longitud natural √(<i>kx</i>₀²/<i>m</i> − 2μ<i>gx</i>₀)', short: 'v', f: (p) => Math.sqrt(p.k * p.x0 * p.x0 / p.m - 2 * p.mu * p.g * p.x0), unit: 'm/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'd', label: 'Recorrido total hasta detenerse <i>kx</i>₀²/(2μ<i>mg</i>)', short: 'recorrido total', f: (p) => p.k * p.x0 * p.x0 / (2 * p.mu * p.m * p.g), unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 's', label: 'Distancia más allá de la longitud natural', short: 'distancia libre', f: (p) => p.k * p.x0 * p.x0 / (2 * p.mu * p.m * p.g) - p.x0, unit: 'm', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('rizo', {
    gx: 'q',
    params: [
      { k: 'R', label: 'Radio del rizo <i>R</i>', min: 0.1, max: 5, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'q', label: 'Altura de salida en radios <i>h</i>/<i>R</i> (desde el punto más bajo)', min: 2.05, max: 8, value: 3.5, fmt: (v) => EM.fix(v, 3) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'nt', label: 'Normal en el punto más alto, en pesos: <i>N</i>/<i>mg</i> = 2<i>h</i>/<i>R</i> − 5', short: 'N/mg arriba', f: (p) => 2 * p.q - 5, fmt: (v) => EM.fix(v, 4), hl: true },
      { k: 'vt', label: 'Rapidez arriba √(2<i>gR</i>(<i>h</i>/<i>R</i> − 2))', short: 'v arriba', f: (p) => Math.sqrt(2 * p.g * p.R * (p.q - 2)), unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'vb', label: 'Rapidez abajo √(2<i>gh</i>)', short: 'v abajo', f: (p) => Math.sqrt(2 * p.g * p.R * p.q), unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'nb', label: 'Normal abajo, en pesos: 1 + 2<i>h</i>/<i>R</i>', short: 'N/mg abajo', f: (p) => 1 + 2 * p.q, fmt: (v) => EM.fix(v, 4) }
    ]
  });

  const c1 = (p) => ({ a: ((p.m1 - p.e * p.m2) * p.v1 + p.m2 * (1 + p.e) * p.v2) / (p.m1 + p.m2), b: ((p.m2 - p.e * p.m1) * p.v2 + p.m1 * (1 + p.e) * p.v1) / (p.m1 + p.m2) });
  EM.formula('choque-1d', {
    gx: 'e',
    params: [
      { k: 'm1', label: 'Masa 1 <i>m</i>₁', min: 0.1, max: 10, value: 2, unit: 'kg', fmt: (v) => EM.fix(v, 2) },
      { k: 'm2', label: 'Masa 2 <i>m</i>₂', min: 0.1, max: 10, value: 1, unit: 'kg', fmt: (v) => EM.fix(v, 2) },
      { k: 'v1', label: 'Velocidad inicial 1 <i>v</i>₁', min: 0.5, max: 10, value: 5, unit: 'm/s', fmt: (v) => EM.fix(v, 2) },
      { k: 'v2', label: 'Velocidad inicial 2 <i>v</i>₂', min: -10, max: 0.5, value: -2, unit: 'm/s', fmt: (v) => EM.fix(v, 2) },
      { k: 'e', label: 'Coeficiente de restitución <i>e</i>', min: 0.01, max: 1, value: 1, fmt: (v) => EM.fix(v, 3) }
    ],
    outs: [
      { k: 'w1', label: 'Velocidad final 1: [(<i>m</i>₁ − <i>em</i>₂)<i>v</i>₁ + <i>m</i>₂(1+<i>e</i>)<i>v</i>₂]/(<i>m</i>₁+<i>m</i>₂)', short: 'v₁′', f: (p) => c1(p).a, unit: 'm/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'w2', label: 'Velocidad final 2: [(<i>m</i>₂ − <i>em</i>₁)<i>v</i>₂ + <i>m</i>₁(1+<i>e</i>)<i>v</i>₁]/(<i>m</i>₁+<i>m</i>₂)', short: 'v₂′', f: (p) => c1(p).b, unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'dK', label: 'Energía disipada ½μ(1 − <i>e</i>²)(<i>v</i>₁ − <i>v</i>₂)² (μ = masa reducida)', short: 'energía disipada', f: (p) => 0.5 * p.m1 * p.m2 / (p.m1 + p.m2) * (1 - p.e * p.e) * Math.pow(p.v1 - p.v2, 2), unit: 'J', fmt: (v) => EM.sci(v, 5) },
      { k: 'K0', label: 'Energía cinética inicial', short: 'K inicial', f: (p) => 0.5 * p.m1 * p.v1 * p.v1 + 0.5 * p.m2 * p.v2 * p.v2, unit: 'J', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('choque-lab', {
    gx: 'th',
    params: [
      { k: 'r', label: 'Razón de masas <i>m</i>₁/<i>m</i>₂ (blanco en reposo)', min: 0.1, max: 10, value: 2, log: true, fmt: (v) => EM.sci(v, 3) },
      { k: 'th', label: 'Ángulo de dispersión en el centro de masas θ<sub>cm</sub>', min: 1, max: 179, value: 90, unit: '°', fmt: (v) => EM.fix(v, 1), angle: true }
    ],
    outs: [
      { k: 'tl', label: 'Ángulo en el laboratorio: tan θ<sub>lab</sub> = sen θ<sub>cm</sub>/(<i>r</i> + cos θ<sub>cm</sub>)', short: 'θ lab', f: (p) => Math.atan2(Math.sin(p.th * RAD), p.r + Math.cos(p.th * RAD)) / RAD, unit: '°', fmt: (v) => EM.fix(v, 4), hl: true },
      { k: 'tr', label: 'Fracción de energía cedida al blanco 4<i>r</i>/(1+<i>r</i>)² sen²(θ<sub>cm</sub>/2)', short: 'energía transferida', f: (p) => 4 * p.r / Math.pow(1 + p.r, 2) * Math.pow(Math.sin(p.th * RAD / 2), 2), fmt: (v) => EM.fix(v, 5) },
      { k: 'tm', label: 'Ángulo máximo de desviación: arcsen(1/<i>r</i>) si <i>r</i> &gt; 1; 180° si no', short: 'θ lab máximo', f: (p) => (p.r > 1 ? Math.asin(1 / p.r) / RAD : 180), unit: '°', fmt: (v) => EM.fix(v, 3) }
    ]
  });

  const vmx = (p) => { const k = 0.5 * p.rho * p.cda, c = p.crr * p.m * 9.80665; let lo = 0, hi = 300; for (let i = 0; i < 200; i++) { const md = 0.5 * (lo + hi); if (k * md * md * md + c * md - p.P * 1000 > 0) hi = md; else lo = md; } return 0.5 * (lo + hi); };
  EM.formula('vehiculo', {
    gx: 'P',
    params: [
      { k: 'P', label: 'Potencia útil en las ruedas <i>P</i>', min: 10, max: 400, value: 100, log: true, unit: 'kW', fmt: (v) => EM.sci(v, 3) },
      { k: 'm', label: 'Masa del vehículo <i>m</i>', min: 500, max: 3000, value: 1500, log: true, unit: 'kg', fmt: (v) => EM.sci(v, 3) },
      { k: 'cda', label: 'Producto <i>C</i><sub>D</sub><i>A</i>', min: 0.3, max: 1.5, value: 0.7, log: true, unit: 'm²', fmt: (v) => EM.fix(v, 3) },
      { k: 'crr', label: 'Coeficiente de rodadura <i>C</i><sub>rr</sub>', min: 0.005, max: 0.03, value: 0.012, fmt: (v) => EM.fix(v, 4) },
      { k: 'rho', label: 'Densidad del aire ρ', min: 0.5, max: 1.4, value: 1.2, unit: 'kg/m³', fmt: (v) => EM.fix(v, 3) }
    ],
    outs: [
      { k: 'vm', label: 'Velocidad máxima: raíz de ½ρ<i>C</i><sub>D</sub><i>Av</i>³ + <i>C</i><sub>rr</sub><i>mgv</i> = <i>P</i>', short: 'v máxima', f: vmx, unit: 'm/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'kmh', label: 'Velocidad máxima en km/h', short: 'v máxima (km/h)', f: (p) => 3.6 * vmx(p), unit: 'km/h', fmt: (v) => EM.fix(v, 3) },
      { k: 'vd', label: 'Aproximación con solo aire (2<i>P</i>/(ρ<i>C</i><sub>D</sub><i>A</i>))<sup>1/3</sup>', short: 'v (solo aire)', f: (p) => Math.cbrt(2 * p.P * 1000 / (p.rho * p.cda)), unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'fr', label: 'Fracción de la potencia que va a la rodadura a esa velocidad', short: 'fracción rodadura', f: (p) => p.crr * p.m * 9.80665 * vmx(p) / (p.P * 1000), fmt: (v) => EM.fix(v, 5) }
    ]
  });
})();
