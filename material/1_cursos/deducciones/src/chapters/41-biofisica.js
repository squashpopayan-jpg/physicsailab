/* Capítulo 41 — Biofísica */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, KB = 1.380649e-23, QE = 1.602176634e-19, RG = 8.314462618, GRAV = 9.80665;

  /* ---- Nernst y Goldman ---- */
  const gk = (p) => {
    const VT = KB * (p.T + 273.15) / QE * 1e3;
    return { VT, EK: VT * Math.log(p.Ko / p.Ki), ENa: VT * Math.log(p.Nao / p.Nai), ECl: VT * Math.log(p.Cli / p.Clo), V: VT * Math.log((p.Ko + p.pNa * p.Nao + p.pCl * p.Cli) / (p.Ki + p.pNa * p.Nai + p.pCl * p.Clo)) };
  };
  EM.formula('bio-goldman', {
    gx: 'pNa',
    params: [
      { k: 'T', label: 'Temperatura <i>T</i>', min: 0, max: 45, value: 37, unit: '°C', fmt: (v) => EM.sci(v, 4) },
      { k: 'Ko', label: '[K⁺] exterior (mamífero: 5 mM)', min: 1, max: 100, value: 5, log: true, unit: 'mM', fmt: (v) => EM.sci(v, 4) },
      { k: 'Ki', label: '[K⁺] interior (140 mM)', min: 10, max: 400, value: 140, log: true, unit: 'mM', fmt: (v) => EM.sci(v, 4) },
      { k: 'Nao', label: '[Na⁺] exterior (145 mM)', min: 10, max: 500, value: 145, log: true, unit: 'mM', fmt: (v) => EM.sci(v, 4) },
      { k: 'Nai', label: '[Na⁺] interior (12 mM)', min: 1, max: 100, value: 12, log: true, unit: 'mM', fmt: (v) => EM.sci(v, 4) },
      { k: 'Clo', label: '[Cl⁻] exterior (110 mM)', min: 10, max: 500, value: 110, log: true, unit: 'mM', fmt: (v) => EM.sci(v, 4) },
      { k: 'Cli', label: '[Cl⁻] interior (10 mM)', min: 1, max: 200, value: 10, log: true, unit: 'mM', fmt: (v) => EM.sci(v, 4) },
      { k: 'pNa', label: 'Permeabilidad relativa <i>P</i><sub>Na</sub>/<i>P</i><sub>K</sub> (reposo: 0.04)', min: 0.001, max: 20, value: 0.04, log: true, fmt: (v) => EM.sci(v, 4) },
      { k: 'pCl', label: 'Permeabilidad relativa <i>P</i><sub>Cl</sub>/<i>P</i><sub>K</sub> (0.45)', min: 0.001, max: 5, value: 0.45, log: true, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'VT', label: 'Tensión térmica <i>kT</i>/<i>e</i>', short: 'kT/e', f: (p) => gk(p).VT, unit: 'mV', fmt: (v) => EM.sci(v, 8) },
      { k: 'EK', label: 'Potencial de Nernst del K⁺ (<i>kT</i>/<i>e</i>) ln([K]<sub>o</sub>/[K]<sub>i</sub>)', short: 'E_K', f: (p) => gk(p).EK, unit: 'mV', fmt: (v) => EM.sci(v, 8) },
      { k: 'ENa', label: 'Potencial de Nernst del Na⁺', short: 'E_Na', f: (p) => gk(p).ENa, unit: 'mV', fmt: (v) => EM.sci(v, 8) },
      { k: 'ECl', label: 'Potencial de Nernst del Cl⁻ (<i>kT</i>/<i>e</i>) ln([Cl]<sub>i</sub>/[Cl]<sub>o</sub>)', short: 'E_Cl', f: (p) => gk(p).ECl, unit: 'mV', fmt: (v) => EM.sci(v, 8) },
      { k: 'V', label: 'Potencial de reposo de Goldman–Hodgkin–Katz', short: 'V_m', f: (p) => gk(p).V, unit: 'mV', fmt: (v) => EM.sci(v, 8), hl: true }
    ]
  });

  /* ---- Ecuación del cable ---- */
  const cb = (p) => { const a = p.a * 1e-4; const lam = Math.sqrt(p.Rm * a / (2 * p.Ri)); return { lam, tau: p.Rm * p.Cm * 1e-6 }; };
  EM.formula('bio-cable', {
    gx: 'x',
    params: [
      { k: 'a', label: 'Radio del axón <i>a</i> (calamar gigante: 238 µm)', min: 0.1, max: 1000, value: 238, log: true, unit: 'µm', fmt: (v) => EM.sci(v, 4) },
      { k: 'Rm', label: 'Resistencia específica de la membrana <i>R</i><sub>m</sub> (1000 Ω·cm²)', min: 100, max: 1e5, value: 1000, log: true, unit: 'Ω·cm²', fmt: (v) => EM.sci(v, 4) },
      { k: 'Ri', label: 'Resistividad del axoplasma <i>R</i><sub>i</sub> (35.4 Ω·cm)', min: 10, max: 500, value: 35.4, log: true, unit: 'Ω·cm', fmt: (v) => EM.sci(v, 4) },
      { k: 'Cm', label: 'Capacidad de la membrana <i>C</i><sub>m</sub> (1 µF/cm²)', min: 0.1, max: 5, value: 1, log: true, unit: 'µF/cm²', fmt: (v) => EM.sci(v, 4) },
      { k: 'x', label: 'Distancia desde el punto de estímulo <i>x</i>', min: 0.01, max: 50, value: 5.8, log: true, unit: 'mm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'lam', label: 'Constante de longitud λ = √(<i>aR</i><sub>m</sub>/2<i>R</i><sub>i</sub>)', short: 'λ', f: (p) => cb(p).lam * 10, unit: 'mm', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'tau', label: 'Constante de tiempo τ = <i>R</i><sub>m</sub><i>C</i><sub>m</sub>', short: 'τ', f: (p) => cb(p).tau * 1e3, unit: 'ms', fmt: (v) => EM.sci(v, 8) },
      { k: 'V', label: 'Potencial relativo en <i>x</i>: <i>V</i>(<i>x</i>)/<i>V</i>₀ = e<sup>−<i>x</i>/λ</sup>', short: 'V(x)/V₀', f: (p) => Math.exp(-p.x * 0.1 / cb(p).lam), fmt: (v) => EM.sci(v, 8) },
      { k: 'v', label: 'Velocidad característica λ/τ', short: 'λ/τ', f: (p) => cb(p).lam * 1e-2 / cb(p).tau, unit: 'm/s', fmt: (v) => EM.sci(v, 8) }
    ]
  });

  /* ---- Stokes–Einstein ---- */
  EM.formula('bio-difusion', {
    gx: 'r',
    params: [
      { k: 'r', label: 'Radio hidrodinámico <i>r</i> (glucosa: 0.36 nm; lisozima: 1.9 nm)', min: 0.1, max: 1000, value: 0.5, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 4) },
      { k: 'eta', label: 'Viscosidad η (agua a 25 °C: 0.890 mPa·s)', min: 0.3, max: 1000, value: 0.89, log: true, unit: 'mPa·s', fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 273, max: 330, value: 298.15, unit: 'K', fmt: (v) => EM.sci(v, 5) },
      { k: 'L', label: 'Distancia de difusión <i>L</i>', min: 0.01, max: 1000, value: 10, log: true, unit: 'µm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'D', label: 'Coeficiente de difusión <i>D</i> = <i>kT</i>/(6πη<i>r</i>)', short: 'D', f: (p) => KB * p.T / (6 * PI * p.eta * 1e-3 * p.r * 1e-9) * 1e12, unit: 'µm²/s', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'z', label: 'Coeficiente de fricción ζ = 6πη<i>r</i>', short: 'ζ', f: (p) => 6 * PI * p.eta * 1e-3 * p.r * 1e-9 * 1e12, unit: 'pN·s/m', fmt: (v) => EM.sci(v, 8) },
      { k: 't', label: 'Tiempo de difusión en una dimensión <i>t</i> = <i>L</i>²/(2<i>D</i>)', short: 't', f: (p) => Math.pow(p.L, 2) / (2 * KB * p.T / (6 * PI * p.eta * 1e-3 * p.r * 1e-9) * 1e12), unit: 's', fmt: (v) => EM.sci(v, 8) },
      { k: 'x1', label: 'Desplazamiento cuadrático medio en 1 s (en una dimensión) √(2<i>Dt</i>)', short: 'x_rms(1 s)', f: (p) => Math.sqrt(2 * KB * p.T / (6 * PI * p.eta * 1e-3 * p.r * 1e-9) * 1e12), unit: 'µm', fmt: (v) => EM.sci(v, 8) }
    ]
  });

  /* ---- Elasticidad entrópica de polímeros ---- */
  const lan = (u) => {
    if (u < 1e-6) return 3 * u;
    let lo = 1e-9, hi = 1e5;
    for (let i = 0; i < 200; i++) { const mid = 0.5 * (lo + hi), fm = 1 / Math.tanh(mid) - 1 / mid; if (fm < u) lo = mid; else hi = mid; }
    return 0.5 * (lo + hi);
  };
  EM.formula('bio-polimero', {
    gx: 'fr',
    params: [
      { k: 'N', label: 'Número de segmentos de Kuhn <i>N</i> (λ-ADN: 165)', min: 5, max: 5000, value: 165, log: true, fmt: (v) => EM.sci(v, 4) },
      { k: 'b', label: 'Longitud de Kuhn <i>b</i> (ADN: 100 nm)', min: 1, max: 500, value: 100, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 4) },
      { k: 'fr', label: 'Extensión relativa <i>x</i>/<i>L</i> (<i>L</i> = <i>Nb</i>)', min: 0.01, max: 0.98, value: 0.5, fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 273, max: 350, value: 310.15, unit: 'K', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'R', label: 'Distancia extremo a extremo cuadrática media <i>R</i> = <i>b</i>√<i>N</i>', short: 'R_rms', f: (p) => p.b * Math.sqrt(p.N) * 1e-3, unit: 'µm', fmt: (v) => EM.sci(v, 8) },
      { k: 'Lc', label: 'Longitud de contorno <i>L</i> = <i>Nb</i>', short: 'L', f: (p) => p.N * p.b * 1e-3, unit: 'µm', fmt: (v) => EM.sci(v, 8) },
      { k: 'Fg', label: 'Fuerza gaussiana <i>F</i> = 3<i>kT</i><i>x</i>/(<i>Nb</i>²)', short: 'F (gauss)', f: (p) => 3 * KB * p.T * 1e21 * p.fr * p.N * p.b / (p.N * p.b * p.b), unit: 'pN', fmt: (v) => EM.sci(v, 8) },
      { k: 'Fj', label: 'Fuerza de la cadena de segmentos libres <i>F</i> = (<i>kT</i>/<i>b</i>) <i>L</i><sup>−1</sup>(<i>x</i>/<i>L</i>)', short: 'F (FJC)', f: (p) => KB * p.T * 1e21 / p.b * lan(p.fr), unit: 'pN', fmt: (v) => EM.sci(v, 8), hl: true }
    ]
  });

  /* ---- Presión osmótica ---- */
  const os = (p) => { const c = p.c, T = p.T, Vw = 18.2e-6; return { vh: c * RG * T, ex: -RG * T / Vw * Math.log(1 - c * Vw) }; };
  EM.formula('bio-osmosis', {
    gx: 'c',
    params: [
      { k: 'c', label: 'Osmolaridad <i>c</i> (plasma: ≈ 300 mOsm/L = 300 mol/m³)', min: 1, max: 1000, value: 300, log: true, unit: 'mol/m³', fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Temperatura <i>T</i>', min: 273, max: 330, value: 310.15, unit: 'K', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'vh', label: 'Presión osmótica de van\'t Hoff Π = <i>cRT</i>', short: 'Π', f: (p) => os(p).vh * 1e-3, unit: 'kPa', fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'atm', label: 'La misma presión', short: 'Π', f: (p) => os(p).vh / 101325, unit: 'atm', fmt: (v) => EM.sci(v, 8) },
      { k: 'h', label: 'Altura de la columna de agua equivalente Π/(ρ<i>g</i>)', short: 'h', f: (p) => os(p).vh / (1000 * GRAV), unit: 'm', fmt: (v) => EM.sci(v, 8) },
      { k: 'ex', label: 'Presión exacta Π = −(<i>RT</i>/<i>V</i><sub>w</sub>) ln(1 − <i>x</i><sub>s</sub>)', short: 'Π (exacta)', f: (p) => os(p).ex * 1e-3, unit: 'kPa', fmt: (v) => EM.sci(v, 8) }
    ]
  });
})();
