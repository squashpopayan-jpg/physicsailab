/* Capítulo 2 — Cálculo para físicos: series, integrales y aproximaciones */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI;
  const dfact = (m) => { let r = 1; for (let i = m; i > 1; i -= 2) r *= i; return r; };   /* m!! */

  /* 2.1 Energía cinética relativista y la serie binomial */
  EM.formula('binomial-rel', {
    params: [{ k: 'b', label: 'Velocidad relativa β = <i>v</i>/<i>c</i>', min: 0.001, max: 0.99, value: 0.1, log: true, fmt: (v) => EM.sci(v, 3) }],
    outs: [
      { k: 'K', label: 'Exacta γ − 1 = (1 − β²)<sup>−1/2</sup> − 1', short: 'γ − 1 exacta', f: (p) => { const q = Math.sqrt(1 - p.b * p.b); return p.b * p.b / (q * (1 + q)); }, fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'k1', label: 'Orden 1: β²/2 (newtoniana)', short: 'orden 1', f: (p) => p.b * p.b / 2, fmt: (v) => EM.sci(v, 6) },
      { k: 'k2', label: 'Orden 2: β²/2 + 3β⁴/8', short: 'orden 2', f: (p) => p.b * p.b / 2 + 3 * Math.pow(p.b, 4) / 8, fmt: (v) => EM.sci(v, 6) },
      { k: 'k3', label: 'Orden 3: + 5β⁶/16', short: 'orden 3', f: (p) => p.b * p.b / 2 + 3 * Math.pow(p.b, 4) / 8 + 5 * Math.pow(p.b, 6) / 16, fmt: (v) => EM.sci(v, 6) },
      { k: 'e1', label: 'Error relativo de la fórmula newtoniana (γ − 1)/(β²/2) − 1', short: 'error de β²/2', f: (p) => { const q = Math.sqrt(1 - p.b * p.b); return p.b * p.b * (1 + 1 / (1 + q)) / (q * (1 + q)); }, fmt: (v) => EM.sci(v, 4) }
    ]
  });

  /* 2.2 Integral gaussiana y sus momentos */
  EM.formula('gauss', {
    params: [
      { k: 'a', label: 'Coeficiente <i>a</i> de la gaussiana e<sup>−<i>ax</i>²</sup>', min: 0.01, max: 100, value: 1, log: true, fmt: (v) => EM.sci(v, 3) },
      { k: 'n', label: 'Orden del momento 2<i>n</i>', min: 1, max: 6, step: 1, value: 2, fmt: (v) => v.toFixed(0), fixed: true }
    ],
    outs: [
      { k: 'I', label: 'Integral ∫e<sup>−<i>ax</i>²</sup>d<i>x</i> = √(π/<i>a</i>)', short: 'integral', f: (p) => Math.sqrt(PI / p.a), fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'sg', label: 'Anchura σ = 1/√(2<i>a</i>) (desviación típica de la distribución normalizada)', short: 'σ', f: (p) => 1 / Math.sqrt(2 * p.a), fmt: (v) => EM.sci(v, 5) },
      { k: 'M', label: 'Momento ∫<i>x</i><sup>2<i>n</i></sup>e<sup>−<i>ax</i>²</sup>d<i>x</i> = (2<i>n</i>−1)!!√π/(2<sup><i>n</i></sup><i>a</i><sup><i>n</i>+1/2</sup>)', short: 'momento 2n', f: (p) => dfact(2 * Math.round(p.n) - 1) * Math.sqrt(PI) / (Math.pow(2, Math.round(p.n)) * Math.pow(p.a, Math.round(p.n) + 0.5)), fmt: (v) => EM.sci(v, 6) },
      { k: 'mm', label: 'Promedio ⟨<i>x</i><sup>2<i>n</i></sup>⟩ = (2<i>n</i>−1)!!/(2<i>a</i>)<sup><i>n</i></sup>', short: 'promedio ⟨x^2n⟩', f: (p) => dfact(2 * Math.round(p.n) - 1) / Math.pow(2 * p.a, Math.round(p.n)), fmt: (v) => EM.sci(v, 6) }
    ]
  });

  /* 2.3 Fórmula de Stirling */
  const s1 = (N) => N * Math.log(N) - N, s2 = (N) => s1(N) + 0.5 * Math.log(2 * PI * N), s3 = (N) => s2(N) + 1 / (12 * N);
  EM.formula('stirling', {
    params: [{ k: 'N', label: 'Número <i>N</i>', min: 1, max: 1000, value: 10, log: true, fmt: (v) => EM.fix(v, 1) }],
    outs: [
      { k: 'ln', label: 'ln <i>N</i>! exacto = ln Γ(<i>N</i>+1)', short: 'ln N!', f: (p) => EM.lgamma(p.N + 1), fmt: (v) => EM.sci(v, 8), hl: true },
      { k: 's1', label: 'Aproximación 1: <i>N</i> ln <i>N</i> − <i>N</i>', short: 'N ln N − N', f: (p) => s1(p.N), fmt: (v) => EM.sci(v, 8) },
      { k: 's2', label: 'Aproximación 2: + ½ ln(2π<i>N</i>)', short: '+ ½ ln 2πN', f: (p) => s2(p.N), fmt: (v) => EM.sci(v, 8) },
      { k: 's3', label: 'Aproximación 3: + 1/(12<i>N</i>)', short: '+ 1/12N', f: (p) => s3(p.N), fmt: (v) => EM.sci(v, 8) },
      { k: 'e1', label: 'Error de la aproximación 1: ln <i>N</i>! − (<i>N</i> ln <i>N</i> − <i>N</i>)', short: 'error 1', f: (p) => EM.lgamma(p.N + 1) - s1(p.N), fmt: (v) => EM.sci(v, 5) },
      { k: 'e2', label: 'Error de la aproximación 2: ln <i>N</i>! − (…+ ½ ln 2π<i>N</i>)', short: 'error 2', f: (p) => EM.lgamma(p.N + 1) - s2(p.N), fmt: (v) => EM.sci(v, 5) }
    ]
  });

  /* 2.4 Serie geométrica: pelota que rebota */
  EM.formula('rebote', {
    params: [
      { k: 'h', label: 'Altura inicial <i>h</i>', min: 0.1, max: 100, value: 1, log: true, unit: 'm' },
      { k: 'e', label: 'Coeficiente de restitución <i>e</i>', min: 0.05, max: 0.98, value: 0.8, fmt: (v) => EM.fix(v, 2) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'T', label: 'Tiempo hasta quedar en reposo <i>t</i><sub>0</sub>(1+<i>e</i>)/(1−<i>e</i>)', short: 'tiempo total', f: (p) => Math.sqrt(2 * p.h / p.g) * (1 + p.e) / (1 - p.e), unit: 's', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'D', label: 'Distancia recorrida <i>h</i>(1+<i>e</i>²)/(1−<i>e</i>²)', short: 'distancia total', f: (p) => p.h * (1 + p.e * p.e) / (1 - p.e * p.e), unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 't0', label: 'Tiempo de la primera caída <i>t</i><sub>0</sub> = √(2<i>h</i>/<i>g</i>)', short: 't₀', f: (p) => Math.sqrt(2 * p.h / p.g), unit: 's', fmt: (v) => EM.sci(v, 5) },
      { k: 'nb', label: 'Rebotes hasta que la altura baja de 1 mm: ln(10⁻³ m/<i>h</i>)/(2 ln <i>e</i>)', short: 'rebotes hasta 1 mm', f: (p) => Math.log(1e-3 / p.h) / (2 * Math.log(p.e)), fmt: (v) => EM.fix(v, 2) }
    ]
  });

  /* 2.5 Propagación de errores: g = 4π²L/T² */
  EM.formula('errores', {
    params: [
      { k: 'L', label: 'Longitud medida <i>L</i>', min: 0.1, max: 10, value: 1, log: true, unit: 'm', fmt: (v) => EM.fix(v, 3) },
      { k: 'dL', label: 'Incertidumbre δ<i>L</i>', min: 1e-4, max: 0.05, value: 0.001, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'T', label: 'Periodo medido <i>T</i>', min: 0.5, max: 6, value: 2.006, log: true, unit: 's', fmt: (v) => EM.fix(v, 3) },
      { k: 'dT', label: 'Incertidumbre δ<i>T</i>', min: 1e-4, max: 0.05, value: 0.01, log: true, unit: 's', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'g', label: 'Gravedad medida <i>g</i> = 4π²<i>L</i>/<i>T</i>²', short: 'g', f: (p) => 4 * PI * PI * p.L / (p.T * p.T), unit: 'm/s²', fmt: (v) => EM.fix(v, 4), hl: true },
      { k: 'rg', label: 'Incertidumbre relativa δ<i>g</i>/<i>g</i> = √[(δ<i>L</i>/<i>L</i>)² + 4(δ<i>T</i>/<i>T</i>)²]', short: 'δg/g', f: (p) => Math.sqrt(Math.pow(p.dL / p.L, 2) + 4 * Math.pow(p.dT / p.T, 2)), fmt: (v) => EM.sci(v, 4) },
      { k: 'dg', label: 'Incertidumbre absoluta δ<i>g</i>', short: 'δg', f: (p) => 4 * PI * PI * p.L / (p.T * p.T) * Math.sqrt(Math.pow(p.dL / p.L, 2) + 4 * Math.pow(p.dT / p.T, 2)), unit: 'm/s²', fmt: (v) => EM.sci(v, 4) }
    ]
  });

  /* 2.6 Función gamma y la integral de x^s e^{−bx} */
  EM.formula('gamma-int', {
    params: [
      { k: 's', label: 'Exponente <i>s</i> de <i>x</i><sup><i>s</i></sup>', min: 0, max: 10, value: 0.5, fmt: (v) => EM.fix(v, 2) },
      { k: 'b', label: 'Parámetro <i>b</i> de e<sup>−<i>bx</i></sup>', min: 0.01, max: 100, value: 1, log: true, fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'I', label: 'Integral ∫₀^∞ <i>x</i><sup><i>s</i></sup>e<sup>−<i>bx</i></sup>d<i>x</i> = Γ(<i>s</i>+1)/<i>b</i><sup><i>s</i>+1</sup>', short: 'integral', f: (p) => Math.exp(EM.lgamma(p.s + 1)) / Math.pow(p.b, p.s + 1), fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'G', label: 'Γ(<i>s</i>+1)', short: 'Γ(s+1)', f: (p) => Math.exp(EM.lgamma(p.s + 1)), fmt: (v) => EM.sci(v, 6) },
      { k: 'mu', label: 'Valor medio ⟨<i>x</i>⟩ = (<i>s</i>+1)/<i>b</i>', short: '⟨x⟩', f: (p) => (p.s + 1) / p.b, fmt: (v) => EM.sci(v, 5) },
      { k: 'mo', label: 'Moda (máximo) <i>s</i>/<i>b</i>', short: 'moda', f: (p) => p.s / p.b, fmt: (v) => EM.sci(v, 5) }
    ]
  });
})();
