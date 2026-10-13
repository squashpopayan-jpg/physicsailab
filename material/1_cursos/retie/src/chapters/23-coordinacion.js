/* Capítulo 23 — Coordinación con la estructura */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C, R = L.R, N = L.N;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1), f2 = (v) => C.fmt(v, 2);

  RT.defineSim('tubo-losa', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.group('Losa');
    sim.seg('tipo', { label: 'Tipo', options: [['maciza', 'Maciza'], ['loseta', 'Aligerada (loseta)']], value: 'maciza', onInput: (v) => { sim.ctl.e.set(v === 'maciza' ? 0.12 : 0.05, true); } });
    sim.slider('e', { label: 'Espesor de concreto donde va el tubo', min: 0.04, max: 0.2, step: 0.005, value: 0.12, unit: 'm', fmt: (v) => C.fmt(100 * v, 1) + ' cm' });
    sim.group('Tubos');
    sim.seg('d', { label: 'Tubo PVC', options: N.TUBOS.PVC.slice(0, 4).map((t) => [t.d, t.d + ' in']), value: '1/2' });
    sim.slider('n', { label: 'Tubos paralelos', min: 1, max: 4, step: 1, value: 2, fmt: f0 });
    sim.slider('s', { label: 'Separación entre centros', min: 0.03, max: 0.25, step: 0.005, value: 0.1, unit: 'm', fmt: (v) => C.fmt(100 * v, 1) + ' cm' });
    sim.slider('r', { label: 'Recubrimiento inferior', min: 0.01, max: 0.05, step: 0.0025, value: 0.025, unit: 'm', fmt: (v) => C.fmt(1000 * v, 0) + ' mm' });
    sim.out('de', 'Diámetro exterior / límite e/3');
    sim.out('sep', 'Separación / mínimo 3 diámetros');
    sim.out('rec', 'Recubrimientos');
    sim.out('ok', 'Resultado', { wide: true, hl: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const t = N.TUBOS.PVC.find((x) => x.d === sim.p.d), de = t.de / 1000, e = sim.p.e, n = sim.p.n, s = sim.p.s, rc = sim.p.r;
      const chk = R.tuboEnLosa({ e, de: t.de, sep: s, rec: rc, n });
      const recSup = e - rc - de;
      const sc = Math.min((W - 60) / 0.9, (H - 60) / Math.max(0.2, e + 0.06));
      const x0 = 30, y0 = H / 2 - (e * sc) / 2;
      ctx.fillStyle = RT.col('--l-estr-fill'); ctx.fillRect(x0, y0, 0.9 * sc, e * sc);
      ctx.strokeStyle = RT.col('--l-estr'); ctx.lineWidth = 1.5; ctx.strokeRect(x0, y0, 0.9 * sc, e * sc);
      /* acero */
      ctx.fillStyle = RT.col('--ink-2');
      for (let k = 0; k < 9; k++) { const xx = x0 + (0.05 + k * 0.1) * sc; ctx.beginPath(); ctx.arc(xx, y0 + 0.025 * sc, 0.005 * sc, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(xx, y0 + (e - 0.025) * sc, 0.005 * sc, 0, 7); ctx.fill(); }
      /* tubos */
      const cy = y0 + (e - rc - de / 2) * sc;
      const xc = x0 + 0.45 * sc - ((n - 1) * s * sc) / 2;
      for (let k = 0; k < n; k++) {
        const xx = xc + k * s * sc;
        ctx.beginPath(); ctx.arc(xx, cy, (de / 2) * sc, 0, 7); ctx.fillStyle = RT.alpha('--ink-3', 0.5); ctx.fill(); ctx.strokeStyle = RT.col(chk.ok ? '--ok' : '--bad'); ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(xx, cy, (Math.sqrt(t.area / Math.PI) / 1000) * sc, 0, 7); ctx.fillStyle = RT.col('--canvas'); ctx.fill();
      }
      RT.text(ctx, `${C.fmt(100 * e, 1)} cm`, x0 + 0.9 * sc + 8, y0 + (e * sc) / 2, { size: 12, baseline: 'middle', color: '--ink-2' });
      sim.set('de', `${C.fmt(t.de, 1)} mm / ${C.fmt(chk.limD, 1)} mm ${chk.okD ? '✓' : '✗'}`);
      sim.set('sep', n < 2 ? 'un solo tubo' : `${C.fmt(100 * s, 1)} cm / ${C.fmt(100 * chk.limS, 1)} cm ${chk.okS ? '✓' : '✗'}`);
      sim.set('rec', `inferior ${C.fmt(1000 * rc, 0)} mm, superior ${C.fmt(1000 * recSup, 0)} mm ${chk.okR ? '✓' : '✗ (mínimo 20 mm)'}`);
      sim.set('ok', chk.ok ? '<span class="chip ok">Cumple</span> los criterios generales de NSR-10 C.6.3; el estructural confirma.' : '<span class="chip bad">No cumple</span> cambie de diámetro, sepárelos o lleve el tubo por otro elemento.');
    });
  });

  RT.defineSim('conflicto-viga', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.group('Interruptor en un muro bajo viga');
    sim.slider('d', { label: 'Distancia del punto a la cara de la columna', min: 0.1, max: 2.2, step: 0.05, value: 1.7, unit: 'm', fmt: f2 });
    sim.seg('sol', { label: 'Solución', options: [['camisa', 'Camisa en la viga'], ['piso', 'Desde el contrapiso'], ['mover', 'Mover a otro muro']], value: 'camisa' });
    sim.out('z', 'Zona de la viga', { hl: true });
    sim.out('r', 'Evaluación', { wide: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const hV = K.estructura.viga.h, conf = 2 * hV, d = sim.p.d, sol = sim.p.sol;
      const sx = (W - 60) / 3.1, sy = (H - 40) / 3.1, x0 = 20 + 0.3 * sx, yb = H - 20;
      const X = (x) => x0 + x * sx, Y = (z) => yb - (z + 0.3) * sy;
      /* columna, viga, losa, muro, contrapiso */
      ctx.fillStyle = RT.col('--l-estr-fill'); ctx.strokeStyle = RT.col('--l-estr'); ctx.lineWidth = 1.2;
      ctx.fillRect(X(-0.3), Y(K.H.topeLosa), 0.3 * sx, (K.H.topeLosa + 0.3) * sy); ctx.strokeRect(X(-0.3), Y(K.H.topeLosa), 0.3 * sx, (K.H.topeLosa + 0.3) * sy);
      ctx.fillRect(X(0), Y(K.H.topeLosa), 2.7 * sx, hV * sy); ctx.strokeRect(X(0), Y(K.H.topeLosa), 2.7 * sx, hV * sy);
      ctx.fillStyle = RT.alpha('--bad', 0.15); ctx.fillRect(X(0), Y(K.H.topeLosa), conf * sx, hV * sy);
      RT.text(ctx, 'zona de confinamiento 2h = ' + f2(conf) + ' m', X(conf / 2), Y(K.H.topeLosa) - 6, { size: 11.5, align: 'center', color: '--bad', weight: 600 });
      /* estribos */
      ctx.strokeStyle = RT.alpha('--ink-2', 0.7); ctx.lineWidth = 1;
      for (let x = 0.05; x < 2.7; x += x < conf ? 0.08 : 0.16) { ctx.beginPath(); ctx.moveTo(X(x), Y(K.H.topeLosa - 0.03)); ctx.lineTo(X(x), Y(K.H.fondoViga + 0.03)); ctx.stroke(); }
      ctx.fillStyle = RT.col('--l-muro-fill'); ctx.fillRect(X(0), Y(K.H.fondoViga), 2.7 * sx, K.H.fondoViga * sy);
      ctx.fillStyle = RT.col('--surface-3'); ctx.fillRect(X(-0.3), Y(0), 3.0 * sx, K.H.contrapiso * sy);
      RT.text(ctx, 'columna', X(-0.15), Y(1.2), { size: 11, align: 'center', color: '--ink-2' });
      RT.text(ctx, 'viga 0,30 × 0,35', X(2.2), Y(K.H.fondoViga + 0.17), { size: 11, align: 'center', color: '--ink-2' });
      RT.text(ctx, 'muro de mampostería', X(2.0), Y(0.9), { size: 11, align: 'center', color: '--ink-2' });
      /* recorrido */
      const zS = 1.2;
      ctx.strokeStyle = RT.col('--l-canal'); ctx.lineWidth = 3; ctx.beginPath();
      if (sol === 'camisa') { ctx.moveTo(X(d), Y(K.H.zLosa)); ctx.lineTo(X(d), Y(zS)); }
      else if (sol === 'piso') { ctx.moveTo(X(d), Y(-0.04)); ctx.lineTo(X(d), Y(zS)); }
      ctx.stroke();
      if (sol !== 'mover') { ctx.fillStyle = RT.col('--surface'); ctx.strokeStyle = RT.col('--ink'); ctx.lineWidth = 1.5; ctx.fillRect(X(d) - 7, Y(zS) - 10, 14, 20); ctx.strokeRect(X(d) - 7, Y(zS) - 10, 14, 20); RT.text(ctx, 'interruptor', X(d) + 12, Y(zS), { size: 11, baseline: 'middle' }); }
      else RT.text(ctx, 'el interruptor se traslada a un muro que no está bajo una viga', X(1.35), Y(1.6), { size: 12, align: 'center', color: '--ok', weight: 600 });
      const enConf = d < conf;
      sim.set('z', enConf ? 'Dentro de la zona de confinamiento' : 'Fuera de la zona de confinamiento');
      const txt = {
        camisa: enConf ? '<span class="chip bad">Evitar</span> el pase atraviesa la franja de estribos densos junto a la columna. Desplace el interruptor más de ' + f2(conf) + ' m de la cara de la columna.' : '<span class="chip mid">Coordinar</span> dejar una camisa de PVC vertical en la formaleta antes del vaciado, sin cortar estribos ni barras, con aprobación del estructural.',
        piso: '<span class="chip ok">Sin pase por la viga</span> el tubo sube desde el contrapiso; alarga el recorrido porque la fase y los retornos deben venir del circuito de alumbrado.',
        mover: '<span class="chip ok">Sin pase</span> la mejor opción cuando la arquitectura lo permite: no cambia la estructura.'
      }[sol];
      sim.set('r', txt);
    });
  });

  RT.defineSim('interferencias', function (sim) {
    const cv = sim.canvas({ aspect: 0.95, maxH: '760px' });
    const lista = R.interferencias(K);
    const plano = new RT.Plano(sim, cv, { capas: { conflictos: true, canal: true, ilum: true, tomas: true, esp: true, etiquetas: false, muebles: false } });
    plano.colorCirc = () => '--ink-3';
    sim.group('Filtro');
    sim.seg('t', { options: [['todo', 'Todo'], ['cruce', 'Cruces'], ['bajante', 'Bajantes'], ['caja', 'Cajas'], ['cim', 'Cimentación']], value: 'todo', onInput: (v) => { plano.capas.cim = v === 'cim' || v === 'todo'; } });
    let selI = null;
    plano.extra = (ctx, pl) => { if (selI) { ctx.beginPath(); ctx.arc(pl.X(selI.x), pl.Y(selI.y), 18, 0, 7); ctx.strokeStyle = RT.col('--accent'); ctx.lineWidth = 3; ctx.stroke(); } };
    const box = RT.el('div', 'stage-scroll');
    box.style.maxHeight = '300px';
    sim.stageCol.append(box);
    sim.out('n', 'Interferencias', { hl: true });
    sim.out('c', 'Críticas');
    sim.out('sel', 'Seleccionada', { wide: true });
    sim.onDraw(() => {
      plano.draw();
      const f = sim.p.t === 'todo' ? lista : lista.filter((i) => i.tipo === sim.p.t);
      box.innerHTML = '<ul class="hallazgos">' + f.map((i, k) => `<li data-k="${lista.indexOf(i)}" style="cursor:pointer">${RT.estadoChip(i.critico ? 'falla' : i.tipo === 'cim' ? 'ok' : 'aviso')}<span>${i.texto}</span></li>`).join('') + '</ul>';
      box.querySelectorAll('li[data-k]').forEach((li) => li.addEventListener('click', () => { selI = lista[+li.dataset.k]; sim.set('sel', selI.texto); sim.redraw(); }));
      sim.set('n', f.length + ' de ' + lista.length);
      sim.set('c', lista.filter((i) => i.critico).length);
      if (!selI) sim.set('sel', 'Haga clic en un renglón');
    });
  });

  RT.defineSim('coordinacion-3d', function (sim) {
    const v3 = new RT.Casa3D(sim, { aspect: 1.6, maxH: '600px', colorCirc: (c) => RT.COLCIRC[c] || '--l-canal' });
    sim.group('Escena');
    sim.seg('e', { options: [['coordinacion', 'Hall y baño'], ['cocina', 'Cocina'], ['general', 'General']], value: 'coordinacion', onInput: (e) => v3.escena(e) });
    sim.check('losa', { label: 'Losa', value: true });
    sim.check('muros', { label: 'Muros', value: true });
    sim.check('cim', { label: 'Vigas de cimentación', value: false });
    sim.out('i', 'Esferas', { wide: true });
    v3.escena('coordinacion');
    sim.onDraw(() => {
      if (!v3.ok) return;
      v3.aplicar({ piso: true, muros: sim.p.muros, columnas: true, vigas: true, losa: sim.p.losa, cim: sim.p.cim, puntos: true, tubos: true, inter: true, etiquetas: false, corte: null });
      v3.render();
      sim.set('i', 'Ámbar: cruces y bajantes por vigas que requieren aprobación estructural. Tubos coloreados por circuito.');
    });
  });
})();
