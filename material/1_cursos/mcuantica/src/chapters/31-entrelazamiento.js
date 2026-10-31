/* Capítulo 31 — Entrelazamiento, EPR y desigualdades de Bell */
(function () {
  'use strict';
  const EM = window.EM, Q = EM.qm.qi, M = EM.M, PI = Math.PI;

  /* 31.1 Estados de Werner: entrelazamiento, no localidad y correlaciones */
  EM.defineSim('werner', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('p', { label: 'Visibilidad p del estado de Werner ρ = p|ψ⁻⟩⟨ψ⁻| + (1 − p)·1/4', min: 0, max: 1, step: 0.005, value: 0.85, fmt: (v) => EM.fix(v, 3) });
    sim.out('e', 'Concurrencia C = máx(0, (3p − 1)/2) · negatividad N · entropía S(ρ) (bits): entrelazado si p &gt; 1/3 (criterio PPT de Peres–Horodecki)', { hl: true });
    sim.out('b', 'CHSH máximo (Horodecki) 2√2 p frente a la cota local 2: viola Bell si p &gt; 1/√2 = 0.7071 (región entrelazada pero sin violación: 1/3 &lt; p ≤ 0.7071)');
    sim.out('c', 'Correlación de espín <i>E</i>(θ) = −<i>p</i> cos θ entre dos analizadores con ángulo θ · valor con los ángulos de CHSH óptimos');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p.p, rho = Q.werner(p);
      EM.draw.clear(cv);
      const th = Array.from({ length: 181 }, (_, i) => (2 * PI * i) / 180), pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 360, ymin: -1.05, ymax: 1.05, xlabel: 'ángulo relativo θ entre analizadores (grados)', ylabel: 'correlación E(θ)', ml: 52, mr: 8, title: 'Correlaciones cuánticas frente a un modelo local' });
      pl.frame(); pl.hline(0, { color: '--axis' }); pl.xy(th.map((t) => M.deg(t)), th.map((t) => -p * Math.cos(t)), { color: '--accent', width: 2.4 });
      pl.xy(th.map((t) => M.deg(t)), th.map((t) => { const a = Math.abs(((t % (2 * PI)) + 2 * PI) % (2 * PI)); const u = a > PI ? 2 * PI - a : a; return -p * (1 - (2 * u) / PI); }), { color: '--c2', width: 1.6, dash: [5, 3] });
      pl.legend([{ label: 'mecánica cuántica −p cos θ', color: '--accent' }, { label: 'modelo local (lineal por tramos)', color: '--c2', dash: [5, 3] }], 'br');
      const ps = Array.from({ length: 101 }, (_, i) => i / 100), q = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: 3, xlabel: 'p', ylabel: 'CHSH máximo y entrelazamiento', ml: 48, mr: 8, title: 'Umbrales: separable / entrelazado / viola Bell' });
      q.frame(); q.band(0, 1 / 3, { color: '--ink-3', alpha: 0.12 }); q.band(1 / 3, Math.SQRT1_2, { color: '--c2', alpha: 0.12 }); q.band(Math.SQRT1_2, 1, { color: '--accent', alpha: 0.12 });
      q.xy(ps, ps.map((x) => 2 * Math.SQRT2 * x), { color: '--accent', width: 2.2 }); q.hline(2, { color: '--ink', dash: [5, 3], label: 'cota local 2', labelRight: true }); q.xy(ps, ps.map((x) => Math.max(0, (3 * x - 1) / 2)), { color: '--c3', width: 1.8 }); q.vline(p, { color: '--ink-3', dash: [3, 3] });
      q.legend([{ label: 'CHSH máximo', color: '--accent' }, { label: 'concurrencia', color: '--c3' }], 'tl');
      const C = Q.concurrence(rho), N = Q.negativity(rho, 2, 2), S = Q.entropy(rho), cm = Q.chshMax(rho), s0 = Q.chsh(rho, 0, PI / 2, PI / 4, 3 * PI / 4);
      sim.set('e', `${EM.fix(C, 5)} · ${EM.fix(N, 5)} · ${EM.fix(S, 4)} · ${p > 1 / 3 ? 'entrelazado' : 'separable'}`);
      sim.set('b', `${EM.fix(cm, 5)} frente a 2 · ${cm > 2 ? 'viola CHSH por ' + EM.fix(cm - 2, 4) : 'no viola'}`);
      sim.set('c', `E(0) = ${EM.fix(Q.corr(rho, 0, 0), 4)} · CHSH con ángulos óptimos = ${EM.fix(s0, 5)}`);
    });
  });

  /* 31.2 Monte Carlo: variables ocultas locales frente a la mecánica cuántica */
  EM.defineSim('bell-mc', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('N', { label: 'Pares de partículas por configuración N', min: 200, max: 200000, step: 200, value: 20000, log: true, fmt: (v) => v.toFixed(0) });
    sim.out('s', 'CHSH medido con el singlete cuántico (probabilidades −cos θ) en los ángulos óptimos (0, π/2; π/4, 3π/4) · valor teórico 2√2 = 2.8284 · error estadístico ≈ 2/√N', { hl: true });
    sim.out('l', 'CHSH medido con un modelo de variables ocultas local (cada par lleva un vector λ aleatorio; sign(a·λ)) · el máximo posible para cualquier modelo local es 2');
    sim.out('c', 'Correlaciones medidas E(a, b) con las cuatro configuraciones de CHSH · cuántica y local (mismo número de pares)');
    let seed = 20260101; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    let res = null;
    const run = () => {
      const N = Math.round(sim.p.N), A = [0, PI / 2], B = [PI / 4, 3 * PI / 4], Eq = [], El = [];
      for (const a of A) for (const b of B) {
        let sq = 0, sl = 0;
        for (let i = 0; i < N; i++) {
          /* cuántico: salidas ±1 con P(igual) = (1 + E)/2, E = −cos(a − b) */
          const E = -Math.cos(a - b), same = rnd() < (1 + E) / 2, x = rnd() < 0.5 ? 1 : -1; sq += same ? 1 : -1; /* x·(±x) */
          /* local: λ en el plano con ángulo uniforme; A = sign cos(a − λ), B = −sign cos(b − λ) */
          const lam = 2 * PI * rnd(); sl += Math.sign(Math.cos(a - lam)) * -Math.sign(Math.cos(b - lam)); void x;
        }
        Eq.push(sq / N); El.push(sl / N);
      }
      /* Eq, El en orden (a0 b0), (a0 b1), (a1 b0), (a1 b1) */
      res = { Eq, El, Sq: Math.abs(Eq[0] - Eq[1] + Eq[2] + Eq[3]), Sl: Math.abs(El[0] - El[1] + El[2] + El[3]), N };
    };
    sim.button('Lanzar el experimento', run);
    sim.onChange = () => { res = null; };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h; EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: -0.5, xmax: 1.5, ymin: 0, ymax: 3.2, xlabel: '', ylabel: 'valor de S = |E₁ − E₂ + E₃ + E₄|', ml: 50, mr: 8, title: 'CHSH: modelo local (máx. 2) frente a la mecánica cuántica (2√2)' });
      pl.frame(); pl.hline(2, { color: '--ink', dash: [5, 3], label: 'cota local 2', labelRight: true }); pl.hline(2 * Math.SQRT2, { color: '--accent', dash: [5, 3], label: '2√2 (Tsirelson)', labelRight: true });
      if (res) { pl.path([[0, 0], [0, res.Sl]], { color: '--c2', width: 48 }); pl.path([[1, 0], [1, res.Sq]], { color: '--accent', width: 48 }); pl.label(0, res.Sl, EM.fix(res.Sl, 4), { size: 12, dy: -8, align: 'center', color: '--ink' }); pl.label(1, res.Sq, EM.fix(res.Sq, 4), { size: 12, dy: -8, align: 'center', color: '--ink' }); }
      pl.label(0, 0, 'local', { size: 11, dy: 16, align: 'center', color: '--ink-2' }); pl.label(1, 0, 'cuántico', { size: 11, dy: 16, align: 'center', color: '--ink-2' });
      const cfg = ['(a₀, b₀)', '(a₀, b₁)', '(a₁, b₀)', '(a₁, b₁)']; EM.text(ctx, 'Configuraciones (a₀ = 0, a₁ = π/2; b₀ = π/4, b₁ = 3π/4)', W * 0.78, H * 0.1, { size: 11, align: 'center', color: '--ink-3' });
      cfg.forEach((c, i) => { const y = H * 0.2 + i * H * 0.18; EM.text(ctx, c, W * 0.6, y, { size: 11.5, color: '--ink-2' }); if (res) { EM.text(ctx, 'Q ' + EM.fix(res.Eq[i], 3) + ' · L ' + EM.fix(res.El[i], 3), W * 0.7, y, { size: 11.5, color: '--ink' }); EM.text(ctx, 'teoría Q ' + EM.fix(-Math.cos([[0, PI / 4], [0, 3 * PI / 4], [PI / 2, PI / 4], [PI / 2, 3 * PI / 4]][i][0] - [[0, PI / 4], [0, 3 * PI / 4], [PI / 2, PI / 4], [PI / 2, 3 * PI / 4]][i][1]), 3), W * 0.7, y + 16, { size: 10, color: '--ink-3' }); } });
      sim.set('s', res ? `${EM.fix(res.Sq, 4)} ± ${EM.fix(2 / Math.sqrt(res.N), 3)} (N = ${res.N})` : 'pulse «Lanzar el experimento»');
      sim.set('l', res ? `${EM.fix(res.Sl, 4)} (cota teórica 2; el modelo lineal por tramos da exactamente 2)` : '—');
      sim.set('c', res ? `Q: ${res.Eq.map((v) => EM.fix(v, 3)).join(', ')} · L: ${res.El.map((v) => EM.fix(v, 3)).join(', ')}` : '—');
    });
  });

  /* 31.3 Tres qubits: GHZ y W; Mermin */
  EM.defineSim('ghz-w', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.seg('st', { label: 'Estado de tres qubits', options: [['ghz', 'GHZ = (|000⟩ + |111⟩)/√2'], ['w', 'W = (|001⟩ + |010⟩ + |100⟩)/√3']], value: 'ghz' });
    sim.slider('p', { label: 'Ruido blanco p (ρ = (1 − p)|ψ⟩⟨ψ| + p·1/8)', min: 0, max: 1, step: 0.01, value: 0, fmt: (v) => EM.fix(v, 2) });
    sim.out('m', 'Operador de Mermin M = ⟨XXX⟩ − ⟨XYY⟩ − ⟨YXY⟩ − ⟨YYX⟩ (cota local: 2; GHZ puro: 4; W: 0)', { hl: true });
    sim.out('r', 'Tras perder un qubit: concurrencia de los dos restantes y negatividad (GHZ → separable; W → todavía entrelazado, C = 2/3)');
    sim.out('e', 'Entropías de los reducidos: S(A) · S(AB) · pureza global');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p.p, v = sim.p.st === 'ghz' ? Q.ghz : Q.w3, rho = Q.add(Q.scale(Q.proj(v), 1 - p), Q.scale(Q.eye(8), p / 8)), rAB = Q.ptrace(rho, 4, 2, 'B'), rA = Q.ptrace(rAB, 2, 2, 'B');
      EM.draw.clear(cv);
      const ps = Array.from({ length: 101 }, (_, i) => i / 100), mm = (st, x) => { const r = Q.add(Q.scale(Q.proj(st), 1 - x), Q.scale(Q.eye(8), x / 8)); return Q.mermin(r); };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0, xmax: 1, ymin: -0.2, ymax: 4.3, xlabel: 'ruido p', ylabel: 'valor de Mermin M', ml: 50, mr: 8, title: 'Violación de Mermin por GHZ: M = 4(1 − p)' });
      pl.frame(); pl.hline(2, { color: '--ink', dash: [5, 3], label: 'cota local 2', labelRight: true }); pl.xy(ps, ps.map((x) => mm(Q.ghz, x)), { color: '--accent', width: 2.4 }); pl.xy(ps, ps.map((x) => mm(Q.w3, x)), { color: '--c2', width: 2, dash: [5, 3] }); pl.vline(p, { color: '--ink-3', dash: [3, 3] });
      pl.legend([{ label: 'GHZ', color: '--accent' }, { label: 'W', color: '--c2', dash: [5, 3] }], 'tr');
      const q = new EM.Plot(ctx, { x: W * 0.57, y: 0, w: W * 0.43, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: 0.75, xlabel: 'ruido p', ylabel: 'concurrencia de AB (un qubit perdido)', ml: 48, mr: 8, title: 'Robustez del entrelazamiento' });
      q.frame(); const cf = (st, x) => Q.concurrence(Q.ptrace(Q.add(Q.scale(Q.proj(st), 1 - x), Q.scale(Q.eye(8), x / 8)), 4, 2, 'B')); q.xy(ps.filter((_, i) => i % 2 === 0), ps.filter((_, i) => i % 2 === 0).map((x) => cf(Q.ghz, x)), { color: '--accent', width: 2.2 }); q.xy(ps.filter((_, i) => i % 2 === 0), ps.filter((_, i) => i % 2 === 0).map((x) => cf(Q.w3, x)), { color: '--c2', width: 2, dash: [5, 3] });
      sim.set('m', `${EM.fix(Q.mermin(rho), 5)}${Q.mermin(rho) > 2 ? ' (viola la cota local)' : ' (no viola)'}`);
      sim.set('r', `C(AB) = ${EM.fix(Q.concurrence(rAB), 5)} · N(AB) = ${EM.fix(Q.negativity(rAB, 2, 2), 5)}`);
      sim.set('e', `${EM.fix(Q.entropy(rA), 4)} bits · ${EM.fix(Q.entropy(rAB), 4)} bits · Tr ρ² = ${EM.fix(Q.purity(rho), 4)}`);
    });
  });
})();
