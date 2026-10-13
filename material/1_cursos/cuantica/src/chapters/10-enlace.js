/* Capítulo 10 — El enlace químico */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, MOL = P.mol, V = CQ.V;
  const f4 = (v) => CQ.fix(v, 4), f3 = (v) => CQ.fix(v, 3);
  const HA = P.K.Ha_eV;

  /* ======================================================================
     10.1 H₂⁺
     ====================================================================== */
  CQ.defineSim('h2plus', function (sim) {
    const ce = sim.canvas({ aspect: 2.2 });
    const cd = sim.canvas({ aspect: 2.8 });
    sim.group('Geometría y base');
    sim.slider('R', { label: 'Distancia internuclear <i>R</i>', min: 0.6, max: 8, value: 2.5, step: 0.01, unit: 'a₀', fmt: (v) => CQ.fix(v, 2) });
    sim.check('opt', { label: 'Optimizar el exponente ζ para cada R', value: false });
    sim.slider('z', { label: 'Exponente ζ (si no se optimiza)', min: 0.6, max: 2, value: 1, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.check('ex', { label: 'Mostrar el mínimo exacto (Bates et al.)', value: true });
    sim.out('S', 'Solapamiento <i>S</i>');
    sim.out('Ep', '<i>E</i><sub>+</sub> (enlazante)', { hl: true });
    sim.out('Em', '<i>E</i><sub>−</sub> (antienlazante)');
    sim.out('De', 'Energía de enlace en este R');
    sim.out('min', 'Mínimo: <i>R</i><sub>e</sub>, <i>D</i><sub>e</sub>', { hl: true });
    sim.out('zz', 'ζ usado');
    let cacheKey = '', cacheMin = null;
    sim.onDraw(() => {
      const R = sim.p.R, opt = sim.p.opt;
      const zeta = opt ? MOL.h2pOpt(R).zeta : sim.p.z;
      const r = MOL.h2p(R, zeta);
      const key = opt + '|' + sim.p.z;
      if (key !== cacheKey) { cacheMin = MOL.h2pMin(opt, sim.p.z); cacheKey = key; }
      CQ.draw.clear(ce);
      const pl = new CQ.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: 0.6, xmax: 8, ymin: -0.65, ymax: 0.0, xlabel: 'R (a₀)', ylabel: 'E (Ha)' });
      pl.frame();
      pl.hline(-0.5, { color: '--ink-3', label: 'H + H⁺ separados (−0.5 Ha)', labelRight: true });
      pl.fn((x) => { const z = opt ? MOL.h2pOpt(x).zeta : sim.p.z; return MOL.h2p(x, z).Eg; }, { color: '--c1', width: 2.6, n: 260 });
      pl.fn((x) => { const z = opt ? MOL.h2pOpt(x).zeta : sim.p.z; return MOL.h2p(x, z).Eu; }, { color: '--c2', width: 2.2, n: 260 });
      if (sim.p.ex) pl.dot(MOL.H2P_EXACT.Re, MOL.H2P_EXACT.Ee, { color: '--ink', label: 'exacto', r: 5 });
      pl.dot(cacheMin.R, cacheMin.E, { color: '--c1', r: 4.5, label: 'mínimo LCAO', dy: 14 });
      pl.vline(R, { color: '--accent' });
      pl.legend([{ label: 'E₊ enlazante (σ_g)', color: '--c1' }, { label: 'E₋ antienlazante (σ_u)', color: '--c2' }], 'tr');
      /* densidades sobre el eje */
      CQ.draw.clear(cd);
      const zr = Math.max(4, R / 2 + 3.5);
      const dp = (zz) => MOL.h2pPsi(0, 0, zz, R, zeta, 1) ** 2, dm = (zz) => MOL.h2pPsi(0, 0, zz, R, zeta, -1) ** 2;
      const dat = (zz) => 0.5 * (MOL.sto1s(Math.abs(zz - R / 2), zeta) ** 2 + MOL.sto1s(Math.abs(zz + R / 2), zeta) ** 2);
      let mx = 0; for (let q = 0; q <= 300; q++) { const zz = -zr + (2 * zr * q) / 300; mx = Math.max(mx, dp(zz), dm(zz), dat(zz)); }
      const pd = new CQ.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: -zr, xmax: zr, ymin: 0, ymax: mx * 1.1, xlabel: 'posición sobre el eje (a₀)', ylabel: '|ψ|²', yticks: [] });
      pd.frame();
      pd.fn(dat, { color: '--ink-3', width: 1.5, dash: [5, 4], n: 600 });
      pd.fn(dp, { color: '--c1', width: 2.4, n: 600, fill: '--c1', fillAlpha: 0.12 });
      pd.fn(dm, { color: '--c2', width: 2, n: 600 });
      pd.vline(-R / 2, { color: '--pos', dash: [] }); pd.vline(R / 2, { color: '--pos', dash: [] });
      pd.legend([{ label: 'ψ₊²', color: '--c1' }, { label: 'ψ₋²', color: '--c2' }, { label: 'átomos sin interferencia', color: '--ink-3', dash: [5, 4] }]);
      sim.set('S', f4(r.S));
      sim.set('Ep', `${f4(r.Eg)} Ha`);
      sim.set('Em', `${f4(r.Eu)} Ha`);
      sim.set('De', `${CQ.fix((-0.5 - r.Eg) * HA, 3)} eV`);
      sim.set('min', `${CQ.fix(cacheMin.R, 3)} a₀ · ${CQ.fix((-0.5 - cacheMin.E) * HA, 3)} eV`);
      sim.set('zz', f3(zeta));
    });
  });

  /* ======================================================================
     10.2 Diagramas de orbitales moleculares
     ====================================================================== */
  /* Energías de orbitales de valencia (eV), tabla de Miessler y Tarr */
  const AO = { Li: [-5.39, -3.5], Be: [-9.32, -6.0], B: [-14.05, -8.30], C: [-19.43, -10.66], N: [-25.56, -13.18], O: [-32.38, -15.85], F: [-40.17, -18.65] };
  const VAL = { Li: 1, Be: 2, B: 3, C: 4, N: 5, O: 6, F: 7 };
  const MOLS = { Li2: ['Li', 'Li'], Be2: ['Be', 'Be'], B2: ['B', 'B'], C2: ['C', 'C'], N2: ['N', 'N'], O2: ['O', 'O'], F2: ['F', 'F'], BN: ['B', 'N'], CO: ['C', 'O'] };
  CQ.defineSim('diagrama-om', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.group('Molécula');
    sim.select('m', { options: Object.keys(MOLS).map((k) => [k, k.replace('2', '₂')]), value: 'N2' });
    sim.out('ne', 'Electrones de valencia');
    sim.out('bo', 'Orden de enlace', { hl: true });
    sim.out('un', 'Electrones desapareados');
    sim.out('mag', 'Magnetismo');
    sim.note('Esquema cualitativo: niveles atómicos medidos y acoplamientos representativos. Hasta el N₂ la mezcla s–p sube el σ2p por encima de los π2p.');
    sim.onDraw(() => {
      const [a, b] = MOLS[sim.p.m];
      const ea = AO[a], eb = AO[b];
      const ne = VAL[a] + VAL[b];
      const two = (x, y, t) => { const m = (x + y) / 2, d = (x - y) / 2, w = Math.sqrt(d * d + t * t); return [m - w, m + w]; };
      const [s, ss] = two(ea[0], eb[0], 2.2);
      const [sp, ssp] = two(ea[1], eb[1], 3.2);
      const [pi, spi] = two(ea[1], eb[1], 1.7);
      const early = Math.max(VAL[a], VAL[b]) <= 5 && !(a === 'C' && b === 'O');
      const mixUp = early ? 1.1 * (pi - sp) + 1.0 : 0; /* sube σ2p por encima de π2p */
      const levels = [
        { name: 'σ2s', E: s, g: 1, b: 1 }, { name: 'σ*2s', E: ss, g: 1, b: -1 },
        { name: 'π2p', E: pi, g: 2, b: 1 }, { name: 'σ2p', E: sp + mixUp, g: 1, b: 1 },
        { name: 'π*2p', E: spi, g: 2, b: -1 }, { name: 'σ*2p', E: ssp, g: 1, b: -1 }
      ].sort((p, q) => p.E - q.E);
      if (a === 'C' && b === 'O') { const i = levels.findIndex((l) => l.name === 'σ2p'), j = levels.findIndex((l) => l.name === 'π2p'); if (levels[i].E < levels[j].E) levels[i].E = levels[j].E + 1.0; levels.sort((p, q) => p.E - q.E); }
      /* llenado (Aufbau + Hund) */
      let left = ne, bond = 0, unp = 0;
      for (const L of levels) {
        const cap = 2 * L.g, k = Math.min(cap, left);
        L.occ = k; left -= k; bond += L.b * k;
        if (L.g === 2) unp += k <= 2 ? k : 4 - k; else unp += k === 1 ? 1 : 0;
      }
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      CQ.draw.clear(cv);
      const Emin = Math.min(ea[0], eb[0], s) - 3, Emax = Math.max(ssp, ea[1], eb[1]) + 3;
      const Y = (E) => 20 + ((Emax - E) / (Emax - Emin)) * (H - 50);
      const lineAt = (x, E, w, col) => { ctx.strokeStyle = CQ.col(col); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x - w / 2, Y(E)); ctx.lineTo(x + w / 2, Y(E)); ctx.stroke(); };
      const elec = (x, E, k, g) => {
        for (let q = 0; q < k; q++) {
          const slot = g === 2 ? (q % 2) : 0, up = g === 2 ? q < 2 : q === 0;
          const xx = x + (g === 2 ? (slot ? 18 : -18) : 0) + (up ? -4 : 4);
          CQ.draw.arrow(ctx, xx, Y(E) + (up ? 8 : -8), xx, Y(E) + (up ? -8 : 8), { color: '--accent', width: 1.6, head: 5 });
        }
      };
      const xA = W * 0.14, xB = W * 0.86, xM = W * 0.5;
      /* orbitales atómicos */
      [[xA, ea, a], [xB, eb, b]].forEach(([x, e, el]) => {
        lineAt(x, e[0], 40, '--ink-2'); CQ.text(ctx, `${el} 2s`, x, Y(e[0]) + 18, { size: 11.5, align: 'center', color: '--ink-2' });
        if (el !== 'Li' && el !== 'Be') { [-22, 0, 22].forEach((dx) => lineAt(x + dx, e[1], 18, '--ink-2')); CQ.text(ctx, `${el} 2p`, x, Y(e[1]) + 18, { size: 11.5, align: 'center', color: '--ink-2' }); }
      });
      /* orbitales moleculares */
      const showLev = levels.filter((L) => !((a === 'Li' || a === 'Be') && L.name.includes('2p')) || L.occ > 0);
      for (const L of showLev) {
        const col = L.b > 0 ? '--c1' : '--c2';
        if (L.g === 2) { lineAt(xM - 18, L.E, 28, col); lineAt(xM + 18, L.E, 28, col); } else lineAt(xM, L.E, 36, col);
        elec(xM, L.E, L.occ, L.g);
        CQ.text(ctx, L.name, xM + 52, Y(L.E) + 4, { size: 12, color: col });
        ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = CQ.alpha('--ink-3', 0.5); ctx.lineWidth = 1;
        const src = L.name.includes('2s') ? 0 : 1;
        ctx.beginPath(); ctx.moveTo(xA + 30, Y(ea[src])); ctx.lineTo(xM - 40, Y(L.E)); ctx.moveTo(xB - 30, Y(eb[src])); ctx.lineTo(xM + 40, Y(L.E)); ctx.stroke(); ctx.restore();
      }
      CQ.text(ctx, 'energía (eV, esquemática)', 8, 14, { size: 11, color: '--ink-3' });
      sim.set('ne', String(ne));
      sim.set('bo', CQ.fix(bond / 2, 1));
      sim.set('un', String(unp));
      sim.set('mag', unp ? 'paramagnética' : 'diamagnética');
    });
  });

  /* ======================================================================
     10.3 Del covalente al iónico (dos niveles)
     ====================================================================== */
  CQ.defineSim('heteronuclear', function (sim) {
    sim.cols2();
    const cm = sim.canvas({ aspect: 0.95 });
    const cs = sim.canvas({ aspect: 0.95 });
    const PRE = { CC: ['C–C', -10.66, -10.66, 2.6], BN: ['B–N', -8.30, -13.18, 2.6], CO: ['C–O', -10.66, -15.85, 2.8], LiF: ['Li–F', -5.39, -18.65, 1.2] };
    sim.group('Átomos y acoplamiento (eV)');
    sim.select('pre', { label: 'Par predefinido (energías de orbital p o s de valencia)', options: Object.keys(PRE).map((k) => [k, PRE[k][0]]), value: 'BN', onInput: (v) => { const p = PRE[v]; sim.ctl.eA.set(p[1], true); sim.ctl.eB.set(p[2], true); sim.ctl.t.set(p[3], true); } });
    sim.slider('eA', { label: 'ε<sub>A</sub> (átomo menos electronegativo)', min: -20, max: -3, value: -8.3, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('eB', { label: 'ε<sub>B</sub>', min: -20, max: -3, value: -13.18, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('t', { label: 'Acoplamiento <i>t</i>', min: 0.2, max: 5, value: 2.6, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.out('Eb', '<i>E</i><sub>enlazante</sub>', { hl: true });
    sim.out('Ea', '<i>E</i><sub>antienlazante</sub>');
    sim.out('w', 'Peso del orbital enlazante en A / B');
    sim.out('g', 'Ionicidad <i>g</i>', { hl: true });
    sim.out('q', 'Carga parcial (2 electrones en el enlazante)');
    sim.onDraw(() => {
      const { eA, eB, t } = sim.p;
      const r = MOL.twoLevel(eA, eB, t);
      CQ.draw.clear(cm);
      const lo = Math.min(eA, eB, r.Eb) - 1.5, hi = Math.max(eA, eB, r.Ea) + 1.5;
      const pl = new CQ.Plot(cm.ctx, { x: 0, y: 0, w: cm.w, h: cm.h, xmin: 0, xmax: 1, ymin: lo, ymax: hi, xticks: [], ylabel: 'energía (eV)', mb: 24, title: 'diagrama de niveles' });
      pl.frame();
      CQ.drawLevels(pl, [{ E: eA, x0: 0.05, x1: 0.25, color: '--atB', width: 2.4 }, { E: eB, x0: 0.75, x1: 0.95, color: '--atN', width: 2.4 }, { E: r.Eb, x0: 0.4, x1: 0.6, color: '--c1', width: 2.6 }, { E: r.Ea, x0: 0.4, x1: 0.6, color: '--c2', width: 2.6 }]);
      pl.label(0.15, eA + 0.4, 'A', { color: '--atB', align: 'center', weight: 700 });
      pl.label(0.85, eB + 0.4, 'B', { color: '--atN', align: 'center', weight: 700 });
      CQ.drawMOcolumn(pl, 0.5, 0.2, r.Eb, { occ: 2 });
      pl.clip((ctx) => { ctx.setLineDash([3, 3]); ctx.strokeStyle = CQ.col('--ink-3'); [[0.25, eA, 0.4, r.Eb], [0.25, eA, 0.4, r.Ea], [0.75, eB, 0.6, r.Eb], [0.75, eB, 0.6, r.Ea]].forEach(([x1, y1, x2, y2]) => { ctx.beginPath(); ctx.moveTo(pl.X(x1), pl.Y(y1)); ctx.lineTo(pl.X(x2), pl.Y(y2)); ctx.stroke(); }); });
      /* forma del orbital enlazante sobre el eje: c_A φ_A + c_B φ_B con orbitales de Slater */
      CQ.draw.clear(cs);
      const cA = Math.sqrt(r.wA), cB = Math.sqrt(r.wB);
      const phi = (x, x0) => Math.exp(-1.6 * Math.abs(x - x0));
      const bond = (x) => cA * phi(x, -1.3) + cB * phi(x, 1.3), anti = (x) => cB * phi(x, -1.3) - cA * phi(x, 1.3);
      const ps = new CQ.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: -4, xmax: 4, ymin: -0.15, ymax: 1.25, xlabel: 'eje del enlace', ylabel: '|ψ|²', yticks: [], title: 'densidad del orbital enlazante' });
      ps.frame();
      ps.fn((x) => bond(x) ** 2, { color: '--c1', width: 2.6, fill: '--c1', fillAlpha: 0.15, n: 500 });
      ps.fn((x) => anti(x) ** 2, { color: '--c2', width: 1.4, dash: [4, 3], n: 500 });
      const ctx = cs.ctx;
      CQ.draw.atom(ctx, ps.X(-1.3), ps.Y(-0.07), 9, 'B', { label: true });
      CQ.draw.atom(ctx, ps.X(1.3), ps.Y(-0.07), 9, 'N', { label: true });
      ps.legend([{ label: 'enlazante', color: '--c1' }, { label: 'antienlazante', color: '--c2', dash: [4, 3] }]);
      sim.set('Eb', CQ.fix(r.Eb, 3) + ' eV');
      sim.set('Ea', CQ.fix(r.Ea, 3) + ' eV');
      sim.set('w', `${CQ.fix(100 * r.wA, 1)} % / ${CQ.fix(100 * r.wB, 1)} %`);
      sim.set('g', CQ.fix(r.ionicity, 3));
      sim.set('q', `A: +${CQ.fix(1 - 2 * r.wA, 2)} e · B: −${CQ.fix(1 - 2 * r.wA, 2)} e`);
    });
  });

  /* ======================================================================
     10.4 Hibridación
     ====================================================================== */
  CQ.defineSim('hibridacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    const v3 = new CQ.View3D(sim, cv, { radius: 1.3, az: M.rad(30), el: M.rad(28) });
    sim.group('Híbridos');
    sim.seg('type', { label: 'Conjunto', options: [['sp', 'sp'], ['sp2', 'sp²'], ['sp3', 'sp³'], ['one', 'uno, λ libre']], value: 'sp2' });
    sim.slider('lam', { label: 'λ (proporción de p): h ∝ s + λ p', min: 0, max: 4, value: Math.SQRT2, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.check('pz', { label: 'Mostrar el orbital p<sub>z</sub> que queda libre (sp²)', value: true });
    sim.out('ang', 'Ángulo entre híbridos', { hl: true });
    sim.out('frac', 'Carácter s / p');
    sim.onChange = (id) => { if (id === 'type') { const L = { sp: 1, sp2: Math.SQRT2, sp3: Math.sqrt(3) }[sim.p.type]; if (L) sim.ctl.lam.set(L, true); } };
    const dirs = { sp: [[1, 0, 0], [-1, 0, 0]], sp2: [[1, 0, 0], [-0.5, Math.sqrt(3) / 2, 0], [-0.5, -Math.sqrt(3) / 2, 0]], sp3: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((d) => d.map((v) => v / Math.sqrt(3))), one: [[1, 0, 0]] };
    const COLS = ['--c2', '--c1', '--c3', '--c4'];
    sim.onDraw(() => {
      const lam = sim.p.lam;
      const ds = dirs[sim.p.type];
      v3.begin();
      v3.axes({ len: 1.1, neg: 0.8 });
      const h = (g) => (1 + lam * Math.sqrt(3) * Math.cos(g)) / Math.sqrt(1 + lam * lam);
      let mx = 0; for (let q = 0; q <= 100; q++) mx = Math.max(mx, h((Math.PI * q) / 100) ** 2);
      ds.forEach((d, i) => {
        /* base ortonormal con e3 = d */
        const e3 = d, tmp = Math.abs(d[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
        const e1 = V.unit(V.cross(tmp, e3)), e2 = V.cross(e3, e1);
        v3.mesh((g, ph) => { const r = (1.0 * h(g) ** 2) / mx; const loc = [Math.sin(g) * Math.cos(ph), Math.sin(g) * Math.sin(ph), Math.cos(g)]; return V.comb(r * loc[0], e1, r * loc[1], e2, r * loc[2], e3); }, 0.0001, Math.PI - 0.0001, 26, 0, 2 * Math.PI, 30, { fillFn: (g) => (h(g) >= 0 ? COLS[i % 4] : '--ink-3'), alpha: 0.78 });
      });
      if (sim.p.pz && sim.p.type === 'sp2') {
        v3.mesh((g, ph) => { const r = 0.8 * Math.cos(g) ** 2; return [r * Math.sin(g) * Math.cos(ph), r * Math.sin(g) * Math.sin(ph), r * Math.cos(g)]; }, 0.0001, Math.PI - 0.0001, 24, 0, 2 * Math.PI, 28, { fillFn: (g) => (Math.cos(g) >= 0 ? '--c5' : '--ink-3'), alpha: 0.5 });
      }
      v3.render();
      const cosT = lam > 0 ? -1 / (lam * lam) : NaN;
      sim.set('ang', sim.p.type === 'one' ? (Math.abs(cosT) <= 1 ? CQ.fix(M.deg(Math.acos(cosT)), 2) + '° (si fueran equivalentes)' : '—') : CQ.fix(M.deg(Math.acos(Math.max(-1, Math.min(1, cosT)))), 2) + '°');
      sim.set('frac', `${CQ.fix(100 / (1 + lam * lam), 1)} % s / ${CQ.fix((100 * lam * lam) / (1 + lam * lam), 1)} % p`);
    });
  });
})();
