/* Capítulo 7 — Fonones en tres dimensiones */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd, L = EM.lin;
  const PI = Math.PI;
  const aCu = 3.615e-10, MCu = 63.546 * 1.66053906660e-27;
  const C1Cu = (MCu * Math.pow(2 * PI * 7.25e12, 2)) / 8;
  const model = (r2) => {
    const nb = SS.cubicNeighbors('fcc', aCu, C1Cu, r2 * C1Cu);
    return (k) => SS.dynCentral(nb, MCu, k).map((w) => w / (2 * PI * 1e12));
  };

  /* 7.1 Dispersión fcc */
  EM.defineSim('fonones-fcc', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('c2', { label: 'C₂/C₁ (segundos vecinos)', min: -0.2, max: 0.3, step: 0.005, value: 0, fmt: (v) => v.toFixed(3) });
    sim.check('data', { label: 'Mediciones de neutrones (Cu, 80 K)', value: true });
    sim.out('X', 'En X: T, L (THz)', { hl: true });
    sim.out('L', 'En L: T, L (THz)');
    sim.out('v', 'Sonido en [100]: v_T, v_L');
    const sp = SS.special('fcc'), labels = ['Γ', 'X', 'W', 'L', 'Γ', 'K', 'X'];
    const path = SS.kpath(sp, labels, 50);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const f = model(p.c2);
      const E = path.map((q) => f(q.k.map((x) => (x * 2 * PI) / aCu)));
      D.bands(ctx, { x: 0, y: 0, w: W, h: H }, path, E, { ymin: 0, ymax: 9, ylabel: 'ν (THz)', colors: ['--c1', '--c1', '--c2'] });
      if (p.data) {
        const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: path[path.length - 1].s, ymin: 0, ymax: 9 });
        const sX = path.find((q) => q.label === 'X').s, sL = path.find((q) => q.label === 'L').s;
        for (const [s, v] of [[sX, 5.13], [sX, 7.25], [sL, 3.43], [sL, 7.30]]) pl.dot(s, v, { color: '--accent', r: 5.5 });
      }
      const fx = f([0, (2 * PI) / aCu, 0]), fl = f([PI / aCu, PI / aCu, PI / aCu]);
      const kk = 1e7, ws = SS.dynCentral(SS.cubicNeighbors('fcc', aCu, C1Cu, p.c2 * C1Cu), MCu, [kk, 0, 0]);
      sim.set('X', EM.fix(fx[0], 2) + ', ' + EM.fix(fx[2], 2) + ' (medido 5.13, 7.25)');
      sim.set('L', EM.fix(fl[0], 2) + ', ' + EM.fix(fl[2], 2) + ' (medido 3.43, 7.30)');
      sim.set('v', EM.fix(ws[0] / kk, 0) + ', ' + EM.fix(ws[2] / kk, 0) + ' m/s (elásticas: 2906, 4343)');
    });
  });

  /* 7.2 Densidad de estados */
  EM.defineSim('dos-fonones', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('nk', { label: 'Malla de puntos k por eje', min: 6, max: 30, step: 1, value: 18, fmt: (v) => v.toFixed(0) });
    sim.slider('c2', { label: 'C₂/C₁', min: -0.1, max: 0.3, step: 0.01, value: 0, fmt: (v) => v.toFixed(2) });
    sim.check('deb', { label: 'Aproximación de Debye', value: true });
    sim.out('n', 'Puntos k diagonalizados', { hl: true });
    sim.out('wd', 'Frecuencia de Debye ν_D');
    let key = '', hist = null, nuD = 0;
    const NB = 60, NUMAX = 8.5;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, nk = Math.round(p.nk);
      EM.draw.clear(cv);
      const k = nk + '|' + p.c2;
      if (k !== key) {
        key = k;
        const f = model(p.c2);
        const B = SS.recip(SS.primitive('fcc', aCu));
        hist = SS.dosHistogram(f, B, nk, NB, NUMAX);
        /* velocidad media para Debye: promedio de 1/v³ sobre direcciones */
        const rng = L.rng(3);
        let s = 0;
        const nb = SS.cubicNeighbors('fcc', aCu, C1Cu, p.c2 * C1Cu), q = 1e7;
        for (let i = 0; i < 300; i++) {
          const z = 2 * rng() - 1, ph = 2 * PI * rng(), r = Math.sqrt(1 - z * z);
          const ws = SS.dynCentral(nb, MCu, [q * r * Math.cos(ph), q * r * Math.sin(ph), q * z]);
          for (const w of ws) s += Math.pow(q / w, 3);
        }
        const vm = Math.cbrt(3 / (s / 300));
        nuD = (vm * Math.cbrt(6 * PI * PI * (4 / Math.pow(aCu, 3)))) / (2 * PI * 1e12);
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: NUMAX, ymin: 0, ymax: Math.max(...hist) * 1.15, xlabel: 'ν (THz)', ylabel: 'g(ν) (por modo, THz⁻¹)' });
      pl.frame();
      const dn = NUMAX / NB;
      for (let b = 0; b < NB; b++) { const x0 = pl.X(b * dn), x1 = pl.X((b + 1) * dn); ctx.fillStyle = EM.alpha('--c1', 0.65); ctx.fillRect(x0, pl.Y(hist[b]), x1 - x0 - 0.5, pl.Y(0) - pl.Y(hist[b])); }
      if (p.deb) pl.fn((nu) => (nu <= nuD ? (3 * nu * nu) / Math.pow(nuD, 3) : 0), { color: '--c2', width: 2.2 });
      sim.set('n', (nk * nk * nk).toLocaleString('es-CO') + ' (' + (3 * nk * nk * nk).toLocaleString('es-CO') + ' modos)');
      sim.set('wd', EM.fix(nuD, 2) + ' THz → θ_D = hν_D/k_B = ' + EM.fix((SS.h * nuD * 1e12) / SS.kB, 0) + ' K');
    });
  });

  /* 7.3 Ocupación y amplitud */
  const MATU = { Cu: [343, 63.546, 2.556, 1358], Al: [428, 26.98, 2.863, 933], Pb: [105, 207.2, 3.500, 601], Fe: [470, 55.845, 2.483, 1811], Ag: [225, 107.87, 2.889, 1235], Na: [158, 22.99, 3.659, 371], Ar: [92, 39.95, 3.76, 84] };
  EM.defineSim('bose', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('E', { label: 'Energía del modo ħω', min: 1, max: 100, step: 0.5, value: 20, unit: 'meV', fmt: (v) => v.toFixed(1) });
    sim.select('m', { label: 'Material (amplitud)', options: Object.keys(MATU).map((k) => [k, k]), value: 'Cu' });
    sim.slider('T', { label: 'Temperatura', min: 1, max: 2000, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('n', '⟨n⟩ a T', { hl: true });
    sim.out('u', 'Amplitud cuadrática media √⟨u²⟩');
    sim.out('lin', 'Fracción de la distancia entre vecinos');
    const u2 = (T, th, M) => {
      const pre = (9 * SS.hbar * SS.hbar) / (M * 1.66053906660e-27 * SS.kB * th);
      const x = th / T, I = T > 0 ? L.gl((y) => (y < 1e-8 ? 1 : y / Math.expm1(y)), 0, x, 32, 4) : 0;
      return pre * (0.25 + (T > 0 ? I / (x * x) : 0));
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const wl = W * 0.48, kT = (T) => SS.kBeV * T * 1000;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0, xmax: 1000, ymin: 0, ymax: 4, xlabel: 'T (K)', ylabel: '⟨n⟩' });
      pl.frame();
      pl.fn((T) => 1 / Math.expm1(p.E / kT(T)), { color: '--c1', width: 2.4 });
      pl.fn((T) => kT(T) / p.E, { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.fn((T) => kT(T) / p.E - 0.5, { color: '--ink-3', width: 1, dash: [2, 3] });
      pl.vline(p.T, { color: '--accent' });
      pl.legend([{ label: 'Bose–Einstein', color: '--c1' }, { label: 'k_BT/ħω (clásico)', color: '--ink-3', dash: [5, 4] }], 'tl');
      const d = MATU[p.m];
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: Math.max(2000, d[3] * 1.2), ymin: 0, ymax: 0.6, xlabel: 'T (K)', ylabel: '√⟨u²⟩ (Å)' });
      p2.frame();
      p2.fn((T) => Math.sqrt(u2(T, d[0], d[1])) * 1e10, { color: '--c2', width: 2.4, n: 300 });
      p2.hline(0.1 * d[2], { color: '--c3', label: '10 % de la distancia entre vecinos', dash: [6, 4] });
      p2.vline(d[3], { color: '--c3', label: 'fusión ' + d[3] + ' K' });
      p2.vline(p.T, { color: '--accent' });
      const n = 1 / Math.expm1(p.E / kT(p.T)), u = Math.sqrt(u2(p.T, d[0], d[1])) * 1e10;
      sim.set('n', EM.sci(n, 3) + ' (ħω/k_BT = ' + EM.fix(p.E / kT(p.T), 2) + ')');
      sim.set('u', EM.fix(u, 4) + ' Å (punto cero: ' + EM.fix(Math.sqrt(u2(1e-6, d[0], d[1])) * 1e10, 3) + ' Å)');
      sim.set('lin', EM.fix((100 * u) / d[2], 1) + ' %');
    });
  });

  /* 7.4 Dispersión de neutrones */
  EM.defineSim('neutrones', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Ei', { label: 'Energía del neutrón incidente', min: 10, max: 80, step: 0.5, value: 35, unit: 'meV', fmt: (v) => v.toFixed(1) });
    sim.slider('tt', { label: 'Ángulo de dispersión 2θ', min: 5, max: 120, step: 0.5, value: 40, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.slider('wm', { label: 'ħω_{máx} de la cadena (a = 3 Å)', min: 5, max: 40, step: 0.5, value: 20, unit: 'meV', fmt: (v) => v.toFixed(1) });
    sim.out('k', 'k incidente', { hl: true });
    sim.out('pk', 'Fonones detectables (q, ħω)');
    const a = 3, G = (2 * PI) / a;
    const kOf = (E) => Math.sqrt((2 * SS.mn * E * 1e-3 * SS.e)) / SS.hbar * 1e-10; /* Å⁻¹ */
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const ki = kOf(p.Ei), th = (p.tt * PI) / 180;
      const disp = (q) => p.wm * Math.abs(Math.sin((q * a) / 2));
      /* barrido: Ef de 0 a Ei, Q a lo largo de la cadena */
      const pts = [];
      for (let i = 1; i < 400; i++) {
        const Ef = (p.Ei * i) / 400, kf = kOf(Ef);
        const Q = Math.sqrt(ki * ki + kf * kf - 2 * ki * kf * Math.cos(th));
        pts.push([Q, p.Ei - Ef]);
      }
      const wl = W * 0.36;
      /* triángulo */
      const v = D.view({ x: 10, y: 10, w: wl - 20, h: H - 20 }, -0.5, ki + 0.5, -ki * 0.9, ki * 0.9);
      const Ef0 = Math.max(1, p.Ei - p.wm / 2), kf0 = kOf(Ef0);
      const kv = [ki, 0], kfv = [kf0 * Math.cos(th), kf0 * Math.sin(th)];
      D.arrow(ctx, v, [0, 0], kv, { color: '--c1', width: 2.4 });
      D.arrow(ctx, v, [0, 0], kfv, { color: '--c2', width: 2.4 });
      D.arrow(ctx, v, kfv, kv, { color: '--accent', width: 2 });
      EM.text(ctx, 'k', v.X(ki / 2), v.Y(0) + 16, { size: 13, italic: true, color: '--c1', weight: 700 });
      EM.text(ctx, "k'", v.X(kfv[0] / 2) - 10, v.Y(kfv[1] / 2) - 6, { size: 13, italic: true, color: '--c2', weight: 700 });
      EM.text(ctx, 'Q = k − k′', v.X((kfv[0] + ki) / 2) + 6, v.Y(kfv[1] / 2), { size: 12, color: '--accent', halo: true });
      const pl = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: 3 * G, ymin: 0, ymax: Math.min(p.Ei, 60), xlabel: 'Q a lo largo de la cadena (Å⁻¹)', ylabel: 'ħω (meV)' });
      pl.frame();
      pl.fn(disp, { color: '--c1', width: 2.2, n: 500 });
      for (let n = 1; n <= 2; n++) pl.vline(n * G, { color: '--grid-2', label: 'G' });
      pl.xy(pts.map((q) => q[0]), pts.map((q) => q[1]), { color: '--c2', width: 1.8, dash: [6, 3] });
      const hits = [];
      for (let i = 1; i < pts.length; i++) {
        const f0 = pts[i - 1][1] - disp(pts[i - 1][0]), f1 = pts[i][1] - disp(pts[i][0]);
        if (f0 * f1 < 0) { const t = f0 / (f0 - f1), Q = pts[i - 1][0] + t * (pts[i][0] - pts[i - 1][0]), w = pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1]); hits.push([Q, w]); pl.dot(Q, w, { color: '--accent', r: 6 }); }
      }
      pl.legend([{ label: 'dispersión de la cadena', color: '--c1' }, { label: 'barrido a 2θ fijo', color: '--c2', dash: [6, 3] }], 'tr');
      sim.set('k', EM.fix(ki, 3) + ' Å⁻¹, λ = ' + EM.fix((2 * PI) / ki, 3) + ' Å');
      sim.set('pk', hits.length ? hits.map(([Q, w]) => { let q = Q % G; if (q > G / 2) q -= G; return 'q = ' + EM.fix(q, 2) + ' Å⁻¹, ' + EM.fix(w, 1) + ' meV'; }).join(' · ') : 'ninguno');
    });
  });
})();
