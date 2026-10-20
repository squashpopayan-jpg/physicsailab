/* Capítulo 15 — Movimiento acelerado en un riel */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  /* [nombre, radio (m), ancho de apoyo w (m), rueda] */
  const OBJ = {
    esf: ['Esfera de acero de 19 mm en canal de 11 mm', 0.0095, 0.011, true],
    can: ['Canica de 16 mm en riel de cortina de 8 mm', 0.008, 0.008, true],
    pla: ['Esfera que rueda sobre un plano', 0.0095, 0, true],
    blo: ['Bloque que desliza sin fricción (ideal)', 0, 0, false]
  };
  EM.MOV = {
    beta: (o) => (o[3] ? MO.betaEsfera(o[1], o[2]) : 0),
    a: (p, g) => { const o = OBJ[p.obj], b = EM.MOV.beta(o), th = Math.asin(p.dh / 1.5); return Math.max(1e-4, (g * (Math.sin(th) - (o[3] ? p.cr : 0) * Math.cos(th))) / (1 + b)); }
  };
  EM.defineSim('movimiento-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'movimiento', aspect: [1.5, 1.15],
      cols: [{ k: 'x', t: 'x (m)', d: 2 }, { k: 'n', t: 'cuadro', d: 0 }, { k: 't', t: 't (s)', d: 3 }, { k: 'rx', t: '√x (m½)', d: 4 }],
      tituloTabla: 'Paso de la esfera por las marcas (video)',
      controles(sim) {
        sim.group('Riel y objeto');
        sim.select('obj', { label: 'Objeto', options: Object.keys(OBJ).map((k) => [k, OBJ[k][0]]), value: 'esf' });
        sim.slider('dh', { label: 'Desnivel en 1,5 m de riel', min: 0.02, max: 0.15, step: 0.005, value: 0.05, unit: 'cm', fmt: (v) => EM.fix(v * 100, 1) });
        sim.slider('cr', { label: 'Coeficiente de fricción de rodadura', min: 0, max: 0.003, step: 0.0001, value: 0.0008, fmt: (v) => EM.fix(v, 4) });
        sim.seg('fps', { label: 'Cuadros por segundo', options: [[30, '30'], [60, '60'], [240, '240']], value: 30 });
        sim.seg('modo', { label: 'Gráfica', options: [['rx', '√x contra t'], ['x', 'x contra t'], ['v', 'v media contra t']], value: 'rx' });
      },
      estado: () => ({ t0: 0 }),
      paso(dt, st, p) { st.ta = ((st.ta || 0) + dt) % (Math.sqrt((2 * 1.45) / EM.MOV.a(p, EM.local().g)) + 1.2); },
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, g = EM.local().g, a = EM.MOV.a(p, g), o = OBJ[p.obj];
        const x0 = W * 0.06, x1 = W * 0.94, yb = H * 0.72, esc = 6; /* exageración vertical del desnivel */
        const y0 = yb - p.dh * ((x1 - x0) / 1.5) * esc;
        D.mesa(ctx, W * 0.02, W * 0.98, yb + 14, { alto: H * 0.12 });
        D.rect(ctx, x0 - 6, y0 + 6, 18, yb + 14 - y0 - 6, { fill: '--wood' });
        D.rampa(ctx, x0, y0, x1, yb, { grosor: 8, canal: true });
        for (let k = 0; k <= 7; k++) { const s = (k * 0.2) / 1.5, xm = x0 + s * (x1 - x0), ym = y0 + s * (yb - y0); D.line(ctx, xm, ym - 6, xm, ym + 12, { color: '--c2', width: 1.4 }); D.label(ctx, String(k), xm, ym + 26, { align: 'center', size: 10.5 }); }
        const t = Math.max(0, (st.ta || 0) - 0.4), xs = Math.min(1.45, 0.5 * a * t * t), s = xs / 1.5;
        const bx = x0 + s * (x1 - x0), by = y0 + s * (yb - y0);
        if (o[3]) D.bob(ctx, bx, by - 10, 10, { color: '--metal-dark' }); else D.block(ctx, bx, by - 9, 26, 16, { fill: '--c4' });
        D.label(ctx, 'desnivel exagerado ×' + esc + ' en el dibujo', x0, H * 0.08, { size: 10.5, color: '--ink-3' });
        D.celular(ctx, W * 0.82, H * 0.22, 46, 82, { screen: (c, sx, sy, sw, sh) => { c.fillStyle = '#C62828'; c.beginPath(); c.arc(sx + sw / 2, sy + sh * 0.85, 4, 0, 7); c.fill(); EM.text(c, p.fps + ' fps', sx + sw / 2, sy + sh * 0.45, { size: 10, align: 'center', color: '#FFFFFF', mono: true }); } });
      },
      medir(p, rnd) {
        const g = EM.local().g, a = EM.MOV.a(p, g), t0 = rnd() * 0.5, rows = [];
        for (let k = 1; k <= 7; k++) {
          const x = 0.2 * k, tv = t0 + Math.sqrt((2 * x) / a);
          const n = Math.round((tv + rnd.gauss(0, 0.4 / p.fps)) * p.fps);
          rows.push({ x, n, t: n / p.fps, rx: Math.sqrt(x) });
        }
        return rows;
      },
      serie(p, rnd, st) { return this.medir(p, rnd, st); },
      grafica(rows, p) {
        const t = rows.map((r) => r.t);
        if (p.modo === 'x') return { x: t, y: rows.map((r) => r.x), xl: 't (s)', yl: 'x (m)', ajuste: null };
        if (p.modo === 'v') {
          const xs = [], ys = [];
          for (let i = 1; i < rows.length; i++) if (rows[i].x > rows[i - 1].x && rows[i].t > rows[i - 1].t) { xs.push((rows[i].t + rows[i - 1].t) / 2); ys.push((rows[i].x - rows[i - 1].x) / (rows[i].t - rows[i - 1].t)); }
          return { x: xs, y: ys, xl: 't (s)', yl: 'v media (m/s)', ajuste: 'recta' };
        }
        return { x: t, y: rows.map((r) => r.rx), xl: 't (s)', yl: '√x (m^{1/2})', ajuste: 'recta' };
      },
      resultado(fit, rows, p) {
        const g = EM.local().g, o = OBJ[p.obj], b = EM.MOV.beta(o), th = Math.asin(p.dh / 1.5);
        const out = [['gs', 'g sen θ (bloque sin fricción)', EM.fix(g * Math.sin(th), 4) + ' m/s²'], ['beta', 'Factor β del objeto', EM.fix(b, 3)], ['mod', 'Modelo con rodadura y fricción', EM.fix(EM.MOV.a(p, g), 4) + ' m/s²']];
        if (fit && rows.length >= 3 && p.modo !== 'x') {
          let a, ua;
          if (p.modo === 'rx') { a = 2 * fit.m * fit.m; ua = 4 * fit.m * fit.sm; } else { a = fit.m; ua = fit.sm; }
          out.push(['a', 'Aceleración medida', L.pm(a, ua, 'm/s²'), true]);
          out.push(['z', 'Compatibilidad con el modelo', L.compat(a, ua, EM.MOV.a(p, g), 0).html]);
          if (p.modo === 'rx') out.push(['t0', 'Instante de partida −b/m', EM.fix(-fit.b / fit.m, 3) + ' s']);
        } else out.push(['a', 'Aceleración medida', p.modo === 'x' ? 'use la gráfica √x o v' : 'mida', true]);
        return out;
      }
    });
  });
})();
