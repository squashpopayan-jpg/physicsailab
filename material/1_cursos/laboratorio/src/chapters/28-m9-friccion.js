/* Práctica M9 · Fricción estática y cinética */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const G = MC.K.gPop;
  const MAT = { fieltro: ['Fieltro sobre madera', 0.45, 0.36], lija: ['Lija fina sobre madera', 0.8, 0.66], carton: ['Cartulina sobre madera', 0.36, 0.28], caucho: ['Caucho sobre madera', 0.9, 0.74], loseta: ['Losetas LEGO sobre losetas', 0.3, 0.21] };
  MC.defineSim('m9-friccion', function (sim) {
    sim.cols2('1.1fr 1.2fr');
    const cs = sim.canvas({ aspect: 1.25, label: 'Plano inclinado o tracción' });
    const cg = sim.canvas({ aspect: 1.1, label: 'Señales' });
    const tab = MC.results(sim, ['Ensayo', 'Material', '<i>m</i> (kg)', 'θ<sub>s</sub> (°)', 'μ<sub>s</sub>', 'μ<sub>k</sub>'], { decimals: [0, 0, 3, 2, 3, 3], title: 'Coeficientes de fricción medidos' });
    const hist = new MC.History(['th', 'fy', 'fz', 'F'], { minDt: 0.01, max: 8000 });
    let tSl = 0, th = 0, s = 0, v = 0, slid = false, thS = NaN, muS = 1, xb = 0, vb = 0, stick = true, trial = 0, last = null;
    sim.group('Superficies');
    sim.select('mat', { options: Object.keys(MAT).map((k) => [k, MAT[k][0]]), value: 'fieltro', reset: true });
    sim.slider('m', { label: 'Masa del trineo', min: 0.2, max: 1.0, step: 0.05, value: 0.35, unit: 'kg', fmt: (q) => MC.fix(q, 2), reset: true });
    sim.group('Método');
    sim.seg('mode', { options: [['incl', 'Inclinar el plano'], ['jalar', 'Tirar con la celda']], value: 'incl', reset: true });
    sim.slider('rate', { label: 'Rapidez de inclinación', min: 0.3, max: 5, step: 0.1, value: 1.5, unit: '°/s', fmt: (q) => MC.fix(q, 1), reset: true });
    sim.slider('V', { label: 'Rapidez de tracción', min: 0.5, max: 10, step: 0.5, value: 2, unit: 'cm/s', fmt: (q) => MC.fix(q, 1), reset: true });
    sim.button('Agregar a la tabla', () => { if (last) { trial++; tab.add([trial, MAT[sim.p.mat][0].split(' ')[0], sim.p.m, last.th, last.mus, last.muk]); } }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('res', 'Resultado del ensayo', { hl: true });
    sim.out('ref', 'Valores típicos (aprox.)');
    sim.out('avg', 'Promedios de la tabla');
    const sync = () => { const inc = sim.p.mode === 'incl'; sim.ctl.rate.show(inc); sim.ctl.V.show(!inc); };
    sim.onChange = sync;
    sim.run({
      h: 1 / 1000, startLabel: 'Iniciar',
      reset() { th = 0; s = 0; v = 0; slid = false; thS = NaN; muS = MAT[sim.p.mat][1] * (1 + M.gauss(0, 0.06)); xb = 0; vb = 0; stick = true; hist.clear(); last = null; },
      step(h) {
        const [, , mk0] = MAT[sim.p.mat];
        const muK = mk0 * (1 + 0.02 * Math.sin(sim.t * 7));
        if (sim.p.mode === 'incl') {
          if (!slid) { th += M.rad(sim.p.rate) * h; if (Math.tan(th) > muS) { slid = true; thS = th; tSl = sim.t; } }
          let fy = G * Math.sin(th), fz = G * Math.cos(th);
          if (slid && s < 0.45) { const a = G * (Math.sin(th) - muK * Math.cos(th)); v += a * h; s += v * h; fy -= a; }
          else if (slid) { /* atajado */ }
          hist.push(sim.t, { th: M.deg(th), fy: fy + M.gauss(0, 0.02), fz: fz + M.gauss(0, 0.02), F: NaN });
          if (slid && s >= 0.45) {
            const T = hist.d.t, ratio = [];
            for (let i = 0; i < T.length; i++) if (T[i] > tSl + 0.05) ratio.push(hist.d.fy[i] / hist.d.fz[i]);
            last = { th: M.deg(thS), mus: Math.tan(thS), muk: M.mean(ratio) };
            sim.end();
          }
          if (sim.t > 60) sim.end();
        } else {
          const kc = 150, m = sim.p.m, Vp = sim.p.V / 100;
          const F = kc * (Vp * sim.t - xb);
          if (stick) { if (F > muS * m * G) { stick = false; } }
          else { const fr = muK * m * G * Math.sign(vb || 1); vb += ((F - fr) / m) * h; if (vb <= 0) { vb = 0; stick = true; muS = MAT[sim.p.mat][1] * (1 + M.gauss(0, 0.04)); } xb += vb * h; }
          hist.push(sim.t, { th: NaN, fy: NaN, fz: NaN, F: F + M.gauss(0, 0.004) });
          if (sim.t > 12) {
            const Fs = hist.d.F, T = hist.d.t, peaks = [], slides = [];
            for (let i = 1; i < Fs.length - 1; i++) { if (Fs[i] > Fs[i - 1] && Fs[i] >= Fs[i + 1] && Fs[i] > 0.5 * MAT[sim.p.mat][1] * m * G) peaks.push(Fs[i]); if (T[i] > 1) slides.push(Fs[i]); }
            const big = peaks.filter((p) => p > M.mean(peaks) * 0.9);
            last = { th: NaN, mus: M.mean(big) / (m * G), muk: M.mean(slides) / (m * G) };
            sim.end();
          }
        }
      },
      timeFmt: (t) => 't = ' + MC.fix(t, 1) + ' s'
    });
    sync();
    sim.onDraw(() => {
      const [nm, ms0, mk0] = MAT[sim.p.mat];
      sim.set('ref', `μs ≈ ${ms0} · μk ≈ ${mk0}`);
      sim.set('res', last ? (isFinite(last.th) ? `θs = ${MC.fix(last.th, 1)}° → μs = ${MC.fix(last.mus, 3)}<br>` : `μs = ${MC.fix(last.mus, 3)}<br>`) + `μk = ${MC.fix(last.muk, 3)}` : 'inicie el ensayo');
      const rows = tab.rows.filter((r) => r[1] === nm.split(' ')[0]);
      if (rows.length >= 2) { const a = rows.map((r) => r[4]), b = rows.map((r) => r[5]); sim.set('avg', `μs = ${L.pm(M.mean(a), M.std(a) / Math.sqrt(a.length))} · μk = ${L.pm(M.mean(b), M.std(b) / Math.sqrt(b.length))} (${rows.length} ensayos)`); }
      else sim.set('avg', 'haga varios ensayos con el mismo material');
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      if (sim.p.mode === 'incl') {
        const x0 = W * 0.08, y0 = H - 30, Lp = W * 0.84;
        D.ground(ctx, 0, y0, W, { depth: 8 });
        const ex = x0 + Lp * Math.cos(th), ey = y0 - Lp * Math.sin(th);
        D.line(ctx, x0, y0, ex, ey, { color: '--wood', width: 8 });
        D.line(ctx, ex, ey, ex, y0, { color: '--ink-3', dash: [4, 3] });
        D.angle(ctx, x0, y0, 50, 0, th, { label: 'θ' });
        const along = 0.75 - s / 0.6;
        const bx = x0 + Lp * along * Math.cos(th), by = y0 - Lp * along * Math.sin(th);
        ctx.save(); ctx.translate(bx, by); ctx.rotate(-th);
        ctx.fillStyle = MC.col('--lego-dkgray'); ctx.fillRect(-40, -14, 80, 10);
        ctx.fillStyle = MC.col('--phone'); ctx.fillRect(-36, -22, 72, 8);
        if (slid && s < 0.45) D.vec(ctx, 0, -40, -40, 0, { color: '--acc', label: 'a', width: 2 });
        ctx.restore();
        MC.text(ctx, `θ = ${MC.fix(M.deg(th), 1)}°`, W - 10, 22, { size: 14, mono: true, align: 'right', color: '--accent', weight: 700 });
      } else {
        const y0 = H * 0.6;
        D.ground(ctx, 0, y0, W);
        const bx = W * 0.25 + xb * W * 2;
        D.block(ctx, bx, y0 - 16, 80, 32, { fill: '--lego-red', label: MC.fix(sim.p.m, 2) + ' kg', size: 11 });
        const cx = W * 0.25 + 60 + (sim.p.V / 100) * sim.t * W * 2;
        D.spring(ctx, bx + 40, y0 - 16, Math.min(W - 40, cx), y0 - 16, { n: 8, amp: 4, color: '--rope' });
        D.module(ctx, Math.min(W - 40, cx), y0 - 34, 36, 36, 'celda', { fill: '--metal', size: 9 });
        MC.text(ctx, stick ? 'adherido' : 'deslizando', bx, y0 + 26, { size: 12, align: 'center', color: stick ? '--c3' : '--c2', weight: 700 });
      }
      const c2 = cg.ctx;
      D.clear(cg);
      const T = hist.d.t, tN = T.length ? T[T.length - 1] : 0;
      if (sim.p.mode === 'incl') {
        const h1 = cg.h * 0.5;
        const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: 0, xmax: Math.max(10, tN), ymin: 0, ymax: 50, xlabel: ['t', 's'], ylabel: ['θ', '°'], mt: 22, title: 'Ángulo calculado con arctan(f_y/f_z)' });
        P.frame(); P.xy(T, hist.d.th, { color: '--accent', width: 1.8 });
        if (isFinite(thS)) P.hline(M.deg(thS), { color: '--c2', label: 'θs' });
        const Q = new MC.Plot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1, xmin: 0, xmax: Math.max(10, tN), ymin: 0, ymax: 10.5, xlabel: ['t', 's'], ylabel: ['f', 'm/s²'], mt: 22, title: 'Acelerómetro: f_y (a lo largo) y f_z (normal)' });
        Q.frame(); Q.xy(T, hist.d.fy, { color: '--ay', width: 1.3 }); Q.xy(T, hist.d.fz, { color: '--az', width: 1.3 });
        Q.legend([{ label: 'f_y', color: '--ay' }, { label: 'f_z', color: '--az' }], 'tl');
      } else {
        const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: cg.h, xmin: 0, xmax: 12, ymin: 0, ymax: Math.max(1, MAT[sim.p.mat][1] * sim.p.m * G * 1.4), xlabel: ['t', 's'], ylabel: ['F', 'N'], mt: 22, title: 'Fuerza en la celda de carga' });
        P.frame(); P.xy(T, hist.d.F, { color: '--force', width: 1.4 });
        P.hline(MAT[sim.p.mat][1] * sim.p.m * G, { color: '--c2', label: 'μs m g' });
        P.hline(MAT[sim.p.mat][2] * sim.p.m * G, { color: '--c3', label: 'μk m g', below: true });
      }
    });
  });
})();
