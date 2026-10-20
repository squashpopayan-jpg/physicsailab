/* Capítulo 30 — Reflexión, refracción y reflexión total */
(function () {
  'use strict';
  const EM = window.EM, MO = EM.MOD, L = EM.L, D = EM.draw;
  const MED = { agua: ['Agua (láser rojo)', 1.331], aguav: ['Agua (láser verde)', 1.334], acr: ['Acrílico', 1.49], vid: ['Vidrio común', 1.52] };
  const r = (x) => (x * Math.PI) / 180, dg = (x) => (x * 180) / Math.PI;
  EM.defineSim('refraccion-banco', function (sim) {
    EM.banco(sim, {
      nombre: 'refraccion', aspect: [1.1, 1.2],
      cols: [{ k: 't1', t: 'θ₁ (°)', d: 0 }, { k: 'tr', t: 'θ reflejado (°)', d: 0 }, { k: 't2', t: 'θ₂ (°)', d: 0 }, { k: 's1', t: 'sen θ₁', d: 4 }, { k: 's2', t: 'sen θ₂', d: 4 }],
      controles(sim) {
        sim.group('Interfaz');
        sim.select('med', { label: 'Medio', options: Object.keys(MED).map((k) => [k, MED[k][0]]), value: 'agua' });
        sim.seg('dir', { label: 'El haz llega', options: [['aire', 'Desde el aire'], ['medio', 'Desde el medio']], value: 'aire' });
        sim.slider('th', { label: 'Ángulo de incidencia', min: 0, max: 89, step: 0.5, value: 40, unit: '°', fmt: (v) => EM.fix(v, 1) });
      },
      montaje(ctx, cv, p) {
        const W = cv.w, H = cv.h, n = MED[p.med][1];
        const [n1, n2] = p.dir === 'aire' ? [1, n] : [n, 1];
        const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.42;
        ctx.save(); ctx.fillStyle = EM.col('--water'); ctx.globalAlpha = 0.25; ctx.fillRect(0, cy, W, H - cy); ctx.restore();
        D.line(ctx, 0, cy, W, cy, { color: '--glass', width: 2 });
        D.line(ctx, cx, cy - R, cx, cy + R, { color: '--ink-3', dash: [4, 4], width: 1 });
        ctx.save(); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 0.7; for (let a = 0; a < 360; a += 10) { const x = cx + R * Math.sin(r(a)), y = cy - R * Math.cos(r(a)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx + (R - 6) * Math.sin(r(a)), cy - (R - 6) * Math.cos(r(a))); ctx.stroke(); } ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke(); ctx.restore();
        const t1 = r(p.th), up = p.dir === 'aire' ? -1 : 1; /* lado del haz incidente */
        const xi = cx - R * Math.sin(t1), yi = cy + up * R * Math.cos(t1);
        const Rf = MO.fresnelR(n1, t1, n2), t2 = MO.snell(n1, t1, n2);
        const col = p.med === 'aguav' ? '#2BBF3A' : '#E53935';
        D.haz(ctx, [[xi, yi], [cx, cy]], { color: col, width: 3 });
        D.haz(ctx, [[cx, cy], [cx + R * Math.sin(t1), cy + up * R * Math.cos(t1)]], { color: col, width: 0.6 + 4 * Rf, alpha: 0.4 + 0.6 * Rf });
        if (!isNaN(t2)) D.haz(ctx, [[cx, cy], [cx + R * Math.sin(t2), cy - up * R * Math.cos(t2)]], { color: col, width: 0.6 + 3 * (1 - Rf), alpha: 0.5 + 0.5 * (1 - Rf) });
        D.label(ctx, p.dir === 'aire' ? 'aire (n = 1,00)' : MED[p.med][0] + ' (n = ' + EM.fix(n, 3) + ')', 10, 18);
        D.label(ctx, p.dir === 'aire' ? MED[p.med][0] + ' (n = ' + EM.fix(n, 3) + ')' : 'aire (n = 1,00)', 10, H - 10);
        D.label(ctx, 'θ₁ = ' + EM.fix(p.th, 1) + '°', xi + (xi < cx ? -6 : 6), yi + (up < 0 ? -6 : 14), { align: xi < cx ? 'right' : 'left' });
        D.label(ctx, isNaN(t2) ? 'reflexión total' : 'θ₂ = ' + EM.fix(dg(t2), 1) + '°', W - 10, up < 0 ? H - 30 : 34, { align: 'right', weight: 650, color: isNaN(t2) ? '--c2' : '--ink-2' });
      },
      medir(p, rnd) {
        const n = MED[p.med][1], [n1, n2] = p.dir === 'aire' ? [1, n] : [n, 1];
        const t1 = L.quant(p.th + rnd.gauss(0, 0.3), 1), t2r = MO.snell(n1, r(p.th), n2);
        const t2 = isNaN(t2r) ? NaN : L.quant(dg(t2r) + rnd.gauss(0, 0.4), 1), tr = L.quant(p.th + rnd.gauss(0, 0.4), 1);
        return { t1, tr, t2: isNaN(t2) ? '—' : t2, s1: Math.sin(r(t1)), s2: isNaN(t2) ? NaN : Math.sin(r(t2)) };
      },
      serie(p, rnd, st) { const out = []; for (const th of [10, 20, 30, 40, 50, 60, 70]) out.push(this.medir(Object.assign({}, p, { th, dir: 'aire' }), rnd, st)); return out; },
      grafica(rows) { const rr = rows.filter((x) => isFinite(x.s2)); return { x: rr.map((x) => x.s2), y: rr.map((x) => x.s1), xl: 'sen θ₂', yl: 'sen θ₁', ajuste: 'origen', xextra: [0, 0.8], yextra: [0, 1] }; },
      resultado(fit, rows, p) {
        const n = MED[p.med][1], out = [['c', 'Ángulo crítico del medio', EM.fix(dg(MO.critico(n, 1)), 1) + '°'], ['R', 'Fracción reflejada (Fresnel)', EM.fix(100 * MO.fresnelR(p.dir === 'aire' ? 1 : n, r(p.th), p.dir === 'aire' ? n : 1), 1) + ' %']];
        if (fit && rows.length >= 3) { out.push(['n', 'Índice n = pendiente', L.pm(fit.m, fit.sm), true]); out.push(['z', 'Frente al valor de referencia', L.compat(fit.m, fit.sm, n, 0.002).html]); }
        return out;
      }
    });
  });
})();
