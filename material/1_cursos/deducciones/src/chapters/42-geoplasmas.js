/* Capítulo 42 — Geofísica y plasmas */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, QE = 1.602176634e-19, ME = 9.1093837015e-31, EPS0 = 8.8541878128e-12, MYR = 3.15576e13;

  /* ---- Movimiento en un campo magnético y deriva E×B ---- */
  const gi = (p) => { const m = p.m * ME, q = p.q * QE, v = Math.sqrt(2 * p.W * 1e3 * QE / m); return { m, q, v, r: m * v / (q * p.B), f: q * p.B / (2 * PI * m) }; };
  EM.formula('plas-giro', {
    gx: 'B',
    params: [
      { k: 'm', label: 'Masa de la partícula en masas del electrón (protón: 1836.15)', min: 1, max: 4e5, value: 1836.15267343, log: true, fmt: (v) => EM.sci(v, 8) },
      { k: 'q', label: 'Carga en unidades de <i>e</i>', min: 1, max: 10, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'W', label: 'Energía cinética perpendicular <i>W</i>', min: 0.001, max: 1e5, value: 1000, log: true, unit: 'keV', fmt: (v) => EM.sci(v, 5) },
      { k: 'B', label: 'Campo magnético <i>B</i>', min: 1e-9, max: 20, value: 5, log: true, unit: 'T', fmt: (v) => EM.sci(v, 5) },
      { k: 'E', label: 'Campo eléctrico perpendicular <i>E</i>', min: 1e-3, max: 1e7, value: 1000, log: true, unit: 'V/m', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'v', label: 'Velocidad perpendicular <i>v</i> = √(2<i>W</i>/<i>m</i>)', short: 'v', f: (p) => gi(p).v * 1e-6, unit: '10⁶ m/s', fmt: (v) => EM.sci(v, 8) },
      { k: 'r', label: 'Radio de giro (de Larmor) <i>r</i><sub>L</sub> = <i>mv</i>/(|<i>q</i>|<i>B</i>)', short: 'r_L', f: (p) => gi(p).r * 1e3, unit: 'mm', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'f', label: 'Frecuencia de giro (ciclotrón) <i>f</i><sub>c</sub> = |<i>q</i>|<i>B</i>/(2π<i>m</i>)', short: 'f_c', f: (p) => gi(p).f * 1e-6, unit: 'MHz', fmt: (v) => EM.sci(v, 8) },
      { k: 'vd', label: 'Velocidad de deriva <i>E</i>×<i>B</i>: <i>E</i>/<i>B</i>', short: 'v_E×B', f: (p) => p.E / p.B, unit: 'm/s', fmt: (v) => EM.sci(v, 8) }
    ]
  });

  /* ---- Plasma: Debye y oscilaciones ---- */
  const pl = (p) => { const T = p.T * QE; return { ld: Math.sqrt(EPS0 * T / (p.n * QE * QE)), wp: Math.sqrt(p.n * QE * QE / (EPS0 * ME)) }; };
  EM.formula('plas-debye', {
    gx: 'n',
    params: [
      { k: 'n', label: 'Densidad de electrones <i>n</i> (ionosfera: 10¹²; núcleo solar: 10³²; tokamak: 10²⁰)', min: 1e5, max: 1e32, value: 1e12, log: true, unit: 'm⁻³', fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura electrónica <i>kT</i>', min: 0.01, max: 1e5, value: 0.1, log: true, unit: 'eV', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'ld', label: 'Longitud de Debye λ<sub>D</sub> = √(ε₀<i>kT</i>/<i>ne</i>²)', short: 'λ_D', f: (p) => pl(p).ld, unit: 'm', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'wp', label: 'Frecuencia angular de plasma ω<sub>p</sub> = √(<i>ne</i>²/ε₀<i>m</i>)', short: 'ω_p', f: (p) => pl(p).wp, unit: 'rad/s', fmt: (v) => EM.sci(v, 8) },
      { k: 'fp', label: 'Frecuencia de plasma <i>f</i><sub>p</sub> = ω<sub>p</sub>/2π', short: 'f_p', f: (p) => pl(p).wp / (2 * PI), unit: 'Hz', fmt: (v) => EM.sci(v, 8) },
      { k: 'ND', label: 'Número de partículas en la esfera de Debye (4π/3)<i>n</i>λ<sub>D</sub>³', short: 'N_D', f: (p) => 4 * PI / 3 * p.n * Math.pow(pl(p).ld, 3), fmt: (v) => EM.sci(v, 8) }
    ]
  });

  /* ---- Ondas sísmicas ---- */
  EM.formula('geo-sismica', {
    gx: 'mu',
    params: [
      { k: 'K', label: 'Módulo de compresibilidad <i>K</i> (manto superior: 130 GPa; agua: 2.2)', min: 1, max: 1500, value: 130, log: true, unit: 'GPa', fmt: (v) => EM.sci(v, 4) },
      { k: 'mu', label: 'Módulo de cizalladura μ (manto: 70 GPa; granito: 30)', min: 0.5, max: 400, value: 70, log: true, unit: 'GPa', fmt: (v) => EM.sci(v, 4) },
      { k: 'rho', label: 'Densidad ρ (manto superior: 3300 kg/m³)', min: 500, max: 14000, value: 3300, log: true, unit: 'kg/m³', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'vp', label: 'Velocidad de las ondas P <i>v</i><sub>P</sub> = √[(<i>K</i> + 4μ/3)/ρ]', short: 'v_P', f: (p) => Math.sqrt((p.K + 4 * p.mu / 3) * 1e9 / p.rho) * 1e-3, unit: 'km/s', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'vs', label: 'Velocidad de las ondas S <i>v</i><sub>S</sub> = √(μ/ρ)', short: 'v_S', f: (p) => Math.sqrt(p.mu * 1e9 / p.rho) * 1e-3, unit: 'km/s', fmt: (v) => EM.sci(v, 8) },
      { k: 'r', label: 'Cociente <i>v</i><sub>P</sub>/<i>v</i><sub>S</sub>', short: 'vP/vS', f: (p) => Math.sqrt((p.K + 4 * p.mu / 3) / p.mu), fmt: (v) => EM.sci(v, 8) },
      { k: 'nu', label: 'Coeficiente de Poisson ν = (<i>K</i> − 2μ/3)/[2(<i>K</i> + μ/3)]', short: 'ν', f: (p) => (p.K - 2 * p.mu / 3) / (2 * (p.K + p.mu / 3)), fmt: (v) => EM.sci(v, 8) }
    ]
  });

  /* ---- Enfriamiento de la litosfera oceánica ---- */
  const lit = (p) => {
    const s = Math.sqrt(p.kap * 1e-6 * p.t * MYR);
    /* erf de Abramowitz–Stegun mejorada con serie para precisión alta */
    return { s };
  };
  EM.formula('geo-litosfera', {
    gx: 't',
    params: [
      { k: 't', label: 'Edad del fondo oceánico <i>t</i>', min: 1, max: 200, value: 80, log: true, unit: 'Ma', fmt: (v) => EM.sci(v, 4) },
      { k: 'kap', label: 'Difusividad térmica κ (10⁻⁶ m²/s)', min: 0.5, max: 2, value: 1, fmt: (v) => EM.sci(v, 4) },
      { k: 'dT', label: 'Diferencia <i>T</i><sub>m</sub> − <i>T</i><sub>s</sub> entre el manto y el fondo del mar', min: 800, max: 1600, value: 1300, unit: 'K', fmt: (v) => EM.sci(v, 5) },
      { k: 'k', label: 'Conductividad térmica <i>k</i>', min: 1.5, max: 5, value: 3.1, unit: 'W/(m K)', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'zL', label: 'Espesor térmico (isoterma 0.9 <i>T</i><sub>m</sub>): 2 erf⁻¹(0.9) √(κ<i>t</i>) = 2.326 √(κ<i>t</i>)', short: 'z_L', f: (p) => 2.3261743073533485 * lit(p).s * 1e-3, unit: 'km', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'q', label: 'Flujo de calor en la superficie <i>q</i> = <i>k</i>(<i>T</i><sub>m</sub> − <i>T</i><sub>s</sub>)/√(π κ<i>t</i>)', short: 'q', f: (p) => p.k * p.dT / (Math.sqrt(PI) * lit(p).s) * 1e3, unit: 'mW/m²', fmt: (v) => EM.sci(v, 8) },
      { k: 'dd', label: 'Hundimiento isostático 2ρ<sub>m</sub>α(<i>T</i><sub>m</sub> − <i>T</i><sub>s</sub>)/(ρ<sub>m</sub> − ρ<sub>w</sub>) √(κ<i>t</i>/π)', short: 'hundimiento', f: (p) => 2 * 3330 * 3.1e-5 * p.dT / (3330 - 1000) * lit(p).s / Math.sqrt(PI), unit: 'm', fmt: (v) => EM.sci(v, 8) },
      { k: 'ds', label: 'Comparación: hundimiento empírico 350√<i>t</i> (<i>t</i> en Ma)', short: '350√t', f: (p) => 350 * Math.sqrt(p.t), unit: 'm', fmt: (v) => EM.sci(v, 8) }
    ]
  });

  /* ---- Dipolo geomagnético ---- */
  const di = (p) => { const l = p.lat * PI / 180, s = Math.pow(1 / p.r, 3) * p.B0; return { Br: 2 * s * Math.sin(l), Bh: s * Math.cos(l), B: s * Math.sqrt(1 + 3 * Math.sin(l) * Math.sin(l)), I: Math.atan(2 * Math.tan(l)) * 180 / PI }; };
  EM.formula('geo-dipolo', {
    gx: 'lat',
    params: [
      { k: 'lat', label: 'Latitud geomagnética λ', min: 0, max: 89, value: 45, unit: '°', angle: true, fmt: (v) => EM.sci(v, 4) },
      { k: 'r', label: 'Distancia al centro en radios terrestres <i>r</i>/<i>R</i>', min: 1, max: 10, value: 1, log: true, fmt: (v) => EM.sci(v, 4) },
      { k: 'B0', label: 'Campo ecuatorial en la superficie <i>B</i><sub>0</sub> = μ₀<i>M</i>/(4π<i>R</i>³) (30.163 µT)', min: 20, max: 40, value: 30.1628, unit: 'µT', fmt: (v) => EM.sci(v, 6) }
    ],
    outs: [
      { k: 'B', label: 'Intensidad total <i>B</i> = <i>B</i><sub>0</sub>(<i>R</i>/<i>r</i>)³ √(1 + 3 sen²λ)', short: 'B', f: (p) => di(p).B, unit: 'µT', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'Br', label: 'Componente vertical 2<i>B</i><sub>0</sub>(<i>R</i>/<i>r</i>)³ sen λ', short: 'B_vertical', f: (p) => di(p).Br, unit: 'µT', fmt: (v) => EM.sci(v, 8) },
      { k: 'Bh', label: 'Componente horizontal <i>B</i><sub>0</sub>(<i>R</i>/<i>r</i>)³ cos λ', short: 'B_horizontal', f: (p) => di(p).Bh, unit: 'µT', fmt: (v) => EM.sci(v, 8) },
      { k: 'I', label: 'Inclinación <i>I</i> = arctan(2 tan λ)', short: 'I', f: (p) => di(p).I, unit: '°', fmt: (v) => EM.sci(v, 8) }
    ]
  });
})();
