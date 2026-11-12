/* ===================================================================
   42-draw-meter.js — Multímetro digital realista (EM.dw.meter) y formato de lecturas
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM, DW = EM.dw;
  const TAU = Math.PI * 2;

  /* Posiciones del selector (grados desde la vertical, sentido horario) */
  const DIAL = [
    { mode: 'OFF', label: 'OFF', ang: 0 },
    { mode: 'V', label: 'V⎓', ang: 45 },
    { mode: 'A', label: 'A⎓', ang: 90 },
    { mode: 'R', label: 'Ω', ang: 135 },
    { mode: 'CONT', label: '•))', ang: 180 },
    { mode: 'DIODE', label: '▷|', ang: 225 },
    { mode: 'HZ', label: 'Hz', ang: 270 }
  ];
  DW.DIAL = DIAL;

  /* ---------- Formato del valor en pantalla (multímetro de 1999 cuentas con autorango) ---------- */
  DW.meterText = function (mt, res) {
    const out = { text: '', unit: '', over: false, tag: '', beep: false, note: null };
    if (!mt || mt.mode === 'OFF') return out;
    if (mt.blown && mt.mode === 'A') { out.text = '0.00'; out.unit = mt.jack === '10A' ? 'A' : 'mA'; out.note = 'Fusible quemado'; return out; }
    const jackBad = (mt.jack === '10A' && mt.mode !== 'A') || (mt.jack !== '10A' && false);
    if (jackBad) { out.text = '0.000'; out.unit = ''; out.note = 'El cable rojo está en 10 A'; return out; }
    if (!mt.red || !mt.black) { out.text = mt.mode === 'R' || mt.mode === 'CONT' ? 'OL' : mt.mode === 'DIODE' ? 'OL' : '0.000'; out.over = out.text === 'OL'; out.unit = mt.mode === 'V' ? 'V' : mt.mode === 'A' ? 'A' : mt.mode === 'R' || mt.mode === 'CONT' ? 'Ω' : mt.mode === 'DIODE' ? 'V' : ''; if (mt.mode === 'V') { out.text = '0.000'; } return out; }
    const v = res ? res.value : 0;
    const fmt = (x, decs) => x.toFixed(decs);
    if (mt.mode === 'V') {
      const a = Math.abs(v);
      out.tag = 'DC';
      if (a >= 200) { out.text = 'OL'; out.over = true; out.unit = 'V'; return out; }
      if (a < 0.2) { out.text = fmt(v * 1000, 1); out.unit = 'mV'; }
      else if (a < 2) { out.text = fmt(v, 3); out.unit = 'V'; }
      else if (a < 20) { out.text = fmt(v, 2); out.unit = 'V'; }
      else { out.text = fmt(v, 1); out.unit = 'V'; }
    } else if (mt.mode === 'A') {
      const a = Math.abs(v);
      out.tag = 'DC';
      if (mt.jack === '10A') { out.text = fmt(v, 2); out.unit = 'A'; if (a >= 10) { out.text = 'OL'; out.over = true; } }
      else {
        if (a >= 0.2) { out.text = 'OL'; out.over = true; out.unit = 'mA'; }
        else if (a < 0.02) { out.text = fmt(v * 1000, 2); out.unit = 'mA'; }
        else { out.text = fmt(v * 1000, 1); out.unit = 'mA'; }
      }
    } else if (mt.mode === 'R' || mt.mode === 'CONT') {
      const r = res ? res.value : Infinity;
      if (res && (res.open || !isFinite(r))) { out.text = 'OL'; out.over = true; out.unit = mt.mode === 'CONT' ? 'Ω' : 'Ω'; return out; }
      if (mt.mode === 'CONT') { out.text = fmt(Math.min(r, 1999), r < 200 ? 1 : 0); out.unit = 'Ω'; out.beep = res.beep; return out; }
      if (r < 200) { out.text = fmt(r, 1); out.unit = 'Ω'; }
      else if (r < 2000) { out.text = fmt(r, 0); out.unit = 'Ω'; }
      else if (r < 20000) { out.text = fmt(r / 1000, 3); out.unit = 'kΩ'; }
      else if (r < 200000) { out.text = fmt(r / 1000, 2); out.unit = 'kΩ'; }
      else if (r < 2e6) { out.text = fmt(r / 1000, 1); out.unit = 'kΩ'; }
      else if (r < 2e7) { out.text = fmt(r / 1e6, 3); out.unit = 'MΩ'; }
      else if (r < 2e8) { out.text = fmt(r / 1e6, 2); out.unit = 'MΩ'; }
      else { out.text = 'OL'; out.over = true; out.unit = 'MΩ'; }
      if (res && res.stray) out.note = 'Hay tensión en el circuito: apague antes de medir resistencia';
    } else if (mt.mode === 'DIODE') {
      if (res && res.open) { out.text = 'OL'; out.over = true; out.unit = 'V'; }
      else { out.text = fmt(v, 3); out.unit = 'V'; }
      out.tag = '▷|';
    } else if (mt.mode === 'HZ') {
      out.text = res && isFinite(res.value) ? fmt(res.value, res.value < 100 ? 2 : 0) : '0'; out.unit = 'Hz';
    }
    out.text = out.text.replace('-0.', '-0.');
    return out;
  };

  /* ---------- Dígitos de siete segmentos ---------- */
  const SEG = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', 'O': 'abcdef', 'L': 'def', ' ': '' };
  function digit(ctx, ch, x, y, w, h, on, off) {
    const t = w * 0.17, g = t * 0.25;
    const segs = {
      a: [[x + t, y], [x + w - t, y], [x + w - t * 1.5, y + t], [x + t * 1.5, y + t]],
      b: [[x + w, y + t * 0.8], [x + w, y + h / 2 - g], [x + w - t, y + h / 2 - t * 0.6], [x + w - t, y + t * 1.8]],
      c: [[x + w, y + h / 2 + g], [x + w, y + h - t * 0.8], [x + w - t, y + h - t * 1.8], [x + w - t, y + h / 2 + t * 0.6]],
      d: [[x + t, y + h], [x + w - t, y + h], [x + w - t * 1.5, y + h - t], [x + t * 1.5, y + h - t]],
      e: [[x, y + h / 2 + g], [x, y + h - t * 0.8], [x + t, y + h - t * 1.8], [x + t, y + h / 2 + t * 0.6]],
      f: [[x, y + t * 0.8], [x, y + h / 2 - g], [x + t, y + h / 2 - t * 0.6], [x + t, y + t * 1.8]],
      g: [[x + t * 0.8, y + h / 2], [x + t * 1.6, y + h / 2 - t * 0.6], [x + w - t * 1.6, y + h / 2 - t * 0.6], [x + w - t * 0.8, y + h / 2], [x + w - t * 1.6, y + h / 2 + t * 0.6], [x + t * 1.6, y + h / 2 + t * 0.6]]
    };
    const lit = SEG[ch] || '';
    for (const k of 'abcdefg') {
      ctx.fillStyle = lit.includes(k) ? on : off;
      ctx.beginPath(); segs[k].forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
    }
  }
  function lcdNumber(ctx, str, x, y, w, h, cell, on, off) {
    /* str puede tener punto decimal y signo menos; se alinea a la derecha en 4 celdas + signo */
    const chars = [];
    for (let i = 0; i < str.length; i++) { const c = str[i]; if (c === '.') { if (chars.length) chars[chars.length - 1].dot = true; } else chars.push({ c, dot: false }); }
    const total = 5; /* signo + 4 dígitos */
    let x0 = x + (total - chars.length) * cell;
    if (chars.length > total) { chars.splice(0, chars.length - total); x0 = x; }
    for (let i = 0; i < total; i++) digit(ctx, '8', x + i * cell, y, w, h, off, off);
    chars.forEach((q, i) => {
      const xx = x0 + i * cell;
      digit(ctx, q.c, xx, y, w, h, on, off);
      if (q.dot) { ctx.fillStyle = on; ctx.beginPath(); ctx.arc(xx + w + (cell - w) * 0.5, y + h - w * 0.07, w * 0.09, 0, TAU); ctx.fill(); }
    });
  }

  /* ---------- Dibujo del multímetro ---------- */
  /* mt: {id, mode, jack, red, black, at:[x,y], scale, redTip:[x,y], blackTip:[x,y]} ; res: lectura del banco */
  DW.meterLayout = function (mt) {
    const s = mt.scale || 0.6, [ax, ay] = mt.at;
    const P = (x, y) => [ax + x * s, ay + y * s];
    return {
      s, P,
      dial: P(36, 92), dialR: 21 * s,
      jacks: { A10: P(11, 143), V: P(36, 143), COM: P(61, 143) },
      lcd: [P(8, 12), P(64, 12), P(64, 58), P(8, 58)],
      w: 72 * s, h: 152 * s
    };
  };
  DW.meter = function (ctx, mt, res, v) {
    const L = DW.meterLayout(mt), s = L.s;
    const txt = DW.meterText(mt, res);
    ctx.save(); ctx.translate(mt.at[0], mt.at[1]); ctx.scale(s, s);
    /* carcasa */
    ctx.save(); DW.shadow(ctx, 3, 1, 2.2, 0.45);
    DW.rr(ctx, 0, 0, 72, 152, 7); ctx.fillStyle = DW.lin(ctx, 0, 0, 72, 152, [[0, '#2a2c31'], [1, '#141518']]); ctx.fill(); ctx.restore();
    DW.rr(ctx, 3.2, 3.2, 65.6, 145.6, 5); ctx.fillStyle = DW.lin(ctx, 0, 0, 0, 152, [[0, '#f6c021'], [1, '#e1a406']]); ctx.fill();
    /* pantalla */
    DW.rr(ctx, 7, 8, 58, 44, 2); ctx.fillStyle = '#1b1c20'; ctx.fill();
    DW.rr(ctx, 9, 10, 54, 40, 1.4); ctx.fillStyle = mt.mode === 'OFF' ? '#a9b59a' : DW.lin(ctx, 0, 10, 0, 50, [[0, '#cfdcb8'], [1, '#b9c9a0']]); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(9, 10, 54, 6);
    const on = '#14210f', off = 'rgba(20,33,15,0.07)';
    if (mt.mode !== 'OFF') {
      lcdNumber(ctx, txt.text || '', 12, 17, 8.2, 15.5, 9.6, on, off);
      DW.text(ctx, txt.unit, 60, 41, 5.4, on, { weight: 800, align: 'right' });
      if (txt.tag) DW.text(ctx, txt.tag, 12, 13.8, 3.8, on, { weight: 800, align: 'left' });
      if (mt.mode === 'CONT') DW.text(ctx, '•))', 28, 13.8, 4.2, on, { weight: 800, align: 'left' });
      if (txt.beep) { ctx.strokeStyle = on; ctx.lineWidth = 0.8; for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(51, 43, k * 2.2, -0.8, 0.8); ctx.stroke(); } }
      if (mt.blown) DW.text(ctx, 'FUSE', 12, 44, 3.8, on, { weight: 800, align: 'left' });
    }
    /* marcas del selector */
    const dc = [36, 92];
    ctx.save(); ctx.translate(dc[0], dc[1]);
    ctx.beginPath(); ctx.arc(0, 0, 32, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,.10)'; ctx.fill();
    for (const d of DW.DIAL) {
      const a = (d.ang - 0) * Math.PI / 180;
      const lx = Math.sin(a) * 28, ly = -Math.cos(a) * 28;
      ctx.strokeStyle = '#2a2c31'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(Math.sin(a) * 22.5, -Math.cos(a) * 22.5); ctx.lineTo(Math.sin(a) * 25, -Math.cos(a) * 25); ctx.stroke();
      DW.text(ctx, d.label, lx, ly, d.mode === 'OFF' ? 4.0 : 4.6, mt.mode === d.mode ? '#a2150c' : '#2a2c31', { weight: 800 });
    }
    /* perilla */
    ctx.save(); DW.shadow(ctx, 2, 0.4, 1.0, 0.5);
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fillStyle = DW.rad(ctx, -6, -8, 2, 22, [[0, '#4a4d54'], [1, '#17181b']]); ctx.fill(); ctx.restore();
    ctx.save(); const cur = DW.DIAL.find((d) => d.mode === mt.mode) || DW.DIAL[0];
    ctx.rotate(cur.ang * Math.PI / 180);
    ctx.fillStyle = '#d83a2b'; ctx.beginPath(); ctx.moveTo(-2.4, -2); ctx.lineTo(0, -19); ctx.lineTo(2.4, -2); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 0.7;
    for (let k = 0; k < 24; k++) { const a = k * TAU / 24; ctx.beginPath(); ctx.moveTo(Math.sin(a) * 17, Math.cos(a) * 17); ctx.lineTo(Math.sin(a) * 19.4, Math.cos(a) * 19.4); ctx.stroke(); }
    ctx.restore();
    /* conectores */
    const jack = (x, y, label, col, sel) => {
      ctx.beginPath(); ctx.arc(x, y, 5.2, 0, TAU); ctx.fillStyle = '#17181b'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 3.6, 0, TAU); ctx.fillStyle = DW.rad(ctx, x - 1, y - 1, 0.5, 4, [[0, '#e5e8ec'], [1, '#8a8f98']]); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 1.9, 0, TAU); ctx.fillStyle = '#25272c'; ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(x, y, 6.2, 0, TAU); ctx.stroke();
      DW.text(ctx, label, x, y - 9.6, 3.1, '#1d1e22', { weight: 800 });
    };
    jack(11, 141, '10A', '#d83a2b'); jack(36, 141, 'VΩmA', '#d83a2b'); jack(61, 141, 'COM', '#1d1e22');
    DW.text(ctx, 'MULTÍMETRO', 36, 62, 3.2, 'rgba(30,30,34,.7)', { weight: 800 });
    DW.text(ctx, 'CAT III 300V', 36, 131, 2.4, 'rgba(30,30,34,.5)', { weight: 700 });
    ctx.restore();

    /* cables y puntas */
    const redJ = mt.jack === '10A' ? L.jacks.A10 : L.jacks.V, blkJ = L.jacks.COM;
    const tip = (T, J, col, plugged) => {
      const dxs = T[0] - J[0];
      ctx.save();
      ctx.lineCap = 'round';
      const cx1 = J[0], cy1 = J[1] + 22, cx2 = T[0] + (dxs > 0 ? -10 : 10), cy2 = T[1] + 26;
      const path = () => { ctx.beginPath(); ctx.moveTo(J[0], J[1] + 2); ctx.bezierCurveTo(cx1, cy1, cx2, cy2, T[0], T[1] + 10); };
      ctx.strokeStyle = 'rgba(20,16,10,.25)'; ctx.lineWidth = 1.8; ctx.translate(0.5, 1); path(); ctx.stroke(); ctx.translate(-0.5, -1);
      ctx.strokeStyle = DW.mixc(col, '#000000', 0.35); ctx.lineWidth = 1.9; path(); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 1.4; path(); ctx.stroke();
      /* mango */
      ctx.translate(T[0], T[1]);
      ctx.save(); DW.shadow(ctx, 0.8, 0.3, 0.6, 0.4);
      ctx.beginPath(); ctx.moveTo(-1.3, 14); ctx.lineTo(-1.1, 4); ctx.lineTo(1.1, 4); ctx.lineTo(1.3, 14); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-0.9, 5, 0.35, 8);
      ctx.fillStyle = '#c9ccd2'; ctx.fillRect(-0.45, 0, 0.9, 4.4); ctx.fillStyle = '#eef0f3'; ctx.fillRect(-0.15, 0, 0.3, 4.4);
      if (plugged) { ctx.strokeStyle = 'rgba(255,200,40,.95)'; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.arc(0, 0, 1.7, 0, TAU); ctx.stroke(); }
      ctx.restore();
    };
    tip(mt.blackTip, blkJ, '#1d1e22', !!mt.black);
    tip(mt.redTip, redJ, '#d83a2b', !!mt.red);
    v.hit.push({ kind: 'dial', id: mt.id, x: L.dial[0], y: L.dial[1], r: 24 * s });
    v.hit.push({ kind: 'probe', which: 'red', id: mt.id, x: mt.redTip[0], y: mt.redTip[1] + 5, r: 5 });
    v.hit.push({ kind: 'probe', which: 'black', id: mt.id, x: mt.blackTip[0], y: mt.blackTip[1] + 5, r: 5 });
    v.hit.push({ kind: 'jack', id: mt.id, x: redJ[0], y: redJ[1], r: 7 * s * 1.5 });
    return txt;
  };
})();
