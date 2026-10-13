/* Capítulo 15 — Magnetismo en la materia */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);

  /* ======================================================================
     15.1 Modelo de Ising 2D: dominios, Curie e histéresis
     ====================================================================== */
  EM.defineSim('ising-domains', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.2 });
    const cp = sim.canvas({ aspect: 1.2 });
    const NX = 100, NY = 80, N = NX * NY;
    const s = new Int8Array(N);
    const randomize = () => { for (let i = 0; i < N; i++) s[i] = Math.random() < 0.5 ? 1 : -1; };
    const allUp = () => s.fill(1);
    randomize();
    sim.group('Condiciones');
    sim.slider('T', { label: 'Temperatura <i>k<sub>B</sub>T</i>/<i>J</i>', min: 0.5, max: 5, step: 0.05, value: 1.6, fmt: f2 });
    sim.seg('mode', { label: 'Campo externo', options: [['man', 'Manual'], ['auto', 'Ciclo automático']], value: 'man', onInput: () => { loop = []; } });
    sim.slider('h', { label: 'Campo <i>h</i> (manual)', min: -1, max: 1, step: 0.01, value: 0, fmt: f2 });
    sim.slider('A', { label: 'Amplitud del ciclo', min: 0.1, max: 1.5, step: 0.05, value: 0.8, fmt: f2 });
    sim.button('Espines al azar', () => { randomize(); loop = []; });
    sim.button('Todos hacia arriba', () => { allUp(); loop = []; });
    sim.out('m', 'Magnetización por espín <i>m</i>', { hl: true });
    sim.out('tc', '<i>T</i> / <i>T<sub>C</sub></i>');
    sim.out('hn', 'Campo actual');
    sim.legend([{ color: '--c2', label: 'espín ↑', kind: 'sq' }, { color: '--c1', label: 'espín ↓', kind: 'sq' }]);
    let loop = [], phase = 0, hcur = 0;
    const Tc = 2 / Math.log(1 + Math.SQRT2);
    const sweep = (T, h) => {
      const b = 1 / T;
      for (let n = 0; n < N; n++) {
        const i = (Math.random() * N) | 0, x = i % NX, y = (i / NX) | 0;
        const nb = s[y * NX + ((x + 1) % NX)] + s[y * NX + ((x - 1 + NX) % NX)] + s[((y + 1) % NY) * NX + x] + s[((y - 1 + NY) % NY) * NX + x];
        const dE = 2 * s[i] * (nb + h);
        if (dE <= 0 || Math.random() < Math.exp(-b * dE)) s[i] = -s[i];
      }
    };
    const mag = () => { let t = 0; for (let i = 0; i < N; i++) t += s[i]; return t / N; };
    let off = null;
    sim.animate((dt) => {
      const p = sim.p;
      if (p.mode === 'auto') { phase += dt * 0.35; hcur = p.A * Math.sin(2 * Math.PI * phase); } else hcur = p.h;
      sweep(p.T, hcur);
      sweep(p.T, hcur);
      loop.push([hcur, mag()]);
      if (loop.length > 1500) loop.shift();
    });
    sim.onDraw(() => {
      const p = sim.p;
      if (!off) { off = document.createElement('canvas'); off.width = NX; off.height = NY; }
      const o = off.getContext('2d'), img = o.createImageData(NX, NY);
      const up = EM.rgb('--c2'), dn = EM.rgb('--c1');
      for (let i = 0; i < N; i++) { const c = s[i] > 0 ? up : dn; img.data[4 * i] = c[0]; img.data[4 * i + 1] = c[1]; img.data[4 * i + 2] = c[2]; img.data[4 * i + 3] = 255; }
      o.putImageData(img, 0, 0);
      EM.draw.clear(cv);
      const ctx = cv.ctx;
      const sc = Math.min(cv.w / NX, cv.h / NY);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, (cv.w - NX * sc) / 2, (cv.h - NY * sc) / 2, NX * sc, NY * sc);
      ctx.imageSmoothingEnabled = true;
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -1.5, xmax: 1.5, ymin: -1.1, ymax: 1.1, xlabel: 'campo h', ylabel: 'magnetización m', title: 'Trayectoria m(h)' });
      pl.frame();
      if (loop.length > 1) pl.path(loop, { color: '--c5', width: 1.6 });
      const m = mag();
      pl.dot(hcur, m, { color: '--accent', r: 5 });
      /* m espontánea de Onsager (h = 0) */
      const ms = p.T < Tc ? Math.pow(1 - Math.pow(Math.sinh(2 / p.T), -4), 1 / 8) : 0;
      if (ms > 0) { pl.hline(ms, { color: '--ink-3', dash: [3, 3], label: 'm espontánea (Onsager)', labelRight: true }); pl.hline(-ms, { color: '--ink-3', dash: [3, 3] }); }
      sim.set('m', f3(m));
      sim.set('tc', f3(p.T / Tc) + (p.T < Tc ? ' (ferromagnético)' : ' (paramagnético)'));
      sim.set('hn', f3(hcur) + ' J');
    });
  });

  /* ======================================================================
     15.2 Ciclo B–H (Jiles–Atherton)
     ====================================================================== */
  EM.defineSim('bh-hysteresis', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    const ct = sim.canvas({ aspect: 3.6, cls: 'fixed' });
    const MAT = {
      soft: { n: 'Hierro dulce (blando)', Ms: 1.6e6, a: 1100, k: 400, al: 1.6e-3, c: 0.2, H: 4000 },
      steel: { n: 'Acero al carbono (medio)', Ms: 1.7e6, a: 1000, k: 2000, al: 1e-3, c: 0.1, H: 10000 },
      hard: { n: 'Material duro (tipo imán)', Ms: 1.2e6, a: 6000, k: 12000, al: 4e-3, c: 0.1, H: 60000 }
    };
    sim.group('Material');
    sim.select('mat', { options: Object.keys(MAT).map((k) => [k, MAT[k].n]), value: 'steel', onInput: () => { sim.ctl.Hm.set(MAT[sim.p.mat].H, true); reset(true); } });
    sim.slider('Hm', { label: 'Amplitud del campo <i>H</i><sub>máx</sub>', min: 100, max: 100000, value: 10000, log: true, step: 10, fmt: (v) => EM.si(v, 'A/m') });
    sim.button('Desimanar y reiniciar', () => reset(false), { primary: true });
    sim.out('Br', 'Remanencia <i>B<sub>r</sub></i>', { hl: true });
    sim.out('Hc', 'Coercitividad <i>H<sub>c</sub></i>', { hl: true });
    sim.out('Bm', '<i>B</i><sub>máx</sub>');
    sim.out('w', 'Pérdida por ciclo ∮<i>H</i> d<i>B</i>');
    sim.out('P', 'Pérdida a 50 Hz (por kg, ρ = 7870 kg/m³)');
    const L = (x) => (Math.abs(x) < 1e-4 ? x / 3 : 1 / Math.tanh(x) - 1 / x);
    let H = 0, Mi = 0, Mt = 0, ph = 0, cur = [], prev = [], hist = [], stats = { Br: null, Hc: null, Bm: 0, w: null };
    let area = 0, lastPhase = 0, virgin = [];
    function reset(pre) { H = 0; Mi = 0; Mt = 0; ph = 0; cur = []; prev = []; hist = []; virgin = []; stats = { Br: null, Hc: null, Bm: 0, w: null }; area = 0; lastPhase = 0; if (pre) for (let k = 0; k < 310; k++) step(1 / 60); }
    const stepTo = (Hn, P) => {
      const dH = Hn - H, d = Math.sign(dH) || 1, sub = 6;
      for (let s = 0; s < sub; s++) {
        const h = dH / sub;
        const He = H + P.al * Mt, Man = P.Ms * L(He / P.a);
        let dMi = (Man - Mi) / (d * P.k - P.al * (Man - Mi));
        if (d * (Man - Mi) < 0) dMi = 0;
        Mi += dMi * h; H += h;
        const Man2 = P.Ms * L((H + P.al * Mi) / P.a);
        Mt = Mi + P.c * (Man2 - Mi);
      }
    };
    const step = (dt) => {
      const P = MAT[sim.p.mat];
      const n = 60;
      for (let i = 0; i < n; i++) {
        const B0 = K.mu0 * (H + Mt);
        ph += (dt * 0.4) / n;
        const Hn = sim.p.Hm * Math.sin(2 * Math.PI * ph);
        const Hold = H;
        stepTo(Hn, P);
        const B1 = K.mu0 * (H + Mt);
        area += 0.5 * (Hold + H) * (B1 - B0);
        cur.push([H, B1]);
        if (ph <= 0.25) virgin.push([H, B1]);
        if (i % 6 === 0) hist.push([ph, H / sim.p.Hm, B1]);
        /* detección de remanencia y coercitividad en la rama descendente */
        if (Hold > 0 && H <= 0 && ph > 0.25) stats.Br = B1;
        if (B0 > 0 && B1 <= 0 && H < 0) stats.Hc = -H;
        stats.Bm = Math.max(stats.Bm, Math.abs(B1));
        if (Math.floor(ph) > Math.floor(lastPhase)) { if (ph > 1.2) stats.w = area; area = 0; prev = cur; cur = []; }
        lastPhase = ph;
      }
      if (hist.length > 3200) hist.splice(0, hist.length - 3200);
    };
    reset(true);
    sim.animate(step);
    sim.onDraw(() => {
      const p = sim.p, P = MAT[p.mat];
      EM.draw.clear(cv);
      const Bmax = Math.max(0.5, K.mu0 * (P.Ms + p.Hm) * 1.05);
      const pl = new EM.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -p.Hm * 1.05, xmax: p.Hm * 1.05, ymin: -Bmax, ymax: Bmax, xlabel: 'H (A/m)', ylabel: 'B (T)', xfmt: (v) => EM.si(v, '', 2) });
      pl.frame();
      if (virgin.length > 1) pl.path(virgin, { color: '--c5', width: 1.8, dash: [6, 4] });
      if (prev.length > 1) pl.path(prev, { color: '--c1', width: 1.3, alpha: 0.35 });
      if (cur.length > 1) pl.path(cur, { color: '--c1', width: 2.4 });
      const B = K.mu0 * (H + Mt);
      pl.dot(H, B, { color: '--accent', r: 5.5 });
      if (stats.Br !== null) { pl.dot(0, stats.Br, { color: '--c3', r: 4, label: 'B_{r}', dx: 8 }); pl.dot(0, -stats.Br, { color: '--c3', r: 4 }); }
      if (stats.Hc !== null) { pl.dot(-stats.Hc, 0, { color: '--c2', r: 4, label: '−H_{c}', dy: 14 }); pl.dot(stats.Hc, 0, { color: '--c2', r: 4 }); }
      pl.legend([{ label: 'ciclo actual', color: '--c1' }, { label: 'curva de primera imanación', color: '--c5', dash: [6, 4] }], 'br');
      EM.draw.clear(ct);
      const t1 = hist.length ? hist[hist.length - 1][0] : 1;
      const pt = new EM.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: Math.max(0, t1 - 2), xmax: Math.max(2, t1), ymin: -1.15, ymax: 1.15, xlabel: 'tiempo (ciclos)', ylabel: 'normalizados', mt: 10 });
      pt.frame();
      if (hist.length > 1) {
        pt.path(hist.map((r) => [r[0], r[1]]), { color: '--c4', width: 1.8 });
        pt.path(hist.map((r) => [r[0], r[2] / Bmax]), { color: '--c1', width: 1.8 });
      }
      pt.legend([{ label: 'H(t)/H_{máx}', color: '--c4' }, { label: 'B(t)/B_{esc}', color: '--c1' }], 'tr');
      sim.set('Br', stats.Br !== null ? EM.fix(stats.Br, 3) + ' T' : '…');
      sim.set('Hc', stats.Hc !== null ? EM.si(stats.Hc, 'A/m') : '…');
      sim.set('Bm', EM.fix(stats.Bm, 3) + ' T');
      sim.set('w', stats.w !== null ? EM.si(stats.w, 'J/m³') : 'tras el primer ciclo');
      sim.set('P', stats.w !== null ? EM.si((stats.w * 50) / 7870, 'W/kg') : '—');
    });
  });

  /* ======================================================================
     15.3 Circuito magnético con entrehierro
     ====================================================================== */
  EM.defineSim('magnetic-circuit', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, cls: 'fixed' });
    const cp = sim.canvas({ aspect: 2.6 });
    sim.group('Bobina');
    sim.slider('N', { label: 'Espiras <i>N</i>', min: 10, max: 1000, step: 10, value: 300, fmt: (v) => v.toFixed(0) });
    sim.slider('I', { label: 'Corriente <i>I</i>', min: 0, max: 5, step: 0.05, value: 1, unit: 'A', fmt: f2 });
    sim.group('Núcleo (longitud media 40 cm, sección 4 cm²)');
    sim.slider('mr', { label: 'Permeabilidad relativa <i>μ<sub>r</sub></i>', min: 50, max: 20000, value: 3000, log: true, step: 10, fmt: (v) => v.toFixed(0) });
    sim.slider('g', { label: 'Entrehierro <i>g</i>', min: 0, max: 5, step: 0.05, value: 1, unit: 'mm', fmt: f2 });
    sim.out('Rc', 'Reluctancia del núcleo');
    sim.out('Rg', 'Reluctancia del entrehierro');
    sim.out('Phi', 'Flujo Φ');
    sim.out('B', 'Campo <i>B</i>', { hl: true });
    sim.out('Hc', '<i>H</i> en el hierro');
    sim.out('Hg', '<i>H</i> en el entrehierro');
    sim.out('fr', 'Fracción de <i>NI</i> en el entrehierro');
    const warn = sim.note('');
    const lc = 0.4, A = 4e-4;
    const calc = (p, gmm) => {
      const g = gmm * 1e-3;
      const Rc = (lc - g) / (K.mu0 * p.mr * A), Rg = g / (K.mu0 * A);
      const Phi = (p.N * p.I) / (Rc + Rg);
      return { Rc, Rg, Phi, B: Phi / A };
    };
    sim.onDraw(() => {
      const p = sim.p, r = calc(p, p.g);
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const x0 = w * 0.25, x1 = w * 0.75, y0 = h * 0.12, y1 = h * 0.88, t = Math.min(w, h) * 0.13;
      const gpx = Math.min(40, p.g * 7);
      ctx.fillStyle = EM.alpha('--ink-3', 0.35);
      ctx.fillRect(x0, y0, x1 - x0, t);
      ctx.fillRect(x0, y1 - t, x1 - x0, t);
      ctx.fillRect(x0, y0, t, y1 - y0);
      const ym = (y0 + y1) / 2;
      ctx.fillRect(x1 - t, y0, t, ym - y0 - gpx / 2);
      ctx.fillRect(x1 - t, ym + gpx / 2, t, y1 - ym - gpx / 2);
      /* bobina */
      ctx.strokeStyle = EM.col('--c4'); ctx.lineWidth = 3;
      const nturns = 9;
      for (let i = 0; i < nturns; i++) {
        const y = y0 + t + 10 + (i * (y1 - y0 - 2 * t - 20)) / (nturns - 1);
        ctx.beginPath(); ctx.ellipse(x0 + t / 2, y, t * 0.75, 5, 0, 0, 2 * Math.PI); ctx.stroke();
      }
      EM.text(ctx, 'N = ' + p.N + ', I = ' + EM.fix(p.I, 2) + ' A', x0 - 10, y1 + 16, { size: 12, color: '--c4', align: 'left' });
      /* líneas de flujo */
      const nl = Math.max(1, Math.min(6, Math.round(r.B * 4)));
      ctx.strokeStyle = EM.col('--bline'); ctx.lineWidth = 1.4; ctx.setLineDash([6, 4]);
      for (let k = 0; k < nl; k++) {
        const o = t * ((k + 1) / (nl + 1));
        ctx.beginPath(); ctx.rect(x0 + o, y0 + o, x1 - x0 - 2 * o, y1 - y0 - 2 * o); ctx.stroke();
      }
      ctx.setLineDash([]);
      if (p.g > 0) {
        /* dispersión en el entrehierro */
        ctx.strokeStyle = EM.alpha('--bline', 0.6);
        for (let k = -1; k <= 1; k += 2) { ctx.beginPath(); ctx.moveTo(x1 - t - 3, ym - gpx / 2 - 4); ctx.quadraticCurveTo(x1 - t / 2 + k * t, ym, x1 - t - 3, ym + gpx / 2 + 4); ctx.stroke(); }
        EM.text(ctx, 'g', x1 + 8, ym + 4, { size: 13, italic: true, family: EM.FONT_MATH, color: '--ink-2' });
      }
      EM.text(ctx, 'B = ' + EM.fix(r.B, 3) + ' T', (x0 + x1) / 2, ym, { size: 14, mono: true, weight: 600, color: '--bline', align: 'center', baseline: 'middle', halo: true });
      /* gráfica */
      EM.draw.clear(cp);
      const B0 = calc(p, 0).B;
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 5, ymin: 0, ymax: Math.max(0.05, B0 * 1.1), xlabel: 'g (mm)', ylabel: 'B (T)' });
      pl.frame();
      pl.fn((gg) => calc(p, gg).B, { color: '--bline', width: 2.4 });
      pl.fn((gg) => (gg > 0.05 ? (K.mu0 * p.N * p.I) / (gg * 1e-3) : NaN), { color: '--ink-3', width: 1.4, dash: [5, 4] });
      if (B0 * 1.1 > 1.6) pl.hline(1.6, { color: '--warn-ink', label: 'saturación típica del hierro', labelRight: true });
      pl.dot(p.g, r.B, { color: '--accent', r: 5.5 });
      pl.legend([{ label: 'modelo con núcleo', color: '--bline' }, { label: 'sólo entrehierro: μ₀NI/g', color: '--ink-3', dash: [5, 4] }], 'tr');
      sim.set('Rc', EM.si(r.Rc, 'A/Wb'));
      sim.set('Rg', EM.si(r.Rg, 'A/Wb'));
      sim.set('Phi', EM.si(r.Phi, 'Wb'));
      sim.set('B', EM.fix(r.B, 4) + ' T');
      sim.set('Hc', EM.si(r.B / (K.mu0 * p.mr), 'A/m'));
      sim.set('Hg', p.g > 0 ? EM.si(r.B / K.mu0, 'A/m') : '—');
      sim.set('fr', EM.fix((100 * r.Rg) / (r.Rc + r.Rg), 1) + ' %');
      warn.innerHTML = r.B > 1.6 ? '<span class="warnv">B supera 1.6 T: un núcleo real de hierro estaría saturado.</span>' : '';
    });
  });
})();
