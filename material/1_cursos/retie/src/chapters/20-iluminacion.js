/* Capítulo 20 — Planta de iluminación (E01) */
(function () {
  'use strict';
  const RT = window.RT, L = RT.L, K = L.CASA, C = L.C, N = L.N;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1), f2 = (v) => C.fmt(v, 2);

  RT.defineSim('metodo-lumenes', function (sim) {
    const cv = sim.canvas({ aspect: 1.25, maxH: '600px' });
    const PRE = { sala: ['Sala-comedor', 150], cocina: ['Cocina', 200], alc1: ['Alcoba principal', 100], bano: ['Baño', 150], hall: ['Hall', 100], ropas: ['Patio de ropas', 100] };
    sim.group('Ambiente');
    sim.select('amb', { options: Object.keys(PRE).map((k) => [k, PRE[k][0]]), value: 'sala', onInput: (k) => { const r = K.libre(K.ambiente(k)); sim.ctl.Lr.set(+(r[2] - r[0]).toFixed(2), true); sim.ctl.Wr.set(+(r[3] - r[1]).toFixed(2), true); sim.ctl.E.set(PRE[k][1], true); } });
    sim.slider('Lr', { label: 'Largo', min: 1, max: 8, step: 0.05, value: 4.65, unit: 'm', fmt: f2 });
    sim.slider('Wr', { label: 'Ancho', min: 1, max: 8, step: 0.05, value: 5.45, unit: 'm', fmt: f2 });
    sim.slider('h', { label: 'Altura de la luminaria sobre el plano de trabajo', min: 1.2, max: 3, step: 0.05, value: 1.75, unit: 'm', fmt: f2 });
    sim.group('Diseño');
    sim.slider('E', { label: 'Iluminancia buscada (criterio)', min: 50, max: 500, step: 10, value: 150, unit: 'lx', fmt: f0 });
    sim.seg('phi', { label: 'Flujo por luminaria', options: [[900, '900'], [1500, '1 500'], [2400, '2 400'], [3600, '3 600 lm']], value: 2400 });
    sim.slider('fm', { label: 'Factor de mantenimiento', min: 0.6, max: 0.95, step: 0.01, value: 0.8, fmt: f2 });
    sim.slider('nman', { label: 'Luminarias instaladas (0 = las calculadas)', min: 0, max: 9, step: 1, value: 0, fmt: (v) => (v ? f0(v) : 'calculadas') });
    sim.out('K', 'Índice del local K');
    sim.out('CU', 'Factor de utilización (orientativo)');
    sim.out('N', 'Luminarias calculadas', { hl: true });
    sim.out('Em', 'Iluminancia media', { hl: true });
    sim.out('Uo', 'Uniformidad Emín/Emed');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const { Lr, Wr, h, E, fm } = sim.p, phi = +sim.p.phi;
      const r = C.lumenes({ Lr, Wr, h, E, phi, fm });
      const n = sim.p.nman || r.n;
      const Emed = (n * phi * r.CU * fm) / (Lr * Wr);
      /* malla de luminarias */
      let nx = Math.max(1, Math.round(Math.sqrt((n * Lr) / Wr))), ny = Math.ceil(n / nx);
      const lums = [];
      for (let j = 0; j < ny; j++) { const fila = j < ny - 1 ? nx : n - nx * (ny - 1); for (let i = 0; i < fila; i++) lums.push([((i + 0.5) * Lr) / fila, ((j + 0.5) * Wr) / ny]); }
      /* iluminancia directa punto a punto + componente indirecta uniforme */
      const G = 40, gr = [];
      let sumD = 0;
      for (let a = 0; a < G; a++) for (let b = 0; b < G; b++) { const x = ((a + 0.5) * Lr) / G, y = ((b + 0.5) * Wr) / G; let e = 0; for (const l of lums) e += C.eDirecta(x - l[0], y - l[1], h, phi * fm); gr.push(e); sumD += e; }
      const ind = Math.max(0, Emed - sumD / gr.length);
      const vals = gr.map((e) => e + ind);
      const emin = Math.min(...vals), eavg = vals.reduce((s, v) => s + v, 0) / vals.length;
      const sc = Math.min((W - 90) / Lr, (H - 50) / Wr), ox = 30, oy = 20;
      const vmax = Math.max(E * 1.6, Math.max(...vals));
      for (let a = 0; a < G; a++) for (let b = 0; b < G; b++) {
        const v = vals[a * G + b];
        ctx.fillStyle = RT.rgbStr(RT.cmap.viridis(v / vmax));
        ctx.fillRect(ox + (a * Lr * sc) / G, oy + ((G - 1 - b) * Wr * sc) / G, (Lr * sc) / G + 1, (Wr * sc) / G + 1);
      }
      ctx.strokeStyle = RT.col('--ink'); ctx.lineWidth = 2; ctx.strokeRect(ox, oy, Lr * sc, Wr * sc);
      for (const l of lums) RT.simbolo(ctx, 'lampara', ox + l[0] * sc, oy + (Wr - l[1]) * sc, 9, { color: '#ffffff', lw: 1.6 });
      /* escala de color */
      const bx = ox + Lr * sc + 18, by = oy, bh = Wr * sc;
      for (let k = 0; k < 60; k++) { ctx.fillStyle = RT.rgbStr(RT.cmap.viridis(1 - k / 59)); ctx.fillRect(bx, by + (k * bh) / 60, 14, bh / 60 + 1); }
      RT.text(ctx, f0(vmax) + ' lx', bx + 18, by + 6, { size: 10.5, color: '--ink-3' });
      RT.text(ctx, '0', bx + 18, by + bh, { size: 10.5, color: '--ink-3' });
      sim.set('K', f2(r.K));
      sim.set('CU', f2(r.CU));
      sim.set('N', f2(r.N) + ' → ' + r.n);
      sim.set('Em', f0(Emed) + ' lx ' + (Emed >= E * 0.9 ? '<span class="chip ok">alcanza</span>' : '<span class="chip mid">por debajo</span>'));
      sim.set('Uo', f2(emin / eavg));
    });
  });

  RT.defineSim('conmutable', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    let s1 = 0, s2 = 0;
    sim.group('Interruptores');
    sim.button('Accionar S5 (sala)', () => { s1 = 1 - s1; });
    sim.button('Accionar S6 (hall)', () => { s2 = 1 - s2; });
    sim.seg('modo', { label: 'Alambrado', options: [['bien', 'Correcto (en la fase)'], ['mal', 'Incorrecto (en el neutro)']], value: 'bien' });
    sim.out('lamp', 'Lámpara', { hl: true });
    sim.out('soc', 'Portalámpara con la lámpara apagada', { wide: true });
    RT.pointer(cv, { down: (x) => { if (x < cv.w * 0.5) s1 = 1 - s1; else s2 = 1 - s2; sim.redraw(); return null; }, hover: () => 'pointer' });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const on = s1 === s2, bien = sim.p.modo === 'bien';
      const yF = H * 0.18, yN = H * 0.86, yV1 = H * 0.42, yV2 = H * 0.6;
      const xS1 = W * 0.3, xS2 = W * 0.62, xL = W * 0.85;
      const lin = (pts, col, w = 3, hot = false) => { ctx.strokeStyle = RT.col(col); ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); if (hot) { ctx.strokeStyle = RT.alpha('--accent', 0.45); ctx.lineWidth = w + 5; ctx.stroke(); } };
      const top = bien ? '--cond-negro' : '--cond-blanco', bot = bien ? '--cond-blanco' : '--cond-negro';
      RT.text(ctx, bien ? 'fase' : 'neutro', W * 0.02, yF - 8, { size: 12, color: '--ink-2', weight: 600 });
      RT.text(ctx, bien ? 'neutro' : 'fase', W * 0.02, yN - 8, { size: 12, color: '--ink-2', weight: 600 });
      /* llegada al común de S5 */
      lin([[W * 0.02, yF], [xS1, yF], [xS1, (yV1 + yV2) / 2 - 22]], top, 3, bien);
      /* viajeros */
      const hot1 = bien && s1 === 0, hot2 = bien && s1 === 1;
      lin([[xS1 + 24, yV1], [xS2 - 24, yV1]], '--cond-azul', 3, hot1);
      lin([[xS1 + 24, yV2], [xS2 - 24, yV2]], '--cond-azul', 3, hot2);
      RT.text(ctx, 'viajeros', (xS1 + xS2) / 2, yV1 - 10, { size: 11.5, align: 'center', color: '--ink-3' });
      /* retorno a la lámpara */
      lin([[xS2, (yV1 + yV2) / 2 - 22], [xS2, yF], [xL, yF], [xL, H * 0.4]], bien ? '--cond-amarillo' : '--cond-blanco', 3, bien && on);
      /* lámpara a la otra línea */
      lin([[xL, H * 0.56], [xL, yN], [W * 0.02, yN]], bot, 3, !bien);
      /* conmutadores */
      const sw = (x, s, n) => {
        const yc = (yV1 + yV2) / 2;
        ctx.fillStyle = RT.col('--surface'); ctx.strokeStyle = RT.col('--ink'); ctx.lineWidth = 1.5;
        ctx.fillRect(x - 30, yc - 40, 60, 80); ctx.strokeRect(x - 30, yc - 40, 60, 80);
        ctx.beginPath(); ctx.moveTo(x, yc - 22); ctx.lineTo(x + (x === xS1 ? 24 : -24), s ? yV2 : yV1); ctx.lineWidth = 3; ctx.strokeStyle = RT.col('--accent'); ctx.stroke();
        RT.text(ctx, n, x, yc + 58, { size: 13, align: 'center', weight: 700 });
      };
      sw(xS1, s1, 'S5'); sw(xS2, s2, 'S6');
      /* lámpara */
      ctx.beginPath(); ctx.arc(xL, H * 0.48, 24, 0, 7); ctx.fillStyle = on ? RT.alpha('--l-ilum', 0.85) : RT.col('--surface'); ctx.fill(); ctx.strokeStyle = RT.col('--ink'); ctx.lineWidth = 2; ctx.stroke();
      RT.simbolo(ctx, 'lampara', xL, H * 0.48, 22, { color: '--ink' });
      RT.text(ctx, 'clic en un conmutador para accionarlo', W * 0.02, H * 0.97, { size: 11, color: '--ink-3' });
      sim.set('lamp', on ? 'Encendida' : 'Apagada');
      sim.set('soc', bien ? 'Sin tensión: la fase se interrumpe antes del portalámpara.' : '<span class="chip bad">Energizado</span> la lámpara está apagada pero su portalámpara sigue a 120 V: quien cambie el bombillo puede electrizarse (3.17.20 b y 3.14.2 a).');
    });
  });

  RT.defineSim('plano-e01', function (sim) {
    const cv = sim.canvas({ aspect: 0.95, maxH: '780px' });
    const plano = new RT.Plano(sim, cv, { capas: { ilum: true, ctrl: true, muebles: false, cotas: false } });
    sim.group('Vista');
    sim.seg('lab', { label: 'Etiquetas', options: [['id', 'Código'], ['circ', 'Circuito']], value: 'id', onInput: (v) => { plano.capas.circ = v === 'circ'; } });
    sim.check('ctrl', { label: 'Relación de control', value: true, onInput: (v) => { plano.capas.ctrl = v; } });
    sim.check('muebles', { label: 'Mobiliario', value: false, onInput: (v) => { plano.capas.muebles = v; } });
    sim.out('sel', 'Punto', { wide: true });
    sim.out('tot', 'Luminarias · potencia', { hl: true });
    plano.onPick = (h) => sim.set('sel', h ? h.tip : 'Haga clic en una luminaria o un interruptor');
    const ley = RT.el('div', 'leyenda');
    ley.innerHTML = [['p-lum', 'Salida de alumbrado en techo'], ['p-aplique', 'Aplique de pared'], ['p-int', 'Interruptor sencillo'], ['p-int2', 'Interruptor doble'], ['p-conm', 'Conmutable'], ['p-tablero', 'Tablero general']].map(([s, t]) => `<span>${RT.simboloSVG(s, 22, { color: 'var(--l-ilum)' })}${t}</span>`).join('');
    sim.stageCol.append(ley);
    sim.onDraw(() => {
      plano.draw();
      const lums = K.electrico.puntos.filter((p) => p.tipo === 'lum' || p.tipo === 'aplique');
      sim.set('tot', lums.length + ' · ' + f0(lums.reduce((s, p) => s + p.W, 0)) + ' W (circuito C1)');
      if (!plano.sel) sim.set('sel', 'Haga clic en una luminaria o un interruptor');
    });
  });
})();
