/* Capítulo 3 — Postulados y formalismo */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M;
  const f3 = (v) => CQ.fix(v, 3);
  const HBAR = 0.6582119569; /* eV·fs */

  /* Diagonalización exacta de [[eA, −t],[−t, eB]] */
  function two(eA, eB, t) {
    const m = (eA + eB) / 2, d = (eA - eB) / 2, w = Math.sqrt(d * d + t * t);
    const Em = m - w, Ep = m + w;
    /* autovector de E: (εA − E) cA − t cB = 0 → (t, εA − E) */
    const vec = (E) => { const a = t, b = eA - E, n = Math.hypot(a, b); return n > 1e-14 ? [a / n, b / n] : eA < eB === (E === Em) ? [1, 0] : [0, 1]; };
    return { Em, Ep, vm: vec(Em), vp: vec(Ep) };
  }

  /* ======================================================================
     3.1 Dos niveles: cruce evitado y mezcla
     ====================================================================== */
  CQ.defineSim('dos-niveles', function (sim) {
    sim.cols2();
    const ce = sim.canvas({ aspect: 1.05 });
    const cb = sim.canvas({ aspect: 1.05 });
    sim.group('Hamiltoniano (eV)');
    sim.slider('D', { label: 'Diferencia de sitios Δ = ε<sub>A</sub> − ε<sub>B</sub>', min: -6, max: 6, value: 2, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('t', { label: 'Acoplamiento <i>t</i>', min: 0, max: 3, value: 1, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.out('Em', '<i>E</i><sub>−</sub> (fórmula / Jacobi)', { hl: true });
    sim.out('Ep', '<i>E</i><sub>+</sub> (fórmula / Jacobi)', { hl: true });
    sim.out('gap', 'Separación <i>E</i><sub>+</sub> − <i>E</i><sub>−</sub>');
    sim.out('wA', 'Peso del estado inferior en A');
    sim.note('ε̄ = (ε<sub>A</sub> + ε<sub>B</sub>)/2 se toma como cero de energía.');
    sim.onDraw(() => {
      const D = sim.p.D, t = sim.p.t;
      const eA = D / 2, eB = -D / 2;
      const r = two(eA, eB, t);
      const J = P.la.jacobi([[eA, -t], [-t, eB]]).values;
      CQ.draw.clear(ce);
      const pl = new CQ.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: -6, xmax: 6, ymin: -4.5, ymax: 4.5, xlabel: 'Δ (eV)', ylabel: 'energía (eV)' });
      pl.frame();
      pl.fn((d) => d / 2, { color: '--ink-3', width: 1.2, dash: [4, 4] });
      pl.fn((d) => -d / 2, { color: '--ink-3', width: 1.2, dash: [4, 4] });
      pl.fn((d) => -Math.sqrt(d * d / 4 + t * t), { color: '--c1', width: 2.4 });
      pl.fn((d) => Math.sqrt(d * d / 4 + t * t), { color: '--c2', width: 2.4 });
      pl.vline(D, { color: '--accent' });
      pl.dot(D, r.Em, { color: '--c1' }); pl.dot(D, r.Ep, { color: '--c2' });
      pl.label(-5.8, 3.9, 'ε_A', { color: '--ink-3' }); pl.label(-5.8, -3.6, 'ε_B', { color: '--ink-3' });
      pl.legend([{ label: 'E₊ (antienlazante)', color: '--c2' }, { label: 'E₋ (enlazante)', color: '--c1' }, { label: 'sin acoplamiento', color: '--ink-3', dash: [4, 4] }], 'br');
      /* composición */
      CQ.draw.clear(cb);
      const ctx = cb.ctx, W = cb.w, H = cb.h;
      const bars = [['E₋', r.vm, '--c1'], ['E₊', r.vp, '--c2']];
      bars.forEach(([name, v, col], i) => {
        const y0 = H * (0.08 + 0.48 * i), bw = W * 0.34, bh = H * 0.2;
        CQ.text(ctx, `estado ${name}`, W * 0.08, y0 + 8, { size: 13, weight: 650, color: col });
        [['A', v[0] ** 2, '--atB'], ['B', v[1] ** 2, '--atN']].forEach(([lab, p, c2], j) => {
          const x0 = W * 0.1 + j * (bw + W * 0.12);
          ctx.fillStyle = CQ.col('--surface-2'); ctx.fillRect(x0, y0 + 16, bw, bh);
          ctx.fillStyle = CQ.col(c2); ctx.fillRect(x0, y0 + 16 + bh * (1 - p), bw, bh * p);
          CQ.text(ctx, `sitio ${lab}: ${CQ.fix(100 * p, 1)} %`, x0 + bw / 2, y0 + bh + 32, { size: 12, align: 'center', color: '--ink-2' });
        });
        const sgn = v[0] * v[1] >= 0 ? '+' : '−';
        CQ.text(ctx, `ψ = ${CQ.fix(Math.abs(v[0]), 3)}|A⟩ ${sgn} ${CQ.fix(Math.abs(v[1]), 3)}|B⟩`, W * 0.5, y0 + bh + 50, { size: 12, align: 'center', mono: true, color: '--ink' });
      });
      sim.set('Em', `${f3(r.Em)} / ${f3(J[0])} eV`);
      sim.set('Ep', `${f3(r.Ep)} / ${f3(J[1])} eV`);
      sim.set('gap', f3(r.Ep - r.Em) + ' eV');
      sim.set('wA', CQ.fix(100 * r.vm[0] ** 2, 2) + ' %');
    });
  });

  /* ======================================================================
     3.2 Electrón que salta entre dos sitios
     ====================================================================== */
  CQ.defineSim('dos-sitios', function (sim) {
    const cw = sim.canvas({ aspect: 3.2 });
    const cp = sim.canvas({ aspect: 2.6 });
    sim.group('Hamiltoniano (eV)');
    sim.slider('D', { label: 'Δ = ε<sub>A</sub> − ε<sub>B</sub>', min: -3, max: 3, value: 0, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('t', { label: 'Acoplamiento <i>t</i>', min: 0.05, max: 2, value: 0.5, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.group('Estado inicial');
    sim.select('ini', { options: [['A', 'Electrón en el sitio A'], ['B', 'Electrón en el sitio B'], ['bond', 'Estado enlazante (autoestado)'], ['mix', '(|A⟩ + i|B⟩)/√2']], value: 'A' });
    sim.slider('sp', { label: 'Velocidad de reproducción', min: 0.2, max: 5, value: 1, step: 0.1, unit: 'fs/s', fmt: (v) => CQ.fix(v, 1) });
    sim.out('Om', 'Frecuencia Ω = (<i>E</i><sub>+</sub> − <i>E</i><sub>−</sub>)/ħ');
    sim.out('T', 'Periodo 2π/Ω', { hl: true });
    sim.out('pmax', 'Transferencia máxima a B (fórmula)');
    sim.out('pb', '<i>P</i><sub>B</sub>(<i>t</i>) ahora');
    let time = 0;
    const hist = [];
    sim.resetButton(() => { time = 0; hist.length = 0; });
    sim.onChange = () => { time = 0; hist.length = 0; };
    const state = (tt) => {
      const D = sim.p.D, t = sim.p.t, eA = D / 2, eB = -D / 2;
      const r = two(eA, eB, t);
      let c0;
      if (sim.p.ini === 'A') c0 = [[1, 0], [0, 0]];
      else if (sim.p.ini === 'B') c0 = [[0, 0], [1, 0]];
      else if (sim.p.ini === 'bond') c0 = [[r.vm[0], 0], [r.vm[1], 0]];
      else c0 = [[Math.SQRT1_2, 0], [0, Math.SQRT1_2]];
      /* proyecciones sobre los autoestados (vectores reales) */
      const pr = (v) => [v[0] * c0[0][0] + v[1] * c0[1][0], v[0] * c0[0][1] + v[1] * c0[1][1]];
      const am = pr(r.vm), ap = pr(r.vp);
      const ph = (E) => [Math.cos(-E * tt / HBAR), Math.sin(-E * tt / HBAR)];
      const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
      const qm = mul(am, ph(r.Em)), qp = mul(ap, ph(r.Ep));
      const cA = [qm[0] * r.vm[0] + qp[0] * r.vp[0], qm[1] * r.vm[0] + qp[1] * r.vp[0]];
      const cB = [qm[0] * r.vm[1] + qp[0] * r.vp[1], qm[1] * r.vm[1] + qp[1] * r.vp[1]];
      return { pA: cA[0] ** 2 + cA[1] ** 2, pB: cB[0] ** 2 + cB[1] ** 2, r };
    };
    sim.animate((dt) => {
      time += dt * sim.p.sp;
      const s = state(time);
      hist.push([time, s.pB]);
      while (hist.length && hist[0][0] < time - 12) hist.shift();
    });
    sim.onDraw(() => {
      const s = state(time);
      const ctx = cw.ctx, W = cw.w, H = cw.h;
      CQ.draw.clear(cw);
      /* dos pozos */
      const xs = [W * 0.3, W * 0.7], eps = [sim.p.D / 2, -sim.p.D / 2];
      ctx.strokeStyle = CQ.col('--ink-3'); ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let k = 0; k <= 200; k++) {
        const X = (k / 200) * W, u = (X - W / 2) / (W * 0.2);
        const y = H * 0.55 - 0.04 * H * eps[X < W / 2 ? 0 : 1] - H * 0.28 * (Math.exp(-((u + 1) ** 2) * 3) + Math.exp(-((u - 1) ** 2) * 3)) + H * 0.3;
        if (k) ctx.lineTo(X, y); else ctx.moveTo(X, y);
      }
      ctx.stroke();
      [[s.pA, '--atB', 'A'], [s.pB, '--atN', 'B']].forEach(([p, col, lab], i) => {
        const r = 6 + 34 * Math.sqrt(p);
        const g = ctx.createRadialGradient(xs[i], H * 0.52, 1, xs[i], H * 0.52, r);
        g.addColorStop(0, CQ.alpha(col, 0.9)); g.addColorStop(1, CQ.alpha(col, 0.05));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(xs[i], H * 0.52, r, 0, 7); ctx.fill();
        CQ.text(ctx, `${lab}: ${CQ.fix(100 * p, 1)} %`, xs[i], H * 0.93, { size: 12.5, align: 'center', color: '--ink-2', mono: true });
      });
      CQ.text(ctx, `t = ${CQ.fix(time, 2)} fs`, 10, 18, { size: 12, color: '--ink-2', mono: true });
      /* gráfica */
      CQ.draw.clear(cp);
      const pl = new CQ.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: Math.max(0, time - 12), xmax: Math.max(12, time), ymin: 0, ymax: 1.05, xlabel: 't (fs)', ylabel: 'P_B(t)' });
      pl.frame();
      const t0 = Math.max(0, time - 12);
      pl.fn((tt) => (tt <= time ? state(tt).pB : NaN), { color: '--atN', width: 2.2, from: t0, n: 500 });
      pl.fn((tt) => (tt <= time ? state(tt).pA : NaN), { color: '--atB', width: 1.4, dash: [4, 3], from: t0, n: 500 });
      const w = s.r.Ep - s.r.Em;
      sim.set('Om', CQ.fix(w / HBAR, 3) + ' rad/fs');
      sim.set('T', CQ.fix((2 * Math.PI * HBAR) / w, 3) + ' fs');
      sim.set('pmax', sim.p.ini === 'A' || sim.p.ini === 'B' ? CQ.fix(sim.p.t ** 2 / ((sim.p.D / 2) ** 2 + sim.p.t ** 2), 4) : '—');
      sim.set('pb', CQ.fix(s.pB, 4));
    });
  });

  /* ======================================================================
     3.3 Esfera de Bloch
     ====================================================================== */
  CQ.defineSim('bloch', function (sim) {
    sim.cols2();
    const c3 = sim.canvas({ aspect: 1 });
    const ch = sim.canvas({ aspect: 1 });
    const v3 = new CQ.View3D(sim, c3, { radius: 1.7, az: M.rad(-35), el: M.rad(18) });
    sim.group('Estado');
    sim.note('|ψ⟩ = cos(θ/2)|0⟩ + e<sup><i>i</i>φ</sup> sen(θ/2)|1⟩');
    sim.slider('th', { label: 'θ', min: 0, max: 180, value: 60, step: 1, unit: '°', fmt: (v) => CQ.fix(v, 0) });
    sim.slider('ph', { label: 'φ', min: 0, max: 360, value: 30, step: 1, unit: '°', fmt: (v) => CQ.fix(v, 0) });
    sim.group('Medida');
    sim.seg('ax', { label: 'Eje de medida', options: [['z', 'z'], ['x', 'x'], ['y', 'y']], value: 'z' });
    sim.check('col', { label: 'Aplicar el colapso tras cada medida', value: false });
    sim.button('Medir 1', () => measure(1), { primary: true });
    sim.button('Medir 500', () => measure(500));
    sim.button('Borrar', () => { cnt = [0, 0]; });
    sim.group('Evolución');
    sim.check('prec', { label: 'Precesión (campo a lo largo de un eje)', value: false });
    sim.seg('fax', { label: 'Eje del campo', options: [['z', 'z'], ['x', 'x']], value: 'z' });
    sim.out('pp', '<i>P</i>(+) teórica', { hl: true });
    sim.out('fr', 'Frecuencia observada de +');
    sim.out('c', 'Componentes (<i>c</i><sub>0</sub>, <i>c</i><sub>1</sub>)');
    const rng = P.rng(8);
    let cnt = [0, 0];
    const axisVec = (a) => (a === 'x' ? [1, 0, 0] : a === 'y' ? [0, 1, 0] : [0, 0, 1]);
    const nvec = () => { const th = M.rad(sim.p.th), ph = M.rad(sim.p.ph); return [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]; };
    const setN = (n) => {
      const th = Math.acos(M.clamp(n[2], -1, 1));
      let ph = Math.atan2(n[1], n[0]); if (ph < 0) ph += 2 * Math.PI;
      sim.ctl.th.set(Math.round(M.deg(th) * 10) / 10, true); sim.ctl.ph.set(Math.round(M.deg(ph) * 10) / 10, true);
    };
    const measure = (k) => {
      for (let q = 0; q < k; q++) {
        const m = axisVec(sim.p.ax), n = nvec();
        const pp = (1 + CQ.V.dot(n, m)) / 2;
        const up = rng() < pp;
        cnt[up ? 0 : 1]++;
        if (sim.p.col) setN(up ? m : m.map((v) => -v));
      }
    };
    sim.onChange = (id) => { if (id === 'ax') cnt = [0, 0]; };
    sim.animate((dt) => {
      if (!sim.p.prec) return;
      const n = nvec(), w = 1.5 * dt;
      const k = axisVec(sim.p.fax);
      setN(CQ.V.rot(n, k, w));
    }, { autoplay: true });
    sim.onDraw(() => {
      const n = nvec(), m = axisVec(sim.p.ax);
      v3.begin();
      for (let a = 0; a < 12; a++) { const ang = (a * Math.PI) / 6; v3.arc([0, 0, 0], [Math.cos(ang), Math.sin(ang), 0], [0, 0, 1], 1, 0, 2 * Math.PI, { color: '--grid-2', width: 0.8 }); }
      for (const z of [-0.5, 0, 0.5]) v3.arc([0, 0, z], [1, 0, 0], [0, 1, 0], Math.sqrt(1 - z * z), 0, 2 * Math.PI, { color: z === 0 ? '--ink-3' : '--grid-2', width: z === 0 ? 1.2 : 0.8 });
      v3.axes({ len: 1.35, neg: 1.2, names: ['x', 'y', 'z'] });
      v3.text([0, 0, 1.18], '|0⟩', { size: 13, color: '--ink-2', dx: 16 });
      v3.text([0, 0, -1.2], '|1⟩', { size: 13, color: '--ink-2', dx: 16 });
      v3.line([0, 0, 0], m.map((v) => 1.25 * v), { color: '--accent', width: 1.6, dash: [5, 4] });
      if (sim.p.prec) { const k = axisVec(sim.p.fax); v3.arrow([0, 0, 0], k.map((v) => -1.1 * v), { color: '--c3', width: 2, head: 9 }); v3.text(k.map((v) => -1.2 * v), 'B', { size: 13, color: '--c3', weight: 700 }); }
      v3.arrow([0, 0, 0], n, { color: '--c2', width: 3, head: 12 });
      v3.point(n, { color: '--c2', r: 5 });
      v3.render();
      /* histograma */
      CQ.draw.clear(ch);
      const tot = cnt[0] + cnt[1];
      const pp = (1 + CQ.V.dot(n, m)) / 2;
      const pl = new CQ.Plot(ch.ctx, { x: 0, y: 0, w: ch.w, h: ch.h, xmin: 0, xmax: 2, ymin: 0, ymax: 1.05, xticks: [], ylabel: 'frecuencia', mb: 46 });
      pl.frame();
      pl.clip((ctx) => {
        [[cnt[0], 0.5, '--c1', `+${sim.p.ax}`], [cnt[1], 1.5, '--c2', `−${sim.p.ax}`]].forEach(([c, xc, col]) => {
          const f = tot ? c / tot : 0;
          ctx.fillStyle = CQ.alpha(col, 0.55); ctx.fillRect(pl.X(xc - 0.3), pl.Y(f), pl.X(xc + 0.3) - pl.X(xc - 0.3), pl.Y(0) - pl.Y(f));
        });
      });
      pl.hline(pp, { color: '--c1', label: 'P(+)', dash: [5, 3] });
      pl.hline(1 - pp, { color: '--c2', label: 'P(−)', dash: [5, 3], labelRight: true });
      CQ.text(ch.ctx, `resultado +${sim.p.ax}`, pl.X(0.5), pl.iy + pl.ih + 18, { size: 12, align: 'center', color: '--ink-2' });
      CQ.text(ch.ctx, `resultado −${sim.p.ax}`, pl.X(1.5), pl.iy + pl.ih + 18, { size: 12, align: 'center', color: '--ink-2' });
      CQ.text(ch.ctx, `${tot} medidas`, pl.X(1), pl.iy + pl.ih + 36, { size: 11.5, align: 'center', color: '--ink-3', mono: true });
      const th = M.rad(sim.p.th), ph = M.rad(sim.p.ph);
      sim.set('pp', CQ.fix(pp, 4));
      sim.set('fr', tot ? CQ.fix(cnt[0] / tot, 4) : '—');
      sim.set('c', `${CQ.fix(Math.cos(th / 2), 3)}, ${CQ.fix(Math.sin(th / 2), 3)}·e<sup>i${CQ.fix(sim.p.ph, 0)}°</sup>`);
    });
  });
})();
