/* Capítulo 11 — Conductores e identificación */
(function () {
  'use strict';
  const RT = window.RT, N = RT.L.N;
  const hex = (n) => { const v = N.COLOR_HEX[n]; return v ? (v.startsWith('--') ? RT.col(v) : v) : '#888'; };

  function cable(ctx, x0, y0, x1, y1, color, w = 7, franja = null) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = RT.alpha('--ink', 0.35); ctx.lineWidth = w + 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (franja) {
      ctx.strokeStyle = franja; ctx.lineWidth = w * 0.9; ctx.setLineDash([7, 9]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }

  RT.defineSim('codigo-colores', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.group('Sistema');
    sim.select('s', { options: Object.keys(N.COLORES).map((k) => [k, N.COLORES[k].nombre]), value: '1F3H-240/120' });
    sim.out('f', 'Fases', { wide: true });
    sim.out('n', 'Neutro');
    sim.out('t', 'Tierra de protección');
    sim.out('a', 'Tierra aislada');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const S = N.COLORES[sim.p.s];
      const list = S.fases.map((c, i) => ['Fase ' + 'ABC'[i], c]).concat(S.neutro !== 'No aplica' ? [['Neutro', S.neutro === 'gris' ? 'gris' : 'blanco']] : []).concat([['Tierra', 'verde']]);
      const gap = Math.min(46, (H - 40) / list.length);
      list.forEach(([n, c], i) => {
        const y = 30 + i * gap;
        cable(ctx, W * 0.24, y, W * 0.94, y, hex(c), 11);
        RT.text(ctx, n, W * 0.22, y, { size: 13, align: 'right', baseline: 'middle', weight: 600 });
        RT.text(ctx, c, W * 0.6, y - 14, { size: 11, align: 'center', color: '--ink-3' });
      });
      sim.set('f', S.fasesTxt);
      sim.set('n', S.neutro);
      sim.set('t', S.tierra);
      sim.set('a', S.aislada);
    });
  });

  RT.defineSim('error-tablero', function (sim) {
    const cv = sim.canvas({ aspect: 1.25, maxH: '620px' });
    const CASOS = [
      { n: 1, d: 'Fase del totalizador en negro', ok: true, por: 'En 120/240 V monofásico una fase puede ser negra (Tabla 3.5.a).', c: 'negro' },
      { n: 2, d: 'Segunda fase del totalizador en blanco', ok: false, por: 'No se debe utilizar el blanco ni el verde para las fases (Título 5). Debe ser un color de fase, por ejemplo rojo, o marcarse con cinta de ese color.', c: 'blanco' },
      { n: 3, d: 'Neutro de la acometida en blanco a la barra de neutro', ok: true, por: 'El neutro es blanco o marcado con blanco (Tabla 3.5.a).', c: 'blanco' },
      { n: 4, d: 'Dos neutros de circuitos distintos en un mismo borne', ok: false, por: 'Cada conductor puesto a tierra debe terminar en un terminal individual (3.17.8 aa).', c: 'blanco' },
      { n: 5, d: 'Tierra de un circuito en negro con franja verde en el extremo', ok: true, por: 'Se admite la marcación clara en las partes visibles con cinta o pintura verde (Título 5 y 3.12.2.3 e).', c: 'negro', fr: 'verde' },
      { n: 6, d: 'Fase de un ramal en verde', ok: false, por: 'El verde es exclusivo de la tierra de protección; nunca se usa para fases (Título 5).', c: 'verde' },
      { n: 7, d: 'Puente entre la barra de neutro y la de tierra en este tablero general', ok: true, por: 'El puente equipotencial neutro-tierra va en el tablero general, y solo allí (Título 27).', c: 'verde' },
      { n: 8, d: 'Fase de otro ramal en azul', ok: true, por: 'El azul es un color de fase de la Tabla 3.5.a; no es blanco ni verde.', c: 'azul' }
    ];
    sim.group('Conductor seleccionado');
    sim.seg('sel', { label: 'Número', options: CASOS.map((c) => [c.n, String(c.n)]), value: 1 });
    const resp = {};
    sim.button('Está bien', () => { resp[sim.p.sel] = true; });
    sim.button('Está mal', () => { resp[sim.p.sel] = false; });
    sim.out('d', 'Descripción', { wide: true });
    sim.out('fb', 'Respuesta', { wide: true });
    sim.out('p', 'Aciertos', { hl: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const bx = W * 0.12, by = H * 0.08, bw = W * 0.76, bh = H * 0.84;
      ctx.fillStyle = RT.col('--surface-2'); ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = RT.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      /* barras */
      const barN = [bx + bw * 0.08, by + bh * 0.82, bw * 0.38], barT = [bx + bw * 0.54, by + bh * 0.82, bw * 0.38];
      ctx.fillStyle = '#B8B8B8'; ctx.fillRect(barN[0], barN[1], barN[2], 10); ctx.fillStyle = '#5FA36A'; ctx.fillRect(barT[0], barT[1], barT[2], 10);
      RT.text(ctx, 'barra de neutro', barN[0] + barN[2] / 2, barN[1] + 26, { size: 11.5, align: 'center', color: '--ink-2' });
      RT.text(ctx, 'barra de tierra', barT[0] + barT[2] / 2, barT[1] + 26, { size: 11.5, align: 'center', color: '--ink-2' });
      /* totalizador y breakers */
      const tx = bx + bw * 0.38, ty = by + bh * 0.1;
      ctx.fillStyle = RT.col('--ink-2'); ctx.fillRect(tx, ty, bw * 0.24, bh * 0.12);
      RT.text(ctx, '2P 60 A', tx + bw * 0.12, ty + bh * 0.06, { size: 12, align: 'center', baseline: 'middle', color: '--surface', weight: 700 });
      const brk = [];
      for (let i = 0; i < 6; i++) { const x = bx + bw * 0.14 + (i % 2) * bw * 0.46, y = by + bh * 0.32 + Math.floor(i / 2) * bh * 0.13; brk.push([x, y]); ctx.fillStyle = RT.col('--surface'); ctx.fillRect(x, y, bw * 0.26, bh * 0.08); ctx.strokeStyle = RT.col('--ink-3'); ctx.strokeRect(x, y, bw * 0.26, bh * 0.08); }
      /* cables */
      const C1 = CASOS;
      const pos = {
        1: [tx + bw * 0.06, by - 8, tx + bw * 0.06, ty], 2: [tx + bw * 0.18, by - 8, tx + bw * 0.18, ty],
        3: [bx + bw * 0.3, by - 8, barN[0] + barN[2] * 0.85, barN[1]], 4: [brk[2][0], brk[2][1] + bh * 0.04, barN[0] + barN[2] * 0.4, barN[1]],
        5: [brk[3][0] + bw * 0.26, brk[3][1] + bh * 0.06, barT[0] + barT[2] * 0.6, barT[1]], 6: [brk[4][0], brk[4][1] + bh * 0.04, bx - 6, brk[4][1] + bh * 0.04],
        7: [barN[0] + barN[2], barN[1] + 5, barT[0], barT[1] + 5], 8: [brk[5][0] + bw * 0.26, brk[5][1] + bh * 0.04, bx + bw + 6, brk[5][1] + bh * 0.04]
      };
      /* segundo neutro en el mismo borne del caso 4 */
      cable(ctx, brk[0][0], brk[0][1] + bh * 0.04, barN[0] + barN[2] * 0.4, barN[1], hex('blanco'), 6);
      for (const c of C1) {
        const [a, b, cc, d] = pos[c.n];
        cable(ctx, a, b, cc, d, hex(c.c), c.n === 7 ? 5 : 7, c.fr ? hex(c.fr) : null);
        const mx = (a + cc) / 2, my = (b + d) / 2;
        const on = +sim.p.sel === c.n;
        ctx.beginPath(); ctx.arc(mx, my, 12, 0, 7); ctx.fillStyle = RT.col(on ? '--accent' : '--surface'); ctx.fill(); ctx.strokeStyle = RT.col('--ink'); ctx.lineWidth = 1.5; ctx.stroke();
        RT.text(ctx, String(c.n), mx, my, { size: 12, align: 'center', baseline: 'middle', weight: 700, color: on ? '--accent-ink' : '--ink' });
        if (resp[c.n] !== undefined) { ctx.beginPath(); ctx.arc(mx + 13, my - 12, 6, 0, 7); ctx.fillStyle = RT.col(resp[c.n] === c.ok ? '--ok' : '--bad'); ctx.fill(); }
      }
      const c = C1[+sim.p.sel - 1];
      sim.set('d', c.d);
      sim.set('fb', resp[c.n] === undefined ? 'Escoja «Está bien» o «Está mal».' : `${resp[c.n] === c.ok ? '<span class="chip ok">Acierto</span>' : '<span class="chip bad">Revise</span>'} ${c.ok ? 'Cumple.' : 'No cumple.'} ${c.por}`);
      const n = Object.keys(resp).length, k = Object.keys(resp).filter((i) => resp[i] === C1[i - 1].ok).length;
      sim.set('p', `${k} de ${n} respondidos (8 en total)`);
    });
  });
})();
