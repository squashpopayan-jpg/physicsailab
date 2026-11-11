/* Capítulo 26 — Óptica ondulatoria */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, DEG = 180 / PI, J11 = 3.8317059702075125;
  const sinc2 = (b) => (Math.abs(b) < 1e-8 ? 1 - b * b / 3 : Math.pow(Math.sin(b) / b, 2));

  const yg = (p) => { const lam = p.lam * 1e-9, d = p.d * 1e-6, a = p.a * 1e-6, y = p.y * 1e-3, L = p.L; return { ph: PI * d * y / (lam * L), be: PI * a * y / (lam * L), lam, d, a, L }; };
  EM.formula('young', {
    gx: 'y',
    params: [
      { k: 'lam', label: 'Longitud de onda λ', min: 380, max: 780, value: 550, unit: 'nm', fmt: (v) => EM.sci(v, 4) },
      { k: 'd', label: 'Separación entre rendijas <i>d</i>', min: 20, max: 1000, value: 200, log: true, unit: 'µm', fmt: (v) => EM.sci(v, 4) },
      { k: 'a', label: 'Anchura de cada rendija <i>a</i>', min: 1, max: 100, value: 40, log: true, unit: 'µm', fmt: (v) => EM.sci(v, 4) },
      { k: 'L', label: 'Distancia a la pantalla <i>L</i>', min: 0.2, max: 10, value: 1.5, log: true, unit: 'm', fmt: (v) => EM.sci(v, 4) },
      { k: 'y', label: 'Posición en la pantalla <i>y</i>', min: 0, max: 20, value: 2, unit: 'mm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'dy', label: 'Interfranja Δ<i>y</i> = λ<i>L</i>/<i>d</i>', short: 'interfranja', f: (p) => p.lam * 1e-9 * p.L / (p.d * 1e-6) * 1e3, unit: 'mm', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'I', label: 'Intensidad relativa <i>I</i>/<i>I</i>₀ = cos²(π<i>dy</i>/λ<i>L</i>)·sinc²(π<i>ay</i>/λ<i>L</i>)', short: 'I/I₀', f: (p) => Math.pow(Math.cos(yg(p).ph), 2) * sinc2(yg(p).be), fmt: (v) => EM.sci(v, 6) },
      { k: 'env', label: 'Envolvente de difracción sinc²(π<i>ay</i>/λ<i>L</i>)', short: 'envolvente', f: (p) => sinc2(yg(p).be), fmt: (v) => EM.sci(v, 6) },
      { k: 'nf', label: 'Franjas dentro del máximo central de difracción ≈ 2<i>d</i>/<i>a</i>', short: 'franjas centrales', f: (p) => 2 * p.d / p.a, fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const sl = (p) => { const a = p.a * 1e-6, lam = p.lam * 1e-9, y = p.y * 1e-3; return { a, lam, be: PI * a * y / (lam * p.L) }; };
  EM.formula('rendija', {
    gx: 'a',
    params: [
      { k: 'a', label: 'Anchura de la rendija <i>a</i>', min: 5, max: 500, value: 50, log: true, unit: 'µm', fmt: (v) => EM.sci(v, 4) },
      { k: 'lam', label: 'Longitud de onda λ', min: 380, max: 780, value: 550, unit: 'nm', fmt: (v) => EM.sci(v, 4) },
      { k: 'L', label: 'Distancia a la pantalla <i>L</i>', min: 0.2, max: 10, value: 2, log: true, unit: 'm', fmt: (v) => EM.sci(v, 4) },
      { k: 'y', label: 'Posición en la pantalla <i>y</i>', min: 0, max: 100, value: 10, unit: 'mm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'th', label: 'Primer mínimo θ₁ = arcsen(λ/<i>a</i>)', short: 'θ del 1.er mínimo', f: (p) => Math.asin(sl(p).lam / sl(p).a) * 1e3, unit: 'mrad', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'w', label: 'Anchura del máximo central 2λ<i>L</i>/<i>a</i>', short: 'anchura central', f: (p) => 2 * sl(p).lam * p.L / sl(p).a * 1e3, unit: 'mm', fmt: (v) => EM.sci(v, 6) },
      { k: 'I', label: 'Intensidad relativa sinc²(π<i>ay</i>/λ<i>L</i>)', short: 'I/I₀', f: (p) => sinc2(sl(p).be), fmt: (v) => EM.sci(v, 6) },
      { k: 'x', label: 'Argumento β = π<i>ay</i>/(λ<i>L</i>)', short: 'β', f: (p) => sl(p).be, fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const ai = (p) => J11 / PI * p.lam * 1e-9 / (p.D * 1e-3);
  EM.formula('airy', {
    gx: 'D',
    params: [
      { k: 'D', label: 'Diámetro de la abertura <i>D</i> (pupila: 6 mm)', min: 1, max: 1e4, value: 6, log: true, unit: 'mm', fmt: (v) => EM.sci(v, 4) },
      { k: 'lam', label: 'Longitud de onda λ', min: 380, max: 2000, value: 550, unit: 'nm', fmt: (v) => EM.sci(v, 4) },
      { k: 'Z', label: 'Distancia al objeto <i>Z</i>', min: 1, max: 4e8, value: 1000, log: true, unit: 'm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'th', label: 'Resolución angular θ = 1.2197 λ/<i>D</i> (= <i>j</i><sub>1,1</sub>λ/π<i>D</i>)', short: 'θ', f: (p) => ai(p) * 1e6, unit: 'µrad', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'arc', label: 'La misma resolución en segundos de arco', short: 'θ (″)', f: (p) => ai(p) * DEG * 3600, unit: '″', fmt: (v) => EM.sci(v, 6) },
      { k: 'dx', label: 'Separación mínima resoluble a la distancia <i>Z</i>', short: 'Δx', f: (p) => ai(p) * p.Z, unit: 'm', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const rd = (p) => { const d = 1e6 / p.l, s = p.m * p.lam / d, th = Math.asin(s); return { d, th }; };
  EM.formula('red', {
    gx: 'lam',
    params: [
      { k: 'l', label: 'Líneas por milímetro', min: 100, max: 600, value: 600, log: true, unit: 'mm⁻¹', fmt: (v) => EM.sci(v, 4) },
      { k: 'N', label: 'Número de líneas iluminadas <i>N</i>', min: 100, max: 1e5, value: 10000, log: true, fmt: (v) => EM.sci(v, 4) },
      { k: 'lam', label: 'Longitud de onda λ', min: 400, max: 700, value: 589, unit: 'nm', fmt: (v) => EM.sci(v, 4) },
      { k: 'm', label: 'Orden <i>m</i>', min: 1, max: 2, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 }
    ],
    outs: [
      { k: 'th', label: 'Ángulo del máximo θ<sub>m</sub> = arcsen(<i>m</i>λ/<i>d</i>)', short: 'θ_m', f: (p) => rd(p).th * DEG, unit: '°', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'disp', label: 'Dispersión angular dθ/dλ = <i>m</i>/(<i>d</i> cosθ)', short: 'dθ/dλ', f: (p) => p.m / (rd(p).d * Math.cos(rd(p).th)) * 1e3, unit: 'mrad/nm', fmt: (v) => EM.sci(v, 6) },
      { k: 'R', label: 'Poder de resolución λ/Δλ = <i>mN</i>', short: 'λ/Δλ', f: (p) => p.m * p.N, fmt: (v) => EM.sci(v, 6) },
      { k: 'dl', label: 'Diferencia de longitudes de onda mínima λ/(<i>mN</i>)', short: 'Δλ mínimo', f: (p) => p.lam / (p.m * p.N), unit: 'nm', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const fl = (p) => { const ti = p.th / DEG, tt = Math.asin(Math.sin(ti) / p.n), r = (1 - p.n) / (1 + p.n), dl = 4 * PI * p.n * p.d * Math.cos(tt) / p.lam, s2 = Math.pow(Math.sin(dl / 2), 2); return { tt, r, dl, s2 }; };
  EM.formula('pelicula', {
    gx: 'd',
    params: [
      { k: 'n', label: 'Índice de la película <i>n</i> (agua jabonosa: 1.33)', min: 1.2, max: 2.5, value: 1.33, fmt: (v) => EM.sci(v, 4), step: 0.01 },
      { k: 'd', label: 'Espesor <i>d</i>', min: 20, max: 2000, value: 300, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 4) },
      { k: 'lam', label: 'Longitud de onda λ', min: 380, max: 780, value: 550, unit: 'nm', fmt: (v) => EM.sci(v, 4) },
      { k: 'th', label: 'Ángulo de incidencia', min: 0, max: 80, value: 0, unit: '°', fmt: (v) => EM.sci(v, 3), angle: true }
    ],
    outs: [
      { k: 'R', label: 'Reflectancia (Airy) 4<i>r</i>²sen²(δ/2)/[(1 − <i>r</i>²)² + 4<i>r</i>²sen²(δ/2)]', short: 'R', f: (p) => 4 * fl(p).r * fl(p).r * fl(p).s2 / (Math.pow(1 - fl(p).r * fl(p).r, 2) + 4 * fl(p).r * fl(p).r * fl(p).s2), fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'dp', label: 'Desfase δ/π, con δ = 4π<i>nd</i> cosθ<sub>t</sub>/λ', short: 'δ/π', f: (p) => fl(p).dl / PI, fmt: (v) => EM.sci(v, 6) },
      { k: 'l1', label: 'Máximo de reflexión de orden 1: λ₁ = 4<i>nd</i> cosθ<sub>t</sub>/3', short: 'λ del máx. 1', f: (p) => 4 * p.n * p.d * Math.cos(fl(p).tt) / 3, unit: 'nm', fmt: (v) => EM.sci(v, 6) },
      { k: 'l2', label: 'Máximo de orden 2: λ₂ = 4<i>nd</i> cosθ<sub>t</sub>/5', short: 'λ del máx. 2', f: (p) => 4 * p.n * p.d * Math.cos(fl(p).tt) / 5, unit: 'nm', fmt: (v) => EM.sci(v, 6) },
      { k: 'Rm', label: 'Reflectancia máxima [2<i>r</i>/(1 + <i>r</i>²)]²', short: 'R máxima', f: (p) => Math.pow(2 * fl(p).r / (1 + fl(p).r * fl(p).r), 2), fmt: (v) => EM.sci(v, 6) }
    ]
  });
})();
