/* Capítulo 31 — El átomo de hidrógeno, el espín y los átomos */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, H = 6.62607015e-34, C = 299792458, QE = 1.602176634e-19, A0 = 5.29177210903e-11, ALPHA = 7.2973525693e-3, MUB = 9.2740100783e-24, EH = 13.605693123, RINF = 10973731.568160;

  EM.formula('hidrogeno', {
    gx: 'n',
    params: [
      { k: 'Z', label: 'Número atómico del ion hidrogenoide <i>Z</i>', min: 1, max: 10, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'n', label: 'Número cuántico principal <i>n</i>', min: 1, max: 10, value: 2, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'l', label: 'Número cuántico orbital <i>l</i> (0 ≤ <i>l</i> ≤ <i>n</i> − 1)', min: 0, max: 9, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 }
    ],
    outs: [
      { k: 'E', label: 'Energía <i>E</i><sub>n</sub> = −13.6057 <i>Z</i>²/<i>n</i>²', short: 'E_n', f: (p) => -EH * p.Z * p.Z / (p.n * p.n), unit: 'eV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'r', label: 'Radio medio ⟨<i>r</i>⟩ = (<i>a</i>₀/2<i>Z</i>)[3<i>n</i>² − <i>l</i>(<i>l</i> + 1)]', short: '⟨r⟩', f: (p) => A0 / (2 * p.Z) * (3 * p.n * p.n - p.l * (p.l + 1)) * 1e12, unit: 'pm', fmt: (v) => EM.sci(v, 7) },
      { k: 'rc', label: 'Radio de la órbita circular (<i>l</i> = <i>n</i> − 1): <i>n</i>²<i>a</i>₀/<i>Z</i>', short: 'r (circular)', f: (p) => p.n * p.n * A0 / p.Z * 1e12, unit: 'pm', fmt: (v) => EM.sci(v, 7) },
      { k: 'g', label: 'Degeneración con espín 2<i>n</i>²', short: 'degeneración', f: (p) => 2 * p.n * p.n, fmt: (v) => EM.sci(v, 4) }
    ]
  });

  EM.formula('zeeman', {
    gx: 'B',
    params: [
      { k: 'l', label: 'Número cuántico orbital <i>l</i>', min: 1, max: 10, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'B', label: 'Campo magnético <i>B</i>', min: 0.1, max: 50, value: 1, log: true, unit: 'T', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'L', label: 'Módulo del momento angular |<b>L</b>|/ħ = √[<i>l</i>(<i>l</i> + 1)]', short: '|L|/ħ', f: (p) => Math.sqrt(p.l * (p.l + 1)), fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'th', label: 'Ángulo mínimo con el eje <i>z</i>: arccos[<i>l</i>/√(<i>l</i>(<i>l</i> + 1))]', short: 'ángulo mínimo', f: (p) => Math.acos(p.l / Math.sqrt(p.l * (p.l + 1))) * 180 / PI, unit: '°', fmt: (v) => EM.sci(v, 6) },
      { k: 'dE', label: 'Separación Zeeman entre subniveles contiguos μ<sub>B</sub><i>B</i>', short: 'ΔE Zeeman', f: (p) => MUB * p.B / QE * 1e6, unit: 'µeV', fmt: (v) => EM.sci(v, 7) },
      { k: 'f', label: 'Frecuencia de Larmor μ<sub>B</sub><i>B</i>/<i>h</i>', short: 'f de Larmor', f: (p) => MUB * p.B / H * 1e-9, unit: 'GHz', fmt: (v) => EM.sci(v, 7) },
      { k: 'g', label: 'Degeneración 2<i>l</i> + 1', short: '2l + 1', f: (p) => 2 * p.l + 1, fmt: (v) => EM.sci(v, 3) }
    ]
  });

  EM.formula('estructura-fina', {
    gx: 'n',
    params: [
      { k: 'n', label: 'Número cuántico principal <i>n</i>', min: 1, max: 6, value: 2, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'j', label: 'Momento angular total <i>j</i> (½, 3/2, …, <i>n</i> − ½)', min: 0.5, max: 5.5, value: 0.5, fmt: (v) => EM.sci(v, 3), step: 1 }
    ],
    outs: [
      { k: 'd', label: 'Corrección de estructura fina δ<i>E</i> = −(13.6057 α²/<i>n</i>³)[1/(<i>j</i> + ½) − 3/(4<i>n</i>)]', short: 'δE', f: (p) => -(EH * ALPHA * ALPHA / Math.pow(p.n, 3)) * (1 / (p.j + 0.5) - 3 / (4 * p.n)) * 1e6, unit: 'µeV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'E', label: 'Energía total <i>E</i><sub>nj</sub> = −13.6057/<i>n</i>² + δ<i>E</i>', short: 'E_nj', f: (p) => -EH / (p.n * p.n) - (EH * ALPHA * ALPHA / Math.pow(p.n, 3)) * (1 / (p.j + 0.5) - 3 / (4 * p.n)), unit: 'eV', fmt: (v) => EM.sci(v, 9) },
      { k: 'f', label: 'La misma corrección en frecuencia δ<i>E</i>/<i>h</i>', short: 'δE/h', f: (p) => -(EH * ALPHA * ALPHA / Math.pow(p.n, 3)) * (1 / (p.j + 0.5) - 3 / (4 * p.n)) * QE / H * 1e-9, unit: 'GHz', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  EM.formula('moseley', {
    gx: 'Z',
    params: [
      { k: 'Z', label: 'Número atómico del ánodo <i>Z</i>', min: 11, max: 92, value: 29, log: true, step: 1, fmt: (v) => EM.sci(v, 3) },
      { k: 's', label: 'Constante de apantallamiento σ (≈ 1 para la línea Kα)', min: 0.5, max: 2, value: 1, fmt: (v) => EM.sci(v, 3), step: 0.01 }
    ],
    outs: [
      { k: 'E', label: 'Energía de la línea Kα = (3/4)(13.6057 eV)(<i>Z</i> − σ)²', short: 'E(Kα)', f: (p) => 0.75 * EH * Math.pow(p.Z - p.s, 2) * 1e-3, unit: 'keV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'lam', label: 'Longitud de onda <i>hc</i>/<i>E</i>', short: 'λ', f: (p) => H * C / (0.75 * EH * Math.pow(p.Z - p.s, 2) * QE) * 1e12, unit: 'pm', fmt: (v) => EM.sci(v, 7) },
      { k: 'nu', label: 'Raíz de la frecuencia √ν = √(<i>E</i>/<i>h</i>) (proporcional a <i>Z</i> − σ)', short: '√ν', f: (p) => Math.sqrt(0.75 * EH * Math.pow(p.Z - p.s, 2) * QE / H) * 1e-6, unit: '10⁶ √Hz', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  const ex = (p) => ({ mu: p.m1 * p.m2 / (p.m1 + p.m2) });
  EM.formula('exoticos', {
    gx: 'm2',
    params: [
      { k: 'm1', label: 'Masa de la partícula ligera (e⁻: 1; μ⁻: 206.768) en unidades de <i>m</i><sub>e</sub>', min: 1, max: 3000, value: 1, log: true, fmt: (v) => EM.sci(v, 7) },
      { k: 'm2', label: 'Masa de la partícula central (e⁺: 1; p: 1836.15; μ⁺: 206.768)', min: 1, max: 1e9, value: 1, log: true, fmt: (v) => EM.sci(v, 7) },
      { k: 'n', label: 'Nivel <i>n</i>', min: 1, max: 6, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 }
    ],
    outs: [
      { k: 'mu', label: 'Masa reducida μ = <i>m</i>₁<i>m</i>₂/(<i>m</i>₁ + <i>m</i>₂)', short: 'μ', f: (p) => ex(p).mu, unit: 'm_e', fmt: (v) => EM.sci(v, 9) },
      { k: 'E', label: 'Energía <i>E</i><sub>n</sub> = −13.6057 (μ/<i>m</i><sub>e</sub>)/<i>n</i>²', short: 'E_n', f: (p) => -EH * ex(p).mu / (p.n * p.n), unit: 'eV', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'a', label: 'Radio de Bohr del sistema <i>a</i>₀ (<i>m</i><sub>e</sub>/μ)', short: 'a', f: (p) => A0 / ex(p).mu * 1e12, unit: 'pm', fmt: (v) => EM.sci(v, 8) },
      { k: 'lam', label: 'Línea Lyman α (2 → 1): 4/(3<i>R</i><sub>∞</sub>μ)', short: 'λ(Lα)', f: (p) => 1 / (RINF * ex(p).mu * 0.75) * 1e9, unit: 'nm', fmt: (v) => EM.sci(v, 8) }
    ]
  });
})();
