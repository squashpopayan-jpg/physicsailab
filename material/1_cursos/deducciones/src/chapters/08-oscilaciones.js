/* Capítulo 8 — Oscilaciones */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, RAD = PI / 180, G0 = 9.80665;

  EM.formula('mas-resorte', {
    gx: 'k',
    params: [
      { k: 'k', label: 'Constante del resorte <i>k</i>', min: 1, max: 2000, value: 200, log: true, unit: 'N/m', fmt: (v) => EM.sci(v, 3) },
      { k: 'm', label: 'Masa <i>m</i>', min: 0.05, max: 10, value: 0.5, log: true, unit: 'kg', fmt: (v) => EM.sci(v, 3) },
      { k: 'A', label: 'Amplitud <i>A</i>', min: 0.001, max: 0.5, value: 0.05, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'w', label: 'Frecuencia angular ω = √(<i>k</i>/<i>m</i>)', short: 'ω', f: (p) => Math.sqrt(p.k / p.m), unit: 'rad/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'f', label: 'Frecuencia ω/2π', short: 'f', f: (p) => Math.sqrt(p.k / p.m) / (2 * PI), unit: 'Hz', fmt: (v) => EM.sci(v, 5) },
      { k: 'T', label: 'Periodo 2π√(<i>m</i>/<i>k</i>)', short: 'T', f: (p) => 2 * PI * Math.sqrt(p.m / p.k), unit: 's', fmt: (v) => EM.sci(v, 5) },
      { k: 'E', label: 'Energía total ½<i>kA</i>²', short: 'E', f: (p) => 0.5 * p.k * p.A * p.A, unit: 'J', fmt: (v) => EM.sci(v, 5) },
      { k: 'vm', label: 'Velocidad máxima ω<i>A</i>', short: 'v máx', f: (p) => Math.sqrt(p.k / p.m) * p.A, unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'xe', label: 'Descenso del equilibrio si se cuelga verticalmente <i>mg</i>/<i>k</i>', short: 'x equilibrio', f: (p) => p.m * G0 / p.k, unit: 'm', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const K0 = (th) => EM.M.ellipKE(Math.pow(Math.sin(th * RAD / 2), 2))[0];
  EM.formula('pendulo-exacto', {
    gx: 'th',
    params: [
      { k: 'L', label: 'Longitud <i>L</i>', min: 0.01, max: 100, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) },
      { k: 'th', label: 'Amplitud θ₀', min: 1, max: 175, value: 60, unit: '°', fmt: (v) => EM.fix(v, 1), angle: true }
    ],
    outs: [
      { k: 'T', label: 'Periodo exacto <i>T</i> = 4√(<i>L</i>/<i>g</i>)<i>K</i>(sen²θ₀/2)', short: 'T exacto', f: (p) => 4 * Math.sqrt(p.L / p.g) * K0(p.th), unit: 's', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'T0', label: 'Periodo de oscilación pequeña 2π√(<i>L</i>/<i>g</i>)', short: 'T₀', f: (p) => 2 * PI * Math.sqrt(p.L / p.g), unit: 's', fmt: (v) => EM.sci(v, 6) },
      { k: 'r', label: 'Cociente <i>T</i>/<i>T</i>₀ = 2<i>K</i>/π', short: 'T/T₀', f: (p) => 2 * K0(p.th) / PI, fmt: (v) => EM.fix(v, 6) },
      { k: 'r2', label: 'Serie a 2.º orden 1 + θ₀²/16 + 11θ₀⁴/3072', short: 'serie 2.º orden', f: (p) => { const t = p.th * RAD; return 1 + t * t / 16 + 11 * Math.pow(t, 4) / 3072; }, fmt: (v) => EM.fix(v, 6) }
    ]
  });

  EM.formula('pendulo-fisico', {
    gx: 'f',
    params: [
      { k: 'L', label: 'Longitud de la varilla <i>L</i>', min: 0.1, max: 3, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'f', label: 'Posición del pivote respecto del centro, en longitudes <i>d</i>/<i>L</i>', min: 0.02, max: 0.5, value: 0.5, fmt: (v) => EM.fix(v, 3) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'T', label: 'Periodo <i>T</i> = 2π√[(<i>L</i>²/12 + <i>d</i>²)/(<i>gd</i>)]', short: 'T', f: (p) => 2 * PI * Math.sqrt(p.L * (1 / 12 + p.f * p.f) / (p.g * p.f)), unit: 's', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'Le', label: 'Longitud del péndulo simple equivalente (<i>L</i>²/12 + <i>d</i>²)/<i>d</i>', short: 'L equivalente', f: (p) => p.L * (1 / 12 + p.f * p.f) / p.f, unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 'dm', label: 'Pivote de periodo mínimo <i>d</i> = <i>L</i>/√12', short: 'd óptimo', f: (p) => p.L / Math.sqrt(12), unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 'Tm', label: 'Periodo mínimo 2π√(2<i>d</i><sub>m</sub>/<i>g</i>)', short: 'T mínimo', f: (p) => 2 * PI * Math.sqrt(2 * p.L / Math.sqrt(12) / p.g), unit: 's', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  EM.formula('modos-acoplados', {
    gx: 'kc',
    params: [
      { k: 'k', label: 'Constante de cada resorte exterior <i>k</i>', min: 10, max: 1000, value: 100, log: true, unit: 'N/m', fmt: (v) => EM.sci(v, 3) },
      { k: 'kc', label: 'Constante del resorte de acople <i>k</i><sub>c</sub>', min: 1, max: 500, value: 20, log: true, unit: 'N/m', fmt: (v) => EM.sci(v, 3) },
      { k: 'm', label: 'Masa de cada bloque <i>m</i>', min: 0.1, max: 10, value: 1, log: true, unit: 'kg', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'w1', label: 'Modo simétrico ω₁ = √(<i>k</i>/<i>m</i>)', short: 'ω₁', f: (p) => Math.sqrt(p.k / p.m), unit: 'rad/s', fmt: (v) => EM.sci(v, 6) },
      { k: 'w2', label: 'Modo antisimétrico ω₂ = √((<i>k</i> + 2<i>k</i><sub>c</sub>)/<i>m</i>)', short: 'ω₂', f: (p) => Math.sqrt((p.k + 2 * p.kc) / p.m), unit: 'rad/s', fmt: (v) => EM.sci(v, 6) },
      { k: 'tt', label: 'Tiempo de transferencia total de energía π/(ω₂ − ω₁)', short: 't transferencia', f: (p) => PI / (Math.sqrt((p.k + 2 * p.kc) / p.m) - Math.sqrt(p.k / p.m)), unit: 's', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'tb', label: 'Periodo de los batidos 2π/(ω₂ − ω₁)', short: 'T batido', f: (p) => 2 * PI / (Math.sqrt((p.k + 2 * p.kc) / p.m) - Math.sqrt(p.k / p.m)), unit: 's', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  EM.formula('resonancia-potencia', {
    gx: 'w',
    params: [
      { k: 'm', label: 'Masa <i>m</i>', min: 0.1, max: 10, value: 1, log: true, unit: 'kg', fmt: (v) => EM.sci(v, 3) },
      { k: 'w0', label: 'Frecuencia natural ω₀', min: 1, max: 100, value: 10, log: true, unit: 'rad/s', fmt: (v) => EM.sci(v, 3) },
      { k: 'z', label: 'Razón de amortiguamiento ζ = γ/ω₀', min: 0.01, max: 0.7, value: 0.1, fmt: (v) => EM.fix(v, 3) },
      { k: 'F', label: 'Amplitud de la fuerza <i>F</i>₀', min: 0.1, max: 10, value: 1, log: true, unit: 'N', fmt: (v) => EM.sci(v, 3) },
      { k: 'w', label: 'Frecuencia de la fuerza ω', min: 0.1, max: 200, value: 5, log: true, unit: 'rad/s', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'P', label: 'Potencia media absorbida <i>P</i> = (<i>F</i>₀²/2<i>m</i>) 2γω²/[(ω₀² − ω²)² + 4γ²ω²]', short: 'P(ω)', f: (p) => { const g = p.z * p.w0; return p.F * p.F / (2 * p.m) * 2 * g * p.w * p.w / (Math.pow(p.w0 * p.w0 - p.w * p.w, 2) + 4 * g * g * p.w * p.w); }, unit: 'W', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'Pm', label: 'Potencia máxima (en ω = ω₀) <i>F</i>₀²/(4<i>m</i>γ)', short: 'P máx', f: (p) => p.F * p.F / (4 * p.m * p.z * p.w0), unit: 'W', fmt: (v) => EM.sci(v, 5) },
      { k: 'wp', label: 'Frecuencia de media potencia superior √(ω₀² + γ²) + γ', short: 'ω₊', f: (p) => { const g = p.z * p.w0; return Math.sqrt(p.w0 * p.w0 + g * g) + g; }, unit: 'rad/s', fmt: (v) => EM.sci(v, 6) },
      { k: 'wm', label: 'Frecuencia de media potencia inferior √(ω₀² + γ²) − γ', short: 'ω₋', f: (p) => { const g = p.z * p.w0; return Math.sqrt(p.w0 * p.w0 + g * g) - g; }, unit: 'rad/s', fmt: (v) => EM.sci(v, 6) },
      { k: 'bw', label: 'Anchura a media potencia ω₊ − ω₋ = 2γ', short: 'anchura', f: (p) => 2 * p.z * p.w0, unit: 'rad/s', fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
