/* Capítulo 3 — Sustancias puras y cambio de fase */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th, D = EM.diag;
  const W = TH.agua;
  const kfmt = (v) => (v >= 1000 ? EM.fix(v / 1000, 3) + ' MPa' : EM.fix(v, v < 10 ? 3 : 1) + ' kPa');

  /* 3.1 Domo del agua en P–v y T–v */
  EM.defineSim('domo-agua', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.seg('d', { label: 'Diagrama', options: [['pv', 'P–v'], ['tv', 'T–v']], value: 'pv' });
    sim.slider('P', { label: 'Presión del estado', min: 1, max: 21000, step: 0.1, value: 200, log: true, fmt: (v) => kfmt(v) });
    sim.seg('k', { label: 'Segunda propiedad', options: [['x', 'Calidad x'], ['T', 'Temperatura T']], value: 'x' });
    sim.slider('x', { label: 'Calidad <i>x</i>', min: 0, max: 1, step: 0.01, value: 0.6, fmt: (v) => v.toFixed(2) });
    sim.slider('T', { label: 'Temperatura', min: 5, max: 800, step: 1, value: 300, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('st', 'Estado', { hl: true });
    sim.out('v', 'Volumen específico');
    sim.out('h', 'Entalpía y energía interna');
    const sync = () => { sim.ctl.x.show(sim.p.k === 'x'); sim.ctl.T.show(sim.p.k === 'T'); };
    sim.onChange = sync; sync();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const P = p.P * 1e3, st = p.k === 'x' ? W.state(P, { x: p.x }) : W.state(P, { T: p.T + 273.15 });
      let pl;
      if (p.d === 'pv') {
        pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 5e-4, xmax: 200, xlog: true, ymin: 0.6, ymax: 40000, ylog: true, xlabel: 'v (m³/kg)', ylabel: 'P (kPa)', ml: 60 });
        pl.frame();
        for (const t of [20, 100, 200, 300, 373.946, 450, 600, 800]) D.line(pl, D.isotherm(W, t + 273.15 + (t === 373.946 ? 0.01 : 0), 700, 21e6), 'v', 'P', { color: t === 373.946 ? '--c2' : '--c1', width: 1, alpha: 0.55 });
        D.drawDome(pl, W, 'v', 'P');
        if (st.T < W.Tc) D.line(pl, D.isotherm(W, st.T, 700, 21e6), 'v', 'P', { color: '--accent', width: 1.8 });
      } else {
        pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 5e-4, xmax: 200, xlog: true, ymin: 0, ymax: 820, xlabel: 'v (m³/kg)', ylabel: 'T (°C)', ml: 54 });
        pl.frame();
        for (const pp of [1, 10, 100, 1000, 5000, 20000]) D.line(pl, D.isobar(W, pp * 1e3, 273.17, 1073), 'v', 'T', { color: '--c1', width: 1, alpha: 0.55 });
        D.drawDome(pl, W, 'v', 'T');
        D.line(pl, D.isobar(W, P, 273.17, 1073), 'v', 'T', { color: '--accent', width: 1.8 });
      }
      pl.dot(st.v, p.d === 'pv' ? st.P / 1e3 : st.T - 273.15, { color: '--accent', r: 6 });
      sim.set('st', st.fase + ' · ' + EM.fix(st.T - 273.15, 2) + ' °C' + (st.x !== null && st.x !== undefined ? ' · x = ' + EM.fix(st.x, 3) : ''));
      sim.set('v', EM.sci(st.v, 4) + ' m³/kg');
      sim.set('h', 'h = ' + EM.fix(st.h / 1e3, 1) + ' · u = ' + EM.fix(st.u / 1e3, 1) + ' kJ/kg');
    });
  });

  /* 3.2 Calculadora de tablas */
  EM.defineSim('tablas-vapor', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.seg('f', { label: 'Fluido', options: [['agua', 'Agua'], ['r134a', 'R-134a']], value: 'agua' });
    sim.select('pair', { label: 'Propiedades conocidas', options: [['PT', 'Presión y temperatura'], ['Px', 'Presión y calidad'], ['Tx', 'Temperatura y calidad'], ['Ph', 'Presión y entalpía'], ['Ps', 'Presión y entropía']], value: 'Ph' });
    sim.slider('P', { label: 'Presión', min: 1, max: 21000, step: 0.1, value: 1000, unit: 'kPa', log: true, fmt: (v) => v.toFixed(1) });
    sim.slider('T', { label: 'Temperatura', min: 1, max: 800, step: 0.1, value: 250, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('x', { label: 'Calidad', min: 0, max: 1, step: 0.001, value: 0.5, fmt: (v) => v.toFixed(3) });
    sim.slider('h', { label: 'Entalpía', min: 0, max: 4200, step: 1, value: 2900, unit: 'kJ/kg', fmt: (v) => v.toFixed(0) });
    sim.slider('s', { label: 'Entropía', min: 0, max: 9.5, step: 0.001, value: 6.5, unit: 'kJ/kg·K', fmt: (v) => v.toFixed(3) });
    sim.out('fase', 'Región', { hl: true });
    sim.out('T', 'T y P');
    sim.out('v', 'Volumen específico <i>v</i>');
    sim.out('u', 'Energía interna <i>u</i>');
    sim.out('hh', 'Entalpía <i>h</i>');
    sim.out('ss', 'Entropía <i>s</i>');
    sim.out('xx', 'Calidad <i>x</i>');
    const lim = { agua: { P: [1, 21000], T: [1, 800], h: [0, 4200], s: [0, 9.5] }, r134a: { P: [52, 3900], T: [-40, 180], h: [0, 520], s: [0.75, 2.2] } };
    const sync = (id) => {
      const p = sim.p, L = lim[p.f];
      if (id === 'f') {
        sim.ctl.P.range(L.P[0], L.P[1]); sim.ctl.T.range(L.T[0], L.T[1]); sim.ctl.h.range(L.h[0], L.h[1]); sim.ctl.s.range(L.s[0], L.s[1]);
        if (p.f === 'r134a') { sim.ctl.P.set(500, true); sim.ctl.T.set(30, true); sim.ctl.h.set(420, true); sim.ctl.s.set(1.75, true); }
        else { sim.ctl.P.set(1000, true); sim.ctl.T.set(250, true); sim.ctl.h.set(2900, true); sim.ctl.s.set(6.5, true); }
      }
      const pr = p.pair;
      sim.ctl.P.show(pr[0] === 'P'); sim.ctl.T.show(pr.includes('T')); sim.ctl.x.show(pr.includes('x')); sim.ctl.h.show(pr === 'Ph'); sim.ctl.s.show(pr === 'Ps');
    };
    sim.onChange = sync; sync('f');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, F = TH[p.f];
      EM.draw.clear(cv);
      let st;
      try {
        if (p.pair === 'Tx') { const T = Math.min(F.Tc - 0.05, Math.max(F.Tt + 0.01, p.T + 273.15)); st = F.state(F.Psat(T), { x: p.x }); }
        else {
          const P = Math.min(F.Pmax, p.P * 1e3);
          st = p.pair === 'PT' ? F.state(P, { T: p.T + 273.15 }) : p.pair === 'Px' ? F.state(P, { x: p.x }) : p.pair === 'Ph' ? F.state(P, { h: p.h * 1e3 }) : F.state(P, { s: p.s * 1e3 });
        }
      } catch (e) { st = null; }
      const ag = p.f === 'agua';
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: ag ? 0 : 0.8, xmax: ag ? 9.5 : 2.0, ymin: ag ? 0 : -40, ymax: ag ? 800 : 180, xlabel: 's (kJ/kg·K)', ylabel: 'T (°C)' });
      pl.frame();
      D.drawDome(pl, F, 's', 'T');
      if (st && p.pair !== 'Tx') D.line(pl, D.isobar(F, Math.min(F.Pmax, p.P * 1e3), F.Tt + 0.02, F.Tmax), 's', 'T', { color: '--accent', width: 1.4, alpha: 0.7 });
      if (st) pl.dot(st.s / 1e3, st.T - 273.15, { color: '--accent', r: 6 });
      if (!st || !isFinite(st.h)) { sim.set('fase', 'fuera del intervalo de las tablas'); return; }
      sim.set('fase', st.fase);
      sim.set('T', EM.fix(st.T - 273.15, 2) + ' °C · ' + kfmt(st.P / 1e3));
      sim.set('v', EM.sci(st.v, 5) + ' m³/kg');
      sim.set('u', EM.fix(st.u / 1e3, 2) + ' kJ/kg');
      sim.set('hh', EM.fix(st.h / 1e3, 2) + ' kJ/kg');
      sim.set('ss', EM.fix(st.s / 1e3, 4) + ' kJ/kg·K');
      sim.set('xx', st.x === null || st.x === undefined ? '— (una sola fase)' : EM.fix(st.x, 4));
    });
  });

  /* 3.3 Diagrama de fases P–T y olla a presión */
  const meltP = (T) => { const th = T / 273.16; return 611.657 * (1 - 0.626e6 * (1 - Math.pow(th, -3)) + 0.197135e6 * (1 - Math.pow(th, 21.2))); };
  EM.defineSim('fases-pt', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('z', { label: 'Altitud', min: 0, max: 8849, step: 1, value: 1760, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.slider('pg', { label: 'Presión manométrica de la olla', min: 0, max: 150, step: 1, value: 0, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.out('P', 'Presión absoluta', { hl: true });
    sim.out('Tb', 'Temperatura de ebullición');
    sim.out('t', 'Tiempo de cocción relativo (×2 cada 10 °C)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -60, xmax: 400, ymin: 1e-2, ymax: 1e6, ylog: true, xlabel: 't (°C)', ylabel: 'P (kPa)', ml: 60 });
      pl.frame();
      pl.fn((t) => TH.psatW(t + 273.15) / 1e3, { color: '--c1', width: 2.4, from: 0.01, to: 373.946 });
      pl.fn((t) => TH.psatW(t + 273.15) / 1e3, { color: '--c5', width: 2.4, from: -60, to: 0.01 });
      const mT = [], mP = [];
      for (let T = 273.16; T >= 251.17; T -= 0.05) { mT.push(T - 273.15); mP.push(meltP(T) / 1e3); }
      pl.xy(mT, mP, { color: '--c3', width: 2.4 });
      pl.dot(0.01, 0.611657, { color: '--ink', label: 'punto triple', dx: 8, dy: 14 });
      pl.dot(373.946, 22064, { color: '--ink', label: 'punto crítico', align: 'right', dx: -8 });
      pl.label(-45, 2000, 'SÓLIDO', { size: 13, color: '--ink-3' });
      pl.label(120, 30000, 'LÍQUIDO', { size: 13, color: '--ink-3' });
      pl.label(200, 0.3, 'VAPOR', { size: 13, color: '--ink-3' });
      const Pa = TH.isa(p.z).P + p.pg * 1e3, Tb = TH.tsatW(Pa) - 273.15;
      pl.hline(Pa / 1e3, { color: '--accent', label: 'P = ' + EM.fix(Pa / 1e3, 1) + ' kPa' });
      pl.dot(Tb, Pa / 1e3, { color: '--accent', r: 6, label: EM.fix(Tb, 1) + ' °C', dy: 16 });
      pl.legend([{ label: 'vaporización', color: '--c1' }, { label: 'sublimación', color: '--c5' }, { label: 'fusión (hielo I)', color: '--c3' }], 'br');
      const Tref = TH.tsatW(101325) - 273.15;
      sim.set('P', EM.fix(Pa / 1e3, 2) + ' kPa');
      sim.set('Tb', EM.fix(Tb, 2) + ' °C');
      sim.set('t', EM.fix(Math.pow(2, (Tref - Tb) / 10), 2) + ' × el de una olla abierta al nivel del mar');
    });
  });

  /* 3.4 Tanque rígido */
  EM.defineSim('tanque-rigido', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('phi', { label: 'Fracción de volumen líquido a 100 °C', min: 0.02, max: 0.9, step: 0.002, value: 0.5, fmt: (v) => v.toFixed(3) });
    sim.slider('T', { label: 'Temperatura actual', min: 100, max: 420, step: 0.1, value: 250, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.out('v', 'Volumen específico (constante)', { hl: true });
    sim.out('st', 'Estado');
    sim.out('P', 'Presión');
    const s0 = W.sat(373.15);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, Hc = cv.h;
      EM.draw.clear(cv);
      const v = 1 / (p.phi / s0.vf + (1 - p.phi) / s0.vg), T = p.T + 273.15;
      let phiL = 0, x = null, P, fase;
      if (T < W.Tc) {
        const s = W.sat(T);
        if (v > s.vf && v < s.vg) { x = (v - s.vf) / (s.vg - s.vf); phiL = ((1 - x) * s.vf) / v; P = s.P; fase = 'mezcla'; }
        else if (v <= s.vf) { phiL = 1; fase = 'líquido comprimido'; P = NaN; }
        else { phiL = 0; fase = 'vapor sobrecalentado'; P = TH.bisect((PP) => W.sup(PP, T).v - v, W.Pmin, Math.min(W.Pmax, W.Psat(T) * 0.99999), 1e-10); }
      } else { fase = v < 0.003106 ? 'fluido supercrítico (denso)' : 'fluido supercrítico (ligero)'; phiL = NaN; P = v > 0.0035 ? TH.bisect((PP) => W.sup(PP, T).v - v, W.Pmin, W.Pmax, 1e-10) : NaN; }
      /* tanque */
      const tx = 30, ty = 20, tw = Wc * 0.18, th = Hc - 40;
      ctx.fillStyle = EM.alpha('--c1', 0.08); ctx.fillRect(tx, ty, tw, th);
      if (isFinite(phiL)) { ctx.fillStyle = EM.alpha('--c1', 0.55); ctx.fillRect(tx, ty + th * (1 - phiL), tw, th * phiL); }
      else { const g = ctx.createLinearGradient(0, ty, 0, ty + th); g.addColorStop(0, EM.alpha('--c1', 0.25)); g.addColorStop(1, EM.alpha('--c1', 0.45)); ctx.fillStyle = g; ctx.fillRect(tx, ty, tw, th); }
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2.5; ctx.strokeRect(tx, ty, tw, th);
      EM.text(ctx, isFinite(phiL) ? 'líquido ' + (100 * phiL).toFixed(1) + ' %' : 'sin menisco', tx + tw / 2, ty + th + 14, { size: 11, align: 'center', color: '--ink-2' });
      const pl = new EM.Plot(ctx, { x: tx + tw + 20, y: 0, w: Wc - tx - tw - 20, h: Hc, xmin: 8e-4, xmax: 2, xlog: true, ymin: 80, ymax: 430, xlabel: 'v (m³/kg)', ylabel: 'T (°C)' });
      pl.frame();
      D.drawDome(pl, W, 'v', 'T');
      pl.vline(v, { color: '--accent', dash: [], width: 2 });
      pl.dot(v, p.T, { color: '--accent', r: 6 });
      sim.set('v', EM.sci(v, 4) + ' m³/kg (crítico 3.106×10⁻³)');
      sim.set('st', fase + (x !== null ? ' · x = ' + EM.fix(x, 4) : ''));
      sim.set('P', isFinite(P) ? kfmt(P / 1e3) : 'muy alta (líquido comprimido: fuera de la tabla)');
    });
  });
})();
