/* Capítulo 21 — Circuitos */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, qe = 1.602176634e-19, me = 9.1093837015e-31, hb = 1.054571817e-34, MU0 = 1.25663706212e-6, E0 = 8.8541878128e-12;

  const dr = (p) => { const n = p.n * 1e28, t = p.tau * 1e-15, sg = n * qe * qe * t / me, mu = qe * t / me, vF = hb * Math.cbrt(3 * PI * PI * n) / me; return { sg, mu, vd: mu * p.E, ell: vF * t }; };
  EM.formula('drude', {
    gx: 'tau',
    params: [
      { k: 'n', label: 'Densidad de electrones libres <i>n</i>', min: 0.1, max: 200, value: 8.47, log: true, unit: '10²⁸ m⁻³', fmt: (v) => EM.sci(v, 4) },
      { k: 'tau', label: 'Tiempo de relajación τ', min: 0.1, max: 200, value: 25, log: true, unit: 'fs', fmt: (v) => EM.sci(v, 4) },
      { k: 'E', label: 'Campo eléctrico en el conductor <i>E</i> (1 A en 1 mm²: 0.0168 V/m)', min: 1e-4, max: 1e3, value: 0.0168, log: true, unit: 'V/m', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'sg', label: 'Conductividad σ = <i>ne</i>²τ/<i>m</i>', short: 'σ', f: (p) => dr(p).sg * 1e-6, unit: 'MS/m', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'rho', label: 'Resistividad ρ = 1/σ', short: 'ρ', f: (p) => 1e9 / dr(p).sg, unit: 'nΩ·m', fmt: (v) => EM.sci(v, 5) },
      { k: 'mu', label: 'Movilidad μ = <i>e</i>τ/<i>m</i>', short: 'μ', f: (p) => dr(p).mu * 1e4, unit: 'cm²/(V·s)', fmt: (v) => EM.sci(v, 5) },
      { k: 'vd', label: 'Velocidad de arrastre <i>v</i><sub>d</sub> = μ<i>E</i>', short: 'v de arrastre', f: (p) => dr(p).vd * 1e3, unit: 'mm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'ell', label: 'Camino libre medio ℓ = <i>v</i><sub>F</sub>τ', short: 'ℓ', f: (p) => dr(p).ell * 1e9, unit: 'nm', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const rc = (p) => { const tau = p.R * 1e3 * p.C * 1e-6; const x = p.t * 1e-3 / tau; return { tau, f: -Math.expm1(-x), g: Math.exp(-x) }; };
  EM.formula('rc', {
    gx: 't',
    params: [
      { k: 'R', label: 'Resistencia <i>R</i>', min: 0.1, max: 1000, value: 10, log: true, unit: 'kΩ', fmt: (v) => EM.sci(v, 4) },
      { k: 'C', label: 'Capacidad <i>C</i>', min: 0.01, max: 1000, value: 1, log: true, unit: 'µF', fmt: (v) => EM.sci(v, 4) },
      { k: 'V', label: 'Tensión de la fuente <i>V</i>', min: 1, max: 100, value: 5, log: true, unit: 'V', fmt: (v) => EM.sci(v, 4) },
      { k: 't', label: 'Tiempo desde que se cierra el interruptor <i>t</i>', min: 0.01, max: 1000, value: 10, log: true, unit: 'ms', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'tau', label: 'Constante de tiempo τ = <i>RC</i>', short: 'τ', f: (p) => rc(p).tau * 1e3, unit: 'ms', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'vc', label: 'Tensión del condensador <i>v</i><sub>C</sub> = <i>V</i>(1 − e<sup>−<i>t</i>/τ</sup>)', short: 'v_C(t)', f: (p) => p.V * rc(p).f, unit: 'V', fmt: (v) => EM.sci(v, 5) },
      { k: 'i', label: 'Corriente <i>i</i> = (<i>V</i>/<i>R</i>) e<sup>−<i>t</i>/τ</sup>', short: 'i(t)', f: (p) => p.V / (p.R * 1e3) * rc(p).g * 1e3, unit: 'mA', fmt: (v) => EM.sci(v, 5) },
      { k: 'E', label: 'Energía total disipada en <i>R</i> = ½<i>CV</i>² (no depende de <i>R</i>)', short: 'E disipada', f: (p) => 0.5 * p.C * 1e-6 * p.V * p.V * 1e6, unit: 'µJ', fmt: (v) => EM.sci(v, 5) },
      { k: 'th', label: 'Tiempo para llegar al 50 %: τ ln 2', short: 't al 50 %', f: (p) => rc(p).tau * Math.LN2 * 1e3, unit: 'ms', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const rl = (p) => { const w0 = 1 / Math.sqrt(p.L * 1e-3 * p.C * 1e-6), w = 2 * PI * p.f, X = w * p.L * 1e-3 - 1 / (w * p.C * 1e-6), Z = Math.hypot(p.R, X); return { w0, X, Z }; };
  EM.formula('rlc', {
    gx: 'f',
    params: [
      { k: 'R', label: 'Resistencia <i>R</i>', min: 0.1, max: 1000, value: 10, log: true, unit: 'Ω', fmt: (v) => EM.sci(v, 4) },
      { k: 'L', label: 'Inductancia <i>L</i>', min: 0.1, max: 1000, value: 10, log: true, unit: 'mH', fmt: (v) => EM.sci(v, 4) },
      { k: 'C', label: 'Capacidad <i>C</i>', min: 0.01, max: 100, value: 1, log: true, unit: 'µF', fmt: (v) => EM.sci(v, 4) },
      { k: 'f', label: 'Frecuencia de la fuente <i>f</i>', min: 10, max: 1e5, value: 1000, log: true, unit: 'Hz', fmt: (v) => EM.sci(v, 4) },
      { k: 'V', label: 'Tensión eficaz de la fuente <i>V</i><sub>rms</sub>', min: 1, max: 230, value: 10, log: true, unit: 'V', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'f0', label: 'Frecuencia de resonancia <i>f</i><sub>0</sub> = 1/(2π√<i>LC</i>)', short: 'f₀', f: (p) => rl(p).w0 / (2 * PI), unit: 'Hz', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'Q', label: 'Factor de calidad <i>Q</i> = ω₀<i>L</i>/<i>R</i>', short: 'Q', f: (p) => rl(p).w0 * p.L * 1e-3 / p.R, fmt: (v) => EM.sci(v, 5) },
      { k: 'Z', label: 'Módulo de la impedancia |<i>Z</i>| = √[<i>R</i>² + (ω<i>L</i> − 1/ω<i>C</i>)²]', short: '|Z|', f: (p) => rl(p).Z, unit: 'Ω', fmt: (v) => EM.sci(v, 5) },
      { k: 'phi', label: 'Desfase tensión–corriente φ = arctan[(ω<i>L</i> − 1/ω<i>C</i>)/<i>R</i>]', short: 'φ', f: (p) => Math.atan2(rl(p).X, p.R) * 180 / PI, unit: '°', fmt: (v) => EM.sci(v, 5) },
      { k: 'P', label: 'Potencia media <i>P</i> = <i>V</i><sub>rms</sub>²<i>R</i>/|<i>Z</i>|²', short: 'P media', f: (p) => p.V * p.V * p.R / (rl(p).Z * rl(p).Z), unit: 'W', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('thevenin', {
    gx: 'RL',
    params: [
      { k: 'V', label: 'Tensión de Thévenin <i>V</i><sub>th</sub>', min: 1, max: 100, value: 12, log: true, unit: 'V', fmt: (v) => EM.sci(v, 4) },
      { k: 'Rt', label: 'Resistencia de Thévenin <i>R</i><sub>th</sub>', min: 0.1, max: 100, value: 2, log: true, unit: 'Ω', fmt: (v) => EM.sci(v, 4) },
      { k: 'RL', label: 'Resistencia de carga <i>R</i><sub>L</sub>', min: 0.01, max: 1000, value: 2, log: true, unit: 'Ω', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'P', label: 'Potencia en la carga <i>P</i> = <i>V</i>²<i>R</i><sub>L</sub>/(<i>R</i><sub>th</sub> + <i>R</i><sub>L</sub>)²', short: 'P en la carga', f: (p) => p.V * p.V * p.RL / Math.pow(p.Rt + p.RL, 2), unit: 'W', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'I', label: 'Corriente <i>I</i> = <i>V</i>/(<i>R</i><sub>th</sub> + <i>R</i><sub>L</sub>)', short: 'I', f: (p) => p.V / (p.Rt + p.RL), unit: 'A', fmt: (v) => EM.sci(v, 5) },
      { k: 'VL', label: 'Tensión en la carga <i>V</i><sub>L</sub> = <i>IR</i><sub>L</sub>', short: 'V_L', f: (p) => p.V * p.RL / (p.Rt + p.RL), unit: 'V', fmt: (v) => EM.sci(v, 5) },
      { k: 'eta', label: 'Rendimiento η = <i>R</i><sub>L</sub>/(<i>R</i><sub>th</sub> + <i>R</i><sub>L</sub>)', short: 'η', f: (p) => p.RL / (p.Rt + p.RL), fmt: (v) => EM.sci(v, 5) },
      { k: 'Pm', label: 'Potencia máxima (con <i>R</i><sub>L</sub> = <i>R</i><sub>th</sub>) <i>V</i>²/(4<i>R</i><sub>th</sub>)', short: 'P máxima', f: (p) => p.V * p.V / (4 * p.Rt), unit: 'W', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const cx = (p) => { const ln = Math.log(p.br), Cp = 2 * PI * E0 * p.er / ln, Lp = MU0 / (2 * PI) * ln; return { Cp, Lp, Z0: Math.sqrt(Lp / Cp), v: 1 / Math.sqrt(Lp * Cp) }; };
  EM.formula('coax', {
    gx: 'br',
    params: [
      { k: 'br', label: 'Razón de radios <i>b</i>/<i>a</i> (exterior/interior)', min: 1.05, max: 50, value: 3.641975, log: true, fmt: (v) => EM.sci(v, 5) },
      { k: 'er', label: 'Constante dieléctrica relativa ε<sub>r</sub>', min: 1, max: 10, value: 2.25, log: true, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'Z0', label: 'Impedancia característica <i>Z</i><sub>0</sub> = (ln(<i>b</i>/<i>a</i>)/2π)√(μ₀/ε)', short: 'Z₀', f: (p) => cx(p).Z0, unit: 'Ω', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'Cp', label: 'Capacidad por metro <i>C</i>′ = 2πε/ln(<i>b</i>/<i>a</i>)', short: 'C′', f: (p) => cx(p).Cp * 1e12, unit: 'pF/m', fmt: (v) => EM.sci(v, 5) },
      { k: 'Lp', label: 'Inductancia por metro <i>L</i>′ = (μ₀/2π) ln(<i>b</i>/<i>a</i>)', short: 'L′', f: (p) => cx(p).Lp * 1e9, unit: 'nH/m', fmt: (v) => EM.sci(v, 5) },
      { k: 'vc', label: 'Velocidad de propagación relativa <i>v</i>/<i>c</i> = 1/√ε<sub>r</sub>', short: 'v/c', f: (p) => cx(p).v * Math.sqrt(MU0 * E0), fmt: (v) => EM.sci(v, 6) },
      { k: 'dl', label: 'Retardo por metro 1/<i>v</i>', short: 'retardo', f: (p) => 1e9 / cx(p).v, unit: 'ns/m', fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
