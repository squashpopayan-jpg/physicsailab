/* Capítulo 9 — Capacitancia */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K, CK = EM.ckt;
  const rad = M.rad;
  const f2 = (v) => EM.fix(v, 2);

  /* ======================================================================
     9.1 Capacitancia según la geometría
     ====================================================================== */
  EM.defineSim('capacitor-geometry', function (sim) {
    sim.cols2();
    const c3 = sim.canvas({ aspect: 0.95 });
    const cp = sim.canvas({ aspect: 0.95 });
    const v3 = new EM.View3D(sim, c3, { radius: 1.3, az: rad(35), el: rad(22) });
    sim.group('Geometría');
    sim.seg('g', { options: [['pl', 'Placas'], ['cy', 'Cilíndrico'], ['sp', 'Esférico']], value: 'pl', onInput: () => vis() });
    const S = {
      L: sim.slider('L', { label: 'Lado de las placas', min: 2, max: 30, step: 0.5, value: 10, unit: 'cm', fmt: (v) => EM.fix(v, 1) }),
      d: sim.slider('d', { label: 'Separación <i>d</i>', min: 0.2, max: 20, value: 2, log: true, step: 0.05, unit: 'mm', fmt: f2 }),
      ca: sim.slider('ca', { label: 'Radio interior <i>a</i>', min: 0.2, max: 10, step: 0.05, value: 0.8, unit: 'mm', fmt: f2 }),
      cb: sim.slider('cb', { label: 'Radio exterior <i>b</i>', min: 0.3, max: 30, step: 0.05, value: 3, unit: 'mm', fmt: f2 }),
      sa: sim.slider('sa', { label: 'Radio interior <i>a</i>', min: 1, max: 20, step: 0.1, value: 5, unit: 'cm', fmt: (v) => EM.fix(v, 1) }),
      sb: sim.slider('sb', { label: 'Radio exterior <i>b</i>', min: 1.1, max: 40, step: 0.1, value: 10, unit: 'cm', fmt: (v) => EM.fix(v, 1) }),
      len: sim.slider('len', { label: 'Longitud <i>L</i> (cilindro)', min: 1, max: 100, step: 1, value: 20, unit: 'cm', fmt: (v) => v.toFixed(0) })
    };
    sim.group('Carga');
    sim.slider('V', { label: 'Diferencia de potencial <i>V</i>', min: 1, max: 1000, value: 100, log: true, step: 1, unit: 'V', fmt: (v) => v.toFixed(0) });
    const unitNote = sim.note('');
    function vis() {
      const g = sim.p.g;
      S.L.show(g === 'pl'); S.d.show(g === 'pl');
      S.ca.show(g === 'cy'); S.cb.show(g === 'cy'); S.len.show(g === 'cy');
      S.sa.show(g === 'sp'); S.sb.show(g === 'sp');
      unitNote.innerHTML = g === 'pl' ? 'Se desprecian los efectos de borde (d ≪ lado).' : 'Si b ≤ a se toma b = 1.02 a.';
    }
    vis();
    sim.out('C', 'Capacitancia <i>C</i>', { hl: true });
    sim.out('Q', 'Carga <i>Q</i> = <i>CV</i>');
    sim.out('U', 'Energía ½<i>CV</i>²');
    sim.out('E', 'Campo máximo');
    sim.out('br', '¿Ruptura del aire (3 MV/m)?');
    sim.hint('Arrastra para girar', c3);
    sim.onDraw(() => {
      const p = sim.p, g = p.g;
      let C, Emax, xs, fn, cur, xlabel, ylabel, extra = null;
      const pa = g === 'cy' ? p.ca : p.sa;
      const b = g === 'cy' ? Math.max(p.cb, p.ca * 1.02) : Math.max(p.sb, p.sa * 1.02);
      if (g === 'pl') {
        const A = (p.L * 1e-2) ** 2, d = p.d * 1e-3;
        C = (K.eps0 * A) / d; Emax = p.V / d;
        fn = (dd) => ((K.eps0 * A) / (dd * 1e-3)) * 1e12; cur = [p.d, C * 1e12]; xs = [0.2, 20]; xlabel = 'd (mm)'; ylabel = 'C (pF)';
      } else if (g === 'cy') {
        const a = pa * 1e-3, bb = b * 1e-3, L = p.len * 1e-2;
        C = (2 * Math.PI * K.eps0 * L) / Math.log(bb / a); Emax = p.V / (a * Math.log(bb / a));
        fn = (r) => ((2 * Math.PI * K.eps0) / Math.log(r)) * 1e12; cur = [bb / a, (C / L) * 1e12]; xs = [1.02, 20]; xlabel = 'b / a'; ylabel = 'C / L (pF/m)';
      } else {
        const a = pa * 1e-2, bb = b * 1e-2;
        C = (4 * Math.PI * K.eps0 * a * bb) / (bb - a); Emax = (p.V * bb) / (a * (bb - a));
        fn = (r) => ((4 * Math.PI * K.eps0 * a * r) / (r - 1)) * 1e12; cur = [bb / a, C * 1e12]; xs = [1.02, 20]; xlabel = 'b / a'; ylabel = 'C (pF)';
        extra = 4 * Math.PI * K.eps0 * a * 1e12;
      }
      /* 3D */
      v3.begin();
      if (g === 'pl') {
        const L = 1.6, dTrue = (p.d / (p.L * 10)) * L, d = Math.max(0.16, dTrue);
        if (d > dTrue) v3.text([0, -L / 2 - 0.2, -0.5], 'separación exagerada', { size: 11, color: '--ink-3' });
        const pl = (z, col) => v3.poly([[-L / 2, -L / 2, z], [L / 2, -L / 2, z], [L / 2, L / 2, z], [-L / 2, L / 2, z]], { fill: col, alpha: 0.5, stroke: col, strokeAlpha: 0.9 });
        pl(d / 2, '--pos'); pl(-d / 2, '--neg');
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) v3.arrow([i * 0.5, j * 0.5, d / 2], [i * 0.5, j * 0.5, -d / 2], { color: '--efield', width: 1.3, head: Math.min(8, d * 40) });
        v3.text([L / 2 + 0.15, 0, d / 2], '+Q', { size: 12, color: '--pos', weight: 700 });
        v3.text([L / 2 + 0.15, 0, -d / 2], '−Q', { size: 12, color: '--neg', weight: 700 });
      } else if (g === 'cy') {
        const sc = 1.1 / Math.max(b, (p.len * 10) / 2 / 3);
        const ra = pa * sc, rb = b * sc, hl = Math.min(1.5, (p.len * 10 * sc) / 2);
        v3.mesh((f, z) => [ra * Math.cos(f), ra * Math.sin(f), z], 0, 2 * Math.PI, 28, -hl, hl, 2, { fill: '--pos', alpha: 0.55 });
        v3.mesh((f, z) => [rb * Math.cos(f), rb * Math.sin(f), z], 0, 1.5 * Math.PI, 24, -hl, hl, 2, { fill: '--neg', alpha: 0.22, wire: '--neg', wireAlpha: 0.4 });
        for (let k = 0; k < 8; k++) { const f = (2 * Math.PI * k) / 8 + 0.2; if (f > 1.5 * Math.PI) continue; v3.arrow([ra * Math.cos(f), ra * Math.sin(f), 0], [rb * Math.cos(f), rb * Math.sin(f), 0], { color: '--efield', width: 1.3, head: 7 }); }
      } else {
        const sc = 1.2 / b;
        const ra = pa * sc, rb = b * sc;
        v3.mesh((t, f) => EM.coords.sph2cart(ra, t, f), 0, Math.PI, 12, 0, 2 * Math.PI, 24, { fill: '--pos', alpha: 0.6 });
        v3.mesh((t, f) => EM.coords.sph2cart(rb, t, f), 0, Math.PI, 12, 0, 1.5 * Math.PI, 18, { fill: '--neg', alpha: 0.18, wire: '--neg', wireAlpha: 0.35 });
        for (let k = 0; k < 7; k++) { const f = (2 * Math.PI * k) / 8 + 0.2; const t = Math.PI / 2 + (k % 3 - 1) * 0.5; v3.arrow(EM.coords.sph2cart(ra, t, f), EM.coords.sph2cart(rb, t, f), { color: '--efield', width: 1.3, head: 7 }); }
      }
      v3.render();
      /* gráfica */
      EM.draw.clear(cp);
      const ys = [fn(xs[1]), fn(xs[0])].sort((a1, b1) => a1 - b1);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: xs[0], xmax: xs[1], ymin: ys[0] * 0.8, ymax: ys[1] * 1.2, xlog: true, ylog: true, xlabel, ylabel, ml: 60 });
      pl.frame();
      pl.fn(fn, { color: '--c1', width: 2.2 });
      if (g === 'pl') pl.label(0.6, fn(0.6) * 1.6, 'C ∝ 1/d', { color: '--c1' });
      else pl.fn((r) => (g === 'cy' ? (2 * Math.PI * K.eps0) / (r - 1) : (4 * Math.PI * K.eps0 * pa * 1e-2) / (r - 1)) * 1e12, { color: '--ink-3', width: 1.3, dash: [5, 4] });
      if (extra) pl.hline(extra, { color: '--c3', dash: [4, 3], label: 'esfera aislada 4πε₀a', labelRight: true });
      pl.dot(cur[0], cur[1], { color: '--accent', r: 5.5 });
      if (g !== 'pl') pl.label(xs[0] * 1.1, ys[0] * 1.1, 'discontinua: aproximación de placas', { color: '--ink-3' });
      sim.set('C', EM.si(C, 'F'));
      sim.set('Q', EM.si(C * p.V, 'C'));
      sim.set('U', EM.si(0.5 * C * p.V * p.V, 'J'));
      sim.set('E', EM.si(Emax, 'V/m') + (g === 'pl' ? '' : ' (en el conductor interior)'));
      sim._outs.br.dd.classList.toggle('warnv', Emax > 3e6);
      sim.set('br', Emax > 3e6 ? 'sí: el aire se ioniza' : 'no');
    });
  });

  /* ======================================================================
     9.2 Redes de condensadores
     ====================================================================== */
  EM.defineSim('capacitor-network', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.group('Conexión');
    sim.select('net', { options: [['s', 'Serie: C₁ – C₂ – C₃'], ['p', 'Paralelo: C₁ ∥ C₂ ∥ C₃'], ['m1', '(C₁ ∥ C₂) en serie con C₃'], ['m2', '(C₁ en serie con C₂) ∥ C₃']], value: 'm1' });
    sim.group('Valores');
    ['C1', 'C2', 'C3'].forEach((k, i) => sim.slider(k, { label: `<i>C</i><sub>${i + 1}</sub>`, min: 0.5, max: 10, step: 0.5, value: [2, 4, 3][i], unit: 'µF', fmt: (v) => EM.fix(v, 1) }));
    sim.slider('V', { label: 'Fuente <i>V</i>', min: 1, max: 24, step: 0.5, value: 12, unit: 'V', fmt: (v) => EM.fix(v, 1) });
    sim.out('Ceq', '<i>C</i><sub>eq</sub>', { hl: true });
    sim.out('Qt', 'Carga entregada por la fuente');
    sim.out('Ut', 'Energía total');
    sim.outSep();
    [1, 2, 3].forEach((i) => sim.out('c' + i, `<i>C</i><sub>${i}</sub>: <i>Q</i>, <i>V</i>`));
    const solve = (p) => {
      const c = [p.C1, p.C2, p.C3].map((x) => x * 1e-6), V = p.V;
      let Ceq, q = [0, 0, 0], v = [0, 0, 0];
      if (p.net === 's') { Ceq = 1 / (1 / c[0] + 1 / c[1] + 1 / c[2]); const Q = Ceq * V; q = [Q, Q, Q]; v = c.map((ci) => Q / ci); }
      else if (p.net === 'p') { Ceq = c[0] + c[1] + c[2]; v = [V, V, V]; q = c.map((ci) => ci * V); }
      else if (p.net === 'm1') { const c12 = c[0] + c[1]; Ceq = 1 / (1 / c12 + 1 / c[2]); const Q = Ceq * V; const v12 = Q / c12; v = [v12, v12, Q / c[2]]; q = [c[0] * v12, c[1] * v12, Q]; }
      else { const c12 = 1 / (1 / c[0] + 1 / c[1]); Ceq = c12 + c[2]; const q12 = c12 * V; q = [q12, q12, c[2] * V]; v = [q12 / c[0], q12 / c[1], V]; }
      return { Ceq, q, v };
    };
    sim.onDraw(() => {
      const p = sim.p, r = solve(p);
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const L = w * 0.12, R = w * 0.88, T = h * 0.2, B = h * 0.82;
      const lab = (i) => [`C${'₁₂₃'[i]} = ${EM.fix([p.C1, p.C2, p.C3][i], 1)} µF`, `Q = ${EM.fix(r.q[i] * 1e6, 2)} µC`, `V = ${EM.fix(r.v[i], 2)} V`];
      /* fuente a la izquierda (positivo arriba) */
      CK.battery(ctx, L, B, L, T, { label: `${EM.fix(p.V, 1)} V`, labelSide: 1, labelOff: 26, labelColor: '--accent' });
      const net = p.net;
      if (net === 's') {
        const xs = [L, L + (R - L) * 0.33, L + (R - L) * 0.66, R];
        CK.wire(ctx, [[L, T], [xs[0] + 20, T]]);
        for (let i = 0; i < 3; i++) CK.capacitor(ctx, i === 0 ? L + 20 : xs[i], T, i === 2 ? R : xs[i + 1], T, { label: lab(i), labelSide: -1, labelOff: 44, mono: true, labelSize: 11.5 });
        CK.wire(ctx, [[R, T], [R, B], [L, B]]);
      } else if (net === 'p') {
        const xs = [L + (R - L) * 0.3, L + (R - L) * 0.6, R];
        CK.wire(ctx, [[L, T], [R, T]]);
        CK.wire(ctx, [[L, B], [R, B]]);
        xs.forEach((x, i) => { CK.capacitor(ctx, x, T, x, B, { label: lab(i), labelSide: -1, labelOff: 18, mono: true, labelSize: 11.5 }); CK.node(ctx, x, T); CK.node(ctx, x, B); });
      } else if (net === 'm1') {
        const xa = L + (R - L) * 0.22, xb = L + (R - L) * 0.55, ym = (T + B) / 2;
        CK.wire(ctx, [[L, T], [xa, T]]);
        CK.wire(ctx, [[xa, T - 40], [xa, T + 40]]);
        CK.capacitor(ctx, xa, T - 40, xb, T - 40, { label: lab(0), labelSide: -1, labelOff: 40, mono: true, labelSize: 11.5 });
        CK.capacitor(ctx, xa, T + 40, xb, T + 40, { label: lab(1), labelSide: 1, labelOff: 40, mono: true, labelSize: 11.5 });
        CK.wire(ctx, [[xb, T - 40], [xb, T + 40]]);
        CK.wire(ctx, [[xb, T], [R, T]]);
        CK.capacitor(ctx, R, T, R, B, { label: lab(2), labelSide: 1, labelOff: 18, mono: true, labelSize: 11.5 });
        CK.wire(ctx, [[R, B], [L, B]]);
        [[xa, T], [xb, T]].forEach(([x, y]) => CK.node(ctx, x, y));
        void ym;
      } else {
        const xa = L + (R - L) * 0.42, ym = (T + B) / 2;
        CK.wire(ctx, [[L, T], [R, T]]);
        CK.wire(ctx, [[L, B], [R, B]]);
        CK.capacitor(ctx, xa, T, xa, ym, { label: lab(0), labelSide: -1, labelOff: 18, mono: true, labelSize: 11.5 });
        CK.capacitor(ctx, xa, ym, xa, B, { label: lab(1), labelSide: -1, labelOff: 18, mono: true, labelSize: 11.5 });
        CK.capacitor(ctx, R, T, R, B, { label: lab(2), labelSide: 1, labelOff: 18, mono: true, labelSize: 11.5 });
        [[xa, T], [xa, B], [R, T], [R, B]].forEach(([x, y]) => CK.node(ctx, x, y));
      }
      const Ut = 0.5 * r.Ceq * p.V * p.V;
      sim.set('Ceq', EM.si(r.Ceq, 'F'));
      sim.set('Qt', EM.si(r.Ceq * p.V, 'C'));
      sim.set('Ut', EM.si(Ut, 'J'));
      [0, 1, 2].forEach((i) => sim.set('c' + (i + 1), EM.si(r.q[i], 'C') + ', ' + EM.fix(r.v[i], 2) + ' V'));
    });
  });

  /* ======================================================================
     9.3 Separar las placas: Q o V constante
     ====================================================================== */
  EM.defineSim('plates-energy', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 0.95 });
    const cp = sim.canvas({ aspect: 0.95 });
    sim.group('Condición');
    sim.seg('mode', { options: [['V', 'Batería conectada'], ['Q', 'Aislado']], value: 'V' });
    sim.group('Parámetros');
    sim.slider('d', { label: 'Separación actual <i>d</i>', min: 0.5, max: 8, step: 0.05, value: 4, unit: 'mm', fmt: f2 });
    sim.slider('A', { label: 'Área de las placas', min: 50, max: 400, step: 10, value: 200, unit: 'cm²', fmt: (v) => v.toFixed(0) });
    sim.slider('V0', { label: 'Tensión de la batería (carga inicial)', min: 10, max: 500, step: 10, value: 200, unit: 'V', fmt: (v) => v.toFixed(0) });
    sim.note('La referencia es la separación inicial <i>d</i><sub>0</sub> = 2 mm, a la que se cargó el condensador con <i>V</i><sub>0</sub>.');
    sim.out('C', '<i>C</i>');
    sim.out('Q', '<i>Q</i>');
    sim.out('V', '<i>V</i>');
    sim.out('E', '<i>E</i> entre placas');
    sim.out('U', '<i>U</i>', { hl: true });
    sim.outSep('Balance desde la referencia');
    sim.out('dU', 'Δ<i>U</i>');
    sim.out('Wb', 'Trabajo de la batería');
    sim.out('Wm', 'Trabajo mecánico externo', { hl: true });
    sim.out('F', 'Fuerza de atracción');
    const d0 = 2e-3;
    const state = (p, dmm) => {
      const A = p.A * 1e-4, d = dmm * 1e-3;
      const C = (K.eps0 * A) / d, C0 = (K.eps0 * A) / d0, Q0 = C0 * p.V0;
      let Q, V;
      if (p.mode === 'V') { V = p.V0; Q = C * V; } else { Q = Q0; V = Q / C; }
      const U = (Q * Q) / (2 * C), U0 = (Q0 * Q0) / (2 * C0);
      const Wb = p.mode === 'V' ? p.V0 * (Q - Q0) : 0;
      return { A, d, C, Q, V, U, U0, Q0, dU: U - U0, Wb, Wm: U - U0 - Wb, E: V / d, F: (Q * Q) / (2 * K.eps0 * A) };
    };
    sim.onDraw(() => {
      const p = sim.p, s = state(p, p.d);
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const cx = w * 0.58, pw = w * 0.62, gap = p.d * (h * 0.075);
      const yt = h / 2 - gap / 2, yb = h / 2 + gap / 2;
      /* campo */
      const n = Math.max(2, Math.round((s.Q / s.A) * 1e6 * 0.9));
      for (let i = 0; i < Math.min(n, 30); i++) {
        const x = cx - pw / 2 + ((i + 0.5) * pw) / Math.min(n, 30);
        EM.draw.arrow(ctx, x, yt + 4, x, yb - 4, { color: '--efield', width: 1.2, head: Math.min(7, gap * 0.3), alpha: 0.75 });
      }
      ctx.fillStyle = EM.col('--pos'); ctx.fillRect(cx - pw / 2, yt - 8, pw, 8);
      ctx.fillStyle = EM.col('--neg'); ctx.fillRect(cx - pw / 2, yb, pw, 8);
      const ns = Math.min(n, 30);
      for (let i = 0; i < ns; i++) {
        const x = cx - pw / 2 + ((i + 0.5) * pw) / ns;
        EM.text(ctx, '+', x, yt - 13, { size: 12, weight: 700, color: '--pos', align: 'center' });
        EM.text(ctx, '−', x, yb + 22, { size: 12, weight: 700, color: '--neg', align: 'center' });
      }
      /* batería */
      const bx = w * 0.12;
      if (p.mode === 'V') {
        CK.wire(ctx, [[cx - pw / 2, yt - 4], [bx, yt - 4], [bx, h / 2 - 20]]);
        CK.wire(ctx, [[cx - pw / 2, yb + 4], [bx, yb + 4], [bx, h / 2 + 20]]);
        CK.battery(ctx, bx, h / 2 + 20, bx, h / 2 - 20, { label: `${p.V0} V`, labelSide: 1, labelOff: 24 });
      } else {
        EM.text(ctx, 'aislado: Q constante', bx - 4, h / 2, { size: 12, color: '--ink-2', baseline: 'middle' });
      }
      EM.text(ctx, 'd = ' + EM.fix(p.d, 2) + ' mm', cx, 20, { size: 12, mono: true, color: '--ink-2', align: 'center' });
      /* gráfica U(d) */
      EM.draw.clear(cp);
      const pv = { ...p, mode: 'V' }, pq = { ...p, mode: 'Q' };
      const ymax = Math.max(state(pv, 0.5).U, state(pq, 8).U) * 1e6 * 1.1;
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 8, ymin: 0, ymax, xlabel: 'd (mm)', ylabel: 'U (µJ)', title: 'Energía almacenada' });
      pl.frame();
      pl.fn((dd) => state(pv, dd).U * 1e6, { color: '--c1', width: p.mode === 'V' ? 2.4 : 1.4, alpha: p.mode === 'V' ? 1 : 0.5, from: 0.4 });
      pl.fn((dd) => state(pq, dd).U * 1e6, { color: '--c2', width: p.mode === 'Q' ? 2.4 : 1.4, alpha: p.mode === 'Q' ? 1 : 0.5, from: 0.4 });
      pl.vline(2, { color: '--ink-3', label: 'd₀' });
      pl.dot(p.d, s.U * 1e6, { color: '--accent', r: 5.5 });
      pl.legend([{ label: 'V constante', color: '--c1' }, { label: 'Q constante', color: '--c2' }], 'tr');
      sim.set('C', EM.si(s.C, 'F'));
      sim.set('Q', EM.si(s.Q, 'C'));
      sim.set('V', EM.si(s.V, 'V'));
      sim.set('E', EM.si(s.E, 'V/m'));
      sim.set('U', EM.si(s.U, 'J'));
      sim.set('dU', EM.si(s.dU, 'J'));
      sim.set('Wb', EM.si(s.Wb, 'J'));
      sim.set('Wm', EM.si(s.Wm, 'J'));
      sim.set('F', EM.si(s.F, 'N'));
    });
  });
})();
