/* Capítulo 24 — Materia en campos eléctricos y magnéticos; plasmas */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, E0 = 8.8541878128e-12, kB = 1.380649e-23, QE = 1.602176634e-19, ME = 9.1093837015e-31, C = 299792458, MU0 = 1.25663706212e-6, MUB = 9.2740100783e-24;

  const cm = (p) => { const x = 4 * PI / 3 * p.n * p.ap * 1e-30; return { x, er: (1 + 2 * x) / (1 - x) }; };
  EM.formula('clausius', {
    gx: 'n',
    params: [
      { k: 'n', label: 'Densidad de moléculas <i>n</i> (N₂ a 1 atm: 2.446×10²⁵)', min: 1e24, max: 5e28, value: 2.446e25, log: true, unit: 'm⁻³', fmt: (v) => EM.sci(v, 4) },
      { k: 'ap', label: 'Polarizabilidad electrónica α′ (volumen)', min: 0.1, max: 5, value: 1.74, log: true, unit: 'Å³', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'er', label: 'Constante dieléctrica ε<sub>r</sub> = (1 + 2<i>x</i>)/(1 − <i>x</i>), <i>x</i> = 4π<i>n</i>α′/3', short: 'ε_r', f: (p) => cm(p).er, fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'dil', label: 'Gas diluido: ε<sub>r</sub> − 1 ≈ 4π<i>n</i>α′', short: 'ε_r − 1 (diluido)', f: (p) => 4 * PI * p.n * p.ap * 1e-30, fmt: (v) => EM.sci(v, 6) },
      { k: 'nr', label: 'Índice de refracción √ε<sub>r</sub>', short: 'índice', f: (p) => Math.sqrt(cm(p).er), fmt: (v) => EM.sci(v, 7) },
      { k: 'x', label: 'Parámetro <i>x</i> = (ε<sub>r</sub> − 1)/(ε<sub>r</sub> + 2)', short: 'x', f: (p) => cm(p).x, fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const lg = (p) => { const pp = p.p * 1e-30, x = pp * p.E * 1e6 / (kB * p.T); const x2 = x * x, L = x < 0.01 ? x / 3 - x * x2 / 45 + 2 * x2 * x2 * x / 945 - x2 * x2 * x2 * x / 4725 : 1 / Math.tanh(x) - 1 / x; return { pp, x, L }; };
  EM.formula('langevin', {
    gx: 'T',
    params: [
      { k: 'p', label: 'Momento dipolar de la molécula <i>p</i> (agua: 6.17)', min: 0.1, max: 20, value: 6.17, log: true, unit: '10⁻³⁰ C·m', fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 10, max: 1000, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'E', label: 'Campo eléctrico <i>E</i>', min: 0.01, max: 3000, value: 1, log: true, unit: 'MV/m', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'x', label: 'Parámetro <i>x</i> = <i>pE</i>/(<i>kT</i>)', short: 'x = pE/kT', f: (p) => lg(p).x, fmt: (v) => EM.sci(v, 6) },
      { k: 'L', label: 'Orientación media ⟨cosθ⟩ = <i>L</i>(<i>x</i>) = coth <i>x</i> − 1/<i>x</i>', short: 'L(x)', f: (p) => lg(p).L, fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'ap', label: 'Polarizabilidad orientacional (volumen) <i>p</i>²/(3<i>kT</i>·4πε₀)', short: 'α′ orientacional', f: (p) => lg(p).pp * lg(p).pp / (3 * kB * p.T) / (4 * PI * E0) * 1e30, unit: 'Å³', fmt: (v) => EM.sci(v, 6) },
      { k: 'pm', label: 'Momento medio inducido ⟨<i>p</i>∥⟩ = <i>p L</i>(<i>x</i>)', short: 'momento medio', f: (p) => lg(p).pp * lg(p).L * 1e30, unit: '10⁻³⁰ C·m', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const pl = (p) => { const wp = Math.sqrt(p.n * QE * QE / (E0 * ME)); return { wp, lD: Math.sqrt(E0 * p.T * QE / (p.n * QE * QE)) }; };
  EM.formula('plasma', {
    gx: 'n',
    params: [
      { k: 'n', label: 'Densidad de electrones <i>n</i>', min: 1e6, max: 1e30, value: 1e12, log: true, unit: 'm⁻³', fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura electrónica <i>T</i><sub>e</sub>', min: 0.01, max: 1e4, value: 0.1, log: true, unit: 'eV', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'fp', label: 'Frecuencia de plasma <i>f</i><sub>p</sub> = ω<sub>p</sub>/2π, ω<sub>p</sub> = √(<i>ne</i>²/ε₀<i>m</i>)', short: 'f de plasma', f: (p) => pl(p).wp / (2 * PI), unit: 'Hz', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'lD', label: 'Longitud de Debye λ<sub>D</sub> = √(ε₀<i>kT</i>/<i>ne</i>²)', short: 'λ_D', f: (p) => pl(p).lD, unit: 'm', fmt: (v) => EM.sci(v, 6) },
      { k: 'ND', label: 'Número de partículas en la esfera de Debye (4π/3)<i>n</i>λ<sub>D</sub>³', short: 'N_D', f: (p) => 4 * PI / 3 * p.n * Math.pow(pl(p).lD, 3), fmt: (v) => EM.sci(v, 5) },
      { k: 'lc', label: 'Longitud de onda de corte 2π<i>c</i>/ω<sub>p</sub>', short: 'λ de corte', f: (p) => 2 * PI * C / pl(p).wp, unit: 'm', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const cu = (p) => { const x = MUB * p.B / (kB * p.T); return { x, M: p.n * MUB * Math.tanh(x) }; };
  EM.formula('curie', {
    gx: 'T',
    params: [
      { k: 'n', label: 'Densidad de momentos magnéticos (espín ½) <i>n</i>', min: 1e24, max: 1e29, value: 1e27, log: true, unit: 'm⁻³', fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 0.1, max: 1000, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'B', label: 'Campo magnético <i>B</i>', min: 0.001, max: 20, value: 1, log: true, unit: 'T', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'x', label: 'Parámetro <i>x</i> = μ<sub>B</sub><i>B</i>/(<i>kT</i>)', short: 'x', f: (p) => cu(p).x, fmt: (v) => EM.sci(v, 6) },
      { k: 'M', label: 'Magnetización <i>M</i> = <i>n</i>μ<sub>B</sub> tanh <i>x</i>', short: 'M', f: (p) => cu(p).M, unit: 'A/m', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'chi', label: 'Susceptibilidad de Curie χ = μ₀<i>n</i>μ<sub>B</sub>²/(<i>kT</i>)', short: 'χ', f: (p) => MU0 * p.n * MUB * MUB / (kB * p.T), fmt: (v) => EM.sci(v, 6) },
      { k: 'sat', label: 'Fracción de saturación tanh <i>x</i>', short: 'M/M_sat', f: (p) => Math.tanh(cu(p).x), fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const db = (p) => { const w = 2 * PI * p.f * 1e9, wt = w * p.tau * 1e-12, ep = p.ei + (p.es - p.ei) / (1 + wt * wt), epp = (p.es - p.ei) * wt / (1 + wt * wt); return { w, wt, ep, epp }; };
  EM.formula('debye', {
    gx: 'f',
    params: [
      { k: 'es', label: 'Constante dieléctrica estática ε<sub>s</sub> (agua a 25 °C: 78.4)', min: 21, max: 100, value: 78.4, log: true, fmt: (v) => EM.sci(v, 4) },
      { k: 'ei', label: 'Constante a frecuencias altas ε<sub>∞</sub> (agua: 5.2)', min: 1.01, max: 20, value: 5.2, log: true, fmt: (v) => EM.sci(v, 4) },
      { k: 'tau', label: 'Tiempo de relajación τ (agua: 8.27)', min: 0.1, max: 1000, value: 8.27, log: true, unit: 'ps', fmt: (v) => EM.sci(v, 4) },
      { k: 'f', label: 'Frecuencia del campo <i>f</i> (horno: 2.45)', min: 0.01, max: 1000, value: 2.45, log: true, unit: 'GHz', fmt: (v) => EM.sci(v, 4) },
      { k: 'E', label: 'Amplitud del campo eléctrico <i>E</i><sub>0</sub>', min: 0.01, max: 100, value: 1, log: true, unit: 'kV/m', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'ep', label: 'Parte real ε′ = ε<sub>∞</sub> + (ε<sub>s</sub> − ε<sub>∞</sub>)/(1 + ω²τ²)', short: 'ε′', f: (p) => db(p).ep, fmt: (v) => EM.sci(v, 6) },
      { k: 'epp', label: 'Pérdidas ε″ = (ε<sub>s</sub> − ε<sub>∞</sub>)ωτ/(1 + ω²τ²)', short: 'ε″', f: (p) => db(p).epp, fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'tg', label: 'Tangente de pérdidas ε″/ε′', short: 'tan δ', f: (p) => db(p).epp / db(p).ep, fmt: (v) => EM.sci(v, 6) },
      { k: 'D', label: 'Profundidad de penetración en potencia 1/(2 Im <i>k</i>)', short: 'penetración', f: (p) => { const k = db(p).w / C, m = Math.hypot(db(p).ep, db(p).epp), im = k * Math.sqrt(db(p).epp * db(p).epp / (m + db(p).ep) / 2); return 1 / (2 * im) * 100; }, unit: 'cm', fmt: (v) => EM.sci(v, 6) },
      { k: 'P', label: 'Potencia absorbida por unidad de volumen ½ωε₀ε″<i>E</i><sub>0</sub>²', short: 'P absorbida', f: (p) => 0.5 * db(p).w * E0 * db(p).epp * Math.pow(p.E * 1e3, 2) * 1e-3, unit: 'kW/m³', fmt: (v) => EM.sci(v, 6) }
    ]
  });
})();
