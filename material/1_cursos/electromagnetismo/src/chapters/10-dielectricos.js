/* Capítulo 10 — Dieléctricos */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K;
  const rad = M.rad, deg = M.deg;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);
  const langevin = (a) => (Math.abs(a) < 1e-4 ? a / 3 : 1 / Math.tanh(a) - 1 / a);

  /* ======================================================================
     10.1 Polarización molecular (Monte Carlo de Metropolis en 3D)
     ====================================================================== */
  EM.defineSim('molecular-polarization', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1 });
    const cp = sim.canvas({ aspect: 1 });
    sim.group('Tipo de molécula');
    sim.seg('kind', { options: [['polar', 'Polares (p₀ del agua)'], ['non', 'No polares']], value: 'polar' });
    sim.group('Condiciones');
    sim.slider('E', { label: 'Campo aplicado <i>E</i>', min: 0, max: 3000, step: 10, value: 1200, unit: 'MV/m', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura <i>T</i>', min: 30, max: 600, step: 5, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.note('Los campos de este control son enormes a propósito: con campos de laboratorio (≈ MV/m) el alineamiento sería de una parte en mil.');
    sim.out('a', '<i>a</i> = <i>p</i><sub>0</sub><i>E</i>/<i>k<sub>B</sub>T</i>');
    sim.out('m', '⟨cos θ⟩ simulado', { hl: true });
    sim.out('L', 'Langevin 𝓛(<i>a</i>)');
    const p0 = 6.2e-30;
    const N = 11 * 9;
    const mol = [];
    for (let i = 0; i < N; i++) {
      const z = 2 * Math.random() - 1, f = 2 * Math.PI * Math.random(), s = Math.sqrt(1 - z * z);
      mol.push([s * Math.cos(f), s * Math.sin(f), z]);
    }
    let avg = 0, lastA = null;
    const gauss = () => { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const aval = () => (p0 * sim.p.E * 1e6) / (K.kB * sim.p.T);
    const sweep = (a) => {
      for (const u of mol) {
        /* perturbación isótropa: propuesta simétrica */
        const v = [u[0] + 0.35 * gauss(), u[1] + 0.35 * gauss(), u[2] + 0.35 * gauss()];
        const n = Math.hypot(...v);
        v[0] /= n; v[1] /= n; v[2] /= n;
        /* campo según +x: energía −a cos θ con cos θ = u_x */
        if (Math.random() < Math.exp(a * (v[0] - u[0]))) { u[0] = v[0]; u[1] = v[1]; u[2] = v[2]; }
      }
      return mol.reduce((s2, u) => s2 + u[0], 0) / N;
    };
    const equil = () => { const a = aval(); let m = 0; for (let k = 0; k < 120; k++) m = sweep(a); avg = m; lastA = a; };
    equil();
    sim.onChange = () => { if (Math.abs(aval() - lastA) > 1e-9) equil(); };
    sim.animate(() => {
      const a = aval();
      let m = 0;
      for (let k = 0; k < 4; k++) m = sweep(a);
      avg += 0.04 * (m - avg);
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      EM.draw.clear(cv);
      const a = aval();
      /* líneas de campo aplicado */
      for (let j = 1; j < 8; j++) {
        const y = (h * j) / 8;
        ctx.strokeStyle = EM.alpha('--efield', 0.25);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(w - 6, y); ctx.stroke();
      }
      EM.draw.arrow(ctx, w - 70, 16, w - 16, 16, { color: '--efield', width: 2.2, head: 9 });
      EM.text(ctx, 'E', w - 82, 20, { size: 14, weight: 700, family: EM.FONT_MATH, color: '--efield' });
      const cols = 11, rows = 9, sx = w / (cols + 0.5), sy = h / (rows + 0.5);
      const L = Math.min(sx, sy) * 0.36;
      mol.forEach((u, i) => {
        const cx = sx * (0.75 + (i % cols)), cy = sy * (0.75 + Math.floor(i / cols));
        if (sim.p.kind === 'polar') {
          const dx = u[0] * L, dy = -u[1] * L;
          ctx.strokeStyle = EM.col('--ink-2');
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(cx - dx, cy - dy); ctx.lineTo(cx + dx, cy + dy); ctx.stroke();
          const r = 3.2 + 1.2 * u[2];
          ctx.fillStyle = EM.col('--pos'); ctx.beginPath(); ctx.arc(cx + dx, cy + dy, Math.max(1.8, r), 0, 7); ctx.fill();
          ctx.fillStyle = EM.col('--neg'); ctx.beginPath(); ctx.arc(cx - dx, cy - dy, Math.max(1.8, 3.2 - 1.2 * u[2]), 0, 7); ctx.fill();
        } else {
          /* nube electrónica desplazada contra el campo */
          const d = Math.min(L * 0.8, (sim.p.E / 3000) * L * 0.8);
          ctx.fillStyle = EM.alpha('--neg', 0.28);
          ctx.beginPath(); ctx.arc(cx - d, cy, L * 0.85, 0, 7); ctx.fill();
          ctx.fillStyle = EM.col('--pos');
          ctx.beginPath(); ctx.arc(cx, cy, 2.6, 0, 7); ctx.fill();
        }
      });
      /* gráfica de Langevin */
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 10, ymin: 0, ymax: 1.05, xlabel: 'a = p₀E / k_{B}T', ylabel: '⟨cos θ⟩', title: 'Alineamiento medio' });
      pl.frame();
      if (sim.p.kind === 'polar') {
        pl.fn((x) => x / 3, { color: '--ink-3', width: 1.4, dash: [5, 4], to: 3.15 });
        pl.fn(langevin, { color: '--c1', width: 2.4 });
        pl.hline(1, { color: '--ink-3', dash: [2, 3], label: 'saturación' });
        const m = avg;
        pl.dot(Math.min(a, 10), m, { color: '--accent', r: 5.5, label: 'simulación' });
        pl.legend([{ label: '𝓛(a) = coth a − 1/a', color: '--c1' }, { label: 'a/3 (campo débil)', color: '--ink-3', dash: [5, 4] }], 'br');
        sim.set('a', f3(a));
        sim.set('m', f3(m));
        sim.set('L', f3(langevin(a)));
      } else {
        pl.label(1, 0.6, 'Polarización inducida: p = αE,', { color: '--ink-2' });
        pl.label(1, 0.52, 'lineal e independiente de T', { color: '--ink-2' });
        sim.set('a', '—');
        sim.set('m', '—');
        sim.set('L', '—');
      }
    });
  });

  /* ======================================================================
     10.2 Condensador con lámina dieléctrica
     ====================================================================== */
  EM.defineSim('capacitor-dielectric', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.group('Disposición');
    sim.seg('geo', { options: [['par', 'Lámina lateral'], ['ser', 'Lámina horizontal']], value: 'par' });
    sim.slider('x', { label: 'Fracción ocupada (ancho o espesor)', min: 0, max: 1, step: 0.01, value: 0.5, fmt: f2 });
    sim.slider('k', { label: 'Constante dieléctrica <i>κ</i>', min: 1, max: 10, step: 0.1, value: 4, fmt: (v) => EM.fix(v, 1) });
    sim.group('Circuito');
    sim.seg('mode', { options: [['V', 'Batería conectada'], ['Q', 'Aislado']], value: 'V' });
    sim.slider('V0', { label: 'Tensión de la batería (carga inicial sin dieléctrico)', min: 10, max: 500, step: 10, value: 200, unit: 'V', fmt: (v) => v.toFixed(0) });
    sim.note('Placas de 10 cm × 10 cm separadas 5 mm.');
    sim.out('C', '<i>C</i>', { hl: true });
    sim.out('Q', '<i>Q</i>');
    sim.out('V', '<i>V</i>');
    sim.out('E1', '<i>E</i> en el vacío');
    sim.out('E2', '<i>E</i> en el dieléctrico');
    sim.out('sf', 'σ libre (vacío / dieléctrico)');
    sim.out('sb', 'σ ligada en la lámina');
    sim.out('U', 'Energía <i>U</i>');
    sim.out('F', 'Fuerza que tira de la lámina');
    const W = 0.1, wdep = 0.1, d = 5e-3, A = W * wdep;
    const calc = (p) => {
      const C0 = (K.eps0 * A) / d, k = p.k, x = p.x;
      let C;
      if (p.geo === 'par') C = C0 * (1 - x + k * x);
      else C = (K.eps0 * A) / (d * (1 - x) + (d * x) / k);
      const Q0 = C0 * p.V0;
      let Q, V;
      if (p.mode === 'V') { V = p.V0; Q = C * V; } else { Q = Q0; V = Q / C; }
      let E1, E2, sf1, sf2, sb;
      if (p.geo === 'par') { E1 = V / d; E2 = V / d; sf1 = K.eps0 * E1; sf2 = k * K.eps0 * E2; sb = (k - 1) * K.eps0 * E2; }
      else { const D = Q / A; sf1 = D; sf2 = D; E1 = D / K.eps0; E2 = D / (k * K.eps0); sb = D * (1 - 1 / k); }
      const U = (Q * Q) / (2 * C);
      let F = 0;
      if (p.geo === 'par') { const dCdx = (K.eps0 * wdep * (k - 1)) / d; F = 0.5 * V * V * dCdx; }
      return { C, Q, V, E1, E2, sf1, sf2, sb, U, F };
    };
    sim.onDraw(() => {
      const p = sim.p, r = calc(p);
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const x0 = w * 0.2, x1 = w * 0.82, gap = h * 0.44, yt = h * 0.26, yb = yt + gap;
      /* dieléctrico */
      let dx0, dx1, dy0, dy1;
      if (p.geo === 'par') { dx0 = x1 - (x1 - x0) * p.x; dx1 = x1 + (p.x > 0 ? 0 : 0); dy0 = yt; dy1 = yb; if (p.x > 0) dx1 = Math.min(w - 8, x1 + (x1 - x0) * 0.02); }
      else { dx0 = x0; dx1 = x1; dy1 = yb; dy0 = yb - gap * p.x; }
      if (p.x > 0) {
        ctx.fillStyle = EM.alpha('--c3', 0.16 + 0.02 * p.k);
        ctx.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
        ctx.strokeStyle = EM.alpha('--c3', 0.8);
        ctx.lineWidth = 1.2;
        ctx.strokeRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
        /* dipolos moleculares */
        for (let yy = dy0 + 12; yy < dy1 - 6; yy += 18) for (let xx = dx0 + 10; xx < dx1 - 6; xx += 20) {
          ctx.strokeStyle = EM.alpha('--c3', 0.8); ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(xx, yy - 4); ctx.lineTo(xx, yy + 4); ctx.stroke();
          ctx.fillStyle = EM.col('--neg'); ctx.beginPath(); ctx.arc(xx, yy - 5, 1.8, 0, 7); ctx.fill();
          ctx.fillStyle = EM.col('--pos'); ctx.beginPath(); ctx.arc(xx, yy + 5, 1.8, 0, 7); ctx.fill();
        }
        /* cargas ligadas en caras superior e inferior de la lámina */
        const nb = Math.round(((dx1 - dx0) / 16) * Math.min(1, r.sb / (r.sf2 || 1)));
        for (let i = 0; i < nb; i++) {
          const xx = dx0 + ((i + 0.5) * (dx1 - dx0)) / nb;
          EM.text(ctx, '−', xx, dy0 + 9, { size: 11, weight: 700, color: '--neg', align: 'center', baseline: 'middle' });
          EM.text(ctx, '+', xx, dy1 - 7, { size: 11, weight: 700, color: '--pos', align: 'center', baseline: 'middle' });
        }
        EM.text(ctx, 'κ = ' + EM.fix(p.k, 1), (dx0 + dx1) / 2, (dy0 + dy1) / 2, { size: 12, mono: true, color: '--c3', halo: true, align: 'center', baseline: 'middle' });
      }
      /* placas y carga libre */
      ctx.fillStyle = EM.col('--pos'); ctx.fillRect(x0, yt - 8, x1 - x0, 8);
      ctx.fillStyle = EM.col('--neg'); ctx.fillRect(x0, yb, x1 - x0, 8);
      const smax = Math.max(r.sf1, r.sf2);
      const signs = (xa, xb, s) => { const n = Math.max(1, Math.round(((xb - xa) / 14) * (s / smax))); for (let i = 0; i < n; i++) { const xx = xa + ((i + 0.5) * (xb - xa)) / n; EM.text(ctx, '+', xx, yt - 14, { size: 12, weight: 700, color: '--pos', align: 'center' }); EM.text(ctx, '−', xx, yb + 22, { size: 12, weight: 700, color: '--neg', align: 'center' }); } };
      if (p.geo === 'par') { signs(x0, Math.max(x0, x1 - (x1 - x0) * p.x), r.sf1); if (p.x > 0) signs(x1 - (x1 - x0) * p.x, x1, r.sf2); }
      else signs(x0, x1, r.sf1);
      /* líneas de E: densidad ∝ E */
      const Emax = Math.max(r.E1, r.E2);
      const drawE = (xa, xb, ya, yb2, E) => { const n = Math.max(1, Math.round(((xb - xa) / 22) * (E / Emax))); for (let i = 0; i < n; i++) { const xx = xa + ((i + 0.5) * (xb - xa)) / n; EM.draw.arrow(ctx, xx, ya + 3, xx, yb2 - 3, { color: '--efield', width: 1.3, head: 6, alpha: 0.85 }); } };
      if (p.geo === 'par') { const xs = x1 - (x1 - x0) * p.x; if (xs > x0 + 4) drawE(x0, xs, yt, yb, r.E1); if (p.x > 0) drawE(xs, x1, yt, yb, r.E2); }
      else { const ys = yb - gap * p.x; if (ys > yt + 4) drawE(x0, x1, yt, ys, r.E1); if (p.x > 0) drawE(x0, x1, ys, yb, r.E2); }
      /* circuito */
      const bx = w * 0.08;
      if (p.mode === 'V') {
        EM.ckt.wire(ctx, [[x0, yt - 4], [bx, yt - 4], [bx, (yt + yb) / 2 - 18]]);
        EM.ckt.wire(ctx, [[x0, yb + 4], [bx, yb + 4], [bx, (yt + yb) / 2 + 18]]);
        EM.ckt.battery(ctx, bx, (yt + yb) / 2 + 18, bx, (yt + yb) / 2 - 18, { label: p.V0 + ' V', labelSide: 1, labelOff: 22 });
      } else EM.text(ctx, 'aislado', bx - 4, (yt + yb) / 2, { size: 12, color: '--ink-2', baseline: 'middle' });
      if (p.geo === 'par' && r.F > 0 && p.x < 1) EM.draw.arrow(ctx, x1 + 30, (yt + yb) / 2, x1 + 6, (yt + yb) / 2, { color: '--accent', width: 3, head: 11 });
      sim.set('C', EM.si(r.C, 'F'));
      sim.set('Q', EM.si(r.Q, 'C'));
      sim.set('V', EM.si(r.V, 'V'));
      sim.set('E1', p.geo === 'ser' && p.x >= 1 ? '—' : EM.si(r.E1, 'V/m'));
      sim.set('E2', p.x > 0 ? EM.si(r.E2, 'V/m') : '—');
      sim.set('sf', EM.si(r.sf1, 'C/m²') + ' / ' + EM.si(r.sf2, 'C/m²'));
      sim.set('sb', p.x > 0 ? EM.si(r.sb, 'C/m²') : '—');
      sim.set('U', EM.si(r.U, 'J'));
      sim.set('F', p.geo === 'par' ? (p.mode === 'V' ? EM.si(r.F, 'N') : EM.si(0.5 * (r.Q / r.C) ** 2 * ((K.eps0 * wdep * (p.k - 1)) / d), 'N')) : '— (simétrica)');
    });
  });

  /* ======================================================================
     10.3 Refracción de líneas de campo
     ====================================================================== */
  EM.defineSim('field-refraction', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    sim.group('Medios');
    sim.slider('e1', { label: '<i>ε</i><sub>r1</sub> (arriba)', min: 1, max: 10, step: 0.1, value: 1, fmt: (v) => EM.fix(v, 1) });
    sim.slider('e2', { label: '<i>ε</i><sub>r2</sub> (abajo)', min: 1, max: 10, step: 0.1, value: 4, fmt: (v) => EM.fix(v, 1) });
    sim.group('Campo en el medio 1');
    sim.slider('th', { label: 'Ángulo <i>θ</i><sub>1</sub> con la normal', min: 0, max: 85, step: 1, value: 35, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.slider('E', { label: 'Magnitud <i>E</i><sub>1</sub>', min: 100, max: 2000, step: 50, value: 1000, unit: 'V/m', fmt: (v) => v.toFixed(0) });
    sim.seg('show', { label: 'Líneas de', options: [['E', 'E'], ['D', 'D']], value: 'E' });
    sim.out('th2', '<i>θ</i><sub>2</sub>', { hl: true });
    sim.out('E2', '<i>E</i><sub>2</sub>');
    sim.out('D', '<i>D<sub>n</sub></i> (continuo)');
    sim.out('Et', '<i>E<sub>t</sub></i> (continuo)');
    sim.out('sb', 'σ ligada en la frontera');
    sim.onDraw(() => {
      const p = sim.p;
      const th1 = rad(p.th);
      const E1t = p.E * Math.sin(th1), E1n = p.E * Math.cos(th1);
      const E2t = E1t, E2n = (p.e1 * E1n) / p.e2;
      const th2 = Math.atan2(E2t, E2n);
      const E2 = Math.hypot(E2t, E2n);
      /* componentes verticales (hacia abajo negativas) */
      const P1z = -K.eps0 * (p.e1 - 1) * E1n, P2z = -K.eps0 * (p.e2 - 1) * E2n;
      const sb = P2z - P1z; /* normal hacia arriba (de 2 a 1) */
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h, yi = h * 0.5;
      ctx.fillStyle = EM.alpha('--c1', 0.04 + 0.025 * p.e1); ctx.fillRect(0, 0, w, yi);
      ctx.fillStyle = EM.alpha('--c3', 0.04 + 0.025 * p.e2); ctx.fillRect(0, yi, w, h - yi);
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, yi); ctx.lineTo(w, yi); ctx.stroke();
      EM.text(ctx, 'medio 1: ε_{r} = ' + EM.fix(p.e1, 1), 12, 20, { size: 12, color: '--ink-2', mono: true });
      EM.text(ctx, 'medio 2: ε_{r} = ' + EM.fix(p.e2, 1), 12, h - 12, { size: 12, color: '--ink-2', mono: true });
      /* líneas: separación horizontal en la frontera */
      const useD = p.show === 'D';
      const col = useD ? '--c5' : '--efield';
      const base = 44;
      /* densidad: E-lines ∝ E_n ... usamos igual espaciado horizontal en la interfaz para D (D_n continuo) */
      const sp1 = base, sp2 = useD ? base : (base * E1n) / E2n;
      /* direcciones del campo en coordenadas del lienzo (y hacia abajo) */
      const d1 = [Math.sin(th1), Math.cos(th1)], d2 = [Math.sin(th2), Math.cos(th2)];
      const L1 = yi / Math.max(0.05, d1[1]), L2 = (h - yi) / Math.max(0.05, d2[1]);
      ctx.strokeStyle = EM.col(col);
      ctx.lineWidth = 1.6;
      for (let x = -w * 3; x < w * 4; x += sp1) {
        ctx.beginPath(); ctx.moveTo(x - d1[0] * L1, yi - d1[1] * L1); ctx.lineTo(x, yi); ctx.stroke();
        const mx = x - d1[0] * L1 * 0.5, my = yi - d1[1] * L1 * 0.5;
        if (mx > 8 && mx < w - 8) EM.draw.arrow(ctx, mx - d1[0] * 4, my - d1[1] * 4, mx + d1[0] * 4, my + d1[1] * 4, { color: col, width: 1.6, head: 8 });
      }
      for (let x = -w * 3; x < w * 4; x += sp2) {
        ctx.beginPath(); ctx.moveTo(x, yi); ctx.lineTo(x + d2[0] * L2, yi + d2[1] * L2); ctx.stroke();
        const mx = x + d2[0] * L2 * 0.5, my = yi + d2[1] * L2 * 0.5;
        if (mx > 8 && mx < w - 8) EM.draw.arrow(ctx, mx - d2[0] * 4, my - d2[1] * 4, mx + d2[0] * 4, my + d2[1] * 4, { color: col, width: 1.6, head: 8 });
      }
      /* normal y ángulos en el centro */
      const cx = w * 0.5;
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx, yi - 110); ctx.lineTo(cx, yi + 110); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(cx - d1[0] * 100, yi - d1[1] * 100); ctx.lineTo(cx, yi); ctx.lineTo(cx + d2[0] * 100, yi + d2[1] * 100); ctx.stroke();
      ctx.lineWidth = 1.4; ctx.strokeStyle = EM.col('--accent');
      ctx.beginPath(); ctx.arc(cx, yi, 46, -Math.PI / 2 - th1, -Math.PI / 2, false); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, yi, 46, Math.PI / 2 - th2, Math.PI / 2, false); ctx.stroke();
      EM.text(ctx, 'θ₁', cx - 60 * Math.sin(th1 / 2) - 6, yi - 60 * Math.cos(th1 / 2), { size: 13, italic: true, family: EM.FONT_MATH, color: '--accent', halo: true, align: 'center', baseline: 'middle' });
      EM.text(ctx, 'θ₂', cx + 60 * Math.sin(th2 / 2) + 6, yi + 60 * Math.cos(th2 / 2), { size: 13, italic: true, family: EM.FONT_MATH, color: '--accent', halo: true, align: 'center', baseline: 'middle' });
      /* carga ligada */
      if (Math.abs(sb) > 1e-15) {
        for (let x = 20; x < w; x += 26) EM.text(ctx, sb > 0 ? '+' : '−', x, yi + (sb > 0 ? -7 : 11), { size: 11, weight: 700, color: sb > 0 ? '--pos' : '--neg', align: 'center' });
      }
      sim.set('th2', EM.fix(deg(th2), 2) + '°');
      sim.set('E2', EM.fix(E2, 1) + ' V/m');
      sim.set('D', EM.si(K.eps0 * p.e1 * E1n, 'C/m²'));
      sim.set('Et', EM.fix(E1t, 1) + ' V/m');
      sim.set('sb', EM.si(sb, 'C/m²'));
    });
  });

  /* ======================================================================
     10.4 Esfera dieléctrica en campo uniforme
     ====================================================================== */
  EM.defineSim('dielectric-sphere', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    const view = new EM.View2D(cv, { xmin: -3.2, xmax: 3.2, ymin: -2.3, ymax: 2.3 });
    sim.group('Material');
    sim.slider('er', { label: 'Permitividad relativa <i>ε<sub>r</sub></i>', min: 1, max: 200, value: 5, log: true, step: 0.1, fmt: (v) => EM.fix(v, 1) });
    sim.group('Representación');
    sim.check('D', { label: 'Líneas de <b>D</b> (continuas)', value: true });
    sim.check('Ev', { label: 'Flechas de <b>E</b> (longitud ∝ |<b>E</b>|)', value: true });
    sim.out('Ein', '<i>E</i><sub>int</sub> / <i>E</i><sub>0</sub> = 3/(<i>ε<sub>r</sub></i>+2)', { hl: true });
    sim.out('Din', '<i>D</i><sub>int</sub> / <i>D</i><sub>0</sub>');
    sim.out('P', '<i>P</i> / (<i>ε</i><sub>0</sub><i>E</i><sub>0</sub>)');
    sim.out('b', 'Factor dipolar (<i>ε<sub>r</sub></i>−1)/(<i>ε<sub>r</sub></i>+2)');
    sim.legend([{ color: '--c5', label: 'líneas de <b>D</b>' }, { color: '--efield', label: 'vectores <b>E</b>' }, { color: '--pos', label: 'σ<sub>b</sub> > 0', kind: 'sq' }, { color: '--neg', label: 'σ<sub>b</sub> < 0', kind: 'sq' }]);
    sim.onDraw(() => {
      const er = sim.p.er, beta = (er - 1) / (er + 2);
      /* campo E (E0 = 1, R = 1, eje z vertical) */
      const E = (x, z) => {
        const r2 = x * x + z * z;
        if (r2 < 1) return [0, 1 - beta];
        const r = Math.sqrt(r2), r5 = r2 * r2 * r;
        return [(beta * 3 * z * x) / r5, 1 + (beta * 3 * z * z) / r5 - beta / (r2 * r)];
      };
      const Dv = (x, z) => { const e = E(x, z); const k = x * x + z * z < 1 ? er : 1; return [k * e[0], k * e[1]]; };
      view.update();
      EM.draw.clear(cv);
      view.grid({ labels: false });
      const ctx = cv.ctx;
      const cx = view.X(0), cy = view.Y(0), R = view.s;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fillStyle = EM.alpha('--c3', 0.12 + Math.min(0.25, Math.log10(er) * 0.12)); ctx.fill();
      if (sim.p.D) {
        const B = [view.x0 - 0.1, view.x1 + 0.1, view.y0 - 0.1, view.y1 + 0.1];
        for (let i = 0; i < 27; i++) {
          const x0 = view.x0 + ((i + 0.5) * (view.x1 - view.x0)) / 27;
          const L = EM.field.trace(Dv, x0, view.y0 + 0.01, 1, { ds: 0.015, maxSteps: 1400, bounds: B });
          EM.field.drawLine(view, L, { color: '--c5', width: 1.2, arrowFirst: 40, arrowGap: 160 });
        }
      }
      if (sim.p.Ev) EM.field.arrows(view, E, { spacing: 30, mode: 'len', ref: 1.6, maxLen: 26, color: '--efield', width: 1.3 });
      for (let i = 0; i < 180; i++) {
        const t0 = (i / 180) * 2 * Math.PI, t1 = ((i + 1) / 180) * 2 * Math.PI, tm = (t0 + t1) / 2;
        ctx.beginPath(); ctx.arc(cx, cy, R + 2.5, -t0, -t1, true);
        ctx.strokeStyle = EM.rgbStr(EM.cmap.diverging(Math.sin(tm) * Math.min(1, beta * 1.2)));
        ctx.lineWidth = 5; ctx.stroke();
      }
      EM.draw.arrow(ctx, 22, cv.h - 20, 22, cv.h - 80, { color: '--efield', width: 2.4, head: 10 });
      EM.text(ctx, 'E₀', 32, cv.h - 60, { size: 13, weight: 700, family: EM.FONT_MATH, color: '--efield', halo: true });
      sim.set('Ein', f3(1 - beta));
      sim.set('Din', f3(er * (1 - beta)));
      sim.set('P', f3(3 * beta));
      sim.set('b', f3(beta));
    });
  });
})();
