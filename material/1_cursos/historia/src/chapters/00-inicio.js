/* Portada — dos sistemas del mundo que producen el mismo cielo */
(function () {
  'use strict';
  const EM = window.EM;
  const PI = Math.PI;

  /* Marte visto desde la Tierra: el modelo heliocéntrico (izquierda) y el de deferente y epiciclo (derecha)
     dan exactamente la misma posición aparente. Se usa también en el capítulo 9. */
  function marsLoop(sim, opts) {
    const cv = sim.canvas({ aspect: opts.aspect || 1.9 });
    sim.slider('sp', { label: 'Velocidad (años por segundo)', min: 0.05, max: 1.2, step: 0.05, value: 0.35, fmt: (v) => v.toFixed(2) });
    sim.check('tr', { label: 'Dejar la traza de Marte', value: true });
    sim.out('ang', 'Longitud de Marte vista desde la Tierra', { hl: true });
    sim.out('mov', 'Movimiento aparente');
    sim.out('t', 'Tiempo desde la oposición (años)');
    const RM = 1.524, TM = 1.881; /* radio en UA y periodo en años (círculos) */
    let t = -0.65, trace = [], lastLon = null;
    const rel = (tt) => {
      const e = 2 * PI * tt, m = (2 * PI * tt) / TM;
      return [RM * Math.cos(m) - Math.cos(e), RM * Math.sin(m) - Math.sin(e)];
    };
    const reset = () => { t = -0.65; trace = []; lastLon = null; };
    sim.resetButton(reset);
    sim.animate((dt) => {
      t += dt * sim.p.sp;
      if (t > 1.5) reset();
      trace.push([t, rel(t)]);
      if (trace.length > 900) trace.shift();
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      const half = W / 2, R = Math.min(half, H) * 0.5 / 1.75;
      const circle = (x, y, r, st) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * PI); if (st.fill) { ctx.fillStyle = st.fill; ctx.fill(); } if (st.stroke) { ctx.strokeStyle = st.stroke; ctx.lineWidth = st.lw || 1; ctx.setLineDash(st.dash || []); ctx.stroke(); ctx.setLineDash([]); } };
      const e = 2 * PI * t, m = (2 * PI * t) / TM;
      /* Panel izquierdo: heliocéntrico */
      const cx1 = half * 0.5, cy1 = H * 0.54;
      EM.text(ctx, 'Sol en el centro (Copérnico)', cx1, 16, { size: 11.5, color: '--ink-2', align: 'center', weight: 650 });
      circle(cx1, cy1, R, { stroke: EM.alpha('--ink-3', 0.6), dash: [3, 4] });
      circle(cx1, cy1, R * RM, { stroke: EM.alpha('--ink-3', 0.6), dash: [3, 4] });
      const E1 = [cx1 + R * Math.cos(e), cy1 - R * Math.sin(e)], M1 = [cx1 + R * RM * Math.cos(m), cy1 - R * RM * Math.sin(m)];
      /* línea de visión de la Tierra a Marte, prolongada */
      const dx = M1[0] - E1[0], dy = M1[1] - E1[1], L = Math.hypot(dx, dy) || 1;
      ctx.strokeStyle = EM.alpha('--ray', 0.55); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(E1[0], E1[1]); ctx.lineTo(E1[0] + (dx / L) * R * 3.3, E1[1] + (dy / L) * R * 3.3); ctx.stroke();
      circle(cx1, cy1, 7, { fill: EM.col('--gold') });
      circle(E1[0], E1[1], 5, { fill: EM.col('--c1') }); EM.text(ctx, 'Tierra', E1[0] + 7, E1[1] + 12, { size: 10, color: '--c1' });
      circle(M1[0], M1[1], 4.5, { fill: EM.col('--c2') }); EM.text(ctx, 'Marte', M1[0] + 7, M1[1] - 5, { size: 10, color: '--c2' });
      /* Panel derecho: Tierra en el centro, deferente y epiciclo */
      const cx2 = half * 1.5, cy2 = cy1;
      EM.text(ctx, 'Tierra en el centro (Ptolomeo)', cx2, 16, { size: 11.5, color: '--ink-2', align: 'center', weight: 650 });
      circle(cx2, cy2, R * RM, { stroke: EM.alpha('--ink-3', 0.6), dash: [3, 4] });
      const C = [cx2 + R * RM * Math.cos(m), cy2 - R * RM * Math.sin(m)];
      circle(C[0], C[1], R, { stroke: EM.alpha('--ink-3', 0.6), dash: [3, 4] });
      const Mp = [C[0] - R * Math.cos(e), C[1] + R * Math.sin(e)];
      if (p.tr) {
        ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 1.6; ctx.beginPath();
        trace.forEach((q, i) => { const x = cx2 + R * q[1][0], y = cy2 - R * q[1][1]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
      }
      ctx.strokeStyle = EM.alpha('--ink-2', 0.6); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(C[0], C[1]); ctx.lineTo(Mp[0], Mp[1]); ctx.stroke();
      circle(cx2, cy2, 5, { fill: EM.col('--c1') }); EM.text(ctx, 'Tierra', cx2 + 7, cy2 + 12, { size: 10, color: '--c1' });
      circle(C[0], C[1], 2.5, { fill: EM.col('--ink-3') });
      circle(Mp[0], Mp[1], 4.5, { fill: EM.col('--c2') }); EM.text(ctx, 'Marte', Mp[0] + 7, Mp[1] - 5, { size: 10, color: '--c2' });
      const r = rel(t), r2 = rel(t + 0.002);
      const lon = Math.atan2(r[1], r[0]), lon2 = Math.atan2(r2[1], r2[0]);
      let dl = lon2 - lon; if (dl > PI) dl -= 2 * PI; if (dl < -PI) dl += 2 * PI;
      sim.set('ang', EM.fix((lon * 180 / PI + 360) % 360, 1) + '°');
      sim.set('mov', dl < 0 ? 'retrógrado (hacia atrás)' : 'directo (hacia delante)');
      sim.set('t', EM.fix(t, 2));
    });
  }
  EM.marsLoop = marsLoop;
  EM.defineSim('home-hero', function (sim) { marsLoop(sim, { aspect: 1.55 }); });
})();
