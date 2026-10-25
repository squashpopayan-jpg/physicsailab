/* Capítulo 5 — El enlace cristalino */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, DATA = EM.data;

  /* 5.1 Energía de cohesión */
  const KIND = { Ne: 'v', Ar: 'v', Kr: 'v', Xe: 'v', Li: 'm', Na: 'm', K: 'm', Rb: 'm', Cs: 'm', Be: 'm', Mg: 'm', Ca: 'm', Al: 'm', Zn: 'm', Pb: 'm', Cu: 'm', Ag: 'm', Au: 'm', Ti: 't', Cr: 't', Fe: 't', Co: 't', Ni: 't', Mo: 't', Nb: 't', W: 't', Pt: 't', C: 'c', Si: 'c', Ge: 'c' };
  EM.defineSim('cohesion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('order', { label: 'Orden', options: [['z', 'Por grupo'], ['e', 'Por energía']], value: 'z' });
    sim.check('log', { label: 'Escala logarítmica', value: false });
    sim.out('max', 'Máximo', { hl: true });
    sim.out('min', 'Mínimo');
    const ORDER = ['Ne', 'Ar', 'Kr', 'Xe', 'Li', 'Na', 'K', 'Rb', 'Cs', 'Be', 'Mg', 'Ca', 'Al', 'Pb', 'C', 'Si', 'Ge', 'Ti', 'Cr', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Nb', 'Mo', 'Ag', 'W', 'Pt', 'Au'];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      let list = ORDER.map((e) => [e, DATA.cohesive[e]]);
      if (p.order === 'e') list = list.slice().sort((a, b) => a[1] - b[1]);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: list.length, ymin: p.log ? 0.01 : 0, ymax: p.log ? 20 : 9.8, ylog: p.log, xticks: [], ylabel: 'energía de cohesión (eV/átomo)' });
      pl.frame();
      const col = { v: '--c5', m: '--c1', t: '--c4', c: '--c3' };
      list.forEach(([e, u], i) => {
        const x0 = pl.X(i + 0.15), x1 = pl.X(i + 0.85), y0 = pl.Y(p.log ? 0.01 : 0), y1 = pl.Y(u);
        ctx.fillStyle = EM.alpha(col[KIND[e]], 0.8); ctx.fillRect(x0, y1, x1 - x0, y0 - y1);
        EM.text(ctx, e, (x0 + x1) / 2, pl.iy + pl.ih + 14, { size: 10.5, align: 'center', color: '--ink-2' });
      });
      pl.legend([{ label: 'van der Waals', color: '--c5', kind: 'sq' }, { label: 'metales s, p', color: '--c1', kind: 'sq' }, { label: 'metales de transición', color: '--c4', kind: 'sq' }, { label: 'covalentes', color: '--c3', kind: 'sq' }], 'tl');
      const s = list.slice().sort((a, b) => a[1] - b[1]);
      sim.set('max', s[s.length - 1][0] + ': ' + s[s.length - 1][1] + ' eV');
      sim.set('min', s[0][0] + ': ' + s[0][1] + ' eV');
    });
  });

  /* 5.2 Cristal de Lennard-Jones */
  EM.defineSim('lj-cristal', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('g', { label: 'Gas noble', options: [['Ne', 'Neón'], ['Ar', 'Argón'], ['Kr', 'Kriptón'], ['Xe', 'Xenón']], value: 'Ar' });
    sim.check('units', { label: 'Unidades reducidas (σ, ε)', value: false });
    sim.out('r0', 'Mínimo fcc', { hl: true });
    sim.out('exp', 'Medido');
    sim.out('sums', 'Sumas de red A₆, A₁₂ (fcc)');
    sim.out('dh', 'U(hcp) − U(fcc)');
    let sums = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      if (!sums) sums = { fcc: SS.ljSums('fcc', 14), hcp: SS.ljSums('hcp', 14), bcc: SS.ljSums('bcc', 14), sc: SS.ljSums('sc', 14) };
      const g = DATA.rareGas[p.g];
      const ux = p.units ? 1 : g.sigma, uy = p.units ? 1 : g.eps;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.95 * ux, xmax: 1.6 * ux, ymin: -9.5 * uy, ymax: 4 * uy, xlabel: p.units ? 'R/σ' : 'distancia entre vecinos R (Å)', ylabel: p.units ? 'U/(Nε)' : 'U por átomo (eV)' });
      pl.frame();
      const cols = { fcc: '--c1', hcp: '--c3', bcc: '--c2', sc: '--c5' };
      for (const k of ['sc', 'bcc', 'hcp', 'fcc']) {
        const s = sums[k];
        pl.fn((x) => { const r = x / ux; return 2 * uy * (s.A12 * Math.pow(r, -12) - s.A6 * Math.pow(r, -6)); }, { color: cols[k], width: k === 'fcc' ? 2.6 : 1.7, dash: k === 'hcp' ? [6, 4] : [] });
      }
      if (!p.units) pl.dot(g.r0, -g.U, { color: '--accent', r: 6, label: 'medido', dy: 16 });
      pl.legend([{ label: 'fcc', color: '--c1' }, { label: 'hcp', color: '--c3', dash: [6, 4] }, { label: 'bcc', color: '--c2' }, { label: 'sc', color: '--c5' }], 'tr');
      const f = sums.fcc, r0 = Math.pow((2 * f.A12) / f.A6, 1 / 6), U0 = -(f.A6 * f.A6) / (2 * f.A12);
      const uh = -(sums.hcp.A6 * sums.hcp.A6) / (2 * sums.hcp.A12);
      sim.set('r0', 'R₀ = ' + EM.fix(r0, 4) + ' σ = ' + EM.fix(r0 * g.sigma, 3) + ' Å · U₀ = ' + EM.fix(U0, 3) + ' ε = ' + EM.fix(U0 * g.eps * 1000, 1) + ' meV');
      sim.set('exp', 'R₀ = ' + g.r0 + ' Å · U₀ = −' + (g.U * 1000).toFixed(0) + ' meV');
      sim.set('sums', EM.fix(f.A6, 5) + ', ' + EM.fix(f.A12, 5));
      sim.set('dh', EM.fix((uh - U0) * 1e4, 2) + '×10⁻⁴ ε por átomo');
    });
  });

  /* 5.3 Convergencia de Madelung */
  let madCache = null;
  const madelungSums = () => {
    if (madCache) return madCache;
    const N = 14, sph = [], evj = [];
    /* esferas: suma de todos los iones con r ≤ ρ */
    const list = [];
    for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) for (let k = -N; k <= N; k++) {
      if (!i && !j && !k) continue;
      const r = Math.sqrt(i * i + j * j + k * k);
      list.push([r, -(((i + j + k) % 2 === 0) ? 1 : -1) / r]);
    }
    list.sort((a, b) => a[0] - b[0]);
    let s = 0;
    for (let q = 0; q < list.length; q++) { s += list[q][1]; if (q === list.length - 1 || list[q + 1][0] - list[q][0] > 1e-9) if (list[q][0] <= N) sph.push([list[q][0], s]); }
    /* cubos de Evjen de semilado n */
    for (let n = 1; n <= 10; n++) {
      let t = 0;
      for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) for (let k = -n; k <= n; k++) {
        if (!i && !j && !k) continue;
        const w = (Math.abs(i) === n ? 0.5 : 1) * (Math.abs(j) === n ? 0.5 : 1) * (Math.abs(k) === n ? 0.5 : 1);
        t += (-w * (((i + j + k) % 2 === 0) ? 1 : -1)) / Math.sqrt(i * i + j * j + k * k);
      }
      evj.push([n, t]);
    }
    madCache = { sph, evj };
    return madCache;
  };
  EM.defineSim('madelung', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('m', { label: 'Sistema', options: [['3d', 'NaCl (3D)'], ['1d', 'Cadena 1D']], value: '3d' });
    sim.out('ew', 'Ewald (NaCl)', { hl: true });
    sim.out('ev', 'Evjen con cubo de semilado 10');
    sim.out('ch', 'Cadena 1D con 1000 términos');
    let ew = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      if (!ew) ew = SS.madelung('NaCl').alpha;
      if (p.m === '3d') {
        const { sph, evj } = madelungSums();
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 14, ymin: -4, ymax: 6, xlabel: 'radio de la esfera o semilado del cubo (unidades de R)', ylabel: 'suma parcial de α' });
        pl.frame();
        for (const q of sph) pl.dot(q[0], q[1], { color: '--c2', r: 2.2 });
        pl.hline(ew, { color: '--ink', dash: [5, 3], label: 'Ewald 1.747565', labelRight: true });
        for (const [n, t] of evj) pl.dot(n, t, { color: '--c1', r: 5 });
        pl.xy(evj.map((q) => q[0]), evj.map((q) => q[1]), { color: '--c1', width: 1.6 });
        pl.legend([{ label: 'esferas (no converge)', color: '--c2', kind: 'dot' }, { label: 'cubos neutros de Evjen', color: '--c1' }], 'tr');
        sim.set('ev', EM.fix(evj[evj.length - 1][1], 6));
      } else {
        const n = 200, xs = [], ys = [];
        let s = 0;
        for (let k = 1; k <= n; k++) { s += (2 * (k % 2 ? 1 : -1)) / k; xs.push(k); ys.push(s); }
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: n, ymin: 0.8, ymax: 2.1, xlabel: 'número de vecinos sumados a cada lado', ylabel: 'suma parcial' });
        pl.frame();
        pl.xy(xs, ys, { color: '--c1', width: 1.3 });
        pl.hline(2 * Math.log(2), { color: '--ink', dash: [5, 3], label: '2 ln 2 = 1.3863', labelRight: true });
      }
      let s1 = 0;
      for (let k = 1; k <= 1000; k++) s1 += (2 * (k % 2 ? 1 : -1)) / k;
      sim.set('ew', EM.fix(ew, 6));
      sim.set('ch', EM.fix(s1, 6) + ' (exacto ' + EM.fix(2 * Math.log(2), 6) + ')');
    });
  });

  /* 5.4 Born–Mayer */
  EM.defineSim('born-mayer', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('c', { label: 'Cristal (tipo NaCl)', options: Object.keys(DATA.alkaliHalide).map((k) => [k, k]), value: 'NaCl' });
    sim.slider('rho', { label: 'Alcance de la repulsión ρ', min: 0.2, max: 0.5, step: 0.001, value: 0.321, unit: 'Å', fmt: (v) => v.toFixed(3) });
    sim.out('U', 'Energía de red U₀', { hl: true });
    sim.out('exp', 'Experimental (Born–Haber)');
    sim.out('B', 'Módulo de compresibilidad');
    sim.onChange = (id) => { if (id === 'c') sim.ctl.rho.set(DATA.alkaliHalide[sim.p.c].rho, true); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, d = DATA.alkaliHalide[p.c];
      EM.draw.clear(cv);
      const al = 1.747565, K = SS.COUL;
      /* zλ fijado por el equilibrio en el R0 medido con el ρ elegido */
      const zl = ((p.rho * al * K) / (d.R0 * d.R0)) * Math.exp(d.R0 / p.rho);
      const Ua = (R) => -(al * K) / R, Ur = (R) => zl * Math.exp(-R / p.rho);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1.4, xmax: 5, ymin: -14, ymax: 10, xlabel: 'R (Å)', ylabel: 'energía por par (eV)' });
      pl.frame();
      pl.fn(Ua, { color: '--c1', width: 1.6, dash: [6, 4] });
      pl.fn(Ur, { color: '--c2', width: 1.6, dash: [6, 4] });
      pl.fn((R) => Ua(R) + Ur(R), { color: '--ink', width: 2.6 });
      const U0 = SS.bornMayerU0(al, d.R0, p.rho);
      pl.dot(d.R0, U0, { color: '--accent', r: 6, label: 'R₀', dy: 16 });
      pl.legend([{ label: 'Madelung', color: '--c1', dash: [6, 4] }, { label: 'repulsión', color: '--c2', dash: [6, 4] }, { label: 'total', color: '--ink' }], 'tr');
      const B = (((al * SS.e * SS.e) / (4 * Math.PI * SS.eps0)) * (d.R0 / p.rho - 2)) / (18 * Math.pow(d.R0 * 1e-10, 4));
      sim.set('U', EM.fix(U0, 3) + ' eV = ' + EM.fix(-U0 * 23.0605, 1) + ' kcal/mol');
      sim.set('exp', d.U + ' kcal/mol');
      sim.set('B', EM.fix(B / 1e9, 1) + ' GPa');
    });
  });

  /* 5.5 Ion H2+ */
  EM.defineSim('h2plus', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('R', { label: 'Separación R', min: 0.5, max: 6, step: 0.01, value: 2.49, unit: 'a₀', fmt: (v) => v.toFixed(2) });
    sim.out('Eb', 'Energía de enlace en R', { hl: true });
    sim.out('min', 'Mínimo LCAO');
    sim.out('ex', 'Exacto');
    const H = 27.211386;
    const E = (R, s) => { const S = (1 + R + (R * R) / 3) * Math.exp(-R), j = (1 / R) * (1 - (1 + R) * Math.exp(-2 * R)), k = (1 + R) * Math.exp(-R); return (1 / R - (j + s * k) / (1 + s * S)) * H; };
    let Rm = null, Em = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, Hh = cv.h;
      EM.draw.clear(cv);
      if (Rm === null) { Rm = EM.lin.golden((R) => E(R, 1), 1, 5); Em = E(Rm, 1); }
      const wl = W * 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: Hh, xmin: 0.5, xmax: 6, ymin: -3, ymax: 8, xlabel: 'R (a₀)', ylabel: 'E − E_{1s} (eV)' });
      pl.frame();
      pl.hline(0, { dash: [], color: '--grid-2' });
      pl.fn((R) => E(R, 1), { color: '--c1', width: 2.4 });
      pl.fn((R) => E(R, -1), { color: '--c2', width: 2.4 });
      pl.vline(p.R, { color: '--accent', dash: [], width: 1.4 });
      pl.dot(2.0, -2.79, { color: '--ink', r: 4.5, label: 'exacto', dy: 14 });
      pl.legend([{ label: 'enlazante ψ₊', color: '--c1' }, { label: 'antienlazante ψ₋', color: '--c2' }], 'tr');
      /* densidad a lo largo del eje */
      const R = p.R, S = (1 + R + (R * R) / 3) * Math.exp(-R);
      const phi = (z) => Math.exp(-Math.abs(z)) / Math.sqrt(Math.PI);
      const dens = (z, s) => Math.pow(phi(z - R / 2) + s * phi(z + R / 2), 2) / (2 * (1 + s * S));
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: Hh, xmin: -5, xmax: 5, ymin: 0, ymax: 0.45, xlabel: 'z (a₀) sobre el eje', ylabel: '|ψ|² (a₀⁻³)' });
      p2.frame();
      p2.fn((z) => dens(z, 1), { color: '--c1', width: 2.2, fill: '--c1', fillAlpha: 0.12 });
      p2.fn((z) => dens(z, -1), { color: '--c2', width: 2.2 });
      p2.vline(R / 2, { color: '--ink-3' }); p2.vline(-R / 2, { color: '--ink-3' });
      sim.set('Eb', 'ψ₊: ' + EM.fix(E(R, 1), 3) + ' eV · ψ₋: ' + EM.fix(E(R, -1), 3) + ' eV');
      sim.set('min', 'R = ' + EM.fix(Rm, 3) + ' a₀ = ' + EM.fix(Rm * 0.529177, 3) + ' Å, D = ' + EM.fix(-Em, 3) + ' eV');
      sim.set('ex', 'R = 2.00 a₀ = 1.06 Å, D = 2.79 eV');
    });
  });
})();
