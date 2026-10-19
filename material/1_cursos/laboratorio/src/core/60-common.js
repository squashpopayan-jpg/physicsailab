/* ===================================================================
   60-common.js — Simulaciones compartidas por varios capítulos:
   · lego-modelo : instrucciones de armado paso a paso (vista isométrica)
   · conexion    : esquema de conexiones de la ESP32 con sus módulos
   =================================================================== */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, LG = MC.lego;

  /* ---------- Tabla de resultados de un experimento virtual ----------
     MC.results(sim, headers, {decimals:[...], title}) → {add(row), rows, clear(), undo(), col(i)} */
  MC.results = function (sim, headers, o = {}) {
    const box = MC.el('div', 'sim-html');
    box.style.paddingTop = '8px';
    box.style.borderTop = '1px solid var(--rule)';
    box.style.background = 'var(--surface)';
    sim.stageCol.append(box);
    const rows = [];
    const dec = o.decimals || [];
    const render = () => {
      const fmt = (v, i) => (typeof v === 'number' ? (dec[i] !== undefined ? MC.fix(v, dec[i]) : MC.sci(v, 4)) : v);
      box.innerHTML = `<div class="mini-label" style="margin:0">${o.title || 'Tabla de datos'} · ${rows.length} fila${rows.length === 1 ? '' : 's'}</div>` +
        (rows.length ? `<div class="sim-table"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v, i) => `<td>${fmt(v, i)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : `<div class="ctrl-note">${o.empty || 'Todavía no hay mediciones: use el botón «Medir» o «Agregar a la tabla».'}</div>`);
    };
    render();
    if (o.copy !== false) sim.dataCopy(() => ({ headers: headers.map((h) => h.replace(/<[^>]+>/g, '')), rows }), o.copyLabel || 'Copiar la tabla');
    const api = {
      rows, box,
      show(v) { box.hidden = !v; },
      add(r) { rows.push(r); render(); sim.redraw(); },
      clear() { rows.length = 0; render(); sim.redraw(); },
      undo() { rows.pop(); render(); sim.redraw(); },
      col(i) { return rows.map((r) => r[i]); },
      render
    };
    return api;
  };
  /* Gráfica de dispersión con ajuste lineal (opcional) en un rectángulo */
  MC.fitPlot = function (ctx, rect, xs, ys, o = {}) {
    const lo = (a, z) => (a.length ? Math.min(...a, ...(z ? [0] : [])) : 0), hi = (a, z) => (a.length ? Math.max(...a, ...(z ? [0] : [])) : 1);
    const [xl, xh] = o.xr || MC.niceRange(lo(xs, o.zeroX), hi(xs, o.zeroX), { zero: !!o.zeroX, minSpan: o.minX || 1e-9 });
    const [yl, yh] = o.yr || MC.niceRange(lo(ys, o.zeroY), hi(ys, o.zeroY), { zero: !!o.zeroY, minSpan: o.minY || 1e-9 });
    const P = new MC.Plot(ctx, Object.assign({ xmin: xl, xmax: xh, ymin: yl, ymax: yh, mt: o.title ? 26 : 14 }, rect, { xlabel: o.xlabel, ylabel: o.ylabel, title: o.title || '' }));
    P.frame();
    let f = null;
    if (xs.length >= 2 && o.fit !== false) {
      f = o.prop ? MC.lab.fitProp(xs, ys) : MC.lab.fitLine(xs, ys);
      if (f) P.fn(f.f, { color: o.fitColor || '--accent', width: 1.8 });
    }
    if (o.curve) P.fn(o.curve, { color: '--ink-3', dash: [5, 4], width: 1.4 });
    P.scatter(xs, ys, { color: o.color || '--c1', r: 4.2 });
    if (!xs.length) MC.text(ctx, o.emptyText || 'Agregue mediciones a la tabla', P.ix + P.iw / 2, P.iy + P.ih / 2, { size: 12.5, align: 'center', color: '--ink-3' });
    return { P, f };
  };

  /* ---------- Instrucciones LEGO ---------- */
  MC.defineSim('lego-modelo', function (sim, ds) {
    const model = LG.models[ds.model];
    if (!model) throw new Error('modelo LEGO inexistente: ' + ds.model);
    const n = model.steps.length;
    const cv = sim.canvas({ aspect: +ds.aspect || model.aspect || 1.45, label: 'Vista isométrica del montaje' });
    const cap = MC.el('div', 'sim-legend');
    cap.style.display = 'block';
    sim.stageCol.append(cap);
    const all = [];
    const stepOf = new Map();
    model.steps.forEach((s, i) => s.parts.forEach((p) => { all.push(p); stepOf.set(p, i + 1); }));

    sim.group('Armado paso a paso');
    sim.slider('paso', { label: 'Paso', min: 1, max: n, step: 1, value: ds.step ? +ds.step : n, fmt: (v) => `${Math.round(v)} de ${n}` });
    sim.button('Anterior', () => sim.ctl.paso.set(Math.max(1, Math.round(sim.p.paso) - 1)), { title: 'Paso anterior' });
    sim.button('Siguiente', () => sim.ctl.paso.set(Math.min(n, Math.round(sim.p.paso) + 1)), { title: 'Paso siguiente' });
    sim.button('Ver todo', () => sim.ctl.paso.set(n));
    sim.group('Vista');
    sim.seg('rot', { label: 'Girar el modelo', options: [[0, '0°'], [1, '90°'], [2, '180°'], [3, '270°']], value: model.rot || 0 });
    sim.check('hl', { label: 'Resaltar las piezas nuevas', value: true });
    sim.check('dims', { label: 'Mostrar medidas', value: !!(model.dims && model.dims.length) });
    if (!(model.dims && model.dims.length)) sim.ctl.dims.show(false);
    const bomBox = sim.note('');
    sim.dataCopy(() => ({ headers: ['Pieza', 'Color', 'Cantidad'], rows: LG.bom(all) }), 'Copiar la lista completa de piezas');

    sim.onDraw(() => {
      const ctx = cv.ctx;
      D.clear(cv);
      const k = Math.round(sim.p.paso);
      const rot = sim.p.rot;
      const parts = all.filter((p) => stepOf.get(p) <= k);
      const fresh = new Set(parts.filter((p) => stepOf.get(p) === k));
      const fit = LG.fit(all, { x: 0, y: 34, w: cv.w, h: cv.h - 40 }, rot, 22);
      /* sombra en el piso */
      LG.render(ctx, parts, { cx: fit.cx, cy: fit.cy, s: fit.s, rot, hl: sim.p.hl && k > 1 ? fresh : null });
      /* cotas */
      if (sim.p.dims && model.dims && k === n) {
        let cx0 = 0, cy0 = 0;
        if (rot) {
          const bb = all.reduce((a, p) => [Math.min(a[0], p.x), Math.max(a[1], p.x + p.w), Math.min(a[2], p.y), Math.max(a[3], p.y + p.d)], [Infinity, -Infinity, Infinity, -Infinity]);
          cx0 = (bb[0] + bb[1]) / 2; cy0 = (bb[2] + bb[3]) / 2;
        }
        const R = (pt) => { let [x, y, z] = pt; for (let i = 0; i < rot; i++) { const nx = cx0 - (y - cy0), ny = cy0 + (x - cx0); x = nx; y = ny; } return LG.project(x, y, z * LG.ZU, { cx: fit.cx, cy: fit.cy, s: fit.s }); };
        for (const dm of model.dims) {
          const a = R(dm.a), b = R(dm.b);
          D.dim(ctx, a[0], a[1], b[0], b[1], dm.label, { off: dm.off || 0, color: '--accent', labelColor: '--accent' });
        }
      }
      /* rótulo del paso */
      ctx.save();
      ctx.fillStyle = MC.col('--ink');
      ctx.fillRect(10, 8, 46, 26);
      ctx.restore();
      MC.text(ctx, String(k), 33, 21, { size: 17, weight: 700, align: 'center', baseline: 'middle', color: '--bg', family: MC.FONT_COND });
      MC.text(ctx, model.name, 64, 21, { size: 13, weight: 600, baseline: 'middle', color: '--ink-2' });
      const st = model.steps[k - 1];
      cap.innerHTML = `<b>Paso ${k}.</b> ${st.note || ''}`;
      const bom = LG.bom(model.steps[k - 1].parts);
      bomBox.innerHTML = '<b>Piezas de este paso</b><br>' + (bom.length ? bom.map(([a, b, c]) => `${c} × ${a}${b ? ' ' + b : ''}`).join('<br>') : '—');
    });
  });

  /* ---------- Esquema de conexiones ----------
     cfg = {aspect, board:{fx, fy, fh}, mods:[{id, label, fx, fy, fw, fh, pins:[...], fill}],
            nodes:{nombre:[fx, fy]}, parts:[{type:'res'|'cap'|'led', a, b, label}],
            wires:[{a:'esp:D5', b:'hc:Trig', c:'--wire-y', note}], notes:'texto'} */
  MC.defineSim('conexion', function (sim, ds) {
    const cfg = MC.wiring.cfgs[ds.cfg];
    if (!cfg) throw new Error('esquema inexistente: ' + ds.cfg);
    const cv = sim.canvas({ aspect: cfg.aspect || 1.55, label: 'Esquema de conexiones' });
    const info = MC.el('div', 'sim-legend');
    info.style.display = 'block';
    sim.stageCol.append(info);
    let hover = -1;
    let geo = null;
    sim.group('Mostrar');
    sim.check('names', { label: 'Nombres de los pines', value: true });
    sim.check('only', { label: 'Resaltar sólo el cable señalado', value: false });
    if (cfg.note) sim.note(cfg.note);
    const ptOf = (ref) => {
      const [k, p] = ref.split(':');
      if (k === 'esp') return geo.esp.pin(p);
      if (k === 'n') return geo.nodes[p];
      const m = geo.mods[k];
      return m ? m[p] : null;
    };
    MC.pointer(cv, {
      touch: 'pan-y',
      hover: (x, y) => {
        if (!geo) return false;
        let best = -1, bd = 16;
        cfg.wires.forEach((w, i) => {
          for (const r of [w.a, w.b]) { const p = ptOf(r); if (p) { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = i; } } }
          const a = ptOf(w.a), b = ptOf(w.b);
          if (a && b) { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + Math.abs(b[0] - a[0]) * (w.sag === undefined ? 0.12 : w.sag) / 2; const d = Math.hypot(mx - x, my - y); if (d < bd) { bd = d; best = i; } }
        });
        if (best !== hover) { hover = best; sim.redraw(); }
        return best >= 0 ? 'pointer' : false;
      },
      down: function (x, y) { this.hover(x, y); return null; },
      leave: () => { hover = -1; sim.redraw(); }
    });
    sim.onDraw(() => {
      const ctx = cv.ctx;
      D.clear(cv);
      const W = cv.w, H = cv.h;
      const bh = H * (cfg.board && cfg.board.fh ? cfg.board.fh : 0.9);
      const bw = bh / 2;
      const bx = W * (cfg.board && cfg.board.fx !== undefined ? cfg.board.fx : 0.05), by = H * (cfg.board && cfg.board.fy !== undefined ? cfg.board.fy : 0.05);
      const hlPins = [];
      if (hover >= 0) for (const r of [cfg.wires[hover].a, cfg.wires[hover].b]) if (r.startsWith('esp:')) hlPins.push(r.slice(4));
      const esp = D.esp32(ctx, bx, by, bw, { labels: sim.p.names, hl: hlPins });
      const mods = {};
      for (const m of cfg.mods || []) {
        mods[m.id] = D.module(ctx, W * m.fx, H * m.fy, W * m.fw, H * m.fh, m.label, { pins: m.pins, fill: m.fill, size: m.size });
      }
      const nodes = {};
      for (const k in cfg.nodes || {}) nodes[k] = [W * cfg.nodes[k][0], H * cfg.nodes[k][1]];
      geo = { esp, mods, nodes };
      for (const p of cfg.parts || []) {
        const a = ptOf(p.a), b = ptOf(p.b);
        if (!a || !b) continue;
        if (p.type === 'res') D.resistor(ctx, a[0], a[1], b[0], b[1], { label: p.label, mono: true });
        else if (p.type === 'cap') D.capacitor(ctx, a[0], a[1], b[0], b[1], { label: p.label, mono: true });
        else if (p.type === 'led') D.diode(ctx, a[0], a[1], b[0], b[1], { led: true, label: p.label });
        else if (p.type === 'coil') { D.line(ctx, a[0], a[1], b[0], b[1], { width: 1.8 }); D.coilSide(ctx, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 30, 46, 9); if (p.label) MC.text(ctx, p.label, (a[0] + b[0]) / 2 + 24, (a[1] + b[1]) / 2, { size: 12, color: '--ink-2', halo: true }); }
        else if (p.type === 'pot') { D.resistor(ctx, a[0], a[1], b[0], b[1], { label: p.label, mono: true }); }
        else if (p.type === 'bat') D.battery(ctx, a[0], a[1], b[0], b[1], { label: p.label });
        else D.line(ctx, a[0], a[1], b[0], b[1], { width: 1.8 });
      }
      cfg.wires.forEach((w, i) => {
        const a = ptOf(w.a), b = ptOf(w.b);
        if (!a || !b) return;
        const dim = sim.p.only && hover >= 0 && hover !== i;
        D.wire(ctx, a, b, w.c, { width: hover === i ? 4.2 : 2.6, alpha: dim ? 0.18 : 1, sag: w.sag === undefined ? 0.12 : w.sag, route: w.route ? w.route.map((q) => [W * q[0], H * q[1]]) : null });
      });
      for (const k in nodes) { if ((cfg.dots || []).includes(k)) D.circle(ctx, nodes[k][0], nodes[k][1], 3.2, { fill: '--ink' }); }
      for (const t of cfg.labels || []) MC.text(ctx, t.text, W * t.fx, H * t.fy, { size: t.size || 11.5, color: t.color || '--ink-2', halo: true, align: t.align || 'left', mono: t.mono });
      if (hover >= 0) {
        const w = cfg.wires[hover];
        info.innerHTML = `<b>${w.a.replace('esp:', 'ESP32 · ').replace(/^(\w+):/, (m, k) => (cfg.mods.find((q) => q.id === k) || {}).label + ' · ')} → ${w.b.replace('esp:', 'ESP32 · ').replace(/^(\w+):/, (m, k) => ((cfg.mods.find((q) => q.id === k) || {}).label || 'nodo') + ' · ')}</b>${w.note ? ' — ' + w.note : ''}`;
      } else info.innerHTML = 'Pase el cursor (o toque) sobre un cable o un pin para ver qué conecta.';
    });
  });
})();
