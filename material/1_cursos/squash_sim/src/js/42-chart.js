/* Gráficos simples en canvas que respetan el tema (colores tomados de los tokens CSS). */
MS.Chart = (function () {
  const { U } = MS;
  const tok = () => ({ ink: U.css('--ink') || '#0f1a26', ink2: U.css('--ink-2') || '#4a5a6e', ink3: U.css('--ink-3') || '#75859a', line: U.css('--line') || '#d5dde7', bg: U.css('--surface-2') || '#f5f7fa', brand: U.css('--brand') || '#0a5a92', red: U.css('--red') || '#c41f2e', ok: U.css('--ok') || '#2b8a57', warn: U.css('--warn') || '#b8740f', bad: U.css('--bad') || '#c03636' });
  function setup(cv) {
    const r = cv.getBoundingClientRect();
    const w = Math.max(120, r.width), h = Math.max(80, r.height);
    const ctx = U.fitCanvas(cv, w, h);
    const T = tok();
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, w, h);
    return { ctx, w, h, T };
  }
  function frame(c, o) {
    const { ctx, w, h, T } = c;
    const pad = Object.assign({ l: 46, r: 14, t: 14, b: 32 }, o.pad || {});
    const L = pad.l, R = w - pad.r, Tp = pad.t, B = h - pad.b;
    const X = (x) => L + ((x - o.x0) / (o.x1 - o.x0)) * (R - L);
    const Y = (y) => B - ((y - o.y0) / (o.y1 - o.y0)) * (B - Tp);
    ctx.font = '11px "Source Sans 3", Arial'; ctx.fillStyle = T.ink2; ctx.strokeStyle = T.line; ctx.lineWidth = 1;
    for (const yt of o.yticks || []) { ctx.beginPath(); ctx.moveTo(L, Y(yt)); ctx.lineTo(R, Y(yt)); ctx.stroke(); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText((o.fy || String)(yt), L - 6, Y(yt)); }
    for (const xt of o.xticks || []) { ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText((o.fx || String)(xt), X(xt), B + 6); ctx.beginPath(); ctx.moveTo(X(xt), B); ctx.lineTo(X(xt), B + 3); ctx.stroke(); }
    ctx.strokeStyle = T.ink3; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
    if (o.xlabel) { ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillStyle = T.ink3; ctx.fillText(o.xlabel, R, h - 2); }
    if (o.ylabel) { ctx.save(); ctx.translate(11, (Tp + B) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = T.ink3; ctx.fillText(o.ylabel, 0, 0); ctx.restore(); }
    return { X, Y, L, R, T: Tp, B, ctx, tok: T };
  }
  function line(F, pts, color, width = 2, dash) {
    const { ctx } = F; if (!pts.length) return;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(F.X(x), F.Y(y)) : ctx.moveTo(F.X(x), F.Y(y)))); ctx.stroke(); ctx.restore();
  }
  function area(F, pts, y0, color, alpha = 0.18) {
    const { ctx } = F; if (!pts.length) return;
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = alpha; ctx.beginPath();
    ctx.moveTo(F.X(pts[0][0]), F.Y(y0)); for (const [x, y] of pts) ctx.lineTo(F.X(x), F.Y(y)); ctx.lineTo(F.X(pts[pts.length - 1][0]), F.Y(y0)); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function dot(F, x, y, color, r = 4, label) {
    const { ctx } = F; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(F.X(x), F.Y(y), r, 0, Math.PI * 2); ctx.fill();
    if (label) { ctx.font = '600 11px "Source Sans 3", Arial'; ctx.fillStyle = F.tok.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(label, F.X(x) + 6, F.Y(y) - 4); }
  }
  return { setup, frame, line, area, dot, tok };
})();
