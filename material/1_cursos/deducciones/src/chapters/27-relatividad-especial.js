/* Capítulo 27 — Relatividad especial */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, C = 299792458, DEG = 180 / PI;

  const gm = (b) => 1 / Math.sqrt(1 - b * b);
  const bt = (p) => 1 - p.eps;
  EM.formula('dilatacion', {
    gx: 'eps',
    params: [
      { k: 'eps', label: 'Defecto de velocidad 1 − β, con β = <i>v</i>/<i>c</i> (β = 0.998 ⇒ 0.002)', min: 1e-4, max: 0.9, value: 0.002, log: true, fmt: (v) => EM.sci(v, 5) },
      { k: 't0', label: 'Tiempo propio entre dos sucesos Δ<i>t</i>₀ (vida media del muón: 2.197)', min: 0.001, max: 1000, value: 2.197, log: true, unit: 'µs', fmt: (v) => EM.sci(v, 5) },
      { k: 'L0', label: 'Longitud propia <i>L</i>₀', min: 0.01, max: 1000, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'b', label: 'Velocidad relativa β = 1 − (1 − β)', short: 'β', f: (p) => bt(p), fmt: (v) => EM.sci(v, 7) },
      { k: 'g', label: 'Factor de Lorentz γ = 1/√(1 − β²)', short: 'γ', f: (p) => gm(bt(p)), fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 't', label: 'Tiempo medido en el laboratorio Δ<i>t</i> = γΔ<i>t</i>₀', short: 'Δt (lab)', f: (p) => gm(bt(p)) * p.t0, unit: 'µs', fmt: (v) => EM.sci(v, 6) },
      { k: 'L', label: 'Longitud contraída <i>L</i> = <i>L</i>₀/γ', short: 'L contraída', f: (p) => p.L0 / gm(bt(p)), unit: 'm', fmt: (v) => EM.sci(v, 6) },
      { k: 'd', label: 'Distancia recorrida en el laboratorio β<i>c</i>γΔ<i>t</i>₀', short: 'distancia', f: (p) => bt(p) * C * gm(bt(p)) * p.t0 * 1e-6 * 1e-3, unit: 'km', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  EM.formula('velocidades', {
    gx: 'u',
    params: [
      { k: 'u', label: 'Velocidad del objeto en el sistema móvil β<sub>u</sub> = <i>u</i>/<i>c</i>', min: 0.01, max: 0.999, value: 0.9, fmt: (v) => EM.sci(v, 5) },
      { k: 'v', label: 'Velocidad del sistema móvil β<sub>v</sub> = <i>v</i>/<i>c</i>', min: 0.01, max: 0.999, value: 0.9, fmt: (v) => EM.sci(v, 5) },
      { k: 'n', label: 'Índice de refracción del medio (Fizeau; agua 1.333)', min: 1, max: 3, value: 1.333, fmt: (v) => EM.sci(v, 4), step: 0.001 }
    ],
    outs: [
      { k: 'w', label: 'Velocidad compuesta <i>w</i>/<i>c</i> = (β<sub>u</sub> + β<sub>v</sub>)/(1 + β<sub>u</sub>β<sub>v</sub>)', short: 'w/c', f: (p) => (p.u + p.v) / (1 + p.u * p.v), fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'gal', label: 'Suma galileana β<sub>u</sub> + β<sub>v</sub>', short: 'suma clásica', f: (p) => p.u + p.v, fmt: (v) => EM.sci(v, 6) },
      { k: 'rap', label: 'Rapidez total atanh β<sub>u</sub> + atanh β<sub>v</sub> (las rapideces se suman)', short: 'rapidez', f: (p) => Math.atanh(p.u) + Math.atanh(p.v), fmt: (v) => EM.sci(v, 6) },
      { k: 'fiz', label: 'Coeficiente de arrastre de Fresnel–Fizeau 1 − 1/<i>n</i>²', short: 'Fizeau', f: (p) => 1 - 1 / (p.n * p.n), fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const dp = (p) => { const th = p.th / DEG, g = gm(p.beta); return { r: 1 / (g * (1 - p.beta * Math.cos(th))) }; };
  EM.formula('doppler-rel', {
    gx: 'beta',
    params: [
      { k: 'beta', label: 'Velocidad de la fuente β = <i>v</i>/<i>c</i>', min: 0.001, max: 0.99, value: 0.5, fmt: (v) => EM.sci(v, 5) },
      { k: 'th', label: 'Ángulo entre la velocidad y la dirección al observador (sistema del observador); 0° = se acerca', min: 0, max: 180, value: 0, unit: '°', fmt: (v) => EM.sci(v, 4), angle: true }
    ],
    outs: [
      { k: 'r', label: 'Razón de frecuencias <i>f</i>/<i>f</i>₀ = 1/[γ(1 − β cosθ)]', short: 'f/f₀', f: (p) => dp(p).r, fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'z', label: 'Corrimiento al rojo z = λ/λ₀ − 1', short: 'z', f: (p) => 1 / dp(p).r - 1, fmt: (v) => EM.sci(v, 6) },
      { k: 'ap', label: 'De frente (θ = 0): √[(1 + β)/(1 − β)]', short: 'de frente', f: (p) => Math.sqrt((1 + p.beta) / (1 - p.beta)), fmt: (v) => EM.sci(v, 6) },
      { k: 'tr', label: 'Transversal en el sistema del observador: 1/γ', short: 'transversal', f: (p) => 1 / gm(p.beta), fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const en = (p) => { const T = p.T, m = p.m, g = 1 + T / m, pc = Math.sqrt(T * T + 2 * T * m); return { g, pc, b: pc / (T + m) }; };
  EM.formula('energia', {
    gx: 'T',
    params: [
      { k: 'm', label: 'Masa en reposo <i>mc</i>² (electrón: 0.51100; protón: 938.27)', min: 0.5, max: 1e5, value: 0.51099895, log: true, unit: 'MeV', fmt: (v) => EM.sci(v, 6) },
      { k: 'T', label: 'Energía cinética <i>T</i>', min: 0.001, max: 1e6, value: 1, log: true, unit: 'MeV', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'g', label: 'γ = 1 + <i>T</i>/<i>mc</i>²', short: 'γ', f: (p) => en(p).g, fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'b', label: 'Velocidad β = <i>pc</i>/<i>E</i>', short: 'β', f: (p) => en(p).b, fmt: (v) => EM.sci(v, 8) },
      { k: 'pc', label: 'Cantidad de movimiento <i>pc</i> = √(<i>T</i>² + 2<i>Tmc</i>²)', short: 'pc', f: (p) => en(p).pc, unit: 'MeV', fmt: (v) => EM.sci(v, 7) },
      { k: 'E', label: 'Energía total <i>E</i> = <i>T</i> + <i>mc</i>²', short: 'E total', f: (p) => p.T + p.m, unit: 'MeV', fmt: (v) => EM.sci(v, 7) },
      { k: 'cl', label: 'Velocidad clásica √(2<i>T</i>/<i>m</i>)/<i>c</i> (falla si es ≳ 0.1)', short: 'v clásica / c', f: (p) => Math.sqrt(2 * p.T / p.m), fmt: (v) => EM.sci(v, 6) }
    ]
  });

  EM.formula('umbral', {
    gx: 'Mf',
    params: [
      { k: 'm1', label: 'Masa del proyectil <i>m</i>₁<i>c</i>² (protón: 938.27)', min: 0.5, max: 1e5, value: 938.272088, log: true, unit: 'MeV', fmt: (v) => EM.sci(v, 7) },
      { k: 'm2', label: 'Masa del blanco <i>m</i>₂<i>c</i>²', min: 0.5, max: 1e5, value: 938.272088, log: true, unit: 'MeV', fmt: (v) => EM.sci(v, 7) },
      { k: 'Mf', label: 'Masa total de los productos Σ<i>m</i><sub>f</sub><i>c</i>² (p + p → p + p + p + p̄: 4<i>m</i>)', min: 1, max: 1e6, value: 3753.088352, log: true, unit: 'MeV', fmt: (v) => EM.sci(v, 7) }
    ],
    outs: [
      { k: 'Tf', label: 'Umbral con blanco fijo <i>T</i> = [(Σ<i>m</i><sub>f</sub>)² − (<i>m</i>₁ + <i>m</i>₂)²]<i>c</i>²/(2<i>m</i>₂)', short: 'T umbral (blanco fijo)', f: (p) => (p.Mf * p.Mf - Math.pow(p.m1 + p.m2, 2)) / (2 * p.m2), unit: 'MeV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'gb', label: 'Factor γ del proyectil en el umbral 1 + <i>T</i>/<i>m</i>₁<i>c</i>²', short: 'γ del haz', f: (p) => 1 + (p.Mf * p.Mf - Math.pow(p.m1 + p.m2, 2)) / (2 * p.m2 * p.m1), fmt: (v) => EM.sci(v, 7) },
      { k: 'ra', label: 'Cociente <i>T</i>/<i>Q</i>, con <i>Q</i> = Σ<i>m</i><sub>f</sub> − <i>m</i>₁ − <i>m</i>₂', short: 'T / Q', f: (p) => (p.Mf + p.m1 + p.m2) / (2 * p.m2), fmt: (v) => EM.sci(v, 7) },
      { k: 'Tc', label: 'Colisionador simétrico (<i>m</i>₁ = <i>m</i>₂): energía cinética por haz Σ<i>m</i><sub>f</sub><i>c</i>²/2 − <i>m</i>₁<i>c</i>²', short: 'T por haz (colisionador)', f: (p) => p.Mf / 2 - p.m1, unit: 'MeV', fmt: (v) => EM.sci(v, 7) }
    ]
  });
})();
