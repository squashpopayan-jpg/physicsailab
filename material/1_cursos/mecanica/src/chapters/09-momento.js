/* Capítulo 9 — Cantidad de movimiento y colisiones */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw;
  const f1 = (v) => MC.fix(v, 1), f2 = (v) => MC.fix(v, 2), f0 = (v) => MC.fix(v, 0), f3 = (v) => MC.fix(v, 3);
  const G = 9.8;

  /* ======================================================================
     9.1  Impulso: un huevo que cae sobre distintas superficies
     ====================================================================== */
  const SURFS = {
    concreto: { label: 'Concreto', k: 2e5, e: 0.3, col: '--metal' },
    madera: { label: 'Piso de madera', k: 4e4, e: 0.35, col: '--wood' },
    cesped: { label: 'Césped', k: 3000, e: 0.2, col: '--body-d' },
    cojin: { label: 'Cojín', k: 400, e: 0.15, col: '--body-e' },
    colchon: { label: 'Colchón', k: 120, e: 0.1, col: '--body-b' }
  };
  MC.defineSim('impulso', function (sim) {
    sim.cols2('1fr 1.5fr');
    const cv = sim.canvas({ aspect: 0.7 });
    const gc = sim.canvas({ aspect: 1.05 });
    const s = { phase: 'fall', y: 1, v: 0, tau: 0, rec: null, broken: false, vout: 0, apex: 0 };
    const curves = [];
    const st = sim.status(cv);
    let FP = null;
    sim.group('Superficie');
    sim.select('sf', { label: 'Superficie de impacto', value: 'concreto', options: Object.keys(SURFS).map((k) => [k, SURFS[k].label]), reset: true });
    sim.group('Huevo');
    sim.slider('m', { label: 'Masa <i>m</i>', min: 0.03, max: 0.3, step: 0.005, value: 0.06, unit: 'kg', fmt: (v) => MC.fix(v, 3), reset: true });
    sim.slider('h', { label: 'Altura de caída <i>h</i>', min: 0.1, max: 3, step: 0.05, value: 1, unit: 'm', fmt: f2, reset: true });
    sim.slider('Fb', { label: 'Fuerza que rompe el cascarón', min: 5, max: 100, step: 1, value: 25, unit: 'N', fmt: f0 });
    sim.button('Borrar curvas', () => { curves.length = 0; });
    sim.out('vi', 'Rapidez de impacto √(2<i>gh</i>)');
    sim.out('dt', 'Duración del contacto Δ<i>t</i>');
    sim.out('J', 'Impulso <i>J</i> = Δ<i>p</i>', { hl: true });
    sim.out('Fm', 'Fuerza máxima', { hl: true });
    sim.out('Fa', 'Fuerza media <i>J</i>/Δ<i>t</i>');
    sim.out('res', 'Resultado');
    sim.presets([
      { id: 'concreto', label: 'Huevo sobre concreto (1 m)', v: { sf: 'concreto', m: 0.06, h: 1 } },
      { id: 'cesped', label: 'Huevo sobre césped (1 m)', v: { sf: 'cesped', m: 0.06, h: 1 } },
      { id: 'cojin', label: 'Huevo sobre un cojín (1 m)', v: { sf: 'cojin', m: 0.06, h: 1 }, note: 'El cojín alarga el contacto unas veinte veces: la fuerza máxima cae por debajo de la que rompe el cascarón.' },
      { id: 'colchon', label: 'Huevo sobre un colchón desde 2 m', v: { sf: 'colchon', m: 0.06, h: 2 } }
    ]);
    const S = () => SURFS[sim.p.sf];
    /* integra el contacto con pasos finos y guarda F(t) */
    function contact(vin) {
      const { k, e } = S(), m = sim.p.m;
      const le = Math.log(e), zeta = -le / Math.sqrt(Math.PI * Math.PI + le * le);
      const c = 2 * zeta * Math.sqrt(k * m);
      const T0 = Math.PI * Math.sqrt(m / k);
      const dt = T0 / 3000;
      let d = 0, dv = vin, t = 0, Fmax = 0;
      const T = [0], F = [0], Dd = [0];
      for (let i = 0; i < 40000; i++) {
        const f = (tt, y) => { const Fc = Math.max(0, k * y[0] + c * y[1]); return [y[1], G - Fc / m]; };
        const y = M.rk4(f, [d, dv], t, dt);
        d = y[0]; dv = y[1]; t += dt;
        const Fc = Math.max(0, k * d + c * dv);
        T.push(t); F.push(Fc); Dd.push(d);
        Fmax = Math.max(Fmax, Fc);
        if ((Fc <= 0 && t > T0 * 0.2) || d < 0) break;
      }
      return { T, F, Dd, Fmax, dur: t, vout: Math.max(0, -dv) };
    }
    sim.run({
      reset() {
        s.phase = 'fall'; s.y = sim.p.h; s.v = 0; s.tau = 0; s.rec = null; s.broken = false; s.vout = 0; st.hide();
      },
      step(h) {
        if (s.phase === 'fall') {
          s.v -= G * h; s.y += s.v * h;
          if (s.y <= 0) {
            s.y = 0;
            s.rec = contact(-s.v);
            s.broken = s.rec.Fmax > sim.p.Fb;
            curves.push({ T: s.rec.T, F: s.rec.F, col: S().col, label: S().label });
            while (curves.length > 5) curves.shift();
            s.phase = 'contact'; s.tau = 0;
          }
        } else if (s.phase === 'contact') {
          s.tau += (h * s.rec.dur) / 1.2;
          if (s.tau >= s.rec.dur) {
            if (s.broken) { st.show('¡Se rompió el huevo!', 'bad'); sim.end(); return; }
            s.phase = 'rise'; s.v = s.rec.vout; s.y = 0;
            st.show('Sobrevivió al impacto', 'good');
          }
        } else if (s.phase === 'rise') {
          s.v -= G * h; s.y += s.v * h;
          if (s.v <= 0) { s.apex = s.y; sim.end(); }
        }
      },
      h: 1 / 600
    });
    sim.onDraw(() => {
      const p = sim.p, sf = S();
      const ctx = cv.ctx;
      D.clear(cv);
      const view = new MC.View2D(cv, { xmin: -0.6, xmax: 0.6, ymin: -0.25, ymax: Math.max(1.2, p.h * 1.1), align: 'bottom', padB: 4, padT: 10 });
      view.grid({ labels: 'y', unit: 'm' });
      /* superficie */
      let dnow = 0;
      if (s.phase === 'contact' && s.rec) dnow = M.interp(s.rec.T, s.rec.Dd, s.tau);
      const sy = view.Y(0);
      const dep = Math.min(dnow, 0.2);
      ctx.save();
      ctx.fillStyle = MC.col(sf.col);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(view.X(-0.08), sy);
      ctx.quadraticCurveTo(view.X(0), sy + view.L(dep) * 2, view.X(0.08), sy);
      ctx.lineTo(cv.w, sy); ctx.lineTo(cv.w, cv.h); ctx.lineTo(0, cv.h); ctx.closePath();
      ctx.fill();
      ctx.restore();
      MC.text(ctx, sf.label, cv.w - 8, sy + 18, { size: 12, align: 'right', weight: 600, color: '--body-ink' });
      /* huevo */
      const ey = s.phase === 'contact' ? -dnow : s.y;
      const rx = view.L(0.045), ry = view.L(0.06);
      const squash = s.phase === 'contact' ? Math.min(0.25, dnow * 4) : 0;
      ctx.save();
      if (s.broken && (s.phase !== 'fall') && (sim.ended || s.tau > s.rec.dur * 0.5)) {
        ctx.fillStyle = '#f5f0e1';
        ctx.beginPath(); ctx.ellipse(view.X(0), sy - 4, rx * 2.2, ry * 0.35, 0, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = '#F2B84B';
        ctx.beginPath(); ctx.arc(view.X(0.01), sy - 6, rx * 0.8, 0, 2 * Math.PI); ctx.fill();
      } else {
        ctx.fillStyle = '#f5f0e1';
        ctx.strokeStyle = MC.col('--ink-3');
        ctx.beginPath();
        ctx.ellipse(view.X(0), view.Y(ey) - ry * (1 - squash), rx * (1 + squash), ry * (1 - squash), 0, 0, 2 * Math.PI);
        ctx.fill(); ctx.stroke();
      }
      ctx.restore();
      if (s.phase === 'contact') MC.text(ctx, `cámara lenta ×${f0(1.2 / s.rec.dur)}`, 10, 22, { size: 12, weight: 600, color: '--accent' });
      /* gráfica F(t) */
      const gctx = gc.ctx;
      D.clear(gc);
      const P = FP || (FP = new MC.Plot(gctx));
      P.ctx = gctx;
      const tmax = MC.niceCeil(Math.max(5e-3, ...curves.map((c) => c.T[c.T.length - 1])) * 1000 * 1.05);
      const fmax = MC.niceCeil(Math.max(p.Fb * 1.5, ...curves.map((c) => Math.max(...c.F))) * 1.08);
      P.set({ x: 0, y: 0, w: gc.w, h: gc.h, xmin: 0, xmax: tmax, ymin: 0, ymax: fmax, xlabel: ['t', 'ms'], ylabel: ['F', 'N'], mb: 34, mt: 12, xlog: false });
      P.frame();
      P.hline(p.Fb, { color: '--weight', dash: [6, 4], label: 'rompe el cascarón', labelRight: true });
      curves.forEach((c, i) => {
        const last = i === curves.length - 1;
        const tt = c.T.map((t) => t * 1000);
        let upto = tt.length;
        if (last && s.phase === 'contact') upto = Math.max(2, M.bsearch(c.T, s.tau) + 1);
        P.xy(tt.slice(0, upto), c.F.slice(0, upto), { color: c.col, width: last ? 2.6 : 1.6, fill: last ? c.col : null, fillAlpha: 0.15, alpha: last ? 1 : 0.8 });
        const im = c.F.indexOf(Math.max(...c.F));
        if (!last || s.phase !== 'contact') P.label(tt[im], c.F[im], c.label, { dy: -6, align: 'center', size: 11, color: c.col });
      });
      if (s.rec) {
        const J = p.m * (Math.sqrt(2 * G * p.h) + s.rec.vout);
        sim.set('dt', `${MC.sci(s.rec.dur * 1000, 3)} ms`);
        sim.set('J', `${f3(J)} N·s`);
        sim.set('Fm', `${f1(s.rec.Fmax)} N`);
        sim.set('Fa', `${f1(J / s.rec.dur)} N`);
        sim.set('res', s.broken ? '<span class="warnv">se rompe</span>' : '<span class="goodv">no se rompe</span>');
      } else { ['dt', 'J', 'Fm', 'Fa', 'res'].forEach((k) => sim.set(k, '—')); }
      sim.set('vi', `${f2(Math.sqrt(2 * G * p.h))} m/s`);
    });
  });

  /* ======================================================================
     9.3  Choques en una dimensión (riel de aire)
     ====================================================================== */
  MC.defineSim('colision-1d', function (sim) {
    const cv = sim.canvas({ aspect: 3.6, cls: 'fixed' });
    const gc = sim.canvas({ aspect: 2.9 });
    const view = new MC.View2D(cv, { xmin: -0.1, xmax: 4.1, ymin: -0.35, ymax: 0.55 });
    const H = new MC.History(['x1', 'x2', 'p1', 'p2', 'P', 'K']);
    const gx = new MC.TGraph({ ylabel: ['x', 'm'], series: [{ key: 'x1', label: '1', unit: 'm', color: '--c1', fmt: f2 }, { key: 'x2', label: '2', unit: 'm', color: '--c4', fmt: f2 }], legend: false, tspan: 4, ymin: 0, ymax: 4 });
    const gp = new MC.TGraph({ ylabel: ['p', 'kg·m/s'], series: [{ key: 'p1', label: 'p₁', unit: 'kg·m/s', color: '--c1', fmt: f2 }, { key: 'p2', label: 'p₂', unit: 'kg·m/s', color: '--c4', fmt: f2 }, { key: 'P', label: 'total', unit: 'kg·m/s', color: '--mom', fmt: f2, width: 3 }], legend: 'tr', tspan: 4 });
    const gk = new MC.TGraph({ ylabel: ['K', 'J'], series: [{ key: 'K', label: 'K total', unit: 'J', color: '--K', fmt: f2 }], legend: false, tspan: 4 });
    MC.hover(sim, gc, [gx, gp, gk]);
    const W = 0.3;
    const s = { x1: 1, x2: 2.5, v1: 0, v2: 0, hit: false, before: null, after: null };
    sim.group('Tipo');
    sim.seg('mode', { options: [['choque', 'Choque'], ['explosion', 'Explosión']], value: 'choque', reset: true });
    sim.group('Carros');
    sim.slider('m1', { label: 'Masa <i>m</i>₁ (azul)', min: 0.1, max: 5, step: 0.05, value: 1, unit: 'kg', fmt: f2, reset: true });
    sim.slider('m2', { label: 'Masa <i>m</i>₂ (naranja)', min: 0.1, max: 5, step: 0.05, value: 1, unit: 'kg', fmt: f2, reset: true });
    sim.slider('v1', { label: 'Velocidad inicial <i>v</i>₁', min: -2, max: 3, step: 0.05, value: 1, unit: 'm/s', fmt: f2, reset: true });
    sim.slider('v2', { label: 'Velocidad inicial <i>v</i>₂', min: -3, max: 2, step: 0.05, value: 0, unit: 'm/s', fmt: f2, reset: true });
    sim.slider('e', { label: 'Coeficiente de restitución <i>e</i>', min: 0, max: 1, step: 0.01, value: 1, fmt: f2, reset: true });
    sim.slider('Es', { label: 'Energía del resorte (explosión)', min: 0.1, max: 10, step: 0.1, value: 3, unit: 'J', fmt: f1, reset: true });
    sim.check('cm', { label: 'Ver desde el marco del centro de masa', value: false });
    sim.out('pb', 'Momento total antes → después', { hl: true });
    sim.out('kb', 'Energía cinética antes → después', { hl: true });
    sim.out('va', 'Velocidades después (<i>v</i>₁′, <i>v</i>₂′)');
    sim.out('dk', 'Energía disipada');
    sim.out('vcm', 'Velocidad del centro de masa');
    sim.presets([
      { id: 'iguales', label: 'Masas iguales, choque elástico', v: { mode: 'choque', m1: 1, m2: 1, v1: 1, v2: 0, e: 1 }, note: 'Intercambian velocidades: el carro que llega se detiene.' },
      { id: 'boliche', label: 'Bola pesada contra pino liviano', v: { mode: 'choque', m1: 5, m2: 1, v1: 1.5, v2: 0, e: 0.9 } },
      { id: 'pared', label: 'Carro liviano contra uno muy pesado', v: { mode: 'choque', m1: 0.3, m2: 5, v1: 1.5, v2: 0, e: 1 }, note: 'El liviano rebota casi con la misma rapidez.' },
      { id: 'velcro', label: 'Choque perfectamente inelástico (velcro)', v: { mode: 'choque', m1: 1, m2: 1, v1: 1.2, v2: 0, e: 0 }, note: 'Quedan unidos: se pierde la mitad de la energía cinética.' },
      { id: 'autos', label: 'Autos que quedan enganchados (escala 1:1000)', v: { mode: 'choque', m1: 1.2, m2: 0.8, v1: 2.0, v2: 1.0, e: 0 }, note: 'Masas en toneladas → kg y velocidades divididas entre 10: 16 m/s → 1.6 m/s.' },
      { id: 'explosion', label: 'Explosión: dos carros separados por un resorte', v: { mode: 'explosion', m1: 1, m2: 2, Es: 3 } }
    ]);
    const vis = () => { const ex = sim.p.mode === 'explosion'; ['v1', 'v2', 'e'].forEach((k) => sim.ctl[k].show(!ex)); sim.ctl.Es.show(ex); };
    sim.onChange = () => vis();
    vis();
    const snap = () => { const p = sim.p; return { P: p.m1 * s.v1 + p.m2 * s.v2, K: 0.5 * p.m1 * s.v1 * s.v1 + 0.5 * p.m2 * s.v2 * s.v2 }; };
    const push = (t, f) => { const p = sim.p; H.push(t, { x1: s.x1, x2: s.x2, p1: p.m1 * s.v1, p2: p.m2 * s.v2, P: p.m1 * s.v1 + p.m2 * s.v2, K: 0.5 * p.m1 * s.v1 * s.v1 + 0.5 * p.m2 * s.v2 * s.v2 }, f); };
    sim.run({
      reset() {
        const p = sim.p;
        vis();
        s.hit = false; s.after = null;
        if (p.mode === 'choque') { s.x1 = 1.0; s.x2 = 2.6; s.v1 = p.v1; s.v2 = p.v2; s.before = snap(); }
        else {
          s.x1 = 2.0 - W; s.x2 = 2.0; s.v1 = 0; s.v2 = 0; s.before = snap();
          s.v1 = -Math.sqrt((2 * p.Es * p.m2) / (p.m1 * (p.m1 + p.m2)));
          s.v2 = Math.sqrt((2 * p.Es * p.m1) / (p.m2 * (p.m1 + p.m2)));
          s.hit = true; s.after = snap();
        }
        H.clear(); push(0, true);
      },
      step(h) {
        const p = sim.p;
        s.x1 += s.v1 * h; s.x2 += s.v2 * h;
        if (!s.hit && s.x2 - s.x1 <= W && s.v1 > s.v2) {
          const u1 = s.v1, u2 = s.v2, Mt = p.m1 + p.m2;
          s.v1 = (p.m1 * u1 + p.m2 * u2 - p.m2 * p.e * (u1 - u2)) / Mt;
          s.v2 = (p.m1 * u1 + p.m2 * u2 + p.m1 * p.e * (u1 - u2)) / Mt;
          s.hit = true; s.after = snap();
          push(sim.t + h, true);
        } else push(sim.t + h);
        if (s.x1 < -0.3 || s.x2 > 4.3 || s.x1 > 4.3 || s.x2 < -0.3 || sim.t > 12) sim.end();
      },
      h: 1 / 1000
    });
    sim.onDraw(() => {
      const p = sim.p;
      view.update();
      const ctx = cv.ctx;
      D.clear(cv);
      const Mt = p.m1 + p.m2;
      const xcm = (p.m1 * (s.x1 + W / 2) + p.m2 * (s.x2 + W / 2)) / Mt, vcm = (p.m1 * s.v1 + p.m2 * s.v2) / Mt;
      const off = p.cm ? 2.0 - xcm : 0;
      /* riel */
      ctx.fillStyle = MC.col('--metal');
      ctx.fillRect(view.X(-0.1), view.Y(0), view.X(4.1) - view.X(-0.1), 8);
      for (let x = 0; x <= 4.0001; x += 0.5) { D.line(ctx, view.X(x), view.Y(0) + 8, view.X(x), view.Y(0) + 14, { color: '--ink-3', width: 1 }); MC.text(ctx, MC.fix(x - (p.cm ? 2 : 0), 1), view.X(x), view.Y(0) + 26, { size: 10, align: 'center', mono: true, color: '--ink-3' }); }
      const cart = (x, m, col, v, lab) => {
        const X = view.X(x + off + W / 2), hgt = view.L(0.1 + 0.05 * Math.cbrt(m));
        D.block(ctx, X, view.Y(0) - hgt / 2 - 1, view.L(W), hgt, { fill: col, label: lab });
        const vv = p.cm ? v - vcm : v;
        if (Math.abs(vv) > 0.01) D.vec(ctx, X, view.Y(0) - hgt - 10, vv * view.L(0.18), 0, { color: '--vel', label: 'v', size: 12 });
      };
      cart(s.x1, p.m1, '--c1', s.v1, `${f2(p.m1)} kg`);
      cart(s.x2, p.m2, '--c4', s.v2, `${f2(p.m2)} kg`);
      if (!p.cm) { D.line(ctx, view.X(xcm), view.Y(0.46), view.X(xcm), view.Y(0.02), { color: '--mom', dash: [3, 3], width: 1.2 }); MC.text(ctx, 'CM', view.X(xcm), view.Y(0.46) - 4, { size: 11, align: 'center', color: '--mom', weight: 600 }); }
      else MC.text(ctx, 'marco del centro de masa: el CM está quieto en el centro', 8, 16, { size: 11.5, color: '--mom' });
      /* gráficas */
      const gctx = gc.ctx;
      D.clear(gc);
      const w3 = gc.w / 3;
      gx.draw(gctx, { x: 0, y: 0, w: w3, h: gc.h, mb: 34 }, H, { t: sim.t });
      gp.draw(gctx, { x: w3, y: 0, w: w3, h: gc.h, mb: 34 }, H, { t: sim.t });
      gk.draw(gctx, { x: 2 * w3, y: 0, w: w3, h: gc.h, mb: 34 }, H, { t: sim.t });
      const b = s.before, a = s.after;
      sim.set('pb', `${f3(b.P)} → ${a ? f3(a.P) : '…'} kg·m/s`);
      sim.set('kb', `${f3(b.K)} → ${a ? f3(a.K) : '…'} J`);
      sim.set('va', a ? `${f3(s.v1)} y ${f3(s.v2)} m/s` : '—');
      sim.set('dk', a ? `${f3(b.K - a.K)} J` : '—');
      sim.set('vcm', `${f3(vcm)} m/s`);
    });
  });

  /* ======================================================================
     9.4  Choque de bolas de billar en dos dimensiones
     ====================================================================== */
  MC.defineSim('colision-2d', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    const view = new MC.View2D(cv, { xmin: 0, xmax: 2.54, ymin: 0, ymax: 1.45 });
    const R = 0.06;
    const b1 = { x: 0, y: 0, vx: 0, vy: 0 }, b2 = { x: 0, y: 0, vx: 0, vy: 0 };
    let hit = false, pre = null, post = null, tr1 = [], tr2 = [];
    sim.group('Bolas');
    sim.slider('v1', { label: 'Rapidez de la bola 1', min: 0.2, max: 3, step: 0.05, value: 1.5, unit: 'm/s', fmt: f2, reset: true });
    sim.slider('b', { label: 'Parámetro de impacto <i>b</i> (en radios)', min: 0, max: 1.95, step: 0.01, value: 1, fmt: f2, reset: true });
    sim.slider('m1', { label: 'Masa de la bola 1', min: 0.05, max: 0.6, step: 0.01, value: 0.17, unit: 'kg', fmt: f2, reset: true });
    sim.slider('m2', { label: 'Masa de la bola 2', min: 0.05, max: 0.6, step: 0.01, value: 0.17, unit: 'kg', fmt: f2, reset: true });
    sim.slider('e', { label: 'Coeficiente de restitución <i>e</i>', min: 0, max: 1, step: 0.01, value: 1, fmt: f2, reset: true });
    sim.out('v1', 'Bola 1 después (rapidez, ángulo)');
    sim.out('v2', 'Bola 2 después (rapidez, ángulo)');
    sim.out('ang', 'Ángulo entre las trayectorias', { hl: true });
    sim.out('P', 'Momento total antes → después', { hl: true });
    sim.out('K', 'Energía cinética antes → después');
    sim.presets([
      { id: 'billar', label: 'Billar: golpe de lado (b = r)', v: { v1: 1.5, b: 1, m1: 0.17, m2: 0.17, e: 1 }, note: 'Masas iguales y choque elástico: salen formando 90°.' },
      { id: 'frontal', label: 'Choque frontal (b = 0)', v: { v1: 1.5, b: 0, m1: 0.17, m2: 0.17, e: 1 } },
      { id: 'rozando', label: 'Apenas se rozan', v: { v1: 1.5, b: 1.85, m1: 0.17, m2: 0.17, e: 1 } },
      { id: 'inelastico', label: 'Choque inelástico (e = 0.5)', v: { v1: 1.5, b: 1, m1: 0.17, m2: 0.17, e: 0.5 } },
      { id: 'pesada', label: 'Bola liviana contra una pesada', v: { v1: 1.5, b: 0.8, m1: 0.1, m2: 0.5, e: 1 } }
    ]);
    sim.run({
      startLabel: 'Tirar',
      reset() {
        const p = sim.p;
        b2.x = 1.45; b2.y = 0.72; b2.vx = 0; b2.vy = 0;
        b1.x = 0.35; b1.y = 0.72 + p.b * R; b1.vx = p.v1; b1.vy = 0;
        hit = false; post = null; tr1 = [[b1.x, b1.y]]; tr2 = [[b2.x, b2.y]];
        pre = { px: p.m1 * p.v1, py: 0, K: 0.5 * p.m1 * p.v1 * p.v1 };
      },
      step(h) {
        const p = sim.p;
        const nx1 = b1.x + b1.vx * h, ny1 = b1.y + b1.vy * h, nx2 = b2.x + b2.vx * h, ny2 = b2.y + b2.vy * h;
        if (!hit && Math.hypot(nx2 - nx1, ny2 - ny1) <= 2 * R) {
          /* instante exacto de contacto dentro del paso */
          const dx = b2.x - b1.x, dy = b2.y - b1.y, dvx = b2.vx - b1.vx, dvy = b2.vy - b1.vy;
          const r = M.quad(dvx * dvx + dvy * dvy, 2 * (dx * dvx + dy * dvy), dx * dx + dy * dy - 4 * R * R).filter((t) => t >= 0 && t <= h);
          const tc = r.length ? r[0] : 0;
          b1.x += b1.vx * tc; b1.y += b1.vy * tc; b2.x += b2.vx * tc; b2.y += b2.vy * tc;
          const L = Math.hypot(b2.x - b1.x, b2.y - b1.y), nx = (b2.x - b1.x) / L, ny = (b2.y - b1.y) / L;
          const u1 = b1.vx * nx + b1.vy * ny, u2 = b2.vx * nx + b2.vy * ny, Mt = p.m1 + p.m2;
          const w1 = (p.m1 * u1 + p.m2 * u2 - p.m2 * p.e * (u1 - u2)) / Mt, w2 = (p.m1 * u1 + p.m2 * u2 + p.m1 * p.e * (u1 - u2)) / Mt;
          b1.vx += (w1 - u1) * nx; b1.vy += (w1 - u1) * ny; b2.vx += (w2 - u2) * nx; b2.vy += (w2 - u2) * ny;
          hit = true;
          post = { px: p.m1 * b1.vx + p.m2 * b2.vx, py: p.m1 * b1.vy + p.m2 * b2.vy, K: 0.5 * p.m1 * (b1.vx ** 2 + b1.vy ** 2) + 0.5 * p.m2 * (b2.vx ** 2 + b2.vy ** 2) };
          const rest = h - tc;
          b1.x += b1.vx * rest; b1.y += b1.vy * rest; b2.x += b2.vx * rest; b2.y += b2.vy * rest;
        } else { b1.x = nx1; b1.y = ny1; b2.x = nx2; b2.y = ny2; }
        if (Math.floor((sim.t + h) / 0.05) > Math.floor(sim.t / 0.05)) { tr1.push([b1.x, b1.y]); tr2.push([b2.x, b2.y]); }
        const out = (b) => b.x < R || b.x > 2.54 - R || b.y < R || b.y > 1.45 - R;
        if (out(b1) || out(b2) || sim.t > 8) sim.end();
      },
      h: 1 / 1000
    });
    sim.onDraw(() => {
      const p = sim.p;
      view.update();
      const ctx = cv.ctx;
      D.clear(cv);
      ctx.fillStyle = '#1F6F4A';
      ctx.fillRect(view.X(0), view.Y(1.45), view.L(2.54), view.L(1.45));
      ctx.strokeStyle = MC.col('--wood');
      ctx.lineWidth = 8;
      ctx.strokeRect(view.X(0) + 4, view.Y(1.45) + 4, view.L(2.54) - 8, view.L(1.45) - 8);
      D.poly(ctx, tr1.map((q) => [view.X(q[0]), view.Y(q[1])]).concat([[view.X(b1.x), view.Y(b1.y)]]), { color: '#ffffff', width: 1.5, dash: [4, 4], alpha: 0.7 });
      D.poly(ctx, tr2.map((q) => [view.X(q[0]), view.Y(q[1])]).concat([[view.X(b2.x), view.Y(b2.y)]]), { color: '#F2B84B', width: 1.5, dash: [4, 4], alpha: 0.8 });
      D.ball(ctx, view.X(b1.x), view.Y(b1.y), view.L(R), { fill: '#f4f4f0' });
      D.ball(ctx, view.X(b2.x), view.Y(b2.y), view.L(R), { fill: '#F2B84B' });
      const kv = view.L(0.12);
      if (Math.hypot(b1.vx, b1.vy) > 0.01) D.vec(ctx, view.X(b1.x), view.Y(b1.y), b1.vx * kv, -b1.vy * kv, { color: '#ffffff', label: 'v₁', halo: false });
      if (Math.hypot(b2.vx, b2.vy) > 0.01) D.vec(ctx, view.X(b2.x), view.Y(b2.y), b2.vx * kv, -b2.vy * kv, { color: '#F2B84B', label: 'v₂', halo: false });
      /* diagrama de momentos */
      const px0 = cv.w - 196, py0 = 10;
      D.panel(ctx, px0, py0, 186, 150, { title: 'MOMENTOS (p₁ = p₁′ + p₂′)' });
      const pm = Math.max(0.01, pre.px);
      const k = 140 / pm;
      const ox = px0 + 20, oy = py0 + 90;
      D.arrow(ctx, ox, oy, ox + pre.px * k, oy, { color: '--mom', width: 2.6 });
      MC.text(ctx, 'p₁', ox + pre.px * k * 0.5, oy + 16, { size: 12, math: true, color: '--mom', align: 'center' });
      if (post) {
        const a1 = [p.m1 * b1.vx * k, -p.m1 * b1.vy * k], a2 = [p.m2 * b2.vx * k, -p.m2 * b2.vy * k];
        D.arrow(ctx, ox, oy, ox + a1[0], oy + a1[1], { color: '--c1', width: 2 });
        D.arrow(ctx, ox + a1[0], oy + a1[1], ox + a1[0] + a2[0], oy + a1[1] + a2[1], { color: '--c4', width: 2 });
        MC.text(ctx, 'p₁′', ox + a1[0] * 0.5 - 12, oy + a1[1] * 0.5, { size: 12, math: true, color: '--c1' });
        MC.text(ctx, 'p₂′', ox + a1[0] + a2[0] * 0.5 + 4, oy + a1[1] + a2[1] * 0.5, { size: 12, math: true, color: '--c4' });
      }
      const ang = (vx, vy) => M.deg(Math.atan2(vy, vx));
      if (post) {
        const s1 = Math.hypot(b1.vx, b1.vy), s2 = Math.hypot(b2.vx, b2.vy);
        sim.set('v1', `${f2(s1)} m/s, ${f1(ang(b1.vx, b1.vy))}°`);
        sim.set('v2', `${f2(s2)} m/s, ${f1(ang(b2.vx, b2.vy))}°`);
        sim.set('ang', s1 > 1e-3 && s2 > 1e-3 ? `${f1(Math.abs(ang(b1.vx, b1.vy) - ang(b2.vx, b2.vy)))}°` : '—');
        sim.set('P', `(${f3(pre.px)}, 0) → (${f3(post.px)}, ${f3(post.py)}) kg·m/s`);
        sim.set('K', `${f3(pre.K)} → ${f3(post.K)} J`);
      } else { ['v1', 'v2', 'ang'].forEach((q) => sim.set(q, '—')); sim.set('P', `(${f3(pre.px)}, 0) → …`); sim.set('K', `${f3(pre.K)} J → …`); }
    });
  });

  /* ======================================================================
     9.5  Centro de masa
     ====================================================================== */
  MC.defineSim('centro-masa', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    const view = new MC.View2D(cv, { xmin: -5, xmax: 5, ymin: -3, ymax: 3 });
    const partRange = { xmin: -5, xmax: 5, ymin: -3, ymax: 3, align: 'center', pad: 0, padL: 0, padB: 0, padT: 0, padR: 0 };
    const pts = [{ x: -2.5, y: 1 }, { x: 2, y: 1.8 }, { x: 0.5, y: -1.8 }];
    const s = { tr: [], frags: null, cmPath: [], boom: false, landed: false };
    sim.group('Situación');
    sim.seg('mode', { options: [['part', 'Partículas'], ['llave', 'Llave que gira'], ['fuegos', 'Fuegos artificiales']], value: 'part', reset: true });
    const gP = sim.group('Masas (arrástrelas)');
    sim.slider('m1', { label: '<i>m</i>₁', min: 0.5, max: 10, step: 0.5, value: 4, unit: 'kg', fmt: f1 });
    sim.slider('m2', { label: '<i>m</i>₂', min: 0.5, max: 10, step: 0.5, value: 1, unit: 'kg', fmt: f1 });
    sim.slider('m3', { label: '<i>m</i>₃', min: 0.5, max: 10, step: 0.5, value: 2, unit: 'kg', fmt: f1 });
    const gL = sim.group('Lanzamiento');
    sim.slider('v0', { label: 'Rapidez inicial del CM', min: 5, max: 25, step: 0.5, value: 14, unit: 'm/s', fmt: f1, reset: true });
    sim.slider('ang', { label: 'Ángulo', min: 20, max: 85, step: 1, value: 55, unit: '°', fmt: f0, reset: true });
    sim.slider('w', { label: 'Rapidez angular de la llave', min: 0, max: 20, step: 0.5, value: 8, unit: 'rad/s', fmt: f1, reset: true });
    sim.slider('ex', { label: 'Intensidad de la explosión', min: 1, max: 12, step: 0.5, value: 6, unit: 'm/s', fmt: f1, reset: true });
    sim.out('M', 'Masa total <i>M</i>');
    sim.out('cm', 'Centro de masa (<i>x</i><sub>cm</sub>, <i>y</i><sub>cm</sub>)', { hl: true });
    sim.out('o3', '—');
    sim.presets([
      { id: 'part', label: 'Tres partículas', v: { mode: 'part', m1: 4, m2: 1, m3: 2 } },
      { id: 'llave', label: 'Llave lanzada girando', v: { mode: 'llave', v0: 14, ang: 55, w: 8 } },
      { id: 'fuegos', label: 'Cohete de fuegos artificiales que explota', v: { mode: 'fuegos', v0: 18, ang: 70, ex: 6 } }
    ]);
    const vis = () => { const m = sim.p.mode; gP.hidden = m !== 'part'; gL.hidden = m === 'part'; sim.ctl.w.show(m === 'llave'); sim.ctl.ex.show(m === 'fuegos'); };
    sim.onChange = () => vis();
    vis();
    MC.handles(sim, cv, view, () => (sim.p.mode === 'part' ? pts.map((q, i) => ({ id: i, x: q.x, y: q.y })) : []), (i, x, y) => { pts[i].x = M.clamp(x, -4.8, 4.8); pts[i].y = M.clamp(y, -2.8, 2.8); });
    const mA = 2, mB = 0.5, dAB = 0.7;
    let seed = 3;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    sim.run({
      startLabel: 'Lanzar',
      reset() {
        vis();
        s.tr = []; s.cmPath = []; s.boom = false; s.landed = false; s.frags = null;
        const p = sim.p;
        if (p.mode !== 'part') {
          const th = M.rad(p.ang), vx = p.v0 * Math.cos(th), vy = p.v0 * Math.sin(th);
          const T = (2 * vy) / G, Rr = vx * T, Hh = (vy * vy) / (2 * G);
          view.setRange({ xmin: -1, xmax: Math.max(Rr * 1.35, 8), ymin: -0.5, ymax: Math.max(Hh * 1.4, 4), align: 'bottom left', padL: 8, padB: 8, padT: 8, padR: 8 });
          s.vx = vx; s.vy = vy;
        }
      },
      step(h) {
        const p = sim.p, t = sim.t + h;
        if (p.mode === 'part') { sim.end(); return; }
        const cx = s.vx * t, cy = s.vy * t - 0.5 * G * t * t;
        if (p.mode === 'llave') {
          if (cy < 0 && t > 0.1) { sim.end(); return; }
          if (Math.floor(t / 0.02) > Math.floor(sim.t / 0.02)) s.cmPath.push([cx, cy]);
          return;
        }
        /* fuegos */
        const tA = s.vy / G;
        if (!s.boom && t >= tA) {
          s.boom = true;
          const Mt = 1, ms = [0.5, 0.3, 0.2];
          const u = [];
          for (let i = 0; i < 2; i++) { const a = rnd() * 2 * Math.PI, sp = p.ex * (0.6 + 0.8 * rnd()); u.push([sp * Math.cos(a), sp * Math.sin(a)]); }
          u.push([-(ms[0] * u[0][0] + ms[1] * u[1][0]) / ms[2], -(ms[0] * u[0][1] + ms[1] * u[1][1]) / ms[2]]);
          const ex0 = s.vx * tA, ey0 = s.vy * tA - 0.5 * G * tA * tA;
          s.frags = ms.map((m, i) => ({ m, x: ex0, y: ey0, vx: s.vx + u[i][0], vy: u[i][1], path: [[ex0, ey0]], down: false }));
          void Mt;
        }
        if (s.boom) {
          for (const f of s.frags) {
            if (f.down) continue;
            f.x += f.vx * h; f.y += f.vy * h - 0.5 * G * h * h; f.vy -= G * h;
            if (f.y <= 0) { f.y = 0; f.down = true; s.landed = true; }
            if (Math.floor(t / 0.03) > Math.floor(sim.t / 0.03)) f.path.push([f.x, f.y]);
          }
          if (s.frags.every((f) => f.down) || t > 12) sim.end();
        } else if (Math.floor(t / 0.03) > Math.floor(sim.t / 0.03)) s.cmPath.push([cx, cy]);
        if (!s.landed && Math.floor(t / 0.03) > Math.floor(sim.t / 0.03) && s.boom) {
          let xm = 0, ym = 0;
          for (const f of s.frags) { xm += f.m * f.x; ym += f.m * f.y; }
          s.cmPath.push([xm, ym]);
        }
      },
      h: 1 / 1000
    });
    sim.onDraw(() => {
      const p = sim.p;
      const ctx = cv.ctx;
      D.clear(cv);
      if (p.mode === 'part') {
        view.setRange(partRange);
        view.grid({ labels: true, axes: true, unit: 'm' });
        const ms = [p.m1, p.m2, p.m3];
        const Mt = ms.reduce((a, b) => a + b, 0);
        const xc = pts.reduce((a, q, i) => a + ms[i] * q.x, 0) / Mt, yc = pts.reduce((a, q, i) => a + ms[i] * q.y, 0) / Mt;
        pts.forEach((q, i) => D.line(ctx, view.X(q.x), view.Y(q.y), view.X(xc), view.Y(yc), { color: '--ink-3', dash: [3, 3], width: 1 }));
        const cols = ['--c1', '--c4', '--c5'];
        pts.forEach((q, i) => { D.ball(ctx, view.X(q.x), view.Y(q.y), 8 + 3.2 * Math.sqrt(ms[i]), { fill: cols[i], label: `${f1(ms[i])}` }); });
        /* marca del CM */
        const X = view.X(xc), Y = view.Y(yc);
        ctx.save();
        ctx.fillStyle = MC.col('--ink');
        ctx.beginPath(); ctx.arc(X, Y, 9, 0, Math.PI / 2); ctx.lineTo(X, Y); ctx.fill();
        ctx.beginPath(); ctx.arc(X, Y, 9, Math.PI, 1.5 * Math.PI); ctx.lineTo(X, Y); ctx.fill();
        ctx.strokeStyle = MC.col('--ink'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X, Y, 9, 0, 2 * Math.PI); ctx.stroke();
        ctx.restore();
        MC.text(ctx, 'CM', X + 12, Y - 10, { size: 12, weight: 700, halo: true });
        sim.set('M', `${f1(Mt)} kg`);
        sim.set('cm', `(${f2(xc)}, ${f2(yc)}) m`);
        sim._outs.o3.label('Distancia del CM a la masa mayor');
        const imax = ms.indexOf(Math.max(...ms));
        sim.set('o3', `${f2(Math.hypot(pts[imax].x - xc, pts[imax].y - yc))} m`);
        return;
      }
      view.update();
      view.grid({ labels: true, unit: 'm' });
      D.ground(ctx, 0, view.Y(0), cv.w, { depth: 12 });
      const t = sim.t;
      const th = M.rad(p.ang);
      /* parábola del CM prevista */
      const Tf = (2 * s.vy) / G;
      const par = [];
      for (let i = 0; i <= 80; i++) { const tt = (Tf * i) / 80; par.push([view.X(s.vx * tt), view.Y(s.vy * tt - 0.5 * G * tt * tt)]); }
      D.poly(ctx, par, { color: '--mom', dash: [5, 5], width: 1.3, alpha: 0.7 });
      if (p.mode === 'llave') {
        const Mt = mA + mB, dA = (mB / Mt) * dAB, dB = (mA / Mt) * dAB;
        const pos = (tt) => { const cx = s.vx * tt, cy = s.vy * tt - 0.5 * G * tt * tt, a = p.w * tt; return { cx, cy, A: [cx - dA * Math.cos(a), cy - dA * Math.sin(a)], B: [cx + dB * Math.cos(a), cy + dB * Math.sin(a)] }; };
        const trA = [], trB = [];
        for (let tt = 0; tt <= t; tt += 0.01) { const q = pos(tt); trA.push([view.X(q.A[0]), view.Y(q.A[1])]); trB.push([view.X(q.B[0]), view.Y(q.B[1])]); }
        D.poly(ctx, trA, { color: '--c1', width: 1.4, alpha: 0.7 });
        D.poly(ctx, trB, { color: '--c4', width: 1.4, alpha: 0.7 });
        for (let tt = 0; tt <= t; tt += 0.12) {
          const q = pos(tt);
          D.line(ctx, view.X(q.A[0]), view.Y(q.A[1]), view.X(q.B[0]), view.Y(q.B[1]), { color: '--metal', width: 3, alpha: 0.35 });
        }
        const q = pos(t);
        D.line(ctx, view.X(q.A[0]), view.Y(q.A[1]), view.X(q.B[0]), view.Y(q.B[1]), { color: '--metal', width: 6 });
        D.circle(ctx, view.X(q.A[0]), view.Y(q.A[1]), 8, { fill: '--c1' });
        D.circle(ctx, view.X(q.B[0]), view.Y(q.B[1]), 5, { fill: '--c4' });
        D.circle(ctx, view.X(q.cx), view.Y(q.cy), 4, { fill: '--mom' });
        D.poly(ctx, s.cmPath.map((c) => [view.X(c[0]), view.Y(c[1])]), { color: '--mom', width: 2.4 });
        sim.set('M', `${f1(Mt)} kg (2 kg + 0.5 kg)`);
        sim.set('cm', `(${f2(q.cx)}, ${f2(q.cy)}) m`);
        sim._outs.o3.label('El CM sigue la parábola de');
        sim.set('o3', `v₀ = ${f1(p.v0)} m/s a ${f0(p.ang)}°`);
      } else {
        D.poly(ctx, s.cmPath.map((c) => [view.X(c[0]), view.Y(c[1])]), { color: '--mom', width: 2.4 });
        if (!s.boom) {
          const cx = s.vx * t, cy = s.vy * t - 0.5 * G * t * t;
          D.ball(ctx, view.X(cx), view.Y(cy), 7, { fill: '--c8' });
        } else {
          const cols = ['--c1', '--c4', '--c5'];
          let xm = 0, ym = 0;
          s.frags.forEach((f, i) => {
            D.poly(ctx, f.path.map((c) => [view.X(c[0]), view.Y(c[1])]).concat([[view.X(f.x), view.Y(f.y)]]), { color: cols[i], width: 1.8 });
            D.ball(ctx, view.X(f.x), view.Y(f.y), 4 + 8 * f.m, { fill: cols[i] });
            xm += f.m * f.x; ym += f.m * f.y;
          });
          if (!s.landed) { D.circle(ctx, view.X(xm), view.Y(ym), 5, { fill: '--mom' }); MC.text(ctx, 'CM', view.X(xm) + 8, view.Y(ym) - 8, { size: 11, weight: 700, color: '--mom', halo: true }); }
          else MC.text(ctx, 'Al tocar el suelo un fragmento, aparece una fuerza externa y el CM deja de seguir la parábola', 10, 20, { size: 11.5, color: '--ink-2' });
        }
        sim.set('M', '1.0 kg (0.5 + 0.3 + 0.2)');
        sim.set('cm', s.boom && !s.landed ? 'sigue la parábola' : '—');
        sim._outs.o3.label('Momento de los fragmentos');
        sim.set('o3', 'suman el momento que traía el cohete');
      }
      void th;
    });
  });

  /* ======================================================================
     9.6  Cohete
     ====================================================================== */
  MC.defineSim('cohete', function (sim) {
    sim.cols2('1fr 1.6fr');
    const cv = sim.canvas({ aspect: 0.62 });
    const gc = sim.canvas({ aspect: 1.0 });
    const H = new MC.History(['v', 'a', 'm', 'y']);
    const gv = new MC.TGraph({ ylabel: ['v', 'm/s'], series: [{ key: 'v', label: 'v', unit: 'm/s', color: '--vel', fmt: f1 }], legend: false, tspan: 10 });
    const ga = new MC.TGraph({ ylabel: ['a', 'm/s²'], series: [{ key: 'a', label: 'a', unit: 'm/s²', color: '--acc', fmt: f1 }], legend: false, tspan: 10 });
    const gm = new MC.TGraph({ ylabel: ['m', 'kg'], series: [{ key: 'm', label: 'm', unit: 'kg', color: '--ink-2', fmt: f1 }], legend: false, tspan: 10 });
    MC.hover(sim, gc, [gv, ga, gm]);
    const s = { y: 0, v: 0, m: 0, a: 0, burn: true, grounded: true };
    const st = sim.status(cv);
    sim.group('Entorno');
    sim.seg('env', { options: [['espacio', 'Espacio (sin gravedad)'], ['tierra', 'Despegue en la Tierra']], value: 'espacio', reset: true });
    sim.group('Cohete');
    sim.slider('m0', { label: 'Masa inicial <i>m</i><sub>i</sub>', min: 0.5, max: 5000, step: 0.5, value: 1000, unit: 'kg', log: true, fmt: (v) => MC.sci(v, 3), reset: true });
    sim.slider('fr', { label: 'Fracción de combustible', min: 0.1, max: 0.95, step: 0.01, value: 0.8, fmt: f2, reset: true });
    sim.slider('u', { label: 'Velocidad de los gases <i>u</i>', min: 5, max: 4500, step: 5, value: 3000, unit: 'm/s', log: true, fmt: f0, reset: true });
    sim.slider('tb', { label: 'Tiempo de combustión', min: 0.05, max: 120, step: 0.05, value: 40, unit: 's', log: true, fmt: (v) => MC.sci(v, 3), reset: true });
    sim.out('rate', 'Consumo |<i>dm</i>/<i>dt</i>|');
    sim.out('T', 'Empuje <i>u</i>|<i>dm</i>/<i>dt</i>|');
    sim.out('twr', 'Empuje / peso inicial');
    sim.out('dvi', 'Δ<i>v</i> ideal <i>u</i> ln(<i>m</i><sub>i</sub>/<i>m</i><sub>f</sub>)', { hl: true });
    sim.out('v', 'Velocidad actual', { hl: true });
    sim.out('y', 'Altura / distancia');
    sim.presets([
      { id: 'espacio', label: 'Cohete en el espacio', v: { env: 'espacio', m0: 1000, fr: 0.8, u: 3000, tb: 40 }, fn: (q) => q.setSpeed(2), note: 'Δv = 3000 ln 5 = 4.83 km/s.' },
      { id: 'despegue', label: 'El mismo cohete despegando de la Tierra', v: { env: 'tierra', m0: 1000, fr: 0.8, u: 3000, tb: 40 }, fn: (q) => q.setSpeed(2), note: 'La gravedad le quita g·t = 392 m/s al Δv ideal. Se usa g constante (válido cerca de la superficie).' },
      { id: 'nodespega', label: 'Empuje menor que el peso', v: { env: 'tierra', m0: 1000, fr: 0.8, u: 300, tb: 40 }, fn: (q) => q.setSpeed(1) },
      { id: 'agua', label: 'Cohete de agua (botella de 1.5 L)', v: { env: 'tierra', m0: 1.5, fr: 0.67, u: 20, tb: 0.1 }, fn: (q) => q.setSpeed(0.25) }
    ]);
    const rate = () => (sim.p.fr * sim.p.m0) / sim.p.tb;
    const g = () => (sim.p.env === 'tierra' ? G : 0);
    sim.run({
      startLabel: 'Encender',
      reset() {
        s.y = 0; s.v = 0; s.m = sim.p.m0; s.burn = true; s.grounded = sim.p.env === 'tierra'; st.hide();
        s.a = (sim.p.u * rate()) / s.m - g();
        H.clear(); H.push(0, { v: 0, a: Math.max(0, s.a), m: s.m, y: 0 }, true);
        const T = MC.niceCeil(sim.p.tb * (sim.p.env === 'tierra' ? 3 : 1.3));
        gv.set({ tspan: T }); ga.set({ tspan: T }); gm.set({ tspan: T });
      },
      step(h) {
        const p = sim.p, mf = p.m0 * (1 - p.fr), r = rate();
        const burning = s.m > mf + 1e-9;
        const thrust = burning ? p.u * r : 0;
        let a = thrust / s.m - g();
        if (s.grounded && a <= 0) { a = 0; if (!burning && s.y <= 0) { st.show('No despegó: el empuje nunca superó el peso', 'bad'); sim.end(); } }
        else s.grounded = false;
        s.a = a;
        s.v += a * h; s.y += s.v * h;
        if (burning) s.m = Math.max(mf, s.m - r * h);
        H.push(sim.t + h, { v: s.v, a, m: s.m, y: s.y });
        if (p.env === 'tierra' && !s.grounded && s.y <= 0 && sim.t > 0.05) { s.y = 0; st.show('Volvió al suelo'); sim.end(); }
        if (sim.t > (p.env === 'tierra' ? 900 : p.tb * 1.3 + 2)) sim.end();
      },
      h: 1 / 1000
    });
    sim.onDraw(() => {
      const p = sim.p;
      const ctx = cv.ctx;
      D.clear(cv);
      const esp = p.env === 'espacio';
      ctx.fillStyle = esp ? '#0E1320' : MC.col('--sky');
      ctx.fillRect(0, 0, cv.w, cv.h);
      const span = Math.max(20, Math.abs(s.v) * 1.5 + 10);
      const view = new MC.View2D(cv, { xmin: -span * 0.3, xmax: span * 0.3, ymin: s.y - span * 0.35, ymax: s.y + span * 0.65 });
      if (esp) {
        let sd = 11;
        const r2 = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 80; i++) { const yy = ((r2() * 400 - (s.y % 400) + 400) % 400) / 400; ctx.globalAlpha = 0.3 + 0.7 * r2(); ctx.fillRect(r2() * cv.w, yy * cv.h, 1.6, 1.6); }
        ctx.globalAlpha = 1;
      } else {
        const step = MC.niceStep(span, 5);
        for (let yy = Math.floor(view.y0 / step) * step; yy <= view.y1; yy += step) {
          if (yy < 0) continue;
          D.line(ctx, 0, view.Y(yy), 14, view.Y(yy), { color: '--ink-3', width: 1 });
          MC.text(ctx, MC.si(yy, 'm', 3), 18, view.Y(yy) + 4, { size: 10.5, mono: true, color: '--ink-3' });
        }
        if (view.Y(0) < cv.h) D.ground(ctx, 0, view.Y(0), cv.w, { depth: 14 });
      }
      /* cohete (tamaño fijo en pantalla) */
      const X = cv.w / 2, Y = view.Y(s.y) - 40;
      const mf = p.m0 * (1 - p.fr), burning = s.m > mf + 1e-9 && sim.t > 0 && !sim.ended;
      if (burning) {
        ctx.save();
        const fl = 18 + 10 * Math.random();
        const gr = ctx.createLinearGradient(0, Y + 30, 0, Y + 30 + fl * 2);
        gr.addColorStop(0, '#FFE08A'); gr.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.moveTo(X - 8, Y + 30); ctx.lineTo(X, Y + 30 + fl * 2); ctx.lineTo(X + 8, Y + 30); ctx.fill();
        ctx.restore();
      }
      ctx.save();
      ctx.fillStyle = '#E9ECEF';
      ctx.strokeStyle = '#6B7280';
      ctx.beginPath(); ctx.moveTo(X, Y - 40); ctx.quadraticCurveTo(X + 12, Y - 22, X + 11, Y + 30); ctx.lineTo(X - 11, Y + 30); ctx.quadraticCurveTo(X - 12, Y - 22, X, Y - 40); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#D0342C';
      ctx.beginPath(); ctx.moveTo(X - 11, Y + 14); ctx.lineTo(X - 20, Y + 32); ctx.lineTo(X - 11, Y + 30); ctx.fill();
      ctx.beginPath(); ctx.moveTo(X + 11, Y + 14); ctx.lineTo(X + 20, Y + 32); ctx.lineTo(X + 11, Y + 30); ctx.fill();
      /* nivel de combustible */
      const fuel = (s.m - mf) / (p.m0 - mf);
      ctx.fillStyle = '#F2B84B';
      ctx.fillRect(X - 5, Y + 24 - 36 * fuel, 10, 36 * fuel);
      ctx.restore();
      if (Math.abs(s.v) > 0.5) D.vec(ctx, X + 30, Y, 0, -Math.sign(s.v) * Math.min(90, 20 + Math.abs(s.v) * 0.02), { color: '--vel', label: 'v' });
      /* gráficas */
      const gctx = gc.ctx;
      D.clear(gc);
      const dvi = p.u * Math.log(1 / (1 - p.fr));
      const r = rate();
      gv.set({ fns: [{ f: (t) => p.u * Math.log(p.m0 / Math.max(mf, p.m0 - r * t)) - g() * t, to: p.tb, color: '--ink-3', label: 'ideal' }] });
      gv.draw(gctx, { x: 0, y: 0, w: gc.w, h: gc.h * 0.4, mb: 28 }, H, { t: sim.t, after: (P) => { if (!esp) return; P.hline(dvi, { color: '--vel', dash: [6, 4], label: `u ln(mᵢ/m_f) = ${f0(dvi)} m/s`, labelRight: true }); } });
      ga.draw(gctx, { x: 0, y: gc.h * 0.4, w: gc.w, h: gc.h * 0.3, mb: 28 }, H, { t: sim.t });
      gm.draw(gctx, { x: 0, y: gc.h * 0.7, w: gc.w, h: gc.h * 0.3, mb: 34 }, H, { t: sim.t, yExtra: [0, p.m0] });
      sim.set('rate', `${MC.sci(r, 3)} kg/s`);
      sim.set('T', MC.si(p.u * r, 'N', 3));
      sim.set('twr', f2((p.u * r) / (p.m0 * G)));
      sim.set('dvi', `${MC.sci(dvi, 4)} m/s`);
      sim.set('v', `${MC.sci(s.v, 4)} m/s`);
      sim.set('y', MC.si(s.y, 'm', 3));
    });
  });
})();
