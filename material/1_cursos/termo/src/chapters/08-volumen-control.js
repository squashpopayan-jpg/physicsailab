/* Capítulo 8 — Primera ley en volúmenes de control */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th, D = EM.diag;
  const k = 1.4, cp = 1005, Rg = 287;
  /* flujo isentrópico por un orificio: caudal por unidad de área (kg/s·m²) */
  const flux = (P0, T0, Pb) => {
    const r = Math.max(Pb / P0, Math.pow(2 / (k + 1), k / (k - 1)));
    return (P0 / Math.sqrt(Rg * T0)) * Math.sqrt(((2 * k) / (k - 1)) * (Math.pow(r, 2 / k) - Math.pow(r, (k + 1) / k)));
  };

  /* 8.1 Tobera convergente */
  EM.defineSim('tobera', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('P1', { label: 'Presión de entrada', min: 100, max: 1000, step: 5, value: 300, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.slider('T1', { label: 'Temperatura de entrada', min: 250, max: 1200, step: 5, value: 400, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('V1', { label: 'Velocidad de entrada', min: 0, max: 100, step: 1, value: 30, unit: 'm/s', fmt: (v) => v.toFixed(0) });
    sim.slider('r', { label: 'Cociente <i>P</i><sub>salida</sub>/<i>P</i><sub>entrada</sub>', min: 0.1, max: 0.99, step: 0.005, value: 2 / 3, fmt: (v) => v.toFixed(3) });
    sim.out('V2', 'Velocidad de salida', { hl: true });
    sim.out('T2', 'Temperatura de salida');
    sim.out('M', 'Número de Mach a la salida');
    sim.out('g', 'Caudal por unidad de área de garganta');
    const rc = Math.pow(2 / (k + 1), k / (k - 1));
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const T01 = p.T1 + (p.V1 * p.V1) / (2 * cp), P01 = p.P1 * Math.pow(T01 / p.T1, k / (k - 1));
      const V2 = (r) => { const re = Math.max(r * p.P1 / P01, rc); const T2 = T01 * Math.pow(re, (k - 1) / k); return Math.sqrt(2 * cp * (T01 - T2)); };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.1, xmax: 1, ymin: 0, ymax: Math.sqrt(2 * cp * T01) * 0.75, xlabel: 'P_2/P_1', ylabel: 'V_2 (m/s)' });
      pl.frame();
      pl.band(0.1, (rc * P01) / p.P1, { color: '--c2', alpha: 0.08 });
      pl.fn(V2, { color: '--accent', width: 2.6 });
      pl.vline((rc * P01) / p.P1, { color: '--c2', label: 'presión crítica' });
      const v = V2(p.r), re = Math.max((p.r * p.P1) / P01, rc), T2 = T01 * Math.pow(re, (k - 1) / k), a = Math.sqrt(k * Rg * T2);
      pl.dot(p.r, v, { color: '--accent', r: 6 });
      pl.label(0.12, Math.sqrt(2 * cp * T01) * 0.7, 'región ahogada: V₂ = velocidad del sonido', { size: 11, color: '--c2' });
      sim.set('V2', EM.fix(v, 1) + ' m/s' + ((p.r * p.P1) / P01 < rc ? ' (ahogada)' : ''));
      sim.set('T2', EM.fix(T2, 1) + ' K');
      sim.set('M', EM.fix(v / a, 3));
      sim.set('g', EM.fix(flux(P01 * 1e3, T01, p.r * p.P1 * 1e3), 1) + ' kg/s·m²');
    });
  });

  /* 8.2 Turbina de vapor */
  EM.defineSim('turbina-vapor', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('P1', { label: 'Presión de entrada', min: 0.5, max: 20, step: 0.1, value: 3, unit: 'MPa', fmt: (v) => v.toFixed(1) });
    sim.slider('T1', { label: 'Temperatura de entrada', min: 200, max: 600, step: 5, value: 400, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('P2', { label: 'Presión de salida', min: 5, max: 500, step: 1, value: 10, unit: 'kPa', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('eta', { label: 'Eficiencia isentrópica', min: 0.5, max: 1, step: 0.01, value: 0.85, fmt: (v) => v.toFixed(2) });
    sim.slider('m', { label: 'Caudal de vapor', min: 1, max: 200, step: 1, value: 10, unit: 'kg/s', fmt: (v) => v.toFixed(0) });
    sim.out('W', 'Potencia', { hl: true });
    sim.out('w', 'Trabajo específico real · isentrópico');
    sim.out('x', 'Estado de salida');
    sim.out('in', 'Estado de entrada');
    const W = TH.agua;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const P1 = p.P1 * 1e6, P2 = p.P2 * 1e3, T1 = Math.max(p.T1 + 273.15, W.Tsat(P1) + 0.5);
      const a = W.state(P1, { T: T1 }), is = W.state(P2, { s: a.s }), h2 = a.h - p.eta * (a.h - is.h), b = W.state(P2, { h: h2 });
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 5, xmax: 8.6, ymin: 1900, ymax: 3800, xlabel: 's (kJ/kg·K)', ylabel: 'h (kJ/kg)' });
      pl.frame();
      D.drawDome(pl, W, 's', 'h', { crit: false });
      for (const pp of [P1, P2]) D.line(pl, D.isobar(W, pp, 280, 950), 's', 'h', { color: '--c1', width: 1.2, alpha: 0.7 });
      D.line(pl, [a, is], 's', 'h', { color: '--c3', width: 1.6, dash: [6, 4] });
      D.line(pl, [a, b], 's', 'h', { color: '--accent', width: 2.6 });
      pl.dot(a.s / 1e3, a.h / 1e3, { color: '--ink', label: '1' });
      pl.dot(is.s / 1e3, is.h / 1e3, { color: '--c3', label: '2s' });
      pl.dot(b.s / 1e3, b.h / 1e3, { color: '--accent', label: '2' });
      sim.set('W', EM.fix((p.m * (a.h - h2)) / 1e6, 2) + ' MW');
      sim.set('w', EM.fix((a.h - h2) / 1e3, 1) + ' · ' + EM.fix((a.h - is.h) / 1e3, 1) + ' kJ/kg');
      sim.set('x', b.fase + (b.x !== null && b.x !== undefined ? ', x = ' + EM.fix(b.x, 3) : ', ' + EM.fix(b.T - 273.15, 1) + ' °C'));
      sim.set('in', 'h = ' + EM.fix(a.h / 1e3, 1) + ' kJ/kg, s = ' + EM.fix(a.s / 1e3, 4) + ' kJ/kg·K');
    });
  });

  /* 8.3 Estrangulamiento y Joule–Thomson */
  const GASJT = { N2: 'Nitrógeno', CO2: 'Dióxido de carbono', CH4: 'Metano', Ar: 'Argón' };
  const cacheJT = {};
  const jtCurves = (g) => {
    if (cacheJT[g]) return cacheJT[g];
    const Ps = []; for (let i = 0; i <= 24; i++) Ps.push(1e5 + (299e5 * i) / 24);
    const iso = [];
    for (const T0 of [200, 250, 300, 350, 400, 500, 600]) { if (g === 'CO2' && T0 < 250) continue; const h0 = TH.prH(g, T0, 300e5); iso.push(Ps.map((P) => [P / 1e5, TH.bisect((T) => TH.prH(g, T, P) - h0, 80, 1500, 1e-8)])); }
    const inv = [];
    for (const P of Ps) {
      const mu = (T) => TH.muJT(g, T, P);
      let lo = null; let prev = null;
      for (let T = 1500; T > TH.CRIT[g].Tc * 1.05; T -= 25) { const m = mu(T); if (prev !== null && prev[1] < 0 && m >= 0) { lo = TH.bisect(mu, T, prev[0], 1e-6); break; } prev = [T, m]; }
      if (lo) inv.push([P / 1e5, lo]);
    }
    return (cacheJT[g] = { iso, inv });
  };
  EM.defineSim('joule-thomson', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.seg('mode', { label: 'Fluido', options: [['r134a', 'R-134a'], ['agua', 'Agua'], ['gas', 'Gas real']], value: 'r134a' });
    sim.select('g', { label: 'Gas', options: Object.entries(GASJT).map(([k, v]) => [k, v]), value: 'N2' });
    sim.slider('P1', { label: 'Presión antes de la válvula', min: 1, max: 300, step: 0.5, value: 8, unit: 'bar', fmt: (v) => v.toFixed(1) });
    sim.slider('T1', { label: 'Temperatura antes de la válvula', min: -50, max: 300, step: 0.5, value: 27, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.check('sat', { label: 'Líquido saturado a la entrada', value: true });
    sim.slider('P2', { label: 'Presión después de la válvula', min: 0.5, max: 50, step: 0.1, value: 1.2, unit: 'bar', log: true, fmt: (v) => v.toFixed(2) });
    sim.out('T2', 'Temperatura de salida', { hl: true });
    sim.out('x', 'Estado de salida');
    sim.out('h', 'Entalpía (constante)');
    const sync = () => { const g = sim.p.mode === 'gas'; sim.ctl.g.show(g); sim.ctl.sat.show(!g); sim.ctl.T1.show(g || !sim.p.sat); };
    sim.onChange = (id) => {
      if (id === 'mode') { const m = sim.p.mode; if (m === 'r134a') { sim.ctl.P1.set(8, true); sim.ctl.P2.set(1.2, true); } else if (m === 'agua') { sim.ctl.P1.set(20, true); sim.ctl.P2.set(1.013, true); } else { sim.ctl.P1.set(200, true); sim.ctl.P2.set(1, true); sim.ctl.T1.set(27, true); } }
      sync();
    };
    sync();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      if (p.mode === 'gas') {
        const c = jtCurves(p.g), T1 = p.T1 + 273.15, P1 = p.P1 * 1e5, P2 = Math.min(p.P2 * 1e5, P1);
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 300, ymin: 100, ymax: 900, xlabel: 'P (bar)', ylabel: 'T (K)' });
        pl.frame();
        for (const curve of c.iso) pl.path(curve, { color: '--grid-2', width: 1.2 });
        if (c.inv.length) pl.path(c.inv, { color: '--c2', width: 2.2 });
        let T2 = NaN; try { T2 = TH.jtT2(p.g, T1, P1, P2); } catch (e) { /* */ }
        const h0 = TH.prH(p.g, T1, P1), path = [];
        for (let i = 0; i <= 30; i++) { const P = P1 - ((P1 - P2) * i) / 30; path.push([P / 1e5, TH.bisect((T) => TH.prH(p.g, T, P) - h0, 80, 1500, 1e-8)]); }
        pl.path(path, { color: '--accent', width: 2.6 });
        pl.dot(P1 / 1e5, T1, { color: '--ink', label: '1' }); pl.dot(P2 / 1e5, T2, { color: '--accent', label: '2' });
        pl.legend([{ label: 'isentálpicas (Peng–Robinson)', color: '--grid-2' }, { label: 'curva de inversión', color: '--c2' }, { label: 'estrangulamiento', color: '--accent' }], 'tr');
        sim.set('T2', EM.fix(T2 - 273.15, 2) + ' °C (Δ = ' + EM.fix(T2 - T1, 2) + ' K)');
        sim.set('x', 'gas · μ_JT a la entrada = ' + EM.fix(TH.muJT(p.g, T1, P1) * 1e5, 3) + ' K/bar');
        sim.set('h', EM.fix(h0 / 1e3, 3) + ' kJ/mol (referencia: gas ideal a 298 K)');
        return;
      }
      const F = TH[p.mode], P1 = Math.min(F.Pmax, Math.max(F.Pmin, p.P1 * 1e5)), P2 = Math.min(P1 * 0.999, Math.max(F.Pmin, p.P2 * 1e5));
      const s1 = p.sat ? F.state(P1, { x: 0 }) : F.state(P1, { T: p.T1 + 273.15 }), s2 = F.state(P2, { h: s1.h });
      const ag = p.mode === 'agua';
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: ag ? 0 : 150, xmax: ag ? 3200 : 450, ymin: ag ? 1 : 50, ymax: ag ? 25000 : 4500, ylog: true, xlabel: 'h (kJ/kg)', ylabel: 'P (kPa)' });
      pl.frame();
      D.drawDome(pl, F, 'h', 'P');
      D.line(pl, [s1, s2], 'h', 'P', { color: '--accent', width: 2.6 });
      pl.dot(s1.h / 1e3, s1.P / 1e3, { color: '--ink', label: '1' }); pl.dot(s2.h / 1e3, s2.P / 1e3, { color: '--accent', label: '2' });
      sim.set('T2', EM.fix(s2.T - 273.15, 2) + ' °C (entrada ' + EM.fix(s1.T - 273.15, 2) + ' °C)');
      sim.set('x', s2.fase + (s2.x !== null && s2.x !== undefined ? ', x = ' + EM.fix(s2.x, 4) : ''));
      sim.set('h', EM.fix(s1.h / 1e3, 2) + ' kJ/kg');
    });
  });

  /* 8.4 Ducha eléctrica y mezclador */
  EM.defineSim('ducha', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('W', { label: 'Potencia de la ducha', min: 0, max: 7.5, step: 0.1, value: 5.5, unit: 'kW', fmt: (v) => v.toFixed(1) });
    sim.slider('q', { label: 'Caudal de agua fría', min: 1, max: 12, step: 0.1, value: 5, unit: 'L/min', fmt: (v) => v.toFixed(1) });
    sim.slider('Ti', { label: 'Temperatura del agua de la red', min: 8, max: 28, step: 0.5, value: 16, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('qh', { label: 'Caudal de agua caliente (calentador a gas a 55 °C)', min: 0, max: 8, step: 0.1, value: 0, unit: 'L/min', fmt: (v) => v.toFixed(1) });
    sim.slider('tar', { label: 'Tarifa de energía', min: 300, max: 1500, step: 10, value: 850, unit: '$/kWh', fmt: (v) => v.toFixed(0) });
    sim.slider('min', { label: 'Duración del baño', min: 2, max: 30, step: 1, value: 10, unit: 'min', fmt: (v) => v.toFixed(0) });
    sim.out('T', 'Temperatura de salida', { hl: true });
    sim.out('E', 'Energía eléctrica del baño');
    sim.out('c', 'Costo del baño');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const c = 4186, mc = p.q / 60, mh = p.qh / 60;
      const Tmix = (mc * p.Ti + mh * 55) / (mc + mh), Tout = Tmix + (p.W * 1000) / ((mc + mh) * c);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: 12, ymin: 10, ymax: 60, xlabel: 'caudal total (L/min)', ylabel: 'T de salida (°C)' });
      pl.frame();
      pl.band(1, 12, { alpha: 0 });
      ctx.fillStyle = EM.alpha('--c3', 0.1); ctx.fillRect(pl.X(1), pl.Y(41), pl.X(12) - pl.X(1), pl.Y(36) - pl.Y(41));
      pl.label(1.3, 40, 'zona de confort 36–41 °C', { size: 11, color: '--c3' });
      for (const w of [3, 4.5, 5.5, 7.5]) pl.fn((q) => Tmix + (w * 1000) / ((q / 60) * c), { color: w === p.W ? '--accent' : '--grid-2', width: 1.4 });
      pl.fn((q) => Tmix + (p.W * 1000) / ((q / 60) * c), { color: '--accent', width: 2.6 });
      pl.dot(p.q + p.qh, Tout, { color: '--accent', r: 6 });
      const E = (p.W * p.min) / 60;
      sim.set('T', EM.fix(Tout, 1) + ' °C (salto ' + EM.fix(Tout - Tmix, 1) + ' K)');
      sim.set('E', EM.fix(E, 3) + ' kWh');
      sim.set('c', '$' + EM.fix(E * p.tar, 0) + ' (sin contar el gas)');
    });
  });

  /* 8.5 Llenado de un tanque */
  EM.defineSim('llenado-tanque', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Pl', { label: 'Presión de la línea', min: 200, max: 2000, step: 10, value: 1000, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.slider('Tl', { label: 'Temperatura de la línea', min: 250, max: 400, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('P0', { label: 'Presión inicial del tanque', min: 0, max: 500, step: 5, value: 0, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.slider('hA', { label: 'Transferencia de calor con las paredes <i>hA</i>', min: 0, max: 20, step: 0.1, value: 0, unit: 'W/K', fmt: (v) => v.toFixed(1) });
    sim.out('T', 'Temperatura final', { hl: true });
    sim.out('m', 'Masa final');
    sim.out('k', 'Comparación con <i>kT<sub>l</sub></i>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const V = 0.05, Aor = 2e-5, Cd = 0.8, cvg = cp / k, Pl = p.Pl * 1e3, Tl = p.Tl, Tamb = 300;
      let T = Tl, m = Math.max(1e-6, (p.P0 * 1e3 * V) / (Rg * Tamb)); if (p.P0 > 0) T = Tamb; else T = Tl;
      let t = 0; const out = [];
      const dt = 0.002;
      for (let i = 0; i < 60000; i++) {
        const P = (m * Rg * T) / V;
        if (P >= Pl * 0.9999) break;
        const md = Cd * Aor * flux(Pl, Tl, P);
        const dU = md * cp * Tl + p.hA * (Tamb - T); /* d(mu)/dt */
        const mn = m + md * dt, Un = m * cvg * T + dU * dt;
        m = mn; T = Un / (m * cvg); t += dt;
        if (i % 20 === 0) out.push([t, P / 1e3, T]);
      }
      /* después del llenado, si hay transferencia de calor, enfriar a P de línea con válvula abierta (omitido) */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc / 2, h: H, xmin: 0, xmax: Math.max(t, 0.1), ymin: 0, ymax: p.Pl * 1.1, xlabel: 't (s)', ylabel: 'P (kPa)' });
      pl.frame(); pl.path(out.map((o) => [o[0], o[1]]), { color: '--c1', width: 2.4 }); pl.hline(p.Pl, { label: 'línea' });
      pl.hline(p.Pl * 0.528, { color: '--c2', label: 'fin del flujo ahogado' });
      const p2 = new EM.Plot(ctx, { x: Wc / 2, y: 0, w: Wc / 2, h: H, xmin: 0, xmax: Math.max(t, 0.1), ymin: 250, ymax: 600, xlabel: 't (s)', ylabel: 'T (K)' });
      p2.frame(); p2.path(out.map((o) => [o[0], o[2]]), { color: '--accent', width: 2.4 }); p2.hline(k * Tl, { color: '--c3', label: 'k·T_l', labelRight: true }); p2.hline(Tl, { label: 'T_l' });
      sim.set('T', EM.fix(T, 1) + ' K (' + EM.fix(T - 273.15, 1) + ' °C) en ' + EM.fix(t, 2) + ' s');
      sim.set('m', EM.fix(m * 1000, 1) + ' g en un tanque de 50 L');
      sim.set('k', 'kT_l = ' + EM.fix(k * Tl, 1) + ' K');
    });
  });
})();
