/* Capítulo 36 — Física nuclear */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, ALPHA = 7.2973525693e-3, HBC = 197.3269804, C = 299792458, QE = 1.602176634e-19, KB = 1.380649e-23, UMEV = 931.49410242, YR = 3.15576e7;
  const KE = ALPHA * HBC; /* e²/4πε₀ en MeV·fm */
  const aV = 15.75, aS = 17.8, aC = 0.711, aA = 23.7, aP = 11.18;

  /* ---- Fórmula semiempírica de masa ---- */
  const sm = (p) => {
    const A = Math.round(p.A), Z = Math.round(p.Z), N = A - Z;
    const par = (x) => ((x % 2) + 2) % 2; let d = 0; if (par(Z) === 0 && par(N) === 0) d = aP / Math.sqrt(A); else if (par(Z) === 1 && par(N) === 1) d = -aP / Math.sqrt(A);
    const V = aV * A, S = aS * Math.pow(A, 2 / 3), Cc = aC * Z * (Z - 1) / Math.cbrt(A), As = aA * Math.pow(A - 2 * Z, 2) / A;
    return { A, Z, B: V - S - Cc - As + d, V, S, Cc, As, d };
  };
  EM.formula('nuc-semf', {
    gx: 'A',
    params: [
      { k: 'A', label: 'Número másico <i>A</i>', min: 10, max: 300, value: 56, log: true, fmt: (v) => EM.sci(v, 4), step: 1 },
      { k: 'Z', label: 'Número atómico <i>Z</i> (Fe: 26; Sn: 50; Pb: 82)', min: 5, max: 120, value: 26, log: true, fmt: (v) => EM.sci(v, 4), step: 1 }
    ],
    outs: [
      { k: 'B', label: 'Energía de enlace <i>B</i> = a<sub>V</sub><i>A</i> − a<sub>S</sub><i>A</i><sup>2/3</sup> − a<sub>C</sub><i>Z</i>(<i>Z</i> − 1)/<i>A</i><sup>1/3</sup> − a<sub>A</sub>(<i>A</i> − 2<i>Z</i>)²/<i>A</i> ± δ', short: 'B', f: (p) => sm(p).B, unit: 'MeV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'BA', label: 'Energía de enlace por nucleón <i>B</i>/<i>A</i>', short: 'B/A', f: (p) => sm(p).B / sm(p).A, unit: 'MeV', fmt: (v) => EM.sci(v, 7) },
      { k: 'Zs', label: 'Carga más estable para ese <i>A</i>: (4a<sub>A</sub> + a<sub>C</sub><i>A</i><sup>−1/3</sup>)/(8a<sub>A</sub>/<i>A</i> + 2a<sub>C</sub><i>A</i><sup>−1/3</sup>)', short: 'Z estable', f: (p) => { const A = Math.round(p.A); return (4 * aA + aC * Math.pow(A, -1 / 3)) / (8 * aA / A + 2 * aC * Math.pow(A, -1 / 3)); }, fmt: (v) => EM.sci(v, 7) },
      { k: 'EC', label: 'Término de Coulomb a<sub>C</sub><i>Z</i>(<i>Z</i> − 1)/<i>A</i><sup>1/3</sup>', short: 'E_Coulomb', f: (p) => sm(p).Cc, unit: 'MeV', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Decaimiento radiactivo ---- */
  EM.formula('nuc-decaimiento', {
    gx: 't',
    params: [
      { k: 'th', label: 'Semivida <i>t</i><sub>½</sub> (¹⁴C: 5730 años)', min: 0.001, max: 1e10, value: 5730, log: true, unit: 'años', fmt: (v) => EM.sci(v, 6) },
      { k: 't', label: 'Tiempo transcurrido <i>t</i>', min: 1, max: 1e6, value: 10000, log: true, unit: 'años', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'f', label: 'Fracción que sobrevive <i>N</i>/<i>N</i>₀ = 2<sup>−<i>t</i>/<i>t</i>½</sup>', short: 'N/N₀', f: (p) => Math.pow(2, -p.t / p.th), fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'lam', label: 'Constante de desintegración λ = ln 2/<i>t</i><sub>½</sub>', short: 'λ', f: (p) => Math.LN2 / (p.th * YR) * 1e12, unit: '10⁻¹² s⁻¹', fmt: (v) => EM.sci(v, 8) },
      { k: 'tau', label: 'Vida media τ = <i>t</i><sub>½</sub>/ln 2', short: 'τ', f: (p) => p.th / Math.LN2, unit: 'años', fmt: (v) => EM.sci(v, 8) },
      { k: 'ac', label: 'Actividad relativa <i>A</i>/<i>A</i>₀ = <i>N</i>/<i>N</i>₀ (misma fracción)', short: 'A/A₀', f: (p) => Math.pow(2, -p.t / p.th) * 100, unit: '%', fmt: (v) => EM.sci(v, 8) }
    ]
  });

  /* ---- Dispersión de Rutherford ---- */
  EM.formula('nuc-rutherford', {
    gx: 'th',
    params: [
      { k: 'Z1', label: 'Carga del proyectil <i>Z</i>₁ (α: 2)', min: 1, max: 20, value: 2, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'Z2', label: 'Carga del blanco <i>Z</i>₂ (Au: 79)', min: 1, max: 100, value: 79, log: true, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'E', label: 'Energía cinética del proyectil <i>E</i>', min: 0.5, max: 50, value: 5.5, log: true, unit: 'MeV', fmt: (v) => EM.sci(v, 4) },
      { k: 'th', label: 'Ángulo de dispersión θ', min: 5, max: 175, value: 90, unit: '°', angle: true, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'd', label: 'Distancia de máximo acercamiento (frontal) <i>d</i> = <i>Z</i>₁<i>Z</i>₂<i>e</i>²/(4πε₀<i>E</i>)', short: 'd_mín', f: (p) => p.Z1 * p.Z2 * KE / p.E, unit: 'fm', fmt: (v) => EM.sci(v, 7) },
      { k: 'b', label: 'Parámetro de impacto <i>b</i> = (<i>d</i>/2) cot(θ/2)', short: 'b', f: (p) => p.Z1 * p.Z2 * KE / p.E / 2 / Math.tan(p.th * PI / 360), unit: 'fm', fmt: (v) => EM.sci(v, 7) },
      { k: 'ds', label: 'Sección eficaz diferencial dσ/dΩ = (<i>d</i>/4)²/sen⁴(θ/2)', short: 'dσ/dΩ', f: (p) => Math.pow(p.Z1 * p.Z2 * KE / p.E / 4, 2) / Math.pow(Math.sin(p.th * PI / 360), 4), unit: 'fm²/sr', fmt: (v) => EM.sci(v, 7), hl: true }
    ]
  });

  /* ---- Gamow: desintegración alfa ---- */
  const ga = (p) => {
    const Md = p.Ad * UMEV, mA = 4.001506179 * UMEV, mu = mA * Md / (mA + Md);
    const R = p.R > 0 ? p.R : 1.2 * (Math.cbrt(p.Ad) + Math.cbrt(4));
    const k = 2 * p.Zd * KE, b = k / p.Q, x = R / b;
    const G = Math.sqrt(2 * mu * p.Q) / HBC * b * (Math.acos(Math.sqrt(x)) - Math.sqrt(x * (1 - x)));
    const v = C * Math.sqrt(2 * p.Q / mu), nu = v / (2 * R * 1e-15);
    return { R, b, G2: 2 * G, v, nu, lam: nu * Math.exp(-2 * G) };
  };
  EM.formula('nuc-gamow', {
    gx: 'Q',
    params: [
      { k: 'Zd', label: 'Carga del núcleo hijo <i>Z</i> (Po-212 → Pb: 82; U-238 → Th: 90)', min: 60, max: 100, value: 82, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'Ad', label: 'Número másico del hijo <i>A</i> (Pb-208: 208; Th-234: 234)', min: 140, max: 260, value: 208, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'Q', label: 'Energía liberada <i>Q</i> (Po-212: 8.954 MeV; U-238: 4.270)', min: 3.5, max: 10, value: 8.954, fmt: (v) => EM.sci(v, 5), unit: 'MeV' },
      { k: 'R', label: 'Radio nuclear <i>R</i> (0 = 1.2(<i>A</i><sup>1/3</sup> + 4<sup>1/3</sup>) fm)', min: 0, max: 12, value: 0, fmt: (v) => EM.sci(v, 4), unit: 'fm' }
    ],
    outs: [
      { k: 'G2', label: 'Exponente de Gamow 2<i>G</i> = (2/ħ)∫√[2μ(<i>V</i> − <i>Q</i>)] d<i>r</i>', short: '2G', f: (p) => ga(p).G2, fmt: (v) => EM.sci(v, 7) },
      { k: 'nu', label: 'Frecuencia de intentos ν = <i>v</i>/(2<i>R</i>)', short: 'ν', f: (p) => ga(p).nu, unit: 's⁻¹', fmt: (v) => EM.sci(v, 7) },
      { k: 'lt', label: 'Logaritmo decimal de la semivida log₁₀(ln 2/(ν e<sup>−2G</sup>)), con <i>t</i> en segundos', short: 'log₁₀ t½', f: (p) => Math.log10(Math.LN2 / ga(p).lam), fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'b', label: 'Radio de salida <i>b</i> = 2<i>Z</i>e²/(4πε₀<i>Q</i>)', short: 'b', f: (p) => ga(p).b, unit: 'fm', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Fusión: energía de Gamow y pico de Gamow ---- */
  const fu = (p) => {
    const mu = p.A1 * p.A2 / (p.A1 + p.A2) * UMEV;
    const EG = 2 * mu * Math.pow(PI * ALPHA * p.Z1 * p.Z2, 2) * 1e3; /* keV */
    const E0 = Math.cbrt(EG * p.kT * p.kT / 4), D = 4 * Math.sqrt(E0 * p.kT / 3);
    const R = 1.2 * (Math.cbrt(p.A1) + Math.cbrt(p.A2)), Bc = p.Z1 * p.Z2 * KE / R;
    return { EG, E0, D, Bc };
  };
  EM.formula('nuc-fusion', {
    gx: 'kT',
    params: [
      { k: 'Z1', label: 'Carga del primer núcleo <i>Z</i>₁ (D, T: 1)', min: 1, max: 8, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'Z2', label: 'Carga del segundo núcleo <i>Z</i>₂', min: 1, max: 8, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'A1', label: 'Masa del primero (D: 2.0141 u)', min: 1, max: 20, value: 2.01410178, fmt: (v) => EM.sci(v, 7), unit: 'u' },
      { k: 'A2', label: 'Masa del segundo (T: 3.0160 u)', min: 1, max: 20, value: 3.01604928, fmt: (v) => EM.sci(v, 7), unit: 'u' },
      { k: 'kT', label: 'Energía térmica <i>kT</i> del plasma', min: 0.1, max: 200, value: 10, log: true, unit: 'keV', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'EG', label: 'Energía de Gamow <i>E</i><sub>G</sub> = 2μ<i>c</i>²(π α <i>Z</i>₁<i>Z</i>₂)²', short: 'E_G', f: (p) => fu(p).EG, unit: 'keV', fmt: (v) => EM.sci(v, 7) },
      { k: 'E0', label: 'Pico de Gamow <i>E</i><sub>0</sub> = (<i>E</i><sub>G</sub>(<i>kT</i>)²/4)<sup>1/3</sup>', short: 'E₀', f: (p) => fu(p).E0, unit: 'keV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'D', label: 'Anchura del pico Δ = 4√(<i>E</i><sub>0</sub><i>kT</i>/3)', short: 'Δ', f: (p) => fu(p).D, unit: 'keV', fmt: (v) => EM.sci(v, 7) },
      { k: 'Bc', label: 'Barrera de Coulomb <i>Z</i>₁<i>Z</i>₂e²/(4πε₀<i>R</i>), <i>R</i> = 1.2(<i>A</i>₁<sup>1/3</sup> + <i>A</i>₂<sup>1/3</sup>) fm', short: 'barrera', f: (p) => fu(p).Bc, unit: 'MeV', fmt: (v) => EM.sci(v, 7) }
    ]
  });
})();
