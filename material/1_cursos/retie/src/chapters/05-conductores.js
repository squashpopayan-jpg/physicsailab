/* Capítulo 5 — Conductores: calibre, calentamiento y caída de tensión */
(function () {
  'use strict';
  const RT = window.RT, C = RT.L.C, N = RT.L.N;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1), f2 = (v) => C.fmt(v, 2);
  const USO = { '14': 'Alumbrado (15 A)', '12': 'Tomas generales, cocina, ropas (20 A)', '10': 'Ducha, estufa, calentador (30 A)', '8': 'Conductor del electrodo; alimentadores pequeños', '6': 'Acometida y alimentador de una casa', '4': 'Acometida de casas grandes', '3': 'Acometidas', '2': 'Acometidas y alimentadores', '1': 'Alimentadores', '1/0': 'Alimentadores de edificios', '2/0': 'Alimentadores de edificios' };

  RT.defineSim('awg', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.group('Calibre');
    sim.slider('k', { label: 'Calibre AWG', min: 0, max: N.AWG.length - 1, step: 1, value: 1, fmt: (v) => N.AWG[Math.round(v)] + ' AWG' });
    sim.out('d', 'Diámetro del cobre');
    sim.out('A', 'Sección', { hl: true });
    sim.out('R', 'Resistencia a 20 °C / 75 °C');
    sim.out('I', 'Capacidad 60 / 75 / 90 °C', { hl: true });
    sim.out('p', 'Protección máxima');
    sim.out('tipo', 'Construcción exigida');
    sim.out('uso', 'Uso típico', { wide: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const k = Math.round(sim.p.k), awg = N.AWG[k];
      const dmax = C.awgDiam('2/0'), s = Math.min(W * 0.075, (H * 0.62) / dmax);
      /* todos los calibres en fila, a escala */
      let x = 24;
      N.AWG.forEach((a, i) => {
        const d = C.awgDiam(a) * s, ins = d + (i < 4 ? 1.6 : 2.2) * s * 0.9;
        const cx = x + ins / 2, cy = H * 0.48;
        ctx.beginPath(); ctx.arc(cx, cy, ins / 2, 0, 7); ctx.fillStyle = RT.alpha(i === k ? '--accent' : '--ink-3', i === k ? 0.25 : 0.12); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, d / 2, 0, 7); ctx.fillStyle = i === k ? '#C77A3A' : RT.alpha('#C77A3A', 0.55); ctx.fill();
        if (i === k) { ctx.strokeStyle = RT.col('--accent'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, ins / 2 + 3, 0, 7); ctx.stroke(); }
        RT.text(ctx, a, cx, cy + ins / 2 + 18, { size: 12, align: 'center', weight: i === k ? 700 : 400, color: i === k ? '--accent' : '--ink-3' });
        x += ins + 10;
      });
      RT.text(ctx, 'Dibujados a la misma escala (cobre y aislamiento aproximado)', 24, H - 12, { size: 11, color: '--ink-3' });
      const d = C.awgDiam(awg), A = C.awgArea(awg), cap = N.AMPACIDAD[awg];
      sim.set('d', f2(d) + ' mm');
      sim.set('A', f2(A) + ' mm²');
      sim.set('R', f2(C.rCu(awg, 20)) + ' / ' + f2(C.rCu(awg, 75)) + ' Ω/km');
      sim.set('I', cap.map((v) => v + ' A').join(' · '));
      sim.set('p', N.MAX_OCPD[awg] ? N.MAX_OCPD[awg] + ' A (240.4(D))' : C.protMax(awg, 60) + ' A con la columna de 60 °C (240.4(B))');
      sim.set('tipo', N.awgNum(awg) <= 8 ? 'Cable (hilos trenzados), 3.17.13 g' : 'Alambre o cable');
      sim.set('uso', USO[awg]);
    });
  });

  RT.defineSim('calentamiento', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.group('Circuito');
    sim.seg('awg', { label: 'Calibre', options: [['14', '14 AWG'], ['12', '12 AWG'], ['10', '10 AWG']], value: '12' });
    sim.slider('I', { label: 'Corriente', min: 0, max: 50, step: 0.5, value: 20, unit: 'A', fmt: f1 });
    sim.slider('Ta', { label: 'Temperatura ambiente', min: 10, max: 45, step: 1, value: 30, unit: '°C', fmt: f0 });
    sim.out('Tf', 'Temperatura de régimen', { hl: true });
    sim.out('t60', 'Tiempo para llegar a 60 °C');
    sim.out('Iz', 'Capacidad a 60 °C corregida');
    sim.out('est', 'Estado', { wide: true });
    sim.onDraw(() => {
      const ctx = cv.ctx;
      RT.draw.clear(cv);
      const awg = sim.p.awg, I = sim.p.I, Ta = sim.p.Ta;
      /* resistencia térmica calibrada con la columna de 90 °C a 30 °C de ambiente */
      const Ia = N.AMPACIDAD[awg][2], Rp = (T) => C.rCu(awg, T) / 1000;
      const Rth = (90 - 30) / (Ia * Ia * Rp(90));
      const tau = 480, Cth = tau / Rth;
      const pts = [];
      let T = Ta, t60 = null;
      const dt = 5, tmax = 3600;
      for (let t = 0; t <= tmax; t += dt) {
        pts.push([t / 60, T]);
        if (t60 === null && T >= 60) t60 = t;
        T += (dt * (I * I * Rp(T) - (T - Ta) / Rth)) / Cth;
      }
      const Tf = pts[pts.length - 1][1];
      const ymax = Math.max(100, Tf + 10);
      const p = new RT.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 60, ymin: Math.min(10, Ta - 5), ymax, xlabel: 'tiempo (min)', ylabel: 'temperatura del conductor (°C)' });
      p.frame();
      [[60, '--ok', 'bornes 60 °C'], [75, '--mid', 'bornes 75 °C'], [90, '--bad', 'aislamiento THHN 90 °C']].forEach(([v, c, t]) => { p.hline(v, { color: c, dash: [5, 4] }); RT.text(cv.ctx, t, p.X(1), p.Y(v) - 5, { size: 11, color: c, weight: 600 }); });
      p.path(pts, { color: '--accent', width: 2.6 });
      const Iz = C.ampacidad(awg, 60, Ta);
      sim.set('Tf', f1(Tf) + ' °C');
      sim.set('t60', t60 === null ? 'no llega' : f0(t60 / 60) + ' min');
      sim.set('Iz', f1(Iz) + ' A (factor ' + C.fmt(C.factorTemp(60, Ta), 2) + ')');
      sim.set('est', Tf <= 60 ? '<span class="chip ok">Correcto</span> dentro de la temperatura de los bornes.' : Tf <= 75 ? '<span class="chip mid">Excede 60 °C</span> solo admisible si todos los bornes son de 75 °C.' : Tf <= 90 ? '<span class="chip bad">Excede los bornes</span> el aislamiento aguanta, los aparatos no.' : '<span class="chip bad">Sobrecalentado</span> el aislamiento se degrada.');
    });
  });

  RT.defineSim('caida-tension', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.group('Circuito');
    sim.seg('V', { label: 'Tensión', options: [[120, '120 V'], [240, '240 V']], value: 120 });
    sim.slider('I', { label: 'Corriente de diseño', min: 1, max: 40, step: 0.5, value: 16, unit: 'A', fmt: f1 });
    sim.slider('L', { label: 'Longitud del circuito (un sentido)', min: 2, max: 60, step: 0.5, value: 18, unit: 'm', fmt: f1 });
    sim.seg('awg', { label: 'Calibre', options: [['14', '14'], ['12', '12'], ['10', '10'], ['8', '8'], ['6', '6']], value: '12' });
    sim.slider('lim', { label: 'Límite de diseño', min: 1, max: 5, step: 0.5, value: 3, unit: '%', fmt: f1 });
    sim.out('dV', 'Caída de tensión', { hl: true });
    sim.out('Vc', 'Tensión en la carga');
    sim.out('P', 'Pérdida en los conductores');
    sim.out('Lm', 'Longitud máxima para el límite');
    sim.onDraw(() => {
      const ctx = cv.ctx;
      RT.draw.clear(cv);
      const V = +sim.p.V, I = sim.p.I, Lm = sim.p.L, awg = sim.p.awg;
      const r = C.caida({ I, L: Lm, awg, V });
      const p = new RT.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 60, ymin: V * 0.9, ymax: V * 1.005, xlabel: 'distancia desde el tablero (m)', ylabel: 'tensión (V)' });
      p.frame();
      p.band(0, Lm, { color: RT.alpha('--accent', 0.06) });
      p.hline(V * (1 - sim.p.lim / 100), { color: '--bad', dash: [5, 4] });
      RT.text(ctx, `límite ${f1(sim.p.lim)} %`, p.X(59), p.Y(V * (1 - sim.p.lim / 100)) - 6, { size: 11.5, align: 'right', color: '--bad' });
      for (const a of ['14', '12', '10', '8', '6']) {
        const rr = C.rCu(a, 75) / 1000;
        p.path([[0, V], [60, V - 2 * I * rr * 60]], { color: a === awg ? '--accent' : '--ink-3', width: a === awg ? 2.6 : 1, dash: a === awg ? [] : [3, 3] });
        const yE = V - 2 * I * rr * 60;
        if (yE > V * 0.9) RT.text(ctx, a + ' AWG', p.X(58), p.Y(yE) - 4, { size: 10.5, align: 'right', color: a === awg ? '--accent' : '--ink-3' });
      }
      p.dot(Lm, V - r.dV, { color: '--accent', r: 5 });
      sim.set('dV', f2(r.dV) + ' V = ' + f2(r.pct) + ' % ' + (r.pct <= sim.p.lim ? '<span class="chip ok">cumple</span>' : '<span class="chip bad">excede</span>'));
      sim.set('Vc', f1(V - r.dV) + ' V');
      sim.set('P', f0(I * r.dV) + ' W');
      sim.set('Lm', f1(C.longMax({ I, awg, V, pct: sim.p.lim })) + ' m');
    });
  });
})();
