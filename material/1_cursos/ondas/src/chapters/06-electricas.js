/* Capítulo 6 — Oscilaciones eléctricas */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);

  /* Dibuja un circuito serie rectangular con elementos en los lados; devuelve nada */
  function drawLoop(ctx, x0, y0, w, h, parts, o = {}) {
    ctx.save();
    ctx.strokeStyle = EM.col('--ink-2');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x0, y0, w, h);
    ctx.stroke();
    /* elementos: {side: 'top'|'right'|'bottom'|'left', t: 0..1, kind: 'C'|'L'|'R'|'S', label} */
    for (const p of parts) {
      let cx, cy, horiz;
      if (p.side === 'top') { cx = x0 + w * p.t; cy = y0; horiz = true; }
      else if (p.side === 'bottom') { cx = x0 + w * p.t; cy = y0 + h; horiz = true; }
      else if (p.side === 'left') { cx = x0; cy = y0 + h * p.t; horiz = false; }
      else { cx = x0 + w; cy = y0 + h * p.t; horiz = false; }
      const L = 44;
      ctx.fillStyle = EM.col('--canvas');
      if (horiz) ctx.fillRect(cx - L / 2, cy - 12, L, 24); else ctx.fillRect(cx - 12, cy - L / 2, 24, L);
      ctx.strokeStyle = EM.col('--ink');
      ctx.lineWidth = 2;
      const a = horiz ? [cx - L / 2, cy] : [cx, cy - L / 2], b = horiz ? [cx + L / 2, cy] : [cx, cy + L / 2];
      if (p.kind === 'C') {
        const g = 5;
        ctx.beginPath();
        if (horiz) { ctx.moveTo(a[0], cy); ctx.lineTo(cx - g, cy); ctx.moveTo(cx + g, cy); ctx.lineTo(b[0], cy); ctx.moveTo(cx - g, cy - 13); ctx.lineTo(cx - g, cy + 13); ctx.moveTo(cx + g, cy - 13); ctx.lineTo(cx + g, cy + 13); }
        else { ctx.moveTo(cx, a[1]); ctx.lineTo(cx, cy - g); ctx.moveTo(cx, cy + g); ctx.lineTo(cx, b[1]); ctx.moveTo(cx - 13, cy - g); ctx.lineTo(cx + 13, cy - g); ctx.moveTo(cx - 13, cy + g); ctx.lineTo(cx + 13, cy + g); }
        ctx.stroke();
        if (p.q !== undefined) {
          const s = Math.min(1, Math.abs(p.q));
          const top = p.q > 0 ? '--pos' : '--neg', bot = p.q > 0 ? '--neg' : '--pos';
          ctx.fillStyle = EM.alpha(top, 0.25 + 0.6 * s);
          if (horiz) ctx.fillRect(cx - g - 4, cy - 13, 3, 26); else ctx.fillRect(cx - 13, cy - g - 4, 26, 3);
          ctx.fillStyle = EM.alpha(bot, 0.25 + 0.6 * s);
          if (horiz) ctx.fillRect(cx + g + 1, cy - 13, 3, 26); else ctx.fillRect(cx - 13, cy + g + 1, 26, 3);
        }
      } else if (p.kind === 'L') {
        ctx.beginPath();
        const n = 4, r = L / (2 * n);
        for (let i = 0; i < n; i++) {
          if (horiz) ctx.arc(a[0] + r + 2 * r * i, cy, r, Math.PI, 0);
          else ctx.arc(cx, a[1] + r + 2 * r * i, r, -Math.PI / 2, Math.PI / 2);
        }
        ctx.stroke();
      } else if (p.kind === 'R') {
        EM.draw.zigzag(ctx, a[0], a[1], b[0], b[1], { n: 4, amp: 6, lead: 6, color: '--ink' });
      } else if (p.kind === 'S') {
        ctx.beginPath(); ctx.arc(cx, cy, 13, 0, 2 * Math.PI);
        ctx.fillStyle = EM.col('--canvas'); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) { const u = -8 + (16 * i) / 20; const v = -5 * Math.sin((Math.PI * i) / 10); if (i) ctx.lineTo(cx + u, cy + v); else ctx.moveTo(cx + u, cy + v); }
        ctx.stroke();
      }
      if (p.label) EM.text(ctx, p.label, horiz ? cx : cx + (p.side === 'left' ? -20 : 20), horiz ? cy + (p.side === 'top' ? -18 : 28) : cy + 4, { size: 13, italic: true, family: EM.FONT_MATH, align: horiz ? 'center' : p.side === 'left' ? 'right' : 'left', color: '--ink' });
    }
    ctx.restore();
  }
  EM.drawLoop = drawLoop;

  /* ======================================================================
     6.1 Circuito LC
     ====================================================================== */
  EM.defineSim('lc-circuit', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.2 });
    const cp = sim.canvas({ aspect: 1.2 });
    sim.slider('L', { label: 'Inductancia <i>L</i>', min: 1e-4, max: 10, value: 1, log: true, step: 1e-5, fmt: (v) => EM.si(v, 'H') });
    sim.slider('C', { label: 'Capacitancia <i>C</i>', min: 1e-10, max: 1e-2, value: 1e-3, log: true, step: 1e-11, fmt: (v) => EM.si(v, 'F') });
    sim.slider('V0', { label: 'Tensión inicial del condensador', min: 1, max: 50, step: 0.5, value: 12, unit: 'V', fmt: (v) => EM.fix(v, 1) });
    sim.out('f', 'Frecuencia <i>f</i><sub>0</sub>', { hl: true });
    sim.out('q0', 'Carga máxima <i>q</i><sub>0</sub>');
    sim.out('I', 'Corriente máxima');
    sim.out('E', 'Energía total');
    let ph = 0;
    sim.animate((dt) => { ph += dt * 1.6; });
    sim.onDraw(() => {
      const p = sim.p, w0 = 1 / Math.sqrt(p.L * p.C), q0 = p.C * p.V0;
      const q = Math.cos(ph), i = -Math.sin(ph);
      EM.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      const x0 = W * 0.18, y0 = H * 0.16, w = W * 0.64, h = H * 0.5;
      drawLoop(ctx, x0, y0, w, h, [{ side: 'left', t: 0.5, kind: 'C', label: 'C', q }, { side: 'right', t: 0.5, kind: 'L', label: 'L' }]);
      /* campo magnético en la bobina */
      const s = Math.abs(i);
      ctx.strokeStyle = EM.alpha('--bline', 0.15 + 0.7 * s); ctx.lineWidth = 1.4;
      for (const r of [16, 26]) { ctx.beginPath(); ctx.ellipse(x0 + w, y0 + h / 2, r * (0.4 + 0.6 * s), 30, 0, 0, 2 * Math.PI); ctx.stroke(); }
      /* flechas de corriente */
      if (s > 0.05) {
        const dir = i > 0 ? 1 : -1;
        for (const tt of [0.3, 0.7]) EM.draw.arrow(ctx, x0 + w * tt - dir * 14, y0, x0 + w * tt + dir * 14, y0, { color: '--cur', width: 2 + 2 * s });
        EM.text(ctx, 'i', x0 + w / 2, y0 - 12, { size: 14, italic: true, family: EM.FONT_MATH, color: '--cur', align: 'center' });
      }
      /* barras de energía */
      const UE = q * q, UB = i * i;
      const by = H - 18, bw = W * 0.3, bh = 12;
      [['eléctrica ½q²/C', UE, '--efield', H - 46], ['magnética ½Li²', UB, '--bfield', H - 22]].forEach(([n, v, c, yy]) => {
        ctx.fillStyle = EM.alpha(c, 0.85); ctx.fillRect(W * 0.42, yy - bh / 2, bw * v, bh);
        ctx.strokeStyle = EM.col('--rule-strong'); ctx.strokeRect(W * 0.42 + 0.5, yy - bh / 2 + 0.5, bw, bh);
        EM.text(ctx, n, W * 0.4, yy, { size: 11.5, color: c, align: 'right', baseline: 'middle' });
      });
      void by;
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 4 * Math.PI, ymin: -1.25, ymax: 1.25, xpi: true, xlabel: 'ω₀t', ylabel: 'valor relativo', ml: 52 });
      pl.frame();
      const off = Math.max(0, ph - 4 * Math.PI);
      pl.fn((u) => Math.cos(u + off), { color: '--efield', width: 2, to: ph - off });
      pl.fn((u) => -Math.sin(u + off), { color: '--bfield', width: 2, dash: [5, 3], to: ph - off });
      pl.legend([{ label: 'q / q₀', color: '--efield' }, { label: 'i / I_{máx}', color: '--bfield', dash: [5, 3] }], 'tr');
      sim.set('f', EM.si(w0 / (2 * Math.PI), 'Hz'));
      sim.set('q0', EM.si(q0, 'C'));
      sim.set('I', EM.si(w0 * q0, 'A'));
      sim.set('E', EM.si(0.5 * p.C * p.V0 * p.V0, 'J'));
    });
  });

  /* ======================================================================
     6.2 RLC forzado
     ====================================================================== */
  EM.defineSim('rlc-forced', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1.1 });
    const cp = sim.canvas({ aspect: 1.1 });
    sim.group('Circuito');
    sim.slider('R', { label: 'Resistencia <i>R</i>', min: 1, max: 1000, value: 20, log: true, step: 0.1, fmt: (v) => EM.si(v, 'Ω') });
    sim.slider('L', { label: 'Inductancia <i>L</i>', min: 1e-3, max: 1, value: 0.1, log: true, step: 1e-4, fmt: (v) => EM.si(v, 'H') });
    sim.slider('C', { label: 'Capacitancia <i>C</i>', min: 1e-8, max: 1e-4, value: 1e-5, log: true, step: 1e-9, fmt: (v) => EM.si(v, 'F') });
    sim.group('Fuente');
    sim.slider('f', { label: 'Frecuencia <i>f</i>', min: 10, max: 10000, value: 120, log: true, step: 0.1, fmt: (v) => EM.si(v, 'Hz') });
    sim.slider('E0', { label: 'Amplitud ℰ<sub>0</sub>', min: 0.5, max: 20, step: 0.5, value: 5, unit: 'V', fmt: (v) => EM.fix(v, 1) });
    sim.button('Ir a resonancia', () => sim.ctl.f.set(1 / (2 * Math.PI * Math.sqrt(sim.p.L * sim.p.C))));
    sim.out('f0', '<i>f</i><sub>0</sub> y <i>Q</i>', { hl: true });
    sim.out('Z', '|<i>Z</i>| y fase');
    sim.out('I', 'Corriente <i>I</i><sub>0</sub>');
    sim.out('V', '<i>V<sub>R</sub></i>, <i>V<sub>L</sub></i>, <i>V<sub>C</sub></i>');
    let ph = 0;
    sim.animate((dt) => { ph += dt * 1.2; });
    sim.onDraw(() => {
      const p = sim.p, w = 2 * Math.PI * p.f, w0 = 1 / Math.sqrt(p.L * p.C);
      const X = w * p.L - 1 / (w * p.C), Z = Math.hypot(p.R, X), phi = Math.atan2(X, p.R);
      const I0 = p.E0 / Z, VR = I0 * p.R, VL = I0 * w * p.L, VC = I0 / (w * p.C);
      EM.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      /* diagrama de fasores: corriente como referencia girando */
      const cx = W * 0.5, cy = H * 0.5, sc = (Math.min(W, H) * 0.38) / Math.max(p.E0, VL, VC, VR);
      EM.complexAxes(ctx, cx, cy, Math.min(W, H) * 0.45);
      const rot = (a, r) => [cx + r * sc * Math.cos(a + ph), cy - r * sc * Math.sin(a + ph)];
      const O = [cx, cy];
      const pR = rot(0, VR), pL = rot(Math.PI / 2, VL), pC = rot(-Math.PI / 2, VC), pE = rot(phi, p.E0);
      EM.draw.arrow(ctx, O[0], O[1], pR[0], pR[1], { color: '--c3', width: 2.4 });
      EM.draw.arrow(ctx, O[0], O[1], pL[0], pL[1], { color: '--c5', width: 2.4 });
      EM.draw.arrow(ctx, O[0], O[1], pC[0], pC[1], { color: '--c4', width: 2.4 });
      EM.draw.arrow(ctx, O[0], O[1], pE[0], pE[1], { color: '--accent', width: 3 });
      const lab = (P, s, c) => EM.text(ctx, s, P[0] + 6, P[1] - 6, { size: 12.5, italic: true, color: c, halo: true, family: EM.FONT_MATH });
      lab(pR, 'V_R', '--c3'); lab(pL, 'V_L', '--c5'); lab(pC, 'V_C', '--c4'); lab(pE, 'ℰ', '--accent');
      EM.text(ctx, 'fasores (la corriente va en la dirección de V_R)', 10, H - 10, { size: 11, color: '--ink-3' });
      EM.draw.clear(cp);
      const fmin = 10, fmax = 10000;
      const Ires = p.E0 / p.R;
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: fmin, xmax: fmax, xlog: true, ymin: 0, ymax: Ires * 1.15, xlabel: 'f (Hz)', ylabel: 'I₀ (A)', ml: 58 });
      pl.frame();
      pl.fn((f) => { const ww = 2 * Math.PI * f; return p.E0 / Math.hypot(p.R, ww * p.L - 1 / (ww * p.C)); }, { color: '--c1', width: 2.2, n: 800 });
      pl.vline(w0 / (2 * Math.PI), { color: '--ink-3', label: 'f₀' });
      pl.dot(p.f, I0, { color: '--accent', r: 6 });
      const Q = (w0 * p.L) / p.R;
      sim.set('f0', EM.si(w0 / (2 * Math.PI), 'Hz') + ' · Q = ' + EM.sci(Q, 3));
      sim.set('Z', EM.si(Z, 'Ω') + ' · ' + EM.fix(M.deg(phi), 1) + '°' + (phi > 0.01 ? ' (inductivo)' : phi < -0.01 ? ' (capacitivo)' : ''));
      sim.set('I', EM.si(I0, 'A'));
      sim.set('V', EM.si(VR, 'V') + ', ' + EM.si(VL, 'V') + ', ' + EM.si(VC, 'V'));
    });
  });

  /* ======================================================================
     6.3 Analogía electromecánica
     ====================================================================== */
  EM.defineSim('em-analogy', function (sim) {
    sim.cols2();
    const cm = sim.canvas({ aspect: 1.5 });
    const ce = sim.canvas({ aspect: 1.5 });
    const cp = sim.canvas({ aspect: 3.2, cls: 'full' });
    sim.group('Oscilador mecánico');
    sim.slider('m', { label: 'Masa <i>m</i>', min: 0.1, max: 2, step: 0.05, value: 0.5, unit: 'kg', fmt: f2 });
    sim.slider('k', { label: 'Constante <i>k</i>', min: 5, max: 100, step: 1, value: 50, unit: 'N/m', fmt: (v) => v.toFixed(0) });
    sim.slider('b', { label: 'Fricción <i>b</i>', min: 0, max: 5, step: 0.05, value: 0.4, unit: 'kg/s', fmt: f2 });
    sim.group('Escala del circuito');
    sim.slider('s', { label: 'Factor <i>L</i>/<i>m</i>', min: 1e-3, max: 10, value: 0.1, log: true, step: 1e-4, unit: 'H/kg', fmt: (v) => EM.sci(v, 2) });
    sim.resetButton(() => { t = 0; });
    sim.out('L', '<i>L</i> = <i>s m</i>');
    sim.out('C', '<i>C</i> = 1/(<i>s k</i>)');
    sim.out('R', '<i>R</i> = <i>s b</i>');
    sim.out('w', '<i>ω</i><sub>0</sub> y <i>Q</i> (iguales en ambos)', { hl: true });
    let t = 0;
    sim.onChange = () => { t = 0; };
    sim.animate((dt) => { t += dt; if (t > 12) t = 0; });
    sim.onDraw(() => {
      const p = sim.p, w0 = Math.sqrt(p.k / p.m), g = p.b / p.m;
      const S = EM.dampedSol(w0, g, 1, 0);
      const x = S.x(t), v = S.v(t);
      EM.draw.clear(cm);
      EM.drawMSD(cm.ctx, cm.w, cm.h, x, cm.w * 0.22);
      EM.text(cm.ctx, 'x(t)', 10, 16, { size: 12, italic: true, color: '--ink-3' });
      EM.draw.clear(ce);
      const ctx = ce.ctx, W = ce.w, H = ce.h;
      drawLoop(ctx, W * 0.2, H * 0.2, W * 0.6, H * 0.6, [{ side: 'left', t: 0.5, kind: 'C', label: 'C', q: x }, { side: 'top', t: 0.5, kind: 'R', label: 'R' }, { side: 'right', t: 0.5, kind: 'L', label: 'L' }]);
      if (Math.abs(v) > 0.05 * w0) EM.draw.arrow(ctx, W * 0.5 + (v > 0 ? -14 : 14), H * 0.8, W * 0.5 + (v > 0 ? 14 : -14), H * 0.8, { color: '--cur', width: 3 });
      EM.text(ctx, 'q(t)', 10, 16, { size: 12, italic: true, color: '--ink-3' });
      EM.draw.clear(cp);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 12, ymin: -1.1, ymax: 1.1, xlabel: 't (s)', ylabel: 'x/x₀ = q/q₀', ml: 58 });
      pl.frame();
      pl.fn(S.x, { color: '--grid-2', width: 1.4 });
      pl.fn(S.x, { color: '--accent', width: 2.2, to: t });
      const L = p.s * p.m, C = 1 / (p.s * p.k), R = p.s * p.b;
      sim.set('L', EM.si(L, 'H'));
      sim.set('C', EM.si(C, 'F'));
      sim.set('R', EM.si(R, 'Ω'));
      sim.set('w', EM.fix(w0, 3) + ' rad/s · Q = ' + (p.b > 0 ? EM.fix(w0 / g, 2) : '∞'));
    });
  });

  /* ======================================================================
     6.4 Filtros RLC
     ====================================================================== */
  EM.defineSim('rlc-filter', function (sim) {
    sim.cols2();
    const cb = sim.canvas({ aspect: 1.15 });
    const cs = sim.canvas({ aspect: 1.15 });
    sim.slider('f0', { label: 'Frecuencia de resonancia <i>f</i><sub>0</sub>', min: 100, max: 5000, value: 800, log: true, step: 1, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.slider('Q', { label: 'Factor de calidad <i>Q</i>', min: 0.3, max: 20, value: 0.707, log: true, step: 0.001, fmt: (v) => EM.fix(v, 3) });
    sim.seg('out', { label: 'Salida en', options: [['C', 'C (pasa bajos)'], ['R', 'R (pasa banda)'], ['L', 'L (pasa altos)']], value: 'C' });
    sim.slider('fin', { label: 'Fundamental de la señal de prueba', min: 50, max: 1000, step: 1, value: 220, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    const H = (f) => {
      const p = sim.p, r = f / p.f0;
      /* denominador normalizado: 1 − r² + i r/Q */
      const re = 1 - r * r, im = r / p.Q;
      let nr, ni;
      if (p.out === 'C') { nr = 1; ni = 0; } else if (p.out === 'R') { nr = 0; ni = r / p.Q; } else { nr = -r * r; ni = 0; }
      const d = re * re + im * im;
      return [(nr * re + ni * im) / d, (ni * re - nr * im) / d];
    };
    /* señal de prueba: diente de sierra con 30 armónicos */
    const harmonics = (fin) => { const out = []; for (let n = 1; n <= 30 && n * fin < 20000; n++) out.push([n * fin, 1 / n]); return out; };
    EM.listenButton(sim, () => { const hs = harmonics(sim.p.fin); return { fn: (t) => hs.reduce((s, [f, a]) => s + a * Math.sin(2 * Math.PI * f * t), 0), dur: 1.4 }; }, { label: '♪ Señal original' });
    EM.listenButton(sim, () => { const hs = harmonics(sim.p.fin).map(([f, a]) => { const h = H(f); return [f, a * Math.hypot(h[0], h[1]), Math.atan2(h[1], h[0])]; }); return { fn: (t) => hs.reduce((s, [f, a, ph]) => s + a * Math.sin(2 * Math.PI * f * t + ph), 0), dur: 1.4 }; }, { label: '♪ Señal filtrada' });
    sim.out('g', 'Ganancia en la fundamental', { hl: true });
    sim.out('fc', 'Ganancia en <i>f</i><sub>0</sub>');
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cb);
      const pl = new EM.Plot(cb.ctx, { x: 0, y: 0, w: cb.w, h: cb.h, xmin: 20, xmax: 20000, xlog: true, ymin: -60, ymax: 30, xlabel: 'f (Hz)', ylabel: 'ganancia (dB)', ml: 52, yticks: [-60, -40, -20, 0, 20] });
      pl.frame();
      pl.hline(-3, { color: '--ink-3', label: '−3 dB', labelRight: true });
      pl.fn((f) => { const h = H(f); return 20 * Math.log10(Math.hypot(h[0], h[1])); }, { color: '--c1', width: 2.3, n: 600 });
      pl.vline(p.f0, { color: '--ink-3', label: 'f₀' });
      harmonics(p.fin).forEach(([f]) => { const h = H(f); pl.dot(f, 20 * Math.log10(Math.hypot(h[0], h[1])), { color: '--accent', r: 3 }); });
      /* señal en el tiempo */
      EM.draw.clear(cs);
      const hs = harmonics(p.fin);
      const T = 2 / p.fin;
      const ps = new EM.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0, xmax: T * 1000, ymin: -2.2, ymax: 2.2, xlabel: 't (ms)', ylabel: 'señal', ml: 52 });
      ps.frame();
      ps.fn((tm) => hs.reduce((s, [f, a]) => s + a * Math.sin(2 * Math.PI * f * tm / 1000), 0), { color: '--grid-2', width: 1.6, n: 800 });
      ps.fn((tm) => hs.reduce((s, [f, a]) => { const h = H(f); return s + a * Math.hypot(h[0], h[1]) * Math.sin(2 * Math.PI * f * tm / 1000 + Math.atan2(h[1], h[0])); }, 0), { color: '--accent', width: 2, n: 800 });
      ps.legend([{ label: 'entrada (diente de sierra)', color: '--grid-2' }, { label: 'salida', color: '--accent' }], 'tr');
      const h1 = H(p.fin), h0 = H(p.f0);
      sim.set('g', EM.fix(20 * Math.log10(Math.hypot(h1[0], h1[1])), 1) + ' dB');
      sim.set('fc', EM.fix(20 * Math.log10(Math.hypot(h0[0], h0[1])), 1) + ' dB');
    });
  });
})();
