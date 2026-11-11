/* Capítulo 22 — Magnetostática e inducción */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, MU0 = 1.25663706212e-6, qe = 1.602176634e-19, me = 9.1093837015e-31, hb = 1.054571817e-34, hP = 6.62607015e-34, AMU = 1.66053906660e-27;
  const muB = qe * hb / (2 * me);

  const lp = (p) => { const R = p.R * 1e-2, z = p.z * 1e-2, B1 = (zz) => MU0 * p.N * p.I * R * R / (2 * Math.pow(R * R + zz * zz, 1.5)); return { R, z, B1, Bz: B1(z) }; };
  EM.formula('espira', {
    gx: 'z',
    params: [
      { k: 'N', label: 'Número de espiras <i>N</i>', min: 1, max: 1000, value: 100, log: true, fmt: (v) => EM.sci(v, 3) },
      { k: 'I', label: 'Corriente <i>I</i>', min: 0.01, max: 100, value: 1, log: true, unit: 'A', fmt: (v) => EM.sci(v, 3) },
      { k: 'R', label: 'Radio de la espira <i>R</i>', min: 1, max: 50, value: 5, log: true, unit: 'cm', fmt: (v) => EM.sci(v, 3) },
      { k: 'z', label: 'Distancia al centro sobre el eje <i>z</i>', min: 0, max: 100, value: 5, unit: 'cm', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'Bz', label: 'Campo sobre el eje <i>B</i>(<i>z</i>) = μ₀<i>NIR</i>²/[2(<i>R</i>² + <i>z</i>²)<sup>3/2</sup>]', short: 'B(z)', f: (p) => lp(p).Bz * 1e3, unit: 'mT', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'B0', label: 'Campo en el centro μ₀<i>NI</i>/(2<i>R</i>)', short: 'B centro', f: (p) => MU0 * p.N * p.I / (2 * p.R * 1e-2) * 1e3, unit: 'mT', fmt: (v) => EM.sci(v, 5) },
      { k: 'BH', label: 'Par de bobinas de Helmholtz (separadas <i>R</i>) en el centro (4/5)<sup>3/2</sup>μ₀<i>NI</i>/<i>R</i>', short: 'B Helmholtz', f: (p) => Math.pow(0.8, 1.5) * MU0 * p.N * p.I / (p.R * 1e-2) * 1e3, unit: 'mT', fmt: (v) => EM.sci(v, 5) },
      { k: 'rat', label: 'Cociente <i>B</i>(<i>z</i>)/<i>B</i>(0) = (1 + <i>z</i>²/<i>R</i>²)<sup>−3/2</sup>', short: 'B(z)/B(0)', f: (p) => Math.pow(1 + Math.pow(p.z / p.R, 2), -1.5), fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const so = (p) => { const l = p.l * 1e-2, R = p.R * 1e-2, Bl = MU0 * p.N * p.I / l, L = MU0 * p.N * p.N * PI * R * R / l; return { l, R, Bl, L }; };
  EM.formula('solenoide', {
    gx: 'N',
    params: [
      { k: 'N', label: 'Número de espiras <i>N</i>', min: 10, max: 10000, value: 500, log: true, fmt: (v) => EM.sci(v, 4) },
      { k: 'l', label: 'Longitud del solenoide ℓ', min: 1, max: 200, value: 20, log: true, unit: 'cm', fmt: (v) => EM.sci(v, 3) },
      { k: 'R', label: 'Radio <i>R</i>', min: 0.5, max: 20, value: 2, log: true, unit: 'cm', fmt: (v) => EM.sci(v, 3) },
      { k: 'I', label: 'Corriente <i>I</i>', min: 0.01, max: 50, value: 2, log: true, unit: 'A', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'Bl', label: 'Campo interior (solenoide largo) <i>B</i> = μ₀<i>NI</i>/ℓ', short: 'B interior', f: (p) => so(p).Bl * 1e3, unit: 'mT', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'Bc', label: 'Campo en el centro, longitud finita μ₀<i>NI</i>/√(ℓ² + 4<i>R</i>²)', short: 'B en el centro', f: (p) => MU0 * p.N * p.I / Math.sqrt(Math.pow(so(p).l, 2) + 4 * Math.pow(so(p).R, 2)) * 1e3, unit: 'mT', fmt: (v) => EM.sci(v, 5) },
      { k: 'L', label: 'Autoinducción <i>L</i> = μ₀<i>N</i>²π<i>R</i>²/ℓ', short: 'L', f: (p) => so(p).L * 1e3, unit: 'mH', fmt: (v) => EM.sci(v, 5) },
      { k: 'U', label: 'Energía magnética ½<i>LI</i>²', short: 'U', f: (p) => 0.5 * so(p).L * p.I * p.I * 1e3, unit: 'mJ', fmt: (v) => EM.sci(v, 5) },
      { k: 'u', label: 'Densidad de energía <i>B</i>²/(2μ₀)', short: 'u', f: (p) => Math.pow(so(p).Bl, 2) / (2 * MU0), unit: 'J/m³', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const cy = (p) => { const m = p.M * AMU, q = p.zq * qe, E = p.E * 1e3 * qe, v = Math.sqrt(2 * E / m); return { m, q, v }; };
  EM.formula('ciclotron', {
    gx: 'B',
    params: [
      { k: 'M', label: 'Masa de la partícula (protón 1.00728, electrón 5.4858×10⁻⁴)', min: 5e-4, max: 250, value: 1.007276, log: true, unit: 'u', fmt: (v) => EM.sci(v, 5) },
      { k: 'zq', label: 'Carga en unidades de <i>e</i>', min: 1, max: 10, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'E', label: 'Energía cinética', min: 0.001, max: 1e6, value: 1, log: true, unit: 'keV', fmt: (v) => EM.sci(v, 4) },
      { k: 'B', label: 'Campo magnético <i>B</i>', min: 1e-5, max: 20, value: 1, log: true, unit: 'T', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'r', label: 'Radio de giro <i>r</i> = <i>mv</i>/(<i>qB</i>)', short: 'radio de giro', f: (p) => cy(p).m * cy(p).v / (cy(p).q * p.B) * 1e3, unit: 'mm', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'f', label: 'Frecuencia de ciclotrón <i>f</i> = <i>qB</i>/(2π<i>m</i>)', short: 'f ciclotrón', f: (p) => cy(p).q * p.B / (2 * PI * cy(p).m) * 1e-6, unit: 'MHz', fmt: (v) => EM.sci(v, 5) },
      { k: 'v', label: 'Velocidad (no relativista) √(2<i>E</i>/<i>m</i>)', short: 'v', f: (p) => cy(p).v, unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'T', label: 'Periodo 2π<i>m</i>/(<i>qB</i>)', short: 'periodo', f: (p) => 2 * PI * cy(p).m / (cy(p).q * p.B) * 1e9, unit: 'ns', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const fa = (p) => { const w = 2 * PI * p.f; return { w, ep: p.N * p.B * p.A * 1e-4 * w }; };
  EM.formula('generador', {
    gx: 'f',
    params: [
      { k: 'N', label: 'Número de espiras <i>N</i>', min: 1, max: 1000, value: 100, log: true, fmt: (v) => EM.sci(v, 3) },
      { k: 'B', label: 'Campo magnético <i>B</i>', min: 0.01, max: 2, value: 0.5, log: true, unit: 'T', fmt: (v) => EM.sci(v, 3) },
      { k: 'A', label: 'Área de la bobina <i>A</i>', min: 1, max: 500, value: 100, log: true, unit: 'cm²', fmt: (v) => EM.sci(v, 3) },
      { k: 'f', label: 'Frecuencia de giro <i>f</i>', min: 1, max: 1000, value: 50, log: true, unit: 'Hz', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'ep', label: 'Fuerza electromotriz máxima ε<sub>0</sub> = <i>NBA</i>ω', short: 'ε máxima', f: (p) => fa(p).ep, unit: 'V', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'er', label: 'Valor eficaz ε<sub>0</sub>/√2', short: 'ε eficaz', f: (p) => fa(p).ep / Math.SQRT2, unit: 'V', fmt: (v) => EM.sci(v, 5) },
      { k: 'w', label: 'Velocidad angular ω = 2π<i>f</i>', short: 'ω', f: (p) => fa(p).w, unit: 'rad/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'ph', label: 'Flujo máximo Φ₀ = <i>NBA</i>', short: 'Φ máximo', f: (p) => p.N * p.B * p.A * 1e-4, unit: 'Wb', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const dm = (p) => { const mu = p.N * p.I * p.A * 1e-4, t = p.th * PI / 180; return { mu, t }; };
  EM.formula('dipolo-mag', {
    gx: 'B',
    params: [
      { k: 'N', label: 'Número de espiras <i>N</i>', min: 1, max: 1000, value: 10, log: true, fmt: (v) => EM.sci(v, 3) },
      { k: 'I', label: 'Corriente <i>I</i>', min: 0.001, max: 100, value: 1, log: true, unit: 'A', fmt: (v) => EM.sci(v, 3) },
      { k: 'A', label: 'Área de cada espira <i>A</i>', min: 0.1, max: 1000, value: 10, log: true, unit: 'cm²', fmt: (v) => EM.sci(v, 3) },
      { k: 'B', label: 'Campo magnético externo <i>B</i>', min: 0.001, max: 10, value: 0.1, log: true, unit: 'T', fmt: (v) => EM.sci(v, 3) },
      { k: 'th', label: 'Ángulo θ entre μ y <i>B</i>', min: 0, max: 180, value: 60, unit: '°', fmt: (v) => EM.sci(v, 4), angle: true }
    ],
    outs: [
      { k: 'mu', label: 'Momento magnético μ = <i>NIA</i>', short: 'μ', f: (p) => dm(p).mu, unit: 'A·m²', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'tau', label: 'Par τ = μ<i>B</i> senθ', short: 'par', f: (p) => dm(p).mu * p.B * Math.sin(dm(p).t), unit: 'N·m', fmt: (v) => EM.sci(v, 5) },
      { k: 'U', label: 'Energía <i>U</i> = −μ<i>B</i> cosθ', short: 'U', f: (p) => -dm(p).mu * p.B * Math.cos(dm(p).t), unit: 'J', fmt: (v) => EM.sci(v, 5) },
      { k: 'mb', label: 'En unidades del magnetón de Bohr μ/μ<sub>B</sub>', short: 'μ/μ_B', f: (p) => dm(p).mu / muB, fmt: (v) => EM.sci(v, 5) },
      { k: 'fL', label: 'Frecuencia de precesión de un electrón <i>f</i> = μ<sub>B</sub><i>B</i>/<i>h</i>', short: 'f de Larmor', f: (p) => muB * p.B / hP * 1e-9, unit: 'GHz', fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
