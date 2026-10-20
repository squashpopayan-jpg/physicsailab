/* Capítulo 37 — Inducción: el imán que cae */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  EM.defineSim('induccion-banco', function (sim) {
    const par = (p) => ({ m: MO.momentoIman(p.Br, Math.PI * 0.005 ** 2 * 0.005) * (p.inv ? -1 : 1), a: p.a, N: p.N });
    /* fem en el tiempo: el imán cae libremente desde h sobre el plano de la bobina (t = 0 al soltarlo) */
    const senal = (p, h, dt = 2e-5) => {
      const g = EM.local().g, { m, a, N } = par(p), tc = Math.sqrt((2 * h) / g), ts = [], es = [];
      for (let t = tc - 0.04; t <= tc + 0.04; t += dt) { const z = h - 0.5 * g * t * t, v = -g * t; ts.push((t - tc) * 1000); es.push(MO.femDipolo(N, m, a, z, v)); }
      return { ts, es };
    };
    const area = (s) => { let A = 0; for (let i = 1; i < s.ts.length; i++) if (s.es[i] > 0) A += s.es[i] * (s.ts[i] - s.ts[i - 1]); return A; };
    EM.banco(sim, {
      nombre: 'induccion', aspect: [0.8, 1.2],
      cols: [{ k: 'h', t: 'h (m)', d: 2 }, { k: 'v', t: 'v (m/s)', d: 3 }, { k: 'em', t: 'ε máx (V)', d: 3 }, { k: 'dur', t: 'pulso (ms)', d: 1 }, { k: 'A', t: 'área (mV·s)', d: 3 }],
      controles(sim) {
        sim.group('Imán y bobina');
        sim.slider('h', { label: 'Altura de caída sobre la bobina', min: 0.05, max: 0.6, step: 0.01, value: 0.2, unit: 'cm', fmt: (v) => EM.fix(v * 100, 0) });
        sim.slider('Br', { label: 'Remanencia del imán', min: 0.3, max: 1.4, step: 0.05, value: 1.2, unit: 'T', fmt: (v) => EM.fix(v, 2) });
        sim.slider('N', { label: 'Vueltas de la bobina', min: 50, max: 500, step: 10, value: 200, fmt: (v) => v.toFixed(0) });
        sim.slider('a', { label: 'Radio de la bobina', min: 0.008, max: 0.03, step: 0.001, value: 0.015, unit: 'cm', fmt: (v) => EM.fix(v * 100, 1) });
        sim.check('inv', { label: 'Imán invertido', value: false });
      },
      montaje(ctx, cv, p) {
        const W = cv.w, H = cv.h, yb = H * 0.62, sc = (H * 0.5) / 0.6;
        D.rect(ctx, W * 0.42, H * 0.04, W * 0.16, H * 0.9, { fill: '--plastic', alpha: 0.5 });
        D.bobina(ctx, W * 0.5, yb, W * 0.24, 22, 8);
        D.iman(ctx, W * 0.5, yb - p.h * sc, 14, 28, p.inv ? -Math.PI / 2 : Math.PI / 2);
        D.cota(ctx, W * 0.75, yb - p.h * sc, W * 0.75, yb, 'h = ' + EM.fix(p.h * 100, 0) + ' cm', { size: 11 });
        D.label(ctx, p.N + ' vueltas', W * 0.5, yb + 30, { align: 'center' });
        D.rect(ctx, W * 0.3, H * 0.95, W * 0.4, 8, { fill: '--ink-3' });
      },
      medir(p, rnd) {
        const s = senal(p, p.h, 2e-4), e = s.es.map((x) => L.quant(x + rnd.gauss(0, 0.003), 5 / 1023));
        const mx = Math.max(...e.map(Math.abs)), i1 = e.findIndex((x) => Math.abs(x) > mx * 0.1), i2 = e.length - 1 - e.slice().reverse().findIndex((x) => Math.abs(x) > mx * 0.1);
        let A = 0; for (let i = 1; i < e.length; i++) if (e[i] * (p.inv ? -1 : 1) > 0) A += Math.abs(e[i]) * (s.ts[i] - s.ts[i - 1]);
        return { h: p.h, v: Math.sqrt(2 * EM.local().g * p.h), em: mx, dur: s.ts[i2] - s.ts[i1], A };
      },
      serie(p, rnd, st) { const out = []; for (const h of [0.1, 0.2, 0.3, 0.4]) out.push(this.medir(Object.assign({}, p, { h }), rnd, st)); return out; },
      grafica(rows, p) {
        const s = senal(p, p.h);
        return { x: [], y: [], xl: 't respecto al cruce (ms)', yl: 'ε (V)', ajuste: null, sinMensaje: true, curva: (t) => { const i = Math.round((t - s.ts[0]) / (s.ts[1] - s.ts[0])); return i >= 0 && i < s.es.length ? s.es[i] : NaN; }, xr: [-25, 25], yr: [-0.8, 0.8] };
      },
      resultado(fit, rows, p) {
        const { m, a, N } = par(p), s = senal(p, p.h);
        const out = [['m', 'Momento del imán', EM.fix(Math.abs(m), 3) + ' A·m²'], ['ep', 'fem máxima', EM.fix(Math.max(...s.es.map(Math.abs)), 3) + ' V', true], ['ar', 'Área de un pulso (simulada) / N μ₀m/(2a)', EM.fix(Math.abs(area(s)), 3) + ' / ' + EM.fix((N * MO.flujoDipolo(Math.abs(m), a, 0)) * 1000, 3) + ' mV·s', true]];
        if (rows.length >= 2) out.push(['cv', 'Variación del área entre caídas medidas', EM.fix((100 * L.std(rows.map((r) => r.A))) / L.mean(rows.map((r) => r.A)), 1) + ' %']);
        return out;
      }
    });
  });
})();
