/* ===================================================================
   ui/15-grafica.js — Gráfica de líneas pequeña (SVG, con tokens de tema)
   =================================================================== */
(function () {
  'use strict';
  const OB = window.OB;

  function ticks(min, max, n) {
    const span = max - min || 1, paso0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(paso0)));
    const f = paso0 / mag, paso = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
    const out = [];
    for (let v = Math.ceil(min / paso) * paso; v <= max + 1e-9; v += paso) out.push(Math.abs(v) < 1e-9 ? 0 : +v.toFixed(10));
    return out;
  }
  /* o: {w,h,xmin,xmax,ymin,ymax,xlabel,ylabel,series:[{pts,color,dash,w}],puntos:[{x,y,color,r,title}],hlines:[{y,label,color}],vlines:[{x,label,color}], log:false} */
  OB.grafica = function (o) {
    const W = o.w || 460, H = o.h || 240, m = { l: 50, r: 16, t: 14, b: 40 };
    const svg = OB.s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'svg-banco', role: 'img', 'aria-label': o.aria || 'Gráfica' });
    const x0 = o.xmin, x1 = o.xmax, y0 = o.ymin, y1 = o.ymax;
    const X = (x) => m.l + ((x - x0) / (x1 - x0)) * (W - m.l - m.r);
    const Y = (y) => H - m.b - ((y - y0) / (y1 - y0)) * (H - m.t - m.b);
    ticks(y0, y1, 5).forEach((t) => {
      OB.s('line', { x1: m.l, x2: W - m.r, y1: Y(t), y2: Y(t), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      OB.s('text', { x: m.l - 6, y: Y(t) + 4, 'text-anchor': 'end', 'font-size': 11, fill: 'var(--ink-3)' }, svg, String(t));
    });
    ticks(x0, x1, 6).forEach((t) => {
      OB.s('line', { x1: X(t), x2: X(t), y1: m.t, y2: H - m.b, stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      OB.s('text', { x: X(t), y: H - m.b + 15, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ink-3)' }, svg, String(t));
    });
    OB.s('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'none', stroke: 'var(--ink-3)' }, svg);
    if (o.xlabel) OB.s('text', { x: (m.l + W - m.r) / 2, y: H - 6, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--ink-2)' }, svg, o.xlabel);
    if (o.ylabel) OB.s('text', { x: 12, y: (m.t + H - m.b) / 2, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--ink-2)', transform: `rotate(-90 12 ${(m.t + H - m.b) / 2})` }, svg, o.ylabel);
    (o.hlines || []).forEach((l) => {
      OB.s('line', { x1: m.l, x2: W - m.r, y1: Y(l.y), y2: Y(l.y), stroke: l.color || 'var(--accent)', 'stroke-dasharray': '6 4', 'stroke-width': 1.6 }, svg);
      if (l.label) OB.s('text', { x: W - m.r - 4, y: Y(l.y) - 4, 'text-anchor': 'end', 'font-size': 11, fill: l.color || 'var(--accent)' }, svg, l.label);
    });
    (o.vlines || []).forEach((l) => {
      OB.s('line', { x1: X(l.x), x2: X(l.x), y1: m.t, y2: H - m.b, stroke: l.color || 'var(--ok)', 'stroke-dasharray': '6 4', 'stroke-width': 1.6 }, svg);
      if (l.label) OB.s('text', { x: X(l.x) + 4, y: m.t + 12, 'font-size': 11, fill: l.color || 'var(--ok)' }, svg, l.label);
    });
    (o.series || []).forEach((s) => {
      const pts = s.pts.filter((p) => isFinite(p[1])).map((p) => `${X(p[0]).toFixed(1)},${Y(Math.max(y0, Math.min(y1, p[1]))).toFixed(1)}`).join(' ');
      OB.s('polyline', { points: pts, fill: 'none', stroke: s.color || 'var(--accent)', 'stroke-width': s.w || 2.4, 'stroke-dasharray': s.dash || null, 'stroke-linejoin': 'round' }, svg);
    });
    (o.puntos || []).forEach((p) => {
      const c = OB.s('circle', { cx: X(p.x), cy: Y(p.y), r: p.r || 4.5, fill: p.color || 'var(--ink)', stroke: 'var(--surface)', 'stroke-width': 1.5 }, svg);
      if (p.title) OB.s('title', null, c, p.title);
    });
    return svg;
  };
})();
