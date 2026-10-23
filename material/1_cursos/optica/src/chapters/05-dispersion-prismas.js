/* Capítulo 5 — Dispersión, prismas y arcoíris */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;
  const DEG = Math.PI / 180;
  const nWater = (l) => OP.n('agua', l) / OP.nAir(l / 1000);

  /* Refracción vectorial 2D: d unitario, normal cualquiera; devuelve null si hay reflexión total */
  const refr = (d, nrm, n1, n2) => {
    const L = Math.hypot(nrm[0], nrm[1]);
    let N = [nrm[0] / L, nrm[1] / L], c = -(d[0] * N[0] + d[1] * N[1]);
    if (c < 0) { N = [-N[0], -N[1]]; c = -c; }
    const r = n1 / n2, k = 1 - r * r * (1 - c * c);
    if (k < 0) return null;
    return [r * d[0] + (r * c - Math.sqrt(k)) * N[0], r * d[1] + (r * c - Math.sqrt(k)) * N[1]];
  };
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];

  /* 5.1 Índices de Sellmeier y diagrama de Abbe */
  EM.defineSim('sellmeier', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    const G = [['N-BK7', '--c1'], ['N-K5', '--c3'], ['N-F2', '--c4'], ['N-SF11', '--c2'], ['silica', '--c5'], ['CaF2', '--c6'], ['zafiro', '--gold'], ['agua', '--water'], ['diamante', '--ink']];
    sim.select('g', { label: 'Material destacado', options: G.map(([k]) => [k, OP.SELL[k].name]), value: 'N-BK7' });
    sim.slider('lam', { label: 'Longitud de onda', min: 350, max: 1100, step: 1, value: 589, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('n', 'Índice a esa longitud de onda', { hl: true });
    sim.out('nd', 'n_d (587.6 nm)');
    sim.out('vd', 'Número de Abbe ν_d');
    sim.out('src', 'Fuente de los coeficientes');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 350, xmax: 1100, ymin: 1.3, ymax: 2.0, xlabel: 'λ (nm)', ylabel: 'n' });
      pl.frame();
      pl.band(380, 780, { color: '--gold', alpha: 0.07 });
      for (const [k, l] of [['F', 486.13], ['d', 587.56], ['C', 656.27]]) pl.vline(l, { color: '--ink-3', dash: [2, 4], label: k, labelY: 12 });
      for (const [k, c] of G) { if (k === 'diamante') continue; pl.fn((l) => OP.n(k, l), { color: c, width: k === p.g ? 2.8 : 1.1, alpha: k === p.g ? 1 : 0.55 }); }
      pl.vline(p.lam, { color: '--accent', dash: [] });
      if (p.g !== 'diamante') pl.dot(p.lam, OP.n(p.g, p.lam), { color: '--accent', r: 5 });
      /* diagrama de Abbe */
      const ab = new EM.Plot(ctx, { x: W * 0.6, y: 0, w: W * 0.4, h: H, xmin: -100, xmax: -20, ymin: 1.3, ymax: 1.85, xlabel: 'ν_d (decrece →)', ylabel: 'n_d', xfmt: (v) => EM.fix(-v, 0) });
      ab.frame();
      ab.vline(-50, { color: '--ink-3', label: 'crown | flint', labelY: 12 });
      for (const [k, c] of G) { if (k === 'diamante' || k === 'agua') continue; ab.dot(-OP.abbe(k), OP.n(k, OP.LINES.d), { color: c, r: k === p.g ? 7 : 4.5, label: k === p.g ? k.replace('silica', 'sílice') : null }); }
      sim.set('n', EM.fix(OP.n(p.g, p.lam), 5));
      sim.set('nd', EM.fix(OP.n(p.g, OP.LINES.d), 5));
      sim.set('vd', EM.fix(OP.abbe(p.g), 2));
      sim.set('src', OP.SELL[p.g].src + (p.g === 'diamante' ? ' (fuera de escala: n ≈ 2.42)' : ''));
    });
  });

  /* 5.2 Prisma */
  EM.defineSim('prisma', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('t1', { label: 'Ángulo de incidencia θ₁', min: 0, max: 89, step: 0.1, value: 49.3, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('A', { label: 'Ángulo del prisma A', min: 20, max: 75, step: 0.5, value: 60, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.select('g', { label: 'Vidrio', options: [['N-BK7', 'N-BK7 (crown)'], ['N-F2', 'N-F2 (flint)'], ['N-SF11', 'N-SF11 (flint denso)'], ['silica', 'Sílice fundida']], value: 'N-BK7' });
    sim.check('white', { label: 'Luz blanca (abanico de colores)', value: true });
    sim.out('d', 'Desviación δ (589 nm)', { hl: true });
    sim.out('dmin', 'Desviación mínima y θ₁ correspondiente');
    sim.out('disp', 'Separación angular F–C');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, A = p.A * DEG, t1 = p.t1 * DEG;
      EM.draw.clear(cv);
      const v = D.view({ x: 0, y: 0, w: W * 0.5, h: H }, -1.6, 1.8, -1.1, 1.3);
      const h = 1.1, half = Math.tan(A / 2) * h, apex = [0, 0.75], bl = [-half, apex[1] - h], br = [half, apex[1] - h];
      ctx.beginPath(); [apex, bl, br].forEach((q, i) => { const m = v.map(q); i ? ctx.lineTo(...m) : ctx.moveTo(...m); }); ctx.closePath();
      ctx.fillStyle = EM.alpha('--glass', 0.3); ctx.fill(); ctx.strokeStyle = EM.col('--glass'); ctx.lineWidth = 1.4; ctx.stroke();
      const inN = [Math.cos(-A / 2), Math.sin(-A / 2)], dIn = rot(inN, t1);
      const P0 = [(apex[0] + bl[0]) / 2, (apex[1] + bl[1]) / 2], src = [P0[0] - 2.5 * dIn[0], P0[1] - 2.5 * dIn[1]];
      const nL = [-(apex[1] - bl[1]), apex[0] - bl[0]], nR = [br[1] - apex[1], -(br[0] - apex[0])];
      const hitR = (P, d) => { const ex = br[0] - apex[0], ey = br[1] - apex[1], den = d[0] * ey - d[1] * ex; const s = ((apex[0] - P[0]) * ey - (apex[1] - P[1]) * ex) / den, u = ((apex[0] - P[0]) * d[1] - (apex[1] - P[1]) * d[0]) / den; return s > 0 && u >= 0 && u <= 1 ? [P[0] + s * d[0], P[1] + s * d[1]] : null; };
      const trace = (l) => { const n = OP.n(p.g, l), d1 = refr(dIn, nL, 1, n); if (!d1) return null; const P1 = hitR(P0, d1); if (!P1) return { d1, P1: null }; const d2 = refr(d1, nR, n, 1); return { d1, P1, d2 }; };
      D.ray(ctx, v, [src, P0], { color: EM.isDark() ? '#FFFFFF' : '#222222', width: 2.6 });
      const lams = p.white ? [700, 650, 610, 580, 550, 520, 490, 460, 430, 405] : [589];
      for (const l of lams) {
        const r = trace(l);
        if (!r || !r.P1) continue;
        const col = p.white ? D.lamRay(l, 0.9) : EM.col('--ray');
        D.ray(ctx, v, [P0, r.P1], { color: col, width: 1.3, arrow: false });
        if (r.d2) D.ray(ctx, v, [r.P1, [r.P1[0] + 2.5 * r.d2[0], r.P1[1] + 2.5 * r.d2[1]]], { color: col, width: 2, arrow: false });
        else EM.text(ctx, 'reflexión total', v.X(r.P1[0]) + 8, v.Y(r.P1[1]), { size: 11, color: '--c2', halo: true });
      }
      /* curva de desviación */
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 90, ymin: 0, ymax: 90, xlabel: 'θ₁ (°)', ylabel: 'δ (°)' });
      pl.frame();
      for (const [l, c] of [[656.27, '#D9480F'], [546.07, '#2B8A3E'], [435.83, '#5F3DC4']]) pl.fn((x) => OP.prismDev(OP.n(p.g, l), A, x * DEG) / DEG, { color: c, width: 1.8 });
      const n589 = OP.n(p.g, 589.3), dev = OP.prismDev(n589, A, t1), dmin = OP.prismMin(n589, A);
      if (isFinite(dev)) pl.dot(p.t1, dev / DEG, { color: '--accent', r: 6 });
      pl.hline(dmin / DEG, { color: '--ink-3', label: 'δ_{min}', labelRight: true });
      const tmin = Math.asin(n589 * Math.sin(A / 2));
      sim.set('d', isFinite(dev) ? EM.fix(dev / DEG, 3) + '°' : 'reflexión total en la segunda cara');
      sim.set('dmin', isFinite(dmin) ? EM.fix(dmin / DEG, 3) + '° con θ₁ = ' + EM.fix(tmin / DEG, 2) + '°' : '—');
      const dF = OP.prismDev(OP.n(p.g, 486.13), A, t1), dC = OP.prismDev(OP.n(p.g, 656.27), A, t1);
      sim.set('disp', isFinite(dF) && isFinite(dC) ? EM.fix((dF - dC) / DEG, 3) + '°' : '—');
    });
  });

  /* 5.3 Rayos en una gota */
  EM.defineSim('arcoiris', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('k', { label: 'Reflexiones internas', options: [[1, 'Una (primario)'], [2, 'Dos (secundario)']], value: 1 });
    sim.slider('lam', { label: 'Longitud de onda', min: 400, max: 700, step: 1, value: 650, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('nr', { label: 'Número de rayos', min: 6, max: 40, step: 1, value: 18, fmt: (v) => v.toFixed(0) });
    sim.out('n', 'Índice del agua (relativo al aire)', { hl: true });
    sim.out('th', 'Ángulo de Descartes θ');
    sim.out('ang', 'Ángulo del arco desde el punto antisolar');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, k = +p.k, n = nWater(p.lam);
      EM.draw.clear(cv);
      const v = D.view({ x: 0, y: 0, w: W * 0.52, h: H }, -1.9, 1.6, -1.35, 1.35);
      ctx.fillStyle = EM.alpha('--water', 0.18); ctx.beginPath(); ctx.arc(v.X(0), v.Y(0), v.sx, 0, 7); ctx.fill();
      ctx.strokeStyle = EM.col('--water'); ctx.lineWidth = 1.4; ctx.stroke();
      const col = D.lamRay(p.lam, 0.85), thD = OP.rainbowTh(n, k), bD = Math.sin(thD);
      const traceDrop = (b) => {
        const P0 = [-Math.sqrt(1 - b * b), b];
        let d = refr([1, 0], P0, 1, n), P = P0;
        const pts = [[-1.9, b], P0];
        for (let i = 0; i <= k; i++) {
          const t = -2 * (P[0] * d[0] + P[1] * d[1]);
          P = [P[0] + t * d[0], P[1] + t * d[1]]; pts.push(P);
          if (i < k) { const c = P[0] * d[0] + P[1] * d[1]; d = [d[0] - 2 * c * P[0], d[1] - 2 * c * P[1]]; }
        }
        const dout = refr(d, P, n, 1);
        if (dout) pts.push([P[0] + 1.4 * dout[0], P[1] + 1.4 * dout[1]]);
        return pts;
      };
      for (let i = 1; i <= p.nr; i++) { const b = (i / (p.nr + 1)) * 0.995; D.ray(ctx, v, traceDrop(b), { color: EM.alpha('--ink-3', 0.45), width: 1, arrow: false }); }
      D.ray(ctx, v, traceDrop(bD), { color: col, width: 2.6, arrow: false });
      EM.text(ctx, 'rayo de Descartes', v.X(-1.85), v.Y(bD) - 7, { size: 11, color: '--ink-2', halo: true });
      const pl = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: 1, ymin: k === 1 ? 135 : 225, ymax: k === 1 ? 180 : 270, xlabel: 'parámetro de impacto b/R', ylabel: 'desviación D (°)' });
      pl.frame();
      for (const l of [400, 550, 700]) pl.fn((b) => OP.rainbowD(nWater(l), Math.asin(b), k) / DEG, { color: D.lamRay(l), width: l === 550 ? 1.2 : 1.2, alpha: 0.6 });
      pl.fn((b) => OP.rainbowD(n, Math.asin(b), k) / DEG, { color: col, width: 2.4 });
      pl.dot(bD, OP.rainbowD(n, thD, k) / DEG, { color: '--ink', r: 5 });
      sim.set('n', EM.fix(n, 5));
      sim.set('th', EM.fix(thD / DEG, 2) + '° (b/R = ' + EM.fix(bD, 3) + ')');
      sim.set('ang', EM.fix(OP.rainbowAngle(n, k) / DEG, 3) + '°');
    });
  });

  /* 5.4 El arcoíris en el cielo */
  EM.defineSim('cielo-arcoiris', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.slider('h', { label: 'Altura del Sol sobre el horizonte', min: 0, max: 60, step: 0.5, value: 12, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.check('sec', { label: 'Arco secundario', value: true });
    sim.out('top', 'Altura de la cima del arco primario', { hl: true });
    sim.out('top2', 'Cima del secundario');
    /* perfil de color en función del ángulo al punto antisolar (Descartes + disco solar) */
    let prof = null;
    const build = () => {
      const N = 700, a0 = 30, a1 = 60, out = [];
      const lams = []; for (let l = 400; l <= 700; l += 10) lams.push(l);
      const ang = lams.map((l) => [OP.rainbowAngle(nWater(l), 1) / DEG, OP.rainbowAngle(nWater(l), 2) / DEG]);
      for (let i = 0; i < N; i++) {
        const a = a0 + ((a1 - a0) * i) / (N - 1);
        let X = 0, Y = 0, Z = 0;
        lams.forEach((l, j) => {
          let I = 0;
          /* convolución con el disco solar (radio 0.265°) */
          for (let s = -4; s <= 4; s++) {
            const da = (s / 4) * 0.265, wgt = Math.sqrt(1 - (s / 4) * (s / 4));
            const x1 = ang[j][0] - (a + da), x2 = a + da - ang[j][1];
            if (x1 > 0) I += ((wgt * 0.25) / Math.sqrt(x1 + 0.05)) * Math.exp(-x1 / 2.5);
            if (x2 > 0) I += ((wgt * 0.25 * 0.43) / Math.sqrt(x2 + 0.05)) * Math.exp(-x2 / 2.5);
          }
          const c = OP.cmf(l), S = OP.planck(l * 1e-9, 5772) / OP.planck(550e-9, 5772);
          X += I * S * c[0]; Y += I * S * c[1]; Z += I * S * c[2];
        });
        out.push([X, Y, Z]);
      }
      const ymax = Math.max(...out.map((q) => q[1]));
      prof = { a0, a1, N, rgb: out.map((q) => OP.xyz2srgb(q[0] / ymax, q[1] / ymax, q[2] / ymax)), Y: out.map((q) => q[1] / ymax) };
    };
    sim.onDraw(() => {
      if (!prof) build();
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      const dark = EM.isDark();
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.78);
      sky.addColorStop(0, dark ? '#1C2B44' : '#5C86B8'); sky.addColorStop(1, dark ? '#3A4F6E' : '#A9C3DE');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      const hor = H * 0.78, sc = (H * 0.72) / 60; /* px por grado */
      const cx = W / 2, cy = hor + p.h * sc; /* punto antisolar bajo el horizonte */
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, hor); ctx.clip();
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < prof.N; i++) {
        const a = prof.a0 + ((prof.a1 - prof.a0) * i) / (prof.N - 1);
        if (!p.sec && a > 46) break;
        const Yv = prof.Y[i], c = prof.rgb[i];
        if (Yv < 0.01) continue;
        ctx.strokeStyle = `rgba(${Math.round(255 * c[0])},${Math.round(255 * c[1])},${Math.round(255 * c[2])},${Math.min(0.85, Yv * 1.1)})`;
        ctx.lineWidth = Math.max(1, (((prof.a1 - prof.a0) / prof.N) * sc) + 0.6);
        ctx.beginPath(); ctx.arc(cx, cy, a * sc, Math.PI, 2 * Math.PI); ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = dark ? '#1F3320' : '#5E8C4A'; ctx.fillRect(0, hor, W, H - hor);
      EM.text(ctx, 'punto antisolar a ' + EM.fix(p.h, 1) + '° bajo el horizonte', W - 10, H - 10, { size: 11, color: '#FFFFFF', align: 'right' });
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx, hor - 6, 5, 0, 7); ctx.fill();
      const ap = OP.rainbowAngle(nWater(650), 1) / DEG, as = OP.rainbowAngle(nWater(650), 2) / DEG;
      sim.set('top', ap - p.h > 0 ? EM.fix(ap - p.h, 1) + '° sobre el horizonte' : 'bajo el horizonte (no se ve)');
      sim.set('top2', as - p.h > 0 ? EM.fix(as - p.h, 1) + '°' : 'bajo el horizonte');
    });
  });

  /* 5.5 Halo de 22° */
  EM.defineSim('halo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('A', { label: 'Prisma de hielo', options: [[60, '60° (halo de 22°)'], [90, '90° (halo de 46°)']], value: 60 });
    sim.slider('N', { label: 'Número de cristales simulados', min: 2000, max: 100000, step: 1000, value: 40000, fmt: (v) => v.toFixed(0) });
    sim.out('dmin', 'Desviación mínima (589 nm)', { hl: true });
    sim.out('frac', 'Luz entre δ_min y δ_min + 2°');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, A = +p.A * DEG;
      EM.draw.clear(cv);
      const rng = OP.rng(11), bins = new Float64Array(70), lamsC = [[656, 0], [589, 0], [470, 0]];
      let tot = 0;
      const hist = lamsC.map(() => new Float64Array(70));
      for (let i = 0; i < p.N; i++) {
        const t1 = Math.asin(rng());
        lamsC.forEach(([l], j) => {
          const n = OP.n('hielo', l), dv = OP.prismDev(n, A, t1);
          if (!isFinite(dv)) return;
          const t2 = Math.asin(Math.sin(t1) / n), T1 = OP.fresnel(1, n, t1).T, T2 = OP.fresnel(n, 1, A - t2).T;
          const b = Math.floor(dv / DEG);
          if (b >= 0 && b < 70) { hist[j][b] += T1 * T2; if (j === 1) { bins[b] += T1 * T2; tot += T1 * T2; } }
        });
      }
      const mx = Math.max(...bins);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: 70, ymin: 0, ymax: 1.1, xlabel: 'desviación δ (°)', ylabel: 'luz relativa' });
      pl.frame();
      lamsC.forEach(([l], j) => { const xs = [], ys = []; for (let b = 0; b < 70; b++) { xs.push(b + 0.5); ys.push(hist[j][b] / mx); } pl.xy(xs, ys, { color: D.lamRay(l), width: 1.8 }); });
      const dmin = OP.prismMin(OP.n('hielo', 589), A) / DEG;
      pl.vline(dmin, { color: '--ink-2', label: EM.fix(dmin, 1) + '°' });
      /* esquema del cristal */
      const v = D.view({ x: W * 0.64, y: 10, w: W * 0.34, h: H - 20 }, -1.2, 1.2, -1.2, 1.2);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; const m = v.map([Math.cos(a), Math.sin(a)]); k ? ctx.lineTo(...m) : ctx.moveTo(...m); }
      ctx.closePath(); ctx.fillStyle = EM.alpha('--glass', 0.25); ctx.fill(); ctx.strokeStyle = EM.col('--glass'); ctx.lineWidth = 1.5; ctx.stroke();
      EM.text(ctx, +p.A === 60 ? 'caras alternas: prisma de 60°' : 'cara lateral y base: 90°', v.X(0), v.Y(-1.15), { size: 11, align: 'center', color: '--ink-2' });
      let near = 0; for (let b = Math.floor(dmin); b < Math.floor(dmin) + 2 && b < 70; b++) near += bins[b];
      sim.set('dmin', EM.fix(dmin, 2) + '°');
      sim.set('frac', EM.fix((100 * near) / tot, 1) + ' % de la luz que atraviesa');
    });
  });
})();
