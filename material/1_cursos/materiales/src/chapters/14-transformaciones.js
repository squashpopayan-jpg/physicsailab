/* Capítulo 14 — Cinética de transformaciones */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;

  /* ======================================================================
     14.1 Nucleación
     ====================================================================== */
  const NUC = { au: ['Oro (Callister, ej. 10.1)', 0.132, 1.16e9, 1337, 0.4079e-9, 4], cu: ['Cobre', 0.177, 1.88e9, 1358, 0.3615e-9, 4], fe: ['Hierro', 0.204, 1.85e9, 1811, 0.2932e-9, 2] };
  EM.defineSim('nucleation', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Metal', options: Object.entries(NUC).map(([k, v]) => [k, v[0]]), value: 'au' });
    sim.slider('dT', { label: 'Subenfriamiento Δ<i>T</i>', min: 20, max: 400, step: 1, value: 230, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('th', { label: 'Ángulo de mojado θ (180° = homogénea)', min: 10, max: 180, step: 1, value: 180, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('r', 'Radio crítico <i>r</i>*', { hl: true });
    sim.out('G', 'Barrera Δ<i>G</i>* (homogénea)');
    sim.out('Gh', 'Barrera con el sustrato');
    sim.out('n', 'Átomos en el núcleo crítico');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const [, g, Hv, Tm, a, nat] = NUC[p.m];
      const nu = MAT.nucleation(g, Hv, Tm, p.dT), S = MAT.hetFactor(p.th);
      const rs = nu.rStar, Gs = nu.Gstar;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.66, h: H, xmin: 0, xmax: 3 * rs * 1e9, ymin: -2 * Gs * 1e19, ymax: 1.6 * Gs * 1e19, xlabel: 'radio r (nm)', ylabel: 'ΔG (10⁻¹⁹ J)', ml: 54 });
      pl.frame();
      const sur = (r) => 4 * Math.PI * r * r * g, vol = (r) => (4 / 3) * Math.PI * r ** 3 * nu.dGv;
      pl.fn((x) => sur(x * 1e-9) * 1e19, { color: '--c3', width: 1.4, dash: [5, 4] });
      pl.fn((x) => vol(x * 1e-9) * 1e19, { color: '--c1', width: 1.4, dash: [5, 4] });
      pl.fn((x) => (sur(x * 1e-9) + vol(x * 1e-9)) * 1e19, { color: '--accent', width: 2.6 });
      if (p.th < 180) pl.fn((x) => (sur(x * 1e-9) + vol(x * 1e-9)) * 1e19 * S, { color: '--c5', width: 2, dash: [2, 2] });
      pl.dot(rs * 1e9, Gs * 1e19, { color: '--accent', label: 'r*, ΔG*' });
      pl.legend([{ label: 'superficie 4πr²γ', color: '--c3', dash: [5, 4] }, { label: 'volumen ⁴⁄₃πr³ΔG_v', color: '--c1', dash: [5, 4] }, { label: 'homogénea', color: '--accent' }].concat(p.th < 180 ? [{ label: 'heterogénea × S(θ)', color: '--c5', dash: [2, 2] }] : []), 'bl');
      /* casquete esférico */
      const cx = W * 0.83, cy = H * 0.62, R = Math.min(W * 0.12, H * 0.3);
      ctx.fillStyle = EM.alpha('--c6', 0.3); ctx.fillRect(W * 0.69, cy, W * 0.29, 14);
      const th = M.rad(p.th);
      ctx.save(); ctx.beginPath(); ctx.rect(W * 0.69, 0, W * 0.31, cy); ctx.clip();
      ctx.fillStyle = EM.alpha('--accent', 0.55); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (p.th >= 179) ctx.arc(cx, cy - R - 4, R, 0, 7);
      else ctx.arc(cx, cy + R * Math.cos(th), R, 0, 7); /* casquete: la parte sobre el sustrato */
      ctx.fill(); ctx.stroke(); ctx.restore();
      EM.text(ctx, p.th >= 179 ? 'núcleo homogéneo' : 'casquete sobre el sustrato, θ = ' + p.th + '°', cx, H - 10, { size: 11, align: 'center', color: '--ink-3' });
      const Vat = Math.pow(a, 3) / nat;
      sim.set('r', EM.fix(rs * 1e9, 3) + ' nm');
      sim.set('G', EM.sci(Gs, 3) + ' J = ' + EM.fix(Gs / (MAT.kB * (Tm - p.dT)), 0) + ' <i>k<sub>B</sub>T</i>');
      sim.set('Gh', EM.sci(Gs * S, 3) + ' J (S = ' + EM.fix(S, 4) + ')');
      sim.set('n', EM.fix(((4 / 3) * Math.PI * rs ** 3) / Vat, 0) + (p.th < 180 ? ' (homogéneo); ' + EM.fix((((4 / 3) * Math.PI * rs ** 3) / Vat) * S, 0) + ' en el casquete' : ''));
    });
  });

  /* ======================================================================
     14.2 Nucleación, crecimiento y curva en C
     ====================================================================== */
  EM.defineSim('nucleation-rate', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Qd', { label: 'Energía de activación de la difusión', min: 0.5, max: 3, step: 0.05, value: 1.5, unit: 'eV', fmt: (v) => EM.fix(v, 2) });
    sim.slider('B', { label: 'Barrera de nucleación (escala Δ<i>G</i>* · Δ<i>T</i>²)', min: 0.5, max: 10, step: 0.1, value: 3, fmt: (v) => EM.fix(v, 1) });
    sim.out('Tn', 'Temperatura de la nariz', { hl: true });
    sim.note('Te = 1000 K; Δ𝐺* = B·10⁶ eV·K² / ΔT² (unidades reducidas); velocidades normalizadas a su máximo.');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const Te = 1000, k = MAT.kBeV;
      const Ndot = (T) => Math.exp(-(p.B * 1e4) / ((Te - T) * (Te - T)) / (k * T)) * Math.exp(-p.Qd / (k * T));
      const Gdot = (T) => Math.exp(-p.Qd / (k * T)) * (1 - Math.exp(-(Te - T) / 60));
      const Ts = M.linspace(300, 999, 400);
      const nN = Math.max(...Ts.map(Ndot)), nG = Math.max(...Ts.map(Gdot));
      const rate = (T) => Math.pow((Ndot(T) / nN) * Math.pow(Gdot(T) / nG, 3), 0.25);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 1.05, ymin: 300, ymax: 1050, xlabel: 'velocidad (normalizada)', ylabel: 'T (K)', ml: 50 });
      pl.frame();
      pl.xy(Ts.map((T) => Ndot(T) / nN), Ts, { color: '--c1', width: 2 });
      pl.xy(Ts.map((T) => Gdot(T) / nG), Ts, { color: '--c3', width: 2 });
      const nr = Math.max(...Ts.map(rate));
      pl.xy(Ts.map((T) => rate(T) / nr), Ts, { color: '--accent', width: 2.6 });
      pl.hline(Te, { color: '--ink-3', label: 'T_e' });
      pl.legend([{ label: 'nucleación', color: '--c1' }, { label: 'crecimiento', color: '--c3' }, { label: 'global', color: '--accent' }], 'br');
      const pt = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 1, xmax: 1e4, ymin: 300, ymax: 1050, xlog: true, xlabel: 'tiempo de transformación (u. a.)', ylabel: 'T (K)', ml: 50 });
      pt.frame();
      pt.xy(Ts.map((T) => nr / rate(T)), Ts, { color: '--accent', width: 2.6 });
      pt.hline(Te, { color: '--ink-3' });
      const Tn = Ts.reduce((b, T) => (rate(T) > rate(b) ? T : b), Ts[0]);
      pt.hline(Tn, { color: '--c2', label: 'nariz' });
      sim.set('Tn', EM.fix(Tn, 0) + ' K (ΔT = ' + EM.fix(Te - Tn, 0) + ' K)');
    });
  });

  /* ======================================================================
     14.3 Avrami
     ====================================================================== */
  EM.defineSim('avrami', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('n', { label: 'Exponente <i>n</i>', min: 1, max: 4, step: 0.1, value: 2.5, fmt: (v) => EM.fix(v, 1) });
    sim.slider('t50', { label: 'Tiempo medio <i>t</i><sub>0.5</sub>', min: 1, max: 1000, step: 1, value: 60, unit: 's', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('noise', { label: 'Ruido de medición', min: 0, max: 0.05, step: 0.005, value: 0.015, fmt: (v) => EM.fix(v, 3) });
    sim.button('Nuevos datos', () => { seed++; sim.redraw(); });
    sim.out('k', '<i>k</i> = ln 2 / <i>t</i><sub>0.5</sub><sup>n</sup>');
    sim.out('fit', 'Pendiente ajustada (≈ <i>n</i>)', { hl: true });
    let seed = 1;
    const rn = (i) => { const s = Math.sin(i * 12.9898 + seed * 7.1) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const k = Math.LN2 / Math.pow(p.t50, p.n);
      const y = (t) => MAT.jmak(k, p.n, t);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: p.t50 / 30, xmax: p.t50 * 30, ymin: 0, ymax: 1.05, xlog: true, xlabel: 't (s)', ylabel: 'fracción transformada y', ml: 50 });
      pl.frame();
      pl.fn(y, { color: '--accent', width: 2.4 });
      const ts = M.linspace(Math.log10(p.t50 / 10), Math.log10(p.t50 * 5), 16).map((q) => Math.pow(10, q));
      const ys = ts.map((t, i) => M.clamp(y(t) + p.noise * rn(i), 0.005, 0.995));
      ts.forEach((t, i) => pl.dot(t, ys[i], { color: '--c1', r: 3.5 }));
      pl.hline(0.5, { color: '--ink-3' });
      /* linealización */
      const X = ts.map(Math.log), Y = ys.map((v) => Math.log(-Math.log(1 - v)));
      const mx = X.reduce((s, v) => s + v, 0) / X.length, my = Y.reduce((s, v) => s + v, 0) / Y.length;
      const sl = X.reduce((s, v, i) => s + (v - mx) * (Y[i] - my), 0) / X.reduce((s, v) => s + (v - mx) ** 2, 0);
      const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: Math.min(...X) - 0.3, xmax: Math.max(...X) + 0.3, ymin: Math.min(...Y) - 0.5, ymax: Math.max(...Y) + 0.5, xlabel: 'ln t', ylabel: 'ln ln[1/(1−y)]', ml: 50 });
      pr.frame();
      X.forEach((x, i) => pr.dot(x, Y[i], { color: '--c1', r: 3.5 }));
      pr.fn((x) => my + sl * (x - mx), { color: '--accent', width: 2 });
      sim.set('k', EM.sci(k, 3) + ' s<sup>−n</sup>');
      sim.set('fit', EM.fix(sl, 3));
    });
  });

  /* ======================================================================
     14.4 Diagrama TTT del acero eutectoide
     ====================================================================== */
  const tStart = MAT.tStartTTT;
  const RATIO = 30, NAV = Math.log(Math.log(0.01) / Math.log(0.99)) / Math.log(RATIO);
  const kOf = (T) => -Math.log(0.99) / Math.pow(tStart(T), NAV);
  const MS = 220;
  const product = (T) => (T > 650 ? 'perlita gruesa' : T > 540 ? 'perlita fina' : T > 350 ? 'bainita superior' : 'bainita inferior');
  EM.TTT = { tStart, NAV, RATIO, MS, product };
  EM.defineSim('ttt', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.slider('T1', { label: 'Temperatura de la etapa 1', min: 100, max: 720, step: 5, value: 350, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('t1', { label: 'Tiempo de la etapa 1', min: 0.1, max: 1e5, step: 0.1, value: 1e4, unit: 's', log: true, fmt: (v) => (v < 10 ? EM.fix(v, 1) : v.toFixed(0)) });
    sim.check('two', { label: 'Segunda etapa isotérmica', value: false });
    sim.slider('T2', { label: 'Temperatura de la etapa 2', min: 100, max: 720, step: 5, value: 400, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('t2', { label: 'Tiempo de la etapa 2', min: 0.1, max: 1e5, step: 0.1, value: 1000, unit: 's', log: true, fmt: (v) => (v < 10 ? EM.fix(v, 1) : v.toFixed(0)) });
    sim.out('res', 'Microestructura final', { hl: true });
    sim.out('ra', 'Austenita retenida');
    sim.note('Curvas de inicio aproximadas a partir de Callister (fig. 10.22); final = 30 × inicio; Avrami con n = 1.80; martensita por Koistinen–Marburger con Ms = 220 °C.');
    const vis = () => { sim.ctl.T2.show(sim.p.two); sim.ctl.t2.show(sim.p.two); };
    sim.onChange = vis; vis();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.1, xmax: 1e5, ymin: 0, ymax: 800, xlog: true, xlabel: 'tiempo (s)', ylabel: 'temperatura (°C)', ml: 52 });
      pl.frame();
      const Ts = M.linspace(150, 724, 200);
      pl.xy(Ts.map(tStart), Ts, { color: '--c1', width: 2.2 });
      pl.xy(Ts.map((T) => tStart(T) * Math.pow(Math.log(0.5) / Math.log(0.99), 1 / NAV)), Ts, { color: '--c1', width: 1, dash: [3, 3] });
      pl.xy(Ts.map((T) => tStart(T) * RATIO), Ts, { color: '--c2', width: 2.2 });
      pl.hline(727, { color: '--ink-3', label: 'A₁ 727 °C', labelRight: true });
      pl.hline(MS, { color: '--c5', dash: [], width: 1.6, label: 'M_s', labelRight: true });
      pl.hline(MS - 63, { color: '--c5', dash: [4, 3], width: 1, label: 'M₅₀', labelRight: true });
      pl.hline(MS - 209, { color: '--c5', dash: [4, 3], width: 1, label: 'M₉₀', labelRight: true });
      pl.label(4, 690, 'perlita gruesa', { size: 11 }); pl.label(20, 600, 'perlita fina', { size: 11 }); pl.label(200, 420, 'bainita', { size: 11 }); pl.label(1.2, 300, 'austenita', { size: 11, color: '--c3' });
      /* trayectoria y cálculo */
      const stages = [[p.T1, p.t1]].concat(p.two ? [[p.T2, p.t2]] : []);
      const prods = {};
      let X = 0, gamma = 1, mart = 0, fPrev = 0, tcur = 0.1;
      const path = [[0.1, 800]];
      const quenchTo = (T) => { /* martensita atérmica: solo depende de la temperatura mínima alcanzada */
        const f = MAT.koistinen(MS, T);
        if (f > fPrev) { const dm = (gamma * (f - fPrev)) / (1 - fPrev); mart += dm; gamma -= dm; fPrev = f; }
      };
      for (const [T, t] of stages) {
        path.push([tcur, T]);
        if (T <= MS) quenchTo(T);
        else if (fPrev === 0) {
          const k = kOf(T);
          const te = X > 0 ? Math.pow(-Math.log(1 - Math.min(0.999999, X)) / k, 1 / NAV) : 0;
          const Xn = 1 - Math.exp(-k * Math.pow(te + t, NAV));
          const dX = Math.max(0, Math.min(gamma, Xn - X));
          prods[product(T)] = (prods[product(T)] || 0) + dX;
          X += dX; gamma -= dX;
        }
        tcur += t;
        path.push([tcur, T]);
      }
      path.push([tcur, 25]);
      quenchTo(25);
      pl.xy(path.map((q) => q[0]), path.map((q) => q[1]), { color: '--accent', width: 3 });
      const parts = Object.entries(prods).filter(([, v]) => v > 0.005).map(([k, v]) => EM.fix(100 * v, 0) + ' % ' + k);
      if (mart > 0.005) parts.push(EM.fix(100 * mart, 0) + ' % martensita');
      sim.set('res', parts.join(' · ') || '—');
      sim.set('ra', EM.fix(100 * gamma, 1) + ' %');
    });
  });

  /* ======================================================================
     14.5 Martensita
     ====================================================================== */
  EM.defineSim('martensite', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('C', { label: 'Carbono', min: 0.1, max: 1.2, step: 0.01, value: 0.8, unit: '% peso', fmt: (v) => EM.fix(v, 2) });
    sim.slider('Mn', { label: 'Manganeso', min: 0, max: 2, step: 0.05, value: 0.7, unit: '% peso', fmt: (v) => EM.fix(v, 2) });
    sim.slider('T', { label: 'Temperatura del temple', min: -196, max: 400, step: 1, value: 25, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('Ms', '<i>M<sub>s</sub></i> (Andrews)', { hl: true });
    sim.out('f', 'Fracción de martensita');
    sim.out('ca', 'Tetragonalidad <i>c</i>/<i>a</i>');
    const v = new EM.View3D(sim, cv, { radius: 1.6, az: M.rad(30), el: M.rad(16), tools: false });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const Ms = MAT.MsAndrews(p.C, p.Mn), f = MAT.koistinen(Ms, p.T), ca = 1 + 0.045 * p.C;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: -200, xmax: 500, ymin: 0, ymax: 1.05, xlabel: 'temperatura (°C)', ylabel: 'fracción de martensita', ml: 50 });
      pl.frame();
      pl.fn((T) => MAT.koistinen(Ms, T), { color: '--accent', width: 2.4 });
      pl.vline(Ms, { color: '--c5', label: 'M_s' });
      pl.vline(25, { color: '--ink-3', label: 'ambiente' });
      pl.dot(p.T, f, { color: '--accent' });
      /* celda BCT */
      const s = 0.55, cc = s * (1 + (ca - 1) * 8);
      v.cx = 0;
      v.setup();
      const sub = { x: W * 0.55 };
      void sub;
      const C = [];
      for (let i = 0; i < 8; i++) C.push([(i & 1 ? 1 : -1) * s, ((i >> 1) & 1 ? 1 : -1) * s, ((i >> 2) & 1 ? 1 : -1) * cc]);
      v.items.length = 0; v.over.length = 0; v.setup();
      v.offX = W * 0.27;
      v.setup();
      for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const d = EM.V.sub(C[i], C[j]); if ((d[0] !== 0) + (d[1] !== 0) + (d[2] !== 0) === 1) v.line(C[i], C[j], { color: '--ink-3', width: 1.2 }); }
      C.forEach((q) => v.point(q, { r: 9, color: '--c1', glow: true, ring: false }));
      v.point([0, 0, 0], { r: 9, color: '--c1', glow: true, ring: false });
      v.point([0, 0, cc], { r: 5, color: '--c2', glow: true, ring: false });
      v.text([0, 0, cc + 0.25], 'C (octaédrico)', { size: 11, color: '--c2' });
      v.render();
      EM.text(ctx, 'celda BCT (distorsión × 8)', W * 0.78, H - 10, { size: 11, align: 'center', color: '--ink-3' });
      sim.set('Ms', EM.fix(Ms, 0) + ' °C');
      sim.set('f', EM.fix(100 * f, 1) + ' % (austenita retenida ' + EM.fix(100 * (1 - f), 1) + ' %)');
      sim.set('ca', EM.fix(ca, 4));
    });
  });
})();
