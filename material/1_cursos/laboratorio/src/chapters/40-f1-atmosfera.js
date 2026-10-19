/* Práctica F1 · La presión del aire y la altura */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const G = MC.K.gPop;
  MC.defineSim('f1-altura', function (sim) {
    const cv = sim.canvas({ aspect: 2.6, label: 'Presión durante el recorrido' });
    const cg = sim.canvas({ aspect: 2.6, label: 'Presión contra altura' });
    const tab = MC.results(sim, ['Piso', '<i>z</i> (m)', '<i>p</i> subiendo (hPa)', '<i>p</i> bajando (hPa)', '<i>p</i> promedio (hPa)'], { decimals: [0, 2, 3, 3, 3], title: 'Promedios en cada piso' });
    const hist = new MC.History(['p', 'z'], { minDt: 0.2, max: 20000 });
    let plan = [], segs = [];
    sim.group('Edificio');
    sim.slider('nf', { label: 'Pisos a subir', min: 2, max: 10, step: 1, value: 5, fmt: (q) => String(Math.round(q)), reset: true });
    sim.slider('hf', { label: 'Altura de cada piso', min: 2.5, max: 3.6, step: 0.05, value: 3.0, unit: 'm', fmt: (q) => MC.fix(q, 2), reset: true });
    sim.slider('T', { label: 'Temperatura del aire', min: 10, max: 30, step: 0.5, value: 19, unit: '°C', fmt: (q) => MC.fix(q, 1), reset: true });
    sim.group('Condiciones');
    sim.check('drift', { label: 'Deriva del clima (−1 hPa/h)', value: true, reset: true });
    sim.check('wind', { label: 'Corrientes de aire en la escalera', value: true, reset: true });
    sim.button('Calcular promedios por piso', () => fill(), { primary: true });
    sim.out('rho', 'ρ del ajuste', { hl: true });
    sim.out('rhoi', 'ρ de los gases ideales (pM/RT)');
    const rhoTrue = () => (MC.K.pPop * 0.02897) / (8.314 * (273.15 + sim.p.T));
    function buildPlan() {
      plan = []; segs = [];
      const n = Math.round(sim.p.nf), hf = sim.p.hf, wait = 20, vs = 0.35;
      let t = 0;
      const add = (z0, z1, dt, floor, dir) => { plan.push({ t0: t, t1: t + dt, z0, z1 }); if (floor !== undefined) segs.push({ t0: t + 4, t1: t + dt - 2, floor, dir }); t += dt; };
      add(0, 0, 30, 0, 'up');
      for (let k = 1; k <= n; k++) { add((k - 1) * hf, k * hf, hf / vs * 1.6); add(k * hf, k * hf, wait, k, k === n ? 'top' : 'up'); }
      for (let k = n - 1; k >= 0; k--) { add((k + 1) * hf, k * hf, hf / vs * 1.4); add(k * hf, k * hf, wait, k, 'down'); }
      return t;
    }
    let Ttot = buildPlan();
    const zAt = (t) => { for (const s of plan) if (t >= s.t0 && t < s.t1) return s.z0 + ((s.z1 - s.z0) * (t - s.t0)) / (s.t1 - s.t0); return 0; };
    sim.run({
      h: 0.2, speed: 4, startLabel: 'Iniciar el recorrido',
      reset() { hist.clear(); Ttot = buildPlan(); tab.clear(); },
      step() {
        const t = sim.t, z = zAt(t);
        let p = MC.K.pPop - rhoTrue() * G * z;
        if (sim.p.drift) p -= (100 / 3600) * t;
        if (sim.p.wind) p += 2.5 * Math.sin(t * 0.7) * Math.sin(t * 0.13) + M.gauss(0, 0.8);
        p += M.gauss(0, 1.0);
        hist.push(t, { p: p / 100, z });
        if (t > Ttot) sim.end();
      },
      timeFmt: (t) => 't = ' + MC.fix(t, 0) + ' s'
    });
    function fill() {
      tab.clear();
      const n = Math.round(sim.p.nf);
      const avg = (s) => { const v = []; hist.d.t.forEach((t, i) => { if (t >= s.t0 && t <= s.t1) v.push(hist.d.p[i]); }); return v.length ? M.mean(v) : NaN; };
      for (let k = 0; k <= n; k++) {
        const up = segs.find((s) => s.floor === k && (s.dir === 'up' || s.dir === 'top'));
        const dn = segs.find((s) => s.floor === k && (s.dir === 'down' || (s.dir === 'top' && k === n)));
        const pu = up ? avg(up) : NaN, pd = dn ? avg(dn) : NaN;
        if (isFinite(pu) || isFinite(pd)) tab.add([k, k * sim.p.hf, pu, pd, isFinite(pu) && isFinite(pd) ? (pu + pd) / 2 : (isFinite(pu) ? pu : pd)]);
      }
    }
    sim.onDraw(() => {
      sim.set('rhoi', MC.fix(rhoTrue(), 3) + ' kg/m³');
      const ctx = cv.ctx;
      D.clear(cv);
      const T = hist.d.t;
      const n = Math.round(sim.p.nf);
      const pTop = MC.K.pPop / 100 + 0.05, pBot = (MC.K.pPop - rhoTrue() * G * n * sim.p.hf) / 100 - (sim.p.drift ? 0.25 : 0.05);
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Ttot, ymin: pBot - 0.05, ymax: pTop, xlabel: ['t', 's'], ylabel: ['p', 'hPa'], mt: 22, title: 'Barómetro durante el recorrido (sube, espera 20 s en cada piso, baja)' });
      P.frame();
      for (const s of segs) P.band(s.t0, s.t1, { color: s.dir === 'down' ? '--c4' : '--c3', alpha: 0.1 });
      P.xy(T, hist.d.p, { color: '--c1', width: 1.2 });
      const c2 = cg.ctx;
      D.clear(cg);
      const z = tab.col(1), pa = tab.col(4).map((p) => p * 100);
      const { f, P: Q } = MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: cg.h }, z, pa, { xlabel: ['z', 'm'], ylabel: ['p', 'Pa'], title: 'Presión promedio (subida y bajada) contra altura', zeroX: true });
      if (Q && tab.rows.length) { Q.scatter(z, tab.col(2).map((p) => p * 100), { color: '--c3', r: 3 }); Q.scatter(z, tab.col(3).map((p) => p * 100), { color: '--c4', r: 3 }); }
      sim.set('rho', f && z.length >= 3 ? L.pm(-f.m / G, f.sm / G, 'kg/m³') : 'termine el recorrido y calcule los promedios');
    });
  });
})();
