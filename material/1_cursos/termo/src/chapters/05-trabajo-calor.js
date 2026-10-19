/* Capítulo 5 — Energía, trabajo y calor */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;

  /* 5.1 Trabajo por tres caminos */
  EM.defineSim('trabajo-pv', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('c', { label: 'Camino de 1 a 2', options: [['iso', 'Isotérmico'], ['pv', 'Isobárico y luego isocórico'], ['vp', 'Isocórico y luego isobárico'], ['pol', 'Politrópico']], value: 'iso' });
    sim.slider('n', { label: 'Exponente politrópico <i>n</i> (para el camino politrópico)', min: 0, max: 1.67, step: 0.01, value: 1.3, fmt: (v) => v.toFixed(2) });
    sim.slider('P1', { label: 'Presión inicial', min: 100, max: 1000, step: 10, value: 400, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.slider('V2', { label: 'Volumen final', min: 0.12, max: 0.6, step: 0.01, value: 0.4, unit: 'm³', fmt: (v) => v.toFixed(2) });
    sim.check('cyc', { label: 'Cerrar el ciclo regresando por el camino isotérmico', value: false });
    sim.out('W', 'Trabajo de frontera 1 → 2', { hl: true });
    sim.out('dU', 'Cambio de energía interna (aire, gas ideal)');
    sim.out('Q', 'Calor recibido <i>Q</i> = Δ<i>U</i> + <i>W</i>');
    sim.out('Wc', 'Trabajo neto del ciclo');
    const V1 = 0.1;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const P1 = p.P1, V2 = p.V2;
      const P2 = p.c === 'pol' ? P1 * Math.pow(V1 / V2, p.n) : (P1 * V1) / V2;
      const path = [];
      if (p.c === 'iso') for (let i = 0; i <= 100; i++) { const V = V1 + ((V2 - V1) * i) / 100; path.push([V, (P1 * V1) / V]); }
      else if (p.c === 'pv') path.push([V1, P1], [V2, P1], [V2, P2]);
      else if (p.c === 'vp') path.push([V1, P1], [V1, P2], [V2, P2]);
      else for (let i = 0; i <= 100; i++) { const V = V1 + ((V2 - V1) * i) / 100; path.push([V, P1 * Math.pow(V1 / V, p.n)]); }
      const W = p.c === 'iso' ? P1 * V1 * Math.log(V2 / V1) : p.c === 'pv' ? P1 * (V2 - V1) : p.c === 'vp' ? P2 * (V2 - V1) : Math.abs(p.n - 1) < 1e-9 ? P1 * V1 * Math.log(V2 / V1) : (P2 * V2 - P1 * V1) / (1 - p.n);
      const cvAir = 0.718 / 0.287; /* c_v/R para aire */
      const dU = cvAir * (P2 * V2 - P1 * V1);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 0.65, ymin: 0, ymax: 1100, xlabel: 'V (m³)', ylabel: 'P (kPa)' });
      pl.frame();
      for (let T = 1; T <= 6; T++) pl.fn((V) => (T * 40) / V, { color: '--grid-2', width: 1, from: 0.03 });
      ctx.save(); ctx.fillStyle = EM.alpha('--accent', 0.18); ctx.beginPath(); ctx.moveTo(pl.X(V1), pl.Y(0));
      path.forEach(([V, P]) => ctx.lineTo(pl.X(V), pl.Y(P))); ctx.lineTo(pl.X(V2), pl.Y(0)); ctx.closePath(); ctx.fill(); ctx.restore();
      pl.path(path, { color: '--accent', width: 2.8 });
      let Wc = null;
      if (p.cyc) {
        const back = []; for (let i = 0; i <= 100; i++) { const V = V2 + ((V1 - V2) * i) / 100; back.push([V, (P2 * V2) / V]); }
        pl.path(back, { color: '--c1', width: 2, dash: [6, 4] });
        Wc = W - P2 * V2 * Math.log(V2 / V1);
      }
      pl.dot(V1, P1, { color: '--ink', label: '1' }); pl.dot(V2, P2, { color: '--ink', label: '2' });
      sim.set('W', EM.fix(W, 2) + ' kJ (área sombreada)');
      sim.set('dU', EM.fix(dU, 2) + ' kJ' + (Math.abs(P2 * V2 - P1 * V1) < 1e-9 ? ' (T₂ = T₁)' : ''));
      sim.set('Q', EM.fix(dU + W, 2) + ' kJ');
      sim.set('Wc', Wc === null ? '—' : EM.fix(Wc, 2) + ' kJ (área encerrada)');
    });
  });

  /* 5.2 Experimento de Joule */
  EM.defineSim('joule-paletas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('m', { label: 'Masa de cada pesa', min: 2, max: 30, step: 0.5, value: 15, unit: 'kg', fmt: (v) => v.toFixed(1) });
    sim.slider('h', { label: 'Altura de caída', min: 0.5, max: 3, step: 0.1, value: 2, unit: 'm', fmt: (v) => v.toFixed(1) });
    sim.slider('M', { label: 'Masa de agua', min: 1, max: 10, step: 0.1, value: 6, unit: 'kg', fmt: (v) => v.toFixed(1) });
    sim.slider('loss', { label: 'Conductancia de pérdidas al ambiente', min: 0, max: 1, step: 0.01, value: 0, unit: 'W/K', fmt: (v) => v.toFixed(2) });
    sim.slider('dTa', { label: 'Agua inicial respecto del ambiente', min: -1, max: 1, step: 0.05, value: 0, unit: 'K', fmt: (v) => v.toFixed(2) });
    sim.resetButton(() => reset());
    sim.out('n', 'Caídas realizadas', { hl: true });
    sim.out('W', 'Trabajo de las pesas');
    sim.out('dT', 'Aumento de temperatura');
    sim.out('J', 'Equivalente aparente <i>W</i>/(<i>Mc</i>Δ<i>T</i>)');
    let n, y, T, t, ang, W;
    const reset = () => { n = 0; y = 0; T = 0; t = 0; ang = 0; W = 0; };
    reset();
    sim.onChange = (id) => { if (id !== 'loss') reset(); };
    sim.animate((dt) => {
      if (!(dt > 0) || n >= 20) return;
      const p = sim.p, v = 0.6; /* caída a velocidad terminal casi constante */
      const dy = Math.min(p.h - y, v * dt * 3);
      y += dy; ang += dy * 12;
      const dW = 2 * p.m * TH.g * dy; W += dW;
      const C = p.M * 4186, Ta = -p.dTa;
      T += (dW - p.loss * (T - Ta) * dt * 30) / C;
      t += dt;
      if (y >= p.h - 1e-9) { n++; y = 0; }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const cx = Wc * 0.25, top = 30, tank = [cx - 60, H * 0.45, 120, H * 0.45];
      ctx.fillStyle = EM.alpha('--c1', 0.25); ctx.fillRect(...tank);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(...tank);
      /* eje y paletas */
      ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, tank[1] + tank[3] - 10); ctx.stroke();
      for (let k = 0; k < 4; k++) { const a = ang + (k * Math.PI) / 2, w = 45 * Math.cos(a); ctx.fillStyle = EM.alpha('--ink-2', 0.5 + 0.4 * Math.sin(a)); for (const yy of [0.62, 0.8]) ctx.fillRect(cx + Math.min(0, w), tank[1] + tank[3] * yy, Math.abs(w), 8); }
      /* cuerdas y pesas */
      const ys = top + 30 + (y / 3) * (H - 90);
      for (const s of [-1, 1]) {
        const px = cx + s * 110;
        ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx, top + 6); ctx.lineTo(px, top + 6); ctx.lineTo(px, ys); ctx.stroke();
        ctx.fillStyle = EM.col('--c4'); ctx.fillRect(px - 14, ys, 28, 26);
        ctx.beginPath(); ctx.arc(px, top + 6, 6, 0, 7); ctx.stroke();
      }
      EM.text(ctx, 'ΔT = ' + EM.fix(T, 4) + ' K', cx, tank[1] + 18, { size: 12, align: 'center', mono: true, color: '--ink' });
      /* gráfica T vs trabajo */
      const C = p.M * 4186, Wmax = 20 * 2 * p.m * TH.g * p.h;
      const pl = new EM.Plot(ctx, { x: Wc * 0.5, y: 0, w: Wc * 0.5, h: H, xmin: 0, xmax: Wmax / 1e3, ymin: Math.min(0, -p.dTa) - 0.05, ymax: Math.max(Wmax / C, 0.05) * 1.15, xlabel: 'W (kJ)', ylabel: 'ΔT (K)' });
      pl.frame();
      pl.fn((x) => (x * 1e3) / C, { color: '--c3', width: 1.5, dash: [6, 4] });
      pl.dot(W / 1e3, T, { color: '--accent', r: 5 });
      sim.set('n', n + ' de 20');
      sim.set('W', EM.fix(W, 0) + ' J');
      sim.set('dT', EM.fix(T, 4) + ' K (ideal ' + EM.fix(W / C, 4) + ' K)');
      sim.set('J', T > 1e-6 ? EM.fix(W / (C * T) * 4.184, 3) + ' J/cal' : '—');
    });
  });

  /* 5.3 Calorímetro con posible fusión */
  const MET = { al: ['Aluminio', 0.9], fe: ['Hierro', 0.45], cu: ['Cobre', 0.385], pb: ['Plomo', 0.129], ag: ['Plata', 0.235], vid: ['Vidrio', 0.84] };
  EM.defineSim('calorimetro', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('met', { label: 'Muestra', options: Object.entries(MET).map(([k, v]) => [k, v[0] + ' (c = ' + v[1] + ')']), value: 'al' });
    sim.slider('ms', { label: 'Masa de la muestra', min: 0, max: 1000, step: 5, value: 200, unit: 'g', fmt: (v) => v.toFixed(0) });
    sim.slider('Ts', { label: 'Temperatura de la muestra', min: 0, max: 300, step: 1, value: 100, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('mw', { label: 'Masa de agua', min: 0, max: 1000, step: 5, value: 500, unit: 'g', fmt: (v) => v.toFixed(0) });
    sim.slider('Tw', { label: 'Temperatura del agua', min: 0, max: 90, step: 0.5, value: 20, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('mi', { label: 'Masa de hielo a −10 °C', min: 0, max: 500, step: 5, value: 0, unit: 'g', fmt: (v) => v.toFixed(0) });
    sim.slider('mc', { label: 'Vaso de cobre', min: 0, max: 300, step: 5, value: 100, unit: 'g', fmt: (v) => v.toFixed(0) });
    sim.out('Tf', 'Temperatura final', { hl: true });
    sim.out('ice', 'Hielo remanente');
    sim.out('bal', 'Balance: calor cedido = calor ganado');
    const cw = 4.186, ci = 2.09, Lf = 333.6, ccu = 0.385;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const cs = MET[p.met][1];
      /* sistema: muestra (ms, Ts), agua+vaso (Tw), hielo (−10 °C). Energía relativa a todo líquido a 0 °C */
      const Cnon = (p.ms * cs + p.mc * ccu) / 1000, mwk = p.mw / 1000, mik = p.mi / 1000;
      const E = Cnon * 0 + (p.ms * cs * p.Ts + p.mc * ccu * p.Tw) / 1000 + mwk * cw * p.Tw - mik * (ci * 10 + Lf);
      let Tf, iceLeft = 0, frozenWater = 0;
      if (E >= 0) Tf = E / (Cnon + (mwk + mik) * cw);
      else if (E >= -(mwk + mik) * Lf) { Tf = 0; iceLeft = -E / Lf; frozenWater = Math.max(0, iceLeft - mik); }
      else { Tf = (E + (mwk + mik) * Lf) / (Cnon + (mwk + mik) * ci); iceLeft = mik + mwk; }
      /* barras de energía */
      const items = [['muestra', (p.ms * cs * (p.Ts - Tf)) / 1000], ['vaso', (p.mc * ccu * (p.Tw - Tf)) / 1000], ['agua', mwk * cw * (p.Tw - Tf)]];
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.55, h: cv.h, xmin: 0, xmax: 5, ymin: -60, ymax: 60, xlabel: '', ylabel: 'calor cedido (+) / ganado (−) (kJ)', xticks: [] });
      pl.frame();
      const Qice = E >= 0 ? -mik * (ci * 10 + Lf + cw * Tf) : Tf === 0 ? -(mik * ci * 10 + (mik - iceLeft) * Lf) : -items.reduce((a, it) => a + it[1], 0);
      items.push(['hielo', Qice]);
      let sum = 0;
      items.forEach(([n, q], i) => {
        sum += q;
        ctx.fillStyle = EM.alpha(q >= 0 ? '--c2' : '--c1', 0.65);
        const x0 = pl.X(i + 0.6), x1 = pl.X(i + 1.4), y0 = pl.Y(0), y1 = pl.Y(Math.max(-60, Math.min(60, q)));
        ctx.fillRect(x0, Math.min(y0, y1), x1 - x0, Math.abs(y1 - y0));
        EM.text(ctx, n, (x0 + x1) / 2, pl.Y(-58), { size: 11, align: 'center', color: '--ink-2' });
      });
      pl.hline(0, { color: '--ink-2', dash: [] });
      /* termómetro */
      const tx = cv.w * 0.75, top = 30, bot = cv.h - 40, Y = (T) => bot - ((bot - top) * (T + 20)) / 320;
      ctx.fillStyle = EM.alpha('--ink-3', 0.15); ctx.fillRect(tx - 8, top, 16, bot - top);
      ctx.fillStyle = EM.col('--accent'); ctx.fillRect(tx - 6, Y(Tf), 12, bot - Y(Tf)); ctx.beginPath(); ctx.arc(tx, bot + 10, 14, 0, 7); ctx.fill();
      for (let T = 0; T <= 300; T += 50) EM.text(ctx, T + ' °C', tx + 14, Y(T) + 4, { size: 10, mono: true, color: '--ink-3' });
      sim.set('Tf', EM.fix(Tf, 2) + ' °C');
      sim.set('ice', iceLeft > 1e-6 ? EM.fix(iceLeft * 1000, 1) + ' g' + (frozenWater > 0 ? ' (se congela agua)' : '') : 'ninguno');
      sim.set('bal', 'suma = ' + EM.fix(sum, 3) + ' kJ');
    });
  });

  /* 5.4 Curva de calentamiento */
  EM.defineSim('curva-calentamiento', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('z', { label: 'Altitud', min: 0, max: 5000, step: 10, value: 1760, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.slider('Pw', { label: 'Potencia del fogón', min: 500, max: 5000, step: 50, value: 2000, unit: 'W', fmt: (v) => v.toFixed(0) });
    sim.slider('m', { label: 'Masa', min: 0.1, max: 3, step: 0.05, value: 1, unit: 'kg', fmt: (v) => v.toFixed(2) });
    sim.out('Tb', 'Ebullición', { hl: true });
    sim.out('Q', 'Energía por etapa (kJ)');
    sim.out('t', 'Tiempo total');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const P = TH.isa(p.z).P, Tb = TH.agua.Tsat(P) - 273.15, hfg = TH.agua.sat(Tb + 273.15).hfg / 1e3;
      const Q = [2.09 * 20, 333.6, 4.18 * Tb, hfg, 2.0 * (120 - Tb)].map((q) => q * p.m);
      const pts = [[0, -20]]; let acc = 0;
      const temps = [[-20, 0], [0, 0], [0, Tb], [Tb, Tb], [Tb, 120]];
      Q.forEach((q, i) => { acc += q; pts.push([acc / p.Pw * 1000 / 60, temps[i][1]]); });
      const tmax = acc / p.Pw * 1000 / 60;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tmax * 1.03, ymin: -30, ymax: 130, xlabel: 'tiempo (min)', ylabel: 'T (°C)' });
      pl.frame();
      pl.path(pts, { color: '--accent', width: 2.8 });
      const lbl = ['hielo', 'fusión', 'agua líquida', 'ebullición', 'vapor'];
      for (let i = 0; i < 5; i++) { const xm = (pts[i][0] + pts[i + 1][0]) / 2, ym = (pts[i][1] + pts[i + 1][1]) / 2; pl.label(xm, ym, lbl[i], { dy: -10, size: 11, align: 'center', color: '--ink-2' }); }
      pl.hline(Tb, { color: '--c1', label: 'T_{eb} = ' + EM.fix(Tb, 1) + ' °C' });
      sim.set('Tb', EM.fix(Tb, 2) + ' °C a ' + EM.fix(P / 1e3, 1) + ' kPa');
      sim.set('Q', Q.map((q) => q.toFixed(0)).join(' · ') + ' (total ' + acc.toFixed(0) + ')');
      sim.set('t', EM.fix(tmax, 1) + ' min, ' + EM.fix((100 * Q[3]) / acc, 1) + ' % en evaporar');
    });
  });
})();
