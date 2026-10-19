/* Capítulo 14 — Ciclos de potencia de vapor */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th, D = EM.diag;
  const W = TH.agua;
  const tsDome = (pl) => { D.drawDome(pl, W, 's', 'T'); };

  /* 14.1 Rankine en T–s */
  EM.defineSim('rankine', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('Ph', { label: 'Presión de la caldera', min: 0.5, max: 20, step: 0.1, value: 3, unit: 'MPa', fmt: (v) => v.toFixed(1) });
    sim.slider('T3', { label: 'Temperatura del vapor', min: 150, max: 620, step: 1, value: 350, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('Pl', { label: 'Presión del condensador', min: 5, max: 200, step: 0.5, value: 75, unit: 'kPa', log: true, fmt: (v) => v.toFixed(1) });
    sim.slider('et', { label: 'Eficiencia de la turbina', min: 0.6, max: 1, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('ep', { label: 'Eficiencia de la bomba', min: 0.6, max: 1, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.check('rh', { label: 'Recalentamiento', value: false });
    sim.slider('Prh', { label: 'Presión de recalentamiento', min: 0.2, max: 8, step: 0.1, value: 0.8, unit: 'MPa', fmt: (v) => v.toFixed(1) });
    sim.out('eta', 'Eficiencia térmica', { hl: true });
    sim.out('w', 'Trabajo neto · relación de retroceso');
    sim.out('x', 'Calidad a la salida de la turbina');
    sim.out('q', 'Calor recibido · cedido');
    const sync = () => sim.ctl.Prh.show(sim.p.rh);
    sim.onChange = sync; sync();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const Ph = p.Ph * 1e6, Pl = p.Pl * 1e3, Tsat = W.Tsat(Ph), T3 = Math.max(p.T3 + 273.15, Tsat + 0.1);
      const Prh = Math.min(p.Prh * 1e6, Ph * 0.9);
      const r = TH.rankine({ Ph, Pl, T3, etat: p.et, etap: p.ep, Prh: p.rh ? Prh : null, Trh: p.rh ? T3 : null });
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 9.2, ymin: 0, ymax: 650, xlabel: 's (kJ/kg·K)', ylabel: 'T (°C)' });
      pl.frame();
      tsDome(pl);
      /* trayectoria: 1 → 2 (bomba) → caldera (isóbara) → 3 → turbina → 4 → condensador */
      const s2 = W.state(Ph, { h: r.h2 });
      const path = [];
      const push = (s) => path.push([s.s / 1e3, s.T - 273.15]);
      push(r.s1); push(s2);
      for (const s of D.isobar(W, Ph, s2.T, T3, 40)) if (s.T >= s2.T - 0.01) push(s);
      const exp = (a, P) => { const is = W.state(P, { s: a.s }); return W.state(P, { h: a.h - p.et * (a.h - is.h) }); };
      let cur = r.s3;
      if (p.rh) { const a = exp(r.s3, Prh); push(a); for (const s of D.isobar(W, Prh, a.T, T3, 30)) if (s.T >= a.T) push(s); cur = W.state(Prh, { T: T3 }); }
      push(r.s4);
      const sat = W.satP(Pl); push({ s: sat.sf, T: sat.T });
      ctx.save(); ctx.fillStyle = EM.alpha('--accent', 0.12); ctx.beginPath(); path.forEach(([x, y], i) => (i ? ctx.lineTo(pl.X(x), pl.Y(y)) : ctx.moveTo(pl.X(x), pl.Y(y)))); ctx.closePath(); ctx.fill(); ctx.restore();
      pl.path(path, { color: '--accent', width: 2.6 });
      pl.dot(r.s1.s / 1e3, r.s1.T - 273.15, { color: '--ink', label: '1', dx: -14 });
      pl.dot(r.s3.s / 1e3, r.s3.T - 273.15, { color: '--ink', label: '3' });
      pl.dot(r.s4.s / 1e3, r.s4.T - 273.15, { color: '--ink', label: '4', dy: 14 });
      sim.set('eta', EM.fix(100 * r.eta, 2) + ' % (Carnot entre los extremos: ' + EM.fix(100 * (1 - sat.T / T3), 1) + ' %)');
      sim.set('w', EM.fix(r.wn / 1e3, 1) + ' kJ/kg · ' + EM.fix(100 * r.bwr, 2) + ' %');
      sim.set('x', r.s4.x !== null && r.s4.x !== undefined ? EM.fix(r.s4.x, 3) + (r.s4.x < 0.88 ? ' (demasiada humedad)' : '') : 'vapor sobrecalentado');
      sim.set('q', EM.fix(r.qin / 1e3, 1) + ' · ' + EM.fix(r.qout / 1e3, 1) + ' kJ/kg');
    });
  });

  /* 14.2 Mapa de eficiencia */
  EM.defineSim('rankine-mapa', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('Pl', { label: 'Presión del condensador', min: 5, max: 100, step: 0.5, value: 10, unit: 'kPa', log: true, fmt: (v) => v.toFixed(1) });
    sim.slider('Ph', { label: 'Diseño: presión de la caldera', min: 1, max: 20, step: 0.1, value: 15, unit: 'MPa', fmt: (v) => v.toFixed(1) });
    sim.slider('T3', { label: 'Diseño: temperatura del vapor', min: 300, max: 620, step: 1, value: 600, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.check('rh', { label: 'Recalentar a 4 MPa (o a 0.27 P de la caldera) hasta la misma temperatura', value: false });
    sim.out('e', 'Eficiencia del diseño', { hl: true });
    sim.out('x', 'Calidad de salida');
    let cache = null, key = '';
    const grid = (Pl, rh) => {
      const nP = 34, nT = 30, cells = [];
      for (let i = 0; i < nP; i++) for (let j = 0; j < nT; j++) {
        const P = 1e6 * Math.pow(20, i / (nP - 1)), T = 573.15 + (320 * j) / (nT - 1);
        if (T <= W.Tsat(P) + 1) { cells.push(null); continue; }
        try { const r = TH.rankine({ Ph: P, Pl, T3: T, Prh: rh ? Math.min(4e6, 0.27 * P) : null, Trh: rh ? T : null }); cells.push([r.eta, r.s4.x === null || r.s4.x === undefined ? 1 : r.s4.x]); } catch (e) { cells.push(null); }
      }
      return { nP, nT, cells };
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const k = p.Pl + '|' + p.rh;
      if (k !== key) { cache = grid(p.Pl * 1e3, p.rh); key = k; }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w - 60, h: cv.h, xmin: 1, xmax: 20, xlog: true, ymin: 300, ymax: 620, xlabel: 'presión de la caldera (MPa)', ylabel: 'temperatura del vapor (°C)' });
      pl.frame();
      const { nP, nT, cells } = cache;
      let lo = 1, hi = 0; for (const c of cells) if (c) { lo = Math.min(lo, c[0]); hi = Math.max(hi, c[0]); }
      for (let i = 0; i < nP; i++) for (let j = 0; j < nT; j++) {
        const c = cells[i * nT + j]; if (!c) continue;
        const P0 = Math.pow(20, (i - 0.5) / (nP - 1)), P1 = Math.pow(20, (i + 0.5) / (nP - 1)), T0 = 300 + (320 * (j - 0.5)) / (nT - 1), T1 = 300 + (320 * (j + 0.5)) / (nT - 1);
        ctx.fillStyle = EM.rgbStr(EM.cmap.viridis((c[0] - lo) / (hi - lo)), 0.85);
        ctx.fillRect(pl.X(P0), pl.Y(T1), pl.X(P1) - pl.X(P0) + 1, pl.Y(T0) - pl.Y(T1) + 1);
        if (c[1] < 0.88) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(pl.X(P0), pl.Y(T1), pl.X(P1) - pl.X(P0) + 1, pl.Y(T0) - pl.Y(T1) + 1); }
      }
      pl.fn((P) => W.Tsat(P * 1e6) - 273.15, { color: '--ink', width: 1.6 });
      /* barra de colores */
      const bx = cv.w - 46, by = 20, bh = cv.h - 70;
      for (let i = 0; i < 50; i++) { ctx.fillStyle = EM.rgbStr(EM.cmap.viridis(1 - i / 49)); ctx.fillRect(bx, by + (bh * i) / 50, 14, bh / 50 + 1); }
      EM.text(ctx, EM.fix(100 * hi, 0) + ' %', bx + 7, by - 6, { size: 10.5, align: 'center', color: '--ink-2' });
      EM.text(ctx, EM.fix(100 * lo, 0) + ' %', bx + 7, by + bh + 14, { size: 10.5, align: 'center', color: '--ink-2' });
      const Ph = p.Ph * 1e6, T3 = Math.max(p.T3 + 273.15, W.Tsat(Ph) + 1);
      const r = TH.rankine({ Ph, Pl: p.Pl * 1e3, T3, Prh: p.rh ? Math.min(4e6, 0.27 * Ph) : null, Trh: p.rh ? T3 : null });
      pl.dot(p.Ph, T3 - 273.15, { color: '--accent', r: 6, label: EM.fix(100 * r.eta, 1) + ' %' });
      sim.set('e', EM.fix(100 * r.eta, 2) + ' % (región clara: x₄ &lt; 0.88)');
      sim.set('x', r.s4.x === null || r.s4.x === undefined ? 'vapor sobrecalentado' : EM.fix(r.s4.x, 3));
    });
  });

  /* 14.3 Regenerativo */
  EM.defineSim('regenerativo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Ph', { label: 'Presión de la caldera', min: 2, max: 20, step: 0.1, value: 15, unit: 'MPa', fmt: (v) => v.toFixed(1) });
    sim.slider('T5', { label: 'Temperatura del vapor', min: 400, max: 620, step: 1, value: 600, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('Pl', { label: 'Presión del condensador', min: 5, max: 50, step: 0.5, value: 10, unit: 'kPa', fmt: (v) => v.toFixed(1) });
    sim.slider('Pb', { label: 'Presión del calentador abierto', min: 0.02, max: 10, step: 0.01, value: 1.2, unit: 'MPa', log: true, fmt: (v) => v.toFixed(2) });
    sim.out('eta', 'Eficiencia con regeneración', { hl: true });
    sim.out('e0', 'Eficiencia sin regeneración');
    sim.out('y', 'Fracción extraída <i>y</i>');
    sim.out('opt', 'Presión de extracción óptima');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const Ph = p.Ph * 1e6, Pl = p.Pl * 1e3, T5 = p.T5 + 273.15;
      const e0 = TH.rankine({ Ph, Pl, T3: T5 }).eta;
      const f = (Pb) => TH.rankineRegen({ Ph, Pl, Pb, T5 }).eta;
      const lo = Pl * 1.5, hi = Ph * 0.9;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: lo / 1e6, xmax: hi / 1e6, xlog: true, ymin: e0 * 100 - 1, ymax: e0 * 100 + 5, xlabel: 'presión del calentador (MPa)', ylabel: 'η (%)' });
      pl.frame();
      pl.hline(e0 * 100, { color: '--c6', label: 'sin regeneración' });
      pl.fn((P) => 100 * f(P * 1e6), { color: '--accent', width: 2.6, n: 80 });
      let best = [lo, 0]; for (let i = 0; i <= 80; i++) { const P = lo * Math.pow(hi / lo, i / 80), e = f(P); if (e > best[1]) best = [P, e]; }
      const Pb = Math.min(hi, Math.max(lo, p.Pb * 1e6)), r = TH.rankineRegen({ Ph, Pl, Pb, T5 });
      pl.dot(Pb / 1e6, 100 * r.eta, { color: '--accent', r: 6 });
      pl.vline(best[0] / 1e6, { color: '--c3', label: 'óptimo' });
      sim.set('eta', EM.fix(100 * r.eta, 2) + ' %');
      sim.set('e0', EM.fix(100 * e0, 2) + ' %');
      sim.set('y', EM.fix(r.y, 4));
      sim.set('opt', EM.fix(best[0] / 1e6, 2) + ' MPa (T_sat = ' + EM.fix(W.Tsat(best[0]) - 273.15, 0) + ' °C; media de extremos: ' + EM.fix((W.Tsat(Ph) + W.Tsat(Pl)) / 2 - 273.15, 0) + ' °C)');
    });
  });

  /* 14.4 Ciclo combinado */
  EM.defineSim('combinado', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('rp', { label: 'Relación de presiones de la turbina de gas', min: 6, max: 30, step: 0.5, value: 16, fmt: (v) => v.toFixed(1) });
    sim.slider('T3', { label: 'Temperatura de entrada a la turbina de gas', min: 1100, max: 1800, step: 10, value: 1500, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('Pv', { label: 'Presión del vapor', min: 2, max: 15, step: 0.5, value: 8, unit: 'MPa', fmt: (v) => v.toFixed(1) });
    sim.slider('pinch', { label: 'Diferencia mínima en la caldera de recuperación', min: 5, max: 60, step: 1, value: 15, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('cc', 'Eficiencia del ciclo combinado', { hl: true });
    sim.out('g', 'Turbina de gas: η · <i>T</i> de escape');
    sim.out('v', 'Ciclo de vapor: η · <i>T</i> del vapor');
    sim.out('m', 'Vapor por kg de gas · <i>T</i> de chimenea');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const cp = 1100; /* c_p medio de gases de escape */
      const b = TH.brayton({ rp: p.rp, T1: 300, T3: p.T3, etac: 0.88, etat: 0.9, cp: 1005 });
      const Pv = p.Pv * 1e6, Ts = W.Tsat(Pv), Tv = Math.min(873.15, b.T4 - 30);
      let res = null;
      if (Tv > Ts + 5) {
        const r = TH.rankine({ Ph: Pv, Pl: 8e3, T3: Tv, etat: 0.88, etap: 0.85 });
        const hv = r.s3.h, hpin = W.state(Pv, { x: 0 }).h;
        /* gas desde T4 hasta Ts + pinch evapora y sobrecalienta; el resto precalienta el agua */
        const ms = (cp * (b.T4 - (Ts + p.pinch))) / (hv - hpin);
        const Tstack = Math.max(330, Ts + p.pinch - (ms * (hpin - r.h2)) / cp);
        const Wg = b.wn, Wv = ms * r.wn, Q = b.qin;
        res = { r, ms, Tstack, eta: (Wg + Wv) / Q, Tv };
      }
      /* diagrama T–Q de la caldera de recuperación */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 100, ymin: 280, ymax: Math.max(900, b.T4 + 50), xlabel: 'calor transferido en la caldera de recuperación (% del total)', ylabel: 'T (K)' });
      pl.frame();
      if (res) {
        const Qt = cp * (b.T4 - res.Tstack), x = (T) => (100 * cp * (b.T4 - T)) / Qt;
        pl.path([[0, b.T4], [100, res.Tstack]], { color: '--c2', width: 2.6 });
        const Qsup = res.ms * (res.r.s3.h - W.state(Pv, { x: 1 }).h), Qev = res.ms * W.satP(Pv).hfg;
        const q1 = (100 * Qsup) / Qt, q2 = q1 + (100 * Qev) / Qt;
        pl.path([[0, res.Tv], [q1, Ts], [q2, Ts], [100, TH.agua.state(Pv, { h: res.r.h2 }).T]], { color: '--c1', width: 2.6 });
        pl.legend([{ label: 'gases de escape', color: '--c2' }, { label: 'agua y vapor', color: '--c1' }], 'tr');
        pl.label(q2, Ts, 'punto de pinza', { dy: -8, size: 10.5, color: '--ink-2' });
      }
      sim.set('cc', res ? EM.fix(100 * res.eta, 2) + ' %' : 'el escape no alcanza para sobrecalentar el vapor');
      sim.set('g', EM.fix(100 * b.eta, 2) + ' % · ' + EM.fix(b.T4, 0) + ' K');
      sim.set('v', res ? EM.fix(100 * res.r.eta, 2) + ' % · ' + EM.fix(res.Tv - 273.15, 0) + ' °C' : '—');
      sim.set('m', res ? EM.fix(res.ms, 4) + ' kg · ' + EM.fix(res.Tstack - 273.15, 0) + ' °C' : '—');
    });
  });
})();
