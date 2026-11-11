/* Capítulo 16 — Termodinámica */
(function () {
  'use strict';
  const EM = window.EM, R = 8.314462618, RL = 0.08314462618;

  EM.formula('adiabatica', {
    gx: 'r',
    params: [
      { k: 'gam', label: 'Índice adiabático γ = <i>C</i><sub>p</sub>/<i>C</i><sub>v</sub>', min: 1.05, max: 1.7, value: 1.4, fmt: (v) => EM.sci(v, 4), step: 0.01 },
      { k: 'T1', label: 'Temperatura inicial <i>T</i>₁', min: 100, max: 1000, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'r', label: 'Razón de compresión <i>r</i> = <i>V</i>₁/<i>V</i>₂', min: 1.1, max: 30, value: 10, log: true, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'T2', label: 'Temperatura final <i>T</i>₂ = <i>T</i>₁<i>r</i><sup>γ−1</sup>', short: 'T₂', f: (p) => p.T1 * Math.pow(p.r, p.gam - 1), unit: 'K', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'pr', label: 'Razón de presiones <i>p</i>₂/<i>p</i>₁ = <i>r</i><sup>γ</sup>', short: 'p₂/p₁', f: (p) => Math.pow(p.r, p.gam), fmt: (v) => EM.sci(v, 5) },
      { k: 'W', label: 'Trabajo sobre el gas por mol <i>RT</i>₁(<i>r</i><sup>γ−1</sup> − 1)/(γ − 1)', short: 'W adiabático', f: (p) => R * p.T1 * (Math.pow(p.r, p.gam - 1) - 1) / (p.gam - 1), unit: 'J/mol', fmt: (v) => EM.sci(v, 5) },
      { k: 'Wi', label: 'Trabajo isotérmico por mol <i>RT</i>₁ ln <i>r</i> (comparación)', short: 'W isotérmico', f: (p) => R * p.T1 * Math.log(p.r), unit: 'J/mol', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('carnot', {
    gx: 'tau',
    params: [
      { k: 'Th', label: 'Temperatura del foco caliente <i>T</i><sub>h</sub>', min: 300, max: 3000, value: 500, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'tau', label: 'Cociente de temperaturas τ = <i>T</i><sub>c</sub>/<i>T</i><sub>h</sub>', min: 0.05, max: 0.95, value: 0.6, fmt: (v) => EM.sci(v, 4), step: 0.01 },
      { k: 'Qh', label: 'Calor tomado del foco caliente <i>Q</i><sub>h</sub>', min: 100, max: 1e5, value: 1000, log: true, unit: 'J', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'eta', label: 'Rendimiento η = 1 − <i>T</i><sub>c</sub>/<i>T</i><sub>h</sub>', short: 'η', f: (p) => 1 - p.tau, fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'W', label: 'Trabajo por ciclo <i>W</i> = η<i>Q</i><sub>h</sub>', short: 'W', f: (p) => (1 - p.tau) * p.Qh, unit: 'J', fmt: (v) => EM.sci(v, 5) },
      { k: 'Qc', label: 'Calor cedido <i>Q</i><sub>c</sub> = τ<i>Q</i><sub>h</sub>', short: 'Q cedido', f: (p) => p.tau * p.Qh, unit: 'J', fmt: (v) => EM.sci(v, 5) },
      { k: 'Tc', label: 'Temperatura del foco frío <i>T</i><sub>c</sub> = τ<i>T</i><sub>h</sub>', short: 'T fría', f: (p) => p.tau * p.Th, unit: 'K', fmt: (v) => EM.sci(v, 5) },
      { k: 'cop', label: 'Refrigerador inverso: <i>COP</i> = <i>T</i><sub>c</sub>/(<i>T</i><sub>h</sub> − <i>T</i><sub>c</sub>)', short: 'COP', f: (p) => p.tau / (1 - p.tau), fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const ot = (p) => { const Cv = R / (p.gam - 1), T2 = p.T1 * Math.pow(p.r, p.gam - 1), T4 = p.Tm * Math.pow(p.r, 1 - p.gam); return { Cv, T2, T4, Qin: Cv * (p.Tm - T2), eta: 1 - Math.pow(p.r, 1 - p.gam) }; };
  EM.formula('otto', {
    gx: 'r',
    params: [
      { k: 'r', label: 'Razón de compresión <i>r</i> = <i>V</i>₁/<i>V</i>₂', min: 2, max: 30, value: 10, log: true, fmt: (v) => EM.sci(v, 4) },
      { k: 'gam', label: 'Índice adiabático γ', min: 1.1, max: 1.67, value: 1.4, fmt: (v) => EM.sci(v, 4), step: 0.01 },
      { k: 'T1', label: 'Temperatura de admisión <i>T</i>₁', min: 200, max: 500, value: 300, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'Tm', label: 'Temperatura máxima <i>T</i>₃ (tras la combustión)', min: 1200, max: 3000, value: 1800, unit: 'K', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'eta', label: 'Rendimiento η = 1 − <i>r</i><sup>1−γ</sup>', short: 'η Otto', f: (p) => ot(p).eta, fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'T2', label: 'Temperatura tras la compresión <i>T</i>₂ = <i>T</i>₁<i>r</i><sup>γ−1</sup>', short: 'T₂', f: (p) => ot(p).T2, unit: 'K', fmt: (v) => EM.sci(v, 5) },
      { k: 'T4', label: 'Temperatura de escape <i>T</i>₄ = <i>T</i>₃<i>r</i><sup>1−γ</sup>', short: 'T₄', f: (p) => ot(p).T4, unit: 'K', fmt: (v) => EM.sci(v, 5) },
      { k: 'Qin', label: 'Calor aportado por mol <i>C</i><sub>v</sub>(<i>T</i>₃ − <i>T</i>₂)', short: 'Q aportado', f: (p) => ot(p).Qin, unit: 'J/mol', fmt: (v) => EM.sci(v, 5) },
      { k: 'W', label: 'Trabajo neto por mol η<i>Q</i><sub>in</sub>', short: 'W neto', f: (p) => ot(p).eta * ot(p).Qin, unit: 'J/mol', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('entropia', {
    gx: 'Vr',
    params: [
      { k: 'f', label: 'Grados de libertad por molécula <i>f</i> (3 monoatómico, 5 diatómico)', min: 3, max: 8, value: 3, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'n', label: 'Cantidad de gas <i>n</i>', min: 0.1, max: 10, value: 1, log: true, unit: 'mol', fmt: (v) => EM.sci(v, 3) },
      { k: 'Tr', label: 'Cociente de temperaturas <i>T</i>₂/<i>T</i>₁', min: 0.2, max: 5, value: 2, log: true, fmt: (v) => EM.sci(v, 3) },
      { k: 'Vr', label: 'Cociente de volúmenes <i>V</i>₂/<i>V</i>₁', min: 0.1, max: 20, value: 2, log: true, fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'dS', label: 'Δ<i>S</i> = <i>n</i>(<i>f</i>/2)<i>R</i> ln(<i>T</i>₂/<i>T</i>₁) + <i>nR</i> ln(<i>V</i>₂/<i>V</i>₁)', short: 'ΔS total', f: (p) => p.n * (p.f / 2) * R * Math.log(p.Tr) + p.n * R * Math.log(p.Vr), unit: 'J/K', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'dST', label: 'Parte térmica <i>n</i>(<i>f</i>/2)<i>R</i> ln(<i>T</i>₂/<i>T</i>₁)', short: 'ΔS térmica', f: (p) => p.n * (p.f / 2) * R * Math.log(p.Tr), unit: 'J/K', fmt: (v) => EM.sci(v, 5) },
      { k: 'dSV', label: 'Parte de volumen <i>nR</i> ln(<i>V</i>₂/<i>V</i>₁)', short: 'ΔS volumen', f: (p) => p.n * R * Math.log(p.Vr), unit: 'J/K', fmt: (v) => EM.sci(v, 5) },
      { k: 'dSp', label: 'Misma Δ<i>S</i> con <i>T</i> y <i>p</i>: <i>nC</i><sub>p</sub> ln(<i>T</i>₂/<i>T</i>₁) − <i>nR</i> ln(<i>p</i>₂/<i>p</i>₁)', short: 'ΔS (T, p)', f: (p) => p.n * (p.f / 2 + 1) * R * Math.log(p.Tr) - p.n * R * Math.log(p.Tr / p.Vr), unit: 'J/K', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('vdw', {
    gx: 'a',
    params: [
      { k: 'a', label: 'Parámetro de atracción <i>a</i>', min: 0.02, max: 20, value: 3.64, log: true, unit: 'L²·bar/mol²', fmt: (v) => EM.sci(v, 4) },
      { k: 'b', label: 'Covolumen <i>b</i>', min: 0.01, max: 0.2, value: 0.04267, log: true, unit: 'L/mol', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'Tc', label: 'Temperatura crítica <i>T</i><sub>c</sub> = 8<i>a</i>/(27<i>Rb</i>)', short: 'T crítica', f: (p) => 8 * p.a / (27 * RL * p.b), unit: 'K', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'pc', label: 'Presión crítica <i>p</i><sub>c</sub> = <i>a</i>/(27<i>b</i>²)', short: 'p crítica', f: (p) => p.a / (27 * p.b * p.b), unit: 'bar', fmt: (v) => EM.sci(v, 5) },
      { k: 'Vc', label: 'Volumen molar crítico <i>V</i><sub>c</sub> = 3<i>b</i>', short: 'V crítico', f: (p) => 3 * p.b, unit: 'L/mol', fmt: (v) => EM.sci(v, 5) },
      { k: 'TB', label: 'Temperatura de Boyle <i>T</i><sub>B</sub> = <i>a</i>/(<i>Rb</i>)', short: 'T de Boyle', f: (p) => p.a / (RL * p.b), unit: 'K', fmt: (v) => EM.sci(v, 5) },
      { k: 'Zc', label: 'Factor de compresibilidad crítico <i>p</i><sub>c</sub><i>V</i><sub>c</sub>/(<i>RT</i><sub>c</sub>) (siempre 3/8)', short: 'Z crítico', f: (p) => (p.a / (27 * p.b * p.b)) * (3 * p.b) / (RL * 8 * p.a / (27 * RL * p.b)), fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
