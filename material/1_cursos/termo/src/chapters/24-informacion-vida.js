/* Capítulo 24 — Información, vida y planeta */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;

  /* 24.1 Demonio de Maxwell */
  EM.defineSim('demonio', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('N', { label: 'Número de partículas', min: 40, max: 300, step: 10, value: 160, fmt: (v) => v.toFixed(0) });
    sim.check('on', { label: 'Demonio activo', value: true });
    sim.resetButton(() => reset());
    sim.out('T', 'Temperaturas izquierda · derecha', { hl: true });
    sim.out('dS', 'Entropía perdida por el gas');
    sim.out('b', 'Decisiones del demonio (bits) · costo mínimo de borrarlas');
    let g, bits, T0;
    const Wb = 1.6, xp = 0.8, door = [0.3, 0.7];
    const reset = () => { g = new EM.GasBox({ N: sim.p.N, r: 0.009, W: Wb, H: 1, T: 1 }); bits = 0; T0 = g.Tkin(); };
    reset();
    sim.onChange = (id) => { if (id === 'N') reset(); };
    sim.animate((dt) => {
      if (!(dt > 0)) return;
      for (let k = 0; k < 6; k++) {
        const ox = Array.from(g.x);
        g.step((Math.min(dt, 0.03) / 6) * 0.6);
        const v2m = 2 * T0;
        for (let i = 0; i < g.N; i++) {
          const a = ox[i], b = g.x[i];
          if ((a - xp) * (b - xp) > 0) continue;
          const inDoor = g.y[i] > door[0] && g.y[i] < door[1], v2 = g.vx[i] * g.vx[i] + g.vy[i] * g.vy[i];
          let pass = false;
          if (inDoor && sim.p.on) { bits++; pass = (b > a && v2 > v2m) || (b < a && v2 < v2m); }
          else if (inDoor && !sim.p.on) pass = true;
          if (!pass) { g.x[i] = 2 * xp - b; g.vx[i] = -g.vx[i]; }
        }
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const bh = H - 60, bw = bh * Wb, bx = (W - bw) / 2, by = 10;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      const X = bx + (xp / Wb) * bw;
      ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(X - 2, by, 4, bh * (1 - door[1])); ctx.fillRect(X - 2, by + bh * (1 - door[0]), 4, bh * door[0]);
      if (p.on) EM.text(ctx, '😈', X, by + bh * 0.5 + 6, { size: 18, align: 'center' });
      g.draw(ctx, bx, by, bw, bh, { speedColor: true, Tref: T0 });
      let nl = 0, nr = 0, el = 0, er = 0;
      for (let i = 0; i < g.N; i++) { const e = 0.5 * (g.vx[i] ** 2 + g.vy[i] ** 2); if (g.x[i] < xp) { nl++; el += e; } else { nr++; er += e; } }
      const Tl = nl ? el / nl : 0, Tr = nr ? er / nr : 0;
      const dS = (nl ? nl * Math.log(Tl / T0) : 0) + (nr ? nr * Math.log(Tr / T0) : 0); /* 2D: c_v = k por partícula, en unidades de k */
      EM.text(ctx, 'T = ' + EM.fix(Tl, 2), bx + bw * 0.25, by + bh + 22, { size: 13, align: 'center', color: '--c1' });
      EM.text(ctx, 'T = ' + EM.fix(Tr, 2), bx + bw * 0.75, by + bh + 22, { size: 13, align: 'center', color: '--c2' });
      sim.set('T', EM.fix(Tl, 3) + ' · ' + EM.fix(Tr, 3) + ' (inicial ' + EM.fix(T0, 3) + ')');
      sim.set('dS', EM.fix(-dS, 2) + ' k_B (incluye la mezcla de partículas entre lados)');
      sim.set('b', bits + ' · ' + EM.fix(bits * Math.log(2), 1) + ' k_B de entropía al ambiente');
    });
  });

  /* 24.2 Szilard y Landauer */
  const TECH = [['Límite de Landauer a 300 K', TH.landauer(300), '--c3'], ['Límite de Landauer a 4 K', TH.landauer(4), '--c3'], ['Borrado de un bit en una trampa óptica (Bérut 2012)', 3e-21, '--c5'], ['Transistor CMOS actual (orden de magnitud)', 1e-15, '--c1'], ['Transistor de 1990 (orden de magnitud)', 1e-12, '--c1'], ['ENIAC, 1946 (por suma)', 30, '--c2']];
  EM.defineSim('landauer', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('st', { label: 'Etapa del ciclo de Szilard', options: [['1', '1. Molécula'], ['2', '2. Medir'], ['3', '3. Expandir'], ['4', '4. Borrar']], value: '1' });
    sim.slider('T', { label: 'Temperatura del depósito', min: 1, max: 600, step: 1, value: 300, unit: 'K', log: true, fmt: (v) => v.toFixed(0) });
    sim.out('w', 'Trabajo extraído en la expansión', { hl: true });
    sim.out('e', 'Calor mínimo al borrar el bit');
    sim.out('n', 'Balance del ciclo completo');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      /* caja de Szilard */
      const bx = 16, by = 40, bw = W * 0.26, bh = H * 0.5, st = +p.st;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      let xmin = 0, xmax = 1;
      if (st >= 2 && st < 3) { ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(bx + bw / 2 - 2, by, 4, bh); xmax = 0.5; }
      if (st === 3) { const pp = 0.5 + 0.48 * (0.5 + 0.5 * Math.sin(t * 1.2)); ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(bx + bw * pp - 3, by, 6, bh); xmax = pp; EM.text(ctx, '→ W = k_BT ln 2', bx + bw / 2, by + bh + 18, { size: 12, align: 'center', color: '--c3' }); }
      const mx = bx + bw * (xmin + (xmax - xmin) * (0.5 + 0.42 * Math.sin(t * 3.1))), my = by + bh * (0.5 + 0.4 * Math.sin(t * 2.3));
      ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(mx, my, 6, 0, 7); ctx.fill();
      /* memoria */
      const mxp = bx + 10, myp = by + bh + 34;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.strokeRect(mxp, myp, 70, 40);
      EM.text(ctx, 'memoria', mxp + 35, myp - 6, { size: 11, align: 'center', color: '--ink-2' });
      EM.text(ctx, st === 1 || st === 4 ? '0' : 'I', mxp + 35, myp + 27, { size: 18, align: 'center', mono: true, color: st === 4 ? '--c2' : '--ink' });
      if (st === 4) EM.text(ctx, 'borrado: Q ≥ k_BT ln 2', mxp + 35, myp + 58, { size: 11, align: 'center', color: '--c2' });
      /* tecnologías */
      const pl = new EM.Plot(ctx, { x: W * 0.36, y: 0, w: W * 0.64, h: H, xmin: 1e-23, xmax: 1e3, xlog: true, ymin: 0, ymax: TECH.length, xlabel: 'energía por operación (J)', yticks: [], ml: 10 });
      pl.frame();
      TECH.forEach(([n, e, c], i) => { const y = TECH.length - i - 0.5; ctx.fillStyle = EM.alpha(c, 0.6); ctx.fillRect(pl.X(1e-23), pl.Y(y + 0.3), pl.X(e) - pl.X(1e-23), pl.Y(y - 0.3) - pl.Y(y + 0.3)); EM.text(ctx, n, pl.X(1e-23) + 4, pl.Y(y) + 4, { size: 10.5, color: '--ink', halo: true }); });
      const kl = TH.landauer(p.T);
      sim.set('w', EM.sci(kl, 3) + ' J');
      sim.set('e', EM.sci(kl, 3) + ' J (' + EM.fix(kl / TH.eV * 1000, 2) + ' meV)');
      sim.set('n', 'trabajo neto ≤ 0: el demonio no viola la segunda ley');
    });
  });

  /* 24.3 Metabolismo */
  EM.defineSim('metabolismo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('m', { label: 'Masa corporal (con carga)', min: 40, max: 120, step: 1, value: 70, unit: 'kg', fmt: (v) => v.toFixed(0) });
    sim.slider('h', { label: 'Estatura', min: 140, max: 200, step: 1, value: 172, unit: 'cm', fmt: (v) => v.toFixed(0) });
    sim.slider('age', { label: 'Edad', min: 15, max: 80, step: 1, value: 30, unit: 'años', fmt: (v) => v.toFixed(0) });
    sim.seg('sex', { label: 'Ecuación', options: [['m', 'Hombre'], ['f', 'Mujer']], value: 'm' });
    sim.slider('dz', { label: 'Desnivel que sube', min: 0, max: 1500, step: 10, value: 300, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.slider('t', { label: 'Tiempo de subida', min: 10, max: 240, step: 5, value: 60, unit: 'min', fmt: (v) => v.toFixed(0) });
    sim.slider('Ta', { label: 'Temperatura del aire', min: 0, max: 40, step: 0.5, value: 18, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.out('bmr', 'Metabolismo basal (Mifflin–St Jeor)', { hl: true });
    sim.out('w', 'Trabajo mecánico · gasto metabólico extra');
    sim.out('q', 'Calor a disipar · potencia térmica');
    sim.out('s', 'Sudor necesario (si no basta la convección)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const bmr = 10 * p.m + 6.25 * p.h - 5 * p.age + (p.sex === 'm' ? 5 : -161); /* kcal/día */
      const Wm = p.m * TH.g * p.dz, E = Wm / 0.25, Q = E - Wm, tsec = p.t * 60;
      const Abody = 0.007184 * Math.pow(p.m, 0.425) * Math.pow(p.h, 0.725); /* DuBois */
      const qdry = 9 * Abody * (34 - p.Ta) * 0.6; /* convección + radiación con ropa (estimación) */
      const qbasal = (bmr * 4184) / 86400;
      const qneed = Q / tsec + qbasal - Math.max(0, qdry);
      const sweat = Math.max(0, qneed) * tsec / 2.42e6;
      /* barras */
      const items = [['trabajo mecánico', Wm / 1000, '--c3'], ['calor del ejercicio', Q / 1000, '--c2'], ['metabolismo basal durante la subida', (qbasal * tsec) / 1000, '--c6']];
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 3, ymin: 0, ymax: Math.max(...items.map((i) => i[1])) * 1.2 + 1, ylabel: 'kJ', xticks: [] });
      pl.frame();
      items.forEach(([n, v, c], i) => { ctx.fillStyle = EM.alpha(c, 0.7); const x0 = pl.X(i + 0.2), x1 = pl.X(i + 0.8); ctx.fillRect(x0, pl.Y(v), x1 - x0, pl.Y(0) - pl.Y(v)); EM.text(ctx, n, (x0 + x1) / 2, pl.Y(0) + 14, { size: 10.5, align: 'center', color: '--ink-2' }); EM.text(ctx, EM.fix(v, 0) + ' kJ', (x0 + x1) / 2, pl.Y(v) - 6, { size: 11, align: 'center', mono: true }); });
      sim.set('bmr', EM.fix(bmr, 0) + ' kcal/día = ' + EM.fix(qbasal, 0) + ' W');
      sim.set('w', EM.fix(Wm / 1000, 1) + ' kJ · ' + EM.fix(E / 1000, 1) + ' kJ = ' + EM.fix(E / 4184, 0) + ' kcal');
      sim.set('q', EM.fix(Q / 1000, 1) + ' kJ · ' + EM.fix(Q / tsec, 0) + ' W');
      sim.set('s', EM.fix(sweat * 1000, 0) + ' g (piel a 34 °C, superficie ' + EM.fix(Abody, 2) + ' m²)');
    });
  });

  /* 24.4 Planetas */
  const PL = { mercurio: ['Mercurio', 9083, 0.088, 0, 440], venus: ['Venus', 2601, 0.77, 0.9999, 737], tierra: ['Tierra', 1361, 0.3, 0.78, 288], luna: ['Luna', 1361, 0.11, 0, 250], marte: ['Marte', 586, 0.25, 0.1, 210] };
  EM.defineSim('planeta', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('pl', { label: 'Planeta', options: Object.entries(PL).map(([k, v]) => [k, v[0]]), value: 'tierra' });
    sim.slider('S', { label: 'Irradiancia solar <i>S</i>', min: 300, max: 10000, step: 1, value: 1361, unit: 'W/m²', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('A', { label: 'Albedo', min: 0, max: 0.9, step: 0.005, value: 0.3, fmt: (v) => v.toFixed(3) });
    sim.slider('e', { label: 'Absortividad infrarroja de la atmósfera ε', min: 0, max: 1, step: 0.001, value: 0.78, fmt: (v) => v.toFixed(3) });
    sim.out('Te', 'Temperatura de equilibrio radiativo', { hl: true });
    sim.out('Ts', 'Superficie con una capa de atmósfera');
    sim.out('obs', 'Temperatura media observada');
    sim.onChange = (id) => { if (id === 'pl') { const v = PL[sim.p.pl]; sim.ctl.S.set(v[1], true); sim.ctl.A.set(v[2], true); sim.ctl.e.set(v[3], true); } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const Te = Math.pow((p.S * (1 - p.A)) / (4 * TH.sigma), 0.25), Ts = (e) => Te * Math.pow(2 / (2 - e), 0.25);
      const pl = new EM.Plot(ctx, { x: W * 0.4, y: 0, w: W * 0.6, h: H, xmin: 0, xmax: 1, ymin: Math.min(Te, 150) * 0.9, ymax: Te * 1.25, xlabel: 'absortividad ε', ylabel: 'T superficie (K)' });
      pl.frame();
      pl.fn(Ts, { color: '--accent', width: 2.6 });
      pl.hline(Te, { color: '--c1', label: 'T_e' });
      pl.hline(PL[p.pl][4], { color: '--c3', label: 'observada', labelRight: true });
      pl.dot(p.e, Ts(p.e), { color: '--accent', r: 6 });
      /* esquema */
      const cx = W * 0.2, cy = H * 0.68, R = W * 0.12;
      ctx.fillStyle = EM.alpha('--c1', 0.35); ctx.beginPath(); ctx.arc(cx, cy + R * 0.6, R, Math.PI, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = EM.alpha('--c5', 0.08 + 0.3 * p.e); ctx.fillRect(cx - R * 1.4, cy - R * 0.9, R * 2.8, R * 0.7);
      EM.draw.arrow(ctx, cx - R * 0.8, 10, cx - R * 0.5, cy - R * 0.2, { color: '--c4', width: 2.5 });
      EM.text(ctx, 'S(1−A)/4 = ' + EM.fix((p.S * (1 - p.A)) / 4, 0) + ' W/m²', cx - R * 1.3, 24, { size: 11, color: '--c4' });
      EM.draw.arrow(ctx, cx + R * 0.4, cy - R * 0.2, cx + R * 0.8, 40, { color: '--c2', width: 2.5 });
      EM.text(ctx, 'IR', cx + R * 0.85, 50, { size: 11, color: '--c2' });
      EM.text(ctx, 'atmósfera (ε = ' + EM.fix(p.e, 2) + ')', cx, cy - R * 0.5, { size: 10.5, align: 'center', color: '--ink-2' });
      sim.set('Te', EM.fix(Te, 1) + ' K (' + EM.fix(Te - 273.15, 1) + ' °C)');
      sim.set('Ts', EM.fix(Ts(p.e), 1) + ' K (' + EM.fix(Ts(p.e) - 273.15, 1) + ' °C)' + (p.pl === 'venus' ? ' — una capa no basta para Venus: su atmósfera es ópticamente muy gruesa' : ''));
      sim.set('obs', PL[p.pl][4] + ' K');
    });
  });
})();
