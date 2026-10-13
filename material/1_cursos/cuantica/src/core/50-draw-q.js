/* ===================================================================
   50-draw-q.js — Ayudantes de dibujo propios del curso:
   átomos por especie, redes de panal de hBN-MC, niveles de energía,
   funciones de onda con fase en color, tablas numéricas pequeñas.
   =================================================================== */
(function () {
  'use strict';
  const CQ = window.CQ;
  const C = (c) => (c && c.startsWith && c.startsWith('--') ? CQ.col(c) : c);
  const D = CQ.draw;

  /* Colores por especie (B, N, C, H, vacancia X) */
  CQ.spColor = function (sp) {
    return { B: CQ.col('--atB'), N: CQ.col('--atN'), C: CQ.col('--atC'), H: CQ.col('--atH'), X: CQ.col('--atV') }[sp] || CQ.col('--ink-3');
  };
  CQ.SPCODE = ['X', 'N', 'B', 'C'];

  /* Átomo: círculo con brillo y letra opcional */
  D.atom = function (ctx, x, y, r, sp, o = {}) {
    ctx.save();
    if (sp === 'X') {
      ctx.setLineDash([2.5, 2.5]);
      ctx.strokeStyle = CQ.col('--ink-3');
      ctx.globalAlpha = o.alpha === undefined ? 0.55 : o.alpha;
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, 2 * Math.PI); ctx.stroke();
      ctx.restore();
      return;
    }
    const col = CQ.spColor(sp);
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    if (r > 5 && o.flat !== true) {
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.15, x, y, r);
      g.addColorStop(0, CQ.shade(col, 1.35));
      g.addColorStop(1, col);
      ctx.fillStyle = g;
    } else ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill();
    ctx.lineWidth = o.sel ? 2.5 : 0.8;
    ctx.strokeStyle = o.sel ? CQ.col('--accent') : sp === 'H' ? CQ.col('--ink-3') : CQ.alpha('#000000', 0.28);
    ctx.stroke();
    if (o.label && r >= 7) {
      ctx.fillStyle = sp === 'H' ? '#222' : sp === 'C' && !CQ.isDark() ? '#fff' : sp === 'C' ? '#111' : '#fff';
      ctx.font = `700 ${Math.round(r * 1.05)}px ${CQ.FONT_UI}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(sp, x, y + 0.5);
    }
    ctx.restore();
  };

  /* Red de hBN-MC (P.hbn.Lattice) en una View2D. o: {r, showH, label, highlight:Set, bondW} */
  CQ.drawLattice = function (view, lat, o = {}) {
    const ctx = view.cv.ctx, g = lat.g, s = lat.s;
    const r = o.r || Math.max(2, 0.3 * view.s);
    const X = (k) => view.X(g.x[k]), Y = (k) => view.Y(g.y[k]);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = o.bondW || Math.max(1, 0.12 * view.s);
    /* enlaces entre átomos (se omiten los que cruzan el borde periódico) */
    ctx.strokeStyle = CQ.alpha('--ink-3', 0.55);
    ctx.beginPath();
    for (let k = 0; k < lat.N; k++) {
      if (!s[k]) continue;
      for (let q = 0; q < 3; q++) {
        const m = g.nb[3 * k + q];
        if (m < k || !s[m]) continue;
        if (Math.abs(g.x[m] - g.x[k]) > 1.5 || Math.abs(g.y[m] - g.y[k]) > 1.5) continue;
        ctx.moveTo(X(k), Y(k)); ctx.lineTo(X(m), Y(m));
      }
    }
    ctx.stroke();
    /* hidrógenos de pasivación: sobre el enlace hacia cada vacancia vecina */
    const hs = [];
    if (o.showH !== false) {
      for (let k = 0; k < lat.N; k++) {
        if (!s[k]) continue;
        for (let q = 0; q < 3; q++) {
          const m = g.nb[3 * k + q];
          if (s[m]) continue;
          const [dx, dy] = lat.rel(k, m);
          hs.push([g.x[k] + 0.42 * dx, g.y[k] + 0.42 * dy, k]);
        }
      }
      ctx.strokeStyle = CQ.alpha('--ink-3', 0.8);
      ctx.beginPath();
      for (const [hx, hy, k] of hs) { ctx.moveTo(X(k), Y(k)); ctx.lineTo(view.X(hx), view.Y(hy)); }
      ctx.stroke();
    }
    ctx.restore();
    if (o.vac !== false) for (let k = 0; k < lat.N; k++) if (!s[k]) D.atom(ctx, X(k), Y(k), r, 'X', { alpha: 0.35 });
    for (let k = 0; k < lat.N; k++) if (s[k]) D.atom(ctx, X(k), Y(k), r, CQ.SPCODE[s[k]], { label: o.label, sel: o.highlight && o.highlight.has(k) });
    for (const [hx, hy] of hs) D.atom(ctx, view.X(hx), view.Y(hy), Math.max(1.6, r * 0.55), 'H');
    return hs.length;
  };

  /* Niveles de energía horizontales con etiqueta: levels [{E, label, color, dash, x0, x1}] en una Plot */
  CQ.drawLevels = function (plot, levels, o = {}) {
    for (const L of levels) {
      plot.clip((ctx) => {
        ctx.save();
        ctx.strokeStyle = C(L.color || '--ink-2');
        ctx.lineWidth = L.width || 1.6;
        ctx.setLineDash(L.dash || []);
        ctx.beginPath();
        ctx.moveTo(plot.X(L.x0 === undefined ? plot.o.xmin : L.x0), plot.Y(L.E));
        ctx.lineTo(plot.X(L.x1 === undefined ? plot.o.xmax : L.x1), plot.Y(L.E));
        ctx.stroke();
        ctx.restore();
      });
      if (L.label) CQ.text(plot.ctx, L.label, plot.X(L.x1 === undefined ? plot.o.xmax : L.x1) - 4, plot.Y(L.E) - 4, { size: 11, color: L.color || '--ink-2', align: 'right', halo: true, mono: o.mono });
    }
  };

  /* Color por fase compleja (rueda de matiz); a = amplitud normalizada 0..1 */
  CQ.phaseRGB = function (re, im, a = 1) {
    const ph = Math.atan2(im, re); /* −π..π */
    const hue = ((ph / (2 * Math.PI)) + 1) % 1;
    const h6 = hue * 6, i = Math.floor(h6), f = h6 - i;
    const v = 1, s = 0.78;
    const p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f));
    const rgb = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6];
    const bg = CQ.rgb('--canvas');
    const k = Math.max(0, Math.min(1, a));
    return [bg[0] + (rgb[0] * 235 - bg[0]) * k, bg[1] + (rgb[1] * 235 - bg[1]) * k, bg[2] + (rgb[2] * 235 - bg[2]) * k];
  };
  /* Curva de ψ(x) coloreada por la fase, con relleno |ψ|² hacia una línea base */
  CQ.drawPhaseCurve = function (plot, x, re, im, o = {}) {
    const ctx = plot.ctx, base = o.base || 0, scale = o.scale || 1;
    plot.clip(() => {
      for (let i = 0; i < x.length - 1; i++) {
        const a2 = (re[i] * re[i] + im[i] * im[i]) * scale;
        const col = CQ.phaseRGB(re[i], im[i], 1);
        ctx.fillStyle = CQ.rgbStr(col, 0.9);
        const x0 = plot.X(x[i]), x1 = plot.X(x[i + 1]);
        const y0 = plot.Y(base), y1 = plot.Y(base + a2);
        ctx.fillRect(x0, Math.min(y0, y1), Math.max(1, x1 - x0 + 0.6), Math.abs(y1 - y0));
      }
    });
  };

  /* Tabla HTML compacta para una matriz (lista de filas) */
  CQ.matHTML = function (M, o = {}) {
    const f = o.fmt || ((v) => CQ.fix(v, 3));
    let h = `<div class="sim-mat">${o.cap ? `<div class="cap">${o.cap}</div>` : ''}<table>`;
    M.forEach((row, i) => {
      h += '<tr>' + (o.rowLab ? `<td class="lab">${o.rowLab[i]}</td>` : '');
      row.forEach((v, j) => { h += `<td class="${j === 0 ? 'br' : ''}${j === row.length - 1 ? ' bl' : ''}">${f(v)}</td>`; });
      h += '</tr>';
    });
    return h + '</table></div>';
  };

  /* Histograma de barras en una Plot */
  CQ.drawHist = function (plot, h, o = {}) {
    const ctx = plot.ctx;
    plot.clip(() => {
      ctx.fillStyle = CQ.alpha(o.color || '--c1', o.alpha || 0.45);
      ctx.strokeStyle = C(o.color || '--c1');
      ctx.lineWidth = 1;
      const vals = o.counts ? h.counts : h.dens;
      for (let b = 0; b < h.nb; b++) {
        const x0 = plot.X(h.lo + b * h.w), x1 = plot.X(h.lo + (b + 1) * h.w);
        const y0 = plot.Y(0), y1 = plot.Y(vals[b]);
        ctx.fillRect(x0 + 0.5, y1, Math.max(1, x1 - x0 - 1), y0 - y1);
      }
    });
  };

  /* Diagrama de niveles en columnas (moléculas): cols [{x, levels:[{E, occ}], label}] */
  CQ.drawMOcolumn = function (plot, x, w, E, o = {}) {
    const ctx = plot.ctx;
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ink');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(plot.X(x - w / 2), plot.Y(E)); ctx.lineTo(plot.X(x + w / 2), plot.Y(E));
    ctx.stroke();
    /* electrones como flechas */
    const occ = o.occ || 0;
    for (let e = 0; e < occ; e++) {
      const xx = plot.X(x) + (occ === 2 ? (e ? 5 : -5) : 0);
      const up = e === 0;
      CQ.draw.arrow(ctx, xx, plot.Y(E) + (up ? 8 : -8), xx, plot.Y(E) + (up ? -8 : 8), { color: o.ecolor || '--accent', width: 1.6, head: 5 });
    }
    ctx.restore();
  };
})();
