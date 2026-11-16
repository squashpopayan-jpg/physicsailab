/* Dibujo de los instrumentos: escena completa (calibrador y micrómetro con la pieza) y vistas de lectura
   (lupa) con escala principal, nonio, manguito y tambor. Todo en milímetros reales: lo que se ve en pantalla
   es la geometría del instrumento, no un valor escrito. */
var RENDER = (function () {
  'use strict';
  const M = METRO, PI = Math.PI;
  const SANS = '"Public Sans", system-ui, "Segoe UI", sans-serif';
  const MONO = '"IBM Plex Mono", ui-monospace, Consolas, monospace';

  /* ---------- utilidades ---------- */
  function fit(canvas, ratio) {
    const w = Math.round(canvas.getBoundingClientRect().width);
    if (w < 200) return null;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1), h = Math.round(w * ratio);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.height = h + 'px';
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W: w, H: h };
  }
  const lin = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach((s) => g.addColorStop(s[0], s[1])); return g; };
  const STEEL_V = (ctx, y0, y1) => lin(ctx, 0, y0, 0, y1, [[0, '#f4f7f9'], [0.18, '#dfe5ea'], [0.55, '#bcc6ce'], [0.85, '#9aa6b0'], [1, '#c3ccd3']]);
  const STEEL_H = (ctx, x0, x1) => lin(ctx, x0, 0, x1, 0, [[0, '#8f9ba5'], [0.25, '#e9eef2'], [0.5, '#c2cbd2'], [0.8, '#8f9ba5'], [1, '#aab4bc']]);
  const MATC = {
    Acero: ['#eef2f5', '#b3bdc5', '#7b8791'], Aluminio: ['#fafbfc', '#d3dade', '#9aa5ae'], Latón: ['#f6e6a8', '#cfa84e', '#8e6d24'],
    Cobre: ['#f5bf9a', '#c47c4d', '#84472a'], Vidrio: ['rgba(240,251,252,.9)', 'rgba(188,224,232,.6)', 'rgba(128,176,190,.7)'],
    Cuproníquel: ['#f1f3f4', '#c6cacd', '#8e9397'], Caucho: ['#5d5d65', '#2e2e34', '#17171b'], Goma: ['#f7c0c0', '#dc8f8f', '#b46060'],
    Papel: ['#fffefa', '#f2eddf', '#d3caaf'], Queratina: ['#775640', '#3d2b1f', '#1f150e'],
  };
  const mc = (m) => MATC[m] || MATC.Acero;
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  function text(ctx, s, x, y, size, color, align, weight, font) {
    ctx.font = (weight || 500) + ' ' + size + 'px ' + (font || SANS); ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y);
  }
  function pill(ctx, s, x, y, size, color) {
    ctx.font = '700 ' + size + 'px ' + SANS; const w = ctx.measureText(s).width + 14;
    ctx.fillStyle = 'rgba(255,255,255,.92)'; rr(ctx, x - w / 2, y - size - 3, w, size + 10, 6); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(s, x, y);
  }
  function bench(ctx, W, H) {
    ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#33444f'], [1, '#222e37']]); ctx.fillRect(0, 0, W, H);
  }
  function gridMM(ctx, sc, y0, WW, YH) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.045)'; ctx.lineWidth = 1 / sc;
    ctx.beginPath(); for (let x = 0; x <= WW + 10; x += 10) { ctx.moveTo(x, y0 - 100); ctx.lineTo(x, y0 + 200); }
    for (let y = -100; y <= YH + 100; y += 10) { ctx.moveTo(-10, y); ctx.lineTo(WW + 10, y); } ctx.stroke(); ctx.restore();
  }

  /* ---------- la pieza ---------- */
  /* Dibuja la pieza de ancho S (mm) apoyada en x=X, centrada en YC. o: {mat, hmax, sc} */
  function pieza(ctx, a, S, X, YC, o) {
    const px = 1 / o.sc, C = mc(o.mat), hh = Math.min(a.h || 28, o.hmax || 28) / 2;
    ctx.save();
    const dib = a.dib;
    if (dib === 'esfera' || dib === 'seccion' || dib === 'disco') {
      const r = S / 2, cx = X + r;
      const g = ctx.createRadialGradient(cx - r * 0.35, YC - r * 0.4, r * 0.1, cx, YC, r * 1.05);
      if (dib === 'seccion') { g.addColorStop(0, '#6a6a73'); g.addColorStop(0.6, C[1]); g.addColorStop(1, C[2]); }
      else { g.addColorStop(0, C[0]); g.addColorStop(0.55, C[1]); g.addColorStop(1, C[2]); }
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, YC, r, 0, 2 * PI); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = px; ctx.stroke();
      if (dib === 'disco') {                                   // la arandela / moneda vista de frente
        const hole = o.agujero ? o.agujero / 2 : 0;
        if (hole) { ctx.fillStyle = '#222e37'; ctx.beginPath(); ctx.arc(cx, YC, hole, 0, 2 * PI); ctx.fill(); ctx.stroke(); }
        else { ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.arc(cx, YC, r * 0.82, 0, 2 * PI); ctx.stroke(); }
      }
    } else if (dib === 'hilo') {
      const w = Math.max(S, 1.6 * px);
      ctx.fillStyle = lin(ctx, X, 0, X + w, 0, [[0, C[2]], [0.4, C[0]], [1, C[2]]]); ctx.fillRect(X, YC - hh, w, hh * 2);
    } else if (dib === 'laminaV') {
      const w = Math.max(S, 1.5 * px);
      ctx.fillStyle = lin(ctx, X, 0, X + w, 0, [[0, C[2]], [0.5, C[0]], [1, C[1]]]); ctx.fillRect(X, YC - hh, w, hh * 2);
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = px; ctx.strokeRect(X, YC - hh, w, hh * 2);
    } else if (dib === 'cilV' || dib === 'rosca') {
      ctx.fillStyle = lin(ctx, X, 0, X + S, 0, [[0, C[2]], [0.28, C[0]], [0.62, C[1]], [1, C[2]]]); ctx.fillRect(X, YC - hh, S, hh * 2);
      if (dib === 'rosca') { ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = px; ctx.beginPath(); for (let y = YC - hh; y < YC + hh; y += 1.5) { ctx.moveTo(X, y + 0.7); ctx.lineTo(X + S, y - 0.2); } ctx.stroke(); }
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = px; ctx.strokeRect(X, YC - hh, S, hh * 2);
    } else {                                                   // rect, cilH
      ctx.fillStyle = lin(ctx, 0, YC - hh, 0, YC + hh, [[0, C[0]], [0.5, C[1]], [1, C[2]]]); ctx.fillRect(X, YC - hh, S, hh * 2);
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = px; ctx.strokeRect(X, YC - hh, S, hh * 2);
      if (o.etiqueta) text(ctx, o.etiqueta, X + S / 2, YC + 1.3, 3.6, 'rgba(20,30,40,.75)', 'center', 700, MONO);
    }
    ctx.restore();
  }
  const sombra = (ctx, x, y, w, h, px) => { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x + 1.2, y + 1.6, w, h); };

  /* flechas de fuerza hacia la pieza */
  function flechas(ctx, xs, y, F, sc, dir) {
    if (F < 0.4) return;
    const len = Math.min(26, 4 + F * 1.6), px = 1 / sc;
    ctx.save(); ctx.strokeStyle = '#ff8a3d'; ctx.fillStyle = '#ff8a3d'; ctx.lineWidth = 2.2 * px;
    xs.forEach((x, i) => {
      const d = dir[i];                                        // +1 apunta a la derecha
      ctx.beginPath(); ctx.moveTo(x - d * len, y); ctx.lineTo(x - d * 1.8, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - d * 3.2, y - 1.8); ctx.lineTo(x - d * 3.2, y + 1.8); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  }
  function rotulo(ctx, txt, tx, ty, ax, ay, sc, color) {
    const px = 1 / sc; ctx.save(); ctx.strokeStyle = color || '#ffd27a'; ctx.fillStyle = color || '#ffd27a'; ctx.lineWidth = 1.2 * px;
    ctx.beginPath(); ctx.moveTo(tx, ty + 1); ctx.lineTo(ax, ay); ctx.stroke();
    ctx.beginPath(); ctx.arc(ax, ay, 1.6 * px, 0, 2 * PI); ctx.fill();
    ctx.font = '600 ' + (12.5 * px) + 'px ' + SANS; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const w = ctx.measureText(txt).width + 8 * px; ctx.fillStyle = 'rgba(20,28,34,.82)'; ctx.fillRect(tx - w / 2, ty - 11 * px, w, 15 * px);
    ctx.fillStyle = color || '#ffd27a'; ctx.fillText(txt, tx, ty); ctx.restore();
  }

  /* ======================================================================
     CALIBRADOR VERNIER · ESCENA
     ====================================================================== */
  const V = { X0: 20, SL: 54, yUp: 18, yB: 42, hB: 26, yS: 58, yJ: 108, YH: 122 };
  /* ventana de la escena: ancho de mundo y apertura máxima que se puede arrastrar */
  function ventanaV(I, kind, S, full) {
    const R = I.rangoMM;
    let WW;
    if (kind === 'libre' || full) WW = V.X0 + R + V.SL + 10;
    else WW = V.X0 + Math.min(R, (S || 20)) + V.SL + 22;
    WW = Math.max(WW, 150);
    return { WW, uMax: Math.min(R, WW - V.X0 - V.SL - 6) };
  }
  function sceneVernier(ctx, W, H, st) {
    const I = st.I, kind = st.kind, g = st.g, dmm = I.div * I.f, R = I.rangoMM, N = I.N, X0 = V.X0, SL = V.SL;
    const win = ventanaV(I, kind, st.S, st.partes), WW = win.WW, sc = W / WW, px = 1 / sc, hs = H / sc;
    const yc = st.partes ? 62 : (kind === 'int' ? 40 : (kind === 'prof' ? 56 : 76));
    const y0 = hs >= V.YH ? (V.YH - hs) / 2 : Math.max(0, Math.min(yc - hs / 2, V.YH - hs));
    bench(ctx, W, H);
    ctx.save(); ctx.scale(sc, sc); ctx.translate(0, -y0);
    gridMM(ctx, sc, y0, WW, V.YH);
    const yB = V.yB, hB = V.hB, yS = V.yS, yJ = V.yJ, yUp = V.yUp, XEND = X0 + R + SL + 4, yJc = (yS + 18 + yJ) / 2 + 2;
    const A = st.attr, mat = st.mat, S = st.S;

    /* pieza */
    if (kind === 'ext' && A) {
      ctx.save(); ctx.globalAlpha = 1;
      pieza(ctx, A, S, X0, yJc, { mat, sc, hmax: 30, etiqueta: st.etiqueta, agujero: st.agujeroVis });
      ctx.restore();
    } else if (kind === 'int' && A) {
      const wc = MATC[A.pared] || MATC.Acero, yw0 = yUp - 3, yw1 = yB - 1;
      [[X0 - 22, X0], [X0 + S, X0 + S + 22]].forEach(([a, b]) => {
        ctx.fillStyle = lin(ctx, 0, yw0, 0, yw1, [[0, wc[0]], [1, wc[1]]]); ctx.fillRect(a, yw0, b - a, yw1 - yw0);
        ctx.save(); ctx.beginPath(); ctx.rect(a, yw0, b - a, yw1 - yw0); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = px; ctx.beginPath();
        for (let k = -30; k < 40; k += 2.2) { ctx.moveTo(a + k, yw1); ctx.lineTo(a + k + (yw1 - yw0), yw0); } ctx.stroke(); ctx.restore();
        ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = px; ctx.strokeRect(a, yw0, b - a, yw1 - yw0);
      });
      text(ctx, 'corte de la pieza', X0 + S / 2, yw0 - 2.5, 11 * px, 'rgba(255,255,255,.55)', 'center', 600);
    }

    /* regla */
    sombra(ctx, X0 - 10, yB, XEND - X0 + 10, hB, px);
    ctx.fillStyle = STEEL_V(ctx, yB, yB + hB); rr(ctx, X0 - 10, yB, XEND - X0 + 10, hB, 1.2); ctx.fill();
    ctx.strokeStyle = 'rgba(20,30,40,.55)'; ctx.lineWidth = px; ctx.stroke();
    // escala principal (marcas sobre la línea base yS)
    ctx.strokeStyle = '#13202a'; ctx.fillStyle = '#13202a'; ctx.lineWidth = 0.9 * px;
    const nM = Math.floor(R / dmm + 1e-6) + 2;
    ctx.beginPath();
    for (let m = 0; m <= nM; m++) {
      const x = X0 + m * dmm; let len;
      if (I.unidad === 'mm') len = m % 10 === 0 ? 6.4 : (m % 5 === 0 ? 4.6 : 3.2); else len = m % 40 === 0 ? 7 : (m % 4 === 0 ? 5.4 : (m % 2 === 0 ? 3.9 : 2.7));
      ctx.moveTo(x, yS); ctx.lineTo(x, yS - len);
    }
    ctx.stroke();
    ctx.font = '600 ' + (11 * px) + 'px ' + SANS; ctx.textAlign = 'center';
    for (let m = 0; m <= nM; m++) {
      const x = X0 + m * dmm;
      if (I.unidad === 'mm' && m % 10 === 0 && m > 0) ctx.fillText(String(m / 10), x, yS - 8);
      else if (I.unidad === 'in' && m % 4 === 0 && m > 0) ctx.fillText(String(m / 4 % 10 === 0 ? m / 40 : (m / 4) % 10), x, yS - 8.4);
    }
    // línea de aviso de la unidad
    text(ctx, I.unidad === 'mm' ? 'cm' : 'in', X0 + 3.5, yB + 6.8, 10.5 * px, 'rgba(19,32,42,.6)', 'left', 600);
    text(ctx, 'mm', XEND - 8, yB + 6.8, 10.5 * px, 'rgba(19,32,42,.6)', 'right', 600);

    /* mordaza fija */
    sombra(ctx, X0 - 10, yB + hB, 10, yJ - yB - hB, px);
    ctx.fillStyle = STEEL_H(ctx, X0 - 10, X0); ctx.fillRect(X0 - 10, yB + hB, 10, yJ - yB - hB); ctx.strokeStyle = 'rgba(20,30,40,.6)'; ctx.lineWidth = px; ctx.strokeRect(X0 - 10, yB + hB, 10, yJ - yB - hB);
    ctx.fillStyle = lin(ctx, X0 - 10, 0, X0 - 4, 0, [[0, '#8f9ba5'], [1, '#d9e0e5']]); ctx.fillRect(X0 - 10, yUp, 10, yB - yUp);
    ctx.strokeRect(X0 - 10, yUp, 10, yB - yUp);
    // cuchilla fija de interiores
    ctx.fillStyle = STEEL_H(ctx, X0, X0 + 6); ctx.beginPath(); ctx.moveTo(X0, yUp); ctx.lineTo(X0 + 6, yUp + 4); ctx.lineTo(X0 + 6, yB); ctx.lineTo(X0, yB); ctx.closePath(); ctx.fill(); ctx.stroke();

    /* varilla de profundidad (debajo de la regla) */
    const rodTip = XEND + g;
    ctx.fillStyle = lin(ctx, 0, yB + hB - 4, 0, yB + hB + 1.5, [[0, '#d9e0e5'], [1, '#8b97a1']]);
    ctx.fillRect(X0 + g + SL - 6, yB + hB - 4.5, rodTip - (X0 + g + SL - 6), 3.4);
    ctx.strokeStyle = 'rgba(20,30,40,.55)'; ctx.lineWidth = px; ctx.strokeRect(X0 + g + SL - 6, yB + hB - 4.5, rodTip - (X0 + g + SL - 6), 3.4);

    /* corredera */
    const sx = X0 + g;
    sombra(ctx, sx, yS, SL, yB + hB + 8 - yS, px);
    ctx.fillStyle = lin(ctx, 0, yS, 0, yB + hB + 8, [[0, '#cfd7dd'], [0.12, '#eef2f5'], [0.6, '#b4bec7'], [1, '#8d99a3']]);
    rr(ctx, sx, yS, SL, yB + hB + 8 - yS, 1.2); ctx.fill(); ctx.strokeStyle = 'rgba(20,30,40,.6)'; ctx.lineWidth = px; ctx.stroke();
    // puente a la cuchilla de interiores
    ctx.fillStyle = lin(ctx, sx - 6, 0, sx + 16, 0, [[0, '#8f9ba5'], [0.3, '#e3e9ed'], [1, '#aab4bc']]);
    ctx.beginPath(); ctx.moveTo(sx - 6, yUp + 4); ctx.lineTo(sx - 6, yS + 1); ctx.lineTo(sx + 16, yS + 1); ctx.lineTo(sx + 16, yB - 3); ctx.lineTo(sx, yB - 3); ctx.lineTo(sx, yUp + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    // cuchilla de interiores móvil
    ctx.fillStyle = STEEL_H(ctx, sx - 6, sx); ctx.beginPath(); ctx.moveTo(sx, yUp); ctx.lineTo(sx - 6, yUp + 4); ctx.lineTo(sx - 6, yB); ctx.lineTo(sx, yB); ctx.closePath(); ctx.fill(); ctx.stroke();
    // mordaza móvil exterior
    ctx.fillStyle = STEEL_H(ctx, sx, sx + 10); ctx.fillRect(sx, yB + hB + 8, 10, yJ - yB - hB - 8); ctx.strokeRect(sx, yB + hB + 8, 10, yJ - yB - hB - 8);
    // nonio
    ctx.strokeStyle = '#13202a'; ctx.lineWidth = 0.9 * px; const vd = dmm * (N - 1) / N;
    ctx.beginPath(); for (let j = 0; j <= N; j++) { ctx.moveTo(sx + j * vd, yS); ctx.lineTo(sx + j * vd, yS + (j % Math.round(N / 5 > 4 ? 5 : (N / 5)) === 0 ? 4.2 : 2.6)); } ctx.stroke();
    text(ctx, '0', sx, yS + 9.2, 10.5 * px, '#13202a', 'center', 700);
    // rueda de ajuste y tornillo
    ctx.fillStyle = lin(ctx, 0, yB + hB + 2, 0, yB + hB + 15, [[0, '#6e7c88'], [0.5, '#c3ccd3'], [1, '#6e7c88']]); ctx.beginPath(); ctx.arc(sx + SL - 14, yB + hB + 8.5, 6.4, 0, 2 * PI); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); for (let a = 0; a < 2 * PI; a += 0.5) { ctx.moveTo(sx + SL - 14 + Math.cos(a) * 4.6, yB + hB + 8.5 + Math.sin(a) * 4.6); ctx.lineTo(sx + SL - 14 + Math.cos(a) * 6.4, yB + hB + 8.5 + Math.sin(a) * 6.4); } ctx.stroke();
    ctx.fillStyle = '#4b5762'; ctx.beginPath(); ctx.arc(sx + SL - 31, yB + hB + 2.5, 2.8, 0, 2 * PI); ctx.fill();

    /* fuerza */
    if (st.F > 0.4) {
      if (kind === 'ext') flechas(ctx, [X0, sx], yJc, st.F, sc, [1, -1]);
      else if (kind === 'int') flechas(ctx, [X0, sx], yUp + 14, st.F, sc, [-1, 1]);
    }
    /* partes */
    if (st.partes) {
      const L = [
        ['Mordazas exteriores', X0 - 5, yJ - 8, X0 + 24, 117],
        ['Mordazas de interiores', X0 + 3, yUp + 8, X0 + 34, 9],
        ['Regla (escala principal)', X0 + 70, yS - 3, X0 + 92, 30],
        ['Nonio (escala móvil)', sx + 22, yS + 3, sx + 64, 84],
        ['Corredera', sx + 8, yB + hB + 5, sx + 20, 100],
        ['Tornillo de bloqueo', sx + SL - 31, yB + hB + 2.5, sx + SL + 14, 92],
        ['Rueda de ajuste', sx + SL - 14, yB + hB + 14, sx + SL + 40, 108],
        ['Varilla de profundidad', XEND - 4, yB + hB - 3, XEND - 30, 30],
      ];
      L.forEach((l) => rotulo(ctx, l[0], Math.min(l[3], WW - 38), l[4], l[1], l[2], sc));
    }
    ctx.restore();
    if (kind === 'prof') dibujaInsetProf(ctx, W, H, st);
  }
  /* detalle de profundidad (recuadro con su propio zoom) */
  function dibujaInsetProf(ctx, W, H, st) {
    const S = st.S || 18, g = st.g, w = Math.min(W * 0.46, 430), h = Math.min(H * 0.55, 240), x = W - w - 12, y = 12;
    const ww = S + 30, sc = Math.min(w / ww, h / 52);
    ctx.save(); ctx.beginPath(); rr(ctx, x, y, w, h, 8); ctx.clip();
    ctx.fillStyle = '#1b252d'; ctx.fillRect(x, y, w, h);
    ctx.translate(x + 14, y + h / 2); ctx.scale(sc, sc);
    const px = 1 / sc, X0 = 0, yb = -10, hbm = 22;                       // x=0: cara del bloque
    const wc = MATC[st.attr.pared] || MATC.Acero;
    // bloque con agujero (corte)
    ctx.fillStyle = lin(ctx, 0, -24, 0, 24, [[0, wc[0]], [1, wc[1]]]);
    ctx.beginPath(); ctx.rect(0, -24, S + 12, 15); ctx.rect(0, 5, S + 12, 19); ctx.rect(S, -9, 12, 14); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(0, -24, S + 12, 15); ctx.rect(0, 5, S + 12, 19); ctx.rect(S, -9, 12, 14); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,.26)'; ctx.lineWidth = px; ctx.beginPath(); for (let k = -30; k < S + 40; k += 2) { ctx.moveTo(k, 24); ctx.lineTo(k + 48, -24); } ctx.stroke(); ctx.restore();
    // regla apoyada en la cara del bloque
    ctx.fillStyle = lin(ctx, 0, -24, 0, 6, [[0, '#f4f7f9'], [1, '#9aa6b0']]); ctx.fillRect(-26, -24, 26, 29);
    ctx.strokeStyle = 'rgba(20,30,40,.7)'; ctx.lineWidth = px; ctx.strokeRect(-26, -24, 26, 29);
    // varilla
    ctx.fillStyle = lin(ctx, 0, -8, 0, 4, [[0, '#f4f7f9'], [1, '#8b97a1']]); ctx.fillRect(-26, -7, 26 + g, 3.6); ctx.strokeRect(-26, -7, 26 + g, 3.6);
    if (st.F > 0.4) { ctx.fillStyle = '#ff8a3d'; ctx.strokeStyle = '#ff8a3d'; ctx.lineWidth = 2 * px; ctx.beginPath(); ctx.moveTo(g - 12, -5.2); ctx.lineTo(g - 2, -5.2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(g, -5.2); ctx.lineTo(g - 3, -7); ctx.lineTo(g - 3, -3.4); ctx.fill(); }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1; rr(ctx, x, y, w, h, 8); ctx.stroke();
    text(ctx, 'Detalle: profundidad del agujero', x + w - 12, y + h - 10, 11.5, 'rgba(255,255,255,.75)', 'right', 600);
    text(ctx, 'regla apoyada en la cara del bloque', x + w - 12, y + 20, 10.5, 'rgba(255,255,255,.55)', 'right', 500);
    ctx.restore();
  }

  /* ======================================================================
     CALIBRADOR VERNIER · LUPA (vista de lectura)
     ====================================================================== */
  function geoLupaV(I, W) {
    const span = (I.N - 1) * I.div * I.f;
    const scz = Math.min(64, (W - 150) / span);
    return { span, scz, ox: 74 };
  }
  function lupaVernierBase(ctx, W, H, st, lwf) {
    const I = st.I, N = I.N, dmm = I.div * I.f, G = geoLupaV(I, W), scz = G.scz, ox = G.ox, p = st.p;
    const lw = 1.35 * (lwf || 1), yE = Math.round(H * 0.4);
    const par = (st.par || 0) * PI / 180, shift = Math.tan(par) * 0.55;               // mm de desplazamiento por paralaje
    // regla
    ctx.fillStyle = lin(ctx, 0, 0, 0, yE, [[0, '#eef2f5'], [0.7, '#cdd5db'], [1, '#aeb9c1']]); ctx.fillRect(0, 0, W, yE);
    // corredera
    ctx.fillStyle = lin(ctx, 0, yE, 0, H, [[0, '#a9b4bd'], [0.1, '#e3e9ed'], [0.8, '#c4cdd4'], [1, '#98a3ad']]); ctx.fillRect(0, yE, W, H - yE);
    ctx.strokeStyle = '#2b3944'; ctx.lineWidth = lw * 1.2; ctx.beginPath(); ctx.moveTo(0, yE); ctx.lineTo(W, yE); ctx.stroke();
    // marcas de la regla
    const m0 = Math.max(0, Math.floor((p - ox / scz) / dmm) - 1), m1 = Math.ceil((p + (W - ox) / scz) / dmm) + 1;
    ctx.strokeStyle = '#13202a'; ctx.lineWidth = lw; ctx.fillStyle = '#13202a';
    const sizeBig = 20, sizeLbl = 15;
    for (let m = m0; m <= m1; m++) {
      const x = ox + (m * dmm - p) * scz; if (x < -20 || x > W + 20) continue;
      let len, lab = null, big = false;
      if (I.unidad === 'mm') { len = m % 10 === 0 ? 46 : (m % 5 === 0 ? 34 : 22); if (m % 10 === 0) lab = m / 10 === 0 ? '0' : String(m / 10); big = m % 10 === 0; }
      else { len = m % 40 === 0 ? 50 : (m % 4 === 0 ? 38 : (m % 2 === 0 ? 28 : 20)); if (m % 4 === 0) lab = String(m % 40 === 0 ? m / 40 : (m / 4) % 10); big = m % 40 === 0; }
      ctx.beginPath(); ctx.moveTo(x, yE); ctx.lineTo(x, yE - len); ctx.stroke();
      if (lab !== null) { ctx.font = (big ? '700 ' + sizeBig : '600 ' + sizeLbl) + 'px ' + SANS; ctx.textAlign = 'center'; ctx.fillText(lab, x, yE - len - 6); }
    }
    // nonio
    const vd = dmm * (N - 1) / N, every = N === 10 ? 1 : (N === 20 ? 2 : (N === 50 ? 5 : 5));
    for (let j = 0; j <= N; j++) {
      const x = ox + (j * vd) * scz + shift * scz, lab = j % every === 0;
      ctx.beginPath(); ctx.moveTo(x, yE); ctx.lineTo(x, yE + (lab ? 34 : 22)); ctx.lineWidth = lw; ctx.strokeStyle = '#13202a'; ctx.stroke();
      if (lab) {
        let t;
        if (I.unidad === 'mm') t = String(j / every === 10 ? 10 : (j / every)); else t = String(j);
        ctx.font = '700 15px ' + SANS; ctx.textAlign = 'center'; ctx.fillStyle = '#13202a'; ctx.fillText(t, x, yE + 54);
      }
    }
    text(ctx, I.unidad === 'mm' ? 'regla: marcas de 1 mm · números en cm' : 'regla: marcas de 0,025 in · grandes = 1 in, pequeños = 0,1 in', 12, H - 12, 12.5, 'rgba(19,32,42,.6)', 'left', 600);
    text(ctx, I.unidad === 'mm' ? 'nonio: ' + N + ' divisiones · cada línea = ' + M.fmt(I.lc, I.dec) + ' mm' : 'nonio: 25 divisiones · cada línea = 0,001 in', W - 12, H - 12, 12.5, 'rgba(19,32,42,.6)', 'right', 600);
    // flecha del cero del nonio
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(ox + shift * scz, yE + 2); ctx.lineTo(ox + shift * scz - 5, yE + 12); ctx.lineTo(ox + shift * scz + 5, yE + 12); ctx.closePath(); ctx.fill();
    text(ctx, 'cero del nonio', ox + shift * scz, H - 12, 12, '#c0392b', 'center', 700);

    if (st.ayuda) {
      const L = M.lectura(I, p), xm = ox + (L.M * dmm - p) * scz, xk = ox + (L.k * vd) * scz + shift * scz;
      ctx.fillStyle = 'rgba(30,120,220,.18)'; ctx.fillRect(xm - 3, 0, 6, yE);
      pill(ctx, 'regla: ' + M.fmt(L.principal, I.unidad === 'mm' ? 0 : 3) + ' ' + I.unidad, Math.max(xm, 90), 26, 13, '#1b5fb5');
      ctx.fillStyle = 'rgba(230,120,20,.22)'; ctx.fillRect(xk - 3, yE - 24, 6, 70);
      ctx.strokeStyle = '#e07a14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(xk, yE + 2, 11, 0, 2 * PI); ctx.stroke();
      pill(ctx, 'coincide: línea ' + L.k, xk, yE + 84, 13, '#c4630a');
    }
  }
  function lupaVernier(ctx, W, H, st) {
    ctx.fillStyle = '#222e37'; ctx.fillRect(0, 0, W, H);
    lupaVernierBase(ctx, W, H, st, 1);
    if (st.lens) lente(ctx, W, H, st, lupaVernierBase);
  }
  /* lente de aumento: vuelve a dibujar la vista ampliada dentro de un círculo */
  function lente(ctx, W, H, st, fn) {
    const L = st.lens, r = L.r || 120, z = L.z || 6;
    ctx.save(); ctx.beginPath(); ctx.arc(L.x, L.y, r, 0, 2 * PI); ctx.clip();
    ctx.fillStyle = '#222e37'; ctx.fillRect(L.x - r, L.y - r, 2 * r, 2 * r);
    ctx.translate(L.x, L.y); ctx.scale(z, z); ctx.translate(-L.x, -L.y);
    fn(ctx, W, H, Object.assign({}, st, { lens: null }), 1 / z);
    ctx.restore();
    ctx.save(); ctx.lineWidth = 7; ctx.strokeStyle = '#3b4a56'; ctx.beginPath(); ctx.arc(L.x, L.y, r + 3, 0, 2 * PI); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = '#aab6c0'; ctx.beginPath(); ctx.arc(L.x, L.y, r + 6.5, 0, 2 * PI); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(L.x, L.y, r - 6, 3.6, 4.8); ctx.stroke();
    text(ctx, '×' + z, L.x + r - 8, L.y + r + 20, 12.5, 'rgba(255,255,255,.7)', 'right', 700, MONO);
    ctx.restore();
  }

  /* ======================================================================
     MICRÓMETRO · ESCENA
     ====================================================================== */
  const MI = { xa: 24, C: 40, yc: 0 };
  function sceneMicro(ctx, W, H, st) {
    const I = st.I, g = st.g, kind = st.kind, R = I.rangoMM, B = st.e0 || 0;
    const WW = 24 + MI.C + R + 22 + 12 + 24 + 4, sc = W / WW, px = 1 / sc, hs = H / sc;
    const xa = MI.xa, yc = hs / 2;
    bench(ctx, W, H);
    ctx.save(); ctx.scale(sc, sc);
    gridMM(ctx, sc, 0, WW, hs);
    const A = st.attr, S = st.S, mat = st.mat;
    const xSp = xa + g, edge = xa + g + MI.C, zero = xa + MI.C - B;
    // pieza
    if (A) pieza(ctx, A, S, xa, yc, { mat, sc, hmax: 26, etiqueta: st.etiqueta });
    // marco en C
    const fr = lin(ctx, 0, yc - 30, 0, yc + 30, [[0, '#4a5560'], [0.3, '#7d8a96'], [0.55, '#4a5560'], [1, '#2e3740']]);
    ctx.fillStyle = fr; ctx.beginPath();
    ctx.moveTo(xa - 24, yc + 24); ctx.lineTo(xa - 24, yc - 28); ctx.arcTo(xa - 24, yc - 29, xa - 22, yc - 29, 3); ctx.lineTo(xa + 32, yc - 29); ctx.lineTo(xa + 34, yc - 27);
    ctx.lineTo(xa + 34, yc + 6); ctx.lineTo(xa + 26, yc + 6); ctx.lineTo(xa + 26, yc - 18); ctx.lineTo(xa - 12, yc - 18); ctx.lineTo(xa - 12, yc + 24); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = px; ctx.stroke();
    // pastillas de aislamiento
    ctx.fillStyle = '#e8d6a0'; ctx.fillRect(xa - 17, yc - 5, 3, 10);
    // yunque
    ctx.fillStyle = lin(ctx, 0, yc - 4, 0, yc + 4, [[0, '#f4f7f9'], [0.5, '#bcc6ce'], [1, '#8b97a1']]); ctx.fillRect(xa - 12, yc - 3.4, 12, 6.8); ctx.strokeRect(xa - 12, yc - 3.4, 12, 6.8);
    // manguito (con la escala)
    const sleeveX0 = xa + 34, sleeveX1 = zero + R + 1.5;
    ctx.fillStyle = lin(ctx, 0, yc - 7.5, 0, yc + 7.5, [[0, '#f4f7f9'], [0.2, '#dbe2e7'], [0.5, '#c9d2d9'], [0.8, '#8f9ba5'], [1, '#bcc6ce']]);
    ctx.fillRect(sleeveX0, yc - 6.6, sleeveX1 - sleeveX0, 13.2); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeRect(sleeveX0, yc - 6.6, sleeveX1 - sleeveX0, 13.2);
    ctx.strokeStyle = '#13202a'; ctx.lineWidth = 0.9 * px; ctx.beginPath(); ctx.moveTo(sleeveX0, yc); ctx.lineTo(edge, yc); ctx.stroke();
    const pm = I.paso * I.f;
    for (let m = 0; ; m++) {
      const x = zero + m * pm; if (x > edge - 0.2 || x > sleeveX1) break; if (x < sleeveX0) continue;
      const mm = I.unidad === 'mm';
      const up = mm ? (m % 2 === 0 ? 3.8 : 0) : (m % 4 === 0 ? 3.8 : 2.2), dn = mm ? (m % 2 === 0 ? 0 : 2.6) : (m % 4 === 0 ? 3.8 : 2.2);
      ctx.beginPath(); ctx.moveTo(x, yc - up); ctx.lineTo(x, yc + dn); ctx.stroke();
    }
    // espiga del husillo (se ve entre el marco y el manguito)
    ctx.fillStyle = lin(ctx, 0, yc - 3.2, 0, yc + 3.2, [[0, '#f4f7f9'], [0.5, '#bcc6ce'], [1, '#8b97a1']]);
    ctx.fillRect(xSp, yc - 3.2, Math.max(0, xa + 26 - xSp), 6.4); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = px; ctx.strokeRect(xSp, yc - 3.2, Math.max(0, xa + 26 - xSp), 6.4);
    ctx.fillStyle = lin(ctx, 0, yc - 3.4, 0, yc + 3.4, [[0, '#f4f7f9'], [0.5, '#bcc6ce'], [1, '#8b97a1']]); ctx.fillRect(xSp, yc - 3.4, 3, 6.8); ctx.strokeRect(xSp, yc - 3.4, 3, 6.8);
    // tambor
    const Rt = 9.4;
    ctx.fillStyle = lin(ctx, 0, yc - Rt, 0, yc + Rt, [[0, '#7f8b95'], [0.2, '#eef2f5'], [0.5, '#c4cdd4'], [0.85, '#7f8b95'], [1, '#5f6b75']]);
    ctx.beginPath(); ctx.moveTo(edge, yc - 7.2); ctx.lineTo(edge + 6, yc - Rt); ctx.lineTo(edge + 23, yc - Rt); ctx.lineTo(edge + 23, yc + Rt); ctx.lineTo(edge + 6, yc + Rt); ctx.lineTo(edge, yc + 7.2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = px; ctx.stroke();
    // divisiones del tambor (vistas desde un lado)
    const nT = I.nT, tpos = (((pm !== 0) ? (((g + B) / pm) % 1 + 1) % 1 : 0)) * nT, dTh = 2 * PI / nT;
    ctx.strokeStyle = '#13202a'; ctx.lineWidth = 0.7 * px; ctx.beginPath();
    for (let j = -nT / 2; j <= nT / 2; j++) {
      const th = (j - (tpos % 1)) * dTh; if (Math.abs(th) > 1.25) continue;
      const y = yc - 7.2 * Math.sin(th); ctx.moveTo(edge + 0.2, y); ctx.lineTo(edge + 3, y);
    }
    ctx.stroke();
    // agarre moleteado y trinquete
    ctx.fillStyle = lin(ctx, 0, yc - 9.4, 0, yc + 9.4, [[0, '#2f3943'], [0.3, '#6a7783'], [0.55, '#46525d'], [1, '#222a32']]); ctx.fillRect(edge + 23, yc - 9.4, 3, 18.8);
    ctx.fillStyle = lin(ctx, 0, yc - 7, 0, yc + 7, [[0, '#2f3943'], [0.3, '#7a8793'], [0.6, '#46525d'], [1, '#222a32']]); rr(ctx, edge + 26, yc - 7.2, 12, 14.4, 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = px; ctx.beginPath(); for (let x = edge + 27.5; x < edge + 37.5; x += 1.5) { ctx.moveTo(x, yc - 7); ctx.lineTo(x, yc + 7); } ctx.stroke();
    // fuerza
    if (st.F > 0.4) flechas(ctx, [xa, xSp], yc - 12.5, st.F, sc, [1, -1]);
    if (st.partes) {
      const T = [
        ['Yunque', xa - 6, yc - 3, xa - 12, yc + 38], ['Husillo', xSp + 1.5, yc + 3, xSp + 16, yc + 38], ['Marco', xa - 22, yc - 16, xa - 14, yc - 40],
        ['Manguito (escala fija)', xa + 52, yc - 6, xa + 60, yc - 40], ['Tambor (escala móvil)', edge + 14, yc + 9, edge + 18, yc + 40], ['Trinquete', edge + 32, yc - 7, edge + 38, yc - 40],
        ['Línea de referencia', zero + R * 0.4, yc, zero + R * 0.5 + 6, yc + 24],
      ];
      T.forEach((l) => rotulo(ctx, l[0], l[3], l[4], l[1], l[2], sc));
    }
    ctx.restore();
    if (st.slip) text(ctx, '¡clic! el trinquete patina', W / 2, 30, 18, '#ffb36b', 'center', 700);
  }
  function ventanaM(I) { return { WW: 24 + MI.C + I.rangoMM + 22 + 12 + 24 + 4 }; }

  /* ======================================================================
     MICRÓMETRO · LUPA (manguito y tambor)
     ====================================================================== */
  function lupaMicroBase(ctx, W, H, st, lwf) {
    const I = st.I, pm = I.paso * I.f, nT = I.nT, nn = I.nonio || 1, p = st.p, lw = 1.35 * (lwf || 1);
    const cy = Math.round(H / 2), Rl = Math.min(150, H / 2 - 22), scz = 64 * (I.unidad === 'mm' ? 1 : 1), xe = Math.round(W * 0.6);
    const par = (st.par || 0) * PI / 180, dy = Math.tan(par) * 34;                   // paralaje: la referencia se corre respecto al tambor
    const dTh = 2 * PI / nT;
    const tpos = ((((p / pm) % 1) + 1) % 1) * nT;
    // manguito
    ctx.fillStyle = lin(ctx, 0, cy - Rl - 10, 0, cy + Rl + 10, [[0, '#a3afb9'], [0.12, '#f1f4f6'], [0.5, '#d3dae0'], [0.88, '#aab5be'], [1, '#6f7c87']]);
    ctx.fillRect(0, cy - Rl - 10, xe, 2 * Rl + 20);
    // tambor (borde cónico y cuerpo)
    ctx.fillStyle = lin(ctx, 0, cy - Rl - 30, 0, cy + Rl + 30, [[0, '#6d7a85'], [0.14, '#dfe5ea'], [0.5, '#b9c3cb'], [0.86, '#dfe5ea'], [1, '#56626d']]);
    ctx.beginPath(); ctx.moveTo(xe, cy - Rl - 10); ctx.lineTo(xe + 110, cy - Rl - 30); ctx.lineTo(W + 2, cy - Rl - 30); ctx.lineTo(W + 2, cy + Rl + 30); ctx.lineTo(xe + 110, cy + Rl + 30); ctx.lineTo(xe, cy + Rl + 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#27333d'; ctx.lineWidth = lw * 1.6; ctx.beginPath(); ctx.moveTo(xe, cy - Rl - 10); ctx.lineTo(xe, cy + Rl + 10); ctx.stroke();
    // marcas del manguito (solo las no cubiertas por el tambor)
    ctx.strokeStyle = '#13202a'; ctx.fillStyle = '#13202a'; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(0, cy + dy); ctx.lineTo(xe, cy + dy); ctx.stroke();
    const mmI = I.unidad === 'mm';
    for (let m = Math.max(0, Math.floor((p - xe / scz) / pm) - 1); m * pm <= p + 1e-9; m++) {
      const x = xe + (m * pm - p) * scz; if (x < -30 || x > xe - 1) continue;
      let up, dn, lab = null;
      if (mmI) { up = m % 2 === 0 ? 44 : 0; dn = m % 2 === 0 ? 0 : 30; if (m % 10 === 0) { up = 58; lab = String(m / 2); } }
      else { up = m % 4 === 0 ? 46 : 24; dn = m % 4 === 0 ? 46 : 24; if (m % 4 === 0) lab = String(m / 4); }
      ctx.beginPath(); ctx.moveTo(x, cy + dy - up); ctx.lineTo(x, cy + dy + dn); ctx.stroke();
      if (lab !== null) { ctx.font = '700 17px ' + SANS; ctx.textAlign = 'center'; ctx.fillText(lab, x, cy + dy - up - 7); }
    }
    text(ctx, mmI ? 'marcas superiores: 1 mm · inferiores: 0,5 mm' : 'cada marca: 0,025 in · numeradas: décimas de pulgada', 12, H - 8, 12.5, 'rgba(255,255,255,.62)', 'left', 600);
    // nonio del manguito
    if (nn > 1) {
      ctx.fillStyle = '#e6ebef'; ctx.fillRect(xe - 74, cy - Rl - 6, 70, 2 * Rl + 12);
      ctx.strokeStyle = '#13202a'; ctx.fillStyle = '#13202a'; ctx.lineWidth = lw;
      for (let i = 0; i <= nn; i++) {
        const y = cy + dy - Rl * Math.sin(0.9 * i * dTh), long = i % 5 === 0;
        ctx.beginPath(); ctx.moveTo(xe - (long ? 46 : 32), y); ctx.lineTo(xe - 2, y); ctx.stroke();
        if (long) { ctx.font = '700 15px ' + SANS; ctx.textAlign = 'right'; ctx.fillText(i === 5 ? '5' : '0', xe - 52, y + 5); }
      }
      ctx.beginPath(); ctx.moveTo(xe - 74, cy + dy); ctx.lineTo(xe - 2, cy + dy); ctx.stroke();
    }
    // graduaciones del tambor
    ctx.strokeStyle = '#13202a'; ctx.fillStyle = '#13202a';
    const j0 = Math.floor(tpos) - Math.ceil(nT / 4) - 1, j1 = Math.floor(tpos) + Math.ceil(nT / 4) + 1;
    for (let j = j0; j <= j1; j++) {
      const th = (j - tpos) * dTh; if (Math.abs(th) > 1.38) continue;
      const y = cy - Rl * Math.sin(th), long = (((j % 5) + 5) % 5) === 0, len = long ? 62 : 44;
      ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(xe + 3, y); ctx.lineTo(xe + 3 + len, y); ctx.stroke();
      if (long) { const lab = ((j % nT) + nT) % nT; ctx.font = '700 ' + Math.max(12, 17 * Math.cos(th)) + 'px ' + SANS; ctx.textAlign = 'left'; ctx.fillText(String(lab), xe + 72, y + 5 * Math.cos(th)); }
    }
    text(ctx, nn > 1 ? 'tambor: 50 divisiones · cada una = 0,01 mm · nonio: 0,001 mm' : (mmI ? 'tambor: 50 divisiones · cada una = 0,01 mm' : 'tambor: 25 divisiones · cada una = 0,001 in'), W - 12, H - 8, 12.5, 'rgba(255,255,255,.62)', 'right', 600);
    // índice (flecha en la línea de referencia)
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(8, cy + dy); ctx.lineTo(24, cy + dy - 7); ctx.lineTo(24, cy + dy + 7); ctx.closePath(); ctx.fill();

    if (st.ayuda) {
      const L = M.lectura(I, p), xs = xe + (L.s * pm - p) * scz;
      ctx.fillStyle = 'rgba(30,120,220,.2)'; ctx.fillRect(xs - 4, cy - 70, 8, 140);
      pill(ctx, 'manguito: ' + M.fmt(L.manguito, mmI ? 1 : 3) + ' ' + I.unidad, Math.min(Math.max(xs, 120), xe - 130), 26, 14, '#1b5fb5');
      ctx.fillStyle = 'rgba(230,120,20,.22)'; ctx.fillRect(xe, cy - 6, 150, 12);
      pill(ctx, 'tambor: línea ' + L.t, Math.min(xe + 220, W - 75), cy + 50, 14, '#c4630a');
      if (nn > 1) { const yv = cy + dy - Rl * Math.sin(0.9 * L.v * dTh); ctx.strokeStyle = '#e07a14'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(xe, yv, 13, 0, 2 * PI); ctx.stroke(); pill(ctx, 'nonio: línea ' + L.v, xe - 170, Math.min(H - 30, Math.max(60, yv + 5)), 14, '#c4630a'); }
    }
  }
  function lupaMicro(ctx, W, H, st) {
    ctx.fillStyle = '#222e37'; ctx.fillRect(0, 0, W, H);
    lupaMicroBase(ctx, W, H, st, 1);
    if (st.lens) lente(ctx, W, H, st, lupaMicroBase);
  }

  return { fit, sceneVernier, lupaVernier, sceneMicro, lupaMicro, ventanaV, ventanaM, dibujaInsetProf, geoLupaV, V, MI, MATC };
})();
