/* Capítulo 22 — El núcleo: tamaño, masa, ligadura y modelos */
(function () {
  'use strict';
  const EM = window.EM, N = EM.fm.nuc;
  const rows = N.nuclides(true), coef = N.fit(rows, 20);
  const NAME = { '1,2': '²H', '2,4': '⁴He', '6,12': '¹²C', '8,16': '¹⁶O', '26,56': '⁵⁶Fe', '28,62': '⁶²Ni', '82,208': '²⁰⁸Pb', '92,238': '²³⁸U' };

  /* 22.1 Energía de ligadura por nucleón */
  EM.defineSim('ligadura', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('A', { label: 'Número másico A (se toma el isóbaro más estable según la fórmula de masas)', min: 4, max: 240, step: 1, value: 56, fmt: (v) => v.toFixed(0) });
    sim.out('B', 'Núcleo más estable: Z · energía de ligadura por nucleón (fórmula semiempírica) · valor experimental', { hl: true });
    sim.out('t', 'Contribuciones por nucleón (MeV): volumen + superficie + Coulomb + asimetría + apareamiento');
    sim.out('c', 'Coeficientes del ajuste (MeV): a_V, a_S, a_C, a_A, a_P · desviación cuadrática media');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, A = Math.round(p.A), Z = N.bestZ(A, coef);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.66, h: H, xmin: 0, xmax: 250, ymin: 0, ymax: 9.5, xlabel: 'número másico A', ylabel: 'B/A (MeV)', ml: 56, mr: 8, title: 'Energía de ligadura por nucleón de los núcleos estables' });
      pl.frame(); const xs = rows.map((q) => q.A), ys = rows.map((q) => N.bindingPerA(q.Z, q.A));
      pl.xy(xs, ys, { color: '--c1', width: 0 }); rows.forEach((q) => pl.dot(q.A, N.bindingPerA(q.Z, q.A), { color: '--c1', r: 2.2 }));
      const cx = [], cy = []; for (let a = 4; a <= 250; a += 2) { const z = N.bestZ(a, coef); cx.push(a); cy.push(N.semf(z, a, coef) / a); } pl.xy(cx, cy, { color: '--accent', width: 2.6 });
      for (const [k, nm] of Object.entries(NAME)) { const [z, a] = k.split(',').map(Number); if (N.has(z, a)) pl.label(a + 2, N.bindingPerA(z, a) - 0.35, nm, { color: '--c3', size: 11 }); }
      pl.vline(A, { color: '--c3', dash: [3, 3] }); pl.dot(A, N.semf(Z, A, coef) / A, { color: '--c3', r: 5.5 });
      pl.legend([{ label: 'núcleos estables (masas atómicas)', color: '--c1' }, { label: 'fórmula semiempírica', color: '--accent' }], 'br');
      // barras de contribuciones por nucleón
      const f = N.features(Z, A), t = f.map((x, i) => (coef[i] * x) / A), names = ['volumen', 'superficie', 'Coulomb', 'asimetría', 'pares'], bx = W * 0.7, bw = W * 0.28, by = H * 0.12, bh = H * 0.72, sc = (bh / 2) / 17;
      ctx.save(); ctx.strokeStyle = EM.alpha('--ink', 0.4); ctx.beginPath(); ctx.moveTo(bx, by + bh / 2); ctx.lineTo(bx + bw, by + bh / 2); ctx.stroke(); ctx.restore();
      t.forEach((v, i) => { const x = bx + (i + 0.15) * (bw / 5), w = bw / 5 * 0.7; ctx.save(); ctx.fillStyle = EM.alpha(v >= 0 ? '--c1' : '--c2', 0.75); ctx.fillRect(x, v >= 0 ? by + bh / 2 - v * sc : by + bh / 2, w, Math.abs(v) * sc); ctx.restore(); EM.text(ctx, names[i], x + w / 2, by + bh + 14, { size: 10, align: 'center', color: '--ink-3' }); EM.text(ctx, EM.fix(v, 2), x + w / 2, (v >= 0 ? by + bh / 2 - v * sc - 5 : by + bh / 2 + Math.abs(v) * sc + 12), { size: 10, align: 'center', color: '--ink-2' }); });
      EM.text(ctx, `A = ${A}, Z = ${Z}`, bx + bw / 2, by - 8, { size: 12, align: 'center', color: '--ink' });
      const exp = N.has(Z, A) ? N.bindingPerA(Z, A) : null;
      sim.set('B', `Z = ${Z} · ${EM.fix(N.semf(Z, A, coef) / A, 4)} MeV · ${exp === null ? 'sin dato en la tabla' : EM.fix(exp, 4) + ' MeV'}`);
      sim.set('t', t.map((v) => EM.fix(v, 3)).join(' · '));
      sim.set('c', `${coef.map((v) => EM.fix(v, 3)).join(' · ')} · ${EM.fix(N.rms(rows, coef, 20), 2)} MeV`);
    });
  });

  /* 22.2 Valle de estabilidad e isóbaros */
  EM.defineSim('valle', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('A', { label: 'Número másico A (isóbaros: mismo A)', min: 20, max: 240, step: 1, value: 101, fmt: (v) => v.toFixed(0) });
    sim.out('z', 'Isóbaro más estable (fórmula de masas) · isóbaros estables observados', { hl: true });
    sim.out('p', 'Paridad de A: par → dos parábolas (par–par y impar–impar separadas por 2a_P/√A); impar → una sola');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, A = Math.round(p.A), Zb = N.bestZ(A, coef);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 150, ymin: 0, ymax: 100, xlabel: 'N (neutrones)', ylabel: 'Z (protones)', ml: 56, mr: 8, title: 'Núcleos estables y línea de estabilidad' });
      pl.frame(); rows.forEach((q) => pl.dot(q.A - q.Z, q.Z, { color: '--c1', r: 2.4 })); pl.fn((n) => n, { color: '--ink-3', width: 1.2, dash: [4, 3], n: 4 });
      const lx = [], ly = []; for (let a = 4; a <= 250; a += 2) { lx.push(a - N.bestZ(a, coef)); ly.push(N.bestZ(a, coef)); } pl.xy(lx, ly, { color: '--accent', width: 2.4 });
      pl.xy([A, 0], [0, A], { color: '--c3', width: 1.8 }); pl.dot(A - Zb, Zb, { color: '--c3', r: 5.5 });
      // parábolas de masa a A fija
      const zs = [], me = [], mo = []; let m0 = Infinity; const en = (Z) => Z * N.mpMeV + (A - Z) * N.mnMeV + Z * N.meMeV - N.semf(Z, A, coef);
      for (let Z = Math.max(1, Zb - 10); Z <= Math.min(A - 1, Zb + 10); Z++) { zs.push(Z); const v = en(Z); m0 = Math.min(m0, v); }
      const ys = zs.map((Z) => en(Z) - m0), ymax = Math.max(...ys) * 1.05 + 1, pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: zs[0] - 0.5, xmax: zs[zs.length - 1] + 0.5, ymin: 0, ymax, xlabel: 'Z (A fijo)', ylabel: 'energía de masa − mínimo (MeV)', ml: 56, mr: 8, title: `Masas de los isóbaros de A = ${A}` });
      pr.frame(); zs.forEach((Z, i) => { const par = N.pairSign(Z, A), c = par > 0 ? '--c1' : par < 0 ? '--c2' : '--accent'; pr.dot(Z, ys[i], { color: c, r: 5 }); });
      const st = rows.filter((q) => q.A === A).map((q) => q.Z); st.forEach((Z) => { const i = zs.indexOf(Z); if (i >= 0) pr.dot(Z, ys[i], { color: '--ink', r: 8 }); });
      pr.xy(zs, zs.map((Z) => en(Z) - m0 - 0), { color: '--ink-3', width: 0 });
      sim.set('z', `Z = ${Zb} · ${st.length ? st.join(', ') : 'ninguno (sin isóbaro estable)'}`);
      sim.set('p', A % 2 ? 'A impar: una parábola; el isóbaro más estable es único (rara vez dos)' : `A par: pares: Z par (azul), Z impar (rojo): separación ${EM.fix(2 * coef[4] / Math.sqrt(A), 2)} MeV`);
    });
  });

  /* 22.3 Modelo de capas */
  const LET = N.LETTERS;
  EM.defineSim('capas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('lam', { label: 'Intensidad del acoplamiento espín–órbita λ (MeV fm²)', min: 0, max: 60, step: 1, value: 45, fmt: (v) => v.toFixed(0) });
    sim.slider('A', { label: 'Número másico del núcleo (V₀ = 51 + 33(N − Z)/A para neutrones)', min: 16, max: 208, step: 1, value: 208, fmt: (v) => v.toFixed(0) });
    sim.out('m', 'Cierres de capa (mayores huecos): número de nucleones', { hl: true });
    sim.out('l', 'Primeros niveles (nlj) y ocupación acumulada');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, A = Math.round(p.A), Zn = Math.round(A * 0.394), Nn = A - Zn, V0 = 51 + 33 * (Nn - Zn) / A, R = 1.27 * Math.cbrt(A);
      EM.draw.clear(cv);
      const lvAll = N.shellLevels({ V0, R, a: 0.67, lambda: p.lam }); let cm = 0; const lv = []; for (const q of lvAll) { lv.push(q); cm += q.deg; if (cm >= 140) break; } const gaps = N.shellGaps(lvAll, 140), big = gaps.filter((q) => q.gap > 2.0).map((q) => q.N), Emin = lv[0].E;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: 1, ymin: Emin - 3, ymax: lv[lv.length - 1].E + 3, xlabel: '', ylabel: 'energía (MeV)', ml: 56, mr: 8, title: 'Niveles de un neutrón (Woods–Saxon + espín–órbita)' });
      pl.frame(); let cum = 0;
      lv.forEach((q, i) => { cum += q.deg; const col = big.includes(cum) ? '--c3' : '--c1'; pl.xy([0.12, 0.5], [q.E, q.E], { color: col, width: 2.4 }); pl.label(i % 2 ? 0.74 : 0.52, q.E + 0.15, `${q.n}${LET[q.l]}${Math.round(2 * q.j)}/2 (${q.deg})→${cum}`, { color: '--ink-2', size: 9.5 }); });
      const pr = new EM.Plot(ctx, { x: W * 0.64, y: 0, w: W * 0.36, h: H, xmin: 0, xmax: 140, ymin: 0, ymax: 6, xlabel: 'número de nucleones', ylabel: 'hueco con el nivel siguiente (MeV)', ml: 46, mr: 8, title: 'Huecos entre capas' });
      pr.frame(); gaps.forEach((q) => pr.xy([q.N, q.N], [0, q.gap], { color: q.gap > 2 ? '--c3' : '--c1', width: 3 }));
      sim.set('m', big.length ? big.join(', ') + (p.lam >= 40 && A > 200 ? ' (números mágicos 2, 8, 20, 28, 50, 82, 126)' : '') : 'ninguno');
      sim.set('l', lv.slice(0, 8).map((q) => `${q.n}${LET[q.l]}${Math.round(2 * q.j)}/2`).join(' · '));
    });
  });
})();
