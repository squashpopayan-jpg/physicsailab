/* ===================================================================
   40-draw.js — Dibujo realista (EM.dw): protoboard, placas y utilidades.
   Todo se dibuja en milímetros con una transformación de lienzo (escala px/mm).
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  const BB = EM.bb;
  const DW = (EM.dw = {});

  /* ---------- utilidades ---------- */
  DW.rr = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  DW.lin = function (ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  };
  DW.rad = function (ctx, x, y, r0, r1, stops) {
    const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  };
  DW.shadow = function (ctx, blur = 1.2, dx = 0.4, dy = 0.7, a = 0.28) {
    ctx.shadowColor = `rgba(20,16,10,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetX = dx; ctx.shadowOffsetY = dy;
  };
  DW.noShadow = function (ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; };
  DW.text = function (ctx, s, x, y, size, color, o = {}) {
    ctx.save();
    ctx.font = `${o.weight || 600} ${size}px ${o.mono ? EM.FONT_MONO : EM.FONT_UI}`;
    ctx.fillStyle = color; ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
    if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); ctx.fillText(s, 0, 0); } else ctx.fillText(s, x, y);
    ctx.restore();
  };
  DW.hex2rgb = function (h) { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
  DW.mixc = function (a, b, t) { const A = DW.hex2rgb(a), B = DW.hex2rgb(b); return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`; };
  DW.rgba = function (h, a) { const c = DW.hex2rgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  DW.METAL = '#b9bdc4';

  /* pata de metal desde (x0,y0) hasta (x1,y1) */
  DW.lead = function (ctx, x0, y0, x1, y1, w = 0.5) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(30,25,15,.35)'; ctx.lineWidth = w + 0.35;
    ctx.beginPath(); ctx.moveTo(x0 + 0.2, y0 + 0.3); ctx.lineTo(x1 + 0.2, y1 + 0.3); ctx.stroke();
    ctx.strokeStyle = '#a7abb3'; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = '#e4e7ec'; ctx.lineWidth = w * 0.35;
    ctx.beginPath(); ctx.moveTo(x0 - w * 0.12, y0 - w * 0.12); ctx.lineTo(x1 - w * 0.12, y1 - w * 0.12); ctx.stroke();
    ctx.restore();
  };

  /* ---------- Protoboard ---------- */
  const boardCache = new Map();
  /* La protoboard base (cuerpo, agujeros, serigrafía) se dibuja una vez por escala en un lienzo aparte. */
  DW.boardBitmap = function (kind, scale, dpr) {
    const key = kind + '|' + scale.toFixed(2) + '|' + dpr;
    if (boardCache.has(key)) return boardCache.get(key);
    const k = BB.KINDS[kind], pad = 3;
    const W = Math.ceil((k.w + pad * 2) * scale * dpr), H = Math.ceil((k.h + pad * 2) * scale * dpr);
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.scale(scale * dpr, scale * dpr); ctx.translate(pad, pad);
    drawBoardBase(ctx, kind);
    const o = { cv, pad, w: k.w + pad * 2, h: k.h + pad * 2 };
    if (boardCache.size > 12) boardCache.clear();
    boardCache.set(key, o);
    return o;
  };
  function drawBoardBase(ctx, kind) {
    const k = BB.KINDS[kind], Y = BB.ROW_Y;
    ctx.save();
    DW.shadow(ctx, 2.2, 0.5, 1.1, 0.34);
    DW.rr(ctx, 0, 0, k.w, k.h, 1.6);
    ctx.fillStyle = DW.lin(ctx, 0, 0, k.w, k.h, [[0, '#f7f4ea'], [1, '#e6e1d1']]);
    ctx.fill();
    DW.noShadow(ctx);
    ctx.lineWidth = 0.25; ctx.strokeStyle = '#bfb9a6'; ctx.stroke();
    /* canal central */
    const cy0 = Y.f + 1.55, cy1 = Y.e - 1.55;
    ctx.fillStyle = DW.lin(ctx, 0, cy0, 0, cy1, [[0, '#cfc9b6'], [0.5, '#dbd6c5'], [1, '#cdc7b4']]);
    ctx.fillRect(1.6, cy0, k.w - 3.2, cy1 - cy0);
    ctx.fillStyle = 'rgba(80,70,50,.18)'; ctx.fillRect(1.6, cy0, k.w - 3.2, 0.35); ctx.fillRect(1.6, cy1 - 0.3, k.w - 3.2, 0.3);
    /* líneas de rieles */
    if (k.rail) {
      const x0 = BB.holePos(kind, 'T+1')[0] - 2, x1 = BB.holePos(kind, 'T+' + k.rail)[0] + 2;
      ctx.lineWidth = 0.34; ctx.lineCap = 'round';
      const ln = (y, c) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); };
      ln(Y['T+'] - 1.7, '#d63a30'); ln(Y['T-'] + 1.7, '#2a61c9'); ln(Y['B-'] - 1.7, '#2a61c9'); ln(Y['B+'] + 1.7, '#d63a30');
      const sg = (s, x, y, c) => DW.text(ctx, s, x, y, 2.2, c, { weight: 800 });
      sg('+', x0 - 1.2, Y['T+'], '#d63a30'); sg('−', x0 - 1.2, Y['T-'], '#2a61c9'); sg('−', x0 - 1.2, Y['B-'], '#2a61c9'); sg('+', x0 - 1.2, Y['B+'], '#d63a30');
      sg('+', x1 + 1.2, Y['T+'], '#d63a30'); sg('−', x1 + 1.2, Y['T-'], '#2a61c9'); sg('−', x1 + 1.2, Y['B-'], '#2a61c9'); sg('+', x1 + 1.2, Y['B+'], '#d63a30');
    }
    /* agujeros */
    const hole = (x, y) => {
      ctx.fillStyle = '#6d6a5b'; DW.rr(ctx, x - 0.62, y - 0.62, 1.24, 1.24, 0.22); ctx.fill();
      ctx.fillStyle = '#1d1c19'; DW.rr(ctx, x - 0.5, y - 0.5, 1.0, 1.0, 0.18); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x - 0.45, y + 0.28, 0.9, 0.12);
    };
    for (const h of BB.allHoles(kind)) { const [x, y] = BB.holePos(kind, h); hole(x, y); }
    /* serigrafía: números de columna y letras de fila */
    const gray = '#8f897a';
    for (let c = 1; c <= k.cols; c++) if (c === 1 || c % 5 === 0) {
      const [x] = BB.holePos(kind, 'a' + c);
      DW.text(ctx, String(c), x, Y.j - 2.45, 1.75, gray, { weight: 700 });
      DW.text(ctx, String(c), x, Y.a + 2.45, 1.75, gray, { weight: 700 });
    }
    for (const r of ['j', 'i', 'h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']) {
      const [x] = BB.holePos(kind, r + '1');
      DW.text(ctx, r, x - 3.0, Y[r], 1.75, gray, { weight: 700 });
      const [x2] = BB.holePos(kind, r + k.cols);
      DW.text(ctx, r, x2 + 3.0, Y[r], 1.75, gray, { weight: 700 });
    }
    ctx.restore();
  }

  /* Dibuja la protoboard en la posición (x, y). Si el contexto está escalado se usa el mapa de bits. */
  DW.board = function (ctx, b, view) {
    const bm = DW.boardBitmap(b.kind, view.scale, view.dpr);
    ctx.save();
    ctx.drawImage(bm.cv, b.x - bm.pad, b.y - bm.pad, bm.w, bm.h);
    ctx.restore();
  };
  /* Resalta una tira (columna o riel) */
  DW.hiliteStrip = function (ctx, b, hole, color = 'rgba(255,170,0,.35)') {
    const p = BB.parse(hole), kind = b.kind, k = BB.KINDS[kind], Y = BB.ROW_Y;
    ctx.save(); ctx.translate(b.x, b.y);
    ctx.fillStyle = color;
    if (p.kind === 'main') {
      const [x] = BB.holePos(kind, 'a' + p.col);
      const top = ['j', 'i', 'h', 'g', 'f'].includes(p.row);
      const y0 = top ? Y.j - 1.4 : Y.e - 1.4, y1 = top ? Y.f + 1.4 : Y.a + 1.4;
      DW.rr(ctx, x - 1.35, y0, 2.7, y1 - y0, 0.8); ctx.fill();
    } else {
      const x0 = BB.holePos(kind, p.side + p.pol + '1')[0], x1 = BB.holePos(kind, p.side + p.pol + k.rail)[0], y = Y[p.side + p.pol];
      DW.rr(ctx, x0 - 1.4, y - 1.4, x1 - x0 + 2.8, 2.8, 0.9); ctx.fill();
    }
    ctx.restore();
  };

  /* ---------- Placas ---------- */
  const led = (ctx, x, y, color, on, label) => {
    ctx.fillStyle = on ? color : DW.mixc(color, '#2a2a2a', 0.75);
    ctx.fillRect(x - 0.9, y - 0.5, 1.8, 1.0);
    if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = DW.rad(ctx, x, y, 0, 3.4, [[0, DW.rgba(color, 0.65)], [1, DW.rgba(color, 0)]]); ctx.beginPath(); ctx.arc(x, y, 3.4, 0, 6.3); ctx.fill(); ctx.restore(); }
    if (label) DW.text(ctx, label, x, y + 2.0, 1.5, 'rgba(255,255,255,.85)', { weight: 600 });
  };
  const header = (ctx, x, y, n, vertical) => {
    ctx.fillStyle = '#17171a'; DW.rr(ctx, x - 1.27, y - 1.27, n * 2.54, 2.54, 0.2); ctx.fill();
    for (let i = 0; i < n; i++) {
      const cx = x + 1.27 + i * 2.54 - 0 , cy = y;
      ctx.fillStyle = '#d6ae42'; ctx.fillRect(cx - 1.27 + 0.65, cy - 0.5, 1.0, 1.0);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(cx - 1.27 + 0.65, cy - 0.5, 0.35, 0.35);
    }
  };

  DW.mcu = function (ctx, m, bench, mcu, t) {
    const spec = EM.mcu.boards[m.kind];
    ctx.save();
    ctx.translate(m.x, m.y);
    const r = ((m.rot || 0) % 360 + 360) % 360;
    if (r === 90) { ctx.translate(spec.h, 0); ctx.rotate(Math.PI / 2); } else if (r === 180) { ctx.translate(spec.w, spec.h); ctx.rotate(Math.PI); } else if (r === 270) { ctx.translate(0, spec.w); ctx.rotate(-Math.PI / 2); }
    if (m.kind === 'uno') drawUno(ctx, spec, m, bench, mcu, t);
    else if (m.kind === 'nano') drawNano(ctx, spec, m, bench, mcu, t);
    else drawEsp(ctx, spec, m, bench, mcu, t);
    ctx.restore();
  };
  const pinLevel = (bench, m, id) => {
    try { return bench.v(m.id + ':' + id); } catch (e) { return 0; }
  };
  function drawUno(ctx, spec, m, bench, mcu, t) {
    const W = spec.w, H = spec.h;
    const powered = bench.mcuInfo[m.id] && bench.mcuInfo[m.id].powered;
    /* conectores */
    ctx.save(); DW.shadow(ctx, 2.4, 0.6, 1.2, 0.4);
    DW.rr(ctx, 0, 0, W, H, 1.8);
    ctx.fillStyle = DW.lin(ctx, 0, 0, W, H, [[0, '#0f8b94'], [1, '#096c75']]); ctx.fill();
    DW.noShadow(ctx);
    ctx.strokeStyle = '#06545b'; ctx.lineWidth = 0.3; ctx.stroke();
    ctx.restore();
    /* ranuras de montaje */
    for (const [x, y] of [[14, 2.5], [15.3, 50.7], [66.1, 7.6], [66.1, 35.5]]) { ctx.fillStyle = '#d9dde0'; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 6.3); ctx.fill(); ctx.fillStyle = '#334'; ctx.beginPath(); ctx.arc(x, y, 1.05, 0, 6.3); ctx.fill(); }
    /* USB-B */
    ctx.fillStyle = DW.lin(ctx, 0, 0, 0, 12, [[0, '#e3e6ea'], [0.5, '#b9bec6'], [1, '#d3d7dc']]);
    DW.rr(ctx, -5.8, 6.0, 16.2, 12.2, 0.5); ctx.fill(); ctx.strokeStyle = '#8e939b'; ctx.lineWidth = 0.25; ctx.stroke();
    ctx.fillStyle = '#2b2d31'; ctx.fillRect(-5.8, 8.6, 1.4, 7);
    /* jack */
    ctx.fillStyle = DW.lin(ctx, 0, 0, 0, 9, [[0, '#2d2f33'], [1, '#101114']]);
    DW.rr(ctx, -2.0, 32.5, 14.2, 9.2, 0.6); ctx.fill();
    ctx.fillStyle = '#05060a'; DW.rr(ctx, -2.0, 35.6, 6, 3.2, 0.4); ctx.fill();
    /* regulador y condensadores */
    ctx.fillStyle = '#26282c'; DW.rr(ctx, 14, 33.5, 4.2, 4.2, 0.4); ctx.fill();
    ctx.fillStyle = DW.lin(ctx, 0, 0, 0, 6, [[0, '#d6d9dd'], [1, '#989da6']]); ctx.beginPath(); ctx.arc(14.8, 28.0, 2.3, 0, 6.3); ctx.fill(); ctx.beginPath(); ctx.arc(14.8, 44.6, 2.3, 0, 6.3); ctx.fill();
    /* botón de reinicio */
    ctx.fillStyle = '#d8dce0'; DW.rr(ctx, 6.4, 22, 6, 6, 0.8); ctx.fill(); ctx.fillStyle = '#c8362d'; ctx.beginPath(); ctx.arc(9.4, 25, 1.9, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#e9ecef'; ctx.beginPath(); ctx.arc(8.9, 24.4, 0.6, 0, 6.3); ctx.fill();
    /* microcontrolador y cristal */
    ctx.fillStyle = DW.lin(ctx, 0, 24, 0, 33, [[0, '#2b2d32'], [1, '#121316']]);
    DW.rr(ctx, 26, 29.0, 36.5, 9.0, 0.7); ctx.fill();
    ctx.fillStyle = '#0d0e10'; for (let i = 0; i < 14; i++) { ctx.fillRect(27.4 + i * 2.54, 27.8, 0.9, 1.2); ctx.fillRect(27.4 + i * 2.54, 38, 0.9, 1.2); }
    DW.text(ctx, 'ATMEGA328P-PU', 44.3, 33.4, 2.0, 'rgba(230,230,230,.7)', { weight: 600 });
    ctx.fillStyle = '#b9bdc2'; DW.rr(ctx, 21.0, 24.2, 6.8, 3.2, 1.6); ctx.fill(); DW.text(ctx, '16.000', 24.4, 25.8, 1.4, '#555', { weight: 600 });
    /* cabeceras */
    header(ctx, 17.78 - 1.27, 2.8, 10, true); header(ctx, 47.24 - 1.27, 2.8, 8, true);
    header(ctx, 26.67 - 1.27, 50.6, 8, true); header(ctx, 49.53 - 1.27, 50.6, 6, true);
    /* rótulos */
    const wh = 'rgba(255,255,255,.92)';
    const labs = [['SCL', 17.78], ['SDA', 20.32], ['REF', 22.86], ['GND', 25.4], ['13', 27.94], ['12', 30.48], ['~11', 33.02], ['~10', 35.56], ['~9', 38.1], ['8', 40.64], ['7', 47.24], ['~6', 49.78], ['~5', 52.32], ['4', 54.86], ['~3', 57.4], ['2', 59.94], ['TX1', 62.48], ['RX0', 65.02]];
    for (const [s, x] of labs) DW.text(ctx, s, x, 6.5, 1.2, wh, { weight: 700 });
    const lb = [['IOR', 28.9], ['RST', 31.4], ['3V3', 34.0], ['5V', 36.5], ['GND', 39.0], ['GND', 41.6], ['VIN', 44.1], ['A0', 49.53], ['A1', 52.07], ['A2', 54.61], ['A3', 57.15], ['A4', 59.69], ['A5', 62.23]];
    for (const [s, x] of lb) DW.text(ctx, s, x, 46.4, 1.2, wh, { weight: 700 });
    DW.text(ctx, 'DIGITAL (PWM~)', 42, 10.2, 1.4, 'rgba(255,255,255,.7)', { weight: 600 });
    DW.text(ctx, 'ANALOG IN', 55.8, 43.6, 1.3, 'rgba(255,255,255,.7)', { weight: 600 });
    DW.text(ctx, 'POWER', 35.5, 43.6, 1.3, 'rgba(255,255,255,.7)', { weight: 600 });
    DW.text(ctx, 'UNO', 49.5, 20.4, 5.2, 'rgba(255,255,255,.95)', { weight: 800 });
    DW.text(ctx, 'R3 · compatible', 49.5, 24.2, 1.5, 'rgba(255,255,255,.7)', { weight: 600 });
    /* LEDs: ON, L(D13), TX, RX */
    const d13 = mcu ? (bench.v(m.id + ':D13') > 2) : false;
    led(ctx, 56.8, 14.3, '#35ff6a', !!powered, 'ON'); led(ctx, 56.8, 9.3, '#ffb020', d13, 'L');
    const tx = mcu && mcu.txBytes && ((Math.floor(t * 12) % 2) === 0) && mcu.lastTx > t - 0.15;
    led(ctx, 51.4, 14.3, '#ffcf3a', !!tx, 'TX');
    led(ctx, 51.4, 9.3, '#ffcf3a', false, 'RX');
  }
  function drawNano(ctx, spec, m, bench, mcu, t) {
    const W = spec.w, H = spec.h;
    ctx.save(); DW.shadow(ctx, 1.6, 0.4, 0.8, 0.4);
    DW.rr(ctx, 0, 0, W, H, 1.2); ctx.fillStyle = DW.lin(ctx, 0, 0, W, H, [[0, '#1496a0'], [1, '#0a7077']]); ctx.fill(); DW.noShadow(ctx);
    ctx.strokeStyle = '#06545b'; ctx.lineWidth = 0.25; ctx.stroke(); ctx.restore();
    ctx.fillStyle = DW.lin(ctx, 0, 0, 0, 8, [[0, '#dadde1'], [1, '#aeb3ba']]); DW.rr(ctx, -2.8, 5.4, 9.5, 7.6, 0.4); ctx.fill();
    ctx.fillStyle = '#16171a'; DW.rr(ctx, 14, 5, 9.0, 9.0, 0.4); ctx.fill(); DW.text(ctx, 'ATmega', 18.5, 8.6, 1.5, 'rgba(230,230,230,.7)', { weight: 600 }); DW.text(ctx, '328P', 18.5, 11, 1.5, 'rgba(230,230,230,.7)', { weight: 600 });
    ctx.fillStyle = '#16171a'; DW.rr(ctx, 25.5, 6.2, 4.5, 4.5, 0.4); ctx.fill();
    ctx.fillStyle = '#c8362d'; ctx.beginPath(); ctx.arc(34.5, 9.2, 1.7, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#17171a'; DW.rr(ctx, 6.7, 0.5, 15 * 2.54 + 0.6, 2.8, 0.2); ctx.fill(); DW.rr(ctx, 6.7, 15.6, 15 * 2.54 + 0.6, 2.8, 0.2); ctx.fill();
    for (const p of spec.pins) { ctx.fillStyle = '#d6ae42'; ctx.fillRect(p.x - 0.5, p.y - 0.5, 1, 1); }
    spec.pins.forEach((p) => { if (p.label) DW.text(ctx, p.label.replace('RESET2', 'RST'), p.x, p.row === 0 ? 4.6 : 14.2, 1.15, 'rgba(255,255,255,.9)', { weight: 700 }); });
    DW.text(ctx, 'NANO', 36, 13.8, 2.8, 'rgba(255,255,255,.9)', { weight: 800 });
    const powered = bench.mcuInfo[m.id] && bench.mcuInfo[m.id].powered;
    led(ctx, 40.8, 9.6, '#35ff6a', !!powered); led(ctx, 40.8, 7.0, '#ffb020', mcu ? bench.v(m.id + ':D13') > 2 : false);
  }
  function drawEsp(ctx, spec, m, bench, mcu, t) {
    const W = spec.w, H = spec.h;
    const powered = bench.mcuInfo[m.id] && bench.mcuInfo[m.id].powered;
    ctx.save(); DW.shadow(ctx, 2, 0.5, 1, 0.4);
    DW.rr(ctx, 0, 0, W, H, 1.2); ctx.fillStyle = DW.lin(ctx, 0, 0, W, H, [[0, '#23262c'], [1, '#111317']]); ctx.fill(); DW.noShadow(ctx);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 0.25; ctx.stroke(); ctx.restore();
    /* micro-USB */
    ctx.fillStyle = DW.lin(ctx, 0, 9, 0, 19, [[0, '#d9dce0'], [1, '#a2a7af']]); DW.rr(ctx, -1.8, 9.2, 7.6, 9.4, 0.5); ctx.fill(); ctx.fillStyle = '#2a2c30'; ctx.fillRect(-1.8, 11.4, 1.1, 5.0);
    /* CP2102, regulador, botones */
    ctx.fillStyle = '#1a1b1e'; DW.rr(ctx, 9, 7.4, 4.6, 4.6, 0.3); ctx.fill(); DW.rr(ctx, 9.8, 16.4, 5.4, 3.4, 0.3); ctx.fill();
    ctx.fillStyle = '#c9ccd0'; DW.rr(ctx, 16.6, 6.5, 4.6, 3.6, 0.5); ctx.fill(); DW.rr(ctx, 16.6, 18.2, 4.6, 3.6, 0.5); ctx.fill();
    ctx.fillStyle = '#16181c'; ctx.beginPath(); ctx.arc(18.9, 8.3, 1.2, 0, 6.3); ctx.fill(); ctx.beginPath(); ctx.arc(18.9, 20.0, 1.2, 0, 6.3); ctx.fill();
    DW.text(ctx, 'EN', 18.9, 11.5, 1.2, 'rgba(255,255,255,.7)', { weight: 600 }); DW.text(ctx, 'BOOT', 18.9, 23.3, 1.2, 'rgba(255,255,255,.7)', { weight: 600 });
    /* módulo ESP-WROOM-32 */
    ctx.fillStyle = DW.lin(ctx, 0, 0, 0, 20, [[0, '#d4d8dd'], [0.5, '#bcc1c8'], [1, '#aeb3bb']]); DW.rr(ctx, 25.5, 4.6, 18.5, 19.2, 0.5); ctx.fill();
    ctx.strokeStyle = '#8e939b'; ctx.lineWidth = 0.2; ctx.stroke();
    DW.text(ctx, 'ESP-WROOM-32', 34.8, 12.5, 1.9, '#2a2d33', { weight: 700 });
    DW.text(ctx, '2.4 GHz WiFi + BT', 34.8, 15.4, 1.4, '#555a63', { weight: 600 });
    /* antena impresa */
    ctx.fillStyle = '#1b1d22'; ctx.fillRect(44, 4.6, 6.2, 19.2);
    ctx.strokeStyle = '#d3a73c'; ctx.lineWidth = 0.35; ctx.beginPath();
    let ax = 45, ay = 6.3; ctx.moveTo(ax, ay);
    for (let i = 0; i < 7; i++) { ctx.lineTo(ax + 3.8, ay); ay += 2.4; ctx.lineTo(ax + 3.8, ay); ctx.lineTo(ax, ay); ay += 2.4; ctx.lineTo(ax, ay); }
    ctx.stroke();
    /* cabeceras y rótulos */
    for (const row of [0, 1]) { const y = row === 0 ? 2.7 : 25.6; ctx.fillStyle = '#16171a'; DW.rr(ctx, 6.9, y - 1.3, 15 * 2.54, 2.6, 0.2); ctx.fill(); }
    for (const p of spec.pins) { ctx.fillStyle = '#d6ae42'; ctx.fillRect(p.x - 0.5, p.y - 0.5, 1, 1); }
    for (const p of spec.pins) DW.text(ctx, p.label, p.x, p.row === 0 ? 5.6 : 22.7, 1.28, 'rgba(255,255,255,.92)', { weight: 700, rot: 0 });
    DW.text(ctx, 'ESP32', 11, 14.3, 2.6, 'rgba(255,255,255,.85)', { weight: 800 });
    led(ctx, 23.2, 14.3, '#ff3b3b', !!powered); const lg = mcu ? bench.v(m.id + ':G2') > 1.6 : false; led(ctx, 23.2, 11.3, '#3b8bff', lg);
  }

  /* ---------- Cable (jumper) ---------- */
  DW.WIRE_COLORS = ['#d73a31', '#1e1e22', '#e8b50f', '#2a8f3d', '#2a62d4', '#e9772a', '#8d45c8', '#f1f1ee', '#7a4a21', '#8a8f98'];
  DW.wire = function (ctx, a, b, color, o = {}) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    const lift = Math.min(10, 2 + L * 0.28) * (o.lift === undefined ? 1 : o.lift);
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const nx = -dy / (L || 1), ny = dx / (L || 1);
    const sgn = o.side || (ny < 0 ? 1 : -1);
    const cx = mx + nx * lift * (ny < 0 ? 1 : -1) * 0 + 0, cy = my - lift;
    const c1x = a[0] + dx * 0.15, c1y = a[1] - lift * 1.1, c2x = b[0] - dx * 0.15, c2y = b[1] - lift * 1.1;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.bezierCurveTo(c1x, c1y, c2x, c2y, b[0], b[1]); };
    if (!o.noShadow) { ctx.strokeStyle = 'rgba(25,20,10,.28)'; ctx.lineWidth = 1.5; ctx.translate(0.5, 0.9); path(); ctx.stroke(); ctx.translate(-0.5, -0.9); }
    ctx.strokeStyle = DW.mixc(color, '#000000', 0.38); ctx.lineWidth = 1.5; path(); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = 1.15; path(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.42)'; ctx.lineWidth = 0.32; ctx.translate(-0.2, -0.28); path(); ctx.stroke(); ctx.translate(0.2, 0.28);
    /* plugs */
    for (const p of [a, b]) {
      ctx.fillStyle = DW.mixc(color, '#000000', 0.2); ctx.beginPath(); ctx.arc(p[0], p[1], 0.95, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#c9cdd3'; ctx.beginPath(); ctx.arc(p[0], p[1], 0.52, 0, 6.3); ctx.fill();
    }
    ctx.restore();
    /* punto medio para animación de corriente */
    return { path, a, b, c1: [c1x, c1y], c2: [c2x, c2y] };
  };
  DW.bez = function (w, t) {
    const u = 1 - t;
    return [u * u * u * w.a[0] + 3 * u * u * t * w.c1[0] + 3 * u * t * t * w.c2[0] + t * t * t * w.b[0], u * u * u * w.a[1] + 3 * u * u * t * w.c1[1] + 3 * u * t * t * w.c2[1] + t * t * t * w.b[1]];
  };
})();
