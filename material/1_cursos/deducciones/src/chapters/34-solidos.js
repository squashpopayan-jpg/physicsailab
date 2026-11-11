/* Capítulo 34 — Sólidos: difracción, fonones, calor específico, electrones libres y bandas */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, H = 6.62607015e-34, HB = H / (2 * PI), C = 299792458, QE = 1.602176634e-19, ME = 9.1093837015e-31, KB = 1.380649e-23, AMU = 1.66053906660e-27, RG = 8.314462618;

  /* ---- Bragg para una red cúbica ---- */
  const bg = (p) => { const d = p.a / Math.sqrt(p.N); return { d, s: p.n * p.lam / (2 * d) }; };
  EM.formula('bragg', {
    gx: 'lam',
    params: [
      { k: 'a', label: 'Arista de la celda cúbica <i>a</i> (Si: 5.431 Å)', min: 2, max: 10, value: 5.431, unit: 'Å', fmt: (v) => EM.sci(v, 5) },
      { k: 'N', label: 'Índices <i>h</i>² + <i>k</i>² + <i>l</i>² del plano ((111): 3; (220): 8; (311): 11)', min: 1, max: 30, value: 3, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'n', label: 'Orden de la reflexión <i>n</i>', min: 1, max: 4, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'lam', label: 'Longitud de onda de los rayos X λ (Cu Kα: 1.5406 Å)', min: 0.3, max: 3, value: 1.5406, log: true, unit: 'Å', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'd', label: 'Distancia entre planos <i>d</i> = <i>a</i>/√(<i>h</i>² + <i>k</i>² + <i>l</i>²)', short: 'd', f: (p) => bg(p).d, unit: 'Å', fmt: (v) => EM.sci(v, 7) },
      { k: 'G', label: 'Módulo del vector recíproco |<b>G</b>| = 2π/<i>d</i>', short: '|G|', f: (p) => 2 * PI / bg(p).d, unit: 'Å⁻¹', fmt: (v) => EM.sci(v, 7) },
      { k: 's', label: 'sen θ = <i>n</i>λ/(2<i>d</i>) (debe ser ≤ 1)', short: 'sen θ', f: (p) => bg(p).s, fmt: (v) => EM.sci(v, 7) },
      { k: 'tt', label: 'Ángulo de difracción 2θ (0 si no hay difracción)', short: '2θ', f: (p) => { const s = bg(p).s; return s <= 1 ? 2 * Math.asin(s) * 180 / PI : 0; }, unit: '°', fmt: (v) => EM.sci(v, 7), hl: true }
    ]
  });

  /* ---- Cadena monoatómica ---- */
  const cd = (p) => { const m = p.M * AMU, w0 = 2 * Math.sqrt(p.K / m); return { m, w0, a: p.a * 1e-10 }; };
  EM.formula('cadena', {
    gx: 'x',
    params: [
      { k: 'K', label: 'Constante del resorte entre vecinos <i>K</i>', min: 1, max: 300, value: 30, log: true, unit: 'N/m', fmt: (v) => EM.sci(v, 5) },
      { k: 'M', label: 'Masa del átomo <i>M</i> (Cu: 63.546 u)', min: 1, max: 250, value: 63.546, log: true, unit: 'u', fmt: (v) => EM.sci(v, 6) },
      { k: 'a', label: 'Distancia entre átomos <i>a</i>', min: 1, max: 6, value: 2.55, unit: 'Å', fmt: (v) => EM.sci(v, 4) },
      { k: 'x', label: 'Número de onda <i>ka</i>/π (1: borde de la zona de Brillouin)', min: 0.01, max: 1, value: 0.5, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'f', label: 'Frecuencia <i>f</i> = (1/π)√(<i>K</i>/<i>M</i>)|sen(<i>ka</i>/2)|', short: 'f(k)', f: (p) => cd(p).w0 * Math.sin(PI * p.x / 2) / (2 * PI) * 1e-12, unit: 'THz', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'vs', label: 'Velocidad del sonido (ondas largas) <i>v</i><sub>s</sub> = <i>a</i>√(<i>K</i>/<i>M</i>)', short: 'v_s', f: (p) => { const q = cd(p); return q.a * q.w0 / 2; }, unit: 'm/s', fmt: (v) => EM.sci(v, 7) },
      { k: 'vg', label: 'Velocidad de grupo <i>v</i><sub>g</sub> = <i>v</i><sub>s</sub> cos(<i>ka</i>/2)', short: 'v_g', f: (p) => { const q = cd(p); return q.a * q.w0 / 2 * Math.cos(PI * p.x / 2); }, unit: 'm/s', fmt: (v) => EM.sci(v, 7) },
      { k: 'fm', label: 'Frecuencia máxima (borde de zona) (1/π)√(<i>K</i>/<i>M</i>)', short: 'f_máx', f: (p) => cd(p).w0 / (2 * PI) * 1e-12, unit: 'THz', fmt: (v) => EM.sci(v, 7) },
      { k: 'lam', label: 'Longitud de onda λ = 2<i>a</i>/(<i>ka</i>/π)', short: 'λ', f: (p) => 2 * p.a / p.x, unit: 'Å', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  /* ---- Debye ---- */
  const dI = (xm) => {
    const top = Math.min(xm, 80), N = 6000, hh = top / N;
    const g = (x) => x < 1e-6 ? x * x : Math.pow(x, 4) * Math.exp(x) / Math.pow(Math.expm1(x), 2);
    let s = g(0) + g(top);
    for (let i = 1; i < N; i++) s += g(i * hh) * (i % 2 ? 4 : 2);
    return s * hh / 3;
  };
  EM.formula('debye-red', {
    gx: 'T',
    params: [
      { k: 'th', label: 'Temperatura de Debye θ<sub>D</sub> (Cu: 343 K; Al: 428 K; Pb: 105 K)', min: 50, max: 2500, value: 343, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 1, max: 2000, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'C', label: 'Calor específico de Debye <i>C</i> = 9<i>R</i>(<i>T</i>/θ<sub>D</sub>)³ ∫₀^{θ/T} <i>x</i>⁴e<sup>x</sup>/(e<sup>x</sup> − 1)² d<i>x</i>', short: 'C_V', f: (p) => 9 * RG * Math.pow(p.T / p.th, 3) * dI(p.th / p.T), unit: 'J/(mol K)', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'fr', label: 'Fracción del valor de Dulong–Petit <i>C</i>/(3<i>R</i>)', short: 'C/3R', f: (p) => 9 * RG * Math.pow(p.T / p.th, 3) * dI(p.th / p.T) / (3 * RG), fmt: (v) => EM.sci(v, 7) },
      { k: 'lo', label: 'Aproximación de baja temperatura (12π⁴/5)<i>R</i>(<i>T</i>/θ<sub>D</sub>)³', short: 'ley de T³', f: (p) => 12 * Math.pow(PI, 4) / 5 * RG * Math.pow(p.T / p.th, 3), unit: 'J/(mol K)', fmt: (v) => EM.sci(v, 7) },
      { k: 'nd', label: 'Frecuencia de corte de Debye <i>k</i><sub>B</sub>θ<sub>D</sub>/<i>h</i>', short: 'ν_D', f: (p) => KB * p.th / H * 1e-12, unit: 'THz', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Gas de electrones libres ---- */
  const so = (p) => { const n = p.n * 1e28, kF = Math.cbrt(3 * PI * PI * n), EF = HB * HB * kF * kF / (2 * ME); return { kF, EF }; };
  EM.formula('sommerfeld', {
    gx: 'n',
    params: [
      { k: 'n', label: 'Densidad de electrones de conducción <i>n</i> (Cu: 8.47; Na: 2.65; Al: 18.1)', min: 0.5, max: 30, value: 8.47, log: true, unit: '10²⁸ m⁻³', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'EF', label: 'Energía de Fermi <i>E</i><sub>F</sub> = ħ²(3π²<i>n</i>)<sup>2/3</sup>/(2<i>m</i>)', short: 'E_F', f: (p) => so(p).EF / QE, unit: 'eV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'TF', label: 'Temperatura de Fermi <i>E</i><sub>F</sub>/<i>k</i><sub>B</sub>', short: 'T_F', f: (p) => so(p).EF / KB, unit: 'K', fmt: (v) => EM.sci(v, 7) },
      { k: 'vF', label: 'Velocidad de Fermi ħ<i>k</i><sub>F</sub>/<i>m</i>', short: 'v_F', f: (p) => HB * so(p).kF / ME, unit: 'm/s', fmt: (v) => EM.sci(v, 7) },
      { k: 'kF', label: 'Número de onda de Fermi <i>k</i><sub>F</sub> = (3π²<i>n</i>)<sup>1/3</sup>', short: 'k_F', f: (p) => so(p).kF * 1e-10, unit: 'Å⁻¹', fmt: (v) => EM.sci(v, 7) },
      { k: 'g', label: 'Coeficiente del calor específico electrónico γ = π²<i>R</i>/(2<i>T</i><sub>F</sub>) (por mol de electrones)', short: 'γ', f: (p) => PI * PI * RG / (2 * so(p).EF / KB) * 1e3, unit: 'mJ/(mol K²)', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Kronig–Penney con deltas ---- */
  const KPf = (t, P) => Math.cos(t) + P * Math.sin(t) / t;
  const kp = (p) => {
    const a = p.a * 1e-9, al = p.al * QE * 1e-9, P = ME * al * a / (HB * HB);
    const root = (f, lo, hi) => { let flo = f(lo); for (let i = 0; i < 200; i++) { const mid = 0.5 * (lo + hi), fm = f(mid); if ((fm > 0) === (flo > 0)) { lo = mid; flo = fm; } else hi = mid; } return 0.5 * (lo + hi); };
    const t1 = root((t) => KPf(t, P) - 1, 1e-9, PI - 1e-12);
    let t = PI + 1e-9; const st = PI / 4000;
    while (KPf(t, P) < -1) t += st;
    const t3 = root((t2) => KPf(t2, P) + 1, t - st, t);
    const E0 = HB * HB / (2 * ME * a * a) / QE;
    return { P, E0, t1, t3 };
  };
  EM.formula('kp', {
    gx: 'al',
    params: [
      { k: 'a', label: 'Período de la red <i>a</i>', min: 0.1, max: 1, value: 0.3, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 4) },
      { k: 'al', label: 'Intensidad de cada delta α (potencial α δ(<i>x</i>))', min: 0.01, max: 10, value: 0.3, log: true, unit: 'eV·nm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'P', label: 'Parámetro adimensional <i>P</i> = <i>m</i>α<i>a</i>/ħ²', short: 'P', f: (p) => kp(p).P, fmt: (v) => EM.sci(v, 7) },
      { k: 'E1', label: 'Fondo de la primera banda (<i>k</i> = 0)', short: 'E_fondo', f: (p) => { const q = kp(p); return q.E0 * q.t1 * q.t1; }, unit: 'eV', fmt: (v) => EM.sci(v, 7) },
      { k: 'Et', label: 'Techo de la primera banda (<i>k</i> = π/<i>a</i>): ħ²π²/(2<i>ma</i>²) para todo α', short: 'E_techo', f: (p) => kp(p).E0 * PI * PI, unit: 'eV', fmt: (v) => EM.sci(v, 7) },
      { k: 'gap', label: 'Ancho de la primera brecha prohibida', short: 'brecha', f: (p) => { const q = kp(p); return q.E0 * (q.t3 * q.t3 - PI * PI); }, unit: 'eV', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'gw', label: 'Brecha de electrones casi libres 2α/<i>a</i> (válida si <i>P</i> ≪ 1)', short: '2α/a', f: (p) => 2 * p.al / p.a, unit: 'eV', fmt: (v) => EM.sci(v, 7) }
    ]
  });
})();
