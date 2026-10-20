/* Capítulo 19 — Segunda ley: carro y masa colgante */
(function () {
  'use strict';
  const EM = window.EM, L = EM.L, D = EM.draw;
  const I = 5.85e-5, R = 0.06, TF = 1e-4;
  const MED = { cro: ['Cronómetro manual, 80 cm', 0], vid: ['Video a 60 cuadros por segundo', 1], acc: ['Acelerómetro del celular', 2] };
  EM.SEG = {
    a: (m, Mt, mur, g) => Math.max(0, (m * g - mur * (Mt - m) * g - TF / R) / (Mt + I / (R * R)))
  };
  EM.defineSim('segunda-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'segunda-ley', aspect: [1.5, 1.2],
      cols: [{ k: 'm', t: 'm colgante (kg)', d: 3 }, { k: 'F', t: 'F = mg (N)', d: 4 }, { k: 'Mt', t: 'M total (kg)', d: 3 }, { k: 't', t: 't (s)', d: 2 }, { k: 'a', t: 'a (m/s²)', d: 3 }],
      controles(sim) {
        sim.group('Sistema');
        sim.slider('Mc', { label: 'Carro (con celular si se usa)', min: 0.2, max: 1, step: 0.01, value: 0.5, unit: 'kg', fmt: (v) => EM.fix(v, 2) });
        sim.slider('n', { label: 'Arandelas de 10 g en el portapesas', min: 0, max: 10, step: 1, value: 5, fmt: (v) => v.toFixed(0) });
        sim.slider('mur', { label: 'Resistencia a la rodadura μr', min: 0, max: 0.04, step: 0.001, value: 0.01, fmt: (v) => EM.fix(v, 3) });
        sim.select('ins', { label: 'Medida de la aceleración', options: Object.keys(MED).map((k) => [k, MED[k][0]]), value: 'cro' });
        sim.check('mal', { label: 'Error: agregar arandelas nuevas en vez de pasarlas', value: false });
      },
      paso(dt, st) { st.ta = ((st.ta || 0) + dt) % 3.5; },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, g = EM.local().g;
        const m = 0.01 + 0.01 * p.n, Mt = p.mal ? p.Mc + 0.01 + 0.01 * p.n : p.Mc + 0.11;
        const a = EM.SEG.a(m, Mt, p.mur, g), t = Math.max(0, (st.ta || 0) - 0.5), x = Math.min(0.8, 0.5 * a * t * t);
        const ym = H * 0.45, x0 = W * 0.06, xp = W * 0.86, sc = (xp - x0 - W * 0.12) / 0.9;
        D.mesa(ctx, W * 0.02, xp + 4, ym, { alto: H * 0.45 });
        const cx = x0 + x * sc, cw = W * 0.2;
        const cr = D.carro(ctx, cx, ym, cw, { color: '--c1', label: EM.fix(p.Mc, 2) + ' kg' });
        const nCar = p.mal ? 10 : 10 - p.n;
        for (let k = 0; k < nCar; k++) D.rect(ctx, cx + cw * 0.12 + (k % 5) * cw * 0.15, cr.top - 6 - Math.floor(k / 5) * 6, cw * 0.12, 5, { fill: '--metal-dark', stroke: null });
        const yc = cr.top + cr.h * 0.5;
        D.polea(ctx, xp, ym - 14, 14, { ang: (x / 0.014) % 6.28 });
        D.hilo(ctx, cx + cw, yc, xp, ym - 28 + 0.5);
        const yh = ym + 40 + x * sc * 0.6;
        D.hilo(ctx, xp + 14, ym - 14, xp + 14, yh);
        D.rect(ctx, xp + 4, yh, 20, 6 + 3 * p.n, { fill: '--metal-dark' });
        D.label(ctx, Math.round(m * 1000) + ' g', xp - 2, yh + 12, { align: 'right', size: 11 });
        D.line(ctx, x0 + 0.8 * sc + cw, ym - 2, x0 + 0.8 * sc + cw, ym - 30, { color: '--c2', dash: [3, 3] });
        D.label(ctx, '80 cm', x0 + 0.8 * sc + cw, ym - 34, { align: 'center', size: 10.5 });
      },
      medir(p, rnd) {
        const g = EM.local().g, m = 0.01 + 0.01 * p.n, Mt = p.mal ? p.Mc + 0.01 + 0.01 * p.n : p.Mc + 0.11;
        const a = EM.SEG.a(m, Mt, p.mur, g);
        if (a <= 0.005) return { m, F: m * g, Mt, t: '—', a: 0 };
        let am, t = '—';
        if (p.ins === 'cro') { t = L.quant(Math.sqrt(1.6 / a) + Math.SQRT2 * rnd.gauss(0, 0.09), 0.01); am = 1.6 / (t * t); }
        else if (p.ins === 'vid') { t = L.quant(Math.sqrt(1.6 / a) + rnd.gauss(0, 0.006), 1 / 60); am = 1.6 / (t * t); }
        else am = a + rnd.gauss(0, 0.02);
        return { m, F: m * g, Mt, t, a: am };
      },
      serie(p, rnd, st) { const out = []; for (let n = 1; n <= 9; n += 1) for (let k = 0; k < (p.ins === 'cro' ? 3 : 1); k++) out.push(this.medir(Object.assign({}, p, { n }), rnd, st)); return out; },
      grafica(rows) { const r = rows.filter((x) => x.a > 0); return { x: r.map((x) => x.F), y: r.map((x) => x.a), xl: 'F = mg (N)', yl: 'a (m/s²)', ajuste: 'recta', xextra: [0], yextra: [0] }; },
      resultado(fit, rows, p) {
        const g = EM.local().g, Mt = p.Mc + 0.11;
        const out = [['mt', 'Masa total pesada', EM.fix(Mt, 3) + ' kg'], ['mod', 'Masa efectiva del modelo', EM.fix((Mt + I / (R * R)) / (1 + p.mur), 3) + ' kg']];
        if (fit && rows.length >= 3) {
          const M = 1 / fit.m, uM = fit.sm / (fit.m * fit.m);
          out.push(['M', 'Masa = 1/pendiente', L.pm(M, uM, 'kg'), true]);
          out.push(['F0', 'Fuerza mínima −b/m', EM.fix(-fit.b / fit.m, 3) + ' N']);
          out.push(['z', 'Frente a la masa pesada', L.compat(M, uM, Mt, 0.001).html]);
        }
        return out;
      }
    });
  });
})();
