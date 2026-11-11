/* Capítulo 28 — Relatividad general */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, C = 299792458, G = 6.67430e-11, MS = 1.98847e30, GMS = 1.32712440018e20, GME = 3.986004418e14, RE = 6371e3, HB = 1.054571817e-34, KB = 1.380649e-23, AU = 1.495978707e11;

  const gp = (p) => { const r = p.r * 1e3, g = GME / (C * C) * (1 / RE - 1 / r) * 86400e6, v = Math.sqrt(GME / r), vs = -v * v / (2 * C * C) * 86400e6; return { g, vs, v }; };
  EM.formula('gps', {
    gx: 'r',
    params: [
      { k: 'r', label: 'Radio de la órbita circular <i>r</i> (GPS: 26 571 km; ISS: 6778 km; geoestacionaria: 42 164 km)', min: 6500, max: 384400, value: 26571, log: true, unit: 'km', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'g', label: 'Efecto gravitacional (GM/c²)(1/R − 1/r) por día', short: 'gravitacional', f: (p) => gp(p).g, unit: 'µs/día', fmt: (v) => EM.sci(v, 6) },
      { k: 'v', label: 'Efecto de la velocidad −v²/2c² por día', short: 'velocidad', f: (p) => gp(p).vs, unit: 'µs/día', fmt: (v) => EM.sci(v, 6) },
      { k: 'n', label: 'Diferencia neta (el reloj orbital respecto del terrestre)', short: 'neta', f: (p) => gp(p).g + gp(p).vs, unit: 'µs/día', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'e', label: 'Error de posición acumulado si no se corrige (c × diferencia)', short: 'error de posición', f: (p) => (gp(p).g + gp(p).vs) * 1e-6 * C / 1e3, unit: 'km/día', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const sw = (p) => { const rs = 2 * GMS * p.M / (C * C); return { rs }; };
  EM.formula('schwarzschild', {
    gx: 'M',
    params: [
      { k: 'M', label: 'Masa del objeto (masas solares)', min: 1e-7, max: 1e10, value: 1, log: true, unit: 'M☉', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'rs', label: 'Radio de Schwarzschild <i>r</i><sub>s</sub> = 2<i>GM</i>/<i>c</i>²', short: 'r_s', f: (p) => sw(p).rs / 1e3, unit: 'km', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'rho', label: 'Densidad media dentro del horizonte 3<i>M</i>/(4π<i>r</i><sub>s</sub>³)', short: 'densidad', f: (p) => p.M * MS / (4 / 3 * PI * Math.pow(sw(p).rs, 3)), unit: 'kg/m³', fmt: (v) => EM.sci(v, 5) },
      { k: 'rph', label: 'Esfera de fotones 1.5 <i>r</i><sub>s</sub>', short: 'esfera de fotones', f: (p) => 1.5 * sw(p).rs / 1e3, unit: 'km', fmt: (v) => EM.sci(v, 6) },
      { k: 'isco', label: 'Última órbita circular estable 3 <i>r</i><sub>s</sub>', short: 'ISCO', f: (p) => 3 * sw(p).rs / 1e3, unit: 'km', fmt: (v) => EM.sci(v, 6) },
      { k: 'TH', label: 'Temperatura de Hawking ħ<i>c</i>³/(8π<i>GMk</i>)', short: 'T de Hawking', f: (p) => HB * Math.pow(C, 3) / (8 * PI * G * p.M * MS * KB), unit: 'K', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const lt = (p) => 4 * GMS * p.M / (C * C * p.b * 6.957e8);
  EM.formula('luz', {
    gx: 'b',
    params: [
      { k: 'M', label: 'Masa de la lente (masas solares; Sol: 1; Júpiter: 9.54×10⁻⁴)', min: 1e-4, max: 1e6, value: 1, log: true, unit: 'M☉', fmt: (v) => EM.sci(v, 5) },
      { k: 'b', label: 'Parámetro de impacto (en radios solares 6.957×10⁸ m)', min: 0.1, max: 1000, value: 1, log: true, unit: 'R☉', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'al', label: 'Deflexión relativista α = 4<i>GM</i>/(<i>c</i>²<i>b</i>)', short: 'α', f: (p) => lt(p) * 180 / PI * 3600, unit: '″', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'aN', label: 'Predicción newtoniana (corpuscular) 2<i>GM</i>/(<i>c</i>²<i>b</i>)', short: 'α newtoniana', f: (p) => lt(p) / 2 * 180 / PI * 3600, unit: '″', fmt: (v) => EM.sci(v, 6) },
      { k: 'ep', label: 'Cociente <i>r</i><sub>s</sub>/<i>b</i> (debe ser ≪ 1)', short: 'r_s/b', f: (p) => lt(p) / 2, fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const ph = (p) => { const a = p.a * AU, d = 6 * PI * GMS * p.M / (C * C * a * (1 - p.e * p.e)), P = 2 * PI * Math.sqrt(a * a * a / (GMS * p.M)); return { d, P }; };
  EM.formula('perihelio', {
    gx: 'a',
    params: [
      { k: 'M', label: 'Masa central (masas solares)', min: 0.1, max: 1e3, value: 1, log: true, unit: 'M☉', fmt: (v) => EM.sci(v, 5) },
      { k: 'a', label: 'Semieje mayor <i>a</i> (Mercurio: 0.387098 UA)', min: 0.005, max: 50, value: 0.387098, log: true, unit: 'UA', fmt: (v) => EM.sci(v, 6) },
      { k: 'e', label: 'Excentricidad <i>e</i> (Mercurio: 0.2056)', min: 0, max: 0.9, value: 0.20563, fmt: (v) => EM.sci(v, 5), step: 0.001 }
    ],
    outs: [
      { k: 'd', label: 'Avance por órbita Δφ = 6π<i>GM</i>/[<i>c</i>²<i>a</i>(1 − <i>e</i>²)]', short: 'avance por órbita', f: (p) => ph(p).d * 180 / PI * 3600, unit: '″', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'P', label: 'Periodo orbital 2π√(<i>a</i>³/<i>GM</i>)', short: 'periodo', f: (p) => ph(p).P / 86400, unit: 'días', fmt: (v) => EM.sci(v, 6) },
      { k: 'c', label: 'Avance por siglo', short: 'por siglo', f: (p) => ph(p).d * 180 / PI * 3600 * 36525 * 86400 / ph(p).P, unit: '″/siglo', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const gw = (p) => { const M = (p.m1 + p.m2) * MS, a = Math.cbrt(G * M / Math.pow(PI * p.f, 2)), m1 = p.m1 * MS, m2 = p.m2 * MS; return { M, a, m1, m2 }; };
  EM.formula('ondasgrav', {
    gx: 'f',
    params: [
      { k: 'm1', label: 'Masa del primer objeto (GW150914: 36)', min: 1, max: 100, value: 36, log: true, unit: 'M☉', fmt: (v) => EM.sci(v, 4) },
      { k: 'm2', label: 'Masa del segundo objeto (GW150914: 29)', min: 1, max: 100, value: 29, log: true, unit: 'M☉', fmt: (v) => EM.sci(v, 4) },
      { k: 'f', label: 'Frecuencia de la onda gravitacional <i>f</i> (el doble de la orbital)', min: 10, max: 1000, value: 35, log: true, unit: 'Hz', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'a', label: 'Separación orbital <i>a</i> = [<i>GM</i>/(π<i>f</i>)²]<sup>1/3</sup>', short: 'separación', f: (p) => gw(p).a / 1e3, unit: 'km', fmt: (v) => EM.sci(v, 6) },
      { k: 'P', label: 'Potencia radiada (32/5)<i>G</i>⁴<i>m</i>₁²<i>m</i>₂²<i>M</i>/(<i>c</i>⁵<i>a</i>⁵)', short: 'potencia', f: (p) => 32 / 5 * Math.pow(G, 4) * Math.pow(gw(p).m1 * gw(p).m2, 2) * gw(p).M / (Math.pow(C, 5) * Math.pow(gw(p).a, 5)), unit: 'W', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'tau', label: 'Tiempo hasta la fusión (5/256)<i>c</i>⁵<i>a</i>⁴/(<i>G</i>³<i>m</i>₁<i>m</i>₂<i>M</i>)', short: 'tiempo hasta la fusión', f: (p) => 5 / 256 * Math.pow(C, 5) * Math.pow(gw(p).a, 4) / (Math.pow(G, 3) * gw(p).m1 * gw(p).m2 * gw(p).M), unit: 's', fmt: (v) => EM.sci(v, 6) },
      { k: 'Mc', label: 'Masa de chirp (<i>m</i>₁<i>m</i>₂)<sup>3/5</sup>/(<i>m</i>₁ + <i>m</i>₂)<sup>1/5</sup>', short: 'masa de chirp', f: (p) => Math.pow(p.m1 * p.m2, 0.6) / Math.pow(p.m1 + p.m2, 0.2), unit: 'M☉', fmt: (v) => EM.sci(v, 6) }
    ]
  });
})();
