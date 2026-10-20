/* Capítulo 22 — Choques y rebotes */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  const BOLAS = { pp: ['Ping-pong sobre mesa reglamentaria', 0.876, '#F2F2F2'], te: ['Tenis sobre concreto', 0.745, '#D7E23A'], sa: ['Saltarina de caucho sobre baldosa', 0.86, '#E04545'], ca: ['Ping-pong sobre cartón', 0.6, '#F2F2F2'] };
  EM.defineSim('choques-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'choques', aspect: [1.15, 1.2],
      cols: [{ k: 'n', t: 'n', d: 0 }, { k: 'a', t: 'dato 1', d: 4 }, { k: 'b', t: 'dato 2', d: 4 }, { k: 'c', t: 'dato 3', d: 4 }],
      tituloTabla: 'Rebotes: n, golpe (s), Δt (s), ln Δt · Choques: n, p antes, p después, K después/K antes',
      controles(sim) {
        sim.group('Experimento');
        sim.seg('modo', { label: 'Parte', options: [['reb', 'Rebotes'], ['cho', 'Choque de esferas']], value: 'reb' });
        sim.select('bola', { label: 'Pelota y superficie', options: Object.keys(BOLAS).map((k) => [k, BOLAS[k][0]]), value: 'te' });
        sim.slider('h0', { label: 'Altura inicial', min: 0.3, max: 1.5, step: 0.05, value: 1, unit: 'm', fmt: (v) => EM.fix(v, 2) });
        sim.slider('m1', { label: 'Esfera lanzada m₁', min: 0.01, max: 0.1, step: 0.001, value: 0.045, unit: 'g', fmt: (v) => Math.round(v * 1000) });
        sim.slider('m2', { label: 'Esfera en reposo m₂', min: 0.01, max: 0.1, step: 0.001, value: 0.028, unit: 'g', fmt: (v) => Math.round(v * 1000) });
        sim.slider('e', { label: 'Coeficiente de restitución entre esferas', min: 0, max: 1, step: 0.01, value: 0.85, fmt: (v) => EM.fix(v, 2) });
      },
      paso(dt, st) { st.ta = ((st.ta || 0) + dt) % 6; },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, g = EM.local().g;
        if (p.modo === 'reb') {
          const e = BOLAS[p.bola][1], yb = H * 0.88, sc = (H * 0.7) / 1.5;
          D.piso(ctx, W * 0.05, W * 0.95, yb);
          /* posición de la pelota en el tiempo */
          let t = st.ta || 0, v = 0, y = p.h0, tt = 0;
          const T0 = Math.sqrt((2 * p.h0) / g);
          if (t < T0) y = p.h0 - 0.5 * g * t * t;
          else { t -= T0; let vv = e * Math.sqrt(2 * g * p.h0); while (vv > 0.05) { const T = (2 * vv) / g; if (t < T) { y = vv * t - 0.5 * g * t * t; break; } t -= T; vv *= e; y = 0; } }
          D.bob(ctx, W * 0.4, yb - 10 - y * sc, 10, { color: BOLAS[p.bola][2] });
          D.cota(ctx, W * 0.25, yb, W * 0.25, yb - p.h0 * sc, 'h₀', { size: 11 });
          D.celular(ctx, W * 0.7, yb - 8, 70, 14, { ang: 0 });
          /* línea de tiempo de los golpes */
          const gol = [T0]; let vv = e * Math.sqrt(2 * g * p.h0); while (vv > 0.15 && gol.length < 12) { gol.push(gol[gol.length - 1] + (2 * vv) / g); vv *= e; }
          const x0 = W * 0.08, x1 = W * 0.92, tmax = gol[gol.length - 1] * 1.05;
          D.line(ctx, x0, H * 0.08, x1, H * 0.08, { color: '--ink-3' });
          gol.forEach((tg) => D.line(ctx, x0 + (tg / tmax) * (x1 - x0), H * 0.04, x0 + (tg / tmax) * (x1 - x0), H * 0.12, { color: '--c2', width: 2 }));
          D.label(ctx, 'golpes detectados por el micrófono', x0, H * 0.17, { size: 10.5 });
          void tt; void v;
        } else {
          const y = H * 0.6, x0 = W * 0.05, x1 = W * 0.95;
          D.rampa(ctx, x0, y, x1, y, { grosor: 8, canal: true });
          const v1 = 0.4, [v1p, v2p] = MO.choque1D(p.m1, v1, p.m2, 0, p.e);
          const t = (st.ta || 0) % 4, tc = 1.2, sc = (x1 - x0) / 1.4;
          const r1 = 8 + p.m1 * 120, r2 = 8 + p.m2 * 120;
          const xc = x0 + 0.6 * sc;
          let a = xc - r1 - r2 - v1 * (tc - t) * sc, b = xc;
          if (t > tc) { a = xc - r1 - r2 + v1p * (t - tc) * sc; b = xc + v2p * (t - tc) * sc; }
          D.bob(ctx, Math.min(x1, a), y - r1, r1, { color: '--c1' });
          D.bob(ctx, Math.min(x1, b), y - r2, r2, { color: '--c4' });
          D.label(ctx, 'm₁ = ' + Math.round(p.m1 * 1000) + ' g', x0 + 10, y + 30);
          D.label(ctx, 'm₂ = ' + Math.round(p.m2 * 1000) + ' g', xc, y + 30);
        }
      },
      medir(p, rnd) {
        const g = EM.local().g;
        if (p.modo === 'reb') {
          const e0 = BOLAS[p.bola][1], rows = [];
          let t = Math.sqrt((2 * p.h0) / g) + 0.3, v = Math.sqrt(2 * g * p.h0), prev = null;
          for (let n = 0; n < 10; n++) {
            const tg = L.quant(t + rnd.gauss(0, 0.0005), 0.001);
            if (prev !== null) { const dt = tg - prev; rows.push({ n: n - 1, a: tg, b: dt, c: Math.log(dt) }); }
            prev = tg;
            const e = Math.min(0.97, e0 * (1 + 0.04 * Math.exp(-v / 0.8)) * (1 + rnd.gauss(0, 0.004)));
            v *= e;
            t += (2 * v) / g;
          }
          return rows;
        }
        const v1 = 0.2 + rnd() * 0.5, [v1p, v2p] = MO.choque1D(p.m1, v1, p.m2, 0, p.e);
        const m = (v) => v * (1 + rnd.gauss(0, 0.02));
        const a = p.m1 * m(v1), b = p.m1 * m(v1p) + p.m2 * m(v2p);
        const K = (p.m1 * v1p * v1p + p.m2 * v2p * v2p) / (p.m1 * v1 * v1);
        return { n: 0, a, b, c: K };
      },
      serie(p, rnd, st) { if (p.modo === 'reb') return this.medir(p, rnd, st); const out = []; for (let k = 0; k < 8; k++) out.push(this.medir(p, rnd, st)); return out; },
      grafica(rows, p) {
        if (p.modo === 'reb') { const r = rows.filter((x) => x.n >= 1 || x.n === 0); return { x: r.map((x) => x.n + 1), y: r.map((x) => x.c), xl: 'rebote n', yl: 'ln Δt_n', ajuste: 'recta', cero: false, xextra: [0] }; }
        return { x: rows.map((r) => r.a * 1000), y: rows.map((r) => r.b * 1000), xl: 'p antes (g·m/s)', yl: 'p después (g·m/s)', ajuste: 'origen', curva: (x) => x, xextra: [0], yextra: [0] };
      },
      resultado(fit, rows, p) {
        const out = [];
        if (p.modo === 'reb') {
          out.push(['ref', 'e de referencia', EM.fix(BOLAS[p.bola][1], 3)]);
          if (fit && rows.length >= 3) { const e = Math.exp(fit.m); out.push(['e', 'e = exp(pendiente)', L.pm(e, e * fit.sm), true]); out.push(['E', 'Energía perdida por rebote 1 − e²', EM.fix(100 * (1 - e * e), 1) + ' %']); }
        } else {
          if (fit && rows.length >= 2) out.push(['m', 'Pendiente p después / p antes', L.pm(fit.m, fit.sm), true]);
          if (rows.length) out.push(['K', 'K después / K antes (promedio)', EM.fix(L.mean(rows.map((r) => r.c)), 3)]);
        }
        return out;
      }
    });
  });
})();
