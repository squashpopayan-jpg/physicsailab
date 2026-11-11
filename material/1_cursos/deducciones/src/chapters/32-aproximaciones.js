/* Capítulo 32 — Métodos de aproximación en mecánica cuántica */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, H = 6.62607015e-34, HB = H / (2 * PI), C = 299792458, QE = 1.602176634e-19, A0 = 5.29177210903e-11, ALPHA = 7.2973525693e-3, EH = 13.605693123, EPS0 = 8.8541878128e-12, AMU = 1.66053906660e-27;

  /* ---- WKB: neutrón (o átomo) rebotando sobre un espejo en un campo gravitatorio ---- */
  const AIRY = [2.338107410459767, 4.08794944413097, 5.520559828095551, 6.786708090071759, 7.944133587120853, 9.02265085334098, 10.040174341558085, 11.008524303733262, 11.936015563236262, 12.828776752865757, 13.691489035210719, 14.527829951775335, 15.340755135977997, 16.132685156945772, 16.90563399742994, 17.66130010569706, 18.401132599207116, 19.126380474246954, 19.8381298917215, 20.537332907677566];
  const wk = (p) => {
    const m = p.M * AMU, g = p.g, Es = Math.cbrt(m * g * g * HB * HB / 2);
    const t = 3 * PI * (4 * p.n - 1) / 8;
    const wkb = Math.pow(t, 2 / 3);
    const airy = AIRY[Math.max(0, Math.min(19, Math.round(p.n) - 1))];
    return { m, Es, wkb, airy, l0: Math.cbrt(HB * HB / (2 * m * m * g)) };
  };
  EM.formula('wkb', {
    gx: 'n',
    params: [
      { k: 'M', label: 'Masa de la partícula (neutrón: 1.00866 u)', min: 0.1, max: 200, value: 1.00866491595, log: true, unit: 'u', fmt: (v) => EM.sci(v, 7) },
      { k: 'g', label: 'Aceleración de la gravedad <i>g</i>', min: 1, max: 30, value: 9.80665, log: true, unit: 'm/s²', fmt: (v) => EM.sci(v, 6) },
      { k: 'n', label: 'Número del nivel <i>n</i> (1, 2, …)', min: 1, max: 20, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 }
    ],
    outs: [
      { k: 'E', label: 'Energía WKB <i>E</i><sub>n</sub> = [3π(<i>n</i> − ¼)/2]<sup>2/3</sup> (<i>mg</i>²ħ²/2)<sup>1/3</sup>', short: 'E_n (WKB)', f: (p) => { const w = wk(p); return w.wkb * w.Es / QE * 1e12; }, unit: 'peV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'Ex', label: 'Energía exacta (cero de la función de Airy −<i>a</i><sub>n</sub>)', short: 'E_n (Airy)', f: (p) => { const w = wk(p); return w.airy * w.Es / QE * 1e12; }, unit: 'peV', fmt: (v) => EM.sci(v, 7) },
      { k: 'z', label: 'Altura del punto de retorno <i>z</i><sub>n</sub> = <i>E</i><sub>n</sub>/(<i>mg</i>)', short: 'z_n', f: (p) => { const w = wk(p); return w.wkb * w.Es / (w.m * p.g) * 1e6; }, unit: 'µm', fmt: (v) => EM.sci(v, 7) },
      { k: 'l0', label: 'Longitud característica <i>l</i><sub>0</sub> = (ħ²/2<i>m</i>²<i>g</i>)<sup>1/3</sup>', short: 'l₀', f: (p) => wk(p).l0 * 1e6, unit: 'µm', fmt: (v) => EM.sci(v, 7) },
      { k: 'err', label: 'Error relativo de WKB', short: 'error WKB', f: (p) => { const w = wk(p); return (w.wkb / w.airy - 1) * 100; }, unit: '%', fmt: (v) => EM.sci(v, 4) }
    ]
  });

  /* ---- Stark cuadrático del estado fundamental de un ion hidrogenoide ---- */
  EM.formula('stark-cuad', {
    gx: 'F',
    params: [
      { k: 'Z', label: 'Número atómico del ion hidrogenoide <i>Z</i>', min: 1, max: 10, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'F', label: 'Campo eléctrico <i>F</i>', min: 0.1, max: 1e5, value: 10, log: true, unit: 'MV/m', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'al', label: 'Polarizabilidad (volumen) α/(4πε₀) = (9/2) <i>a</i>₀³/<i>Z</i>⁴', short: 'α/4πε₀', f: (p) => 4.5 * Math.pow(A0, 3) / Math.pow(p.Z, 4) * 1e30, unit: 'Å³', fmt: (v) => EM.sci(v, 7) },
      { k: 'dE', label: 'Corrimiento de la energía Δ<i>E</i> = −½ α<i>F</i>²', short: 'ΔE', f: (p) => -0.5 * 4.5 * 4 * PI * EPS0 * Math.pow(A0, 3) / Math.pow(p.Z, 4) * Math.pow(p.F * 1e6, 2) / QE * 1e6, unit: 'µeV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'df', label: 'El mismo corrimiento en frecuencia Δ<i>E</i>/<i>h</i>', short: 'ΔE/h', f: (p) => -0.5 * 4.5 * 4 * PI * EPS0 * Math.pow(A0, 3) / Math.pow(p.Z, 4) * Math.pow(p.F * 1e6, 2) / H * 1e-6, unit: 'MHz', fmt: (v) => EM.sci(v, 7) },
      { k: 'pd', label: 'Momento dipolar inducido <i>p</i> = α<i>F</i> (en <i>e a</i>₀)', short: 'p inducido', f: (p) => 4.5 * 4 * PI * EPS0 * Math.pow(A0, 3) / Math.pow(p.Z, 4) * p.F * 1e6 / (QE * A0), unit: 'e·a₀', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Oscilador anarmónico: V = ½ k x² + β x⁴, ε = β x₀⁴/(ħω) ---- */
  EM.formula('anarmonico', {
    gx: 'e',
    params: [
      { k: 'n', label: 'Nivel del oscilador <i>n</i>', min: 0, max: 10, value: 0, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'e', label: 'Parámetro de anarmonicidad ε = β<i>x</i>₀⁴/(ħω)', min: 0.0001, max: 0.2, value: 0.05, log: true, fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'E1', label: 'Energía a 1.er orden <i>E</i>/ħω = <i>n</i> + ½ + (ε/4)(6<i>n</i>² + 6<i>n</i> + 3)', short: 'E/ħω (1.er orden)', f: (p) => p.n + 0.5 + p.e / 4 * (6 * p.n * p.n + 6 * p.n + 3), fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'E2', label: 'Energía a 2.º orden: − ε²(34<i>n</i>³ + 51<i>n</i>² + 59<i>n</i> + 21)/8 añadido', short: 'E/ħω (2.º orden)', f: (p) => p.n + 0.5 + p.e / 4 * (6 * p.n * p.n + 6 * p.n + 3) - p.e * p.e * (34 * Math.pow(p.n, 3) + 51 * p.n * p.n + 59 * p.n + 21) / 8, fmt: (v) => EM.sci(v, 8) },
      { k: 'sp', label: 'Separación entre niveles contiguos (1.er orden) 1 + 3ε(<i>n</i> + 1)', short: 'separación', f: (p) => 1 + 3 * p.e * (p.n + 1), fmt: (v) => EM.sci(v, 8) },
      { k: 'sh', label: 'Corrimiento de 1.er orden respecto al armónico', short: 'ΔE/ħω', f: (p) => p.e / 4 * (6 * p.n * p.n + 6 * p.n + 3), fmt: (v) => EM.sci(v, 8) }
    ]
  });

  /* ---- Stark lineal del hidrógeno (variables parabólicas) ---- */
  EM.formula('stark-lineal', {
    gx: 'F',
    params: [
      { k: 'n', label: 'Número cuántico principal <i>n</i>', min: 2, max: 10, value: 2, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'q', label: 'Número parabólico <i>q</i> = <i>n</i>₁ − <i>n</i>₂ (|<i>q</i>| ≤ <i>n</i> − 1)', min: -9, max: 9, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'F', label: 'Campo eléctrico <i>F</i>', min: 0.1, max: 1e4, value: 10, log: true, unit: 'MV/m', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'dE', label: 'Corrimiento lineal Δ<i>E</i> = (3/2) <i>n q e a</i>₀ <i>F</i>', short: 'ΔE', f: (p) => 1.5 * p.n * p.q * QE * A0 * p.F * 1e6 / QE * 1e6, unit: 'µeV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'df', label: 'El mismo corrimiento en frecuencia', short: 'ΔE/h', f: (p) => 1.5 * p.n * p.q * QE * A0 * p.F * 1e6 / H * 1e-9, unit: 'GHz', fmt: (v) => EM.sci(v, 7) },
      { k: 'pd', label: 'Dipolo eléctrico permanente del estado (3/2) <i>n q</i>', short: 'p', f: (p) => 1.5 * p.n * p.q * 2.541746473, unit: 'D', fmt: (v) => EM.sci(v, 7) },
      { k: 'w', label: 'Anchura total del multiplete 3<i>n</i>(<i>n</i> − 1) <i>e a</i>₀ <i>F</i>', short: 'anchura', f: (p) => 3 * p.n * (p.n - 1) * A0 * p.F * 1e6 * 1e6, unit: 'µeV', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Método variacional: átomo con dos electrones ---- */
  EM.formula('variacional', {
    gx: 'Z',
    params: [
      { k: 'Z', label: 'Carga del núcleo <i>Z</i> (He: 2; Li⁺: 3; Be²⁺: 4)', min: 2, max: 20, value: 2, log: true, fmt: (v) => EM.sci(v, 3), step: 1 }
    ],
    outs: [
      { k: 'zeta', label: 'Carga efectiva óptima ζ = <i>Z</i> − 5/16', short: 'ζ', f: (p) => p.Z - 5 / 16, fmt: (v) => EM.sci(v, 8) },
      { k: 'E', label: 'Energía variacional <i>E</i> = −2(13.6057 eV) ζ²', short: 'E (variacional)', f: (p) => -2 * EH * Math.pow(p.Z - 5 / 16, 2), unit: 'eV', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'E1', label: 'Energía a primer orden de perturbaciones −2(13.6057 eV)(<i>Z</i>² − 5<i>Z</i>/8)', short: 'E (1.er orden)', f: (p) => -2 * EH * (p.Z * p.Z - 5 * p.Z / 8), unit: 'eV', fmt: (v) => EM.sci(v, 8) },
      { k: 'I', label: 'Energía de ionización estimada: 13.6057 eV (2ζ² − <i>Z</i>²)', short: 'I (variacional)', f: (p) => EH * (2 * Math.pow(p.Z - 5 / 16, 2) - p.Z * p.Z), unit: 'eV', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Emisión espontánea: A = 4αω³|r|²/(3c²) ---- */
  const em = (p) => { const w = p.E * QE / HB; const r = p.r * A0; return { w, A: 4 * ALPHA * w * w * w * r * r / (3 * C * C) }; };
  EM.formula('emision', {
    gx: 'E',
    params: [
      { k: 'E', label: 'Energía del fotón emitido ħω (Lyα con masa infinita: 10.2043 eV)', min: 0.1, max: 1000, value: 10.20426984, log: true, unit: 'eV', fmt: (v) => EM.sci(v, 8) },
      { k: 'r', label: 'Elemento de matriz |⟨f|<b>r</b>|i⟩| (2p → 1s: 0.744936 <i>a</i>₀)', min: 0.01, max: 100, value: 0.7449355390, log: true, unit: 'a₀', fmt: (v) => EM.sci(v, 8) }
    ],
    outs: [
      { k: 'A', label: 'Coeficiente de Einstein <i>A</i> = 4α ω³ |<i>r</i><sub>fi</sub>|²/(3<i>c</i>²)', short: 'A', f: (p) => em(p).A * 1e-8, unit: '10⁸ s⁻¹', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'tau', label: 'Vida media τ = 1/<i>A</i>', short: 'τ', f: (p) => 1 / em(p).A * 1e9, unit: 'ns', fmt: (v) => EM.sci(v, 7) },
      { k: 'dnu', label: 'Anchura natural de la línea Δν = <i>A</i>/(2π)', short: 'Δν natural', f: (p) => em(p).A / (2 * PI) * 1e-6, unit: 'MHz', fmt: (v) => EM.sci(v, 7) },
      { k: 'lam', label: 'Longitud de onda λ = <i>hc</i>/ħω', short: 'λ', f: (p) => H * C / (p.E * QE) * 1e9, unit: 'nm', fmt: (v) => EM.sci(v, 7) }
    ]
  });
})();
