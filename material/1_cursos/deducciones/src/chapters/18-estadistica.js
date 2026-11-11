/* Capítulo 18 — Mecánica estadística */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, kB = 1.380649e-23, NA = 6.02214076e23, R = kB * NA, h = 6.62607015e-34, hb = h / (2 * PI), qe = 1.602176634e-19, me = 9.1093837015e-31;
  const ZETA32 = 2.612375348685488;

  EM.formula('dos-niveles', {
    gx: 'T',
    params: [
      { k: 'D', label: 'Separación de los niveles Δ', min: 0.01, max: 100, value: 10, log: true, unit: 'meV', fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 1, max: 2000, value: 100, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'x', label: 'Cociente Δ/(<i>kT</i>)', short: 'Δ/kT', f: (p) => p.D * 1e-3 * qe / (kB * p.T), fmt: (v) => EM.sci(v, 5) },
      { k: 'p1', label: 'Población del nivel excitado 1/(1 + e<sup>Δ/<i>kT</i></sup>)', short: 'P excitado', f: (p) => { const e = Math.exp(-p.D * 1e-3 * qe / (kB * p.T)); return e / (1 + e); }, fmt: (v) => EM.sci(v, 5) },
      { k: 'U', label: 'Energía media por partícula Δ/(1 + e<sup>Δ/<i>kT</i></sup>)', short: 'U/N', f: (p) => { const e = Math.exp(-p.D * 1e-3 * qe / (kB * p.T)); return p.D * e / (1 + e); }, unit: 'meV', fmt: (v) => EM.sci(v, 5) },
      { k: 'C', label: 'Calor específico <i>C</i>/(<i>Nk</i>) = <i>x</i>²e<sup><i>x</i></sup>/(1 + e<sup><i>x</i></sup>)²', short: 'C/(Nk)', f: (p) => { const x = p.D * 1e-3 * qe / (kB * p.T), e = Math.exp(-x); return x * x * e / ((1 + e) * (1 + e)); }, fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'S', label: 'Entropía <i>S</i>/(<i>Nk</i>) = ln(1 + e<sup>−<i>x</i></sup>) + <i>x</i>/(e<sup><i>x</i></sup> + 1)', short: 'S/(Nk)', f: (p) => { const x = p.D * 1e-3 * qe / (kB * p.T), e = Math.exp(-x); return Math.log1p(e) + x * e / (1 + e); }, fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const ei = (p) => { const x = p.th / p.T, em = Math.expm1(-x); return { x, C: 3 * R * x * x * Math.exp(-x) / (em * em), nb: 1 / Math.expm1(x) }; };
  EM.formula('einstein', {
    gx: 'T',
    params: [
      { k: 'th', label: 'Temperatura de Einstein θ<sub>E</sub> = ħω/<i>k</i>', min: 50, max: 3000, value: 1320, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 5, max: 3000, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'C', label: 'Calor específico molar <i>C</i><sub>v</sub> = 3<i>R</i> <i>x</i>²e<sup><i>x</i></sup>/(e<sup><i>x</i></sup> − 1)², <i>x</i> = θ<sub>E</sub>/<i>T</i>', short: 'C_v', f: (p) => ei(p).C, unit: 'J/(mol·K)', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'CR', label: 'Fracción del valor de Dulong–Petit <i>C</i><sub>v</sub>/(3<i>R</i>)', short: 'C/3R', f: (p) => ei(p).C / (3 * R), fmt: (v) => EM.sci(v, 5) },
      { k: 'nb', label: 'Número medio de cuantos por oscilador 1/(e<sup><i>x</i></sup> − 1)', short: 'n medio', f: (p) => ei(p).nb, fmt: (v) => EM.sci(v, 5) },
      { k: 'U', label: 'Energía interna molar 3<i>R</i>θ<sub>E</sub>(½ + 1/(e<sup><i>x</i></sup> − 1))', short: 'U molar', f: (p) => 3 * R * p.th * (0.5 + ei(p).nb), unit: 'J/mol', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const st = (p) => { const m = p.M * 1e-3 / NA, lam = h / Math.sqrt(2 * PI * m * kB * p.T), n = p.p * 1e5 / (kB * p.T); return { lam, nl3: n * lam * lam * lam, S: Math.log(1 / (n * lam * lam * lam)) + 2.5 }; };
  EM.formula('sackur', {
    gx: 'T',
    params: [
      { k: 'T', label: 'Temperatura <i>T</i>', min: 1, max: 5000, value: 298.15, log: true, unit: 'K', fmt: (v) => EM.sci(v, 5) },
      { k: 'p', label: 'Presión <i>p</i>', min: 1e-6, max: 1e3, value: 1, log: true, unit: 'bar', fmt: (v) => EM.sci(v, 4) },
      { k: 'M', label: 'Masa molar <i>M</i> del gas monoatómico', min: 1, max: 300, value: 4.0026, log: true, unit: 'g/mol', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'S', label: 'Entropía molar <i>S</i> = <i>R</i>[ln(1/<i>n</i>λ³) + 5/2]', short: 'S molar', f: (p) => st(p).S * R, unit: 'J/(mol·K)', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'lam', label: 'Longitud de onda térmica de de Broglie λ = <i>h</i>/√(2π<i>mkT</i>)', short: 'λ térmica', f: (p) => st(p).lam * 1e12, unit: 'pm', fmt: (v) => EM.sci(v, 6) },
      { k: 'nl3', label: 'Parámetro de degeneración <i>n</i>λ³ (el gas es clásico si ≪ 1)', short: 'nλ³', f: (p) => st(p).nl3, fmt: (v) => EM.sci(v, 5) },
      { k: 'Sk', label: 'Entropía por partícula <i>S</i>/(<i>Nk</i>)', short: 'S/(Nk)', f: (p) => st(p).S, fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const fm = (p) => { const n = p.n * 1e28, kF = Math.cbrt(3 * PI * PI * n), m = p.ms * me, EF = hb * hb * kF * kF / (2 * m), TF = EF / kB; return { EF, TF, vF: hb * kF / m }; };
  EM.formula('fermi', {
    gx: 'n',
    params: [
      { k: 'n', label: 'Densidad de electrones <i>n</i>', min: 0.05, max: 200, value: 8.47, log: true, unit: '10²⁸ m⁻³', fmt: (v) => EM.sci(v, 4) },
      { k: 'ms', label: 'Masa efectiva <i>m</i>*/<i>m</i><sub>e</sub>', min: 0.3, max: 3, value: 1, log: true, fmt: (v) => EM.sci(v, 3) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 1, max: 10000, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'EF', label: 'Energía de Fermi <i>E</i><sub>F</sub> = ħ²(3π²<i>n</i>)<sup>2/3</sup>/(2<i>m</i>*)', short: 'E de Fermi', f: (p) => fm(p).EF / qe, unit: 'eV', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'TF', label: 'Temperatura de Fermi <i>T</i><sub>F</sub> = <i>E</i><sub>F</sub>/<i>k</i>', short: 'T de Fermi', f: (p) => fm(p).TF, unit: 'K', fmt: (v) => EM.sci(v, 5) },
      { k: 'vF', label: 'Velocidad de Fermi <i>v</i><sub>F</sub> = ħ<i>k</i><sub>F</sub>/<i>m</i>*', short: 'v de Fermi', f: (p) => fm(p).vF, unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'Ce', label: 'Calor específico electrónico <i>C</i>/(<i>Nk</i>) = (π²/2)<i>T</i>/<i>T</i><sub>F</sub> (para <i>T</i> ≪ <i>T</i><sub>F</sub>)', short: 'C_el/(Nk)', f: (p) => PI * PI / 2 * p.T / fm(p).TF, fmt: (v) => EM.sci(v, 5) },
      { k: 'gam', label: 'Coeficiente de Sommerfeld γ = (π²/2)<i>R</i>/<i>T</i><sub>F</sub> (un electrón libre por átomo)', short: 'γ', f: (p) => PI * PI / 2 * R / fm(p).TF * 1e3, unit: 'mJ/(mol·K²)', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const bo = (p) => { const m = p.M * 1e-3 / NA, n = p.n, Tc = 2 * PI * hb * hb / (m * kB) * Math.pow(n / ZETA32, 2 / 3), lam = h / Math.sqrt(2 * PI * m * kB * p.T); return { Tc, f0: Math.max(0, 1 - Math.pow(p.T / Tc, 1.5)), lam, nl3: n * lam * lam * lam }; };
  EM.formula('bose', {
    gx: 'n',
    params: [
      { k: 'n', label: 'Densidad numérica <i>n</i>', min: 1e18, max: 1e30, value: 2.18e28, log: true, unit: 'm⁻³', fmt: (v) => EM.sci(v, 4) },
      { k: 'M', label: 'Masa molar <i>M</i>', min: 1, max: 200, value: 4.0026, log: true, unit: 'g/mol', fmt: (v) => EM.sci(v, 5) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 1e-8, max: 100, value: 1, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'Tc', label: 'Temperatura crítica <i>T</i><sub>c</sub> = (2πħ²/<i>mk</i>)(<i>n</i>/ζ(3/2))<sup>2/3</sup>', short: 'T crítica', f: (p) => bo(p).Tc, unit: 'K', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'f0', label: 'Fracción condensada 1 − (<i>T</i>/<i>T</i><sub>c</sub>)<sup>3/2</sup> (0 si <i>T</i> > <i>T</i><sub>c</sub>)', short: 'N₀/N', f: (p) => bo(p).f0, fmt: (v) => EM.sci(v, 5) },
      { k: 'lam', label: 'Longitud de onda térmica λ<sub>T</sub> a la temperatura <i>T</i>', short: 'λ térmica', f: (p) => bo(p).lam * 1e9, unit: 'nm', fmt: (v) => EM.sci(v, 5) },
      { k: 'nl3', label: 'Densidad en el espacio de fases <i>n</i>λ<sub>T</sub>³ (condensa al llegar a ζ(3/2) = 2.612)', short: 'nλ³', f: (p) => bo(p).nl3, fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
