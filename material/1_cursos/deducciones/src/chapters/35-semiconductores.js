/* Capítulo 35 — Semiconductores y superconductividad */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, H = 6.62607015e-34, HB = H / (2 * PI), QE = 1.602176634e-19, ME = 9.1093837015e-31, KB = 1.380649e-23, EPS0 = 8.8541878128e-12, MU0 = 1.25663706212e-6;
  const nc = (m, T) => 2 * Math.pow(m * ME * KB * T / (2 * PI * HB * HB), 1.5) * 1e-6; /* cm^-3 */

  /* ---- Semiconductor intrínseco ---- */
  const it = (p) => { const Nc = nc(p.me, p.T), Nv = nc(p.mh, p.T), VT = KB * p.T / QE; return { Nc, Nv, VT, ni: Math.sqrt(Nc * Nv) * Math.exp(-p.Eg / (2 * VT)) }; };
  EM.formula('intrinseco', {
    gx: 'T',
    params: [
      { k: 'Eg', label: 'Ancho de la brecha <i>E</i><sub>g</sub> (Si: 1.12 eV; Ge: 0.66; GaAs: 1.424)', min: 0.2, max: 3.5, value: 1.12, unit: 'eV', fmt: (v) => EM.sci(v, 4) },
      { k: 'me', label: 'Masa efectiva de los electrones <i>m</i><sub>e</sub>*/<i>m</i> (Si: 1.08)', min: 0.03, max: 2, value: 1.08, log: true, fmt: (v) => EM.sci(v, 4) },
      { k: 'mh', label: 'Masa efectiva de los huecos <i>m</i><sub>h</sub>*/<i>m</i> (Si: 0.56)', min: 0.03, max: 2, value: 0.56, log: true, fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 100, max: 800, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'ni', label: 'Concentración intrínseca <i>n</i><sub>i</sub> = √(<i>N</i><sub>c</sub><i>N</i><sub>v</sub>) e<sup>−<i>E</i>g/2kT</sup>', short: 'n_i', f: (p) => it(p).ni, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'Nc', label: 'Densidad efectiva de estados de la banda de conducción <i>N</i><sub>c</sub> = 2(<i>m</i>*<i>kT</i>/2πħ²)<sup>3/2</sup>', short: 'N_c', f: (p) => it(p).Nc, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 7) },
      { k: 'Nv', label: 'Densidad efectiva de estados de la banda de valencia <i>N</i><sub>v</sub>', short: 'N_v', f: (p) => it(p).Nv, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 7) },
      { k: 'Ei', label: 'Nivel de Fermi intrínseco respecto al centro de la brecha (<i>kT</i>/2) ln(<i>N</i><sub>v</sub>/<i>N</i><sub>c</sub>)', short: 'E_i − E_g/2', f: (p) => { const q = it(p); return q.VT / 2 * Math.log(q.Nv / q.Nc); }, unit: 'eV', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  /* ---- Semiconductor dopado ---- */
  const dp = (p) => { const ni = p.ni, ND = p.ND, n = ND / 2 + Math.sqrt(ND * ND / 4 + ni * ni), pp = ni * ni / n, VT = KB * p.T / QE; return { n, p: pp, VT }; };
  EM.formula('dopado', {
    gx: 'ND',
    params: [
      { k: 'ND', label: 'Concentración de donadores <i>N</i><sub>D</sub> (tipo n)', min: 1e10, max: 1e20, value: 1e16, log: true, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 4) },
      { k: 'ni', label: 'Concentración intrínseca <i>n</i><sub>i</sub> (Si, 300 K: 1×10¹⁰ cm⁻³)', min: 1e5, max: 1e14, value: 1e10, log: true, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 200, max: 700, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'mun', label: 'Movilidad de los electrones μ<sub>n</sub> (Si: 1350)', min: 100, max: 8000, value: 1350, log: true, unit: 'cm²/(V s)', fmt: (v) => EM.sci(v, 4) },
      { k: 'mup', label: 'Movilidad de los huecos μ<sub>p</sub> (Si: 480)', min: 50, max: 2000, value: 480, log: true, unit: 'cm²/(V s)', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'n', label: 'Electrones <i>n</i> = <i>N</i><sub>D</sub>/2 + √(<i>N</i><sub>D</sub>²/4 + <i>n</i><sub>i</sub>²)', short: 'n', f: (p) => dp(p).n, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 8) },
      { k: 'p', label: 'Huecos <i>p</i> = <i>n</i><sub>i</sub>²/<i>n</i> (ley de acción de masas)', short: 'p', f: (p) => dp(p).p, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 8) },
      { k: 'EF', label: 'Nivel de Fermi sobre el intrínseco <i>kT</i> ln(<i>n</i>/<i>n</i><sub>i</sub>)', short: 'E_F − E_i', f: (p) => { const q = dp(p); return q.VT * Math.log(q.n / p.ni); }, unit: 'eV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'sig', label: 'Conductividad σ = <i>q</i>(<i>n</i>μ<sub>n</sub> + <i>p</i>μ<sub>p</sub>)', short: 'σ', f: (p) => { const q = dp(p); return QE * (q.n * p.mun + q.p * p.mup); }, unit: 'S/cm', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Unión p–n abrupta ---- */
  const pn = (p) => {
    const VT = KB * p.T / QE, Vbi = VT * Math.log(p.NA * p.ND / (p.ni * p.ni)), eps = p.er * EPS0;
    const W = Math.sqrt(2 * eps * (p.NA + p.ND) * 1e6 * (Vbi - p.Va) / (QE * p.NA * p.ND * 1e12));
    return { VT, Vbi, W, xn: W * p.NA / (p.NA + p.ND), xp: W * p.ND / (p.NA + p.ND), eps };
  };
  EM.formula('union-pn', {
    gx: 'Va',
    params: [
      { k: 'NA', label: 'Aceptores en el lado p <i>N</i><sub>A</sub>', min: 1e14, max: 1e19, value: 1e16, log: true, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 4) },
      { k: 'ND', label: 'Donadores en el lado n <i>N</i><sub>D</sub>', min: 1e14, max: 1e19, value: 1e16, log: true, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 4) },
      { k: 'ni', label: 'Concentración intrínseca <i>n</i><sub>i</sub>', min: 1e8, max: 1e12, value: 1e10, log: true, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 4) },
      { k: 'er', label: 'Permitividad relativa ε<sub>r</sub> (Si: 11.7)', min: 5, max: 20, value: 11.7, fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 200, max: 500, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'Va', label: 'Tensión aplicada <i>V</i><sub>a</sub> (positiva: directa)', min: -20, max: 0.6, value: 0, fmt: (v) => EM.sci(v, 4), unit: 'V' }
    ],
    outs: [
      { k: 'Vbi', label: 'Potencial de contacto <i>V</i><sub>bi</sub> = (<i>kT</i>/<i>q</i>) ln(<i>N</i><sub>A</sub><i>N</i><sub>D</sub>/<i>n</i><sub>i</sub>²)', short: 'V_bi', f: (p) => pn(p).Vbi, unit: 'V', fmt: (v) => EM.sci(v, 7) },
      { k: 'W', label: 'Ancho de la zona de deplexión <i>W</i> = √[2ε(<i>N</i><sub>A</sub> + <i>N</i><sub>D</sub>)(<i>V</i><sub>bi</sub> − <i>V</i><sub>a</sub>)/(<i>qN</i><sub>A</sub><i>N</i><sub>D</sub>)]', short: 'W', f: (p) => pn(p).W * 1e6, unit: 'µm', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'xn', label: 'Penetración en el lado n <i>x</i><sub>n</sub> = <i>W N</i><sub>A</sub>/(<i>N</i><sub>A</sub> + <i>N</i><sub>D</sub>)', short: 'x_n', f: (p) => pn(p).xn * 1e6, unit: 'µm', fmt: (v) => EM.sci(v, 7) },
      { k: 'Em', label: 'Campo máximo en la unión <i>E</i><sub>máx</sub> = <i>qN</i><sub>D</sub><i>x</i><sub>n</sub>/ε', short: 'E_máx', f: (p) => { const q = pn(p); return QE * p.ND * 1e6 * q.xn / q.eps * 1e-5; }, unit: 'kV/cm', fmt: (v) => EM.sci(v, 7) },
      { k: 'Cj', label: 'Capacidad por unidad de área <i>C</i> = ε/<i>W</i>', short: 'C_j', f: (p) => { const q = pn(p); return q.eps / q.W * 1e-4 * 1e9; }, unit: 'nF/cm²', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Diodo de Shockley ---- */
  EM.formula('diodo', {
    gx: 'V',
    params: [
      { k: 'Is', label: 'Corriente de saturación <i>I</i><sub>s</sub>', min: 0.001, max: 1e6, value: 1, log: true, unit: 'pA', fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 200, max: 450, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'V', label: 'Tensión directa <i>V</i>', min: 0.05, max: 0.8, value: 0.6, unit: 'V', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'I', label: 'Corriente <i>I</i> = <i>I</i><sub>s</sub>(e<sup><i>qV/kT</i></sup> − 1)', short: 'I', f: (p) => p.Is * 1e-12 * Math.expm1(p.V * QE / (KB * p.T)) * 1e3, unit: 'mA', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'VT', label: 'Tensión térmica <i>kT</i>/<i>q</i>', short: 'V_T', f: (p) => KB * p.T / QE * 1e3, unit: 'mV', fmt: (v) => EM.sci(v, 7) },
      { k: 'dec', label: 'Tensión por década de corriente (<i>kT</i>/<i>q</i>) ln 10', short: 'mV/década', f: (p) => KB * p.T / QE * Math.LN10 * 1e3, unit: 'mV', fmt: (v) => EM.sci(v, 7) },
      { k: 'rd', label: 'Resistencia dinámica d<i>V</i>/d<i>I</i> = (<i>kT</i>/<i>q</i>)/(<i>I</i> + <i>I</i><sub>s</sub>)', short: 'r_d', f: (p) => KB * p.T / QE / (p.Is * 1e-12 * Math.exp(p.V * QE / (KB * p.T))), unit: 'Ω', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- London: profundidad de penetración ---- */
  const lo = (p) => { const n = p.n * 1e28; return { lam: Math.sqrt(ME / (MU0 * n * QE * QE)) }; };
  EM.formula('london', {
    gx: 'x',
    params: [
      { k: 'n', label: 'Densidad de electrones superconductores <i>n</i><sub>s</sub> (Al: 18.1; Pb: 13.2; Sn: 14.8)', min: 1, max: 30, value: 18.1, log: true, unit: '10²⁸ m⁻³', fmt: (v) => EM.sci(v, 4) },
      { k: 'x', label: 'Profundidad <i>x</i> bajo la superficie', min: 0.1, max: 100, value: 12.4908, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'lam', label: 'Profundidad de London λ<sub>L</sub> = √[<i>m</i>/(μ₀<i>n</i><sub>s</sub><i>e</i>²)]', short: 'λ_L', f: (p) => lo(p).lam * 1e9, unit: 'nm', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'B', label: 'Campo dentro del superconductor <i>B</i>(<i>x</i>)/<i>B</i>₀ = e<sup>−<i>x</i>/λL</sup>', short: 'B(x)/B₀', f: (p) => Math.exp(-p.x * 1e-9 / lo(p).lam), fmt: (v) => EM.sci(v, 7) },
      { k: 'J', label: 'Densidad de corriente apantalladora en la superficie μ₀⁻¹<i>B</i>₀/λ<sub>L</sub> por tesla', short: 'j_s/B₀', f: (p) => 1 / (MU0 * lo(p).lam) * 1e-12, unit: 'TA/(m² T)', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Flujo cuantizado y Josephson ---- */
  EM.formula('josephson', {
    gx: 'V',
    params: [
      { k: 'V', label: 'Tensión continua a través de la unión <i>V</i>', min: 0.1, max: 1000, value: 100, log: true, unit: 'µV', fmt: (v) => EM.sci(v, 5) },
      { k: 'n', label: 'Número de cuantos de flujo <i>n</i>', min: 1, max: 1000, value: 1, log: true, fmt: (v) => EM.sci(v, 4), step: 1 },
      { k: 'S', label: 'Área del anillo superconductor', min: 0.01, max: 1e4, value: 1, log: true, unit: 'µm²', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'f', label: 'Frecuencia Josephson <i>f</i> = 2<i>eV</i>/<i>h</i>', short: 'f_J', f: (p) => 2 * QE * p.V * 1e-6 / H * 1e-9, unit: 'GHz', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'F0', label: 'Cuanto de flujo Φ₀ = <i>h</i>/(2<i>e</i>)', short: 'Φ₀', f: () => H / (2 * QE) * 1e15, unit: 'fWb', fmt: (v) => EM.sci(v, 9) },
      { k: 'Fn', label: 'Flujo atrapado en el anillo <i>n</i>Φ₀', short: 'nΦ₀', f: (p) => p.n * H / (2 * QE) * 1e15, unit: 'fWb', fmt: (v) => EM.sci(v, 8) },
      { k: 'B', label: 'Campo medio que corresponde a <i>n</i>Φ₀ en el área dada', short: 'B', f: (p) => p.n * H / (2 * QE) / (p.S * 1e-12) * 1e6, unit: 'µT', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- BCS: temperatura crítica y brecha en acoplamiento débil ---- */
  const GE = 0.5772156649015329;
  const bc = (p) => { const hw = KB * p.th, Tc = 2 * Math.exp(GE) / PI * p.th * Math.exp(-1 / p.lam); return { hw, Tc, D0: hw / Math.sinh(1 / p.lam) }; };
  EM.formula('bcs', {
    gx: 'lam',
    params: [
      { k: 'lam', label: 'Acoplamiento electrón–fonón <i>N</i>(0)<i>V</i> (débil: ≲ 0.3)', min: 0.08, max: 0.4, value: 0.17, fmt: (v) => EM.sci(v, 4) },
      { k: 'th', label: 'Temperatura de Debye θ<sub>D</sub> (Al: 428 K)', min: 50, max: 800, value: 428, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'Tc', label: 'Temperatura crítica <i>k</i><sub>B</sub><i>T</i><sub>c</sub> = (2e<sup>γ</sup>/π) ħω<sub>D</sub> e<sup>−1/<i>N</i>(0)<i>V</i></sup>', short: 'T_c', f: (p) => bc(p).Tc, unit: 'K', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'D0', label: 'Brecha a <i>T</i> = 0: Δ(0) = ħω<sub>D</sub>/senh[1/<i>N</i>(0)<i>V</i>]', short: 'Δ(0)', f: (p) => bc(p).D0 / QE * 1e3, unit: 'meV', fmt: (v) => EM.sci(v, 7) },
      { k: 'r', label: 'Cociente Δ(0)/(<i>k</i><sub>B</sub><i>T</i><sub>c</sub>) (→ π/e<sup>γ</sup> = 1.764)', short: 'Δ/kTc', f: (p) => { const q = bc(p); return q.D0 / (KB * q.Tc); }, fmt: (v) => EM.sci(v, 7) },
      { k: 'hw', label: 'Energía de corte ħω<sub>D</sub> = <i>k</i><sub>B</sub>θ<sub>D</sub>', short: 'ħω_D', f: (p) => KB * p.th / QE * 1e3, unit: 'meV', fmt: (v) => EM.sci(v, 7) }
    ]
  });
})();
