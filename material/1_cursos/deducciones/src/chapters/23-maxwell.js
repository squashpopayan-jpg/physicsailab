/* Capítulo 23 — Maxwell, ondas electromagnéticas y radiación */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, E0 = 8.8541878128e-12, MU0 = 1.25663706212e-6, C = 299792458, QE = 1.602176634e-19, K = 1 / (4 * PI * E0);

  EM.formula('onda-plana', {
    gx: 'I',
    params: [
      { k: 'I', label: 'Intensidad media de la onda <i>I</i> (constante solar: 1361)', min: 1e-6, max: 1e12, value: 1361, log: true, unit: 'W/m²', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'E0', label: 'Amplitud del campo eléctrico <i>E</i><sub>0</sub> = √(2<i>I</i>/(<i>c</i>ε₀))', short: 'E₀', f: (p) => Math.sqrt(2 * p.I / (C * E0)), unit: 'V/m', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'B0', label: 'Amplitud del campo magnético <i>B</i><sub>0</sub> = <i>E</i><sub>0</sub>/<i>c</i>', short: 'B₀', f: (p) => Math.sqrt(2 * p.I / (C * E0)) / C * 1e6, unit: 'µT', fmt: (v) => EM.sci(v, 6) },
      { k: 'u', label: 'Densidad media de energía <i>u</i> = <i>I</i>/<i>c</i>', short: 'u', f: (p) => p.I / C * 1e6, unit: 'µJ/m³', fmt: (v) => EM.sci(v, 6) },
      { k: 'pa', label: 'Presión de radiación sobre una superficie absorbente <i>I</i>/<i>c</i>', short: 'p absorbente', f: (p) => p.I / C * 1e6, unit: 'µPa', fmt: (v) => EM.sci(v, 6) },
      { k: 'pr', label: 'Presión sobre un espejo perfecto 2<i>I</i>/<i>c</i>', short: 'p espejo', f: (p) => 2 * p.I / C * 1e6, unit: 'µPa', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const sk = (p) => { const w = 2 * PI * p.f, d = Math.sqrt(2 / (MU0 * p.sg * 1e6 * w)); return { d, Rs: 1 / (p.sg * 1e6 * d) }; };
  EM.formula('piel', {
    gx: 'f',
    params: [
      { k: 'sg', label: 'Conductividad σ (Cu: 59.6)', min: 0.001, max: 100, value: 59.6, log: true, unit: 'MS/m', fmt: (v) => EM.sci(v, 4) },
      { k: 'f', label: 'Frecuencia <i>f</i>', min: 1, max: 1e11, value: 60, log: true, unit: 'Hz', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'd', label: 'Profundidad de penetración δ = √(2/(μ₀σω))', short: 'δ', f: (p) => sk(p).d * 1e3, unit: 'mm', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'Rs', label: 'Resistencia superficial <i>R</i><sub>s</sub> = 1/(σδ)', short: 'R_s', f: (p) => sk(p).Rs * 1e3, unit: 'mΩ', fmt: (v) => EM.sci(v, 5) },
      { k: 'att', label: 'Atenuación dentro del metal 8.686/δ', short: 'atenuación', f: (p) => 8.685889638 / (sk(p).d * 1e3), unit: 'dB/mm', fmt: (v) => EM.sci(v, 5) },
      { k: 'lam', label: 'Longitud de onda en el metal 2πδ', short: 'λ en el metal', f: (p) => 2 * PI * sk(p).d * 1e3, unit: 'mm', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const fr = (p) => { const r = (p.n1 - p.n2) / (p.n1 + p.n2), q = (p.n1 * p.n2 - p.nc * p.nc) / (p.n1 * p.n2 + p.nc * p.nc); return { r, q }; };
  EM.formula('fresnel', {
    gx: 'nc',
    params: [
      { k: 'n1', label: 'Índice del medio de incidencia <i>n</i>₁', min: 1, max: 2, value: 1, fmt: (v) => EM.sci(v, 4), step: 0.01 },
      { k: 'n2', label: 'Índice del sustrato <i>n</i>₂', min: 1.05, max: 4, value: 1.5, fmt: (v) => EM.sci(v, 4), step: 0.01 },
      { k: 'nc', label: 'Índice de la capa antirreflejante <i>n</i><sub>c</sub> (MgF₂: 1.38)', min: 1, max: 3, value: 1.38, fmt: (v) => EM.sci(v, 4), step: 0.01 },
      { k: 'lam', label: 'Longitud de onda en el vacío λ', min: 300, max: 1600, value: 550, unit: 'nm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'R0', label: 'Reflectancia de la interfaz desnuda <i>R</i> = ((<i>n</i>₁ − <i>n</i>₂)/(<i>n</i>₁ + <i>n</i>₂))²', short: 'R sin capa', f: (p) => Math.pow(fr(p).r, 2), fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'T0', label: 'Transmitancia 4<i>n</i>₁<i>n</i>₂/(<i>n</i>₁ + <i>n</i>₂)²', short: 'T sin capa', f: (p) => 4 * p.n1 * p.n2 / Math.pow(p.n1 + p.n2, 2), fmt: (v) => EM.sci(v, 5) },
      { k: 'Rc', label: 'Reflectancia con capa de un cuarto de onda ((<i>n</i>₁<i>n</i>₂ − <i>n</i>c²)/(<i>n</i>₁<i>n</i>₂ + <i>n</i>c²))²', short: 'R con capa', f: (p) => Math.pow(fr(p).q, 2), fmt: (v) => EM.sci(v, 5) },
      { k: 'nid', label: 'Índice ideal de la capa √(<i>n</i>₁<i>n</i>₂)', short: 'n ideal', f: (p) => Math.sqrt(p.n1 * p.n2), fmt: (v) => EM.sci(v, 5) },
      { k: 'd', label: 'Espesor de la capa λ/(4<i>n</i><sub>c</sub>)', short: 'espesor', f: (p) => p.lam / (4 * p.nc), unit: 'nm', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const lm = (p) => { const P = (2 / 3) * K * Math.pow(p.q * QE, 2) * p.a * p.a / Math.pow(C, 3); return { P }; };
  EM.formula('larmor', {
    gx: 'a',
    params: [
      { k: 'q', label: 'Carga en unidades de <i>e</i>', min: 1, max: 10, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'a', label: 'Aceleración <i>a</i> (electrón en el átomo de H: 9.044×10²²)', min: 1e10, max: 1e25, value: 9.044216e22, log: true, unit: 'm/s²', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'P', label: 'Potencia radiada (Larmor) <i>P</i> = <i>q</i>²<i>a</i>²/(6πε₀<i>c</i>³)', short: 'P radiada', f: (p) => lm(p).P, unit: 'W', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'Pe', label: 'Potencia en eV por segundo', short: 'P (eV/s)', f: (p) => lm(p).P / QE, unit: 'eV/s', fmt: (v) => EM.sci(v, 5) },
      { k: 't', label: 'Tiempo para radiar 13.6 eV a esa potencia', short: 't (13.6 eV)', f: (p) => 13.6 / (lm(p).P / QE), unit: 's', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const AM = 28.96e-3 / 6.02214076e23, NCOL = 101325 / (AM * 9.80665);
  const rl = (p) => { const k = 2 * PI / (p.lam * 1e-9), s = 8 * PI / 3 * Math.pow(k, 4) * Math.pow(p.ap * 1e-30, 2); return { s, tau: s * NCOL }; };
  EM.formula('rayleigh', {
    gx: 'lam',
    params: [
      { k: 'lam', label: 'Longitud de onda λ', min: 300, max: 1000, value: 550, unit: 'nm', fmt: (v) => EM.sci(v, 4) },
      { k: 'ap', label: 'Polarizabilidad (volumen) α′ de la molécula (N₂: 1.74)', min: 0.1, max: 10, value: 1.74, log: true, unit: 'Å³', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 's', label: 'Sección eficaz de Rayleigh σ = (8π/3)<i>k</i>⁴α′²', short: 'σ', f: (p) => rl(p).s * 1e31, unit: '10⁻³¹ m²', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'tau', label: 'Profundidad óptica de toda la atmósfera σ<i>N</i><sub>col</sub> (<i>N</i><sub>col</sub> = 2.149×10²⁹ m⁻²)', short: 'τ atmósfera', f: (p) => rl(p).tau, fmt: (v) => EM.sci(v, 5) },
      { k: 'T', label: 'Transmitancia directa e<sup>−τ</sup> (cenit)', short: 'transmisión', f: (p) => Math.exp(-rl(p).tau), fmt: (v) => EM.sci(v, 5) },
      { k: 'rel', label: 'Dispersión relativa a 650 nm (650/λ)⁴', short: 'rel. a 650 nm', f: (p) => Math.pow(650 / p.lam, 4), fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
