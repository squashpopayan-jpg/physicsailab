/* Portada — prisma con luz blanca (trazado exacto con Sellmeier) */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;

  EM.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    sim.slider('rot', { label: 'Giro del prisma', min: -20, max: 20, step: 0.5, value: 0, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.select('glass', { label: 'Vidrio', options: [['N-SF11', 'N-SF11 (flint denso)'], ['N-F2', 'N-F2 (flint)'], ['N-BK7', 'N-BK7 (crown)'], ['diamante', 'Diamante']], value: 'N-SF11' });
    sim.out('dev', 'Desviación (589 nm)', { hl: true });
    sim.out('spread', 'Abertura angular 400–700 nm');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      D.dark(cv);
      const v = D.view({ x: 0, y: 0, w: W, h: H }, -1.3, 1.75, -1.0, 1.0);
      const rot = ((p.rot + 1.5 * Math.sin(t * 0.4)) * Math.PI) / 180;
      /* triángulo equilátero centrado en el origen, vértice arriba, girado */
      const R = 0.62, verts = [0, 1, 2].map((k) => { const a = Math.PI / 2 + rot + (k * 2 * Math.PI) / 3; return [R * Math.cos(a), R * Math.sin(a)]; });
      const edges = [[verts[0], verts[1]], [verts[1], verts[2]], [verts[2], verts[0]]];
      ctx.save();
      ctx.beginPath(); verts.forEach((q, i) => { const m = v.map(q); i ? ctx.lineTo(m[0], m[1]) : ctx.moveTo(m[0], m[1]); }); ctx.closePath();
      ctx.fillStyle = 'rgba(160,190,230,0.16)'; ctx.fill(); ctx.strokeStyle = 'rgba(190,210,240,0.7)'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.restore();
      const n = (l) => OP.n(p.glass, l);
      /* intersección rayo–segmento */
      const hit = (P, d, skip) => {
        let best = null;
        edges.forEach((e, i) => {
          if (i === skip) return;
          const ex = e[1][0] - e[0][0], ey = e[1][1] - e[0][1], den = d[0] * ey - d[1] * ex;
          if (Math.abs(den) < 1e-12) return;
          const s = ((e[0][0] - P[0]) * ey - (e[0][1] - P[1]) * ex) / den, u = ((e[0][0] - P[0]) * d[1] - (e[0][1] - P[1]) * d[0]) / den;
          if (s > 1e-9 && u >= 0 && u <= 1 && (!best || s < best.s)) best = { s, i, pt: [P[0] + s * d[0], P[1] + s * d[1]], nrm: [ey, -ex] };
        });
        return best;
      };
      const refr = (d, nrm, n1, n2) => {
        let L = Math.hypot(nrm[0], nrm[1]), N = [nrm[0] / L, nrm[1] / L];
        let c = -(d[0] * N[0] + d[1] * N[1]);
        if (c < 0) { N = [-N[0], -N[1]]; c = -c; }
        const r = n1 / n2, k = 1 - r * r * (1 - c * c);
        if (k < 0) return null;
        return [r * d[0] + (r * c - Math.sqrt(k)) * N[0], r * d[1] + (r * c - Math.sqrt(k)) * N[1]];
      };
      const src = [-1.6, -0.62], d0 = [Math.cos(0.5236), Math.sin(0.5236)];
      const h0 = hit(src, d0, -1);
      if (!h0) return;
      /* haz blanco incidente */
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 3; ctx.shadowColor = 'rgba(255,255,255,0.6)'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(...v.map(src)); ctx.lineTo(...v.map(h0.pt)); ctx.stroke(); ctx.restore();
      const outs = {};
      ctx.save();
      for (let l = 700; l >= 400; l -= 3) {
        const d1 = refr(d0, h0.nrm, 1, n(l));
        if (!d1) continue;
        const h1 = hit(h0.pt, d1, h0.i);
        if (!h1) continue;
        const d2 = refr(d1, h1.nrm, n(l), 1);
        ctx.strokeStyle = 'rgba(235,240,255,0.06)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(...v.map(h0.pt)); ctx.lineTo(...v.map(h1.pt)); ctx.stroke();
        if (!d2) continue;
        const end = [h1.pt[0] + 3 * d2[0], h1.pt[1] + 3 * d2[1]];
        ctx.strokeStyle = D.lamRay(l, 0.9); ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(...v.map(h1.pt)); ctx.lineTo(...v.map(end)); ctx.stroke();
        outs[l] = Math.atan2(d2[1], d2[0]);
      }
      ctx.restore();
      const a0 = Math.atan2(d0[1], d0[0]);
      /* desviación a 589 nm */
      const d1 = refr(d0, h0.nrm, 1, n(589)), h1 = d1 && hit(h0.pt, d1, h0.i), d2 = h1 && refr(d1, h1.nrm, n(589), 1);
      sim.set('dev', d2 ? EM.fix((Math.abs(Math.atan2(d2[1], d2[0]) - a0) * 180) / Math.PI, 2) + '° (n = ' + EM.fix(n(589), 4) + ')' : 'reflexión total interna');
      sim.set('spread', outs[400] !== undefined && outs[700] !== undefined ? EM.fix((Math.abs(outs[400] - outs[700]) * 180) / Math.PI, 2) + '°' : '—');
    });
  });
})();
