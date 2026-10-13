/* Capítulo 3 — Tensión, corriente y potencia en la vivienda */
(function () {
  'use strict';
  const RT = window.RT, C = RT.L.C;
  const f1 = (v) => C.fmt(v, 1), f0 = (v) => C.fmt(v, 0);

  RT.defineSim('circuito-ramal', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    const AP = [
      ['tv', 'Televisor', 120], ['nev', 'Nevera (en marcha)', 150], ['lic', 'Licuadora', 450], ['mic', 'Horno microondas', 1200],
      ['caf', 'Cafetera', 900], ['olla', 'Olla arrocera', 700], ['tos', 'Sanduchera', 750], ['pla', 'Plancha', 1000], ['sec', 'Secador de pelo', 1500], ['pc', 'Computador portátil', 65]
    ];
    sim.group('Circuito');
    sim.seg('In', { label: 'Protección y conductor', options: [[15, '15 A · 14 AWG'], [20, '20 A · 12 AWG']], value: 20 });
    sim.group('Aparatos conectados');
    AP.forEach(([id, n, w], i) => sim.check(id, { label: `${n} · ${w} W`, value: i < 3 }));
    sim.out('S', 'Potencia total');
    sim.out('I', 'Corriente total', { hl: true });
    sim.out('cap', 'Capacidad del circuito');
    sim.out('est', 'Estado', { wide: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, Hh = cv.h;
      RT.draw.clear(cv);
      const In = +sim.p.In, V = 120;
      const on = AP.filter(([id]) => sim.p[id]);
      const S = on.reduce((s, a) => s + a[2], 0), I = S / V;
      const max = Math.max(In * 1.6, I * 1.1);
      const x0 = 30, x1 = W - 30, y = Hh * 0.42, h = Math.min(56, Hh * 0.22);
      const X = (i) => x0 + ((x1 - x0) * i) / max;
      /* barra apilada */
      let acc = 0;
      on.forEach(([id, n, w], k) => {
        const i = w / V;
        ctx.fillStyle = RT.alpha(['--c1', '--c4', '--c3', '--c5', '--c2', '--c6'][k % 6], 0.75);
        ctx.fillRect(X(acc), y, X(acc + i) - X(acc), h);
        if (X(acc + i) - X(acc) > 40) RT.text(ctx, n.split(' ')[0], (X(acc) + X(acc + i)) / 2, y + h / 2, { size: 11.5, align: 'center', baseline: 'middle', color: '--ink', halo: true });
        acc += i;
      });
      ctx.strokeStyle = RT.col('--rule-strong'); ctx.strokeRect(x0, y, x1 - x0, h);
      const line = (i, colr, t, up) => { ctx.strokeStyle = RT.col(colr); ctx.lineWidth = 2; ctx.setLineDash(up ? [5, 4] : []); ctx.beginPath(); ctx.moveTo(X(i), y - 18); ctx.lineTo(X(i), y + h + 18); ctx.stroke(); ctx.setLineDash([]); RT.text(ctx, t, X(i), up ? y - 24 : y + h + 32, { size: 12, align: 'center', color: colr, weight: 600 }); };
      line(0.8 * In, '--mid', '80 % · ' + f1(0.8 * In) + ' A', true);
      line(In, '--bad', 'nominal ' + In + ' A', false);
      /* eje */
      ctx.fillStyle = RT.col('--ink-3'); ctx.font = `11px ${RT.FONT_MONO}`; ctx.textAlign = 'center';
      for (let a = 0; a <= max; a += 5) { ctx.fillText(a + ' A', X(a), y + h + 56); ctx.fillRect(X(a), y + h, 1, 4); }
      sim.set('S', f0(S) + ' VA');
      sim.set('I', f1(I) + ' A');
      sim.set('cap', f0(In * V) + ' VA (' + In + ' A × 120 V)');
      const m = I / In;
      let est;
      if (m <= 0.8) est = '<span class="chip ok">Holgado</span> por debajo del 80 % de la capacidad.';
      else if (m <= 1) est = '<span class="chip mid">Cargado</span> admisible para cargas no continuas.';
      else {
        const t = C.disparo(m, 'C');
        est = `<span class="chip bad">Sobrecarga</span> ${f0(100 * m)} % de la nominal: el interruptor dispara entre ${C.fmt(t.tmin, t.tmin < 10 ? 1 : 0)} s y ${t.tmax > 3600 ? 'más de 1 h' : C.fmt(t.tmax, 0) + ' s'}.`;
      }
      sim.set('est', est);
    });
  });

  RT.defineSim('neutro-abierto', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.group('Cargas');
    sim.slider('P1', { label: 'Carga en la fase A', min: 10, max: 2000, step: 10, value: 100, unit: 'W', fmt: f0 });
    sim.slider('P2', { label: 'Carga en la fase B', min: 10, max: 2000, step: 10, value: 1500, unit: 'W', fmt: f0 });
    sim.check('abierto', { label: 'Neutro abierto (conexión floja o cortada)', value: false });
    sim.out('V1', 'Tensión en la carga A', { hl: true });
    sim.out('V2', 'Tensión en la carga B', { hl: true });
    sim.out('IN', 'Corriente por el neutro');
    sim.out('P1r', 'Potencia real en A / B');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, Hh = cv.h;
      RT.draw.clear(cv);
      const R1 = 120 * 120 / sim.p.P1, R2 = 120 * 120 / sim.p.P2;
      let V1, V2, IN, I1, I2;
      if (!sim.p.abierto) { V1 = 120; V2 = 120; I1 = 120 / R1; I2 = 120 / R2; IN = Math.abs(I1 - I2); }
      else { const I = 240 / (R1 + R2); V1 = I * R1; V2 = I * R2; I1 = I; I2 = I; IN = 0; }
      /* esquema */
      const xL = W * 0.12, xR = W * 0.6, yA = Hh * 0.18, yN = Hh * 0.5, yB = Hh * 0.82;
      const wire = (y, colr, t) => { ctx.strokeStyle = RT.col(colr); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xL, y); ctx.lineTo(xR, y); ctx.stroke(); RT.text(ctx, t, xL - 8, y, { size: 12, align: 'right', baseline: 'middle', weight: 600, color: '--ink-2' }); };
      wire(yA, '--cond-negro', 'Fase A');
      wire(yB, '--cond-rojo', 'Fase B');
      ctx.strokeStyle = RT.col('--ink-3'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xL, yN); ctx.lineTo(xL + (xR - xL) * 0.45, yN); ctx.stroke();
      if (!sim.p.abierto) { ctx.beginPath(); ctx.moveTo(xL + (xR - xL) * 0.45, yN); ctx.lineTo(xR, yN); ctx.stroke(); }
      else { ctx.strokeStyle = RT.col('--bad'); ctx.beginPath(); ctx.moveTo(xL + (xR - xL) * 0.52, yN); ctx.lineTo(xR, yN); ctx.stroke(); RT.text(ctx, '✕ neutro abierto', xL + (xR - xL) * 0.485, yN - 12, { size: 12, align: 'center', color: '--bad', weight: 700 }); }
      RT.text(ctx, 'Neutro', xL - 8, yN, { size: 12, align: 'right', baseline: 'middle', weight: 600, color: '--ink-2' });
      /* cargas */
      const carga = (y0, y1, V, P, n) => {
        const x = xR, ym = (y0 + y1) / 2;
        ctx.strokeStyle = RT.col('--ink-2'); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, ym - 16); ctx.moveTo(x, ym + 16); ctx.lineTo(x, y1); ctx.stroke();
        const glow = Math.min(1, (V / 120) * (V / 120));
        ctx.beginPath(); ctx.arc(x, ym, 15, 0, 7); ctx.fillStyle = RT.alpha(V > 135 ? '--bad' : '--l-ilum', 0.15 + 0.6 * Math.min(1, glow)); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 10, ym - 10); ctx.lineTo(x + 10, ym + 10); ctx.moveTo(x - 10, ym + 10); ctx.lineTo(x + 10, ym - 10); ctx.stroke();
        RT.text(ctx, `${n}: ${f0(P)} W nominales`, x + 24, ym - 9, { size: 12, color: '--ink-2' });
        RT.text(ctx, `${f0(V)} V`, x + 24, ym + 11, { size: 16, weight: 700, color: V > 132 || V < 108 ? '--bad' : '--ok' });
      };
      carga(yA, yN, V1, sim.p.P1, 'Carga A');
      carga(yN, yB, V2, sim.p.P2, 'Carga B');
      sim.set('V1', f0(V1) + ' V' + (V1 > 132 ? ' · sobretensión' : V1 < 108 ? ' · subtensión' : ''));
      sim.set('V2', f0(V2) + ' V' + (V2 > 132 ? ' · sobretensión' : V2 < 108 ? ' · subtensión' : ''));
      sim.set('IN', f1(IN) + ' A');
      sim.set('P1r', f0((V1 * V1) / R1) + ' W / ' + f0((V2 * V2) / R2) + ' W');
    });
  });

  RT.defineSim('consumo-mes', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    const AP = [['duc', 'Ducha eléctrica', 3500, 0.67], ['nev', 'Nevera', 150, 10], ['ilu', 'Iluminación LED (12 puntos)', 242, 5], ['tv', 'Televisor', 120, 4], ['lav', 'Lavadora', 500, 0.5], ['pla', 'Plancha', 1000, 0.3], ['mic', 'Microondas', 1200, 0.25], ['pc', 'Computador', 65, 6]];
    sim.group('Horas de uso por día');
    AP.forEach(([id, n, w, h]) => sim.slider(id, { label: `${n} (${w} W)`, min: 0, max: id === 'nev' ? 24 : 12, step: 0.05, value: h, unit: 'h', fmt: (v) => C.fmt(v, 2) }));
    sim.group('Tarifa');
    sim.slider('tar', { label: 'Valor del kWh', min: 400, max: 1400, step: 10, value: 950, unit: '$/kWh', fmt: f0 });
    sim.out('E', 'Energía al mes (30 días)', { hl: true });
    sim.out('cop', 'Costo aproximado');
    sim.out('duc', 'Participación de la ducha');
    sim.onDraw(() => {
      const ctx = cv.ctx;
      RT.draw.clear(cv);
      const d = AP.map(([id, n, w]) => [n, (w * sim.p[id] * 30) / 1000]);
      const tot = d.reduce((s, x) => s + x[1], 0);
      const mx = Math.max(...d.map((x) => x[1]), 1);
      const p = new RT.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: mx * 1.15, ymin: 0, ymax: d.length, ml: 190, mb: 40, grid: true, xlabel: 'kWh al mes', yticks: [], zero: false });
      p.frame();
      d.forEach(([n, e], i) => {
        const yy = p.Y(d.length - i - 0.5);
        ctx.fillStyle = RT.alpha(i === 0 ? '--accent' : '--c1', 0.75);
        ctx.fillRect(p.X(0), yy - 9, p.X(e) - p.X(0), 18);
        RT.text(ctx, n, p.X(0) - 8, yy, { size: 12, align: 'right', baseline: 'middle', color: '--ink-2' });
        RT.text(ctx, C.fmt(e, 1), p.X(e) + 6, yy, { size: 11.5, baseline: 'middle', color: '--ink-2', mono: true });
      });
      sim.set('E', C.fmt(tot, 0) + ' kWh');
      sim.set('cop', '$ ' + C.fmt(tot * sim.p.tar, 0));
      sim.set('duc', C.fmt((100 * d[0][1]) / (tot || 1), 0) + ' %');
    });
  });
})();
