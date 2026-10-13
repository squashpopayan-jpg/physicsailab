/* Capítulo 17 — Escoger el caso y preparar los planos base */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C;
  const f2 = (v) => C.fmt(v, 2);

  /* ---------- 17.1 Planos base por capas ---------- */
  RT.defineSim('plano-base', function (sim) {
    const cv = sim.canvas({ aspect: 0.95, maxH: '760px' });
    const plano = new RT.Plano(sim, cv, { capas: { cotas: true } });
    sim.group('Capas');
    const capa = (id, label, v) => sim.check(id, { label, value: v, onInput: (x) => { plano.capas[id] = x; } });
    capa('ejes', 'Ejes estructurales', true);
    capa('estr', 'Columnas y vigas aéreas', true);
    capa('cim', 'Vigas de cimentación', false);
    capa('cotas', 'Cotas', true);
    capa('muebles', 'Mobiliario fijo', true);
    capa('nombres', 'Nombres y áreas', true);
    sim.out('ac', 'Área construida (por fuera)', { hl: true });
    sim.out('al', 'Suma de áreas libres');
    sim.out('am', 'Área ocupada por muros y columnas');
    sim.out('cols', 'Columnas · vigas aéreas');
    sim.outSep('Selección');
    sim.out('sel', 'Elemento', { wide: true });
    plano.onPick = (h) => { sim.set('sel', h ? h.tip : 'Haga clic en un ambiente, una columna o un punto'); };
    sim.onDraw(() => {
      plano.draw();
      const ac = K.areaConstruida(), al = K.ambientes.reduce((s, a) => s + K.areaLibre(a), 0);
      sim.set('ac', f2(ac) + ' m²');
      sim.set('al', f2(al) + ' m²');
      sim.set('am', f2(ac - al) + ' m² (' + C.fmt((100 * (ac - al)) / ac, 1) + ' %)');
      sim.set('cols', K.columnas().length + ' · ' + K.vigas(false).length + ' tramos');
      if (!plano.sel) sim.set('sel', 'Haga clic en un ambiente, una columna o un punto');
    });
  });

  /* ---------- 17.2 Calibrar la escala de una imagen ---------- */
  RT.defineSim('escala-imagen', function (sim) {
    const cv = sim.canvas({ aspect: 0.95, maxH: '720px' });
    const plano = new RT.Plano(sim, cv, { interactivo: false, escala: false, bounds: [-1.6, -1.6, 9.4, 11.4], capas: { cotas: false, nombres: true, muebles: true } });
    sim.group('Calibración');
    sim.slider('Lreal', { label: 'Longitud real de A–B', min: 0.5, max: 12, step: 0.05, value: 8, unit: 'm', fmt: f2 });
    sim.check('snap', { label: 'Ajuste a extremos (referencia)', value: true });
    sim.check('def', { label: 'Deformación del escáner: +3 % en vertical', value: false });
    sim.button('Calibrar con la cota de 1,20 m', () => { H[0] = tg(4)[0]; H[1] = tg(5)[0]; sim.ctl.Lreal.set(1.2); mover(0, H[0][0] + 3, H[0][1]); mover(1, H[1][0] - 2, H[1][1]); }, { newRow: true });
    sim.button('Volver a la cota de 8,00 m', () => { iniciar(); sim.ctl.Lreal.set(8); }, { newRow: true });
    sim.out('ab', 'A–B medida en la imagen');
    sim.out('k', 'Factor k = L real / L imagen');
    sim.out('cd', 'C–D medida en la imagen');
    sim.out('cdr', 'C–D calculada', { hl: true });
    sim.out('cota', 'Cota escrita entre C y D');
    sim.out('err', 'Error de la comprobación', { hl: true });
    /* Imagen normalizada a 600 px de ancho */
    const esc = () => cv.w / 600;
    const deforma = (x, y) => { if (!sim.p.def) return [x, y]; const cy = cv.h / 2; return [x, cy + (y - cy) * 1.03]; };
    const W = (wx, wy) => deforma(plano.X(wx), plano.Y(wy));
    const cotas = [
      { n: '8,00', a: [0, -0.9], b: [8, -0.9], L: 8 },
      { n: '10,00', a: [-0.9, 0], b: [-0.9, 10], L: 10 },
      { n: '1,20', a: [4.8, 10.75], b: [6.0, 10.75], L: 1.2 }
    ];
    /* puntos de referencia (extremos de cotas) en px de imagen */
    const tg = (i) => { const c = cotas[Math.floor(i / 2)], p = i % 2 ? c.b : c.a; const s = W(p[0], p[1]); return [[s[0] / esc(), s[1] / esc()], c]; };
    let H = [];
    const iniciar = () => { H = [tg(0)[0].slice(), tg(1)[0].slice(), tg(2)[0].slice(), tg(3)[0].slice()]; H[0][0] += 5; H[1][0] -= 4; H[2][1] -= 3; H[3][1] += 6; };
    let listo = false;
    const mover = (i, x, y) => {
      let p = [x, y];
      if (sim.p.snap) for (let j = 0; j < 6; j++) { const q = tg(j)[0]; if (Math.hypot(q[0] - x, q[1] - y) < 12) { p = q.slice(); break; } }
      H[i] = p;
    };
    RT.pointer(cv, {
      down: (x, y) => { const e = esc(); let best = null, bd = 18; H.forEach((h, i) => { const d = Math.hypot(h[0] * e - x, h[1] * e - y); if (d < bd) { bd = d; best = i; } }); return best === null ? null : best; },
      move: (i, x, y) => { mover(i, x / esc(), y / esc()); sim.redraw(); },
      hover: (x, y) => { const e = esc(); return H.some((h) => Math.hypot(h[0] * e - x, h[1] * e - y) < 18) ? 'grab' : null; }
    });
    sim.onDraw(() => {
      if (!listo) { plano._fit(); iniciar(); listo = true; }
      const ctx = cv.ctx;
      RT.draw.clear(cv);
      ctx.save();
      if (sim.p.def) { ctx.translate(0, cv.h / 2); ctx.scale(1, 1.03); ctx.translate(0, -cv.h / 2); }
      plano.draw();
      /* cotas de la imagen */
      ctx.strokeStyle = RT.col('--l-cota'); ctx.fillStyle = RT.col('--l-cota'); ctx.lineWidth = 1;
      ctx.font = `600 13px ${RT.FONT_MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      for (const c of cotas) {
        const a = [plano.X(c.a[0]), plano.Y(c.a[1])], b = [plano.X(c.b[0]), plano.Y(c.b[1])];
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        for (const p of [a, b]) { ctx.beginPath(); ctx.moveTo(p[0] - 5, p[1] + 5); ctx.lineTo(p[0] + 5, p[1] - 5); ctx.stroke(); }
        const v = Math.abs(a[0] - b[0]) < 1;
        ctx.save(); ctx.translate((a[0] + b[0]) / 2 - (v ? 4 : 0), (a[1] + b[1]) / 2 - (v ? 0 : 3)); if (v) ctx.rotate(-Math.PI / 2); ctx.fillText(c.n, 0, 0); ctx.restore();
      }
      ctx.restore();
      /* tono de papel escaneado */
      ctx.fillStyle = RT.alpha('--gold', 0.07); ctx.fillRect(0, 0, cv.w, cv.h);
      /* marcadores */
      const e = esc();
      const par = (i, j, colr) => {
        const p = H[i].map((v) => v * e), q = H[j].map((v) => v * e);
        ctx.save(); ctx.strokeStyle = RT.col(colr); ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.setLineDash([]);
        [[p, 'ABCD'[i]], [q, 'ABCD'[j]]].forEach(([s, n]) => {
          ctx.beginPath(); ctx.arc(s[0], s[1], 9, 0, 7); ctx.fillStyle = RT.alpha(colr, 0.2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(s[0] - 13, s[1]); ctx.lineTo(s[0] + 13, s[1]); ctx.moveTo(s[0], s[1] - 13); ctx.lineTo(s[0], s[1] + 13); ctx.lineWidth = 1; ctx.stroke();
          RT.text(ctx, n, s[0] + 12, s[1] - 12, { size: 13, weight: 700, color: colr, halo: true });
        });
        ctx.restore();
      };
      par(0, 1, '--accent');
      par(2, 3, '--c1');
      const dab = Math.hypot(H[1][0] - H[0][0], H[1][1] - H[0][1]);
      const dcd = Math.hypot(H[3][0] - H[2][0], H[3][1] - H[2][1]);
      const k = sim.p.Lreal / dab;
      const Lcd = k * dcd;
      /* ¿C y D están sobre los extremos de una misma cota? */
      let cota = null;
      for (let c = 0; c < 3; c++) {
        const a = tg(2 * c)[0], b = tg(2 * c + 1)[0];
        const ok1 = Math.hypot(a[0] - H[2][0], a[1] - H[2][1]) < 14 && Math.hypot(b[0] - H[3][0], b[1] - H[3][1]) < 14;
        const ok2 = Math.hypot(b[0] - H[2][0], b[1] - H[2][1]) < 14 && Math.hypot(a[0] - H[3][0], a[1] - H[3][1]) < 14;
        if (ok1 || ok2) cota = cotas[c];
      }
      sim.set('ab', C.fmt(dab, 1) + ' px');
      sim.set('k', C.fmt(1000 * k, 3) + ' mm/px');
      sim.set('cd', C.fmt(dcd, 1) + ' px');
      sim.set('cdr', f2(Lcd) + ' m');
      sim.set('cota', cota ? cota.n + ' m' : 'lleve C y D a los extremos de una cota');
      if (cota) {
        const err = (100 * (Lcd - cota.L)) / cota.L;
        sim.set('err', `<span class="${Math.abs(err) <= 0.5 ? '' : 'warnv'}">${C.fmt(err, 2)} %  (${C.fmt(1000 * (Lcd - cota.L), 0)} mm)</span>`);
      } else sim.set('err', '—');
    });
  });

  /* ---------- 17.3 Lista del entregable A01 ---------- */
  RT.defineSim('check-a01', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    sim.stage.append(box);
    sim.group('Avance');
    sim.out('k', 'Elementos revisados', { hl: true });
    sim.note('La lista se guarda en este navegador para su equipo. No se envía a ningún lugar.');
    RT.checklist(box, 'a01', [
      { t: 'Plano arquitectónico con muros a espesor real, puertas con giro y ventanas con alféizar' },
      { t: 'Nombre, uso y área de cada ambiente; cotas totales y parciales' },
      { t: 'Mobiliario fijo dibujado: mesones, lavaplatos, estufa, lavadero, lavamanos, ducha' },
      { t: 'Plano estructural con ejes nombrados, columnas, vigas aéreas y de cimentación' },
      { t: 'Tipo y espesor de losa o cubierta; nivel de piso, fondo de losa y fondo de vigas' },
      { t: 'Origen del plano y responsables de las medidas; supuestos escritos' },
      { t: 'Comprobación de escala: dos cotas en direcciones perpendiculares y error obtenido' },
      { t: 'Muros bajo vigas marcados (los conflictos de la etapa 5 empiezan aquí)' },
      { t: 'Archivo de prueba 3D por integrante y plano 2D con un bloque eléctrico exportado a PDF' },
      { t: 'Caso aprobado por el docente' }
    ], { onChange: (k, n) => sim.set('k', `${k} de ${n}`) });
  });
})();
