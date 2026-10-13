/* Capítulo 13 — Campo magnético y fuerza de Lorentz */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, K = EM.K, V = EM.V;
  const rad = M.rad, deg = M.deg;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);
  const PART = {
    p: { n: 'Protón', q: K.e, m: K.mp },
    e: { n: 'Electrón', q: -K.e, m: K.me },
    a: { n: 'Partícula alfa', q: 2 * K.e, m: 6.644657e-27 }
  };

  /* ======================================================================
     13.1 Trayectorias en E y B uniformes (unidades reducidas)
     ====================================================================== */
  EM.defineSim('lorentz-3d', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    const v3 = new EM.View3D(sim, cv, { radius: 3, az: rad(28), el: rad(18) });
    sim.group('Partícula');
    sim.select('pt', { options: [['p', 'Protón'], ['e', 'Electrón'], ['a', 'Partícula alfa']], value: 'p', onInput: () => rebuild() });
    sim.slider('v0', { label: 'Rapidez inicial <i>v</i><sub>0</sub>', min: 1e3, max: 1e7, value: 1e5, log: true, step: 1, unit: 'm/s', fmt: (v) => EM.sci(v, 2), onInput: () => rebuild() });
    sim.slider('al', { label: 'Ángulo entre <b>v</b><sub>0</sub> y <b>B</b>', min: 0, max: 90, step: 1, value: 70, unit: '°', fmt: (v) => v.toFixed(0), onInput: () => rebuild() });
    sim.group('Campos');
    sim.slider('B', { label: 'Campo magnético <i>B</i> (según +<i>z</i>)', min: 1, max: 2000, value: 100, log: true, step: 1, unit: 'mT', fmt: (v) => v.toFixed(0), onInput: () => rebuild() });
    sim.slider('eps', { label: 'Campo eléctrico <i>E</i>/(<i>v</i><sub>0</sub><i>B</i>)', min: 0, max: 0.6, step: 0.01, value: 0, fmt: f2, onInput: () => rebuild() });
    sim.seg('Edir', { label: 'Dirección de <b>E</b>', options: [['perp', 'E ⊥ B (según +y)'], ['par', 'E ∥ B']], value: 'perp', onInput: () => rebuild() });
    sim.out('r', 'Radio de giro <i>mv</i><sub>⊥</sub>/|<i>q</i>|<i>B</i>', { hl: true });
    sim.out('T', 'Período 2π<i>m</i>/|<i>q</i>|<i>B</i>');
    sim.out('f', 'Frecuencia de ciclotrón');
    sim.out('pitch', 'Paso de la hélice');
    sim.out('E', 'Campo eléctrico <i>E</i>');
    sim.out('vd', 'Deriva <i>E</i>/<i>B</i>');
    sim.hint('Unidades de la figura: radio de giro r₀ = mv₀/|q|B', cv);
    sim.legend([{ color: '--bfield', label: '<b>B</b>' }, { color: '--efield', label: '<b>E</b>' }, { color: '--accent', label: 'trayectoria' }, { color: '--c1', label: '<b>v</b>' }, { color: '--c2', label: '<b>F</b>' }]);
    let path = [], k = 0, box = 3;
    function rebuild() {
      const p = sim.p, s = Math.sign(PART[p.pt].q);
      const a = rad(p.al);
      let r = [0, 0, 0], v = [Math.sin(a), 0, Math.cos(a)];
      const E = p.Edir === 'perp' ? [0, p.eps, 0] : [0, 0, p.eps];
      /* dv/dt = s (E + v × ẑ), tiempo en 1/ω_c, longitudes en r0 */
      const acc = (vv) => [s * (E[0] + vv[1]), s * (E[1] - vv[0]), s * E[2]];
      path = [r.slice()];
      /* duración: hasta 6 períodos, limitada para que la figura no se alargue demasiado */
      let per = 6;
      if (Math.abs(Math.cos(a)) > 1e-3) per = Math.min(per, 4.5 / (2 * Math.PI * Math.abs(Math.cos(a))));
      if (p.Edir === 'perp' && p.eps > 1e-3) per = Math.min(per, 5 / (2 * Math.PI * p.eps));
      if (p.Edir === 'par' && p.eps > 1e-3) per = Math.min(per, Math.sqrt(10 / p.eps) / (2 * Math.PI));
      per = Math.max(per, 1.2);
      const dt = 0.02, n = Math.round((per * 2 * Math.PI) / dt);
      for (let i = 0; i < n; i++) {
        const k1 = acc(v), v2 = V.add(v, V.scale(k1, dt / 2)), k2 = acc(v2), v3b = V.add(v, V.scale(k2, dt / 2)), k3 = acc(v3b), v4 = V.add(v, V.scale(k3, dt)), k4 = acc(v4);
        const nv = V.add(v, V.scale(V.comb(1, k1, 2, k2, 2, k3, 1, k4), dt / 6));
        r = V.add(r, V.scale(V.add(v, nv), dt / 2));
        v = nv;
        path.push(r.slice());
      }
      let mx = 1;
      path.forEach((q) => { mx = Math.max(mx, Math.abs(q[0]), Math.abs(q[1]), Math.abs(q[2])); });
      box = mx;
      let cen = [0, 0, 0];
      path.forEach((q) => { cen = V.add(cen, q); });
      cen = V.scale(cen, 1 / path.length);
      let ext = 1;
      path.forEach((q) => { ext = Math.max(ext, Math.abs(q[0] - cen[0]), Math.abs(q[1] - cen[1]), Math.abs(q[2] - cen[2])); });
      box = ext;
      v3.target = cen;
      v3.R = Math.max(1.8, ext * 1.15);
      k = 0;
    }
    rebuild();
    sim.animate((dt) => { k += dt * 160; if (k >= path.length - 1) k = 0; });
    sim.onDraw(() => {
      const p = sim.p, pt = PART[p.pt];
      v3.begin();
      const c = v3.target, L = box * 1.1;
      /* líneas de B */
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const x = c[0] + i * Math.min(L, 2.5) * 0.9, y = c[1] + j * Math.min(L, 2.5) * 0.9;
        v3.arrow([x, y, c[2] - L], [x, y, c[2] + L], { color: '--bfield', width: 1.1, alpha: 0.45, head: 8, seg: 6 });
      }
      v3.text([c[0] + L * 0.8, c[1] + L * 0.8, c[2] + L * 1.1], 'B', { size: 15, weight: 700, family: EM.FONT_MATH, color: '--bfield' });
      if (p.eps > 0) {
        const Ed = p.Edir === 'perp' ? [0, 1, 0] : [0, 0, 1];
        const o = V.add(c, [-L * 0.9, -L * 0.9, -L * 0.6]);
        v3.arrow(o, V.add(o, V.scale(Ed, L * 0.5)), { color: '--efield', width: 2.4, head: 10 });
        v3.text(V.add(o, V.scale(Ed, L * 0.6)), 'E', { size: 14, weight: 700, family: EM.FONT_MATH, color: '--efield' });
      }
      /* ejes locales */
      v3.line([0, 0, 0], [1, 0, 0], { color: '--axis', width: 1 });
      v3.line([0, 0, 0], [0, 1, 0], { color: '--axis', width: 1 });
      v3.text([1.2, 0, 0], 'x', { size: 12, italic: true, family: EM.FONT_MATH, color: '--ink-3' });
      v3.text([0, 1.2, 0], 'y', { size: 12, italic: true, family: EM.FONT_MATH, color: '--ink-3' });
      const ki = Math.floor(k);
      const drawn = path.slice(0, ki + 1).filter((_, i) => i % 3 === 0 || i === ki);
      if (drawn.length > 1) v3.polyline(drawn, { color: '--accent', width: 2 });
      v3.polyline(path.filter((_, i) => i % 6 === 0), { color: '--accent', width: 0.8, alpha: 0.25 });
      const P = path[ki], Pn = path[Math.min(ki + 1, path.length - 1)];
      const vel = V.scale(V.sub(Pn, P), 1 / 0.02);
      const s = Math.sign(pt.q);
      const E = p.Edir === 'perp' ? [0, p.eps, 0] : [0, 0, p.eps];
      const F = V.scale(V.add(E, V.cross(vel, [0, 0, 1])), s);
      v3.arrow(P, V.add(P, V.scale(vel, 0.8)), { color: '--c1', width: 2.2, head: 9 });
      if (V.norm(F) > 1e-3) v3.arrow(P, V.add(P, V.scale(F, 0.8)), { color: '--c2', width: 2.2, head: 9 });
      v3.point(P, { r: 6, color: s > 0 ? '--pos' : '--neg', sign: s });
      v3.render();
      const B = p.B * 1e-3, vp = p.v0 * Math.sin(rad(p.al)), vpar = p.v0 * Math.cos(rad(p.al));
      const w = (Math.abs(pt.q) * B) / pt.m;
      sim.set('r', EM.si((pt.m * vp) / (Math.abs(pt.q) * B), 'm'));
      sim.set('T', EM.si((2 * Math.PI) / w, 's'));
      sim.set('f', EM.si(w / (2 * Math.PI), 'Hz'));
      sim.set('pitch', EM.si((vpar * 2 * Math.PI) / w, 'm'));
      sim.set('E', EM.si(p.eps * p.v0 * B, 'V/m'));
      sim.set('vd', p.Edir === 'perp' ? EM.si(p.eps * p.v0, 'm/s') + ' (según +x)' : '— (E ∥ B acelera)');
    });
  });

  /* ======================================================================
     13.2 Espectrómetro de masas
     ====================================================================== */
  EM.defineSim('mass-spectrometer', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    const u = K.u;
    const SETS = {
      C: { n: 'Carbono: ¹²C⁺, ¹³C⁺, ¹⁴C⁺', ions: [['¹²C⁺', 12.000], ['¹³C⁺', 13.003], ['¹⁴C⁺', 14.003]] },
      Ne: { n: 'Neón: ²⁰Ne⁺, ²¹Ne⁺, ²²Ne⁺', ions: [['²⁰Ne⁺', 19.992], ['²¹Ne⁺', 20.994], ['²²Ne⁺', 21.991]] },
      Cl: { n: 'Cloro: ³⁵Cl⁺, ³⁷Cl⁺', ions: [['³⁵Cl⁺', 34.969], ['³⁷Cl⁺', 36.966]] },
      U: { n: 'Uranio: ²³⁵U⁺, ²³⁸U⁺', ions: [['²³⁵U⁺', 235.044], ['²³⁸U⁺', 238.051]] }
    };
    sim.group('Muestra');
    sim.select('set', { options: Object.keys(SETS).map((k) => [k, SETS[k].n]), value: 'Ne' });
    sim.group('Selector de velocidades');
    sim.slider('E', { label: 'Campo eléctrico <i>E</i>', min: 5, max: 200, step: 1, value: 40, unit: 'kV/m', fmt: (v) => v.toFixed(0) });
    sim.slider('B', { label: 'Campo magnético <i>B</i>', min: 0.05, max: 1, step: 0.01, value: 0.2, unit: 'T', fmt: f2 });
    sim.group('Región de deflexión');
    sim.slider('Bp', { label: 'Campo magnético <i>B</i>′', min: 0.05, max: 2, step: 0.01, value: 0.5, unit: 'T', fmt: f2 });
    sim.out('v', 'Velocidad seleccionada <i>E</i>/<i>B</i>', { hl: true });
    sim.outSep('Impactos (distancia 2r desde la rendija)');
    const outs = [0, 1, 2].map((i) => sim.out('d' + i, '—'));
    sim.out('sep', 'Separación entre los extremos');
    sim.note('Cada especie sale de la fuente con velocidades entre 0.85 y 1.15 veces E/B; sólo las que el selector deja pasar llegan al detector. B y B′ apuntan hacia afuera de la pantalla.');
    sim.onDraw(() => {
      const p = sim.p, set = SETS[p.set];
      const vs = (p.E * 1e3) / p.B;
      const Ls = 0.1, g = 0.004, slit = 0.0006;
      const radii = set.ions.map(([, A]) => (A * u * vs) / (K.e * p.Bp));
      const rmax = Math.max(...radii);
      const ext = Math.max(0.12, 2 * rmax * 1.08);
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      /* escala: x de −Ls a max(ext*0.6, 0.05); y de −ext a pequeño margen */
      const view = new EM.View2D(cv, { xmin: -Ls - 0.01, xmax: Math.max(rmax * 1.15, 0.03), ymin: -ext, ymax: Math.max(0.02, ext * 0.08) });
      const X = (x) => view.X(x), Y = (y) => view.Y(y);
      /* regiones */
      ctx.fillStyle = EM.alpha('--bfield', 0.07);
      ctx.fillRect(X(0), Y(view.y1), X(view.x1) - X(0), Y(view.y0) - Y(view.y1));
      for (let x = 0.02 * Math.ceil(0 / 0.02); x < view.x1; x += (view.x1 - 0) / 8) for (let y = view.y0 + (view.y1 - view.y0) / 10; y < view.y1; y += (view.y1 - view.y0) / 8) {
        ctx.beginPath(); ctx.arc(X(x), Y(y), 2, 0, 7); ctx.fillStyle = EM.alpha('--bfield', 0.55); ctx.fill();
      }
      EM.text(ctx, 'B′ (⊙ saliente)', X(view.x1) - 8, Y(view.y1) + 16, { size: 11.5, color: '--bfield', align: 'right', halo: true });
      /* selector */
      ctx.fillStyle = EM.col('--neg'); ctx.fillRect(X(-Ls), Y(g) - 4, X(0) - X(-Ls), 4);
      ctx.fillStyle = EM.col('--pos'); ctx.fillRect(X(-Ls), Y(-g), X(0) - X(-Ls), 4);
      EM.text(ctx, 'selector: E ↑, B ⊙', X(-Ls / 2), Y(g) - 10, { size: 11, color: '--ink-2', align: 'center', halo: true });
      /* detector (línea x = 0, y < 0) y rendija */
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(X(0), Y(-slit) + 3); ctx.lineTo(X(0), Y(view.y0)); ctx.stroke();
      EM.text(ctx, 'placa detectora', X(0) - 6, Y(view.y0) - 8, { size: 11, color: '--ink-2', align: 'right', halo: true });
      const cols = ['--c1', '--c2', '--c3'];
      const fr = [0.85, 0.92, 0.97, 1.0, 1.03, 1.08, 1.15];
      set.ions.forEach(([name, A], i) => {
        const m = A * u;
        fr.forEach((f) => {
          const v = vs * f;
          const a = (K.e * (p.E * 1e3 - v * p.B)) / m; /* aceleración en y dentro del selector */
          const pts = [];
          let ok = true, yexit = 0;
          for (let j = 0; j <= 40; j++) {
            const x = -Ls + (Ls * j) / 40, t = (x + Ls) / v, y = 0.5 * a * t * t;
            if (Math.abs(y) > g) { ok = false; break; }
            pts.push([X(x), Y(y)]);
            yexit = y;
          }
          if (ok && Math.abs(yexit) > slit) ok = false;
          EM.draw.poly(ctx, pts, { color: cols[i], width: 1.3, alpha: ok ? 0.9 : 0.4 });
          if (ok) {
            const r = (m * v) / (K.e * p.Bp);
            const arc = [];
            for (let j = 0; j <= 60; j++) { const th = (Math.PI * j) / 60; arc.push([X(r * Math.sin(th)), Y(yexit - r + r * Math.cos(th))]); }
            EM.draw.poly(ctx, arc, { color: cols[i], width: f === 1 ? 2.2 : 1, alpha: f === 1 ? 1 : 0.55 });
          }
        });
        const d = 2 * radii[i];
        ctx.beginPath(); ctx.arc(X(0), Y(-d), 5, 0, 7); ctx.fillStyle = EM.col(cols[i]); ctx.fill();
        EM.text(ctx, name, X(0) - 10, Y(-d) + 4, { size: 12, weight: 600, color: cols[i], align: 'right', halo: true });
        outs[i].dt.innerHTML = name;
        outs[i].set(EM.si(d, 'm'));
        outs[i].show(true);
      });
      for (let i = set.ions.length; i < 3; i++) outs[i].show(false);
      view.scaleBar(EM.niceStep(ext, 3), EM.si(EM.niceStep(ext, 3), 'm'));
      sim.set('v', EM.si(vs, 'm/s'));
      sim.set('sep', EM.si(2 * (Math.max(...radii) - Math.min(...radii)), 'm'));
    });
  });

  /* ======================================================================
     13.3 Ciclotrón
     ====================================================================== */
  EM.defineSim('cyclotron', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1 });
    const cp = sim.canvas({ aspect: 1 });
    sim.group('Máquina');
    sim.slider('B', { label: 'Campo magnético <i>B</i>', min: 0.5, max: 2, step: 0.05, value: 1.5, unit: 'T', fmt: f2 });
    sim.slider('R', { label: 'Radio de las “D”', min: 0.2, max: 1, step: 0.05, value: 0.5, unit: 'm', fmt: f2 });
    sim.slider('V0', { label: 'Amplitud del voltaje (exagerada)', min: 0.2, max: 3, step: 0.1, value: 1, unit: 'MV', fmt: (v) => EM.fix(v, 1) });
    sim.slider('det', { label: 'Desintonía de la frecuencia', min: -10, max: 10, step: 0.5, value: 0, unit: '%', fmt: (v) => EM.fix(v, 1) });
    sim.select('pt', { options: [['p', 'Protón'], ['a', 'Partícula alfa']], value: 'p' });
    sim.out('f', 'Frecuencia de ciclotrón', { hl: true });
    sim.out('K', 'Energía cinética actual');
    sim.out('Km', 'Energía máxima <i>q</i>²<i>B</i>²<i>R</i>²/2<i>m</i>');
    sim.out('n', 'Vueltas');
    let st = null, hist = [], wait = 0;
    const reset = () => { st = { x: 0, y: 0, vx: 0, vy: 0, t: 0, turns: 0, out: false }; hist = []; path = []; };
    let path = [];
    reset();
    sim.onChange = () => reset();
    sim.animate((dt) => {
      const p = sim.p, pt = PART[p.pt];
      const q = pt.q, m = pt.m, B = p.B;
      const wc = (q * B) / m, T = (2 * Math.PI) / wc;
      if (st.out) { wait += dt; if (wait > 1.5) { wait = 0; reset(); } return; }
      const w = wc * (1 + p.det / 100);
      const gap = 0.02 * p.R;
      const steps = 120, h = (T * 1.2 * dt) / steps; /* ≈ 1.2 vueltas por segundo */
      for (let i = 0; i < steps; i++) {
        const Ex = Math.abs(st.x) < gap / 2 ? (p.V0 * 1e6 * Math.cos(w * st.t)) / gap : 0;
        /* a = q/m (E + v × B), B = B ẑ (saliente) */
        const ax = (q / m) * (Ex + st.vy * B), ay = (q / m) * (-st.vx * B);
        st.vx += ax * h; st.vy += ay * h;
        const ox = st.x;
        st.x += st.vx * h; st.y += st.vy * h;
        st.t += h;
        if (ox < 0 && st.x >= 0 && st.y > 0) st.turns++;
        if (Math.hypot(st.x, st.y) > p.R) { st.out = true; break; }
      }
      path.push([st.x, st.y]);
      if (path.length > 6000) path.shift();
      const Kin = 0.5 * m * (st.vx * st.vx + st.vy * st.vy);
      hist.push([st.t * 1e6, Kin / EM.K.e]);
    });
    sim.onDraw(() => {
      const p = sim.p, pt = PART[p.pt];
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h, cx = w / 2, cy = h / 2, S = (Math.min(w, h) * 0.44) / p.R;
      const gap = 0.02 * p.R * S + 6;
      const Vnow = Math.cos((pt.q * p.B / pt.m) * (1 + p.det / 100) * st.t);
      const dee = (side) => {
        ctx.beginPath();
        const x0 = cx + (side * gap) / 2;
        ctx.moveTo(x0, cy - p.R * S);
        ctx.arc(x0, cy, p.R * S, -Math.PI / 2, Math.PI / 2, side < 0);
        ctx.closePath();
        const pos = side * Vnow < 0; /* E en el hueco apunta de + a − */
        ctx.fillStyle = EM.alpha(pos ? '--pos' : '--neg', 0.08 + 0.12 * Math.abs(Vnow));
        ctx.fill();
        ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5; ctx.stroke();
      };
      dee(-1); dee(1);
      EM.text(ctx, 'B ⊙', 12, 20, { size: 12, color: '--bfield' });
      if (path.length > 1) EM.draw.poly(ctx, path.map(([x, y]) => [cx + x * S, cy - y * S]), { color: '--accent', width: 1.4 });
      ctx.beginPath(); ctx.arc(cx + st.x * S, cy - st.y * S, 5, 0, 7); ctx.fillStyle = EM.col('--pos'); ctx.fill();
      if (st.out) EM.text(ctx, 'sale del ciclotrón', cx, h - 14, { size: 12, color: '--accent', align: 'center', weight: 600 });
      EM.draw.clear(cp);
      const Km = (pt.q * p.B * p.R) ** 2 / (2 * pt.m) / K.e / 1e6;
      const tmax = Math.max(0.05, hist.length ? hist[hist.length - 1][0] : 0.05);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: tmax, ymin: 0, ymax: Km * 1.15, xlabel: 't (µs)', ylabel: 'K (MeV)', title: 'Energía ganada en cada cruce' });
      pl.frame();
      pl.hline(Km, { color: '--ink-3', label: 'K máx', labelRight: true });
      if (hist.length > 1) pl.path(hist.map(([t, k]) => [t, k / 1e6]), { color: '--c1', width: 2 });
      const Kn = 0.5 * pt.m * (st.vx ** 2 + st.vy ** 2);
      sim.set('f', EM.si((pt.q * p.B) / (2 * Math.PI * pt.m), 'Hz'));
      sim.set('K', EM.fix(Kn / K.e / 1e6, 2) + ' MeV');
      sim.set('Km', EM.fix(Km, 2) + ' MeV');
      sim.set('n', String(st.turns));
    });
  });

  /* ======================================================================
     13.4 Efecto Hall
     ====================================================================== */
  EM.defineSim('hall-effect', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.group('Material');
    sim.seg('car', { label: 'Portadores', options: [['e', 'Electrones'], ['h', 'Huecos (+)']], value: 'e', onInput: () => { s = 0; } });
    sim.slider('n', { label: 'Densidad de portadores <i>n</i>', min: 1e20, max: 1e29, value: 1e22, log: true, step: 1, unit: 'm⁻³', fmt: (v) => EM.sci(v, 2), onInput: () => { s = 0; } });
    sim.slider('t', { label: 'Espesor <i>t</i>', min: 0.01, max: 2, step: 0.01, value: 0.5, unit: 'mm', fmt: f2 });
    sim.group('Condiciones');
    sim.slider('I', { label: 'Corriente <i>I</i>', min: 0.01, max: 5, step: 0.01, value: 0.1, unit: 'A', fmt: f2, onInput: () => { s = 0; } });
    sim.slider('B', { label: 'Campo <i>B</i> (saliente)', min: 0.01, max: 2, step: 0.01, value: 0.5, unit: 'T', fmt: f2, onInput: () => { s = 0; } });
    sim.out('vd', 'Velocidad de deriva');
    sim.out('EH', 'Campo de Hall <i>v<sub>d</sub>B</i>');
    sim.out('VH', 'Tensión de Hall <i>V</i><sub>sup</sub> − <i>V</i><sub>inf</sub>', { hl: true });
    sim.out('RH', 'Coeficiente de Hall 1/<i>nq</i>');
    sim.note('Lámina de 1 cm de ancho. La corriente convencional va hacia la derecha.');
    let s = 0;
    const car = [];
    for (let i = 0; i < 60; i++) car.push({ x: Math.random(), y: Math.random() });
    sim.animate((dt) => {
      s = Math.min(1, s + dt * 0.6);
      const hole = sim.p.car === 'h';
      for (const c of car) {
        c.x += (hole ? 1 : -1) * dt * 0.18;
        /* desviación hacia abajo (ambos signos) que se anula al formarse el campo de Hall */
        c.y += dt * 0.35 * (1 - s) ;
        if (c.x > 1) c.x -= 1; if (c.x < 0) c.x += 1;
        if (c.y > 1) c.y = Math.random() * 0.3;
      }
    });
    sim.onDraw(() => {
      const p = sim.p, hole = p.car === 'h', q = hole ? K.e : -K.e;
      EM.draw.clear(cv);
      const ctx = cv.ctx, w = cv.w, h = cv.h;
      const x0 = w * 0.12, x1 = w * 0.84, y0 = h * 0.2, y1 = h * 0.78;
      ctx.fillStyle = EM.alpha('--c4', 0.12); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.strokeStyle = EM.col('--c4'); ctx.lineWidth = 2; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      /* B saliente */
      for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) { const x = x0 + ((i + 0.5) * (x1 - x0)) / 9, y = y0 + ((j + 0.5) * (y1 - y0)) / 5; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.strokeStyle = EM.alpha('--bfield', 0.5); ctx.lineWidth = 1; ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fillStyle = EM.alpha('--bfield', 0.6); ctx.fill(); }
      /* portadores */
      car.forEach((c) => { ctx.beginPath(); ctx.arc(x0 + c.x * (x1 - x0), y0 + 8 + c.y * (y1 - y0 - 16), 3.4, 0, 7); ctx.fillStyle = EM.col(hole ? '--pos' : '--neg'); ctx.fill(); });
      /* carga acumulada */
      const nS = Math.round(14 * s);
      for (let i = 0; i < nS; i++) {
        const x = x0 + ((i + 0.5) * (x1 - x0)) / 14;
        EM.text(ctx, hole ? '+' : '−', x, y1 - 6, { size: 13, weight: 700, color: hole ? '--pos' : '--neg', align: 'center' });
        EM.text(ctx, hole ? '−' : '+', x, y0 + 14, { size: 13, weight: 700, color: hole ? '--neg' : '--pos', align: 'center' });
      }
      EM.draw.arrow(ctx, x0 - 50, (y0 + y1) / 2, x0 - 8, (y0 + y1) / 2, { color: '--c1', width: 2.6, head: 10 });
      EM.text(ctx, 'I', x0 - 44, (y0 + y1) / 2 - 10, { size: 14, weight: 700, family: EM.FONT_MATH, color: '--c1' });
      EM.text(ctx, 'B ⊙', x1 + 10, y0 + 12, { size: 12, color: '--bfield' });
      /* voltímetro */
      const vx = x1 + 34;
      EM.ckt.wire(ctx, [[(x0 + x1) / 2, y0], [(x0 + x1) / 2, y0 - 18], [vx, y0 - 18], [vx, (y0 + y1) / 2 - 16]]);
      EM.ckt.wire(ctx, [[(x0 + x1) / 2, y1], [(x0 + x1) / 2, y1 + 18], [vx, y1 + 18], [vx, (y0 + y1) / 2 + 16]]);
      EM.ckt.meter(ctx, vx, (y0 + y1) / 2 - 16, vx, (y0 + y1) / 2 + 16, { letter: 'V', len: 32 });
      const A = 0.01 * p.t * 1e-3;
      const vd = p.I / (p.n * K.e * A);
      const VH = -(p.I * p.B) / (p.n * q * p.t * 1e-3); /* V_sup − V_inf */
      EM.text(ctx, 'V_{H} = ' + EM.si(VH * s, 'V'), vx - 20, y1 + 36, { size: 12.5, mono: true, color: '--accent', align: 'right', halo: true });
      sim.set('vd', EM.si(vd, 'm/s'));
      sim.set('EH', EM.si(vd * p.B, 'V/m'));
      sim.set('VH', EM.si(VH, 'V'));
      sim.set('RH', EM.sci(1 / (p.n * q), 3) + ' m³/C');
    });
  });

  /* ======================================================================
     13.5 Espira en un campo: torque y motor
     ====================================================================== */
  EM.defineSim('loop-torque', function (sim) {
    sim.cols2();
    const c3 = sim.canvas({ aspect: 0.95 });
    const cp = sim.canvas({ aspect: 0.95 });
    const v3 = new EM.View3D(sim, c3, { radius: 1.25, az: rad(-60), el: rad(24) });
    sim.group('Espira (8 cm × 5 cm)');
    sim.slider('N', { label: 'Número de vueltas <i>N</i>', min: 1, max: 200, step: 1, value: 50, fmt: (v) => v.toFixed(0) });
    sim.slider('I', { label: 'Corriente <i>I</i>', min: 0, max: 3, step: 0.05, value: 1, unit: 'A', fmt: f2 });
    sim.slider('B', { label: 'Campo <i>B</i> (según +<i>x</i>)', min: 0, max: 1, step: 0.01, value: 0.3, unit: 'T', fmt: f2 });
    sim.group('Dinámica');
    sim.seg('mode', { options: [['free', 'Sin conmutador'], ['motor', 'Motor (conmutador)']], value: 'free' });
    sim.slider('fr', { label: 'Rozamiento', min: 0, max: 2, step: 0.05, value: 0.2, fmt: f2 });
    sim.button('Soltar desde θ = 150°', () => { th = rad(150); om = 0; }, { primary: true });
    sim.out('m', 'Momento magnético <i>m</i> = <i>NIA</i>');
    sim.out('th', 'Ángulo <i>θ</i> entre <b>m</b> y <b>B</b>');
    sim.out('tau', 'Torque <i>τ</i>', { hl: true });
    sim.out('U', 'Energía <i>U</i> = −<b>m</b>·<b>B</b>');
    sim.out('om', 'Velocidad angular');
    const a = 0.08, b = 0.05, Irot = 1e-3;
    let th = rad(150), om = 0;
    const tauOf = (t) => {
      const p = sim.p, m = p.N * p.I * a * b;
      const s = -m * p.B * Math.sin(t);
      return p.mode === 'motor' ? m * p.B * Math.abs(Math.sin(t)) : s;
    };
    sim.animate((dt) => {
      const n = 20, h = dt / n;
      for (let i = 0; i < n; i++) {
        const acc = (tauOf(th) - sim.p.fr * 1e-2 * om) / Irot;
        om += acc * h; th += om * h;
      }
      if (Math.abs(om) > 60) om = Math.sign(om) * 60;
    });
    sim.onDraw(() => {
      const p = sim.p, m = p.N * p.I * a * b;
      const mh = [Math.cos(th), Math.sin(th), 0], wv = [-Math.sin(th), Math.cos(th), 0], z = [0, 0, 1];
      const A = 0.8, Bw = 0.5; /* tamaño dibujado */
      v3.begin();
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) v3.arrow([-1.4, i * 0.6, j * 0.55], [1.4, i * 0.6, j * 0.55], { color: '--bfield', width: 1, alpha: 0.45, head: 8, seg: 6 });
      v3.text([1.55, 0.6, 0.55], 'B', { size: 14, weight: 700, family: EM.FONT_MATH, color: '--bfield' });
      v3.line([0, 0, -1], [0, 0, 1], { color: '--ink-3', dash: [4, 4], width: 1, seg: 6 });
      const P = (sw, sz) => V.comb((sw * Bw) / 2, wv, (sz * A) / 2, z);
      const corners = [P(1, -1), P(1, 1), P(-1, 1), P(-1, -1)];
      const Iabs = p.mode === 'motor' && Math.sin(th) > 0 ? -1 : 1; /* sentido de la corriente (el conmutador la invierte) */
      v3.poly(corners, { fill: '--c4', alpha: 0.12, stroke: '--c4', strokeAlpha: 0.9, strokeWidth: 2.5 });
      for (let k = 0; k < 4; k++) {
        const s0 = corners[k], s1 = corners[(k + 1) % 4];
        const [a0, a1] = Iabs > 0 ? [s0, s1] : [s1, s0];
        v3.arrow(V.lerp(a0, a1, 0.35), V.lerp(a0, a1, 0.62), { color: '--c1', width: 2.4, head: 9 });
      }
      /* fuerzas sobre los lados verticales: F = I L × B */
      const Fm = p.I * p.N * a * p.B * Iabs;
      if (Math.abs(Fm) > 1e-6) {
        const Ld = Math.sign(Fm) * (0.15 + (0.5 * Math.abs(Fm)) / (Math.abs(Fm) + 1));
        v3.arrow(P(1, 0), V.add(P(1, 0), V.scale([0, 1, 0], Ld)), { color: '--c2', width: 3, head: 11 });
        v3.arrow(P(-1, 0), V.add(P(-1, 0), V.scale([0, -1, 0], Ld)), { color: '--c2', width: 3, head: 11 });
        v3.text(V.add(P(1, 0), [0, Ld * 1.15, 0]), 'F', { size: 13, weight: 700, family: EM.FONT_MATH, color: '--c2' });
      }
      v3.arrow([0, 0, 0], V.scale(mh, 0.75 * Iabs), { color: '--gold', width: 3, head: 11 });
      v3.text(V.scale(mh, 0.9 * Iabs), 'm', { size: 14, weight: 700, family: EM.FONT_MATH, color: '--gold' });
      v3.render();
      EM.draw.clear(cp);
      const tm = Math.max(1e-6, m * p.B);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 2 * Math.PI, ymin: -tm * 1.3, ymax: tm * 1.3, xpi: true, xlabel: 'θ', ylabel: 'τ (N·m)', title: p.mode === 'motor' ? 'Torque con conmutador' : 'Torque τ = −mB sen θ' });
      pl.frame();
      pl.fn(tauOf, { color: '--c2', width: 2.4 });
      if (p.mode === 'motor') pl.hline((2 * tm) / Math.PI, { color: '--ink-3', label: 'torque medio 2mB/π', labelRight: true });
      const thw = M.wrap2pi(th);
      pl.dot(thw, tauOf(thw), { color: '--accent', r: 5.5 });
      sim.set('m', EM.si(m, 'A·m²'));
      sim.set('th', EM.fix(deg(thw), 1) + '°');
      sim.set('tau', EM.si(tauOf(th), 'N·m'));
      sim.set('U', EM.si(-m * p.B * Math.cos(th) * (p.mode === 'motor' ? Iabs : 1), 'J'));
      sim.set('om', EM.fix(om, 2) + ' rad/s');
    });
  });
})();
