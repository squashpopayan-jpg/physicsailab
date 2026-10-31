/* Capítulo 30 — La matriz densidad */
(function () {
  'use strict';
  const EM = window.EM, Q = EM.qm.qi, V = EM.V, M = EM.M, PI = Math.PI;
  const rhoBloch = (r, th, ph) => { const x = r * Math.sin(th) * Math.cos(ph), y = r * Math.sin(th) * Math.sin(ph), z = r * Math.cos(th); return Q.from([[(1 + z) / 2, x / 2], [x / 2, (1 - z) / 2]], [[0, -y / 2], [y / 2, 0]]); };
  const H2 = (p) => (p <= 0 || p >= 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p));

  /* 30.1 La esfera de Bloch: estados puros y mezclas */
  EM.defineSim('rho-bloch', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    const v3 = new EM.View3D(sim, cv, { radius: 1.45, az: M.rad(40), el: M.rad(22) });
    sim.slider('r', { label: 'Longitud del vector de Bloch r (1 = estado puro, 0 = máximamente mezclado)', min: 0, max: 1, step: 0.01, value: 0.6, fmt: (v) => EM.fix(v, 2) });
    sim.slider('th', { label: 'Ángulo polar θ', min: 0, max: 180, step: 1, value: 50, fmt: (v) => v.toFixed(0) + '°' });
    sim.slider('ph', { label: 'Ángulo azimutal φ', min: 0, max: 360, step: 1, value: 30, fmt: (v) => v.toFixed(0) + '°' });
    sim.out('m', 'Matriz densidad ρ = (1 + <b>r</b>·<b>σ</b>)/2: elementos ρ<sub>00</sub>, ρ<sub>01</sub> (coherencia) · autovalores (1 ± r)/2', { hl: true });
    sim.out('p', 'Pureza Tr ρ² = (1 + r²)/2 · entropía de von Neumann S = −Σλ log₂ λ (bits) · medidas: P(↑<sub>z</sub>), P(↑<sub>x</sub>)');
    sim.out('e', 'Dos conjuntos de estados puros con el mismo ρ: mezcla de dos estados opuestos del eje elegido y mezcla de dos del eje perpendicular (el ρ no distingue de qué mezcla viene)');
    sim.onDraw(() => {
      const r = sim.p.r, th = M.rad(sim.p.th), ph = M.rad(sim.p.ph), rho = rhoBloch(r, th, ph), b = Q.bloch(rho);
      v3.begin(); v3.axes({ len: 1.3, neg: 0 });
      v3.mesh((u, v) => [Math.sin(u) * Math.cos(v), Math.sin(u) * Math.sin(v), Math.cos(u)], 0, PI, 22, 0, 2 * PI, 32, { fill: '--c5', alpha: 0.08, shade: false, wire: '--ink-3', wireAlpha: 0.2, wireEveryU: 4, wireEveryV: 6 });
      v3.arrow([0, 0, 0], b, { color: '--accent', width: 3, head: 12 }); v3.point(b, { color: '--accent', r: 5 });
      v3.line([0, 0, 0], V.scale(V.unit(b.map((x, i) => x + (i === 0 ? 1e-12 : 0))), 1), { color: '--ink-3', width: 1, dash: [3, 4] });
      v3.text([0, 0, 1.12], '|0⟩', { size: 12, color: '--ink-2', align: 'center', baseline: 'middle' }); v3.text([0, 0, -1.12], '|1⟩', { size: 12, color: '--ink-2', align: 'center', baseline: 'middle' });
      v3.render();
      const ev = Q.eigh(rho).values, S = Q.entropy(rho), pur = Q.purity(rho), pz = rho.re[0][0], px = 0.5 * (1 + b[0]);
      sim.set('m', `ρ₀₀ = ${EM.fix(rho.re[0][0], 4)} · ρ₀₁ = ${EM.fix(rho.re[0][1], 4)}${Math.abs(rho.im[0][1]) > 1e-9 ? (rho.im[0][1] < 0 ? ' − ' : ' + ') + EM.fix(Math.abs(rho.im[0][1]), 4) + 'i' : ''} · λ = ${EM.fix((1 + r) / 2, 4)}, ${EM.fix((1 - r) / 2, 4)}`);
      sim.set('p', `${EM.fix(pur, 5)} · ${EM.fix(S, 5)} bits · P(↑z) = ${EM.fix(pz, 4)}, P(↑x) = ${EM.fix(px, 4)}`);
      sim.set('e', `½|n⟩⟨n| + ½|−n⟩⟨−n| con n = eje de b (ρ = ½·1 + ½r σ_n si r < 1) y la mezcla ½|m⟩⟨m| + ½|−m⟩⟨−m| con otra dirección m pesada por r: ρ idéntica en ambos (ambigüedad de la descomposición)`);
    });
  });

  /* 30.2 Estado reducido de un sistema entrelazado: el sistema A de un estado puro de dos qubits es mezcla */
  EM.defineSim('rho-reducida', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('a', { label: 'Ángulo de Schmidt α del estado cos α|00⟩ + sen α|11⟩', min: 0, max: 45, step: 0.5, value: 20, fmt: (v) => EM.fix(v, 1) + '°' });
    sim.slider('ph', { label: 'Fase relativa φ entre las dos componentes', min: 0, max: 360, step: 5, value: 0, fmt: (v) => v.toFixed(0) + '°' });
    sim.out('r', 'ρ<sub>A</sub> = Tr<sub>B</sub> |ψ⟩⟨ψ| = diag(cos²α, sen²α) (la fase desaparece) · pureza · entropía de entrelazamiento S = H(cos²α) (bits)', { hl: true });
    sim.out('c', 'Concurrencia C = |sen 2α| (medida de entrelazamiento) · coherencias de ρ<sub>AB</sub> y ρ<sub>A</sub> · entropía conjunta S(AB) = 0');
    sim.out('i', 'Información mutua I = S(A) + S(B) − S(AB) = 2S(A) · para un estado producto (α = 0) es nula');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, a = M.rad(sim.p.a), ph = M.rad(sim.p.ph), v = Q.vec([Math.cos(a), 0, 0, Math.sin(a) * Math.cos(ph)], [0, 0, 0, Math.sin(a) * Math.sin(ph)]), rho = Q.proj(v), rA = Q.ptrace(rho, 2, 2, 'B');
      EM.draw.clear(cv);
      const al = Array.from({ length: 91 }, (_, i) => (45 * i) / 90), pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 0, xmax: 45, ymin: 0, ymax: 1.05, xlabel: 'α (grados)', ylabel: 'S(A), C', ml: 50, mr: 8, title: 'Entropía de entrelazamiento y concurrencia' });
      pl.frame(); pl.xy(al, al.map((x) => H2(Math.cos(M.rad(x)) ** 2)), { color: '--accent', width: 2.4 }); pl.xy(al, al.map((x) => Math.sin(2 * M.rad(x))), { color: '--c2', width: 2, dash: [5, 3] }); pl.vline(sim.p.a, { color: '--ink-3', dash: [3, 3] });
      pl.legend([{ label: 'S(ρ_A) (bits)', color: '--accent' }, { label: 'concurrencia |sen 2α|', color: '--c2', dash: [5, 3] }], 'br');
      /* ρ_A como barras (diagonal) */
      const bx = W * 0.66, by = H * 0.18, bw = W * 0.28, bh = H * 0.6; ctx.save(); ctx.strokeStyle = EM.col('--axis'); ctx.strokeRect(bx, by, bw, bh); ctx.restore();
      [[rA.re[0][0], '--accent', 'ρ₀₀'], [rA.re[1][1], '--c2', 'ρ₁₁']].forEach(([p, c, t], i) => { ctx.save(); ctx.fillStyle = EM.alpha(c, 0.7); ctx.fillRect(bx + 20 + i * bw * 0.45, by + bh * (1 - p), bw * 0.3, bh * p); ctx.restore(); EM.text(ctx, t + ' = ' + EM.fix(p, 3), bx + 20 + i * bw * 0.45 + bw * 0.15, by + bh + 14, { size: 10.5, align: 'center', color: '--ink-2' }); });
      EM.text(ctx, 'ρ_A (Tr_B)', bx + bw / 2, by - 8, { size: 11.5, align: 'center', color: '--ink-3' });
      const S = Q.entropy(rA), cc = Math.abs(Math.sin(2 * a));
      sim.set('r', `diag(${EM.fix(rA.re[0][0], 4)}, ${EM.fix(rA.re[1][1], 4)}) · Tr ρ_A² = ${EM.fix(Q.purity(rA), 5)} · S = ${EM.fix(S, 5)} bits`);
      sim.set('c', `${EM.fix(cc, 5)} (concurrencia calculada: ${EM.fix(Q.concurrence(rho), 5)}) · |ρ_AB,03| = ${EM.fix(Math.hypot(rho.re[0][3], rho.im[0][3]), 4)}, |ρ_A,01| = ${EM.fix(Math.hypot(rA.re[0][1], rA.im[0][1]), 4)} · S(AB) = ${EM.fix(Q.entropy(rho), 5)}`);
      sim.set('i', `${EM.fix(Q.mutual(rho), 5)} bits (= 2S = ${EM.fix(2 * S, 5)})`);
    });
  });

  /* 30.3 Estado térmico: del estado puro al máximamente mezclado */
  EM.defineSim('rho-termico', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('s', { label: 'Sistema', options: [['2', 'Dos niveles (un qubit)'], ['3', 'Tres niveles equiespaciados'], ['ho', 'Oscilador armónico (niveles 0…40)']], value: '2' });
    sim.slider('t', { label: 'Temperatura k_BT/ħω', min: 0.05, max: 6, step: 0.01, value: 1, log: true, fmt: (v) => EM.fix(v, 2) });
    sim.out('p', 'Ocupaciones <i>p</i><sub>n</sub> = e<sup>−<i>nβħω</i></sup>/<i>Z</i> del operador densidad canónico ρ = e<sup>−βH</sup>/Tr e<sup>−βH</sup> · pureza Tr ρ²', { hl: true });
    sim.out('s', 'Entropía de von Neumann S = −Σ p log₂ p (bits) y entropía termodinámica S/k<sub>B</sub> = S ln 2 · energía media ⟨<i>E</i>⟩/ħω');
    sim.out('b', 'Qubit: longitud del vector de Bloch r = tanh(βħω/2) (el estado se mezcla al subir T) · oscilador: número medio de excitaciones n̄ = 1/(e<sup>βħω</sup> − 1)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, t = sim.p.t, kind = sim.p.s, N = kind === '2' ? 2 : kind === '3' ? 3 : 41, w = Array.from({ length: N }, (_, n) => Math.exp(-n / t)), Zp = w.reduce((s, x) => s + x, 0), p = w.map((x) => x / Zp);
      EM.draw.clear(cv);
      const S = -p.reduce((s, x) => s + (x > 1e-15 ? x * Math.log2(x) : 0), 0), E = p.reduce((s, x, n) => s + n * x, 0), pur = p.reduce((s, x) => s + x * x, 0);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: -0.5, xmax: Math.min(N, 12) - 0.5, ymin: 0, ymax: Math.max(...p) * 1.15, xlabel: 'nivel n', ylabel: 'ocupación pₙ', ml: 50, mr: 8, title: 'Operador densidad térmico (diagonal)' });
      pl.frame(); p.slice(0, 12).forEach((x, n) => pl.path([[n, 0], [n, x]], { color: '--accent', width: 18 }));
      const ts = Array.from({ length: 120 }, (_, i) => Math.exp(Math.log(0.05) + (Math.log(6 / 0.05) * i) / 119)), ent = (tt) => { const ww = Array.from({ length: N }, (_, n) => Math.exp(-n / tt)), z = ww.reduce((s, x) => s + x, 0); return -ww.reduce((s, x) => { const q = x / z; return s + (q > 1e-15 ? q * Math.log2(q) : 0); }, 0); };
      const q = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0.05, xmax: 6, ymin: 0, ymax: Math.max(1, Math.log2(N)) * 1.1, xlog: true, xlabel: 'k_BT / ħω', ylabel: 'S (bits)', ml: 46, mr: 8, title: 'La entropía crece con la temperatura' });
      q.frame(); q.xy(ts, ts.map(ent), { color: '--accent', width: 2.4 }); q.dot(t, S, { color: '--c3', r: 5.5 }); if (kind !== 'ho') q.hline(Math.log2(N), { color: '--ink-3', dash: [4, 3], label: 'log₂ N (máximo)', labelRight: true });
      sim.set('p', `${p.slice(0, 5).map((x) => EM.fix(x, 4)).join(', ')}${N > 5 ? ' …' : ''} · Tr ρ² = ${EM.fix(pur, 5)}`);
      sim.set('s', `${EM.fix(S, 5)} bits · S/k_B = ${EM.fix(S * Math.LN2, 5)} · ⟨E⟩ = ${EM.fix(E, 4)}`);
      sim.set('b', kind === '2' ? `r = tanh(1/2t) = ${EM.fix(Math.tanh(1 / (2 * t)), 5)} (con las ocupaciones: ${EM.fix(p[0] - p[1], 5)})` : kind === 'ho' ? `n̄ = ${EM.fix(1 / Math.expm1(1 / t), 5)} (suma truncada: ${EM.fix(E, 5)})` : '—');
    });
  });
})();
