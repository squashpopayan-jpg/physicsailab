/* Capítulo 18 — Fricción en el plano inclinado */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  /* Pares de materiales: [nombre, μs, μk] — valores ilustrativos */
  const SUP = { mm: ['Madera sobre madera', 0.4, 0.3], li: ['Lija fina sobre madera', 0.65, 0.5], fi: ['Fieltro sobre madera', 0.3, 0.22], pl: ['Plástico sobre madera', 0.25, 0.18] };
  EM.defineSim('friccion-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'friccion', aspect: [1.4, 1.2],
      cols: [{ k: 'th', t: 'θ (°)', d: 1 }, { k: 'tipo', t: 'medida' }, { k: 't', t: 't₅₀ (s)', d: 2 }, { k: 'a', t: 'a (m/s²)', d: 3 }, { k: 'X', t: 'tan θ', d: 4 }, { k: 'Y', t: 'a/(g cos θ)', d: 4 }],
      controles(sim) {
        sim.group('Plano y bloque');
        sim.select('sup', { label: 'Superficies', options: Object.keys(SUP).map((k) => [k, SUP[k][0]]), value: 'mm' });
        sim.slider('m', { label: 'Masa del bloque', min: 0.05, max: 0.5, step: 0.01, value: 0.1, unit: 'g', fmt: (v) => Math.round(v * 1000) });
        sim.seg('modo', { label: 'Medida', options: [['cri', 'Ángulo crítico'], ['des', 'Deslizamiento']], value: 'cri' });
        sim.slider('th', { label: 'Ángulo fijo para deslizamiento', min: 10, max: 45, step: 0.5, value: 28, unit: '°', fmt: (v) => EM.fix(v, 1) });
      },
      paso(dt, st) { st.ta = ((st.ta || 0) + dt) % 3; },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, S = SUP[p.sup];
        const th = p.modo === 'cri' ? Math.atan(S[1]) * Math.min(1, (st.ta || 0) / 2) : (p.th * Math.PI) / 180;
        const x0 = W * 0.12, y0 = H * 0.82, Lp = W * 0.72;
        D.mesa(ctx, W * 0.03, W * 0.97, y0, { alto: H * 0.12 });
        const x1 = x0 + Lp * Math.cos(th), y1 = y0 - Lp * Math.sin(th);
        D.rampa(ctx, x0, y0, x1, y1, { grosor: -10, fill: '--wood' });
        let s = 0.75;
        const g = EM.local().g;
        if (p.modo === 'des') { const a = MO.aDeslizando(g, th, S[2]); const t = Math.max(0, (st.ta || 0) - 0.5); s = Math.max(0.1, 0.75 - (0.5 * Math.max(0, a) * t * t) / 0.8); }
        if (p.modo === 'cri' && (st.ta || 0) > 2) { const t = (st.ta || 0) - 2, a = Math.max(0, MO.aDeslizando(g, Math.atan(S[1]), S[2])); s = Math.max(0.1, 0.75 - (0.5 * a * t * t) / 0.8); }
        const bx = x0 + s * Lp * Math.cos(th), by = y0 - s * Lp * Math.sin(th);
        ctx.save(); ctx.translate(bx, by); ctx.rotate(-th); D.block(ctx, 0, -14 - 10, 46, 28, { fill: '--c1', label: Math.round(p.m * 1000) + ' g', size: 10 }); ctx.restore();
        ctx.save(); ctx.strokeStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.arc(x0, y0, 50, -th, 0); ctx.stroke(); ctx.restore();
        D.label(ctx, EM.fix((th * 180) / Math.PI, 1) + '°', x0 + 56, y0 - 8);
      },
      medir(p, rnd) {
        const S = SUP[p.sup], g = EM.local().g;
        if (p.modo === 'cri') {
          const mus = Math.max(0.05, S[1] * (1 + rnd.gauss(0, 0.08)));
          const th = L.quant((Math.atan(mus) * 180) / Math.PI + rnd.gauss(0, 0.2), 0.1);
          return { th, tipo: 'crítico', t: '—', a: '—', X: Math.tan((th * Math.PI) / 180), Y: '—' };
        }
        const th = (p.th * Math.PI) / 180, muk = Math.max(0.02, S[2] * (1 + rnd.gauss(0, 0.04)));
        const a = MO.aDeslizando(g, th, muk);
        if (a <= 0.02) return { th: p.th, tipo: 'no desliza', t: '—', a: 0, X: Math.tan(th), Y: '—' };
        const t = L.quant(Math.sqrt(1 / a) + Math.SQRT2 * rnd.gauss(0, 0.06), 0.01), am = 1 / (t * t);
        return { th: p.th, tipo: 'deslizamiento', t, a: am, X: Math.tan(th), Y: am / (g * Math.cos(th)) };
      },
      serie(p, rnd, st) {
        const out = [];
        if (p.modo === 'cri') { for (let k = 0; k < 10; k++) out.push(this.medir(p, rnd, st)); return out; }
        const S = SUP[p.sup], c = (Math.atan(S[1]) * 180) / Math.PI;
        for (const d of [3, 6, 9, 12, 15, 18]) for (let k = 0; k < 2; k++) out.push(this.medir(Object.assign({}, p, { th: Math.min(60, c + d) }), rnd, st));
        return out;
      },
      grafica(rows, p) {
        if (p.modo === 'cri') { const r = rows.filter((x) => x.tipo === 'crítico'); return { x: r.map((_, i) => i + 1), y: r.map((x) => x.th), xl: 'medida n.°', yl: 'θc (°)', ajuste: null, curva: () => (Math.atan(SUP[p.sup][1]) * 180) / Math.PI, xr: [0, Math.max(11, r.length + 1)], cero: false }; }
        const r = rows.filter((x) => x.tipo === 'deslizamiento');
        return { x: r.map((x) => x.X), y: r.map((x) => x.Y), xl: 'tan θ', yl: 'a/(g cos θ)', ajuste: 'recta', curva: (x) => x - SUP[p.sup][2] };
      },
      resultado(fit, rows, p) {
        const S = SUP[p.sup], out = [['ref', 'μs y μk del material (ilustrativos)', EM.fix(S[1], 2) + ' y ' + EM.fix(S[2], 2)]];
        const cr = rows.filter((x) => x.tipo === 'crítico');
        if (cr.length >= 2) {
          const ths = cr.map((x) => (x.th * Math.PI) / 180), m = L.mean(ths), u = L.sem(ths);
          out.push(['mus', 'μs = tan θc', L.pm(Math.tan(m), u / Math.cos(m) ** 2), true]);
          out.push(['thc', 'θc promedio', L.pm((m * 180) / Math.PI, (u * 180) / Math.PI, '°')]);
        }
        if (p.modo === 'des' && fit && rows.filter((x) => x.tipo === 'deslizamiento').length >= 3) {
          out.push(['pen', 'Pendiente (debe ser 1)', L.pm(fit.m, fit.sm)]);
          out.push(['muk', 'μk = −intercepto', L.pm(-fit.b, fit.sb), true]);
        }
        return out;
      }
    });
  });
})();
