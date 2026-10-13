/* Capítulo 1 — El dinero, sin mitos */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L;

  /* ======================================================================
     1.1 La bañera del patrimonio
     ====================================================================== */
  CC.defineSim('banera', function (sim) {
    sim.cols2();
    const ct = sim.canvas({ aspect: 1.0, label: 'Bañera con llaves de ingreso y rendimiento y desagüe de gasto' });
    const cg = sim.canvas({ aspect: 1.0, label: 'Patrimonio a lo largo de 30 años' });
    sim.group('Flujos mensuales');
    sim.slider('I', { label: 'Ingreso mensual', min: 500000, max: 20000000, step: 50000, value: 3500000, fmt: CC.copS });
    sim.slider('G', { label: 'Gasto mensual', min: 500000, max: 20000000, step: 50000, value: 3100000, fmt: CC.copS });
    sim.group('Rendimiento y deuda');
    sim.slider('r', { label: 'Rentabilidad anual del ahorro', min: 0, max: 0.12, step: 0.005, value: 0.04, fmt: (v) => CC.pct(v) });
    sim.slider('rd', { label: 'Tasa mensual si hay deuda', min: 0.005, max: 0.03, step: 0.001, value: 0.02, fmt: (v) => CC.pct(v) });
    sim.slider('W0', { label: 'Patrimonio inicial', min: -20000000, max: 100000000, step: 1000000, value: 0, fmt: CC.copS });
    sim.out('ah', 'Ahorro mensual (I − G)', { hl: true });
    sim.out('w10', 'Patrimonio a 10 años');
    sim.out('w30', 'Patrimonio a 30 años', { hl: true });
    sim.out('rend', 'Parte del saldo final que es rendimiento');
    sim.out('cien', 'Años para llegar a $100 millones');
    const Y = 30;
    let serie = [], aport = [], t = 0, hold = 0;
    const compute = () => {
      const rm = L.tvm.eaToPeriodic(sim.p.r, 12), A = sim.p.I - sim.p.G;
      let W = sim.p.W0;
      serie = [W]; aport = [W];
      for (let k = 1; k <= Y * 12; k++) {
        W = W * (1 + (W >= 0 ? rm : sim.p.rd)) + A;
        serie.push(W); aport.push(sim.p.W0 + A * k);
      }
    };
    compute();
    sim.onChange = () => { compute(); t = 0; hold = 0; };
    sim.animate((dt) => { if (t < Y) t = Math.min(Y, t + dt * 4); else if ((hold += dt) > 2.5) { t = 0; hold = 0; } });
    sim.onDraw(() => {
      const km = Math.round(t * 12), W = serie[km];
      const wmax = Math.max(20e6, ...serie.map(Math.abs));
      /* ---- Bañera ---- */
      const ctx = ct.ctx, w = ct.w, h = ct.h;
      CC.draw.clear(ct);
      const bx = w * 0.18, bw = w * 0.64, by = h * 0.3, bh = h * 0.42;
      const lvl = Math.max(0, Math.min(1, W / wmax));
      /* agua */
      ctx.fillStyle = CC.alpha('--c1', 0.35);
      ctx.fillRect(bx, by + bh * (1 - lvl), bw, bh * lvl);
      /* deuda: hueco bajo el piso */
      if (W < 0) {
        const dl = Math.min(1, -W / wmax);
        ctx.fillStyle = CC.alpha('--loss', 0.35);
        ctx.fillRect(bx + bw * 0.1, by + bh, bw * 0.8, h * 0.2 * dl);
        CC.text(ctx, 'deuda ' + CC.copS(-W), bx + bw / 2, by + bh + h * 0.2 * dl + 15, { size: 12, align: 'center', color: '--loss', weight: 650, halo: true });
      }
      ctx.strokeStyle = CC.col('--ink');
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by);
      ctx.stroke();
      const rm = W >= 0 ? L.tvm.eaToPeriodic(sim.p.r, 12) : sim.p.rd;
      const flujo = (x, y0, y1, val, col) => {
        const ww = Math.max(1.5, Math.min(26, 26 * Math.sqrt(Math.abs(val) / 8e6)));
        ctx.fillStyle = CC.alpha(col, 0.55);
        ctx.fillRect(x - ww / 2, y0, ww, y1 - y0);
      };
      /* llave de ingreso */
      flujo(bx + bw * 0.22, h * 0.1, by + bh * (1 - lvl), sim.p.I, '--c1');
      ctx.fillStyle = CC.col('--ink-2');
      ctx.fillRect(bx + bw * 0.22 - 22, h * 0.07, 34, 9);
      CC.text(ctx, 'ingreso ' + CC.copS(sim.p.I), bx + bw * 0.22 - 22, h * 0.05, { size: 12, color: '--c1', weight: 650 });
      /* llave del rendimiento */
      const rend = rm * W;
      if (Math.abs(rend) > 1) flujo(bx + bw * 0.7, h * 0.16, by + bh * (1 - lvl), rend, rend >= 0 ? '--gain' : '--loss');
      ctx.fillStyle = CC.col('--ink-3');
      ctx.fillRect(bx + bw * 0.7 - 14, h * 0.135, 26, 7);
      CC.text(ctx, (rend >= 0 ? 'rendimiento ' : 'intereses −') + CC.copS(Math.abs(rend)) + ' al mes', w - 8, h * 0.11, { size: 11.5, color: rend >= 0 ? '--gain' : '--loss', weight: 600, align: 'right', halo: true });
      /* desagüe del gasto */
      flujo(bx + bw * 0.86, by + bh, h * 0.93, sim.p.G, '--loss');
      CC.text(ctx, 'gasto ' + CC.copS(sim.p.G), bx + bw * 0.86 - 16, h * 0.97, { size: 12, color: '--loss', weight: 650, align: 'right' });
      CC.text(ctx, `año ${Math.floor(t)}`, 12, h - 12, { size: 14, weight: 700 });
      CC.text(ctx, 'patrimonio ' + CC.copS(W), bx + bw / 2, by + bh - 10, { size: 13, align: 'center', weight: 700, color: W >= 0 ? '--ink' : '--loss', halo: true });
      /* ---- Gráfica ---- */
      CC.draw.clear(cg);
      const ymin = Math.min(0, ...serie, ...aport), ymax = Math.max(1e6, ...serie, ...aport) * 1.05;
      const pl = new CC.Plot(cg.ctx, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: 0, xmax: Y, ymin: ymin * 1.05, ymax, xlabel: 'años', yfmt: CC.copAxis, ml: 66 });
      pl.frame();
      const xs = serie.map((_, k) => k / 12);
      pl.xy(xs, serie, { color: '--c1', width: 1.2, alpha: 0.25 });
      pl.xy(xs.slice(0, km + 1), aport.slice(0, km + 1), { color: '--ink-3', width: 1.6, dash: [5, 4] });
      pl.xy(xs.slice(0, km + 1), serie.slice(0, km + 1), { color: W >= 0 ? '--c1' : '--loss', width: 2.6 });
      pl.dot(t, W, { color: W >= 0 ? '--c1' : '--loss' });
      pl.legend([{ label: 'patrimonio', color: '--c1' }, { label: 'solo lo ahorrado', color: '--ink-3', dash: [5, 4] }], 'tl');
      const A = sim.p.I - sim.p.G, fin = serie[Y * 12];
      sim.set('ah', `<span class="${A >= 0 ? 'gain' : 'loss'}">${CC.cop(A)}</span>`);
      sim.set('w10', CC.copS(serie[120]));
      sim.set('w30', CC.copS(fin));
      sim.set('rend', fin > 0 ? CC.pct((fin - aport[Y * 12]) / fin, 0) : '—');
      const k100 = serie.findIndex((v) => v >= 100e6);
      sim.set('cien', k100 >= 0 ? CC.yrs(k100 / 12) : 'más de 30');
    });
  });

  /* ======================================================================
     1.2 Salario real por hora y precios en horas de vida
     ====================================================================== */
  CC.defineSim('horas-vida', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Precio de varios artículos en horas de vida' });
    sim.group('Su trabajo');
    sim.num('sal', { label: 'Salario mensual (bruto)', value: 3500000, min: 0, money: true });
    sim.slider('desc', { label: 'Descuentos de nómina', min: 0, max: 0.2, step: 0.005, value: 0.08, fmt: (v) => CC.pct(v) });
    sim.num('cost', { label: 'Costos de trabajar al mes (transporte, comida, ropa)', value: 630000, min: 0, money: true });
    sim.slider('hs', { label: 'Horas de trabajo por semana', min: 10, max: 66, step: 1, value: 48, fmt: (v) => CC.nf(v) + ' h' });
    sim.slider('desp', { label: 'Horas diarias de desplazamiento', min: 0, max: 5, step: 0.25, value: 2, fmt: (v) => CC.nf(v, 2) + ' h' });
    sim.seg('dias', { label: 'Días de trabajo por semana', options: [[5, '5'], [6, '6']], value: 5 });
    sim.group('Artículo');
    sim.num('precio', { label: 'Precio de algo que quiere comprar', value: 1200000, min: 1000, money: true });
    sim.out('nom', 'Salario por hora de contrato');
    sim.out('real', 'Salario real por hora', { hl: true });
    sim.out('horas', 'Horas al mes dedicadas al trabajo');
    sim.out('ph', 'Su artículo cuesta', { hl: true });
    const ITEMS = [['Almuerzo', 18000], ['Domicilio semanal × 4', 160000], ['Tenis', 350000], ['Mercado del mes', 900000], ['Viaje de vacaciones', 2500000], ['Moto', 8000000]];
    sim.onDraw(() => {
      const sem = 52 / 12;
      const hT = sim.p.hs * sem, hD = sim.p.desp * sim.p.dias * sem;
      const neto = sim.p.sal * (1 - sim.p.desc) - sim.p.cost;
      const real = neto / (hT + hD), nom = sim.p.sal / hT;
      const items = [['Su artículo', sim.p.precio]].concat(ITEMS).map(([n, p]) => [n, p, p / real]);
      CC.draw.clear(cv);
      const ctx = cv.ctx;
      const hmax = Math.max(...items.map((x) => x[2]));
      const xmax = Math.pow(10, Math.ceil(Math.log10(Math.max(10, hmax * 1.4))));
      const pl = new CC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.1, xmax, xlog: true, ymin: 0, ymax: items.length, yticks: [], ml: Math.min(200, cv.w * 0.36), mb: 40, xlabel: 'horas de vida (escala logarítmica)', grid: true });
      pl.frame();
      items.forEach(([n, p, hh], i) => {
        const yc = items.length - i - 0.5;
        const y0 = pl.Y(yc + 0.32), y1 = pl.Y(yc - 0.32);
        const x1 = pl.X(Math.max(0.1, hh));
        ctx.fillStyle = CC.col(i === 0 ? '--accent' : '--c6');
        ctx.globalAlpha = i === 0 ? 0.9 : 0.55;
        ctx.fillRect(pl.ix, y0, Math.max(1, x1 - pl.ix), y1 - y0);
        ctx.globalAlpha = 1;
        CC.text(ctx, n, pl.ix - 8, (y0 + y1) / 2 - 4, { size: 12, align: 'right', baseline: 'middle', color: '--ink', weight: i === 0 ? 700 : 500 });
        CC.text(ctx, CC.cop(p), pl.ix - 8, (y0 + y1) / 2 + 9, { size: 10.5, align: 'right', baseline: 'middle', color: '--ink-3', mono: true });
        const lab = hh >= 1 ? CC.nf(hh, hh < 10 ? 1 : 0) + ' h' : CC.nf(hh * 60, 0) + ' min';
        CC.text(ctx, lab, x1 + 6, (y0 + y1) / 2, { size: 12, baseline: 'middle', color: i === 0 ? '--accent' : '--ink-2', weight: 650, halo: true });
      });
      sim.set('nom', CC.cop(nom));
      sim.set('real', neto > 0 ? CC.cop(real) : '<span class="loss">trabajar le cuesta</span>');
      sim.set('horas', CC.nf(hT + hD, 0) + ' h');
      const ph = sim.p.precio / real;
      sim.set('ph', neto > 0 ? `${CC.nf(ph, 1)} h · ${CC.nf(ph / ((hT + hD) / (sim.p.dias * sem)), 1)} días` : '—');
    });
  });

  /* ======================================================================
     1.3 Las tres preguntas
     ====================================================================== */
  CC.defineSim('tres-preguntas', function (sim) {
    CC.quiz(sim, [
      { q: 'Tiene $1.000.000 en una cuenta que paga 2 % de interés anual. Si no retira nada, después de 5 años tendrá:', opts: ['Más de $1.100.000', 'Exactamente $1.100.000', 'Menos de $1.100.000', 'No sé'], ok: 0, fb: 'Con interés compuesto, el segundo año gana interés también sobre los intereses del primero: \\(1{,}02^5\\times 1.000.000\\approx\\) $1.104.081. Es la pregunta de interés compuesto (capítulo 6).' },
      { q: 'Su cuenta paga 1 % anual y la inflación es 5 % anual. Dentro de un año, con ese dinero podrá comprar:', opts: ['Más que hoy', 'Lo mismo que hoy', 'Menos que hoy', 'No sé'], ok: 2, fb: 'Los precios suben 5 % y su dinero solo 1 %: la tasa real es \\(1{,}01/1{,}05-1\\approx-3{,}8\\,\\%\\). Es la pregunta de inflación (capítulos 7 y 8).' },
      { q: '¿Verdadero o falso? Comprar acciones de una sola empresa suele dar un rendimiento más seguro que comprar un fondo con acciones de muchas empresas.', opts: ['Verdadero', 'Falso', 'No sé'], ok: 1, fb: 'Falso. Una sola empresa puede quebrar; un fondo diversificado reparte ese riesgo. Diversificar reduce el riesgo sin reducir necesariamente la rentabilidad esperada (capítulo 17). Es la pregunta que más personas fallan.' },
      { q: 'Adicional. Un crédito de vivienda a 15 años suele tener cuotas más altas que uno a 30 años, pero el total de intereses pagados es menor.', opts: ['Verdadero', 'Falso', 'No sé'], ok: 0, fb: 'Verdadero. Con un plazo más corto la deuda se paga más rápido y genera intereses durante menos tiempo. A 1 % mensual, $100 millones a 15 años pagan unos $116 millones de intereses; a 30 años, unos $270 millones (capítulo 10).' },
      { q: 'Adicional. Si las tasas de interés del mercado suben, ¿qué suele pasar con el precio de los bonos que ya fueron emitidos?', opts: ['Sube', 'Baja', 'No cambia', 'No hay relación'], ok: 1, fb: 'Baja. Un bono viejo paga un cupón menor que los nuevos, así que para venderlo hay que rebajarle el precio. Esto explica las pérdidas de los fondos de renta fija cuando suben las tasas (capítulo 18).' }
    ], { final: (ok, n) => (ok === n ? '¡Todas correctas!' : ok >= 3 ? 'Buena base; los capítulos indicados completan lo que falta.' : 'Este curso está hecho justamente para esto.') });
  });
})();
