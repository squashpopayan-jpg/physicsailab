/* ===================================================================
   50-simbolos.js — Símbolos eléctricos (Tabla 1.3.4.a del Libro 1 del RETIE,
   tomados de IEC 60617, ANSI Y32, CSA Z99 e IEEE 315) y símbolos de planta.
   Cada símbolo se describe una sola vez con un «lápiz» abstracto en una caja
   de −1 a 1 y se dibuja en lienzo (planos) o en SVG (leyendas, unifilar).
   =================================================================== */
(function () {
  'use strict';
  const RT = window.RT;

  /* ---------- Lápiz para canvas ---------- */
  function penCanvas(ctx, cx, cy, s, col, lw) {
    const X = (x) => cx + x * s, Y = (y) => cy - y * s;
    return {
      line(pts) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])))); ctx.stroke(); },
      poly(pts, fill) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])))); ctx.closePath(); if (fill) { ctx.fillStyle = fill === true ? col : fill; ctx.fill(); } ctx.stroke(); },
      circle(x, y, r, fill) { ctx.beginPath(); ctx.arc(X(x), Y(y), r * s, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill === true ? col : fill; ctx.fill(); } ctx.stroke(); },
      arc(x, y, r, a0, a1) { ctx.beginPath(); ctx.arc(X(x), Y(y), r * s, -a0, -a1, a1 > a0); ctx.stroke(); },
      rect(x0, y0, x1, y1, fill) { ctx.beginPath(); ctx.rect(X(x0), Y(y1), (x1 - x0) * s, (y1 - y0) * s); if (fill) { ctx.fillStyle = fill === true ? col : fill; ctx.fill(); } ctx.stroke(); },
      hatch(x0, y0, x1, y1, n = 6) {
        ctx.save(); ctx.beginPath(); ctx.rect(X(x0), Y(y1), (x1 - x0) * s, (y1 - y0) * s); ctx.clip();
        ctx.beginPath(); const w = x1 - x0, h = y1 - y0, st = (w + h) / n;
        for (let k = -h; k < w + h; k += st) { ctx.moveTo(X(x0 + k), Y(y0)); ctx.lineTo(X(x0 + k + h), Y(y1)); }
        ctx.lineWidth = lw * 0.8; ctx.stroke(); ctx.restore();
      },
      text(t, x, y, sz = 0.5, align = 'center') {
        ctx.save(); ctx.fillStyle = col; ctx.font = `600 ${Math.max(7, sz * s)}px ${RT.FONT_UI}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(t, X(x), Y(y)); ctx.restore();
      },
      begin() { ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; },
      end() { ctx.restore(); }
    };
  }
  /* ---------- Lápiz para SVG ---------- */
  function penSVG(out, cx, cy, s, col, lw) {
    const X = (x) => +(cx + x * s).toFixed(2), Y = (y) => +(cy - y * s).toFixed(2);
    const st = `stroke="${col}" stroke-width="${lw}" stroke-linecap="round" stroke-linejoin="round"`;
    return {
      line(pts) { out.push(`<polyline points="${pts.map((p) => X(p[0]) + ',' + Y(p[1])).join(' ')}" fill="none" ${st}/>`); },
      poly(pts, fill) { out.push(`<polygon points="${pts.map((p) => X(p[0]) + ',' + Y(p[1])).join(' ')}" fill="${fill ? (fill === true ? col : fill) : 'none'}" ${st}/>`); },
      circle(x, y, r, fill) { out.push(`<circle cx="${X(x)}" cy="${Y(y)}" r="${+(r * s).toFixed(2)}" fill="${fill ? (fill === true ? col : fill) : 'none'}" ${st}/>`); },
      arc(x, y, r, a0, a1) {
        const p0 = [x + r * Math.cos(a0), y + r * Math.sin(a0)], p1 = [x + r * Math.cos(a1), y + r * Math.sin(a1)];
        const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0, sweep = a1 > a0 ? 0 : 1;
        out.push(`<path d="M${X(p0[0])},${Y(p0[1])} A${+(r * s).toFixed(2)},${+(r * s).toFixed(2)} 0 ${large} ${sweep} ${X(p1[0])},${Y(p1[1])}" fill="none" ${st}/>`);
      },
      rect(x0, y0, x1, y1, fill) { out.push(`<rect x="${X(x0)}" y="${Y(y1)}" width="${+((x1 - x0) * s).toFixed(2)}" height="${+((y1 - y0) * s).toFixed(2)}" fill="${fill ? (fill === true ? col : fill) : 'none'}" ${st}/>`); },
      hatch(x0, y0, x1, y1, n = 6) {
        const id = 'h' + Math.random().toString(36).slice(2, 8);
        out.push(`<clipPath id="${id}"><rect x="${X(x0)}" y="${Y(y1)}" width="${+((x1 - x0) * s).toFixed(2)}" height="${+((y1 - y0) * s).toFixed(2)}"/></clipPath><g clip-path="url(#${id})">`);
        const w = x1 - x0, h = y1 - y0, stp = (w + h) / n;
        for (let k = -h; k < w + h; k += stp) out.push(`<line x1="${X(x0 + k)}" y1="${Y(y0)}" x2="${X(x0 + k + h)}" y2="${Y(y1)}" stroke="${col}" stroke-width="${lw * 0.8}"/>`);
        out.push('</g>');
      },
      text(t, x, y, sz = 0.5, align = 'center') { out.push(`<text x="${X(x)}" y="${Y(y)}" fill="${col}" font-size="${+(sz * s).toFixed(1)}" font-family="Barlow, sans-serif" font-weight="600" text-anchor="${align === 'center' ? 'middle' : align === 'left' ? 'start' : 'end'}" dominant-baseline="central">${t}</text>`); },
      begin() {}, end() {}
    };
  }

  /* ---------- Definición de símbolos (caja −1..1) ---------- */
  const S = {};
  const tierra3 = (p, y0 = -0.2) => { p.line([[0, 0.9], [0, y0]]); p.line([[-0.6, y0], [0.6, y0]]); p.line([[-0.4, y0 - 0.25], [0.4, y0 - 0.25]]); p.line([[-0.2, y0 - 0.5], [0.2, y0 - 0.5]]); };
  S['caja-empalme'] = { n: 'Caja de empalme', f: (p) => { p.circle(0, 0, 0.8); p.circle(0, 0, 0.28, true); } };
  S['corriente-continua'] = { n: 'Corriente continua', f: (p) => { p.line([[-0.9, 0.25], [0.9, 0.25]]); [-0.9, -0.3, 0.3].forEach((x) => p.line([[x, -0.25], [x + 0.45, -0.25]])); } };
  S['conductores-fase'] = { n: 'Conductores de fase', f: (p) => { p.line([[-1, 0], [1, 0]]); [-0.35, 0, 0.35].forEach((x) => p.line([[x - 0.15, -0.35], [x + 0.15, 0.35]])); } };
  S['conductor-neutro'] = { n: 'Conductor neutro', f: (p) => { p.line([[-1, 0], [1, 0]]); p.line([[-0.15, -0.35], [0.15, 0.35]]); p.circle(0.15, 0.42, 0.1, true); } };
  S['conductor-tierra'] = { n: 'Conductor de puesta a tierra', f: (p) => { p.line([[-1, 0], [1, 0]]); p.line([[-0.15, -0.45], [0.15, 0.45]]); p.line([[-0.15, 0.45], [0.45, 0.45]]); } };
  S['conmutador'] = { n: 'Conmutador unipolar', f: (p) => { p.circle(0, -0.35, 0.35); p.line([[-0.25, -0.1], [-0.65, 0.65]]); p.line([[0.25, -0.1], [0.65, 0.65]]); } };
  S['contacto-corte'] = { n: 'Contacto de corte', f: (p) => { p.line([[0, 1], [0, 0.35]]); p.line([[0, 0.35], [-0.35, -0.3]]); p.line([[0, -0.35], [0, -1]]); } };
  S['contacto-disparo'] = { n: 'Contacto con disparo automático', f: (p) => { p.line([[0, 1], [0, 0.35]]); p.line([[0, 0.35], [-0.35, -0.3]]); p.line([[0, -0.35], [0, -1]]); p.line([[-0.12, 0.47], [0.12, 0.23]]); p.line([[0.12, 0.47], [-0.12, 0.23]]); } };
  S['dps'] = { n: 'Dispositivo de protección contra sobretensiones (DPS)', f: (p) => { p.rect(-0.4, -0.8, 0.4, 0.8); p.line([[0, 1], [0, 0.15]]); p.poly([[-0.1, 0.25], [0.1, 0.25], [0, 0.05]], true); p.line([[0, -1], [0, -0.15]]); p.poly([[-0.1, -0.25], [0.1, -0.25], [0, -0.05]], true); } };
  S['dps-varistor'] = { n: 'DPS tipo varistor', f: (p) => { p.rect(-0.25, -0.6, 0.25, 0.6); p.line([[0, 1], [0, 0.6]]); p.line([[0, -0.6], [0, -1]]); p.line([[-0.5, -0.7], [0.3, 0.55], [0.5, 0.55]]); } };
  S['doble-aislamiento'] = { n: 'Doble aislamiento', f: (p) => { p.rect(-0.85, -0.85, 0.85, 0.85); p.rect(-0.45, -0.45, 0.45, 0.45); } };
  S['empalme'] = { n: 'Empalme', f: (p) => { p.line([[-1, 0], [1, 0]]); p.circle(0, 0, 0.22, true); } };
  S['equipotencialidad'] = { n: 'Equipotencialidad', f: (p) => { p.line([[0, 1], [0, 0.55]]); p.poly([[-0.8, 0.55], [0.8, 0.55], [0, -0.8]]); p.circle(0, 0.2, 0.3); } };
  S['fusible'] = { n: 'Fusible', f: (p) => { p.line([[-1, 0], [1, 0]]); p.rect(-0.55, -0.25, 0.55, 0.25); } };
  S['generador'] = { n: 'Generador', f: (p) => { p.circle(0, 0, 0.8); p.text('G', 0, 0, 0.8); } };
  S['interruptor'] = { n: 'Interruptor, símbolo general', f: (p) => { p.circle(-0.25, -0.25, 0.35); p.line([[0.0, 0.0], [0.6, 0.65]]); } };
  S['interruptor-automatico'] = { n: 'Interruptor automático en aire', f: (p) => { p.line([[0, 1], [0, 0.3]]); p.arc(0.05, 0, 0.3, Math.PI / 2, -Math.PI / 2); p.line([[0, -0.3], [0, -1]]); } };
  S['interruptor-bipolar'] = { n: 'Interruptor bipolar', f: (p) => { p.circle(-0.25, -0.25, 0.35); p.line([[0.0, 0.0], [0.6, 0.65]]); p.line([[0.38, 0.62], [0.62, 0.38]]); p.line([[0.5, 0.75], [0.75, 0.5]]); } };
  S['interruptor-piloto'] = { n: 'Interruptor con luz piloto', f: (p) => { p.circle(-0.25, -0.25, 0.35); p.line([[-0.5, 0], [0, -0.5]]); p.line([[0, -0.0], [-0.5, -0.5]]); p.line([[0.0, 0.0], [0.55, 0.65]]); } };
  S['interruptor-diferencial'] = { n: 'Interruptor diferencial', f: (p) => { p.line([[0, 1], [0, 0.45]]); p.line([[0, 0.45], [-0.35, -0.15]]); p.line([[0, -0.25], [0, -1]]); p.rect(-0.75, -0.55, -0.45, -0.25); p.line([[-0.45, -0.4], [0.2, -0.4]]); p.line([[-0.6, 0.25], [-0.25, 0.25]]); } };
  S['interruptor-dos-vias'] = { n: 'Interruptor unipolar de dos vías (conmutable)', f: (p) => { p.circle(0, 0, 0.35); p.line([[0.25, 0.25], [0.7, 0.75], [0.95, 0.5]]); p.line([[-0.25, -0.25], [-0.7, -0.75], [-0.95, -0.5]]); } };
  S['interruptor-termomagnetico'] = { n: 'Interruptor termomagnético', f: (p) => { p.line([[0, 1], [0, 0.4]]); p.line([[0, 0.4], [-0.35, -0.2]]); p.line([[0, -0.3], [0, -1]]); p.line([[-0.12, 0.52], [0.12, 0.28]]); p.line([[0.12, 0.52], [-0.12, 0.28]]); } };
  S['lampara'] = { n: 'Lámpara', f: (p) => { p.circle(0, 0, 0.8); p.line([[-0.57, -0.57], [0.57, 0.57]]); p.line([[-0.57, 0.57], [0.57, -0.57]]); } };
  S['masa'] = { n: 'Masa', f: (p) => { p.line([[0, 1], [0, -0.4]]); p.line([[-0.7, -0.4], [0.7, -0.4]]); [-0.6, 0, 0.6].forEach((x) => p.line([[x, -0.4], [x - 0.3, -0.85]])); } };
  S['parada-emergencia'] = { n: 'Parada de emergencia', f: (p) => { p.circle(0, 0, 0.85); p.poly([[-0.65, 0.4], [0.65, 0.4], [0, -0.7]]); p.text('!', 0, 0.1, 0.7); } };
  S['tablero-general'] = { n: 'Tablero general', f: (p) => { p.rect(-1, -0.45, 1, 0.45); p.hatch(-1, -0.45, 1, 0.45, 9); } };
  S['tablero-distribucion'] = { n: 'Tablero de distribución', f: (p) => { p.rect(-1, -0.45, 1, 0.45); p.poly([[-1, -0.45], [1, 0.45], [1, -0.45]], true); } };
  S['tierra'] = { n: 'Tierra', f: (p) => tierra3(p, -0.1) };
  S['tierra-proteccion'] = { n: 'Tierra de protección', f: (p) => { p.circle(0, -0.2, 0.7); tierra3(p, -0.15); } };
  S['tierra-aislada'] = { n: 'Tierra aislada', f: (p) => { p.arc(0, -0.45, 0.75, 0, Math.PI); tierra3(p, -0.25); } };
  S['toma'] = { n: 'Tomacorriente, símbolo general', f: (p) => { p.arc(0, -0.35, 0.65, 0, Math.PI); p.line([[0, 0.3], [0, 1]]); } };
  S['toma-piso'] = { n: 'Tomacorriente en el piso', f: (p) => { p.rect(-0.9, -0.85, 0.9, 0.85); p.circle(0, 0, 0.6); p.line([[-0.6, 0.1], [0.6, 0.1]]); p.line([[-0.6, -0.1], [0.6, -0.1]]); } };
  S['toma-monofasico'] = { n: 'Tomacorriente monofásico', f: (p) => { p.arc(0, -0.2, 0.6, 0, Math.PI); p.line([[-0.95, 0.15], [0.6, 0.15]]); p.line([[-0.95, 0.35], [0.4, 0.35]]); p.line([[0.6, -0.2], [0.6, -0.55]]); p.line([[0.45, -0.55], [0.75, -0.55]]); } };
  S['toma-trifasico'] = { n: 'Tomacorriente trifásico', f: (p) => { p.circle(0, -0.1, 0.65); p.line([[-0.95, 0.05], [0.95, 0.05]]); p.line([[-0.95, 0.25], [0.95, 0.25]]); p.line([[-0.95, -0.15], [0.95, -0.15]]); } };
  S['transformador'] = { n: 'Transformador, símbolo general', f: (p) => { p.circle(0, 0.3, 0.4); p.circle(0, -0.3, 0.4); p.line([[0, 0.7], [0, 1]]); p.line([[0, -0.7], [0, -1]]); } };
  S['transformador-aislamiento'] = { n: 'Transformador de aislamiento', f: (p) => { p.circle(0, 0.3, 0.45); p.circle(0, -0.3, 0.45); p.line([[-0.9, 0], [0.9, 0]]); } };
  S['transformador-seguridad'] = { n: 'Transformador de seguridad', f: (p) => { p.poly([[-0.75, 0.85], [0.75, 0.85], [0.75, -0.2], [0, -0.85], [-0.75, -0.2]]); p.circle(0, 0.35, 0.3); p.circle(0, -0.05, 0.3); } };
  /* Símbolos de planta usados en los planos E01 a E04 (convenciones de la guía) */
  S['p-lum'] = { n: 'Salida de alumbrado en techo', f: S.lampara.f };
  S['p-aplique'] = { n: 'Aplique de pared', f: (p) => { p.circle(0, 0, 0.7); p.line([[-0.5, -0.5], [0.5, 0.5]]); p.line([[-0.5, 0.5], [0.5, -0.5]]); p.line([[-0.9, -0.95], [0.9, -0.95]]); } };
  S['p-int'] = { n: 'Interruptor sencillo', f: S.interruptor.f };
  S['p-int2'] = { n: 'Interruptor doble', f: (p) => { p.circle(-0.25, -0.25, 0.35); p.line([[0.0, 0.0], [0.6, 0.65]]); p.line([[-0.35, 0.1], [0.15, 0.75]]); } };
  S['p-conm'] = { n: 'Interruptor conmutable (de dos vías)', f: S['interruptor-dos-vias'].f };
  S['p-toma'] = { n: 'Tomacorriente doble con polo a tierra', f: (p) => { p.arc(0, -0.35, 0.65, 0, Math.PI); p.line([[-0.3, 0.3], [-0.3, 0.95]]); p.line([[0.3, 0.3], [0.3, 0.95]]); p.line([[-0.55, -0.35], [0.55, -0.35]]); } };
  S['p-ducha'] = { n: 'Salida especial para ducha', f: (p) => { p.rect(-0.75, -0.75, 0.75, 0.75); p.text('D', 0, 0, 0.95); } };
  S['p-estufa'] = { n: 'Salida especial para estufa (240 V)', f: (p) => { p.rect(-0.75, -0.75, 0.75, 0.75); p.text('E', 0, 0, 0.95); } };
  S['p-tablero'] = { n: 'Tablero general', f: S['tablero-general'].f };
  S['p-medidor'] = { n: 'Medidor de energía', f: (p) => { p.rect(-0.8, -0.8, 0.8, 0.8); p.text('kWh', 0, 0, 0.55); } };
  S['p-tierra'] = { n: 'Electrodo de puesta a tierra con caja de inspección', f: (p) => { p.rect(-0.85, -0.85, 0.85, 0.85); tierra3(p, 0.05); } };
  S['p-caja'] = { n: 'Caja de paso', f: (p) => { p.rect(-0.6, -0.6, 0.6, 0.6); p.line([[-0.6, -0.6], [0.6, 0.6]]); } };

  RT.SIMB = S;
  /* Dibuja un símbolo en el lienzo: s = semitamaño en píxeles; rot en radianes */
  RT.simbolo = function (ctx, name, x, y, s, o = {}) {
    const def = S[name];
    if (!def) return;
    const col = o.color ? (o.color.startsWith('--') ? RT.col(o.color) : o.color) : RT.col('--ink');
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    if (o.bg) { ctx.fillStyle = o.bg.startsWith('--') ? RT.col(o.bg) : o.bg; ctx.beginPath(); ctx.arc(0, 0, s * 1.05, 0, 7); ctx.fill(); }
    const p = penCanvas(ctx, 0, 0, s, col, o.lw || Math.max(1, s * 0.11));
    p.begin(); def.f(p); p.end();
    ctx.restore();
  };
  /* Cadena SVG de un símbolo en una caja de tamaño px */
  RT.simboloSVG = function (name, px = 44, o = {}) {
    const def = S[name];
    if (!def) return '';
    const out = [];
    const p = penSVG(out, px / 2, px / 2, px * 0.4, o.color || 'currentColor', o.lw || Math.max(1.2, px * 0.035));
    def.f(p);
    return `<svg viewBox="0 0 ${px} ${px}" width="${px}" height="${px}" class="simb" role="img" aria-label="${def.n}">${out.join('')}</svg>`;
  };
  /* Fragmento SVG (sin envoltura) para incrustar en dibujos mayores */
  RT.simboloSVGen = function (name, cx, cy, s, col = 'currentColor', lw = 1.4) {
    const def = S[name];
    if (!def) return '';
    const out = [];
    def.f(penSVG(out, cx, cy, s, col, lw));
    return out.join('');
  };
  /* Símbolo de planta para un punto del modelo */
  RT.simboloDe = function (p) {
    return { lum: 'p-lum', aplique: 'p-aplique', int: 'p-int', int2: 'p-int2', conm: 'p-conm', toma: 'p-toma', ducha: 'p-ducha', estufa: 'p-estufa', tablero: 'p-tablero' }[p.tipo] || 'p-caja';
  };
})();
