/* Capítulo 11 — Física de los semiconductores */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const K = 8.617333262e-5, Q = 1.602176634e-19;
  const MAT = {
    Si: { name: 'Silicio', eg0: 1.166, a: 4.73e-4, b: 636, ni300: 1e10, col: '--c1', mun: [65, 1417, 8.5e16, 0.72], mup: [48, 470, 1.3e17, 0.76] },
    Ge: { name: 'Germanio', eg0: 0.7437, a: 4.774e-4, b: 235, ni300: 2.4e13, col: '--c2', mun: [100, 3900, 1e17, 0.6], mup: [50, 1900, 1e17, 0.6] },
    GaAs: { name: 'Arseniuro de galio', eg0: 1.519, a: 5.405e-4, b: 204, ni300: 2.1e6, col: '--c3', mun: [500, 9400, 6e16, 0.4], mup: [20, 491, 1.5e17, 0.4] }
  };
  const eg = (m, T) => m.eg0 - m.a * T * T / (T + m.b);
  const nIntr = (m, T) => m.ni300 * Math.pow(T / 300, 1.5) * Math.exp(eg(m, 300) / (2 * K * 300) - eg(m, T) / (2 * K * T));
  const mob = (p, N) => p[0] + (p[1] - p[0]) / (1 + Math.pow(N / p[2], p[3]));
  const carriers = (m, N, type, T) => { const ni = nIntr(m, T); if (type === 'i') return { n: ni, p: ni, ni }; const maj = N / 2 + Math.sqrt(N * N / 4 + ni * ni), min = ni * ni / maj; return type === 'n' ? { n: maj, p: min, ni } : { n: min, p: maj, ni }; };

  /* 11.1 Bandas */
  EM.defineSim('c11-bandas', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Diagrama de bandas' });
    sim.group('Semiconductor');
    sim.select('m', { label: 'Material', options: Object.entries(MAT).map(([k, v]) => [k, v.name]), value: 'Si' });
    sim.seg('t', { label: 'Dopado', options: [['i', 'Intrínseco'], ['n', 'Tipo n'], ['p', 'Tipo p']], value: 'n' });
    sim.slider('N', { label: 'Concentración de impurezas', min: 1e12, max: 1e19, value: 1e16, unit: 'cm⁻³', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('T', { label: 'Temperatura', min: 200, max: 700, step: 5, value: 300, unit: 'K' });
    sim.out('eg', 'Banda prohibida E_g(T)'); sim.out('ni', 'Concentración intrínseca n_i'); sim.out('n', 'Electrones n', { hl: true }); sim.out('p', 'Huecos p', { hl: true }); sim.out('ef', 'E_F − E_i');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p, m = MAT[p.m];
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const E = eg(m, p.T), ca = carriers(m, p.N, p.t, p.T), VT = K * p.T;
      const efi = p.t === 'i' ? 0 : (p.t === 'n' ? 1 : -1) * VT * Math.asinh(p.N / (2 * ca.ni));
      /* diagrama de bandas */
      const bx = 40, bw = w * 0.34, ytop = 36, ybot = h - 40, sc = (ybot - ytop) / 2.2, yc = (ytop + ybot) / 2;
      const yEc = yc - E / 2 * sc, yEv = yc + E / 2 * sc;
      c.fillStyle = EM.alpha('--c1', 0.25); c.fillRect(bx, ytop, bw, yEc - ytop); c.fillStyle = EM.alpha('--c2', 0.22); c.fillRect(bx, yEv, bw, ybot - yEv);
      c.strokeStyle = EM.col('--ink'); c.lineWidth = 2.4; c.beginPath(); c.moveTo(bx, yEc); c.lineTo(bx + bw, yEc); c.moveTo(bx, yEv); c.lineTo(bx + bw, yEv); c.stroke();
      c.setLineDash([6, 5]); c.lineWidth = 1.4; c.strokeStyle = EM.col('--ink-3'); c.beginPath(); c.moveTo(bx, yc); c.lineTo(bx + bw, yc); c.stroke(); c.setLineDash([]);
      c.strokeStyle = EM.col('--accent'); c.lineWidth = 3; const yF = yc - efi * sc; c.beginPath(); c.moveTo(bx, yF); c.lineTo(bx + bw, yF); c.stroke();
      EM.text(c, 'E_c  (conducción)', bx + bw + 8, yEc, { size: 12, color: '--ink-2', baseline: 'middle' }); EM.text(c, 'E_v  (valencia)', bx + bw + 8, yEv, { size: 12, color: '--ink-2', baseline: 'middle' });
      EM.text(c, 'E_F', bx + bw + 8, yF, { size: 13, color: '--accent', weight: 700, baseline: 'middle' }); EM.text(c, 'E_i', bx + 8, yc - 10, { size: 11.5, color: '--ink-3' });
      EM.text(c, 'E_g = ' + EM.fix(E, 3) + ' eV', bx + bw / 2, (yEc + yEv) / 2 + 4, { size: 13, color: '--ink-2', align: 'center', weight: 600 });
      if (p.t === 'n') { c.setLineDash([2, 4]); c.strokeStyle = EM.col('--c3'); c.beginPath(); c.moveTo(bx + bw * 0.2, yEc + 0.045 * sc); c.lineTo(bx + bw * 0.8, yEc + 0.045 * sc); c.stroke(); c.setLineDash([]); EM.text(c, 'nivel de donores', bx + bw * 0.5, yEc + 0.045 * sc + 12, { size: 11, color: '--c3', align: 'center' }); }
      if (p.t === 'p') { c.setLineDash([2, 4]); c.strokeStyle = EM.col('--c3'); c.beginPath(); c.moveTo(bx + bw * 0.2, yEv - 0.045 * sc); c.lineTo(bx + bw * 0.8, yEv - 0.045 * sc); c.stroke(); c.setLineDash([]); EM.text(c, 'nivel de aceptores', bx + bw * 0.5, yEv - 0.045 * sc - 10, { size: 11, color: '--c3', align: 'center' }); }
      /* barras de portadores (escala logarítmica) */
      const gx = w - 96, gh = ybot - ytop, lg = (v) => Math.max(0, Math.min(1, (Math.log10(Math.max(v, 1)) + 0) / 21));
      c.fillStyle = EM.alpha('--ink', 0.05); c.fillRect(gx - 40, ytop, 36, gh); c.fillRect(gx + 10, ytop, 36, gh);
      c.fillStyle = EM.col('--c1'); c.fillRect(gx - 40, ybot - lg(ca.n) * gh, 36, lg(ca.n) * gh); c.fillStyle = EM.col('--c2'); c.fillRect(gx + 10, ybot - lg(ca.p) * gh, 36, lg(ca.p) * gh);
      EM.text(c, 'n', gx - 22, ybot + 14, { size: 13, color: '--c1', align: 'center', weight: 700 }); EM.text(c, 'p', gx + 28, ybot + 14, { size: 13, color: '--c2', align: 'center', weight: 700 });
      for (const e of [0, 5, 10, 15, 20]) { const y = ybot - e / 21 * gh; c.strokeStyle = EM.col('--grid-2'); c.beginPath(); c.moveTo(gx - 46, y); c.lineTo(gx + 50, y); c.stroke(); EM.text(c, '10^{' + e + '}', gx + 52, y, { size: 10.5, color: '--ink-3', baseline: 'middle' }); }
      sim.set('eg', EM.fix(E, 3) + ' eV'); sim.set('ni', EM.sci(ca.ni, 3) + ' cm⁻³'); sim.set('n', EM.sci(ca.n, 3) + ' cm⁻³'); sim.set('p', EM.sci(ca.p, 3) + ' cm⁻³'); sim.set('ef', (efi >= 0 ? '+' : '') + EM.fix(efi, 3) + ' eV');
    });
  });

  /* 11.2 n_i(T) y n(T) */
  EM.defineSim('c11-ni', function (sim) {
    const cv = sim.canvas({ aspect: 1.8, label: 'Concentración de portadores frente a la temperatura' });
    sim.group('Dopado');
    sim.select('m', { label: 'Material del dopado', options: Object.entries(MAT).map(([k, v]) => [k, v.name]), value: 'Si' });
    sim.slider('N', { label: 'Donores N_D', min: 1e12, max: 1e19, value: 1e16, unit: 'cm⁻³', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.out('tx', 'Temperatura de paso a intrínseco (n_i = N_D)', { hl: true }); sim.out('n300', 'n a 300 K');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 200, xmax: 800, ymin: 1e4, ymax: 1e20, ylog: true, ml: 70, mr: 14, mt: 14, mb: 40, xlabel: 'temperatura (K)', ylabel: 'concentración (cm⁻³)' });
      pl.frame();
      const Ts = M.linspace(200, 800, 241);
      for (const [k, m] of Object.entries(MAT)) pl.xy(Ts, Ts.map((T) => nIntr(m, T)), { color: m.col, width: k === p.m ? 2.6 : 1.4, dash: [6, 4] });
      const m = MAT[p.m];
      pl.xy(Ts, Ts.map((T) => carriers(m, p.N, 'n', T).n), { color: '--accent', width: 3 });
      pl.hline(p.N, { color: '--ink-3', dash: [2, 4] });
      let Tx = NaN; for (const T of Ts) if (nIntr(m, T) >= p.N) { Tx = T; break; }
      if (isFinite(Tx)) pl.vline(Tx, { color: '--c2', dash: [3, 4] });
      pl.legend([{ label: 'n_i Si', color: '--c1', kind: 'dash' }, { label: 'n_i Ge', color: '--c2', kind: 'dash' }, { label: 'n_i GaAs', color: '--c3', kind: 'dash' }, { label: 'n (' + m.name + ' tipo n)', color: '--accent' }], 'tl');
      sim.set('tx', isFinite(Tx) ? `${Math.round(Tx)} K (${Math.round(Tx - 273.15)} °C)` : '> 800 K'); sim.set('n300', EM.sci(carriers(m, p.N, 'n', 300).n, 3) + ' cm⁻³');
    });
  });

  /* 11.3 Resistividad */
  EM.defineSim('c11-resistividad', function (sim) {
    const cv = sim.canvas({ aspect: 1.8, label: 'Resistividad del silicio' });
    sim.group('Dopado');
    sim.slider('N', { label: 'Concentración de impurezas', min: 1e12, max: 1e20, value: 1e16, unit: 'cm⁻³', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.out('rn', 'ρ tipo n', { hl: true }); sim.out('rp', 'ρ tipo p', { hl: true }); sim.out('mn', 'μ_n y μ_p'); sim.out('r', 'Resistencia de una barra 1 mm² × 1 cm (tipo n)');
    const si = MAT.Si;
    const rho = (N, type) => { const ca = carriers(si, N, type, 300); return 1 / (Q * (ca.n * mob(si.mun, N) + ca.p * mob(si.mup, N))); };
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 1e12, xmax: 1e20, xlog: true, ymin: 1e-3, ymax: 1e6, ylog: true, ml: 66, mr: 14, mt: 14, mb: 40, xlabel: 'concentración de impurezas (cm⁻³)', ylabel: 'resistividad (Ω·cm)' });
      pl.frame();
      const Ns = M.linspace(12, 20, 200).map((e) => Math.pow(10, e));
      pl.xy(Ns, Ns.map((N) => rho(N, 'n')), { color: '--c1', width: 2.6 }); pl.xy(Ns, Ns.map((N) => rho(N, 'p')), { color: '--c2', width: 2.6 });
      pl.vline(p.N, { color: '--ink-3', dash: [3, 4] }); pl.dot(p.N, rho(p.N, 'n'), { color: '--c1', r: 6 }); pl.dot(p.N, rho(p.N, 'p'), { color: '--c2', r: 6 });
      pl.legend([{ label: 'tipo n', color: '--c1' }, { label: 'tipo p', color: '--c2' }], 'tr');
      sim.set('rn', EM.sci(rho(p.N, 'n'), 3) + ' Ω·cm'); sim.set('rp', EM.sci(rho(p.N, 'p'), 3) + ' Ω·cm');
      sim.set('mn', `${EM.fix(mob(si.mun, p.N), 0)} y ${EM.fix(mob(si.mup, p.N), 0)} cm²/V·s`); sim.set('r', fmt(rho(p.N, 'n') * 1 / 0.01, 'Ω'));
    });
  });

  /* 11.4 Deriva y difusión */
  EM.defineSim('c11-transporte', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, label: 'Deriva y difusión de portadores' });
    sim.group('Campo y reinicio');
    sim.slider('E', { label: 'Campo eléctrico E', min: 0, max: 500, step: 10, value: 100, unit: 'V/cm' });
    sim.button('Reiniciar la difusión', () => init(), { primary: true });
    sim.out('vd', 'Velocidad de deriva μE (μ_n = 1350)', { hl: true }); sim.out('vt', 'Velocidad térmica ≈ 10⁷ cm/s'); sim.out('sig', 'Anchura σ = √(2Dt) (D = 34.9 cm²/s)');
    const NP = 90, ND = 400;
    let dr = [], df = [], t = 0, xs = 0;
    function init() { dr = Array.from({ length: NP }, () => ({ x: Math.random(), y: Math.random() })); df = Array.from({ length: ND }, () => ({ x: (Math.random() - 0.5) * 0.02 })); t = 0; xs = 0; }
    init();
    const gauss = () => { let u = 0, v = Math.random(); while (u === 0) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    sim.animate((dt) => {
      const E = sim.p.E, vd = 1350 * E; /* cm/s */
      t += dt * 4e-9 * 1e3; /* tiempo físico simulado: 1 s de pantalla ≈ 4 µs */
      for (const q of dr) { q.x += gauss() * 0.012 + vd / 1e7 * 0.06 * dt * 20; q.y += gauss() * 0.012; if (q.x > 1) q.x -= 1; if (q.x < 0) q.x += 1; q.y = (q.y + 1) % 1; }
      xs += vd / 1e7 * 0.06 * dt * 20;
      for (const q of df) q.x += gauss() * 0.006;
    });
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const h1 = h * 0.46, pad = 20;
      /* panel superior: deriva */
      c.strokeStyle = EM.col('--rule-strong'); c.strokeRect(pad, 24, w - 2 * pad, h1 - 24);
      EM.text(c, 'Deriva: electrones con un campo E hacia la derecha  (arrastre neto = ' + EM.fix(xs * 100, 1) + ' % del ancho)', pad, 14, { size: 12, color: '--ink-2', weight: 600 });
      for (const q of dr) { c.fillStyle = EM.col('--c1'); c.beginPath(); c.arc(pad + q.x * (w - 2 * pad), 24 + q.y * (h1 - 24), 3, 0, Math.PI * 2); c.fill(); }
      const ex = pad + 20, ey = 24 + (h1 - 24) / 2; c.strokeStyle = EM.col('--efield'); c.fillStyle = EM.col('--efield'); c.lineWidth = 2; const L = 20 + p.E * 0.12; c.beginPath(); c.moveTo(w - pad - 20 - L, ey - (h1 - 24) / 2 + 14); c.lineTo(w - pad - 20, ey - (h1 - 24) / 2 + 14); c.stroke(); c.beginPath(); c.moveTo(w - pad - 20, ey - (h1 - 24) / 2 + 14); c.lineTo(w - pad - 30, ey - (h1 - 24) / 2 + 9); c.lineTo(w - pad - 30, ey - (h1 - 24) / 2 + 19); c.fill();
      EM.text(c, 'E', w - pad - 20 - L - 10, ey - (h1 - 24) / 2 + 14, { size: 12, color: '--efield', weight: 700, align: 'right', baseline: 'middle' });
      /* panel inferior: difusión (histograma) */
      const y0 = h1 + 34, hh = h - y0 - 24;
      EM.text(c, 'Difusión: partículas lanzadas desde el centro (sin campo) y perfil gaussiano esperado', pad, y0 - 10, { size: 12, color: '--ink-2', weight: 600 });
      const bins = 48, hist = new Array(bins).fill(0);
      for (const q of df) { const k = Math.floor((q.x + 0.5) * bins); if (k >= 0 && k < bins) hist[k]++; }
      const hm = Math.max(...hist, 10) * 1.1;
      c.fillStyle = EM.alpha('--c3', 0.6); hist.forEach((n, k) => { const x = pad + k / bins * (w - 2 * pad), bw = (w - 2 * pad) / bins; c.fillRect(x + 1, y0 + hh - n / hm * hh, bw - 2, n / hm * hh); });
      let s2 = 0; for (const q of df) s2 += q.x * q.x; const sg = Math.sqrt(s2 / df.length);
      c.strokeStyle = EM.col('--c2'); c.lineWidth = 2; c.beginPath(); for (let i = 0; i <= 200; i++) { const x = -0.5 + i / 200, y = ND / (sg * Math.sqrt(2 * Math.PI)) * Math.exp(-x * x / (2 * sg * sg)) / bins; const px = pad + (x + 0.5) * (w - 2 * pad), py = y0 + hh - y / hm * hh; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
      c.strokeStyle = EM.col('--axis'); c.beginPath(); c.moveTo(pad, y0 + hh); c.lineTo(w - pad, y0 + hh); c.stroke();
      sim.set('vd', fmt(1350 * p.E / 100, 'm/s')); sim.set('vt', '≈ 100 km/s'); sim.set('sig', EM.fix(Math.sqrt(2 * 34.9 * Math.max(t, 1e-12)) * 1e4, 1) + ' µm tras ' + EM.fix(t * 1e6, 2) + ' µs');
    });
  });
})();
