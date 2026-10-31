/* Capítulo 34 — Información y computación cuántica */
(function () {
  'use strict';
  const EM = window.EM, QC = EM.qm.qc, M = EM.M, PI = Math.PI;

  /* 34.1 Teletransporte con un recurso entrelazado imperfecto */
  EM.defineSim('teletransporte', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('th', { label: 'Estado a teletransportar: ángulo polar θ', min: 0, max: 180, step: 1, value: 70, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('ph', { label: 'Estado a teletransportar: ángulo azimutal φ', min: 0, max: 360, step: 1, value: 40, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('p', { label: 'Pureza del par compartido (Werner): p', min: 0, max: 1, step: 0.01, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.out('o', 'Los cuatro resultados de Alice (m₁m₂) son equiprobables · fidelidad de Bob <i>sin</i> corregir (promedio ½: sin señal) y corregida', { hl: true });
    sim.out('f', 'Fidelidad media corregida F = (1 + p)/2 · límite clásico 2/3 (medir y reenviar): se supera si p > 1/3');
    sim.out('v', 'Vector de Bloch de entrada y de salida corregida (la salida es p veces la entrada: canal despolarizante)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, th = M.rad(sim.p.th), ph = M.rad(sim.p.ph), p = sim.p.p, t = QC.teleport(th, ph, p);
      EM.draw.clear(cv);
      const bx = 52, by = 34, bw = W * 0.5 - 70, bh = H - 84, labs = ['00', '01', '10', '11'];
      EM.text(ctx, 'Fidelidad de Bob por resultado (m₁m₂)', bx + bw / 2, 16, { size: 12, align: 'center', color: '--ink-2', bold: true });
      ctx.save(); ctx.strokeStyle = EM.col('--grid'); ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) { const y = by + bh * (1 - i / 4); ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + bw, y); ctx.stroke(); EM.text(ctx, (i / 4).toFixed(2), bx - 6, y + 4, { size: 10, align: 'right', color: '--ink-3' }); }
      t.outcomes.forEach((o, i) => {
        const x = bx + 10 + i * (bw / 4), w = bw / 4 - 16;
        ctx.fillStyle = EM.alpha('--ink-3', 0.55); ctx.fillRect(x, by + bh * (1 - o.Fpre), w * 0.45, bh * o.Fpre);
        ctx.fillStyle = EM.alpha('--accent', 0.85); ctx.fillRect(x + w * 0.5, by + bh * (1 - o.F), w * 0.45, bh * o.F);
        EM.text(ctx, '|' + labs[i] + '⟩', x + w / 2, by + bh + 16, { size: 11, align: 'center', color: '--ink-2' });
      });
      ctx.restore();
      EM.text(ctx, 'gris: sin corregir · violeta: corregido (X^m₂ y luego Z^m₁)', bx + bw / 2, H - 8, { size: 10.5, align: 'center', color: '--ink-3' });
      const ps = Array.from({ length: 101 }, (_, i) => i / 100), pl = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: 1, ymin: 0.5, ymax: 1.02, xlabel: 'pureza del recurso p', ylabel: 'fidelidad media F', ml: 52, mr: 10, title: 'Teletransporte con un par de Werner' });
      pl.frame(); pl.hline(2 / 3, { color: '--c3', dash: [5, 3] }); pl.xy(ps, ps.map((x) => (1 + x) / 2), { color: '--accent', width: 2.4 }); pl.vline(1 / 3, { color: '--ink-3', dash: [3, 3] }); pl.dot(p, (1 + p) / 2, { color: '--c2', r: 5 });
      pl.label(0.02, 0.675, 'límite clásico 2/3', { color: '--c3' }); pl.label(0.345, 0.54, 'p = 1/3', { color: '--ink-3' });
      sim.set('o', `${t.outcomes.map((o, i) => labs[i] + ': ' + EM.fix(o.prob, 3)).join(' · ')} · F sin corregir ${t.outcomes.map((o) => EM.fix(o.Fpre, 3)).join(', ')} (media ${EM.fix(t.Fpre, 4)}) · corregida ${t.outcomes.map((o) => EM.fix(o.F, 4)).join(', ')}`);
      sim.set('f', `F = ${EM.fix(t.F, 5)} · (1 + p)/2 = ${EM.fix((1 + p) / 2, 5)} · ${p > 1 / 3 ? 'supera' : 'no supera'} el límite clásico`);
      sim.set('v', `entrada (${t.input.map((x) => EM.fix(x, 3)).join(', ')}) → salida (${t.outcomes[0].post.map((x) => EM.fix(x, 3)).join(', ')})`);
    });
  });

  /* 34.2 Búsqueda de Grover */
  EM.defineSim('grover', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('n', { label: 'Qubits n (N = 2ⁿ elementos)', min: 2, max: 14, step: 1, value: 6, fmt: (v) => v.toFixed(0) });
    sim.slider('k', { label: 'Iteraciones de Grover k', min: 0, max: 60, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.out('t', 'Ángulo θ = arcsen(1/√N) · k óptimo ⌊π/(4θ)⌋ ≈ (π/4)√N · P(k) = sen²((2k+1)θ)', { hl: true });
    sim.out('a', 'Amplitud de la marcada sen((2k+1)θ), amplitud de cada una de las demás cos((2k+1)θ)/√(N−1) · el simulador de vector de estado coincide (hasta n = 12)');
    sim.out('c', 'Consultas: clásica N/2 (media) · cuántica ≈ (π/4)√N · cociente');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, n = sim.p.n, k = sim.p.k, N = 2 ** n, th = QC.groverTheta(n), ks = QC.groverK(n), ang = (2 * k + 1) * th;
      EM.draw.clear(cv);
      const am = Math.sin(ang), ao = Math.cos(ang) / Math.sqrt(N - 1), bx = 44, by = 34, bw = W * 0.34, bh = H - 84, ymax = 1.05;
      EM.text(ctx, 'Amplitudes tras k iteraciones', bx + bw / 2, 16, { size: 12, align: 'center', color: '--ink-2', bold: true });
      ctx.save(); ctx.strokeStyle = EM.col('--grid'); ctx.lineWidth = 1;
      for (const v of [-1, -0.5, 0, 0.5, 1]) { const y = by + bh * (1 - (v + ymax) / (2 * ymax)); ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + bw, y); ctx.stroke(); EM.text(ctx, v.toFixed(1), bx - 6, y + 4, { size: 10, align: 'right', color: '--ink-3' }); }
      const y0 = by + bh * 0.5, hh = (v) => (bh * v) / (2 * ymax);
      ctx.fillStyle = EM.alpha('--accent', 0.85); ctx.fillRect(bx + bw * 0.12, am >= 0 ? y0 - hh(am) : y0, bw * 0.28, Math.abs(hh(am)));
      ctx.fillStyle = EM.alpha('--c2', 0.85); ctx.fillRect(bx + bw * 0.56, ao >= 0 ? y0 - hh(ao * Math.sqrt(N - 1)) : y0, bw * 0.28, Math.abs(hh(ao * Math.sqrt(N - 1))));
      ctx.restore();
      EM.text(ctx, 'marcada', bx + bw * 0.26, by + bh + 16, { size: 11, align: 'center', color: '--ink-2' }); EM.text(ctx, '√(N−1)·(otra)', bx + bw * 0.7, by + bh + 16, { size: 11, align: 'center', color: '--ink-2' });
      const kmax = Math.max(8, Math.ceil(2 * ks)), ksx = Array.from({ length: kmax + 1 }, (_, i) => i), pl = new EM.Plot(ctx, { x: W * 0.4, y: 0, w: W * 0.6, h: H, xmin: 0, xmax: kmax, ymin: 0, ymax: 1.05, xlabel: 'iteraciones k', ylabel: 'probabilidad de la marcada', ml: 54, mr: 10, title: `N = ${N}: P(k) = sen²((2k+1)θ)` });
      pl.frame(); pl.xy(ksx, ksx.map((x) => QC.groverP(n, x)), { color: '--accent', width: 2.2, marker: true }); pl.vline(ks, { color: '--c2', dash: [5, 3], label: 'k* = ' + ks }); pl.dot(Math.min(k, kmax), QC.groverP(n, k), { color: '--c3', r: 6 });
      let chk = '';
      if (n <= 12) { const st = QC.grover(n, N - 1, k), pr = QC.prob(st)[N - 1]; chk = ` · simulador P = ${EM.fix(pr, 5)}`; }
      sim.set('t', `θ = ${EM.fix(th, 5)} rad · k* = ${ks} · P(k*) = ${EM.fix(QC.groverP(n, ks), 5)} · P(k) = ${EM.fix(QC.groverP(n, k), 5)}`);
      sim.set('a', `${EM.fix(am, 5)} · ${EM.sci(ao, 3)}${chk}`);
      sim.set('c', `${EM.sci(N / 2, 3)} · ${ks} (${EM.fix(((N / 2) / Math.max(1, ks)), 1)}×) · ${k < ks ? 'aún subiendo' : k === ks ? 'en el óptimo' : 'se pasó del óptimo: la probabilidad vuelve a bajar'}`);
    });
  });

  /* 34.3 Algoritmo de Shor: el pico del periodo */
  EM.defineSim('shor', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('N', { label: 'Número a factorizar N', options: [['15', '15 = 3 × 5'], ['21', '21 = 3 × 7'], ['33', '33 = 3 × 11'], ['35', '35 = 5 × 7'], ['55', '55 = 5 × 11']], value: '15' });
    sim.slider('a', { label: 'Base a (coprima con N)', min: 2, max: 54, step: 1, value: 7, fmt: (v) => v.toFixed(0) });
    sim.slider('yi', { label: 'Pico medido (0 = el más probable distinto de y = 0; luego los siguientes)', min: 0, max: 6, step: 1, value: 0, fmt: (v) => v.toFixed(0) });
    sim.out('r', 'Periodo r de aⁿ mod N · registro de entrada m = ⌈2 log₂N⌉ qubits (Q = 2ᵐ) · picos de P(y) en y ≈ jQ/r', { hl: true });
    sim.out('y', 'Medida y elegida · fracción y/Q y sus convergentes · periodo recuperado · factores');
    sim.out('p', 'Probabilidad de que una sola ejecución dé los factores (sin contar reintentos)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, N = +sim.p.N, a = Math.min(Math.round(sim.p.a), N - 1), m = Math.ceil(2 * Math.log2(N)), Qn = 2 ** m;
      EM.draw.clear(cv);
      if (QC.gcd(a, N) !== 1) {
        EM.text(ctx, `a = ${a} no es coprima con N = ${N}: mcd(a, N) = ${QC.gcd(a, N)} ya es un factor (no hace falta el ordenador cuántico)`, W / 2, H / 2, { size: 13, align: 'center', color: '--c3' });
        sim.set('r', '—'); sim.set('y', `mcd(${a}, ${N}) = ${QC.gcd(a, N)}`); sim.set('p', '—'); return;
      }
      const r = QC.order(a, N), P = QC.periodDist(N, a, m), ys = Array.from({ length: Qn }, (_, i) => i);
      const idx = ys.slice(1).sort((u, v) => (Math.abs(P[v] - P[u]) > 1e-12 ? P[v] - P[u] : u - v)), picos = []; for (const y of idx) { if (picos.every((q) => Math.abs(q - y) > Qn / (4 * r))) picos.push(y); if (picos.length >= 8) break; }
      const pk = picos[Math.min(Math.round(sim.p.yi), picos.length - 1)], pm = Math.max(...P);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: Qn, ymin: 0, ymax: pm * 1.15, xlabel: 'resultado y del registro de entrada tras la QFT', ylabel: 'P(y)', ml: 60, mr: 12, title: `N = ${N}, a = ${a}: periodo r = ${r}, Q = ${Qn}` });
      pl.frame(); pl.xy(ys, Array.from(P), { color: '--accent', width: 1.4 });
      for (let j = 0; j < r; j++) pl.vline((j * Qn) / r, { color: '--ink-3', dash: [2, 4] });
      pl.vline(pk, { color: '--c3', width: 2 });
      const res = QC.shorFromY(N, a, pk, m), cf = QC.convergents(pk, Qn, N).map(([h, k]) => `${h}/${k}`).join(', ');
      sim.set('r', `r = ${r} · m = ${m} · Q = ${Qn} · picos en y = j·${EM.fix(Qn / r, 2)}, j = 0 … ${r - 1}`);
      sim.set('y', `y = ${pk} · ${pk}/${Qn} = ${EM.fix(pk / Qn, 5)} · convergentes: ${cf || '—'} · ${res.r ? 'r = ' + res.r : 'sin periodo'}${res.ok ? ` → ${N} = ${res.f1} × ${N / res.f1}` : ' · ' + (res.why || 'falla')}`);
      sim.set('p', `${EM.fix(QC.shorSuccess(N, a, m), 4)} (r = ${r}${r % 2 ? ', impar: falla siempre' : ''})`);
    });
  });
})();
