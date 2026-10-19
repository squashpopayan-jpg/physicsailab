/* Capítulo 21 — Distribución de Boltzmann y función de partición */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;

  /* 21.1 Sistema de dos niveles */
  EM.defineSim('dos-niveles', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('t', { label: 'Temperatura reducida <i>k<sub>B</sub>T</i>/Δ', min: 0.02, max: 4, step: 0.005, value: 0.417, log: true, fmt: (v) => v.toFixed(3) });
    sim.out('p', 'Población del nivel superior', { hl: true });
    sim.out('u', 'Energía media <i>U</i>/(<i>N</i>Δ)');
    sim.out('c', 'Capacidad calorífica <i>C</i>/(<i>Nk<sub>B</sub></i>)');
    sim.out('s', 'Entropía <i>S</i>/(<i>Nk<sub>B</sub></i>)');
    const pu = (t) => 1 / (Math.exp(1 / t) + 1);
    const S = (t) => { const p = pu(t), q = 1 - p; return -(p > 0 ? p * Math.log(p) : 0) - (q > 0 ? q * Math.log(q) : 0); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.72, h: H, xmin: 0.02, xmax: 4, xlog: true, ymin: 0, ymax: 0.75, xlabel: 'k_BT/Δ', ylabel: 'por partícula' });
      pl.frame();
      pl.fn(pu, { color: '--c1', width: 2.2 });
      pl.fn(TH.schottky, { color: '--accent', width: 2.6 });
      pl.fn(S, { color: '--c3', width: 2.2 });
      pl.hline(Math.log(2), { color: '--c3', label: 'ln 2', labelRight: true });
      pl.vline(p.t, { color: '--ink-3' });
      pl.legend([{ label: 'población superior = U/(NΔ)', color: '--c1' }, { label: 'C/(Nk_B): Schottky', color: '--accent' }, { label: 'S/(Nk_B)', color: '--c3' }], 'tl');
      /* diagrama de niveles */
      const x0 = W * 0.78, x1 = W * 0.96, y0 = H * 0.75, y1 = H * 0.25, up = pu(p.t);
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2;
      for (const y of [y0, y1]) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
      const nd = 40; let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const nu = Math.round(nd * up);
      for (let i = 0; i < nd; i++) { const top = i < nu; ctx.fillStyle = EM.col(top ? '--c2' : '--c1'); ctx.beginPath(); ctx.arc(x0 + 6 + rnd() * (x1 - x0 - 12), (top ? y1 : y0) - 6 - rnd() * 14, 3, 0, 7); ctx.fill(); }
      EM.text(ctx, 'E = Δ', x1 + 4, y1 + 4, { size: 11, color: '--ink-2' }); EM.text(ctx, 'E = 0', x1 + 4, y0 + 4, { size: 11, color: '--ink-2' });
      sim.set('p', EM.fix(100 * up, 2) + ' %');
      sim.set('u', EM.fix(up, 4));
      sim.set('c', EM.fix(TH.schottky(p.t), 4));
      sim.set('s', EM.fix(S(p.t), 4) + ' (ln 2 = 0.6931)');
    });
  });

  /* 21.2 Poblaciones rotacionales y espectro */
  const MOL = { CO: ['CO', 2.77, 2143], HCl: ['HCl', 15.2, 2886], N2O: ['NO', 2.45, 1876] };
  EM.defineSim('rotacional', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Molécula', options: Object.entries(MOL).map(([k, v]) => [k, v[0] + ' (Θr = ' + v[1] + ' K)']), value: 'CO' });
    sim.slider('T', { label: 'Temperatura', min: 5, max: 2000, step: 1, value: 300, unit: 'K', log: true, fmt: (v) => v.toFixed(0) });
    sim.out('j', 'Nivel más poblado', { hl: true });
    sim.out('q', 'Función de partición rotacional (exacta · <i>T</i>/Θ<sub>r</sub>)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const [, th, nu0] = MOL[p.m], B = th * 0.695035, Jm = 60;
      const w = []; let Z = 0; for (let J = 0; J <= Jm; J++) { const v = (2 * J + 1) * Math.exp((-J * (J + 1) * th) / p.T); w.push(v); Z += v; }
      const P = w.map((v) => v / Z), mx = Math.max(...P);
      const jbest = P.indexOf(mx);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.4, h: H, xmin: -0.5, xmax: 40.5, ymin: 0, ymax: mx * 1.15, xlabel: 'J', ylabel: 'P(J)' });
      pl.frame();
      ctx.fillStyle = EM.alpha('--c1', 0.6);
      P.forEach((v, J) => { if (J <= 40) ctx.fillRect(pl.X(J - 0.35), pl.Y(v), pl.X(0.7) - pl.X(0), pl.Y(0) - pl.Y(v)); });
      const span = Math.max(40, 2 * B * 45);
      const p2 = new EM.Plot(ctx, { x: W * 0.4, y: 0, w: W * 0.6, h: H, xmin: nu0 - span * 1.1, xmax: nu0 + span * 1.1, ymin: 0, ymax: mx * 1.15, xlabel: 'número de onda (cm⁻¹)', ylabel: 'intensidad relativa' });
      p2.frame();
      for (let J = 0; J <= Jm; J++) {
        const vr = nu0 + 2 * B * (J + 1); if (vr < p2.o.xmax) p2.path([[vr, 0], [vr, P[J]]], { color: '--c2', width: 1.6 });
        if (J >= 1) { const vp = nu0 - 2 * B * J; if (vp > p2.o.xmin) p2.path([[vp, 0], [vp, P[J]]], { color: '--c1', width: 1.6 }); }
      }
      p2.label(nu0 + span * 0.5, mx * 1.05, 'rama R', { size: 11, color: '--c2', align: 'center' });
      p2.label(nu0 - span * 0.5, mx * 1.05, 'rama P', { size: 11, color: '--c1', align: 'center' });
      sim.set('j', 'J = ' + jbest + ' (fórmula: ' + EM.fix(Math.sqrt(p.T / (2 * th)) - 0.5, 2) + ')');
      sim.set('q', EM.fix(Z, 3) + ' · ' + EM.fix(p.T / th, 3));
    });
  });

  /* 21.3 Paramagnetismo */
  const brill = (J, x) => { if (Math.abs(x) < 1e-8) return ((J + 1) / (3 * J)) * x; const a = (2 * J + 1) / (2 * J), b = 1 / (2 * J); return a / Math.tanh(a * x) - b / Math.tanh(b * x); };
  const lang = (x) => (Math.abs(x) < 1e-6 ? x / 3 : 1 / Math.tanh(x) - 1 / x);
  EM.defineSim('paramagnetismo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('B', { label: 'Campo magnético', min: 0.01, max: 20, step: 0.01, value: 5, unit: 'T', log: true, fmt: (v) => v.toFixed(2) });
    sim.slider('T', { label: 'Temperatura', min: 0.5, max: 300, step: 0.1, value: 2, unit: 'K', log: true, fmt: (v) => v.toFixed(1) });
    sim.seg('J', { label: 'Momento angular del ion', options: [['0.5', 'J = ½'], ['1.5', 'J = 3/2'], ['3.5', 'J = 7/2 (Gd³⁺)']], value: '3.5' });
    sim.out('x', 'Parámetro <i>gμ<sub>B</sub>JB</i>/<i>k<sub>B</sub>T</i>', { hl: true });
    sim.out('m', 'Magnetización relativa <i>M</i>/<i>M<sub>s</sub></i>');
    sim.out('c', 'Ley de Curie (campo débil)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, J = +p.J;
      EM.draw.clear(cv);
      const muB = 9.2740100783e-24, x = (2 * muB * J * p.B) / (TH.kB * p.T);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 10, ymin: 0, ymax: 1.1, xlabel: 'gμ_BJB/k_BT', ylabel: 'M/M_s' });
      pl.frame();
      [['0.5', '--c1'], ['1.5', '--c3'], ['3.5', '--c2']].forEach(([j, c]) => pl.fn((xx) => brill(+j, xx), { color: c, width: j === p.J ? 2.8 : 1.4 }));
      pl.fn(lang, { color: '--c6', width: 1.4, dash: [5, 4] });
      pl.fn((xx) => ((J + 1) / (3 * J)) * xx, { color: '--ink-3', width: 1, dash: [3, 3], to: 3 });
      pl.dot(Math.min(x, 10), brill(J, x), { color: '--accent', r: 6 });
      pl.legend([{ label: 'Brillouin J = ½', color: '--c1' }, { label: 'J = 3/2', color: '--c3' }, { label: 'J = 7/2', color: '--c2' }, { label: 'Langevin (clásico)', color: '--c6', dash: [5, 4] }, { label: 'Curie, recta inicial', color: '--ink-3', dash: [3, 3] }], 'br');
      sim.set('x', EM.fix(x, 4));
      sim.set('m', EM.fix(brill(J, x), 4));
      sim.set('c', EM.fix(((J + 1) / (3 * J)) * x, 4) + (x > 0.5 ? ' (ya no es válida)' : ''));
    });
  });

  /* 21.4 Modelo de Ising 2D */
  EM.defineSim('ising', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura <i>k<sub>B</sub>T</i>/<i>J</i>', min: 1, max: 4, step: 0.01, value: 2.27, fmt: (v) => v.toFixed(2) });
    sim.slider('h', { label: 'Campo externo <i>h</i>/<i>J</i>', min: -0.5, max: 0.5, step: 0.01, value: 0, fmt: (v) => v.toFixed(2) });
    sim.seg('init', { label: 'Estado inicial', options: [['rand', 'Al azar'], ['up', 'Todo hacia arriba']], value: 'rand' });
    sim.resetButton(() => reset());
    sim.out('m', 'Magnetización |<i>M</i>| (media reciente)', { hl: true });
    sim.out('o', 'Valor exacto de Onsager–Yang');
    sim.out('e', 'Energía por espín');
    const L = 96, N = L * L;
    let s, mh, img, off, offc;
    const reset = () => { s = new Int8Array(N); for (let i = 0; i < N; i++) s[i] = sim.p.init === 'up' ? 1 : Math.random() < 0.5 ? 1 : -1; mh = []; };
    reset();
    sim.onChange = (id) => { if (id === 'init') reset(); };
    sim.animate((dt) => {
      if (!(dt > 0)) return;
      const b = 1 / sim.p.T, h = sim.p.h;
      for (let sw = 0; sw < 3; sw++) {
        for (let k = 0; k < N; k++) {
          const i = (Math.random() * N) | 0, x = i % L, y = (i / L) | 0;
          const nb = s[((y + L - 1) % L) * L + x] + s[((y + 1) % L) * L + x] + s[y * L + ((x + L - 1) % L)] + s[y * L + ((x + 1) % L)];
          const dE = 2 * s[i] * (nb + h);
          if (dE <= 0 || Math.random() < Math.exp(-b * dE)) s[i] = -s[i];
        }
        let M = 0; for (let i = 0; i < N; i++) M += s[i];
        mh.push(Math.abs(M) / N); if (mh.length > 150) mh.shift();
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      if (!off) { off = document.createElement('canvas'); off.width = L; off.height = L; offc = off.getContext('2d'); img = offc.createImageData(L, L); }
      const up = EM.rgb('--c2'), dn = EM.rgb('--c1');
      for (let i = 0; i < N; i++) { const c = s[i] > 0 ? up : dn; img.data[4 * i] = c[0]; img.data[4 * i + 1] = c[1]; img.data[4 * i + 2] = c[2]; img.data[4 * i + 3] = 255; }
      offc.putImageData(img, 0, 0);
      const side = H - 16; ctx.imageSmoothingEnabled = false; ctx.drawImage(off, 8, 8, side, side);
      const Tc = 2 / Math.log(1 + Math.SQRT2), exact = (T) => (T < Tc ? Math.pow(1 - Math.pow(Math.sinh(2 / T), -4), 1 / 8) : 0);
      const pl = new EM.Plot(ctx, { x: side + 16, y: 0, w: W - side - 16, h: H, xmin: 1, xmax: 4, ymin: 0, ymax: 1.05, xlabel: 'k_BT/J', ylabel: '|M|' });
      pl.frame();
      pl.fn(exact, { color: '--c3', width: 2.2, n: 300 });
      pl.vline(Tc, { label: 'T_c = 2.269' });
      const mavg = mh.length ? mh.reduce((a, b) => a + b, 0) / mh.length : 0;
      pl.dot(p.T, mavg, { color: '--accent', r: 6 });
      let E = 0; for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) { const i = y * L + x; E -= s[i] * (s[y * L + ((x + 1) % L)] + s[((y + 1) % L) * L + x]) + p.h * s[i]; }
      sim.set('m', EM.fix(mavg, 3));
      sim.set('o', EM.fix(exact(p.T), 3) + (Math.abs(p.h) > 0 ? ' (para h = 0)' : ''));
      sim.set('e', EM.fix(E / N, 3) + ' J');
    });
  });
})();
