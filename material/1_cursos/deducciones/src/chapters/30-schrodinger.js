/* Capítulo 30 — Ecuación de Schrödinger en una dimensión */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, H = 6.62607015e-34, HB = H / (2 * PI), C = 299792458, ME = 9.1093837015e-31, QE = 1.602176634e-19, AMU = 1.66053906660e-27;

  const cj = (p) => { const m = p.mr * ME, L = p.L * 1e-9; return { E1: PI * PI * HB * HB / (2 * m * L * L) / QE }; };
  EM.formula('caja', {
    gx: 'L',
    params: [
      { k: 'mr', label: 'Masa de la partícula en unidades de la masa del electrón <i>m</i>/<i>m</i><sub>e</sub>', min: 0.1, max: 1e5, value: 1, log: true, fmt: (v) => EM.sci(v, 4) },
      { k: 'L', label: 'Anchura de la caja <i>L</i>', min: 0.05, max: 100, value: 1, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 4) },
      { k: 'n', label: 'Número cuántico <i>n</i>', min: 1, max: 10, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 }
    ],
    outs: [
      { k: 'En', label: 'Energía <i>E</i><sub>n</sub> = <i>n</i>²π²ħ²/(2<i>mL</i>²)', short: 'E_n', f: (p) => p.n * p.n * cj(p).E1, unit: 'eV', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'E1', label: 'Energía del estado fundamental <i>E</i>₁', short: 'E₁', f: (p) => cj(p).E1, unit: 'eV', fmt: (v) => EM.sci(v, 6) },
      { k: 'dE', label: 'Separación <i>E</i><sub>n+1</sub> − <i>E</i><sub>n</sub> = (2<i>n</i> + 1)<i>E</i>₁', short: 'E_{n+1} − E_n', f: (p) => (2 * p.n + 1) * cj(p).E1, unit: 'eV', fmt: (v) => EM.sci(v, 6) },
      { k: 'lam', label: 'Longitud de onda del fotón de la transición <i>n</i> → <i>n</i> + 1', short: 'λ', f: (p) => H * C / ((2 * p.n + 1) * cj(p).E1 * QE) * 1e9, unit: 'nm', fmt: (v) => EM.sci(v, 6) },
      { k: 'pc', label: 'Cantidad de movimiento <i>p</i><sub>n</sub> = <i>n</i>πħ/<i>L</i> (en eV/<i>c</i>)', short: 'p_n c', f: (p) => p.n * PI * HB / (p.L * 1e-9) * C / QE, unit: 'eV', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const os = (p) => { const m = p.M * AMU, w = Math.sqrt(p.k / m); return { m, w }; };
  EM.formula('oscilador', {
    gx: 'k',
    params: [
      { k: 'M', label: 'Masa (reducida) de la partícula (CO: 6.857 u)', min: 5e-4, max: 1000, value: 6.857142857, log: true, unit: 'u', fmt: (v) => EM.sci(v, 6) },
      { k: 'k', label: 'Constante del resorte <i>k</i> (CO: 1857 N/m)', min: 0.1, max: 3000, value: 1857, log: true, unit: 'N/m', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'w', label: 'Frecuencia angular ω = √(<i>k</i>/<i>m</i>)', short: 'ω', f: (p) => os(p).w, unit: 'rad/s', fmt: (v) => EM.sci(v, 6) },
      { k: 'hw', label: 'Cuanto de energía ħω (separación entre niveles)', short: 'ħω', f: (p) => HB * os(p).w / QE, unit: 'eV', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'E0', label: 'Energía del punto cero ½ħω', short: 'E₀', f: (p) => 0.5 * HB * os(p).w / QE, unit: 'eV', fmt: (v) => EM.sci(v, 6) },
      { k: 'x0', label: 'Anchura del estado fundamental <i>x</i><sub>0</sub> = √(ħ/<i>mω</i>)', short: 'x₀', f: (p) => Math.sqrt(HB / (os(p).m * os(p).w)) * 1e12, unit: 'pm', fmt: (v) => EM.sci(v, 6) },
      { k: 'nu', label: 'Número de onda de la transición ω/(2π<i>c</i>)', short: 'ν̃', f: (p) => os(p).w / (2 * PI * C * 100), unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const tn = (p) => { const E = p.r * p.V, kap = Math.sqrt(2 * ME * (p.V - E) * QE) / HB * 1e-9; return { E, kap }; };
  EM.formula('tunel', {
    gx: 'L',
    params: [
      { k: 'V', label: 'Altura de la barrera <i>V</i>₀', min: 0.5, max: 20, value: 2, log: true, unit: 'eV', fmt: (v) => EM.sci(v, 4) },
      { k: 'r', label: 'Cociente de energías <i>E</i>/<i>V</i>₀ del electrón (< 1)', min: 0.05, max: 0.95, value: 0.5, fmt: (v) => EM.sci(v, 4), step: 0.01 },
      { k: 'L', label: 'Anchura de la barrera <i>L</i>', min: 0.05, max: 5, value: 0.5, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'kap', label: 'Constante de decaimiento κ = √(2<i>m</i>(<i>V</i>₀ − <i>E</i>))/ħ', short: 'κ', f: (p) => tn(p).kap, unit: 'nm⁻¹', fmt: (v) => EM.sci(v, 6) },
      { k: 'T', label: 'Transmisión exacta [1 + <i>V</i>₀² sinh²(κ<i>L</i>)/(4<i>E</i>(<i>V</i>₀ − <i>E</i>))]⁻¹', short: 'T exacta', f: (p) => 1 / (1 + p.V * p.V * Math.pow(Math.sinh(tn(p).kap * p.L), 2) / (4 * tn(p).E * (p.V - tn(p).E))), fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'Ta', label: 'Aproximación de barrera ancha 16(<i>E</i>/<i>V</i>₀)(1 − <i>E</i>/<i>V</i>₀) e<sup>−2κ<i>L</i></sup>', short: 'T aproximada', f: (p) => 16 * p.r * (1 - p.r) * Math.exp(-2 * tn(p).kap * p.L), fmt: (v) => EM.sci(v, 6) },
      { k: 'd', label: 'Longitud de penetración 1/(2κ)', short: 'penetración', f: (p) => 1 / (2 * tn(p).kap) * 1e3, unit: 'pm', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const pf = (p) => {
    const m = p.mr * ME, z0 = p.L * 1e-9 / (2 * HB) * Math.sqrt(2 * m * p.V * QE);
    let lo = 1e-12, hi = Math.min(z0, PI / 2) - 1e-12;
    const g = (z) => z * Math.tan(z) - Math.sqrt(Math.max(z0 * z0 - z * z, 0));
    for (let i = 0; i < 200; i++) { const mid = 0.5 * (lo + hi); if (g(mid) > 0) hi = mid; else lo = mid; }
    const z = 0.5 * (lo + hi);
    return { m, z0, z, E1: HB * HB * z * z / (2 * m * Math.pow(p.L * 1e-9 / 2, 2)) / QE };
  };
  EM.formula('pozo', {
    gx: 'V',
    params: [
      { k: 'V', label: 'Profundidad del pozo <i>V</i>₀', min: 0.1, max: 100, value: 10, log: true, unit: 'eV', fmt: (v) => EM.sci(v, 4) },
      { k: 'L', label: 'Anchura del pozo <i>L</i>', min: 0.1, max: 10, value: 1, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 4) },
      { k: 'mr', label: 'Masa en unidades de <i>m</i><sub>e</sub>', min: 0.1, max: 10, value: 1, log: true, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'z0', label: 'Parámetro <i>z</i>₀ = (<i>L</i>/2ħ)√(2<i>mV</i>₀)', short: 'z₀', f: (p) => pf(p).z0, fmt: (v) => EM.sci(v, 6) },
      { k: 'N', label: 'Número de estados ligados ⌈2<i>z</i>₀/π⌉', short: 'estados ligados', f: (p) => Math.ceil(2 * pf(p).z0 / PI), fmt: (v) => EM.sci(v, 3) },
      { k: 'E1', label: 'Energía del estado fundamental (<i>z</i> tan <i>z</i> = √(<i>z</i>₀² − <i>z</i>²))', short: 'E₁ (pozo finito)', f: (p) => pf(p).E1, unit: 'eV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'r', label: 'Cociente <i>E</i>₁/<i>V</i>₀', short: 'E₁/V₀', f: (p) => pf(p).E1 / p.V, fmt: (v) => EM.sci(v, 6) },
      { k: 'Ei', label: 'Pozo infinito de la misma anchura π²ħ²/(2<i>mL</i>²)', short: 'E₁ (pozo infinito)', f: (p) => PI * PI * HB * HB / (2 * pf(p).m * p.L * p.L * 1e-18) / QE, unit: 'eV', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const pq = (p) => { const m = p.mr * ME, s0 = p.s0 * 1e-9, tau = 2 * m * s0 * s0 / HB; return { m, s0, tau }; };
  EM.formula('paquete', {
    gx: 't',
    params: [
      { k: 'mr', label: 'Masa en unidades de <i>m</i><sub>e</sub> (protón: 1836.15)', min: 1, max: 1e5, value: 1, log: true, fmt: (v) => EM.sci(v, 5) },
      { k: 's0', label: 'Anchura inicial del paquete σ₀', min: 0.01, max: 10, value: 0.1, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 4) },
      { k: 't', label: 'Tiempo transcurrido <i>t</i>', min: 0.01, max: 1e4, value: 1, log: true, unit: 'fs', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'st', label: 'Anchura σ(<i>t</i>) = σ₀√[1 + (ħ<i>t</i>/2<i>m</i>σ₀²)²]', short: 'σ(t)', f: (p) => pq(p).s0 * Math.sqrt(1 + Math.pow(p.t * 1e-15 / pq(p).tau, 2)) * 1e9, unit: 'nm', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'ratio', label: 'Cociente σ(<i>t</i>)/σ₀', short: 'σ/σ₀', f: (p) => Math.sqrt(1 + Math.pow(p.t * 1e-15 / pq(p).tau, 2)), fmt: (v) => EM.sci(v, 7) },
      { k: 'dv', label: 'Dispersión de velocidades ħ/(2<i>m</i>σ₀)', short: 'Δv', f: (p) => HB / (2 * pq(p).m * pq(p).s0) * 1e-3, unit: 'km/s', fmt: (v) => EM.sci(v, 6) },
      { k: 'tau', label: 'Tiempo característico de ensanchamiento 2<i>m</i>σ₀²/ħ', short: 'τ de ensanchamiento', f: (p) => pq(p).tau * 1e15, unit: 'fs', fmt: (v) => EM.sci(v, 6) }
    ]
  });
})();
