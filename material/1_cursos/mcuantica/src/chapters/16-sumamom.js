/* Capítulo 16 — Suma de momentos angulares */
(function () {
  'use strict';
  const EM = window.EM, K = EM.qm.cpl, V = EM.V, M = EM.M, PI = Math.PI;
  const half = (x) => (Number.isInteger(x) ? String(x) : (x < 0 ? '−' : '') + Math.abs(x * 2) + '/2');

  /* 16.1 Tabla de coeficientes de Clebsch–Gordan */
  EM.defineSim('cg-tabla', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('j1', { label: 'Primer momento j₁', options: [[0.5, '1/2'], [1, '1'], [1.5, '3/2'], [2, '2']], value: 1 });
    sim.select('j2', { label: 'Segundo momento j₂', options: [[0.5, '1/2'], [1, '1'], [1.5, '3/2'], [2, '2']], value: 0.5 });
    sim.slider('M', { label: 'Proyección total M', min: -4, max: 4, step: 0.5, value: 0.5, fmt: (v) => half(v) });
    sim.out('s', 'Normalización por columnas Σ(m₁, m₂)|⟨j₁m₁j₂m₂|JM⟩|² (cada columna) y por filas Σ<sub>J</sub>|⟨…|JM⟩|² (cada fila)', { hl: true });
    sim.out('d', 'Dimensión: (2<i>j</i>₁ + 1)(2<i>j</i>₂ + 1) = Σ<sub>J</sub>(2<i>J</i> + 1) · valores de J');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, j1 = +sim.p.j1, j2 = +sim.p.j2, Js = K.Js(j1, j2);
      let Mt = Math.round(2 * sim.p.M) / 2; const Mmax = j1 + j2;
      if (Math.abs(Mt) > Mmax) Mt = Math.sign(Mt) * Mmax;
      /* M debe ser congruente con j1 + j2 módulo 1 */
      if (!Number.isInteger(Math.round((j1 + j2 - Mt) * 1e6) / 1e6)) Mt += Mt > 0 ? -0.5 : 0.5;
      EM.draw.clear(cv);
      const rows = []; for (let m1 = j1; m1 >= -j1 - 1e-9; m1 -= 1) { const m2 = Mt - m1; if (Math.abs(m2) <= j2 + 1e-9 && Number.isInteger(Math.round((j2 - m2) * 1e6) / 1e6)) rows.push([m1, m2]); }
      const cols = Js.filter((J) => J >= Math.abs(Mt) - 1e-9);
      const x0 = W * 0.12, y0 = H * 0.18, cw = Math.min(W * 0.1, (W * 0.46) / Math.max(1, cols.length)), rh = Math.min(H * 0.12, (H * 0.7) / Math.max(1, rows.length));
      EM.text(ctx, `M = ${half(Mt)}`, x0 - 6, y0 - 22, { size: 13, align: 'right', color: '--accent' });
      cols.forEach((J, c) => EM.text(ctx, 'J = ' + half(J), x0 + (c + 0.5) * cw, y0 - 10, { size: 12, align: 'center', color: '--ink-2' }));
      let colSum = cols.map(() => 0), rowSum = rows.map(() => 0);
      rows.forEach(([m1, m2], r) => {
        EM.text(ctx, `${half(m1)}, ${half(m2)}`, x0 - 8, y0 + (r + 0.58) * rh, { size: 12, align: 'right', color: '--ink-2' });
        cols.forEach((J, c) => {
          const v = K.cg(j1, m1, j2, m2, J, Mt); colSum[c] += v * v; rowSum[r] += v * v;
          const a = Math.min(1, Math.abs(v));
          ctx.save(); ctx.fillStyle = v === 0 ? EM.alpha('--ink-3', 0.06) : EM.alpha(v > 0 ? '--c1' : '--c2', 0.12 + 0.62 * a); ctx.fillRect(x0 + c * cw + 1, y0 + r * rh + 1, cw - 2, rh - 2); ctx.restore();
          EM.text(ctx, v === 0 ? '·' : EM.fix(v, 4), x0 + (c + 0.5) * cw, y0 + (r + 0.62) * rh, { size: 12, align: 'center', color: v === 0 ? '--ink-3' : '--ink' });
        });
      });
      /* diagrama de acoplamiento */
      const dx = W * 0.62, dw = W * 0.34, dy = H * 0.15, dh = H * 0.7;
      EM.text(ctx, 'Multiplicidad de J', dx + dw / 2, dy - 8, { size: 12, align: 'center', color: '--ink-3' });
      Js.forEach((J, i) => {
        const w = (2 * J + 1) * (dw * 0.9) / (2 * (j1 + j2) + 1), y = dy + dh - (i + 1) * (dh / (Js.length + 0.5));
        ctx.save(); ctx.fillStyle = EM.alpha('--c3', 0.45); ctx.fillRect(dx, y, w, 16); ctx.restore();
        EM.text(ctx, `J = ${half(J)} (${2 * J + 1})`, dx + w + 8, y + 12.5, { size: 12, color: '--ink-2' });
      });
      sim.set('s', `${colSum.map((x) => EM.fix(x, 4)).join(', ')} · ${rowSum.map((x) => EM.fix(x, 4)).join(', ')}`);
      sim.set('d', `${(2 * j1 + 1) * (2 * j2 + 1)} = ${Js.map((J) => 2 * J + 1).join(' + ')} · ${Js.map(half).join(', ')}`);
    });
  });

  /* 16.2 Modelo vectorial del acoplamiento L–S */
  EM.defineSim('acople-ls', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('L', { label: 'Momento angular orbital L', min: 1, max: 4, step: 1, value: 1, fmt: (v) => v.toFixed(0) + ' (' + 'SPDFG'[Math.round(v)] + ')' });
    sim.select('S', { label: 'Espín total S', options: [[0.5, '1/2'], [1, '1'], [1.5, '3/2']], value: 0.5 });
    sim.slider('Jq', { label: 'Estado de J (de J = |L − S| a L + S)', min: 0, max: 5, step: 1, value: 1, fmt: (v) => 'nivel ' + (v + 1) });
    sim.slider('A', { label: 'Constante de estructura fina A (en unidades arbitrarias)', min: 0.1, max: 2, step: 0.05, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.out('J', 'Nivel ²ˢ⁺¹L<sub>J</sub> · J · |<b>L</b>|, |<b>S</b>|, |<b>J</b>| (ħ)', { hl: true });
    sim.out('l', '<b>L</b>·<b>S</b> = ½[<i>J</i>(<i>J</i> + 1) − <i>L</i>(<i>L</i> + 1) − <i>S</i>(<i>S</i> + 1)] · ángulo entre <b>L</b> y <b>S</b> · energía <i>A</i><b>L</b>·<b>S</b>');
    sim.out('g', 'Factor de Landé <i>g</i><sub>J</sub> · intervalo con el nivel superior (regla de Landé: A·J)');
    let t = 0; sim.animate((dt) => { t += dt * 1.0; });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, L = Math.round(sim.p.L), S = +sim.p.S, Js = K.Js(L, S), iJ = Math.min(Js.length - 1, Math.round(sim.p.Jq)), J = Js[iJ], A = sim.p.A;
      EM.draw.clear(cv);
      const lL = Math.sqrt(L * (L + 1)), lS = Math.sqrt(S * (S + 1)), lJ = Math.sqrt(J * (J + 1));
      /* vector J vertical; L y S precesan en torno a J con ángulos dados por la ley de los cosenos */
      const cx = W * 0.27, cy = H * 0.52, sc = Math.min(W * 0.2, H * 0.36) / Math.max(lL, lJ, 1);
      const cL = lJ < 1e-9 ? 1 : (lJ * lJ + lL * lL - lS * lS) / (2 * lJ * lL), cS = lJ < 1e-9 ? -1 : (lJ * lJ + lS * lS - lL * lL) / (2 * lJ * lS);
      const sL = Math.sqrt(Math.max(0, 1 - cL * cL)), sS = Math.sqrt(Math.max(0, 1 - cS * cS));
      const ph = t, proj = (x, y, z) => [cx + (x * Math.cos(0.5) - y * 0.5) * sc, cy - (z + x * 0.0 + y * 0.25 * 1.0) * sc];
      const Lv = [lL * sL * Math.cos(ph), lL * sL * Math.sin(ph), lL * cL], Sv = [-lS * sS * Math.cos(ph), -lS * sS * Math.sin(ph), lS * cS];
      /* si J = 0 el eje no está definido: L y S antiparalelos */
      const P0 = proj(0, 0, 0), PJ = proj(0, 0, lJ);
      const tipL = proj(...Lv), tipLS = proj(Lv[0] + Sv[0], Lv[1] + Sv[1], Lv[2] + Sv[2]);
      EM.draw.arrow(ctx, P0[0], P0[1], PJ[0], PJ[1], { color: '--accent', width: 3, head: 11 });
      EM.draw.arrow(ctx, P0[0], P0[1], tipL[0], tipL[1], { color: '--c1', width: 2.4, head: 10 });
      EM.draw.arrow(ctx, tipL[0], tipL[1], tipLS[0], tipLS[1], { color: '--c2', width: 2.4, head: 10 });
      ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = EM.alpha('--ink-3', 0.7); ctx.beginPath(); ctx.moveTo(PJ[0], PJ[1]); ctx.lineTo(tipLS[0], tipLS[1]); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'J', PJ[0] + 8, PJ[1] - 4, { size: 14, color: '--accent' }); EM.text(ctx, 'L', tipL[0] + 6, tipL[1] - 4, { size: 14, color: '--c1' }); EM.text(ctx, 'S', (tipL[0] + tipLS[0]) / 2 + 8, (tipL[1] + tipLS[1]) / 2, { size: 14, color: '--c2' });
      /* niveles de energía */
      const pl = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: 1, ymin: -3, ymax: 3, xlabel: '', ylabel: 'E (A·L·S)', ml: 60, mr: 12, title: 'Estructura fina del término' });
      pl.frame();
      const Es = Js.map((JJ) => A * K.LS(L, S, JJ)), top = Math.max(1, ...Es.map(Math.abs)); pl.set({ ymin: -top * 1.25, ymax: top * 1.25 });
      pl.frame();
      Js.forEach((JJ, i) => { pl.path([[0.1, Es[i]], [0.55, Es[i]]], { color: i === iJ ? '--accent' : '--ink-3', width: i === iJ ? 3.4 : 1.8 }); pl.label(0.58, Es[i], `J = ${half(JJ)}`, { size: 12, dy: 4, color: i === iJ ? '--accent' : '--ink-2' }); });
      const gap = iJ < Js.length - 1 ? A * (K.LS(L, S, Js[iJ + 1]) - K.LS(L, S, J)) : 0;
      const ang = (lL * lS) === 0 ? 0 : M.deg(Math.acos((lJ * lJ - lL * lL - lS * lS) / (2 * lL * lS)));
      sim.set('J', `${2 * S + 1 === 2 ? '²' : 2 * S + 1 === 3 ? '³' : '⁴'}${'SPDFG'[L]}${half(J)} · J = ${half(J)} · ${EM.fix(lL, 4)}, ${EM.fix(lS, 4)}, ${EM.fix(lJ, 4)}`);
      sim.set('l', `${EM.fix(K.LS(L, S, J), 4)} · ${EM.fix(ang, 2)}° · ${EM.fix(A * K.LS(L, S, J), 4)}`);
      sim.set('g', `${EM.fix(K.lande(L, S, J), 4)} · ${iJ < Js.length - 1 ? EM.fix(gap, 4) + ' (= A·' + half(Js[iJ + 1]) + ')' : '(es el nivel superior)'}`);
    });
  });

  /* 16.3 Efecto Zeeman anómalo y transición a Paschen–Back en un término ²P */
  EM.defineSim('zeeman-anom', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('bmax', { label: 'Intervalo del campo (en unidades de A/μ_B)', min: 0.2, max: 6, step: 0.1, value: 3, fmt: (v) => EM.fix(v, 1) });
    sim.slider('b', { label: 'Campo magnético actual μ_B B / A', min: 0, max: 6, step: 0.01, value: 0.1, fmt: (v) => EM.fix(v, 2) });
    sim.check('weak', { label: 'Mostrar la aproximación de campo débil (rectas g_J M μ_B B)', value: true });
    sim.out('e', 'Energías con el campo actual para M = 3/2, 1/2, −1/2, −3/2 (en unidades de A)', { hl: true });
    sim.out('g', 'Factores de Landé: <i>g</i>(²P<sub>3/2</sub>) = 4/3 · <i>g</i>(²P<sub>1/2</sub>) = 2/3 · <i>g</i>(²S<sub>1/2</sub>) = 2 · pendiente del nivel M = 3/2 en campo fuerte: m<sub>l</sub> + 2m<sub>s</sub> = 2');
    sim.out('t', 'Régimen: campo débil si μ<sub>B</sub>B ≪ A (acoplamiento L–S); campo fuerte (Paschen–Back) si μ<sub>B</sub>B ≫ A · valor de la separación fina 3A/2');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, bm = sim.p.bmax, bn = sim.p.b, A = 1;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.66, h: H, xmin: 0, xmax: bm, ymin: -2 * bm - 1.2, ymax: 2 * bm + 1.2, xlabel: 'μ_B B / A', ylabel: 'E / A', ml: 54, mr: 10, title: 'Término ²P: Zeeman anómalo → Paschen–Back' });
      pl.frame();
      const Ms = ['1.5', '0.5', '-0.5', '-1.5'], cols = ['--c1', '--c2', '--c3', '--c4'], N = 160;
      Ms.forEach((m, k) => {
        const n = k === 0 || k === 3 ? 1 : 2;
        for (let q = 0; q < n; q++) { const xs = [], ys = []; for (let i = 0; i <= N; i++) { const b = (bm * i) / N; xs.push(b); ys.push(K.zeemanP(A, b)[m][q]); } pl.xy(xs, ys, { color: cols[k], width: 2 }); }
      });
      if (sim.p.weak) { const dash = [4, 4]; for (const [J, ms] of [[1.5, [1.5, 0.5, -0.5, -1.5]], [0.5, [0.5, -0.5]]]) for (const m of ms) pl.path([[0, K.zeemanWeak(A, 0, m, J)], [bm, K.zeemanWeak(A, bm, m, J)]], { color: '--ink-3', width: 1, dash, alpha: 0.7 }); }
      pl.vline(bn, { color: '--accent', dash: [3, 3] });
      pl.legend(Ms.map((m, k) => ({ label: 'M = ' + half(+m), color: cols[k] })), 'tl');
      const z = K.zeemanP(A, bn);
      sim.set('e', Ms.map((m) => z[m].map((x) => EM.fix(x, 4)).join(' y ')).join(' | '));
      sim.set('g', `4/3 · 2/3 · 2 · ${EM.fix(4 / 3, 4)}, ${EM.fix(2 / 3, 4)}, ${EM.fix(2, 4)}`);
      sim.set('t', `${bn < 0.2 ? 'campo débil' : bn > 2 ? 'campo fuerte (Paschen–Back)' : 'régimen intermedio'} · ${EM.fix(1.5 * A, 3)} A`);
    });
  });
})();
