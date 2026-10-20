/* Capítulo 26 — Calorimetría */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  const MET = { al: ['Aluminio', 897], ac: ['Acero', 466], cu: ['Cobre', 385], la: ['Latón', 380] };
  EM.defineSim('calor-banco', function (sim) {
    const T1 = () => EM.local().tb;
    const curva = (p, rnd) => {
      const Ta = 20, T2 = 20, m1 = p.m1 / 1000, c1 = MET[p.met][1];
      const Te = MO.tEquilibrio(m1, c1, T1(), 0.15, 4182, T2, 10), tm = 8, tc = 1200, rows = [];
      for (let t = 0; t <= 180; t += 5) {
        const ideal = Te + (T2 - Te) * Math.exp(-t / tm);
        const T = Ta + (ideal - Ta) * Math.exp(-t / tc) + (rnd ? rnd.gauss(0, 0.03) : 0);
        rows.push({ t, T: L.quant(T, 0.1) });
      }
      return { rows, Te };
    };
    EM.banco(sim, {
      nombre: 'calorimetria', aspect: [1.0, 1.2],
      cols: [{ k: 't', t: 't (s)', d: 0 }, { k: 'T', t: 'T (°C)', d: 1 }],
      tituloTabla: 'Curva de temperatura de la mezcla',
      controles(sim) {
        sim.group('Muestra');
        sim.select('met', { label: 'Metal', options: Object.keys(MET).map((k) => [k, MET[k][0]]), value: 'al' });
        sim.slider('m1', { label: 'Masa de la muestra', min: 30, max: 200, step: 5, value: 100, unit: 'g', fmt: (v) => v.toFixed(0) });
        sim.check('cien', { label: 'Error: suponer que el agua hierve a 100 °C', value: false });
      },
      montaje(ctx, cv, p) {
        const W = cv.w, H = cv.h;
        D.mesa(ctx, W * 0.03, W * 0.97, H * 0.86, { alto: H * 0.1 });
        D.recipiente(ctx, W * 0.1, H * 0.86, W * 0.3, H * 0.4, 0.7, { liquido: '--water' });
        ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(W * 0.15 + k * W * 0.028, H * 0.6 - (k % 3) * 8, 3, 0, 7); ctx.fill(); } ctx.restore();
        D.label(ctx, 'agua hirviendo a ' + EM.fix(T1(), 1) + ' °C', W * 0.25, H * 0.4, { align: 'center' });
        D.rect(ctx, W * 0.58, H * 0.48, W * 0.3, H * 0.38, { fill: '#F4F4F0', r: 4 });
        D.rect(ctx, W * 0.6, H * 0.5, W * 0.26, H * 0.35, { fill: '#FFFFFF', r: 3 });
        D.recipiente(ctx, W * 0.6, H * 0.85, W * 0.26, H * 0.34, 0.55);
        D.rect(ctx, W * 0.66, H * 0.7, W * 0.12, H * 0.08, { fill: '--metal', r: 2 });
        D.termometro(ctx, W * 0.83, H * 0.72, H * 0.42, EM.fix(MO.tEquilibrio(p.m1 / 1000, MET[p.met][1], T1(), 0.15, 4182, 20, 10), 1));
        D.label(ctx, 'vasos de icopor', W * 0.73, H * 0.96, { align: 'center' });
      },
      medir(p, rnd) { return curva(p, rnd).rows; },
      serie(p, rnd) { return curva(p, rnd).rows; },
      grafica(rows) {
        const tail = rows.filter((r) => r.t >= 60);
        const fit = tail.length >= 3 ? L.fitLine(tail.map((r) => r.t), tail.map((r) => r.T)) : null;
        return { x: rows.map((r) => r.t), y: rows.map((r) => r.T), xl: 't (s)', yl: 'T (°C)', ajuste: () => fit, cero: false, xextra: [0] };
      },
      resultado(fit, rows, p) {
        const c1 = MET[p.met][1], m1 = p.m1 / 1000, Tm = Math.max(...rows.map((r) => r.T), -Infinity);
        const out = [['T1', 'Temperatura inicial de la muestra', EM.fix(p.cien ? 100 : T1(), 1) + ' °C' + (p.cien ? ' (supuesta)' : ' (ebullición local)')], ['Te', 'T_e sin pérdidas (modelo)', EM.fix(MO.tEquilibrio(m1, c1, T1(), 0.15, 4182, 20, 10), 2) + ' °C']];
        if (fit && rows.length) {
          const Tx = fit.b, Tu = p.cien ? 100 : T1();
          const c = MO.cDesconocido(m1, Tu, 0.15, 4182, 20, Tx, 10), cmax = MO.cDesconocido(m1, Tu, 0.15, 4182, 20, Tm, 10);
          const uT = Math.sqrt(fit.sb ** 2 + 0.03 ** 2 + L.uRes(0.1) ** 2), uc = c * Math.hypot(uT / (Tx - 20), uT / (Tu - Tx));
          out.push(['Tx', 'T_e extrapolada a t = 0', L.pm(Tx, fit.sb, '°C')]);
          out.push(['c', 'Calor específico (extrapolada)', L.pm(c / 1000, uc / 1000, 'J/(g·°C)'), true]);
          out.push(['cm', 'Con la temperatura máxima', EM.fix(cmax / 1000, 3) + ' J/(g·°C)']);
          out.push(['z', 'Frente a la tabla (' + EM.fix(c1 / 1000, 3) + ')', L.compat(c / 1000, uc / 1000, c1 / 1000, 0.005).html]);
        }
        return out;
      }
    });
  });
})();
