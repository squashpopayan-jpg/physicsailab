/* Capítulo 6 — Momento angular y átomo de hidrógeno (unidades atómicas) */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, S = P.sf, A = P.atom;
  const f4 = (v) => CQ.fix(v, 4), f6 = (v) => CQ.fix(v, 6);
  const LL = 'spdfgh';
  const REALNAME = {
    '0,0': 's', '1,0': 'p_z', '1,1': 'p_x', '1,-1': 'p_y',
    '2,0': 'd_{z²}', '2,1': 'd_{xz}', '2,-1': 'd_{yz}', '2,2': 'd_{x²−y²}', '2,-2': 'd_{xy}',
    '3,0': 'f_{z³}', '3,1': 'f_{xz²}', '3,-1': 'f_{yz²}', '3,2': 'f_{z(x²−y²)}', '3,-2': 'f_{xyz}', '3,3': 'f_{x(x²−3y²)}', '3,-3': 'f_{y(3x²−y²)}'
  };
  const nameHTML = (s) => s.replace(/_\{([^}]*)\}/g, '<sub>$1</sub>').replace(/_([A-Za-z0-9])/g, '<sub>$1</sub>');

  /* ======================================================================
     6.1 Armónicos esféricos 3D
     ====================================================================== */
  CQ.defineSim('armonicos', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    const v3 = new CQ.View3D(sim, cv, { radius: 1.25, az: M.rad(35), el: M.rad(22) });
    sim.group('Armónico esférico');
    sim.slider('l', { label: '<i>l</i>', min: 0, max: 3, value: 1, step: 1, fmt: (v) => CQ.fix(v, 0), onInput: () => { if (Math.abs(sim.p.m) > sim.p.l) sim.ctl.m.set(0, true); } });
    sim.slider('m', { label: '<i>m</i>', min: -3, max: 3, value: 0, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.seg('mode', { label: 'Representación', options: [['real', 'Real (química)'], ['cplx', '|Y|² complejo']], value: 'real' });
    sim.check('wire', { label: 'Malla', value: false });
    sim.out('name', 'Orbital', { hl: true });
    sim.out('L2', '|<b>L</b>| = ħ√(<i>l</i>(<i>l</i>+1))');
    sim.out('Lz', '<i>L</i><sub>z</sub> = <i>m</i>ħ (forma compleja)');
    sim.out('nod', 'Planos o conos nodales');
    sim.onDraw(() => {
      const l = sim.p.l, m = M.clamp(sim.p.m, -l, l);
      v3.begin();
      v3.axes({ len: 1.05, neg: 0.9 });
      const real = sim.p.mode === 'real';
      const f = (th, ph) => (real ? S.Ylm(l, m, th, ph) : S.Ylm2(l, m, th));
      let mx = 0;
      for (let i = 0; i <= 30; i++) for (let j = 0; j <= 30; j++) mx = Math.max(mx, Math.abs(f((Math.PI * i) / 30, (2 * Math.PI * j) / 30)));
      const sc = 0.95 / mx;
      v3.mesh((th, ph) => { const r = Math.abs(f(th, ph)) * sc; return [r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th)]; }, 0.0001, Math.PI - 0.0001, 44, 0, 2 * Math.PI, 56, {
        fillFn: (th, ph) => (real ? (f(th, ph) >= 0 ? '--c2' : '--c1') : '--c5'), alpha: 0.92, wire: sim.p.wire ? '--ink' : null, wireAlpha: 0.18, wireEveryU: 4, wireEveryV: 4
      });
      v3.render();
      const nm = real ? REALNAME[l + ',' + m] || '' : `Y_{${l},${m}}`;
      sim.set('name', nameHTML(nm));
      sim.set('L2', `ħ·${CQ.fix(Math.sqrt(l * (l + 1)), 4)}`);
      sim.set('Lz', `${m}ħ`);
      sim.set('nod', String(l));
    });
  });

  /* ======================================================================
     6.2 Funciones radiales y potencial efectivo
     ====================================================================== */
  CQ.defineSim('radial-hidrogeno', function (sim) {
    const cvv = sim.canvas({ aspect: 2.6 });
    const cr = sim.canvas({ aspect: 2.1 });
    sim.group('Estado');
    sim.slider('n', { label: '<i>n</i>', min: 1, max: 6, value: 2, step: 1, fmt: (v) => CQ.fix(v, 0), onInput: () => { if (sim.p.l > sim.p.n - 1) sim.ctl.l.set(sim.p.n - 1, true); } });
    sim.slider('l', { label: '<i>l</i> (0 … <i>n</i> − 1)', min: 0, max: 5, value: 0, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('Z', { label: '<i>Z</i> (H, He⁺, Li²⁺)', min: 1, max: 3, value: 1, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.group('Curvas');
    sim.check('R', { label: '<i>R</i><sub>nl</sub>(<i>r</i>)', value: true });
    sim.check('P', { label: 'Densidad radial <i>r</i>²<i>R</i>²', value: true });
    sim.check('num', { label: 'Solución numérica (Numerov)', value: true });
    sim.out('E', '<i>E</i><sub>n</sub> exacta', { hl: true });
    sim.out('En', '<i>E</i> numérica (Numerov)', { hl: true });
    sim.out('rm', '⟨<i>r</i>⟩ fórmula / integral');
    sim.out('rp', 'Radio más probable');
    sim.out('nod', 'Nodos radiales <i>n</i> − <i>l</i> − 1');
    sim.onDraw(() => {
      const n = sim.p.n, l = Math.min(sim.p.l, n - 1), Z = sim.p.Z;
      const rmax = ((2.2 * n * n + 6) / Z) * 1.2;
      const E = A.hE(n, Z);
      /* potencial efectivo */
      CQ.draw.clear(cvv);
      const Ev = Math.min(-0.03, E * 1.8);
      const pv = new CQ.Plot(cvv.ctx, { x: 0, y: 0, w: cvv.w, h: cvv.h, xmin: 0, xmax: rmax, ymin: Math.min(E * 1.6, -0.6 * Z * Z / Math.max(1, n)), ymax: Math.max(0.15, -E), xlabel: '', ylabel: 'V_{ef} (Ha)', mb: 22 });
      pv.frame();
      pv.fn((r) => -Z / r + (l * (l + 1)) / (2 * r * r), { color: '--ink', width: 2, from: 0.01, n: 800 });
      if (l > 0) pv.fn((r) => (l * (l + 1)) / (2 * r * r), { color: '--c2', width: 1.2, dash: [4, 3], from: 0.05 });
      pv.fn((r) => -Z / r, { color: '--c1', width: 1.2, dash: [4, 3], from: 0.02 });
      pv.hline(E, { color: '--accent', label: `E_${n} = ${CQ.fix(E, 4)} Ha`, labelRight: true });
      pv.legend([{ label: 'potencial efectivo', color: '--ink' }, { label: '−Z/r', color: '--c1', dash: [4, 3] }].concat(l > 0 ? [{ label: 'barrera l(l+1)/2r²', color: '--c2', dash: [4, 3] }] : []), 'br');
      void Ev;
      /* R y P */
      CQ.draw.clear(cr);
      let mxR = 0, mxP = 0;
      for (let q = 1; q <= 600; q++) { const r = (rmax * q) / 600, R = A.hR(n, l, r, Z); mxR = Math.max(mxR, Math.abs(R)); mxP = Math.max(mxP, r * r * R * R); }
      const pr = new CQ.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: 0, xmax: rmax, ymin: -0.55, ymax: 1.1, xlabel: 'r (a₀)', ylabel: 'normalizadas al máximo', yticks: [-0.5, 0, 0.5, 1] });
      pr.frame();
      if (sim.p.P) pr.fn((r) => (r * r * A.hR(n, l, r, Z) ** 2) / mxP, { color: '--prob', width: 2.4, n: 800, fill: '--prob', fillAlpha: 0.12 });
      if (sim.p.R) pr.fn((r) => A.hR(n, l, r, Z) / mxR, { color: '--c1', width: 2, n: 800 });
      let En = NaN;
      if (sim.p.num) {
        const g = A.grid({ rmax: Math.max(60, 4 * rmax), N: 3001 });
        const V = new Float64Array(g.N);
        for (let i = 0; i < g.N; i++) V[i] = -Z / g.r[i];
        const s = A.solveRadial(g, V, l, n - l - 1);
        En = s.E;
        /* u = rR → R = u/r; se compara el signo con la exacta */
        const sgn = Math.sign(A.hR(n, l, 0.05 / Z, Z)) || 1;
        const xs = [], ys = [];
        for (let i = 0; i < g.N; i += 6) { const r = g.r[i]; if (r > rmax) break; if (r < 0.01) continue; xs.push(r); ys.push((sgn * s.u[i]) / r / mxR); }
        pr.xy(xs, ys, { color: '--c3', width: 0, alpha: 1 });
        pr.clip((ctx) => { ctx.fillStyle = CQ.col('--c3'); for (let q = 0; q < xs.length; q += 3) { ctx.beginPath(); ctx.arc(pr.X(xs[q]), pr.Y(ys[q]), 2, 0, 7); ctx.fill(); } });
      }
      const leg = [];
      if (sim.p.R) leg.push({ label: 'R_{nl} exacta', color: '--c1' });
      if (sim.p.P) leg.push({ label: 'r²R² exacta', color: '--prob' });
      if (sim.p.num) leg.push({ label: 'R numérica (puntos)', color: '--c3', kind: 'dot' });
      pr.legend(leg);
      const rmean = P.integ.fn((r) => r ** 3 * A.hR(n, l, r, Z) ** 2, 0, rmax * 4, 6000);
      sim.set('E', `${f6(E)} Ha = ${CQ.fix(E * P.K.Ha_eV, 4)} eV`);
      sim.set('En', sim.p.num ? f6(En) + ' Ha' : '—');
      sim.set('rm', `${f4(A.hRmean(n, l, Z))} / ${f4(rmean)} a₀`);
      sim.set('rp', f4(A.hRmostProbable(n, l, Z)) + ' a₀');
      sim.set('nod', String(n - l - 1));
    });
  });

  /* ======================================================================
     6.3 Orbitales en el plano xz
     ====================================================================== */
  const psiReal = (n, l, m, x, y, z, Z = 1) => {
    const r = Math.hypot(x, y, z);
    if (r < 1e-9) return l === 0 ? A.hR(n, 0, 0, Z) * S.Ylm(0, 0, 0, 0) : 0;
    const th = Math.acos(M.clamp(z / r, -1, 1)), ph = Math.atan2(y, x);
    return A.hR(n, l, r, Z) * S.Ylm(l, m, th, ph);
  };
  const orbOptions = (l) => (l === 0 ? [[0, 's']] : l === 1 ? [[0, 'p_z'], [1, 'p_x'], [-1, 'p_y']] : l === 2 ? [[0, 'd_{z²}'], [1, 'd_{xz}'], [2, 'd_{x²−y²}'], [-1, 'd_{yz}'], [-2, 'd_{xy}']] : [[0, 'f_{z³}'], [1, 'f_{xz²}'], [3, 'f_{x(x²−3y²)}']]);
  CQ.defineSim('orbitales-2d', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    const view = new CQ.View2D(cv, { xmin: -10, xmax: 10, ymin: -8, ymax: 8 });
    sim.group('Orbital');
    sim.slider('n', { label: '<i>n</i>', min: 1, max: 5, value: 3, step: 1, fmt: (v) => CQ.fix(v, 0), onInput: () => { if (sim.p.l > sim.p.n - 1) sim.ctl.l.set(sim.p.n - 1, true); } });
    sim.slider('l', { label: '<i>l</i>', min: 0, max: 3, value: 1, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('mi', { label: 'Orbital real (índice)', min: 0, max: 4, value: 0, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.seg('sc', { label: 'Escala de color', options: [['lin', 'lineal'], ['log', 'logarítmica']], value: 'lin' });
    sim.check('cont', { label: 'Curvas de nivel de |ψ|²', value: true });
    sim.out('name', 'Orbital', { hl: true });
    sim.out('E', 'Energía');
    sim.out('nod', 'Nodos radiales / angulares');
    sim.hint('corte y = 0 · rojo: ψ > 0 · azul: ψ < 0', cv);
    sim.onDraw(() => {
      const n = sim.p.n, l = Math.min(sim.p.l, n - 1);
      const opts = orbOptions(l);
      const [m, nm] = opts[Math.min(sim.p.mi, opts.length - 1)];
      const ext = (n * n * 2.6 + 3);
      view.setRange({ xmin: -ext, xmax: ext, ymin: -ext * 0.8, ymax: ext * 0.8 });
      let mx = 0;
      for (let i = 0; i <= 60; i++) for (let j = 0; j <= 60; j++) { const v = psiReal(n, l, m, -ext + (2 * ext * i) / 60, 0, -ext + (2 * ext * j) / 60); mx = Math.max(mx, v * v); }
      const lg = sim.p.sc === 'log';
      CQ.draw.clear(cv);
      CQ.field.heat(view, (x, z) => psiReal(n, l, m, x, 0, z), (v) => {
        const p = (v * v) / mx;
        const t = lg ? M.clamp(1 + Math.log10(p + 1e-12) / 5, 0, 1) : Math.sqrt(p);
        return CQ.cmap.diverging(Math.sign(v) * t);
      }, { res: 3 });
      if (sim.p.cont) CQ.field.contours(view, (x, z) => psiReal(n, l, m, x, 0, z) ** 2 / mx, [0.02, 0.1, 0.3, 0.6, 0.9], { color: '--ink', width: 0.9, alpha: 0.45, res: 4 });
      view.grid({ minorLines: false, xlabel: 'x (a₀)', ylabel: 'z (a₀)' });
      CQ.draw.charge(cv.ctx, view.X(0), view.Y(0), 1, { r: 5 });
      sim.set('name', nameHTML(`${n}${nm}`));
      sim.set('E', `${CQ.fix(A.hE(n), 4)} Ha = ${CQ.fix(A.hE(n) * P.K.Ha_eV, 3)} eV`);
      sim.set('nod', `${n - l - 1} / ${l}`);
    });
  });

  /* ======================================================================
     6.4 Nube electrónica 3D (muestreo por rechazo)
     ====================================================================== */
  CQ.defineSim('nube-3d', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    const v3 = new CQ.View3D(sim, cv, { radius: 1.3, az: M.rad(30), el: M.rad(18) });
    sim.group('Orbital');
    sim.select('orb', { options: [['1,0,0', '1s'], ['2,0,0', '2s'], ['2,1,0', '2p_z'], ['2,1,1', '2p_x'], ['3,0,0', '3s'], ['3,1,0', '3p_z'], ['3,2,0', '3d_z²'], ['3,2,2', '3d_x²−y²'], ['4,3,0', '4f_z³']], value: '2,1,0' });
    sim.slider('N', { label: 'Número de puntos', min: 500, max: 6000, value: 2500, step: 100, fmt: (v) => CQ.fix(v, 0) });
    sim.button('Nuevo muestreo', () => { pts = null; }, { primary: true });
    sim.out('acc', 'Eficiencia del muestreo');
    sim.out('rm', '⟨<i>r</i>⟩ de la muestra / exacto');
    let pts = null, key = '', eff = 0;
    const rng = P.rng(33);
    const sample = () => {
      const [n, l, m] = sim.p.orb.split(',').map(Number);
      const R = n * n * 2.5 + 4;
      let mx = 0;
      for (let q = 0; q < 20000; q++) { const x = (2 * rng() - 1) * R, y = (2 * rng() - 1) * R, z = (2 * rng() - 1) * R; mx = Math.max(mx, psiReal(n, l, m, x, y, z) ** 2); }
      mx *= 1.3;
      const out = [];
      let tries = 0;
      while (out.length < sim.p.N && tries < 3e6) {
        tries++;
        const x = (2 * rng() - 1) * R, y = (2 * rng() - 1) * R, z = (2 * rng() - 1) * R;
        const v = psiReal(n, l, m, x, y, z);
        if (rng() * mx < v * v) out.push([x / R, y / R, z / R, v >= 0 ? 1 : -1, Math.hypot(x, y, z)]);
      }
      eff = out.length / tries;
      pts = out; key = sim.p.orb + '|' + sim.p.N;
    };
    sim.onDraw(() => {
      if (!pts || key !== sim.p.orb + '|' + sim.p.N) sample();
      const [n, l] = sim.p.orb.split(',').map(Number);
      v3.begin();
      v3.axes({ len: 1.05, neg: 1.0 });
      const cp = CQ.col('--c2'), cn = CQ.col('--c1');
      for (const p of pts) v3.point([p[0], p[1], p[2]], { r: 1.6, color: p[3] > 0 ? cp : cn, ring: false });
      v3.point([0, 0, 0], { r: 4, color: '--pos' });
      v3.render();
      const rm = pts.reduce((s, p) => s + p[4], 0) / pts.length;
      sim.set('acc', CQ.fix(100 * eff, 2) + ' %');
      sim.set('rm', `${CQ.fix(rm, 3)} / ${CQ.fix(A.hRmean(n, l), 3)} a₀`);
    });
  });
})();
