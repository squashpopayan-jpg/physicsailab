/* Capítulo 6 — Imperfecciones */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;

  /* ======================================================================
     6.1 Vacancias
     ====================================================================== */
  EM.defineSim('vacancies', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    const TM = { Al: 933, Cu: 1358, Ag: 1235, Au: 1337, Ni: 1728, Pt: 2041, W: 3695 };
    sim.select('m', { label: 'Metal (Q<sub>v</sub> de Ehrhart 1991)', options: Object.keys(MAT.vacEf).map((k) => [k, k + ' — ' + MAT.vacEf[k] + ' eV']), value: 'Al' });
    sim.slider('T', { label: 'Temperatura <i>T</i>', min: 200, max: 3700, step: 5, value: 900, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('Q', { label: 'Energía de formación <i>Q<sub>v</sub></i>', min: 0.3, max: 4, step: 0.01, value: 0.67, unit: 'eV', fmt: (v) => EM.fix(v, 2) });
    sim.out('f', 'Fracción <i>N<sub>v</sub></i>/<i>N</i>', { hl: true });
    sim.out('one', 'Una vacancia cada');
    sim.out('Tm', 'Temperatura de fusión');
    sim.onChange = (id) => { if (id === 'm') { sim.ctl.Q.set(MAT.vacEf[sim.p.m], true); if (sim.p.T > TM[sim.p.m]) sim.ctl.T.set(TM[sim.p.m], true); } };
    /* red de átomos con vacancias exageradas para que se vean */
    const NX = 26, NY = 12, rnd = Array.from({ length: NX * NY }, (_, i) => { const x = Math.sin(i * 91.7 + 3.1) * 43758.5453; return x - Math.floor(x); });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const f = MAT.vacancyFraction(p.Q, p.T);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0.2, xmax: 5, ymin: -26, ymax: -2, xlabel: '1000/T (K⁻¹)', ylabel: 'log₁₀(N_v/N)', ml: 52 });
      pl.frame();
      for (const k of Object.keys(MAT.vacEf)) {
        const Q = k === p.m ? p.Q : MAT.vacEf[k];
        const xs = M.linspace(1000 / TM[k], 5, 80);
        pl.xy(xs, xs.map((x) => Math.log10(MAT.vacancyFraction(Q, 1000 / x))), { color: k === p.m ? '--accent' : '--grid-2', width: k === p.m ? 2.4 : 1.2 });
        if (k !== p.m) pl.label(1000 / TM[k] + 0.05, Math.log10(MAT.vacancyFraction(Q, TM[k])), k, { size: 10.5, color: '--ink-3' });
      }
      pl.dot(1000 / p.T, Math.log10(f), { color: '--accent' });
      /* red */
      const x0 = W * 0.54, w = W * 0.44, s = w / NX, y0 = (H - NY * s) / 2;
      const show = Math.min(0.5, Math.max(0, (Math.log10(f) + 12) / 24)); // escala visual logarítmica
      let nv = 0;
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        const vac = rnd[j * NX + i] < show * 0.25;
        if (vac) { nv++; ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x0 + (i + 0.5) * s, y0 + (j + 0.5) * s, s * 0.38, 0, 7); ctx.stroke(); }
        else EM.draw.bob(ctx, x0 + (i + 0.5) * s, y0 + (j + 0.5) * s, s * 0.4, { color: '--c1' });
      }
      EM.text(ctx, 'ilustración (escala logarítmica exagerada)', x0, H - 6, { size: 10.5, color: '--ink-3' });
      sim.set('f', EM.sci(f, 3));
      sim.set('one', EM.sci(1 / f, 2) + ' sitios');
      sim.set('Tm', TM[p.m] + ' K' + (p.T > TM[p.m] ? ' — ¡ya está fundido!' : ''));
      void nv;
    });
  });

  /* ======================================================================
     6.2 Hume-Rothery
     ====================================================================== */
  const HR = { Cu: [0.1278, 'FCC', 1], Ni: [0.1246, 'FCC', 2], Zn: [0.1332, 'HCP', 2], Al: [0.1431, 'FCC', 3], Ag: [0.1445, 'FCC', 1], Au: [0.1442, 'FCC', 1], Sn: [0.1510, 'tetragonal', 4], Pb: [0.1750, 'FCC', 2], Fe: [0.1241, 'BCC', 2], Cr: [0.1249, 'BCC', 3], Mg: [0.1604, 'HCP', 2], Si: [0.1176, 'diamante', 4] };
  /* solubilidad máxima medida (% en peso de soluto en el solvente); fuente: ASM Handbook vol. 3 */
  const OBS = { 'Cu-Ni': ['completa', 100], 'Ni-Cu': ['completa', 100], 'Cu-Zn': ['39 % Zn', 39], 'Cu-Al': ['9.4 % Al', 9.4], 'Cu-Ag': ['8.0 % Ag', 8], 'Cu-Sn': ['15.8 % Sn', 15.8], 'Cu-Pb': ['< 0.01 % Pb', 0], 'Ag-Au': ['completa', 100], 'Au-Ag': ['completa', 100], 'Ag-Cu': ['8.8 % Cu', 8.8], 'Fe-Cr': ['completa (alta T)', 100], 'Cr-Fe': ['completa (alta T)', 100], 'Al-Cu': ['5.65 % Cu', 5.65], 'Al-Mg': ['14.9 % Mg', 14.9], 'Al-Si': ['1.65 % Si', 1.65], 'Al-Zn': ['83 % Zn', 83], 'Ni-Fe': ['completa (FCC, alta T)', 100], 'Pb-Sn': ['18.3 % Sn', 18.3], 'Al-Ag': ['55.6 % Ag', 55.6] };
  EM.defineSim('hume-rothery', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    const opts = Object.keys(HR).map((k) => [k, k]);
    sim.select('a', { label: 'Solvente', options: opts, value: 'Cu' });
    sim.select('b', { label: 'Soluto', options: opts, value: 'Ni' });
    sim.out('r', '1. Diferencia de radios');
    sim.out('s', '2. Estructuras');
    sim.out('x', '3. Electronegatividad');
    sim.out('v', '4. Valencias');
    sim.out('pred', 'Predicción', { hl: true });
    sim.out('obs', 'Solubilidad máxima medida (% peso)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const A = HR[p.a], B = HR[p.b];
      const dr = (100 * (B[0] - A[0])) / A[0];
      const okR = Math.abs(dr) <= 15, okS = A[1] === B[1];
      const dx = Math.abs(EM.PAULING[p.a] - EM.PAULING[p.b]), okX = dx <= 0.4;
      const okV = B[2] >= A[2];
      const score = [okR, okS, okX].filter(Boolean).length;
      /* dibujo: red del solvente con átomos de soluto */
      const s = Math.min(W / 14, H / 6.5), r1 = s * 0.46, r2 = r1 * (B[0] / A[0]);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 12; i++) {
        const sol = (i * 7 + j * 3) % 5 === 0;
        EM.draw.bob(ctx, s * (i + 1), s * (j + 0.9), sol ? r2 : r1, { color: sol ? '--c2' : '--c1', label: (i === 1 && j === 0) || (sol && i < 3) ? (sol ? p.b : p.a) : '' });
      }
      /* barras de las reglas */
      const lab = [['tamaño', okR], ['estructura', okS], ['electroneg.', okX], ['valencia', okV]];
      lab.forEach(([t, ok], i) => {
        const x = W * 0.06 + i * W * 0.23, y = H - 22;
        ctx.fillStyle = EM.alpha(ok ? '--c3' : '--c2', 0.85);
        ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
        EM.text(ctx, (ok ? '✓ ' : '✗ ') + t, x + 12, y + 4, { size: 12, color: ok ? '--c3' : '--c2', weight: 600 });
      });
      sim.set('r', (dr > 0 ? '+' : '') + EM.fix(dr, 1) + ' % ' + (okR ? '(≤ 15 %: cumple)' : '(> 15 %: no cumple)'));
      sim.set('s', A[1] + ' / ' + B[1] + (okS ? ' (iguales)' : ' (distintas)'));
      sim.set('x', EM.PAULING[p.a] + ' / ' + EM.PAULING[p.b] + ' — Δ = ' + EM.fix(dx, 2) + (okX ? ' (parecidas)' : ' (diferentes)'));
      sim.set('v', '+' + A[2] + ' / +' + B[2] + (okV ? ' (favorable)' : ' (desfavorable)'));
      sim.set('pred', p.a === p.b ? '— elija dos elementos distintos' : score === 3 && okV ? 'solubilidad extensa, posiblemente completa' : score === 3 ? 'solubilidad extensa' : score === 2 ? 'solubilidad limitada' : 'solubilidad muy escasa');
      const o = OBS[p.a + '-' + p.b];
      sim.set('obs', o ? o[0] : 'sin dato en la tabla');
    });
  });

  /* ======================================================================
     6.3 Dislocación de borde
     ====================================================================== */
  EM.defineSim('edge-dislocation', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('xc', { label: 'Posición de la dislocación (cizalla aplicada)', min: -14, max: 14, step: 0.05, value: 0, fmt: (v) => EM.fix(v, 1) + ' b' });
    sim.slider('nu', { label: 'Coeficiente de Poisson <i>ν</i>', min: 0, max: 0.49, step: 0.01, value: 0.3, fmt: (v) => EM.fix(v, 2) });
    sim.check('circ', { label: 'Circuito de Burgers', value: true });
    sim.check('strain', { label: 'Colorear la dilatación', value: true });
    sim.slider('cw', { label: 'Ancho del circuito', min: 2, max: 8, step: 1, value: 5, fmt: (v) => v.toFixed(0) });
    sim.out('st', 'Estado', { hl: true });
    sim.out('cl', 'Falla de cierre del circuito');
    const NX = 25, NY = 14;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const s = Math.min(W / (NX + 1), H / (NY + 1)), ox = W / 2, oy = H / 2;
      const nu = p.nu, b = 1;
      const pos = [];
      for (let i = 0; i < NX; i++) {
        pos.push([]);
        for (let j = 0; j < NY; j++) {
          const X = i - (NX - 1) / 2, Y = j - NY / 2 + 0.5; // filas a ±½ del plano de deslizamiento
          const x = X - p.xc, y = Y;
          const r2 = x * x + y * y;
          let ux = (b / (2 * Math.PI)) * (Math.atan2(y, x) + (x * y) / (2 * (1 - nu) * r2));
          const uy = -(b / (2 * Math.PI)) * (((1 - 2 * nu) / (4 * (1 - nu))) * Math.log(r2) + (x * x - y * y) / (4 * (1 - nu) * r2));
          /* corte detrás de la dislocación: arriba +b/2, abajo −b/2 → referencia centrada */
          ux -= (b / 2) * (y > 0 ? 1 : -1) * 1;
          pos[i].push([X + ux, Y + uy, x, y]);
        }
      }
      const P = (q) => [ox + q[0] * s, oy - q[1] * s];
      /* dilatación aproximada: tr ε = −b(1−2ν) y /(2π(1−ν) r²) */
      for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
        const q = pos[i][j], [x, y] = [q[2], q[3]];
        const dil = (-b * (1 - 2 * nu) * y) / (2 * Math.PI * (1 - nu) * (x * x + y * y));
        const c = p.strain ? EM.mix(EM.col('--c1'), dil < 0 ? EM.col('--c2') : EM.col('--c3'), Math.min(1, Math.abs(dil) * 6)) : EM.col('--c1');
        const [px, py] = P(q);
        EM.draw.bob(ctx, px, py, s * 0.3, { color: c });
      }
      /* plano de deslizamiento y símbolo ⊥ */
      ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = EM.col('--ink-3'); ctx.beginPath(); ctx.moveTo(10, oy); ctx.lineTo(W - 10, oy); ctx.stroke(); ctx.restore();
      if (Math.abs(p.xc) < (NX - 1) / 2) {
        const cx = ox + p.xc * s;
        ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx - 9, oy); ctx.lineTo(cx + 9, oy); ctx.moveTo(cx, oy); ctx.lineTo(cx, oy - 16); ctx.stroke();
      }
      let clTxt = '—';
      if (p.circ) {
        /* circuito: derecha n, arriba m, izquierda n, abajo m, con pasos verticales al vecino geométrico */
        const n = p.cw, m = 4;
        let ci = Math.round((NX - 1) / 2 - n / 2 + 0), cj = NY / 2 - m / 2;
        const start = [ci, cj];
        const path = [[ci, cj]];
        const stepV = (dj) => {
          const tx = pos[ci][cj][0];
          let best = ci, bd = 9;
          for (let k = Math.max(0, ci - 2); k <= Math.min(NX - 1, ci + 2); k++) { const d = Math.abs(pos[k][cj + dj][0] - tx); if (d < bd) { bd = d; best = k; } }
          ci = best; cj += dj;
        };
        for (let k = 0; k < n; k++) { ci++; path.push([ci, cj]); }
        for (let k = 0; k < m; k++) { stepV(1); path.push([ci, cj]); }
        for (let k = 0; k < n; k++) { ci--; path.push([ci, cj]); }
        for (let k = 0; k < m; k++) { stepV(-1); path.push([ci, cj]); }
        ctx.strokeStyle = EM.col('--c5'); ctx.lineWidth = 2.2;
        ctx.beginPath(); path.forEach(([i, j], k) => { const q = P(pos[i][j]); k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.stroke();
        const e = path[path.length - 1];
        const A = P(pos[e[0]][e[1]]), B = P(pos[start[0]][start[1]]);
        if (Math.hypot(A[0] - B[0], A[1] - B[1]) > 2) { EM.draw.arrow(ctx, A[0], A[1], B[0], B[1], { color: '--c2', width: 3 }); EM.text(ctx, 'b', (A[0] + B[0]) / 2, A[1] + 18, { size: 15, weight: 700, color: '--c2', italic: true, align: 'center' }); }
        EM.draw.bob(ctx, B[0], B[1], 5, { color: '--c5' });
        const dI = start[0] - e[0];
        clTxt = dI === 0 ? 'cerrado: el circuito no encierra la dislocación' : 'no cierra: falta ' + Math.abs(dI) + ' paso (|b| = 1 distancia interatómica)';
      }
      const out = Math.abs(p.xc) >= (NX - 1) / 2;
      sim.set('st', out ? (p.xc > 0 ? 'la dislocación salió por la derecha: escalón de altura b' : 'aún no entra: cristal perfecto') : 'dentro del cristal');
      sim.set('cl', clTxt);
    });
  });

  /* ======================================================================
     6.4 Tamaño de grano
     ====================================================================== */
  EM.defineSim('grain-size', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('n', { label: 'Granos en el campo', min: 8, max: 300, step: 1, value: 60, log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: 'Lado del campo (a 1×)', min: 0.05, max: 2, step: 0.01, value: 0.5, unit: 'mm', log: true, fmt: (v) => EM.fix(v, 2) });
    sim.slider('el', { label: 'Alargamiento de los granos (laminado)', min: 1, max: 3, step: 0.1, value: 1, fmt: (v) => EM.fix(v, 1) + '×' });
    sim.button('Nueva muestra', () => { seed = Math.random() * 1000; sim.redraw(); });
    sim.out('NA', 'Granos por mm² <i>N<sub>A</sub></i>');
    sim.out('G1', '<i>G</i> por planimetría', { hl: true });
    sim.out('l', 'Intercepto medio ℓ̄ (líneas horizontales)');
    sim.out('G2', '<i>G</i> por intercepción');
    let seed = 7;
    const rng = (k) => { const x = Math.sin((k + seed) * 12.9898) * 43758.5453; return x - Math.floor(x); };
    let img = null, key = '';
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      const side = Math.min(W * 0.58, H - 16), x0 = 8, y0 = 8;
      const n = Math.round(p.n);
      const pts = Array.from({ length: n }, (_, i) => [rng(i), rng(i + 500)]);
      const k2 = [n, seed, p.el, side].join('|');
      const cell = 2, G = Math.floor(side / cell);
      let owner = null;
      if (k2 !== key) {
        owner = new Int32Array(G * G);
        for (let a = 0; a < G; a++) for (let c = 0; c < G; c++) {
          const u = (c + 0.5) / G, v = (a + 0.5) / G;
          let best = 0, bd = 9;
          for (let i = 0; i < n; i++) {
            /* periódico */
            let dx = Math.abs(u - pts[i][0]); dx = Math.min(dx, 1 - dx);
            let dy = Math.abs(v - pts[i][1]); dy = Math.min(dy, 1 - dy);
            const d = dx * dx / (p.el * p.el) + dy * dy * p.el * p.el;
            if (d < bd) { bd = d; best = i; }
          }
          owner[a * G + c] = best;
        }
        img = owner; key = k2;
      } else owner = img;
      EM.draw.clear(cv);
      for (let a = 0; a < G; a++) for (let c = 0; c < G; c++) {
        const o = owner[a * G + c];
        const edge = (c + 1 < G && owner[a * G + c + 1] !== o) || (a + 1 < G && owner[(a + 1) * G + c] !== o);
        ctx.fillStyle = edge ? EM.col('--ink') : EM.mix(EM.col('--surface'), EM.col('--c4'), 0.1 + 0.25 * rng(o + 900));
        ctx.fillRect(x0 + c * cell, y0 + a * cell, cell, cell);
      }
      /* líneas de prueba y conteo de intersecciones */
      let cross = 0;
      const nl = 6;
      ctx.strokeStyle = EM.alpha('--accent', 0.85); ctx.lineWidth = 1.4;
      for (let k = 0; k < nl; k++) {
        const a = Math.floor(((k + 0.5) / nl) * G);
        ctx.beginPath(); ctx.moveTo(x0, y0 + a * cell + 1); ctx.lineTo(x0 + side, y0 + a * cell + 1); ctx.stroke();
        for (let c = 0; c + 1 < G; c++) if (owner[a * G + c] !== owner[a * G + c + 1]) cross++;
      }
      /* barra de escala */
      const bar = side * 0.25;
      ctx.fillStyle = EM.col('--canvas'); ctx.fillRect(x0 + 6, y0 + side - 24, bar + 60, 20);
      ctx.fillStyle = EM.col('--ink'); ctx.fillRect(x0 + 10, y0 + side - 12, bar, 3);
      EM.text(ctx, EM.si((p.L * 0.25) / 1000, 'm', 2), x0 + 14 + bar, y0 + side - 7, { size: 11 });
      const NA = n / (p.L * p.L);
      const lbar = (nl * p.L) / Math.max(1, cross);
      const G1 = MAT.astmFromNA(NA), G2 = MAT.astmFromL(lbar);
      /* panel derecho: G contra tamaño */
      const pl = new EM.Plot(ctx, { x: W * 0.6, y: 0, w: W * 0.4, h: H, xmin: 0.001, xmax: 1, ymin: -2, ymax: 14, xlog: true, xlabel: 'ℓ̄ (mm)', ylabel: 'G (ASTM)', ml: 44 });
      pl.frame();
      pl.fn((l) => MAT.astmFromL(l), { color: '--ink-3', width: 1.4 });
      pl.dot(lbar, G2, { color: '--accent', label: 'G = ' + EM.fix(G2, 1) });
      sim.set('NA', EM.fix(NA, 1));
      sim.set('G1', EM.fix(G1, 2));
      sim.set('l', EM.fix(lbar * 1000, 1) + ' µm (' + cross + ' cruces en ' + nl + ' líneas)');
      sim.set('G2', EM.fix(G2, 2));
    });
  });
})();
