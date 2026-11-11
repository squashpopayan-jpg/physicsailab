/* Capítulo 10 — Cuerpo rígido */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, RAD = PI / 180, G0 = 9.80665;

  EM.formula('inercia', {
    gx: 'R',
    params: [
      { k: 'm', label: 'Masa <i>m</i>', min: 0.01, max: 100, value: 1, log: true, unit: 'kg', fmt: (v) => EM.sci(v, 3) },
      { k: 'R', label: 'Radio <i>R</i> (la varilla tiene longitud 2<i>R</i>)', min: 0.01, max: 2, value: 0.1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'd', label: 'Desplazamiento del eje respecto del centro <i>d</i>', min: 0.001, max: 2, value: 0.05, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'Id', label: 'Disco macizo ½<i>mR</i>²', short: 'disco', f: (p) => 0.5 * p.m * p.R * p.R, unit: 'kg·m²', fmt: (v) => EM.sci(v, 5) },
      { k: 'Is', label: 'Esfera maciza (2/5)<i>mR</i>²', short: 'esfera', f: (p) => 0.4 * p.m * p.R * p.R, unit: 'kg·m²', fmt: (v) => EM.sci(v, 5) },
      { k: 'Ia', label: 'Aro <i>mR</i>²', short: 'aro', f: (p) => p.m * p.R * p.R, unit: 'kg·m²', fmt: (v) => EM.sci(v, 5) },
      { k: 'Ir', label: 'Varilla de longitud 2<i>R</i> por el centro <i>m</i>(2<i>R</i>)²/12', short: 'varilla', f: (p) => p.m * 4 * p.R * p.R / 12, unit: 'kg·m²', fmt: (v) => EM.sci(v, 5) },
      { k: 'Ist', label: 'Disco con el eje desplazado <i>d</i> (Steiner): ½<i>mR</i>² + <i>md</i>²', short: 'disco, eje a d', f: (p) => 0.5 * p.m * p.R * p.R + p.m * p.d * p.d, unit: 'kg·m²', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'kg', label: 'Radio de giro del disco macizo <i>R</i>/√2', short: 'radio de giro', f: (p) => p.R / Math.SQRT2, unit: 'm', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('rodar', {
    gx: 'c',
    params: [
      { k: 'th', label: 'Inclinación del plano θ', min: 5, max: 60, value: 30, unit: '°', fmt: (v) => EM.fix(v, 1), angle: true },
      { k: 'c', label: 'Factor de inercia <i>c</i> = <i>I</i>/(<i>mR</i>²) (aro 1, cilindro 0.5, esfera 0.4)', min: 0.05, max: 1.5, value: 0.4, fmt: (v) => EM.fix(v, 3) },
      { k: 'h', label: 'Altura descendida <i>h</i>', min: 0.1, max: 10, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'a', label: 'Aceleración del centro <i>a</i> = <i>g</i> sen θ/(1 + <i>c</i>)', short: 'a', f: (p) => p.g * Math.sin(p.th * RAD) / (1 + p.c), unit: 'm/s²', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'v', label: 'Rapidez abajo √(2<i>gh</i>/(1 + <i>c</i>))', short: 'v abajo', f: (p) => Math.sqrt(2 * p.g * p.h / (1 + p.c)), unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'mu', label: 'Rozamiento estático mínimo para rodar sin deslizar μ = <i>c</i> tan θ/(1 + <i>c</i>)', short: 'μ mínimo', f: (p) => p.c / (1 + p.c) * Math.tan(p.th * RAD), fmt: (v) => EM.fix(v, 5) },
      { k: 'fr', label: 'Fuerza de rozamiento por unidad de peso <i>f</i>/(<i>mg</i>) = <i>c</i> sen θ/(1 + <i>c</i>)', short: 'f/mg', f: (p) => p.c / (1 + p.c) * Math.sin(p.th * RAD), fmt: (v) => EM.fix(v, 5) }
    ]
  });

  EM.formula('giroscopio', {
    gx: 'w',
    params: [
      { k: 'm', label: 'Masa del giróscopo <i>m</i>', min: 0.05, max: 5, value: 0.5, log: true, unit: 'kg', fmt: (v) => EM.sci(v, 3) },
      { k: 'd', label: 'Distancia del centro de masas al pivote <i>d</i>', min: 0.01, max: 0.3, value: 0.05, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'I', label: 'Momento de inercia respecto del eje de giro <i>I</i>', min: 1e-5, max: 1e-2, value: 6.25e-4, log: true, unit: 'kg·m²', fmt: (v) => EM.sci(v, 3) },
      { k: 'w', label: 'Velocidad de giro propio ω', min: 10, max: 1000, value: 125.66, log: true, unit: 'rad/s', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'O', label: 'Velocidad de precesión Ω = <i>mgd</i>/(<i>I</i>ω)', short: 'Ω', f: (p) => p.m * G0 * p.d / (p.I * p.w), unit: 'rad/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'T', label: 'Periodo de precesión 2π/Ω', short: 'T precesión', f: (p) => 2 * PI * p.I * p.w / (p.m * G0 * p.d), unit: 's', fmt: (v) => EM.sci(v, 5) },
      { k: 'ra', label: 'Cociente ω/Ω (la aproximación exige ≫ 1)', short: 'ω/Ω', f: (p) => p.I * p.w * p.w / (p.m * G0 * p.d), fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const eu = (p) => ({ I1: 1, I2: p.r2, I3: p.r2 * p.r3 });
  EM.formula('euler-libre', {
    gx: 'r2',
    params: [
      { k: 'r2', label: 'Cociente <i>I</i>₂/<i>I</i>₁ (con <i>I</i>₁ &lt; <i>I</i>₂ &lt; <i>I</i>₃)', min: 1.05, max: 5, value: 2, fmt: (v) => EM.fix(v, 3) },
      { k: 'r3', label: 'Cociente <i>I</i>₃/<i>I</i>₂', min: 1.05, max: 5, value: 2, fmt: (v) => EM.fix(v, 3) },
      { k: 'Om', label: 'Velocidad angular de giro Ω', min: 0.1, max: 100, value: 10, log: true, unit: 'rad/s', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'lam', label: 'Eje intermedio (inestable): tasa de crecimiento λ = Ω√[(<i>I</i>₂−<i>I</i>₁)(<i>I</i>₃−<i>I</i>₂)/(<i>I</i>₁<i>I</i>₃)]', short: 'λ (eje 2)', f: (p) => { const e = eu(p); return p.Om * Math.sqrt((e.I2 - e.I1) * (e.I3 - e.I2) / (e.I1 * e.I3)); }, unit: '1/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'tau', label: 'Tiempo de crecimiento 1/λ', short: '1/λ', f: (p) => { const e = eu(p); return 1 / (p.Om * Math.sqrt((e.I2 - e.I1) * (e.I3 - e.I2) / (e.I1 * e.I3))); }, unit: 's', fmt: (v) => EM.sci(v, 5) },
      { k: 'w1', label: 'Eje de menor inercia (estable): frecuencia Ω√[(<i>I</i>₂−<i>I</i>₁)(<i>I</i>₃−<i>I</i>₁)/(<i>I</i>₂<i>I</i>₃)]', short: 'ω (eje 1)', f: (p) => { const e = eu(p); return p.Om * Math.sqrt((e.I2 - e.I1) * (e.I3 - e.I1) / (e.I2 * e.I3)); }, unit: 'rad/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'w3', label: 'Eje de mayor inercia (estable): frecuencia Ω√[(<i>I</i>₃−<i>I</i>₁)(<i>I</i>₃−<i>I</i>₂)/(<i>I</i>₁<i>I</i>₂)]', short: 'ω (eje 3)', f: (p) => { const e = eu(p); return p.Om * Math.sqrt((e.I3 - e.I1) * (e.I3 - e.I2) / (e.I1 * e.I2)); }, unit: 'rad/s', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('billar', {
    gx: 'q',
    params: [
      { k: 'v0', label: 'Velocidad inicial <i>v</i>₀', min: 0.5, max: 10, value: 2, unit: 'm/s', fmt: (v) => EM.fix(v, 2) },
      { k: 'q', label: 'Altura del golpe sobre el centro, en radios <i>h</i>/<i>R</i> (negativa: bajo el centro)', min: -0.95, max: 0.95, value: 0, fmt: (v) => EM.fix(v, 3) },
      { k: 'R', label: 'Radio de la bola <i>R</i>', min: 0.01, max: 0.1, value: 0.0286, unit: 'm', fmt: (v) => EM.fix(v, 4) },
      { k: 'm', label: 'Masa <i>m</i>', min: 0.05, max: 1, value: 0.17, unit: 'kg', fmt: (v) => EM.fix(v, 3) }
    ],
    outs: [
      { k: 'w0', label: 'Giro inicial ω₀ = 5<i>v</i>₀(<i>h</i>/<i>R</i>)/(2<i>R</i>)', short: 'ω₀', f: (p) => 5 * p.v0 * p.q / (2 * p.R), unit: 'rad/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'vs', label: 'Velocidad de deslizamiento del punto de contacto <i>v</i>₀(1 − 5<i>h</i>/2<i>R</i>)', short: 'v de deslizamiento', f: (p) => p.v0 * (1 - 2.5 * p.q), unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'vf', label: 'Velocidad final con rodadura pura (5/7)(1 + <i>h</i>/<i>R</i>)<i>v</i>₀', short: 'v final', f: (p) => 5 / 7 * (1 + p.q) * p.v0, unit: 'm/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'dE', label: 'Energía disipada hasta empezar a rodar', short: 'energía disipada', f: (p) => { const w0 = 5 * p.v0 * p.q / (2 * p.R), I = 0.4 * p.m * p.R * p.R, vf = 5 / 7 * (1 + p.q) * p.v0; return 0.5 * p.m * p.v0 * p.v0 + 0.5 * I * w0 * w0 - 0.7 * p.m * vf * vf; }, unit: 'J', fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
