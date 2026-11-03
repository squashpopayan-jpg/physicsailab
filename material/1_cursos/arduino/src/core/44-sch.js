/* ===================================================================
   44-sch.js — Vista de esquema (EM.dw.sch): símbolos normalizados, cables, uniones y corriente animada.
   Se dibuja a partir de scene.sch = { w, h, parts:{id:{at:[x,y], rot, flip, label}}, wires:[[ 'R1.0', [x,y], 'D1.1' ], ...],
   gnd:[[x,y]], texts:[{at:[x,y], text, color}], boxes:{id:{at, w, h, pins:{indice:[dx,dy]}}} } en unidades de rejilla (U mm).
   Terminales: «R1.0» = pin 0 de R1.
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM, DW = EM.dw, PT = EM.parts, BB = EM.bb;
  const TAU = Math.PI * 2;
  const U = 6; /* mm por unidad de rejilla */
  const SCH = (DW.sch = { U });

  /* Terminales locales (unidades): 2 terminales en (−2,0) y (2,0) */
  const T2 = [[-2, 0], [2, 0]];
  const TERM = {
    BJT: [[2, -2], [-2, 0], [2, 2]], NMOS: [[-2, 0], [2, -2], [2, 2]], POT: [[-2, 0], [0, -2], [2, 0]],
    BTN: [[-2, 0], null, [2, 0], null]
  };
  SCH.symbol = (ctx, p, cx, cy, scale) => { const f = SYM[p.type]; if (!f) return; ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.strokeStyle = EM.col('--ink'); ctx.fillStyle = EM.col('--ink'); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; f(ctx, p); ctx.restore(); };
  SCH.termLocal = (p, k) => (TERM[p.type] ? TERM[p.type][k] : T2[k]);

  function xf(s, loc) { /* local → rejilla (aplica volteo y giro) */
    let [x, y] = loc;
    if (s.flip) y = -y;
    const a = ((s.rot || 0) % 360) * Math.PI / 180, c = Math.round(Math.cos(a)), sn = Math.round(Math.sin(a));
    return [s.at[0] + x * c - y * sn, s.at[1] + x * sn + y * c];
  }
  SCH.termPos = function (scene, id, k) { /* en mm */
    const s = scene.sch;
    const p = scene.parts.find((q) => q.id === id);
    if (s.boxes && s.boxes[id]) { const b = s.boxes[id]; const o = b.pins[k]; if (!o) return null; return [(b.at[0] + o[0]) * U, (b.at[1] + o[1]) * U]; }
    if (!p || !s.parts[id]) return null;
    const loc = SCH.termLocal(p, k);
    if (!loc) return null;
    const q = xf(s.parts[id], loc);
    return [q[0] * U, q[1] * U];
  };

  /* ---------- símbolos ---------- */
  const lw = 0.5;
  const line = (ctx, ...pts) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); };
  const SYM = {};
  const stub = (ctx, from, to) => line(ctx, [from * U, 0], [to * U, 0]);
  SYM.R = (ctx, p) => { stub(ctx, -2, -1); stub(ctx, 1, 2); ctx.beginPath(); ctx.moveTo(-1 * U, 0); [[-0.75, -0.55], [-0.25, 0.55], [0.25, -0.55], [0.75, 0.55]].forEach(([x, y]) => ctx.lineTo(x * U, y * U)); ctx.lineTo(U, 0); ctx.stroke(); };
  SYM.POT = (ctx, p) => { SYM.R(ctx, p); const pos = PT.val(p, 'pos'); const x = (-1 + 2 * pos) * U; ctx.beginPath(); ctx.moveTo(0, -2 * U); ctx.lineTo(0, -1.1 * U); ctx.stroke(); line(ctx, [0, -0.8 * U], [0, -0.15 * U]); arrow(ctx, 0, -0.1 * U, 0, -0.9 * U, true); };
  SYM.LDR = (ctx, p) => { SYM.R(ctx, p); ctx.beginPath(); ctx.arc(0, 0, 1.45 * U, 0, TAU); ctx.stroke(); arrow(ctx, -1.8 * U, -1.9 * U, -0.9 * U, -0.9 * U); arrow(ctx, -0.9 * U, -2.1 * U, 0, -1.1 * U); };
  SYM.NTC = (ctx, p) => { SYM.R(ctx, p); line(ctx, [-1.2 * U, 1.3 * U], [1.4 * U, -1.3 * U]); ctx.fillStyle = ctx.strokeStyle; DW.text(ctx, '−t°', 0, 1.5 * U, 0.7 * U, ctx.strokeStyle, { weight: 700 }); };
  SYM.C = (ctx, p) => { stub(ctx, -2, -0.3); stub(ctx, 0.3, 2); line(ctx, [-0.3 * U, -1 * U], [-0.3 * U, 1 * U]); line(ctx, [0.3 * U, -1 * U], [0.3 * U, 1 * U]); };
  SYM.ECAP = (ctx, p) => { stub(ctx, -2, -0.3); stub(ctx, 0.3, 2); line(ctx, [-0.3 * U, -1 * U], [-0.3 * U, 1 * U]); ctx.beginPath(); ctx.arc(1.35 * U, 0, 1.05 * U, Math.PI * 0.62, Math.PI * 1.38); ctx.stroke(); DW.text(ctx, '+', -1.0 * U, -0.9 * U, 0.9 * U, ctx.strokeStyle, { weight: 800 }); };
  SYM.L = (ctx, p) => { stub(ctx, -2, -1.5); stub(ctx, 1.5, 2); ctx.beginPath(); for (let k = 0; k < 3; k++) ctx.arc((-1 + k) * U, 0, 0.5 * U, Math.PI, 0); ctx.stroke(); };
  SYM.LED = (ctx, p) => {
    stub(ctx, -2, -0.8); stub(ctx, 0.8, 2);
    ctx.beginPath(); ctx.moveTo(-0.8 * U, -0.9 * U); ctx.lineTo(-0.8 * U, 0.9 * U); ctx.lineTo(0.8 * U, 0); ctx.closePath(); ctx.stroke();
    line(ctx, [0.8 * U, -0.9 * U], [0.8 * U, 0.9 * U]);
    if (p.type === 'LED') { arrow(ctx, -0.1 * U, -1.2 * U, 0.7 * U, -2.0 * U); arrow(ctx, 0.5 * U, -0.9 * U, 1.3 * U, -1.7 * U); }
  };
  SYM.D = SYM.LED;
  SYM.ZENER = (ctx, p) => { SYM.LED(ctx, p); line(ctx, [0.8 * U, -0.9 * U], [1.1 * U, -1.15 * U]); line(ctx, [0.8 * U, 0.9 * U], [0.5 * U, 1.15 * U]); };
  SYM.BAT = (ctx, p) => { stub(ctx, -2, -0.35); stub(ctx, 0.35, 2); line(ctx, [-0.35 * U, -1.1 * U], [-0.35 * U, 1.1 * U]); line(ctx, [0.35 * U, -0.6 * U], [0.35 * U, 0.6 * U]); ctx.lineWidth = lw * 2.2; line(ctx, [0.35 * U, -0.6 * U], [0.35 * U, 0.6 * U]); ctx.lineWidth = lw; DW.text(ctx, '+', -0.95 * U, -1.05 * U, 0.9 * U, ctx.strokeStyle, { weight: 800 }); };
  SYM.USB = SYM.BAT; SYM.LAB = (ctx, p) => { SYM.BAT(ctx, p); };
  SYM.SIGGEN = (ctx, p) => { stub(ctx, -2, -1.1); stub(ctx, 1.1, 2); ctx.beginPath(); ctx.arc(0, 0, 1.1 * U, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-0.6 * U, 0); ctx.bezierCurveTo(-0.3 * U, -0.8 * U, 0.1 * U, -0.8 * U, 0, 0); ctx.bezierCurveTo(-0.1 * U, 0.8 * U, 0.3 * U, 0.8 * U, 0.6 * U, 0); ctx.stroke(); };
  SYM.SW = (ctx, p) => { stub(ctx, -2, -1); stub(ctx, 1, 2); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(-U, 0, 0.17 * U, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(U, 0, 0.17 * U, 0, TAU); ctx.fill(); if (p.closed) line(ctx, [-U, 0], [U, 0]); else line(ctx, [-U, 0], [0.85 * U, -0.95 * U]); };
  SYM.BTN = (ctx, p) => { stub(ctx, -2, -1); stub(ctx, 1, 2); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(-U, 0, 0.17 * U, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(U, 0, 0.17 * U, 0, TAU); ctx.fill(); const d = p.pressed ? 0.35 : 1.15; line(ctx, [-0.9 * U, -d * U], [0.9 * U, -d * U]); line(ctx, [0, -d * U], [0, -1.8 * U]); };
  SYM.FUSE = (ctx, p) => { stub(ctx, -2, -1); stub(ctx, 1, 2); ctx.strokeRect(-U, -0.4 * U, 2 * U, 0.8 * U); if (!p.blown) line(ctx, [-U, 0], [U, 0]); };
  SYM.JUMPER = (ctx, p) => stub(ctx, -2, 2);
  SYM.LAMP = (ctx, p) => { stub(ctx, -2, -1); stub(ctx, 1, 2); ctx.beginPath(); ctx.arc(0, 0, U, 0, TAU); ctx.stroke(); line(ctx, [-0.7 * U, -0.7 * U], [0.7 * U, 0.7 * U]); line(ctx, [-0.7 * U, 0.7 * U], [0.7 * U, -0.7 * U]); };
  SYM.MOTOR = (ctx, p) => { stub(ctx, -2, -1.1); stub(ctx, 1.1, 2); ctx.beginPath(); ctx.arc(0, 0, 1.1 * U, 0, TAU); ctx.stroke(); DW.text(ctx, 'M', 0, 0, 1.3 * U, ctx.strokeStyle, { weight: 700 }); };
  SYM.BUZ = (ctx, p) => { stub(ctx, -2, -0.7); stub(ctx, 0.7, 2); ctx.beginPath(); ctx.arc(0, 0, 0.9 * U, 0, TAU); ctx.stroke(); DW.text(ctx, '♪', 0, 0.05 * U, 1.2 * U, ctx.strokeStyle, { weight: 700 }); };
  SYM.PIEZO = SYM.BUZ; SYM.SPEAKER = SYM.BUZ;
  SYM.BJT = (ctx, p) => {
    const pnp = (PT.val(p, 'model') === 'BC557');
    line(ctx, [-2 * U, 0], [-0.7 * U, 0]); line(ctx, [-0.7 * U, -1.1 * U], [-0.7 * U, 1.1 * U]);
    line(ctx, [-0.7 * U, -0.55 * U], [2 * U, -2 * U]); line(ctx, [-0.7 * U, 0.55 * U], [2 * U, 2 * U]);
    /* flecha del emisor */
    const a = Math.atan2(1.45 * U, 2.7 * U); const ex = 2 * U, ey = 2 * U;
    ctx.save(); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath();
    if (!pnp) { const tx = ex - 0.55 * U * Math.cos(a), ty = ey - 0.55 * U * Math.sin(a) + 0; ctx.moveTo(1.3 * U, 1.55 * U); ctx.lineTo(1.3 * U - 0.62 * U * Math.cos(a - 0.5), 1.55 * U - 0.62 * U * Math.sin(a - 0.5)); ctx.lineTo(1.3 * U - 0.62 * U * Math.cos(a + 0.5), 1.55 * U - 0.62 * U * Math.sin(a + 0.5)); }
    ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(0.3 * U, 0, 2.05 * U, 0, TAU); ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
  };
  SYM.NMOS = (ctx, p) => {
    line(ctx, [-2 * U, 0], [-0.9 * U, 0]); line(ctx, [-0.9 * U, -0.9 * U], [-0.9 * U, 0.9 * U]);
    line(ctx, [-0.5 * U, -1.1 * U], [-0.5 * U, -0.4 * U]); line(ctx, [-0.5 * U, -0.2 * U], [-0.5 * U, 0.2 * U]); line(ctx, [-0.5 * U, 0.4 * U], [-0.5 * U, 1.1 * U]);
    line(ctx, [-0.5 * U, -0.8 * U], [2 * U, -0.8 * U], [2 * U, -2 * U]); line(ctx, [-0.5 * U, 0.8 * U], [2 * U, 0.8 * U], [2 * U, 2 * U]); line(ctx, [-0.5 * U, 0], [1.4 * U, 0], [1.4 * U, 0.8 * U]);
    ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.moveTo(-0.5 * U, 0); ctx.lineTo(-0.1 * U, -0.25 * U); ctx.lineTo(-0.1 * U, 0.25 * U); ctx.closePath(); ctx.fill();
  };
  SYM.RELAY = (ctx, p) => SYM.R(ctx, p);
  function arrow(ctx, x0, y0, x1, y1, fill) {
    const a = Math.atan2(y1 - y0, x1 - x0), h = 0.4 * U;
    line(ctx, [x0, y0], [x1, y1]);
    ctx.save(); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - h * Math.cos(a - 0.4), y1 - h * Math.sin(a - 0.4)); ctx.lineTo(x1 - h * Math.cos(a + 0.4), y1 - h * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  /* Corriente que entra a la pieza por el terminal k (A) */
  SCH.termI = function (bench, p, k) {
    const c = bench.c;
    const e = (r) => c.find(p.id + ':' + r);
    try {
      if (p.dead) return 0;
      switch (p.type) {
        case 'BJT': { const q = e('main'); return k === 0 ? q.ic : k === 1 ? q.ib : -(q.ic + q.ib); }
        case 'NMOS': { const q = e('main'); return k === 1 ? q.i : k === 0 ? 0 : -q.i; }
        case 'POT': { const u = e('up'), d = e('down'); return k === 0 ? u.i : k === 1 ? -u.i + d.i : -d.i; }
        case 'BTN': { const q = e('contact'); return k === 0 ? q.i : k === 2 ? -q.i : 0; }
        default: { const I = bench.partCurrent(p); return k === 0 ? I : -I; }
      }
    } catch (err) { return 0; }
  };

  /* Dibuja el esquema. lab: {scene, bench, t, showFlow, showVolt, hover, sel}; v: {hit} */
  SCH.draw = function (ctx, lab, v) {
    const sc = lab.scene, s = sc.sch, bench = lab.bench;
    const ink = EM.col('--ink'), ink3 = EM.col('--ink-3');
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    /* cables */
    const ends = new Map();
    const key = (p) => p[0].toFixed(2) + ',' + p[1].toFixed(2);
    (s.wires || []).forEach((w) => {
      const pts = [];
      let first = null, last = null;
      let sumTok = null;
      w.forEach((tok, i) => {
        if (tok && !Array.isArray(tok) && typeof tok === 'object') { sumTok = tok; return; }
        if (typeof tok === 'string') { const [id, k] = tok.split('.'); const q = SCH.termPos(sc, id, +k); if (!q) return; pts.push(q); const t = { id, k: +k }; if (i === 0) first = t; if (i === w.length - 1) last = t; }
        else pts.push([tok[0] * U, tok[1] * U]);
      });
      if (pts.length < 2) return;
      const wi = { pts, first, last };
      let I = 0, ref = null;
      const termRef = (t) => { const p = sc.parts.find((q) => q.id === t.id); return p ? p.pins[t.k] : null; };
      if (sumTok) {
        const list = sumTok.in || sumTok.out || [];
        let tot = 0;
        for (const t of list) { const [id, k] = t.split('.'); const p = sc.parts.find((q) => q.id === id); if (p) tot += SCH.termI(bench, p, +k); }
        I = sumTok.out ? -tot : tot;
        const f = list[0] && list[0].split('.'); const p0 = f && sc.parts.find((q) => q.id === f[0]); ref = p0 ? p0.pins[+f[1]] : null;
      } else if (first && sc.parts.find((q) => q.id === first.id)) { const p = sc.parts.find((q) => q.id === first.id); I = -SCH.termI(bench, p, first.k); ref = termRef(first); }
      else if (last && sc.parts.find((q) => q.id === last.id)) { const p = sc.parts.find((q) => q.id === last.id); I = SCH.termI(bench, p, last.k); ref = termRef(last); }
      /* color */
      let col = ink;
      if (lab.showVolt && ref) { try { col = EM.fx.voltColor(bench.v(ref), lab.vmaxSch || (lab.mcu ? lab.mcu.vcc : 5), 1); } catch (e) { /* */ } }
      ctx.strokeStyle = col; ctx.lineWidth = lab.showVolt ? 0.8 : lw;
      line(ctx, ...pts);
      wi.I = I;
      ends.set(key(pts[0]), (ends.get(key(pts[0])) || 0) + 1); ends.set(key(pts[pts.length - 1]), (ends.get(key(pts[pts.length - 1])) || 0) + 1);
      (SCH._wires = SCH._wires || []).push(wi);
    });
    /* uniones (3 o más cables) */
    ctx.fillStyle = ink;
    for (const [k, n] of ends) if (n >= 3) { const [x, y] = k.split(',').map(Number); ctx.beginPath(); ctx.arc(x, y, 0.5, 0, TAU); ctx.fill(); }
    /* símbolos */
    ctx.strokeStyle = ink; ctx.lineWidth = lw;
    const hits = [];
    for (const p of sc.parts) {
      const sp = s.parts[p.id];
      if (!sp) continue;
      const draw = SYM[p.type];
      if (!draw) continue;
      const cx = sp.at[0] * U, cy = sp.at[1] * U;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(((sp.rot || 0) % 360) * Math.PI / 180);
      if (sp.flip) ctx.scale(1, -1);
      /* resalte por calor / daño */
      ctx.strokeStyle = p.dead ? EM.col('--pos') : (p.stress > 1 ? EM.col('--efield') : ink);
      ctx.lineWidth = lab.hover === p.id || lab.sel === p.id ? lw * 1.9 : lw;
      draw(ctx, p);
      ctx.restore();
      if (p.type === 'LED') { const I = bench.partCurrent(p), br = Math.min(1.4, Math.pow(Math.max(0, I) / 0.02, 0.62)); if (br > 0.03 && !p.dead) { v.glows.push({ x: cx, y: cy, r: 8 + br * 8, c: (EM.spice.LEDS[PT.val(p, 'color')] || EM.spice.LEDS.rojo).hex, a: Math.min(1, 0.3 + br * 0.5) }); } }
      if (p.type === 'LAMP') { const h = p.heat || 0; if (h > 0.05) v.glows.push({ x: cx, y: cy, r: 10 + 8 * h, c: '#ffd37a', a: 0.7 * h }); }
      /* rótulo */
      const lbl = sp.label === false ? '' : (sp.label || SCH.label(p));
      if (lbl) {
        const off = sp.lab || ((sp.rot || 0) % 180 === 90 ? [2.0, 0] : [0, -1.9]);
        const lines = String(lbl).split('\n');
        lines.forEach((ln, i) => DW.text(ctx, ln, cx + off[0] * U, cy + off[1] * U + i * 1.0 * U + (lines.length > 1 && (sp.rot % 180 !== 90) ? -(lines.length - 1) * 0.5 * U : 0), 0.95 * U, ink, { weight: 700, align: (sp.rot || 0) % 180 === 90 ? 'left' : 'center' }));
      }
      const r = Math.max(2.2 * U, 0);
      hits.push({ kind: p.type === 'BTN' ? 'btn' : p.type === 'SW' ? 'sw' : p.type === 'POT' ? 'pot' : 'part', id: p.id, x: cx, y: cy, r: p.type === 'BTN' || p.type === 'SW' || p.type === 'POT' ? 2.4 * U : 1.8 * U });
    }
    /* cajas (módulos, microcontrolador) */
    for (const id in s.boxes || {}) {
      const b = s.boxes[id];
      const x = b.at[0] * U, y = b.at[1] * U, w = b.w * U, h = b.h * U;
      ctx.fillStyle = EM.col('--surface'); ctx.strokeStyle = ink; ctx.lineWidth = lw;
      DW.rr(ctx, x, y, w, h, 0.5 * U); ctx.fill(); ctx.stroke();
      DW.text(ctx, b.title || id, x + w / 2, y + 0.9 * U, 1.1 * U, ink, { weight: 800 });
      for (const k in b.pins) {
        const o = b.pins[k], px = (b.at[0] + o[0]) * U, py = (b.at[1] + o[1]) * U;
        const left = o[0] <= 0.01, right = o[0] >= b.w - 0.01;
        ctx.strokeStyle = ink; line(ctx, [left ? px : px, py], [left ? px + 1.2 * U : right ? px - 1.2 * U : px, py]);
        DW.text(ctx, b.names ? b.names[k] : k, left ? px + 1.4 * U : px - 1.4 * U, py, 0.8 * U, ink, { weight: 700, align: left ? 'left' : 'right' });
      }
      hits.push({ kind: 'part', id: b.part || id, x: x + w / 2, y: y + h / 2, r: Math.min(w, h) / 2 });
    }
    /* tierras */
    ctx.strokeStyle = ink; ctx.lineWidth = lw;
    for (const g of s.gnd || []) { const x = g[0] * U, y = g[1] * U; line(ctx, [x, y], [x, y + 0.5 * U]); line(ctx, [x - 0.9 * U, y + 0.5 * U], [x + 0.9 * U, y + 0.5 * U]); line(ctx, [x - 0.55 * U, y + 0.9 * U], [x + 0.55 * U, y + 0.9 * U]); line(ctx, [x - 0.2 * U, y + 1.3 * U], [x + 0.2 * U, y + 1.3 * U]); }
    for (const t of s.texts || []) DW.text(ctx, t.text, t.at[0] * U, t.at[1] * U, (t.size || 0.95) * U, t.color ? (t.color.startsWith('--') ? EM.col(t.color) : t.color) : ink3, { weight: t.weight || 700, align: t.align || 'center' });
    ctx.restore();
    /* corriente animada */
    if (lab.showFlow) for (const wi of SCH._wires || []) EM.fx.flow(ctx, wi.pts, wi.I, lab.t, '#e8a500');
    SCH._wires = [];
    return hits;
  };
  SCH.label = function (p) {
    switch (p.type) {
      case 'R': return p.id + '\n' + EM.spice.fmtR(PT.val(p, 'value')).replace(' ', ' ');
      case 'POT': return p.id + ' ' + EM.spice.fmtR(PT.val(p, 'value')).replace(' ', ' ');
      case 'C': case 'ECAP': return p.id + '\n' + EM.si(PT.val(p, 'value'), 'F', 2);
      case 'L': return p.id + '\n' + EM.si(PT.val(p, 'value'), 'H', 2);
      case 'BAT': case 'LAB': case 'USB': return PT.val(p, 'v') + ' V';
      case 'LED': return p.id;
      case 'BJT': case 'NMOS': return p.id + '\n' + PT.val(p, 'model');
      default: return p.id;
    }
  };
  SCH.bounds = function (scene) {
    const s = scene.sch;
    return [-1 * U, -2.5 * U, (s.w + 1) * U, (s.h + 1.5) * U];
  };
})();
