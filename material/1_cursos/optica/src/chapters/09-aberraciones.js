/* Capítulo 9 — Aberraciones */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;
  const DEG = Math.PI / 180;
  const glass = (g) => (l) => OP.n(g, l);
  /* radios de una lente delgada de focal f, índice n y factor de forma q */
  const radii = (f, n, q) => {
    const c1 = (q + 1) / (2 * f * (n - 1)), c2 = (q - 1) / (2 * f * (n - 1));
    return [c1, c2];
  };
  /* doblete cementado acromático de focal f (crown equiconvexo) */
  const doublet = (f, g1, g2, ap) => {
    const ld = OP.LINES.d, n1 = OP.n(g1, ld), n2 = OP.n(g2, ld), ac = OP.achromat(f, OP.abbe(g1), OP.abbe(g2));
    const Ra = 2 * (n1 - 1) * ac.f1, Rb = -Ra;
    const c3 = 1 / Rb - 1 / (ac.f2 * (n2 - 1));
    return [{ z: 0, c: 1 / Ra, n: glass(g1), ap }, { z: 5, c: 1 / Rb, n: glass(g2), ap }, { z: 7.5, c: c3, n: 1, ap }];
  };
  const lsaOf = (sys, h, fz, lam = 587.56) => { const r = OP.traceRay(sys, [0, h, -10], [0, 0, 1], lam); if (r.lost) return NaN; return fz - (r.p[2] - (r.p[1] * r.d[2]) / r.d[1]); };

  /* 9.1 Aberración esférica y factor de forma */
  EM.defineSim('aberracion-esferica', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('q', { label: 'Factor de forma q', min: -2, max: 2, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('h', { label: 'Semiabertura del haz', min: 2, max: 14, step: 0.1, value: 10, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.button('Forma óptima', () => sim.ctl.q.set(+OP.bestShape(OP.n('N-BK7', 587.56), -1).toFixed(3)));
    sim.button('Planoconvexa', () => sim.ctl.q.set(1));
    sim.button('Invertida', () => sim.ctl.q.set(-1));
    sim.out('R', 'Radios (N-BK7, f = 100 mm, 4 mm de espesor)', { hl: true });
    sim.out('lsa', 'LSA del rayo marginal: exacta / tercer orden');
    sim.out('f', 'Focal paraxial real');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, n = OP.n('N-BK7', 587.56), f = 100;
      EM.draw.clear(cv);
      const [c1, c2] = radii(f, n, p.q);
      const sag = (c, y) => (c ? (1 - Math.sqrt(Math.max(0, 1 - c * c * y * y))) / c : 0);
      const ap = 15, t = Math.max(2, 2 + sag(c1, ap) - sag(c2, ap));
      const sys = [{ z: 0, c: c1, n: glass('N-BK7'), ap: ap * 1.05 }, { z: t, c: c2, n: 1, ap: ap * 1.05 }];
      const fz = OP.paraxialFocus(sys, 587.56), cd = OP.cardinal(OP.sysMatrix(sys, 587.56, 1, 0, t));
      const v = D.view({ x: 8, y: 8, w: W * 0.55 - 16, h: H - 16 }, -12, fz + 18, -16, 16, false);
      D.axis(ctx, v);
      D.realLens(ctx, v, 0, t, c1 ? 1 / c1 : Infinity, c2 ? 1 / c2 : Infinity, ap);
      for (let i = -8; i <= 8; i++) {
        if (!i) continue;
        const hh = (i / 8) * p.h, r = OP.traceRay(sys, [0, hh, -12], [0, 0, 1], 587.56);
        if (r.lost) continue;
        const pts = r.path.map((q) => [q[2], q[1]]), te = (fz + 18 - r.p[2]) / r.d[2];
        pts.push([r.p[2] + te * r.d[2], r.p[1] + te * r.d[1]]);
        D.ray(ctx, v, pts, { color: Math.abs(i) === 8 ? '--c2' : '--ray', width: 1.1, arrow: false, alpha: 0.9 });
      }
      D.focus(ctx, v, fz, "F'");
      const pl = new EM.Plot(ctx, { x: W * 0.55, y: 0, w: W * 0.45, h: H, xmin: 0, xmax: 6, ymin: 0, ymax: 14, xlabel: 'LSA (mm)', ylabel: 'altura del rayo h (mm)' });
      pl.frame();
      const hs = [], ex = [], se = [];
      for (let k = 1; k <= 60; k++) { const hh = (k / 60) * 14; hs.push(hh); ex.push(lsaOf(sys, hh, fz)); se.push(f * f * OP.seidelSA(n, f, p.q, -1, hh)); }
      pl.xy(ex, hs, { color: '--accent', width: 2.2 });
      pl.xy(se, hs, { color: '--ink-3', width: 1.4, dash: [5, 4] });
      pl.hline(p.h, { color: '--c2' });
      pl.legend([{ label: 'trazado exacto', color: '--accent' }, { label: 'tercer orden (Seidel)', color: '--ink-3', dash: [5, 4] }], 'br');
      sim.set('R', 'R₁ = ' + (c1 ? EM.fix(1 / c1, 1) : '∞') + ' mm, R₂ = ' + (c2 ? EM.fix(1 / c2, 1) : '∞') + ' mm');
      sim.set('lsa', EM.fix(lsaOf(sys, p.h, fz), 3) + ' mm / ' + EM.fix(f * f * OP.seidelSA(n, f, p.q, -1, p.h), 3) + ' mm');
      sim.set('f', EM.fix(cd.fp, 2) + ' mm');
    });
  });

  /* 9.2 Diagramas de manchas */
  EM.defineSim('spot', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('sys', { label: 'Sistema (f = 100 mm, f/5)', options: [['pc', 'Planoconvexa'], ['inv', 'Invertida'], ['dob', 'Doblete']], value: 'pc' });
    sim.slider('w', { label: 'Ángulo de campo', min: 0, max: 10, step: 0.1, value: 0, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('dz', { label: 'Desplazamiento del plano de enfoque', min: -4, max: 2, step: 0.01, value: 0, unit: 'mm', fmt: (v) => v.toFixed(2) });
    sim.seg('col', { label: 'Luz', options: [['m', '587 nm'], ['w', 'F, d, C']], value: 'm' });
    sim.out('rms', 'Radio cuadrático medio', { hl: true });
    sim.out('airy', 'Radio del disco de Airy (1.22λN)');
    sim.out('pos', 'Plano de enfoque (desde la última superficie)');
    const nb = glass('N-BK7');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, ap = 10;
      EM.draw.clear(cv);
      const sys = p.sys === 'dob' ? doublet(100, 'N-BK7', 'N-F2', ap * 1.3) : p.sys === 'pc' ? OP.singlet(51.68, Infinity, 4, nb, ap * 1.3) : OP.singlet(Infinity, -51.68, 4, nb, ap * 1.3);
      const fz = OP.paraxialFocus(sys, 587.56), zImg = fz + p.dz;
      const lams = p.col === 'w' ? [[486.13, '#1C7ED6'], [587.56, '#E8A317'], [656.27, '#D9480F']] : [[587.56, null]];
      const sets = lams.map(([l, c]) => ({ c, pts: OP.spot(sys, zImg, p.w * DEG, l, 10, ap) }));
      const all = sets.flatMap((s) => s.pts);
      let cx = 0, cy = 0; for (const q of all) { cx += q[0]; cy += q[1]; } cx /= all.length; cy /= all.length;
      let rmax = 0; for (const q of all) rmax = Math.max(rmax, Math.hypot(q[0] - cx, q[1] - cy));
      const airy = 1.22 * 0.58756e-3 * 5; /* mm */
      const half = Math.max(rmax * 1.15, airy * 3);
      const S = Math.min(W * 0.5, H) - 30, ox = 20 + S / 2, oy = H / 2;
      ctx.strokeStyle = EM.col('--grid-2'); ctx.strokeRect(ox - S / 2, oy - S / 2, S, S);
      ctx.beginPath(); ctx.moveTo(ox - S / 2, oy); ctx.lineTo(ox + S / 2, oy); ctx.moveTo(ox, oy - S / 2); ctx.lineTo(ox, oy + S / 2); ctx.stroke();
      ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(ox, oy, (airy / half) * (S / 2), 0, 7); ctx.stroke();
      for (const s of sets) { ctx.fillStyle = s.c || EM.col('--accent'); for (const q of s.pts) { const x = ox + ((q[0] - cx) / half) * (S / 2), y = oy - ((q[1] - cy) / half) * (S / 2); ctx.fillRect(x - 1.3, y - 1.3, 2.6, 2.6); } }
      EM.text(ctx, '±' + EM.fix(half * 1000, 1) + ' µm', ox + S / 2, oy + S / 2 + 14, { size: 11, color: '--ink-3', align: 'right', mono: true });
      /* curva rms frente al enfoque */
      const pl = new EM.Plot(ctx, { x: W * 0.5 + 10, y: 0, w: W * 0.5 - 10, h: H, xmin: -4, xmax: 2, ymin: 0, ymax: 0.12, xlabel: 'desplazamiento del enfoque (mm)', ylabel: 'radio rms (mm)' });
      pl.frame();
      const xs = [], ys = [];
      for (let k = 0; k <= 40; k++) { const dz = -4 + (6 * k) / 40; xs.push(dz); ys.push(OP.rms(OP.spot(sys, fz + dz, p.w * DEG, 587.56, 6, ap))); }
      pl.xy(xs, ys, { color: '--accent', width: 2 });
      pl.hline(airy, { color: '--ink-3', label: 'Airy', labelRight: true });
      pl.dot(p.dz, OP.rms(sets[0].pts), { color: '--c2', r: 5 });
      sim.set('rms', EM.fix(OP.rms(all) * 1000, 2) + ' µm');
      sim.set('airy', EM.fix(airy * 1000, 2) + ' µm');
      sim.set('pos', EM.fix(zImg - sys[sys.length - 1].z, 2) + ' mm');
    });
  });

  /* 9.3 Distorsión según la posición del diafragma */
  EM.defineSim('distorsion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('xs', { label: 'Posición del diafragma (respecto de la lente)', min: -40, max: 40, step: 0.5, value: -25, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.out('d', 'Distorsión a 20° de campo (esquina de la cuadrícula)', { hl: true });
    sim.out('tipo', 'Tipo');
    const nb = glass('N-BK7');
    const sys = OP.singlet(25.84, Infinity, 5, nb, 40);
    const t = 5;
    const fz = OP.paraxialFocus(sys, 587.56), fp = OP.cardinal(OP.sysMatrix(sys, 587.56, 1, 0, t)).fp;
    const chief = (w, xs) => {
      const dir = [0, Math.sin(w), Math.cos(w)];
      if (xs <= 0) {
        const z0 = xs - 30, y0 = Math.tan(w) * (z0 - xs);
        const r = OP.traceRay(sys, [0, y0, z0], dir, 587.56);
        return r.lost ? NaN : OP.rayAt(r, fz)[1];
      }
      /* diafragma detrás: buscar la altura de entrada cuyo rayo pasa por el centro del diafragma */
      const g = (y0) => { const r = OP.traceRay(sys, [0, y0, -30], dir, 587.56); return r.lost ? NaN : OP.rayAt(r, t + xs)[1]; };
      const y0 = OP.bisect(g, -60, 60, 1e-10);
      const r = OP.traceRay(sys, [0, y0, -30], dir, 587.56);
      return r.lost ? NaN : OP.rayAt(r, fz)[1];
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const xs = p.xs > 0 && p.xs < 1 ? 1 : p.xs > -1 && p.xs <= 0 ? -1 : p.xs;
      const ws = [], dist = [];
      for (let k = 1; k <= 25; k++) { const w = k * DEG; const y = chief(w, xs), id = fp * Math.tan(w); ws.push(k); dist.push((100 * (y - id)) / id); }
      const dlim = Math.max(5, ...dist.filter(isFinite).map((x) => Math.abs(x) * 1.1));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 25, ymin: -dlim, ymax: dlim, xlabel: 'ángulo de campo (°)', ylabel: 'distorsión (%)' });
      pl.frame();
      pl.xy(ws, dist, { color: '--accent', width: 2.2 });
      /* cuadrícula deformada */
      const Dr = (rn) => { const w = Math.atan(rn * Math.tan(20 * DEG)) / DEG; if (w <= 1) return (isFinite(dist[0]) ? dist[0] : 0) * w * w / 100; const i = Math.min(23, Math.floor(w) - 1), f = w - (i + 1); const a = dist[i], b = dist[i + 1]; return isFinite(a) && isFinite(b) ? (a + f * (b - a)) / 100 : 0; };
      const S = Math.min(W * 0.46, H - 20), ox = W * 0.75, oy = H / 2;
      ctx.strokeStyle = EM.col('--grid-2'); ctx.strokeRect(ox - S / 2, oy - S / 2, S, S);
      ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 1.2;
      const map = (x, y) => { const r = Math.hypot(x, y) / Math.SQRT2, k = 1 + Dr(Math.min(1, r)); return [ox + (x * k * S) / 2.3, oy - (y * k * S) / 2.3]; };
      for (let i = -5; i <= 5; i++) {
        ctx.beginPath(); for (let j = 0; j <= 40; j++) { const y = -1 + j / 20, q = map(i / 5, y); j ? ctx.lineTo(...q) : ctx.moveTo(...q); } ctx.stroke();
        ctx.beginPath(); for (let j = 0; j <= 40; j++) { const x = -1 + j / 20, q = map(x, i / 5); j ? ctx.lineTo(...q) : ctx.moveTo(...q); } ctx.stroke();
      }
      const d20 = dist[19];
      sim.set('d', EM.fix(d20, 2) + ' %');
      sim.set('tipo', Math.abs(d20) < 0.3 ? 'casi nula' : d20 < 0 ? 'de barril (el aumento disminuye hacia el borde)' : 'de cojín (el aumento crece hacia el borde)');
    });
  });

  /* 9.4 Aberración cromática */
  EM.defineSim('cromatica', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('g1', { label: 'Vidrio crown', options: [['N-BK7', 'N-BK7'], ['N-K5', 'N-K5'], ['CaF2', 'Fluorita CaF₂'], ['silica', 'Sílice']], value: 'N-BK7' });
    sim.select('g2', { label: 'Vidrio flint', options: [['N-F2', 'N-F2'], ['N-SF11', 'N-SF11']], value: 'N-F2' });
    sim.out('el', 'Focales de los elementos (f = 100 mm)', { hl: true });
    sim.out('lca', 'Aberración cromática del singlete (f_C − f_F)');
    sim.out('sec', 'Espectro secundario del acromático');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, f = 100, ld = OP.LINES.d;
      EM.draw.clear(cv);
      const n1 = (l) => OP.n(p.g1, l), n2 = (l) => OP.n(p.g2, l), ac = OP.achromat(f, OP.abbe(p.g1), OP.abbe(p.g2));
      const fs = (l) => f * (n1(ld) - 1) / (n1(l) - 1) - f;
      const fa = (l) => 1 / ((n1(l) - 1) / ((n1(ld) - 1) * ac.f1) + (n2(l) - 1) / ((n2(ld) - 1) * ac.f2)) - f;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 400, xmax: 750, ymin: -2.5, ymax: 2, xlabel: 'λ (nm)', ylabel: 'f(λ) − f(d) (mm)' });
      D.spectrumBar(ctx, { x: pl.ix, y: pl.iy + pl.ih + 1, w: pl.iw, h: 5 }, 400, 750);
      pl.frame();
      for (const [k, l] of [['F', 486.13], ['d', 587.56], ['C', 656.27]]) pl.vline(l, { color: '--ink-3', dash: [2, 4], label: k, labelY: 12 });
      pl.fn(fs, { color: '--c2', width: 2 });
      pl.fn((l) => 10 * fa(l), { color: '--accent', width: 2.4 });
      pl.legend([{ label: 'singlete de crown', color: '--c2' }, { label: 'acromático (× 10)', color: '--accent' }], 'tr');
      let mn = 1e9; for (let l = 450; l <= 680; l += 1) mn = Math.min(mn, fa(l));
      sim.set('el', 'crown ' + EM.fix(ac.f1, 1) + ' mm, flint ' + EM.fix(ac.f2, 1) + ' mm');
      sim.set('lca', EM.fix(fs(656.27) - fs(486.13), 3) + ' mm');
      sim.set('sec', EM.fix(fa(656.27) - mn, 4) + ' mm (' + EM.fix((100 * (fa(656.27) - mn)) / f, 3) + ' % de f)');
    });
  });
})();
