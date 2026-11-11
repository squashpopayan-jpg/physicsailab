/* Capítulo 29 — Orígenes de la física cuántica */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, H = 6.62607015e-34, C = 299792458, KB = 1.380649e-23, QE = 1.602176634e-19, ME = 9.1093837015e-31, AMU = 1.66053906660e-27, SIG = 5.670374419e-8, RINF = 10973731.568160, A0 = 5.29177210903e-11, ALPHA = 7.2973525693e-3, BW = 2.897771955e-3;

  const pl = (p) => { const L = p.r * BW / p.T, x = H * C / (L * KB * p.T); return { L, x }; };
  EM.formula('planck-bb', {
    gx: 'r',
    params: [
      { k: 'T', label: 'Temperatura del cuerpo negro <i>T</i> (Sol: 5772 K; CMB: 2.725 K)', min: 2.7, max: 30000, value: 5772, log: true, unit: 'K', fmt: (v) => EM.sci(v, 5) },
      { k: 'r', label: 'Longitud de onda relativa al máximo λ/λ<sub>máx</sub> (1 = pico de Wien)', min: 0.1, max: 50, value: 1, log: true, fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'lam', label: 'Longitud de onda λ = (λ/λ<sub>máx</sub>)·<i>b</i>/<i>T</i>', short: 'λ', f: (p) => pl(p).L * 1e9, unit: 'nm', fmt: (v) => EM.sci(v, 6) },
      { k: 'x', label: 'Parámetro <i>x</i> = <i>hc</i>/(λ<i>kT</i>)', short: 'x', f: (p) => pl(p).x, fmt: (v) => EM.sci(v, 6) },
      { k: 'B', label: 'Radiancia espectral <i>B</i><sub>λ</sub> = 2<i>hc</i>²/λ⁵ · 1/(e<sup><i>x</i></sup> − 1)', short: 'B_λ', f: (p) => 2 * H * C * C / Math.pow(pl(p).L, 5) / Math.expm1(pl(p).x) * 1e-6, unit: 'W/(sr·m²·µm)', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'rj', label: 'Cociente respecto de Rayleigh–Jeans <i>x</i>/(e<sup><i>x</i></sup> − 1)', short: 'B / B_RJ', f: (p) => pl(p).x / Math.expm1(pl(p).x), fmt: (v) => EM.sci(v, 6) },
      { k: 'lm', label: 'Longitud de onda del máximo (Wien) λ<sub>máx</sub> = <i>b</i>/<i>T</i>', short: 'λ máx', f: (p) => BW / p.T * 1e9, unit: 'nm', fmt: (v) => EM.sci(v, 6) },
      { k: 'M', label: 'Exitancia total σ<i>T</i>⁴', short: 'σT⁴', f: (p) => SIG * Math.pow(p.T, 4), unit: 'W/m²', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  EM.formula('fotoelectrico', {
    gx: 'lam',
    params: [
      { k: 'phi', label: 'Función de trabajo φ (Na: 2.28; Cs: 2.1; Zn: 4.3; Pt: 5.65)', min: 1.5, max: 6, value: 2.28, unit: 'eV', fmt: (v) => EM.sci(v, 4) },
      { k: 'lam', label: 'Longitud de onda de la luz λ', min: 100, max: 800, value: 400, unit: 'nm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'E', label: 'Energía del fotón <i>hc</i>/λ', short: 'E fotón', f: (p) => H * C / (p.lam * 1e-9) / QE, unit: 'eV', fmt: (v) => EM.sci(v, 6) },
      { k: 'K', label: 'Energía cinética máxima <i>K</i><sub>máx</sub> = <i>hν</i> − φ (negativa: no hay emisión)', short: 'K máx', f: (p) => H * C / (p.lam * 1e-9) / QE - p.phi, unit: 'eV', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'l0', label: 'Longitud de onda umbral λ₀ = <i>hc</i>/φ', short: 'λ umbral', f: (p) => H * C / (p.phi * QE) * 1e9, unit: 'nm', fmt: (v) => EM.sci(v, 6) },
      { k: 'v', label: 'Velocidad máxima de los fotoelectrones √(2<i>K</i>/<i>m</i>) (0 si no hay emisión)', short: 'v máx', f: (p) => Math.sqrt(2 * Math.max(H * C / (p.lam * 1e-9) / QE - p.phi, 0) * QE / ME), unit: 'm/s', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const LC = H / (ME * C);
  EM.formula('compton', {
    gx: 'th',
    params: [
      { k: 'lam', label: 'Longitud de onda del fotón incidente λ (Mo Kα: 71.07 pm)', min: 0.01, max: 1000, value: 71.07, log: true, unit: 'pm', fmt: (v) => EM.sci(v, 5) },
      { k: 'th', label: 'Ángulo de dispersión θ', min: 0, max: 180, value: 90, unit: '°', fmt: (v) => EM.sci(v, 4), angle: true }
    ],
    outs: [
      { k: 'dl', label: 'Corrimiento Δλ = (<i>h</i>/<i>m</i><sub>e</sub><i>c</i>)(1 − cosθ)', short: 'Δλ', f: (p) => LC * (1 - Math.cos(p.th / 180 * PI)) * 1e12, unit: 'pm', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'lp', label: 'Longitud de onda dispersada λ′ = λ + Δλ', short: "λ′", f: (p) => p.lam + LC * (1 - Math.cos(p.th / 180 * PI)) * 1e12, unit: 'pm', fmt: (v) => EM.sci(v, 7) },
      { k: 'Kk', label: 'Energía cinética del electrón de retroceso <i>hc</i>(1/λ − 1/λ′)', short: 'K del electrón', f: (p) => H * C / QE / 1e3 * 1e12 * (1 / p.lam - 1 / (p.lam + LC * (1 - Math.cos(p.th / 180 * PI)) * 1e12)), unit: 'keV', fmt: (v) => EM.sci(v, 6) },
      { k: 'Ei', label: 'Energía del fotón incidente', short: 'E incidente', f: (p) => H * C / QE / 1e3 * 1e12 / p.lam, unit: 'keV', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const bo = (p) => { const red = 1 / (1 + ME / (p.M * AMU)), R = RINF * red, ni = p.nf + p.dn, inv = R * p.Z * p.Z * (1 / (p.nf * p.nf) - 1 / (ni * ni)); return { red, inv }; };
  EM.formula('bohr', {
    gx: 'nf',
    params: [
      { k: 'Z', label: 'Número atómico del ion hidrogenoide <i>Z</i>', min: 1, max: 10, value: 1, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'M', label: 'Masa del núcleo (protón: 1.00728; deuterón: 2.01355; He: 4.0015)', min: 1, max: 20, value: 1.00727647, fmt: (v) => EM.sci(v, 7), unit: 'u' },
      { k: 'nf', label: 'Nivel final <i>n</i><sub>f</sub> (1 Lyman, 2 Balmer, 3 Paschen)', min: 1, max: 6, value: 2, fmt: (v) => EM.sci(v, 3), step: 1 },
      { k: 'dn', label: 'Salto <i>n</i><sub>i</sub> − <i>n</i><sub>f</sub> (1 = línea α)', min: 1, max: 100, value: 1, log: true, fmt: (v) => EM.sci(v, 3), step: 1 }
    ],
    outs: [
      { k: 'lam', label: 'Longitud de onda en el vacío 1/λ = <i>R</i><sub>M</sub><i>Z</i>²(1/<i>n</i><sub>f</sub>² − 1/<i>n</i><sub>i</sub>²)', short: 'λ', f: (p) => 1 / bo(p).inv * 1e9, unit: 'nm', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'E', label: 'Energía del fotón <i>hc</i>/λ', short: 'E fotón', f: (p) => H * C * bo(p).inv / QE, unit: 'eV', fmt: (v) => EM.sci(v, 6) },
      { k: 'r', label: 'Radio de la órbita final <i>n</i><sub>f</sub>² <i>a</i>₀ (1 + <i>m</i><sub>e</sub>/<i>M</i>)/<i>Z</i>', short: 'r de Bohr', f: (p) => p.nf * p.nf * A0 * 1e12 / p.Z / bo(p).red, unit: 'pm', fmt: (v) => EM.sci(v, 6) },
      { k: 'En', label: 'Energía del nivel final −13.6057 <i>Z</i>²/<i>n</i><sub>f</sub>² (masa reducida)', short: 'E_n', f: (p) => -13.605693123 * p.Z * p.Z / (p.nf * p.nf) * bo(p).red, unit: 'eV', fmt: (v) => EM.sci(v, 6) },
      { k: 'v', label: 'Velocidad orbital <i>Zαc</i>/<i>n</i><sub>f</sub>', short: 'v orbital', f: (p) => p.Z * ALPHA * C / p.nf / 1e3, unit: 'km/s', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const db = (p) => { const m = p.M * AMU, T = p.T * QE, pc = Math.sqrt(T * (T + 2 * m * C * C)); return { m, T, pc }; };
  EM.formula('debroglie', {
    gx: 'T',
    params: [
      { k: 'T', label: 'Energía cinética <i>T</i> (Davisson–Germer: 54 eV)', min: 0.01, max: 1e7, value: 54, log: true, unit: 'eV', fmt: (v) => EM.sci(v, 5) },
      { k: 'M', label: 'Masa de la partícula (electrón 5.4858×10⁻⁴; neutrón 1.00866; He 4.0026; C₆₀ 720)', min: 5e-4, max: 1000, value: 5.48579909e-4, log: true, unit: 'u', fmt: (v) => EM.sci(v, 6) }
    ],
    outs: [
      { k: 'lam', label: 'Longitud de onda de De Broglie λ = <i>h</i>/<i>p</i> (relativista)', short: 'λ', f: (p) => H * C / db(p).pc * 1e12, unit: 'pm', fmt: (v) => EM.sci(v, 7), hl: true },
      { k: 'lnr', label: 'Aproximación no relativista <i>h</i>/√(2<i>mT</i>)', short: 'λ no relativista', f: (p) => H / Math.sqrt(2 * db(p).m * db(p).T) * 1e12, unit: 'pm', fmt: (v) => EM.sci(v, 7) },
      { k: 'b', label: 'Velocidad <i>v</i>/<i>c</i> = <i>pc</i>/(<i>T</i> + <i>mc</i>²)', short: 'v/c', f: (p) => db(p).pc / (db(p).T + db(p).m * C * C), fmt: (v) => EM.sci(v, 6) },
      { k: 'pc', label: 'Cantidad de movimiento <i>pc</i>', short: 'pc', f: (p) => db(p).pc / QE, unit: 'eV', fmt: (v) => EM.sci(v, 7) }
    ]
  });
})();
