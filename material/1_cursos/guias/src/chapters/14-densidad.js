/* Capítulo 14 — Densidad de sólidos con incertidumbre */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  /* objetos: [nombre, densidad g/cm³, d (mm), h (mm) o volumen (cm³) si irregular, color] */
  const OBJ = {
    al: ['Cilindro de aluminio 25,4 × 50 mm', 2.70, 25.4, 50, '--metal'],
    lat: ['Cilindro de latón 12,7 × 40 mm', 8.50, 12.7, 40, '--gold'],
    pvc: ['Cilindro de PVC 25,4 × 50 mm', 1.38, 25.4, 50, '--plastic'],
    pie: ['Piedra de río (irregular)', 2.65, 0, 22, '--ink-3']
  };
  const LONG = { regla: ['Regla (1 mm)', 1], cal: ['Calibrador (0,05 mm)', 0.05] };
  const BAL = { coc: ['Balanza de cocina (1 g)', 1], joy: ['Balanza de joyería (0,01 g)', 0.01] };
  EM.defineSim('densidad-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'densidad', aspect: [1.1, 1.2],
      cols: [{ k: 'm', t: 'm (g)', d: 2 }, { k: 'd', t: 'd (mm)', d: 2 }, { k: 'h', t: 'h (mm)', d: 2 }, { k: 'V', t: 'V (cm³)', d: 2 }, { k: 'rho', t: 'ρ (g/cm³)', d: 3 }, { k: 'u', t: 'u(ρ) (g/cm³)', d: 3 }],
      controles(sim) {
        sim.group('Objeto y método');
        sim.select('obj', { label: 'Objeto', options: Object.keys(OBJ).map((k) => [k, OBJ[k][0]]), value: 'al' });
        sim.seg('met', { label: 'Volumen por', options: [['geo', 'Geometría'], ['des', 'Desplazamiento']], value: 'geo' });
        sim.select('lon', { label: 'Instrumento de longitud', options: Object.keys(LONG).map((k) => [k, LONG[k][0]]), value: 'regla' });
        sim.select('bal', { label: 'Balanza', options: Object.keys(BAL).map((k) => [k, BAL[k][0]]), value: 'coc' });
      },
      montaje(ctx, cv, p) {
        const W = cv.w, H = cv.h, o = OBJ[p.obj], geo = p.met === 'geo' && o[2] > 0;
        D.mesa(ctx, W * 0.03, W * 0.97, H * 0.82, { alto: H * 0.1 });
        if (geo) {
          const s = Math.min(W, H) * 0.006, cw = o[2] * s * 1.6, ch = o[3] * s * 1.6, x = W * 0.3, y = H * 0.82;
          D.rect(ctx, x - cw / 2, y - ch, cw, ch, { fill: o[4], r: 2 });
          ctx.save(); ctx.fillStyle = EM.shade(EM.col(o[4]), 1.2); ctx.beginPath(); ctx.ellipse(x, y - ch, cw / 2, cw * 0.12, 0, 0, 7); ctx.fill(); ctx.restore();
          D.cota(ctx, x - cw / 2, y - ch - 18, x + cw / 2, y - ch - 18, 'd', { size: 12 });
          D.cota(ctx, x + cw / 2 + 16, y - ch, x + cw / 2 + 16, y, 'h', { size: 12 });
          D.label(ctx, LONG[p.lon][0], x, H * 0.92 + 8, { align: 'center' });
        } else {
          const x = W * 0.3, y = H * 0.82, rw = W * 0.16, rh = H * 0.55;
          D.recipiente(ctx, x - rw / 2, y, rw, rh, 0.55, { marcas: 10 });
          D.hilo(ctx, x, H * 0.12, x, y - rh * 0.35);
          if (p.obj === 'pie') { ctx.save(); ctx.fillStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.ellipse(x, y - rh * 0.25, rw * 0.3, rw * 0.2, 0.3, 0, 7); ctx.fill(); ctx.restore(); }
          else D.rect(ctx, x - rw * 0.2, y - rh * 0.42, rw * 0.4, rh * 0.32, { fill: o[4], r: 2 });
          D.label(ctx, 'probeta de 100 mL', x, H * 0.92 + 8, { align: 'center' });
        }
        D.rect(ctx, W * 0.62, H * 0.82 - 22, W * 0.3, 22, { fill: '--plastic-dark', r: 4 });
        D.rect(ctx, W * 0.68, H * 0.82 - 18, W * 0.18, 14, { fill: '--lcd', r: 2, stroke: null });
        const mv = o[1] * (o[2] > 0 ? MO.volCil(o[2] / 10, o[3] / 10) : o[3]);
        EM.text(ctx, EM.fix(L.quant(mv, BAL[p.bal][1]), p.bal === 'coc' ? 0 : 2) + ' g', W * 0.77, H * 0.82 - 7, { size: 11, align: 'center', mono: true, color: '--lcd-ink' });
        D.label(ctx, BAL[p.bal][0], W * 0.77, H * 0.92 + 8, { align: 'center' });
      },
      medir(p, rnd) {
        const o = OBJ[p.obj], rb = BAL[p.bal][1], rl = LONG[p.lon][1];
        const Vt = o[2] > 0 ? MO.volCil(o[2] / 10, o[3] / 10) : o[3], mt = o[1] * Vt;
        const m = L.quant(mt + rnd.gauss(0, rb * 0.3), rb), um = L.uRes(rb);
        if (p.met === 'geo' && o[2] > 0) {
          const d = L.quant(o[2] + rnd.gauss(0, rl * 0.3), rl), h = L.quant(o[3] + rnd.gauss(0, rl * 0.3), rl), ul = L.uRes(rl);
          const V = MO.volCil(d / 10, h / 10), rho = m / V, ur = MO.urRhoCil(m, um, d, ul, h, ul);
          return { m, d, h, V, rho, u: rho * ur };
        }
        const V1 = L.quant(50 + rnd.gauss(0, 0.3), 1), V2 = L.quant(V1 + Vt + rnd.gauss(0, 0.35), 1), V = Math.max(0.5, V2 - V1);
        const uV = Math.SQRT2 * L.uRes(1), rho = m / V;
        return { m, d: '—', h: '—', V, rho, u: rho * Math.sqrt((um / m) ** 2 + (uV / V) ** 2) };
      },
      serie(p, rnd, st) { const out = []; for (let k = 0; k < 8; k++) out.push(this.medir(p, rnd, st)); return out; },
      grafica(rows, p) {
        const ref = OBJ[p.obj][1];
        const ys = rows.map((r) => r.rho), es = rows.map((r) => r.u);
        const lo = Math.min(ref * 0.85, ...ys.map((y, i) => y - es[i])), hi = Math.max(ref * 1.15, ...ys.map((y, i) => y + es[i]));
        return { x: rows.map((_, i) => i + 1), y: ys, ey: es, xl: 'medida n.°', yl: 'ρ (g/cm³)', ajuste: null, curva: () => ref, xr: [0, Math.max(9, rows.length + 1)], yr: [lo, hi] };
      },
      resultado(fit, rows, p) {
        const ref = OBJ[p.obj][1];
        const out = [['ref', 'Densidad de referencia', EM.fix(ref, 2) + ' g/cm³']];
        if (rows.length) {
          let sw = 0, s = 0;
          rows.forEach((r) => { const w = 1 / (r.u * r.u); sw += w; s += w * r.rho; });
          const m = s / sw, u = Math.sqrt(1 / sw);
          const ur = rows[rows.length - 1].u / rows[rows.length - 1].rho;
          out.push(['ult', 'Incertidumbre relativa de una medida', EM.fix(100 * ur, 2) + ' %']);
          out.push(['prom', 'Promedio ponderado', L.pm(m, u, 'g/cm³'), true]);
          out.push(['z', 'Compatibilidad', L.compat(m, u, ref, ref * 0.005).html]);
        } else out.push(['prom', 'Promedio ponderado', 'tome medidas', true]);
        return out;
      }
    });
  });
})();
