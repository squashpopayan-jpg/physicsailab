/* Capítulo 27 — El tubo de perdigones de Joule */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  const MAT = { ac: ['Acero', 466], cu: ['Cobre', 385], ar: ['Arena seca', 830] };
  EM.defineSim('joule-banco', function (sim) {
    /* calentamiento con pérdidas: dT/dt = r·k − (T − Ta)/τ, con una inversión por segundo */
    const dT = (p, N, g) => {
      const k = (p.eta * g * p.L) / MAT[p.mat][1], tau = p.forro ? 900 : 250;
      return k * tau * (1 - Math.exp(-N / tau));
    };
    EM.banco(sim, {
      nombre: 'joule', aspect: [0.9, 1.2],
      cols: [{ k: 'N', t: 'N', d: 0 }, { k: 'T0', t: 'T₀ (°C)', d: 1 }, { k: 'T', t: 'T (°C)', d: 1 }, { k: 'dT', t: 'ΔT (°C)', d: 1 }],
      controles(sim) {
        sim.group('Tubo y perdigones');
        sim.select('mat', { label: 'Material', options: Object.keys(MAT).map((k) => [k, MAT[k][0]]), value: 'ac' });
        sim.slider('m', { label: 'Masa de perdigones', min: 0.1, max: 0.8, step: 0.05, value: 0.4, unit: 'g', fmt: (v) => Math.round(v * 1000) });
        sim.slider('L', { label: 'Altura de caída efectiva', min: 0.5, max: 1.5, step: 0.01, value: 0.95, unit: 'm', fmt: (v) => EM.fix(v, 2) });
        sim.slider('eta', { label: 'Fracción de la energía que queda en los perdigones', min: 0.5, max: 1, step: 0.01, value: 0.8, fmt: (v) => Math.round(v * 100) + ' %' });
        sim.check('forro', { label: 'Tubo forrado (menos pérdidas al ambiente)', value: true });
        sim.slider('N', { label: 'Inversiones (medida individual)', min: 10, max: 300, step: 10, value: 100, fmt: (v) => v.toFixed(0) });
      },
      paso(dt, st) { st.ta = ((st.ta || 0) + dt) % 1.2; },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, g = EM.local().g;
        const fase = Math.floor(((st.ta || 0) / 1.2) * 2) % 2, ang = fase ? Math.PI : 0;
        const cx = W * 0.4, cy = H * 0.5, Lp = H * 0.78;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang * 0.0);
        D.rect(ctx, -16, -Lp / 2, 32, Lp, { fill: p.forro ? '#3A3A3A' : '--plastic', r: 6 });
        D.rect(ctx, -12, -Lp / 2 + 4, 24, Lp - 8, { fill: '--surface', r: 4 });
        const t = (st.ta || 0) % 0.6, yfall = Math.min(1, (t / 0.45) ** 2);
        const ytop = fase ? Lp / 2 - 30 : -Lp / 2 + 10, ybot = fase ? -Lp / 2 + 10 : Lp / 2 - 30;
        const yy = ytop + (ybot - ytop) * yfall;
        ctx.fillStyle = EM.col('--metal-dark');
        for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.arc(-8 + (k % 5) * 4, yy + Math.floor(k / 5) * 4 * (fase ? -1 : 1), 2.2, 0, 7); ctx.fill(); }
        ctx.restore();
        D.cota(ctx, cx + 40, cy - Lp / 2, cx + 40, cy + Lp / 2, 'L = ' + EM.fix(p.L, 2) + ' m', { size: 11 });
        D.termometro(ctx, W * 0.82, H * 0.9, H * 0.4, '+' + EM.fix(dT(p, p.N, g), 2));
        D.label(ctx, p.N + ' inversiones', W * 0.82, H * 0.2, { align: 'center' });
      },
      medir(p, rnd) {
        const g = EM.local().g, T0 = L.quant(20 + rnd.gauss(0, 0.05), 0.1);
        const T = L.quant(T0 + dT(p, p.N, g) + rnd.gauss(0, 0.06), 0.1);
        return { N: p.N, T0, T, dT: T - T0 };
      },
      serie(p, rnd, st) { const out = []; for (const N of [50, 100, 150, 200]) for (let k = 0; k < 2; k++) out.push(this.medir(Object.assign({}, p, { N }), rnd, st)); return out; },
      grafica(rows, p) { const g = EM.local().g, k = (g * p.L) / MAT[p.mat][1]; return { x: rows.map((r) => r.N), y: rows.map((r) => r.dT), xl: 'inversiones N', yl: 'ΔT (°C)', ajuste: 'origen', curva: (N) => k * N, xextra: [0], yextra: [0] }; },
      resultado(fit, rows, p) {
        const g = EM.local().g, k = (g * p.L) / MAT[p.mat][1];
        const out = [['id', 'ΔT ideal con 100 caídas', EM.fix(MO.dTperdigones(100, p.L, MAT[p.mat][1], g), 2) + ' °C'], ['md', 'Modelo con pérdidas, N = ' + p.N, EM.fix(dT(p, p.N, g), 2) + ' °C']];
        if (fit && rows.length >= 2) { out.push(['pen', 'Pendiente de ΔT–N', L.pm(fit.m, fit.sm, '°C por caída')]); out.push(['eta', 'Eficiencia η = pendiente·c/(gL)', L.pm(fit.m / k, fit.sm / k), true]); }
        return out;
      }
    });
  });
})();
