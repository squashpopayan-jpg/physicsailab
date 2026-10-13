/* Capítulo 7 — Espín y partículas idénticas */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, V = CQ.V;
  const f3 = (v) => CQ.fix(v, 3);

  /* ======================================================================
     7.1 Stern–Gerlach en serie
     ====================================================================== */
  CQ.defineSim('stern-gerlach', function (sim) {
    const cv = sim.canvas({ aspect: 2.5 });
    const ch = sim.canvas({ aspect: 3.4 });
    sim.group('Aparatos (ángulo respecto de z en el plano xz)');
    sim.slider('a1', { label: 'Aparato 1', min: 0, max: 180, value: 0, step: 5, unit: '°', fmt: (v) => CQ.fix(v, 0) });
    sim.seg('k1', { label: 'Salida que continúa tras el aparato 1', options: [['+', '+'], ['-', '−'], ['both', 'ambas']], value: '+' });
    sim.slider('a2', { label: 'Aparato 2', min: 0, max: 180, value: 90, step: 5, unit: '°', fmt: (v) => CQ.fix(v, 0) });
    sim.seg('k2', { label: 'Salida que continúa tras el aparato 2', options: [['+', '+'], ['-', '−'], ['both', 'ambas']], value: '+' });
    sim.slider('a3', { label: 'Aparato 3', min: 0, max: 180, value: 0, step: 5, unit: '°', fmt: (v) => CQ.fix(v, 0) });
    sim.check('three', { label: 'Usar el tercer aparato', value: true });
    sim.slider('rate', { label: 'Átomos por segundo', min: 5, max: 400, value: 60, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('Pp', 'Fracción final + (teoría)', { hl: true });
    sim.out('Pm', 'Fracción final − (teoría)');
    sim.out('obs', 'Observado +, −');
    sim.out('surv', 'Átomos que llegan al final (teoría)');
    const rng = P.rng(17);
    let parts = [], cnt = [0, 0], nIn = 0, nBlk = 0, acc = 0;
    const reset = () => { parts = []; cnt = [0, 0]; nIn = 0; nBlk = 0; };
    sim.resetButton(reset);
    sim.onChange = (id) => { if (id !== 'rate') reset(); };
    const axis = (deg) => [Math.sin(M.rad(deg)), 0, Math.cos(M.rad(deg))];
    const stages = () => {
      const s = [{ a: sim.p.a1, keep: sim.p.k1 }, { a: sim.p.a2, keep: sim.p.k2 }];
      if (sim.p.three) s.push({ a: sim.p.a3, keep: 'both' }); else s[1].keep = 'both';
      return s;
    };
    const X = (i) => 0.12 + i * 0.28; /* posición x de cada aparato (fracción del ancho) */
    sim.animate((dt) => {
      acc += dt * sim.p.rate;
      while (acc > 1) {
        acc -= 1; nIn++;
        /* espín inicial al azar (haz no polarizado) */
        const u = 2 * rng() - 1, ph = 2 * Math.PI * rng(), s = Math.sqrt(1 - u * u);
        parts.push({ x: 0.0, y: 0.5, vy: 0, n: [s * Math.cos(ph), s * Math.sin(ph), u], stage: 0, alive: true });
      }
      const st = stages();
      for (const p of parts) {
        p.x += dt * 0.35;
        if (p.stage < st.length && p.x >= X(p.stage) + 0.06) {
          const m = axis(st[p.stage].a);
          const up = rng() < (1 + V.dot(p.n, m)) / 2;
          p.n = up ? m : m.map((v) => -v);
          p.vy = (up ? -1 : 1) * 0.12;
          const keep = st[p.stage].keep;
          if (p.stage === st.length - 1) { cnt[up ? 0 : 1]++; p.alive = 'done'; p.res = up; }
          else if (keep !== 'both' && (keep === '+') !== up) { p.alive = 'blocked'; nBlk++; }
          p.stage++;
        }
        if (p.alive === true || p.alive === 'done') p.y += p.vy * dt * (p.alive === 'done' ? 1 : 1);
        if (p.stage < st.length && p.alive === true && p.x > X(p.stage) - 0.02) { p.y += (0.5 - p.y) * Math.min(1, dt * 6); p.vy *= 0.9; }
      }
      parts = parts.filter((p) => p.x < 1.02 && p.alive !== 'blocked');
    });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      CQ.draw.clear(cv);
      const st = stages();
      st.forEach((s, i) => {
        const x0 = W * X(i), w = W * 0.07;
        ctx.fillStyle = CQ.col('--surface-3');
        ctx.fillRect(x0, H * 0.28, w, H * 0.44);
        /* flecha del eje de medida */
        const cx = x0 + w / 2, cy = H * 0.5, L = 22, a = M.rad(s.a);
        CQ.draw.arrow(ctx, cx, cy, cx + L * Math.sin(a), cy - L * Math.cos(a), { color: '--accent', width: 2.2 });
        CQ.text(ctx, `SG ${i + 1} · ${CQ.fix(s.a, 0)}°`, cx, H * 0.2, { size: 12, align: 'center', color: '--ink-2', weight: 600 });
        if (s.keep !== 'both' && i < st.length - 1) {
          const yb = s.keep === '+' ? H * 0.72 : H * 0.28;
          ctx.fillStyle = CQ.col('--warn-ink'); ctx.fillRect(x0 + w + 12, yb - 12, 5, 24);
          CQ.text(ctx, 'bloqueo', x0 + w + 20, yb + 4, { size: 10.5, color: '--warn-ink' });
        }
      });
      /* pantalla final */
      ctx.fillStyle = CQ.col('--surface-2'); ctx.fillRect(W * 0.95, H * 0.1, W * 0.04, H * 0.8);
      for (const p of parts) {
        ctx.beginPath(); ctx.arc(W * p.x, H * p.y, 3, 0, 7);
        ctx.fillStyle = p.alive === 'done' ? CQ.col(p.res ? '--c2' : '--c1') : CQ.col('--ink-3'); ctx.fill();
      }
      CQ.text(ctx, 'horno (haz no polarizado)', 8, H * 0.93, { size: 11, color: '--ink-3' });
      /* teoría: haz no polarizado → la primera medida da ½ y ½ */
      let alive = [[0.5, axis(st[0].a)], [0.5, axis(st[0].a).map((v) => -v)]];
      alive = st[0].keep === 'both' ? alive : st[0].keep === '+' ? [alive[0]] : [alive[1]];
      let fin = [0, 0];
      for (let i = 1; i < st.length; i++) {
        const m = axis(st[i].a), nxt = [];
        for (const [w, n] of alive) {
          const pp = (1 + V.dot(n, m)) / 2;
          nxt.push([w * pp, m, true]); nxt.push([w * (1 - pp), m.map((v) => -v), false]);
        }
        if (i === st.length - 1) { fin = [nxt.filter((q) => q[2]).reduce((s, q) => s + q[0], 0), nxt.filter((q) => !q[2]).reduce((s, q) => s + q[0], 0)]; }
        else alive = st[i].keep === 'both' ? nxt.map((q) => [q[0], q[1]]) : nxt.filter((q) => q[2] === (st[i].keep === '+')).map((q) => [q[0], q[1]]);
      }
      const surv = fin[0] + fin[1];
      /* histograma */
      CQ.draw.clear(ch);
      const tot = cnt[0] + cnt[1];
      const pl = new CQ.Plot(ch.ctx, { x: 0, y: 0, w: ch.w, h: ch.h, xmin: 0, xmax: 2, ymin: 0, ymax: 1.05, xticks: [], ylabel: 'fracción', mb: 26, mt: 10 });
      pl.frame();
      pl.clip((c2) => {
        [[cnt[0], 0.5, '--c2'], [cnt[1], 1.5, '--c1']].forEach(([c, xc, col]) => { const f = tot ? c / tot : 0; c2.fillStyle = CQ.alpha(col, 0.55); c2.fillRect(pl.X(xc - 0.3), pl.Y(f), pl.X(xc + 0.3) - pl.X(xc - 0.3), pl.Y(0) - pl.Y(f)); });
      });
      if (surv > 0) { pl.hline(fin[0] / surv, { color: '--c2', dash: [5, 3] }); pl.hline(fin[1] / surv, { color: '--c1', dash: [5, 3] }); }
      CQ.text(ch.ctx, 'último aparato: +', pl.X(0.5), pl.iy + pl.ih + 16, { size: 12, align: 'center', color: '--ink-2' });
      CQ.text(ch.ctx, 'último aparato: −', pl.X(1.5), pl.iy + pl.ih + 16, { size: 12, align: 'center', color: '--ink-2' });
      sim.set('Pp', surv > 0 ? CQ.fix(fin[0] / surv, 4) : '—');
      sim.set('Pm', surv > 0 ? CQ.fix(fin[1] / surv, 4) : '—');
      sim.set('obs', tot ? `${CQ.fix(cnt[0] / tot, 3)}, ${CQ.fix(cnt[1] / tot, 3)} (${tot})` : '—');
      sim.set('surv', `${CQ.fix(100 * surv, 1)} % (observado ${tot + nBlk ? CQ.fix((100 * tot) / (tot + nBlk), 1) : '—'} %)`);
    });
  });

  /* ======================================================================
     7.2 Dos partículas idénticas en una caja
     ====================================================================== */
  CQ.defineSim('particulas-identicas', function (sim) {
    sim.cols2();
    const cm = sim.canvas({ aspect: 1 });
    const cd = sim.canvas({ aspect: 1 });
    sim.group('Estados de una partícula (caja de ancho 1)');
    sim.slider('na', { label: '<i>n</i><sub>a</sub>', min: 1, max: 4, value: 1, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('nb', { label: '<i>n</i><sub>b</sub>', min: 1, max: 4, value: 2, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.seg('type', { label: 'Tipo de partículas', options: [['dist', 'Distinguibles'], ['bos', 'Bosones'], ['fer', 'Fermiones (mismo espín)']], value: 'fer' });
    sim.out('d', '⟨|<i>x</i><sub>1</sub> − <i>x</i><sub>2</sub>|⟩', { hl: true });
    sim.out('u', 'Repulsión ⟨1/√((<i>x</i><sub>1</sub>−<i>x</i><sub>2</sub>)² + 0.01)⟩', { hl: true });
    sim.out('diag', 'Densidad en la diagonal');
    sim.out('cmp', 'Comparación de repulsiones (dist. / bos. / fer.)');
    const phi = (n, x) => Math.SQRT2 * Math.sin(n * Math.PI * x);
    const psiOf = (type, na, nb) => (x1, x2) => {
      const p = phi(na, x1) * phi(nb, x2), q = phi(nb, x1) * phi(na, x2);
      if (type === 'dist') return p;
      if (na === nb) return type === 'bos' ? p : 0;
      return type === 'bos' ? (p + q) / Math.SQRT2 : (p - q) / Math.SQRT2;
    };
    const stats = (type, na, nb) => {
      const f = psiOf(type, na, nb), G = 160, h = 1 / G;
      let n = 0, d = 0, u = 0, diag = 0;
      for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
        const x1 = (i + 0.5) * h, x2 = (j + 0.5) * h, p = f(x1, x2) ** 2;
        n += p; d += p * Math.abs(x1 - x2); u += p / Math.sqrt((x1 - x2) ** 2 + 0.01);
        if (i === j) diag += p;
      }
      return n > 0 ? { d: d / n, u: u / n, diag: diag / n * G * h } : null;
    };
    sim.onDraw(() => {
      const { na, nb, type } = sim.p;
      const f = psiOf(type, na, nb);
      const view = new CQ.View2D(cm, { xmin: -0.08, xmax: 1.04, ymin: -0.08, ymax: 1.04 });
      CQ.draw.clear(cm);
      let mx = 0;
      for (let i = 0; i <= 50; i++) for (let j = 0; j <= 50; j++) mx = Math.max(mx, f(i / 50, j / 50) ** 2);
      CQ.field.heat(view, (x1, x2) => (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1 ? NaN : f(x1, x2)), (v) => CQ.cmap.diverging(mx > 0 ? (Math.sign(v) * v * v) / mx : 0), { res: 3 });
      const ctx = cm.ctx;
      ctx.strokeStyle = CQ.col('--ink-3'); ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(view.X(0), view.Y(0)); ctx.lineTo(view.X(1), view.Y(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeRect(view.X(0), view.Y(1), view.X(1) - view.X(0), view.Y(0) - view.Y(1));
      CQ.text(ctx, 'x₁', view.X(0.5), view.Y(0) + 18, { size: 13, align: 'center', italic: true, family: CQ.FONT_MATH });
      CQ.text(ctx, 'x₂', view.X(0) - 10, view.Y(0.5), { size: 13, align: 'right', baseline: 'middle', italic: true, family: CQ.FONT_MATH, halo: true });
      CQ.text(ctx, 'x₁ = x₂', view.X(0.82), view.Y(0.9), { size: 11, color: '--ink-3', halo: true });
      if (mx === 0) CQ.text(ctx, 'ψ ≡ 0: estado prohibido por Pauli', view.X(0.5), view.Y(0.5), { size: 14, align: 'center', color: '--warn-ink', weight: 650, halo: true });
      /* distribución de la distancia */
      CQ.draw.clear(cd);
      /* densidad de la distancia s = |x₁ − x₂|: P(s) = 2∫₀^{1−s} |ψ(u, u+s)|² du (simetría) */
      const NBIN = 60;
      const hist = (ff) => {
        const b = new Float64Array(NBIN);
        for (let k = 0; k < NBIN; k++) {
          const s = (k + 0.5) / NBIN, L = 1 - s, nq = 80;
          let acc = 0;
          for (let q = 0; q < nq; q++) { const u = ((q + 0.5) / nq) * L; acc += ff(u, u + s) ** 2 + ff(u + s, u) ** 2; }
          b[k] = (acc * L) / nq;
        }
        return b;
      };
      const hd = hist(psiOf('dist', na, nb)), hb = hist(psiOf('bos', na, nb)), hf = hist(psiOf('fer', na, nb));
      const ymax = Math.max(...hd, ...hb, ...hf) * 1.1 || 1;
      const pl = new CQ.Plot(cd.ctx, { x: 0, y: 0, w: cd.w, h: cd.h, xmin: 0, xmax: 1, ymin: 0, ymax, xlabel: '|x₁ − x₂|', ylabel: 'densidad de probabilidad', title: 'distancia entre las partículas' });
      pl.frame();
      const xs = Array.from({ length: NBIN }, (_, k) => (k + 0.5) / NBIN);
      pl.xy(xs, Array.from(hd), { color: '--ink-3', width: 1.6, dash: [5, 4] });
      pl.xy(xs, Array.from(hb), { color: '--c2', width: type === 'bos' ? 2.6 : 1.4 });
      if (na !== nb) pl.xy(xs, Array.from(hf), { color: '--c1', width: type === 'fer' ? 2.6 : 1.4 });
      pl.legend([{ label: 'distinguibles', color: '--ink-3', dash: [5, 4] }, { label: 'bosones', color: '--c2' }, { label: 'fermiones', color: '--c1' }]);
      const s = stats(type, na, nb), sd = stats('dist', na, nb), sb = stats('bos', na, nb), sf = stats('fer', na, nb);
      sim.set('d', s ? f3(s.d) : '—');
      sim.set('u', s ? f3(s.u) : '—');
      sim.set('diag', s ? CQ.fix(s.diag, 4) : '—');
      sim.set('cmp', `${f3(sd.u)} / ${f3(sb.u)} / ${sf ? f3(sf.u) : '—'}`);
    });
  });

  /* ======================================================================
     7.3 Llenado de niveles
     ====================================================================== */
  CQ.defineSim('llenado', function (sim) {
    sim.cols2();
    const cl = sim.canvas({ aspect: 0.9 });
    const ce = sim.canvas({ aspect: 0.9 });
    sim.group('Partículas en una caja (energías en E₁)');
    sim.slider('N', { label: 'Número de partículas <i>N</i>', min: 1, max: 20, value: 8, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.seg('type', { label: 'Tipo', options: [['f2', 'Fermiones ½'], ['f1', 'Fermiones sin espín'], ['b', 'Bosones']], value: 'f2' });
    sim.check('dens', { label: 'Mostrar la densidad total n(x)', value: true });
    sim.out('Et', 'Energía total', { hl: true });
    sim.out('EF', 'Último nivel ocupado (Fermi)');
    sim.out('ratio', '<i>E</i><sub>total</sub>/(<i>N E</i><sub>F</sub>)');
    const occ = (type, N) => {
      const o = [];
      if (type === 'b') { o.push(N); return o; }
      const per = type === 'f2' ? 2 : 1;
      let left = N;
      while (left > 0) { o.push(Math.min(per, left)); left -= per; }
      return o;
    };
    const Etot = (type, N) => occ(type, N).reduce((s, k, i) => s + k * (i + 1) ** 2, 0);
    sim.onDraw(() => {
      const { N, type } = sim.p;
      const o = occ(type, N);
      const nl = Math.max(o.length + 1, 4);
      CQ.draw.clear(cl);
      const pl = new CQ.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 0, xmax: 1, ymin: 0, ymax: nl * nl * 1.08, xlabel: 'x / L', ylabel: 'E / E₁' });
      pl.frame();
      for (let n = 1; n <= nl; n++) {
        const k = o[n - 1] || 0;
        CQ.drawLevels(pl, [{ E: n * n, color: k ? '--ink' : '--grid-2', width: k ? 1.6 : 1 }]);
        for (let e = 0; e < k; e++) {
          const xx = type === 'b' ? 0.1 + (0.8 * (e + 0.5)) / Math.max(k, 1) : 0.5 + (e === 0 ? -0.04 : 0.04);
          const up = type === 'f2' ? e === 0 : true;
          const y0 = pl.Y(n * n), d = 9;
          CQ.draw.arrow(cl.ctx, pl.X(xx), y0 + (up ? d : -d), pl.X(xx), y0 + (up ? -d : d), { color: type === 'b' ? '--c2' : '--accent', width: 1.8, head: 5 });
        }
      }
      if (sim.p.dens && type !== 'b') {
        const dens = (x) => o.reduce((s, k, i) => s + k * 2 * Math.sin((i + 1) * Math.PI * x) ** 2, 0);
        const sc = (nl * nl * 0.3) / (2 * N);
        pl.fn((x) => dens(x) * sc, { color: '--prob', width: 2, fill: '--prob', fillAlpha: 0.12, n: 500 });
        pl.label(0.02, (2 * N) * sc * 1.05, 'n(x)', { color: '--prob' });
      }
      /* energía total frente a N */
      CQ.draw.clear(ce);
      const pe = new CQ.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: 0, xmax: 20, ymin: 0.8, ymax: 3500, ylog: true, xlabel: 'N', ylabel: 'E_{total} / E₁' });
      pe.frame();
      [['f2', '--accent'], ['f1', '--c3'], ['b', '--c2']].forEach(([t, col]) => {
        const pts = []; for (let n = 1; n <= 20; n++) pts.push([n, Etot(t, n)]);
        pe.path(pts, { color: col, width: t === type ? 2.6 : 1.3 });
      });
      pe.dot(N, Etot(type, N), { color: '--ink' });
      pe.legend([{ label: 'fermiones ½', color: '--accent' }, { label: 'sin espín', color: '--c3' }, { label: 'bosones', color: '--c2' }], 'br');
      const EF = o.length ** 2;
      const Et = Etot(type, N);
      sim.set('Et', `${Et} E₁`);
      sim.set('EF', type === 'b' ? '1 E₁ (todos en el fundamental)' : `${EF} E₁ (nivel ${o.length})`);
      sim.set('ratio', f3(Et / (N * EF)));
    });
  });
})();
