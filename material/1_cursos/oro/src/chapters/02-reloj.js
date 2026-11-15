/* Capítulo 2 — El reloj */
(function () {
  'use strict';
  const ML = window.ML, E = () => ML.L.eng;
  const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];

  /* Desfase de Nueva York: EDT (UTC−4) entre el segundo domingo de marzo y el primer domingo de noviembre */
  function nyOffset(tmin) {
    const y = new Date(tmin * 60000).getUTCFullYear();
    const nthSun = (m, n) => { const d0 = new Date(Date.UTC(y, m, 1)); const first = (7 - d0.getUTCDay()) % 7; return Date.UTC(y, m, 1 + first + 7 * (n - 1)) / 60000; };
    const a = nthSun(2, 2) + 7 * 60, b = nthSun(10, 1) + 6 * 60;    /* 02:00 local ≈ 07:00 UTC / 06:00 UTC */
    return tmin >= a && tmin < b ? -4 : -5;
  }

  /* ======================================================================
     2.1 Reloj y cambio de hora
     ====================================================================== */
  ML.defineSim('reloj-dst', function (sim) {
    const cv = sim.canvas({ aspect: 3.0, maxH: '300px' });
    sim.group('Fecha');
    sim.slider('doy', { label: 'Día del año 2026', min: 1, max: 365, step: 1, value: 195, fmt: (v) => { const d = new Date(Date.UTC(2026, 0, 1) + (v - 1) * 86400000); return d.toISOString().slice(0, 10); } });
    sim.out('md', 'Madrid respecto a UTC', { hl: true });
    sim.out('ny', 'Nueva York respecto a UTC');
    sim.out('win', 'Ventana de entradas en UTC');
    sim.out('dat', 'Datos de las 8:30 (Nueva York) en Madrid');
    sim.onDraw(() => {
      const d = new Date(Date.UTC(2026, 0, 1) + (sim.p.doy - 1) * 86400000), t0 = d.getTime() / 60000 + 720;
      const md = E().madridOffset(t0), ny = nyOffset(t0);
      const dat = 8.5 - ny + md;   /* hora de Madrid del dato 8:30 NY */
      sim.set('md', 'UTC+' + md + ' (' + (md === 2 ? 'verano' : 'invierno') + ')');
      sim.set('ny', 'UTC' + ny + ' (' + (ny === -4 ? 'verano' : 'invierno') + ')');
      sim.set('win', E().hhmm(537 - md * 60) + ' – ' + E().hhmm(780 - md * 60));
      const h = Math.floor(dat), m = Math.round((dat - h) * 60);
      sim.set('dat', String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + (Math.abs(dat - 14.5) > 0.1 ? ' <small>(desajuste)</small>' : ''));
      ML.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h, x0 = 40, x1 = W - 16, X = (hh) => x0 + (x1 - x0) * hh / 24;
      /* eje de horas de Madrid */
      const yA = 60, hh = 34;
      ctx.fillStyle = ML.alpha('--ink-3', 0.08); ctx.fillRect(x0, yA, x1 - x0, hh);
      ctx.fillStyle = ML.alpha('--c3', 0.30); ctx.fillRect(X(8.95), yA, X(13) - X(8.95), hh);
      ctx.fillStyle = ML.alpha('--c4', 0.35); ctx.fillRect(X(dat), yA, X(dat + 1) - X(dat), hh);
      ctx.fillStyle = ML.alpha('--c2', 0.28); ctx.fillRect(X(20), yA, X(24) - X(20), hh);
      ctx.strokeStyle = ML.col('--axis'); ctx.lineWidth = 1;
      for (let k = 0; k <= 24; k += 2) { const x = Math.round(X(k)) + 0.5; ctx.beginPath(); ctx.moveTo(x, yA + hh); ctx.lineTo(x, yA + hh + 5); ctx.stroke(); ML.text(ctx, String(k).padStart(2, '0'), x, yA + hh + 17, { size: 11, mono: true, color: '--ink-3', align: 'center' }); }
      ML.text(ctx, 'Hora de Madrid', x0, yA - 12, { size: 12.5, color: '--ink-2', weight: 600 });
      ML.text(ctx, 'ventana de entradas', (X(8.95) + X(13)) / 2, yA + hh / 2, { size: 11.5, color: '--c3', align: 'center', baseline: 'middle', weight: 700 });
      ML.text(ctx, 'datos NY', X(dat) + (X(dat + 1) - X(dat)) / 2, yA + hh / 2, { size: 10.5, color: '--exp-ink', align: 'center', baseline: 'middle', weight: 700 });
      ML.text(ctx, 'cierre', (X(20) + X(24)) / 2, yA + hh / 2, { size: 11, color: '--c2', align: 'center', baseline: 'middle', weight: 700 });
      /* el mismo día en UTC */
      const yB = yA + hh + 62;
      ctx.fillStyle = ML.alpha('--ink-3', 0.08); ctx.fillRect(x0, yB, x1 - x0, 14);
      const a = 8.95 - md, b = 13 - md;
      ctx.fillStyle = ML.alpha('--c3', 0.45); ctx.fillRect(X(a), yB, X(b) - X(a), 14);
      ML.text(ctx, 'La misma ventana en UTC: ' + E().hhmm(Math.round(a * 60)) + ' – ' + E().hhmm(Math.round(b * 60)), x0, yB - 8, { size: 12, color: '--ink-2', weight: 600 });
    });
  });

  /* ======================================================================
     2.2 Perfil horario de 16 años
     ====================================================================== */
  ML.defineSim('perfil-horario', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, maxH: '420px' });
    sim.group('Muestra');
    sim.seg('per', { label: 'Periodo', options: [['all', '2010–2026'], ['a', '2010–2019'], ['b', '2020–2026'], ['c', '2025–2026']], value: 'all' });
    sim.seg('reloj', { label: 'Reloj', options: [['mad', 'Madrid (con cambio de hora)'], ['fix', 'UTC+1 fijo']], value: 'mad' });
    sim.group('Ventana');
    sim.slider('a', { label: 'Inicio (hora)', min: 0, max: 23, step: 1, value: 9, fmt: (v) => ML.fix(v, 0) + ':00' });
    sim.slider('b', { label: 'Fin (hora)', min: 1, max: 24, step: 1, value: 13, fmt: (v) => ML.fix(v, 0) + ':00' });
    sim.out('share', 'Fracción del rango diario en la ventana', { hl: true });
    sim.out('clock', 'Fracción del reloj');
    sim.out('inw', 'Rango medio dentro de la ventana');
    sim.out('outw', 'Rango medio fuera de la ventana');
    sim.out('peak', 'Hora más movida');
    let pre = null;
    sim.withData(['h1'], (D) => {
      const S = D.h1, n = S.n;
      const hm = new Int8Array(n), hf = new Int8Array(n), yr = new Int16Array(n), ok = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        const off = E().madridOffset(S.t[i]);
        hm[i] = Math.floor((((S.t[i] + off * 60) % 1440) + 1440) % 1440 / 60);
        hf[i] = Math.floor((((S.t[i] + 60) % 1440) + 1440) % 1440 / 60);
        yr[i] = new Date(S.t[i] * 60000).getUTCFullYear();
        ok[i] = E().weekday(S.t[i] + off * 60) < 5 ? 1 : 0;
      }
      pre = { S, hm, hf, yr, ok };
      sim.redraw();
    });
    const inPer = (p, y) => p === 'all' || (p === 'a' && y <= 2019) || (p === 'b' && y >= 2020) || (p === 'c' && y >= 2025);
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!pre) return;
      const { S, hm, hf, yr, ok } = pre, p = sim.p, H = p.reloj === 'mad' ? hm : hf;
      const sum = new Float64Array(24), cnt = new Float64Array(24);
      for (let i = 0; i < S.n; i++) if (ok[i] && inPer(p.per, yr[i])) { sum[H[i]] += S.h[i] - S.l[i]; cnt[H[i]]++; }
      const prof = Array.from(sum, (s, h) => (cnt[h] ? s / cnt[h] : 0));
      const a = Math.min(p.a, p.b - 1), b = Math.max(p.b, a + 1);
      let inS = 0, inC = 0, outS = 0, outC = 0, tot = 0;
      for (let h = 0; h < 24; h++) { tot += sum[h]; if (h >= a && h < b) { inS += sum[h]; inC += cnt[h]; } else { outS += sum[h]; outC += cnt[h]; } }
      const ymax = Math.max(...prof) * 1.12;
      const pl = new ML.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.5, xmax: 23.5, ymin: 0, ymax, ml: 50, mb: 44, xlabel: 'Hora ' + (p.reloj === 'mad' ? 'de Madrid' : '(UTC+1 fijo)'), ylabel: 'Rango medio de la vela H1 (USD)', xticks: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22] });
      pl.frame();
      pl.band(a - 0.5, b - 0.5, { color: '--c3', alpha: 0.14 });
      ML.draw.bars(pl, prof.map((_, h) => h), prof, 0.78, { colors: prof.map((_, h) => (h >= a && h < b ? '--c3' : '--ink-3')), alpha: 0.8 });
      const pk = prof.indexOf(Math.max(...prof));
      sim.set('share', ML.pct(inS / tot, 1));
      sim.set('clock', ML.pct((b - a) / 24, 1));
      sim.set('inw', ML.usd(inS / inC, 2));
      sim.set('outw', ML.usd(outS / outC, 2));
      sim.set('peak', String(pk).padStart(2, '0') + ':00 (' + ML.usd(prof[pk], 2) + ')');
    });
  });

  /* ======================================================================
     2.3 Mapa hora × día
     ====================================================================== */
  ML.defineSim('mapa-hora-dia', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, maxH: '400px' });
    sim.out('cell', 'Celda', { hl: true, wide: true });
    sim.out('n', 'Velas en la celda');
    let grid = null, cnt = null, hit = null, sel = null;
    sim.withData(['m5'], (D) => {
      const S = D.m5, n = S.n;
      const sum = Array.from({ length: 5 }, () => new Float64Array(24)), c = Array.from({ length: 5 }, () => new Float64Array(24));
      for (let i = 0; i < n; i++) {
        const off = E().madridOffset(S.t[i]), m = S.t[i] + off * 60, wd = E().weekday(m);
        if (wd > 4) continue;
        const h = Math.floor((((m % 1440) + 1440) % 1440) / 60);
        sum[wd][h] += S.h[i] - S.l[i]; c[wd][h]++;
      }
      grid = []; cnt = c;
      for (let h = 0; h < 24; h++) grid.push(sum.map((row, d) => (c[d][h] > 50 ? row[h] / c[d][h] : NaN)));
      sim.redraw();
    });
    ML.pointer(cv, {
      hover: (x, y) => { if (!hit) return false; const c = hit.cell(x, y); sel = c; sim.redraw(); if (c && grid) { sim.set('cell', DAYS[c[1]] + ' ' + String(c[0]).padStart(2, '0') + ':00–' + String(c[0]).padStart(2, '0') + ':59 · rango medio ' + ML.usd(grid[c[0]][c[1]], 2)); sim.set('n', ML.fix(cnt[c[1]][c[0]], 0)); } return false; },
      leave: () => { sel = null; sim.redraw(); }
    });
    sim.onDraw(() => {
      ML.draw.clear(cv);
      if (!grid) return;
      const rect = { x: 54, y: 14, w: cv.w - 70, h: cv.h - 56 };
      /* x = día, y = hora (0 abajo) */
      const G = grid.map((row) => row.map((v) => v));
      const vmax = Math.max(...G.flat().filter((v) => v === v));
      const G2 = G.map((row) => row.map((v) => (v === v ? v / vmax : NaN)));
      const ctx = cv.ctx, R = 24, C = 5, cw = rect.w / C, ch = rect.h / R;
      for (let h = 0; h < R; h++) for (let d = 0; d < C; d++) {
        const v = G2[h][d], x = rect.x + d * cw, y = rect.y + h * ch;
        if (v !== v) { ctx.fillStyle = ML.alpha('--ink-3', 0.08); ctx.fillRect(x + 0.5, y + 0.5, cw - 1, ch - 1); continue; }
        const [r, g, b] = ML.cmap.viridis(v);
        ctx.fillStyle = ML.rgbStr([r, g, b]); ctx.fillRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
        if (h >= 9 && h < 13) { ctx.strokeStyle = ML.col('--c3'); ctx.lineWidth = 0.8; ctx.strokeRect(x + 1, y + 1, cw - 2, ch - 2); }
        if (sel && sel[0] === h && sel[1] === d) { ctx.strokeStyle = ML.col('--ink'); ctx.lineWidth = 2; ctx.strokeRect(x + 1.5, y + 1.5, cw - 3, ch - 3); }
        if (ch > 13) ML.text(ctx, ML.fix(grid[h][d], 1), x + cw / 2, y + ch / 2, { size: 10, mono: true, color: v > 0.55 ? '#1a1a1a' : '#ffffff', align: 'center', baseline: 'middle' });
      }
      ctx.font = `11px ${ML.FONT_MONO}`; ctx.fillStyle = ML.col('--ink-3'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      DAYS.forEach((s, d) => ctx.fillText(s.slice(0, 3), rect.x + (d + 0.5) * cw, rect.y + rect.h + 5));
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (let h = 0; h < 24; h += 2) ctx.fillText(String(h).padStart(2, '0'), rect.x - 5, rect.y + (h + 0.5) * ch);
      ML.text(ctx, 'Madrid', 4, rect.y - 2, { size: 11, color: '--ink-3' });
      ML.text(ctx, 'borde verde = ventana de entradas', rect.x + rect.w, rect.y + rect.h + 26, { size: 11, color: '--c3', align: 'right' });
      hit = { cell: (px, py) => { const d = Math.floor((px - rect.x) / cw), h = Math.floor((py - rect.y) / ch); return d >= 0 && d < C && h >= 0 && h < R ? [h, d] : null; } };
    });
  });
})();
