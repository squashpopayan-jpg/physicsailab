/* Capítulo 4 — Ecuaciones diferenciales y funciones especiales */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI;

  /* 4.1 Relajación de primer orden: enfriamiento de Newton */
  EM.formula('relax', {
    gx: 't',
    params: [
      { k: 'T0', label: 'Temperatura inicial <i>T</i><sub>0</sub>', min: -20, max: 200, value: 90, unit: '°C', fmt: (v) => EM.fix(v, 1) },
      { k: 'Te', label: 'Temperatura del ambiente <i>T</i><sub>e</sub>', min: -20, max: 100, value: 20, unit: '°C', fmt: (v) => EM.fix(v, 1) },
      { k: 'tau', label: 'Tiempo de relajación τ', min: 0.1, max: 1000, value: 10, log: true, unit: 'min', fmt: (v) => EM.sci(v, 3) },
      { k: 't', label: 'Tiempo transcurrido <i>t</i>', min: 0.1, max: 1000, value: 15, log: true, unit: 'min', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'T', label: 'Temperatura <i>T</i>(<i>t</i>) = <i>T</i><sub>e</sub> + (<i>T</i><sub>0</sub> − <i>T</i><sub>e</sub>)e<sup>−<i>t</i>/τ</sup>', short: 'T(t)', f: (p) => p.Te + (p.T0 - p.Te) * Math.exp(-p.t / p.tau), unit: '°C', fmt: (v) => EM.fix(v, 3), hl: true },
      { k: 'rate', label: 'Ritmo de cambio d<i>T</i>/d<i>t</i> = −(<i>T</i> − <i>T</i><sub>e</sub>)/τ', short: 'dT/dt', f: (p) => -(p.T0 - p.Te) * Math.exp(-p.t / p.tau) / p.tau, unit: '°C/min', fmt: (v) => EM.sci(v, 4) },
      { k: 'th', label: 'Tiempo para que la diferencia se reduzca a la mitad τ ln 2', short: 't½', f: (p) => p.tau * Math.LN2, unit: 'min', fmt: (v) => EM.sci(v, 4) },
      { k: 't99', label: 'Tiempo para quedar a menos del 1 % de la diferencia inicial τ ln 100', short: 't99', f: (p) => p.tau * Math.log(100), unit: 'min', fmt: (v) => EM.sci(v, 4) }
    ]
  });

  /* 4.2 Oscilador subamortiguado */
  EM.formula('amort', {
    gx: 't',
    params: [
      { k: 'w0', label: 'Frecuencia natural ω₀', min: 0.1, max: 100, value: 10, log: true, unit: 'rad/s', fmt: (v) => EM.sci(v, 3) },
      { k: 'z', label: 'Razón de amortiguamiento ζ = γ/ω₀', min: 0.01, max: 0.95, value: 0.1, fmt: (v) => EM.fix(v, 3) },
      { k: 'x0', label: 'Desplazamiento inicial <i>x</i>₀ (parte del reposo)', min: 0.1, max: 10, value: 1, log: true, fmt: (v) => EM.sci(v, 3) },
      { k: 't', label: 'Tiempo <i>t</i>', min: 0.01, max: 10, value: 1, log: true, unit: 's', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'x', label: '<i>x</i>(<i>t</i>) = <i>x</i>₀e<sup>−γ<i>t</i></sup>[cos ω<sub>d</sub><i>t</i> + (γ/ω<sub>d</sub>) sen ω<sub>d</sub><i>t</i>]', short: 'x(t)', f: (p) => { const g = p.z * p.w0, wd = p.w0 * Math.sqrt(1 - p.z * p.z); return p.x0 * Math.exp(-g * p.t) * (Math.cos(wd * p.t) + g / wd * Math.sin(wd * p.t)); }, fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'wd', label: 'Frecuencia amortiguada ω<sub>d</sub> = ω₀√(1 − ζ²)', short: 'ωd', f: (p) => p.w0 * Math.sqrt(1 - p.z * p.z), unit: 'rad/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'Q', label: 'Factor de calidad <i>Q</i> = ω₀/(2γ) = 1/(2ζ)', short: 'Q', f: (p) => 1 / (2 * p.z), fmt: (v) => EM.sci(v, 4) },
      { k: 'ld', label: 'Decremento logarítmico δ = 2πγ/ω<sub>d</sub> (cociente entre máximos sucesivos e<sup>−δ</sup>)', short: 'δ', f: (p) => 2 * PI * p.z / Math.sqrt(1 - p.z * p.z), fmt: (v) => EM.sci(v, 5) },
      { k: 'tg', label: 'Tiempo de decaimiento de la amplitud 1/γ', short: '1/γ', f: (p) => 1 / (p.z * p.w0), unit: 's', fmt: (v) => EM.sci(v, 4) }
    ]
  });

  /* 4.3 Oscilador forzado en régimen estacionario */
  EM.formula('forzado', {
    gx: 'w',
    params: [
      { k: 'w0', label: 'Frecuencia natural ω₀', min: 0.1, max: 100, value: 10, log: true, unit: 'rad/s', fmt: (v) => EM.sci(v, 3) },
      { k: 'z', label: 'Razón de amortiguamiento ζ = γ/ω₀', min: 0.01, max: 0.7, value: 0.1, fmt: (v) => EM.fix(v, 3) },
      { k: 'F', label: 'Amplitud de la fuerza por unidad de masa <i>F</i>₀', min: 0.1, max: 10, value: 1, log: true, unit: 'm/s²', fmt: (v) => EM.sci(v, 3) },
      { k: 'w', label: 'Frecuencia de la fuerza ω', min: 0.1, max: 200, value: 5, log: true, unit: 'rad/s', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'A', label: 'Amplitud estacionaria <i>A</i> = <i>F</i>₀/√[(ω₀² − ω²)² + (2γω)²]', short: 'A(ω)', f: (p) => p.F / Math.sqrt(Math.pow(p.w0 * p.w0 - p.w * p.w, 2) + Math.pow(2 * p.z * p.w0 * p.w, 2)), unit: 'm', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'dl', label: 'Retraso de fase δ = arctan2(2γω, ω₀² − ω²)', short: 'δ', f: (p) => Math.atan2(2 * p.z * p.w0 * p.w, p.w0 * p.w0 - p.w * p.w) * 180 / PI, unit: '°', fmt: (v) => EM.fix(v, 3) },
      { k: 'As', label: 'Respuesta estática <i>A</i>(0) = <i>F</i>₀/ω₀²', short: 'A(0)', f: (p) => p.F / (p.w0 * p.w0), unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 'wr', label: 'Frecuencia de resonancia ω<sub>r</sub> = √(ω₀² − 2γ²)', short: 'ωr', f: (p) => p.w0 * Math.sqrt(1 - 2 * p.z * p.z), unit: 'rad/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'Am', label: 'Amplitud máxima <i>F</i>₀/(2γ√(ω₀² − γ²))', short: 'Amáx', f: (p) => p.F / (2 * p.z * p.w0 * p.w0 * Math.sqrt(1 - p.z * p.z)), unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 'Q', label: 'Factor de calidad <i>Q</i> = 1/(2ζ)', short: 'Q', f: (p) => 1 / (2 * p.z), fmt: (v) => EM.sci(v, 4) }
    ]
  });

  /* 4.4 Serie de Fourier de la onda cuadrada (suma parcial) */
  const sq = (N, x) => { let s = 0; const M = Math.floor((N + 1) / 2); for (let j = 0; j < M; j++) { const k = 2 * j + 1; s += Math.sin(k * x) / k; } return 4 / PI * s; };
  EM.formula('fourier-onda', {
    params: [
      { k: 'N', label: 'Armónico más alto incluido <i>N</i> (solo impares)', min: 1, max: 199, step: 2, value: 9, fmt: (v) => v.toFixed(0), fixed: true },
      { k: 'xp', label: 'Posición <i>x</i>/π (el salto está en <i>x</i> = 0)', min: 0.001, max: 0.999, value: 0.25, fmt: (v) => EM.fix(v, 3) },
      { k: 'A', label: 'Amplitud <i>A</i> de la onda cuadrada (±<i>A</i>)', min: 0.1, max: 10, value: 1, log: true, fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'S', label: 'Suma parcial <i>S</i><sub><i>N</i></sub>(<i>x</i>) = (4<i>A</i>/π)Σ sen(<i>kx</i>)/<i>k</i>', short: 'S_N(x)', f: (p) => p.A * sq(Math.round(p.N), p.xp * PI), fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'rms', label: 'Error cuadrático medio <i>A</i>√(1 − (8/π²)Σ 1/<i>k</i>²)', short: 'error rms', f: (p) => { const M = Math.floor((Math.round(p.N) + 1) / 2); let s = 0; for (let j = 0; j < M; j++) s += 1 / Math.pow(2 * j + 1, 2); return p.A * Math.sqrt(Math.max(0, 1 - 8 / (PI * PI) * s)); }, fmt: (v) => EM.sci(v, 5) },
      { k: 'pk', label: 'Pico de Gibbs <i>S</i><sub><i>N</i></sub> en <i>x</i> = π/(<i>N</i>+1)', short: 'pico', f: (p) => { const M = Math.floor((Math.round(p.N) + 1) / 2); return p.A * sq(Math.round(p.N), PI / (2 * M)); }, fmt: (v) => EM.sci(v, 6) }
    ]
  });

  /* 4.5 Polinomios de Legendre */
  const leg = (l, x) => { let a = 1, b = x; if (l === 0) return [1, 0]; let da = 0, db = 1; for (let n = 1; n < l; n++) { const c = ((2 * n + 1) * x * b - n * a) / (n + 1); const dc = da + (2 * n + 1) * b; a = b; b = c; da = db; db = dc; } return [b, db]; };
  EM.formula('legendre-pl', {
    params: [
      { k: 'l', label: 'Orden <i>l</i>', min: 0, max: 10, step: 1, value: 3, fmt: (v) => v.toFixed(0), fixed: true },
      { k: 'x', label: 'Argumento <i>x</i> = cos θ', min: -1, max: 1, value: 0.5, fmt: (v) => EM.fix(v, 3) }
    ],
    outs: [
      { k: 'P', label: '<i>P</i><sub><i>l</i></sub>(<i>x</i>) (recurrencia de tres términos)', short: 'Pₗ(x)', f: (p) => leg(Math.round(p.l), p.x)[0], fmt: (v) => EM.fix(v, 6), hl: true },
      { k: 'dP', label: 'Derivada d<i>P</i><sub><i>l</i></sub>/d<i>x</i>', short: 'Pₗ′(x)', f: (p) => leg(Math.round(p.l), p.x)[1], fmt: (v) => EM.fix(v, 6) },
      { k: 'nm', label: 'Norma ∫₋₁¹ <i>P</i><sub><i>l</i></sub>² d<i>x</i> = 2/(2<i>l</i>+1)', short: 'norma', f: (p) => 2 / (2 * Math.round(p.l) + 1), fmt: (v) => EM.fix(v, 6) }
    ]
  });

  /* 4.6 Funciones de Bessel y el tambor circular */
  const bessJ = (m, x) => { let t = Math.pow(x / 2, m), f = 1; for (let i = 2; i <= m; i++) f *= i; t /= f; let s = t; for (let k = 1; k < 120; k++) { t *= -(x * x / 4) / (k * (k + m)); s += t; if (Math.abs(t) < 1e-18 * Math.max(1, Math.abs(s)) && k > x) break; } return s; };
  const bessZero1 = (m) => { let a = 0.02, fa = bessJ(m, a); for (let x = 0.04; x < 20; x += 0.02) { const fx = bessJ(m, x); if (fa * fx <= 0) { let lo = x - 0.02, hi = x; for (let i = 0; i < 60; i++) { const md = 0.5 * (lo + hi); if (bessJ(m, lo) * bessJ(m, md) <= 0) hi = md; else lo = md; } return 0.5 * (lo + hi); } fa = fx; } return NaN; };
  EM.formula('bessel-tambor', {
    params: [
      { k: 'm', label: 'Orden azimutal <i>m</i>', min: 0, max: 5, step: 1, value: 0, fmt: (v) => v.toFixed(0), fixed: true },
      { k: 'x', label: 'Argumento <i>x</i>', min: 0.01, max: 12, value: 2, fmt: (v) => EM.fix(v, 3) },
      { k: 'a', label: 'Radio de la membrana <i>a</i>', min: 0.05, max: 1, value: 0.15, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'c', label: 'Velocidad de las ondas en la membrana <i>c</i> = √(<i>T</i>/σ)', min: 10, max: 1000, value: 100, log: true, unit: 'm/s', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'J', label: '<i>J</i><sub><i>m</i></sub>(<i>x</i>) por la serie de Frobenius', short: 'Jₘ(x)', f: (p) => bessJ(Math.round(p.m), p.x), fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'j1', label: 'Primer cero <i>j</i><sub><i>m</i>,1</sub>', short: 'j(m,1)', f: (p) => bessZero1(Math.round(p.m)), fmt: (v) => EM.fix(v, 6) },
      { k: 'f1', label: 'Frecuencia del modo (<i>m</i>, 1): <i>f</i> = <i>c</i> <i>j</i><sub><i>m</i>,1</sub>/(2π<i>a</i>)', short: 'f(m,1)', f: (p) => p.c * bessZero1(Math.round(p.m)) / (2 * PI * p.a), unit: 'Hz', fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
