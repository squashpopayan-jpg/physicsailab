/* Capítulo 9 — Gravitación, órbitas y dispersión */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, RAD = PI / 180;
  const G = 6.6743e-11, KE = 1.439964548;   /* e²/(4πε₀) en MeV·fm */

  EM.formula('conica', {
    gx: 'e',
    params: [
      { k: 'e', label: 'Excentricidad <i>e</i>', min: 0, max: 0.95, value: 0.5, fmt: (v) => EM.fix(v, 3) },
      { k: 'p', label: 'Semilatus rectum <i>p</i> = <i>L</i>²/(<i>mk</i>)', min: 0.1, max: 1000, value: 1, log: true, fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'rp', label: 'Perihelio <i>r</i><sub>p</sub> = <i>p</i>/(1 + <i>e</i>)', short: 'r perihelio', f: (q) => q.p / (1 + q.e), fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'ra', label: 'Afelio <i>r</i><sub>a</sub> = <i>p</i>/(1 − <i>e</i>)', short: 'r afelio', f: (q) => q.p / (1 - q.e), fmt: (v) => EM.sci(v, 5) },
      { k: 'a', label: 'Semieje mayor <i>a</i> = <i>p</i>/(1 − <i>e</i>²)', short: 'a', f: (q) => q.p / (1 - q.e * q.e), fmt: (v) => EM.sci(v, 5) },
      { k: 'b', label: 'Semieje menor <i>b</i> = <i>p</i>/√(1 − <i>e</i>²)', short: 'b', f: (q) => q.p / Math.sqrt(1 - q.e * q.e), fmt: (v) => EM.sci(v, 5) },
      { k: 'rr', label: 'Cociente de velocidades <i>v</i><sub>p</sub>/<i>v</i><sub>a</sub> = <i>r</i><sub>a</sub>/<i>r</i><sub>p</sub> = (1+<i>e</i>)/(1−<i>e</i>)', short: 'v_p/v_a', f: (q) => (1 + q.e) / (1 - q.e), fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const rOrb = (q) => q.a * 1e6 * (1 - q.e * q.e) / (1 + q.e * Math.cos(q.nu * RAD));
  EM.formula('visviva', {
    gx: 'a',
    params: [
      { k: 'M', label: 'Masa del cuerpo central <i>M</i>', min: 1e22, max: 1e32, value: 5.972e24, log: true, unit: 'kg', fmt: (v) => EM.sci(v, 4) },
      { k: 'a', label: 'Semieje mayor <i>a</i>', min: 1, max: 1e7, value: 6.778, log: true, unit: '10⁶ m', fmt: (v) => EM.sci(v, 4) },
      { k: 'e', label: 'Excentricidad <i>e</i>', min: 0, max: 0.9, value: 0, fmt: (v) => EM.fix(v, 3) },
      { k: 'nu', label: 'Anomalía verdadera ν', min: 0, max: 180, value: 0, unit: '°', fmt: (v) => EM.fix(v, 1), angle: true }
    ],
    outs: [
      { k: 'v', label: 'Rapidez <i>v</i> = √[<i>GM</i>(2/<i>r</i> − 1/<i>a</i>)] (vis-viva)', short: 'v', f: (q) => Math.sqrt(G * q.M * (2 / rOrb(q) - 1 / (q.a * 1e6))), unit: 'm/s', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'T', label: 'Periodo <i>T</i> = 2π√(<i>a</i>³/<i>GM</i>)', short: 'T', f: (q) => 2 * PI * Math.sqrt(Math.pow(q.a * 1e6, 3) / (G * q.M)), unit: 's', fmt: (v) => EM.sci(v, 6) },
      { k: 'r', label: 'Distancia <i>r</i> = <i>a</i>(1 − <i>e</i>²)/(1 + <i>e</i> cos ν)', short: 'r', f: rOrb, unit: 'm', fmt: (v) => EM.sci(v, 6) },
      { k: 'vc', label: 'Velocidad circular a esa distancia √(<i>GM</i>/<i>r</i>)', short: 'v circular', f: (q) => Math.sqrt(G * q.M / rOrb(q)), unit: 'm/s', fmt: (v) => EM.sci(v, 6) },
      { k: 've', label: 'Velocidad de escape a esa distancia √(2<i>GM</i>/<i>r</i>)', short: 'v de escape', f: (q) => Math.sqrt(2 * G * q.M / rOrb(q)), unit: 'm/s', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  EM.formula('hohmann', {
    gx: 'r2',
    params: [
      { k: 'M', label: 'Masa del cuerpo central <i>M</i>', min: 1e22, max: 1e32, value: 5.972e24, log: true, unit: 'kg', fmt: (v) => EM.sci(v, 4) },
      { k: 'r1', label: 'Radio de la órbita inicial <i>r</i>₁', min: 1, max: 1e6, value: 6.678, log: true, unit: '10⁶ m', fmt: (v) => EM.sci(v, 4) },
      { k: 'r2', label: 'Radio de la órbita final <i>r</i>₂', min: 1, max: 1e7, value: 42.164, log: true, unit: '10⁶ m', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'd1', label: 'Primer impulso Δ<i>v</i>₁ = √(<i>μ</i>(2/<i>r</i>₁ − 1/<i>a</i><sub>t</sub>)) − √(<i>μ</i>/<i>r</i>₁)', short: 'Δv₁', f: (q) => { const mu = G * q.M, r1 = q.r1 * 1e6, r2 = q.r2 * 1e6, at = (r1 + r2) / 2; return Math.sqrt(mu * (2 / r1 - 1 / at)) - Math.sqrt(mu / r1); }, unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'd2', label: 'Segundo impulso Δ<i>v</i>₂ = √(<i>μ</i>/<i>r</i>₂) − √(<i>μ</i>(2/<i>r</i>₂ − 1/<i>a</i><sub>t</sub>))', short: 'Δv₂', f: (q) => { const mu = G * q.M, r1 = q.r1 * 1e6, r2 = q.r2 * 1e6, at = (r1 + r2) / 2; return Math.sqrt(mu / r2) - Math.sqrt(mu * (2 / r2 - 1 / at)); }, unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'dt', label: 'Δ<i>v</i> total', short: 'Δv total', f: (q) => { const mu = G * q.M, r1 = q.r1 * 1e6, r2 = q.r2 * 1e6, at = (r1 + r2) / 2; return Math.sqrt(mu * (2 / r1 - 1 / at)) - Math.sqrt(mu / r1) + Math.sqrt(mu / r2) - Math.sqrt(mu * (2 / r2 - 1 / at)); }, unit: 'm/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'tt', label: 'Tiempo de transferencia π√(<i>a</i><sub>t</sub>³/<i>μ</i>)', short: 't transferencia', f: (q) => { const r1 = q.r1 * 1e6, r2 = q.r2 * 1e6, at = (r1 + r2) / 2; return PI * Math.sqrt(Math.pow(at, 3) / (G * q.M)); }, unit: 's', fmt: (v) => EM.sci(v, 5) },
      { k: 'ves', label: 'Velocidad de escape desde la órbita inicial √(2<i>μ</i>/<i>r</i>₁)', short: 'v escape', f: (q) => Math.sqrt(2 * G * q.M / (q.r1 * 1e6)), unit: 'm/s', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('rutherford', {
    gx: 'th',
    params: [
      { k: 'Z1', label: 'Carga del proyectil <i>Z</i>₁ (α: 2)', min: 1, max: 10, value: 2, step: 1, fmt: (v) => v.toFixed(0), fixed: true },
      { k: 'Z2', label: 'Carga del blanco <i>Z</i>₂ (oro: 79)', min: 1, max: 92, value: 79, step: 1, fmt: (v) => v.toFixed(0), fixed: true },
      { k: 'E', label: 'Energía cinética <i>E</i>', min: 0.5, max: 20, value: 5, log: true, unit: 'MeV', fmt: (v) => EM.sci(v, 3) },
      { k: 'th', label: 'Ángulo de dispersión θ', min: 5, max: 175, value: 90, unit: '°', fmt: (v) => EM.fix(v, 1), angle: true }
    ],
    outs: [
      { k: 'ds', label: 'Sección eficaz diferencial d<i>σ</i>/dΩ = (<i>k</i>/4<i>E</i>)²/sen⁴(θ/2)', short: 'dσ/dΩ', f: (p) => Math.pow(KE * Math.round(p.Z1) * Math.round(p.Z2) / (4 * p.E), 2) / Math.pow(Math.sin(p.th * RAD / 2), 4), unit: 'fm²/sr', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'b', label: 'Parámetro de impacto <i>b</i> = (<i>k</i>/2<i>E</i>) cot(θ/2)', short: 'b', f: (p) => KE * Math.round(p.Z1) * Math.round(p.Z2) / (2 * p.E) / Math.tan(p.th * RAD / 2), unit: 'fm', fmt: (v) => EM.sci(v, 5) },
      { k: 'dm', label: 'Distancia de máximo acercamiento (choque frontal) <i>k</i>/<i>E</i>', short: 'd mínima', f: (p) => KE * Math.round(p.Z1) * Math.round(p.Z2) / p.E, unit: 'fm', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('marea', {
    gx: 'r',
    params: [
      { k: 'M', label: 'Masa del cuerpo que provoca la marea <i>M</i>', min: 1e20, max: 1e31, value: 7.342e22, log: true, unit: 'kg', fmt: (v) => EM.sci(v, 4) },
      { k: 'r', label: 'Distancia al cuerpo <i>r</i>', min: 1e7, max: 1e12, value: 3.844e8, log: true, unit: 'm', fmt: (v) => EM.sci(v, 4) },
      { k: 'R', label: 'Radio del cuerpo afectado <i>R</i>', min: 1e5, max: 1e8, value: 6.371e6, log: true, unit: 'm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'at', label: 'Aceleración de marea (eje) 2<i>GMR</i>/<i>r</i>³', short: 'a de marea', f: (p) => 2 * G * p.M * p.R / Math.pow(p.r, 3), unit: 'm/s²', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'ap', label: 'Compresión transversal <i>GMR</i>/<i>r</i>³', short: 'compresión', f: (p) => G * p.M * p.R / Math.pow(p.r, 3), unit: 'm/s²', fmt: (v) => EM.sci(v, 5) },
      { k: 'rg', label: 'Cociente con la gravedad superficial de la Tierra', short: 'a/g', f: (p) => 2 * G * p.M * p.R / Math.pow(p.r, 3) / 9.80665, fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
