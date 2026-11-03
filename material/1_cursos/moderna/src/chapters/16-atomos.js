/* Capítulo 16 — Átomos con varios electrones */
(function () {
  'use strict';
  const EM = window.EM, A = EM.fm.at, D = EM.fm.ptdata, HA = A.HA_EV, LET = 'spdfgh';
  const TERMS = { 1: '²S½', 2: '¹S₀', 3: '²S½', 4: '¹S₀', 5: '²P½', 6: '³P₀', 7: '⁴S3/2', 8: '³P₂', 9: '²P3/2', 10: '¹S₀' };
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
  const termPretty = (S, L, J) => `${SUP[2 * S + 1]}${'SPDFGHIK'[L]}${J % 1 ? (2 * J) + '/2' : String(J).split('').map((c) => SUB[c]).join('')}`;

  /* 16.1 Helio: perturbación, variacional y Hartree–Fock */
  const hfCache = {};
  EM.defineSim('helio', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('Z', { label: 'Carga nuclear Z (He, Li⁺, Be²⁺, B³⁺)', min: 2, max: 5, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('zeta', { label: 'Carga efectiva ζ del orbital de prueba exp(−ζr)', min: 0.8, max: 5.5, step: 0.01, value: 1.6875, fmt: (v) => EM.fix(v, 3) });
    sim.out('Ez', 'Energía de la función de prueba ⟨H⟩(ζ) = ζ² − 2Zζ + 5ζ/8 (eV) · error respecto de la exacta', { hl: true });
    sim.out('m', 'Perturbación de 1.er orden (ζ = Z) · variacional óptimo (ζ = Z − 5/16)');
    sim.out('hf', 'Hartree–Fock numérico (autoconsistente) · exacta no relativista (eV)');
    sim.out('c', 'Energía de correlación (exacta − HF)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, Z = Math.round(p.Z), zt = p.zeta;
      EM.draw.clear(cv);
      if (!hfCache[Z]) hfCache[Z] = A.heHF(Z, { h: 0.04 });
      const hf = hfCache[Z], Eex = A.heExact[Z] * HA, E1 = A.heFirstOrder(Z) * HA, Ev = A.heVarOpt(Z), Ehf = hf.E * HA, Ez = A.heVar(Z, zt) * HA;
      const zmax = Z + 1.6, ylo = Eex * 1.06, yhi = A.heVar(Z, 0.8) * HA * 0.55 + Eex * 0.2;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.52, h: H, xmin: 0.8, xmax: zmax, ymin: ylo, ymax: Math.min(yhi, E1 * 0.5), xlabel: 'ζ', ylabel: 'energía (eV)', ml: 60, mr: 8, title: 'Principio variacional' });
      pl.frame();
      pl.fn((z) => A.heVar(Z, z) * HA, { color: '--accent', width: 2.8, n: 200 });
      pl.hline(Eex, { color: '--c3', dash: [6, 3], label: 'exacta' }); pl.hline(Ehf, { color: '--c2', dash: [3, 3], label: 'Hartree–Fock' });
      pl.dot(Z, E1, { color: '--c4', r: 5 }); pl.dot(Ev.zeta, Ev.E * HA, { color: '--c1', r: 5 }); pl.dot(zt, Ez, { color: '--ink', r: 4 });
      pl.label(Z, E1, '1.er orden', { align: 'left', color: '--c4' });
      const R = 4 / (Z - 0.5), n = 300, rs = [], uh = [], ut = [], uz = [];
      for (let i = 1; i <= n; i++) rs.push(R * i / n);
      const interp = (r) => { const rr = hf.r, uu = hf.u; let lo = 0, hi = rr.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (rr[m] < r) lo = m; else hi = m; } const f = (r - rr[lo]) / (rr[hi] - rr[lo]); return uu[lo] * (1 - f) + uu[hi] * f; };
      for (const r of rs) { const u = interp(r); uh.push(u * u); ut.push(4 * zt ** 3 * r * r * Math.exp(-2 * zt * r)); uz.push(4 * Z ** 3 * r * r * Math.exp(-2 * Z * r)); }
      const ymx = Math.max(...uh, ...ut, ...uz) * 1.12;
      const pr = new EM.Plot(ctx, { x: W * 0.54, y: 0, w: W * 0.46, h: H, xmin: 0, xmax: R, ymin: 0, ymax: ymx, xlabel: 'r (unidades de a₀)', ylabel: 'densidad radial de un electrón', ml: 56, mr: 8, title: 'Un orbital del par' });
      pr.frame(); pr.xy(rs, uh, { color: '--c2', width: 2.8, fill: '--c2', fillAlpha: 0.12 }); pr.xy(rs, ut, { color: '--accent', width: 2.2 }); pr.xy(rs, uz, { color: '--ink-3', width: 1.6, dash: [4, 3] });
      pr.legend([{ label: 'Hartree–Fock', color: '--c2' }, { label: `prueba ζ = ${EM.fix(zt, 2)}`, color: '--accent' }, { label: `hidrogenoide ζ = Z`, color: '--ink-3' }], 'tr');
      const pc = (x) => EM.fix(100 * (x - Eex) / Math.abs(Eex), 2);
      sim.set('Ez', `${EM.fix(Ez, 3)} eV · +${pc(Ez)} %`);
      sim.set('m', `${EM.fix(E1, 3)} eV (${pc(E1)} %) · ${EM.fix(Ev.E * HA, 3)} eV (${pc(Ev.E * HA)} %), ζ = ${EM.fix(Ev.zeta, 4)}`);
      sim.set('hf', `${EM.fix(Ehf, 3)} eV (${pc(Ehf)} %) · ${EM.fix(Eex, 3)} eV`);
      sim.set('c', `${EM.fix((Eex - Ehf), 3)} eV (${EM.fix(A.heExact[Z] - hf.E, 5)} Ha)`);
    });
  });

  /* 16.2 Tabla periódica de los 54 primeros elementos */
  const POS = (Z) => {
    if (Z === 1) return [1, 1]; if (Z === 2) return [1, 18];
    if (Z <= 4) return [2, Z - 2]; if (Z <= 10) return [2, Z + 8]; if (Z <= 12) return [3, Z - 10]; if (Z <= 18) return [3, Z];
    if (Z <= 36) return [4, Z - 18]; return [5, Z - 36];
  };
  const PROPS = {
    ie: ['Energía de primera ionización (eV)', (q) => q.ie, 'NIST'],
    r: ['Radio atómico empírico de Slater (Å)', (q) => q.r, 'Slater'],
    X: ['Electronegatividad de Pauling', (q) => q.X, 'Pauling'],
    zeff: ['Carga efectiva de Slater del electrón externo', (q) => { const occ = A.parseConfig(q.cfg); const k = Object.keys(occ).filter((s) => 'sp'.includes(s[1])).sort((a, b) => +b[0] - +a[0] || LET.indexOf(b[1]) - LET.indexOf(a[1]))[0]; return A.slaterZeff(q.Z, occ, k); }, 'Slater'],
  };
  EM.defineSim('periodica', function (sim) {
    const cv = sim.canvas({ aspect: 2.15 });
    let sel = 26;
    sim.select('prop', { label: 'Propiedad que colorea la tabla', options: Object.entries(PROPS).map(([k, v]) => [k, v[0]]), value: 'ie' });
    sim.slider('Z', { label: 'Elemento seleccionado Z', min: 1, max: 54, step: 1, value: 26, fmt: (v) => v.toFixed(0) });
    sim.out('el', 'Elemento', { hl: true });
    sim.out('cfg', 'Configuración medida · regla de Madelung');
    sim.out('t', 'Término fundamental (Hund) · valor de la propiedad');
    const cell = () => { const cw = cv.w / 19.2, chh = Math.min(cv.h * 0.88 / 5.4, cw * 1.05); return { cw, chh, x0: cw * 0.7, y0: cv.h * 0.07 }; };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx; sel = Math.round(p.Z);
      EM.draw.clear(cv);
      const [title, fn] = PROPS[p.prop], vals = D.map(fn).filter((v) => v !== null && v !== undefined), lo = Math.min(...vals), hi = Math.max(...vals), { cw, chh, x0, y0 } = cell();
      for (const q of D) {
        const [row, col] = POS(q.Z), cx = x0 + (col - 1) * cw, cy = y0 + (row - 1) * chh, v = fn(q), exc = !A.occEqual(A.parseConfig(q.cfg), A.occOf(A.madelung(q.Z)));
        let rgb = null; if (v !== null && v !== undefined) rgb = EM.cmap.viridis((v - lo) / (hi - lo));
        ctx.save(); ctx.fillStyle = rgb ? `rgb(${rgb.map(Math.round).join(',')})` : EM.alpha('--ink', 0.12); ctx.fillRect(cx + 1, cy + 1, cw - 2, chh - 2);
        if (exc) { ctx.strokeStyle = '#e8590c'; ctx.lineWidth = 2.4; ctx.strokeRect(cx + 2, cy + 2, cw - 4, chh - 4); }
        if (q.Z === sel) { ctx.strokeStyle = EM.alpha('--ink', 1); ctx.lineWidth = 2.6; ctx.strokeRect(cx, cy, cw, chh); }
        ctx.restore();
        const lum = rgb ? (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) : 200, tc = lum > 140 ? '#111' : '#fff';
        EM.text(ctx, q.s, cx + cw / 2, cy + chh * 0.55, { size: Math.min(15, cw * 0.42), align: 'center', color: tc, weight: 600 });
        EM.text(ctx, String(q.Z), cx + 3, cy + 10, { size: Math.min(9, cw * 0.24), color: tc });
      }
      EM.text(ctx, title, cv.w / 2, 12, { size: 12.5, align: 'center', color: '--ink-2' });
      // barra de color
      const bx = x0 + 2 * cw, by = y0 + 5 * chh + 10, bw = 10 * cw, bh = 9;
      for (let i = 0; i < 60; i++) { const c = EM.cmap.viridis(i / 59); ctx.fillStyle = `rgb(${c.map(Math.round).join(',')})`; ctx.fillRect(bx + (i * bw) / 60, by, bw / 60 + 1, bh); }
      EM.text(ctx, EM.fix(lo, 2), bx, by + 22, { size: 11, color: '--ink-3' }); EM.text(ctx, EM.fix(hi, 2), bx + bw, by + 22, { size: 11, color: '--ink-3', align: 'right' });
      EM.text(ctx, 'contorno naranja: excepción a Madelung', bx, by + 40, { size: 11, color: '#e8590c' });
      const q = D[sel - 1], occ = A.parseConfig(q.cfg), gt = A.groundTerm(occ), v = fn(q);
      sim.set('el', `${q.s} (Z = ${q.Z}) · período ${POS(q.Z)[0]}, grupo ${POS(q.Z)[1]}`);
      sim.set('cfg', `${A.configStr(Object.entries(occ).map(([k, n]) => [+k[0], LET.indexOf(k[1]), n]))} · ${A.configStr(A.madelung(q.Z))}${A.occEqual(occ, A.occOf(A.madelung(q.Z))) ? '' : ' (excepción)'}`);
      sim.set('t', `${termPretty(gt.S, gt.L, gt.J)} · ${v === null || v === undefined ? 'sin dato' : EM.fix(v, 3)}`);
    });
  });

  /* 16.3 Reglas de Hund: llenado de subcapas y término fundamental */
  EM.defineSim('hund', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    sim.slider('Z', { label: 'Elemento Z', min: 1, max: 48, step: 1, value: 26, fmt: (v) => v.toFixed(0) });
    sim.out('el', 'Elemento y configuración medida', { hl: true });
    sim.out('SLJ', 'S total · L total · J (reglas de Hund)');
    sim.out('t', 'Término fundamental · valor de NIST');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, Z = Math.round(p.Z), q = D[Z - 1], occ = A.parseConfig(q.cfg);
      EM.draw.clear(cv);
      const subs = Object.entries(occ).map(([k, n]) => [+k[0], LET.indexOf(k[1]), n]).sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[0] - b[0]);
      const bs = Math.min(22, W / 30), gap = 16; let x = 14, y = 40; const rowH = bs * 2.6;
      for (const [n, l, k] of subs) {
        const w = (2 * l + 1) * bs; if (x + w > W - 10) { x = 14; y += rowH; }
        const m = 2 * l + 1;
        for (let i = 0; i < m; i++) {
          const up = k > i, dn = k > m + i;
          ctx.save(); ctx.strokeStyle = EM.alpha('--ink', 0.7); ctx.lineWidth = 1.2; ctx.strokeRect(x + i * bs, y, bs, bs * 1.3); ctx.restore();
          if (up) EM.draw.arrow(ctx, x + i * bs + bs * 0.3, y + bs * 1.15, x + i * bs + bs * 0.3, y + bs * 0.15, { color: '--c1', width: 1.8, head: 4 });
          if (dn) EM.draw.arrow(ctx, x + i * bs + bs * 0.7, y + bs * 0.15, x + i * bs + bs * 0.7, y + bs * 1.15, { color: '--c3', width: 1.8, head: 4 });
        }
        EM.text(ctx, `${n}${LET[l]}${k}`, x + w / 2, y + bs * 1.3 + 13, { size: 11.5, align: 'center', color: '--ink-2' });
        x += w + gap;
      }
      EM.text(ctx, 'Cada recuadro es un orbital (m_l); ↑ espín +½, ↓ espín −½. Primero se llenan los m_l con espines paralelos.', W / 2, H - 8, { size: 11.5, align: 'center', color: '--ink-3' });
      const gt = A.groundTerm(occ), mad = A.occEqual(occ, A.occOf(A.madelung(Z)));
      const nist = { 1: '²S½', 2: '¹S₀', 3: '²S½', 4: '¹S₀', 5: '²P½', 6: '³P₀', 7: '⁴S3/2', 8: '³P₂', 9: '²P3/2', 10: '¹S₀' };
      sim.set('el', `${q.s} (Z = ${Z}) · ${A.configStr(subs)}${mad ? '' : ' — excepción a Madelung'}`);
      sim.set('SLJ', `${gt.S} · ${gt.L} · ${gt.J}`);
      sim.set('t', `${termPretty(gt.S, gt.L, gt.J)} · ${nist[Z] || '(igual que NIST)'}`);
    });
  });
})();
