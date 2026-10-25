// Capa de información que se dibuja sobre cada cuadro (y queda grabada en el video): escalera de ángulos,
// regla virtual de alturas sobre la rampa, trayectoria, marcador del cohete, panel de altura, gráfica y franja
// inferior con el número de cuadro codificado.

import * as G from './geom.js';
import { niceTicks } from './analysis.js';
import { drawChart, FONT, roundRect } from './chart.js';
import { drawBarcode, barcodeBox } from './barcode.js';

export const HUD_COL = {
  ink: '#7fe0ff', rocket: '#ff8a3d', text: '#f3f7fa', dim: 'rgba(243,247,250,0.62)',
  panel: 'rgba(7,13,19,0.6)', good: '#54d98c', warn: '#ffc44d', bad: '#ff5d6c', rec: '#ff3b47',
};
const C = HUD_COL;

function text(ctx, str, x, y, size, o = {}) {
  ctx.font = `${o.weight || 600} ${size}px ${FONT}`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = o.ls ? `${o.ls}px` : '0px';
  if (o.stroke !== false) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size / 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = o.color || C.text;
  ctx.fillText(str, x, y);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

function line(ctx, a, b) { ctx.beginPath(); ctx.moveTo(a.u, a.v); ctx.lineTo(b.u, b.v); ctx.stroke(); }

/** Altura que alcanza a cubrir el borde superior del cuadro, justo encima de la rampa. */
export function frameCoverage(Rs, cam, base, d, lateralFix) {
  if (!base) return null;
  const p = G.worldToPixel(Rs, cam, G.dirFromElAz(base.el0, base.az0));
  const u = p ? Math.max(0, Math.min(cam.W, p.u)) : cam.W / 2;
  const { el, az } = G.elAz(G.pixelToWorld(Rs, cam, u, 0));
  const r = G.heightAt(el, az, base, d, lateralFix);
  return r ? r.h : null;
}

function ladder(ctx, Rs, cam, s) {
  const ax = G.elAz(G.opticalAxis(Rs));
  ctx.lineWidth = 1.2 * s;
  for (let e = -30; e <= 80; e += 10) {
    const el = e * G.DEG;
    const span = (9 * G.DEG) / Math.max(0.35, Math.cos(el));
    const a = G.worldToPixel(Rs, cam, G.dirFromElAz(el, ax.az - span));
    const b = G.worldToPixel(Rs, cam, G.dirFromElAz(el, ax.az + span));
    if (!a || !b) continue;
    if (Math.max(a.v, b.v) < -50 || Math.min(a.v, b.v) > cam.H + 50) continue;
    ctx.strokeStyle = e === 0 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.28)';
    ctx.setLineDash(e === 0 ? [10 * s, 6 * s] : e < 0 ? [4 * s, 6 * s] : []);
    // Dos tramos con un hueco en el centro, como la escalera de cabeceo de un avión.
    const m = { u: (a.u + b.u) / 2, v: (a.v + b.v) / 2 };
    const g = 0.18;
    line(ctx, a, { u: m.u + (a.u - m.u) * g, v: m.v + (a.v - m.v) * g });
    line(ctx, { u: m.u + (b.u - m.u) * g, v: m.v + (b.v - m.v) * g }, b);
    ctx.setLineDash([]);
    text(ctx, `${e}°`, b.u + 6 * s, b.v + 4 * s, 13 * s, { color: 'rgba(255,255,255,0.6)', weight: 500 });
  }
}

function ruler(ctx, o, s, cover) {
  const { Rs, cam, base, d } = o;
  const Hobs = -d * Math.tan(base.el0);
  const pt = (z) => G.worldToPixel(Rs, cam, G.unit([d * Math.sin(base.az0), d * Math.cos(base.az0), z - Hobs]));
  const p0 = pt(0);
  if (!p0) return;
  const top = Math.max(10, cover ?? 50);
  const { ticks } = niceTicks(0, top, 8);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2 * s;
  const pTop = pt(top * 1.05);
  if (pTop) { ctx.globalAlpha = 0.75; line(ctx, p0, pTop); ctx.globalAlpha = 1; }
  for (const z of ticks) {
    const p = pt(z);
    if (!p || p.v < -10 || p.v > cam.H + 10) continue;
    const big = z === 0;
    ctx.beginPath(); ctx.moveTo(p.u - (big ? 14 : 7) * s, p.v); ctx.lineTo(p.u + (big ? 14 : 9) * s, p.v); ctx.stroke();
    if (z > 0) text(ctx, `${+z.toFixed(1)} m`, p.u + 13 * s, p.v + 5 * s, 15 * s, { color: C.ink, weight: 600 });
  }
  // Base de la rampa.
  ctx.fillStyle = C.ink;
  ctx.beginPath(); ctx.moveTo(p0.u, p0.v); ctx.lineTo(p0.u - 9 * s, p0.v + 15 * s); ctx.lineTo(p0.u + 9 * s, p0.v + 15 * s); ctx.closePath(); ctx.fill();
  text(ctx, 'RAMPA', p0.u, p0.v + 33 * s, 13 * s, { align: 'center', color: C.ink, ls: 1.5 * s, weight: 700 });
}

function stateChip(state, apoFlag, outTop) {
  if (outTop && (state === 'lost' || state === 'done')) return ['SALIÓ DEL CUADRO', C.bad];
  switch (state) {
    case 'armed': return ['ESPERANDO DESPEGUE', C.warn];
    case 'flight': return [apoFlag ? 'BAJANDO' : 'SIGUIENDO', C.rocket];
    case 'lost': return ['PERDIDO · TÓCALO', C.bad];
    case 'done': return ['TERMINADO', C.good];
    default: return null;
  }
}

/**
 * o: {W, H, Rs, cam, base, d, mode, lateralFix, label, clock, view, samples, tLaunch, maxH, apoFlag, live,
 *     rec:{on, idx, elapsed}, end, chart, showRoi}
 */
export function drawHUD(ctx, o) {
  const { W, H, Rs, cam, view } = o;
  // Escala pensada para ver el video en un teléfono: 720 px de ancho se ven a unos 360 px de pantalla.
  const s = (Math.min(W, H) / 720) * 1.45;
  const bc = barcodeBox(W, H);
  const bandH = Math.round(30 * s) + bc.bh + 10;
  ctx.save();
  // La escalera y la regla no invaden la franja inferior.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H - bandH);
  ctx.clip();
  if (Rs) ladder(ctx, Rs, cam, s);
  const cover = Rs && o.base ? frameCoverage(Rs, cam, o.base, o.d, o.lateralFix) : null;
  if (Rs && o.base) ruler(ctx, o, s, cover);
  ctx.restore();

  // Ventana de búsqueda del rastreador.
  if (o.showRoi && view && view.roi) {
    ctx.strokeStyle = 'rgba(255,138,61,0.55)';
    ctx.lineWidth = 1.5 * s;
    ctx.setLineDash([5 * s, 5 * s]);
    ctx.strokeRect(view.roi.x, view.roi.y, view.roi.w, view.roi.h);
    ctx.setLineDash([]);
  }

  // Trayectoria (direcciones del mundo re-proyectadas con la orientación actual).
  const S = o.samples || [];
  if (Rs && S.length > 1) {
    ctx.strokeStyle = C.rocket;
    ctx.lineWidth = 3 * s;
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    let started = false;
    for (const q of S) {
      const p = G.worldToPixel(Rs, cam, q.w);
      if (!p) { started = false; continue; }
      if (started) ctx.lineTo(p.u, p.v); else { ctx.moveTo(p.u, p.v); started = true; }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (Rs && o.live && o.live.apoSample) {
    const p = G.worldToPixel(Rs, cam, o.live.apoSample.w);
    if (p) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(p.u, p.v - 9 * s); ctx.lineTo(p.u + 9 * s, p.v); ctx.lineTo(p.u, p.v + 9 * s); ctx.lineTo(p.u - 9 * s, p.v); ctx.closePath(); ctx.fill();
      text(ctx, `apogeo ${o.live.res.apogee.toFixed(1)} m`, p.u + 14 * s, p.v - 8 * s, 17 * s, { weight: 700 });
    }
  }

  // Cruz central.
  const cx = W / 2, cy = H / 2;
  const cur = view && view.sample;
  const follow = o.mode === 'follow';
  ctx.strokeStyle = follow ? (cur && cur.src === 'cruz' ? C.ink : 'rgba(255,255,255,0.9)') : 'rgba(255,255,255,0.45)';
  ctx.lineWidth = (follow ? 2.5 : 1.5) * s;
  const R1 = (follow ? 30 : 10) * s, R2 = (follow ? 12 : 4) * s;
  ctx.beginPath();
  ctx.moveTo(cx - R1, cy); ctx.lineTo(cx - R2, cy); ctx.moveTo(cx + R2, cy); ctx.lineTo(cx + R1, cy);
  ctx.moveTo(cx, cy - R1); ctx.lineTo(cx, cy - R2); ctx.moveTo(cx, cy + R2); ctx.lineTo(cx, cy + R1);
  ctx.stroke();
  if (follow) { ctx.beginPath(); ctx.arc(cx, cy, 22 * s, 0, 2 * Math.PI); ctx.stroke(); }

  // Marcador del cohete.
  if (cur && cur.src !== 'cruz') {
    ctx.strokeStyle = C.rocket;
    ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.arc(cur.u, cur.v, 20 * s, 0, 2 * Math.PI); ctx.stroke();
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      ctx.beginPath(); ctx.moveTo(cur.u + Math.cos(a) * 20 * s, cur.v + Math.sin(a) * 20 * s); ctx.lineTo(cur.u + Math.cos(a) * 30 * s, cur.v + Math.sin(a) * 30 * s); ctx.stroke();
    }
    if (cur.h != null) text(ctx, `${cur.h.toFixed(1)} m`, cur.u + 36 * s, cur.v + 7 * s, 22 * s, { weight: 700, color: C.rocket });
  }

  // Panel superior.
  const px = 14 * s, py = 14 * s, pw = W - 28 * s, ph = 104 * s;
  ctx.fillStyle = C.panel;
  roundRect(ctx, px, py, pw, ph, 16 * s);
  ctx.fill();
  const inFlight = o.tLaunch != null && (view?.state === 'flight' || view?.state === 'lost' || view?.state === 'done');
  let hNow = null, hLabel = 'ALTURA';
  if (inFlight && cur && cur.h != null) hNow = cur.h;
  else if (!inFlight && view && view.cross && view.cross.h != null) { hNow = view.cross.h; hLabel = 'ALTURA EN LA CRUZ'; }
  text(ctx, hLabel, px + 18 * s, py + 27 * s, 13 * s, { color: C.dim, ls: 1.5 * s, weight: 700, stroke: false });
  if (!o.base) text(ctx, 'fija la base', px + 18 * s, py + 80 * s, 30 * s, { color: C.warn, weight: 700, stroke: false });
  else if (hNow != null) {
    ctx.font = `700 ${56 * s}px ${FONT}`;
    const v = hNow.toFixed(1);
    text(ctx, v, px + 16 * s, py + 88 * s, 56 * s, { weight: 700, stroke: false });
    const vw = ctx.measureText(v).width;
    text(ctx, 'm', px + 22 * s + vw, py + 88 * s, 24 * s, { color: C.dim, weight: 600, stroke: false });
  } else text(ctx, '—', px + 18 * s, py + 88 * s, 56 * s, { weight: 700, stroke: false });

  const mx = px + pw * 0.47;
  const apoKnown = o.live && o.live.res;
  if (o.maxH != null || apoKnown) {
    text(ctx, apoKnown ? 'APOGEO' : 'MÁXIMA', mx, py + 27 * s, 13 * s, { color: C.dim, ls: 1.5 * s, weight: 700, stroke: false });
    const val = apoKnown ? o.live.res.apogee : o.maxH;
    text(ctx, `${o.outTop ? '≥' : ''}${val.toFixed(1)} m`, mx, py + 82 * s, 40 * s, { weight: 700, color: apoKnown ? C.rocket : C.text, stroke: false });
  } else if (cover != null && !inFlight) {
    text(ctx, 'EL CUADRO CUBRE', mx, py + 27 * s, 13 * s, { color: C.dim, ls: 1.5 * s, weight: 700, stroke: false });
    text(ctx, `${Math.round(cover)} m`, mx, py + 82 * s, 40 * s, { weight: 700, color: C.ink, stroke: false });
  }

  // Estado: una píldora centrada justo debajo del panel.
  const chip = stateChip(view?.state, o.apoFlag, o.outTop);
  const rx = px + pw - 16 * s;
  if (chip) {
    ctx.font = `700 ${13 * s}px ${FONT}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${1.2 * s}px`;
    const tw = ctx.measureText(chip[0]).width + 24 * s;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.fillStyle = chip[1];
    roundRect(ctx, W / 2 - tw / 2, py + ph + 8 * s, tw, 24 * s, 12 * s);
    ctx.fill();
    text(ctx, chip[0], W / 2, py + ph + 25 * s, 13 * s, { align: 'center', color: '#0b1116', weight: 700, ls: 1.2 * s, stroke: false });
  }
  if (inFlight && view) {
    const tr = Math.max(0, view.t - o.tLaunch);
    text(ctx, 'TIEMPO', rx, py + 27 * s, 13 * s, { align: 'right', color: C.dim, ls: 1.5 * s, weight: 700, stroke: false });
    text(ctx, `T+${tr.toFixed(2)} s`, rx, py + 82 * s, 30 * s, { align: 'right', weight: 700, stroke: false });
  } else if (Rs) {
    const el = G.elAz(G.opticalAxis(Rs)).el / G.DEG;
    text(ctx, 'CRUZ', rx, py + 27 * s, 13 * s, { align: 'right', color: C.dim, ls: 1.5 * s, weight: 700, stroke: false });
    text(ctx, `${el.toFixed(1)}°`, rx, py + 82 * s, 30 * s, { align: 'right', color: C.dim, weight: 700, stroke: false });
  }

  // Gráfica compacta.
  if (o.chart && o.chart.length > 1) {
    const cw = W * 0.5, chh = H * 0.15;
    drawChart(ctx, W - 14 * s - cw, H - bandH - 12 * s - chh, cw, chh, o.chart, { compact: true, scale: s, bg: C.panel, res: o.live ? o.live.res : null });
  }

  // Franja inferior con el número de cuadro.
  ctx.fillStyle = 'rgba(7,13,19,0.78)';
  ctx.fillRect(0, H - bandH, W, bandH);
  text(ctx, `APOGEO${o.label ? ' · ' + o.label : ''}`, 14 * s, H - bandH + 21 * s, 15 * s, { weight: 700, ls: 1.2 * s, stroke: false });
  const info = `${o.base ? 'd ' + o.d.toFixed(1) + ' m · ' : ''}${follow ? 'en la mano' : 'trípode'} · ${o.clock || ''}`;
  text(ctx, info, W - 14 * s, H - bandH + 21 * s, 15 * s, { align: 'right', color: C.dim, weight: 500, stroke: false });
  if (o.rec && o.rec.on) {
    drawBarcode(ctx, W, H, o.rec.idx);
    const x = bc.x0 + bc.cw * bc.n + 18 * s, y = bc.y0 + bc.bh / 2;
    ctx.fillStyle = C.rec;
    ctx.beginPath(); ctx.arc(x, y, 6 * s, 0, 2 * Math.PI); ctx.fill();
    const e = o.rec.elapsed;
    text(ctx, `REC ${Math.floor(e / 60)}:${String(Math.floor(e % 60)).padStart(2, '0')}`, x + 12 * s, y + 5 * s, 14 * s, { weight: 700, stroke: false });
  }

  if (o.end) endCard(ctx, o, s);
  ctx.restore();
}

function endCard(ctx, o, s) {
  const { W, H } = o;
  const r = o.end.res;
  ctx.fillStyle = 'rgba(4,8,12,0.62)';
  ctx.fillRect(0, 0, W, H);
  const cw = Math.min(W - 40 * s, 640 * s), ch = 560 * s;
  const x = (W - cw) / 2, y = (H - ch) / 2 - 20 * s;
  ctx.fillStyle = 'rgba(12,20,28,0.94)';
  roundRect(ctx, x, y, cw, ch, 22 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(127,224,255,0.35)';
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();
  const L = x + 30 * s;
  text(ctx, 'APOGEO', L, y + 48 * s, 16 * s, { color: C.dim, ls: 3 * s, weight: 700, stroke: false });
  if (!r) {
    text(ctx, 'sin datos suficientes', L, y + 120 * s, 38 * s, { weight: 700, stroke: false });
    return;
  }
  text(ctx, `${r.clipped || o.outTop ? '≥' : ''}${r.apogee.toFixed(1)} m`, L - 3 * s, y + 140 * s, 92 * s, { weight: 700, color: C.rocket, stroke: false });
  text(ctx, `± ${r.sig.toFixed(1)} m de medición`, L, y + 176 * s, 19 * s, { weight: 600, stroke: false });
  text(ctx, `± ${r.sigDrift.toFixed(1)} m más si el viento lo acercó o alejó`, L, y + 200 * s, 15 * s, { color: C.dim, weight: 500, stroke: false });
  const rows = [
    ['Tiempo al apogeo', `${r.tApo.toFixed(2)} s`],
    ['Rapidez vertical máx.', r.vmax != null ? `${r.vmax.toFixed(1)} m/s` : '—'],
    ['Deriva lateral', r.latApo != null ? `${r.latApo.toFixed(1)} m` : '—'],
    ['Distancia a la rampa', `${o.d.toFixed(1)} m`],
  ];
  rows.forEach(([k, v], i) => {
    const yy = y + 240 * s + i * 32 * s;
    text(ctx, k, L, yy, 20 * s, { color: C.dim, weight: 500, stroke: false });
    text(ctx, v, x + cw - 30 * s, yy, 22 * s, { align: 'right', weight: 700, stroke: false });
  });
  if (o.end.chart && o.end.chart.length > 1) drawChart(ctx, L - 6 * s, y + 372 * s, cw - 48 * s, 170 * s, o.end.chart, { compact: true, scale: s, res: r });
}
