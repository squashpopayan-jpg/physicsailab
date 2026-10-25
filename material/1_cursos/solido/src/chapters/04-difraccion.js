/* Capítulo 4 — Difracción de rayos X */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd;
  const rad = EM.M.rad, PI = Math.PI;

  /* 4.1 Reflexión de Bragg */
  EM.defineSim('bragg', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('th', { label: 'Ángulo θ', min: 2, max: 88, step: 0.1, value: 20, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('lam', { label: 'Longitud de onda λ', min: 0.5, max: 3, step: 0.01, value: 1.54, unit: 'Å', fmt: (v) => v.toFixed(2) });
    sim.slider('d', { label: 'Distancia entre planos d', min: 1, max: 5, step: 0.01, value: 2.09, unit: 'Å', fmt: (v) => v.toFixed(2) });
    sim.slider('N', { label: 'Número de planos N', min: 2, max: 40, step: 1, value: 8, fmt: (v) => v.toFixed(0) });
    sim.out('dp', 'Diferencia de camino 2d sen θ', { hl: true });
    sim.out('br', 'Ángulos de Bragg');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = rad(p.th);
      EM.draw.clear(cv);
      /* esquema */
      const wl = W * 0.48;
      const v = D.view({ x: 6, y: 6, w: wl - 12, h: H - 12 }, -3, 3, -3.6, 1.6);
      const np = 4;
      for (let j = 0; j < np; j++) {
        const y = -j * 0.9;
        ctx.strokeStyle = EM.alpha('--ink-3', 0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(v.X(-3), v.Y(y)); ctx.lineTo(v.X(3), v.Y(y)); ctx.stroke();
        for (let i = -6; i <= 6; i++) D.ball(ctx, v.X(i * 0.5), v.Y(y), 4.2, '--c1');
      }
      for (let j = 0; j < 2; j++) {
        const y = -j * 0.9, x0 = 0;
        const L = 2.6;
        const a = [x0 - L * Math.cos(th), y + L * Math.sin(th)], b = [x0 + L * Math.cos(th), y + L * Math.sin(th)];
        D.arrow(ctx, v, a, [x0, y], { color: j ? '--c2' : '--ray', width: 2 });
        D.arrow(ctx, v, [x0, y], b, { color: j ? '--c2' : '--ray', width: 2 });
      }
      /* diferencia de camino */
      const y1 = -0.9;
      ctx.save(); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 3; ctx.globalAlpha = 0.8;
      const s = 0.9 * Math.sin(th);
      ctx.beginPath(); ctx.moveTo(v.X(-s * Math.cos(th)), v.Y(y1 + s * Math.sin(th))); ctx.lineTo(v.X(0), v.Y(y1)); ctx.lineTo(v.X(s * Math.cos(th)), v.Y(y1 + s * Math.sin(th))); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'θ', v.X(-1.1), v.Y(0.18), { size: 14, italic: true, family: EM.FONT_MATH, color: '--ink-2' });
      EM.text(ctx, 'd', v.X(2.75), v.Y(-0.45), { size: 14, italic: true, family: EM.FONT_MATH, color: '--ink-2' });
      EM.text(ctx, 'camino extra 2d sen θ', v.X(0.3), v.Y(-1.25), { size: 11.5, color: '--accent', halo: true });
      /* intensidad de N planos */
      const N = Math.round(p.N);
      const I = (t) => { const ph = (2 * PI * 2 * p.d * Math.sin(rad(t))) / p.lam; const s2 = Math.sin(N * ph / 2), s1 = Math.sin(ph / 2); return Math.abs(s1) < 1e-9 ? 1 : (s2 * s2) / (N * N * s1 * s1); };
      const pl = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: 90, ymin: 0, ymax: 1.08, xlabel: 'θ (°)', ylabel: 'I/I_máx' });
      pl.frame();
      pl.fn(I, { color: '--c1', width: 1.8, n: 1800, fill: '--c1', fillAlpha: 0.12 });
      pl.vline(p.th, { color: '--accent', dash: [], width: 1.5 });
      const angs = [];
      for (let n = 1; n * p.lam <= 2 * p.d; n++) angs.push('n = ' + n + ': ' + EM.fix((Math.asin((n * p.lam) / (2 * p.d)) * 180) / PI, 2) + '°');
      sim.set('dp', EM.fix(2 * p.d * Math.sin(th), 3) + ' Å = ' + EM.fix((2 * p.d * Math.sin(th)) / p.lam, 3) + ' λ');
      sim.set('br', angs.length ? angs.join(' · ') : 'ninguno: λ > 2d');
    });
  });

  /* 4.2 Esfera de Ewald */
  EM.defineSim('ewald', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.slider('rot', { label: 'Giro del cristal', min: 0, max: 90, step: 0.1, value: 17, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('lam', { label: 'λ/a', min: 0.2, max: 2.4, step: 0.005, value: 0.4, fmt: (v) => v.toFixed(3) });
    sim.slider('tol', { label: 'Tolerancia (mosaicidad)', min: 0.005, max: 0.05, step: 0.001, value: 0.015, fmt: (v) => v.toFixed(3) });
    sim.out('n', 'Reflexiones activas', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const k = 1 / p.lam; /* unidades de 1/a (sin 2π: red recíproca cristalográfica) */
      const v = D.view({ x: 8, y: 8, w: W - 16, h: H - 16 }, -2 * k - 0.6, 0.9 + 0.2, -k - 0.6, k + 0.6);
      const c = Math.cos(rad(p.rot)), s = Math.sin(rad(p.rot));
      /* esfera centrada en (−k, 0); el origen de la red recíproca en (0, 0) */
      ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(v.X(-k), v.Y(0), k * v.sx, 0, 7); ctx.stroke();
      D.arrow(ctx, v, [-k, 0], [0, 0], { color: '--ray', width: 2.2 });
      EM.text(ctx, 'k', v.X(-k / 2), v.Y(0) - 8, { size: 14, italic: true, weight: 700, color: '--ray', family: EM.FONT_MATH, halo: true });
      const act = [];
      const M = Math.ceil(2 * k + 3);
      for (let h = -M; h <= M; h++) for (let l = -M; l <= M; l++) {
        const x = h * c - l * s, y = h * s + l * c;
        if (x < v.x0 || x > v.x1 || y < v.y0 || y > v.y1) continue;
        const dist = Math.abs(Math.hypot(x + k, y) - k);
        const on = (h || l) && dist < p.tol;
        ctx.fillStyle = on ? EM.col('--accent') : EM.alpha('--c1', 0.7);
        ctx.beginPath(); ctx.arc(v.X(x), v.Y(y), on ? 6 : 3.2, 0, 7); ctx.fill();
        if (on) {
          act.push(`${h}0${l}`.replace(/-(\d)/g, '$1̄'));
          D.arrow(ctx, v, [-k, 0], [x, y], { color: '--accent', width: 1.6 });
          EM.text(ctx, `(${h} 0 ${l})`.replace(/-(\d)/g, '−$1'), v.X(x) + 8, v.Y(y) - 6, { size: 11, color: '--accent', halo: true });
        }
      }
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(v.X(0), v.Y(0), 4, 0, 7); ctx.fill();
      EM.text(ctx, 'red recíproca (h0l) de un cristal cúbico, unidades de 1/a', 12, H - 12, { size: 11.5, color: '--ink-3' });
      sim.set('n', act.length ? act.length + ': ' + act.slice(0, 6).join(', ') : 'ninguna');
    });
  });

  /* 4.3 Factor de estructura */
  const STF = { sc: ['sc', [1]], bcc: ['bcc', [1]], fcc: ['fcc', [1]], diamond: ['diamond', [1]], NaCl: ['NaCl', null], CsCl: ['CsCl', null], zincblende: ['zincblende', null] };
  EM.defineSim('factor-estructura', function (sim) {
    const cv = sim.canvas({ aspect: 1.3 });
    sim.select('s', { label: 'Estructura', options: [['sc', 'Cúbica simple'], ['bcc', 'bcc'], ['fcc', 'fcc'], ['diamond', 'Diamante'], ['NaCl', 'NaCl'], ['CsCl', 'CsCl'], ['zincblende', 'Blenda de zinc']], value: 'fcc' });
    sim.slider('l', { label: 'Índice l del plano mostrado', min: 0, max: 4, step: 1, value: 0, fmt: (v) => v.toFixed(0) });
    sim.slider('fb', { label: 'f_B/f_A (bases de dos especies)', min: 0, max: 1.5, step: 0.01, value: 0.6, fmt: (v) => v.toFixed(2) });
    sim.out('r', 'Regla', { hl: true });
    sim.out('first', 'Primeras reflexiones presentes');
    const RULE = { sc: 'todas presentes', bcc: 'h + k + l par', fcc: 'h, k, l de igual paridad', diamond: 'fcc y h + k + l ≠ 4m + 2', NaCl: 'fcc; impares ∝ f_A − f_B', CsCl: 'todas; impares ∝ f_A − f_B', zincblende: 'fcc; |F|² = 16(f_A² + f_B²) si h+k+l impar' };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, l = Math.round(p.l);
      EM.draw.clear(cv);
      const st = SS.structure(STF[p.s][0], 1), fs = [1, p.fb];
      sim.ctl.fb.show(st.atoms.some((a) => a.s === 1));
      const N = 5, size = Math.min(W, H) - 50, r = { x: (W - size) / 2 + 10, y: 18, w: size, h: size };
      const cell = size / (2 * N + 1);
      let fmax = 0;
      const vals = [];
      for (let h = -N; h <= N; h++) for (let k = -N; k <= N; k++) { const F = SS.geomFactor(st, h, k, l, fs).abs; vals.push([h, k, F]); fmax = Math.max(fmax, F); }
      for (const [h, k, F] of vals) {
        const x = r.x + (h + N + 0.5) * cell, y = r.y + (N - k + 0.5) * cell;
        if (!h && !k && !l) { ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); continue; }
        if (F < 1e-9) { ctx.strokeStyle = EM.alpha('--ink-3', 0.6); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, cell * 0.18, 0, 7); ctx.stroke(); }
        else { ctx.fillStyle = EM.col('--c1'); ctx.globalAlpha = 0.35 + 0.65 * (F / fmax); ctx.beginPath(); ctx.arc(x, y, cell * 0.42 * Math.sqrt(F / fmax), 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      }
      EM.text(ctx, 'h →', r.x + r.w - 26, r.y + r.h + 16, { size: 12, color: '--ink-2' });
      EM.text(ctx, 'k ↑', r.x - 30, r.y + 12, { size: 12, color: '--ink-2' });
      EM.text(ctx, 'plano l = ' + l + ' · área ∝ |F|', r.x, r.y + r.h + 16, { size: 12, color: '--ink-2' });
      const list = [];
      for (let s2 = 1; s2 <= 24 && list.length < 7; s2++) {
        let found = null;
        for (let h = 0; h <= 4 && !found; h++) for (let k = 0; k <= h && !found; k++) for (let ll = 0; ll <= k && !found; ll++) if (h * h + k * k + ll * ll === s2 && SS.geomFactor(st, h, k, ll, fs).abs > 1e-9) found = '' + h + k + ll;
        if (found) list.push(found);
      }
      sim.set('r', RULE[p.s]);
      sim.set('first', list.join(', '));
    });
  });

  /* 4.4 Factor atómico */
  EM.defineSim('factor-atomico', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    const ELS = ['H', 'C', 'O', 'Na', 'Al', 'Si', 'Cl', 'Fe', 'Cu', 'Ag', 'W', 'Au', 'Pb'];
    sim.select('a', { label: 'Elemento 1', options: ELS.map((e) => [e, e]), value: 'Cu' });
    sim.select('b', { label: 'Elemento 2', options: ELS.map((e) => [e, e]), value: 'Al' });
    sim.select('c', { label: 'Elemento 3', options: ELS.map((e) => [e, e]), value: 'O' });
    sim.slider('B', { label: 'Debye–Waller B', min: 0, max: 3, step: 0.01, value: 0.55, unit: 'Å²', fmt: (v) => v.toFixed(2) });
    sim.out('f', 'f del elemento 1 en Cu(111)', { hl: true });
    sim.out('dw', 'Factor de temperatura en Cu(111) y Cu(331)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const zmax = Math.max(...[p.a, p.b, p.c].map((e) => EM.XRDF[e].Z));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 1.2, ymin: 0, ymax: zmax * 1.08, xlabel: 'sen θ/λ (Å⁻¹)', ylabel: 'f (electrones)' });
      pl.frame();
      const cols = ['--c1', '--c2', '--c3'];
      [p.a, p.b, p.c].forEach((e, i) => {
        pl.fn((s) => SS.fAtom(e, s), { color: cols[i], width: 2.3 });
        if (p.B > 0) pl.fn((s) => SS.fAtom(e, s) * Math.exp(-p.B * s * s), { color: cols[i], width: 1.3, dash: [5, 4] });
      });
      for (const hkl of [[1, 1, 1], [2, 0, 0], [2, 2, 0], [3, 1, 1], [2, 2, 2], [4, 0, 0], [3, 3, 1]]) {
        const s = Math.hypot(...hkl) / (2 * 3.615);
        pl.vline(s, { color: '--grid-2', dash: [3, 3], width: 1 });
        pl.label(s, zmax * 1.03, hkl.join(''), { size: 10, align: 'center', color: '--ink-3' });
      }
      pl.legend([p.a, p.b, p.c].map((e, i) => ({ label: e + ' (Z = ' + EM.XRDF[e].Z + ')', color: cols[i] })).concat([{ label: 'con Debye–Waller', color: '--ink-3', dash: [5, 4] }]), 'tr');
      const s111 = Math.sqrt(3) / (2 * 3.615), s331 = Math.sqrt(19) / (2 * 3.615);
      sim.set('f', EM.fix(SS.fAtom(p.a, s111), 2) + ' de ' + EM.XRDF[p.a].Z + ' (s = ' + EM.fix(s111, 3) + ' Å⁻¹)');
      sim.set('dw', EM.fix(Math.exp(-2 * p.B * s111 * s111), 3) + ' y ' + EM.fix(Math.exp(-2 * p.B * s331 * s331), 3) + ' (en intensidad)');
    });
  });

  /* 4.5 Patrón de polvo */
  const MATS = {
    Cu: ['fcc', 3.615, ['Cu']], Al: ['fcc', 4.049, ['Al']], Au: ['fcc', 4.078, ['Au']], Fe: ['bcc', 2.867, ['Fe']], W: ['bcc', 3.165, ['W']],
    Si: ['diamond', 5.431, ['Si']], Ge: ['diamond', 5.658, ['Ge']], NaCl: ['NaCl', 5.640, ['Na', 'Cl']], KCl: ['NaCl', 6.293, ['K', 'Cl']], MgO: ['NaCl', 4.212, ['Mg', 'O']],
    CsCl: ['CsCl', 4.123, ['Cs', 'Cl']], GaAs: ['zincblende', 5.653, ['Ga', 'As']], CaF2: ['fluorite', 5.463, ['Ca', 'F']], SrTiO3: ['perovskite', 3.905, ['Sr', 'Ti', 'O']],
    Mg: ['hcp', 3.209, ['Mg'], 5.211], Zn: ['hcp', 2.665, ['Zn'], 4.947], ZnO: ['wurtzite', 3.250, ['Zn', 'O'], 5.207]
  };
  EM.defineSim('polvo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Material', options: Object.keys(MATS).map((k) => [k, k.replace(/(\d)/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[+d])]), value: 'Cu' });
    sim.select('m2', { label: 'Comparar con', options: [['', '(ninguno)']].concat(Object.keys(MATS).map((k) => [k, k.replace(/(\d)/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[+d])])), value: '' });
    sim.select('src', { label: 'Radiación', options: [['1.54184', 'Cu Kα (1.5418 Å)'], ['0.71073', 'Mo Kα (0.7107 Å)'], ['1.79026', 'Co Kα (1.7903 Å)'], ['2.29100', 'Cr Kα (2.2910 Å)']], value: '1.54184' });
    sim.slider('B', { label: 'Debye–Waller B', min: 0, max: 2, step: 0.01, value: 0.5, unit: 'Å²', fmt: (v) => v.toFixed(2) });
    sim.slider('L', { label: 'Tamaño de cristalito', min: 3, max: 200, step: 1, value: 40, log: true, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.check('lab', { label: 'Índices de los picos', value: true });
    sim.out('a', 'Material', { hl: true });
    sim.out('p1', 'Primer pico');
    sim.out('w', 'Ancho del primer pico (Scherrer)');
    let cacheKey = '', pats = [];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, lam = +p.src;
      EM.draw.clear(cv);
      const key = [p.m, p.m2, p.src, p.B].join('|');
      if (key !== cacheKey) {
        cacheKey = key;
        pats = [p.m, p.m2].filter(Boolean).map((m) => {
          const d = MATS[m], st = SS.structure(d[0], d[1], d[3], d[0] === 'wurtzite' ? 0.382 : undefined);
          return SS.powder(st, d[2], lam, 140, d[2].map(() => p.B));
        });
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 10, xmax: 140, ymin: 0, ymax: 118, xlabel: '2θ (°)', ylabel: 'intensidad relativa' });
      pl.frame();
      const cols = ['--c1', '--c2'];
      pats.forEach((pat, j) => {
        const n = 2600, xs = new Float64Array(n), ys = new Float64Array(n);
        for (let i = 0; i < n; i++) { xs[i] = 10 + (130 * i) / (n - 1); ys[i] = 0; }
        for (const pk of pat) {
          const beta = ((0.9 * lam) / (p.L * 10 * Math.cos(rad(pk.tt / 2)))) * (180 / PI) + 0.04;
          const g = beta / 2;
          for (let i = 0; i < n; i++) { const dx = xs[i] - pk.tt; if (Math.abs(dx) < 12 * g) ys[i] += pk.I / (1 + (dx * dx) / (g * g)); }
        }
        pl.xy(Array.from(xs), Array.from(ys), { color: cols[j], width: 1.6, fill: cols[j], fillAlpha: 0.12 });
        if (p.lab && j === 0) for (const pk of pat.filter((q) => q.I > 4).slice(0, 14)) pl.label(pk.tt, Math.min(110, pk.I) + 4, pk.hkl.join(''), { size: 10.5, align: 'center', color: '--ink-2' });
      });
      const d0 = MATS[p.m];
      sim.set('a', d0[0] === 'hcp' || d0[0] === 'wurtzite' ? `${SS.STRUCT_NAMES[d0[0]]}, a = ${d0[1]} Å, c = ${d0[3]} Å` : `${SS.STRUCT_NAMES[d0[0]]}, a = ${d0[1]} Å`);
      const f = pats[0][0];
      sim.set('p1', f ? `${f.hkl.join('')} en 2θ = ${EM.fix(f.tt, 2)}° (d = ${EM.fix(f.d, 4)} Å)` : '—');
      sim.set('w', f ? EM.fix(((0.9 * lam) / (p.L * 10 * Math.cos(rad(f.tt / 2)))) * (180 / PI), 3) + '°' : '—');
    });
  });

  /* 4.6 Longitudes de onda */
  EM.defineSim('debroglie', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('E', { label: 'Energía', min: 0.001, max: 100000, log: true, value: 100, unit: 'eV', fmt: (v) => EM.sci(v, 3) });
    sim.out('x', 'Fotón (rayos X)', { hl: true });
    sim.out('e', 'Electrón');
    sim.out('n', 'Neutrón');
    const lph = (E) => (SS.h * SS.c) / (E * SS.e) * 1e10;
    const lm = (E, m) => SS.h / Math.sqrt(2 * m * E * SS.e * (1 + (E * SS.e) / (2 * m * SS.c * SS.c))) * 1e10;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1e-3, xmax: 1e5, xlog: true, ymin: 1e-3, ymax: 1e4, ylog: true, xlabel: 'energía (eV)', ylabel: 'λ (Å)' });
      pl.frame();
      ctx.save(); ctx.fillStyle = EM.alpha('--accent', 0.12); ctx.fillRect(pl.ix, pl.Y(5), pl.iw, pl.Y(1) - pl.Y(5)); ctx.restore();
      pl.label(2e-3, 2.2, 'distancias interatómicas', { size: 11, color: '--accent' });
      pl.fn(lph, { color: '--c5', width: 2.2 });
      pl.fn((E) => lm(E, SS.me), { color: '--c1', width: 2.2 });
      pl.fn((E) => lm(E, SS.mn), { color: '--c2', width: 2.2 });
      pl.vline(p.E, { color: '--ink-3' });
      pl.legend([{ label: 'fotón', color: '--c5' }, { label: 'electrón', color: '--c1' }, { label: 'neutrón', color: '--c2' }], 'tr');
      sim.set('x', EM.sci(lph(p.E), 3) + ' Å');
      sim.set('e', EM.sci(lm(p.E, SS.me), 3) + ' Å');
      sim.set('n', EM.sci(lm(p.E, SS.mn), 3) + ' Å');
    });
  });
})();
