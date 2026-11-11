/* Capítulo 17 — Teoría cinética de los gases */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, kB = 1.380649e-23, NA = 6.02214076e23, qe = 1.602176634e-19, R = kB * NA;
  const mass = (M) => M * 1e-3 / NA;

  EM.formula('presion-cinetica', {
    gx: 'T',
    params: [
      { k: 'T', label: 'Temperatura <i>T</i>', min: 50, max: 3000, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'M', label: 'Masa molar <i>M</i>', min: 2, max: 200, value: 28.0134, log: true, unit: 'g/mol', fmt: (v) => EM.sci(v, 5) },
      { k: 'p', label: 'Presión <i>p</i>', min: 0.001, max: 1e4, value: 101.325, log: true, unit: 'kPa', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'vrms', label: 'Velocidad cuadrática media <i>v</i><sub>rms</sub> = √(3<i>kT</i>/<i>m</i>)', short: 'v rms', f: (p) => Math.sqrt(3 * kB * p.T / mass(p.M)), unit: 'm/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'Ek', label: 'Energía cinética media de traslación (3/2)<i>kT</i>', short: 'E cinética', f: (p) => 1.5 * kB * p.T / qe, unit: 'eV', fmt: (v) => EM.sci(v, 5) },
      { k: 'n', label: 'Densidad numérica <i>n</i> = <i>p</i>/(<i>kT</i>)', short: 'n', f: (p) => p.p * 1e3 / (kB * p.T), unit: 'm⁻³', fmt: (v) => EM.sci(v, 5) },
      { k: 'rho', label: 'Densidad másica ρ = <i>pM</i>/(<i>RT</i>)', short: 'ρ', f: (p) => p.p * 1e3 * p.M * 1e-3 / (R * p.T), unit: 'kg/m³', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const vs = (p) => { const m = mass(p.M); return { vp: Math.sqrt(2 * kB * p.T / m), vm: Math.sqrt(8 * kB * p.T / (PI * m)), vr: Math.sqrt(3 * kB * p.T / m) }; };
  EM.formula('maxwell', {
    gx: 'T',
    params: [
      { k: 'T', label: 'Temperatura <i>T</i>', min: 50, max: 3000, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'M', label: 'Masa molar <i>M</i>', min: 1, max: 200, value: 28.0134, log: true, unit: 'g/mol', fmt: (v) => EM.sci(v, 5) },
      { k: 'v0', label: 'Velocidad umbral <i>v</i>₀', min: 10, max: 20000, value: 1000, log: true, unit: 'm/s', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'vp', label: 'Velocidad más probable <i>v</i><sub>p</sub> = √(2<i>kT</i>/<i>m</i>)', short: 'v más probable', f: (p) => vs(p).vp, unit: 'm/s', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'vm', label: 'Velocidad media <i>v̄</i> = √(8<i>kT</i>/π<i>m</i>)', short: 'v media', f: (p) => vs(p).vm, unit: 'm/s', fmt: (v) => EM.sci(v, 6) },
      { k: 'vr', label: 'Velocidad cuadrática media <i>v</i><sub>rms</sub> = √(3<i>kT</i>/<i>m</i>)', short: 'v rms', f: (p) => vs(p).vr, unit: 'm/s', fmt: (v) => EM.sci(v, 6) },
      { k: 'fr', label: 'Fracción de moléculas con <i>v</i> > <i>v</i>₀: erfc(<i>x</i>) + (2/√π)<i>x</i>e<sup>−<i>x</i>²</sup>, <i>x</i> = <i>v</i>₀/<i>v</i><sub>p</sub>', short: 'fracción v > v₀', f: (p) => { const x = p.v0 / vs(p).vp; return EM.erfc(x) + 2 / Math.sqrt(PI) * x * Math.exp(-x * x); }, fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const eqp = (p) => { const Cv = p.f / 2 * R, g = (p.f + 2) / p.f; return { Cv, g, U: p.f / 2 * R * p.T, c: Math.sqrt(g * R * p.T / (p.M * 1e-3)) }; };
  EM.formula('equiparticion', {
    gx: 'f',
    params: [
      { k: 'f', label: 'Términos cuadráticos activos por molécula <i>f</i> (3, 5, 6, 7…)', min: 1, max: 12, value: 5, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 50, max: 2000, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'M', label: 'Masa molar <i>M</i>', min: 2, max: 200, value: 28.0134, log: true, unit: 'g/mol', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'Cv', label: 'Calor molar <i>C</i><sub>v</sub> = (<i>f</i>/2)<i>R</i>', short: 'C_v', f: (p) => eqp(p).Cv, unit: 'J/(mol·K)', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'g', label: 'Índice adiabático γ = (<i>f</i> + 2)/<i>f</i>', short: 'γ', f: (p) => eqp(p).g, fmt: (v) => EM.sci(v, 6) },
      { k: 'U', label: 'Energía interna molar <i>U</i> = (<i>f</i>/2)<i>RT</i>', short: 'U molar', f: (p) => eqp(p).U, unit: 'J/mol', fmt: (v) => EM.sci(v, 6) },
      { k: 'c', label: 'Velocidad del sonido √(γ<i>RT</i>/<i>M</i>)', short: 'c sonido', f: (p) => eqp(p).c, unit: 'm/s', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const cl = (p) => { const m = mass(p.M), n = p.p * 1e3 / (kB * p.T), vb = Math.sqrt(8 * kB * p.T / (PI * m)), d = p.d * 1e-10, lam = 1 / (Math.SQRT2 * n * PI * d * d); return { m, n, vb, lam, nu: vb / lam, eta: n * m * vb * lam / 3 }; };
  EM.formula('camino-libre', {
    gx: 'p',
    params: [
      { k: 'T', label: 'Temperatura <i>T</i>', min: 50, max: 2000, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'd', label: 'Diámetro molecular efectivo <i>d</i>', min: 1.5, max: 8, value: 3.7, unit: 'Å', fmt: (v) => EM.sci(v, 4) },
      { k: 'p', label: 'Presión <i>p</i>', min: 1e-9, max: 1e4, value: 101.325, log: true, unit: 'kPa', fmt: (v) => EM.sci(v, 5) },
      { k: 'M', label: 'Masa molar <i>M</i>', min: 2, max: 200, value: 28.0134, log: true, unit: 'g/mol', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'lam', label: 'Camino libre medio λ = <i>kT</i>/(√2 π<i>d</i>²<i>p</i>)', short: 'λ', f: (p) => cl(p).lam * 1e9, unit: 'nm', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'nu', label: 'Frecuencia de colisión ν = <i>v̄</i>/λ', short: 'ν de colisión', f: (p) => cl(p).nu, unit: 's⁻¹', fmt: (v) => EM.sci(v, 5) },
      { k: 'vb', label: 'Velocidad media <i>v̄</i>', short: 'v media', f: (p) => cl(p).vb, unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'eta', label: 'Viscosidad (modelo elemental) η = (1/3)<i>nmv̄</i>λ', short: 'η', f: (p) => cl(p).eta * 1e6, unit: 'µPa·s', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const ef = (p) => { const m = mass(p.M), vb = Math.sqrt(8 * kB * p.T / (PI * m)), Phi = p.p / Math.sqrt(2 * PI * m * kB * p.T); return { vb, Phi, Nd: Phi * p.A * 1e-6, tau: 4 * p.V * 1e-3 / (p.A * 1e-6 * vb) }; };
  EM.formula('efusion', {
    gx: 'M',
    params: [
      { k: 'M', label: 'Masa molar <i>M</i>', min: 2, max: 350, value: 28.0134, log: true, unit: 'g/mol', fmt: (v) => EM.sci(v, 5) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 100, max: 2000, value: 300, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'p', label: 'Presión <i>p</i>', min: 1e-3, max: 1e6, value: 1, log: true, unit: 'Pa', fmt: (v) => EM.sci(v, 5) },
      { k: 'A', label: 'Área del orificio <i>A</i>', min: 1e-3, max: 100, value: 1, log: true, unit: 'mm²', fmt: (v) => EM.sci(v, 4) },
      { k: 'V', label: 'Volumen del recipiente <i>V</i>', min: 0.1, max: 100, value: 1, log: true, unit: 'L', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'Phi', label: 'Flujo por unidad de área Φ = <i>p</i>/√(2π<i>mkT</i>) = <i>nv̄</i>/4', short: 'Φ', f: (p) => ef(p).Phi, unit: 'm⁻²·s⁻¹', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'Nd', label: 'Moléculas que escapan por segundo Φ<i>A</i>', short: 'dN/dt', f: (p) => ef(p).Nd, unit: 's⁻¹', fmt: (v) => EM.sci(v, 6) },
      { k: 'tau', label: 'Tiempo característico de vaciado τ = 4<i>V</i>/(<i>Av̄</i>)', short: 'τ de vaciado', f: (p) => ef(p).tau, unit: 's', fmt: (v) => EM.sci(v, 6) },
      { k: 'vb', label: 'Velocidad media <i>v̄</i>', short: 'v media', f: (p) => ef(p).vb, unit: 'm/s', fmt: (v) => EM.sci(v, 6) }
    ]
  });
})();
