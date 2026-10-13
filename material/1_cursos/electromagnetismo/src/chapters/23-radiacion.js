/* Capítulo 23 — Radiación y antenas */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M, V = EM.V;
  const rad = M.rad, deg = M.deg;
  const f2 = (v) => EM.fix(v, 2), f3 = (v) => EM.fix(v, 3);
  const TAU = 2 * Math.PI;
  const posmod = (x, m) => ((x % m) + m) % m;

  /* ======================================================================
     23.1 Pulso de radiación de una carga que frena (Thomson–Purcell)
     ====================================================================== */
  EM.defineSim('radiation-kink', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.group('Movimiento de la carga');
    sim.slider('v', { label: 'Velocidad inicial <i>v</i>/<i>c</i>', min: 0.05, max: 0.95, step: 0.01, value: 0.5, fmt: f2 });
    sim.slider('dt', { label: 'Duración del frenado Δ<i>t</i>', min: 0.2, max: 3, step: 0.05, value: 0.7, unit: 'u', fmt: f2 });
    sim.group('Dibujo');
    sim.slider('N', { label: 'Número de líneas de campo', min: 8, max: 36, step: 2, value: 20, fmt: (v) => v.toFixed(0) });
    sim.slider('spd', { label: 'Velocidad de la animación', min: 0.3, max: 3, step: 0.1, value: 1.2, fmt: (v) => EM.fix(v, 1) + '×' });
    sim.check('ghost', { label: 'Posición que tendría si no hubiera frenado', value: true });
    sim.button('Frenar de nuevo', () => { t = 0; sim.redraw(); });
    sim.out('t', 'Tiempo desde el final del frenado <i>ct</i>');
    sim.out('g', 'Factor de Lorentz <i>γ</i> antes del frenado');
    sim.out('a', 'Aceleración <i>a</i> = <i>v</i>/Δ<i>t</i>');
    sim.out('ratio', '<i>E</i><sub>⊥</sub>/<i>E</i><sub>r</sub> en el pulso a 90° (≈ <i>ar</i>/<i>c</i>²)', { hl: true });
    sim.note('Unidades con <i>c</i> = 1: las distancias y los tiempos se miden en la misma unidad arbitraria <i>u</i>.');
    const view = new EM.View2D(cv, { xmin: -11, xmax: 11, ymin: -6.5, ymax: 6.5 });
    let t = 3.2;
    const TMAX = 14;
    sim.animate((dt) => { t += dt * sim.p.spd; if (t > TMAX) t = 0; });
    sim.onDraw(() => {
      const p = sim.p, v = p.v, Dt = p.dt, g = 1 / Math.sqrt(1 - v * v);
      view.update();
      EM.draw.clear(cv);
      const ctx = cv.ctx;
      const X = (x) => view.X(x), Y = (y) => view.Y(y), S = view.s;
      const r1 = t, xs = (-v * Dt) / 2, r2 = t + Dt, xv = v * t + (v * Dt) / 2;
      /* cáscara del pulso */
      ctx.save();
      ctx.fillStyle = EM.alpha('--gold', 0.14);
      ctx.beginPath(); ctx.arc(X(xs), Y(0), r2 * S, 0, TAU); ctx.arc(X(0), Y(0), r1 * S, 0, TAU, true); ctx.fill('evenodd');
      ctx.strokeStyle = EM.alpha('--gold', 0.8); ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(X(0), Y(0), r1 * S, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(X(xs), Y(0), r2 * S, 0, TAU); ctx.stroke();
      ctx.restore();
      /* líneas de campo */
      const far = 40;
      ctx.save();
      ctx.strokeStyle = EM.col('--fline'); ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
      for (let i = 0; i < p.N; i++) {
        const th = (TAU * (i + 0.5)) / p.N, ci = Math.cos(th), si = Math.sin(th);
        /* dirección exterior: tan θ = γ tan θ' (contracción de Heaviside) */
        let ux = ci, uy = g * si; const un = Math.hypot(ux, uy); ux /= un; uy /= un;
        const wx = xv - xs, wu = wx * ux;
        const s = -wu + Math.sqrt(wu * wu - wx * wx + r2 * r2);
        const P2 = [xv + s * ux, s * uy], P1 = [r1 * ci, r1 * si], r0 = 0.28;
        ctx.beginPath();
        if (r1 > r0) { ctx.moveTo(X(r0 * ci), Y(r0 * si)); ctx.lineTo(X(P1[0]), Y(P1[1])); }
        else ctx.moveTo(X(r0 * ci), Y(r0 * si));
        ctx.lineTo(X(P2[0]), Y(P2[1]));
        ctx.lineTo(X(xv + far * ux), Y(far * uy));
        ctx.stroke();
      }
      ctx.restore();
      /* posición virtual y carga */
      if (p.ghost && xv < view.x1 + 0.5) {
        ctx.save(); ctx.strokeStyle = EM.col('--pos'); ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(X(xv), Y(0), 0.28 * S, 0, TAU); ctx.stroke(); ctx.restore();
        if (xv > 2.5) EM.text(ctx, 'posición si no hubiera frenado', X(xv), Y(0) + 0.28 * S + 16, { size: 11, align: 'center', color: '--ink-2', halo: true });
      }
      EM.draw.charge(ctx, X(0), Y(0), 1, { r: 0.28 * S });
      ctx.save(); ctx.fillStyle = EM.col('--canvas'); ctx.font = `700 ${Math.round(0.36 * S)}px ${EM.FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+', X(0), Y(0) + 1); ctx.restore();
      if ((r1 + r2) / 2 < 5.8) EM.text(ctx, 'pulso de radiación', X(0), Y(-(r1 + r2) / 2) + 4, { size: 11.5, align: 'center', color: '--gold', halo: true, weight: 600 });
      else EM.text(ctx, 'pulso de radiación', X(0) + 6, Y(5.9), { size: 11.5, align: 'left', color: '--gold', halo: true, weight: 600 });
      EM.draw.arrow(ctx, X(-10.4), Y(-5.8), X(-8.6), Y(-5.8), { color: '--ink-2', width: 1.6, head: 8 });
      EM.text(ctx, 'v inicial', X(-8.4), Y(-5.8) + 4, { size: 11, color: '--ink-2' });
      sim.set('t', EM.fix(t, 2) + ' u');
      sim.set('g', f3(g));
      sim.set('a', f3(v / Dt) + ' c/u');
      sim.set('ratio', EM.fix((v * Math.max(t, 0)) / Dt, 2));
    });
  });

  /* ======================================================================
     23.2 Líneas de campo del dipolo oscilante
     ====================================================================== */
  EM.defineSim('dipole-radiation', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    sim.slider('spd', { label: 'Velocidad de la animación', min: 0.2, max: 2, step: 0.1, value: 0.8, fmt: (v) => EM.fix(v, 1) + '×' });
    sim.slider('dens', { label: 'Densidad de líneas', min: 3, max: 9, step: 1, value: 6, fmt: (v) => v.toFixed(0) });
    sim.slider('ext', { label: 'Tamaño de la región (en <i>λ</i>)', min: 1, max: 4, step: 0.5, value: 2, fmt: (v) => '±' + EM.fix(v, 1) });
    sim.check('H', { label: 'Mostrar <i>H</i><sub>φ</sub> (rojo: sale de la pantalla)', value: false });
    sim.check('zones', { label: 'Marcar <i>r</i> = <i>λ</i>/2π y <i>r</i> = <i>λ</i>', value: true });
    sim.out('ph', 'Fase <i>ωt</i>');
    sim.out('p', 'Momento dipolar <i>p</i>/<i>p</i><sub>0</sub> = cos <i>ωt</i>');
    sim.note('Las líneas son curvas de nivel de <i>Q</i> = sen²<i>θ</i> [cos(<i>ωt</i> − <i>kr</i>)/<i>kr</i> − sen(<i>ωt</i> − <i>kr</i>)]; el dipolo está en el origen, orientado según el eje vertical <i>z</i>.');
    const view = new EM.View2D(cv, {});
    let ph = 0.3;
    sim.animate((dt) => { ph = (ph + dt * sim.p.spd * 1.6) % TAU; });
    sim.onDraw(() => {
      const p = sim.p, E = p.ext;
      view.setRange({ xmin: -E, xmax: E, ymin: -E / 1.45, ymax: E / 1.45 });
      EM.draw.clear(cv);
      const ctx = cv.ctx;
      const Q = (x, z) => {
        const r = Math.hypot(x, z);
        if (r < 0.035) return NaN;
        const u = TAU * r, s2 = (x * x) / (r * r);
        return s2 * (Math.cos(ph - u) / u - Math.sin(ph - u));
      };
      if (p.H) {
        EM.field.heat(view, (x, z) => {
          const r = Math.hypot(x, z);
          if (r < 0.035) return NaN;
          const u = TAU * r, s = Math.abs(x) / r;
          return Math.sign(x) * s * (Math.cos(ph - u) / u - Math.sin(ph - u));
        }, (v) => EM.cmap.diverging(M.clamp(v * 0.75, -1, 1)), { res: 4, alpha: 0.5 });
      }
      const n = p.dens, lv = [];
      for (let k = 1; k <= n; k++) { const L = 0.12 + (0.95 * (k - 1)) / (n - 1); lv.push(L, -L); }
      for (let k = 1; k <= 4; k++) { const L = 1.07 * Math.pow(1.6, k); lv.push(L, -L); }
      EM.field.contours(view, Q, lv, { color: '--fline', width: 1.5, res: 3, alpha: 0.95 });
      /* zonas */
      if (p.zones) {
        ctx.save(); ctx.setLineDash([4, 5]); ctx.lineWidth = 1.2;
        ctx.strokeStyle = EM.alpha('--accent', 0.8);
        ctx.beginPath(); ctx.arc(view.X(0), view.Y(0), (view.s * 1) / TAU, 0, TAU); ctx.stroke();
        ctx.strokeStyle = EM.alpha('--ink-3', 0.8);
        ctx.beginPath(); ctx.arc(view.X(0), view.Y(0), view.s, 0, TAU); ctx.stroke();
        ctx.restore();
        EM.text(ctx, 'λ/2π', view.X(0.12), view.Y(0.16) - 2, { size: 10.5, color: '--accent', halo: true });
        EM.text(ctx, 'r = λ', view.X(0.72), view.Y(0.72) - 4, { size: 10.5, color: '--ink-2', halo: true });
      }
      /* dipolo */
      const pc = Math.cos(ph), hl = 0.07 * view.s;
      ctx.save(); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(view.X(0), view.Y(0) - hl); ctx.lineTo(view.X(0), view.Y(0) + hl); ctx.stroke(); ctx.restore();
      const rq = Math.max(3, 5 * Math.abs(pc));
      if (Math.abs(pc) > 0.05) {
        ctx.save();
        ctx.fillStyle = EM.col(pc > 0 ? '--pos' : '--neg'); ctx.beginPath(); ctx.arc(view.X(0), view.Y(0) - hl, rq, 0, TAU); ctx.fill();
        ctx.fillStyle = EM.col(pc > 0 ? '--neg' : '--pos'); ctx.beginPath(); ctx.arc(view.X(0), view.Y(0) + hl, rq, 0, TAU); ctx.fill();
        ctx.restore();
      }
      EM.text(ctx, 'z', view.X(0) + 8, view.Y(E / 1.45) + 16, { size: 13, italic: true, family: EM.FONT_MATH, color: '--ink-2' });
      /* escala */
      const x0 = view.X(-E) + 16, y0 = cv.h - 16;
      ctx.save(); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + view.s * 0.5, y0); ctx.moveTo(x0, y0 - 4); ctx.lineTo(x0, y0 + 4); ctx.moveTo(x0 + view.s * 0.5, y0 - 4); ctx.lineTo(x0 + view.s * 0.5, y0 + 4); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'λ/2', x0 + view.s * 0.25, y0 - 8, { size: 11, align: 'center', color: '--ink', halo: true });
      sim.set('ph', EM.fix(deg(ph), 0) + '°');
      sim.set('p', EM.fix(pc, 2));
    });
  });

  /* ======================================================================
     23.3 Diagrama de radiación de un dipolo de longitud L
     ====================================================================== */
  EM.defineSim('antenna-pattern', function (sim) {
    sim.cols2();
    const cp = sim.canvas({ aspect: 1 });
    const c3 = sim.canvas({ aspect: 1 });
    const ci = sim.canvas({ aspect: 3.8, cls: 'full fixed' });
    sim.slider('L', { label: 'Longitud total <i>L</i>/<i>λ</i>', min: 0.02, max: 3, step: 0.01, value: 0.5, fmt: f2 });
    const setL = (v) => () => sim.ctl.L.set(v);
    sim.button('Corto (0.05λ)', setL(0.05), { newRow: true });
    sim.button('λ/2', setL(0.5));
    sim.button('λ', setL(1));
    sim.button('1.25λ', setL(1.25));
    sim.button('3λ/2', setL(1.5));
    sim.button('2λ', setL(2));
    sim.seg('sc', { label: 'Escala del diagrama', options: [['E', 'Campo |E|'], ['P', 'Potencia'], ['dB', 'dB']], value: 'P' });
    sim.out('D', 'Directividad <i>D</i>', { hl: true });
    sim.out('Rr', 'Resistencia de radiación (referida a <i>I</i><sub>m</sub>)');
    sim.out('Rin', 'Resistencia en el punto de alimentación');
    sim.out('bw', 'Ancho de haz a media potencia');
    sim.out('max', 'Dirección de máxima radiación');
    const v3 = new EM.View3D(sim, c3, { radius: 1.75, az: rad(35), el: rad(18) });
    const Fth = (th, kL2) => { const s = Math.sin(th); if (Math.abs(s) < 1e-6) return 0; return (Math.cos(kL2 * Math.cos(th)) - Math.cos(kL2)) / s; };
    let cache = null;
    function analyse(L) {
      if (cache && cache.L === L) return cache;
      const kL2 = Math.PI * L, N = 1440;
      const U = new Float64Array(N + 1);
      let Umax = 0, imax = 0;
      for (let i = 0; i <= N; i++) { const th = (Math.PI * i) / N; U[i] = Fth(th, kL2) ** 2; if (U[i] > Umax * (1 + 1e-9)) { Umax = U[i]; imax = i; } }
      /* máximo en el hemisferio superior (0 ≤ θ ≤ 90°) */
      let ih = 0; for (let i = 0; i <= N / 2; i++) if (U[i] > U[ih]) ih = i;
      const I = M.simpson((th) => Fth(th, kL2) ** 2 * Math.sin(th), 0, Math.PI, 2000);
      let i1 = ih, i2 = ih;
      while (i1 > 0 && U[i1] >= 0.5 * U[ih]) i1--;
      while (i2 < N && U[i2] >= 0.5 * U[ih]) i2++;
      const bw = (180 * (i2 - i1)) / N;
      cache = { L, kL2, Umax, thMax: (Math.PI * ih) / N, I, D: (2 * Umax) / I, Rr: 60 * I, bw, Fmax: Math.sqrt(Umax) };
      return cache;
    }
    sim.onDraw(() => {
      const p = sim.p, A = analyse(p.L);
      const val = (th) => { const u = Fth(th, A.kL2) ** 2 / A.Umax; return p.sc === 'E' ? Math.sqrt(u) : u; };
      /* ---------- diagrama polar (plano E) ---------- */
      EM.draw.clear(cp);
      const R = Math.min(cp.w, cp.h) * 0.36;
      const pol = new EM.Polar(cp.ctx, { cx: cp.w / 2, cy: cp.h / 2 + 8, R, zero: 'top', db: p.sc === 'dB', dbMin: -30, axisNames: [[0, 'z']] });
      pol.frame();
      pol.curve((th) => (p.sc === 'dB' ? Fth(th, A.kL2) ** 2 / A.Umax : val(th)), { color: '--c1', width: 2.4, n: 1440 });
      /* antena en el centro */
      const ctx = cp.ctx, hl = Math.min(R * 0.9, R * 0.3 * p.L + 6);
      ctx.save(); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cp.w / 2, cp.h / 2 + 8 - hl); ctx.lineTo(cp.w / 2, cp.h / 2 + 8 - 3); ctx.moveTo(cp.w / 2, cp.h / 2 + 8 + 3); ctx.lineTo(cp.w / 2, cp.h / 2 + 8 + hl); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'Plano E (corte que contiene la antena)', 12, 20, { size: 12, weight: 600, color: '--ink' });
      EM.text(ctx, p.sc === 'dB' ? 'potencia relativa (dB)' : p.sc === 'P' ? 'potencia relativa' : 'campo relativo', 12, 36, { size: 11, color: '--ink-2' });
      /* ---------- diagrama tridimensional ---------- */
      v3.begin();
      const rr = (th) => (p.sc === 'dB' ? Math.max(0, (10 * Math.log10(Math.max(1e-6, Fth(th, A.kL2) ** 2 / A.Umax)) + 30) / 30) : val(th));
      v3.mesh((th, phi) => { const r = rr(th); return [r * Math.sin(th) * Math.cos(phi), r * Math.sin(th) * Math.sin(phi), r * Math.cos(th)]; }, 0, Math.PI, 36, 0, TAU, 40, {
        fillFn: (th) => { const q = Math.round(M.clamp(rr(th), 0, 1) * 16) / 16; return EM.rgbStr(EM.cmap.viridis(0.15 + 0.85 * q)); }, alpha: 0.88, wire: '--ink-3', wireAlpha: 0.25, wireEveryU: 4, wireEveryV: 5
      });
      v3.line([0, 0, -1.15], [0, 0, 1.15], { color: '--accent', width: 3, seg: 10 });
      v3.text([0.08, 0, 1.2], 'z', { size: 14, italic: true, family: EM.FONT_MATH, color: '--ink' });
      v3.render();
      EM.text(c3.ctx, 'Diagrama en 3D (arrastre para girar)', 12, 20, { size: 12, weight: 600, color: '--ink' });
      /* ---------- corriente a lo largo de la antena ---------- */
      EM.draw.clear(ci);
      const half = p.L / 2;
      const pl = new EM.Plot(ci.ctx, { x: 0, y: 0, w: ci.w, h: ci.h, xmin: -Math.max(half, 0.25), xmax: Math.max(half, 0.25), ymin: -1.15, ymax: 1.15, xlabel: 'posición z/λ a lo largo de la antena', ylabel: 'I(z)/I_{m}', title: 'Onda estacionaria de corriente I(z) = I_{m} sen[k(L/2 − |z|)]', yticks: [-1, 0, 1], mt: 24 });
      pl.frame();
      pl.fn((z) => (Math.abs(z) <= half ? Math.sin(TAU * (half - Math.abs(z))) : NaN), { color: '--cur', width: 2.6, fill: '--cur', fillAlpha: 0.18, n: 800 });
      pl.dot(0, Math.sin(TAU * half), { color: '--accent', label: 'alimentación', dy: Math.sin(TAU * half) > 0.5 ? 18 : -10 });
      /* ---------- lecturas ---------- */
      sim.set('D', f3(A.D) + ' = ' + EM.fix(10 * Math.log10(A.D), 2) + ' dBi');
      sim.set('Rr', EM.fix(A.Rr, A.Rr < 1 ? 4 : 1) + ' Ω');
      const s2 = Math.sin(A.kL2) ** 2;
      sim.set('Rin', s2 < 0.01 ? 'muy grande (corriente nula en el centro)' : EM.fix(A.Rr / s2, A.Rr / s2 < 1 ? 4 : 1) + ' Ω');
      sim.set('bw', A.bw >= 179.9 ? '—' : EM.fix(A.bw, 1) + '°');
      sim.set('max', 'θ = ' + EM.fix(deg(A.thMax), 1) + '°' + (Math.abs(deg(A.thMax) - 90) > 0.5 ? ' y ' + EM.fix(180 - deg(A.thMax), 1) + '°' : ''));
    });
  });

  /* ======================================================================
     23.4 Arreglo de antenas
     ====================================================================== */
  EM.defineSim('array-factor', function (sim) {
    sim.cols2();
    const cw = sim.canvas({ aspect: 1 });
    const cp = sim.canvas({ aspect: 1 });
    const cl = sim.canvas({ aspect: 3.4, cls: 'full fixed' });
    sim.group('Arreglo');
    sim.slider('N', { label: 'Número de elementos <i>N</i>', min: 1, max: 16, step: 1, value: 6, fmt: (v) => v.toFixed(0) });
    sim.slider('d', { label: 'Separación <i>d</i>/<i>λ</i>', min: 0.1, max: 2, step: 0.01, value: 0.5, fmt: f2 });
    sim.slider('th0', { label: 'Dirección del haz (desde la normal al arreglo)', min: -90, max: 90, step: 1, value: 0, unit: '°', fmt: (v) => EM.minus(v.toFixed(0)) });
    sim.button('Transversal', () => sim.ctl.th0.set(0), { newRow: true });
    sim.button('Longitudinal', () => sim.ctl.th0.set(90));
    sim.button('d = λ/2', () => sim.ctl.d.set(0.5));
    sim.button('d = 1.2λ', () => sim.ctl.d.set(1.2));
    sim.group('Visualización');
    sim.seg('sc', { label: 'Escala del diagrama', options: [['E', 'Campo'], ['dB', 'dB']], value: 'dB' });
    sim.slider('spd', { label: 'Velocidad de la animación', min: 0, max: 2, step: 0.1, value: 1, fmt: (v) => EM.fix(v, 1) + '×' });
    sim.out('a', 'Desfase progresivo <i>α</i>', { hl: true });
    sim.out('bw', 'Ancho de haz a media potencia');
    sim.out('D', 'Directividad (elementos isótropos)');
    sim.out('gl', 'Lóbulos de difracción');
    sim.out('sl', 'Primer lóbulo secundario');
    let ph = 0, key = '', FR = null, FI = null, NG = 0, Wreg = 0;
    sim.animate((dt) => { ph = (ph + dt * 3 * sim.p.spd) % TAU; });
    const alphaOf = (p) => -TAU * p.d * Math.sin(rad(p.th0));
    const AFn = (gam, p, a) => {
      const psi = TAU * p.d * Math.cos(gam) + a;
      const s = Math.sin(psi / 2);
      if (Math.abs(s) < 1e-9) return 1;
      return Math.abs(Math.sin((p.N * psi) / 2) / (p.N * s));
    };
    function field(p, a) {
      const k = p.N + '|' + p.d + '|' + a + '|' + cw.w;
      if (k === key) return;
      key = k;
      const len = (p.N - 1) * p.d;
      Wreg = Math.max(8, len + 5);
      NG = Math.round(Math.min(cw.w, 360) / 3.2);
      FR = new Float32Array(NG * NG); FI = new Float32Array(NG * NG);
      const x0 = -((p.N - 1) * p.d) / 2;
      for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) {
        const x = -Wreg / 2 + (Wreg * (i + 0.5)) / NG, y = Wreg / 2 - (Wreg * (j + 0.5)) / NG;
        let re = 0, im = 0;
        for (let n = 0; n < p.N; n++) {
          const dx = x - (x0 + n * p.d), r = Math.max(0.08, Math.hypot(dx, y));
          const phs = n * a - TAU * r, amp = 1 / Math.sqrt(r);
          re += amp * Math.cos(phs); im += amp * Math.sin(phs);
        }
        const rc = Math.max(0.5, Math.hypot(x, y)), g = Math.sqrt(rc) / p.N;
        FR[j * NG + i] = re * g; FI[j * NG + i] = im * g;
      }
    }
    let off = null;
    sim.onDraw(() => {
      const p = sim.p, a = alphaOf(p);
      field(p, a);
      /* ---------- campo instantáneo ---------- */
      EM.draw.clear(cw);
      if (!off || off.width !== NG) { off = document.createElement('canvas'); off.width = NG; off.height = NG; }
      const oc = off.getContext('2d'), img = oc.createImageData(NG, NG), dd = img.data;
      const c = Math.cos(ph), s = Math.sin(ph);
      for (let q = 0; q < NG * NG; q++) {
        const v = FR[q] * c - FI[q] * s, col = EM.cmap.diverging(M.clamp(v * 0.9, -1, 1));
        dd[4 * q] = col[0]; dd[4 * q + 1] = col[1]; dd[4 * q + 2] = col[2]; dd[4 * q + 3] = 255;
      }
      oc.putImageData(img, 0, 0);
      const ctx = cw.ctx, side = Math.min(cw.w, cw.h), ox = (cw.w - side) / 2, oy = (cw.h - side) / 2, sc = side / Wreg;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, ox, oy, side, side);
      const PX = (x) => ox + side / 2 + x * sc, PY = (y) => oy + side / 2 - y * sc;
      const x0 = -((p.N - 1) * p.d) / 2;
      /* dirección del haz principal */
      const g0 = Math.PI / 2 - rad(p.th0);
      ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(PX(0), PY(0)); ctx.lineTo(PX(Wreg * 0.47 * Math.cos(g0)), PY(Wreg * 0.47 * Math.sin(g0))); ctx.stroke(); ctx.restore();
      for (let n = 0; n < p.N; n++) {
        const phn = posmod(n * a, TAU), col = EM.cmap.viridis(phn / TAU);
        ctx.save(); ctx.fillStyle = EM.rgbStr(col); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(PX(x0 + n * p.d), PY(0), 4.5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      EM.text(ctx, 'Campo instantáneo (color de cada antena: su fase)', 10, 18, { size: 11.5, weight: 600, color: '--ink', halo: true });
      const bar = sc * 1;
      ctx.save(); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, cw.h - 14); ctx.lineTo(12 + bar, cw.h - 14); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'λ', 12 + bar / 2, cw.h - 20, { size: 11, italic: true, align: 'center', color: '--ink', halo: true });
      /* ---------- diagrama polar ---------- */
      EM.draw.clear(cp);
      const pol = new EM.Polar(cp.ctx, { cx: cp.w / 2, cy: cp.h / 2 + 6, R: Math.min(cp.w, cp.h) * 0.36, zero: 'right', db: p.sc === 'dB', dbMin: -30, });
      pol.frame();
      pol.curve((phi) => { const v = AFn(phi, p, a); return p.sc === 'dB' ? v * v : v; }, { color: '--c1', width: 2.4, n: 1440, symmetric: false });
      const pc = cp.ctx, R = Math.min(cp.w, cp.h) * 0.36;
      pc.save(); pc.strokeStyle = EM.col('--ink-2'); pc.lineWidth = 2;
      pc.beginPath(); pc.moveTo(cp.w / 2 - R * 0.35, cp.h / 2 + 6); pc.lineTo(cp.w / 2 + R * 0.35, cp.h / 2 + 6); pc.stroke(); pc.restore();
      EM.text(pc, 'eje del arreglo', cp.w / 2, cp.h / 2 + 6 + 16, { size: 10.5, align: 'center', color: '--ink-2', halo: true });
      EM.text(pc, '|AF| en el plano del arreglo', 10, 18, { size: 11.5, weight: 600, color: '--ink' });
      /* ---------- AF(γ) en dB ---------- */
      EM.draw.clear(cl);
      const pl = new EM.Plot(cl.ctx, { x: 0, y: 0, w: cl.w, h: cl.h, xmin: 0, xmax: 180, ymin: -40, ymax: 2, xticks: [0, 30, 60, 90, 120, 150, 180], yticks: [-40, -30, -20, -10, 0], xlabel: 'ángulo γ desde el eje del arreglo (°)', ylabel: 'dB', mt: 10 });
      pl.frame();
      pl.hline(-3, { color: '--ink-3', dash: [3, 3], label: '−3 dB', labelRight: true });
      if (p.N > 2) pl.hline(-13.26, { color: '--ink-3', dash: [2, 4], label: '−13.3 dB (uniforme, N grande)', labelRight: true });
      pl.fn((gd) => 20 * Math.log10(Math.max(1e-3, AFn(rad(gd), p, a))), { color: '--c1', width: 2.2, n: 1800 });
      pl.vline(deg(g0), { color: '--accent', label: 'haz' });
      /* ---------- análisis ---------- */
      const N = 3600, U = new Float64Array(N + 1);
      let im = 0;
      for (let i = 0; i <= N; i++) { U[i] = AFn((Math.PI * i) / N, p, a) ** 2; if (U[i] > U[im]) im = i; }
      const i0 = Math.round((N * deg(g0)) / 180);
      let il = i0, ir = i0;
      const ref = U[i0];
      while (il > 0 && U[il] >= 0.5 * ref) il--;
      while (ir < N && U[ir] >= 0.5 * ref) ir++;
      let bw = (180 * (ir - il)) / N;
      if (i0 === 0 || i0 === N) bw *= 2;
      const I = M.simpson((g) => AFn(g, p, a) ** 2 * Math.sin(g), 0, Math.PI, 3000);
      sim.set('a', EM.fix(deg(a), 1) + '°');
      sim.set('bw', p.N === 1 ? '— (isótropo)' : EM.fix(bw, 1) + '°');
      sim.set('D', f3((2 * U[im]) / I) + ' = ' + EM.fix(10 * Math.log10((2 * U[im]) / I), 2) + ' dBi');
      const kd = TAU * p.d, gl = [];
      [-1, 1].forEach((m) => { const cg = (TAU * m - a) / kd; if (Math.abs(cg) <= 1) gl.push(EM.fix(deg(Math.acos(cg)), 1) + '°'); });
      sim.set('gl', p.N === 1 ? '—' : gl.length ? 'sí, en γ = ' + gl.join(' y ') : 'no');
      /* primer lóbulo secundario: mayor máximo local fuera del haz */
      let sl = 0;
      for (let i = 1; i < N; i++) if (U[i] > U[i - 1] && U[i] >= U[i + 1] && (i < il || i > ir) && U[i] < 0.98 * ref) sl = Math.max(sl, U[i]);
      sim.set('sl', sl > 0 ? EM.fix(10 * Math.log10(sl / ref), 1) + ' dB' : '—');
    });
  });
})();
