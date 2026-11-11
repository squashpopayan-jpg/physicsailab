/* Capítulo 19 — Calor y difusión */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, kB = 1.380649e-23, SIG = 5.670374419e-8;

  EM.formula('difusion', {
    gx: 't',
    params: [
      { k: 'D', label: 'Coeficiente de difusión <i>D</i> (o difusividad térmica α)', min: 1e-12, max: 1e-3, value: 1.11e-4, log: true, unit: 'm²/s', fmt: (v) => EM.sci(v, 4) },
      { k: 't', label: 'Tiempo transcurrido <i>t</i>', min: 1e-3, max: 1e5, value: 1, log: true, unit: 's', fmt: (v) => EM.sci(v, 4) },
      { k: 'x', label: 'Posición <i>x</i> respecto del punto de partida', min: 0, max: 100, value: 10, unit: 'mm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'c0', label: 'Valor máximo <i>c</i>(0, <i>t</i>)/<i>N</i> = 1/√(4π<i>Dt</i>)', short: 'c máx / N', f: (p) => 1 / Math.sqrt(4 * PI * p.D * p.t), unit: 'm⁻¹', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'cx', label: 'Valor en <i>x</i>: <i>c</i>(<i>x</i>, <i>t</i>)/<i>N</i> = e<sup>−<i>x</i>²/4<i>Dt</i></sup>/√(4π<i>Dt</i>)', short: 'c(x)/N', f: (p) => Math.exp(-Math.pow(p.x * 1e-3, 2) / (4 * p.D * p.t)) / Math.sqrt(4 * PI * p.D * p.t), unit: 'm⁻¹', fmt: (v) => EM.sci(v, 5) },
      { k: 'sig', label: 'Desviación típica σ = √(2<i>Dt</i>)', short: 'σ', f: (p) => Math.sqrt(2 * p.D * p.t) * 1e3, unit: 'mm', fmt: (v) => EM.sci(v, 5) },
      { k: 'L', label: 'Longitud de difusión <i>L</i> = √(4<i>Dt</i>)', short: 'L', f: (p) => Math.sqrt(4 * p.D * p.t) * 1e3, unit: 'mm', fmt: (v) => EM.sci(v, 5) },
      { k: 'tx', label: 'Tiempo para difundir hasta <i>x</i>: <i>x</i>²/(4<i>D</i>)', short: 't hasta x', f: (p) => Math.pow(p.x * 1e-3, 2) / (4 * p.D), unit: 's', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const se = (p) => { const D = kB * p.T / (6 * PI * p.eta * 1e-3 * p.a * 1e-9); return { D, mu: 1 / (6 * PI * p.eta * 1e-3 * p.a * 1e-9) }; };
  EM.formula('stokes-einstein', {
    gx: 'a',
    params: [
      { k: 'T', label: 'Temperatura <i>T</i>', min: 250, max: 400, value: 293, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'eta', label: 'Viscosidad del medio η', min: 0.2, max: 2000, value: 1.002, log: true, unit: 'mPa·s', fmt: (v) => EM.sci(v, 4) },
      { k: 'a', label: 'Radio de la partícula <i>a</i>', min: 0.1, max: 1e4, value: 1000, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'D', label: 'Coeficiente de difusión <i>D</i> = <i>kT</i>/(6πη<i>a</i>)', short: 'D', f: (p) => se(p).D, unit: 'm²/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'mu', label: 'Movilidad μ = 1/(6πη<i>a</i>)', short: 'μ', f: (p) => se(p).mu, unit: 'm/(N·s)', fmt: (v) => EM.sci(v, 5) },
      { k: 'x1', label: 'Desplazamiento cuadrático medio en 1 s: √(2<i>D</i>·1 s)', short: 'x rms (1 s)', f: (p) => Math.sqrt(2 * se(p).D) * 1e6, unit: 'µm', fmt: (v) => EM.sci(v, 5) },
      { k: 't10', label: 'Tiempo medio para recorrer 10 µm: (10 µm)²/(2<i>D</i>)', short: 't a 10 µm', f: (p) => 1e-10 / (2 * se(p).D), unit: 's', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const cy = (p) => { const r1 = p.r1 * 1e-3, r2 = p.rr * r1, Rp = Math.log(p.rr) / (2 * PI * p.k) + 1 / (2 * PI * r2 * p.h); return { r1, r2, Rp, q: p.dT / Rp }; };
  EM.formula('cilindro', {
    gx: 'rr',
    params: [
      { k: 'dT', label: 'Diferencia de temperatura conductor–ambiente Δ<i>T</i>', min: 1, max: 200, value: 60, log: true, unit: 'K', fmt: (v) => EM.sci(v, 4) },
      { k: 'k', label: 'Conductividad del aislante <i>k</i>', min: 0.02, max: 5, value: 0.2, log: true, unit: 'W/(m·K)', fmt: (v) => EM.sci(v, 4) },
      { k: 'h', label: 'Coeficiente de convección exterior <i>h</i>', min: 2, max: 1000, value: 10, log: true, unit: 'W/(m²·K)', fmt: (v) => EM.sci(v, 4) },
      { k: 'r1', label: 'Radio del conductor <i>r</i>₁', min: 0.1, max: 20, value: 1, log: true, unit: 'mm', fmt: (v) => EM.sci(v, 4) },
      { k: 'rr', label: 'Razón de radios <i>r</i>₂/<i>r</i>₁ (1 = sin aislante)', min: 1, max: 100, value: 5, log: true, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'q', label: 'Pérdida por metro <i>q</i>′ = Δ<i>T</i>/[ln(<i>r</i>₂/<i>r</i>₁)/(2π<i>k</i>) + 1/(2π<i>r</i>₂<i>h</i>)]', short: 'q′', f: (p) => cy(p).q, unit: 'W/m', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'rc', label: 'Radio crítico <i>r</i><sub>c</sub> = <i>k</i>/<i>h</i>', short: 'r crítico', f: (p) => p.k / p.h * 1e3, unit: 'mm', fmt: (v) => EM.sci(v, 5) },
      { k: 'Rp', label: 'Resistencia térmica por metro <i>R</i>′', short: 'R′', f: (p) => cy(p).Rp, unit: 'm·K/W', fmt: (v) => EM.sci(v, 5) },
      { k: 'ratio', label: 'Pérdida relativa al conductor desnudo <i>q</i>′/(2π<i>r</i>₁<i>h</i>Δ<i>T</i>)', short: 'q′/q′ desnudo', f: (p) => cy(p).q / (2 * PI * cy(p).r1 * p.h * p.dT), fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const nw = (p) => { const Lc = p.r * 1e-3 / 3, tau = p.rho * p.c * Lc / p.h; return { Lc, tau, Bi: p.h * Lc / p.k }; };
  EM.formula('newton', {
    gx: 'h',
    params: [
      { k: 'r', label: 'Radio de la esfera <i>r</i>', min: 0.1, max: 100, value: 10, log: true, unit: 'mm', fmt: (v) => EM.sci(v, 4) },
      { k: 'rho', label: 'Densidad ρ', min: 500, max: 20000, value: 7800, log: true, unit: 'kg/m³', fmt: (v) => EM.sci(v, 4) },
      { k: 'c', label: 'Calor específico <i>c</i>', min: 100, max: 4500, value: 490, log: true, unit: 'J/(kg·K)', fmt: (v) => EM.sci(v, 4) },
      { k: 'h', label: 'Coeficiente de convección <i>h</i>', min: 2, max: 5000, value: 10, log: true, unit: 'W/(m²·K)', fmt: (v) => EM.sci(v, 4) },
      { k: 'k', label: 'Conductividad térmica <i>k</i>', min: 0.1, max: 400, value: 50, log: true, unit: 'W/(m·K)', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'tau', label: 'Constante de tiempo τ = ρ<i>cV</i>/(<i>hA</i>) = ρ<i>cr</i>/(3<i>h</i>)', short: 'τ', f: (p) => nw(p).tau, unit: 's', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'Bi', label: 'Número de Biot <i>Bi</i> = <i>hL</i><sub>c</sub>/<i>k</i> (válido si &lt; 0.1)', short: 'Bi', f: (p) => nw(p).Bi, fmt: (v) => EM.sci(v, 5) },
      { k: 't90', label: 'Tiempo para eliminar el 90 % de la diferencia: τ ln 10', short: 't (90 %)', f: (p) => nw(p).tau * Math.log(10), unit: 's', fmt: (v) => EM.sci(v, 5) },
      { k: 'Lc', label: 'Longitud característica <i>L</i><sub>c</sub> = <i>V</i>/<i>A</i> = <i>r</i>/3', short: 'L_c', f: (p) => nw(p).Lc * 1e3, unit: 'mm', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  const rb = (p) => { const T = Math.pow((1 - p.A) * p.S / (4 * p.eps * SIG), 0.25); return { T }; };
  EM.formula('balance', {
    gx: 'S',
    params: [
      { k: 'S', label: 'Constante solar (flujo incidente) <i>S</i>', min: 100, max: 5000, value: 1361, log: true, unit: 'W/m²', fmt: (v) => EM.sci(v, 4) },
      { k: 'A', label: 'Albedo <i>A</i>', min: 0, max: 0.95, value: 0.3, fmt: (v) => EM.sci(v, 3), step: 0.01 },
      { k: 'eps', label: 'Emisividad efectiva ε (1 = sin efecto invernadero)', min: 0.2, max: 1, value: 1, fmt: (v) => EM.sci(v, 4), step: 0.01 }
    ],
    outs: [
      { k: 'T', label: 'Temperatura de equilibrio <i>T</i> = [(1 − <i>A</i>)<i>S</i>/(4εσ)]<sup>1/4</sup>', short: 'T de equilibrio', f: (p) => rb(p).T, unit: 'K', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'Tc', label: 'La misma temperatura en grados Celsius', short: 'T (°C)', f: (p) => rb(p).T - 273.15, unit: '°C', fmt: (v) => EM.sci(v, 6) },
      { k: 'F', label: 'Flujo emitido σ<i>T</i>⁴ (= (1 − <i>A</i>)<i>S</i>/(4ε))', short: 'σT⁴', f: (p) => SIG * Math.pow(rb(p).T, 4), unit: 'W/m²', fmt: (v) => EM.sci(v, 6) },
      { k: 'T1', label: 'Temperatura si <i>S</i> aumentara un 1 %', short: 'T con S + 1 %', f: (p) => rb(p).T * Math.pow(1.01, 0.25), unit: 'K', fmt: (v) => EM.sci(v, 6) }
    ]
  });
})();
