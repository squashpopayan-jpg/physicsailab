/* Capítulo 17 — Mezclas de gases y aire húmedo */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th, Y = TH.psy;
  const CITIES = [['Nivel del mar (Cartagena)', 0], ['Valledupar', 170], ['Cali', 1000], ['Medellín', 1495], ['Popayán', 1760], ['Bogotá', 2640], ['Pasto', 2527], ['Páramo (3800 m)', 3800]];
  /* carta psicrométrica en un Plot con ejes T (°C) y ω (g/kg) */
  const drawChart = (pl, P, o = {}) => {
    const tmax = pl.o.xmax;
    for (const ph of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]) pl.fn((t) => 1000 * Y.w(t, ph, P), { color: ph === 1 ? '--c1' : '--c1', width: ph === 1 ? 2.2 : 0.8, alpha: ph === 1 ? 1 : 0.5 });
    for (let ph = 0.2; ph <= 0.81; ph += 0.2) { const t = tmax - 2; pl.label(t, 1000 * Y.w(t, ph, P), (ph * 100).toFixed(0) + ' %', { size: 9.5, color: '--c1', align: 'right' }); }
    /* bulbo húmedo */
    for (let tw = 0; tw <= 34; tw += 2) {
      const ws = Y.w(tw, 1, P);
      pl.fn((t) => (t < tw ? NaN : (1000 * ((2501 - 2.326 * tw) * ws - 1.006 * (t - tw))) / (2501 + 1.86 * t - 4.186 * tw)), { color: '--c3', width: 0.7, alpha: 0.6 });
    }
    /* entalpía */
    if (o.h !== false) for (let h = 10; h <= 120; h += 10) pl.fn((t) => (1000 * (h - 1.006 * t)) / (2501 + 1.86 * t), { color: '--c4', width: 0.6, alpha: 0.35, dash: [3, 4] });
  };

  /* 17.1 Carta psicrométrica */
  EM.defineSim('carta', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.select('city', { label: 'Ciudad', options: CITIES.map(([n, z], i) => [String(i), n + ' (' + z + ' m)']), value: '4' });
    sim.slider('T', { label: 'Temperatura de bulbo seco', min: 0, max: 45, step: 0.1, value: 20, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('phi', { label: 'Humedad relativa', min: 0.02, max: 1, step: 0.01, value: 0.75, fmt: (v) => (v * 100).toFixed(0) + ' %' });
    sim.out('w', 'Humedad específica ω', { hl: true });
    sim.out('dp', 'Punto de rocío · bulbo húmedo');
    sim.out('h', 'Entalpía · volumen específico');
    sim.out('P', 'Presión atmosférica · presión de vapor');
    let pl = null;
    EM.pointer(cv, { down: (x, y) => { if (!pl || !pl.inside(x, y)) return null; pick(x, y); return true; }, move: (a, x, y) => pick(x, y) });
    const pick = (x, y) => {
      const P = TH.isa(CITIES[+sim.p.city][1]).P, t = Math.max(0, Math.min(45, pl.invX(x))), w = Math.max(0.0001, pl.invY(y) / 1000);
      sim.ctl.T.set(t, true); sim.ctl.phi.set(Math.max(0.02, Math.min(1, Y.phi(t, w, P))), true); sim.redraw();
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const P = TH.isa(CITIES[+p.city][1]).P;
      pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 45, ymin: 0, ymax: 36, xlabel: 'temperatura de bulbo seco (°C)', ylabel: 'ω (g de agua / kg de aire seco)' });
      pl.frame();
      /* zona de confort aproximada */
      ctx.save(); ctx.fillStyle = EM.alpha('--c3', 0.12); ctx.beginPath();
      const zone = [[20, 0.3], [26, 0.3], [26, 0.6], [20, 0.6]];
      const pts = [];
      for (let t = 20; t <= 26; t += 0.5) pts.push([t, 1000 * Y.w(t, 0.3, P)]);
      for (let t = 26; t >= 20; t -= 0.5) pts.push([t, 1000 * Y.w(t, 0.6, P)]);
      pts.forEach(([t, w], i) => (i ? ctx.lineTo(pl.X(t), pl.Y(w)) : ctx.moveTo(pl.X(t), pl.Y(w)))); ctx.closePath(); ctx.fill(); ctx.restore();
      void zone;
      drawChart(pl, P);
      const w = Y.w(p.T, p.phi, P), Tdp = Y.Tdew(w, P), Twb = Y.Twb(p.T, w, P);
      pl.path([[p.T, 1000 * w], [Tdp, 1000 * w]], { color: '--c2', width: 1.2, dash: [4, 3] });
      pl.dot(p.T, 1000 * w, { color: '--accent', r: 6 });
      pl.dot(Tdp, 1000 * w, { color: '--c2', r: 3.5, label: 'rocío', align: 'right', dx: -6 });
      pl.legend([{ label: 'humedad relativa', color: '--c1' }, { label: 'bulbo húmedo', color: '--c3' }, { label: 'entalpía', color: '--c4', dash: [3, 4] }, { label: 'confort aproximado', color: '--c3', kind: 'sq' }], 'tl');
      sim.set('w', EM.fix(1000 * w, 2) + ' g/kg');
      sim.set('dp', EM.fix(Tdp, 2) + ' °C · ' + EM.fix(Twb, 2) + ' °C');
      sim.set('h', EM.fix(Y.h(p.T, w), 2) + ' kJ/kg · ' + EM.fix(Y.v(p.T, w, P), 4) + ' m³/kg');
      sim.set('P', EM.fix(P / 1e3, 2) + ' kPa · ' + EM.fix((p.phi * TH.psatW(p.T + 273.15)) / 1e3, 3) + ' kPa');
    });
  });

  /* 17.2 Enfriamiento con deshumidificación y recalentamiento */
  EM.defineSim('acondicionado', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.select('city', { label: 'Ciudad', options: CITIES.map(([n, z], i) => [String(i), n]), value: '2' });
    sim.slider('T1', { label: 'Aire exterior', min: 20, max: 40, step: 0.5, value: 32, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('f1', { label: 'Humedad relativa exterior', min: 0.2, max: 1, step: 0.01, value: 0.6, fmt: (v) => (v * 100).toFixed(0) + ' %' });
    sim.slider('T2', { label: 'Salida del serpentín (saturada)', min: 5, max: 20, step: 0.5, value: 14, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('T3', { label: 'Después del recalentamiento', min: 10, max: 30, step: 0.5, value: 22, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.out('c', 'Agua condensada', { hl: true });
    sim.out('q', 'Calor extraído en el serpentín (sensible + latente)');
    sim.out('r', 'Calor de recalentamiento');
    sim.out('f', 'Humedad relativa final');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const P = TH.isa(CITIES[+p.city][1]).P;
      const w1 = Y.w(p.T1, p.f1, P), T2 = Math.min(p.T2, Y.Tdew(w1, P)), w2 = Y.w(T2, 1, P), T3 = Math.max(p.T3, T2);
      const h1 = Y.h(p.T1, w1), h2 = Y.h(T2, w2), h3 = Y.h(T3, w2);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 45, ymin: 0, ymax: 36, xlabel: 'temperatura de bulbo seco (°C)', ylabel: 'ω (g/kg)' });
      pl.frame();
      drawChart(pl, P, { h: false });
      const Tdp = Y.Tdew(w1, P);
      const path = [[p.T1, 1000 * w1], [Tdp, 1000 * w1]];
      for (let t = Tdp; t >= T2; t -= 0.25) path.push([t, 1000 * Y.w(t, 1, P)]);
      path.push([T2, 1000 * w2]);
      pl.path(path, { color: '--c1', width: 2.6 });
      pl.path([[T2, 1000 * w2], [T3, 1000 * w2]], { color: '--c2', width: 2.6 });
      pl.dot(p.T1, 1000 * w1, { color: '--ink', label: '1' }); pl.dot(T2, 1000 * w2, { color: '--ink', label: '2', align: 'right', dx: -8 }); pl.dot(T3, 1000 * w2, { color: '--ink', label: '3' });
      const qc = h1 - h2 - (w1 - w2) * 4.186 * T2;
      sim.set('c', EM.fix(1000 * (w1 - w2), 2) + ' g por kg de aire seco');
      sim.set('q', EM.fix(qc, 2) + ' kJ/kg (sensible ' + EM.fix(1.006 * (p.T1 - T2) + w2 * 1.86 * (p.T1 - T2), 1) + ', latente ' + EM.fix(qc - 1.006 * (p.T1 - T2) - w2 * 1.86 * (p.T1 - T2), 1) + ')');
      sim.set('r', EM.fix(h3 - h2, 2) + ' kJ/kg');
      sim.set('f', EM.fix(100 * Y.phi(T3, w2, P), 1) + ' %');
    });
  });

  /* 17.3 Enfriamiento evaporativo y mezcla */
  EM.defineSim('evaporativo', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.seg('mode', { label: 'Proceso', options: [['ev', 'Enfriador evaporativo'], ['mx', 'Mezcla de dos corrientes']], value: 'ev' });
    sim.select('city', { label: 'Ciudad', options: CITIES.map(([n, z], i) => [String(i), n]), value: '1' });
    sim.slider('T1', { label: 'Corriente 1: temperatura', min: 5, max: 42, step: 0.5, value: 35, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('f1', { label: 'Corriente 1: humedad relativa', min: 0.05, max: 1, step: 0.01, value: 0.35, fmt: (v) => (v * 100).toFixed(0) + ' %' });
    sim.slider('eff', { label: 'Efectividad del enfriador', min: 0.3, max: 1, step: 0.01, value: 0.85, fmt: (v) => v.toFixed(2) });
    sim.slider('T2', { label: 'Corriente 2: temperatura', min: 5, max: 42, step: 0.5, value: 15, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('f2', { label: 'Corriente 2: humedad relativa', min: 0.05, max: 1, step: 0.01, value: 0.9, fmt: (v) => (v * 100).toFixed(0) + ' %' });
    sim.slider('r', { label: 'Fracción de aire seco de la corriente 1', min: 0, max: 1, step: 0.01, value: 0.67, fmt: (v) => v.toFixed(2) });
    sim.out('o', 'Estado de salida', { hl: true });
    sim.out('w', 'Agua evaporada o ω de la mezcla');
    const sync = () => { const ev = sim.p.mode === 'ev'; sim.ctl.eff.show(ev); sim.ctl.T2.show(!ev); sim.ctl.f2.show(!ev); sim.ctl.r.show(!ev); };
    sim.onChange = sync; sync();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const P = TH.isa(CITIES[+p.city][1]).P;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 45, ymin: 0, ymax: 36, xlabel: 'temperatura de bulbo seco (°C)', ylabel: 'ω (g/kg)' });
      pl.frame();
      drawChart(pl, P, { h: false });
      const w1 = Y.w(p.T1, p.f1, P);
      if (p.mode === 'ev') {
        const Twb = Y.Twb(p.T1, w1, P), To = p.T1 - p.eff * (p.T1 - Twb), h1 = Y.h(p.T1, w1);
        const wo = (h1 - 1.006 * To) / (2501 + 1.86 * To);
        pl.path([[p.T1, 1000 * w1], [Twb, 1000 * Y.w(Twb, 1, P)]], { color: '--c3', width: 1.4, dash: [5, 4] });
        pl.path([[p.T1, 1000 * w1], [To, 1000 * wo]], { color: '--accent', width: 2.6 });
        pl.dot(p.T1, 1000 * w1, { color: '--ink', label: 'entrada' }); pl.dot(To, 1000 * wo, { color: '--accent', label: 'salida', align: 'right', dx: -8 });
        sim.set('o', EM.fix(To, 2) + ' °C, ' + EM.fix(100 * Y.phi(To, wo, P), 1) + ' % (bulbo húmedo ' + EM.fix(Twb, 2) + ' °C)');
        sim.set('w', EM.fix(1000 * (wo - w1), 2) + ' g por kg de aire seco');
      } else {
        const w2 = Y.w(p.T2, p.f2, P), wm = p.r * w1 + (1 - p.r) * w2, hm = p.r * Y.h(p.T1, w1) + (1 - p.r) * Y.h(p.T2, w2), Tm = (hm - 2501 * wm) / (1.006 + 1.86 * wm);
        pl.path([[p.T1, 1000 * w1], [p.T2, 1000 * w2]], { color: '--c6', width: 1.4, dash: [5, 4] });
        pl.dot(p.T1, 1000 * w1, { color: '--ink', label: '1' }); pl.dot(p.T2, 1000 * w2, { color: '--ink', label: '2' }); pl.dot(Tm, 1000 * wm, { color: '--accent', r: 6, label: 'mezcla' });
        const ph = Y.phi(Tm, wm, P);
        sim.set('o', EM.fix(Tm, 2) + ' °C, ' + EM.fix(100 * ph, 1) + ' %' + (ph > 1 ? ' (sobresaturada: niebla)' : ''));
        sim.set('w', EM.fix(1000 * wm, 2) + ' g/kg');
      }
    });
  });

  /* 17.4 Condensación en ventanas y muros */
  const SURF = [['Vidrio sencillo', 5.7], ['Vidrio doble', 2.8], ['Ladrillo 12 cm', 2.7], ['Bahareque 15 cm', 2.2], ['Muro aislado', 0.56]];
  EM.defineSim('condensacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Ti', { label: 'Temperatura interior', min: 12, max: 26, step: 0.5, value: 18, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('phi', { label: 'Humedad relativa interior', min: 0.3, max: 0.95, step: 0.01, value: 0.75, fmt: (v) => (v * 100).toFixed(0) + ' %' });
    sim.slider('Te', { label: 'Temperatura exterior', min: -5, max: 20, step: 0.5, value: 8, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.out('d', 'Punto de rocío del aire interior', { hl: true });
    sim.out('r', 'Superficies que se mojan');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const P = TH.isa(1760).P, w = Y.w(p.Ti, p.phi, P), Td = Y.Tdew(w, P);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: SURF.length, ymin: Math.min(p.Te, Td) - 2, ymax: p.Ti + 1, ylabel: 'temperatura de la cara interior (°C)', xticks: [] });
      pl.frame();
      const wet = [];
      SURF.forEach(([n, U], i) => {
        const Ts = p.Ti - U * (p.Ti - p.Te) * 0.13, phs = Y.phi(Ts, w, P);
        const col = Ts < Td ? '--c2' : phs > 0.8 ? '--c4' : '--c3';
        ctx.fillStyle = EM.alpha(col, 0.7); const x0 = pl.X(i + 0.15), x1 = pl.X(i + 0.85);
        ctx.fillRect(x0, pl.Y(Ts), x1 - x0, pl.Y(pl.o.ymin) - pl.Y(Ts));
        EM.text(ctx, n, (x0 + x1) / 2, pl.Y(pl.o.ymin) + 14, { size: 10.5, align: 'center', color: '--ink-2' });
        EM.text(ctx, EM.fix(Ts, 1) + ' °C', (x0 + x1) / 2, pl.Y(Ts) - 6, { size: 11, align: 'center', mono: true, color: '--ink' });
        if (Ts < Td) wet.push(n); else if (phs > 0.8) wet.push(n + ' (riesgo de moho)');
      });
      pl.hline(Td, { color: '--c2', dash: [6, 4], width: 2, label: 'punto de rocío ' + EM.fix(Td, 1) + ' °C' });
      sim.set('d', EM.fix(Td, 2) + ' °C');
      sim.set('r', wet.length ? wet.join(' · ') : 'ninguna');
    });
  });
})();
