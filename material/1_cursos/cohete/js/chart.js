// Gráfica altura–tiempo. La usan la HUD del video (versión compacta) y la pantalla de resultados.

import { niceTicks } from './analysis.js';

export const FONT = '"Roboto Condensed", "sans-serif-condensed", "Arial Narrow", "Segoe UI", system-ui, sans-serif';
export const SRC_COLORS = { auto: '#ff8a3d', toque: '#ffd166', manual: '#ffd166', cruz: '#7fe0ff' };

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * pts: [{t (s desde el despegue), h, sig, src}]. o: {res, compact, scale, bg, grid, text, accent, cursorT, tMin}.
 */
export function drawChart(ctx, x, y, w, h, pts, o = {}) {
  const s = o.scale || 1;
  const grid = o.grid || 'rgba(255,255,255,0.14)', text = o.text || 'rgba(240,245,248,0.8)';
  ctx.save();
  if (o.bg) { ctx.fillStyle = o.bg; roundRect(ctx, x, y, w, h, 10 * s); ctx.fill(); }
  const fs = (o.compact ? 12 : 13) * s;
  const padL = (o.compact ? 34 : 48) * s, padB = (o.compact ? 20 : 40) * s, padT = (o.compact ? 10 : 16) * s, padR = 12 * s;
  const X0 = x + padL, Y0 = y + padT, PW = w - padL - padR, PH = h - padT - padB;
  let tMax = o.tMin ?? 2, hMax = 5, hMin = 0;
  for (const p of pts) {
    tMax = Math.max(tMax, p.t);
    hMax = Math.max(hMax, p.h + (o.compact ? 0 : Math.min(p.sig || 0, 0.3 * Math.abs(p.h) + 2)));
    hMin = Math.min(hMin, p.h);
  }
  if (o.res) hMax = Math.max(hMax, o.res.apogee);
  tMax *= 1.04;
  hMax *= 1.12;
  const sx = (t) => X0 + (t / tMax) * PW;
  const sy = (v) => Y0 + PH - ((v - hMin) / (hMax - hMin)) * PH;
  ctx.font = `500 ${fs}px ${FONT}`;
  ctx.lineWidth = Math.max(1, s);
  const ty = niceTicks(hMin, hMax, o.compact ? 3 : 6), tx = niceTicks(0, tMax, o.compact ? 4 : 7);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  for (const v of ty.ticks) {
    ctx.strokeStyle = grid;
    ctx.beginPath(); ctx.moveTo(X0, sy(v)); ctx.lineTo(X0 + PW, sy(v)); ctx.stroke();
    ctx.fillStyle = text;
    ctx.fillText(`${+v.toFixed(1)}`, X0 - 5 * s, sy(v));
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const v of tx.ticks) {
    ctx.fillStyle = text;
    ctx.fillText(`${+v.toFixed(1)}`, sx(v), Y0 + PH + 4 * s);
  }
  if (!o.compact) {
    ctx.fillText('tiempo desde el despegue (s)', X0 + PW / 2, Y0 + PH + 20 * s);
    ctx.save();
    ctx.translate(x + 12 * s, Y0 + PH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle';
    ctx.fillText('altura sobre la rampa (m)', 0, 0);
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(X0, Y0 - 2, PW, PH + 4);
  ctx.clip();
  // Barras de error (solo en la gráfica grande).
  if (!o.compact) {
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    for (const p of pts) {
      if (!p.sig) continue;
      ctx.beginPath(); ctx.moveTo(sx(p.t), sy(p.h - p.sig)); ctx.lineTo(sx(p.t), sy(p.h + p.sig)); ctx.stroke();
    }
  }
  // Ajuste parabólico cerca del apogeo.
  const r = o.res;
  if (r && r.fitted && r.fit) {
    const f = r.fit;
    ctx.strokeStyle = o.accent || '#ffffff';
    ctx.lineWidth = 2 * s;
    ctx.setLineDash([6 * s, 4 * s]);
    ctx.beginPath();
    const ta = r.tApo - 0.9, tb = r.tApo + 0.9;
    for (let i = 0; i <= 40; i++) {
      const t = ta + ((tb - ta) * i) / 40, u = t - f.tm;
      const v = f.a * u * u + f.b * u + f.c;
      if (i) ctx.lineTo(sx(t), sy(v)); else ctx.moveTo(sx(t), sy(v));
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Puntos.
  const rad = (o.compact ? 2.2 : 3) * s;
  for (const p of pts) {
    ctx.fillStyle = SRC_COLORS[p.src] || '#fff';
    ctx.beginPath(); ctx.arc(sx(p.t), sy(p.h), rad, 0, 2 * Math.PI); ctx.fill();
  }
  if (o.cursorT != null) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath(); ctx.moveTo(sx(o.cursorT), Y0); ctx.lineTo(sx(o.cursorT), Y0 + PH); ctx.stroke();
  }
  ctx.restore();
  // Apogeo.
  if (r) {
    const X = sx(r.tApo), Y = sy(r.apogee);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1 * s;
    ctx.setLineDash([3 * s, 3 * s]);
    ctx.beginPath(); ctx.moveTo(X0, Y); ctx.lineTo(X0 + PW, Y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(X, Y - 6 * s); ctx.lineTo(X + 6 * s, Y); ctx.lineTo(X, Y + 6 * s); ctx.lineTo(X - 6 * s, Y); ctx.closePath(); ctx.fill();
    ctx.font = `700 ${fs + 1 * s}px ${FONT}`;
    ctx.textAlign = X > X0 + PW * 0.6 ? 'right' : 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${r.apogee.toFixed(1)} m`, X + (ctx.textAlign === 'left' ? 9 : -9) * s, Y - 4 * s);
  }
  ctx.restore();
}
