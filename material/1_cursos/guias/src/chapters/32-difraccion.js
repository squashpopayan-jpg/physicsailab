/* Capítulo 32 — Difracción: CD, DVD y un cabello */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  const OBJ = { cd: ['CD (d = 1,6 µm)', MO.PASO.cd], dvd: ['DVD (d = 0,74 µm)', MO.PASO.dvd], pelo: ['Cabello', 0] };
  const LAS = { r: ['Rojo 650 nm', 650e-9, '#E53935'], v: ['Verde 532 nm', 532e-9, '#2BBF3A'] };
  EM.defineSim('difraccion-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'difraccion', aspect: [1.5, 1.2],
      cols: [{ k: 'm', t: 'orden m', d: 0 }, { k: 'D', t: 'D (m)', d: 3 }, { k: 'y', t: 'y (m)', d: 4 }, { k: 'th', t: 'θ (°)', d: 2 }, { k: 'r', t: 'd o a (µm)', d: 3 }],
      controles(sim) {
        sim.group('Montaje');
        sim.select('obj', { label: 'Objeto', options: Object.keys(OBJ).map((k) => [k, OBJ[k][0]]), value: 'cd' });
        sim.seg('las', { label: 'Láser', options: Object.keys(LAS).map((k) => [k, LAS[k][0]]), value: 'r' });
        sim.slider('D', { label: 'Distancia a la pantalla', min: 0.1, max: 3, step: 0.01, value: 0.3, unit: 'm', fmt: (v) => EM.fix(v, 2) });
        sim.slider('a', { label: 'Diámetro del cabello', min: 30, max: 120, step: 1, value: 70, unit: 'µm', fmt: (v) => v.toFixed(0) });
        sim.slider('tol', { label: 'Error real de la longitud de onda del láser', min: -10, max: 10, step: 1, value: 4, unit: 'nm', fmt: (v) => v.toFixed(0) });
      },
      montaje(ctx, cv, p) {
        const W = cv.w, H = cv.h, lam = LAS[p.las][1] + p.tol * 1e-9, col = LAS[p.las][2];
        const xs = W * 0.05, xd = W * 0.85, y0 = H * 0.5;
        /* pantalla vista de frente a la izquierda; disco a la derecha */
        D.rect(ctx, xs, H * 0.06, 10, H * 0.88, { fill: '#FFFFFF' });
        D.laser(ctx, W * 0.97, y0, Math.PI, { largo: 40 });
        if (p.obj === 'pelo') {
          D.line(ctx, xd, H * 0.3, xd, H * 0.7, { color: '--ink', width: 2 });
          const dy = (lam * p.D) / (p.a * 1e-6), sc = (H * 0.4) / Math.max(0.05, 6 * dy);
          for (let k = -40; k <= 40; k++) {
            const y = k * 0.25 * dy, x = (Math.PI * y) / dy, I = x === 0 ? 1 : (Math.sin(x) / x) ** 2;
            ctx.save(); ctx.globalAlpha = Math.min(1, I * 1.5 + 0.03); ctx.fillStyle = col; ctx.fillRect(xs + 2, y0 - y * sc - 2, 8, 4); ctx.restore();
          }
          D.haz(ctx, [[W * 0.95, y0], [xs + 10, y0]], { color: col, width: 1.5, alpha: 0.4 });
          D.label(ctx, 'franjas: Δy = ' + EM.fix(dy * 1000, 2) + ' mm', W * 0.3, H * 0.1);
        } else {
          D.rect(ctx, xd - 3, y0 - H * 0.3, 6, H * 0.6, { fill: '--metal' });
          const dd = OBJ[p.obj][1], sc = (H * 0.42) / Math.max(0.05, p.D * 1.8);
          const Lp = (xd - xs) ;
          for (let m = -3; m <= 3; m++) {
            const s = (m * lam) / dd;
            if (Math.abs(s) > 1) continue;
            const th = Math.asin(s), yy = p.D * Math.tan(th), ypx = y0 - Math.max(-H * 0.45, Math.min(H * 0.45, yy * sc));
            D.haz(ctx, [[xd, y0], [xs + 10, ypx]], { color: col, width: m === 0 ? 2 : 1.2, alpha: m === 0 ? 0.8 : 0.6 });
            ctx.save(); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(xs + 5, ypx, 4, 0, 7); ctx.fill(); ctx.restore();
            if (m > 0) D.label(ctx, 'm = ' + m + ': ' + EM.fix((th * 180) / Math.PI, 1) + '°', xs + 18, ypx + 4, { size: 11 });
          }
          void Lp;
        }
        D.label(ctx, 'pantalla', xs, H * 0.98, { size: 10.5 });
        D.label(ctx, 'D = ' + EM.fix(p.D, 2) + ' m (no a escala)', W * 0.5, H * 0.98, { align: 'center', size: 10.5 });
      },
      medir(p, rnd) {
        const lam = LAS[p.las][1] + p.tol * 1e-9, lamDecl = LAS[p.las][1], rows = [];
        if (p.obj === 'pelo') {
          const dy = (lam * p.D) / (p.a * 1e-6);
          for (let m = 1; m <= 5; m++) { const y = L.quant(m * dy + rnd.gauss(0, 0.0005), 0.001); rows.push({ m, D: p.D, y, th: (Math.atan(y / p.D) * 180) / Math.PI, r: (m * lamDecl * p.D) / y * 1e6 }); }
          return rows;
        }
        const dd = OBJ[p.obj][1];
        for (let m = 1; m <= 3; m++) {
          const s = (m * lam) / dd;
          if (s > 1) break;
          const y = L.quant(p.D * Math.tan(Math.asin(s)) + rnd.gauss(0, 0.001), 0.001), th = Math.atan(y / p.D);
          rows.push({ m, D: p.D, y, th: (th * 180) / Math.PI, r: ((m * lamDecl) / Math.sin(th)) * 1e6 });
        }
        return rows;
      },
      serie(p, rnd, st) { let out = []; const Ds = p.obj === 'pelo' ? [1, 1.5, 2] : [0.2, 0.3, 0.4]; for (const Dx of Ds) out = out.concat(this.medir(Object.assign({}, p, { D: Dx }), rnd, st)); return out; },
      grafica(rows, p) {
        if (p.obj === 'pelo') { const r = rows.filter((x) => Math.abs(x.D - p.D) < 1e-6); return { x: r.map((x) => x.m), y: r.map((x) => x.y * 1000), xl: 'orden del mínimo m', yl: 'y (mm)', ajuste: 'origen', xextra: [0], yextra: [0] }; }
        return { x: rows.map((x, i) => i + 1), y: rows.map((x) => x.r), xl: 'medida n.°', yl: 'd calculada (µm)', ajuste: null, curva: () => OBJ[p.obj][1] * 1e6, cero: false, xr: [0, Math.max(5, rows.length + 1)] };
      },
      resultado(fit, rows, p) {
        const out = [['lam', 'λ declarada / real', EM.fix(LAS[p.las][1] * 1e9, 0) + ' nm / ' + EM.fix(LAS[p.las][1] * 1e9 + p.tol, 0) + ' nm']];
        if (p.obj === 'pelo') {
          if (fit && rows.length >= 2) { const a = (LAS[p.las][1] * p.D) / (fit.m / 1000) * 1e6, ua = (a * fit.sm) / fit.m; out.push(['a', 'Diámetro a = λD/Δy', L.pm(a, ua, 'µm'), true]); }
        } else if (rows.length) {
          const v = rows.map((x) => x.r), m = L.mean(v), u = v.length > 1 ? L.sem(v) : NaN;
          out.push(['d', 'Separación entre pistas d', L.pm(m, u, 'µm'), true]);
          out.push(['z', 'Frente a la especificación', isFinite(u) ? L.compat(m, Math.hypot(u, (m * 10) / 650 / Math.sqrt(3)), OBJ[p.obj][1] * 1e6, 0).html : '—']);
        }
        return out;
      }
    });
  });
})();
