/* Capítulo 38 — Estructura y evolución estelar */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, G = 6.67430e-11, C = 299792458, HB = 1.054571817e-34, ME = 9.1093837015e-31, MU = 1.66053906660e-27, KB = 1.380649e-23, MS = 1.98841e30, RS = 6.957e8, LS = 3.828e26, SIGT = 6.6524587321e-29, MP = 1.67262192369e-27, YR = 3.15576e7, RE = 6.371e6;

  /* Lane–Emden por Runge–Kutta de 4.º orden */
  const cache = {};
  const lane = (n) => {
    const key = n.toFixed(10);
    if (cache[key]) return cache[key];
    const f = (x, th, dth) => [dth, -2 * dth / x - Math.pow(Math.max(th, 0), n)];
    let x = 1e-5, th = 1 - x * x / 6 + n * Math.pow(x, 4) / 120, dth = -x / 3 + n * Math.pow(x, 3) / 30;
    const h = 2e-3;
    for (let it = 0; it < 200000; it++) {
      const k1 = f(x, th, dth), k2 = f(x + h / 2, th + h / 2 * k1[0], dth + h / 2 * k1[1]), k3 = f(x + h / 2, th + h / 2 * k2[0], dth + h / 2 * k2[1]), k4 = f(x + h, th + h * k3[0], dth + h * k3[1]);
      const th2 = th + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), dth2 = dth + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      if (th2 <= 0) {
        /* interpolar el cero con Hermite cúbico y refinar por bisección en [0, h] */
        let lo = 0, hi = h;
        const H = (s) => { const t = s / h, h00 = 2 * t * t * t - 3 * t * t + 1, h10 = t * t * t - 2 * t * t + t, h01 = -2 * t * t * t + 3 * t * t, h11 = t * t * t - t * t; return [h00 * th + h10 * h * dth + h01 * th2 + h11 * h * dth2, (6 * t * t - 6 * t) / h * th + (3 * t * t - 4 * t + 1) * dth + (-6 * t * t + 6 * t) / h * th2 + (3 * t * t - 2 * t) * dth2]; };
        for (let b = 0; b < 80; b++) { const mid = 0.5 * (lo + hi); if (H(mid)[0] > 0) lo = mid; else hi = mid; }
        const s = 0.5 * (lo + hi), xi1 = x + s, d1 = H(s)[1];
        return (cache[key] = { xi: xi1, m: -xi1 * xi1 * d1, d: d1 });
      }
      x += h; th = th2; dth = dth2;
    }
    return (cache[key] = { xi: NaN, m: NaN, d: NaN });
  };

  /* ---- Politropos ---- */
  const po = (p) => {
    const le = lane(p.n), M = p.M * MS, R = p.R * RS, rb = M / (4 / 3 * PI * R * R * R), rc = le.xi * le.xi * le.xi / (3 * le.m) * rb;
    const Pc = G * M * M / Math.pow(R, 4) / (4 * PI * (p.n + 1) * le.d * le.d);
    return { le, rb, rc, Pc, Tc: Pc * p.mu * MU / (rc * KB) };
  };
  EM.formula('est-politropo', {
    gx: 'n',
    params: [
      { k: 'n', label: 'Índice politrópico <i>n</i> (Sol: ≈ 3; enana blanca no relativista: 1.5)', min: 0.5, max: 4.5, value: 3, fmt: (v) => EM.sci(v, 4) },
      { k: 'M', label: 'Masa de la estrella <i>M</i>', min: 0.1, max: 100, value: 1, log: true, unit: 'M☉', fmt: (v) => EM.sci(v, 4) },
      { k: 'R', label: 'Radio de la estrella <i>R</i>', min: 0.1, max: 100, value: 1, log: true, unit: 'R☉', fmt: (v) => EM.sci(v, 4) },
      { k: 'mu', label: 'Peso molecular medio μ (gas ionizado del Sol: 0.61)', min: 0.5, max: 2.2, value: 0.61, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'xi', label: 'Primer cero de la ecuación de Lane–Emden ξ₁', short: 'ξ₁', f: (p) => po(p).le.xi, fmt: (v) => EM.sci(v, 8) },
      { k: 'rr', label: 'Cociente de densidades ρ<sub>c</sub>/ρ̄ = ξ₁/(3|θ′(ξ₁)|)', short: 'ρc/ρ̄', f: (p) => po(p).rc / po(p).rb, fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'rc', label: 'Densidad central ρ<sub>c</sub>', short: 'ρ_c', f: (p) => po(p).rc * 1e-3, unit: 'g/cm³', fmt: (v) => EM.sci(v, 7) },
      { k: 'Pc', label: 'Presión central <i>P</i><sub>c</sub> = <i>GM</i>²/[4π(<i>n</i> + 1)θ′²<i>R</i>⁴]', short: 'P_c', f: (p) => po(p).Pc * 1e-16, unit: '10¹⁶ Pa', fmt: (v) => EM.sci(v, 7) },
      { k: 'Tc', label: 'Temperatura central <i>T</i><sub>c</sub> = <i>P</i><sub>c</sub>μ<i>m</i><sub>u</sub>/(ρ<sub>c</sub><i>k</i>)', short: 'T_c', f: (p) => po(p).Tc * 1e-6, unit: 'MK', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Escalas de tiempo ---- */
  EM.formula('est-tiempos', {
    gx: 'M',
    params: [
      { k: 'M', label: 'Masa <i>M</i>', min: 0.1, max: 100, value: 1, log: true, unit: 'M☉', fmt: (v) => EM.sci(v, 4) },
      { k: 'R', label: 'Radio <i>R</i>', min: 0.1, max: 100, value: 1, log: true, unit: 'R☉', fmt: (v) => EM.sci(v, 4) },
      { k: 'L', label: 'Luminosidad <i>L</i>', min: 0.001, max: 1e6, value: 1, log: true, unit: 'L☉', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'tff', label: 'Tiempo de caída libre <i>t</i><sub>ff</sub> = √(3π/32<i>G</i>ρ̄)', short: 't_ff', f: (p) => Math.sqrt(3 * PI / (32 * G * (p.M * MS) / (4 / 3 * PI * Math.pow(p.R * RS, 3)))) / 60, unit: 'min', fmt: (v) => EM.sci(v, 7) },
      { k: 'tkh', label: 'Tiempo de Kelvin–Helmholtz <i>t</i><sub>KH</sub> = <i>GM</i>²/(<i>RL</i>)', short: 't_KH', f: (p) => G * Math.pow(p.M * MS, 2) / (p.R * RS * p.L * LS) / YR * 1e-6, unit: 'millones de años', fmt: (v) => EM.sci(v, 7) },
      { k: 'tn', label: 'Tiempo nuclear <i>t</i><sub>nuc</sub> = 0.1 · 0.007 <i>Mc</i>²/<i>L</i>', short: 't_nuc', f: (p) => 0.1 * 0.007 * p.M * MS * C * C / (p.L * LS) / YR * 1e-9, unit: 'miles de millones de años', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'dm', label: 'Masa convertida en energía por segundo <i>L</i>/<i>c</i>²', short: 'dm/dt', f: (p) => p.L * LS / (C * C) * 1e-9, unit: '10⁹ kg/s', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Enana blanca ---- */
  const XI15 = 3.653753736219058, M15 = 2.7140551201111798;
  const wd = (p) => {
    const K = Math.pow(3 * PI * PI, 2 / 3) * HB * HB / (5 * ME * Math.pow(p.mue * MU, 5 / 3)), M = p.M * MS;
    const a = 5 * K / (8 * PI * G) * Math.cbrt(4 * PI * M15) * Math.pow(M, -1 / 3);
    return { R: XI15 * a, rc: M / (4 * PI * M15 * a * a * a) };
  };
  EM.formula('est-enana', {
    gx: 'M',
    params: [
      { k: 'M', label: 'Masa de la enana blanca <i>M</i> (Sirius B: 1.02 M☉)', min: 0.1, max: 1.38, value: 0.6, fmt: (v) => EM.sci(v, 4), unit: 'M☉' },
      { k: 'mue', label: 'Nucleones por electrón μ<sub>e</sub> (He, C, O: 2)', min: 1.8, max: 2.3, value: 2, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'R', label: 'Radio <i>R</i> ∝ <i>M</i><sup>−1/3</sup> (politropo <i>n</i> = 3/2)', short: 'R', f: (p) => wd(p).R * 1e-3, unit: 'km', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'RE', label: 'Radio en radios terrestres', short: 'R/R⊕', f: (p) => wd(p).R / RE, fmt: (v) => EM.sci(v, 7) },
      { k: 'rc', label: 'Densidad central ρ<sub>c</sub>', short: 'ρ_c', f: (p) => wd(p).rc * 1e-3 * 1e-6, unit: '10⁶ g/cm³', fmt: (v) => EM.sci(v, 7) },
      { k: 'RS', label: 'Radio en radios solares', short: 'R/R☉', f: (p) => wd(p).R / RS, fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Chandrasekhar ---- */
  const M3 = 2.0182359509743866;
  const ch = (p) => { const K = Math.cbrt(3 * PI * PI) * HB * C / (4 * Math.pow(p.mue * MU, 4 / 3)); return 4 * PI * Math.pow(K / (PI * G), 1.5) * M3; };
  EM.formula('est-chandra', {
    gx: 'mue',
    params: [
      { k: 'mue', label: 'Nucleones por electrón μ<sub>e</sub> (He, C, O: 2; ⁵⁶Fe: 2.154)', min: 1.8, max: 2.4, value: 2, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'M', label: 'Masa límite <i>M</i><sub>Ch</sub> = (√(3π)/2) ω₃ (ħ<i>c</i>/<i>G</i>)<sup>3/2</sup>/(μ<sub>e</sub><i>m</i><sub>u</sub>)²', short: 'M_Ch', f: (p) => ch(p) / MS, unit: 'M☉', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'ap', label: 'Aproximación 5.83/μ<sub>e</sub>²', short: '5.83/μe²', f: (p) => 5.83 / (p.mue * p.mue), unit: 'M☉', fmt: (v) => EM.sci(v, 7) },
      { k: 'K', label: 'Constante de la ecuación de estado <i>K</i> en <i>P</i> = <i>K</i>ρ<sup>4/3</sup>', short: 'K', f: (p) => Math.cbrt(3 * PI * PI) * HB * C / (4 * Math.pow(p.mue * MU, 4 / 3)) * 1e-9, unit: '10⁹ SI', fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Límite de Eddington ---- */
  EM.formula('est-eddington', {
    gx: 'M',
    params: [
      { k: 'M', label: 'Masa del objeto <i>M</i>', min: 0.1, max: 1e9, value: 1, log: true, unit: 'M☉', fmt: (v) => EM.sci(v, 4) },
      { k: 'ka', label: 'Opacidad κ por unidad de masa (dispersión Thomson, H: 0.0397726 m²/kg)', min: 0.01, max: 1, value: 0.0397726, log: true, unit: 'm²/kg', fmt: (v) => EM.sci(v, 4) },
      { k: 'eta', label: 'Eficiencia de acreción η (agujero negro: ≈ 0.1)', min: 0.01, max: 0.4, value: 0.1, fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'L', label: 'Luminosidad de Eddington <i>L</i><sub>Edd</sub> = 4π<i>GMc</i>/κ', short: 'L_Edd', f: (p) => 4 * PI * G * p.M * MS * C / p.ka * 1e-31, unit: '10³¹ W', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'Ls', label: '<i>L</i><sub>Edd</sub> en luminosidades solares', short: 'L_Edd/L☉', f: (p) => 4 * PI * G * p.M * MS * C / p.ka / LS, fmt: (v) => EM.sci(v, 7) },
      { k: 'Mdot', label: 'Tasa de acreción que produce <i>L</i><sub>Edd</sub>: <i>L</i>/(η<i>c</i>²)', short: 'dM/dt', f: (p) => 4 * PI * G * p.M * MS * C / p.ka / (p.eta * C * C) / MS * YR * 1e9, unit: '10⁻⁹ M☉/año', fmt: (v) => EM.sci(v, 7) },
      { k: 'ts', label: 'Tiempo de crecimiento exponencial (de Salpeter) η<i>c</i>κ/(4π<i>G</i>(1 − η))', short: 't_Salpeter', f: (p) => p.eta * C * p.ka / (4 * PI * G * (1 - p.eta)) / YR * 1e-6, unit: 'millones de años', fmt: (v) => EM.sci(v, 7) }
    ]
  });
})();
