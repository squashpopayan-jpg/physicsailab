/* Capítulo 25 — Óptica geométrica */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI, C = 299792458, DEG = 180 / PI;

  const sn = (p) => ({ t2: Math.asin(p.n1 * Math.sin(p.t1 / DEG) / p.n2) * DEG });
  EM.formula('snell', {
    gx: 't1',
    params: [
      { k: 'n1', label: 'Índice del medio de incidencia (menos denso) <i>n</i>₁', min: 1, max: 1.5, value: 1, fmt: (v) => EM.sci(v, 4), step: 0.01 },
      { k: 'n2', label: 'Índice del medio denso <i>n</i>₂', min: 1.5, max: 3, value: 1.5, fmt: (v) => EM.sci(v, 4), step: 0.01 },
      { k: 't1', label: 'Ángulo de incidencia θ₁', min: 0.1, max: 89, value: 30, unit: '°', fmt: (v) => EM.sci(v, 4), angle: true }
    ],
    outs: [
      { k: 't2', label: 'Ángulo refractado θ₂ = arcsen(<i>n</i>₁ senθ₁/<i>n</i>₂)', short: 'θ₂', f: (p) => sn(p).t2, unit: '°', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'tc', label: 'Ángulo crítico (de <i>n</i>₂ a <i>n</i>₁) arcsen(<i>n</i>₁/<i>n</i>₂)', short: 'θ crítico', f: (p) => Math.asin(p.n1 / p.n2) * DEG, unit: '°', fmt: (v) => EM.sci(v, 6) },
      { k: 'tB', label: 'Ángulo de Brewster arctan(<i>n</i>₂/<i>n</i>₁)', short: 'θ de Brewster', f: (p) => Math.atan(p.n2 / p.n1) * DEG, unit: '°', fmt: (v) => EM.sci(v, 6) },
      { k: 'dev', label: 'Desviación θ₁ − θ₂', short: 'desviación', f: (p) => p.t1 - sn(p).t2, unit: '°', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const ln = (p) => { const f = 1 / ((p.n - 1) * (1 / p.R1 + 1 / p.R2)); return { f, sp: p.s * f / (p.s - f) }; };
  EM.formula('lente', {
    gx: 's',
    params: [
      { k: 'n', label: 'Índice de refracción del vidrio <i>n</i>', min: 1.2, max: 2.5, value: 1.5, fmt: (v) => EM.sci(v, 4), step: 0.01 },
      { k: 'R1', label: 'Radio de la primera cara (biconvexa) <i>R</i>₁', min: 1, max: 100, value: 10, log: true, unit: 'cm', fmt: (v) => EM.sci(v, 4) },
      { k: 'R2', label: 'Radio de la segunda cara <i>R</i>₂', min: 1, max: 100, value: 10, log: true, unit: 'cm', fmt: (v) => EM.sci(v, 4) },
      { k: 's', label: 'Distancia del objeto a la lente <i>s</i>', min: 1, max: 300, value: 30, log: true, unit: 'cm', fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'f', label: 'Distancia focal 1/<i>f</i> = (<i>n</i> − 1)(1/<i>R</i>₁ + 1/<i>R</i>₂)', short: 'f', f: (p) => ln(p).f, unit: 'cm', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'sp', label: 'Distancia de la imagen <i>s</i>′ = <i>sf</i>/(<i>s</i> − <i>f</i>) (negativa: virtual)', short: "s′", f: (p) => ln(p).sp, unit: 'cm', fmt: (v) => EM.sci(v, 6) },
      { k: 'M', label: 'Aumento lateral <i>M</i> = −<i>s</i>′/<i>s</i>', short: 'M', f: (p) => -ln(p).sp / p.s, fmt: (v) => EM.sci(v, 6) },
      { k: 'P', label: 'Potencia 1/<i>f</i>', short: 'potencia', f: (p) => 100 / ln(p).f, unit: 'dioptrías', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const pr = (p) => { const A = p.A / DEG, dm = 2 * Math.asin(p.n * Math.sin(A / 2)) - A; return { A, dm, ti: (A + dm) / 2 }; };
  EM.formula('prisma', {
    gx: 'n',
    params: [
      { k: 'A', label: 'Ángulo del prisma <i>A</i>', min: 10, max: 60, value: 60, unit: '°', fmt: (v) => EM.sci(v, 4), angle: true },
      { k: 'n', label: 'Índice de refracción <i>n</i>', min: 1.2, max: 1.9, value: 1.5, fmt: (v) => EM.sci(v, 4), step: 0.01 }
    ],
    outs: [
      { k: 'dm', label: 'Desviación mínima δ<sub>min</sub> = 2 arcsen(<i>n</i> sen(<i>A</i>/2)) − <i>A</i>', short: 'δ mínima', f: (p) => pr(p).dm * DEG, unit: '°', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'ti', label: 'Ángulo de incidencia en la desviación mínima (<i>A</i> + δ<sub>min</sub>)/2', short: 'θ de incidencia', f: (p) => pr(p).ti * DEG, unit: '°', fmt: (v) => EM.sci(v, 6) },
      { k: 'dd', label: 'Dispersión angular dδ/d<i>n</i> = 2 sen(<i>A</i>/2)/cos((<i>A</i> + δ)/2)', short: 'dδ/dn', f: (p) => 2 * Math.sin(pr(p).A / 2) / Math.cos(pr(p).ti) * DEG, unit: '°', fmt: (v) => EM.sci(v, 6) },
      { k: 'sp', label: 'Separación rojo–azul del vidrio crown (Δ<i>n</i> = 0.008)', short: 'separación', f: (p) => 2 * Math.sin(pr(p).A / 2) / Math.cos(pr(p).ti) * DEG * 0.008 * 60, unit: 'arcmin', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const ar = (n, k) => { const ci = Math.sqrt((n * n - 1) / (k * (k + 2))), ti = Math.acos(ci), tt = Math.asin(Math.sin(ti) / n); return { ti, D: k * 180 + 2 * ti * DEG - 2 * (k + 1) * tt * DEG }; };
  EM.formula('arcoiris', {
    gx: 'n',
    params: [
      { k: 'n', label: 'Índice de refracción del agua <i>n</i> (rojo 1.331, azul-violeta 1.344)', min: 1.3, max: 1.4, value: 1.333, fmt: (v) => EM.sci(v, 5), step: 0.001 }
    ],
    outs: [
      { k: 'a1', label: 'Arco primario: radio angular 180° − <i>D</i><sub>min</sub>, cos²θ = (<i>n</i>² − 1)/3', short: 'arco primario', f: (p) => 180 - ar(p.n, 1).D, unit: '°', fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'a2', label: 'Arco secundario: <i>D</i><sub>min</sub> − 180°, cos²θ = (<i>n</i>² − 1)/8', short: 'arco secundario', f: (p) => ar(p.n, 2).D - 180, unit: '°', fmt: (v) => EM.sci(v, 6) },
      { k: 'i1', label: 'Ángulo de incidencia en el arco primario', short: 'θ incidencia (1.º)', f: (p) => ar(p.n, 1).ti * DEG, unit: '°', fmt: (v) => EM.sci(v, 6) },
      { k: 'i2', label: 'Ángulo de incidencia en el arco secundario', short: 'θ incidencia (2.º)', f: (p) => ar(p.n, 2).ti * DEG, unit: '°', fmt: (v) => EM.sci(v, 6) }
    ]
  });

  const fb = (p) => { const n2 = p.n1 * (1 - p.De); return { n2, NA: Math.sqrt(p.n1 * p.n1 - n2 * n2) }; };
  EM.formula('fibra', {
    gx: 'De',
    params: [
      { k: 'n1', label: 'Índice del núcleo <i>n</i>₁', min: 1.4, max: 1.7, value: 1.48, fmt: (v) => EM.sci(v, 4), step: 0.01 },
      { k: 'De', label: 'Diferencia relativa de índices Δ = (<i>n</i>₁ − <i>n</i>₂)/<i>n</i>₁', min: 3e-4, max: 0.05, value: 0.01, log: true, fmt: (v) => EM.sci(v, 4) }
    ],
    outs: [
      { k: 'NA', label: 'Apertura numérica NA = √(<i>n</i>₁² − <i>n</i>₂²)', short: 'NA', f: (p) => fb(p).NA, fmt: (v) => EM.sci(v, 6), hl: true },
      { k: 'ta', label: 'Ángulo de aceptación en el aire arcsen(NA)', short: 'θ de aceptación', f: (p) => Math.asin(fb(p).NA) * DEG, unit: '°', fmt: (v) => EM.sci(v, 6) },
      { k: 'tc', label: 'Ángulo crítico en la interfaz núcleo–revestimiento', short: 'θ crítico', f: (p) => Math.asin(fb(p).n2 / p.n1) * DEG, unit: '°', fmt: (v) => EM.sci(v, 6) },
      { k: 'dt', label: 'Ensanchamiento modal por unidad de longitud <i>n</i>₁(<i>n</i>₁ − <i>n</i>₂)/(<i>cn</i>₂)', short: 'Δt/L', f: (p) => p.n1 * (p.n1 - fb(p).n2) / (C * fb(p).n2) * 1e12, unit: 'ns/km', fmt: (v) => EM.sci(v, 6) },
      { k: 'BL', label: 'Producto máximo velocidad × longitud 1/(2Δ<i>t</i>/<i>L</i>)', short: 'B·L', f: (p) => 1 / (2 * p.n1 * (p.n1 - fb(p).n2) / (C * fb(p).n2) * 1e3) * 1e-6, unit: 'Mb/s·km', fmt: (v) => EM.sci(v, 6) }
    ]
  });
})();
