/* ===================================================================
   45-circuit.js — Símbolos de circuitos sobre Canvas (norma ANSI/IEEE,
   la habitual en los textos de física en español)
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  const C = (c) => (c && c.startsWith && c.startsWith('--') ? EM.col(c) : c);
  const CK = (EM.ckt = {});

  function frame(ctx, x1, y1, x2, y2, body, o = {}) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    const ux = dx / L, uy = dy / L;
    const bl = Math.min(o.len || 34, L * 0.8);
    const a = (L - bl) / 2;
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ink');
    ctx.fillStyle = C(o.color || '--ink');
    ctx.lineWidth = o.width || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + ux * a, y1 + uy * a);
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * a, y2 - uy * a);
    ctx.stroke();
    ctx.translate(x1 + ux * a, y1 + uy * a);
    ctx.rotate(Math.atan2(uy, ux));
    body(ctx, bl);
    ctx.restore();
    /* etiqueta perpendicular al centro */
    if (o.label) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const px = -uy, py = ux;
      const off = o.labelOff === undefined ? 20 : o.labelOff;
      const side = o.labelSide === undefined ? 1 : o.labelSide;
      const lines = Array.isArray(o.label) ? o.label : [o.label];
      lines.forEach((t, i) => {
        const lx = mx + px * off * side, ly = my + py * off * side + (i - (lines.length - 1) / 2) * 15;
        EM.text(ctx, t, lx, ly, { size: o.labelSize || 12, color: o.labelColor || '--ink', align: Math.abs(px) > 0.5 ? (px * side > 0 ? 'left' : 'right') : 'center', baseline: 'middle', halo: true, mono: !!o.mono });
      });
    }
  }
  CK.wire = function (ctx, pts, o = {}) {
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ink');
    ctx.lineWidth = o.width || 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.restore();
  };
  CK.node = function (ctx, x, y, o = {}) {
    ctx.save();
    ctx.fillStyle = C(o.color || '--ink');
    ctx.beginPath();
    ctx.arc(x, y, o.r || 3.5, 0, 7);
    ctx.fill();
    ctx.restore();
  };
  CK.resistor = function (ctx, x1, y1, x2, y2, o = {}) {
    frame(ctx, x1, y1, x2, y2, (c, bl) => {
      const n = 6, amp = o.amp || 6;
      c.beginPath();
      c.moveTo(0, 0);
      for (let i = 0; i < n; i++) c.lineTo((bl * (i + 0.5)) / n, i % 2 ? amp : -amp);
      c.lineTo(bl, 0);
      c.stroke();
    }, o);
  };
  CK.capacitor = function (ctx, x1, y1, x2, y2, o = {}) {
    frame(ctx, x1, y1, x2, y2, (c, bl) => {
      const g = o.gap || 7, h = o.plate || 12;
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(bl / 2 - g / 2, 0);
      c.moveTo(bl, 0); c.lineTo(bl / 2 + g / 2, 0);
      c.stroke();
      c.lineWidth = (o.width || 2) + 1;
      c.beginPath();
      c.moveTo(bl / 2 - g / 2, -h); c.lineTo(bl / 2 - g / 2, h);
      c.moveTo(bl / 2 + g / 2, -h); c.lineTo(bl / 2 + g / 2, h);
      c.stroke();
      if (o.charge) {
        /* signos + y − sobre las placas */
        c.lineWidth = 1.5;
        const s = o.charge > 0 ? 1 : -1;
        const draw = (x, plus) => { c.beginPath(); c.moveTo(x - 3, -h - 7); c.lineTo(x + 3, -h - 7); if (plus) { c.moveTo(x, -h - 10); c.lineTo(x, -h - 4); } c.stroke(); };
        draw(bl / 2 - g / 2 - 4, s > 0);
        draw(bl / 2 + g / 2 + 4, s < 0);
      }
    }, Object.assign({ len: 26 }, o));
  };
  CK.inductor = function (ctx, x1, y1, x2, y2, o = {}) {
    frame(ctx, x1, y1, x2, y2, (c, bl) => {
      const n = o.turns || 4, r = bl / (2 * n);
      c.beginPath();
      c.moveTo(0, 0);
      for (let i = 0; i < n; i++) c.arc(r + 2 * r * i, 0, r, Math.PI, 0, false);
      c.stroke();
    }, Object.assign({ len: 40 }, o));
  };
  CK.battery = function (ctx, x1, y1, x2, y2, o = {}) {
    /* el terminal positivo (placa larga) está del lado de (x2, y2) */
    frame(ctx, x1, y1, x2, y2, (c, bl) => {
      const g = 7;
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(bl / 2 - g / 2, 0);
      c.moveTo(bl, 0); c.lineTo(bl / 2 + g / 2, 0);
      c.stroke();
      c.lineWidth = 3.4;
      c.beginPath(); c.moveTo(bl / 2 - g / 2, -6); c.lineTo(bl / 2 - g / 2, 6); c.stroke();
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(bl / 2 + g / 2, -13); c.lineTo(bl / 2 + g / 2, 13); c.stroke();
      c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(bl / 2 + g / 2 + 7, -16); c.lineTo(bl / 2 + g / 2 + 13, -16); c.moveTo(bl / 2 + g / 2 + 10, -19); c.lineTo(bl / 2 + g / 2 + 10, -13); c.stroke();
    }, Object.assign({ len: 26 }, o));
  };
  CK.acsource = function (ctx, x1, y1, x2, y2, o = {}) {
    frame(ctx, x1, y1, x2, y2, (c, bl) => {
      const r = bl / 2;
      c.beginPath(); c.arc(r, 0, r, 0, 7); c.stroke();
      c.beginPath();
      for (let i = 0; i <= 24; i++) { const t = i / 24; const x = r - r * 0.6 + 1.2 * r * t, y = -Math.sin(t * 2 * Math.PI) * r * 0.35; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
      c.stroke();
    }, Object.assign({ len: 32 }, o));
  };
  CK.meter = function (ctx, x1, y1, x2, y2, o = {}) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    frame(ctx, x1, y1, x2, y2, (c, bl) => {
      const r = bl / 2;
      c.beginPath(); c.arc(r, 0, r, 0, 7); c.stroke();
      c.save();
      c.translate(r, 0);
      c.rotate(-ang);
      c.font = `700 ${Math.round(r * 1.05)}px ${EM.FONT_UI}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(o.letter || 'A', 0, 1);
      c.restore();
    }, Object.assign({ len: 28 }, o));
  };
  CK.switch = function (ctx, x1, y1, x2, y2, o = {}) {
    frame(ctx, x1, y1, x2, y2, (c, bl) => {
      c.beginPath();
      c.arc(0, 0, 2.5, 0, 7); c.moveTo(bl + 2.5, 0); c.arc(bl, 0, 2.5, 0, 7);
      c.fill();
      c.beginPath();
      c.moveTo(0, 0);
      if (o.closed) c.lineTo(bl, 0); else c.lineTo(bl * 0.9, -bl * 0.45);
      c.stroke();
    }, Object.assign({ len: 30 }, o));
  };
  CK.ground = function (ctx, x, y, o = {}) {
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ink');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x, y + 8);
    for (let j = 0; j < 3; j++) { const w = 11 - j * 4; ctx.moveTo(x - w, y + 8 + j * 4); ctx.lineTo(x + w, y + 8 + j * 4); }
    ctx.stroke();
    ctx.restore();
  };
  /* Puntos de corriente (portadores convencionales) que avanzan por una trayectoria.
     phase en píxeles recorridos; spacing en píxeles. */
  CK.flow = function (ctx, pts, phase, o = {}) {
    const sp = o.spacing || 22;
    let total = 0;
    const seg = [];
    for (let i = 1; i < pts.length; i++) { const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(L); total += L; }
    if (total <= 0) return;
    ctx.save();
    ctx.fillStyle = C(o.color || '--accent');
    let start = ((phase % sp) + sp) % sp;
    for (let s = start; s < total; s += sp) {
      let acc = 0, i = 0;
      while (i < seg.length && acc + seg[i] < s) { acc += seg[i]; i++; }
      if (i >= seg.length) break;
      const t = (s - acc) / seg[i];
      const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
      ctx.beginPath();
      ctx.arc(x, y, o.r || 3, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  };
})();
