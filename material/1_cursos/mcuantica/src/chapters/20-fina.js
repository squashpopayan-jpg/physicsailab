/* Capítulo 20 — Estructura fina e hiperfina */
(function () {
  'use strict';
  const EM = window.EM, FN = EM.qm.fine, M = EM.M;
  const GHZ = FN.hartreeGHz, LET = 'spdfgh';
  const jtxt = (j) => Math.round(2 * j) + '/2';

  /* 20.1 Correcciones de orden α²: cinética, espín–órbita y Darwin */
  EM.defineSim('fina-niveles', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('n', { label: 'Número cuántico principal n', min: 1, max: 5, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('Z', { label: 'Carga nuclear Z (ion hidrogenoide de un electrón)', min: 1, max: 30, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.out('b', 'Energía de Bohr <i>E</i><sub>n</sub> (eV) y desplazamiento de estructura fina del nivel de menor <i>j</i> (µeV)', { hl: true });
    sim.out('s', 'Separación de estructura fina entre los niveles extremos de <i>n</i> (GHz y cm⁻¹) · escala (<i>Zα</i>)²/<i>n</i>² respecto de <i>E</i><sub>n</sub>');
    sim.out('d', 'Diferencia entre la fórmula de orden α² y la energía exacta de Dirac para ese nivel (eV)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, n = Math.round(sim.p.n), Z = Math.round(sim.p.Z);
      EM.draw.clear(cv);
      const levs = []; for (let l = 0; l < n; l++) for (const j of l === 0 ? [0.5] : [l - 0.5, l + 0.5]) levs.push({ l, j, E: FN.fine(n, l, j, Z), kin: FN.kin(n, l, Z), so: FN.so(n, l, j, Z), dar: FN.darwin(n, l, Z), exact: FN.dirac(n, j, Z) - FN.bohr(n, Z) });
      const ev = (x) => x * 27.211386246e6; /* µeV */
      const vals = levs.map((q) => ev(q.E)), lo = Math.min(...vals), hi = Math.max(...vals), pad = Math.max(1e-9, (hi - lo) * 0.3 || Math.abs(lo) * 0.3 + 1e-9);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: -0.5, xmax: n - 0.5, ymin: lo - pad, ymax: hi + pad, xlabel: 'l', ylabel: 'E − E_Bohr (µeV)', ml: 62, mr: 10, title: `Estructura fina del nivel n = ${n} (Z = ${Z})` });
      pl.frame();
      levs.forEach((q) => { const x = q.l + (q.j > q.l ? 0.18 : q.l === 0 ? 0 : -0.18); pl.path([[x - 0.14, ev(q.E)], [x + 0.14, ev(q.E)]], { color: '--accent', width: 3.4 }); pl.label(x, ev(q.E), `${n}${LET[q.l]}${jtxt(q.j)}`, { size: 11, dy: -10, align: 'center', color: '--ink-2' }); });
      /* contribuciones del nivel de menor j y mayor l */
      const bx = W * 0.6, bw = W * 0.38; EM.text(ctx, 'Contribuciones (µeV) a cada nivel', bx + bw / 2, H * 0.08, { size: 12, align: 'center', color: '--ink-3' });
      const rows = levs.slice(0, 6), mx = Math.max(...rows.map((q) => Math.max(Math.abs(ev(q.kin)), Math.abs(ev(q.so)), Math.abs(ev(q.dar)), 1e-12))), rh = Math.min(H * 0.12, (H * 0.8) / Math.max(1, rows.length));
      rows.forEach((q, i) => { const y = H * 0.14 + i * rh; EM.text(ctx, `${n}${LET[q.l]}${jtxt(q.j)}`, bx, y + rh * 0.55, { size: 11, color: '--ink-2' }); [[ev(q.kin), '--c1'], [ev(q.so), '--c2'], [ev(q.dar), '--c3']].forEach(([v, c], k) => { const w = (v / mx) * bw * 0.28; ctx.save(); ctx.fillStyle = EM.alpha(c, 0.7); ctx.fillRect(bx + bw * 0.42 + (w < 0 ? w : 0), y + 2 + k * (rh / 3.3), Math.abs(w), rh / 3.6); ctx.restore(); }); });
      EM.text(ctx, '■ cinética  ■ espín–órbita  ■ Darwin', bx + bw / 2, H * 0.95, { size: 10.5, align: 'center', color: '--ink-3' });
      const q0 = levs[0], jmin = levs[0], jmax = levs[levs.length - 1], span = FN.fineJ(n, n - 0.5, Z) - FN.fineJ(n, 0.5, Z);
      sim.set('b', `${EM.fix(FN.bohr(n, Z) * 27.211386246, 5)} eV · ${EM.fix(ev(FN.fineJ(n, 0.5, Z)), 5)} µeV`);
      sim.set('s', `${EM.fix(Math.abs(span) * GHZ, 4)} GHz (${EM.fix(Math.abs(span) * GHZ / 29.9792458, 4)} cm⁻¹) · ${EM.sci(((Z * FN.alpha) ** 2) / (n * n), 3)}`);
      const mm = Math.max(...levs.map((q) => Math.abs(q.E - q.exact)));
      sim.set('d', `${EM.sci(mm * 27.211386246, 3)} eV (máximo entre los niveles de la capa)`);
    });
  });

  /* 20.2 Diagrama de Breit–Rabi del 1s del hidrógeno */
  EM.defineSim('hiperfino-h', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('B', { label: 'Campo magnético B (tesla)', min: 0, max: 0.5, step: 0.001, value: 0.05, fmt: (v) => EM.fix(v, 3) + ' T' });
    sim.out('f', 'Desdoblamiento hiperfino del campo nulo Δ<i>E</i> = <i>h</i>ν con ν = 1420.4058 MHz · λ (cm) · energía (µeV)', { hl: true });
    sim.out('z', 'Frecuencias de las transiciones con el campo actual (GHz): |F=1,m=0⟩ → |F=0⟩ y |F=1,m=1⟩ → |F=1,m=0⟩');
    sim.out('r', 'Régimen: Zeeman débil si μ<sub>B</sub><i>B</i> ≪ Δ<i>E</i> · cociente <i>x</i> = (g<sub>s</sub>μ<sub>B</sub> + g<sub>p</sub>μ<sub>N</sub>)<i>B</i>/Δ<i>E</i>');
    const DE = 1420.405751768e6 / (1 / 4.135667696e-15), MUB = 5.7883818060e-5, MUN = 3.15245125844e-8, GS = 2.00231930436, GP = 5.5856946893;
    const HZ = 1 / 4.135667696e-15; /* Hz por eV */
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, B = sim.p.B, nu0 = 1420.405751768e6, a = nu0, be = (GS * MUB * HZ) , bp = (GP * MUN * HZ);
      EM.draw.clear(cv);
      const f = (Bt) => FN.breitRabi(a, be * Bt, bp * Bt);
      const Bm = 0.5, pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.64, h: H, xmin: 0, xmax: Bm, ymin: -14, ymax: 14, xlabel: 'B (T)', ylabel: 'E/h (GHz)', ml: 54, mr: 10, title: 'Hiperfino del 1s del hidrógeno: Breit–Rabi' });
      pl.frame(); pl.hline(0, { color: '--axis' });
      const N = 200, Bs = Array.from({ length: N + 1 }, (_, i) => (Bm * i) / N), data = Bs.map(f);
      [['up', '--c1', 'F=1, m=+1'], ['m0hi', '--c2', 'm=0 (hacia F=1)'], ['m0lo', '--c3', 'm=0 (hacia F=0)'], ['dn', '--c4', 'F=1, m=−1']].forEach(([k, c]) => pl.xy(Bs, data.map((d) => d[k] / 1e9), { color: c, width: 2 }));
      pl.vline(B, { color: '--accent', dash: [3, 3] }); pl.legend([{ label: 'F=1, m=+1', color: '--c1' }, { label: 'm=0 (F=1)', color: '--c2' }, { label: 'm=0 (F=0)', color: '--c3' }, { label: 'F=1, m=−1', color: '--c4' }], 'tl');
      const e = f(B), qx = ((GS * MUB + GP * MUN) * B) / DE;
      /* panel de niveles */
      const bx = W * 0.68, bw = W * 0.3, ys = (v) => H * 0.5 - (v / 1e9) * (H * 0.4) / 12;
      [[e.up, '--c1', 'F=1, m=+1'], [e.m0hi, '--c2', 'm=0'], [e.dn, '--c4', 'F=1, m=−1'], [e.m0lo, '--c3', 'm=0']].forEach(([v, c, t]) => { ctx.save(); ctx.strokeStyle = EM.col(c); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, ys(v)); ctx.lineTo(bx + bw * 0.45, ys(v)); ctx.stroke(); ctx.restore(); EM.text(ctx, t, bx + bw * 0.5, ys(v) + 4, { size: 11, color: '--ink-2' }); });
      EM.text(ctx, `B = ${EM.fix(B, 3)} T`, bx + bw / 2, H * 0.08, { size: 12, align: 'center', color: '--accent' });
      sim.set('f', `${EM.fix(nu0 / 1e6, 4)} MHz · ${EM.fix(29.9792458e9 / nu0, 4)} cm · ${EM.fix(DE * 1e6, 4)} µeV`);
      sim.set('z', `${EM.fix((e.m0hi - e.m0lo) / 1e9, 5)} y ${EM.fix(Math.abs(e.up - e.m0hi) / 1e9, 5)}`);
      sim.set('r', `${qx < 0.1 ? 'Zeeman débil' : qx > 3 ? 'Paschen–Back (campo fuerte)' : 'intermedio'} · ${EM.fix(qx, 4)}`);
    });
  });

  /* 20.3 Estructura fina de Hα (n = 3 → 2) con y sin el desplazamiento de Lamb */
  EM.defineSim('halfa-fina', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.check('lamb', { label: 'Incluir el desplazamiento de Lamb del nivel s (≈ +1057.8 MHz en 2s₁/₂ y, por la escala 1/n³, ≈ +313 MHz en 3s₁/₂)', value: false });
    sim.out('l', 'Siete líneas permitidas (Δl = ±1, Δj = 0, ±1): desplazamientos respecto de la línea de Bohr Hα (GHz)', { hl: true });
    sim.out('w', 'Longitud de onda central de Hα (nm, en el vacío con masa reducida) · ancho total de la estructura fina (GHz)');
    const trans = [[0, 0.5, 1, 0.5, '3s½→2p½'], [0, 0.5, 1, 1.5, '3s½→2p3/2'], [1, 0.5, 0, 0.5, '3p½→2s½'], [1, 1.5, 0, 0.5, '3p3/2→2s½'], [2, 1.5, 1, 0.5, '3d3/2→2p½'], [2, 1.5, 1, 1.5, '3d3/2→2p3/2'], [2, 2.5, 1, 1.5, '3d5/2→2p3/2']];
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, lamb = sim.p.lamb ? 1 : 0, mu = 1 / (1 + 1 / 1836.15267343);
      EM.draw.clear(cv);
      const lambS = { 2: 1057.845e6, 3: (1057.845e6 * 8) / 27 }, E = (n, l, j) => FN.dirac(n, j) * GHZ * 1e9 + (lamb && l === 0 ? lambS[n] : 0);
      const nu0 = (FN.bohr(3) - FN.bohr(2)) * GHZ * 1e9, lines = trans.map(([l1, j1, l2, j2, t]) => ({ t, d: (E(3, l1, j1) - E(2, l2, j2)) - nu0 }));
      const lo = Math.min(...lines.map((q) => q.d)) / 1e9, hi = Math.max(...lines.map((q) => q.d)) / 1e9;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: lo - 3, xmax: hi + 3, ymin: 0, ymax: 1.35, xlabel: 'ν − ν_Bohr (GHz)', ylabel: '', ml: 30, mr: 14, title: 'Hα: siete componentes de estructura fina' });
      pl.frame(); const used = [];
      lines.forEach((q, i) => { const x = q.d / 1e9; pl.path([[x, 0], [x, 0.9]], { color: '--accent', width: 3 }); const tier = used.filter((u) => Math.abs(u - x) < 2.2).length; used.push(x); pl.label(x, 0.92 + 0.12 * (tier % 3), q.t, { size: 10.5, align: 'center', color: '--ink-2' }); });
      sim.set('l', lines.map((q) => EM.fix(q.d / 1e9, 3)).join(', '));
      const lam0 = 1239.841984e-9 / (13.605693123 * mu * (1 / 4 - 1 / 9)) * 1e9;
      sim.set('w', `${EM.fix(lam0, 3)} nm · ${EM.fix(hi - lo, 4)} GHz`);
    });
  });
})();
