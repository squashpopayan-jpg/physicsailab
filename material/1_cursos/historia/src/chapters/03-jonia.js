/* Capítulo 3 — Jonia */
(function () {
  'use strict';
  const EM = window.EM, C = EM.calc;
  const PI = Math.PI;

  /* 3.1 El monocordio pitagórico, con sonido */
  let actx = null;
  function tone(freqs, dur) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = actx.currentTime;
      freqs.forEach((f) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.16, t0 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.05);
      });
    } catch (e) { /* sin audio */ }
  }
  EM.tone = tone;
  EM.defineSim('monocordio', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, minH: '230px' });
    sim.slider('p', { label: 'Posición del puente (fracción de la cuerda)', min: 0.3, max: 1, step: 0.001, value: 0.5, fmt: (v) => v.toFixed(3) });
    sim.seg('pre', { label: 'Intervalos de Pitágoras', options: [['u', 'Unísono'], ['o', 'Octava'], ['q', 'Quinta'], ['c', 'Cuarta'], ['t', 'Tono']], value: 'o', onInput: (v) => {
      const m = { u: 1, o: 0.5, q: 2 / 3, c: 3 / 4, t: 8 / 9 }; sim.ctl.p.set(m[v]);
    } });
    sim.button('Hacer sonar', () => { const p = sim.p.p; tone([220, 220 / p], 1.6); }, { primary: true });
    sim.out('r', 'Razón de frecuencias', { hl: true });
    sim.out('c', 'Intervalo en cents');
    sim.out('n', 'Razón simple más cercana');
    sim.note('La cuerda entera da la nota de 220 Hz; la parte que queda a un lado del puente suena más aguda, con frecuencia inversamente proporcional a su longitud. Los intervalos que suenan «bien» son razones de números pequeños: 2:1, 3:2, 4:3.');
    const SIMPLE = [[1, 1], [2, 1], [3, 2], [4, 3], [5, 4], [9, 8], [5, 3], [6, 5], [8, 5], [16, 9], [15, 8]];
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p.p;
      EM.draw.clear(cv);
      const x0 = 40, x1 = W - 40, y0 = H * 0.36, y1 = H * 0.76, xb = x0 + p * (x1 - x0);
      /* caja */
      ctx.fillStyle = EM.alpha('--sand', 0.35); ctx.fillRect(x0 - 14, y0 - 28, x1 - x0 + 28, 56);
      ctx.strokeStyle = EM.col('--ink-3'); ctx.strokeRect(x0 - 14, y0 - 28, x1 - x0 + 28, 56);
      const wave = (a, b, col) => {
        ctx.strokeStyle = EM.col(col); ctx.lineWidth = 2; ctx.beginPath();
        const L = b - a, nh = Math.max(1, Math.round((x1 - x0) / L * 0.5) || 1);
        for (let i = 0; i <= 80; i++) { const u = i / 80; const x = a + u * L; const y = y0 + 9 * Math.sin(PI * u); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      };
      wave(x0, xb, '--c1'); wave(xb, x1, '--c2');
      ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.moveTo(xb - 7, y0 + 28); ctx.lineTo(xb + 7, y0 + 28); ctx.lineTo(xb, y0 + 10); ctx.closePath(); ctx.fill();
      EM.text(ctx, 'longitud ' + p.toFixed(3), (x0 + xb) / 2, y0 + 48, { size: 12, color: '--c1', align: 'center' });
      EM.text(ctx, 'longitud ' + (1 - p).toFixed(3), (xb + x1) / 2, y0 + 48, { size: 12, color: '--c2', align: 'center' });
      /* frecuencias relativas */
      const f1 = 1 / p;
      const pl = new EM.Plot(ctx, { x: 0, y: H * 0.62, w: W, h: H * 0.38, xmin: 0.3, xmax: 1, ymin: 1, ymax: 3.4, xlabel: 'posición del puente p', ylabel: 'f / f₀ = 1/p' });
      pl.frame(); pl.fn((x) => 1 / x, { color: '--c1', width: 2 });
      for (const [a, b] of [[2, 1], [3, 2], [4, 3]]) pl.hline(a / b, { color: '--ink-3', label: a + ':' + b });
      pl.dot(p, f1, { color: '--accent', r: 6 });
      let best = SIMPLE[0], bd = 9;
      for (const s of SIMPLE) { const d = Math.abs(Math.log(f1 / (s[0] / s[1]))); if (d < bd) { bd = d; best = s; } }
      sim.set('r', EM.fix(f1, 4));
      sim.set('c', EM.fix(C.cents(f1), 1) + ' cents');
      sim.set('n', best[0] + ':' + best[1] + (bd < 0.004 ? '  (consonancia)' : '  (a ' + EM.fix(1200 * bd / Math.LN2, 0) + ' cents)'));
    });
  });

  /* 3.2 Aquiles y la tortuga */
  EM.defineSim('zenon', function (sim) {
    const cv = sim.canvas({ aspect: 2.6, minH: '210px' });
    sim.slider('va', { label: 'Velocidad de Aquiles (m/s)', min: 2, max: 20, step: 0.5, value: 10, fmt: (v) => v.toFixed(1) });
    sim.slider('vt', { label: 'Velocidad de la tortuga (m/s)', min: 0.5, max: 8, step: 0.5, value: 1, fmt: (v) => v.toFixed(1) });
    sim.slider('d', { label: 'Ventaja inicial (m)', min: 10, max: 200, step: 10, value: 100, fmt: (v) => v.toFixed(0) });
    sim.slider('n', { label: 'Etapas de Zenón consideradas', min: 1, max: 14, step: 1, value: 5, fmt: (v) => v.toFixed(0) });
    sim.out('t', 'Tiempo acumulado tras las etapas', { hl: true });
    sim.out('ex', 'Instante exacto del alcance');
    sim.out('g', 'Distancia que aún los separa');
    sim.note('Zenón (c. 450 a. C.) argumentaba: antes de alcanzarla, Aquiles debe llegar donde estaba la tortuga, y esta ya habrá avanzado; el proceso no termina nunca. La suma de infinitos tiempos cada vez menores es finita; el rigor llegó con Cauchy y Weierstrass en el siglo XIX.');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p;
      EM.draw.clear(cv);
      if (p.va <= p.vt) { EM.text(ctx, 'Aquiles debe ser más rápido que la tortuga', W / 2, H / 2, { align: 'center', size: 14, color: '--c2' }); return; }
      const n = Math.round(p.n), A = C.achilles(p.va, p.vt, p.d, n);
      const xcatch = p.d * p.va / (p.va - p.vt), x0 = 30, sc = (W - 60) / xcatch;
      const X = (m) => x0 + m * sc, y = H * 0.55;
      ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(W - 30, y); ctx.stroke();
      /* posiciones de Aquiles al inicio de cada etapa y de la tortuga */
      let posA = 0, posT = p.d;
      const pts = [];
      for (let i = 0; i < n; i++) { pts.push(posT); const dt = (posT - posA) / p.va; posA = posT; posT = posT + p.vt * dt; }
      pts.forEach((m, i) => { ctx.strokeStyle = EM.alpha('--ink-3', 0.6); ctx.beginPath(); ctx.moveTo(X(m), y - 26); ctx.lineTo(X(m), y + 8); ctx.stroke(); EM.text(ctx, String(i + 1), X(m), y - 32, { size: 10.5, align: 'center', color: '--ink-3' }); });
      ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(X(0), y, 7, 0, 2 * PI); ctx.fill(); EM.text(ctx, 'Aquiles', X(0), y + 26, { size: 11.5, align: 'center', color: '--c1' });
      ctx.fillStyle = EM.col('--c3'); ctx.beginPath(); ctx.arc(X(p.d), y, 6, 0, 2 * PI); ctx.fill(); EM.text(ctx, 'tortuga (salida)', X(p.d), y + 26, { size: 11.5, align: 'center', color: '--c3' });
      ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(xcatch), y - 36); ctx.lineTo(X(xcatch), y + 14); ctx.stroke();
      EM.text(ctx, 'alcance: ' + EM.fix(xcatch, 1) + ' m', X(xcatch) - 6, y - 42, { size: 11.5, align: 'right', color: '--accent', weight: 650 });
      const last = A.steps[A.steps.length - 1];
      sim.set('t', EM.fix(last.t, 4) + ' s');
      sim.set('ex', EM.fix(A.tExact, 4) + ' s  (= d/(vₐ − vₜ))');
      sim.set('g', EM.sci(last.gap, 3) + ' m');
    });
  });

  /* 3.3 Tales y la sombra de la pirámide */
  EM.defineSim('sombra-tales', function (sim) {
    const cv = sim.canvas({ aspect: 2.2, minH: '230px' });
    sim.slider('alt', { label: 'Altura del Sol sobre el horizonte', min: 20, max: 70, step: 0.5, value: 45, fmt: (v) => v.toFixed(1) + '°' });
    sim.slider('err', { label: 'Error al marcar la punta de la sombra de la pirámide', min: -3, max: 3, step: 0.1, value: 0, fmt: (v) => v.toFixed(1) + ' m' });
    sim.out('sp', 'Sombra de la persona (1.80 m)', { hl: true });
    sim.out('est', 'Altura estimada de la pirámide');
    sim.out('real', 'Altura verdadera (146.6 m)');
    sim.note('Según Diogenes Laercio (siglo III) y Plutarco, Tales midió la Gran Pirámide cuando su propia sombra igualaba su estatura: en ese momento la sombra de la pirámide mide también lo mismo que su altura. A la sombra visible hay que sumar la mitad de la base (115.2 m).');
    const Hp = 146.6, B = 230.4, hp = 1.8;
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, a = sim.p.alt * PI / 180, err = sim.p.err;
      EM.draw.clear(cv);
      const gy = H * 0.82, sc = Math.min((W - 30) / 680, (H * 0.62) / Hp);
      const cx = 12 + (B / 2) * sc;
      const X = (m) => cx + m * sc, Y = (m) => gy - m * sc;
      ctx.fillStyle = EM.alpha('--sand', 0.35); ctx.fillRect(0, gy, W, H - gy);
      /* pirámide con base centrada en x=0 */
      ctx.fillStyle = EM.col('--sand'); ctx.beginPath(); ctx.moveTo(X(-B / 2), gy); ctx.lineTo(X(0), Y(Hp)); ctx.lineTo(X(B / 2), gy); ctx.closePath(); ctx.fill();
      const sb = Hp / Math.tan(a); /* sombra desde el eje */
      const tip = sb + err;
      ctx.fillStyle = EM.alpha('--ink', 0.28); ctx.beginPath(); ctx.moveTo(X(B / 2), gy); ctx.lineTo(X(tip), gy); ctx.lineTo(X(tip), gy + 6); ctx.lineTo(X(B / 2), gy + 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = EM.col('--ray'); ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(X(0), Y(Hp)); ctx.lineTo(X(sb), gy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = EM.col('--ray'); ctx.beginPath(); ctx.arc(W - 40, 36, 10, 0, 2 * PI); ctx.fill();
      /* persona a la derecha de la sombra */
      const px = X(tip) + 40, sp = hp / Math.tan(a);
      ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, gy); ctx.lineTo(px, Y(hp)); ctx.stroke();
      ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(px, Y(hp) - 3, 3, 0, 2 * PI); ctx.fill();
      ctx.fillStyle = EM.alpha('--c1', 0.35); ctx.fillRect(px, gy, sp * sc, 4);
      EM.text(ctx, 'Tales', px, Y(hp) - 12, { size: 11, color: '--c1', align: 'center' });
      EM.text(ctx, 'pirámide', X(0), gy + 18, { size: 11.5, color: '--ink-2', align: 'center' });
      const sbeyond = tip - B / 2;
      const est = C.shadowHeight(hp, sp, sbeyond + B / 2);
      sim.set('sp', EM.fix(sp, 2) + ' m' + (Math.abs(sp - hp) < 0.05 ? '  (igual a su estatura)' : ''));
      sim.set('est', EM.fix(est, 1) + ' m  (error ' + EM.fix(100 * (est - Hp) / Hp, 1) + ' %)');
      sim.set('real', EM.fix(Hp, 1) + ' m');
    });
  });
})();
