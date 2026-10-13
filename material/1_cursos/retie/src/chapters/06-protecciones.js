/* Capítulo 6 — Interruptores, diferenciales y DPS */
(function () {
  'use strict';
  const RT = window.RT, C = RT.L.C, N = RT.L.N;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1), f2 = (v) => C.fmt(v, 2);
  const tfmt = (t) => (!isFinite(t) ? 'no dispara' : t < 1 ? f0(1000 * t) + ' ms' : t < 120 ? f1(t) + ' s' : f0(t / 60) + ' min');

  RT.defineSim('curva-disparo', function (sim) {
    const cv = sim.canvas({ aspect: 1.3, maxH: '640px' });
    sim.group('Interruptor');
    sim.seg('In', { label: 'Corriente nominal', options: [[15, '15'], [20, '20'], [30, '30'], [40, '40'], [60, '60 A']], value: 20 });
    sim.seg('cur', { label: 'Curva', options: [['B', 'B'], ['C', 'C'], ['D', 'D']], value: 'C' });
    sim.group('Conductor y carga');
    sim.seg('awg', { label: 'Conductor', options: [['14', '14'], ['12', '12'], ['10', '10'], ['8', '8'], ['6', '6 AWG']], value: '12' });
    sim.slider('I', { label: 'Corriente que circula', min: 1, max: 3000, step: 1, value: 30, log: true, unit: 'A', fmt: f0 });
    sim.out('m', 'Múltiplo de la nominal');
    sim.out('t', 'Tiempo de disparo', { hl: true });
    sim.out('dano', 'Daño del conductor (adiabático)');
    sim.out('co', 'Coordinación', { wide: true });
    sim.legend([{ color: '--accent', kind: 'sq', label: 'banda de disparo' }, { color: '--bad', label: 'daño del conductor en cortocircuito (I²t, hasta 5 s)' }, { color: '--ink', kind: 'dot', label: 'corriente del circuito' }]);
    sim.onDraw(() => {
      const ctx = cv.ctx;
      RT.draw.clear(cv);
      const In = +sim.p.In, cur = sim.p.cur, awg = sim.p.awg, S = C.awgArea(awg), k = 115;
      const p = new RT.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: 10000, ymin: 0.001, ymax: 10000, xlog: true, ylog: true, xlabel: 'corriente (A)', ylabel: 'tiempo (s)', ml: 56 });
      p.frame();
      const sup = [], inf = [];
      for (let q = 0; q <= 300; q++) {
        const m = 1.13 * Math.pow(10, (q / 300) * Math.log10(600 / 1.13));
        const t = C.disparo(m, cur);
        if (isFinite(t.tmax)) sup.push([m * In, Math.min(10000, Math.max(0.001, t.tmax))]);
        if (isFinite(t.tmin)) inf.push([m * In, Math.min(10000, Math.max(0.001, t.tmin))]);
      }
      p.clip((c) => {
        c.beginPath();
        sup.forEach((q, i) => (i ? c.lineTo(p.X(q[0]), p.Y(q[1])) : c.moveTo(p.X(q[0]), p.Y(q[1]))));
        for (let i = inf.length - 1; i >= 0; i--) c.lineTo(p.X(inf[i][0]), p.Y(inf[i][1]));
        c.closePath(); c.fillStyle = RT.alpha('--accent', 0.22); c.fill();
        c.strokeStyle = RT.col('--accent'); c.lineWidth = 1.5; c.stroke();
      });
      /* límite adiabático del conductor: t = (kS/I)² */
      const dmg = [];
      for (let q = 0; q <= 100; q++) { const I = Math.pow(10, 0.3 + (q / 100) * 3.7); const t = Math.pow((k * S) / I, 2); if (t <= 5 && t >= 0.001) dmg.push([I, t]); }
      p.clip(() => p.path(dmg, { color: '--bad', width: 2 }));
      const Iz = N.AMPACIDAD[awg][0];
      p.vline(Iz, { color: '--bad', dash: [4, 4] });
      RT.text(ctx, `Iz ${Iz} A`, p.X(Iz) + 4, p.Y(4000), { size: 11, color: '--bad' });
      p.vline(In, { color: '--accent', dash: [2, 3] });
      const I = sim.p.I, m = I / In, td = C.disparo(m, cur);
      const ty = isFinite(td.tmax) ? Math.max(0.001, Math.min(10000, td.tmax)) : 10000;
      p.dot(I, ty, { color: '--ink', r: 6 });
      const tdm = Math.pow((k * S) / I, 2);
      sim.set('m', f2(m) + ' × In');
      sim.set('t', isFinite(td.tmax) ? 'entre ' + tfmt(td.tmin) + ' y ' + tfmt(td.tmax) : 'no dispara (por debajo de 1,13 × In)');
      sim.set('dano', I > Iz * 3 ? tfmt(tdm) : 'sobrecarga: daño lento por temperatura');
      const ok = In <= C.protMax(awg, 60);
      sim.set('co', ok ? `<span class="chip ok">Coordinado</span> In = ${In} A ≤ protección máxima del ${awg} AWG (${C.protMax(awg, 60)} A).` : `<span class="chip bad">No coordinado</span> el ${awg} AWG admite como máximo ${C.protMax(awg, 60)} A.`);
    });
  });

  RT.defineSim('coordinacion', function (sim) {
    const box = RT.el('div', 'doc-out');
    sim.stage.append(box);
    const CARGAS = { ducha: ['Ducha eléctrica 3 500 W, 120 V', 3500, 120, true], estufa: ['Estufa 6 kW, 240 V', 6000, 240, false], cocina: ['Pequeños artefactos de cocina 1 500 VA', 1500, 120, false], alum: ['Alumbrado de la casa 242 W', 242, 120, false], calent: ['Calentador de paso 5 500 W, 240 V', 5500, 240, true] };
    sim.group('Carga');
    sim.select('c', { options: Object.keys(CARGAS).map((k) => [k, CARGAS[k][0]]), value: 'ducha', onInput: (k) => { sim.ctl.cont.set(CARGAS[k][3], true); } });
    sim.check('cont', { label: 'Carga continua (3 h o más): Ib al 125 %', value: false });
    sim.group('Selección');
    sim.seg('awg', { label: 'Conductor', options: [['14', '14'], ['12', '12'], ['10', '10'], ['8', '8 AWG']], value: '10' });
    sim.seg('In', { label: 'Interruptor', options: [[15, '15'], [20, '20'], [30, '30'], [40, '40'], [50, '50 A']], value: 30 });
    sim.out('Ib', 'Ib (corriente de diseño)');
    sim.out('Iz', 'Iz (60 °C) y protección máxima');
    sim.out('ok', 'Resultado', { hl: true });
    const pintar = () => {
      const [n, W, V] = CARGAS[sim.p.c];
      const Ic = W / V, Ib = sim.p.cont ? 1.25 * Ic : Ic;
      const r = C.coordinar({ Ib: Ic, In: +sim.p.In, awg: sim.p.awg, continua: sim.p.cont });
      const sugIn = C.breakerUp(Ib), sugAwg = C.calibrePara(sugIn);
      sim.set('Ib', f1(Ib) + ' A' + (sim.p.cont ? ' (' + f1(Ic) + ' A × 1,25)' : ''));
      sim.set('Iz', r.Iz + ' A · máx. ' + r.pmax + ' A');
      sim.set('ok', r.ok ? 'Ib ≤ In ≤ Iz ✓' : !r.okCarga ? 'In menor que Ib ✗' : 'In mayor que lo que admite el conductor ✗');
      box.innerHTML = `<h4>${n}</h4>
        <p>Corriente de la carga \\(I = ${f0(W)}/${V} = ${f1(Ic)}\\ \\text{A}\\)${sim.p.cont ? `; por ser continua, \\(I_b = 1{,}25 \\times ${f1(Ic)} = ${f1(Ib)}\\ \\text{A}\\)` : ''}.</p>
        <table><tr><th>Condición</th><th>Valores</th><th>Cumple</th></tr>
        <tr><td>Ib ≤ In</td><td>${f1(Ib)} A ≤ ${sim.p.In} A</td><td>${r.okCarga ? '<span class="chip ok">sí</span>' : '<span class="chip bad">no</span>'}</td></tr>
        <tr><td>In ≤ protección máxima del conductor</td><td>${sim.p.In} A ≤ ${r.pmax} A (${sim.p.awg} AWG, 60 °C${N.MAX_OCPD[sim.p.awg] ? ', 240.4(D)' : ''})</td><td>${r.okConductor ? '<span class="chip ok">sí</span>' : '<span class="chip bad">no</span>'}</td></tr></table>
        <p style="margin-top:10px"><b>Selección mínima coordinada:</b> interruptor de ${sugIn} A con conductor ${sugAwg} AWG.</p>
        ${sim.p.c === 'ducha' ? '<p style="font-size:14px;color:var(--ink-3)">RETIE 3.17.15 b: circuito exclusivo para la ducha; si no se conoce el equipo, el circuito se dimensiona para 30 A.</p>' : ''}`;
      if (RT.typeset) RT.typeset(box);
    };
    sim.onChange = pintar;
    pintar();
  });

  RT.defineSim('diferencial', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.group('Situación');
    sim.seg('modo', { options: [['fuga', 'Fuga a tierra'], ['pt', 'Persona fase-tierra'], ['pn', 'Persona fase-neutro']], value: 'fuga' });
    sim.slider('Ic', { label: 'Corriente de la carga', min: 0.5, max: 20, step: 0.5, value: 8, unit: 'A', fmt: f1 });
    sim.slider('If', { label: 'Corriente de fuga o por la persona', min: 0, max: 100, step: 1, value: 10, unit: 'mA', fmt: f0 });
    sim.seg('tipo', { label: 'Dispositivo', options: [['gfci', 'GFCI 5 mA'], ['rcd', 'Diferencial 30 mA']], value: 'gfci' });
    sim.out('IF', 'Corriente por la fase');
    sim.out('IN', 'Corriente por el neutro');
    sim.out('d', 'Diferencia que ve el núcleo', { hl: true });
    sim.out('r', 'Respuesta', { hl: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const Ic = sim.p.Ic, If = sim.p.If / 1000, modo = sim.p.modo;
      const IF = Ic + If, IN = modo === 'pn' ? Ic + If : Ic;
      const d = Math.abs(IF - IN) * 1000;
      const thr = sim.p.tipo === 'gfci' ? 4 : 15;
      const tr = d >= thr ? (sim.p.tipo === 'gfci' ? C.gfciT(d) : C.rcdT(d)) : Infinity;
      /* núcleo */
      const cx = W * 0.3, cy = H * 0.48, R = Math.min(W, H) * 0.24;
      ctx.lineWidth = R * 0.32; ctx.strokeStyle = RT.alpha('--ink-3', 0.35); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = RT.col(d >= thr ? '--bad' : '--ok');
      for (let k = 0; k < 14; k++) { const a = Math.PI * 1.1 + (k / 13) * 0.8; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * R, cy + Math.sin(a) * R, R * 0.22, R * 0.07, a, 0, 7); ctx.stroke(); }
      RT.text(ctx, 'bobina de disparo', cx - R * 1.25, cy + R * 0.95, { size: 11.5, color: d >= thr ? '--bad' : '--ok', align: 'center' });
      const cond = (dy, col, t, I, dir) => {
        ctx.strokeStyle = RT.col(col); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(W * 0.04, cy + dy); ctx.lineTo(W * 0.72, cy + dy); ctx.stroke();
        RT.draw.arrow(ctx, W * (dir > 0 ? 0.46 : 0.56), cy + dy - 12, W * (dir > 0 ? 0.56 : 0.46), cy + dy - 12, { color: col, width: 2 });
        RT.text(ctx, `${t}: ${f2(I)} A`, W * 0.58, cy + dy - 14, { size: 12, color: '--ink-2', weight: 600 });
      };
      cond(-R * 0.25, '--cond-negro', 'fase', IF, 1);
      cond(R * 0.25, '--ink-3', 'neutro', IN, -1);
      /* carga */
      ctx.strokeStyle = RT.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(W * 0.72, cy - R * 0.55, W * 0.1, R * 1.1);
      RT.text(ctx, 'carga', W * 0.77, cy + 4, { size: 12, align: 'center' });
      if (modo !== 'pn') {
        ctx.strokeStyle = RT.col('--l-tierra'); ctx.setLineDash([5, 4]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(W * 0.8, cy + R * 0.55); ctx.lineTo(W * 0.8, H * 0.9); ctx.lineTo(W * 0.05, H * 0.9); ctx.stroke(); ctx.setLineDash([]);
        RT.text(ctx, (modo === 'fuga' ? 'fuga por la carcasa a tierra: ' : 'corriente por la persona a tierra: ') + f0(sim.p.If) + ' mA (no vuelve por el neutro)', W * 0.42, H * 0.9 - 8, { size: 12, align: 'center', color: '--l-tierra', weight: 600 });
      } else RT.text(ctx, 'la persona toca fase y neutro: la corriente vuelve por el neutro', W * 0.42, H * 0.9 - 8, { size: 12, align: 'center', color: '--bad', weight: 600 });
      sim.set('IF', C.fmt(IF, 3) + ' A');
      sim.set('IN', C.fmt(IN, 3) + ' A');
      sim.set('d', f0(d) + ' mA');
      sim.set('r', isFinite(tr) ? 'Dispara en ' + tfmt(tr) : modo === 'pn' && sim.p.If > 0 ? 'No dispara: no hay diferencia que medir' : 'No dispara: diferencia menor que el umbral');
    });
  });
})();
