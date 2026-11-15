/* ===================================================================
   60-oro-ui.js — Utilidades del curso: formato de dinero y R, velas, histogramas,
   mapas de calor, carga de datos reales y panel de parámetros de la estrategia
   =================================================================== */
(function () {
  'use strict';
  const ML = window.ML;
  const el = ML.el;
  const M = ML.M;

  /* ---------- Formato ---------- */
  ML.usd = function (x, d = 0) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    const s = Math.abs(x).toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (x < 0 ? '−' : '') + '$' + s;
  };
  ML.usdS = (x, d = 0) => (x > 0 ? '+' : '') + ML.usd(x, d);
  ML.R = (x, d = 2) => (x === null || x === undefined || Number.isNaN(x) ? '—' : (x > 0 ? '+' : '') + ML.fix(x, d) + ' R');
  ML.pct = (x, d = 1) => (x === null || x === undefined || Number.isNaN(x) ? '—' : ML.fix(100 * x, d) + ' %');
  ML.pips = (x, d = 0) => ML.fix(x, d) + ' pips';
  ML.PLC = { win: '--c3', loss: '--c2', flat: '--ink-3' };

  /* ---------- Carga de datos en una simulación ---------- */
  ML.Sim.prototype.withData = function (names, fn) {
    const ph = el('div', 'sim-loading', 'Cargando series reales de XAUUSD…');
    this.stage.prepend(ph);
    Promise.all(names.map((n) => ML.L.eng.load(n))).then((arr) => {
      ph.remove();
      const D = {};
      names.forEach((n, i) => { D[n] = arr[i]; });
      try { fn(D); } catch (e) { this.fail(e); }
      this._resize();
      this.redraw();
    }).catch((e) => this.fail(e));
    return this;
  };

  /* ---------- Gráficos ---------- */
  const D = ML.draw;
  /* Velas japonesas sobre un Plot cuyo eje x es el índice de barra. bars = {o,h,l,c}; i0..i1 (exclusivo) */
  D.candles = function (pl, bars, i0, i1, o = {}) {
    const ctx = pl.ctx, n = i1 - i0;
    const w = Math.max(1, Math.min(14, (pl.iw / n) * 0.72));
    const up = ML.col('--c3'), dn = ML.col('--c2');
    pl.clip(() => {
      for (let i = i0; i < i1; i++) {
        const x = pl.X(i), yo = pl.Y(bars.o[i]), yc = pl.Y(bars.c[i]), yh = pl.Y(bars.h[i]), yl = pl.Y(bars.l[i]);
        const col = bars.c[i] >= bars.o[i] ? up : dn;
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(Math.round(x) + 0.5, yh); ctx.lineTo(Math.round(x) + 0.5, yl); ctx.stroke();
        const top = Math.min(yo, yc), hh = Math.max(1, Math.abs(yc - yo));
        if (bars.c[i] >= bars.o[i]) { ctx.globalAlpha = 0.85; ctx.fillRect(x - w / 2, top, w, hh); ctx.globalAlpha = 1; } else ctx.fillRect(x - w / 2, top, w, hh);
      }
    });
  };
  /* Barras verticales (histograma). xs = centros, ys = alturas */
  D.bars = function (pl, xs, ys, wdata, o = {}) {
    const ctx = pl.ctx;
    pl.clip(() => {
      xs.forEach((x, i) => {
        const y0 = pl.Y(Math.max(pl.o.ymin, 0)), y1 = pl.Y(ys[i]);
        const c = o.colors ? o.colors[i] : o.color || '--c1';
        ctx.fillStyle = c.startsWith('--') ? ML.col(c) : c;
        ctx.globalAlpha = o.alpha || 0.85;
        const xa = pl.X(x - wdata / 2), xb = pl.X(x + wdata / 2);
        ctx.fillRect(xa + 0.5, Math.min(y0, y1), Math.max(1, xb - xa - 1), Math.abs(y1 - y0));
        ctx.globalAlpha = 1;
      });
    });
  };
  /* Barras de error: puntos con intervalo. items [{x, m, lo, hi, color}] */
  D.errbars = function (pl, items) {
    const ctx = pl.ctx;
    pl.clip(() => {
      for (const it of items) {
        const x = pl.X(it.x), c = it.color ? (it.color.startsWith('--') ? ML.col(it.color) : it.color) : ML.col('--c1');
        ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x, pl.Y(it.lo)); ctx.lineTo(x, pl.Y(it.hi)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 3, pl.Y(it.lo)); ctx.lineTo(x + 3, pl.Y(it.lo)); ctx.moveTo(x - 3, pl.Y(it.hi)); ctx.lineTo(x + 3, pl.Y(it.hi)); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, pl.Y(it.m), 3.6, 0, 7); ctx.fill();
      }
    });
  };
  /* Color de ganancia/pérdida: t en [-1, 1] → verde (+) / rojo (−) sobre el fondo del lienzo */
  ML.cmapPL = function (t) {
    const mid = ML.rgb('--canvas'), pos = ML.rgb('--c3'), neg = ML.rgb('--c2');
    const s = M.clamp(Math.abs(t), 0, 1), e = t >= 0 ? pos : neg, k = Math.pow(s, 0.8);
    return [mid[0] + (e[0] - mid[0]) * k, mid[1] + (e[1] - mid[1]) * k, mid[2] + (e[2] - mid[2]) * k];
  };
  /* Mapa de calor. grid[r][c] (r=0 abajo), xs/ys etiquetas, vmax simétrico alrededor de 0.
     Devuelve {cell(px,py) → [r,c] | null}. */
  D.heat = function (ctx, rect, grid, o = {}) {
    const R = grid.length, C = grid[0].length;
    const cw = rect.w / C, ch = rect.h / R;
    let vmax = o.vmax;
    if (!vmax) { vmax = 0; for (const row of grid) for (const v of row) if (v === v && Math.abs(v) > vmax) vmax = Math.abs(v); vmax = vmax || 1; }
    ctx.save();
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const v = grid[r][c];
        const x = rect.x + c * cw, y = rect.y + (R - 1 - r) * ch;
        if (v !== v) { ctx.fillStyle = ML.alpha('--ink-3', 0.08); ctx.fillRect(x + 0.5, y + 0.5, cw - 1, ch - 1); continue; }
        ctx.fillStyle = ML.rgbStr(ML.cmapPL(v / vmax));
        ctx.fillRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
        if (o.sel && o.sel[0] === r && o.sel[1] === c) { ctx.strokeStyle = ML.col('--ink'); ctx.lineWidth = 2; ctx.strokeRect(x + 1.5, y + 1.5, cw - 3, ch - 3); }
        if (o.mark && o.mark(r, c)) { ctx.strokeStyle = ML.col('--ink-2'); ctx.lineWidth = 1; ctx.setLineDash([3, 2]); ctx.strokeRect(x + 2.5, y + 2.5, cw - 5, ch - 5); ctx.setLineDash([]); }
        if (o.text && cw > 34 && ch > 16) ML.text(ctx, o.text(v, r, c), x + cw / 2, y + ch / 2, { size: Math.min(11, cw / 4.6), mono: true, color: Math.abs(v / vmax) > 0.65 ? '#ffffff' : '--ink', align: 'center', baseline: 'middle' });
      }
    }
    ctx.font = `11px ${ML.FONT_MONO}`;
    ctx.fillStyle = ML.col('--ink-3');
    if (o.xlabels) { ctx.textAlign = 'center'; ctx.textBaseline = 'top'; o.xlabels.forEach((s, c) => ctx.fillText(s, rect.x + (c + 0.5) * cw, rect.y + rect.h + 4)); }
    if (o.ylabels) { ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; o.ylabels.forEach((s, r) => ctx.fillText(s, rect.x - 5, rect.y + (R - 1 - r + 0.5) * ch)); }
    if (o.xtitle) ML.text(ctx, o.xtitle, rect.x + rect.w / 2, rect.y + rect.h + 30, { size: 12.5, color: '--ink-2', align: 'center', weight: 500 });
    if (o.ytitle) { ctx.save(); ctx.translate(rect.x - 44, rect.y + rect.h / 2); ctx.rotate(-Math.PI / 2); ML.text(ctx, o.ytitle, 0, 0, { size: 12.5, color: '--ink-2', align: 'center', baseline: 'middle', weight: 500 }); ctx.restore(); }
    ctx.restore();
    return { cell: (px, py) => { const c = Math.floor((px - rect.x) / cw), r = R - 1 - Math.floor((py - rect.y) / ch); return c >= 0 && c < C && r >= 0 && r < R ? [r, c] : null; } };
  };
  /* Dibuja el recuadro de una línea de tiempo horaria con una banda sombreada */
  D.hourBand = function (pl, a, b, color) { pl.band(a, b, { color: color || '--accent', alpha: 0.12 }); };

  /* ---------- Panel de parámetros de la estrategia ----------
     Crea grupos de deslizadores con los mismos nombres que los parámetros del motor.
     groups: subconjunto de ['horario','entrada','salida','gestion','riesgo','costos']. Devuelve {get()}. */
  const SPEC = {
    horario: [
      ['ws', { label: 'Inicio de entradas (Madrid)', min: 420, max: 720, step: 3, value: 537, fmt: (v) => ML.L.eng.hhmm(Math.round(v)) }],
      ['we', { label: 'Fin de entradas (Madrid)', min: 600, max: 1080, step: 15, value: 780, fmt: (v) => ML.L.eng.hhmm(Math.round(v)) }],
      ['tstop', { label: 'Cierre forzoso (Madrid)', min: 720, max: 1260, step: 10, value: 1200, fmt: (v) => ML.L.eng.hhmm(Math.round(v)) }]
    ],
    entrada: [
      ['modo', { type: 'select', label: 'Regla de entrada', options: [['tocar', 'Tocar el extremo de 30 min y rechazar (manual)'], ['zona', 'Zona del máximo de 2 h con EMA+40 (motor v1.2)'], ['ruptura', 'Ruptura a favor (momento)'], ['ema', 'Rechazo en la EMA20 de M15']], value: 'tocar' }],
      ['w1m', { label: 'Extremo corto (min)', min: 10, max: 90, step: 5, value: 30, fmt: (v) => ML.fix(v, 0) }],
      ['w2m', { label: 'Extremo medio (min)', min: 60, max: 360, step: 10, value: 120, fmt: (v) => ML.fix(v, 0) }],
      ['maxdist', { label: 'Anti-persecución (pips)', min: 2, max: 30, step: 1, value: 8, fmt: (v) => ML.fix(v, 0) }],
      ['dema', { label: 'Distancia a la EMA20 (pips)', min: 0, max: 80, step: 5, value: 0, fmt: (v) => ML.fix(v, 0) }],
      ['banda', { label: 'Banda neutra H4 (pips)', min: 0, max: 200, step: 5, value: 15, fmt: (v) => ML.fix(v, 0) }],
      ['rechazo', { type: 'check', label: 'Exigir vela de rechazo', value: true }],
      ['dir', { type: 'seg', label: 'Dirección', options: [['ambas', 'Ambas'], ['venta', 'Solo venta'], ['compra', 'Solo compra']], value: 'ambas' }],
      ['contra', { type: 'check', label: 'Permitir contra-tendencia', value: false }]
    ],
    salida: [
      ['slk', { label: 'Stop = k × ATR14 M15', min: 0.3, max: 3, step: 0.1, value: 0.8, fmt: (v) => ML.fix(v, 1) }],
      ['slmin', { label: 'Stop mínimo (pips)', min: 10, max: 120, step: 5, value: 45, fmt: (v) => ML.fix(v, 0) }],
      ['slmax', { label: 'Stop máximo (pips)', min: 30, max: 250, step: 5, value: 60, fmt: (v) => ML.fix(v, 0) }],
      ['tpk', { label: 'Take profit = k × ATR14 M15', min: 0.4, max: 5, step: 0.1, value: 1.4, fmt: (v) => ML.fix(v, 1) }],
      ['tpmin', { label: 'TP mínimo (pips)', min: 20, max: 300, step: 5, value: 80, fmt: (v) => ML.fix(v, 0) }],
      ['tpmax', { label: 'TP máximo (pips)', min: 40, max: 500, step: 5, value: 100, fmt: (v) => ML.fix(v, 0) }]
    ],
    gestion: [
      ['sld', { type: 'check', label: 'SL defensivo', value: true }],
      ['sldact', { label: '… se activa a +pips', min: 5, max: 80, step: 1, value: 20, fmt: (v) => ML.fix(v, 0) }],
      ['sldpips', { label: '… SL pasa a −pips', min: 0, max: 60, step: 1, value: 20, fmt: (v) => ML.fix(v, 0) }],
      ['be', { type: 'check', label: 'Break-even proporcional', value: true }],
      ['beratio', { label: '… a la fracción del TP', min: 0.1, max: 0.9, step: 0.02, value: 0.42, fmt: (v) => ML.fix(v, 2) }],
      ['bemargin', { label: '… SL a entrada + pips', min: 0, max: 30, step: 1, value: 5, fmt: (v) => ML.fix(v, 0) }],
      ['stag', { type: 'check', label: 'Salida por estancamiento', value: true }],
      ['stagmin', { label: '… tras minutos', min: 10, max: 120, step: 5, value: 30, fmt: (v) => ML.fix(v, 0) }]
    ],
    riesgo: [
      ['risk', { label: 'Riesgo por operación (USD)', min: 25, max: 1000, step: 25, value: 125, fmt: (v) => ML.usd(v) }],
      ['balas', { label: 'Balas por día', min: 1, max: 5, step: 1, value: 2, fmt: (v) => ML.fix(v, 0) }],
      ['onedone', { type: 'check', label: 'One and Done tras el primer TP', value: true }],
      ['meta', { label: 'Meta diaria (USD)', min: 50, max: 1000, step: 10, value: 180, fmt: (v) => ML.usd(v) }],
      ['maxloss', { label: 'Tope de pérdida diaria (USD)', min: 100, max: 1000, step: 10, value: 250, fmt: (v) => ML.usd(v) }]
    ],
    costos: [
      ['comm', { label: 'Comisión (USD por lote, ida y vuelta)', min: 0, max: 15, step: 0.5, value: 0, fmt: (v) => ML.usd(v, 1) }],
      ['slip', { label: 'Deslizamiento en la entrada (pips)', min: 0, max: 5, step: 0.5, value: 0, fmt: (v) => ML.fix(v, 1) }],
      ['pess', { type: 'check', label: 'Orden intrabarra pesimista', value: false }],
      ['compsp', { type: 'check', label: 'Compensar el spread en el SL', value: true }]
    ]
  };
  ML.STRAT_SPEC = SPEC;
  ML.stratPanel = function (sim, groups, init = {}, titles = {}) {
    const NAMES = { horario: 'Horario', entrada: 'Entrada', salida: 'Salida', gestion: 'Gestión de la operación', riesgo: 'Riesgo y candados', costos: 'Costos y supuestos' };
    for (const g of groups) {
      sim.group(titles[g] || NAMES[g]);
      for (const [id, o0] of SPEC[g]) {
        const o = Object.assign({}, o0);
        if (init[id] !== undefined) o.value = init[id];
        if (o.type === 'select') sim.select(id, o);
        else if (o.type === 'check') sim.check(id, o);
        else if (o.type === 'seg') sim.seg(id, o);
        else sim.slider(id, o);
      }
    }
    return {
      get() {
        const P = {};
        for (const k of Object.keys(ML.L.eng.DEFAULTS)) if (sim.p[k] !== undefined) P[k] = sim.p[k];
        return ML.L.eng.params(P);
      }
    };
  };
})();
