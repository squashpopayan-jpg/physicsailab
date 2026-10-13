/* Capítulo 1 — La crisis de la física clásica */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, K = P.K, M = CQ.M;
  const f2 = (v) => CQ.fix(v, 2), f3 = (v) => CQ.fix(v, 3);

  /* ======================================================================
     1.1 Cuerpo negro
     ====================================================================== */
  {
    CQ.defineSim('cuerpo-negro', function (sim) {
      const cv = sim.canvas({ aspect: 1.75 });
      sim.group('Temperaturas');
      sim.slider('T', { label: 'Temperatura <i>T</i>', min: 300, max: 12000, value: 5800, log: true, step: 10, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
      sim.check('two', { label: 'Comparar con una segunda temperatura', value: true });
      sim.slider('T2', { label: 'Segunda temperatura <i>T</i>₂', min: 300, max: 12000, value: 3000, log: true, step: 10, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
      sim.group('Curvas');
      sim.check('rj', { label: 'Rayleigh–Jeans (clásica)', value: true });
      sim.check('wien', { label: 'Aproximación de Wien', value: false });
      sim.check('vis', { label: 'Banda visible', value: true });
      sim.out('lmax', 'λ<sub>máx</sub> (numérico)', { hl: true });
      sim.out('lT', 'λ<sub>máx</sub>·<i>T</i>');
      sim.out('b', 'Constante de Wien <i>b</i>');
      sim.out('M', 'Emitancia ∫π<i>B</i><sub>λ</sub>dλ', { hl: true });
      sim.out('sT4', 'σ<i>T</i>⁴');
      sim.out('fv', 'Fracción en el visible');
      sim.out('Ep', 'Fotón en el máximo');
      const h = K.h, c = K.c, kB = K.kB;
      const B = (l, T) => (2 * h * c * c) / l ** 5 / (Math.expm1((h * c) / (l * kB * T)));
      const RJ = (l, T) => (2 * c * kB * T) / l ** 4;
      const W = (l, T) => (2 * h * c * c) / l ** 5 * Math.exp(-(h * c) / (l * kB * T));
      sim.onDraw(() => {
        const T = sim.p.T, T2 = sim.p.T2;
        sim.ctl.T2.show(sim.p.two);
        const Tm = sim.p.two ? Math.min(T, T2) : T;
        const xmax = M.clamp((5.5 * K.b_wien) / Tm * 1e6, 1.2, 40); /* µm */
        const lm = P.util.golden((l) => -B(l, T), 50e-9, 100e-6, 1e-13).x;
        const peakW = Math.max(B(lm, T), sim.p.two ? B(P.util.golden((l) => -B(l, T2), 50e-9, 100e-6, 1e-13).x, T2) : 0) * 1e-6;
        /* unidad del eje vertical adaptada: W, kW, MW por (m² sr µm) */
        const e3 = M.clamp(Math.floor(Math.log10(peakW) / 3), 0, 2);
        const us = Math.pow(10, 3 * e3), un = ['W', 'kW', 'MW'][e3];
        const sc = 1e-6 / us;
        const peak = peakW / us;
        CQ.draw.clear(cv);
        const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax, ymin: 0, ymax: peak * 1.18, xlabel: 'longitud de onda λ (µm)', ylabel: `B_λ (${un} m⁻² sr⁻¹ µm⁻¹)`, ml: 62 });
        pl.frame();
        if (sim.p.vis) {
          pl.clip((ctx) => {
            for (let nm = 380; nm < 750; nm += 2) {
              const col = CQ.wavelengthRGB ? CQ.wavelengthRGB(nm) : [128, 128, 128];
              ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.22)`;
              ctx.fillRect(pl.X(nm / 1000), pl.iy, pl.X((nm + 2) / 1000) - pl.X(nm / 1000) + 0.5, pl.ih);
            }
          });
        }
        const curve = (TT, col, w) => {
          pl.fn((x) => B(x * 1e-6, TT) * sc, { color: col, width: w, n: 600, from: 0.01 });
          if (sim.p.rj) pl.fn((x) => RJ(x * 1e-6, TT) * sc, { color: col, width: 1.5, dash: [6, 4], from: 0.01, n: 400 });
          if (sim.p.wien) pl.fn((x) => W(x * 1e-6, TT) * sc, { color: col, width: 1.3, dash: [2, 3], from: 0.01, n: 400 });
        };
        if (sim.p.two) curve(T2, '--c2', 2);
        curve(T, '--c1', 2.6);
        pl.dot(lm * 1e6, B(lm, T) * sc, { color: '--c1', label: 'λ_{máx}', r: 4.5 });
        const leg = [{ label: `Planck, T = ${CQ.fix(T, 0)} K`, color: '--c1' }];
        if (sim.p.two) leg.push({ label: `Planck, T = ${CQ.fix(T2, 0)} K`, color: '--c2' });
        if (sim.p.rj) leg.push({ label: 'Rayleigh–Jeans', color: '--ink-3', dash: [6, 4] });
        if (sim.p.wien) leg.push({ label: 'Wien', color: '--ink-3', dash: [2, 3] });
        pl.legend(leg);
        /* lecturas */
        /* emitancia total: π∫B_λ dλ, integrada en x = hc/(λk_BT) → (2πk⁴T⁴/h³c²)∫x³/(eˣ−1)dx */
        const Jx = P.integ.fn((x) => (x < 1e-9 ? x * x : x ** 3 / Math.expm1(x)), 0, 60, 3000);
        const tot = (2 * Math.PI * kB ** 4 * T ** 4 * Jx) / (h ** 3 * c * c);
        const vis = Math.PI * P.integ.fn((l) => B(l, T), 380e-9, 750e-9, 400);
        sim.set('lmax', CQ.fix(lm * 1e9, 1) + ' nm');
        sim.set('lT', CQ.sci(lm * T, 5) + ' m·K');
        sim.set('b', CQ.sci(K.b_wien, 5) + ' m·K');
        sim.set('M', CQ.si(tot, 'W/m²', 4));
        sim.set('sT4', CQ.si(K.sigmaSB * T ** 4, 'W/m²', 4));
        sim.set('fv', CQ.fix(100 * vis / tot, 1) + ' %');
        sim.set('Ep', f3(K.hc_eVnm / (lm * 1e9)) + ' eV');
      });
    });
  }

  /* ======================================================================
     1.2 Efecto fotoeléctrico
     ====================================================================== */
  CQ.defineSim('fotoelectrico', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    const cp = sim.canvas({ aspect: 2.4 });
    const METALS = { Cs: ['Cesio', 2.14], K: ['Potasio', 2.29], Na: ['Sodio', 2.36], Zn: ['Cinc', 4.33], Cu: ['Cobre', 4.65], Pt: ['Platino', 5.65] };
    sim.group('Metal y luz');
    sim.select('m', { label: 'Metal (función de trabajo φ)', options: Object.keys(METALS).map((k) => [k, `${METALS[k][0]} · φ = ${METALS[k][1]} eV`]), value: 'Na' });
    sim.slider('lam', { label: 'Longitud de onda λ', min: 120, max: 800, value: 420, step: 1, unit: 'nm', fmt: (v) => CQ.fix(v, 0) });
    sim.slider('I', { label: 'Intensidad (fotones por segundo)', min: 0, max: 100, value: 50, step: 1, unit: '%', fmt: (v) => CQ.fix(v, 0) });
    sim.group('Circuito');
    sim.slider('V', { label: 'Voltaje del colector <i>V</i>', min: -3, max: 3, value: 0, step: 0.05, unit: 'V', fmt: f2 });
    sim.note('Con <i>V</i> negativo el colector frena a los electrones: la corriente se anula cuando −<i>V</i> ≥ <i>V</i><sub>0</sub>.');
    sim.out('Ef', 'Energía del fotón <i>h</i>ν', { hl: true });
    sim.out('Km', '<i>K</i><sub>máx</sub> = <i>h</i>ν − φ', { hl: true });
    sim.out('V0', 'Potencial de frenado <i>V</i><sub>0</sub>');
    sim.out('v', 'Rapidez máxima');
    sim.out('l0', 'Longitud de onda umbral');
    sim.out('cur', 'Corriente medida');
    const rng = P.rng(4);
    let photons = [], electrons = [], hits = 0, tAcc = 0, window1 = [];
    const reset = () => { photons = []; electrons = []; hits = 0; window1 = []; };
    sim.resetButton(reset);
    sim.onChange = (id) => { if (id === 'm' || id === 'lam') reset(); };
    sim.animate((dt) => {
      const phi = METALS[sim.p.m][1], Ef = K.hc_eVnm / sim.p.lam, Km = Ef - phi;
      tAcc += dt * sim.p.I * 0.6;
      while (tAcc > 1) { tAcc -= 1; photons.push({ x: 0.1, y: 0.25 + 0.5 * rng(), ph: rng() * 6 }); }
      for (const p of photons) p.x += dt * 0.9;
      const plate = 0.42;
      photons = photons.filter((p) => {
        if (p.x < plate) return true;
        if (Km > 0) { const K0 = Km * rng(); electrons.push({ x: plate + 0.01, y: p.y, K: K0, v: Math.sqrt(K0) }); }
        return false;
      });
      for (const e of electrons) {
        /* campo uniforme entre placas (0.42 → 0.92): aceleración ∝ V */
        const a = sim.p.V * 1.2;
        e.K += a * dt * e.v;
        if (e.K <= 0) { e.back = true; e.K = Math.max(e.K, 0); }
        e.v = e.back ? -Math.max(0.05, Math.abs(e.v)) : Math.sqrt(Math.max(e.K, 0)) + 0.04;
        e.x += e.v * dt * 0.5;
      }
      const now = performance.now() / 1000;
      electrons = electrons.filter((e) => {
        if (e.x >= 0.92) { window1.push(now); hits++; return false; }
        return e.x > plate - 0.005;
      });
      window1 = window1.filter((t) => now - t < 2);
    });
    sim.onDraw(() => {
      const phi = METALS[sim.p.m][1], Ef = K.hc_eVnm / sim.p.lam, Km = Ef - phi;
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      CQ.draw.clear(cv);
      const col = CQ.wavelengthRGB(M.clamp(sim.p.lam, 380, 780));
      const phCol = sim.p.lam < 380 ? CQ.col('--c5') : `rgb(${col[0]},${col[1]},${col[2]})`;
      /* lámpara */
      ctx.fillStyle = CQ.col('--surface-3'); ctx.fillRect(W * 0.02, H * 0.3, W * 0.06, H * 0.4);
      CQ.text(ctx, sim.p.lam < 380 ? 'UV' : 'luz', W * 0.05, H * 0.27, { size: 11, align: 'center', color: '--ink-3' });
      /* placas */
      ctx.fillStyle = CQ.col('--ink-2'); ctx.fillRect(W * 0.42, H * 0.15, 7, H * 0.7);
      ctx.fillStyle = CQ.col('--ink-3'); ctx.fillRect(W * 0.92, H * 0.15, 7, H * 0.7);
      CQ.text(ctx, METALS[sim.p.m][0], W * 0.42 + 3, H * 0.12, { size: 12, align: 'center', color: '--ink' });
      CQ.text(ctx, 'colector', W * 0.92 + 3, H * 0.12, { size: 12, align: 'center', color: '--ink-2' });
      CQ.text(ctx, `V = ${CQ.fix(sim.p.V, 2)} V`, W * 0.67, H * 0.95, { size: 12, align: 'center', color: '--ink-2', mono: true });
      /* fotones como ondas cortas */
      ctx.strokeStyle = phCol; ctx.lineWidth = 1.8;
      for (const p of photons) {
        ctx.beginPath();
        for (let s = 0; s <= 16; s++) { const xx = W * (p.x - 0.03 + s * 0.0022), yy = H * p.y + 4 * Math.sin(p.ph + s * (560 / sim.p.lam) * 1.2); if (s) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
        ctx.stroke();
      }
      for (const e of electrons) { ctx.beginPath(); ctx.arc(W * e.x, H * e.y, 3.6, 0, 7); ctx.fillStyle = CQ.col('--neg'); ctx.fill(); }
      if (Km <= 0) CQ.text(ctx, 'hν < φ: ningún electrón escapa', W * 0.67, H * 0.5, { size: 14, align: 'center', color: '--warn-ink', weight: 650, halo: true });
      /* gráfica K_max(ν) */
      CQ.draw.clear(cp);
      const nu = (K.c / (sim.p.lam * 1e-9)) / 1e15;
      const pl = new CQ.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 2.6, ymin: 0, ymax: 6, xlabel: 'frecuencia ν (10¹⁵ Hz)', ylabel: 'K_máx (eV)' });
      pl.frame();
      const hEv = K.h / K.e * 1e15;
      for (const k of Object.keys(METALS)) {
        const f = METALS[k][1];
        pl.fn((x) => hEv * x - f, { color: k === sim.p.m ? '--accent' : '--grid-2', width: k === sim.p.m ? 2.4 : 1.4, from: f / hEv });
        if (k === sim.p.m) pl.label(f / hEv, 0.2, `ν₀ (${k})`, { color: '--accent', size: 11, align: 'center' });
      }
      if (Km > 0) pl.dot(nu, Km, { color: '--accent', label: 'medida' });
      pl.vline(nu, { color: '--ink-3' });
      const cur = window1.length / 2;
      sim.set('Ef', f3(Ef) + ' eV');
      sim.set('Km', Km > 0 ? f3(Km) + ' eV' : '0 (bajo el umbral)');
      sim.set('V0', Km > 0 ? f3(Km) + ' V' : '—');
      sim.set('v', Km > 0 ? CQ.si(Math.sqrt((2 * Km * K.e) / K.me), 'm/s') : '—');
      sim.set('l0', CQ.fix(K.hc_eVnm / phi, 0) + ' nm');
      sim.set('cur', CQ.fix(cur, 1) + ' e⁻/s (simulado)');
    });
  });

  /* ======================================================================
     1.3 Bohr: niveles y espectro
     ====================================================================== */
  CQ.defineSim('bohr', function (sim) {
    sim.cols2();
    const co = sim.canvas({ aspect: 1 });
    const cl = sim.canvas({ aspect: 1 });
    const cs = sim.canvas({ aspect: 5, cls: 'full' });
    const SER = { 1: 'Lyman', 2: 'Balmer', 3: 'Paschen', 4: 'Brackett' };
    sim.group('Átomo');
    sim.slider('Z', { label: 'Carga nuclear <i>Z</i> (H, He⁺, Li²⁺, Be³⁺)', min: 1, max: 4, value: 1, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.check('mu', { label: 'Corrección de masa reducida', value: true });
    sim.group('Transición');
    sim.seg('nf', { label: 'Serie (nivel final)', options: [[1, 'Lyman'], [2, 'Balmer'], [3, 'Paschen'], [4, 'Brackett']], value: 2 });
    sim.slider('ni', { label: 'Nivel inicial <i>n</i><sub>i</sub>', min: 2, max: 9, value: 3, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('Ei', '<i>E</i><sub>i</sub>');
    sim.out('Ef', '<i>E</i><sub>f</sub>');
    sim.out('dE', 'Energía del fotón', { hl: true });
    sim.out('lam', 'Longitud de onda', { hl: true });
    sim.out('reg', 'Región');
    sim.out('r', 'Radio de la órbita inicial');
    let t = 0, phase = 0;
    sim.animate((dt) => { t += dt; phase += dt; });
    sim.onChange = (id) => {
      if (id === 'nf' || id === 'ni') {
        if (sim.p.ni <= sim.p.nf) sim.ctl.ni.set(sim.p.nf + 1, true);
        phase = 0;
      }
    };
    const Ry = (Z) => 13.605693 * Z * Z * (sim.p.mu ? 1 / (1 + K.me / K.mp) : 1);
    sim.onDraw(() => {
      const Z = sim.p.Z, nf = sim.p.nf, ni = Math.max(sim.p.ni, nf + 1);
      const E = (n) => -Ry(Z) / (n * n);
      const dE = E(ni) - E(nf), lam = K.hc_eVnm / dE;
      /* órbitas */
      CQ.draw.clear(co);
      const ctx = co.ctx, cx = co.w / 2, cy = co.h / 2;
      const nmax = Math.max(4, ni + 1), s = (Math.min(co.w, co.h) * 0.46) / (nmax * nmax);
      for (let n = 1; n <= nmax; n++) {
        ctx.beginPath(); ctx.arc(cx, cy, n * n * s, 0, 7);
        ctx.strokeStyle = n === ni || n === nf ? CQ.col('--accent') : CQ.col('--grid-2');
        ctx.lineWidth = n === ni || n === nf ? 1.6 : 1; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(cx, cy, 5 + Z, 0, 7); ctx.fillStyle = CQ.col('--pos'); ctx.fill();
      const cyc = phase % 3;
      const nNow = cyc < 1.5 ? ni : nf;
      const ang = t * 2.5 / nNow ** 1.5;
      const rr = nNow * nNow * s;
      ctx.beginPath(); ctx.arc(cx + rr * Math.cos(ang), cy - rr * Math.sin(ang), 5, 0, 7); ctx.fillStyle = CQ.col('--neg'); ctx.fill();
      if (cyc >= 1.5 && cyc < 2.4) {
        const col = lam >= 380 && lam <= 780 ? CQ.wavelengthRGB(lam) : [150, 110, 220];
        const k = (cyc - 1.5) / 0.9;
        ctx.strokeStyle = `rgb(${col[0]},${col[1]},${col[2]})`; ctx.lineWidth = 2;
        ctx.beginPath();
        const x0 = cx + rr * Math.cos(ang), y0 = cy - rr * Math.sin(ang);
        for (let q = 0; q <= 30; q++) { const d = 20 + k * co.w * 0.4 + q * 2; const xx = x0 + d * 0.7, yy = y0 - d * 0.7 + 4 * Math.sin(q * 1.2); if (q) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
        ctx.stroke();
      }
      CQ.text(ctx, `r_n = n² a₀/Z`, 10, 18, { size: 12, color: '--ink-2', halo: true });
      /* diagrama de niveles */
      CQ.draw.clear(cl);
      const Emin = -Ry(Z) * 1.08;
      const pl = new CQ.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 0, xmax: 1, ymin: Emin, ymax: Ry(Z) * 0.08, ylabel: 'E (eV)', xticks: [], mb: 14, grid: false });
      pl.frame();
      for (let n = 1; n <= 12; n++) {
        const on = n === ni || n === nf;
        CQ.drawLevels(pl, [{ E: E(n), color: on ? '--accent' : '--ink-3', width: on ? 2.2 : 1, x0: 0.08, x1: 0.62, label: n <= 3 || on ? `n = ${n}` : '' }]);
      }
      pl.hline(0, { color: '--ink-2', label: 'continuo (E = 0)', labelRight: true });
      pl.arrow(0.35, E(ni), 0.35, E(nf), { color: '--accent', width: 2.2 });
      pl.label(0.37, (E(ni) + E(nf)) / 2, `${CQ.fix(dE, 3)} eV`, { color: '--accent', size: 12 });
      /* espectro */
      CQ.draw.clear(cs);
      const sctx = cs.ctx, ps = new CQ.Plot(sctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 50, xmax: 5000, xlog: true, ymin: 0, ymax: 1, yticks: [], xlabel: 'λ (nm), escala logarítmica', mt: 6, mb: 34, ml: 20, grid: false });
      ps.frame();
      ps.clip((c2) => {
        for (let nm = 380; nm < 780; nm += 3) { const col = CQ.wavelengthRGB(nm); c2.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.18)`; c2.fillRect(ps.X(nm), ps.iy, ps.X(nm + 3) - ps.X(nm) + 0.5, ps.ih); }
        for (let n = nf + 1; n <= 30; n++) {
          const l = K.hc_eVnm / (E(n) - E(nf));
          const col = l >= 380 && l <= 780 ? CQ.wavelengthRGB(l) : null;
          c2.strokeStyle = col ? `rgb(${col[0]},${col[1]},${col[2]})` : CQ.col('--ink-3');
          c2.lineWidth = n === ni ? 3.5 : 1.3;
          c2.globalAlpha = n === ni ? 1 : 0.8;
          c2.beginPath(); c2.moveTo(ps.X(l), ps.iy + 2); c2.lineTo(ps.X(l), ps.iy + ps.ih); c2.stroke();
        }
        c2.globalAlpha = 1;
      });
      CQ.text(sctx, `Serie de ${SER[nf]}`, 26, 18, { size: 12, color: '--ink-2', halo: true, weight: 600 });
      sim.set('Ei', f3(E(ni)) + ' eV');
      sim.set('Ef', f3(E(nf)) + ' eV');
      sim.set('dE', f3(dE) + ' eV');
      sim.set('lam', CQ.fix(lam, 2) + ' nm');
      sim.set('reg', lam < 380 ? 'ultravioleta' : lam <= 780 ? 'visible' : 'infrarrojo');
      sim.set('r', CQ.fix((ni * ni * 0.529177) / Z, 3) + ' Å');
    });
  });

  /* ======================================================================
     1.4 Doble rendija
     ====================================================================== */
  CQ.defineSim('doble-rendija', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    const ch = sim.canvas({ aspect: 3.2 });
    sim.group('Geometría (unidades de λ)');
    sim.slider('d', { label: 'Separación de rendijas <i>d</i>', min: 2, max: 12, value: 5, step: 0.5, unit: 'λ', fmt: (v) => CQ.fix(v, 1) });
    sim.slider('a', { label: 'Ancho de cada rendija <i>a</i>', min: 0.5, max: 3, value: 1, step: 0.1, unit: 'λ', fmt: (v) => CQ.fix(v, 1) });
    sim.group('Experimento');
    sim.slider('rate', { label: 'Partículas por segundo', min: 5, max: 800, value: 120, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.check('path', { label: 'Detector de camino (¿por qué rendija pasó?)', value: false });
    sim.check('th', { label: 'Mostrar la curva teórica', value: true });
    sim.out('N', 'Partículas detectadas', { hl: true });
    sim.out('fr', 'Separación entre franjas (sen θ)');
    const rng = P.rng(12);
    const NB = 120, SMAX = 0.9; /* sen θ ∈ [−0.9, 0.9] */
    let hits = [], hist = new Float64Array(NB), acc = 0;
    const reset = () => { hits = []; hist = new Float64Array(NB); };
    sim.resetButton(reset);
    sim.onChange = (id) => { if (id !== 'rate' && id !== 'th') reset(); };
    const I = (s) => {
      const b = Math.PI * sim.p.a * s, env = b === 0 ? 1 : (Math.sin(b) / b) ** 2;
      return sim.p.path ? env : env * Math.cos(Math.PI * sim.p.d * s) ** 2;
    };
    sim.animate((dt) => {
      acc += dt * sim.p.rate;
      let n = 0;
      while (acc >= 1 && n < 400) {
        acc -= 1; n++;
        let s;
        for (let g = 0; g < 400; g++) { s = (2 * rng() - 1) * SMAX; if (rng() < I(s)) break; }
        hits.push([s, rng()]);
        if (hits.length > 6000) hits.shift();
        const b = Math.floor(((s + SMAX) / (2 * SMAX)) * NB);
        if (b >= 0 && b < NB) hist[b]++;
      }
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      CQ.draw.clear(cv);
      /* fuente, barrera y pantalla */
      const xb = W * 0.25, xs = W * 0.88;
      ctx.fillStyle = CQ.col('--ink-3');
      const yc = H / 2, gap = M.clamp(sim.p.d * 5, 12, H * 0.35), wsl = M.clamp(sim.p.a * 5, 3, 16);
      ctx.fillRect(xb - 3, 0, 6, yc - gap / 2 - wsl / 2);
      ctx.fillRect(xb - 3, yc - gap / 2 + wsl / 2, 6, gap - wsl);
      ctx.fillRect(xb - 3, yc + gap / 2 + wsl / 2, 6, H - (yc + gap / 2 + wsl / 2));
      ctx.beginPath(); ctx.arc(W * 0.05, yc, 8, 0, 7); ctx.fillStyle = CQ.col('--neg'); ctx.fill();
      CQ.text(ctx, 'fuente', W * 0.05, yc + 24, { size: 11, align: 'center', color: '--ink-3' });
      /* frentes de onda */
      ctx.strokeStyle = CQ.alpha('--c1', 0.25); ctx.lineWidth = 1;
      const tt = performance.now() / 600;
      for (let k = 0; k < 8; k++) { const r = ((k + tt) % 8) * (xb - W * 0.05) / 8; ctx.beginPath(); ctx.arc(W * 0.05, yc, r, -0.6, 0.6); ctx.stroke(); }
      if (!sim.p.path) for (const sy of [yc - gap / 2, yc + gap / 2]) for (let k = 0; k < 10; k++) { const r = ((k + tt) % 10) * (xs - xb) / 10; ctx.beginPath(); ctx.arc(xb, sy, r, -1.2, 1.2); ctx.stroke(); }
      else {
        for (const sy of [yc - gap / 2, yc + gap / 2]) {
          ctx.fillStyle = CQ.col('--warn-ink'); ctx.fillRect(xb + 8, sy - 7, 14, 14);
          CQ.text(ctx, 'D', xb + 15, sy + 4, { size: 10, align: 'center', color: '#fff', weight: 700 });
          ctx.strokeStyle = CQ.alpha('--c1', 0.25);
          for (let k = 0; k < 10; k++) { const r = ((k + tt) % 10) * (xs - xb) / 10; ctx.beginPath(); ctx.arc(xb, sy, r, -0.25, 0.25); ctx.stroke(); }
        }
        CQ.text(ctx, 'detector de camino', xb + 26, 16, { size: 11, color: '--warn-ink', halo: true });
      }
      /* pantalla con impactos */
      ctx.fillStyle = CQ.col('--surface-2'); ctx.fillRect(xs, 0, W - xs, H);
      ctx.fillStyle = CQ.col('--accent');
      for (const [s, u] of hits) { const y = yc - (s / SMAX) * (H / 2 - 4); ctx.fillRect(xs + 4 + u * (W - xs - 8), y - 1, 2, 2); }
      /* histograma y teoría */
      CQ.draw.clear(ch);
      const tot = hits.length ? hist.reduce((a, b) => a + b, 0) : 0;
      const w = (2 * SMAX) / NB;
      let norm = 0; for (let q = 0; q < 400; q++) norm += I(-SMAX + ((q + 0.5) * 2 * SMAX) / 400) * (2 * SMAX / 400);
      let ymax = 0; for (let b = 0; b < NB; b++) ymax = Math.max(ymax, tot ? hist[b] / (tot * w) : 0);
      ymax = Math.max(ymax, 1 / norm) * 1.1;
      const pl = new CQ.Plot(ch.ctx, { x: 0, y: 0, w: ch.w, h: ch.h, xmin: -SMAX, xmax: SMAX, ymin: 0, ymax, xlabel: 'posición en la pantalla (sen θ)', ylabel: 'densidad', yticks: [] });
      pl.frame();
      if (tot) CQ.drawHist(pl, { lo: -SMAX, nb: NB, w, dens: hist.map((c) => c / (tot * w)) }, { color: '--accent' });
      if (sim.p.th) pl.fn((s) => I(s) / norm, { color: '--c1', width: 2, n: 800 });
      sim.set('N', CQ.fix(hits.length >= 6000 ? tot : hits.length, 0));
      sim.set('fr', sim.p.path ? 'sin franjas' : `Δ(sen θ) = λ/d = ${CQ.fix(1 / sim.p.d, 3)}`);
    });
  });
})();
