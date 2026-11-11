/* Capítulo 37 — Partículas elementales */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, ALPHA = 7.2973525693e-3, HBAR_GEVS = 6.582119569e-25, GNB = 0.3893794e6; /* (ħc)² en nb·GeV² */

  /* ---- Energía umbral de producción ---- */
  const um = (p) => { const T = (p.M * p.M - Math.pow(p.m1 + p.m2, 2)) / (2 * p.m2); const E1 = T + p.m1, pl = Math.sqrt(Math.max(E1 * E1 - p.m1 * p.m1, 0)); const s = Math.pow(p.m1 + p.m2, 2) + 2 * p.m2 * T; return { T, E1, pl, s }; };
  EM.formula('part-umbral', {
    gx: 'M',
    params: [
      { k: 'm1', label: 'Masa del proyectil <i>m</i>₁ (protón: 0.938272)', min: 0.0001, max: 100, value: 0.938272088, log: true, unit: 'GeV', fmt: (v) => EM.sci(v, 7) },
      { k: 'm2', label: 'Masa del blanco en reposo <i>m</i>₂', min: 0.0001, max: 100, value: 0.938272088, log: true, unit: 'GeV', fmt: (v) => EM.sci(v, 7) },
      { k: 'M', label: 'Masa total de los productos ∑<i>M</i>f (pp → ppp p̄: 3.753088 GeV)', min: 0.0002, max: 400, value: 3.753088352, log: true, unit: 'GeV', fmt: (v) => EM.sci(v, 7) }
    ],
    outs: [
      { k: 'T', label: 'Energía cinética umbral del proyectil <i>T</i> = [(∑<i>M</i>f)² − (<i>m</i>₁ + <i>m</i>₂)²]/(2<i>m</i>₂)', short: 'T_umbral', f: (p) => um(p).T, unit: 'GeV', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'pl', label: 'Cantidad de movimiento del proyectil en el umbral', short: 'p_lab', f: (p) => um(p).pl, unit: 'GeV/c', fmt: (v) => EM.sci(v, 8) },
      { k: 'rs', label: 'Energía en el centro de masa √<i>s</i> (= ∑<i>M</i>f en el umbral)', short: '√s', f: (p) => Math.sqrt(um(p).s), unit: 'GeV', fmt: (v) => EM.sci(v, 8) },
      { k: 'ef', label: 'Fracción de la energía cinética que se convierte en masa: ((∑<i>M</i>f) − <i>m</i>₁ − <i>m</i>₂)/<i>T</i>', short: 'aprovechada', f: (p) => (p.M - p.m1 - p.m2) / um(p).T, fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Desintegración en dos cuerpos ---- */
  const dc = (p) => { const q = Math.sqrt(Math.max((p.M * p.M - Math.pow(p.m1 + p.m2, 2)) * (p.M * p.M - Math.pow(p.m1 - p.m2, 2)), 0)) / (2 * p.M); const E1 = Math.sqrt(q * q + p.m1 * p.m1); return { q, E1 }; };
  EM.formula('part-dos-cuerpos', {
    gx: 'M',
    params: [
      { k: 'M', label: 'Masa de la partícula que se desintegra <i>M</i> (π⁺: 139.570 MeV)', min: 1, max: 100000, value: 139.57039, log: true, unit: 'MeV', fmt: (v) => EM.sci(v, 8) },
      { k: 'm1', label: 'Masa del primer producto <i>m</i>₁ (μ⁺: 105.658 MeV)', min: 0.0001, max: 40000, value: 105.6583755, log: true, unit: 'MeV', fmt: (v) => EM.sci(v, 8) },
      { k: 'm2', label: 'Masa del segundo producto <i>m</i>₂ (ν: 0)', min: 0, max: 40000, value: 0, fmt: (v) => EM.sci(v, 8), unit: 'MeV' }
    ],
    outs: [
      { k: 'q', label: 'Cantidad de movimiento común <i>p</i>* = √{[<i>M</i>² − (<i>m</i>₁ + <i>m</i>₂)²][<i>M</i>² − (<i>m</i>₁ − <i>m</i>₂)²]}/(2<i>M</i>)', short: 'p*', f: (p) => dc(p).q, unit: 'MeV/c', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'E1', label: 'Energía del primer producto <i>E</i>₁ = (<i>M</i>² + <i>m</i>₁² − <i>m</i>₂²)/(2<i>M</i>)', short: 'E₁', f: (p) => (p.M * p.M + p.m1 * p.m1 - p.m2 * p.m2) / (2 * p.M), unit: 'MeV', fmt: (v) => EM.sci(v, 8) },
      { k: 'T1', label: 'Energía cinética del primer producto <i>E</i>₁ − <i>m</i>₁', short: 'T₁', f: (p) => (p.M * p.M + p.m1 * p.m1 - p.m2 * p.m2) / (2 * p.M) - p.m1, unit: 'MeV', fmt: (v) => EM.sci(v, 8) },
      { k: 'b1', label: 'Velocidad del primer producto β₁ = <i>p</i>*/<i>E</i>₁', short: 'β₁', f: (p) => dc(p).q / dc(p).E1, fmt: (v) => EM.sci(v, 8) }
    ]
  });

  /* ---- Breit–Wigner ---- */
  EM.formula('part-bw', {
    gx: 'E',
    params: [
      { k: 'M', label: 'Masa de la resonancia <i>M</i> (Z: 91.1876 GeV)', min: 0.5, max: 200, value: 91.1876, log: true, unit: 'GeV', fmt: (v) => EM.sci(v, 7) },
      { k: 'G', label: 'Anchura total Γ (Z: 2.4952 GeV)', min: 0.0001, max: 50, value: 2.4952, log: true, unit: 'GeV', fmt: (v) => EM.sci(v, 6) },
      { k: 'Ge', label: 'Anchura parcial a e⁺e⁻ Γ<sub>ee</sub> (Z: 0.08398 GeV)', min: 1e-6, max: 5, value: 0.08398, log: true, unit: 'GeV', fmt: (v) => EM.sci(v, 5) },
      { k: 'Gf', label: 'Anchura parcial al estado final Γ<sub>f</sub> (hadrones: 1.7444 GeV)', min: 1e-6, max: 50, value: 1.7444, log: true, unit: 'GeV', fmt: (v) => EM.sci(v, 5) },
      { k: 'E', label: 'Energía en el centro de masa √<i>s</i>', min: 0.5, max: 200, value: 91.1876, log: true, unit: 'GeV', fmt: (v) => EM.sci(v, 8) }
    ],
    outs: [
      { k: 'sig', label: 'Sección eficaz σ(√<i>s</i>) = (3π/<i>s</i>) Γ<sub>ee</sub>Γ<sub>f</sub> /[(√<i>s</i> − <i>M</i>)² + Γ²/4]', short: 'σ', f: (p) => 3 * PI / (p.E * p.E) * p.Ge * p.Gf / (Math.pow(p.E - p.M, 2) + p.G * p.G / 4) * GNB, unit: 'nb', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'pk', label: 'Valor en el pico σ₀ = (12π/<i>M</i>²) Γ<sub>ee</sub>Γ<sub>f</sub>/Γ²', short: 'σ_pico', f: (p) => 12 * PI / (p.M * p.M) * p.Ge * p.Gf / (p.G * p.G) * GNB, unit: 'nb', fmt: (v) => EM.sci(v, 7) },
      { k: 'tau', label: 'Vida media τ = ħ/Γ', short: 'τ', f: (p) => HBAR_GEVS / p.G * 1e25, unit: '10⁻²⁵ s', fmt: (v) => EM.sci(v, 7) },
      { k: 'qq', label: 'Anchura relativa Γ/<i>M</i>', short: 'Γ/M', f: (p) => p.G / p.M, fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Razón R ---- */
  const rr = (p) => {
    const q = [2 / 3, -1 / 3, -1 / 3, 2 / 3, -1 / 3];
    const nf = 3 + (p.rs > 2 * 1.27 ? 1 : 0) + (p.rs > 2 * 4.18 ? 1 : 0);
    let s = 0; for (let i = 0; i < nf; i++) s += q[i] * q[i];
    return { nf, R0: p.Nc * s };
  };
  EM.formula('part-R', {
    gx: 'rs',
    params: [
      { k: 'rs', label: 'Energía del haz √<i>s</i>', min: 1, max: 100, value: 12, log: true, unit: 'GeV', fmt: (v) => EM.sci(v, 5) },
      { k: 'Nc', label: 'Número de colores <i>N</i><sub>c</sub> (3 en la naturaleza)', min: 1, max: 6, value: 3, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'as', label: 'Constante de acoplamiento fuerte α<sub>s</sub> (≈ 0.2–0.3)', min: 0, max: 0.5, value: 0.2, fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'smm', label: 'Sección eficaz e⁺e⁻ → μ⁺μ⁻: σ = 4πα²/(3<i>s</i>)', short: 'σ(μμ)', f: (p) => 4 * PI * ALPHA * ALPHA / 3 / (p.rs * p.rs) * GNB, unit: 'nb', fmt: (v) => EM.sci(v, 7) },
      { k: 'nf', label: 'Sabores accesibles (u, d, s; c si √<i>s</i> > 2.54 GeV; b si √<i>s</i> > 8.36 GeV)', short: 'n_f', f: (p) => rr(p).nf, fmt: (v) => EM.sci(v, 3) },
      { k: 'R0', label: '<i>R</i> = <i>N</i><sub>c</sub>∑<i>Q</i><sub>f</sub>² (sin correcciones)', short: 'R', f: (p) => rr(p).R0, fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'R1', label: '<i>R</i> con la corrección QCD (1 + α<sub>s</sub>/π)', short: 'R (QCD)', f: (p) => rr(p).R0 * (1 + p.as / PI), fmt: (v) => EM.sci(v, 7) },
      { k: 'sh', label: 'Sección eficaz a hadrones σ = <i>R</i> σ(μμ) (QCD incluida)', short: 'σ(hadrones)', f: (p) => rr(p).R0 * (1 + p.as / PI) * 4 * PI * ALPHA * ALPHA / 3 / (p.rs * p.rs) * GNB, unit: 'nb', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Oscilaciones de neutrinos ---- */
  EM.formula('part-neutrino', {
    gx: 'L',
    params: [
      { k: 's2', label: 'Mezcla sen²2θ (atmosférico: ≈ 1; solar: ≈ 0.85)', min: 0.01, max: 1, value: 1, log: true, fmt: (v) => EM.sci(v, 4) },
      { k: 'dm', label: 'Diferencia de masas cuadradas Δ<i>m</i>² (atmosférico: 2.5×10⁻³ eV²; solar: 7.5×10⁻⁵)', min: 1e-5, max: 1e-1, value: 2.5e-3, log: true, unit: 'eV²', fmt: (v) => EM.sci(v, 4) },
      { k: 'L', label: 'Distancia recorrida <i>L</i>', min: 0.1, max: 13000, value: 500, log: true, unit: 'km', fmt: (v) => EM.sci(v, 5) },
      { k: 'E', label: 'Energía del neutrino <i>E</i>', min: 0.001, max: 100, value: 1, log: true, unit: 'GeV', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'P', label: 'Probabilidad de cambio de sabor <i>P</i> = sen²2θ sen²(1.26693 Δ<i>m</i>² <i>L</i>/<i>E</i>)', short: 'P(νa→νb)', f: (p) => p.s2 * Math.pow(Math.sin(1.266932679 * p.dm * p.L / p.E), 2), fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'ph', label: 'Fase 1.26693 Δ<i>m</i>² <i>L</i>/<i>E</i>', short: 'fase', f: (p) => 1.266932679 * p.dm * p.L / p.E, unit: 'rad', fmt: (v) => EM.sci(v, 8) },
      { k: 'Lo', label: 'Longitud de oscilación <i>L</i><sub>osc</sub> = π<i>E</i>/(1.26693 Δ<i>m</i>²) (en que la fase avanza π)', short: 'L_osc', f: (p) => PI * p.E / (1.266932679 * p.dm), unit: 'km', fmt: (v) => EM.sci(v, 7) },
      { k: 'Lm', label: 'Primer máximo de oscilación <i>L</i> = π<i>E</i>/(2·1.26693 Δ<i>m</i>²)', short: 'L (1.er máx.)', f: (p) => PI * p.E / (2 * 1.266932679 * p.dm), unit: 'km', fmt: (v) => EM.sci(v, 7) }
    ]
  });
})();
