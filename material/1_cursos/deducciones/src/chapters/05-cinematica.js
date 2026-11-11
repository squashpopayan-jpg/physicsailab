/* Capítulo 5 — Cinemática */
(function () {
  'use strict';
  const EM = window.EM, PI = Math.PI;

  /* 5.1 Movimiento con aceleración constante */
  EM.formula('mrua', {
    gx: 't',
    params: [
      { k: 'v0', label: 'Velocidad inicial <i>v</i>₀', min: 0.1, max: 100, value: 30, log: true, unit: 'm/s', fmt: (v) => EM.sci(v, 3) },
      { k: 'a', label: 'Aceleración <i>a</i> (negativa = frenado)', min: -15, max: 15, value: -7, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) },
      { k: 't', label: 'Tiempo <i>t</i>', min: 0.01, max: 20, value: 2, log: true, unit: 's', fmt: (v) => EM.sci(v, 3) }
    ],
    outs: [
      { k: 'x', label: 'Posición <i>x</i> = <i>v</i>₀<i>t</i> + ½<i>at</i>²', short: 'x(t)', f: (p) => p.v0 * p.t + 0.5 * p.a * p.t * p.t, unit: 'm', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'v', label: 'Velocidad <i>v</i> = <i>v</i>₀ + <i>at</i>', short: 'v(t)', f: (p) => p.v0 + p.a * p.t, unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'vm', label: 'Velocidad media (<i>v</i>₀ + <i>v</i>)/2 = <i>x</i>/<i>t</i>', short: 'v media', f: (p) => p.v0 + 0.5 * p.a * p.t, unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'v2', label: 'Velocidad² por la relación <i>v</i>₀² + 2<i>ax</i>', short: 'v² = v₀² + 2ax', f: (p) => p.v0 * p.v0 + 2 * p.a * (p.v0 * p.t + 0.5 * p.a * p.t * p.t), unit: 'm²/s²', fmt: (v) => EM.sci(v, 5) },
      { k: 'ds', label: 'Distancia para detenerse <i>v</i>₀²/(2|<i>a</i>|) (si <i>a</i> &lt; 0)', short: 'distancia de frenado', f: (p) => p.v0 * p.v0 / (2 * Math.abs(p.a)), unit: 'm', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  /* 5.2 Tiro parabólico con altura inicial */
  const tof = (p) => { const vy = p.v0 * Math.sin(p.th * PI / 180); return (vy + Math.sqrt(vy * vy + 2 * p.g * p.h)) / p.g; };
  EM.formula('proyectil', {
    gx: 'th',
    aspect: 2.2,
    params: [
      { k: 'v0', label: 'Rapidez inicial <i>v</i>₀', min: 1, max: 100, value: 20, log: true, unit: 'm/s', fmt: (v) => EM.sci(v, 3) },
      { k: 'th', label: 'Ángulo de lanzamiento θ', min: 1, max: 89, value: 45, unit: '°', fmt: (v) => EM.fix(v, 1), angle: true },
      { k: 'h', label: 'Altura inicial <i>h</i>', min: 0.01, max: 100, value: 10, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'g', label: 'Gravedad <i>g</i>', min: 0.5, max: 30, value: 9.81, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'R', label: 'Alcance horizontal <i>R</i> = (<i>v</i>₀cos θ/<i>g</i>)[<i>v</i>₀sen θ + √(<i>v</i>₀²sen²θ + 2<i>gh</i>)]', short: 'alcance', f: (p) => p.v0 * Math.cos(p.th * PI / 180) * tof(p), unit: 'm', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'H', label: 'Altura máxima <i>h</i> + <i>v</i>₀²sen²θ/(2<i>g</i>)', short: 'altura máx.', f: (p) => p.h + Math.pow(p.v0 * Math.sin(p.th * PI / 180), 2) / (2 * p.g), unit: 'm', fmt: (v) => EM.sci(v, 5) },
      { k: 'T', label: 'Tiempo de vuelo <i>T</i>', short: 'tiempo de vuelo', f: (p) => tof(p), unit: 's', fmt: (v) => EM.sci(v, 5) },
      { k: 'ths', label: 'Ángulo de alcance máximo θ* = arctan[<i>v</i>₀/√(<i>v</i>₀² + 2<i>gh</i>)]', short: 'ángulo óptimo', f: (p) => Math.atan(p.v0 / Math.sqrt(p.v0 * p.v0 + 2 * p.g * p.h)) * 180 / PI, unit: '°', fmt: (v) => EM.fix(v, 3) },
      { k: 'Rm', label: 'Alcance máximo (<i>v</i>₀/<i>g</i>)√(<i>v</i>₀² + 2<i>gh</i>)', short: 'alcance máximo', f: (p) => p.v0 / p.g * Math.sqrt(p.v0 * p.v0 + 2 * p.g * p.h), unit: 'm', fmt: (v) => EM.sci(v, 5) }
    ],
    draw(ctx, w, h, p) {
      const T = tof(p), ths = Math.atan(p.v0 / Math.sqrt(p.v0 * p.v0 + 2 * p.g * p.h)) * 180 / PI;
      const Rm = p.v0 / p.g * Math.sqrt(p.v0 * p.v0 + 2 * p.g * p.h), Hm = p.h + p.v0 * p.v0 / (2 * p.g);
      const xmax = Rm * 1.08, ymax = Hm * 1.12, ml = 40, mb = 24, mt = 8, pw = w - ml - 10, ph = h - mb - mt;
      const sc = Math.min(pw / xmax, ph / ymax), X = (x) => ml + x * sc, Y = (y) => mt + ph - y * sc;
      ctx.save();
      ctx.strokeStyle = EM.col('--axis'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ml, Y(0)); ctx.lineTo(w - 6, Y(0)); ctx.moveTo(ml, Y(0)); ctx.lineTo(ml, mt); ctx.stroke();
      const traj = (deg, color, width, dash) => {
        const th = deg * PI / 180, vx = p.v0 * Math.cos(th), vy = p.v0 * Math.sin(th), Tt = (vy + Math.sqrt(vy * vy + 2 * p.g * p.h)) / p.g;
        ctx.beginPath(); ctx.strokeStyle = EM.col(color); ctx.lineWidth = width; ctx.setLineDash(dash || []);
        for (let i = 0; i <= 120; i++) { const t = Tt * i / 120, x = vx * t, y = p.h + vy * t - 0.5 * p.g * t * t; if (i === 0) ctx.moveTo(X(x), Y(y)); else ctx.lineTo(X(x), Y(Math.max(0, y))); }
        ctx.stroke(); ctx.setLineDash([]);
      };
      /* envolvente: y = h + v0²/(2g) − g x²/(2v0²) */
      ctx.beginPath(); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      for (let i = 0; i <= 100; i++) { const x = Rm * i / 100, y = p.h + p.v0 * p.v0 / (2 * p.g) - p.g * x * x / (2 * p.v0 * p.v0); if (i === 0) ctx.moveTo(X(x), Y(y)); else ctx.lineTo(X(x), Y(Math.max(0, y))); }
      ctx.stroke(); ctx.setLineDash([]);
      traj(ths, '--c4', 1.8, [6, 4]); traj(p.th, '--accent', 2.8);
      ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(X(0), Y(p.h), 4, 0, 2 * PI); ctx.fill();
      ctx.restore();
      EM.text(ctx, 'trayectoria (θ actual) · discontinua: θ óptimo · punteada gris: envolvente (parábola de seguridad)', ml + 6, mt + 12, { size: 10.5, color: '--ink-3' });
      EM.text(ctx, 'alcance máx. ' + EM.sci(Rm, 4) + ' m', X(Rm) - 4, Y(0) - 7, { size: 10.5, color: '--c4', align: 'right' });
    }
  });

  /* 5.3 Movimiento circular uniforme */
  EM.formula('circular', {
    gx: 'T',
    params: [
      { k: 'R', label: 'Radio de la trayectoria <i>R</i>', min: 0.1, max: 1e9, value: 6.371e6, log: true, unit: 'm', fmt: (v) => EM.sci(v, 4) },
      { k: 'T', label: 'Periodo <i>T</i>', min: 1e-3, max: 1e8, value: 86164.1, log: true, unit: 's', fmt: (v) => EM.sci(v, 5) }
    ],
    outs: [
      { k: 'w', label: 'Velocidad angular ω = 2π/<i>T</i>', short: 'ω', f: (p) => 2 * PI / p.T, unit: 'rad/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'v', label: 'Rapidez <i>v</i> = 2π<i>R</i>/<i>T</i>', short: 'v', f: (p) => 2 * PI * p.R / p.T, unit: 'm/s', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'ac', label: 'Aceleración centrípeta <i>a</i><sub>c</sub> = 4π²<i>R</i>/<i>T</i>²', short: 'a centrípeta', f: (p) => 4 * PI * PI * p.R / (p.T * p.T), unit: 'm/s²', fmt: (v) => EM.sci(v, 5) },
      { k: 'ag', label: 'Cociente <i>a</i><sub>c</sub>/<i>g</i> (con <i>g</i> = 9.80665 m/s²)', short: 'a/g', f: (p) => 4 * PI * PI * p.R / (p.T * p.T) / 9.80665, fmt: (v) => EM.sci(v, 5) }
    ]
  });

  /* 5.4 Velocidad y aceleración en coordenadas polares */
  EM.formula('polares', {
    gx: 'w',
    params: [
      { k: 'r', label: 'Distancia al origen <i>r</i>', min: 0.1, max: 10, value: 2, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'rd', label: 'Velocidad radial ṙ', min: 0.1, max: 10, value: 1, log: true, unit: 'm/s', fmt: (v) => EM.sci(v, 3) },
      { k: 'rdd', label: 'Aceleración radial r̈', min: 0, max: 10, value: 0, unit: 'm/s²', fmt: (v) => EM.fix(v, 2) },
      { k: 'w', label: 'Velocidad angular θ̇', min: 0.1, max: 10, value: 3, log: true, unit: 'rad/s', fmt: (v) => EM.sci(v, 3) },
      { k: 'al', label: 'Aceleración angular θ̈', min: 0, max: 10, value: 0, unit: 'rad/s²', fmt: (v) => EM.fix(v, 2) }
    ],
    outs: [
      { k: 'ar', label: '<i>a</i><sub>r</sub> = r̈ − <i>r</i>θ̇²', short: 'a_r', f: (p) => p.rdd - p.r * p.w * p.w, unit: 'm/s²', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'at', label: '<i>a</i><sub>θ</sub> = <i>r</i>θ̈ + 2ṙθ̇', short: 'a_θ', f: (p) => p.r * p.al + 2 * p.rd * p.w, unit: 'm/s²', fmt: (v) => EM.sci(v, 5) },
      { k: 'vt', label: '<i>v</i><sub>θ</sub> = <i>r</i>θ̇', short: 'v_θ', f: (p) => p.r * p.w, unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'vm', label: 'Rapidez |<b>v</b>| = √(ṙ² + <i>r</i>²θ̇²)', short: '|v|', f: (p) => Math.hypot(p.rd, p.r * p.w), unit: 'm/s', fmt: (v) => EM.sci(v, 5) },
      { k: 'am', label: 'Módulo de la aceleración |<b>a</b>|', short: '|a|', f: (p) => Math.hypot(p.rdd - p.r * p.w * p.w, p.r * p.al + 2 * p.rd * p.w), unit: 'm/s²', fmt: (v) => EM.sci(v, 5) }
    ]
  });

  /* 5.5 Cruzar un río: adición de velocidades */
  EM.formula('rio', {
    gx: 'f',
    params: [
      { k: 'd', label: 'Ancho del río <i>d</i>', min: 10, max: 1000, value: 100, log: true, unit: 'm', fmt: (v) => EM.sci(v, 3) },
      { k: 'u', label: 'Rapidez del bote respecto del agua <i>u</i>', min: 0.5, max: 10, value: 2, log: true, unit: 'm/s', fmt: (v) => EM.sci(v, 3) },
      { k: 'f', label: 'Razón entre la corriente y el bote <i>w</i>/<i>u</i>', min: 0.01, max: 0.95, value: 0.5, fmt: (v) => EM.fix(v, 3) }
    ],
    outs: [
      { k: 'T1', label: 'Tiempo mínimo (proa perpendicular) <i>d</i>/<i>u</i>', short: 'tiempo mínimo', f: (p) => p.d / p.u, unit: 's', fmt: (v) => EM.sci(v, 5) },
      { k: 'dr', label: 'Deriva corriente abajo en ese caso <i>wd</i>/<i>u</i>', short: 'deriva', f: (p) => p.f * p.d, unit: 'm', fmt: (v) => EM.sci(v, 5), hl: true },
      { k: 'T2', label: 'Tiempo para llegar al punto opuesto <i>d</i>/√(<i>u</i>² − <i>w</i>²)', short: 'tiempo al punto opuesto', f: (p) => p.d / (p.u * Math.sqrt(1 - p.f * p.f)), unit: 's', fmt: (v) => EM.sci(v, 5) },
      { k: 'al', label: 'Ángulo de proa contra la corriente α = arcsen(<i>w</i>/<i>u</i>)', short: 'ángulo de proa', f: (p) => Math.asin(p.f) * 180 / PI, unit: '°', fmt: (v) => EM.fix(v, 3) }
    ]
  });
})();
