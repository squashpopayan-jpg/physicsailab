/* ===================================================================
   Capítulo 13 — Equilibrio estático y elasticidad
   Simulaciones: balancin, escalera, volcar, elasticidad
   =================================================================== */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f0 = (v) => MC.fix(v, 0), f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2), f3 = (v) => MC.fix(v, 3);
  const G = MC.K.g;
  const sg0 = (v) => (Math.abs(v) < 0.5 ? '0' : (v > 0 ? '+' : '') + MC.fix(v, 0));

  /* ======================================================================
     13.2  El balancín: equilibrio de torques
     ====================================================================== */
  MC.defineSim('balancin', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    const view = new MC.View2D(cv, { xmin: -4.3, xmax: 2.4, ymin: -0.12, ymax: 2.35, align: 'bottom', padB: 4 });
    const HP = 0.5, HALF = 2;
    const ppl = [{ x: -1.8 }, { x: 1.0 }, { x: 0.4 }];
    const s = { th: 0, w: 0 };
    const COLS = ['--c1', '--c4', '--c5'], FILLS = ['--body-b', '--body-c', '--body-e'], SUB = ['₁', '₂', '₃'];
    const lvl = () => { s.th = 0; s.w = 0; };
    sim.group('Cargas sobre la tabla');
    sim.slider('m1', { label: 'Masa 1 (azul)', min: 0, max: 100, step: 0.5, value: 25, unit: 'kg', fmt: f1 });
    sim.slider('m2', { label: 'Masa 2 (naranja)', min: 0, max: 100, step: 0.5, value: 45, unit: 'kg', fmt: f1 });
    sim.slider('m3', { label: 'Masa 3 (violeta)', min: 0, max: 100, step: 0.5, value: 0, unit: 'kg', fmt: f1 });
    sim.check('pesas', { label: 'Dibujar las cargas como pesas', value: false });
    sim.group('Tabla y apoyo');
    sim.slider('mb', { label: 'Masa de la tabla (4 m)', min: 0, max: 50, step: 0.1, value: 20, unit: 'kg', fmt: f1 });
    sim.slider('xp', { label: 'Posición del apoyo', min: -1.5, max: 1.5, step: 0.01, value: 0, unit: 'm', fmt: f2 });
    sim.button('Nivelar la tabla y soltarla', lvl);
    sim.note('Las posiciones se miden sobre la tabla desde su centro; los brazos de palanca <i>d</i>, desde el apoyo. Torque positivo: antihorario.');
    sim.out('t', 'Torques respecto al apoyo');
    sim.out('net', 'Torque neto Στ', { hl: true });
    sim.out('N', 'Fuerza del apoyo <i>n</i>');
    sim.out('eq', 'La masa 2 equilibra la tabla en');
    sim.presets([
      { id: 'papa', label: 'Niño de 25 kg a 2 m y papá de 80 kg', v: { m1: 25, m2: 80, m3: 0, mb: 20.4, xp: 0, pesas: false }, fn: () => { ppl[0].x = -2; ppl[1].x = 0.625; lvl(); }, note: '25 kg × 2.0 m = 80 kg × 0.625 m: la tabla queda en equilibrio y el apoyo sostiene 1229 N.' },
      { id: 'desigual', label: 'Dos niños iguales a distinta distancia', v: { m1: 30, m2: 30, m3: 0, mb: 20, xp: 0, pesas: false }, fn: () => { ppl[0].x = -1.8; ppl[1].x = 1.0; lvl(); }, note: 'Con masas iguales gana el que está más lejos del apoyo: su brazo de palanca es mayor.' },
      { id: 'tres', label: 'Tres niños en equilibrio', v: { m1: 30, m2: 20, m3: 24, mb: 20, xp: 0, pesas: false }, fn: () => { ppl[0].x = -1.6; ppl[1].x = 1.8; ppl[2].x = 0.5; lvl(); }, note: '30(1.6) = 20(1.8) + 24(0.5): la suma de torques es cero.' },
      { id: 'romana', label: 'Balanza romana', v: { m1: 8, m2: 40, m3: 0, mb: 0, xp: 1.4, pesas: true }, fn: () => { ppl[0].x = -1.1; ppl[1].x = 1.9; lvl(); }, note: 'Una pesa de 8 kg a 2.5 m del apoyo equilibra una carga de 40 kg a 0.5 m: 8 × 2.5 = 40 × 0.5.' },
      { id: 'tabla', label: 'Tabla sola con el apoyo descentrado', v: { m1: 0, m2: 0, m3: 0, mb: 30, xp: 0.8, pesas: false }, fn: lvl, note: 'El peso de la tabla actúa en su centro, a 0.8 m del apoyo: produce un torque y la tabla se inclina.' }
    ]);
    const bpt = (x) => { const p = sim.p; return [p.xp + (x - p.xp) * Math.cos(s.th), HP + (x - p.xp) * Math.sin(s.th)]; };
    MC.handles(sim, cv, view,
      () => ppl.map((q, i) => { const b = bpt(q.x); return { id: i, x: b[0], y: b[1] + 0.45, r: 30, m: sim.p['m' + (i + 1)] }; }).filter((h) => h.m > 0),
      (i, wx) => { const p = sim.p; ppl[i].x = M.clamp(p.xp + (wx - p.xp) / Math.cos(s.th), -HALF, HALF); });
    sim.hint('Arrastre las cargas a lo largo de la tabla', cv);
    const torques = () => {
      const p = sim.p, list = [];
      ppl.forEach((q, i) => { const m = p['m' + (i + 1)]; if (m > 0) list.push({ i, m, x: q.x, col: COLS[i], tau: -m * G * (q.x - p.xp) }); });
      const tb = -p.mb * G * (0 - p.xp);
      return { list, tb, net: list.reduce((a, q) => a + q.tau, 0) + tb };
    };
    sim.animate((dt) => {
      const p = sim.p, T = torques();
      const I = Math.max(5, p.mb * ((2 * HALF) ** 2 / 12 + p.xp * p.xp) + T.list.reduce((a, q) => a + q.m * (q.x - p.xp) ** 2, 0));
      const up = Math.asin(Math.min(0.99, HP / (HALF + p.xp)));   /* baja el extremo izquierdo */
      const dn = Math.asin(Math.min(0.99, HP / (HALF - p.xp)));   /* baja el extremo derecho */
      const n = Math.max(1, Math.ceil(Math.min(dt, 1 / 30) / 0.004)), h = Math.min(dt, 1 / 30) / n;
      for (let k = 0; k < n; k++) {
        s.w += ((T.net * Math.cos(s.th)) / I - 3 * s.w) * h;
        s.th += s.w * h;
        if (s.th > up) { s.th = up; s.w = 0; }
        if (s.th < -dn) { s.th = -dn; s.w = 0; }
      }
    }, { button: false });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      /* distribución: panel de torques arriba (lienzo alto) o a la izquierda (lienzo ancho) */
      view.setRange({ xmin: -2.55, xmax: 2.45 });
      const freeTop = view.Y(2.35) - 8;
      const panelTop = freeTop >= 170;
      if (!panelTop) view.setRange({ xmin: -4.3, xmax: 2.4 });
      D.clear(cv);
      const gy = view.Y(0);
      D.ground(ctx, 0, gy, cv.w, { depth: 12 });
      /* apoyo */
      const P0 = [view.X(p.xp), view.Y(HP)], hw = view.L(0.3);
      D.poly(ctx, [P0, [P0[0] - hw, gy], [P0[0] + hw, gy]], { close: true, fill: '--metal', color: '--ink-2', width: 1.3 });
      const T = torques();
      const c = Math.cos(s.th);
      const bp = (x) => view.P(bpt(x));
      const tpx = Math.max(6, view.L(0.08));
      const A = bp(-HALF), B = bp(HALF);
      D.line(ctx, A[0], A[1], B[0], B[1], { color: '--wood', width: tpx });
      for (let x = -2; x <= 2.001; x += 0.5) {
        const q = bp(x);
        D.circle(ctx, q[0], q[1], 1.5, { fill: '--ink-2' });
        if (Math.abs(x - Math.round(x)) < 1e-6) MC.text(ctx, MC.fix(x, 0), q[0], q[1] + tpx / 2 + 11, { size: 10, mono: true, color: '--ink-3', align: 'center', halo: true });
      }
      /* fuerzas: escala común (100 kg de carga ↔ 0.55 m) */
      const kF = view.L(0.55) / (100 * G);
      const Ntot = (T.list.reduce((a, q) => a + q.m, 0) + p.mb) * G;
      T.list.forEach((q) => {
        const b = bp(q.x), topY = b[1] - tpx / 2;
        let headY;
        if (p.pesas) {
          const side = view.L(0.2 + 0.25 * Math.cbrt(q.m / 50));
          D.block(ctx, b[0], topY - side / 2, side, side, { fill: FILLS[q.i], label: `${f1(q.m)} kg`, size: Math.min(12, side * 0.3) });
          headY = topY - side;
        } else {
          const hgt = view.L(0.85 + 0.45 * Math.cbrt(q.m / 80));
          D.person(ctx, b[0], topY, hgt, { color: q.col, arms: 0.25 });
          MC.text(ctx, `${f1(q.m)} kg`, b[0], topY - hgt - 6, { size: 11.5, align: 'center', weight: 600, color: q.col, halo: true });
          headY = topY - hgt - 6;
        }
        MC.text(ctx, `d${SUB[q.i]} = ${f3(Math.abs((q.x - p.xp) * c)).replace(/0$/, '')} m`, b[0], headY - 15, { size: 11, mono: true, align: 'center', color: q.col, halo: true });
        D.vec(ctx, b[0], b[1] + tpx / 2, 0, q.m * G * kF, { color: '--weight', width: 2, minLen: 3 });
      });
      if (p.mb > 0) {
        const cb = bp(0), len = p.mb * G * kF;
        D.vec(ctx, cb[0], cb[1] + tpx / 2, 0, len, { color: '--weight', width: 1.8, minLen: 3 });
        const lx = Math.abs(cb[0] - P0[0]) < hw + 24 ? P0[0] - hw - 4 : cb[0] - 6;
        MC.text(ctx, 'm_{t}g', lx, cb[1] + tpx / 2 + Math.max(len, 12) * 0.6 + 6, { size: 12, math: true, color: '--weight', align: 'right', halo: true });
      }
      if (Ntot > 0) D.vec(ctx, P0[0] + 10, P0[1] - tpx / 2, 0, -Ntot * kF, { color: '--normal', width: 2.2, label: 'n', size: 13 });
      /* panel de torques */
      const items = T.list.map((q) => ({ label: 'τ' + SUB[q.i], value: q.tau, color: q.col }));
      if (p.mb > 0) items.push({ label: 'τ_{t}', value: T.tb, color: '--wood' });
      const tmax = MC.niceCeil(Math.max(50, ...items.map((q) => Math.abs(q.value)), Math.abs(T.net)));
      const bo = { max: tmax, min: -tmax, title: 'TORQUES RESPECTO AL APOYO (N·m)', total: { label: 'Στ', value: T.net, color: '--fnet' }, fmt: f0 };
      if (panelTop) D.bars(ctx, items, Object.assign(bo, { x: 8, y: 34, w: cv.w - 16, h: Math.min(freeTop - 38, 420) }));
      else {
        const pw = view.X(-2.45) - 16;
        if (pw > 110) D.bars(ctx, items, Object.assign(bo, { x: 8, y: 34, w: pw, h: cv.h - 42, title: 'TORQUES (N·m)' }));
      }
      /* lecturas */
      sim.set('t', items.length ? items.map((q) => `${q.label.replace('_{t}', '<sub>tabla</sub>')} = ${sg0(q.value)}`).join(', ') + ' N·m' : '—');
      const bal = Math.abs(T.net) < 1;
      sim.set('net', `${sg0(T.net)} N·m ${bal ? '<span class="goodv">(equilibrio)</span>' : T.net > 0 ? '(baja el lado izquierdo)' : '(baja el lado derecho)'}`);
      sim.set('N', `${f0(Ntot)} N`);
      if (p.m2 > 0) {
        const q2 = T.list.find((q) => q.i === 1);
        const x2 = p.xp + (T.net - q2.tau) / (p.m2 * G);
        sim.set('eq', Math.abs(x2) <= HALF + 1e-9 ? `x = ${f3(x2)} m (a ${f3(Math.abs(x2 - p.xp))} m del apoyo)` : 'imposible: quedaría fuera de la tabla');
      } else sim.set('eq', '— (masa 2 nula)');
    });
  });

  /* ======================================================================
     13.3  Escalera, letrero y antebrazo
     ====================================================================== */
  MC.defineSim('escalera', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    const st = sim.status(cv);
    sim.group('Situación');
    sim.seg('mode', { options: [['escalera', 'Escalera'], ['letrero', 'Letrero'], ['brazo', 'Antebrazo']], value: 'escalera' });
    const gE = sim.group('Escalera apoyada en una pared lisa');
    sim.slider('L', { label: 'Longitud <i>L</i>', min: 2, max: 8, step: 0.1, value: 5, unit: 'm', fmt: f1 });
    sim.slider('Me', { label: 'Masa de la escalera <i>M</i>', min: 2, max: 40, step: 1, value: 12, unit: 'kg', fmt: f0 });
    sim.slider('th', { label: 'Ángulo con el suelo θ', min: 30, max: 85, step: 1, value: 60, unit: '°', fmt: f0 });
    sim.slider('mp', { label: 'Masa de la persona <i>m</i>', min: 0, max: 120, step: 1, value: 70, unit: 'kg', fmt: f0 });
    sim.slider('d', { label: 'Distancia subida <i>d</i> (a lo largo)', min: 0, max: 5, step: 0.05, value: 2.5, unit: 'm', fmt: f2 });
    sim.slider('mu', { label: 'Fricción estática del suelo μ<sub>s</sub>', min: 0.05, max: 1, step: 0.01, value: 0.4, fmt: f2 });
    const gL = sim.group('Viga articulada en la pared y sostenida por un cable');
    sim.slider('Lb', { label: 'Longitud de la viga', min: 1, max: 4, step: 0.1, value: 2, unit: 'm', fmt: f1 });
    sim.slider('Mb', { label: 'Masa de la viga', min: 0, max: 50, step: 1, value: 10, unit: 'kg', fmt: f0 });
    sim.slider('ms', { label: 'Masa del letrero', min: 1, max: 100, step: 1, value: 30, unit: 'kg', fmt: f0 });
    sim.slider('xs', { label: 'Posición del letrero (desde la pared)', min: 0.1, max: 2, step: 0.05, value: 1.5, unit: 'm', fmt: f2 });
    sim.slider('phi', { label: 'Ángulo del cable con la viga φ', min: 5, max: 70, step: 1, value: 35, unit: '°', fmt: f0 });
    const gB = sim.group('Antebrazo horizontal (codo a 90°)');
    sim.slider('mh', { label: 'Masa sostenida en la mano', min: 0, max: 25, step: 0.5, value: 5, unit: 'kg', fmt: f1 });
    sim.slider('ins', { label: 'Inserción del bíceps (desde el codo)', min: 0.02, max: 0.08, step: 0.005, value: 0.04, unit: 'm', fmt: f3 });
    sim.note('Antebrazo y mano: 1.5 kg con su centro de gravedad a 15 cm del codo; la mano está a 35 cm.');
    const O = ['o1', 'o2', 'o3', 'o4', 'o5'];
    O.forEach((k) => sim.out(k, '—'));
    const setO = (i, lab, val, hl) => { const o = sim._outs[O[i]]; o.label(lab); sim.set(O[i], val); o.dd.classList.toggle('hl', !!hl); };
    sim.presets([
      { id: 'escalera', label: 'Persona que sube por una escalera', v: { mode: 'escalera', L: 5, Me: 12, th: 60, mp: 70, d: 4, mu: 0.4 }, note: 'A 4 m la fricción necesaria (351 N) supera la disponible (321 N): la escalera resbala.' },
      { id: 'segura', label: 'La misma escalera más empinada (75°)', v: { mode: 'escalera', L: 5, Me: 12, th: 75, mp: 70, d: 4.5, mu: 0.4 }, note: 'Más empinada, el brazo de palanca de los pesos es menor y basta con menos fricción.' },
      { id: 'letrero', label: 'Letrero colgado de una viga con cable', v: { mode: 'letrero', Lb: 2, Mb: 10, ms: 30, xs: 1.5, phi: 35 } },
      { id: 'cable-plano', label: 'Cable casi horizontal (10°)', v: { mode: 'letrero', Lb: 2, Mb: 10, ms: 30, xs: 1.5, phi: 10 }, note: 'Con el cable casi horizontal, la tensión es varias veces el peso sostenido.' },
      { id: 'brazo', label: 'Sostener 5 kg con el antebrazo horizontal', v: { mode: 'brazo', mh: 5, ins: 0.04 }, note: 'El bíceps hace casi diez veces el peso sostenido (≈ 484 N para 49 N).' }
    ]);
    const sync = () => {
      const p = sim.p;
      gE.hidden = p.mode !== 'escalera'; gL.hidden = p.mode !== 'letrero'; gB.hidden = p.mode !== 'brazo';
      if (p.d > p.L) sim.ctl.d.set(p.L, true);
      sim.ctl.d.range(0, p.L, 0.05);
      if (p.xs > p.Lb) sim.ctl.xs.set(p.Lb, true);
      sim.ctl.xs.range(0.1, p.Lb, 0.05);
    };
    sim.onChange = sync;
    sync();
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      D.clear(cv);
      st.hide();
      if (p.mode === 'escalera') drawLadder(p, ctx);
      else if (p.mode === 'letrero') drawSign(p, ctx);
      else drawArm(p, ctx);
    });

    function drawLadder(p, ctx) {
      const th = M.rad(p.th), L = p.L;
      const view = new MC.View2D(cv, { xmin: -L * 0.87 - 1.0, xmax: 0.7, ymin: -0.45, ymax: L * 1.03, align: 'bottom', padB: 6 });
      view.grid({ labels: false });
      const gy = view.Y(0), wx = view.X(0);
      ctx.save(); ctx.fillStyle = MC.col('--ground-fill'); ctx.fillRect(wx, 0, cv.w - wx, gy); ctx.restore();
      D.wall(ctx, wx, 0, gy, 'right');
      D.ground(ctx, 0, gy, wx, { depth: 12 });
      const bx = -L * Math.cos(th), ty = L * Math.sin(th);
      const A = [view.X(bx), gy], B = [wx, view.Y(ty)];
      D.line(ctx, A[0], A[1], B[0], B[1], { color: '--wood', width: 7 });
      const nr = Math.round(L * 3.3);
      for (let k = 1; k < nr; k++) { const f = k / nr; D.circle(ctx, A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, 2, { fill: '--ink-2' }); }
      const dd = Math.min(p.d, L);
      const px = bx + dd * Math.cos(th), py = dd * Math.sin(th);
      if (p.mp > 0) D.person(ctx, view.X(px) - 5, view.Y(py), view.L(1.65), { arms: 0.7, color: '--c1' });
      const np = (G * Math.cos(th) * (p.Me * L / 2 + p.mp * dd)) / (L * Math.sin(th));
      const ns = (p.Me + p.mp) * G, fmax = p.mu * ns;
      const slip = np > fmax + 1e-9;
      const k = view.L(L * 0.3) / Math.max(ns, np, fmax, 1);
      D.vec(ctx, A[0], A[1], 0, -ns * k, { color: '--normal', label: 'n_s' });
      D.vec(ctx, A[0], A[1] - 5, np * k, 0, { color: slip ? '--warn-ink' : '--fric', label: 'f', labelSide: -1 });
      /* comparación: fricción necesaria frente a la máxima disponible */
      {
        const px0 = 10, py0 = 50, pw = Math.min(250, wx - 20), ph = 78;
        if (pw > 150) {
          D.panel(ctx, px0, py0, pw, ph, { title: 'FRICCIÓN EN EL SUELO' });
          const fm = Math.max(np, fmax) * 1.12, bx = px0 + 82, bw = pw - 92 - 50;
          [['necesaria', np, slip ? '--warn-ink' : '--fric', 0.85], ['máxima', fmax, '--ink-3', 0.35]].forEach(([t, v, col, al], i) => {
            const y = py0 + 36 + i * 22;
            MC.text(ctx, t, px0 + 8, y + 4, { size: 11, color: '--ink-2' });
            ctx.save(); ctx.fillStyle = MC.col(col); ctx.globalAlpha = al; ctx.fillRect(bx, y - 5, (bw * v) / fm, 11); ctx.restore();
            MC.text(ctx, `${f0(v)} N`, bx + (bw * v) / fm + 4, y + 4, { size: 10.5, mono: true, color: '--ink-2' });
          });
          const xl = bx + (bw * fmax) / fm;
          D.line(ctx, xl, py0 + 24, xl, py0 + ph - 6, { color: '--ink-2', dash: [3, 3], width: 1 });
        }
      }
      D.vec(ctx, B[0], B[1], -np * k, 0, { color: '--normal', label: 'n_p' });
      const mid = [view.X(bx / 2), view.Y(ty / 2)];
      D.vec(ctx, mid[0], mid[1], 0, p.Me * G * k, { color: '--weight', label: 'Mg', vec: false, size: 13 });
      if (p.mp > 0) D.vec(ctx, view.X(px) + 8, view.Y(py + 0.85), 0, p.mp * G * k, { color: '--weight', label: 'mg', vec: false, size: 13 });
      D.angle(ctx, A[0], A[1], 34, 0, th, { label: 'θ' });
      if (slip) st.show('¡La escalera resbala! La fricción necesaria supera μ<sub>s</sub><i>n</i><sub>s</sub>.', 'bad');
      const dmax = p.mp > 0 ? ((fmax * L * Math.sin(th)) / (G * Math.cos(th)) - (p.Me * L) / 2) / p.mp : NaN;
      setO(0, 'Fuerza de la pared <i>n</i><sub>p</sub>', `${f1(np)} N`);
      setO(1, 'Fricción necesaria <i>f</i> = <i>n</i><sub>p</sub>', `${f1(np)} N`, true);
      setO(2, 'Fricción máxima μ<sub>s</sub><i>n</i><sub>s</sub>', `${f1(fmax)} N`, true);
      setO(3, 'Normal del suelo <i>n</i><sub>s</sub> = (<i>M</i> + <i>m</i>)<i>g</i>', `${f1(ns)} N`);
      setO(4, 'Puede subir sin resbalar hasta', p.mp <= 0 ? '—' : dmax >= L ? 'el extremo superior' : dmax <= 0 ? 'ni siquiera el primer peldaño' : `<i>d</i> = ${f2(dmax)} m`);
    }

    function drawSign(p, ctx) {
      const phi = M.rad(p.phi), Lb = p.Lb, hc = Lb * Math.tan(phi);
      const view = new MC.View2D(cv, { xmin: -0.45, xmax: Lb + 0.5, ymin: -1.2, ymax: Math.max(0.7, hc + 0.3) });
      view.grid({ labels: false });
      const wx = view.X(0);
      ctx.save(); ctx.fillStyle = MC.col('--ground-fill'); ctx.fillRect(0, 0, wx, cv.h); ctx.restore();
      D.wall(ctx, wx, 0, cv.h, 'left');
      const xs = Math.min(p.xs, Lb);
      /* letrero colgado con dos cuerdas */
      const sw = Math.min(0.8, Lb * 0.45), sh = 0.44;
      for (const dx of [-sw * 0.32, sw * 0.32]) D.line(ctx, view.X(xs + dx), view.Y(0), view.X(xs + dx), view.Y(-0.38), { color: '--rope', width: 1.5 });
      D.block(ctx, view.X(xs), view.Y(-0.38 - sh / 2), view.L(sw), view.L(sh), { fill: '--body-a', label: 'ABIERTO', size: Math.min(14, view.L(sh) * 0.4) });
      D.line(ctx, wx, view.Y(0), view.X(Lb), view.Y(0), { color: '--metal', width: 9 });
      D.line(ctx, view.X(Lb), view.Y(0), wx, view.Y(hc), { color: '--tension', width: 2.2 });
      D.circle(ctx, wx, view.Y(hc), 4, { fill: '--ink-2' });
      D.circle(ctx, wx, view.Y(0), 6, { fill: '--canvas', color: '--ink', width: 2 });
      const W1 = p.Mb * G, W2 = p.ms * G;
      const T = (W1 * Lb / 2 + W2 * xs) / (Lb * Math.sin(phi));
      const Hx = T * Math.cos(phi), Hy = W1 + W2 - T * Math.sin(phi);
      const k = view.L(0.85) / Math.max(T, Math.hypot(Hx, Hy), W1 + W2, 1);
      D.vec(ctx, view.X(Lb), view.Y(0), -T * Math.cos(phi) * k, -T * Math.sin(phi) * k, { color: '--tension', label: 'T' });
      D.vec(ctx, wx, view.Y(0), Hx * k, -Hy * k, { color: '--force', label: 'H', labelSide: -1 });
      if (W1 > 0) D.vec(ctx, view.X(Lb / 2), view.Y(0), 0, W1 * k, { color: '--weight', width: 1.8, label: 'm_{v}g', vec: false, size: 12 });
      D.vec(ctx, view.X(xs), view.Y(-0.38 - sh), 0, W2 * k, { color: '--weight', label: 'm_{l}g', vec: false, size: 12 });
      D.angle(ctx, view.X(Lb), view.Y(0), 42, Math.PI - phi, Math.PI, { label: 'φ' });
      D.dim(ctx, wx, view.Y(0) + 16, view.X(xs), view.Y(0) + 16, `${f2(xs)} m`, { size: 11, labelOff: -10 });
      setO(0, 'Tensión del cable <i>T</i>', `${f1(T)} N`, true);
      setO(1, 'Bisagra: componente horizontal <i>H</i><sub>x</sub>', `${f1(Hx)} N`);
      setO(2, 'Bisagra: componente vertical <i>H</i><sub>y</sub>', `${f1(Hy)} N` + (Hy < 0 ? ' (hacia abajo)' : ''));
      setO(3, 'Peso total sostenido', `${f1(W1 + W2)} N`);
      setO(4, 'Tensión / peso total', `${f2(T / (W1 + W2))}`, true);
    }

    function drawArm(p, ctx) {
      const view = new MC.View2D(cv, { xmin: -0.13, xmax: 0.47, ymin: -0.2, ymax: 0.33 });
      view.grid({ labels: false });
      const E = [view.X(0), view.Y(0)], Hd = [view.X(0.35), view.Y(0)];
      const mb = 1.5, xcg = 0.15;
      /* húmero y antebrazo */
      D.line(ctx, E[0], E[1], view.X(-0.015), view.Y(0.3), { color: '--body-c', width: view.L(0.05) });
      D.line(ctx, E[0], E[1], view.X(0.33), view.Y(0), { color: '--body-c', width: view.L(0.042) });
      D.circle(ctx, Hd[0] - 4, Hd[1], view.L(0.03), { fill: '--body-c', color: 'none' });
      /* bíceps */
      const I = [view.X(p.ins), view.Y(0.012)];
      ctx.save();
      ctx.strokeStyle = MC.col('--c8'); ctx.lineWidth = Math.max(4, view.L(0.022)); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(I[0], I[1]); ctx.quadraticCurveTo(view.X(p.ins + 0.035), view.Y(0.15), view.X(0.008), view.Y(0.27)); ctx.stroke();
      ctx.restore();
      D.circle(ctx, E[0], E[1], 7, { fill: '--ink-2' });
      MC.text(ctx, 'codo', E[0] - 12, E[1] + 24, { size: 11, color: '--ink-3', align: 'right' });
      MC.text(ctx, 'bíceps', view.X(p.ins + 0.045), view.Y(0.1), { size: 11.5, color: '--c8', weight: 600 });
      const Fb = (G * (mb * xcg + p.mh * 0.35)) / p.ins;
      const J = Fb - (mb + p.mh) * G;
      if (p.mh > 0) {
        D.line(ctx, Hd[0], Hd[1], Hd[0], view.Y(-0.05), { color: '--ink-2', width: 2 });
        const bs = view.L(0.03 + 0.02 * Math.cbrt(p.mh / 5));
        D.block(ctx, Hd[0], view.Y(-0.05) + bs / 2, bs * 1.4, bs, { fill: '--metal', label: `${f1(p.mh)} kg`, size: 10.5 });
      }
      const k = view.L(0.2) / Math.max(Fb, J, 1);
      D.vec(ctx, I[0], view.Y(0), 0, -Fb * k, { color: '--tension', label: 'F_{bíceps}', vec: false, size: 13 });
      D.vec(ctx, E[0] - 10, E[1], 0, J * k, { color: '--force', label: 'F_{codo}', vec: false, size: 13, labelSide: -1 });
      D.vec(ctx, view.X(xcg), view.Y(-0.021), 0, Math.max(14, mb * G * k), { color: '--weight', width: 1.8, label: 'm_{a}g', vec: false, size: 11.5 });
      if (p.mh > 0) D.vec(ctx, Hd[0] + 26, view.Y(0), 0, p.mh * G * k, { color: '--weight', width: 1.8, label: 'Mg', vec: false, size: 12, minLen: 2 });
      const yd = view.Y(-0.14);
      D.dim(ctx, E[0], yd, view.X(p.ins), yd, '', {});
      MC.text(ctx, `${f1(p.ins * 100)} cm`, view.X(p.ins) + 6, yd + 4, { size: 10.5, mono: true, color: '--ink-2', halo: true });
      D.dim(ctx, E[0], view.Y(-0.18), Hd[0], view.Y(-0.18), '35 cm', { size: 10.5 });
      setO(0, 'Fuerza del bíceps', `${f0(Fb)} N`, true);
      setO(1, 'Peso sostenido en la mano <i>Mg</i>', `${f1(p.mh * G)} N`);
      setO(2, 'Fuerza del bíceps / peso sostenido', p.mh > 0 ? f1(Fb / (p.mh * G)) : '—', true);
      setO(3, 'Fuerza en la articulación del codo', `${f0(J)} N hacia abajo`);
      setO(4, 'Peso del antebrazo y la mano', `${f1(mb * G)} N a 15 cm del codo`);
    }
  });

  /* ======================================================================
     13.4  Una caja en un plano que se inclina: ¿desliza o se vuelca?
     ====================================================================== */
  MC.defineSim('volcar', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    const view = new MC.View2D(cv, { xmin: -0.9, xmax: 3.95, ymin: -0.25, ymax: 3.9, align: 'bottom left', padL: 6, padB: 6 });
    const LP = 3.6, S0 = 1.9, RATE = 4;
    const s = { th: 0, phase: 'reposo', slide: 0, v: 0, psi: 0, w: 0 };
    const st = sim.status(cv);
    sim.group('Caja (centro de gravedad en su centro)');
    sim.slider('b', { label: 'Ancho de la base <i>b</i>', min: 0.1, max: 1.5, step: 0.01, value: 0.3, unit: 'm', fmt: f2, reset: true });
    sim.slider('h', { label: 'Altura <i>h</i>', min: 0.1, max: 1.5, step: 0.01, value: 1, unit: 'm', fmt: f2, reset: true });
    sim.slider('mu', { label: 'Fricción estática μ<sub>s</sub>', min: 0.05, max: 1.2, step: 0.01, value: 0.6, fmt: f2, reset: true });
    sim.group('Plano');
    sim.slider('th', { label: 'Inclinación inicial θ', min: 0, max: 60, step: 0.5, value: 0, unit: '°', fmt: f1, reset: true });
    sim.check('fz', { label: 'Mostrar las fuerzas sobre la caja', value: true });
    sim.note(`«Inclinar» hace girar el plano lentamente (${RATE}° por segundo) hasta que la caja desliza o se vuelca.`);
    sim.out('ts', 'Desliza cuando tan θ = μ<sub>s</sub>', { hl: true });
    sim.out('tt', 'Se vuelca cuando tan θ = <i>b</i>/<i>h</i>', { hl: true });
    sim.out('pred', 'Predicción');
    sim.out('sn', 'La normal actúa a');
    sim.out('st', 'Estado');
    sim.presets([
      { id: 'alta', label: 'Caja alta y angosta (30 cm × 1 m)', v: { b: 0.3, h: 1, mu: 0.6, th: 0 }, note: 'tan θ = 0.3 se alcanza antes que tan θ = 0.6: se vuelca a 16.7°.' },
      { id: 'baja', label: 'Caja baja y ancha (1 m × 30 cm)', v: { b: 1, h: 0.3, mu: 0.4, th: 0 }, note: 'Desliza a 21.8°; volcarse exigiría 73°.' },
      { id: 'lisa', label: 'Caja alta en una superficie resbaladiza', v: { b: 0.3, h: 1, mu: 0.15, th: 0 }, note: 'Con poca fricción, incluso una caja alta desliza antes (8.5°) de volcarse (16.7°).' },
      { id: 'cubo', label: 'Cubo (b = h)', v: { b: 0.6, h: 0.6, mu: 1.1, th: 0 }, note: 'Un cubo se vuelca a 45° si la fricción alcanza para que no deslice (μ<sub>s</sub> > 1).' }
    ]);
    const crit = () => ({ ts: M.deg(Math.atan(sim.p.mu)), tt: M.deg(Math.atan(sim.p.b / sim.p.h)) });
    function check() {
      if (s.phase !== 'reposo') return;
      const c = crit();
      if (s.th + 1e-9 < Math.min(c.ts, c.tt)) return;
      if (c.tt <= c.ts) { s.phase = 'vuelca'; st.show(`Se vuelca a θ = ${f1(c.tt)}°: la vertical del centro de gravedad sale de la base`, 'bad'); }
      else { s.phase = 'desliza'; st.show(`Empieza a deslizar a θ = ${f1(c.ts)}° (tan θ = μ<sub>s</sub>)`, 'bad'); }
    }
    sim.run({
      startLabel: 'Inclinar',
      reset() { s.th = sim.p.th; s.phase = 'reposo'; s.slide = 0; s.v = 0; s.psi = 0; s.w = 0; st.hide(); check(); },
      step(h) {
        const p = sim.p, th = M.rad(s.th);
        if (s.phase === 'reposo') {
          s.th = Math.min(60, s.th + RATE * h);
          check();
          if (s.phase === 'reposo' && s.th >= 60) { st.show('Llegó a 60° sin deslizar ni volcarse', 'good'); sim.end(); }
        } else if (s.phase === 'desliza') {
          const a = G * (Math.sin(th) - 0.8 * p.mu * Math.cos(th));
          s.v += Math.max(0, a) * h;
          s.slide += s.v * h;
          if (s.slide >= S0 - 0.05) { s.slide = S0 - 0.05; sim.end(); }
        } else {
          const rc = 0.5 * Math.hypot(p.b, p.h), I = (p.b * p.b + p.h * p.h) / 3, beta = Math.atan(p.b / p.h);
          s.w += ((G * rc * Math.sin(s.psi + th - beta) + 0.02) / I) * h;
          s.psi += s.w * h;
          if (s.psi >= Math.PI / 2) { s.psi = Math.PI / 2; sim.end(); }
        }
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, c = crit();
      view.update();
      D.clear(cv);
      view.grid({ labels: false });
      const th = M.rad(s.th);
      const u = [Math.cos(th), Math.sin(th)], n = [-Math.sin(th), Math.cos(th)];
      const gy = view.Y(0);
      D.ground(ctx, 0, gy, cv.w, { depth: 12 });
      const tp = [LP * u[0], LP * u[1]];
      D.poly(ctx, [[view.X(0), gy], view.P(tp), [view.X(tp[0]), gy]], { close: true, fill: '--wood', fillAlpha: 0.3, color: '--ink-2', width: 1.3 });
      D.line(ctx, view.X(0), gy, view.X(tp[0]), view.Y(tp[1]), { color: '--wood', width: 6 });
      D.circle(ctx, view.X(0), gy, 4, { fill: '--ink-2' });
      if (s.th > 0.5) D.angle(ctx, view.X(0), gy, 46, 0, th, { label: 'θ' });
      /* caja */
      const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
      const sC = S0 - s.slide;
      const corner = [sC * u[0], sC * u[1]];
      const toW = (lx, ly) => {
        let v = [lx * u[0] + ly * n[0], lx * u[1] + ly * n[1]];
        if (s.phase === 'vuelca') v = rot(v, s.psi);
        return [corner[0] + v[0], corner[1] + v[1]];
      };
      const pts = [toW(0, 0), toW(p.b, 0), toW(p.b, p.h), toW(0, p.h)];
      D.poly(ctx, pts.map((q) => view.P(q)), { close: true, fill: '--body-a', color: '--ink-2', width: 1.4 });
      const cg = toW(p.b / 2, p.h / 2);
      const snv = p.b / 2 - (p.h / 2) * Math.tan(th);
      const inside = s.phase !== 'vuelca' && snv >= -1e-9;
      if (s.phase !== 'vuelca') { const a = view.P(pts[0]), b = view.P(pts[1]); D.line(ctx, a[0], a[1], b[0], b[1], { color: inside ? '--vel' : '--warn-ink', width: 4 }); }
      D.line(ctx, view.X(cg[0]), view.Y(cg[1]), view.X(cg[0]), gy, { color: '--weight', dash: [4, 4], width: 1.3 });
      D.circle(ctx, view.X(cg[0]), view.Y(cg[1]), 4.5, { fill: '--ink', color: '--canvas', width: 1.5 });
      if (p.fz) {
        const Lw = view.L(0.7);
        D.vec(ctx, view.X(cg[0]), view.Y(cg[1]), 0, Lw, { color: '--weight', label: 'w', size: 13 });
        if (s.phase !== 'vuelca') {
          const P = view.P(toW(M.clamp(snv, 0, p.b), 0));
          const N = Math.cos(th), F = s.phase === 'desliza' ? 0.8 * p.mu * Math.cos(th) : Math.sin(th);
          D.vec(ctx, P[0], P[1], n[0] * N * Lw, -n[1] * N * Lw, { color: '--normal', label: 'n', labelSide: -1 });
          if (F > 0.01) D.vec(ctx, P[0], P[1], u[0] * F * Lw, -u[1] * F * Lw, { color: '--fric', label: 'f' });
        }
      }
      /* panel de ángulos críticos: a la derecha (lienzo ancho) o arriba (lienzo alto) */
      const gx = view.X(3.95) + 8, gw = cv.w - gx - 10, freeTop = view.Y(3.9) - 6;
      const marks = [{ a: c.ts, col: '--c1', t: `desliza: ${f1(c.ts)}°` }, { a: c.tt, col: '--c4', t: `vuelca: ${f1(c.tt)}°` }].sort((q, r) => q.a - r.a);
      if (gw <= 130 && freeTop >= 130) {
        const top = 48, hgt = Math.min(92, freeTop - 50), x0 = 26, x1 = cv.w - 30;
        D.panel(ctx, 8, top, cv.w - 16, hgt, { title: 'ÁNGULOS CRÍTICOS' });
        const ya = top + hgt - 24, Xa = (a) => x0 + (Math.min(a, 60) / 60) * (x1 - x0);
        ctx.save(); ctx.fillStyle = MC.alpha('--accent', 0.28); ctx.fillRect(x0, ya - 5, Xa(s.th) - x0, 10); ctx.restore();
        D.line(ctx, x0, ya, x1, ya, { color: '--ink-3', width: 1 });
        for (let a = 0; a <= 60; a += 10) {
          D.line(ctx, Xa(a), ya - 4, Xa(a), ya + 4, { color: '--ink-3', width: 1 });
          MC.text(ctx, a + '°', Xa(a), ya + 15, { size: 10, mono: true, align: 'center', color: '--ink-3' });
        }
        let lastX = -Infinity, lvl2 = false;
        marks.forEach((m) => {
          if (m.a > 60) { MC.text(ctx, m.t + ' (fuera de escala)', x1, top + 15, { size: 10.5, color: m.col, weight: 600, align: 'right' }); return; }
          const x = Xa(m.a);
          D.line(ctx, x, ya - 9, x, ya + 5, { color: m.col, width: 2.5 });
          lvl2 = x - lastX < 96 ? !lvl2 : false;
          MC.text(ctx, m.t, x, ya - (lvl2 ? 26 : 13), { size: 11, color: m.col, align: 'center', weight: 600, halo: true });
          lastX = x;
        });
        D.line(ctx, Xa(s.th), ya - 7, Xa(s.th), ya + 7, { color: '--accent', width: 3 });
      } else if (gw > 130) {
        const top = 48, hgt = cv.h - 58;
        D.panel(ctx, gx, top, gw, hgt, { title: 'ÁNGULOS CRÍTICOS' });
        const y0 = top + hgt - 20, y1 = top + 40, Ya = (a) => y0 - (Math.min(a, 60) / 60) * (y0 - y1);
        const xa = gx + 44;
        ctx.save(); ctx.fillStyle = MC.alpha('--accent', 0.28); ctx.fillRect(xa - 5, Ya(s.th), 10, y0 - Ya(s.th)); ctx.restore();
        D.line(ctx, xa, y0, xa, y1, { color: '--ink-3', width: 1 });
        for (let a = 0; a <= 60; a += 10) {
          D.line(ctx, xa - 4, Ya(a), xa + 4, Ya(a), { color: '--ink-3', width: 1 });
          MC.text(ctx, a + '°', xa - 9, Ya(a), { size: 10, mono: true, align: 'right', baseline: 'middle', color: '--ink-3' });
        }
        let lastY = Infinity;
        marks.forEach((m) => {
          if (m.a > 60) { MC.text(ctx, m.t + ' (fuera de escala)', xa + 14, top + 28, { size: 10.5, color: m.col, weight: 600 }); return; }
          const y = Ya(m.a);
          D.line(ctx, xa - 8, y, xa + 12, y, { color: m.col, width: 2.5 });
          const ly = Math.min(y, lastY - 14);
          MC.text(ctx, m.t, xa + 16, ly, { size: 11, color: m.col, baseline: 'middle', weight: 600 });
          lastY = ly;
        });
        const yp = Ya(s.th);
        D.poly(ctx, [[xa - 17, yp - 5], [xa - 7, yp], [xa - 17, yp + 5]], { close: true, fill: '--accent', color: '--accent' });
      }
      sim.set('ts', `θ = ${f1(c.ts)}°`);
      sim.set('tt', `θ = ${f1(c.tt)}°`);
      sim.set('pred', c.tt < c.ts ? 'se vuelca antes de deslizar' : 'desliza antes de volcarse');
      sim.set('sn', s.phase === 'reposo' ? `${f1(Math.max(0, snv) * 100)} cm del borde inferior (el centro de la base está a ${f1(p.b * 50)} cm)` : '—');
      sim.set('st', s.phase === 'reposo' ? `en reposo, θ = ${f1(s.th)}°` : s.phase === 'desliza' ? `desliza (θ = ${f1(s.th)}°)` : s.psi >= Math.PI / 2 - 1e-6 ? 'volcada' : 'volcándose');
    });
  });

  /* ======================================================================
     13.5  Ensayo de tracción: curva esfuerzo–deformación
     ====================================================================== */
  const MATS = {
    acero: { label: 'Acero estructural', Y: 200e3, sy: 250, su: 400, eu: 0.15, ef: 0.25 },
    aluminio: { label: 'Aluminio 6061', Y: 70e3, sy: 275, su: 310, eu: 0.08, ef: 0.12 },
    cobre: { label: 'Cobre recocido', Y: 110e3, sy: 70, su: 220, eu: 0.30, ef: 0.45 },
    hueso: { label: 'Hueso cortical', Y: 17e3, sy: 110, su: 130, eu: 0.02, ef: 0.03 },
    nylon: { label: 'Nailon', Y: 3e3, sy: 45, su: 75, eu: 0.25, ef: 0.5 },
    vidrio: { label: 'Vidrio (frágil)', Y: 70e3, brittle: true, su: 50 },
    caucho: { label: 'Caucho (elástico, no lineal)', rubber: true, E: 3, Jm: 70, ef: 5.5 }
  };
  /* Caucho: modelo de Gent (esfuerzo nominal en MPa) */
  const gent = (m, e) => { const l = 1 + e, I1 = l * l + 2 / l; return ((m.E / 3) * (l - 1 / (l * l)) * m.Jm) / (m.Jm - (I1 - 3)); };
  MATS.caucho.su = gent(MATS.caucho, MATS.caucho.ef);
  const curve = (m, e) => {
    if (m.rubber) return gent(m, e);
    if (m.brittle) return m.Y * e;
    const ey = m.sy / m.Y;
    if (e <= ey) return m.Y * e;
    if (e <= m.eu) { const t = (e - ey) / (m.eu - ey); return m.sy + (m.su - m.sy) * (1 - (1 - t) * (1 - t)); }
    const t = Math.min(1, (e - m.eu) / (m.ef - m.eu));
    return m.su * (1 - 0.2 * t * t);
  };
  const eBreak = (m) => (m.brittle ? m.su / m.Y : m.ef);
  const eUlt = (m) => (m.rubber ? m.ef : m.brittle ? m.su / m.Y : m.eu);

  MC.defineSim('elasticidad', function (sim) {
    const cv = sim.canvas({ aspect: 3, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 1.5 });
    const s = { smax: 0, emax: 0, perm: 0, broken: false };
    const hov = { plot: null, hx: null };
    MC.hover(sim, gc, [hov]);
    const st = sim.status(cv);
    let SP = null;
    const fF = (v) => (v >= 1000 ? MC.fix(v, 0) : v >= 100 ? MC.fix(v, 1) : MC.fix(v, 2));
    sim.group('Probeta');
    sim.select('mat', { label: 'Material', value: 'acero', options: Object.keys(MATS).map((k) => [k, MATS[k].label]) });
    sim.slider('d', { label: 'Diámetro del alambre', min: 0.2, max: 12, step: 0.05, value: 1, unit: 'mm', fmt: f2, log: true });
    sim.slider('L0', { label: 'Longitud inicial <i>L</i>₀', min: 0.1, max: 30, step: 0.01, value: 2, unit: 'm', fmt: f2, log: true });
    sim.group('Carga (súbala y bájela)');
    sim.slider('F', { label: 'Fuerza de tensión <i>F</i>', min: 0, max: 400, step: 0.01, value: 150, unit: 'N', fmt: fF });
    sim.button('Nueva probeta', () => { fresh(); sim.ctl.F.set(0); });
    sim.seg('zoom', { label: 'Gráfica', options: [['todo', 'Curva completa'], ['elast', 'Zona elástica ampliada']], value: 'todo' });
    sim.out('Y', 'Módulo de Young <i>Y</i>');
    sim.out('A', 'Área transversal <i>A</i>');
    sim.out('sg', 'Esfuerzo σ = <i>F</i>/<i>A</i>', { hl: true });
    sim.out('ep', 'Deformación ε = Δ<i>L</i>/<i>L</i>₀', { hl: true });
    sim.out('dL', 'Alargamiento Δ<i>L</i>');
    sim.out('st', 'Estado');
    sim.out('pm', 'Alargamiento permanente');
    sim.presets([
      { id: 'acero', label: 'Alambre de acero de 1 mm con 150 N', v: { mat: 'acero', d: 1, L0: 2, F: 150, zoom: 'todo' } },
      { id: 'cobre', label: 'Alambre de cobre de 1 mm con 5 kg (49 N)', v: { mat: 'cobre', d: 1, L0: 2, F: 49, zoom: 'elast' }, note: 'σ = 62 MPa, todavía elástico: ΔL = 1.1 mm.' },
      { id: 'ascensor', label: 'Cable de ascensor: acero de 1 cm, 20 m, 800 kg', v: { mat: 'acero', d: 10, L0: 20, F: 7840, zoom: 'elast' }, note: 'σ = 100 MPa y ΔL = 1.0 cm: usa la cuarta parte de la resistencia del acero.' },
      { id: 'vidrio', label: 'Fibra de vidrio de 0.5 mm', v: { mat: 'vidrio', d: 0.5, L0: 0.5, F: 5, zoom: 'todo' }, note: 'Frágil: se rompe sin deformación plástica apreciable.' },
      { id: 'caucho', label: 'Banda de caucho de 5 mm', v: { mat: 'caucho', d: 5, L0: 0.2, F: 20, zoom: 'todo' }, note: 'Elástico pero no lineal: se estira varias veces su longitud.' }
    ]);
    const mat = () => MATS[sim.p.mat];
    const A = () => Math.PI * Math.pow(sim.p.d / 2000, 2);
    const Fu = () => mat().su * 1e6 * A();
    const fresh = () => { s.smax = 0; s.emax = 0; s.perm = 0; s.broken = false; st.hide(); };
    const refresh = () => {
      const m = mat();
      sim.ctl.F.range(0, Fu() * 1.08, Fu() > 2000 ? 1 : 0.01);
      sim.ctl.zoom.show(!m.brittle && !m.rubber);
    };
    sim.onChange = (id) => {
      if (id === 'mat' || id === 'd' || id === 'preset') {
        fresh();
        refresh();
        if (id !== 'preset') sim.ctl.F.set(+(Fu() * 0.3).toPrecision(3), true);
      }
    };
    refresh();
    const strainOn = (m, sg) => M.bisect((e) => curve(m, e) - sg, 0, eUlt(m), 1e-12);
    const state = () => {
      const m = mat(), sg = sim.p.F / A() / 1e6;
      if (s.broken) return { sg: 0, e: s.perm };
      if (sg >= m.su * (1 - 1e-9)) {
        s.broken = true;
        s.perm = m.rubber || m.brittle ? 0 : m.ef - curve(m, m.ef) / m.Y;
        st.show('¡Se rompió! Pulse «Nueva probeta» para repetir el ensayo.', 'bad');
        return { sg: 0, e: s.perm };
      }
      if (m.rubber) return { sg, e: sg > 0 ? strainOn(m, sg) : 0 };
      if (sg > s.smax) { const e = sg <= m.sy ? sg / m.Y : strainOn(m, sg); s.smax = sg; s.emax = e; s.perm = e - sg / m.Y > 1e-9 ? e - sg / m.Y : 0; }
      return { sg, e: s.perm + sg / m.Y };
    };
    sim.onDraw(() => {
      const p = sim.p, m = mat(), q = state();
      const dL = q.e * p.L0;
      /* ---- probeta: alambre horizontal sujeto a la izquierda; la carga cuelga de una polea ---- */
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      D.clear(cv);
      const x0 = 24, wy = Math.round(Math.min(46, H * 0.24)), rp = 14, xq = W - 62;
      const pxm = (xq - 50 - x0) / (p.L0 * (1 + eBreak(m)));
      const xm0 = x0 + p.L0 * pxm;
      const wpx = M.clamp(p.d * 0.8, 1.6, 8);
      const wcol = m.rubber ? '--c3' : m.brittle ? '--c7' : '--metal';
      D.wall(ctx, x0, wy - 24, wy + 24, 'left');
      D.line(ctx, xq, wy + rp, xq - 16, wy + rp + 20, { color: '--ink-3', width: 3 });
      ctx.save(); ctx.fillStyle = MC.col('--ink-3'); ctx.fillRect(xq - 30, wy + rp + 18, 20, 9); ctx.restore();
      if (!s.broken) {
        const xm = x0 + (p.L0 + dL) * pxm;
        D.line(ctx, x0, wy, xq, wy, { color: wcol, width: wpx / Math.sqrt(1 + Math.max(0, q.e)) });
        const hx = xq + rp, hy = wy + rp + 34 + Math.min(dL * pxm, Math.max(0, H - wy - rp - 76));
        D.line(ctx, hx, wy + rp, hx, hy, { color: wcol, width: 1.6 });
        D.block(ctx, hx, hy + 12, 46, 24, { fill: '--c6', label: fF(p.F) + ' N', size: 10 });
        D.line(ctx, xm, wy - 10, xm, wy + 10, { color: '--c1', width: 2.6 });
      } else {
        const xb = x0 + p.L0 * (1 + s.perm) * pxm * 0.55;
        D.line(ctx, x0, wy, xb, wy, { color: wcol, width: wpx });
        D.poly(ctx, [[xb, wy - 4], [xb + 4, wy - 1], [xb, wy + 1], [xb + 4, wy + 4]], { color: wcol, width: 1.4 });
        D.ground(ctx, xq - 30, H - 5, W, { depth: 5 });
        D.block(ctx, xq + rp, H - 18, 44, 24, { fill: '--c6', label: fF(p.F) + ' N', size: 10 });
      }
      D.pulley(ctx, xq, wy + rp, rp, {});
      D.line(ctx, xm0, wy - 15, xm0, wy + 15, { color: '--accent', dash: [3, 3], width: 1.3 });
      D.dim(ctx, x0, wy + 22, xm0, wy + 22, `L₀ = ${f2(p.L0)} m`, { size: 11 });
      /* lupa: regla fija junto a la marca original; el índice azul muestra ΔL */
      const lx = x0 + 4, lw = xq - 40 - lx, ly = wy + 46, lh = H - ly - 8;
      if (lw > 170 && lh > 46) {
        D.panel(ctx, lx, ly, lw, lh, { title: 'LUPA: ALARGAMIENTO ΔL' });
        const dLm = s.broken ? 0 : Math.max(0, dL);
        const R = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200].find((r) => dLm <= 0.85 * r) || 200;
        const [uf, un] = R <= 0.05 ? [1000, 'mm'] : R <= 0.5 ? [100, 'cm'] : [1, 'm'];
        const rx0 = lx + 22, rx1 = lx + lw - 34, ry = ly + lh - 20;
        const Xr = (v) => rx0 + (v / R) * (rx1 - rx0);
        D.line(ctx, rx0, ry, rx1, ry, { color: '--ink-2', width: 1.2 });
        for (let k = 0; k <= 10; k++) {
          const v = (R * k) / 10, big = k % 5 === 0;
          D.line(ctx, Xr(v), ry, Xr(v), ry - (big ? 10 : 5), { color: '--ink-2', width: 1 });
          if (big) MC.text(ctx, MC.fix(v * uf, R * uf >= 10 ? 0 : 1) + (k === 10 ? ' ' + un : ''), Xr(v), ry + 13, { size: 10, mono: true, align: k === 10 ? 'left' : 'center', color: '--ink-2' });
        }
        const xpnt = Xr(Math.min(dLm, R));
        D.poly(ctx, [[xpnt, ry - 2], [xpnt - 5, ry - 13], [xpnt + 5, ry - 13]], { close: true, fill: '--c1', color: '--c1' });
        MC.text(ctx, `ΔL = ${MC.si(dLm, 'm', 3)}`, Math.min(xpnt + 8, rx1 - 60), ry - 16, { size: 11, color: '--c1', weight: 600, halo: true });
        D.line(ctx, xm0, wy + 34, xm0, ly, { color: '--ink-3', dash: [3, 3], width: 1 });
      }
      /* ---- gráfica σ–ε ---- */
      const gctx = gc.ctx;
      D.clear(gc);
      const ductile = !m.rubber && !m.brittle;
      const zoom = p.zoom === 'elast' && ductile;
      const ey = ductile ? m.sy / m.Y : eBreak(m);
      const xmx = (zoom ? 3 * ey : eBreak(m) * 1.06) * 100;
      const smx = MC.niceCeil(m.su * 1.12);
      const P = SP || (SP = new MC.Plot(gctx));
      P.ctx = gctx;
      P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xmin: 0, xmax: xmx, ymin: 0, ymax: smx, xlabel: ['ε', '%'], ylabel: ['σ', 'MPa'], mb: 38, mt: 14, ml: 54, mr: 16 });
      P.frame();
      const X = (e) => e * 100;
      if (ductile) {
        P.band(0, X(ey), { color: '--vel', alpha: 0.08 });
        P.band(X(ey), X(m.eu), { color: '--c4', alpha: 0.07 });
        P.band(X(m.eu), X(m.ef), { color: '--weight', alpha: 0.07 });
        const lab = (e, t) => { if (X(e) < xmx * 0.96) P.label(X(e), smx * 0.95, t, { align: 'center', size: 10.5, color: '--ink-3' }); };
        if (P.X(X(ey)) - P.X(0) > 56) lab(ey / 2, 'elástica');
        lab((ey + Math.min(m.eu, xmx / 100)) / 2, 'plástica');
        lab((m.eu + m.ef) / 2, 'cuello');
      }
      P.fn((x) => curve(m, x / 100), { color: '--ink-3', width: 1.5, dash: [5, 4], from: 0, to: X(eBreak(m)), n: 400 });
      if (ductile) {
        P.dot(X(ey), m.sy, { color: '--vel', r: 4, label: 'límite elástico', dx: 8, dy: 14 });
        P.dot(X(m.eu), m.su, { color: '--c4', r: 4, label: 'resistencia última', dy: -9 });
        P.dot(X(m.ef), curve(m, m.ef), { color: '--weight', r: 4, label: 'ruptura', dy: -9 });
        if (zoom) P.label(X(ey * 0.45), m.sy * 0.45, 'pendiente = Y', { dx: 10, size: 11, color: '--ink-2' });
      } else {
        P.dot(X(eBreak(m)), m.su, { color: '--weight', r: 4, label: 'ruptura', dy: -9 });
        if (m.rubber) P.line(0, 0, m.E / 100, { color: '--ink-3', width: 1.2, dash: [2, 3], to: X(1.2) });
      }
      /* recorrido del ensayo */
      if (ductile && s.smax > m.sy) {
        P.fn((x) => curve(m, x / 100), { color: '--c1', width: 2.6, from: 0, to: X(s.emax), n: 300 });
        P.xy([X(s.perm), X(s.emax)], [0, s.smax], { color: '--c1', width: 1.6, dash: [4, 3] });
      } else if (!s.broken && q.e > 0) P.fn((x) => curve(m, x / 100), { color: '--c1', width: 2.6, from: 0, to: X(q.e), n: 300 });
      if (!s.broken) P.dot(X(q.e), q.sg, { color: '--c1', r: 6 });
      hov.plot = P;
      if (hov.hx !== null && hov.hx <= X(eBreak(m))) P.crosshair(hov.hx, [{ label: 'σ', unit: 'MPa', color: '--ink-2', y: curve(m, hov.hx / 100), fmt: (v) => MC.sci(v, 3) }], { label: 'ε', unit: '%', fmt: (v) => MC.sci(v, 3) });
      /* lecturas */
      sim.set('Y', m.rubber ? '≈ 3 MPa (pendiente inicial)' : `${f0(m.Y / 1000)} GPa`);
      sim.set('A', `${MC.sci(A() * 1e6, 3)} mm²`);
      sim.set('sg', `${MC.sci(q.sg, 3)} MPa`);
      sim.set('ep', `${MC.sci(q.e, 3)} = ${MC.sci(q.e * 100, 3)} %`);
      sim.set('dL', MC.si(dL, 'm', 3));
      const plastic = ductile && s.smax > m.sy;
      sim.set('st', s.broken ? '<span class="warnv">roto</span>' : m.rubber ? 'elástico, no lineal' : plastic ? (q.sg < s.smax - 1e-9 ? 'descargado: queda deformación permanente' : 'plástico (más allá de la fluencia)') : '<span class="goodv">elástico (ley de Hooke)</span>');
      sim.set('pm', MC.si(s.perm * p.L0, 'm', 3));
    });
  });
})();
