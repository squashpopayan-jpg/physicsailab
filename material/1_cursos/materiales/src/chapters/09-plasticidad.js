/* Capítulo 9 — Dislocaciones y endurecimiento */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M, V = EM.V;
  const idx = (a) => EM.millerStr(a);

  /* ======================================================================
     9.1 Factor de Schmid
     ====================================================================== */
  EM.defineSim('schmid', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    sim.seg('mode', { label: 'Modo', options: [['one', 'Un sistema (φ, λ)'], ['fcc', 'Monocristal FCC (12 sistemas)']], value: 'fcc' });
    sim.slider('phi', { label: 'Ángulo φ (eje–normal del plano)', min: 0, max: 90, step: 1, value: 45, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('lam', { label: 'Ángulo λ (eje–dirección)', min: 0, max: 90, step: 1, value: 45, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.select('ax', { label: 'Eje de carga [uvw]', options: [['0,0,1', '[001]'], ['0,1,1', '[011]'], ['1,1,1', '[111]'], ['1,2,3', '[123]'], ['1,1,2', '[112]'], ['0,1,2', '[012]'], ['1,2,5', '[125]']], value: '1,2,3' });
    sim.slider('crss', { label: 'τ<sub>crss</sub>', min: 0.2, max: 50, step: 0.1, value: 0.8, unit: 'MPa', fmt: (v) => EM.fix(v, 1) });
    sim.out('m', 'Factor de Schmid máximo', { hl: true });
    sim.out('sys', 'Sistema(s) activado(s)');
    sim.out('sy', 'Esfuerzo de fluencia σ<sub>y</sub> = τ<sub>crss</sub>/m');
    const v = new EM.View3D(sim, cv, { radius: 1.5, az: M.rad(25), el: M.rad(15) });
    const vis = () => { const one = sim.p.mode === 'one'; sim.ctl.phi.show(one); sim.ctl.lam.show(one); sim.ctl.ax.show(!one); };
    sim.onChange = vis; vis();
    sim.onDraw(() => {
      const p = sim.p;
      v.begin();
      let nrm, dir, axis = [0, 0, 1], m, txt;
      if (p.mode === 'one') {
        const ph = M.rad(p.phi), la = M.rad(p.lam);
        nrm = [Math.sin(ph), 0, Math.cos(ph)];
        /* dirección en el plano con ángulo λ al eje (si es posible) */
        const t1 = V.unit(V.cross(nrm, [0, 1, 0])), t2 = [0, 1, 0];
        /* d = a t1 + b t2, con d·z = cos λ; t1·z = ? */
        const tz = t1[2];
        const cl = Math.cos(la);
        const a = Math.abs(tz) > 1e-6 ? M.clamp(cl / tz, -1, 1) : 0;
        dir = V.unit(V.add(V.scale(t1, a), V.scale(t2, Math.sqrt(Math.max(0, 1 - a * a)))));
        m = Math.abs(Math.cos(ph)) * Math.abs(dir[2]);
        txt = 'λ realizable = ' + EM.fix(M.deg(Math.acos(Math.abs(dir[2]))), 1) + '° (φ + λ ≥ 90°)';
      } else {
        const t = p.ax.split(',').map(Number);
        const best = MAT.maxSchmidFCC(t);
        /* rotar para que el eje de carga quede vertical */
        const z = V.unit(t), xx = V.unit(Math.abs(z[0]) < 0.9 ? V.cross([1, 0, 0], z) : V.cross([0, 1, 0], z)), yy = V.cross(z, xx);
        const R = (q) => [V.dot(q, xx), V.dot(q, yy), V.dot(q, z)];
        nrm = V.unit(R(best.p)); dir = V.unit(R(best.d));
        if (nrm[2] < 0) nrm = V.scale(nrm, -1);
        if (dir[2] < 0) dir = V.scale(dir, -1);
        m = best.m;
        const all = MAT.fccSlip.filter(([pp, dd]) => { const tn = V.norm(t); return Math.abs((Math.abs(V.dot(pp, t)) / (V.norm(pp) * tn)) * (Math.abs(V.dot(dd, t)) / (V.norm(dd) * tn)) - m) < 1e-9; });
        txt = all.length + ' de 12: ' + all.slice(0, 4).map(([pp, dd]) => '(' + idx(pp) + ')[' + idx(dd) + ']').join(', ') + (all.length > 4 ? '…' : '');
      }
      /* cilindro */
      const Rc = 0.45, Hc = 1.1;
      for (let k = 0; k < 36; k++) {
        const a1 = (k / 36) * 2 * Math.PI, a2 = ((k + 1) / 36) * 2 * Math.PI;
        v.line([Rc * Math.cos(a1), Rc * Math.sin(a1), -Hc], [Rc * Math.cos(a2), Rc * Math.sin(a2), -Hc], { color: '--ink-3', width: 1 });
        v.line([Rc * Math.cos(a1), Rc * Math.sin(a1), Hc], [Rc * Math.cos(a2), Rc * Math.sin(a2), Hc], { color: '--ink-3', width: 1 });
        if (k % 9 === 0) v.line([Rc * Math.cos(a1), Rc * Math.sin(a1), -Hc], [Rc * Math.cos(a1), Rc * Math.sin(a1), Hc], { color: '--ink-3', width: 0.8 });
      }
      /* plano de deslizamiento: elipse de corte */
      if (Math.abs(nrm[2]) > 0.05) {
        const pts = [];
        for (let k = 0; k <= 48; k++) { const a = (k / 48) * 2 * Math.PI, x = Rc * Math.cos(a), y = Rc * Math.sin(a); pts.push([x, y, -(nrm[0] * x + nrm[1] * y) / nrm[2]]); }
        if (pts.every((q) => Math.abs(q[2]) < Hc)) v.poly(pts, { fill: '--accent', alpha: 0.35, stroke: '--accent', strokeAlpha: 0.9, shade: false });
      }
      v.arrow([0, 0, Hc], [0, 0, Hc + 0.45], { color: '--ink', width: 2.4 }); v.text([0, 0, Hc + 0.55], 'σ', { size: 15, italic: true });
      v.arrow([0, 0, -Hc], [0, 0, -Hc - 0.45], { color: '--ink', width: 2.4 });
      v.arrow([0, 0, 0], V.scale(nrm, 0.75), { color: '--c1', width: 2.2 }); v.text(V.scale(nrm, 0.85), 'n', { color: '--c1', italic: true });
      v.arrow([0, 0, 0], V.scale(dir, 0.75), { color: '--c3', width: 2.2 }); v.text(V.scale(dir, 0.88), 'd', { color: '--c3', italic: true });
      v.render();
      sim.set('m', EM.fix(m, 4));
      sim.set('sys', txt);
      sim.set('sy', m > 1e-6 ? EM.fix(p.crss / m, 2) + ' MPa' : '∞ (no desliza)');
    });
  });

  /* ======================================================================
     9.2 Hall–Petch
     ====================================================================== */
  const HP = { steel: ['Acero de bajo carbono', 70, 0.74], ti: ['Titanio', 80, 0.40], cu: ['Cobre', 25, 0.11], al: ['Aluminio', 16, 0.07] };
  EM.defineSim('hall-petch', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('m', { label: 'Metal (constantes típicas)', options: Object.entries(HP).map(([k, v]) => [k, v[0]]), value: 'steel' });
    sim.slider('d', { label: 'Tamaño de grano <i>d</i>', min: 0.5, max: 200, step: 0.1, value: 25, unit: 'µm', log: true, fmt: (v) => EM.fix(v, 1) });
    sim.out('sy', 'Límite elástico σ<sub>y</sub>', { hl: true });
    sim.out('hp', 'Aporte de los bordes <i>k<sub>y</sub></i> <i>d</i><sup>−½</sup>');
    sim.out('G', 'Número ASTM aproximado');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1500, ymin: 0, ymax: 1200, xlabel: 'd^{−1/2} (m^{−1/2})', ylabel: 'σ_y (MPa)', ml: 52 });
      pl.frame();
      for (const [k, [n, s0, ky]] of Object.entries(HP)) {
        pl.fn((x) => s0 + ky * x, { color: k === p.m ? '--accent' : '--grid-2', width: k === p.m ? 2.6 : 1.4 });
        pl.label(1350, s0 + ky * 1350, n, { size: 10.5, color: k === p.m ? '--accent' : '--ink-3', dy: -6, align: 'right' });
      }
      /* eje superior en µm */
      for (const dm of [100, 25, 10, 4, 2, 1, 0.5]) { const x = 1 / Math.sqrt(dm * 1e-6); if (x < 1500) { pl.vline(x, { color: '--grid-2', dash: [2, 4] }); pl.label(x, 1170, dm + ' µm', { size: 10, align: 'center', color: '--ink-3' }); } }
      const [, s0, ky] = HP[p.m], x = 1 / Math.sqrt(p.d * 1e-6);
      pl.dot(x, s0 + ky * x, { color: '--accent' });
      const NA = 1 / Math.pow(p.d * 1e-3, 2);
      sim.set('sy', EM.fix(s0 + ky * x, 0) + ' MPa');
      sim.set('hp', EM.fix(ky * x, 0) + ' MPa (σ<sub>0</sub> = ' + s0 + ' MPa)');
      sim.set('G', EM.fix(MAT.astmFromNA(NA), 1));
    });
  });

  /* ======================================================================
     9.3 Trabajo en frío
     ====================================================================== */
  EM.defineSim('cold-work', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    const P = EM.TENSILE_PRESETS;
    sim.select('m', { label: 'Material', options: ['cu', 'brass', 'low', 'ss304', 's4340'].map((k) => [k, P[k][0]]), value: 'cu' });
    sim.slider('cw', { label: 'Trabajo en frío', min: 0, max: 80, step: 1, value: 30, unit: '%', fmt: (v) => v.toFixed(0) });
    sim.out('eps', 'Deformación verdadera acumulada', { hl: true });
    sim.out('sy', 'Nuevo límite elástico ≈ <i>K</i>ε<sup>n</sup>');
    sim.out('eu', 'Alargamiento uniforme restante <i>n</i> − ε');
    sim.out('rho', 'Densidad de dislocaciones estimada (Taylor)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const [, E, sy0, K, n] = P[p.m];
      const flow = (e) => Math.max(sy0, K * Math.pow(Math.max(e, 1e-9), n));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0, xmax: 80, ymin: 0, ymax: K * Math.pow(1.6, n) * 1.05, xlabel: '% trabajo en frío', ylabel: 'σ_y (MPa)', ml: 54 });
      pl.frame();
      pl.fn((c) => flow(-Math.log(1 - c / 100)), { color: '--accent', width: 2.4 });
      const e = -Math.log(1 - p.cw / 100), sy = flow(e);
      pl.dot(p.cw, sy, { color: '--accent' });
      const pr = new EM.Plot(ctx, { x: W * 0.57, y: 0, w: W * 0.43, h: H, xmin: 0, xmax: 80, ymin: 0, ymax: Math.max(0.5, n) * 100, xlabel: '% trabajo en frío', ylabel: 'alarg. uniforme (%)', ml: 50 });
      pr.frame();
      pr.fn((c) => 100 * Math.max(0, n + 0.002 - (-Math.log(1 - c / 100))), { color: '--c1', width: 2.4 });
      pr.dot(p.cw, 100 * Math.max(0, n - e), { color: '--c1' });
      /* Taylor: σ ≈ M α G b √ρ con M = 3.06 (FCC), α = 0.3 */
      const G = (E / (2 * 1.33)) * 1e9, b = 0.25e-9;
      const rho = Math.pow((sy * 1e6) / (3.06 * 0.3 * G * b), 2);
      sim.set('eps', EM.fix(e, 3));
      sim.set('sy', EM.fix(sy, 0) + ' MPa (recocido: ' + sy0 + ' MPa)');
      sim.set('eu', EM.fix(100 * Math.max(0, n - e), 1) + ' %' + (n - e <= 0 ? ' — hay que recocer' : ''));
      sim.set('rho', EM.sci(rho, 1) + ' m⁻²');
    });
  });

  /* ======================================================================
     9.4 Recristalización
     ====================================================================== */
  EM.defineSim('recrystallization', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('view', { label: 'Vista', options: [['avrami', 'Avrami a varias T'], ['anneal', 'Recocido de 1 h']], value: 'avrami' });
    sim.slider('cw', { label: 'Trabajo en frío previo', min: 10, max: 80, step: 1, value: 40, unit: '%', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura destacada', min: 500, max: 750, step: 5, value: 600, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('n', { label: 'Exponente de Avrami <i>n</i>', min: 1, max: 4, step: 0.1, value: 2, fmt: (v) => EM.fix(v, 1) });
    sim.out('t50', '<i>t</i><sub>50</sub> a la temperatura destacada', { hl: true });
    sim.out('Trx', 'Temperatura de recristalización (X = 0.95 en 1 h)');
    sim.note('Modelo ilustrativo con Q = 149 kJ/mol y t₅₀ = 10 min a 600 K para 40 % de trabajo en frío (problema 6); la energía almacenada escala t₅₀ ∝ (40/TF)².');
    const Q = 149.3e3;
    const t50 = (T, cw) => 600 * Math.exp((Q / MAT.R) * (1 / T - 1 / 600)) * Math.pow(40 / cw, 2); // s
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const X = (t, T) => 1 - Math.exp(-Math.LN2 * Math.pow(t / t50(T, p.cw), p.n));
      if (p.view === 'avrami') {
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: 1e6, ymin: 0, ymax: 1.05, xlog: true, xlabel: 'tiempo (s)', ylabel: 'fracción recristalizada X', ml: 52 });
        pl.frame();
        for (let T = 525; T <= 725; T += 50) {
          pl.fn((t) => X(t, T), { color: Math.abs(T - p.T) < 25 ? '--accent' : '--grid-2', width: 1.6 });
          const th = t50(T, p.cw); if (th > 1 && th < 1e6) pl.label(th, 0.5, T + ' K', { size: 10, color: '--ink-3', dx: 4 });
        }
        pl.fn((t) => X(t, p.T), { color: '--accent', width: 2.6 });
        pl.hline(0.5, { color: '--ink-3' });
        pl.vline(3600, { color: '--ink-3', label: '1 h' });
      } else {
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 450, xmax: 800, ymin: 0, ymax: 700, xlabel: 'temperatura de recocido (K), 1 h', ylabel: 'σ_u (MPa) · alarg. ×10 (%)', ml: 54 });
        pl.frame();
        const TSa = 330, TScw = 330 + 6 * p.cw, ELa = 60, ELcw = Math.max(4, 60 - 1.1 * p.cw);
        const rec = (T) => 0.12 / (1 + Math.exp(-(T - 500) / 15)); // recuperación
        const ts = (T) => { const x = X(3600, T); return TScw - (TScw - TSa) * (0.9 * x + rec(T) * (1 - x)) - 20 * Math.max(0, (T - 700) / 100); };
        pl.fn(ts, { color: '--accent', width: 2.4 });
        pl.fn((T) => 10 * (ELcw + (ELa - ELcw) * X(3600, T)), { color: '--c1', width: 2.2, dash: [6, 3] });
        const Tr = MAT.bisect((T) => X(3600, T) - 0.95, 300, 1500);
        pl.band(Tr - 40, Tr, { color: '--c3', alpha: 0.12 });
        pl.label(Tr - 20, 650, 'recristalización', { align: 'center', size: 11, color: '--c3' });
        pl.label(480, 650, 'recuperación', { size: 11, color: '--ink-3' });
        pl.label(Tr + 10, 650, 'crecimiento de grano', { size: 11, color: '--ink-3' });
        pl.legend([{ label: 'resistencia σ_u', color: '--accent' }, { label: 'alargamiento (% × 10)', color: '--c1', dash: [6, 3] }], 'br');
        pl.vline(p.T, { color: '--ink-2', dash: [] });
      }
      const Trx = MAT.bisect((T) => X(3600, T) - 0.95, 300, 1500);
      const tt = t50(p.T, p.cw);
      sim.set('t50', tt < 60 ? EM.fix(tt, 1) + ' s' : tt < 3600 ? EM.fix(tt / 60, 1) + ' min' : EM.fix(tt / 3600, 1) + ' h');
      sim.set('Trx', EM.fix(Trx, 0) + ' K = ' + EM.fix(Trx - 273.15, 0) + ' °C');
    });
  });
})();
