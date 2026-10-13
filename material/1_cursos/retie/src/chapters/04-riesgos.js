/* Capítulo 4 — El riesgo eléctrico y el cuerpo humano */
(function () {
  'use strict';
  const RT = window.RT, C = RT.L.C, N = RT.L.N;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1);
  const ZCOL = [null, ['--c3', 0.34], ['--c3', 0.16], ['--c1', 0.18], ['--c4', 0.28], ['--c2', 0.26], ['--c2', 0.5]];

  /* Dibuja el plano tiempo-corriente con las seis zonas */
  function planoIEC(ctx, cv, o = {}) {
    const p = new RT.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.1, xmax: 10000, ymin: 10, ymax: 10000, xlog: true, ylog: true, xlabel: 'corriente por el cuerpo (mA)', ylabel: 'duración (ms)', ml: 58, mb: 44, mt: 14, mr: 14, grid: false });
    const yTop = p.iy, yBot = p.iy + p.ih;
    for (let py = yTop; py <= yBot; py += 2) {
      const t = p.invY(py);
      const xs = [p.X(0.1), ...['a', 'b', 'c1', 'c2', 'c3'].map((n) => p.X(Math.min(10000, C.curvaIEC(n, t)))), p.X(10000)];
      for (let z = 1; z <= 6; z++) { ctx.fillStyle = RT.alpha(ZCOL[z][0], ZCOL[z][1]); ctx.fillRect(xs[z - 1], py, Math.max(0, xs[z] - xs[z - 1]), 2); }
    }
    p.o.grid = true;
    p.frame();
    for (const n of ['a', 'b', 'c1', 'c2', 'c3']) {
      const pts = [];
      for (let k = 0; k <= 120; k++) { const t = Math.pow(10, 1 + (3 * k) / 120); pts.push([C.curvaIEC(n, t), t]); }
      p.path(pts, { color: n === 'c1' ? '--bad' : '--ink-3', width: n === 'c1' ? 2.2 : 1 });
      const lab = pts[pts.length - 1];
      RT.text(ctx, n, p.X(lab[0]) + 3, p.Y(lab[1]) + 12, { size: 11.5, weight: 700, color: n === 'c1' ? '--bad' : '--ink-2' });
    }
    [[0.3, 4000, '1'], [2.5, 4000, '2'], [22, 1500, '3'], [100, 60, '4'], [720, 30, '5'], [3500, 300, '6']].forEach(([i, t, z]) => RT.text(ctx, z, p.X(i), p.Y(t), { size: 15, weight: 700, color: '--ink-2', align: 'center', baseline: 'middle' }));
    return p;
  }

  RT.defineSim('zonas-cuerpo', function (sim) {
    const cv = sim.canvas({ aspect: 1.25, maxH: '640px' });
    sim.group('Contacto');
    sim.slider('V', { label: 'Tensión de contacto', min: 12, max: 240, step: 1, value: 120, unit: 'V', fmt: f0 });
    sim.seg('piel', { label: 'Piel', options: [['seca', 'Seca'], ['mojada', 'Mojada'], ['salina', 'Sumergida']], value: 'mojada' });
    sim.slider('Rx', { label: 'Resistencia adicional (calzado, piso)', min: 0, max: 5000, step: 50, value: 200, unit: 'Ω', fmt: f0 });
    sim.slider('t', { label: 'Duración si nada corta', min: 10, max: 10000, step: 10, value: 1000, log: true, unit: 'ms', fmt: f0 });
    sim.group('Protección del circuito');
    sim.seg('prot', { options: [['no', 'Ninguna'], ['tm', 'Termomagn. 20 A'], ['gfci', 'GFCI 5 mA'], ['rcd', 'Diferencial 30 mA']], value: 'no' });
    sim.out('Z', 'Impedancia total');
    sim.out('I', 'Corriente por el cuerpo', { hl: true });
    sim.out('td', 'Duración del contacto', { hl: true });
    sim.out('zona', 'Zona', { wide: true });
    sim.legend([{ color: '--bad', label: 'curva C1 (límite de diseño)' }, { color: '--ink', kind: 'dot', label: 'contacto con la protección escogida' }, { color: '--ink-3', kind: 'dot', label: 'mismo contacto sin protección' }]);
    sim.onDraw(() => {
      const ctx = cv.ctx;
      RT.draw.clear(cv);
      const p = planoIEC(ctx, cv);
      const Zb = C.zCuerpo(sim.p.V, sim.p.piel), Z = Zb + sim.p.Rx;
      const I = (1000 * sim.p.V) / Z;
      let t = sim.p.t;
      if (sim.p.prot === 'gfci') t = Math.min(t, 1000 * C.gfciT(I));
      if (sim.p.prot === 'rcd') t = Math.min(t, 1000 * C.rcdT(I));
      const tt = Math.max(10, t);
      const dot = (x, y, colr, r) => { ctx.beginPath(); ctx.arc(p.X(x), p.Y(y), r, 0, 7); ctx.fillStyle = RT.col(colr); ctx.fill(); ctx.strokeStyle = RT.col('--canvas'); ctx.lineWidth = 2; ctx.stroke(); };
      if (sim.p.prot === 'gfci' || sim.p.prot === 'rcd') {
        dot(Math.min(9000, I), Math.max(10, sim.p.t), '--ink-3', 6);
        RT.draw.arrow(ctx, p.X(Math.min(9000, I)), p.Y(Math.max(10, sim.p.t)) + 8, p.X(Math.min(9000, I)), p.Y(tt) - 9, { color: '--ink-2', width: 1.4 });
      }
      dot(Math.min(9000, I), tt, '--ink', 7);
      const z = C.zonaIEC(I, tt);
      sim.set('Z', f0(Z) + ' Ω (cuerpo ' + f0(Zb) + ' Ω)');
      sim.set('I', f1(I) + ' mA');
      sim.set('td', f0(tt) + ' ms' + (sim.p.prot === 'tm' ? ' · el termomagnético no ve esta corriente' : sim.p.prot === 'no' ? '' : t < sim.p.t ? ' · cortado por la protección' : ' · la protección no alcanzó a disparar'));
      sim.set('zona', `<b>Zona ${z}</b>: ${C.ZONAS[z]}.`);
    });
  });

  RT.defineSim('contacto-indirecto', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.group('Instalación');
    sim.check('pe', { label: 'Conductor de puesta a tierra hasta la carcasa', value: true });
    sim.seg('dif', { label: 'Protección diferencial', options: [['no', 'Ninguna'], ['gfci', 'GFCI'], ['rcd', '30 mA']], value: 'no' });
    sim.slider('L', { label: 'Longitud del circuito', min: 5, max: 60, step: 1, value: 14, unit: 'm', fmt: f0 });
    sim.seg('awg', { label: 'Calibre', options: [['14', '14 AWG'], ['12', '12 AWG'], ['10', '10 AWG']], value: '12' });
    sim.seg('In', { label: 'Interruptor (curva C)', options: [[15, '15 A'], [20, '20 A'], [30, '30 A']], value: 20 });
    sim.group('La persona');
    sim.seg('piel', { label: 'Piel', options: [['seca', 'Seca'], ['mojada', 'Mojada']], value: 'mojada' });
    sim.seg('pie', { label: 'Calzado y piso', options: [[2000, 'Zapato, piso seco'], [400, 'Chancla, piso húmedo'], [50, 'Descalzo, piso mojado']], value: 400 });
    sim.out('If', 'Corriente de falla');
    sim.out('Ut', 'Tensión de contacto');
    sim.out('Ip', 'Corriente por la persona', { hl: true });
    sim.out('t', 'Tiempo de despeje', { hl: true });
    sim.out('lim', 'Límite Tabla 3.12.1.a para ese tiempo');
    sim.out('z', 'Resultado', { wide: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const R = C.rCu(sim.p.awg, 30) / 1000 * sim.p.L, Zsrc = 0.12, In = +sim.p.In;
      const Rext = +sim.p.pie;
      let If = 0, Ut, Ip, t, quien = '';
      if (sim.p.pe) {
        If = 120 / (Zsrc + 2 * R);
        Ut = If * R;
        Ip = (1000 * Ut) / (C.zCuerpo(Ut, sim.p.piel) + Rext);
        const m = If / In, tb = C.disparo(m, 'C').tmax;
        t = tb; quien = 'interruptor ' + (m >= 10 ? '(disparo magnético)' : '(disparo térmico)');
        if (sim.p.dif === 'gfci') { const tg = C.gfciT(1000 * If); if (tg < t) { t = Math.max(0.02, tg); quien = 'GFCI'; } }
        if (sim.p.dif === 'rcd') { const tr = C.rcdT(1000 * If); if (tr < t) { t = Math.max(0.02, tr); quien = 'diferencial'; } }
      } else {
        Ut = 120;
        Ip = (1000 * Ut) / (C.zCuerpo(Ut, sim.p.piel) + Rext);
        t = Ip >= 10 ? 5 : 1; quien = Ip >= 10 ? 'nadie: la persona no puede soltarse' : 'nadie: la persona suelta en ~1 s';
        if (sim.p.dif === 'gfci' && Ip >= 4) { t = Math.max(0.02, C.gfciT(Ip)); quien = 'GFCI (detecta la fuga por la persona)'; }
        if (sim.p.dif === 'rcd' && Ip >= 15) { const tr = C.rcdT(Ip); if (tr < t) { t = tr; quien = 'diferencial de 30 mA'; } }
      }
      const lim = N.contactoMax(t, 1);
      const z = C.zonaIEC(Ip, 1000 * t);
      /* esquema */
      const y1 = H * 0.2, y2 = H * 0.32, y3 = H * 0.44;
      const xT = W * 0.08, xL = W * 0.62;
      ctx.lineWidth = 2.5;
      [[y1, '--cond-negro', 'fase'], [y2, '--ink-3', 'neutro'], [y3, '--cond-verde', 'tierra']].forEach(([y, c, n], i) => {
        if (i === 2 && !sim.p.pe) { ctx.setLineDash([4, 6]); ctx.strokeStyle = RT.alpha(c, 0.35); } else { ctx.setLineDash([]); ctx.strokeStyle = RT.col(c); }
        ctx.beginPath(); ctx.moveTo(xT + 46, y); ctx.lineTo(xL, y); ctx.stroke(); ctx.setLineDash([]);
        RT.text(ctx, n, xT + 52, y - 6, { size: 11, color: '--ink-3' });
      });
      ctx.fillStyle = RT.col('--surface-3'); ctx.fillRect(xT, y1 - 18, 46, y3 - y1 + 36); ctx.strokeStyle = RT.col('--ink-2'); ctx.lineWidth = 1; ctx.strokeRect(xT, y1 - 18, 46, y3 - y1 + 36);
      RT.text(ctx, 'TG', xT + 23, y3 + 32, { size: 12, align: 'center', weight: 700 });
      /* lavadora */
      const bx = xL, by = H * 0.14, bw = W * 0.18, bh = Math.min(H * 0.52, W * 0.3);
      ctx.fillStyle = RT.alpha(sim.p.pe ? '--c1' : '--bad', 0.12); ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = RT.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      ctx.beginPath(); ctx.arc(bx + bw / 2, by + bh * 0.58, Math.min(bw, bh) * 0.28, 0, 7); ctx.stroke();
      RT.text(ctx, 'falla de aislamiento', bx + bw / 2, by - 8, { size: 11.5, align: 'center', color: '--bad', weight: 600 });
      ctx.strokeStyle = RT.col('--bad'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + 6, y1); ctx.lineTo(bx + 16, y1 + 8); ctx.lineTo(bx + 8, y1 + 14); ctx.lineTo(bx + 18, y1 + 22); ctx.stroke();
      /* persona */
      const gy = H * 0.9, ph = Math.min(H * 0.62, W * 0.5), hr = ph * 0.06;
      const px = Math.min(W - 40, bx + bw + Math.max(40, W * 0.09));
      ctx.strokeStyle = RT.col('--ink'); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(px, gy - ph + hr, hr, 0, 7); ctx.stroke();
      const sh = gy - ph + 2.4 * hr, hip = gy - 0.46 * ph;
      ctx.beginPath(); ctx.moveTo(px, gy - ph + 2 * hr); ctx.lineTo(px, hip); ctx.lineTo(px - 0.13 * ph, gy); ctx.moveTo(px, hip); ctx.lineTo(px + 0.13 * ph, gy);
      ctx.moveTo(px, sh); ctx.lineTo(bx + bw, by + bh * 0.4); ctx.moveTo(px, sh); ctx.lineTo(px + 0.16 * ph, hip - 0.05 * ph); ctx.stroke();
      ctx.strokeStyle = RT.col('--ink-3'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(W * 0.04, gy + 1); ctx.lineTo(W * 0.98, gy + 1); ctx.stroke();
      RT.text(ctx, `${f1(Ip)} mA`, px, gy - ph - 8, { size: 15, weight: 700, align: 'center', color: Ip >= 25 ? '--bad' : Ip >= 10 ? '--mid' : '--ok' });
      if (If > 0) RT.text(ctx, `falla ${f0(If)} A por la tierra`, xT + 60, y3 + 18, { size: 12, color: '--l-tierra', weight: 600 });
      sim.set('If', If > 0 ? f0(If) + ' A (' + f1(If / In) + ' × In)' : '0 A: no hay camino de retorno por tierra');
      sim.set('Ut', f0(Ut) + ' V');
      sim.set('Ip', f1(Ip) + ' mA');
      sim.set('t', (t < 1 ? f0(1000 * t) + ' ms' : f1(t) + ' s') + ' · ' + quien);
      sim.set('lim', f0(lim) + ' V ' + (Ut <= lim ? '<span class="chip ok">dentro</span>' : '<span class="chip bad">excedido</span>'));
      sim.set('z', `Zona ${z} de la Figura 1.5.1.2.a: ${C.ZONAS[z]}.`);
    });
  });

  RT.defineSim('matriz-riesgo', function (sim) {
    const box = RT.el('div', 'stage-scroll');
    sim.stage.append(box);
    const CASOS = {
      ducha: { n: 'Electrocución por ducha eléctrica sin diferencial', p: 5, e: 2, a: 1, i: 2, f: 'D' },
      ducha2: { n: 'Ducha con diferencial y conductor de tierra', p: 2, e: 1, a: 1, i: 1, f: 'D' },
      tablero: { n: 'Arco al manipular el tablero sin tapa', p: 3, e: 2, a: 1, i: 1, f: 'C' },
      neutro: { n: 'Incendio por neutro flojo en la acometida', p: 4, e: 4, a: 2, i: 2, f: 'D' },
      regata: { n: 'Contacto al perforar un muro con tubería energizada', p: 3, e: 1, a: 1, i: 1, f: 'C' }
    };
    sim.group('Caso');
    sim.select('caso', { options: Object.keys(CASOS).map((k) => [k, CASOS[k].n]), value: 'ducha', onInput: (k) => { const c = CASOS[k]; sim.ctl.p.set(String(c.p), true); sim.ctl.e.set(String(c.e), true); sim.ctl.a.set(String(c.a), true); sim.ctl.i.set(String(c.i), true); sim.ctl.f.set(c.f, true); } });
    sim.group('Consecuencias (1 a 5) y frecuencia');
    const opts = N.RIESGO_CONS.map((r) => [String(r[0]), String(r[0])]);
    const c0 = CASOS.ducha;
    sim.seg('p', { label: 'En personas', options: opts.slice().reverse(), value: String(c0.p) });
    sim.seg('e', { label: 'Económicas', options: opts.slice().reverse(), value: String(c0.e) });
    sim.seg('a', { label: 'Ambientales', options: opts.slice().reverse(), value: String(c0.a) });
    sim.seg('i', { label: 'En la imagen', options: opts.slice().reverse(), value: String(c0.i) });
    sim.seg('f', { label: 'Frecuencia', options: N.RIESGO_FREC.map((r) => [r[0], r[0]]), value: c0.f });
    sim.out('niv', 'Nivel de riesgo', { hl: true });
    sim.out('acc', 'Decisión', { wide: true });
    const COLN = { 'MUY ALTO': 'rgba(220,20,20,.78)', 'ALTO': 'rgba(255,95,95,.55)', 'MEDIO': 'rgba(255,225,70,.6)', 'BAJO': 'rgba(0,170,80,.45)', 'MUY BAJO': 'rgba(0,120,50,.62)' };
    const ORD = ['MUY BAJO', 'BAJO', 'MEDIO', 'ALTO', 'MUY ALTO'];
    const pintar = () => {
      const fi = N.RIESGO_FREC.findIndex((r) => r[0] === sim.p.f);
      const clases = [['personas', +sim.p.p], ['económicas', +sim.p.e], ['ambientales', +sim.p.a], ['imagen', +sim.p.i]];
      let peor = 'MUY BAJO';
      clases.forEach(([, c]) => { const n = N.RIESGO_MATRIZ[c][fi]; if (ORD.indexOf(n) > ORD.indexOf(peor)) peor = n; });
      let h = '<table class="sim-tab" style="width:100%;font-size:12px"><thead><tr><th>Consecuencia</th>' + N.RIESGO_FREC.map((r) => `<th style="text-align:center" title="${r[1]}">${r[0]}</th>`).join('') + '</tr></thead><tbody>';
      for (const r of N.RIESGO_CONS) {
        h += `<tr><td><b>${r[0]}</b> · ${r[1]}</td>`;
        N.RIESGO_FREC.forEach((f, j) => {
          const n = N.RIESGO_MATRIZ[r[0]][j];
          const marcas = clases.filter(([, c]) => c === r[0] && j === fi).map(([k]) => k);
          h += `<td style="text-align:center;background:${COLN[n]};color:var(--ink);font-family:var(--font-ui);font-weight:${marcas.length ? 800 : 500};outline:${marcas.length ? '2px solid var(--ink)' : 'none'};outline-offset:-2px">${n}${marcas.length ? '<br><small>' + marcas.join(', ') + '</small>' : ''}</td>`;
        });
        h += '</tr>';
      }
      h += '</tbody></table><p style="font:12.5px var(--font-ui);color:var(--ink-3);margin:8px 0 0">Frecuencia: ' + N.RIESGO_FREC.map((r) => `<b>${r[0]}</b> ${r[1].toLowerCase()}`).join(' · ') + '. Fuente: Tabla 1.5.1.4.1.a del Libro 1.</p>';
      box.innerHTML = h;
      sim.set('niv', peor);
      sim.set('acc', N.RIESGO_ACCION[peor]);
    };
    sim.onChange = pintar;
    pintar();
  });
})();
