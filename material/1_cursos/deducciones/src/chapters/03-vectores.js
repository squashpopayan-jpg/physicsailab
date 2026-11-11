/* Capítulo 3 — Vectores, coordenadas curvilíneas y teoremas integrales */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI;

  /* Q(x) = erf(x/√2) − √(2/π) x e^{−x²/2}: serie estable para x < 1.5, 1 − (fuera) para x ≥ 1.5 */
  const qout = (x) => EM.erfc(x / Math.SQRT2) + Math.sqrt(2 / PI) * x * Math.exp(-x * x / 2);
  const qin = (x) => {
    if (x >= 1.5) return 1 - qout(x);
    let t = x * x * x / 3, s = t;
    for (let k = 1; k < 60; k++) { t *= -x * x / (2 * k) * (2 * k + 1) / (2 * k + 3); s += t; if (Math.abs(t) < 1e-19 * Math.abs(s)) break; }
    return Math.sqrt(2 / PI) * s;
  };

  /* 3.1 Divergencia y flujo de F = k r^m r̂ a través de una esfera de radio R */
  EM.formula('div-esfera', {
    params: [
      { k: 'm', label: 'Exponente <i>m</i> del campo <b>F</b> = <i>k</i> <i>r</i><sup><i>m</i></sup> <b>r̂</b>', min: -1, max: 4, step: 0.05, value: 1, fmt: (v) => EM.fix(v, 2) },
      { k: 'k', label: 'Constante <i>k</i>', min: 0.1, max: 10, value: 1, log: true, fmt: (v) => EM.sci(v, 3) },
      { k: 'R', label: 'Radio de la esfera <i>R</i>', min: 0.1, max: 10, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'div', label: 'Divergencia en <i>r</i> = <i>R</i>: ∇·<b>F</b> = (<i>m</i>+2)<i>kR</i><sup><i>m</i>−1</sup>', short: '∇·F', f: (p) => (p.m + 2) * p.k * Math.pow(p.R, p.m - 1), fmt: (v) => EM.sci(v, 5) },
      { k: 'flux', label: 'Flujo ∮<b>F</b>·d<b>A</b> = 4π<i>kR</i><sup><i>m</i>+2</sup>', short: 'flujo', f: (p) => 4 * PI * p.k * Math.pow(p.R, p.m + 2), fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'vint', label: 'Integral de volumen ∫∇·<b>F</b> d<i>V</i> (por Simpson, 2000 intervalos)', short: '∫∇·F dV', f: (p) => 4 * PI * EM.M.simpson((s) => ((p.m + 2) * p.k * Math.pow(p.R * Math.pow(s, 4), p.m + 1)) * 4 * p.R * Math.pow(s, 3), 0, 1, 2000), fmt: (v) => EM.sci(v, 6) }
    ]
  });

  /* 3.2 Laplaciano en esféricas de r^n P_l(cos θ) */
  EM.formula('lap-rn', {
    params: [
      { k: 'n', label: 'Exponente <i>n</i> de <i>r</i><sup><i>n</i></sup>', min: -6, max: 6, step: 0.1, value: 2, fmt: (v) => EM.fix(v, 1) },
      { k: 'l', label: 'Orden angular <i>l</i> (polinomio de Legendre <i>P</i><sub><i>l</i></sub>(cos θ))', min: 0, max: 5, step: 1, value: 0, fmt: (v) => v.toFixed(0), fixed: true },
      { k: 'r', label: 'Radio <i>r</i>', min: 0.1, max: 10, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'lam', label: 'Coeficiente λ = <i>n</i>(<i>n</i>+1) − <i>l</i>(<i>l</i>+1)', short: 'λ', f: (p) => p.n * (p.n + 1) - Math.round(p.l) * (Math.round(p.l) + 1), fmt: (v) => EM.fix(v, 4), hl: true },
      { k: 'lap', label: '∇²(<i>r</i><sup><i>n</i></sup><i>P</i><sub><i>l</i></sub>) / <i>P</i><sub><i>l</i></sub> = λ <i>r</i><sup><i>n</i>−2</sup>', short: '∇²f/P', f: (p) => (p.n * (p.n + 1) - Math.round(p.l) * (Math.round(p.l) + 1)) * Math.pow(p.r, p.n - 2), fmt: (v) => EM.sci(v, 5) },
      { k: 'n1', label: 'Soluciones armónicas (λ = 0): <i>n</i> = <i>l</i> y <i>n</i> = −(<i>l</i>+1)', short: 'raíz n = l', f: (p) => Math.round(p.l), fmt: (v) => v.toFixed(0) },
      { k: 'n2', label: 'Segunda raíz <i>n</i> = −(<i>l</i>+1)', short: 'raíz n = −l−1', f: (p) => -(Math.round(p.l) + 1), fmt: (v) => v.toFixed(0) }
    ]
  });

  /* 3.3 Rotacional y circulación de F = a r^m φ̂ */
  EM.formula('rot-azim', {
    params: [
      { k: 'm', label: 'Exponente <i>m</i> del campo <b>F</b> = <i>a</i> <i>r</i><sup><i>m</i></sup> <b>φ̂</b>', min: -0.5, max: 4, step: 0.05, value: 1, fmt: (v) => EM.fix(v, 2) },
      { k: 'a', label: 'Constante <i>a</i>', min: 0.1, max: 10, value: 1, log: true, fmt: (v) => EM.sci(v, 3) },
      { k: 'R', label: 'Radio de la circunferencia <i>R</i>', min: 0.1, max: 10, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'curl', label: 'Rotacional en <i>r</i> = <i>R</i>: (∇×<b>F</b>)<sub><i>z</i></sub> = (<i>m</i>+1)<i>aR</i><sup><i>m</i>−1</sup>', short: '(∇×F)z', f: (p) => (p.m + 1) * p.a * Math.pow(p.R, p.m - 1), fmt: (v) => EM.sci(v, 5) },
      { k: 'circ', label: 'Circulación ∮<b>F</b>·d<b>l</b> = 2π<i>aR</i><sup><i>m</i>+1</sup>', short: 'circulación', f: (p) => 2 * PI * p.a * Math.pow(p.R, p.m + 1), fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'sint', label: 'Flujo del rotacional ∬(∇×<b>F</b>)·d<b>A</b> (Simpson)', short: '∬rot dA', f: (p) => 2 * PI * EM.M.simpson((s) => (s === 0 ? 0 : (p.m + 1) * p.a * Math.pow(p.R * Math.pow(s, 4), p.m) * 4 * p.R * Math.pow(s, 3)), 0, 1, 2000), fmt: (v) => EM.sci(v, 6) }
    ]
  });

  /* 3.4 Delta de Dirac como límite: fuente gaussiana de anchura σ */
  EM.formula('delta-reg', {
    params: [
      { k: 'R', label: 'Radio de la esfera <i>R</i>', min: 0.01, max: 10, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'sg', label: 'Anchura σ de la fuente gaussiana', min: 0.01, max: 5, value: 1, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'Q', label: 'Fracción de la fuente dentro de <i>R</i>: <i>Q</i> = erf(<i>R</i>/√2σ) − √(2/π)(<i>R</i>/σ)e<sup>−<i>R</i>²/2σ²</sup>', short: 'Q(R)', f: (p) => qin(p.R / p.sg), fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 'out', label: 'Fracción fuera: 1 − <i>Q</i>', short: '1 − Q', f: (p) => qout(p.R / p.sg), fmt: (v) => EM.sci(v, 6) },
      { k: 'F', label: 'Campo en <i>r</i> = <i>R</i>: <i>F</i> = <i>Q</i>/<i>R</i>² (el de la carga puntual vale 1/<i>R</i>²)', short: 'F(R)', f: (p) => qin(p.R / p.sg) / (p.R * p.R), fmt: (v) => EM.sci(v, 6) }
    ]
  });

  /* 3.5 Volumen y superficie de la bola en n dimensiones */
  EM.formula('bola-n', {
    params: [
      { k: 'n', label: 'Dimensión <i>n</i>', min: 1, max: 30, step: 0.1, value: 3, fmt: (v) => EM.fix(v, 1) },
      { k: 'R', label: 'Radio <i>R</i>', min: 0.1, max: 10, value: 1, log: true, fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'V', label: 'Volumen <i>V</i><sub><i>n</i></sub> = π<sup><i>n</i>/2</sup><i>R</i><sup><i>n</i></sup>/Γ(<i>n</i>/2+1)', short: 'volumen', f: (p) => Math.exp((p.n / 2) * Math.log(PI) + p.n * Math.log(p.R) - EM.lgamma(p.n / 2 + 1)), fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'S', label: 'Superficie <i>S</i><sub><i>n</i>−1</sub> = 2π<sup><i>n</i>/2</sup><i>R</i><sup><i>n</i>−1</sup>/Γ(<i>n</i>/2)', short: 'superficie', f: (p) => Math.exp(Math.log(2) + (p.n / 2) * Math.log(PI) + (p.n - 1) * Math.log(p.R) - EM.lgamma(p.n / 2)), fmt: (v) => EM.sci(v, 6) }
    ]
  });
})();
