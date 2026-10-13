/* Capítulo 7 — Puesta a tierra y equipotencialidad */
(function () {
  'use strict';
  const RT = window.RT, C = RT.L.C, N = RT.L.N;
  const f0 = (v) => C.fmt(v, 0), f1 = (v) => C.fmt(v, 1), f2 = (v) => C.fmt(v, 2);

  RT.defineSim('tn-cs', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.group('Instalación');
    sim.slider('I', { label: 'Corriente de la carga', min: 1, max: 20, step: 0.5, value: 10, unit: 'A', fmt: f1 });
    sim.check('malo', { label: 'Puente indebido neutro-tierra en una caja de toma', value: false });
    sim.check('abre', { label: 'Neutro abierto entre el tablero y la caja', value: false });
    sim.out('IN', 'Corriente por el neutro');
    sim.out('IT', 'Corriente por el conductor de tierra', { hl: true });
    sim.out('Vm', 'Tensión de las carcasas respecto a tierra', { hl: true });
    sim.out('dx', 'Diagnóstico', { wide: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      RT.draw.clear(cv);
      const I = sim.p.I, malo = sim.p.malo, abre = sim.p.abre;
      let IN = I, IT = 0, Vm = 0, dx;
      if (malo && !abre) { IN = I / 2; IT = I / 2; Vm = I / 2 * 0.15; dx = 'La mitad de la corriente vuelve por el conductor de tierra y las carcasas: un GFCI aguas arriba dispararía y el conductor de protección deja de estar libre para despejar fallas.'; }
      else if (malo && abre) { IN = 0; IT = I; Vm = I * 0.3; dx = 'Toda la corriente de carga vuelve por el conductor de tierra. Si además se interrumpe la tierra, las carcasas quedan al potencial de la fase a través de la carga: peligro de choque.'; }
      else if (abre) { IN = 0; IT = 0; Vm = 0; dx = 'Con el neutro abierto la carga se apaga, pero las carcasas siguen a cero voltios porque la tierra está libre: el sistema falla de forma segura.'; }
      else dx = 'Correcto: el neutro lleva la corriente de retorno y la tierra solo transporta corriente durante una falla.';
      const y = { F: H * 0.2, N: H * 0.4, T: H * 0.6 };
      const xT = W * 0.06, xTG = W * 0.3, xC = W * 0.68, xL = W * 0.88;
      /* transformador y red */
      ctx.strokeStyle = RT.col('--ink-2'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(xT + 10, H * 0.3, 14, 0, 7); ctx.arc(xT + 10, H * 0.3 + 22, 14, 0, 7); ctx.stroke();
      RT.text(ctx, 'transformador', xT + 10, H * 0.3 - 22, { size: 11, align: 'center', color: '--ink-3' });
      const linea = (y0, x0, x1, col, w, dash) => { ctx.strokeStyle = RT.col(col); ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke(); ctx.setLineDash([]); };
      linea(y.F, xT + 26, xL, '--cond-negro', 3);
      linea(y.N, xT + 26, xTG, '--ink-3', 4);
      RT.text(ctx, 'PEN (acometida)', (xT + xTG) / 2, y.N - 8, { size: 11, align: 'center', color: '--ink-3' });
      linea(y.N, xTG, abre ? (xTG + xC) / 2 - 10 : xC, '--ink-3', 3);
      if (abre) { linea(y.N, (xTG + xC) / 2 + 10, xL, '--ink-3', 3); RT.text(ctx, '✕', (xTG + xC) / 2, y.N + 5, { size: 16, align: 'center', color: '--bad', weight: 700 }); }
      else linea(y.N, xC, xL, '--ink-3', 3);
      linea(y.T, xTG, xL, '--cond-verde', 3, IT > 0 ? [] : [7, 4]);
      /* tablero */
      ctx.fillStyle = RT.alpha('--accent', 0.12); ctx.fillRect(xTG - 22, y.F - 22, 44, y.T - y.F + 44); ctx.strokeStyle = RT.col('--accent'); ctx.strokeRect(xTG - 22, y.F - 22, 44, y.T - y.F + 44);
      RT.text(ctx, 'TG', xTG, y.F - 30, { size: 12, align: 'center', weight: 700, color: '--accent' });
      ctx.strokeStyle = RT.col('--l-tierra'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xTG, y.N); ctx.lineTo(xTG, y.T); ctx.stroke();
      RT.text(ctx, 'puente', xTG + 26, (y.N + y.T) / 2, { size: 11, color: '--l-tierra' });
      /* electrodo */
      ctx.beginPath(); ctx.moveTo(xTG, y.T); ctx.lineTo(xTG, H * 0.86); ctx.stroke();
      RT.simbolo(ctx, 'tierra', xTG, H * 0.88, 11, { color: '--l-tierra' });
      /* caja con puente indebido */
      ctx.strokeStyle = RT.col('--ink-2'); ctx.lineWidth = 1.2; ctx.strokeRect(xC - 18, y.F - 14, 36, y.T - y.F + 28);
      RT.text(ctx, 'caja de toma', xC, y.T + 30, { size: 11, align: 'center', color: '--ink-3' });
      if (malo) { ctx.strokeStyle = RT.col('--bad'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xC, y.N); ctx.lineTo(xC, y.T); ctx.stroke(); RT.text(ctx, 'puente indebido', xC + 22, (y.N + y.T) / 2, { size: 11, color: '--bad', weight: 600 }); }
      /* carga */
      ctx.strokeStyle = RT.col('--ink'); ctx.lineWidth = 2; ctx.strokeRect(xL - 6, y.F - 10, 30, y.N - y.F + 20);
      RT.text(ctx, 'carga', xL + 9, y.F - 16, { size: 11, align: 'center' });
      RT.text(ctx, `neutro ${f1(IN)} A`, (xTG + xC) / 2, y.N - 9, { size: 12, align: 'center', weight: 600, color: '--ink-2' });
      RT.text(ctx, `tierra ${f1(IT)} A`, (xTG + xC) / 2, y.T - 9, { size: 12, align: 'center', weight: 600, color: IT > 0 ? '--bad' : '--l-tierra' });
      sim.set('IN', f1(IN) + ' A');
      sim.set('IT', f1(IT) + ' A');
      sim.set('Vm', f1(Vm) + ' V' + (malo && abre ? ' (si se abre la tierra: hasta 120 V)' : ''));
      sim.set('dx', dx);
    });
  });

  RT.defineSim('varillas', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.group('Suelo y electrodo');
    sim.slider('rho', { label: 'Resistividad del suelo', min: 10, max: 1000, step: 5, value: 100, log: true, unit: 'Ω·m', fmt: f0 });
    sim.slider('L', { label: 'Longitud de la varilla', min: 1.5, max: 3.6, step: 0.1, value: 2.4, unit: 'm', fmt: f1 });
    sim.seg('d', { label: 'Diámetro', options: [[12.7, '1/2 in'], [14.2, '9/16 in'], [15.9, '5/8 in']], value: 15.9 });
    sim.group('Arreglo');
    sim.slider('n', { label: 'Número de varillas en línea', min: 1, max: 5, step: 1, value: 1, fmt: f0 });
    sim.slider('s', { label: 'Separación entre varillas', min: 0.5, max: 6, step: 0.1, value: 2.4, unit: 'm', fmt: f1 });
    sim.out('R1', 'Una varilla');
    sim.out('R', 'Resistencia del arreglo', { hl: true });
    sim.out('ref', 'Frente a 25 Ω (Tabla 3.12.3.a)');
    sim.out('cum', 'Requisitos del electrodo', { wide: true });
    sim.onDraw(() => {
      const ctx = cv.ctx;
      RT.draw.clear(cv);
      const { rho, L, n, s } = sim.p, d = +sim.p.d;
      const pts = Array.from({ length: n }, (_, i) => [i * s, 0]);
      const r = C.rVarillas(rho, L, d, pts);
      const p = new RT.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: 5, ymin: 0, ymax: Math.max(30, r.R1 * 1.15), xlabel: 'número de varillas (separación fija)', ylabel: 'resistencia (Ω)', xticks: [1, 2, 3, 4, 5] });
      p.frame();
      p.hline(25, { color: '--bad', dash: [5, 4] });
      RT.text(ctx, '25 Ω', p.X(4.95), p.Y(25) - 5, { size: 11.5, align: 'right', color: '--bad' });
      for (const [ss, col, lab] of [[0.5, '--ink-3', 'a 0,5 m'], [s, '--accent', 'a ' + f1(s) + ' m'], [6, '--c1', 'a 6 m']]) {
        const curve = [1, 2, 3, 4, 5].map((k) => [k, C.rVarillas(rho, L, d, Array.from({ length: k }, (_, i) => [i * ss, 0])).R]);
        p.path(curve, { color: col, width: col === '--accent' ? 2.6 : 1.4, dash: col === '--accent' ? [] : [4, 3] });
        curve.forEach((q) => p.dot(q[0], q[1], { color: col, r: col === '--accent' ? 4 : 2.5 }));
        RT.text(ctx, lab, p.X(5) - 4, p.Y(curve[4][1]) - 6, { size: 11, align: 'right', color: col });
      }
      p.dot(n, r.R, { color: '--ink', r: 6 });
      sim.set('R1', f1(r.R1) + ' Ω');
      sim.set('R', f1(r.R) + ' Ω');
      sim.set('ref', r.R <= 25 ? '<span class="chip ok">por debajo</span>' : '<span class="chip bad">por encima</span>: agregue varillas, sepárelas o mejore el suelo');
      sim.set('cum', (L >= 2.4 ? '✓ longitud ≥ 2,4 m' : '✗ longitud menor a 2,4 m (Libro 2, 2.3.15.1.1 f)') + ' · ' + (d >= 12.7 ? '✓ diámetro ≥ 12,7 mm si es de cobre; ≥ 14 mm si es acero recubierto' : ''));
    });
  });

  RT.defineSim('wenner', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.group('Suelo de dos capas');
    sim.slider('r1', { label: 'Resistividad capa superior ρ1', min: 10, max: 1000, step: 5, value: 60, log: true, unit: 'Ω·m', fmt: f0 });
    sim.slider('r2', { label: 'Resistividad capa inferior ρ2', min: 10, max: 2000, step: 5, value: 400, log: true, unit: 'Ω·m', fmt: f0 });
    sim.slider('h', { label: 'Espesor de la capa superior', min: 0.3, max: 6, step: 0.1, value: 1.5, unit: 'm', fmt: f1 });
    sim.group('Medición');
    sim.slider('a', { label: 'Separación entre electrodos a', min: 0.5, max: 20, step: 0.1, value: 2, log: true, unit: 'm', fmt: f1 });
    sim.out('R', 'Resistencia leída V/I');
    sim.out('ra', 'Resistividad aparente 2πaR', { hl: true });
    sim.out('b', 'Profundidad máxima de los electrodos');
    sim.onDraw(() => {
      const ctx = cv.ctx;
      RT.draw.clear(cv);
      const { r1, r2, h, a } = sim.p;
      const ra = C.wenner2(a, r1, r2, h);
      const curve = [];
      for (let k = 0; k <= 120; k++) { const aa = 0.5 * Math.pow(40, k / 120); curve.push([aa, C.wenner2(aa, r1, r2, h)]); }
      const ys = curve.map((q) => q[1]);
      const p = new RT.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.5, xmax: 20, xlog: true, ymin: Math.min(...ys) * 0.7, ymax: Math.max(...ys) * 1.3, ylog: true, xlabel: 'separación a (m)', ylabel: 'resistividad aparente (Ω·m)' });
      p.frame();
      p.hline(r1, { color: '--c3', dash: [4, 4] }); p.hline(r2, { color: '--c1', dash: [4, 4] });
      RT.text(ctx, 'ρ1', p.X(0.55), p.Y(r1) - 5, { size: 11.5, color: '--c3' }); RT.text(ctx, 'ρ2', p.X(0.55), p.Y(r2) - 5, { size: 11.5, color: '--c1' });
      p.path(curve, { color: '--accent', width: 2.4 });
      p.dot(a, ra, { color: '--ink', r: 6 });
      sim.set('R', f2(ra / (2 * Math.PI * a)) + ' Ω');
      sim.set('ra', f0(ra) + ' Ω·m');
      sim.set('b', C.fmt(a / 10, 2) + ' m (b ≤ a/10 para usar ρ = 2πaR)');
    });
  });

  RT.defineSim('caida-potencial', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.group('Montaje');
    sim.slider('D', { label: 'Distancia al electrodo de corriente', min: 5, max: 60, step: 1, value: 30, unit: 'm', fmt: f0 });
    sim.slider('x', { label: 'Posición de la sonda de tensión', min: 1, max: 59, step: 0.5, value: 18.5, unit: 'm', fmt: f1 });
    sim.slider('rho', { label: 'Resistividad del suelo', min: 20, max: 500, step: 5, value: 100, unit: 'Ω·m', fmt: f0 });
    sim.button('Llevar la sonda al 61,8 %', () => { sim.ctl.x.set(Math.round(0.618 * sim.p.D * 2) / 2); });
    sim.out('Rv', 'Resistencia verdadera (una varilla)');
    sim.out('Rm', 'Lectura con la sonda en x', { hl: true });
    sim.out('e', 'Error de la lectura');
    sim.out('ok', 'Distancia mínima recomendada');
    sim.onDraw(() => {
      const ctx = cv.ctx;
      RT.draw.clear(cv);
      const D = sim.p.D, rho = sim.p.rho, x = Math.min(sim.p.x, D - 0.5);
      const Rt = C.rVarilla(rho, 2.4, 15.9);
      const curve = [];
      for (let k = 1; k < 200; k++) { const xx = (k / 200) * D; curve.push([xx, C.caidaPotencial(xx, D, rho, Rt)]); }
      const p = new RT.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: D, ymin: 0, ymax: Rt * 2, xlabel: 'posición de la sonda de tensión (m)', ylabel: 'resistencia medida (Ω)' });
      p.frame();
      p.hline(Rt, { color: '--ok', dash: [5, 4] });
      p.vline(0.618 * D, { color: '--accent', dash: [3, 3] });
      RT.text(ctx, '61,8 %', p.X(0.618 * D) + 4, p.Y(Rt * 1.9), { size: 11.5, color: '--accent' });
      p.clip(() => p.path(curve, { color: '--c1', width: 2.4 }));
      const Rm = C.caidaPotencial(x, D, rho, Rt);
      p.dot(x, Math.min(Rm, Rt * 2), { color: '--ink', r: 6 });
      sim.set('Rv', f1(Rt) + ' Ω');
      sim.set('Rm', f1(Rm) + ' Ω');
      sim.set('e', C.fmt((100 * (Rm - Rt)) / Rt, 1) + ' %');
      sim.set('ok', 'd ≥ 5 × 2,4 m = 12 m ' + (D >= 12 ? '<span class="chip ok">cumple</span>' : '<span class="chip bad">corto</span>'));
    });
  });

  RT.defineSim('tension-contacto', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.group('Falla');
    sim.slider('t', { label: 'Tiempo de despeje de la falla', min: 0.05, max: 3, step: 0.01, value: 0.5, log: true, unit: 's', fmt: f2 });
    sim.slider('U', { label: 'Tensión de contacto esperada', min: 10, max: 400, step: 1, value: 60, unit: 'V', fmt: f0 });
    sim.out('lp', 'Máxima, público en general', { hl: true });
    sim.out('lo', 'Máxima, ocupacional (IEEE 80, 50 kg)');
    sim.out('r', 'Resultado', { wide: true });
    sim.onDraw(() => {
      const ctx = cv.ctx;
      RT.draw.clear(cv);
      const p = new RT.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.04, xmax: 4, xlog: true, ymin: 0, ymax: 560, xlabel: 'tiempo de despeje (s)', ylabel: 'tensión de contacto máxima (V)' });
      p.frame();
      const pub = [], ocu = [];
      for (let k = 0; k <= 120; k++) { const t = 0.05 * Math.pow(60, k / 120); pub.push([t, N.contactoMax(t, 1)]); ocu.push([t, N.contactoMax(t, 2)]); }
      p.path(pub, { color: '--accent', width: 2.4 });
      p.path(ocu, { color: '--c1', width: 1.6, dash: [5, 4] });
      N.CONTACTO.forEach(([t, a, b]) => { p.dot(Math.min(t, 3), a, { color: '--accent', r: 3.5 }); p.dot(Math.min(t, 3), b, { color: '--c1', r: 3 }); });
      RT.text(ctx, 'público (IEC, curva C1)', p.X(0.06), p.Y(330), { size: 11.5, color: '--accent' });
      RT.text(ctx, 'ocupacional (IEEE 80)', p.X(0.06), p.Y(540), { size: 11.5, color: '--c1' });
      const lp = N.contactoMax(sim.p.t, 1), lo = N.contactoMax(sim.p.t, 2);
      p.dot(sim.p.t, sim.p.U, { color: sim.p.U <= lp ? '--ok' : '--bad', r: 7 });
      sim.set('lp', f0(lp) + ' V');
      sim.set('lo', f0(lo) + ' V');
      sim.set('r', sim.p.U <= lp ? `<span class="chip ok">Admisible</span> ${f0(sim.p.U)} V durante ${f2(sim.p.t)} s está por debajo del límite para público.` : `<span class="chip bad">Excede</span> reduzca el tiempo de despeje (diferencial, disparo magnético) o la tensión de contacto (equipotencializar, mejor tierra).`);
    });
  });
})();
