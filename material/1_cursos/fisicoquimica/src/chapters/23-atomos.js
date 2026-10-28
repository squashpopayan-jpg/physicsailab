/* Capítulo 23 — Átomos */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, A = FQ.atom, Q = FQ.qm, EV = Q.HARTREE_EV;

  /* 23.1 Átomo hidrogenoide: parte radial y orbital en el plano xz */
  EM.defineSim('hidrogeno', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('n', { label: 'Número cuántico principal n', min: 1, max: 5, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.slider('l', { label: 'Número cuántico azimutal l', min: 0, max: 4, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('m', { label: 'Número cuántico magnético m (orbital real: cos mφ o sen mφ)', min: -4, max: 4, step: 1, value: 0, fmt: (v) => v.toFixed(0) });
    sim.slider('Z', { label: 'Carga nuclear Z', min: 1, max: 10, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.out('E', 'Energía <i>E</i> = −<i>Z</i>²/2<i>n</i>² (hartree) · en eV', { hl: true });
    sim.out('r', '⟨<i>r</i>⟩ = [3<i>n</i>² − <i>l</i>(<i>l</i>+1)]/2<i>Z</i> (bohr) · radio más probable · nodos radiales <i>n</i> − <i>l</i> − 1');
    sim.out('deg', 'Degeneración del nivel (2<i>n</i>² con espín) · orbitales con ese <i>l</i>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, n = Math.round(p.n), l = Math.min(Math.round(p.l), n - 1), m = Math.max(-l, Math.min(l, Math.round(p.m))), Z = p.Z;
      EM.draw.clear(cv);
      const rmax = (n * n * 3.2 + 6) / Z, rs = Array.from({ length: 400 }, (_, i) => (rmax * i) / 399);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: rmax, ymin: 0, ymax: Math.max(...rs.map((r) => Math.pow(A.hydR(n, l, Z, r) * r, 2))) * 1.1, xlabel: 'r (bohr)', ylabel: 'P(r) = r²R²(r)', ml: 52, title: 'Densidad radial de probabilidad' });
      pl.frame(); pl.xy(rs, rs.map((r) => Math.pow(A.hydR(n, l, Z, r) * r, 2)), { color: '--c1', width: 2.6, fill: '--c1', fillAlpha: 0.15 });
      pl.vline(A.hydRmean(n, l, Z), { color: '--accent', dash: [4, 3], label: '⟨r⟩' });
      /* mapa del orbital en el plano xz */
      const S = Math.min(W * 0.46, H - 30), x0 = W * 0.52 + (W * 0.48 - S) / 2, y0 = (H - S) / 2, N = 96, R = rmax * 0.8;
      if (!cv._off || cv._off.width !== N) { cv._off = document.createElement('canvas'); cv._off.width = N; cv._off.height = N; }
      const oc = cv._off.getContext('2d'), img = oc.createImageData(N, N), d = img.data, cp = EM.rgb('--c1'), cn = EM.rgb('--c2');
      let mx = 0; const val = new Float64Array(N * N);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = ((i + 0.5) / N * 2 - 1) * R, z = (1 - (j + 0.5) / N * 2) * R, r = Math.hypot(x, z), th = Math.acos(z / (r || 1e-12)), ph = x >= 0 ? 0 : Math.PI; /* plano xz: φ = 0 o π */ const v = A.hydR(n, l, Z, r) * Q.ylmReal(l, m < 0 ? 0 : m, th, ph); val[j * N + i] = m < 0 ? 0 : v; mx = Math.max(mx, Math.abs(v)); }
      for (let q = 0; q < N * N; q++) { const u = val[q] / (mx || 1), a = Math.min(1, Math.pow(Math.abs(u), 0.7)), c = u >= 0 ? cp : cn; d[4 * q] = 255 * (1 - a) + c[0] * a; d[4 * q + 1] = 255 * (1 - a) + c[1] * a; d[4 * q + 2] = 255 * (1 - a) + c[2] * a; d[4 * q + 3] = 255; }
      oc.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(cv._off, x0, y0, S, S); ctx.strokeStyle = EM.col('--axis'); ctx.strokeRect(x0 - 0.5, y0 - 0.5, S + 1, S + 1);
      EM.text(ctx, m < 0 ? 'los orbitales con sen(|m|φ) se anulan en el plano xz: use m ≥ 0' : 'plano xz · signo + (azul) y − (rojo) de la función de onda', x0 + S / 2, y0 + S + 14, { size: 11, align: 'center', color: '--ink-3' });
      const rp = rs[rs.map((r) => Math.pow(A.hydR(n, l, Z, r) * r, 2)).reduce((bi, v, i, a) => (v > a[bi] ? i : bi), 0)];
      sim.set('E', EM.fix(A.hydE(n, Z), 4) + ' Eh · ' + EM.fix(A.hydE(n, Z) * EV, 3) + ' eV');
      sim.set('r', EM.fix(A.hydRmean(n, l, Z), 3) + ' · ' + EM.fix(rp, 2) + ' bohr · ' + (n - l - 1));
      sim.set('deg', 2 * n * n + ' · ' + (2 * l + 1));
    });
  });

  /* 23.2 Helio: método variacional con carga efectiva */
  EM.defineSim('helio', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Z', { label: 'Carga nuclear Z del ion de dos electrones', min: 1, max: 6, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('z', { label: 'Exponente de prueba ζ', min: 0.3, max: 6, step: 0.01, value: 1.2, fmt: (v) => v.toFixed(2) });
    sim.out('E', '<i>E</i>(ζ) = ζ² − 2<i>Z</i>ζ + 5ζ/8 (hartree) · energía del hidrogenoide sin repulsión −<i>Z</i>²', { hl: true });
    sim.out('opt', 'Óptimo variacional ζ = <i>Z</i> − 5/16 · energía mínima · energía exacta (Pekeris)');
    sim.out('ie', 'Energía de ionización variacional · exacta · error de la energía total');
    const NAMES = { 1: 'H⁻', 2: 'He', 3: 'Li⁺', 4: 'Be²⁺', 5: 'B³⁺', 6: 'C⁴⁺' };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Z = Math.round(p.Z), Emin = A.heEmin(Z), Ex = A.HE_EXACT[Z];
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.3, xmax: 6, ymin: Math.min(Ex, Emin) * 1.15, ymax: Math.abs(Math.min(Ex, Emin)) * 0.5, xlabel: 'exponente de prueba ζ', ylabel: 'E(ζ) (hartree)', ml: 60, title: 'Función de prueba ψ = e^{−ζ(r₁+r₂)} para ' + NAMES[Z] });
      pl.frame(); pl.fn((z) => A.heE(z, Z), { color: '--c1', width: 2.8 }); pl.hline(Ex, { color: '--c3', dash: [5, 3], label: 'exacta' }); pl.hline(-Z * Z, { color: '--ink-3', dash: [2, 3], label: 'sin repulsión' });
      pl.dot(A.heZeta(Z), Emin, { color: '--accent', r: 5 }); pl.dot(p.z, A.heE(p.z, Z), { color: '--c2', r: 5 });
      const IEv = -Z * Z / 2 - Emin, IEx = -Z * Z / 2 - Ex;
      sim.set('E', EM.fix(A.heE(p.z, Z), 4) + ' Eh · ' + EM.fix(-Z * Z, 1) + ' Eh');
      sim.set('opt', EM.fix(A.heZeta(Z), 4) + ' · ' + EM.fix(Emin, 4) + ' Eh · ' + EM.fix(Ex, 4) + ' Eh');
      sim.set('ie', EM.fix(IEv * EV, 2) + ' eV' + (IEv < 0 ? ' (negativo: H⁻ no queda ligado con esta función)' : '') + ' · ' + EM.fix(IEx * EV, 2) + ' eV · ' + EM.fix(100 * (Emin - Ex) / Math.abs(Ex), 2) + ' %');
    });
  });

  /* 23.3 Energías de ionización de los elementos 1–18: Slater frente al experimento */
  EM.defineSim('ie-periodo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Z', { label: 'Elemento Z', min: 1, max: 18, step: 1, value: 8, fmt: (v) => v.toFixed(0) });
    sim.out('cfg', 'Configuración · carga nuclear efectiva de Slater Z* del último electrón', { hl: true });
    sim.out('ie', 'Energía de ionización: Slater (E<sub>total</sub> del catión − neutro) · experimento (NIST)');
    const SYM = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Z = Math.round(p.Z), zs = Array.from({ length: 18 }, (_, i) => i + 1);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.5, xmax: 18.5, ymin: 0, ymax: 28, xlabel: 'número atómico Z', ylabel: 'energía de ionización (eV)', ml: 50 });
      pl.frame(); pl.xy(zs, zs.map((z) => A.IE[z - 1]), { color: '--c1', width: 2.6 }); zs.forEach((z) => pl.dot(z, A.IE[z - 1], { color: '--c1', r: 3.5 })); pl.xy(zs, zs.map((z) => A.slaterIE(z)), { color: '--c2', width: 2, dash: [6, 4] });
      zs.forEach((z) => EM.text(ctx, SYM[z - 1], pl.X(z), pl.iy + pl.ih + 14, { size: 10, align: 'center', color: '--ink-3' })); pl.vline(Z, { color: '--accent', dash: [3, 3] });
      pl.legend([{ label: 'experimento (NIST)', color: '--c1' }, { label: 'reglas de Slater', color: '--c2', dash: [6, 4] }], 'tl');
      const cfg = A.config(Z).map(([o, k]) => o + (k > 1 ? k : '')).join(' '), s = A.slaterZ(Z);
      sim.set('cfg', cfg + ' · Z* = ' + EM.fix(s.Zeff, 2));
      sim.set('ie', EM.fix(A.slaterIE(Z), 2) + ' eV · ' + EM.fix(A.IE[Z - 1], 3) + ' eV');
    });
  });

  /* 23.4 Términos de Russell–Saunders */
  EM.defineSim('terminos', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    sim.seg('l', { label: 'Subcapa', options: [[1, 'p'], [2, 'd']], value: 1 });
    sim.slider('n', { label: 'Número de electrones n en la subcapa', min: 1, max: 10, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.out('t', 'Términos permitidos', { hl: true });
    sim.out('h', 'Término fundamental de Hund · microestados totales C(2(2<i>l</i>+1), <i>n</i>) · suma de degeneraciones');
    sim.onDraw(() => {
      const p = sim.p, l = +p.l, n = Math.min(Math.round(p.n), 2 * (2 * l + 1)), ctx = cv.ctx;
      EM.draw.clear(cv);
      const ts = A.terms(l, n), lab = (t) => (2 * t.S + 1) + A.LET[t.L], hd = A.hund(ts), tot = ts.reduce((a, t) => a + t.deg, 0);
      ts.sort((a, b) => b.S - a.S || b.L - a.L);
      const W = cv.w, H = cv.h, bw = Math.min(70, (W - 40) / Math.max(ts.length, 1)), x0 = (W - bw * ts.length) / 2;
      ts.forEach((t, i) => { const h = 20 + t.deg * (H - 90) / Math.max(...ts.map((q) => q.deg)) * 0.8, x = x0 + i * bw; ctx.fillStyle = t === hd ? EM.alpha('--accent', 0.8) : EM.alpha('--c1', 0.55); ctx.fillRect(x + 4, H - 40 - h, bw - 8, h); EM.text(ctx, lab(t), x + bw / 2, H - 22, { size: 13, align: 'center', color: '--ink' }); EM.text(ctx, String(t.deg), x + bw / 2, H - 44 - h, { size: 11, align: 'center', color: '--ink-3' }); });
      EM.text(ctx, 'altura ∝ degeneración (2L+1)(2S+1)', 8, 14, { size: 11, color: '--ink-3' });
      const comb = (a, b) => { let r = 1; for (let i = 1; i <= b; i++) r = (r * (a - b + i)) / i; return Math.round(r); };
      sim.set('t', ts.map(lab).join(', '));
      sim.set('h', lab(hd) + ' · ' + comb(2 * (2 * l + 1), n) + ' · ' + tot);
    });
  });
})();
