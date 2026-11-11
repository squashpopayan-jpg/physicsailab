/* Capítulo 13 — Ondas y sonido */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, R = 8.314462618;

  EM.formula('cuerda-modos', {
    gx: 'T',
    params: [
      { k: 'T', label: 'Tensión de la cuerda <i>T</i>', min: 1, max: 500, value: 70, log: true, unit: 'N', fmt: (v) => EM.sci(v, 3) },
      { k: 'mu', label: 'Densidad lineal μ', min: 0.1, max: 20, value: 0.5, log: true, unit: 'g/m', fmt: (v) => EM.sci(v, 3) },
      { k: 'L', label: 'Longitud <i>L</i>', min: 0.1, max: 2, value: 0.65, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'n', label: 'Armónico <i>n</i>', min: 1, max: 10, step: 1, value: 1, fmt: (v) => v.toFixed(0), fixed: true }
    ],
    outs: [
      { k: 'v', label: 'Velocidad de las ondas <i>v</i> = √(<i>T</i>/μ)', short: 'v', f: (p) => Math.sqrt(p.T / (p.mu * 1e-3)), unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'f', label: 'Frecuencia del armónico <i>f</i><sub><i>n</i></sub> = <i>nv</i>/(2<i>L</i>) (cuerda fija en los dos extremos)', short: 'f_n', f: (p) => Math.round(p.n) * Math.sqrt(p.T / (p.mu * 1e-3)) / (2 * p.L), unit: 'Hz', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'lam', label: 'Longitud de onda 2<i>L</i>/<i>n</i>', short: 'λ_n', f: (p) => 2 * p.L / Math.round(p.n), unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 'fa', label: 'Tubo abierto–abierto de la misma longitud (aire a 20 °C, 343.2 m/s): <i>nc</i>/(2<i>L</i>)', short: 'tubo abierto', f: (p) => Math.round(p.n) * 343.2 / (2 * p.L), unit: 'Hz', fmt: (v) => EM.sci(v, 5) },
      { k: 'fc', label: 'Tubo cerrado–abierto de la misma longitud: (2<i>n</i>−1)<i>c</i>/(4<i>L</i>)', short: 'tubo cerrado', f: (p) => (2 * Math.round(p.n) - 1) * 343.2 / (4 * p.L), unit: 'Hz', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('sonido-gas', {
    gx: 'T',
    params: [
      { k: 'T', label: 'Temperatura <i>T</i>', min: 100, max: 1000, value: 293.15, unit: 'K', fmt: (v) => EM.fix(v, 2) },
      { k: 'M', label: 'Masa molar <i>M</i>', min: 2, max: 200, value: 28.96, log: true, unit: 'g/mol', fmt: (v) => EM.sci(v, 4) },
      { k: 'g', label: 'Coeficiente adiabático γ', min: 1.05, max: 1.67, value: 1.4, fmt: (v) => EM.fix(v, 3) }
    ],
    outs: [
      { k: 'c', label: 'Velocidad del sonido <i>c</i> = √(γ<i>RT</i>/<i>M</i>)', short: 'c', f: (p) => Math.sqrt(p.g * R * p.T / (p.M * 1e-3)), unit: 'm/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'ci', label: 'Valor de Newton (isotermo) √(<i>RT</i>/<i>M</i>)', short: 'c isotermo', f: (p) => Math.sqrt(R * p.T / (p.M * 1e-3)), unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'ra', label: 'Cociente <i>c</i>_isotermo/<i>c</i> = 1/√γ', short: 'c_iso/c', f: (p) => 1 / Math.sqrt(p.g), fmt: (v) => EM.fix(v, 5) }
    ]
  });

  EM.formula('sonido-int', {
    gx: 'r',
    params: [
      { k: 'P', label: 'Potencia acústica de la fuente <i>P</i>', min: 1e-9, max: 1e3, value: 1, log: true, unit: 'W', fmt: (v) => EM.sci(v, 3) },
      { k: 'r', label: 'Distancia a la fuente <i>r</i>', min: 0.1, max: 1000, value: 10, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'f', label: 'Frecuencia <i>f</i>', min: 20, max: 20000, value: 1000, log: true, unit: 'Hz', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'I', label: 'Intensidad <i>I</i> = <i>P</i>/(4π<i>r</i>²) (fuente puntual)', short: 'I', f: (p) => p.P / (4 * PI * p.r * p.r), unit: 'W/m²', fmt: (v) => EM.sci(v, 5) },
      { k: 'b', label: 'Nivel de intensidad β = 10 log₁₀(<i>I</i>/10⁻¹² W/m²)', short: 'β', f: (p) => 10 * Math.log10(p.P / (4 * PI * p.r * p.r) / 1e-12), unit: 'dB', fmt: (v) => EM.fix(v, 3), hl: true },
      { k: 'pr', label: 'Presión eficaz <i>p</i><sub>rms</sub> = √(<i>I</i>ρ<i>c</i>) (ρ = 1.204 kg/m³, <i>c</i> = 343.2 m/s)', short: 'p rms', f: (p) => Math.sqrt(p.P / (4 * PI * p.r * p.r) * 1.204 * 343.2), unit: 'Pa', fmt: (v) => EM.sci(v, 5) },
      { k: 's0', label: 'Amplitud de desplazamiento <i>s</i>₀ = √2 <i>p</i><sub>rms</sub>/(ρ<i>c</i>ω)', short: 's₀', f: (p) => Math.SQRT2 * Math.sqrt(p.P / (4 * PI * p.r * p.r) * 1.204 * 343.2) / (1.204 * 343.2 * 2 * PI * p.f), unit: 'm', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('doppler', {
    gx: 'vs',
    params: [
      { k: 'f', label: 'Frecuencia emitida <i>f</i>', min: 20, max: 20000, value: 700, log: true, unit: 'Hz', fmt: (v) => EM.sci(v, 4) },
      { k: 'vs', label: 'Velocidad de la fuente hacia el observador <i>v</i><sub>s</sub>', min: -100, max: 100, value: 30, unit: 'm/s', fmt: (v) => EM.fix(v, 1) },
      { k: 'vo', label: 'Velocidad del observador hacia la fuente <i>v</i><sub>o</sub>', min: -100, max: 100, value: 0, unit: 'm/s', fmt: (v) => EM.fix(v, 1) },
      { k: 'c', label: 'Velocidad del sonido <i>c</i>', min: 300, max: 1500, value: 343, unit: 'm/s', fmt: (v) => EM.fix(v, 1) }
    ],
    outs: [
      { k: 'fp', label: 'Frecuencia percibida <i>f</i>′ = <i>f</i>(<i>c</i> + <i>v</i><sub>o</sub>)/(<i>c</i> − <i>v</i><sub>s</sub>)', short: "f′", f: (p) => p.f * (p.c + p.vo) / (p.c - p.vs), unit: 'Hz', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'df', label: 'Corrimiento Δ<i>f</i> = <i>f</i>′ − <i>f</i>', short: 'Δf', f: (p) => p.f * (p.c + p.vo) / (p.c - p.vs) - p.f, unit: 'Hz', fmt: (v) => EM.sci(v, 5) },
      { k: 'lam', label: 'Longitud de onda en el medio λ′ = (<i>c</i> − <i>v</i><sub>s</sub>)/<i>f</i>', short: "λ′", f: (p) => (p.c - p.vs) / p.f, unit: 'm', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const wg = (p) => { const k = 2 * PI / p.lam, w = Math.sqrt(p.g * k + p.s * k * k * k / p.rho); return { k, w, vp: w / k, vg: (p.g + 3 * p.s * k * k / p.rho) / (2 * w) }; };
  EM.formula('grupo', {
    gx: 'lam',
    params: [
      { k: 'lam', label: 'Longitud de onda λ', min: 5e-4, max: 20, value: 0.1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) },
      { k: 's', label: 'Tensión superficial σ', min: 0.01, max: 0.1, value: 0.0728, unit: 'N/m', fmt: (v) => EM.fix(v, 4) },
      { k: 'rho', label: 'Densidad ρ', min: 500, max: 14000, value: 998, log: true, unit: 'kg/m³', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'vp', label: 'Velocidad de fase <i>v</i><sub>p</sub> = ω/<i>k</i>', short: 'v fase', f: (p) => wg(p).vp, unit: 'm/s', fmt: (v) => EM.sci(v, 6) },
      { k: 'vg', label: 'Velocidad de grupo <i>v</i><sub>g</sub> = dω/d<i>k</i> = (<i>g</i> + 3σ<i>k</i>²/ρ)/(2ω)', short: 'v grupo', f: (p) => wg(p).vg, unit: 'm/s', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'ra', label: 'Cociente <i>v</i><sub>g</sub>/<i>v</i><sub>p</sub>', short: 'v_g/v_p', f: (p) => { const q = wg(p); return q.vg / q.vp; }, fmt: (v) => EM.fix(v, 6) },
      { k: 'w', label: 'Frecuencia angular ω = √(<i>gk</i> + σ<i>k</i>³/ρ)', short: 'ω', f: (p) => wg(p).w, unit: 'rad/s', fmt: (v) => EM.sci(v, 6) }
    ]
  });
})();
