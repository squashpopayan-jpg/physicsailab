/* Capítulo 12 — Cajas y canalizaciones */
(function () {
  'use strict';
  const RT = window.RT, C = RT.L.C, N = RT.L.N;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1);

  RT.defineSim('volumen-caja', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    const PRE = {
      ls1: { n: 'Luminaria LS1: llegan F, N, R y T y salen F, N, R y T (14 AWG)', nc: 6, awg: '14', ap: 0, t: true, ab: false, caja: 'oct-38' },
      toma: { n: 'Toma de paso de 12 AWG: llegan F, N, T y salen F, N, T', nc: 4, awg: '12', ap: 1, t: true, ab: false, caja: 'rect-pvc' },
      doble: { n: 'Interruptor doble S1: F, N, R desde LS1 y N, R hacia LF (14 AWG)', nc: 5, awg: '14', ap: 1, t: true, ab: false, caja: 'rect-met' }
    };
    sim.group('Caso');
    sim.select('pre', { options: Object.keys(PRE).map((k) => [k, PRE[k].n]), value: 'ls1', onInput: (k) => { const p = PRE[k]; ['nc', 'ap'].forEach((x) => sim.ctl[x].set(p[x], true)); sim.ctl.awg.set(p.awg, true); sim.ctl.t.set(p.t, true); sim.ctl.ab.set(p.ab, true); sim.ctl.caja.set(p.caja, true); } });
    sim.group('Contenido');
    sim.slider('nc', { label: 'Conductores que entran o salen (sin las tierras)', min: 1, max: 12, step: 1, value: 6, fmt: f0 });
    sim.seg('awg', { label: 'Calibre', options: [['14', '14'], ['12', '12'], ['10', '10 AWG']], value: '14' });
    sim.slider('ap', { label: 'Aparatos montados (tomas o interruptores)', min: 0, max: 2, step: 1, value: 0, fmt: f0 });
    sim.check('t', { label: 'Lleva conductores de tierra', value: true });
    sim.check('ab', { label: 'Abrazaderas internas', value: false });
    sim.select('caja', { label: 'Caja', options: N.CAJAS.map((c) => [c.id, c.nombre]), value: 'oct-38' });
    sim.out('cuenta', 'Unidades de volumen');
    sim.out('req', 'Volumen requerido', { hl: true });
    sim.out('disp', 'Volumen de la caja');
    sim.out('ok', 'Resultado', { wide: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const conds = Array(sim.p.nc).fill(sim.p.awg);
      const req = C.volumenCaja({ conds, aparatos: sim.p.ap, tierras: sim.p.t ? 2 : 0, abrazaderas: sim.p.ab });
      const caja = N.CAJAS.find((c) => c.id === sim.p.caja);
      const u = conds.length + 2 * sim.p.ap + (sim.p.t ? 1 : 0) + (sim.p.ab ? 1 : 0);
      const pct = req / caja.vol;
      /* barra de ocupación */
      const x0 = W * 0.08, x1 = W * 0.92, y = H * 0.35, h = H * 0.18;
      const X = (v) => x0 + ((x1 - x0) * v) / Math.max(caja.vol * 1.4, req * 1.05);
      let acc = 0;
      const seg = (v, col, t) => { ctx.fillStyle = RT.alpha(col, 0.7); ctx.fillRect(X(acc), y, X(acc + v) - X(acc), h); if (X(acc + v) - X(acc) > 50) RT.text(ctx, t, (X(acc) + X(acc + v)) / 2, y + h / 2, { size: 11.5, align: 'center', baseline: 'middle', halo: true }); acc += v; };
      seg(conds.length * N.VOL_COND[sim.p.awg], '--c1', conds.length + ' conductores');
      if (sim.p.ap) seg(2 * sim.p.ap * N.VOL_COND[sim.p.awg], '--c4', sim.p.ap + ' aparato(s) × 2');
      if (sim.p.t) seg(N.VOL_COND[sim.p.awg], '--c3', 'tierras');
      if (sim.p.ab) seg(N.VOL_COND[sim.p.awg], '--c5', 'abrazaderas');
      ctx.strokeStyle = RT.col('--ink'); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X(caja.vol), y - 16); ctx.lineTo(X(caja.vol), y + h + 16); ctx.stroke();
      RT.text(ctx, 'capacidad de la caja ' + f0(caja.vol) + ' cm³', X(caja.vol), y - 22, { size: 12, align: 'center', weight: 600 });
      RT.text(ctx, 'requerido ' + f0(req) + ' cm³ (' + f0(100 * pct) + ' %)', X(req), y + h + 34, { size: 12, align: 'center', color: pct <= 1 ? '--ok' : '--bad', weight: 700 });
      sim.set('cuenta', u + ' × ' + C.fmt(N.VOL_COND[sim.p.awg], 1) + ' cm³ (' + sim.p.awg + ' AWG)');
      sim.set('req', f0(req) + ' cm³');
      sim.set('disp', f0(caja.vol) + ' cm³ · ' + caja.uso);
      sim.set('ok', pct <= 1 ? `<span class="chip ok">Cabe</span> ocupación ${f0(100 * pct)} %.` : `<span class="chip bad">No cabe</span> faltan ${f0(req - caja.vol)} cm³: use una caja mayor o un suplemento.`);
    });
  });

  RT.defineSim('llenado-tubo', function (sim) {
    const cv = sim.canvas({ aspect: 1.5, maxH: '520px' });
    sim.group('Tubo');
    sim.seg('tipo', { label: 'Tipo', options: [['PVC', 'PVC rígido'], ['EMT', 'EMT']], value: 'PVC' });
    sim.seg('d', { label: 'Diámetro', options: N.TUBOS.PVC.map((t) => [t.d, t.d + ' in']), value: '1/2' });
    sim.group('Conductores THHN/THWN-2');
    for (const a of ['14', '12', '10', '8', '6']) sim.slider('n' + a, { label: a + ' AWG', min: 0, max: 12, step: 1, value: a === '14' ? 3 : 0, fmt: f0 });
    sim.out('n', 'Conductores');
    sim.out('A', 'Área ocupada');
    sim.out('pct', 'Llenado', { hl: true });
    sim.out('min', 'Tubo mínimo');
    sim.out('aj', 'Ajuste de capacidad');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const conds = [];
      for (const a of ['6', '8', '10', '12', '14']) for (let i = 0; i < sim.p['n' + a]; i++) conds.push(a);
      const r = C.llenado(conds, sim.p.tipo, sim.p.d);
      const tubo = N.TUBOS[sim.p.tipo].find((t) => t.d === sim.p.d);
      const Rin = Math.sqrt(tubo.area / Math.PI), s = (Math.min(W * 0.6, H) * 0.44) / (tubo.de / 2);
      const cx = W * 0.36, cy = H * 0.5;
      ctx.beginPath(); ctx.arc(cx, cy, (tubo.de / 2) * s, 0, 7); ctx.fillStyle = RT.alpha(sim.p.tipo === 'PVC' ? '--ink-3' : '--c6', 0.35); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, Rin * s, 0, 7); ctx.fillStyle = RT.col('--canvas'); ctx.fill(); ctx.strokeStyle = RT.col('--ink-2'); ctx.lineWidth = 1.5; ctx.stroke();
      /* empaque por gravedad: cada conductor (del mayor al menor) baja hasta la posición válida más baja */
      const placed = [];
      const rad = conds.map((a) => Math.sqrt(N.AREA_THHN[a] / Math.PI));
      const order = conds.map((a, i) => i).sort((i, j) => rad[j] - rad[i]);
      const colors = ['--cond-negro', '--cond-blanco', '--cond-verde', '--cond-rojo', '--cond-amarillo', '--cond-azul'];
      const G = 70;
      for (const i of order) {
        const ri = rad[i];
        let best = null;
        for (let gy = G; gy >= 0 && !best; gy--) {
          const yy = -Rin + (2 * Rin * gy) / G;
          let cands = [];
          for (let gx = 0; gx <= G; gx++) {
            const xx = -Rin + (2 * Rin * gx) / G;
            if (Math.hypot(xx, yy) > Rin - ri + 1e-6) continue;
            if (placed.every((p) => Math.hypot(p[0] - xx, p[1] - yy) >= p[2] + ri - 1e-6)) cands.push([xx, yy]);
          }
          if (cands.length) { cands.sort((u, v) => Math.abs(u[0]) - Math.abs(v[0])); best = cands[0]; }
        }
        if (best) placed.push([best[0], best[1], ri, i]);
      }
      placed.forEach(([x, y, ri, i], k) => {
        ctx.beginPath(); ctx.arc(cx + x * s, cy + y * s, ri * s, 0, 7); ctx.fillStyle = RT.col(colors[k % colors.length]); ctx.fill(); ctx.strokeStyle = RT.alpha('--ink', 0.6); ctx.lineWidth = 1; ctx.stroke();
        const cu = Math.sqrt(C.awgArea(conds[i]) / Math.PI);
        ctx.beginPath(); ctx.arc(cx + x * s, cy + y * s, cu * s, 0, 7); ctx.fillStyle = '#C77A3A'; ctx.fill();
      });
      if (placed.length < conds.length) RT.text(ctx, 'no caben físicamente', cx, cy + Rin * s + 22, { size: 12, align: 'center', color: '--bad', weight: 700 });
      /* medidor de llenado */
      const bx = W * 0.72, by = H * 0.15, bh = H * 0.7, bw = 26;
      ctx.strokeStyle = RT.col('--ink-2'); ctx.strokeRect(bx, by, bw, bh);
      const fill = Math.min(1, r.area / tubo.area);
      ctx.fillStyle = RT.alpha(r.ok ? '--ok' : '--bad', 0.6); ctx.fillRect(bx, by + bh * (1 - fill), bw, bh * fill);
      const lim = r.lim; ctx.strokeStyle = RT.col('--bad'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - 6, by + bh * (1 - lim)); ctx.lineTo(bx + bw + 6, by + bh * (1 - lim)); ctx.stroke();
      RT.text(ctx, 'límite ' + f0(100 * lim) + ' %', bx + bw + 10, by + bh * (1 - lim), { size: 12, baseline: 'middle', color: '--bad', weight: 600 });
      RT.text(ctx, f0(100 * fill) + ' %', bx + bw / 2, by - 8, { size: 13, align: 'center', weight: 700 });
      sim.set('n', conds.length);
      sim.set('A', f1(r.area) + ' de ' + f0(tubo.area) + ' mm²');
      sim.set('pct', (r.pct === null ? '—' : f1(r.pct) + ' %') + ' ' + (r.ok ? '<span class="chip ok">cumple</span>' : '<span class="chip bad">excede</span>'));
      sim.set('min', r.minimo ? r.minimo.d + ' in (' + r.minimo.m + ' mm)' : 'más de 2 in');
      const port = conds.length; /* aproximación: todos portadores salvo una tierra por circuito no se distingue */
      sim.set('aj', port > 3 ? 'con más de 3 portadores: factor ' + C.fmt(C.factorN(port), 2) + ' (verifique cuáles son tierras)' : 'no aplica (3 o menos)');
    });
  });

  RT.defineSim('curvas-tramo', function (sim) {
    const cv = sim.canvas({ aspect: 2 });
    sim.group('Recorrido entre dos cajas');
    const curvas = [90, 0, 0, 0, 0, 90];
    for (let i = 0; i < 6; i++) sim.seg('c' + i, { label: 'Curva ' + (i + 1), options: [[0, '0°'], [45, '45°'], [90, '90°']], value: curvas[i] });
    sim.out('s', 'Suma de curvas', { hl: true });
    sim.out('r', 'Resultado', { wide: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const a = [0, 1, 2, 3, 4, 5].map((i) => +sim.p['c' + i]);
      const sum = a.reduce((s, v) => s + v, 0);
      /* camino: segmentos rectos y giros */
      let x = W * 0.08, y = H * 0.75, dir = -Math.PI / 2, acc = 0, cajaEn = -1;
      const pts = [[x, y]];
      const L0 = Math.min(W, H) * 0.14;
      ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const seg = (len) => { x += Math.cos(dir) * len; y += Math.sin(dir) * len; pts.push([x, y]); };
      seg(L0);
      a.forEach((ang, i) => {
        if (ang) { acc += ang; if (acc > 360 && cajaEn < 0) cajaEn = pts.length - 1; dir += (i % 2 ? -1 : 1) * (ang * Math.PI) / 180 * (i < 2 ? 1 : 1); }
        seg(L0 * 0.9);
      });
      ctx.strokeStyle = RT.col(sum <= 360 ? '--l-canal' : '--bad');
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      const caja = (p, t) => { ctx.fillStyle = RT.col('--surface'); ctx.strokeStyle = RT.col('--ink'); ctx.lineWidth = 2; ctx.fillRect(p[0] - 12, p[1] - 12, 24, 24); ctx.strokeRect(p[0] - 12, p[1] - 12, 24, 24); RT.text(ctx, t, p[0], p[1] + 28, { size: 11.5, align: 'center' }); };
      caja(pts[0], 'caja A');
      caja(pts[pts.length - 1], 'caja B');
      if (cajaEn > 0) { const p = pts[cajaEn]; ctx.strokeStyle = RT.col('--ok'); ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.strokeRect(p[0] - 14, p[1] - 14, 28, 28); ctx.setLineDash([]); RT.text(ctx, 'caja de paso aquí', p[0], p[1] - 22, { size: 11.5, align: 'center', color: '--ok', weight: 700 }); }
      sim.set('s', sum + '°');
      sim.set('r', sum <= 360 ? '<span class="chip ok">Cumple</span> no supera 360° entre puntos de halado.' : '<span class="chip bad">Excede</span> instale una caja de paso donde la suma llega a 360°.');
    });
  });
})();
