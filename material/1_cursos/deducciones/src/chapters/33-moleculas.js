/* Capítulo 33 — Moléculas: enlace, orbitales π, vibración, rotación y espectros */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, H = 6.62607015e-34, C = 299792458, QE = 1.602176634e-19, A0 = 5.29177210903e-11, EH = 13.605693123, KB = 1.380649e-23, AMU = 1.66053906660e-27;
  const EHA = 2 * EH; /* hartree en eV */

  /* ---- H2+ por LCAO (unidades atómicas) ---- */
  const lc = (R) => {
    const S = Math.exp(-R) * (1 + R + R * R / 3);
    const J = 1 / R - Math.exp(-2 * R) * (1 + 1 / R);
    const K = Math.exp(-R) * (1 + R);
    return { S, J, K, Ug: 1 / R - (J + K) / (1 + S), Uu: 1 / R - (J - K) / (1 - S) };
  };
  EM.formula('h2plus', {
    gx: 'R',
    params: [
      { k: 'R', label: 'Distancia entre los protones <i>R</i>', min: 0.3, max: 8, value: 1.319, log: true, unit: 'Å', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'S', label: 'Integral de solapamiento <i>S</i> = e<sup>−R</sup>(1 + <i>R</i> + <i>R</i>²/3)', short: 'S', f: (p) => lc(p.R * 1e-10 / A0).S, fmt: (v) => EM.sci(v, 7) },
      { k: 'Eg', label: 'Energía del orbital enlazante σ<sub>g</sub> respecto a H + H⁺', short: 'U_g', f: (p) => lc(p.R * 1e-10 / A0).Ug * EHA, unit: 'eV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'Eu', label: 'Energía del orbital antienlazante σ<sub>u</sub> respecto a H + H⁺', short: 'U_u', f: (p) => lc(p.R * 1e-10 / A0).Uu * EHA, unit: 'eV', fmt: (v) => EM.sci(v, 7) },
      { k: 'K', label: 'Integral de intercambio <i>K</i> = e<sup>−R</sup>(1 + <i>R</i>)', short: 'K', f: (p) => lc(p.R * 1e-10 / A0).K, fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Hückel: anillo de N átomos con un electrón π cada uno ---- */
  const hk = (p) => {
    const N = 2 * Math.round(p.N / 2), b = p.b;
    const eps = [];
    for (let k = 0; k < N; k++) eps.push(-2 * Math.cos(2 * PI * k / N));
    eps.sort((x, y) => x - y);
    let E = 0;
    for (let i = 0; i < N / 2; i++) E += 2 * eps[i];
    const gap = eps[N / 2] - eps[N / 2 - 1];
    return { E: E * b, gap: Math.abs(gap) < 1e-9 ? 0 : gap * b, DE: (-E - N) * b };
  };
  EM.formula('huckel', {
    gx: 'N',
    params: [
      { k: 'N', label: 'Átomos del anillo conjugado <i>N</i> (par)', min: 4, max: 40, value: 6, fmt: (v) => EM.sci(v, 3), step: 2 },
      { k: 'b', label: 'Parámetro de resonancia |β| (≈ 2.4 eV ajusta los espectros)', min: 0.5, max: 4, value: 2.4, fmt: (v) => EM.sci(v, 4), unit: 'eV' }
    ],
    outs: [
      { k: 'E', label: 'Energía π total relativa a <i>N</i>α: <i>E</i> = 2Σ <i>ε</i><sub>k</sub>', short: 'E_π − Nα', f: (p) => hk(p).E, unit: 'eV', fmt: (v) => EM.sci(v, 7) },
      { k: 'DE', label: 'Energía de deslocalización respecto a <i>N</i>/2 enlaces dobles aislados', short: 'deslocalización', f: (p) => hk(p).DE, unit: 'eV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'gap', label: 'Separación HOMO–LUMO (cero en sistemas 4<i>n</i>)', short: 'HOMO–LUMO', f: (p) => hk(p).gap, unit: 'eV', fmt: (v) => EM.sci(v, 7) },
      { k: 'lam', label: 'Longitud de onda de la primera absorción <i>hc</i>/gap (0 si no hay)', short: 'λ', f: (p) => { const g = hk(p).gap; return g > 1e-9 ? H * C / (g * QE) * 1e9 : 0; }, unit: 'nm', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  /* ---- Morse ---- */
  const mo = (p) => {
    const Dcm = p.D * QE / (H * C * 100);
    const wx = p.w * p.w / (4 * Dcm);
    return { Dcm, wx };
  };
  EM.formula('morse', {
    gx: 'v',
    params: [
      { k: 'w', label: 'Frecuencia armónica ω<sub>e</sub> (CO: 2169.81 cm⁻¹)', min: 100, max: 5000, value: 2169.81, log: true, unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 6) },
      { k: 'D', label: 'Profundidad del pozo <i>D</i><sub>e</sub> (CO: 11.226 eV)', min: 0.5, max: 15, value: 11.226, log: true, unit: 'eV', fmt: (v) => EM.sci(v, 5) },
      { k: 'v', label: 'Número vibracional <i>v</i>', min: 0, max: 40, value: 0, fmt: (v) => EM.sci(v, 3), step: 1 }
    ],
    outs: [
      { k: 'wx', label: 'Constante de anarmonicidad ω<sub>e</sub><i>x</i><sub>e</sub> = ω<sub>e</sub>²/(4<i>D</i><sub>e</sub>)', short: 'ωe·xe', f: (p) => mo(p).wx, unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'Ev', label: 'Energía del nivel <i>E</i><sub>v</sub> = ω<sub>e</sub>(<i>v</i> + ½) − ω<sub>e</sub><i>x</i><sub>e</sub>(<i>v</i> + ½)² (desde el fondo)', short: 'E_v', f: (p) => p.w * (p.v + 0.5) - mo(p).wx * Math.pow(p.v + 0.5, 2), unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 8) },
      { k: 'n01', label: 'Fundamental 0 → 1: ω<sub>e</sub> − 2ω<sub>e</sub><i>x</i><sub>e</sub>', short: 'ν̃(0→1)', f: (p) => p.w - 2 * mo(p).wx, unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 8) },
      { k: 'n02', label: 'Primer sobretono 0 → 2: 2ω<sub>e</sub> − 6ω<sub>e</sub><i>x</i><sub>e</sub>', short: 'ν̃(0→2)', f: (p) => 2 * p.w - 6 * mo(p).wx, unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 8) },
      { k: 'vm', label: 'Último nivel ligado: parte entera de ω<sub>e</sub>/(2ω<sub>e</sub><i>x</i><sub>e</sub>) − ½', short: 'v_máx', f: (p) => Math.floor(p.w / (2 * mo(p).wx) - 0.5), fmt: (v) => EM.sci(v, 4) }
    ]
  });

  /* ---- Rotor rígido ---- */
  const ro = (p) => {
    const I = p.mu * AMU * Math.pow(p.r * 1e-10, 2);
    const B = H / (8 * PI * PI * C * I) / 100;
    return { I, B };
  };
  EM.formula('rotor', {
    gx: 'J',
    params: [
      { k: 'mu', label: 'Masa reducida μ (¹²C¹⁶O: 6.8562 u)', min: 0.4, max: 50, value: 6.856208634, log: true, unit: 'u', fmt: (v) => EM.sci(v, 7) },
      { k: 'r', label: 'Longitud de enlace <i>r</i> (CO: 1.1283 Å)', min: 0.5, max: 3, value: 1.1283, unit: 'Å', fmt: (v) => EM.sci(v, 5) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 10, max: 2000, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'J', label: 'Número rotacional <i>J</i>', min: 0, max: 40, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 }
    ],
    outs: [
      { k: 'B', label: 'Constante rotacional <i>B</i> = ħ/(4π<i>cI</i>), con <i>I</i> = μ<i>r</i>²', short: 'B', f: (p) => ro(p).B, unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'f', label: 'Frecuencia de la línea <i>J</i> → <i>J</i> + 1: 2<i>cB</i>(<i>J</i> + 1)', short: 'f(J→J+1)', f: (p) => 2 * ro(p).B * 100 * C * (p.J + 1) * 1e-9, unit: 'GHz', fmt: (v) => EM.sci(v, 7) },
      { k: 'EJ', label: 'Energía del nivel <i>E</i><sub>J</sub> = <i>hcB J</i>(<i>J</i> + 1)', short: 'E_J', f: (p) => H * C * 100 * ro(p).B * p.J * (p.J + 1) / QE * 1e3, unit: 'meV', fmt: (v) => EM.sci(v, 7) },
      { k: 'Jm', label: 'Nivel más poblado: √(<i>kT</i>/2<i>hcB</i>) − ½', short: 'J más poblado', f: (p) => Math.sqrt(KB * p.T / (H * C * 100) / (2 * ro(p).B)) - 0.5, fmt: (v) => EM.sci(v, 6) },
      { k: 'P', label: 'Población relativa a <i>J</i> = 0: (2<i>J</i> + 1) e<sup>−<i>E</i>J/<i>kT</i></sup>', short: 'N_J/N_0', f: (p) => (2 * p.J + 1) * Math.exp(-H * C * 100 * ro(p).B * p.J * (p.J + 1) / (KB * p.T)), fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Banda de rotovibración ---- */
  EM.formula('rotovib', {
    gx: 'J',
    params: [
      { k: 'n0', label: 'Origen de la banda ν̃₀ (H³⁵Cl: 2885.98 cm⁻¹)', min: 100, max: 5000, value: 2885.98, log: true, unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 7) },
      { k: 'B', label: 'Constante rotacional <i>B</i> (H³⁵Cl: 10.5934 cm⁻¹)', min: 0.1, max: 70, value: 10.5934, log: true, unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 6) },
      { k: 'J', label: 'Número rotacional inicial <i>J</i>', min: 0, max: 20, value: 0, fmt: (v) => EM.sci(v, 3), step: 1 }
    ],
    outs: [
      { k: 'R', label: 'Rama R: ν̃<sub>R</sub>(<i>J</i>) = ν̃₀ + 2<i>B</i>(<i>J</i> + 1)', short: 'ν̃_R(J)', f: (p) => p.n0 + 2 * p.B * (p.J + 1), unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'P', label: 'Rama P: ν̃<sub>P</sub>(<i>J</i>) = ν̃₀ − 2<i>B J</i>', short: 'ν̃_P(J)', f: (p) => p.n0 - 2 * p.B * p.J, unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 8) },
      { k: 'sp', label: 'Espaciamiento de las líneas 2<i>B</i>', short: '2B', f: (p) => 2 * p.B, unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 7) },
      { k: 'gap', label: 'Hueco central entre P(1) y R(0): 4<i>B</i>', short: 'hueco', f: (p) => 4 * p.B, unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Efecto isotópico en la vibración ---- */
  EM.formula('isotopo', {
    gx: 'm2',
    params: [
      { k: 'n1', label: 'Frecuencia de la molécula de referencia ν̃ (H³⁵Cl: 2885.98 cm⁻¹)', min: 100, max: 5000, value: 2885.98, log: true, unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 7) },
      { k: 'm1', label: 'Masa reducida de referencia μ (H³⁵Cl: 0.979593 u)', min: 0.3, max: 30, value: 0.9795925373, log: true, unit: 'u', fmt: (v) => EM.sci(v, 7) },
      { k: 'm2', label: 'Masa reducida del isotopólogo μ′ (H³⁷Cl: 0.981077 u)', min: 0.3, max: 30, value: 0.9810772927, log: true, unit: 'u', fmt: (v) => EM.sci(v, 7) }
    ],
    outs: [
      { k: 'n2', label: 'Frecuencia del isotopólogo ν̃′ = ν̃ √(μ/μ′)', short: 'ν̃′', f: (p) => p.n1 * Math.sqrt(p.m1 / p.m2), unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'sh', label: 'Corrimiento ν̃′ − ν̃', short: 'corrimiento', f: (p) => p.n1 * (Math.sqrt(p.m1 / p.m2) - 1), unit: 'cm⁻¹', fmt: (v) => EM.sci(v, 7) },
      { k: 'r', label: 'Cociente de frecuencias ν̃/ν̃′ = √(μ′/μ)', short: 'ν̃/ν̃′', f: (p) => Math.sqrt(p.m2 / p.m1), fmt: (v) => EM.sci(v, 8) },
      { k: 'Br', label: 'Cociente de las constantes rotacionales <i>B</i>′/<i>B</i> = μ/μ′', short: 'B′/B', f: (p) => p.m1 / p.m2, fmt: (v) => EM.sci(v, 8) }
    ]
  });
})();
