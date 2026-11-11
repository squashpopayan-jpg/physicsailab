/* Capítulo 20 — Electrostática */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, E0 = 8.8541878128e-12, K = 1 / (4 * PI * E0);

  const rd = (p) => { const Q = p.Q * 1e-9, R = p.R * 1e-2, z = p.z * 1e-2, sg = Q / (PI * R * R); return { Q, R, z, sg }; };
  EM.formula('anillo-disco', {
    gx: 'z',
    params: [
      { k: 'Q', label: 'Carga total <i>Q</i>', min: 0.1, max: 100, value: 10, log: true, unit: 'nC', fmt: (v) => EM.sci(v, 4) },
      { k: 'R', label: 'Radio del anillo o disco <i>R</i>', min: 1, max: 50, value: 5, log: true, unit: 'cm', fmt: (v) => EM.sci(v, 4) },
      { k: 'z', label: 'Distancia al centro sobre el eje <i>z</i>', min: 0.1, max: 200, value: 5, log: true, unit: 'cm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'Er', label: 'Anillo: <i>E</i> = <i>kQz</i>/(<i>z</i>² + <i>R</i>²)<sup>3/2</sup>', short: 'E anillo', f: (p) => { const a = rd(p); return K * a.Q * a.z / Math.pow(a.z * a.z + a.R * a.R, 1.5); }, unit: 'V/m', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'Ed', label: 'Disco: <i>E</i> = σ/(2ε₀)·[1 − <i>z</i>/√(<i>z</i>² + <i>R</i>²)], σ = <i>Q</i>/π<i>R</i>²', short: 'E disco', f: (p) => { const a = rd(p); return a.sg / (2 * E0) * (1 - a.z / Math.sqrt(a.z * a.z + a.R * a.R)); }, unit: 'V/m', fmt: (v) => EM.sci(v, 5) },
      { k: 'Ep', label: 'Plano infinito con la misma densidad: σ/(2ε₀)', short: 'E plano', f: (p) => rd(p).sg / (2 * E0), unit: 'V/m', fmt: (v) => EM.sci(v, 5) },
      { k: 'Eq', label: 'Carga puntual <i>kQ</i>/<i>z</i>²', short: 'E puntual', f: (p) => K * rd(p).Q / Math.pow(rd(p).z, 2), unit: 'V/m', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const es = (p) => { const Q = p.Q * 1e-9, R = p.R * 1e-2, r = p.r * 1e-2; return { Q, R, r, inn: r < R }; };
  EM.formula('esfera-gauss', {
    gx: 'r',
    params: [
      { k: 'Q', label: 'Carga total <i>Q</i> (uniforme en el volumen)', min: 0.1, max: 100, value: 10, log: true, unit: 'nC', fmt: (v) => EM.sci(v, 4) },
      { k: 'R', label: 'Radio de la esfera <i>R</i>', min: 1, max: 50, value: 5, log: true, unit: 'cm', fmt: (v) => EM.sci(v, 4) },
      { k: 'r', label: 'Distancia al centro <i>r</i>', min: 0.1, max: 100, value: 2, log: true, unit: 'cm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'E', label: 'Campo: <i>kQr</i>/<i>R</i>³ (<i>r</i> &lt; <i>R</i>) o <i>kQ</i>/<i>r</i>² (<i>r</i> ≥ <i>R</i>)', short: 'E(r)', f: (p) => { const a = es(p); return a.inn ? K * a.Q * a.r / Math.pow(a.R, 3) : K * a.Q / (a.r * a.r); }, unit: 'V/m', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'V', label: 'Potencial: <i>kQ</i>(3<i>R</i>² − <i>r</i>²)/(2<i>R</i>³) o <i>kQ</i>/<i>r</i>', short: 'V(r)', f: (p) => { const a = es(p); return a.inn ? K * a.Q * (3 * a.R * a.R - a.r * a.r) / (2 * Math.pow(a.R, 3)) : K * a.Q / a.r; }, unit: 'V', fmt: (v) => EM.sci(v, 5) },
      { k: 'Vs', label: 'Potencial en la superficie <i>kQ</i>/<i>R</i>', short: 'V superficie', f: (p) => K * es(p).Q / es(p).R, unit: 'V', fmt: (v) => EM.sci(v, 5) },
      { k: 'U', label: 'Energía electrostática total 3<i>kQ</i>²/(5<i>R</i>)', short: 'U total', f: (p) => 3 * K * es(p).Q * es(p).Q / (5 * es(p).R), unit: 'J', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const cp = (p) => { const A = p.A * 1e-4, d = p.d * 1e-3, C = p.er * E0 * A / d; return { A, d, C, Q: C * p.V, E: p.V / d }; };
  EM.formula('capacitor', {
    gx: 'd',
    params: [
      { k: 'A', label: 'Área de las placas <i>A</i>', min: 1, max: 1000, value: 100, log: true, unit: 'cm²', fmt: (v) => EM.sci(v, 4) },
      { k: 'd', label: 'Separación <i>d</i>', min: 0.01, max: 10, value: 1, log: true, unit: 'mm', fmt: (v) => EM.sci(v, 4) },
      { k: 'V', label: 'Tensión aplicada <i>V</i>', min: 1, max: 5000, value: 100, log: true, unit: 'V', fmt: (v) => EM.sci(v, 4) },
      { k: 'er', label: 'Constante dieléctrica relativa ε<sub>r</sub> (1 = vacío)', min: 1, max: 100, value: 1, log: true, fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'C', label: 'Capacidad <i>C</i> = ε<sub>r</sub>ε₀<i>A</i>/<i>d</i>', short: 'C', f: (p) => cp(p).C, unit: 'F', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'Q', label: 'Carga <i>Q</i> = <i>CV</i>', short: 'Q', f: (p) => cp(p).Q, unit: 'C', fmt: (v) => EM.sci(v, 5) },
      { k: 'U', label: 'Energía almacenada ½<i>CV</i>²', short: 'U', f: (p) => 0.5 * cp(p).C * p.V * p.V, unit: 'J', fmt: (v) => EM.sci(v, 5) },
      { k: 'E', label: 'Campo entre placas <i>E</i> = <i>V</i>/<i>d</i> (el aire se rompe a ≈ 3×10⁶ V/m)', short: 'E', f: (p) => cp(p).E, unit: 'V/m', fmt: (v) => EM.sci(v, 5) },
      { k: 'u', label: 'Densidad de energía ½ε<sub>r</sub>ε₀<i>E</i>²', short: 'u', f: (p) => 0.5 * p.er * E0 * Math.pow(cp(p).E, 2), unit: 'J/m³', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const dp = (p) => { const pp = p.p * 1e-30, r = p.r * 1e-9, t = p.th * PI / 180; return { Er: 2 * K * pp * Math.cos(t) / Math.pow(r, 3), Et: K * pp * Math.sin(t) / Math.pow(r, 3), V: K * pp * Math.cos(t) / (r * r) }; };
  EM.formula('dipolo', {
    gx: 'r',
    params: [
      { k: 'p', label: 'Momento dipolar <i>p</i> (agua: 6.17)', min: 0.1, max: 100, value: 6.17, log: true, unit: '10⁻³⁰ C·m', fmt: (v) => EM.sci(v, 4) },
      { k: 'r', label: 'Distancia al dipolo <i>r</i>', min: 0.1, max: 100, value: 1, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 4) },
      { k: 'th', label: 'Ángulo θ respecto del eje del dipolo', min: 0, max: 180, value: 45, unit: '°', fmt: (v) => EM.sci(v, 4), angle: true }
    ],
    outs: [
      { k: 'Er', label: 'Componente radial <i>E</i><sub>r</sub> = 2<i>kp</i> cosθ/<i>r</i>³', short: 'E_r', f: (p) => dp(p).Er, unit: 'V/m', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'Et', label: 'Componente polar <i>E</i><sub>θ</sub> = <i>kp</i> senθ/<i>r</i>³', short: 'E_θ', f: (p) => dp(p).Et, unit: 'V/m', fmt: (v) => EM.sci(v, 5) },
      { k: 'E', label: 'Módulo <i>E</i> = (<i>kp</i>/<i>r</i>³)√(1 + 3cos²θ)', short: '|E|', f: (p) => Math.hypot(dp(p).Er, dp(p).Et), unit: 'V/m', fmt: (v) => EM.sci(v, 5) },
      { k: 'V', label: 'Potencial <i>V</i> = <i>kp</i> cosθ/<i>r</i>²', short: 'V', f: (p) => dp(p).V, unit: 'V', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const im = (p) => { const q = p.q * 1e-9, d = p.d * 1e-2, rho = p.rho * 1e-2; return { q, d, rho }; };
  EM.formula('imagenes', {
    gx: 'd',
    params: [
      { k: 'q', label: 'Carga <i>q</i>', min: 0.1, max: 100, value: 10, log: true, unit: 'nC', fmt: (v) => EM.sci(v, 4) },
      { k: 'd', label: 'Distancia al plano conductor <i>d</i>', min: 0.1, max: 50, value: 5, log: true, unit: 'cm', fmt: (v) => EM.sci(v, 4) },
      { k: 'rho', label: 'Distancia ρ sobre el plano (desde la proyección de <i>q</i>)', min: 0, max: 50, value: 0, unit: 'cm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'F', label: 'Fuerza de atracción <i>F</i> = <i>kq</i>²/(2<i>d</i>)² = <i>kq</i>²/(4<i>d</i>²)', short: 'F', f: (p) => K * Math.pow(im(p).q, 2) / (4 * Math.pow(im(p).d, 2)), unit: 'N', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'sg', label: 'Densidad superficial inducida σ(ρ) = −<i>qd</i>/[2π(ρ² + <i>d</i>²)<sup>3/2</sup>]', short: 'σ inducida', f: (p) => -im(p).q * im(p).d / (2 * PI * Math.pow(im(p).rho * im(p).rho + im(p).d * im(p).d, 1.5)), unit: 'C/m²', fmt: (v) => EM.sci(v, 5) },
      { k: 'W', label: 'Trabajo para llevar <i>q</i> al infinito <i>kq</i>²/(4<i>d</i>)', short: 'W', f: (p) => K * Math.pow(im(p).q, 2) / (4 * im(p).d), unit: 'J', fmt: (v) => EM.sci(v, 5) },
      { k: 'rh', label: 'Radio que encierra la mitad de la carga inducida √3 <i>d</i>', short: 'ρ de la mitad', f: (p) => Math.sqrt(3) * p.d, unit: 'cm', fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
