/* Capítulo 24 — Electrodinámica y relatividad */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, V = EM.V;
  const rad = M.rad, deg = M.deg;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);
  const TAU = 2 * Math.PI;
  const gam = (b) => 1 / Math.sqrt(1 - b * b);
  const posmod = (x, m) => ((x % m) + m) % m;
  const vec = (a) => '(' + a.map((x) => EM.minus(EM.fix(Math.abs(x) < 5e-4 ? 0 : x, 2))).join(', ') + ')';

  /* ======================================================================
     24.1 Transformación de los campos
     ====================================================================== */
  EM.defineSim('field-transform', function (sim) {
    sim.cols2();
    const ca = sim.canvas({ aspect: 0.72 });
    const cb = sim.canvas({ aspect: 0.72 });
    const PRE = {
      charge: { n: 'Carga en reposo en S (sólo E)', E: [0, 1, 0], B: [0, 0, 0], b: 0.6 },
      mag: { n: 'Imán en reposo en S (sólo B)', E: [0, 0, 0], B: [0, 0, 1], b: 0.6 },
      low: { n: 'Campos cruzados con E < cB', E: [0, 0.5, 0], B: [0, 0, 1], b: 0.5 },
      high: { n: 'Campos cruzados con E > cB', E: [0, 1, 0], B: [0, 0, 0.5], b: 0.5 },
      wave: { n: 'Onda plana (E ⟂ B, E = cB)', E: [0, 1, 0], B: [0, 0, 1], b: 0.6 },
      par: { n: 'E paralelo a B', E: [0, 0, 1], B: [0, 0, 0.6], b: 0.6 }
    };
    sim.group('Campos en S (unidades con c = 1: se muestra cB)');
    sim.select('pre', {
      options: Object.keys(PRE).map((k) => [k, PRE[k].n]), value: 'charge',
      onInput: (k) => { const q = PRE[k]; ['Ex', 'Ey', 'Ez'].forEach((id, i) => sim.ctl[id].set(q.E[i], true)); ['Bx', 'By', 'Bz'].forEach((id, i) => sim.ctl[id].set(q.B[i], true)); sim.ctl.b.set(q.b, true); }
    });
    const sl = (id, lab, v) => sim.slider(id, { label: lab, min: -1, max: 1, step: 0.05, value: v, fmt: (x) => EM.minus(EM.fix(x, 2)) });
    sl('Ex', '<i>E<sub>x</sub></i>', 0); sl('Ey', '<i>E<sub>y</sub></i>', 1); sl('Ez', '<i>E<sub>z</sub></i>', 0);
    sl('Bx', '<i>cB<sub>x</sub></i>', 0); sl('By', '<i>cB<sub>y</sub></i>', 0); sl('Bz', '<i>cB<sub>z</sub></i>', 0);
    sim.group('Observador S′');
    sim.slider('b', { label: 'Velocidad de S′ según +<i>x</i>, <i>β</i> = <i>v</i>/<i>c</i>', min: -0.95, max: 0.95, step: 0.01, value: 0.6, fmt: (x) => EM.minus(EM.fix(x, 2)) });
    sim.button('Ir a la velocidad que anula E′ o B′', () => {
      const p = sim.p, E = [p.Ex, p.Ey, p.Ez], B = [p.Bx, p.By, p.Bz];
      const e2 = V.dot(E, E), b2 = V.dot(B, B), S = V.cross(E, B);
      if (b2 > e2 && b2 > 1e-9) sim.ctl.b.set(M.clamp(S[0] / b2, -0.95, 0.95));
      else if (e2 > 1e-9) sim.ctl.b.set(M.clamp(S[0] / e2, -0.95, 0.95));
    }, { newRow: true });
    sim.out('g', 'Factor <i>γ</i>');
    sim.out('Ep', '<b>E</b>′', { hl: true });
    sim.out('Bp', '<i>c</i><b>B</b>′', { hl: true });
    sim.out('i1', '<b>E</b>·<i>c</i><b>B</b> (en S y en S′)');
    sim.out('i2', '<i>E</i>² − <i>c</i>²<i>B</i>² (en S y en S′)');
    sim.out('cls', 'Clasificación');
    sim.legend([{ color: '--efield', label: '<b>E</b>' }, { color: '--bfield', label: '<i>c</i><b>B</b>' }, { color: '--gold', label: 'velocidad del otro sistema' }]);
    const va = new EM.View3D(sim, ca, { radius: 2.1, az: rad(32), el: rad(20) });
    const vb = new EM.View3D(sim, cb, { radius: 2.1, az: rad(32), el: rad(20) });
    function transform(E, B, b) {
      const g = gam(b);
      return {
        E: [E[0], g * (E[1] - b * B[2]), g * (E[2] + b * B[1])],
        B: [B[0], g * (B[1] + b * E[2]), g * (B[2] - b * E[1])], g
      };
    }
    function scene(v3, cv, E, B, bv, title, other) {
      v3.begin();
      v3.axes({ len: 1.05, neg: 0.5 });
      const m = Math.max(1, V.norm(E), V.norm(B)), k = 1.5 / m;
      if (V.norm(E) > 1e-3) v3.arrow([0, 0, 0], V.scale(E, k), { color: '--efield', width: 3.2, head: 13, seg: 6 });
      if (V.norm(B) > 1e-3) v3.arrow([0, 0, 0], V.scale(B, k), { color: '--bfield', width: 3.2, head: 13, seg: 6 });
      if (Math.abs(bv) > 1e-3) { v3.arrow([-0.5, -1.2, -1.0], [-0.5 + 1.1 * bv, -1.2, -1.0], { color: '--gold', width: 2.6, head: 10 }); v3.text([-0.5 + 0.55 * bv, -1.2, -0.82], 'v', { size: 13, italic: true, weight: 700, family: EM.FONT_MATH, color: '--gold', align: 'center' }); }
      if (V.norm(E) > 1e-3) v3.text(V.scale(E, k * 1.1), 'E', { size: 13, weight: 700, color: '--efield', align: 'center', baseline: 'middle' });
      if (V.norm(B) > 1e-3) v3.text(V.scale(B, k * 1.12), 'cB', { size: 13, weight: 700, color: '--bfield', align: 'center', baseline: 'middle' });
      v3.render();
      EM.text(cv.ctx, title, 12, 20, { size: 12.5, weight: 600, color: '--ink' });
      EM.text(cv.ctx, other, 12, 36, { size: 11, color: '--ink-2' });
    }
    sim.onDraw(() => {
      const p = sim.p, E = [p.Ex, p.Ey, p.Ez], B = [p.Bx, p.By, p.Bz];
      const T = transform(E, B, p.b);
      scene(va, ca, E, B, -p.b, 'Sistema S', 'S′ se mueve con β = ' + EM.minus(f2(p.b)) + ' según x');
      scene(vb, cb, T.E, T.B, -p.b, 'Sistema S′', 'S se mueve con β = ' + EM.minus(f2(-p.b)) + ' según x');
      const i1 = V.dot(E, B), i2 = V.dot(E, E) - V.dot(B, B);
      const i1p = V.dot(T.E, T.B), i2p = V.dot(T.E, T.E) - V.dot(T.B, T.B);
      sim.set('g', f3(T.g));
      sim.set('Ep', vec(T.E));
      sim.set('Bp', vec(T.B));
      sim.set('i1', EM.minus(f3(i1)) + ' / ' + EM.minus(f3(i1p)));
      sim.set('i2', EM.minus(f3(i2)) + ' / ' + EM.minus(f3(i2p)));
      let cls;
      if (V.norm(E) < 1e-6 && V.norm(B) < 1e-6) cls = 'sin campo';
      else if (Math.abs(i1) > 1e-6) cls = 'E·B ≠ 0: ningún observador ve sólo E o sólo B';
      else if (Math.abs(i2) < 1e-6) cls = 'tipo radiación (ambos invariantes nulos)';
      else cls = i2 < 0 ? 'existe un sistema con sólo B (E < cB)' : 'existe un sistema con sólo E (E > cB)';
      sim.set('cls', cls);
    });
  });

  /* ======================================================================
     24.2 Carga en movimiento uniforme
     ====================================================================== */
  EM.defineSim('moving-charge', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    const cp = sim.canvas({ aspect: 3.2, cls: 'fixed' });
    sim.slider('b', { label: 'Velocidad <i>β</i> = <i>v</i>/<i>c</i>', min: 0, max: 0.99, step: 0.01, value: 0.8, fmt: f2 });
    const setB = (x) => () => sim.ctl.b.set(x);
    sim.button('0.1c', setB(0.1), { newRow: true });
    sim.button('0.5c', setB(0.5));
    sim.button('0.9c', setB(0.9));
    sim.button('0.99c', setB(0.99));
    sim.slider('N', { label: 'Número de líneas', min: 8, max: 40, step: 2, value: 24, fmt: (v) => v.toFixed(0) });
    sim.check('heat', { label: 'Intensidad |<b>E</b>| (escala logarítmica)', value: true });
    sim.check('B', { label: 'Campo <b>B</b> (⊙ sale, ⊗ entra en la pantalla)', value: true });
    sim.out('g', 'Factor <i>γ</i>');
    sim.out('e90', '<i>E</i>(90°)/<i>E</i><sub>Coulomb</sub> = <i>γ</i>', { hl: true });
    sim.out('e0', '<i>E</i>(0°)/<i>E</i><sub>Coulomb</sub> = 1/<i>γ</i>²');
    sim.out('w', 'Semiancho angular del disco (<i>E</i> a la mitad)');
    const view = new EM.View2D(cv, { xmin: -6, xmax: 6, ymin: -3.2, ymax: 3.2 });
    const ang = (th, b) => (1 - b * b) / Math.pow(1 - b * b * Math.sin(th) ** 2, 1.5);
    sim.onDraw(() => {
      const p = sim.p, b = p.b, g = gam(b);
      view.update();
      EM.draw.clear(cv);
      const ctx = cv.ctx;
      if (p.heat) {
        EM.field.heat(view, (x, y) => {
          const R2 = x * x + y * y;
          if (R2 < 0.04) return NaN;
          const s2 = (y * y) / R2;
          return Math.log10(((1 - b * b) / Math.pow(1 - b * b * s2, 1.5)) / R2);
        }, (v) => EM.cmap.seq(M.clamp((v + 2.2) / 3.2, 0, 1) * 0.75, '--efield'), { res: 4 });
      }
      /* líneas de campo radiales desde la posición actual */
      ctx.save();
      ctx.strokeStyle = EM.col('--fline'); ctx.lineWidth = 1.5;
      for (let i = 0; i < p.N; i++) {
        const t0 = (TAU * (i + 0.5)) / p.N;
        let ux = Math.cos(t0), uy = g * Math.sin(t0); const n = Math.hypot(ux, uy); ux /= n; uy /= n;
        ctx.beginPath(); ctx.moveTo(view.X(0.24 * ux), view.Y(0.24 * uy)); ctx.lineTo(view.X(9 * ux), view.Y(9 * uy)); ctx.stroke();
        const ar = 2.2;
        EM.draw.arrow(ctx, view.X((ar - 0.15) * ux), view.Y((ar - 0.15) * uy), view.X((ar + 0.15) * ux), view.Y((ar + 0.15) * uy), { color: '--fline', width: 1.5, head: 8 });
      }
      ctx.restore();
      if (p.B && b > 0.005) {
        for (const xx of [-4.5, -3, -1.5, 0, 1.5, 3, 4.5]) for (const yy of [-2.4, -1.2, 1.2, 2.4]) {
          const R2 = xx * xx + yy * yy, s = Math.abs(yy) / Math.sqrt(R2);
          const Bm = (b * s * ang(Math.asin(s), b)) / R2; /* |B| ∝ β sen θ E */
          const r = M.clamp(3 + 30 * Math.sqrt(Bm), 3, 11);
          const px = view.X(xx), py = view.Y(yy);
          ctx.save(); ctx.strokeStyle = EM.col('--bfield'); ctx.fillStyle = EM.col('--bfield'); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.stroke();
          if (yy > 0) { ctx.beginPath(); ctx.arc(px, py, Math.max(1.5, r * 0.28), 0, TAU); ctx.fill(); }
          else { const d = r * 0.62; ctx.beginPath(); ctx.moveTo(px - d, py - d); ctx.lineTo(px + d, py + d); ctx.moveTo(px - d, py + d); ctx.lineTo(px + d, py - d); ctx.stroke(); }
          ctx.restore();
        }
      }
      EM.draw.charge(ctx, view.X(0), view.Y(0), 1, { r: 0.22 * view.s });
      ctx.save(); ctx.fillStyle = EM.col('--canvas'); ctx.font = `700 ${Math.round(0.3 * view.s)}px ${EM.FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+', view.X(0), view.Y(0) + 1); ctx.restore();
      EM.draw.arrow(ctx, view.X(0.3), view.Y(0), view.X(0.3 + 1.2 * b + 0.05), view.Y(0), { color: '--gold', width: 3, head: 11 });
      EM.text(ctx, 'v', view.X(0.4 + 1.2 * b), view.Y(0) - 8, { size: 13, italic: true, weight: 700, family: EM.FONT_MATH, color: '--gold', halo: true });
      /* E R² frente a θ */
      EM.draw.clear(cp);
      const ymax = Math.max(1.2, g * 1.1);
      const pl = new EM.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 180, ymin: 0, ymax, xticks: [0, 30, 60, 90, 120, 150, 180], xlabel: 'ángulo θ con la velocidad (°)', ylabel: 'E R² / (q/4πε₀)', mt: 10 });
      pl.frame();
      pl.hline(1, { color: '--ink-3', dash: [4, 4], label: 'Coulomb (β = 0)', labelRight: true });
      pl.fn((d) => ang(rad(d), b), { color: '--efield', width: 2.6, n: 900, fill: '--efield', fillAlpha: 0.12 });
      pl.dot(90, g, { color: '--accent', label: 'γ', dy: 14 });
      /* lecturas */
      const half = g / 2;
      let w = null;
      if (b > 0.02) { const th = M.bisect((t) => ang(t, b) - half, 1e-6, Math.PI / 2); w = 90 - deg(th); }
      sim.set('g', f3(g));
      sim.set('e90', f3(g));
      sim.set('e0', EM.fix(1 / (g * g), 4));
      sim.set('w', w === null ? '— (casi isótropo)' : EM.fix(w, 1) + '°');
    });
  });

  /* ======================================================================
     24.3 Magnetismo como efecto relativista
     ====================================================================== */
  EM.defineSim('wire-relativity', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('fr', { label: 'Sistema de referencia', options: [['S', 'S (laboratorio)'], ['Sp', 'S′ (carga)']], value: 'S' });
    sim.slider('v', { label: 'Velocidad de los electrones <i>v</i>/<i>c</i>', min: -0.9, max: 0.9, step: 0.01, value: 0.6, fmt: (x) => EM.minus(f2(x)) });
    sim.slider('u', { label: 'Velocidad de la carga de prueba <i>u</i>/<i>c</i>', min: -0.9, max: 0.9, step: 0.01, value: 0.6, fmt: (x) => EM.minus(f2(x)) });
    sim.seg('q', { label: 'Carga de prueba', options: [[1, '+q'], [-1, '−q']], value: 1 });
    sim.note('Velocidades exageradas para que la contracción sea visible. En un alambre real <i>v</i> ≈ 10⁻¹² <i>c</i>, pero la cantidad de electrones es enorme.');
    sim.out('frame', 'Tipo de fuerza en este sistema', { hl: true });
    sim.out('lam', 'Densidades <i>λ</i><sub>+</sub>, <i>λ</i><sub>−</sub>, neta (en <i>λ</i><sub>0</sub>)');
    sim.out('vp', 'Velocidad de los electrones en S′');
    sim.out('F', 'Fuerza en S (en <i>qλ</i><sub>0</sub>/2π<i>ε</i><sub>0</sub><i>r</i>)');
    sim.out('Fp', 'Fuerza en S′');
    sim.out('ratio', '<i>F</i>′/<i>F</i> y <i>γ</i><sub>u</sub>');
    let T = 0;
    sim.animate((dt) => { T += dt; });
    sim.onDraw(() => {
      const p = sim.p, v = p.v, u = p.u, q = +p.q, inS = p.fr === 'S';
      const gu = gam(u), gv = gam(v), vp = (v - u) / (1 - u * v), gvp = gam(vp);
      const lamP = inS ? 1 : gu, lamM = inS ? -1 : -gvp / gv, net = lamP + lamM;
      const Fs = q * u * v, Fsp = q * gu * u * v; /* componente que aleja del alambre */
      EM.draw.clear(cv);
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      const yw = H * 0.34, s0 = 34, wH = 34;
      /* alambre */
      ctx.save();
      ctx.fillStyle = EM.alpha(net > 1e-3 ? '--pos' : net < -1e-3 ? '--neg' : '--ink-3', Math.min(0.3, 0.08 + Math.abs(net) * 0.5));
      ctx.fillRect(0, yw - wH / 2, W, wH);
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, yw - wH / 2); ctx.lineTo(W, yw - wH / 2); ctx.moveTo(0, yw + wH / 2); ctx.lineTo(W, yw + wH / 2); ctx.stroke();
      ctx.restore();
      const vi = inS ? 0 : -u, ve = inS ? v : vp, vq = inS ? u : 0;
      const spI = inS ? s0 : s0 / gu, spE = inS ? s0 : (s0 * gv) / gvp, pxv = 70; /* px por unidad de c por segundo */
      const row = (sp, vel, y, sign) => {
        const shift = posmod(vel * pxv * T, sp);
        for (let x = -sp + shift; x < W + sp; x += sp) {
          ctx.save();
          ctx.fillStyle = EM.col(sign > 0 ? '--pos' : '--neg');
          ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill();
          ctx.strokeStyle = EM.col('--canvas'); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); if (sign > 0) { ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); } ctx.stroke();
          ctx.restore();
        }
      };
      row(spI, vi, yw - 8, 1);
      row(spE, ve, yw + 8, -1);
      const lab = (txt, x, y, col) => EM.text(ctx, txt, x, y, { size: 11.5, color: col, halo: true });
      lab('iones: ' + (Math.abs(vi) < 1e-9 ? 'en reposo' : 'v = ' + EM.minus(f2(vi)) + 'c'), 10, yw - wH / 2 - 8, '--pos');
      lab('electrones: v = ' + EM.minus(f2(ve)) + 'c', 10, yw + wH / 2 + 16, '--neg');
      if (inS && Math.abs(v) > 0.005) {
        const dir = v > 0 ? -1 : 1; /* corriente convencional opuesta al movimiento de los electrones */
        EM.draw.arrow(ctx, W - 90, yw - wH / 2 - 12, W - 90 + dir * 50, yw - wH / 2 - 12, { color: '--cur', width: 2.4, head: 10 });
        EM.text(ctx, 'I', W - 90 + dir * 25, yw - wH / 2 - 20, { size: 11.5, align: 'center', color: '--cur', halo: true });
      }
      /* carga de prueba */
      const xq = W * 0.5, yq = H * 0.74;
      ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = EM.col('--ink-3');
      ctx.beginPath(); ctx.moveTo(xq, yw + wH / 2); ctx.lineTo(xq, yq); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'r', xq + 6, (yw + yq) / 2 + 12, { size: 12, italic: true, color: '--ink-3' });
      EM.draw.charge(ctx, xq, yq, q, { r: 11 });
      ctx.save(); ctx.fillStyle = EM.col('--canvas'); ctx.font = `700 14px ${EM.FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(q > 0 ? '+' : '−', xq, yq + 1); ctx.restore();
      if (Math.abs(vq) > 0.005) {
        EM.draw.arrow(ctx, xq - 18, yq - 22, xq - 18 + vq * 80, yq - 22, { color: '--gold', width: 2.4, head: 9 });
        EM.text(ctx, 'u', xq - 18 + vq * 80 + (vq > 0 ? 6 : -14), yq - 18, { size: 12.5, italic: true, color: '--gold', halo: true });
      } else EM.text(ctx, 'en reposo', xq + 16, yq - 14, { size: 11, color: '--ink-2', halo: true });
      /* fuerza (positiva = se aleja del alambre, hacia abajo) */
      const F = inS ? Fs : Fsp, Lf = M.clamp(F * 90, -95, 95);
      if (Math.abs(Lf) > 2) EM.draw.arrow(ctx, xq + 22, yq, xq + 22, yq + Lf, { color: '--accent', width: 3, head: 12 });
      EM.text(ctx, (inS ? 'F magnética' : 'F eléctrica') + (Math.abs(F) < 1e-6 ? ' = 0' : ''), xq + 34, yq + Lf / 2 + 4, { size: 12, weight: 600, color: '--accent', halo: true });
      if (inS && Math.abs(v) > 0.005) {
        /* B en la posición de la carga: la corriente según −x·sign(v) */
        const out = v > 0; /* electrones hacia +x → corriente hacia −x → bajo el alambre B sale de la pantalla */
        const bx = xq - 60, by = yq;
        ctx.save(); ctx.strokeStyle = EM.col('--bfield'); ctx.fillStyle = EM.col('--bfield'); ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(bx, by, 9, 0, TAU); ctx.stroke();
        if (out) { ctx.beginPath(); ctx.arc(bx, by, 2.6, 0, TAU); ctx.fill(); }
        else { ctx.beginPath(); ctx.moveTo(bx - 6, by - 6); ctx.lineTo(bx + 6, by + 6); ctx.moveTo(bx - 6, by + 6); ctx.lineTo(bx + 6, by - 6); ctx.stroke(); }
        ctx.restore();
        EM.text(ctx, 'B', bx - 22, by + 4, { size: 12.5, weight: 700, color: '--bfield' });
      }
      if (!inS && Math.abs(net) > 1e-4) {
        for (const x of [W * 0.15, W * 0.3, W * 0.7, W * 0.85]) {
          const d = net > 0 ? 1 : -1;
          const y1 = yw + wH / 2 + 30, y2 = y1 + 26;
          EM.draw.arrow(ctx, x, d > 0 ? y1 : y2, x, d > 0 ? y2 : y1, { color: '--efield', width: 1.8, head: 8, alpha: Math.min(1, 0.3 + Math.abs(net)) });
        }
        EM.text(ctx, 'E′ del alambre cargado', W * 0.15 + 8, yw + wH / 2 + 70, { size: 11, color: '--efield', halo: true });
      }
      EM.text(ctx, inS ? 'Sistema S (laboratorio): alambre neutro con corriente' : 'Sistema S′ (la carga en reposo): alambre cargado', 10, 18, { size: 12.5, weight: 600, color: '--ink' });
      /* lecturas */
      sim.set('frame', inS ? (Math.abs(Fs) < 1e-9 ? 'ninguna' : 'magnética (quB)') : Math.abs(Fsp) < 1e-9 ? 'ninguna' : 'eléctrica (qE′)');
      sim.set('lam', EM.fix(lamP, 3) + ', ' + EM.minus(EM.fix(lamM, 3)) + ', ' + EM.minus(EM.fix(net, 3)));
      sim.set('vp', EM.minus(f3(vp)) + 'c');
      const dirTxt = (x) => (Math.abs(x) < 1e-9 ? '0' : EM.minus(f3(Math.abs(x))) + (x > 0 ? ' (repulsión)' : ' (atracción)'));
      sim.set('F', dirTxt(Fs));
      sim.set('Fp', dirTxt(Fsp));
      sim.set('ratio', Math.abs(Fs) < 1e-9 ? '— / ' + f3(gu) : f3(Fsp / Fs) + ' / ' + f3(gu));
    });
  });
})();
