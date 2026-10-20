/* Capítulo 45 — El campo magnético de la Tierra con una brújula de tangentes */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  const rad = Math.PI / 180;
  EM.defineSim('tangentes-banco', function (sim) {
    /* Campo local adicional junto a una columna (fijo por muestra), en teslas: [norte, este] */
    const extra = (p, st) => {
      if (p.lugar !== 'col') return [0, 0];
      if (st._sB !== st.semilla) { st._sB = st.semilla; const r = L.rng((st.semilla ^ 0x2545f491) >>> 0), m = r.uni(3e-6, 7e-6), a = r.uni(0, 2 * Math.PI); st.bx = [m * Math.cos(a), m * Math.sin(a)]; }
      return st.bx;
    };
    const kB = (p) => (p.bob === 'h' ? MO.bHelmholtz(p.N, 1, p.R / 100) : MO.bEspira(p.N, 1, p.R / 100));
    /* El plano de la bobina se alinea con la aguja sin corriente; α es el error adicional */
    const campo = (p, st, I) => {
      const BH = EM.local().B.H * 1e-9, e = extra(p, st), bx = BH + e[0], by = e[1], th0 = Math.atan2(by, bx), Bc = kB(p) * I, ax = th0 + Math.PI / 2 + p.alfa * rad;
      return { x: bx + Bc * Math.cos(ax), y: by + Bc * Math.sin(ax), th0, Bloc: Math.hypot(bx, by) };
    };
    const ang = (p, st, I) => { const c = campo(p, st, I); let d = Math.atan2(c.y, c.x) - c.th0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d / rad; };
    const lect = (a, rnd) => L.quant(a + rnd.gauss(0, 0.4), 1);
    EM.banco(sim, {
      nombre: 'tangentes', aspect: [1.1, 1.1],
      cols: [{ k: 'I', t: 'I (mA)', d: 1 }, { k: 'tp', t: 'θ₊ (°)', d: 0 }, { k: 'tm', t: 'θ₋ (°)', d: 0 }, { k: 'th', t: 'θ medio (°)', d: 1 }, { k: 'tg', t: 'tan θ', d: 3 }],
      controles(sim) {
        sim.group('Bobina');
        sim.seg('bob', { label: 'Tipo', options: [['e', 'Una bobina'], ['h', 'Par de Helmholtz']], value: 'e' });
        sim.slider('N', { label: 'Número de vueltas N', min: 10, max: 100, step: 1, value: 50, fmt: (v) => v.toFixed(0) });
        sim.slider('R', { label: 'Radio R', min: 5, max: 15, step: 0.5, value: 10, unit: 'cm', fmt: (v) => EM.fix(v, 1) });
        sim.slider('I', { label: 'Corriente', min: -150, max: 150, step: 0.5, value: 60, unit: 'mA', fmt: (v) => EM.fix(v, 1) });
        sim.slider('alfa', { label: 'Desalineación de la bobina α', min: -10, max: 10, step: 0.5, value: 0, unit: '°', fmt: (v) => EM.fix(v, 1) });
        sim.seg('lugar', { label: 'Lugar', options: [['patio', 'Patio (IGRF)'], ['col', 'Junto a una columna']], value: 'patio' });
      },
      paso() {},
      montaje(ctx, cv, p, st) {
        const W = cv.w, H = cv.h, cx = W / 2, cy = H * 0.5, r = Math.min(W, H) * 0.3, c = campo(p, st, p.I / 1000);
        /* Norte de la pantalla = dirección de la aguja sin corriente */
        D.label(ctx, 'N mag.', cx, 16, { align: 'center', weight: 700, color: '--c2' });
        D.arrow(ctx, cx, 40, cx, 22, { color: '--c2', width: 2 });
        /* Bobina vista de canto (plano casi norte–sur) */
        const a = p.alfa * rad, L0 = r * 1.25;
        const bob = (off) => { ctx.save(); ctx.strokeStyle = EM.col('--copper'); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + off * Math.cos(a) + L0 * Math.sin(a), cy + off * Math.sin(a) - L0 * Math.cos(a)); ctx.lineTo(cx + off * Math.cos(a) - L0 * Math.sin(a), cy + off * Math.sin(a) + L0 * Math.cos(a)); ctx.stroke(); ctx.restore(); };
        if (p.bob === 'h') { bob(-r * 0.5); bob(r * 0.5); } else bob(0);
        /* Brújula */
        ctx.save(); ctx.fillStyle = EM.col('--canvas'); ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0, 7); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1;
        for (let k = 0; k < 36; k++) { const t = k * 10 * rad, l = k % 9 === 0 ? 10 : 5; ctx.beginPath(); ctx.moveTo(cx + Math.sin(t) * r * 0.62, cy - Math.cos(t) * r * 0.62); ctx.lineTo(cx + Math.sin(t) * (r * 0.62 - l), cy - Math.cos(t) * (r * 0.62 - l)); ctx.stroke(); }
        ctx.restore();
        const th = ang(p, st, p.I / 1000) * rad, ln = r * 0.5;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(th);
        ctx.fillStyle = '#C62828'; ctx.beginPath(); ctx.moveTo(0, -ln); ctx.lineTo(5, 0); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = EM.col('--ink-2'); ctx.beginPath(); ctx.moveTo(0, ln); ctx.lineTo(5, 0); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 7); ctx.fill(); ctx.restore();
        /* Vectores: campo local (arriba) y campo de la bobina */
        const sc = (r * 1.1) / Math.max(c.Bloc, Math.abs(kB(p) * p.I / 1000), 1e-9);
        const Bc = kB(p) * (p.I / 1000);
        D.arrow(ctx, cx - r * 1.2, cy + r * 0.25, cx - r * 1.2, cy + r * 0.25 - c.Bloc * sc * 0.45, { color: '--c3', width: 2.2 });
        D.label(ctx, 'B_H', cx - r * 1.2 + 6, cy + r * 0.25 - c.Bloc * sc * 0.45 - 4, { color: '--c3', weight: 700 });
        if (Math.abs(Bc) > 1e-9) { const dx = Bc * sc * 0.45 * Math.cos(a), dy = Bc * sc * 0.45 * Math.sin(a); D.arrow(ctx, cx - r * 1.2, cy + r * 0.25, cx - r * 1.2 + dx, cy + r * 0.25 + dy, { color: '--c1', width: 2.2 }); D.label(ctx, 'B_c', cx - r * 1.2 + dx + 4, cy + r * 0.25 + dy + 14, { color: '--c1', weight: 700 }); }
        D.label(ctx, 'θ = ' + EM.fix(th / rad, 1) + '°', W - 8, H - 26, { align: 'right', weight: 700, mono: true });
        D.label(ctx, 'I = ' + EM.fix(p.I, 1) + ' mA', W - 8, H - 10, { align: 'right', mono: true });
      },
      medir(p, rnd, st) {
        const I = Math.abs(p.I) / 1000, tp = lect(ang(p, st, I), rnd), tm = lect(ang(p, st, -I), rnd), th = (Math.abs(tp) + Math.abs(tm)) / 2;
        return { I: L.quant(Math.abs(p.I) + rnd.gauss(0, 0.05), 0.1), tp, tm, th, tg: Math.tan(th * rad) };
      },
      serie(p, rnd, st) {
        const BH = EM.local().B.H * 1e-9, Imax = (Math.tan(60 * rad) * BH) / kB(p), out = [];
        for (let k = 1; k <= 7; k++) out.push(this.medir(Object.assign({}, p, { I: L.quant((Imax * k * 1000) / 7, 0.5) }), rnd, st));
        return out;
      },
      grafica(rows) { return { x: rows.map((q) => q.I / 1000), y: rows.map((q) => q.tg), xl: 'I (A)', yl: 'tan θ medio', ajuste: 'origen', xextra: [0], yextra: [0] }; },
      resultado(fit, rows, p, st) {
        const B = EM.local().B, out = [['ig', 'B<sub>H</sub> del IGRF-14 (' + EM.local().nombre + ')', EM.fix(B.H / 1000, 2) + ' µT']];
        const c = campo(p, st, 0);
        out.push(['mg', 'Magnetómetro del celular (sin corriente)', EM.fix(c.Bloc * 1e6 + 0, 1) + ' µT']);
        if (fit && rows.length >= 2) { const bh = kB(p) / fit.m, s = (kB(p) * fit.sm) / (fit.m * fit.m); out.push(['bh', 'B<sub>H</sub> = (B<sub>c</sub>/I) / pendiente', L.pm(bh * 1e6, s * 1e6, 'µT'), true]); out.push(['d', 'Diferencia con el IGRF', (bh * 1e9 >= B.H ? '+' : '−') + EM.fix(Math.abs((bh * 1e9) / B.H - 1) * 100, 1) + ' %']); }
        return out;
      }
    });
  });
})();
