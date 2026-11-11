/* Capítulo 39 — Cosmología */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, G = 6.67430e-11, C = 299792458, MPC = 3.0856775814913673e22, YR = 3.15576e7, MP = 1.67262192369e-27, KB = 1.380649e-23, HB = 1.054571817e-34, ME = 9.1093837015e-31, QE = 1.602176634e-19, BH = 13.605693123;
  const ZETA3 = 1.2020569031595942;

  /* ---- Densidad crítica ---- */
  const H0s = (h) => h * 1e3 / MPC;
  EM.formula('cos-hubble', {
    gx: 'h',
    params: [
      { k: 'h', label: 'Constante de Hubble <i>H</i><sub>0</sub> (Planck 2018: 67.4)', min: 40, max: 100, value: 67.4, unit: 'km/s/Mpc', fmt: (v) => EM.sci(v, 4) },
      { k: 'Om', label: 'Fracción de materia Ω<sub>m</sub> (0.315)', min: 0.05, max: 1, value: 0.315, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'rc', label: 'Densidad crítica ρ<sub>c</sub> = 3<i>H</i>₀²/(8π<i>G</i>)', short: 'ρ_c', f: (p) => 3 * Math.pow(H0s(p.h), 2) / (8 * PI * G) * 1e27, unit: '10⁻²⁷ kg/m³', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'np', label: 'Equivalente en protones por metro cúbico ρ<sub>c</sub>/<i>m</i><sub>p</sub>', short: 'protones/m³', f: (p) => 3 * Math.pow(H0s(p.h), 2) / (8 * PI * G) / MP, fmt: (v) => EM.sci(v, 7) },
      { k: 'rm', label: 'Densidad media de materia Ω<sub>m</sub>ρ<sub>c</sub>', short: 'ρ_m', f: (p) => p.Om * 3 * Math.pow(H0s(p.h), 2) / (8 * PI * G) * 1e27, unit: '10⁻²⁷ kg/m³', fmt: (v) => EM.sci(v, 7) },
      { k: 'tH', label: 'Tiempo de Hubble 1/<i>H</i>₀', short: '1/H₀', f: (p) => 1 / H0s(p.h) / YR * 1e-9, unit: 'mil millones de años', fmt: (v) => EM.sci(v, 8) },
      { k: 'dH', label: 'Radio de Hubble <i>c</i>/<i>H</i>₀', short: 'c/H₀', f: (p) => C / H0s(p.h) / MPC, unit: 'Mpc', fmt: (v) => EM.sci(v, 8) }
    ]
  });

  /* ---- Edad del universo plano con materia y Λ ---- */
  EM.formula('cos-edad', {
    gx: 'Om',
    params: [
      { k: 'h', label: 'Constante de Hubble <i>H</i><sub>0</sub>', min: 40, max: 100, value: 67.4, unit: 'km/s/Mpc', fmt: (v) => EM.sci(v, 4) },
      { k: 'Om', label: 'Fracción de materia Ω<sub>m</sub> (Ω<sub>Λ</sub> = 1 − Ω<sub>m</sub>)', min: 0.05, max: 0.98, value: 0.315, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 't0', label: 'Edad <i>t</i><sub>0</sub> = [2/(3<i>H</i>₀√Ω<sub>Λ</sub>)] arcsenh√(Ω<sub>Λ</sub>/Ω<sub>m</sub>)', short: 't₀', f: (p) => 2 / (3 * H0s(p.h) * Math.sqrt(1 - p.Om)) * Math.asinh(Math.sqrt((1 - p.Om) / p.Om)) / YR * 1e-9, unit: 'mil millones de años', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'eds', label: 'Edad de un universo solo con materia 2/(3<i>H</i>₀)', short: 't_EdS', f: (p) => 2 / (3 * H0s(p.h)) / YR * 1e-9, unit: 'mil millones de años', fmt: (v) => EM.sci(v, 8) },
      { k: 'H0t', label: 'Producto adimensional <i>H</i>₀<i>t</i>₀', short: 'H₀t₀', f: (p) => 2 / (3 * Math.sqrt(1 - p.Om)) * Math.asinh(Math.sqrt((1 - p.Om) / p.Om)), fmt: (v) => EM.sci(v, 8) },
      { k: 'q0', label: 'Parámetro de deceleración <i>q</i>₀ = Ω<sub>m</sub>/2 − Ω<sub>Λ</sub>', short: 'q₀', f: (p) => p.Om / 2 - (1 - p.Om), fmt: (v) => EM.sci(v, 7) }
    ]
  });

  /* ---- Distancias cosmológicas (universo plano) ---- */
  const simpson = (f, a, b, n) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
  const dis = (p) => {
    const E = (z) => Math.sqrt(p.Om * Math.pow(1 + z, 3) + 1 - p.Om);
    const n = 2000, I = simpson((z) => 1 / E(z), 0, p.z, n), Lb = simpson((z) => 1 / ((1 + z) * E(z)), 0, p.z, n);
    const dH = C / H0s(p.h) / MPC;
    return { dC: dH * I, dL: (1 + p.z) * dH * I, dA: dH * I / (1 + p.z), tl: Lb / H0s(p.h) / YR * 1e-9 };
  };
  EM.formula('cos-distancias', {
    gx: 'z',
    params: [
      { k: 'z', label: 'Corrimiento al rojo <i>z</i>', min: 0.01, max: 10, value: 1, log: true, fmt: (v) => EM.sci(v, 5) },
      { k: 'h', label: 'Constante de Hubble <i>H</i><sub>0</sub>', min: 40, max: 100, value: 67.4, unit: 'km/s/Mpc', fmt: (v) => EM.sci(v, 4) },
      { k: 'Om', label: 'Fracción de materia Ω<sub>m</sub> (universo plano)', min: 0.05, max: 1, value: 0.315, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'dC', label: 'Distancia comóvil <i>d</i><sub>C</sub> = (<i>c</i>/<i>H</i>₀)∫d<i>z</i>/<i>E</i>(<i>z</i>)', short: 'd_C', f: (p) => dis(p).dC, unit: 'Mpc', fmt: (v) => EM.sci(v, 8) },
      { k: 'dL', label: 'Distancia de luminosidad <i>d</i><sub>L</sub> = (1 + <i>z</i>)<i>d</i><sub>C</sub>', short: 'd_L', f: (p) => dis(p).dL, unit: 'Mpc', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'dA', label: 'Distancia de diámetro angular <i>d</i><sub>A</sub> = <i>d</i><sub>C</sub>/(1 + <i>z</i>)', short: 'd_A', f: (p) => dis(p).dA, unit: 'Mpc', fmt: (v) => EM.sci(v, 8) },
      { k: 'tl', label: 'Tiempo de retrospección (1/<i>H</i>₀)∫d<i>z</i>/[(1 + <i>z</i>)<i>E</i>]', short: 't_retro', f: (p) => dis(p).tl, unit: 'mil millones de años', fmt: (v) => EM.sci(v, 8) }
    ]
  });

  /* ---- Fondo cósmico de microondas ---- */
  EM.formula('cos-cmb', {
    gx: 'z',
    params: [
      { k: 'T0', label: 'Temperatura actual <i>T</i><sub>0</sub> (2.7255 K)', min: 2, max: 4, value: 2.7255, fmt: (v) => EM.sci(v, 5), unit: 'K' },
      { k: 'z', label: 'Corrimiento al rojo <i>z</i>', min: 0, max: 1500, value: 0, fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'T', label: 'Temperatura <i>T</i>(<i>z</i>) = <i>T</i>₀(1 + <i>z</i>)', short: 'T(z)', f: (p) => p.T0 * (1 + p.z), unit: 'K', fmt: (v) => EM.sci(v, 8) },
      { k: 'n', label: 'Densidad de fotones <i>n</i>γ = (2ζ(3)/π²)(<i>kT</i>/ħ<i>c</i>)³', short: 'n_γ', f: (p) => 2 * ZETA3 / (PI * PI) * Math.pow(KB * p.T0 * (1 + p.z) / (HB * C), 3) * 1e-6, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'u', label: 'Densidad de energía <i>u</i> = π²(<i>kT</i>)⁴/(15ħ³<i>c</i>³)', short: 'u', f: (p) => PI * PI * Math.pow(KB * p.T0 * (1 + p.z), 4) / (15 * Math.pow(HB * C, 3)) * 1e14, unit: '10⁻¹⁴ J/m³', fmt: (v) => EM.sci(v, 8) },
      { k: 'Og', label: 'Parámetro de densidad de fotones hoy Ω<sub>γ</sub><i>h</i>²', short: 'Ω_γh²', f: (p) => PI * PI * Math.pow(KB * p.T0, 4) / (15 * Math.pow(HB * C, 3)) / (C * C) / (3 * Math.pow(100e3 / MPC, 2) / (8 * PI * G)) * 1e5, unit: '10⁻⁵', fmt: (v) => EM.sci(v, 8) },
      { k: 'E', label: 'Energía media de un fotón 2.701 <i>kT</i>', short: '⟨E⟩', f: (p) => 2.7011780 * KB * p.T0 * (1 + p.z) / QE * 1e3, unit: 'meV', fmt: (v) => EM.sci(v, 8) }
    ]
  });

  /* ---- Recombinación: ecuación de Saha ---- */
  const sa = (p) => {
    const T = 2.7255 * (1 + p.z), ng = 2 * ZETA3 / (PI * PI) * Math.pow(KB * T / (HB * C), 3), nb = p.eta * 1e-10 * ng;
    const S = (1 / nb) * Math.pow(ME * KB * T / (2 * PI * HB * HB), 1.5) * Math.exp(-BH * QE / (KB * T));
    return { T, S, x: 2 * S / (S + Math.sqrt(S * S + 4 * S)) };
  };
  EM.formula('cos-saha', {
    gx: 'z',
    params: [
      { k: 'eta', label: 'Razón bariones/fotones η (Planck: 6.1×10⁻¹⁰)', min: 1, max: 20, value: 6.1, unit: '10⁻¹⁰', fmt: (v) => EM.sci(v, 4) },
      { k: 'z', label: 'Corrimiento al rojo <i>z</i>', min: 800, max: 2500, value: 1380, fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'T', label: 'Temperatura <i>T</i> = 2.7255 (1 + <i>z</i>)', short: 'T', f: (p) => sa(p).T, unit: 'K', fmt: (v) => EM.sci(v, 8) },
      { k: 'S', label: 'Lado derecho de Saha <i>S</i> = (1/<i>n</i>b)(<i>m</i>e<i>kT</i>/2πħ²)<sup>3/2</sup> e<sup>−<i>B</i>/<i>kT</i></sup>', short: 'S', f: (p) => sa(p).S, fmt: (v) => EM.sci(v, 8) },
      { k: 'x', label: 'Fracción ionizada <i>x</i> = [−<i>S</i> + √(<i>S</i>² + 4<i>S</i>)]/2', short: 'x_e', f: (p) => sa(p).x, fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'kB', label: 'Cociente <i>kT</i>/<i>B</i> (<i>B</i> = 13.606 eV)', short: 'kT/B', f: (p) => KB * sa(p).T / (BH * QE), fmt: (v) => EM.sci(v, 8) }
    ]
  });
})();
