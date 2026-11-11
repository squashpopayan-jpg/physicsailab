/* Capítulo 15 — Hidrodinámica */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, G0 = 9.80665;

  const tk = (p) => { const f = Math.sqrt(1 - Math.pow(p.a / p.A, 2)); return { v: Math.sqrt(2 * G0 * p.h0) / f, f }; };
  EM.formula('tanque', {
    gx: 'a',
    params: [
      { k: 'h0', label: 'Altura inicial del líquido sobre el orificio <i>h</i>₀', min: 0.05, max: 10, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'A', label: 'Área de la sección del tanque <i>A</i>', min: 0.01, max: 10, value: 0.5, log: true, unit: 'm²', fmt: (v) => EM.sci(v, 3) },
      { k: 'a', label: 'Área del orificio <i>a</i>', min: 1e-5, max: 5e-3, value: 1e-3, log: true, unit: 'm²', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'v', label: 'Velocidad de salida <i>v</i> = √[2<i>gh</i>/(1 − (<i>a</i>/<i>A</i>)²)]', short: 'v de salida', f: (p) => tk(p).v, unit: 'm/s', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'Q', label: 'Caudal <i>Q</i> = <i>av</i>', short: 'Q', f: (p) => p.a * tk(p).v, unit: 'm³/s', fmt: (v) => EM.sci(v, 5) },
      { k: 't', label: 'Tiempo de vaciado (<i>A</i>/<i>a</i>)√(2<i>h</i>₀/<i>g</i>)·√(1 − (<i>a</i>/<i>A</i>)²)', short: 't de vaciado', f: (p) => p.A / p.a * Math.sqrt(2 * p.h0 / G0) * tk(p).f, unit: 's', fmt: (v) => EM.sci(v, 5) },
      { k: 'vt', label: 'Velocidad de caída libre desde la misma altura √(2<i>gh</i>₀) (Torricelli)', short: 'Torricelli', f: (p) => Math.sqrt(2 * G0 * p.h0), unit: 'm/s', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const vn = (p) => { const A1 = p.A1 * 1e-4, A2 = p.beta * p.A1 * 1e-4, v2 = Math.sqrt(2 * p.dp * 1e3 / (p.rho * (1 - Math.pow(A2 / A1, 2)))); return { v2, Q: A2 * v2, v1: A2 * v2 / A1 }; };
  EM.formula('venturi', {
    gx: 'dp',
    params: [
      { k: 'A1', label: 'Sección ancha <i>A</i>₁', min: 1, max: 200, value: 20, log: true, unit: 'cm²', fmt: (v) => EM.sci(v, 3) },
      { k: 'beta', label: 'Razón de áreas de la garganta β = <i>A</i>₂/<i>A</i>₁', min: 0.02, max: 0.95, value: 0.25, log: true, fmt: (v) => EM.sci(v, 3) },
      { k: 'dp', label: 'Diferencia de presión medida <i>p</i>₁ − <i>p</i>₂', min: 0.1, max: 100, value: 10, log: true, unit: 'kPa', fmt: (v) => EM.sci(v, 3) },
      { k: 'rho', label: 'Densidad del fluido ρ', min: 1, max: 14000, value: 1000, log: true, unit: 'kg/m³', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'Q', label: 'Caudal <i>Q</i> = <i>A</i>₂√[2Δ<i>p</i>/(ρ(1 − β²))]', short: 'Q', f: (p) => vn(p).Q, unit: 'm³/s', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'v2', label: 'Velocidad en la garganta <i>v</i>₂', short: 'v₂', f: (p) => vn(p).v2, unit: 'm/s', fmt: (v) => EM.sci(v, 6) },
      { k: 'v1', label: 'Velocidad en la sección ancha <i>v</i>₁ = <i>Q</i>/<i>A</i>₁', short: 'v₁', f: (p) => vn(p).v1, unit: 'm/s', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  EM.formula('poiseuille', {
    gx: 'R',
    params: [
      { k: 'R', label: 'Radio del tubo <i>R</i>', min: 0.1, max: 10, value: 1, log: true, unit: 'mm', fmt: (v) => EM.sci(v, 3) },
      { k: 'L', label: 'Longitud <i>L</i>', min: 0.1, max: 10, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'dp', label: 'Diferencia de presión Δ<i>p</i>', min: 1, max: 1e5, value: 1000, log: true, unit: 'Pa', fmt: (v) => EM.sci(v, 3) },
      { k: 'eta', label: 'Viscosidad dinámica η', min: 1e-4, max: 1, value: 1e-3, log: true, unit: 'Pa·s', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'Q', label: 'Caudal <i>Q</i> = π<i>R</i>⁴Δ<i>p</i>/(8η<i>L</i>)', short: 'Q', f: (p) => PI * Math.pow(p.R * 1e-3, 4) * p.dp / (8 * p.eta * p.L), unit: 'm³/s', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'vm', label: 'Velocidad máxima en el eje Δ<i>p</i><i>R</i>²/(4η<i>L</i>)', short: 'v máx', f: (p) => p.dp * Math.pow(p.R * 1e-3, 2) / (4 * p.eta * p.L), unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'tw', label: 'Esfuerzo cortante en la pared τ<sub>w</sub> = Δ<i>p</i><i>R</i>/(2<i>L</i>)', short: 'τ en la pared', f: (p) => p.dp * p.R * 1e-3 / (2 * p.L), unit: 'Pa', fmt: (v) => EM.sci(v, 5) },
      { k: 'Re', label: 'Número de Reynolds ρ<i>v</i><sub>med</sub>2<i>R</i>/η (agua, ρ = 1000 kg/m³)', short: 'Re', f: (p) => 1000 * (p.dp * Math.pow(p.R * 1e-3, 2) / (8 * p.eta * p.L)) * 2 * p.R * 1e-3 / p.eta, fmt: (v) => EM.sci(v, 5) }
    ]
  });

  EM.formula('stokes', {
    gx: 'R',
    params: [
      { k: 'R', label: 'Radio de la esfera <i>R</i>', min: 1, max: 1000, value: 20, log: true, unit: 'µm', fmt: (v) => EM.sci(v, 3) },
      { k: 'rs', label: 'Densidad de la esfera ρ<sub>s</sub>', min: 500, max: 20000, value: 2700, log: true, unit: 'kg/m³', fmt: (v) => EM.sci(v, 4) },
      { k: 'rf', label: 'Densidad del fluido ρ<sub>f</sub>', min: 1, max: 1500, value: 1000, log: true, unit: 'kg/m³', fmt: (v) => EM.sci(v, 4) },
      { k: 'eta', label: 'Viscosidad η', min: 1e-5, max: 10, value: 1e-3, log: true, unit: 'Pa·s', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'vt', label: 'Velocidad terminal <i>v</i><sub>t</sub> = 2<i>R</i>²(ρ<sub>s</sub> − ρ<sub>f</sub>)<i>g</i>/(9η)', short: 'v terminal', f: (p) => 2 * Math.pow(p.R * 1e-6, 2) * (p.rs - p.rf) * G0 / (9 * p.eta), unit: 'm/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'Re', label: 'Número de Reynolds ρ<sub>f</sub><i>v</i><sub>t</sub>2<i>R</i>/η (la fórmula exige ≲ 1)', short: 'Re', f: (p) => p.rf * (2 * Math.pow(p.R * 1e-6, 2) * (p.rs - p.rf) * G0 / (9 * p.eta)) * 2 * p.R * 1e-6 / p.eta, fmt: (v) => EM.sci(v, 5) },
      { k: 'F', label: 'Fuerza de arrastre a esa velocidad 6π η<i>Rv</i><sub>t</sub> (= peso aparente)', short: 'F de arrastre', f: (p) => 6 * PI * p.eta * p.R * 1e-6 * (2 * Math.pow(p.R * 1e-6, 2) * (p.rs - p.rf) * G0 / (9 * p.eta)), unit: 'N', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const wd = (p) => { const k = 2 * PI / p.lam, w = Math.sqrt(G0 * k * Math.tanh(k * p.h)), vp = w / k; return { k, w, vp, vg: 0.5 * vp * (1 + 2 * k * p.h / Math.sinh(2 * k * p.h)) }; };
  EM.formula('ondas-profundidad', {
    gx: 'lam',
    params: [
      { k: 'lam', label: 'Longitud de onda λ', min: 0.1, max: 1e6, value: 1e5, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'h', label: 'Profundidad del agua <i>h</i>', min: 0.05, max: 11000, value: 4000, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'vp', label: 'Velocidad de fase <i>v</i> = √[(<i>g</i>/<i>k</i>) tanh(<i>kh</i>)]', short: 'v de fase', f: (p) => wd(p).vp, unit: 'm/s', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'vs', label: 'Límite de aguas someras √(<i>gh</i>)', short: 'v somera', f: (p) => Math.sqrt(G0 * p.h), unit: 'm/s', fmt: (v) => EM.sci(v, 6) },
      { k: 'vd', label: 'Límite de aguas profundas √(<i>g</i>λ/2π)', short: 'v profunda', f: (p) => Math.sqrt(G0 * p.lam / (2 * PI)), unit: 'm/s', fmt: (v) => EM.sci(v, 6) },
      { k: 'vg', label: 'Velocidad de grupo ½<i>v</i>(1 + 2<i>kh</i>/sinh 2<i>kh</i>)', short: 'v de grupo', f: (p) => wd(p).vg, unit: 'm/s', fmt: (v) => EM.sci(v, 6) },
      { k: 'kh', label: 'Profundidad relativa <i>kh</i> = 2π<i>h</i>/λ', short: 'kh', f: (p) => 2 * PI * p.h / p.lam, fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
