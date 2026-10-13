/* Capítulo 26 — Recocido, intercambio de réplicas y protocolos */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, SM = P.sm, ST = P.stat;
  const f3 = (v) => CQ.fix(v, 3), f4 = (v) => CQ.fix(v, 4);

  /* ======================================================================
     26.1 Recocido simulado: el viajante
     ====================================================================== */
  CQ.defineSim('recocido-tsp', function (sim) {
    sim.cols2();
    const cm = sim.canvas({ aspect: 1 });
    const cg = sim.canvas({ aspect: 1 });
    sim.group('Problema');
    sim.slider('n', { label: 'Número de ciudades', min: 10, max: 150, value: 60, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.button('Nuevas ciudades', () => { seed++; build(); }, { primary: true });
    sim.group('Protocolo');
    sim.seg('mode', { label: 'Enfriamiento', options: [['rec', 'Recocido lento'], ['tem', 'Templado (T = 0)']], value: 'rec' });
    sim.slider('T0', { label: 'Temperatura inicial <i>T</i><sub>0</sub> (unidades de longitud)', min: 0.005, max: 1, value: 0.3, log: true, step: 0.001, fmt: (v) => CQ.fix(v, 3) });
    sim.slider('al', { label: 'Factor por barrido α (<i>T</i> → α<i>T</i>)', min: 0.9, max: 0.999, value: 0.985, step: 0.001, fmt: (v) => CQ.fix(v, 3) });
    sim.slider('sp', { label: 'Barridos por segundo', min: 1, max: 200, value: 30, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('k', 'Barridos');
    sim.out('T', 'Temperatura actual');
    sim.out('L', 'Longitud de la ruta', { hl: true });
    sim.out('best', 'Mejor longitud encontrada');
    sim.out('acc', 'Aceptación de movimientos 2-opt');
    let seed = 8, tsp, k, T, hist, best, lastAcc, acc;
    const restart = () => {
      const r = tsp.rng, t = tsp.tour;
      for (let i = t.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [t[i], t[j]] = [t[j], t[i]]; }
      tsp.L = tsp.length(); k = 0; T = sim.p.mode === 'tem' ? 0 : sim.p.T0; hist = [[0, tsp.L, T]]; best = tsp.L; lastAcc = 0; acc = 0;
    };
    const build = () => { tsp = new SM.TSP(Math.round(sim.p.n), P.rng(seed)); restart(); };
    build();
    sim.resetButton(restart);
    sim.onChange = (id) => { if (id === 'n') build(); else if (id === 'mode' || id === 'T0') restart(); };
    sim.animate((dt) => {
      acc += dt * sim.p.sp;
      let q = Math.min(Math.floor(acc), 50);
      acc -= Math.floor(acc);
      while (q-- > 0) {
        lastAcc = tsp.sweep(T); k++;
        if (sim.p.mode === 'rec') { T *= sim.p.al; if (T < 1e-5) T = 0; }
        tsp.L = tsp.length();
        best = Math.min(best, tsp.L);
        hist.push([k, tsp.L, T]);
        if (hist.length > 3000) hist = hist.filter((_, i) => i % 2 === 0);
      }
    });
    sim.onDraw(() => {
      CQ.draw.clear(cm);
      const ctx = cm.ctx, S = Math.min(cm.w, cm.h) - 30, x0 = (cm.w - S) / 2, y0 = (cm.h - S) / 2 + 8;
      const X = (c) => x0 + c[0] * S, Y = (c) => y0 + (1 - c[1]) * S;
      ctx.strokeStyle = CQ.col('--accent'); ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
      ctx.beginPath();
      tsp.tour.forEach((ci, i) => { const c = tsp.c[ci]; if (i) ctx.lineTo(X(c), Y(c)); else ctx.moveTo(X(c), Y(c)); });
      ctx.closePath(); ctx.stroke();
      for (const c of tsp.c) { ctx.beginPath(); ctx.arc(X(c), Y(c), 3.6, 0, 7); ctx.fillStyle = CQ.col('--ink'); ctx.fill(); }
      CQ.text(ctx, `${tsp.n} ciudades al azar en un cuadrado unidad`, cm.w / 2, 14, { size: 11.5, align: 'center', color: '--ink-2' });
      CQ.draw.clear(cg);
      const k1 = Math.max(50, k), Lmax = Math.max(...hist.map((h) => h[1])) * 1.05, Lmin = Math.min(...hist.map((h) => h[1])) * 0.95;
      const pl = new CQ.Plot(cg.ctx, { x: 0, y: 0, w: cg.w, h: cg.h * 0.62, xmin: 0, xmax: k1, ymin: Lmin, ymax: Lmax, xlabel: '', ylabel: 'longitud', title: 'longitud de la ruta', mb: 22 });
      pl.frame();
      pl.path(hist.map((h) => [h[0], h[1]]), { color: '--accent', width: 1.8 });
      const pt = new CQ.Plot(cg.ctx, { x: 0, y: cg.h * 0.62, w: cg.w, h: cg.h * 0.38, xmin: 0, xmax: k1, ymin: -5, ymax: 0.2, xlabel: 'barrido', ylabel: 'log₁₀ T' });
      pt.frame();
      pt.path(hist.filter((h) => h[2] > 0).map((h) => [h[0], Math.log10(h[2])]), { color: '--c2', width: 1.8 });
      sim.set('k', String(k));
      sim.set('T', T > 0 ? CQ.sci(T, 2) : '0 (solo movimientos que acortan)');
      sim.set('L', f4(tsp.L));
      sim.set('best', f4(best));
      sim.set('acc', CQ.fix(100 * lastAcc, 1) + ' %');
    });
  });

  /* ======================================================================
     26.2 Intercambio de réplicas en un paisaje rugoso
     ====================================================================== */
  CQ.defineSim('intercambio-replicas', function (sim) {
    sim.cols2();
    const cl = sim.canvas({ aspect: 0.9 });
    const ch = sim.canvas({ aspect: 0.9 });
    sim.group('Paisaje');
    sim.note('<i>V</i>(<i>x</i>) = (<i>x</i>² − 4)²/2 + 0.3 cos 6<i>x</i> + <i>b x</i>: dos pozos en <i>x</i> ≈ ±2 separados por una barrera de ≈ 8.6.');
    sim.slider('b', { label: 'Inclinación <i>b</i>', min: -0.5, max: 0.5, value: 0, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.group('Réplicas');
    sim.check('pt', { label: 'Intercambiar configuraciones entre temperaturas vecinas', value: true });
    sim.slider('K', { label: 'Número de réplicas <i>K</i>', min: 2, max: 8, value: 6, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('Tmin', { label: '<i>T</i> mínima (la que se quiere muestrear)', min: 0.15, max: 0.6, value: 0.3, step: 0.01, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('Tmax', { label: '<i>T</i> máxima', min: 1, max: 5, value: 3, step: 0.1, fmt: (v) => CQ.fix(v, 1) });
    sim.slider('sp', { label: 'Barridos por segundo', min: 5, max: 3000, value: 200, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('temps', 'Temperaturas (geométricas)');
    sim.out('sw', 'Aceptación de intercambios por par');
    sim.out('fr', 'Fracción en <i>x</i> &gt; 0 a <i>T</i><sub>mín</sub>: réplicas · Metropolis solo · exacta', { hl: true });
    const V0 = (x, b) => ((x * x - 4) ** 2) / 2 + 0.3 * Math.cos(6 * x) + b * x;
    const lo = -3.5, hi = 3.5, nb = 100, bw = (hi - lo) / nb;
    let pt, temps, solo, hPT, hSolo, nPT, rPT, rSolo, n, trace, ex, acc;
    const rng = P.rng(96);
    const reset = () => {
      const K = sim.p.K, b = sim.p.b, V = (x) => V0(x, b);
      temps = Array.from({ length: K }, (_, i) => sim.p.Tmin * Math.pow(sim.p.Tmax / sim.p.Tmin, i / (K - 1)));
      pt = new SM.PT1D(V, temps, 0.4, rng, -2);
      solo = { x: -2, v: V(-2) };
      hPT = new Float64Array(nb); hSolo = new Float64Array(nb); nPT = 0; rPT = 0; rSolo = 0; n = 0; trace = []; acc = 0;
      const B = SM.boltz1D(V, sim.p.Tmin, -5, 5, 4000), fr = new Float64Array(B.x.length);
      for (let i = 0; i < B.x.length; i++) fr[i] = B.x[i] > 0 ? B.p[i] : 0;
      ex = { B, right: P.integ.simpson(fr, B.h) };
    };
    reset();
    sim.resetButton(reset);
    sim.onChange = (id) => { if (id !== 'sp' && id !== 'pt') reset(); };
    const sweep = () => {
      const V = pt.V;
      if (sim.p.pt) pt.sweep(10);
      else {
        for (let r = 0; r < pt.T.length; r++) for (let q = 0; q < 10; q++) {
          const y = pt.x[r] + pt.step[r] * (2 * rng() - 1), vy = V(y);
          if (vy <= pt.v[r] || rng() < Math.exp(-(vy - pt.v[r]) / pt.T[r])) { pt.x[r] = y; pt.v[r] = vy; }
        }
      }
      for (let q = 0; q < 10; q++) {
        const y = solo.x + 0.4 * (2 * rng() - 1), vy = V(y);
        if (vy <= solo.v || rng() < Math.exp(-(vy - solo.v) / temps[0])) { solo.x = y; solo.v = vy; }
      }
      n++;
      const a = Math.floor((pt.x[0] - lo) / bw), c = Math.floor((solo.x - lo) / bw);
      if (a >= 0 && a < nb) hPT[a]++;
      if (c >= 0 && c < nb) hSolo[c]++;
      nPT++; if (pt.x[0] > 0) rPT++; if (solo.x > 0) rSolo++;
      if (n % 4 === 0) { trace.push([n, pt.x[0], solo.x]); if (trace.length > 1200) trace.shift(); }
    };
    sim.animate((dt) => {
      acc += dt * sim.p.sp;
      let q = Math.min(Math.floor(acc), 20000);
      acc -= Math.floor(acc);
      while (q-- > 0) sweep();
    });
    sim.onDraw(() => {
      const V = pt.V, K = temps.length;
      CQ.draw.clear(cl);
      const hTop = cl.h * 0.55;
      const pv = new CQ.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: hTop, xmin: lo, xmax: hi, ymin: -1.5, ymax: 10, xlabel: 'x', ylabel: 'V(x)', title: 'réplicas (color = temperatura)' });
      pv.frame();
      pv.fn(V, { color: '--ink', width: 2, n: 500 });
      for (let r = K - 1; r >= 0; r--) {
        const f = K > 1 ? r / (K - 1) : 0;
        const col = `hsl(${220 - 220 * f}, 75%, 52%)`;
        pv.dot(pt.x[r], V(pt.x[r]), { color: col, r: 6 });
        pv.hline(temps[r] + Math.min(V(-2), V(2)), { color: col, dash: [2, 4] });
      }
      const pt2 = new CQ.Plot(cl.ctx, { x: 0, y: hTop, w: cl.w, h: cl.h - hTop, xmin: trace.length ? trace[0][0] : 0, xmax: Math.max(50, n), ymin: lo, ymax: hi, xlabel: 'barrido', ylabel: 'x a T_{mín}', title: '' });
      pt2.frame();
      pt2.xy(trace.map((t) => t[0]), trace.map((t) => t[2]), { color: CQ.alpha('--c2', 0.85), width: 1.2 });
      pt2.xy(trace.map((t) => t[0]), trace.map((t) => t[1]), { color: '--accent', width: 1.2 });
      CQ.draw.clear(ch);
      const dPT = Array.from(hPT, (c) => (nPT ? c / (nPT * bw) : 0)), dSo = Array.from(hSolo, (c) => (nPT ? c / (nPT * bw) : 0));
      let pmax = 0; for (let i = 0; i < ex.B.x.length; i++) pmax = Math.max(pmax, ex.B.p[i]);
      const ph = new CQ.Plot(ch.ctx, { x: 0, y: 0, w: ch.w, h: ch.h, xmin: lo, xmax: hi, ymin: 0, ymax: Math.max(pmax, ...dPT, ...dSo) * 1.1 || 1, xlabel: 'x', ylabel: 'densidad a T_{mín}', title: 'distribución a T_{mín}' });
      ph.frame();
      CQ.drawHist(ph, { nb, lo, w: bw, dens: dSo }, { color: '--c2', alpha: 0.35 });
      CQ.drawHist(ph, { nb, lo, w: bw, dens: dPT }, { color: '--accent', alpha: 0.5 });
      ph.xy(Array.from(ex.B.x), Array.from(ex.B.p), { color: '--ink', width: 1.8 });
      ph.legend([{ label: sim.p.pt ? 'réplica fría (PT)' : 'réplica fría (sin PT)', color: '--accent', kind: 'sq' }, { label: 'Metropolis solo', color: '--c2', kind: 'sq' }, { label: 'exacta', color: '--ink' }], 'tr');
      sim.set('temps', temps.map((t) => CQ.fix(t, 2)).join(' · '));
      sim.set('sw', sim.p.pt ? Array.from(pt.swOk).map((o, i) => (pt.swTry[i] ? CQ.fix((100 * o) / pt.swTry[i], 0) + '%' : '—')).join(' · ') : 'sin intercambios');
      sim.set('fr', nPT ? `${f3(rPT / nPT)} · ${f3(rSolo / nPT)} · ${f3(ex.right)}` : '—');
    });
  });

  /* ======================================================================
     26.3 Histéresis: ciclos de campo y de temperatura
     ====================================================================== */
  CQ.defineSim('histeresis', function (sim) {
    sim.cols2();
    const cs = sim.canvas({ aspect: 0.85 });
    const cp = sim.canvas({ aspect: 0.85 });
    sim.group('Ciclo');
    sim.seg('mode', { label: 'Parámetro que se recorre', options: [['h', 'Campo h (T fija)'], ['T', 'Temperatura (h = 0)']], value: 'h' });
    sim.slider('T', { label: 'Temperatura del ciclo de campo', min: 1, max: 3.5, value: 1.5, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('ns', { label: 'Barridos por punto (velocidad del ciclo)', min: 1, max: 300, value: 5, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.seg('L', { label: 'Red', options: [[32, '32 × 32'], [64, '64 × 64']], value: 32 });
    sim.slider('sp', { label: 'Barridos por segundo', min: 10, max: 2000, value: 300, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('ph', 'Punto actual');
    sim.out('area', 'Área encerrada por el lazo', { hl: true });
    sim.out('hc', 'Campo coercitivo (m = 0 en la ida) · referencia');
    const rng = P.rng(314);
    let is, path, i, k, fw, bk, acc;
    const reset = () => {
      if (sim.p.mode === 'h') {
        path = [];
        for (let h = -1.5; h <= 1.5001; h += 0.05) path.push(+h.toFixed(3));
        for (let h = 1.45; h >= -1.5001; h -= 0.05) path.push(+h.toFixed(3));
        is = new SM.Ising(sim.p.L, rng, { start: 'down', h: -1.5 });
      } else {
        path = [];
        for (let T = 1; T <= 4.0001; T += 0.05) path.push(+T.toFixed(3));
        for (let T = 3.95; T >= 0.9999; T -= 0.05) path.push(+T.toFixed(3));
        is = new SM.Ising(sim.p.L, rng, { start: 'up', h: 0 });
      }
      i = 0; k = 0; fw = []; bk = []; acc = { s: 0, n: 0 };
    };
    reset();
    sim.resetButton(reset);
    sim.onChange = (id) => { if (id === 'mode' || id === 'T' || id === 'L' || id === 'ns') reset(); };
    const half = () => (path.length + 1) / 2;
    sim.animate((dt) => {
      if (i >= path.length) return;
      let q = Math.min(Math.floor(dt * sim.p.sp * 1.0001) || 1, 400);
      while (q-- > 0 && i < path.length) {
        const pv = path[i];
        let T;
        if (sim.p.mode === 'h') { is.h = pv; T = sim.p.T; } else T = pv;
        is.sweep(T); k++;
        const r = is.energy();
        acc.s += sim.p.mode === 'h' ? r.M / is.N : r.E / is.N; acc.n++;
        if (k >= sim.p.ns) {
          const val = acc.s / acc.n;
          (i < half() - 0.5 ? fw : bk).push([pv, val]);
          i++; k = 0; acc = { s: 0, n: 0 };
        }
      }
    });
    sim.onDraw(() => {
      const modeH = sim.p.mode === 'h';
      CQ.draw.clear(cs);
      const S = Math.min(cs.w, cs.h) - 34;
      const L = is.L, x0 = (cs.w - S) / 2, y0 = 26;
      /* reutiliza el dibujo de espines */
      if (!cs._off || cs._off.width !== L) { cs._off = document.createElement('canvas'); cs._off.width = L; cs._off.height = L; }
      const oc = cs._off.getContext('2d'), img = oc.createImageData(L, L), d = img.data, up = CQ.rgb('--c1'), dn = CQ.rgb('--c2');
      for (let q = 0; q < is.N; q++) { const c = is.s[q] > 0 ? up : dn, o = 4 * q; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = is.s[q] > 0 ? 255 : 150; }
      oc.putImageData(img, 0, 0);
      cs.ctx.imageSmoothingEnabled = false; cs.ctx.drawImage(cs._off, x0, y0, S, S); cs.ctx.imageSmoothingEnabled = true;
      const cur = path[Math.min(i, path.length - 1)];
      CQ.text(cs.ctx, modeH ? `h = ${CQ.fix(cur, 2)},  T = ${CQ.fix(sim.p.T, 2)}` : `T = ${CQ.fix(cur, 2)},  h = 0`, cs.w / 2, 14, { size: 12, align: 'center', color: '--ink-2' });
      CQ.draw.clear(cp);
      const pl = modeH
        ? new CQ.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -1.5, xmax: 1.5, ymin: -1.1, ymax: 1.1, xlabel: 'h / J', ylabel: 'm', title: 'magnetización a lo largo del ciclo' })
        : new CQ.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 1, xmax: 4, ymin: -2.05, ymax: -0.4, xlabel: 'k_BT / J', ylabel: 'e', title: 'energía a lo largo del ciclo' });
      pl.frame();
      if (!modeH) { pl.fn((t) => SM.onsager.u(t), { color: '--ink-3', dash: [5, 4], width: 1.6, n: 300 }); pl.vline(SM.onsager.Tc, { color: '--ink-3', dash: [3, 3], label: 'T_c' }); }
      pl.xy(fw.map((p) => p[0]), fw.map((p) => p[1]), { color: '--c2', width: 2.2 });
      pl.xy(bk.map((p) => p[0]), bk.map((p) => p[1]), { color: '--c1', width: 2.2 });
      fw.forEach((p) => pl.dot(p[0], p[1], { color: '--c2', r: 2.4 }));
      bk.forEach((p) => pl.dot(p[0], p[1], { color: '--c1', r: 2.4 }));
      pl.legend(modeH ? [{ label: 'ida (h creciente)', color: '--c2' }, { label: 'vuelta (h decreciente)', color: '--c1' }] : [{ label: 'calentamiento', color: '--c2' }, { label: 'enfriamiento', color: '--c1' }, { label: 'equilibrio (Onsager)', color: '--ink-3', dash: [5, 4] }], modeH ? 'br' : 'tl');
      /* área del lazo con la regla del trapecio */
      const loop = fw.concat(bk);
      let area = 0;
      if (bk.length > 1) for (let q = 1; q < loop.length; q++) area += 0.5 * (loop[q][1] + loop[q - 1][1]) * (loop[q][0] - loop[q - 1][0]);
      let hc = null;
      if (modeH) for (let q = 1; q < fw.length; q++) if (fw[q - 1][1] < 0 && fw[q][1] >= 0) { hc = fw[q - 1][0] + ((0 - fw[q - 1][1]) * (fw[q][0] - fw[q - 1][0])) / (fw[q][1] - fw[q - 1][1]); break; }
      sim.set('ph', i >= path.length ? 'ciclo completo' : `${i < half() - 0.5 ? (modeH ? 'ida' : 'calentamiento') : modeH ? 'vuelta' : 'enfriamiento'} · punto ${i + 1} de ${path.length}`);
      sim.set('area', bk.length > 1 ? CQ.fix(Math.abs(area), 3) + (modeH ? ' (∮ m dh)' : ' (∮ e dT)') : '—');
      sim.set('hc', modeH ? (hc === null ? '—' : CQ.fix(hc, 2)) + ' · ' + (sim.p.T < SM.onsager.Tc ? 'T < T<sub>c</sub>: lazo esperado' : 'T > T<sub>c</sub>: sin lazo en equilibrio') : 'solo en el ciclo de campo');
    });
  });

  /* ======================================================================
     26.4 Lote de réplicas con IC95
     ====================================================================== */
  CQ.defineSim('lote-ic95', function (sim) {
    sim.cols2();
    const cr = sim.canvas({ aspect: 0.95 });
    const cb = sim.canvas({ aspect: 0.95 });
    sim.group('Lote');
    sim.note('Ising 16 × 16 a <i>T</i> = 1.5 que parte de una configuración al azar. Cada réplica reporta su energía por espín promediada en el último 20 % de la corrida.');
    sim.slider('R', { label: 'Réplicas <i>R</i>', min: 3, max: 40, value: 5, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('ns', { label: 'Barridos por réplica', min: 5, max: 4000, value: 30, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.seg('q', { label: 'Cuantil del IC95', options: [['t', 't de Student'], ['z', '1.96 (normal)']], value: 't' });
    sim.button('Ejecutar lote', () => start(), { primary: true });
    sim.button('Borrar historial', () => { past = []; });
    sim.out('st', 'Estado');
    sim.out('m', 'Media ± IC95', { hl: true });
    sim.out('s', 'Desviación muestral <i>s</i> · cuantil usado');
    sim.out('ex', 'Valor de equilibrio (Onsager, <i>T</i> = 1.5)');
    sim.out('ok', '¿El intervalo contiene el valor de equilibrio?', { hl: true });
    const T = 1.5, L = 16, EX = SM.onsager.u(T);
    let job = null, vals = [], past = [], seed = 1;
    const start = () => { job = { R: sim.p.R, ns: Math.round(sim.p.ns), r: 0, is: null, k: 0, s: 0, n: 0, out: [] }; vals = job.out; };
    const stats = (v, q) => {
      const n = v.length, m = ST.mean(v), s = n > 1 ? ST.std(v) : 0, t = q === 't' ? ST.tQuantile(0.975, n - 1) : 1.96;
      return { n, m, s, t, ci: (t * s) / Math.sqrt(n) };
    };
    sim.animate(() => {
      if (!job) return;
      let budget = 60000;
      while (budget > 0 && job) {
        if (!job.is) { job.is = new SM.Ising(L, P.rng(seed++), { start: 'random' }); job.k = 0; job.s = 0; job.n = 0; }
        job.is.sweep(T); job.k++; budget -= L * L;
        if (job.k > 0.8 * job.ns) { job.s += job.is.energy().E / (L * L); job.n++; }
        if (job.k >= job.ns) {
          job.out.push(job.s / Math.max(1, job.n)); job.is = null; job.r++;
          if (job.r >= job.R) { const st = stats(job.out, sim.p.q); past.push({ ns: job.ns, R: job.R, m: st.m, ci: st.ci }); job = null; }
        }
      }
    });
    sim.onDraw(() => {
      CQ.draw.clear(cr);
      const R = Math.max(sim.p.R, vals.length);
      const ymin = Math.min(EX, ...vals) - 0.08, ymax = Math.max(EX + 0.05, ...vals) + 0.08;
      const pr = new CQ.Plot(cr.ctx, { x: 0, y: 0, w: cr.w, h: cr.h, xmin: 0, xmax: R + 1, ymin, ymax, xlabel: 'réplica', ylabel: 'e (último 20 %)', title: 'lote actual' });
      pr.frame();
      pr.hline(EX, { color: '--ink', dash: [5, 4], label: 'equilibrio', labelRight: true });
      if (vals.length > 1 && !job) {
        const st = stats(vals, sim.p.q);
        pr.clip((ctx) => { ctx.fillStyle = CQ.alpha('--accent', 0.15); ctx.fillRect(pr.X(0), pr.Y(st.m + st.ci), pr.X(R + 1) - pr.X(0), pr.Y(st.m - st.ci) - pr.Y(st.m + st.ci)); });
        pr.hline(st.m, { color: '--accent', label: 'media', labelRight: false });
      }
      vals.forEach((v, q) => pr.dot(q + 1, v, { color: '--c1', r: 4 }));
      CQ.draw.clear(cb);
      const lx = past.map((p) => Math.log10(p.ns));
      const by = past.map((p) => [p.m - p.ci, p.m + p.ci]).flat();
      const pb = new CQ.Plot(cb.ctx, { x: 0, y: 0, w: cb.w, h: cb.h, xmin: 0.5, xmax: 3.8, ymin: Math.min(EX - 0.05, ...by), ymax: Math.max(EX + 0.05, ...by) + 0.02, xlabel: 'log₁₀ (barridos por réplica)', ylabel: 'media ± IC95', title: 'historial de lotes: sesgo frente a longitud' });
      pb.frame();
      pb.hline(EX, { color: '--ink', dash: [5, 4] });
      pb.clip((ctx) => {
        past.forEach((p, q) => {
          const x = pb.X(lx[q]), ok = Math.abs(p.m - EX) <= p.ci;
          ctx.strokeStyle = CQ.col(ok ? '--c3' : '--c2'); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x, pb.Y(p.m - p.ci)); ctx.lineTo(x, pb.Y(p.m + p.ci)); ctx.stroke();
          ctx.fillStyle = CQ.col(ok ? '--c3' : '--c2'); ctx.beginPath(); ctx.arc(x, pb.Y(p.m), 3.5, 0, 7); ctx.fill();
        });
      });
      pb.legend([{ label: 'contiene el equilibrio', color: '--c3' }, { label: 'no lo contiene', color: '--c2' }], 'tr');
      sim.set('st', job ? `réplica ${job.r + 1} de ${job.R} (barrido ${job.k} de ${job.ns})` : vals.length ? `listo: ${vals.length} réplicas de ${past.length ? past[past.length - 1].ns : '—'} barridos` : 'pulse «Ejecutar lote»');
      sim.set('ex', f4(EX));
      if (vals.length > 1 && !job) {
        const st = stats(vals, sim.p.q);
        sim.set('m', `${f4(st.m)} ± ${f4(st.ci)}`);
        sim.set('s', `${f4(st.s)} · ${CQ.fix(st.t, 3)}`);
        sim.set('ok', Math.abs(st.m - EX) <= st.ci ? 'sí' : 'no: sesgo o mala suerte (5 %)');
      } else { sim.set('m', '—'); sim.set('s', '—'); sim.set('ok', '—'); }
    });
    start();
  });
})();
